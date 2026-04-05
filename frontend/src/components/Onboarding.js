import React, { useState } from 'react';
import axios from 'axios';
import './Onboarding.css';

const EXERCISE_TYPES = [
  { key: 'running',          emoji: '🏃', label: 'Running',           description: '~60 min session, outdoor or treadmill' },
  { key: 'cycling',          emoji: '🚴', label: 'Cycling',           description: '~60 min session, road or stationary' },
  { key: 'swimming',         emoji: '🏊', label: 'Swimming',          description: '~60 min session' },
  { key: 'strengthTraining', emoji: '💪', label: 'Strength Training', description: 'Intense ~60 min, continuous — no long rest, no cardio' },
  { key: 'hiit',             emoji: '⚡', label: 'HIIT / CrossFit',   description: '~45 min high-intensity intervals' },
  { key: 'yoga',             emoji: '🧘', label: 'Yoga / Pilates',    description: '~60 min session' },
  { key: 'boxing',           emoji: '🥊', label: 'Boxing',            description: '~60 min session' },
];

const DEFAULT_ROUTINE = Object.fromEntries(EXERCISE_TYPES.map(e => [e.key, 0]));

function Onboarding({ onUserCreated }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    weight: '',
    height: '',
    gender: 'male',
    dailySteps: 5000,
    exerciseRoutine: { ...DEFAULT_ROUTINE }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoutineChange = (key, value) => {
    const sessions = Math.min(7, Math.max(0, parseInt(value) || 0));
    setFormData(prev => ({
      ...prev,
      exerciseRoutine: { ...prev.exerciseRoutine, [key]: sessions }
    }));
  };

  const totalSessions = Object.values(formData.exerciseRoutine).reduce((a, b) => a + b, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('/api/users', formData);
      onUserCreated(response.data);
    } catch (error) {
      alert('Error creating profile: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="onboarding">
      <div className="onboarding-container">
        <h1>💪 EmFit</h1>
        <p className="subtitle">Let's set up your profile to calculate your exact daily calorie needs</p>

        <form onSubmit={handleSubmit} className="onboarding-form">

          {step === 1 && (
            <div className="form-step">
              <h2>Basic Information</h2>

              <div className="form-group">
                <label>Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your name" required />
              </div>

              <div className="form-group">
                <label>Age</label>
                <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="Years" min="1" max="120" required />
              </div>

              <div className="form-group">
                <label>Gender</label>
                <div className="gender-options">
                  <label>
                    <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={handleChange} />
                    Male
                  </label>
                  <label>
                    <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={handleChange} />
                    Female
                  </label>
                </div>
              </div>

              <button type="button" onClick={() => setStep(2)} className="btn-next" disabled={!formData.name || !formData.age}>
                Next →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="form-step">
              <h2>Body Measurements</h2>

              <div className="form-group">
                <label>Weight (kg)</label>
                <input type="number" name="weight" value={formData.weight} onChange={handleChange} placeholder="e.g. 75" min="20" max="500" step="0.1" required />
              </div>

              <div className="form-group">
                <label>Height (cm)</label>
                <input type="number" name="height" value={formData.height} onChange={handleChange} placeholder="e.g. 175" min="50" max="250" required />
              </div>

              <div className="button-group">
                <button type="button" onClick={() => setStep(1)} className="btn-back">← Back</button>
                <button type="button" onClick={() => setStep(3)} className="btn-next" disabled={!formData.weight || !formData.height}>Next →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-step">
              <h2>Your Weekly Exercise Routine</h2>
              <p>How many sessions per week do you do each? Set to 0 if you don't do it. This is used to calculate your exact TDEE — no need to log workouts later.</p>

              <div className="form-group steps-group">
                <label>🚶 Average Daily Steps</label>
                <div className="steps-input-row">
                  <input
                    type="number"
                    name="dailySteps"
                    value={formData.dailySteps}
                    onChange={handleChange}
                    min="0"
                    max="50000"
                    step="500"
                  />
                  <span className="steps-hint">steps/day</span>
                </div>
                <div className="steps-guide">
                  2,000 = very sedentary · 5,000 = light · 8,000 = active · 12,000+ = very active
                </div>
              </div>

              <div className="routine-list">
                {EXERCISE_TYPES.map(ex => (
                  <div key={ex.key} className="routine-row">
                    <div className="routine-info">
                      <span className="routine-emoji">{ex.emoji}</span>
                      <div>
                        <div className="routine-label">{ex.label}</div>
                        <div className="routine-description">{ex.description}</div>
                      </div>
                    </div>
                    <div className="routine-counter">
                      <button type="button" className="counter-btn" onClick={() => handleRoutineChange(ex.key, formData.exerciseRoutine[ex.key] - 1)}>−</button>
                      <span className="counter-value">{formData.exerciseRoutine[ex.key]}×</span>
                      <button type="button" className="counter-btn" onClick={() => handleRoutineChange(ex.key, formData.exerciseRoutine[ex.key] + 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              {totalSessions > 0 && (
                <div className="routine-summary">
                  {totalSessions} session{totalSessions !== 1 ? 's' : ''} per week total
                </div>
              )}

              <div className="button-group">
                <button type="button" onClick={() => setStep(2)} className="btn-back">← Back</button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Profile'}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="progress-indicator">
          {[1, 2, 3].map(n => (
            <span key={n} className={step >= n ? 'dot active' : 'dot'}></span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
