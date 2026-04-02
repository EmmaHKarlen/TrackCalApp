const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const Meal = require('../models/Meal');

// Use local date string (YYYY-MM-DD) — matches what the browser date picker sends
const toLocalDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Build a minimal express app with just the meals route
const app = express();
app.use(express.json());
app.use('/api/meals', require('../routes/meals'));

// Dummy userId for all tests
const userId = new mongoose.Types.ObjectId();

describe('Meals API', () => {
  describe('GET /api/meals/today/:userId', () => {
    it('returns only meals from today by default', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      await Meal.create([
        { userId, name: 'Banana', calories: 89, protein: 1, carbs: 23, fats: 0, date: today },
        { userId, name: 'OldMeal', calories: 500, protein: 30, carbs: 50, fats: 20, date: yesterday }
      ]);

      const res = await request(app).get(`/api/meals/today/${userId}`);
      expect(res.status).toBe(200);
      expect(res.body.meals).toHaveLength(1);
      expect(res.body.meals[0].name).toBe('Banana');
    });

    it('returns meals for a specific past date when ?date= is provided', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const dateStr = toLocalDateStr(yesterday);

      await Meal.create({ userId, name: 'PastMeal', calories: 300, protein: 20, carbs: 30, fats: 10, date: yesterday });

      const res = await request(app).get(`/api/meals/today/${userId}?date=${dateStr}`);
      expect(res.status).toBe(200);
      expect(res.body.meals).toHaveLength(1);
      expect(res.body.meals[0].name).toBe('PastMeal');
    });

    it('does not return today meals when querying a past date', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = toLocalDateStr(yesterday);

      await Meal.create({ userId, name: 'TodayMeal', calories: 200, protein: 15, carbs: 20, fats: 5, date: today });

      const res = await request(app).get(`/api/meals/today/${userId}?date=${dateStr}`);
      expect(res.status).toBe(200);
      expect(res.body.meals).toHaveLength(0);
    });

    it('calculates correct totals', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await Meal.create([
        { userId, name: 'Meal A', calories: 300, protein: 20, carbs: 40, fats: 10, date: today },
        { userId, name: 'Meal B', calories: 200, protein: 15, carbs: 25, fats: 5, date: today }
      ]);

      const res = await request(app).get(`/api/meals/today/${userId}`);
      expect(res.body.totals.calories).toBe(500);
      expect(res.body.totals.protein).toBe(35);
    });
  });

  describe('POST /api/meals', () => {
    it('saves a meal to today by default', async () => {
      const res = await request(app).post('/api/meals').send({
        userId, name: 'Egg', calories: 78, protein: 6, carbs: 1, fats: 5, quantity: 1, unit: 'serving'
      });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Egg');

      const saved = await Meal.findById(res.body._id);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expect(saved.date.getTime()).toBe(today.getTime());
    });

    it('saves a meal to a specific past date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const dateStr = toLocalDateStr(yesterday);

      const res = await request(app).post('/api/meals').send({
        userId, name: 'PastEgg', calories: 78, protein: 6, carbs: 1, fats: 5, quantity: 1, unit: 'serving', date: dateStr
      });
      expect(res.status).toBe(200);

      const saved = await Meal.findById(res.body._id);
      expect(saved.date.getTime()).toBe(yesterday.getTime());
    });
  });
});
