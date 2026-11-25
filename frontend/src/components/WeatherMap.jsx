import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to dynamically update map center and fix leaflet render glitches
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
    // Fix for Leaflet tile glitching when rendered in responsive layouts
    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }, [center, map]);
  return null;
}

export default function WeatherMap({ location, latitude, longitude }) {
  const [radarTime, setRadarTime] = useState(null);

  // Fetch the latest rain radar timestamp from RainViewer
  useEffect(() => {
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(res => res.json())
      .then(data => {
        if (data.radar && data.radar.past && data.radar.past.length > 0) {
          // Get the most recent past frame
          const latestFrame = data.radar.past[data.radar.past.length - 1];
          setRadarTime(latestFrame.time);
        }
      })
      .catch(err => console.error("Could not load RainViewer data", err));
  }, []);

  if (!latitude || !longitude) return null;

  const center = [latitude, longitude];
  
  return (
    <div className="glass-card rounded-2xl p-6 animate-enter">
      <div className="mb-4">
        <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-[#38bdf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Live Precipitation Radar
        </h2>
        <p className="text-xs text-[#9ca3af]">Real-time rain and cloud tracking for {location}.</p>
      </div>

      <div className="h-[350px] w-full rounded-xl overflow-hidden border border-white/10 relative z-0">
        <MapContainer center={center} zoom={6} minZoom={3} maxZoom={12} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <MapUpdater center={center} />
          
          {/* Standard OpenStreetMap tiles with CSS inversion for dark mode */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="map-tiles-dark"
            maxZoom={12}
          />

          {/* RainViewer Live Radar Overlay */}
          {radarTime && (
            <TileLayer
              attribution='&copy; <a href="https://www.rainviewer.com">RainViewer</a>'
              url={`https://tilecache.rainviewer.com/v2/radar/${radarTime}/256/{z}/{x}/{y}/2/1_1.png`}
              opacity={0.85}
              maxZoom={12}
              maxNativeZoom={7}
            />
          )}
          
          <Marker position={center}>
            <Popup>
              <div className="text-center font-bold text-gray-800">
                {location}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}
