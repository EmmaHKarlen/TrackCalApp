const express = require('express');
const router = express.Router();
const Meal = require('../models/Meal');

// Add meal
router.post('/', async (req, res) => {
  try {
    const { userId, name, calories, protein, carbs, fats, quantity, unit, date } = req.body;

    const mealDate = date ? new Date(date) : new Date();
    mealDate.setHours(0, 0, 0, 0);

    const meal = new Meal({
      userId,
      name,
      calories,
      protein,
      carbs,
      fats,
      quantity,
      unit,
      date: mealDate
    });

    await meal.save();
    res.json(meal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get meals for today (or a specific date via ?date=YYYY-MM-DD)
router.get('/today/:userId', async (req, res) => {
  try {
    const today = req.query.date ? new Date(req.query.date) : new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const meals = await Meal.find({
      userId: req.params.userId,
      date: { $gte: today, $lt: tomorrow }
    });

    const totals = {
      calories: meals.reduce((sum, m) => sum + m.calories, 0),
      protein: meals.reduce((sum, m) => sum + m.protein, 0),
      carbs: meals.reduce((sum, m) => sum + (m.carbs || 0), 0),
      fats: meals.reduce((sum, m) => sum + (m.fats || 0), 0)
    };

    res.json({ meals, totals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get meals by date range
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

    const meals = await Meal.find(query).sort({ createdAt: -1 });
    res.json(meals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete meal
router.delete('/:mealId', async (req, res) => {
  try {
    await Meal.findByIdAndDelete(req.params.mealId);
    res.json({ message: 'Meal deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
