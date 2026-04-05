import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

function Dashboard({ user, selectedDate }) {
  const [mealData, setMealData] = useState({ meals: [], totals: { calories: 0, protein: 0, carbs: 0, fats: 0 } });
  const [tracker, setTracker] = useState({ ateFruit: false, ateVegetable: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user._id, selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mealsRes, trackerRes] = await Promise.all([
        axios.get(`/api/meals/today/${user._id}`, { params: { date: selectedDate } }),
        axios.get(`/api/tracker/${user._id}`, { params: { date: selectedDate } })
      ]);
      setMealData(mealsRes.data);
      setTracker(trackerRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const toggleTracker = async (field) => {
    const newVal = !tracker[field];
    setTracker(prev => ({ ...prev, [field]: newVal }));
    await axios.put(`/api/tracker/${user._id}`, { [field]: newVal, date: selectedDate });
  };

  const caloriesLeft = user.tdee - mealData.totals.calories;
  const proteinLeft = user.proteinTarget - mealData.totals.protein;
  const caloriePercentage = Math.min((mealData.totals.calories / user.tdee) * 100, 100);
  const proteinPercentage = Math.min((mealData.totals.protein / user.proteinTarget) * 100, 100);

  const isToday = selectedDate === (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-hero">
        <h2>{isToday ? "Today's Summary" : 'Summary'}</h2>
        <p className="date">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card tdee-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Daily Calorie Target</h3>
            <div className="stat-value">{user.tdee}</div>
            <div className="stat-detail">Based on your stats & routine</div>
          </div>
        </div>

        <div className="stat-card protein-card">
          <div className="stat-icon">🥚</div>
          <div className="stat-content">
            <h3>Protein Target</h3>
            <div className="stat-value">{user.proteinTarget}g</div>
            <div className="stat-detail">Daily recommendation</div>
          </div>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-card">
          <div className="progress-header">
            <h3>Calorie Intake</h3>
            <div className="progress-stats">
              <span className="consumed">{mealData.totals.calories} / {user.tdee}</span>
              <span className={`remaining ${caloriesLeft >= 0 ? 'positive' : 'negative'}`}>
                {caloriesLeft >= 0 ? '+' : ''}{Math.round(caloriesLeft)} left
              </span>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${caloriePercentage}%` }}></div>
          </div>
          <div className="progress-detail">
            {caloriesLeft > 0
              ? `You have ${Math.round(caloriesLeft)} calories left`
              : `You've exceeded by ${Math.round(Math.abs(caloriesLeft))} calories`}
          </div>
        </div>

        <div className="progress-card">
          <div className="progress-header">
            <h3>Protein Intake</h3>
            <div className="progress-stats">
              <span className="consumed">{Math.round(mealData.totals.protein)}g / {user.proteinTarget}g</span>
              <span className={`remaining ${proteinLeft >= 0 ? 'positive' : 'negative'}`}>
                {proteinLeft >= 0 ? '+' : ''}{Math.round(proteinLeft)}g left
              </span>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill protein" style={{ width: `${proteinPercentage}%` }}></div>
          </div>
          <div className="progress-detail">
            {proteinLeft > 0
              ? `You need ${Math.round(proteinLeft)}g more protein`
              : `Excellent! You've met your protein goal`}
          </div>
        </div>
      </div>

      <div className="daily-checks">
        <h3>Daily Checks</h3>
        <div className="check-items">
          <button className={`check-item ${tracker.ateFruit ? 'checked' : ''}`} onClick={() => toggleTracker('ateFruit')}>
            <span className="check-icon">{tracker.ateFruit ? '✅' : '⬜'}</span>
            <span className="check-label">🍎 Ate a fruit</span>
          </button>
          <button className={`check-item ${tracker.ateVegetable ? 'checked' : ''}`} onClick={() => toggleTracker('ateVegetable')}>
            <span className="check-icon">{tracker.ateVegetable ? '✅' : '⬜'}</span>
            <span className="check-label">🥦 Ate a vegetable</span>
          </button>
        </div>
      </div>

      <div className="lists-section">
        <div className="list-card full-width">
          <h3>🍽️ Meals ({mealData.meals.length})</h3>
          {mealData.meals.length > 0 ? (
            <div className="items-list">
              {mealData.meals.map(meal => (
                <div key={meal._id} className="list-item meal-item">
                  <div className="item-info">
                    <div className="item-name">{meal.name}</div>
                    <div className="item-meta">
                      <span className="badge">{meal.calories} cal</span>
                      <span className="badge protein">{meal.protein}g protein</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No meals logged yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
