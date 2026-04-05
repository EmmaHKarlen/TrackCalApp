import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ExerciseLogger.css';

const INITIAL_MESSAGE = {
  id: 1,
  role: 'assistant',
  text: "Hey! Tell me about your workout — naturally, in Hebrew or English. Like 'I ran for an hour' or 'עשיתי שעה כושר עצים'. I'll log it right away!"
};

const QUICK_EXERCISES = ['Running', 'Cycling', 'Gym', 'Walking', 'Yoga'];

function ExerciseLogger({ user, selectedDate }) {
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

  const sendMessage = async (text) => {
    const userMsg = { id: Date.now(), role: 'user', text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const history = nextMessages
        .slice(1)
        .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text }));

      const [mealsRes, exercisesRes] = await Promise.all([
        axios.get(`/api/meals/today/${user._id}`, { params: { date: selectedDate } }),
        axios.get(`/api/exercises/today/${user._id}`, { params: { date: selectedDate } })
      ]);

      const userContext = {
        tdee: user.tdee,
        proteinTarget: user.proteinTarget,
        weight: user.weight,
        caloriesEaten: mealsRes.data.totals.calories,
        proteinEaten: mealsRes.data.totals.protein,
        caloriesBurned: exercisesRes.data.totalCaloriesBurned
      };

      const res = await axios.post('/api/exercise-chat', {
        userId: user._id,
        messages: history,
        date: selectedDate,
        userContext
      });

      const { message, savedExercise, shouldSave, needsInfo } = res.data;

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: message,
        savedExercise: shouldSave && savedExercise ? savedExercise : null,
        needsInfo: needsInfo || false
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: 'Sorry, something went wrong. Please try again!'
      }]);
    }

    setLoading(false);
  };

  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    sendMessage(text);
  };

  const handleQuickAdd = (name) => {
    sendMessage(`I did 30 minutes of ${name}`);
  };

  return (
    <div className="exercise-logger">
      <div className="logger-container">
        <div className="logger-header">
          <h2>💪 Log Your Exercise</h2>
          <p>Just describe your workout — I'll handle the rest</p>
        </div>

        <div className="messages-container">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.role === 'user' ? 'user' : 'bot'}`}>
              <div className={`message-bubble${msg.needsInfo ? ' needs-info' : ''}`}>{msg.text}</div>
              {msg.savedExercise && (
                <div className="saved-exercise-card">
                  <div className="saved-exercise-title">Logged:</div>
                  <div className="saved-exercise-row">
                    <span className="saved-exercise-name">{msg.savedExercise.name}</span>
                    <span className="saved-exercise-meta">
                      {msg.savedExercise.duration} min · {msg.savedExercise.intensity} intensity
                    </span>
                  </div>
                  <div className="saved-exercise-calories">+{msg.savedExercise.caloriesBurned} calories burned</div>
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

        <div className="quick-exercises">
          <label>Quick add common exercises:</label>
          <div className="exercise-buttons">
            {QUICK_EXERCISES.map(ex => (
              <button key={ex} onClick={() => handleQuickAdd(ex)} className="quick-btn" disabled={loading}>
                {ex}
              </button>
            ))}
          </div>
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
            placeholder="e.g. 'I ran for an hour' or 'עשיתי שעה אימון כוח'"
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

export default ExerciseLogger;
