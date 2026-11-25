export default function MetricsGrid({ weather }) {
  if (!weather) return null;

  return (
    <section className="metrics-grid">
      <div className="metric-card">
        <div className="metric-icon">💧</div>
        <div>
          <span>Humidity</span>
          <strong>{weather.humidity}%</strong>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon">💨</div>
        <div>
          <span>Wind Speed</span>
          <strong>{weather.wind_speed} km/h</strong>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon">🌧️</div>
        <div>
          <span>Precipitation</span>
          <strong>{weather.precipitation} mm</strong>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon">🌡️</div>
        <div>
          <span>Feels Like</span>
          <strong>{weather.apparent_temperature}°C</strong>
        </div>
      </div>
    </section>
  );
}

