import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './MealLogger.css';

const INITIAL_MESSAGE = {
  id: 1,
  role: 'assistant',
  text: "Hey! What did you eat? Tell me naturally — like 'I had 2 eggs and toast for breakfast' or 'אכלתי עוף עם אורז'. I'll log it right away!"
};

function MealLogger({ user, selectedDate }) {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now(), role: 'user', text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const history = nextMessages
        .slice(1)
        .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text }));

      const mealsRes = await axios.get(`/api/meals/today/${user._id}`, { params: { date: selectedDate } });

      const userContext = {
        tdee: user.tdee,
        proteinTarget: user.proteinTarget,
        weight: user.weight,
        caloriesEaten: mealsRes.data.totals.calories,
        proteinEaten: mealsRes.data.totals.protein,
        caloriesBurned: 0
      };

      const res = await axios.post('/api/chat', {
        userId: user._id,
        messages: history,
        date: selectedDate,
        userContext
      });

      const { message, savedFoods, shouldSave, needsInfo } = res.data;

      const botMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        text: message,
        savedFoods: shouldSave && savedFoods.length > 0 ? savedFoods : null,
        needsInfo: needsInfo || false
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: "Sorry, something went wrong. Please try again!"
      }]);
    }

    setLoading(false);
  };

  return (
    <div className="meal-logger">
      <div className="logger-container">
        <div className="logger-header">
          <h2>🍽️ Log Your Meals</h2>
          <p>Just tell me what you ate — I'll handle the rest</p>
        </div>

        <div className="messages-container">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.role === 'user' ? 'user' : 'bot'}`}>
              <div className={`message-bubble${msg.needsInfo ? ' needs-info' : ''}`}>{msg.text}</div>
              {msg.savedFoods && (
                <div className="saved-foods-card">
                  <div className="saved-foods-title">Logged:</div>
                  {msg.savedFoods.map((f, i) => (
                    <div key={i} className="saved-food-row">
                      <span className="saved-food-name">{f.name}</span>
                      <span className="saved-food-macros">{f.calories} cal · {f.protein}g protein</span>
                    </div>
                  ))}
                  <div className="saved-foods-total">
                    <strong>Total: </strong>
                    {msg.savedFoods.reduce((s, f) => s + (f.calories || 0), 0)} cal ·{' '}
                    {msg.savedFoods.reduce((s, f) => s + (f.protein || 0), 0).toFixed(1)}g protein
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="message bot">
              <div className="message-bubble typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="input-form">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="e.g. 'I had a banana and Greek yogurt' or 'אכלתי שניצל עם תפוחי אדמה'"
            disabled={loading}
            rows={1}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            {loading ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default MealLogger;
