const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  weight: { type: Number, required: true }, // in kg
  height: { type: Number, required: true }, // in cm
  gender: { type: String, enum: ['male', 'female'], required: true },

  dailySteps: { type: Number, default: 5000 }, // average steps per day

  // Detailed weekly exercise routine — sessions per week for each type
  exerciseRoutine: {
    running:          { type: Number, default: 0 },
    cycling:          { type: Number, default: 0 },
    swimming:         { type: Number, default: 0 },
    strengthTraining: { type: Number, default: 0 }, // intense gym, no rest, no cardio
    hiit:             { type: Number, default: 0 },
    yoga:             { type: Number, default: 0 },
    boxing:           { type: Number, default: 0 }
  },

  proteinTarget: { type: Number },  // grams/day
  calorieTarget: { type: Number },  // = tdee
  tdee:          { type: Number },  // Total Daily Energy Expenditure (fixed)
  bmr:           { type: Number },  // Basal Metabolic Rate

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
