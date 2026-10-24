import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [activeTab, setActiveTab] = useState('forecast');
  const [latestForecast, setLatestForecast] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [decisionDate, setDecisionDate] = useState('2026-10-23');

  useEffect(() => {
    if (activeTab === 'forecast') {
      fetchLatestForecast();
    } else if (activeTab === 'accuracy') {
      fetchAccuracy();
    }
  }, [activeTab, decisionDate]);

  const fetchLatestForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/latest-forecast`, {
        params: { decision_date: decisionDate }
      });
      setLatestForecast(response.data);
    } catch (err) {
      setError('Failed to fetch forecast data. Please ensure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccuracy = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/accuracy`);
      setAccuracy(response.data);
    } catch (err) {
      setError('Failed to fetch accuracy data. Please ensure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = (data) => {
    if (!data) return [];
    return data.map(item => ({
      time: format(parseISO(item.startTime), 'HH:mm'),
      generation: item.generation,
      actual: item.actual,
      forecast: item.forecast
    }));
  };

  const calculateTotalGeneration = (data) => {
    if (!data || data.length === 0) return 0;
    return data.reduce((sum, item) => sum + item.generation, 0);
  };

  return (
    <div className="App">
      <header className="header">
        <div className="header-content">
          <h1>Wind Power Forecasting Portal</h1>
          <p className="subtitle">Day-Ahead Market Decision Support | October 2026</p>
        </div>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'forecast' ? 'active' : ''}`}
          onClick={() => setActiveTab('forecast')}
        >
          Latest Forecast
        </button>
        <button
          className={`tab ${activeTab === 'accuracy' ? 'active' : ''}`}
          onClick={() => setActiveTab('accuracy')}
        >
          Forecast Accuracy
        </button>
      </nav>

      <main className="content">
        {loading && <div className="loading">Loading data...</div>}
        {error && <div className="error">{error}</div>}

        {!loading && !error && activeTab === 'forecast' && latestForecast && (
          <div className="forecast-view">
            <div className="controls">
              <label>
                Decision Date (Day-Ahead):
                <input
                  type="date"
                  value={decisionDate}
                  onChange={(e) => setDecisionDate(e.target.value)}
                  min="2026-10-20"
                  max="2026-10-24"
                />
              </label>
              <button onClick={fetchLatestForecast} className="refresh-btn">
                Refresh
              </button>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Forecast Date</div>
                <div className="stat-value">{latestForecast.forecast_for_date}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Latest Forecast Published</div>
                <div className="stat-value">
                  {latestForecast.latest_publish_time
                    ? format(parseISO(latestForecast.latest_publish_time), 'MMM dd, HH:mm')
                    : 'N/A'}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Forecasted Generation</div>
                <div className="stat-value">
                  {calculateTotalGeneration(latestForecast.data).toLocaleString()} MW
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Data Points</div>
                <div className="stat-value">{latestForecast.count}</div>
              </div>
            </div>

            <div className="chart-container">
              <h2>Day-Ahead Wind Generation Forecast</h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={formatChartData(latestForecast.data)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="time"
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Generation (MW)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #d1d5db' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="generation"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Forecast (MW)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="info-box">
              <h3>💡 Decision Support</h3>
              <p>
                This forecast represents the most recent wind generation prediction available for
                day-ahead market decisions. Use this data to determine additional power procurement
                needs from thermal plants to meet consumer demand.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && activeTab === 'accuracy' && accuracy && (
          <div className="accuracy-view">
            <div className="stats-grid">
              <div className="stat-card highlight">
                <div className="stat-label">Mean Absolute Error (MAE)</div>
                <div className="stat-value">{accuracy.metrics.mae} MW</div>
                <div className="stat-description">Average prediction error magnitude</div>
              </div>
              <div className="stat-card highlight">
                <div className="stat-label">Root Mean Squared Error (RMSE)</div>
                <div className="stat-value">{accuracy.metrics.rmse} MW</div>
                <div className="stat-description">Error with emphasis on large deviations</div>
              </div>
              <div className="stat-card highlight">
                <div className="stat-label">Mean Absolute % Error (MAPE)</div>
                <div className="stat-value">{accuracy.metrics.mape.toFixed(2)}%</div>
                <div className="stat-description">Error as percentage of actual</div>
              </div>
              <div className="stat-card highlight">
                <div className="stat-label">Forecast Bias</div>
                <div className="stat-value">
                  {accuracy.metrics.bias > 0 ? '+' : ''}{accuracy.metrics.bias} MW
                </div>
                <div className="stat-description">
                  {accuracy.metrics.bias > 0 ? 'Tends to over-forecast' : 'Tends to under-forecast'}
                </div>
              </div>
            </div>

            <div className="chart-container">
              <h2>Forecast vs Actual Generation (January 2026)</h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={accuracy.time_series.slice(0, 100)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="startTime"
                    stroke="#6b7280"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => format(parseISO(value), 'MM/dd HH:mm')}
                    interval={10}
                  />
                  <YAxis
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Generation (MW)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #d1d5db' }}
                    labelFormatter={(value) => format(parseISO(value), 'MMM dd, HH:mm')}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={false}
                    name="Actual (MW)"
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 5"
                    name="Forecast (MW)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h2>Forecast Error Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={accuracy.error_distribution.bins.map((bin, idx) => ({
                  bin: bin.replace('(', '').replace(']', '').replace('inf', '∞'),
                  count: accuracy.error_distribution.counts[idx]
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="bin"
                    stroke="#6b7280"
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Error Range (MW)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #d1d5db' }} />
                  <Bar dataKey="count" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="info-box">
              <h3>📊 Accuracy Metrics Explained</h3>
              <ul>
                <li><strong>MAE</strong>: Lower is better. Represents the average magnitude of errors.</li>
                <li><strong>RMSE</strong>: Penalizes larger errors more heavily than MAE.</li>
                <li><strong>MAPE</strong>: Normalized error that allows comparison across different scales.</li>
                <li><strong>Bias</strong>: Positive = over-forecasting, Negative = under-forecasting.</li>
              </ul>
              <p className="sample-note">
                Based on {accuracy.metrics.sample_size} day-ahead forecast-actual pairs from January 2026.
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Data Source: Elexon BMRS API | Day-Ahead Wind Forecasts for UK Energy Market</p>
      </footer>
    </div>
  );
}

export default App;
