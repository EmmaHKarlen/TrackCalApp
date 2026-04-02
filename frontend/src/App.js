import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import MealLogger from './components/MealLogger';
import ExerciseLogger from './components/ExerciseLogger';

const toDateString = (d) => d.toISOString().split('T')[0]; // YYYY-MM-DD

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));

  useEffect(() => {
    // Check if user exists in localStorage
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetchUser(userId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (userId) => {
    try {
      const response = await axios.get(`/api/users/${userId}`);
      setUser(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('userId');
      setLoading(false);
    }
  };

  const handleUserCreated = (newUser) => {
    setUser(newUser);
    localStorage.setItem('userId', newUser._id);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('userId');
    setActiveTab('dashboard');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Onboarding onUserCreated={handleUserCreated} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🔥 Calorie Tracker</h1>
          <div className="user-info">
            <span>{user.name}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <nav className="app-nav">
        <button
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`nav-btn ${activeTab === 'meals' ? 'active' : ''}`}
          onClick={() => setActiveTab('meals')}
        >
          🍽️ Log Meal
        </button>
        <button
          className={`nav-btn ${activeTab === 'exercises' ? 'active' : ''}`}
          onClick={() => setActiveTab('exercises')}
        >
          💪 Log Exercise
        </button>
        <div className="date-picker-wrapper">
          <input
            type="date"
            value={selectedDate}
            max={toDateString(new Date())}
            onChange={e => setSelectedDate(e.target.value)}
            className="date-picker"
          />
        </div>
      </nav>

      <main className="app-main">
        {activeTab === 'dashboard' && <Dashboard user={user} selectedDate={selectedDate} />}
        {activeTab === 'meals' && <MealLogger user={user} selectedDate={selectedDate} />}
        {activeTab === 'exercises' && <ExerciseLogger user={user} selectedDate={selectedDate} />}
      </main>
    </div>
  );
}

export default App;
