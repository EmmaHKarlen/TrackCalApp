const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const Meal = require('../models/Meal');

const toLocalDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Mock groq-sdk before requiring the chat route
jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }));
});

const Groq = require('groq-sdk');

// Build app with just the chat route
const app = express();
app.use(express.json());
app.use('/api/chat', require('../routes/chat'));

const userId = new mongoose.Types.ObjectId();

// Helper: set what Groq will return for the next call
function mockGroqResponse(foods, shouldSave = true, needsInfo = false, message = 'Logged!') {
  const groqInstance = Groq.mock.results[0].value;
  groqInstance.chat.completions.create.mockResolvedValueOnce({
    choices: [{
      message: {
        content: JSON.stringify({ message, foods, shouldSave, needsInfo })
      }
    }]
  });
}

describe('Chat route — meal saving logic', () => {
  describe('Bug: quantity multiplication', () => {
    it('multiplies calories by quantity before saving (2 sausages × 200cal = 400cal)', async () => {
      mockGroqResponse([{ name: 'sausage', calories: 200, protein: 10, carbs: 2, fats: 15, quantity: 2, unit: 'serving' }]);

      const res = await request(app).post('/api/chat').send({
        userId, messages: [{ role: 'user', content: 'I had 2 sausages' }]
      });

      expect(res.status).toBe(200);
      expect(res.body.shouldSave).toBe(true);

      const saved = await Meal.findOne({ userId, name: 'sausage' });
      expect(saved).not.toBeNull();
      expect(saved.calories).toBe(400); // 200 × 2
      expect(saved.protein).toBe(20);   // 10 × 2
    });

    it('saves correctly when quantity is 1 (no multiplication)', async () => {
      mockGroqResponse([{ name: 'banana', calories: 89, protein: 1, carbs: 23, fats: 0, quantity: 1, unit: 'serving' }]);

      await request(app).post('/api/chat').send({
        userId, messages: [{ role: 'user', content: 'I had a banana' }]
      });

      const saved = await Meal.findOne({ userId, name: 'banana' });
      expect(saved.calories).toBe(89);
    });
  });

  describe('Bug: fractional quantity (half pita)', () => {
    it('treats quantity < 1 as 1 — does not double-halve calories', async () => {
      // AI returned quantity=0.5 despite the prompt saying not to — guard must catch it
      mockGroqResponse([{ name: 'pita', calories: 55, protein: 3, carbs: 30, fats: 1, quantity: 0.5, unit: 'serving' }]);

      await request(app).post('/api/chat').send({
        userId, messages: [{ role: 'user', content: 'חצי פיתה' }]
      });

      const saved = await Meal.findOne({ userId, name: 'pita' });
      // qty guard sets qty=1, so 55×1=55 — NOT 55×0.5=27
      expect(saved.calories).toBe(55);
    });

    it('treats quantity=0 as 1', async () => {
      mockGroqResponse([{ name: 'bread', calories: 80, protein: 3, carbs: 15, fats: 1, quantity: 0, unit: 'serving' }]);

      await request(app).post('/api/chat').send({
        userId, messages: [{ role: 'user', content: 'bread' }]
      });

      const saved = await Meal.findOne({ userId, name: 'bread' });
      expect(saved.calories).toBe(80);
    });
  });

  describe('Bug: condiments and small items skipped', () => {
    it('saves all foods including condiments like ketchup and mustard', async () => {
      mockGroqResponse([
        { name: 'pita', calories: 55, protein: 3, carbs: 30, fats: 1, quantity: 1, unit: 'serving' },
        { name: 'sausage', calories: 200, protein: 10, carbs: 2, fats: 15, quantity: 2, unit: 'serving' },
        { name: 'ketchup', calories: 15, protein: 0, carbs: 4, fats: 0, quantity: 1, unit: 'serving' },
        { name: 'mustard', calories: 5, protein: 0, carbs: 1, fats: 0, quantity: 1, unit: 'serving' }
      ], true, false, 'Logged pita, 2 sausages, ketchup and mustard!');

      const res = await request(app).post('/api/chat').send({
        userId, messages: [{ role: 'user', content: 'פיתה עם 2 נקניקיות, קטשופ וחרדל' }]
      });

      expect(res.body.savedFoods).toHaveLength(4);
      const names = res.body.savedFoods.map(f => f.name);
      expect(names).toContain('ketchup');
      expect(names).toContain('mustard');

      const allMeals = await Meal.find({ userId });
      expect(allMeals).toHaveLength(4);
    });
  });

  describe('shouldSave flag', () => {
    it('does not save meals when shouldSave is false (e.g. greeting)', async () => {
      mockGroqResponse([], false, false, 'Hey! What did you eat?');

      await request(app).post('/api/chat').send({
        userId, messages: [{ role: 'user', content: 'Hello!' }]
      });

      const meals = await Meal.find({ userId });
      expect(meals).toHaveLength(0);
    });

    it('does not save when needsInfo is true (AI is asking a follow-up)', async () => {
      mockGroqResponse([], false, true, 'How much pasta did you have?');

      const res = await request(app).post('/api/chat').send({
        userId, messages: [{ role: 'user', content: 'I had pasta' }]
      });

      expect(res.body.needsInfo).toBe(true);
      const meals = await Meal.find({ userId });
      expect(meals).toHaveLength(0);
    });
  });

  describe('Date-specific logging', () => {
    it('saves meal to a specific past date when date is provided', async () => {
      mockGroqResponse([{ name: 'apple', calories: 95, protein: 0, carbs: 25, fats: 0, quantity: 1, unit: 'serving' }]);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const dateStr = toLocalDateStr(yesterday);

      await request(app).post('/api/chat').send({
        userId, messages: [{ role: 'user', content: 'apple' }], date: dateStr
      });

      const saved = await Meal.findOne({ userId, name: 'apple' });
      expect(saved.date.getTime()).toBe(yesterday.getTime());
    });
  });

  describe('Input validation', () => {
    it('returns 400 when userId is missing', async () => {
      const res = await request(app).post('/api/chat').send({
        messages: [{ role: 'user', content: 'banana' }]
      });
      expect(res.status).toBe(400);
    });

    it('returns 400 when messages array is empty', async () => {
      const res = await request(app).post('/api/chat').send({ userId, messages: [] });
      expect(res.status).toBe(400);
    });
  });
});
