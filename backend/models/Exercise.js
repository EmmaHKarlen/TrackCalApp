const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  duration: { type: Number, required: true }, // in minutes
  caloriesBurned: { type: Number, required: true },
  intensity: { type: String, enum: ['low', 'moderate', 'high'], default: 'moderate' },
  createdAt: { type: Date, default: Date.now },
  date: { type: Date, default: () => new Date().setHours(0, 0, 0, 0) }
});

module.exports = mongoose.model('Exercise', exerciseSchema);
