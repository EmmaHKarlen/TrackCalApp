import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ExerciseLogger.css';

function ExerciseLogger({ user }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Hey! 💪 Tell me about your exercise!\n\nExample: "30 minute run" or "20 minute gym"'
    }
  ]);
  const [input, setInput] = useState('');
  const [exerciseBeingEntered, setExerciseBeingEntered] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Calorie burn estimates per minute (varies by body weight and intensity)
  const exerciseDatabase = {
    'running': { light: 8, moderate: 11, high: 15 },
    'cycling': { light: 6, moderate: 10, high: 14 },
    'swimming': { light: 7, moderate: 11, high: 16 },
    'walking': { light: 3, moderate: 5, high: 7 },
    'gym': { light: 5, moderate: 8, high: 12 },
    'yoga': { light: 2, moderate: 4, high: 6 },
    'boxing': { light: 8, moderate: 12, high: 16 },
    'dancing': { light: 5, moderate: 8, high: 12 },
    'hiit': { light: 10, moderate: 14, high: 18 },
    'pilates': { light: 3, moderate: 5, high: 8 }
  };

  const findExercise = (text) => {
    const lowerText = text.toLowerCase();
    for (const exercise of Object.keys(exerciseDatabase)) {
      if (lowerText.includes(exercise)) {
        return exercise;
      }
    }
    return null;
  };

  const parseDuration = (text) => {
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : 30;
  };

  const determineIntensity = (text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('intense') || lowerText.includes('hard') || lowerText.includes('hiit')) return 'high';
    if (lowerText.includes('easy') || lowerText.includes('light') || lowerText.includes('slow')) return 'low';
    return 'moderate';
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: input
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    const exercise = findExercise(input);
    
    if (exercise) {
      const duration = parseDuration(input);
      const intensity = determineIntensity(input);
      const caloriesPerMin = exerciseDatabase[exercise][intensity];
      const caloriesBurned = Math.round(caloriesPerMin * duration * (user.weight / 70)); // Adjusted for body weight

      setExerciseBeingEntered({
        name: exercise.charAt(0).toUpperCase() + exercise.slice(1),
        duration,
        intensity,
        caloriesBurned
      });

      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'bot',
        text: `Great workout! 🔥\n\n${exercise.charAt(0).toUpperCase() + exercise.slice(1)} for ${duration} minutes (${intensity} intensity)\n• Estimated calories burned: ${caloriesBurned}\n\nConfirm with "yes" or adjust it!`
      }]);
    } else {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'bot',
        text: `I didn't recognize that exercise 🤔\n\nTry:\n• "30 minute run"\n• "45 minute gym"\n• "20 minute cycling"\n• "yoga class"\n\nOr pick from common exercises!`
      }]);
    }
  };

  const confirmExercise = async () => {
    setLoading(true);
    try {
      await axios.post('/api/exercises', {
        userId: user._id,
        name: exerciseBeingEntered.name,
        duration: exerciseBeingEntered.duration,
        caloriesBurned: exerciseBeingEntered.caloriesBurned,
        intensity: exerciseBeingEntered.intensity
      });

      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'bot',
        text: `✅ Added "${exerciseBeingEntered.name}"!\n\nGreat work! Your calorie allowance has increased by ${exerciseBeingEntered.caloriesBurned} calories. 🎉\n\nAnother workout today?`
      }]);

      setExerciseBeingEntered(null);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'bot',
        text: '❌ Error adding exercise. Try again!'
      }]);
    }
    setLoading(false);
  };

  const cancelExercise = () => {
    setExerciseBeingEntered(null);
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'bot',
      text: 'No problem! Ready for another workout? 💪'
    }]);
  };

  const addQuickExercise = (exerciseName, duration = 30) => {
    const intensity = 'moderate';
    const caloriesPerMin = exerciseDatabase[exerciseName][intensity];
    const caloriesBurned = Math.round(caloriesPerMin * duration * (user.weight / 70));

    setExerciseBeingEntered({
      name: exerciseName.charAt(0).toUpperCase() + exerciseName.slice(1),
      duration,
      intensity,
      caloriesBurned
    });

    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      text: `${duration} minute ${exerciseName}`
    }, {
      id: Date.now() + 1,
      type: 'bot',
      text: `Added! ${duration} min ${exerciseName} (${intensity})\n• Calories burned: ${caloriesBurned}\n\nReply "yes" to confirm!`
    }]);
  };

  return (
    <div className="exercise-logger">
      <div className="logger-container">
        <div className="logger-header">
          <h2>💪 Log Your Exercise</h2>
          <p>Chat-style exercise tracking with smart calorie calculation</p>
        </div>

        <div className="messages-container">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-bubble">
                {message.text}
              </div>
            </div>
          ))}
          {exerciseBeingEntered && (
            <div className="exercise-confirmation">
              <div className="confirmation-alert">
                <h3>✅ Confirm this exercise?</h3>
                <div className="exercise-details">
                  <div className="exercise-item">
                    <span className="label">Exercise:</span>
                    <span className="value">{exerciseBeingEntered.name}</span>
                  </div>
                  <div className="exercise-item">
                    <span className="label">Duration:</span>
                    <span className="value">{exerciseBeingEntered.duration} minutes</span>
                  </div>
                  <div className="exercise-item">
                    <span className="label">Intensity:</span>
                    <span className="value">{exerciseBeingEntered.intensity === 'low' ? '🟢 Light' : exerciseBeingEntered.intensity === 'moderate' ? '🟡 Moderate' : '🔴 High'}</span>
                  </div>
                  <div className="exercise-item">
                    <span className="label">Calories Burned:</span>
                    <span className="value highlight">+{exerciseBeingEntered.caloriesBurned} cal</span>
                  </div>
                </div>
                <div className="confirmation-buttons">
                  <button 
                    onClick={confirmExercise} 
                    disabled={loading}
                    className="btn-confirm"
                  >
                    {loading ? 'Adding...' : '✅ Yes, Add it!'}
                  </button>
                  <button 
                    onClick={cancelExercise}
                    disabled={loading}
                    className="btn-cancel"
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="quick-exercises">
          <label>Quick add common exercises:</label>
          <div className="exercise-buttons">
            {['running', 'cycling', 'gym', 'walking', 'yoga'].map(ex => (
              <button
                key={ex}
                onClick={() => addQuickExercise(ex)}
                className="quick-btn"
              >
                {ex.charAt(0).toUpperCase() + ex.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSendMessage} className="input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What exercise did you do? (e.g., '30 minute run', 'intense gym')"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default ExerciseLogger;
