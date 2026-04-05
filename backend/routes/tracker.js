const express = require('express');
const router = express.Router();
const DailyTracker = require('../models/DailyTracker');

// Get tracker for a specific date
router.get('/:userId', async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    date.setHours(0, 0, 0, 0);

    let tracker = await DailyTracker.findOne({ userId: req.params.userId, date });
    if (!tracker) {
      tracker = { ateFruit: false, ateVegetable: false };
    }

    res.json(tracker);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle fruit or vegetable manually
router.put('/:userId', async (req, res) => {
  try {
    const { ateFruit, ateVegetable, date: dateStr } = req.body;
    const date = dateStr ? new Date(dateStr) : new Date();
    date.setHours(0, 0, 0, 0);

    const update = {};
    if (ateFruit !== undefined) update.ateFruit = ateFruit;
    if (ateVegetable !== undefined) update.ateVegetable = ateVegetable;

    const tracker = await DailyTracker.findOneAndUpdate(
      { userId: req.params.userId, date },
      { $set: update },
      { upsert: true, new: true }
    );

    res.json(tracker);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
