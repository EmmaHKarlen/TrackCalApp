const express = require('express');
const router = express.Router();
const Exercise = require('../models/Exercise');

// Add exercise
router.post('/', async (req, res) => {
  try {
    const { userId, name, duration, caloriesBurned, intensity } = req.body;

    const exercise = new Exercise({
      userId,
      name,
      duration,
      caloriesBurned,
      intensity,
      date: new Date().setHours(0, 0, 0, 0)
    });

    await exercise.save();
    res.json(exercise);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get exercises for today (or a specific date via ?date=YYYY-MM-DD)
router.get('/today/:userId', async (req, res) => {
  try {
    const today = req.query.date ? new Date(req.query.date) : new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const exercises = await Exercise.find({
      userId: req.params.userId,
      date: { $gte: today, $lt: tomorrow }
    });

    const totalCaloriesBurned = exercises.reduce((sum, ex) => sum + ex.caloriesBurned, 0);

    res.json({ exercises, totalCaloriesBurned });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get exercises by date range
router.get('/:userId', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { userId: req.params.userId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const exercises = await Exercise.find(query).sort({ createdAt: -1 });
    res.json(exercises);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete exercise
router.delete('/:exerciseId', async (req, res) => {
  try {
    await Exercise.findByIdAndDelete(req.params.exerciseId);
    res.json({ message: 'Exercise deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
