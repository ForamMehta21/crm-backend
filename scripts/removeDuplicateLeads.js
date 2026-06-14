/**
 * Migration script: Remove duplicate leads by phoneNumber.
 * Keeps the most recently created lead for each phone number and deletes the rest.
 *
 * Run once with:  node scripts/removeDuplicateLeads.js  (from backend/ directory)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Lead = require('../models/Lead');

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Find all phone numbers that appear more than once
  const duplicates = await Lead.aggregate([
    { $group: { _id: '$phoneNumber', count: { $sum: 1 }, ids: { $push: '$_id' }, dates: { $push: '$createdAt' } } },
    { $match: { count: { $gt: 1 } } }
  ]);

  console.log(`Found ${duplicates.length} duplicate phone number(s)`);

  let totalDeleted = 0;

  for (const group of duplicates) {
    // Fetch the full docs to sort by createdAt descending
    const leads = await Lead.find({ _id: { $in: group.ids } }).sort({ createdAt: -1 });

    // Keep the first (most recent), delete the rest
    const [keep, ...toDelete] = leads;
    const deleteIds = toDelete.map(l => l._id);

    await Lead.deleteMany({ _id: { $in: deleteIds } });

    console.log(
      `Phone ${group._id}: kept _id=${keep._id} (${keep.createdAt?.toISOString()}), deleted ${deleteIds.length} duplicate(s)`
    );
    totalDeleted += deleteIds.length;
  }

  console.log(`\nDone. Total duplicates removed: ${totalDeleted}`);
  await mongoose.disconnect();
};

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
