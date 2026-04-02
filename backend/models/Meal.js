const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  calories: { type: Number, required: true },
  protein: { type: Number, required: true }, // in grams
  carbs: { type: Number },
  fats: { type: Number },
  quantity: { type: Number, default: 1 },
  unit: { type: String, default: 'serving' },
  createdAt: { type: Date, default: Date.now },
  date: { type: Date, default: () => new Date().setHours(0, 0, 0, 0) }
});

module.exports = mongoose.model('Meal', mealSchema);
