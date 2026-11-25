export default function CurrentWeatherCard({ weather, getWeatherIcon }) {
  if (!weather) return null;

  return (
    <section className="weather-main-card">
      <div className="weather-location">
        <div>
          <p className="small-label">CURRENT WEATHER</p>
          <h3>
            {weather.location}
            {weather.country ? `, ${weather.country}` : ""}
          </h3>
          {weather.time && (
            <p className="weather-time">
              Updated: {weather.time.replace("T", " ")}
            </p>
          )}
        </div>

        <div className="weather-icon">
          {getWeatherIcon(weather.condition)}
        </div>
      </div>

      <div className="temperature-area">
        <div className="temperature">
          {weather.temperature}
          <span>°C</span>
        </div>

        <div className="condition">
          {weather.condition || "Unknown"}
        </div>

        <div className="feels-like">
          Feels like {weather.apparent_temperature}°C
        </div>
      </div>
    </section>
  );
}
