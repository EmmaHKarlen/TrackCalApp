import React, { useState } from 'react';
import axios from 'axios';
import './ProfileSettings.css';

const EXERCISE_TYPES = [
  { key: 'running',          emoji: '🏃', label: 'Running',           description: '~60 min session' },
  { key: 'cycling',          emoji: '🚴', label: 'Cycling',           description: '~60 min session' },
  { key: 'swimming',         emoji: '🏊', label: 'Swimming',          description: '~60 min session' },
  { key: 'strengthTraining', emoji: '💪', label: 'Strength Training', description: 'Intense ~60 min, no long rest, no cardio' },
  { key: 'hiit',             emoji: '⚡', label: 'HIIT / CrossFit',   description: '~45 min high-intensity' },
  { key: 'yoga',             emoji: '🧘', label: 'Yoga / Pilates',    description: '~60 min session' },
  { key: 'boxing',           emoji: '🥊', label: 'Boxing',            description: '~60 min session' },
];

function ProfileSettings({ user, onUserUpdated, onSaved }) {
  const routine = user.exerciseRoutine || {};
  const defaultRoutine = Object.fromEntries(EXERCISE_TYPES.map(e => [e.key, routine[e.key] || 0]));

  const [formData, setFormData] = useState({
    age: user.age,
    weight: user.weight,
    height: user.height,
    gender: user.gender,
    dailySteps: user.dailySteps || 5000,
    exerciseRoutine: defaultRoutine
  });
  const [saving, setSaving] = useState(false);

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

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.put(`/api/users/${user._id}`, formData);
      onUserUpdated(res.data);
      onSaved();
    } catch (err) {
      alert('Error saving profile: ' + err.message);
    }
    setSaving(false);
  };

  const totalSessions = Object.values(formData.exerciseRoutine).reduce((a, b) => a + b, 0);

  return (
    <div className="profile-settings">
      <div className="profile-container">
        <div className="profile-header">
          <h2>⚙️ Profile & Routine</h2>
          <p>Update your stats or exercise routine — your TDEE will be recalculated automatically</p>
        </div>

        <form onSubmit={handleSave}>
          <section className="profile-section">
            <h3>Body Stats</h3>
            <div className="stats-grid-form">
              <div className="form-group">
                <label>Age</label>
                <input type="number" name="age" value={formData.age} onChange={handleChange} min="1" max="120" required />
              </div>
              <div className="form-group">
                <label>Weight (kg)</label>
                <input type="number" name="weight" value={formData.weight} onChange={handleChange} min="20" max="500" step="0.1" required />
              </div>
              <div className="form-group">
                <label>Height (cm)</label>
                <input type="number" name="height" value={formData.height} onChange={handleChange} min="50" max="250" required />
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
            </div>
          </section>

          <section className="profile-section">
            <h3>Weekly Exercise Routine</h3>
            <p className="section-note">Sessions per week for each type. This determines your fixed TDEE.</p>

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
                <div key={ex.key} className={`routine-row ${formData.exerciseRoutine[ex.key] > 0 ? 'active' : ''}`}>
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
              <div className="routine-summary">{totalSessions} session{totalSessions !== 1 ? 's' : ''} per week total</div>
            )}
          </section>

          <div className="current-tdee">
            <span>Current TDEE</span>
            <strong>{user.tdee} cal/day</strong>
            <span className="tdee-note">(will update on save)</span>
          </div>

          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfileSettings;
