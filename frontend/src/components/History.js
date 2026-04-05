import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './History.css';

const toLocalDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

function History({ user }) {
  const [view, setView] = useState('week'); // 'week' or 'month'
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user._id, view]);

  const fetchData = async () => {
    setLoading(true);
    const end = new Date();
    const start = new Date();
    if (view === 'week') {
      start.setDate(start.getDate() - 6);
    } else {
      start.setDate(start.getDate() - 29);
    }

    try {
      const res = await axios.get(`/api/meals/summary/${user._id}`, {
        params: { startDate: toLocalDateStr(start), endDate: toLocalDateStr(end) }
      });
      setDays(res.data);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
    setLoading(false);
  };

  const avgCalories = days.length > 0 ? Math.round(days.reduce((s, d) => s + d.calories, 0) / days.length) : 0;
  const avgProtein = days.length > 0 ? Math.round(days.reduce((s, d) => s + d.protein, 0) / days.length) : 0;
  const totalCalories = days.reduce((s, d) => s + d.calories, 0);

  const daysOverTarget = days.filter(d => d.calories > user.tdee).length;
  const daysUnderTarget = days.filter(d => d.calories <= user.tdee).length;

  // For bar chart: max value for scaling
  const maxCal = Math.max(user.tdee, ...days.map(d => d.calories), 1);

  const formatDay = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    return view === 'week'
      ? d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="history">
      <div className="history-container">
        <div className="history-header">
          <h2>📊 History</h2>
          <div className="view-toggle">
            <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>7 Days</button>
            <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>30 Days</button>
          </div>
        </div>

        {loading ? (
          <div className="history-loading">Loading...</div>
        ) : (
          <>
            <div className="history-stats">
              <div className="history-stat">
                <div className="stat-label">Avg Calories</div>
                <div className="stat-number">{avgCalories}</div>
                <div className="stat-sub">per day</div>
              </div>
              <div className="history-stat">
                <div className="stat-label">Avg Protein</div>
                <div className="stat-number">{avgProtein}g</div>
                <div className="stat-sub">per day</div>
              </div>
              <div className="history-stat">
                <div className="stat-label">Balance</div>
                <div className={`stat-number ${avgCalories <= user.tdee ? 'positive' : 'negative'}`}>
                  {avgCalories <= user.tdee ? '-' : '+'}{Math.abs(avgCalories - user.tdee)}
                </div>
                <div className="stat-sub">vs target</div>
              </div>
              <div className="history-stat">
                <div className="stat-label">On Target</div>
                <div className="stat-number">{daysUnderTarget}/{days.length}</div>
                <div className="stat-sub">days</div>
              </div>
            </div>

            <div className="history-chart">
              <div className="chart-target-line" style={{ bottom: `${(user.tdee / maxCal) * 100}%` }}>
                <span className="target-label">{user.tdee} cal target</span>
              </div>
              <div className="chart-bars">
                {days.map(day => {
                  const pct = (day.calories / maxCal) * 100;
                  const over = day.calories > user.tdee;
                  return (
                    <div key={day.date} className="chart-bar-wrapper">
                      <div className="chart-bar-value">{day.calories}</div>
                      <div className="chart-bar-track">
                        <div className={`chart-bar-fill ${over ? 'over' : 'under'}`} style={{ height: `${pct}%` }} />
                      </div>
                      <div className="chart-bar-label">{formatDay(day.date)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {days.length === 0 && (
              <div className="history-empty">No data for this period yet. Start logging meals!</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default History;
