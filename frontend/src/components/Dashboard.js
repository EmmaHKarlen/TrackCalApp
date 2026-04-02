import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

function Dashboard({ user, selectedDate }) {
  const [mealData, setMealData] = useState({ meals: [], totals: { calories: 0, protein: 0, carbs: 0, fats: 0 } });
  const [exerciseData, setExerciseData] = useState({ exercises: [], totalCaloriesBurned: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayData();
  }, [user._id, selectedDate]);

  const fetchTodayData = async () => {
    setLoading(true);
    try {
      const [mealsRes, exercisesRes] = await Promise.all([
        axios.get(`/api/meals/today/${user._id}`, { params: { date: selectedDate } }),
        axios.get(`/api/exercises/today/${user._id}`, { params: { date: selectedDate } })
      ]);
      setMealData(mealsRes.data);
      setExerciseData(exercisesRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const calculateCaloriesLeft = () => {
    const adjustedTDEE = user.tdee + exerciseData.totalCaloriesBurned;
    return adjustedTDEE - mealData.totals.calories;
  };

  const calculateProteinLeft = () => {
    return user.proteinTarget - mealData.totals.protein;
  };

  const getCaloriePercentage = () => {
    const adjustedTDEE = user.tdee + exerciseData.totalCaloriesBurned;
    return Math.min((mealData.totals.calories / adjustedTDEE) * 100, 100);
  };

  const getProteinPercentage = () => {
    return Math.min((mealData.totals.protein / user.proteinTarget) * 100, 100);
  };

  if (loading) {
    return <div className="loading-spinner">Loading today's data...</div>;
  }

  const caloriesLeft = calculateCaloriesLeft();
  const proteinLeft = calculateProteinLeft();
  const caloriePercentage = getCaloriePercentage();
  const proteinPercentage = getProteinPercentage();

  return (
    <div className="dashboard">
      <div className="dashboard-hero">
        <h2>{selectedDate === new Date().toISOString().split('T')[0] ? "Today's Summary" : 'Summary'}</h2>
        <p className="date">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="stats-grid">
        {/* TDEE Card */}
        <div className="stat-card tdee-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Daily TDEE</h3>
            <div className="stat-value">{user.tdee}</div>
            <div className="stat-detail">Base calories to maintain weight</div>
          </div>
        </div>

        {/* Exercise Card */}
        {exerciseData.totalCaloriesBurned > 0 && (
          <div className="stat-card exercise-card">
            <div className="stat-icon">💪</div>
            <div className="stat-content">
              <h3>Calories Burned</h3>
              <div className="stat-value">+{exerciseData.totalCaloriesBurned}</div>
              <div className="stat-detail">{exerciseData.exercises.length} exercise(s) logged</div>
            </div>
          </div>
        )}

        {/* Adjusted TDEE Card */}
        <div className="stat-card adjusted-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <h3>Adjusted TDEE</h3>
            <div className="stat-value">{user.tdee + exerciseData.totalCaloriesBurned}</div>
            <div className="stat-detail">With exercises included</div>
          </div>
        </div>

        {/* Protein Target Card */}
        <div className="stat-card protein-card">
          <div className="stat-icon">🥚</div>
          <div className="stat-content">
            <h3>Protein Target</h3>
            <div className="stat-value">{user.proteinTarget}g</div>
            <div className="stat-detail">Daily recommendation</div>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="progress-section">
        <div className="progress-card">
          <div className="progress-header">
            <h3>Calorie Intake</h3>
            <div className="progress-stats">
              <span className="consumed">{mealData.totals.calories} / {user.tdee + exerciseData.totalCaloriesBurned}</span>
              <span className={`remaining ${caloriesLeft >= 0 ? 'positive' : 'negative'}`}>
                {caloriesLeft >= 0 ? '+' : ''}{Math.round(caloriesLeft)} left
              </span>
            </div>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${caloriePercentage}%` }}
            ></div>
          </div>
          <div className="progress-detail">
            {caloriesLeft > 0 
              ? `You have ${Math.round(caloriesLeft)} calories left to eat`
              : `You've exceeded by ${Math.round(Math.abs(caloriesLeft))} calories`
            }
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
            <div 
              className="progress-fill protein" 
              style={{ width: `${proteinPercentage}%` }}
            ></div>
          </div>
          <div className="progress-detail">
            {proteinLeft > 0 
              ? `You need ${Math.round(proteinLeft)}g more protein`
              : `Excellent! You've met your protein goal`
            }
          </div>
        </div>
      </div>

      {/* Meals and Exercises Lists */}
      <div className="lists-section">
        <div className="list-card">
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

        <div className="list-card">
          <h3>💪 Exercises ({exerciseData.exercises.length})</h3>
          {exerciseData.exercises.length > 0 ? (
            <div className="items-list">
              {exerciseData.exercises.map(exercise => (
                <div key={exercise._id} className="list-item exercise-item">
                  <div className="item-info">
                    <div className="item-name">{exercise.name}</div>
                    <div className="item-meta">
                      <span className="badge">{exercise.duration} min</span>
                      <span className="badge burn">+{exercise.caloriesBurned} cal</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No exercises logged yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
