const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Calculate TDEE
const calculateTDEE = (age, weight, height, gender, activityLevel) => {
  // Mifflin-St Jeor formula for BMR
  let bmr;
  if (gender === 'male') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }

  // Activity multipliers
  const activityMultipliers = {
    'sedentary': 1.2,
    'lightly-active': 1.375,
    'moderately-active': 1.55,
    'very-active': 1.725,
    'extra-active': 1.9
  };

  const tdee = bmr * (activityMultipliers[activityLevel] || 1.55);
  return { bmr: Math.round(bmr), tdee: Math.round(tdee) };
};

// Create user
router.post('/', async (req, res) => {
  try {
    const { name, age, weight, height, gender, activityLevel } = req.body;

    const { bmr, tdee } = calculateTDEE(age, weight, height, gender, activityLevel);

    // Protein target: 1.6-2.2g per kg of body weight
    const proteinTarget = Math.round(weight * 1.8);

    const user = new User({
      name,
      age,
      weight,
      height,
      gender,
      activityLevel,
      bmr,
      tdee,
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

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { age, weight, height, gender, activityLevel } = req.body;
    
    let updateData = {
      age: age || undefined,
      weight: weight || undefined,
      height: height || undefined,
      gender: gender || undefined,
      activityLevel: activityLevel || undefined,
      updatedAt: new Date()
    };

    // Recalculate TDEE if personal data changes
    if (age || weight || height || gender || activityLevel) {
      const user = await User.findById(req.params.id);
      const { bmr, tdee } = calculateTDEE(
        age || user.age,
        weight || user.weight,
        height || user.height,
        gender || user.gender,
        activityLevel || user.activityLevel
      );
      updateData.bmr = bmr;
      updateData.tdee = tdee;
      updateData.calorieTarget = tdee;
      updateData.proteinTarget = Math.round((weight || user.weight) * 1.8);
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
