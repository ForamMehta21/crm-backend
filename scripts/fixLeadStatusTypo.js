/**
 * One-time fix: renames the misspelled lead status 'booed someware else'
 * to 'booked somewhere else' on existing leads.
 *
 * Usage (from backend/):  node scripts/fixLeadStatusTypo.js
 * Safe to run more than once.
 */
const mongoose = require('mongoose');
const connectDB = require('../config/db');

(async () => {
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    console.error('Not connected to MongoDB. Check MONGODB_URI.');
    process.exit(1);
  }
  const result = await mongoose.connection.collection('leads').updateMany(
    { leadStatus: 'booed someware else' },
    { $set: { leadStatus: 'booked somewhere else' } },
  );
  console.log(`Updated ${result.modifiedCount} lead(s).`);
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
