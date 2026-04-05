import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import MealLogger from './components/MealLogger';
import ProfileSettings from './components/ProfileSettings';
import History from './components/History';

const toDateString = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));

  useEffect(() => {
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

  const handleUserUpdated = (updatedUser) => {
    setUser(updatedUser);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('userId');
    setActiveTab('dashboard');
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Onboarding onUserCreated={handleUserCreated} />;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>💪 EmFit</h1>
          <div className="user-info">
            <span>{user.name}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <nav className="app-nav">
        <button className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          📊 Dashboard
        </button>
        <button className={`nav-btn ${activeTab === 'meals' ? 'active' : ''}`} onClick={() => setActiveTab('meals')}>
          🍽️ Log Meal
        </button>
        <button className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          📈 History
        </button>
        <button className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          ⚙️ Profile
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
        {activeTab === 'history' && <History user={user} />}
        {activeTab === 'profile' && <ProfileSettings user={user} onUserUpdated={handleUserUpdated} onSaved={() => setActiveTab('dashboard')} />}
      </main>
    </div>
  );
}

export default App;
