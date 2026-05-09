const Bull = require('bull');
const waCampaignService = require('../services/waCampaignService');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const waCampaignQueue = new Bull('wa-campaigns', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
});

waCampaignQueue.process(async (job) => {
  const { campaignId } = job.data;
  console.log(`[WA Queue] Processing campaign: ${campaignId}`);
  await waCampaignService.executeCampaign(campaignId);
  console.log(`[WA Queue] Completed campaign: ${campaignId}`);
});

waCampaignQueue.on('failed', (job, err) => {
  console.error(`[WA Queue] Job ${job.id} failed for campaign ${job.data.campaignId}:`, err.message);
});

waCampaignQueue.on('completed', (job) => {
  console.log(`[WA Queue] Job ${job.id} completed for campaign ${job.data.campaignId}`);
});

const addCampaignJob = async (campaignId, scheduledAt) => {
  const jobOptions = {};

  if (scheduledAt) {
    const delayMs = new Date(scheduledAt).getTime() - Date.now();
    if (delayMs > 0) {
      jobOptions.delay = delayMs;
    }
  }

  const job = await waCampaignQueue.add({ campaignId }, jobOptions);
  console.log(`[WA Queue] Added job ${job.id} for campaign ${campaignId}${scheduledAt ? ` (delayed ${jobOptions.delay}ms)` : ''}`);
  return job;
};

module.exports = {
  waCampaignQueue,
  addCampaignJob
};
