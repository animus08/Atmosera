export default function ForecastView({
  forecast,
  getWeatherIcon,
  formatForecastDate,
}) {
  return (
    <section className="dashboard-section forecast-section page-section">
      <div className="section-heading">
        <div>
          <p className="small-label">UPCOMING WEATHER</p>
          <h3>7-Day Forecast</h3>
        </div>
        <span className="section-badge">{forecast.length} Days</span>
      </div>

      {forecast.length === 0 ? (
        <div className="empty-alert">
          <div className="empty-icon">🌦️</div>
          <div>
            <strong>Forecast unavailable</strong>
            <p>Search for a location to load the forecast.</p>
          </div>
        </div>
      ) : (
        <div className="forecast-grid">
          {forecast.map((day, index) => (
            <div
              className={`forecast-card ${index === 0 ? "forecast-today" : ""}`}
              key={`${day.date}-${index}`}
            >
              <span className="forecast-date">
                {index === 0 ? "Today" : formatForecastDate(day.date)}
              </span>

              <div className="forecast-icon">
                {getWeatherIcon(day.condition)}
              </div>

              <strong className="forecast-condition">
                {day.condition || "Unknown"}
              </strong>

              <div className="forecast-temperature">
                <strong>{day.temperature_max}°</strong>
                <span>{day.temperature_min}°</span>
              </div>

              <div className="forecast-details">
                <span>🌧️ {day.precipitation ?? 0} mm</span>
                <span>💨 {day.wind_speed_max ?? 0} km/h</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
