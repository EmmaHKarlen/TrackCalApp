const express = require('express');
const router = express.Router();
const Meal = require('../models/Meal');
const DailyTracker = require('../models/DailyTracker');

let groq;
try {
  const Groq = require('groq-sdk');
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} catch (err) {
  console.error('Failed to initialize Groq in chat.js:', err.message);
}

const buildSystemPrompt = (userContext) => `You are a smart, friendly personal nutrition and fitness coach. You speak Hebrew and English fluently and respond in whichever language the user writes in.

You can do three things:
1. Log food the user ate
2. Answer any question about nutrition, fitness, calorie burning, macros, metabolism, diet, health — with real, clear explanations
3. Give personalized feedback based on the user's daily progress

${userContext ? `The user's stats today:
- Daily calorie target (TDEE): ${userContext.tdee} cal
- Calories eaten so far: ${userContext.caloriesEaten} cal
- Calories remaining: ${userContext.tdee - userContext.caloriesEaten} cal
- Protein target: ${userContext.proteinTarget}g
- Protein eaten: ${userContext.proteinEaten}g
- Calories burned from exercise: ${userContext.caloriesBurned} cal
- Body weight: ${userContext.weight}kg
Use this to give personalized, relevant advice.` : ''}

DECIDING WHAT TO DO each turn:

A) SAVE FOOD — user described NEW food they ate → set shouldSave: true, needsInfo: false
   - Include EVERY food and condiment, even tiny ones (ketchup, oil, sauce)
   - calories/protein/carbs/fats are PER SINGLE ITEM — system multiplies by quantity
   - quantity must be a whole positive integer (1, 2, 3...) — never a fraction
   - For partial portions ("half a pita"): set quantity=1 and adjust calories to match the portion
   - Ask one follow-up question if portion or prep method meaningfully changes the estimate
   - CRITICAL: NEVER re-log foods that were already saved earlier in this conversation.
     If the user corrects a value (e.g. "the cheese is actually 50 cal"), acknowledge the correction
     in your message but set shouldSave: false and foods: []. The system cannot edit saved entries.
     Tell the user: "I noted the correct value. I can't edit the previous entry, but I'll use the right numbers going forward."
   - Only set shouldSave: true for BRAND NEW foods the user is reporting for the first time

B) ASK — genuinely unclear and it matters (unknown portion of calorie-dense food, fried vs grilled, etc.)
   Set shouldSave: false, needsInfo: true, foods: []

C) CHAT / EDUCATE — questions about nutrition, exercise science, advice, greetings, anything else
   Set shouldSave: false, needsInfo: false, foods: []
   Give thorough, engaging answers. Use analogies, concrete numbers, and real explanations.
   Examples of questions you should answer well:
   - "Why does muscle burn more calories than fat?"
   - "How does HIIT affect metabolism after the workout?"
   - "Is it better to eat carbs before or after training?"
   - "Why am I not losing weight even in a deficit?"
   When the user asks about their own progress, reference their stats above.

ALWAYS respond with ONLY valid JSON (no markdown):
{
  "message": "your response — can be long and detailed for educational answers",
  "foods": [...],
  "shouldSave": true or false,
  "needsInfo": true or false,
  "hasFruit": true or false,
  "hasVegetable": true or false
}

When not saving food, foods must be [].
hasFruit: set to true if ANY of the logged foods is a fruit (apple, banana, orange, berries, melon, etc.)
hasVegetable: set to true if ANY of the logged foods is a vegetable (salad, tomato, cucumber, broccoli, pepper, carrot, etc.)
When not saving, set both to false.
When saving, confirm briefly and add a relevant insight if useful (e.g. "that's a solid protein hit for post-workout").`;

router.post('/', async (req, res) => {
  try {
    if (!groq) {
      return res.status(500).json({ success: false, error: 'AI not available' });
    }

    const { messages, userId, date, userContext } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId required' });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'messages array required' });
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: buildSystemPrompt(userContext) },
        ...messages
      ]
    });

    const content = completion.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        return res.json({
          success: true,
          message: content,
          savedFoods: [],
          shouldSave: false
        });
      }
    }

    const { message, foods = [], shouldSave = false, needsInfo = false, hasFruit = false, hasVegetable = false } = parsed;
    if (shouldSave) console.log('AI foods (per-unit):', JSON.stringify(foods));

    let savedFoods = [];
    if (shouldSave && foods.length > 0) {
      for (const food of foods) {
        // Guard: AI must not use fractional quantities (prompt-enforced, but defend anyway).
        // If AI returns qty < 1 it already baked the portion into the calories, so treat as 1.
        const qty = food.quantity >= 1 ? Math.round(food.quantity) : 1;
        const mealDate = date ? new Date(date) : new Date();
        mealDate.setHours(0, 0, 0, 0);
        const meal = new Meal({
          userId,
          name: food.name,
          calories: Math.round((food.calories || 0) * qty),
          protein: Math.round((food.protein || 0) * qty * 10) / 10,
          carbs: Math.round((food.carbs || 0) * qty * 10) / 10,
          fats: Math.round((food.fats || 0) * qty * 10) / 10,
          quantity: qty,
          unit: food.unit || 'serving',
          date: mealDate
        });
        await meal.save();
        savedFoods.push({ name: meal.name, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fats: meal.fats, quantity: qty });
      }
    }

    // Auto-update fruit/veggie tracker if the AI detected any
    if (shouldSave && (hasFruit || hasVegetable)) {
      const trackerDate = date ? new Date(date) : new Date();
      trackerDate.setHours(0, 0, 0, 0);
      const trackerUpdate = {};
      if (hasFruit) trackerUpdate.ateFruit = true;
      if (hasVegetable) trackerUpdate.ateVegetable = true;
      await DailyTracker.findOneAndUpdate(
        { userId, date: trackerDate },
        { $set: trackerUpdate },
        { upsert: true }
      );
    }

    res.json({
      success: true,
      message,
      savedFoods,
      shouldSave,
      needsInfo
    });
  } catch (error) {
    console.error('Chat route error:', error.message);
    res.status(500).json({ success: false, error: 'Something went wrong, please try again.' });
  }
});

module.exports = router;
