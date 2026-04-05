const mongoose = require('mongoose');

const dailyTrackerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  ateFruit: { type: Boolean, default: false },
  ateVegetable: { type: Boolean, default: false }
});

dailyTrackerSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyTracker', dailyTrackerSchema);
