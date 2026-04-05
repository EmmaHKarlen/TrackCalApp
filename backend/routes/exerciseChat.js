const express = require('express');
const router = express.Router();
const Exercise = require('../models/Exercise');

let groq;
try {
  const Groq = require('groq-sdk');
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} catch (err) {
  console.error('Failed to initialize Groq in exerciseChat.js:', err.message);
}

const buildSystemPrompt = (userContext) => `You are a smart, friendly personal fitness and nutrition coach. You speak Hebrew and English fluently and respond in whichever language the user writes in.

You can do three things:
1. Log workouts the user did
2. Answer any question about exercise, calorie burning, metabolism, muscle, training — with real, clear explanations and analogies
3. Give personalized feedback based on their stats

${userContext ? `The user's stats today:
- Body weight: ${userContext.weight}kg
- Daily calorie target (TDEE): ${userContext.tdee} cal
- Calories burned from exercise today: ${userContext.caloriesBurned} cal
- Calories eaten: ${userContext.caloriesEaten} cal
Use this for personalized advice.` : ''}

DECIDING WHAT TO DO:

A) SAVE EXERCISE — user described a workout they did → set shouldSave: true, needsInfo: false
   Extract:
   - name: exercise type in English ("Strength Training", "Running", "HIIT", etc.)
   - duration: in minutes. "an hour" = 60, "half an hour" = 30, "45 minutes" = 45
   - intensity: "low", "moderate", or "high"
   - caloriesBurned: estimate for THIS user's weight (${userContext?.weight || 70}kg):
     Running: low=8, moderate=11, high=15 cal/min (×weight/70)
     Cycling: low=6, moderate=10, high=14 cal/min (×weight/70)
     Swimming: low=7, moderate=11, high=16 cal/min (×weight/70)
     Walking: low=3, moderate=5, high=7 cal/min (×weight/70)
     Gym/Strength: low=5, moderate=8, high=12 cal/min (×weight/70)
     HIIT/Crossfit: low=10, moderate=14, high=18 cal/min (×weight/70)
     Yoga/Pilates: low=2, moderate=4, high=6 cal/min (×weight/70)
     Boxing: low=8, moderate=12, high=16 cal/min (×weight/70)

B) ASK — genuinely unclear (exercise type or duration unknown). Ask ONE question.
   Set shouldSave: false, needsInfo: true, exercise: null

C) CHAT / EDUCATE — any question about fitness, exercise science, calorie burning, metabolism, muscle gain, fat loss, recovery, etc.
   Set shouldSave: false, needsInfo: false, exercise: null
   Give thorough, engaging, educational answers. Use real numbers, analogies, concrete explanations.
   Examples: "why does muscle burn more calories?", "how does EPOC work after HIIT?", "does cardio kill muscle?", "what's a good heart rate zone for fat burning?"
   Reference the user's own stats when relevant.

ALWAYS respond with ONLY valid JSON (no markdown):
{
  "message": "your response — detailed for educational questions",
  "exercise": { "name": "...", "duration": number, "intensity": "low|moderate|high", "caloriesBurned": number } or null,
  "shouldSave": true or false,
  "needsInfo": true or false
}`;

router.post('/', async (req, res) => {
  try {
    if (!groq) return res.status(500).json({ success: false, error: 'AI not available' });

    const { messages, userId, date, userContext } = req.body;

    if (!userId) return res.status(400).json({ success: false, error: 'userId required' });
    if (!messages || !Array.isArray(messages) || messages.length === 0)
      return res.status(400).json({ success: false, error: 'messages array required' });

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
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { message: content, exercise: null, shouldSave: false, needsInfo: false };
    }

    const { message, exercise, shouldSave = false, needsInfo = false } = parsed;

    let savedExercise = null;
    if (shouldSave && exercise) {
      const exDate = date ? new Date(date) : new Date();
      exDate.setHours(0, 0, 0, 0);

      const doc = new Exercise({
        userId,
        name: exercise.name,
        duration: exercise.duration,
        caloriesBurned: exercise.caloriesBurned,
        intensity: exercise.intensity,
        date: exDate
      });
      await doc.save();
      savedExercise = exercise;
    }

    res.json({ success: true, message, savedExercise, shouldSave, needsInfo });
  } catch (error) {
    console.error('Exercise chat error:', error.message);
    res.status(500).json({ success: false, error: 'Something went wrong, please try again.' });
  }
});

module.exports = router;
