require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Meal = require('../models/Meal');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const result = await Meal.deleteMany({ date: { $gte: today, $lt: tomorrow } });
  console.log(`Deleted ${result.deletedCount} meal(s) from today`);

  await mongoose.disconnect();
}

run().catch(console.error);
