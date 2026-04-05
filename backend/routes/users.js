const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Calories burned per typical session at 70kg body weight
const CAL_PER_SESSION_70KG = {
  running:          600,  // ~10 cal/min × 60 min
  cycling:          480,  // ~8 cal/min × 60 min
  swimming:         540,  // ~9 cal/min × 60 min
  strengthTraining: 450,  // ~7.5 cal/min × 60 min (intense, continuous)
  hiit:             500,  // ~11 cal/min × 45 min
  yoga:             180,  // ~3 cal/min × 60 min
  boxing:           600,  // ~10 cal/min × 60 min
};

// Net calories burned per step above the sedentary baseline already in BMR × 1.2.
// BMR × 1.2 assumes ~2,500 baseline steps. Net rate ≈ 0.025 cal/step for 70kg.
const NET_CAL_PER_STEP_70KG = 0.025;
const BASELINE_STEPS = 2500; // already included in the 1.2 multiplier

const calculateTDEE = (age, weight, height, gender, exerciseRoutine, dailySteps = 5000) => {
  // Mifflin-St Jeor BMR
  let bmr;
  if (gender === 'male') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }

  const weightFactor = weight / 70;

  // Extra steps beyond what's already in BMR × 1.2 baseline
  const extraSteps = Math.max(0, dailySteps - BASELINE_STEPS);
  const dailyStepCal = extraSteps * NET_CAL_PER_STEP_70KG * weightFactor;

  // Weekly calories from exercise sessions, spread daily
  const weeklyExerciseCal = Object.entries(exerciseRoutine || {}).reduce((sum, [type, sessions]) => {
    const calPerSession = CAL_PER_SESSION_70KG[type] || 0;
    return sum + (sessions * calPerSession * weightFactor);
  }, 0);

  // BMR × 1.2 = baseline sedentary TDEE (resting + digestion + ~2500 steps of minimal movement)
  const tdee = Math.round(bmr * 1.2 + dailyStepCal + weeklyExerciseCal / 7);

  return { bmr: Math.round(bmr), tdee };
};

// Create user
router.post('/', async (req, res) => {
  try {
    const { name, age, weight, height, gender, exerciseRoutine, dailySteps } = req.body;

    const { bmr, tdee } = calculateTDEE(age, weight, height, gender, exerciseRoutine, dailySteps);
    const proteinTarget = Math.round(weight * 1.8);

    const user = new User({
      name, age, weight, height, gender,
      exerciseRoutine,
      dailySteps: parseInt(dailySteps, 10) || 5000,
      bmr, tdee,
      calorieTarget: tdee,
      proteinTarget
    });

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile (recalculates TDEE)
router.put('/:id', async (req, res) => {
  try {
    const { age, weight, height, gender, exerciseRoutine, dailySteps } = req.body;
    const existing = await User.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'User not found' });

    const newAge     = age            ?? existing.age;
    const newWeight  = weight         ?? existing.weight;
    const newHeight  = height         ?? existing.height;
    const newGender  = gender         ?? existing.gender;
    const newRoutine = exerciseRoutine ?? existing.exerciseRoutine;
    const newSteps   = dailySteps != null ? parseInt(dailySteps, 10) : (existing.dailySteps ?? 5000);

    const { bmr, tdee } = calculateTDEE(newAge, newWeight, newHeight, newGender, newRoutine, newSteps);

    const user = await User.findByIdAndUpdate(req.params.id, {
      age: newAge, weight: newWeight, height: newHeight, gender: newGender,
      exerciseRoutine: newRoutine,
      dailySteps: newSteps,
      bmr, tdee, calorieTarget: tdee,
      proteinTarget: Math.round(newWeight * 1.8),
      updatedAt: new Date()
    }, { new: true });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
