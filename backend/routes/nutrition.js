const express = require('express');
const router = express.Router();

console.log('Loading nutrition.js...');
console.log('GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);

let groq;
try {
  console.log('Attempting to require groq-sdk...');
  const Groq = require('groq-sdk');
  console.log('Groq class:', typeof Groq);
  
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
  console.log('✅ Groq client initialized successfully');
  console.log('groq object type:', typeof groq);
  console.log('groq.chat exists:', !!groq.chat);
} catch (err) {
  console.error('❌ Failed to initialize Groq:', err.message);
  console.error('Full error:', err);
}

// Parse foods using Groq AI
router.get('/search', async (req, res) => {
  try {
    if (!groq) {
      console.error('❌ Groq not initialized!');
      return res.status(500).json({ 
        success: false,
        error: 'Groq not initialized. Check server logs.' 
      });
    }

    let { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    console.log('Calling groq.chat.completions.create with query:', query);
    const message = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Parse the following food description and extract nutrition information. 
          
Text: "${query}"

Return ONLY a JSON object (no markdown, no explanation) with this structure:
{
  "foods": [
    {
      "name": "food name",
      "calories": number (estimate per standard serving),
      "protein": number (grams, per standard serving),
      "carbs": number (grams, per standard serving),
      "fats": number (grams, per standard serving),
      "quantity": 1,
      "unit": "serving"
    }
  ]
}

If multiple foods are mentioned, list them all. Match quantities mentioned (e.g., "2 bananas" = quantity 2).`
        }
      ]
    });

    const content = message.choices[0].message.content;
    
    // Try to parse the JSON response
    try {
      const parsed = JSON.parse(content);
      res.json({
        success: true,
        foods: parsed.foods || []
      });
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        res.json({
          success: true,
          foods: parsed.foods || []
        });
      } else {
        res.json({
          success: false,
          message: 'Could not parse food data'
        });
      }
    }
  } catch (error) {
    console.error('Groq API error:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Error parsing food. Please try again.' 
    });
  }
});

// Parse multiple foods from a paragraph
router.get('/parse', async (req, res) => {
  try {
    if (!groq || !groq.chat) {
      console.error('❌ Groq not initialized!');
      return res.status(500).json({ 
        success: false,
        error: 'Groq not initialized. Check server logs.' 
      });
    }

    let { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    console.log('Calling groq.chat.completions.create for parse with query:', query);
    const message = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Parse the following food description (can be in Hebrew or English) and extract ALL foods mentioned with their nutrition information.

Text: "${query}"

Return ONLY a JSON object (no markdown, no explanation) with this structure:
{
  "foods": [
    {
      "name": "food name in English",
      "calories": number (estimated per standard serving or per 100g),
      "protein": number (grams, per standard serving or per 100g),
      "carbs": number (grams, per standard serving or per 100g),
      "fats": number (grams, per standard serving or per 100g),
      "quantity": number (multiply if mentioned, e.g., "2 apples" = quantity 2),
      "unit": "serving"
    }
  ]
}

Important:
- List EVERY food mentioned, even if just referenced casually
- If a quantity is mentioned (like "2 bananas"), adjust the nutrition accordingly
- Be generous in extraction - when in doubt, include it
- If text is in Hebrew, translate the food name to English
- Return accurate nutritional estimates`
        }
      ]
    });

    const content = message.choices[0].message.content;
    
    // Try to parse the JSON response
    try {
      const parsed = JSON.parse(content);
      const foods = parsed.foods || [];
      
      res.json({
        success: foods.length > 0,
        foods,
        message: foods.length > 0 ? `Found ${foods.length} food(s)` : 'No foods found'
      });
    } catch (parseError) {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const foods = parsed.foods || [];
        res.json({
          success: foods.length > 0,
          foods,
          message: foods.length > 0 ? `Found ${foods.length} food(s)` : 'No foods found'
        });
      } else {
        res.json({
          success: false,
          foods: [],
          message: 'Could not parse foods'
        });
      }
    }
  } catch (error) {
    console.error('Groq API error:', error.message);
    res.status(500).json({ 
      success: false,
      foods: [],
      error: 'Error parsing foods.' 
    });
  }
});

module.exports = router;
