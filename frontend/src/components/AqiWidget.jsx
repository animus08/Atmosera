import React, { useState, useEffect } from 'react';

export default function AqiWidget({ location, latitude, longitude }) {
  const [aqi, setAqi] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (latitude && longitude) {
      fetchAqi(latitude, longitude);
    }
  }, [latitude, longitude]);

  const fetchAqi = async (lat, lon) => {
    setLoading(true);
    try {
      // Using Open-Meteo Air Quality API
      const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone&timezone=auto`);
      const data = await res.json();
      if (data.current) {
        setAqi(data.current);
      }
    } catch (err) {
      console.error("Failed to fetch AQI", err);
    } finally {
      setLoading(false);
    }
  };

  if (!latitude || !longitude) return null;

  const getAqiStatus = (val) => {
    if (val <= 50) return { text: "Good", color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/30" };
    if (val <= 100) return { text: "Moderate", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30" };
    if (val <= 150) return { text: "Unhealthy for Sensitive", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30" };
    if (val <= 200) return { text: "Unhealthy", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30" };
    if (val <= 300) return { text: "Very Unhealthy", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/30" };
    return { text: "Hazardous", color: "text-rose-600", bg: "bg-rose-600/10", border: "border-rose-600/30" };
  };

  const aqiVal = aqi?.us_aqi || 0;
  const status = getAqiStatus(aqiVal);

  return (
    <div className={`glass-card rounded-2xl p-5 flex flex-col justify-between border-l-4 ${status.border.replace('border-', 'border-l-')} relative overflow-hidden`}>
      <div className="flex items-start justify-between relative z-10">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">
            AIR QUALITY INDEX
          </div>
          <div className="text-3xl font-extrabold font-display text-white mt-1 flex items-baseline gap-2">
            {loading ? "..." : aqiVal}
            <span className={`text-sm font-semibold ${status.color}`}>
              {loading ? "" : status.text}
            </span>
          </div>
        </div>
        <div className={`w-10 h-10 rounded-xl ${status.bg} ${status.border} border flex items-center justify-center ${status.color}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
          </svg>
        </div>
      </div>

      {aqi && !loading && (
        <div className="grid grid-cols-3 gap-2 mt-4 relative z-10">
          <div className="bg-[#181d2c] rounded-lg p-2 text-center border border-white/5">
            <div className="text-[10px] text-[#9ca3af] uppercase font-bold">PM2.5</div>
            <div className="text-xs text-white font-semibold">{aqi.pm2_5} <span className="text-[9px] text-[#6b7280]">µg/m³</span></div>
          </div>
          <div className="bg-[#181d2c] rounded-lg p-2 text-center border border-white/5">
            <div className="text-[10px] text-[#9ca3af] uppercase font-bold">PM10</div>
            <div className="text-xs text-white font-semibold">{aqi.pm10} <span className="text-[9px] text-[#6b7280]">µg/m³</span></div>
          </div>
          <div className="bg-[#181d2c] rounded-lg p-2 text-center border border-white/5">
            <div className="text-[10px] text-[#9ca3af] uppercase font-bold">Ozone</div>
            <div className="text-xs text-white font-semibold">{aqi.ozone} <span className="text-[9px] text-[#6b7280]">µg/m³</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
