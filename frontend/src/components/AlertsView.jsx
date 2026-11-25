export default function AlertsView({
  alerts,
  locationName,
  getAlertIcon,
  getSeverityClass,
}) {
  return (
    <section className="dashboard-section page-section">
      <div className="section-heading">
        <div>
          <p className="small-label">SAFETY</p>
          <h3>Weather Alerts</h3>
        </div>
        <span className="section-badge">{alerts.length} Active</span>
      </div>

      {alerts.length === 0 ? (
        <div className="empty-alert">
          <div className="empty-icon">🛡️</div>
          <div>
            <strong>No active alerts</strong>
            <p>Atmosera is monitoring conditions for {locationName}.</p>
          </div>
        </div>
      ) : (
        <div className="alerts-list">
          {alerts.map((alert, index) => (
            <div
              className={`alert-card ${getSeverityClass(alert.severity)}`}
              key={alert.id || index}
            >
              <div className="alert-icon">{getAlertIcon(alert.alert_type)}</div>
              <div className="alert-content">
                <div className="alert-title-row">
                  <strong>
                    {alert.title || alert.alert_type || "Weather Alert"}
                  </strong>
                  <span
                    className={`severity ${getSeverityClass(alert.severity)}`}
                  >
                    {alert.severity || "medium"}
                  </span>
                </div>
                <p>{alert.message || "Weather conditions require attention."}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

