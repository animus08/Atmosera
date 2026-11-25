import React, { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';

export default function WeatherGlobe({ location, latitude, longitude }) {
  const globeEl = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef();

  useEffect(() => {
    // Auto-resize globe based on container
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    
    window.addEventListener('resize', updateSize);
    updateSize();
    
    // Slight delay to ensure flexbox has settled
    setTimeout(updateSize, 100);

    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    // Point the camera at the searched location when it changes
    if (globeEl.current && latitude && longitude) {
      globeEl.current.pointOfView({ lat: latitude, lng: longitude, altitude: 1.5 }, 1000);
    }
  }, [latitude, longitude]);

  if (!latitude || !longitude) return null;

  // Render a glowing ring at the target location
  const ringsData = [{
    lat: latitude,
    lng: longitude,
    maxR: 5,
    propagationSpeed: 1,
    repeatPeriod: 1000
  }];

  return (
    <div className="glass-card rounded-2xl p-6 animate-enter">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-[#38bdf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Global Weather Operations
          </h2>
          <p className="text-xs text-[#9ca3af]">Interactive 3D topological view for {location}.</p>
        </div>
        <div className="text-[10px] font-bold tracking-widest text-[#eab308] uppercase border border-[#eab308]/30 px-2 py-1 rounded bg-[#eab308]/10 animate-pulse">
          Live Connection
        </div>
      </div>

      {/* Globe Container */}
      <div 
        ref={containerRef}
        className="h-[400px] w-full rounded-xl overflow-hidden border border-white/10 relative z-0 bg-[#000510]"
      >
        {dimensions.width > 0 && (
          <Globe
            ref={globeEl}
            width={dimensions.width}
            height={dimensions.height}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
            
            // Rings for target location
            ringsData={ringsData}
            ringColor={() => '#38bdf8'}
            ringMaxRadius="maxR"
            ringPropagationSpeed="propagationSpeed"
            ringRepeatPeriod="repeatPeriod"

            // Auto-rotate the globe slowly
            autoRotate={true}
            autoRotateSpeed={0.5}
          />
        )}
      </div>
    </div>
  );
}
