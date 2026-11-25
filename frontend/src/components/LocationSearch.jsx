export default function LocationSearch({
  location,
  setLocation,
  onSearch,
  onDetectLocation,
  loading,
  locationLoading,
}) {
  return (
    <section className="search-card">
      <div className="search-label">
        <span>📍</span>
        <span>Search Location</span>
      </div>

      <div className="search-row">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearch();
            }
          }}
          placeholder="Enter city name..."
        />

        <button
          className="weather-button"
          onClick={() => onSearch()}
          disabled={loading || locationLoading}
        >
          {loading ? "Loading..." : "Get Weather"}
        </button>

        <button
          className="location-button"
          onClick={onDetectLocation}
          disabled={locationLoading || loading}
        >
          {locationLoading ? "Detecting..." : "📍 Use My Location"}
        </button>
      </div>
    </section>
  );
}

