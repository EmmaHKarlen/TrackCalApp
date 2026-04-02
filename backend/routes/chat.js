const express = require('express');
const router = express.Router();
const Meal = require('../models/Meal');

let groq;
try {
  const Groq = require('groq-sdk');
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} catch (err) {
  console.error('Failed to initialize Groq in chat.js:', err.message);
}

const SYSTEM_PROMPT = `You are a friendly nutrition tracking assistant. Users tell you what they ate in Hebrew or English, and you log it accurately.

Your job is to decide between three actions on every turn:

1. SAVE — you have enough info to log the food confidently.
   Set shouldSave: true, needsInfo: false, foods: [...].
   ALWAYS include every food and condiment the user mentioned, no matter how small (ketchup, mustard, oil, sauce, etc.). Never skip anything. Estimate calories even if tiny (e.g. ketchup ~15 cal, mustard ~5 cal).

2. ASK — something is unclear and the answer would meaningfully change the calorie/protein estimate.
   Ask ONE short, specific question. Set shouldSave: false, needsInfo: true, foods: [].
   Ask only when it genuinely matters — e.g.:
   - Portion size is completely unknown for a calorie-dense food ("I had pasta" — how much?)
   - Preparation affects nutrition significantly ("chicken" — grilled or fried?)
   - A vague term could mean very different things ("a snack", "some food")
   Do NOT ask if you can make a reasonable standard-serving estimate.

3. CHAT — unrelated to food (greeting, question, etc.).
   Set shouldSave: false, needsInfo: false, foods: [].

ALWAYS respond with ONLY a valid JSON object (no markdown, no extra text):
{
  "message": "your conversational response",
  "foods": [
    {
      "name": "food name in English",
      "calories": number (per single item — NOT multiplied by quantity),
      "protein": number (per single item — NOT multiplied by quantity),
      "carbs": number (per single item — NOT multiplied by quantity),
      "fats": number (per single item — NOT multiplied by quantity),
      "quantity": number (how many of this item the user ate),
      "unit": "serving"
    }
  ],
  "shouldSave": true or false,
  "needsInfo": true or false
}

IMPORTANT: calories/protein/carbs/fats are ALWAYS per single item. The system multiplies by quantity automatically.
quantity must ALWAYS be a whole positive integer (1, 2, 3...). NEVER use decimals or fractions for quantity.
For partial portions (e.g. "half a pita", "a quarter of a pizza"), set quantity=1 and adjust the calories/protein to reflect that portion.
Example: "half a pita" → calories=55 (half pita calories), quantity=1. NOT calories=110, quantity=0.5.
In your message, report the TOTAL (e.g. "2 sausages = 400 cal" means calories=200, quantity=2 in the JSON).
Keep messages short and friendly. When saving, briefly confirm what was logged with total calories and protein.`;

router.post('/', async (req, res) => {
  try {
    if (!groq) {
      return res.status(500).json({ success: false, error: 'AI not available' });
    }

    const { messages, userId, date } = req.body;

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
        { role: 'system', content: SYSTEM_PROMPT },
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

    const { message, foods = [], shouldSave = false, needsInfo = false } = parsed;
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
