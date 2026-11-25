export default function Navbar({ activePage, goToPage }) {
  return (
    <header className="navbar">
      <div className="brand" onClick={() => goToPage("dashboard")}>
        <div className="brand-icon">🌦️</div>
        <div>
          <h1>Atmosera</h1>
          <span>Weather Intelligence Platform</span>
        </div>
      </div>

      <nav className="nav-links">
        <button
          className={activePage === "dashboard" ? "nav-active" : ""}
          onClick={() => goToPage("dashboard")}
        >
          🏠 Dashboard
        </button>

        <button
          className={activePage === "forecast" ? "nav-active" : ""}
          onClick={() => goToPage("forecast")}
        >
          📅 Forecast
        </button>

        <button
          className={activePage === "alerts" ? "nav-active" : ""}
          onClick={() => goToPage("alerts")}
        >
          ⚠️ Alerts
        </button>

        <button
          className={activePage === "assistant" ? "nav-active" : ""}
          onClick={() => goToPage("assistant")}
        >
          🤖 AI Assistant
        </button>
      </nav>
    </header>
  );
}

