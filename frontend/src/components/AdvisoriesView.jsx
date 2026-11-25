export default function AdvisoriesView({
  advisories,
  getAdvisoryIcon,
  getSeverityClass,
}) {
  return (
    <section className="dashboard-section advisories-section page-section">
      <div className="section-heading">
        <div>
          <p className="small-label">SMART RECOMMENDATIONS</p>
          <h3>Weather Advisories</h3>
        </div>
        <span className="section-badge">{advisories.length} Advisories</span>
      </div>

      {advisories.length === 0 ? (
        <div className="empty-alert">
          <div className="empty-icon">💡</div>
          <div>
            <strong>No advisories available</strong>
            <p>
              Search for a location to receive weather-based recommendations.
            </p>
          </div>
        </div>
      ) : (
        <div className="advisories-list">
          {advisories.map((advisory, index) => (
            <div
              className={`advisory-card ${getSeverityClass(advisory.priority)}`}
              key={`${advisory.type}-${index}`}
            >
              <div className="advisory-icon">
                {getAdvisoryIcon(advisory.type)}
              </div>

              <div className="advisory-content">
                <div className="advisory-title-row">
                  <strong>{advisory.title || "Weather Advisory"}</strong>
                  <span
                    className={`severity ${getSeverityClass(advisory.priority)}`}
                  >
                    {advisory.priority || "low"}
                  </span>
                </div>

                <p>
                  {advisory.advice || "No specific recommendation available."}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
