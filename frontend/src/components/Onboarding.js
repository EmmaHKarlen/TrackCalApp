import React, { useState } from 'react';
import axios from 'axios';
import './Onboarding.css';

function Onboarding({ onUserCreated }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    weight: '',
    height: '',
    gender: 'male',
    activityLevel: 'moderately-active'
  });

  const activityLevels = [
    { value: 'sedentary', label: '😴 Sedentary', description: 'Little or no exercise, desk job' },
    { value: 'lightly-active', label: '🚶 Lightly Active', description: 'Exercise 1-3 days a week' },
    { value: 'moderately-active', label: '🏻 Moderately Active', description: 'Exercise 3-5 days a week' },
    { value: 'very-active', label: '🏃 Very Active', description: 'Exercise 6-7 days a week' },
    { value: 'extra-active', label: '💪 Extra Active', description: 'Physical job or training 2x per day' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/users', formData);
      onUserCreated(response.data);
    } catch (error) {
      alert('Error creating user: ' + error.message);
    }
  };

  return (
    <div className="onboarding">
      <div className="onboarding-container">
        <h1>🔥 Welcome to Calorie Tracker</h1>
        <p className="subtitle">Let's set up your profile to track your nutrition and fitness goals</p>

        <form onSubmit={handleSubmit} className="onboarding-form">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="form-step">
              <h2>Basic Information</h2>
              
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="Years"
                  min="1"
                  max="120"
                  required
                />
              </div>

              <div className="form-group">
                <label>Gender</label>
                <div className="gender-options">
                  <label>
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === 'male'}
                      onChange={handleChange}
                    />
                    Male
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === 'female'}
                      onChange={handleChange}
                    />
                    Female
                  </label>
                </div>
              </div>

              <button type="button" onClick={() => setStep(2)} className="btn-next">
                Next →
              </button>
            </div>
          )}

          {/* Step 2: Body Measurements */}
          {step === 2 && (
            <div className="form-step">
              <h2>Body Measurements</h2>

              <div className="form-group">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="kilogram"
                  min="20"
                  max="500"
                  step="0.1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="centimeter"
                  min="50"
                  max="250"
                  required
                />
              </div>

              <div className="button-group">
                <button type="button" onClick={() => setStep(1)} className="btn-back">
                  ← Back
                </button>
                <button type="button" onClick={() => setStep(3)} className="btn-next">
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Activity Level */}
          {step === 3 && (
            <div className="form-step">
              <h2>Activity Level</h2>
              <p>Select your typical activity level to calculate your TDEE (Total Daily Energy Expenditure)</p>

              <div className="activity-options">
                {activityLevels.map(level => (
                  <label key={level.value} className="activity-option">
                    <input
                      type="radio"
                      name="activityLevel"
                      value={level.value}
                      checked={formData.activityLevel === level.value}
                      onChange={handleChange}
                    />
                    <div className="activity-content">
                      <div className="activity-label">{level.label}</div>
                      <div className="activity-description">{level.description}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="button-group">
                <button type="button" onClick={() => setStep(2)} className="btn-back">
                  ← Back
                </button>
                <button type="submit" className="btn-submit">
                  Create Profile
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="progress-indicator">
          <span className={step >= 1 ? 'dot active' : 'dot'}></span>
          <span className={step >= 2 ? 'dot active' : 'dot'}></span>
          <span className={step >= 3 ? 'dot active' : 'dot'}></span>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
