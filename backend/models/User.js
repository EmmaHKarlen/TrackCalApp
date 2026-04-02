const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  weight: { type: Number, required: true }, // in kg
  height: { type: Number, required: true }, // in cm
  gender: { type: String, enum: ['male', 'female'], required: true },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'lightly-active', 'moderately-active', 'very-active', 'extra-active'],
    required: true
  },
  proteinTarget: { type: Number }, // in grams per day
  calorieTarget: { type: Number }, // TDEE
  tdee: { type: Number }, // Total Daily Energy Expenditure
  bmr: { type: Number }, // Basal Metabolic Rate
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
