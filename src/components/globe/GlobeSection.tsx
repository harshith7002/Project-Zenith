'use client';
import { motion } from 'framer-motion';
import { useState, useEffect, Suspense } from 'react';
import Globe from 'react-globe.gl';

const CITY_MARKERS = [
  { lat: 28.6139, lng: 77.2090, label: 'New Delhi', color: '#A78BFA' },
  { lat: 40.7128, lng: -74.0060, label: 'New York', color: '#A78BFA' },
  { lat: 51.5074, lng: -0.1278, label: 'London', color: '#A78BFA' },
  { lat: 35.6762, lng: 139.6503, label: 'Tokyo', color: '#A78BFA' },
  { lat: -33.8688, lng: 151.2093, label: 'Sydney', color: '#A78BFA' },
  { lat: -1.2921, lng: 36.8219, label: 'Nairobi', color: '#A78BFA' },
];

type MarkerType = { lat: number; lng: number; label: string; color: string; type?: string };

function GlobeInner() {
  const [selected, setSelected] = useState<MarkerType | null>(null);
  const [issPos, setIssPos] = useState({ lat: 25, lng: 78 });

  useEffect(() => {
    const fetch5s = async () => {
      try {
        const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
        const d = await res.json();
        setIssPos({ lat: d.latitude, lng: d.longitude });
      } catch { /* use last pos */ }
    };
    fetch5s();
    const iv = setInterval(fetch5s, 5000);
    return () => clearInterval(iv);
  }, []);

  const markers: MarkerType[] = [
    ...CITY_MARKERS,
    { lat: issPos.lat, lng: issPos.lng, label: 'ISS 🛸', color: '#38D1F0', type: 'iss' },
  ];

  return (
    <div style={{ position: 'relative', borderRadius: '1rem', overflow: 'hidden' }}>
      <Globe
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor="#7C3AED"
        atmosphereAltitude={0.18}
        pointsData={markers}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.02}
        pointRadius={(d: object) => (d as MarkerType).type === 'iss' ? 0.9 : 0.55}
        pointLabel="label"
        onPointClick={(point: object) => setSelected(point as MarkerType)}
        width={typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.48, 640) : 560}
        height={480}
        enablePointerInteraction
      />

      {/* Info panel */}
      {selected && (
        <motion.div
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            width: 220,
            padding: '1.125rem',
            borderRadius: '1rem',
            background: 'rgba(5,8,22,0.9)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(24px)',
          }}
          initial={{ opacity: 0, scale: 0.92, x: 12 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>{selected.label}</h4>
            <button
              onClick={() => setSelected(null)}
              style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
            >✕</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Lat</span>
              <span style={{ fontSize: '0.75rem', color: '#38D1F0', fontFamily: 'monospace' }}>{selected.lat.toFixed(2)}°</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Lng</span>
              <span style={{ fontSize: '0.75rem', color: '#38D1F0', fontFamily: 'monospace' }}>{selected.lng.toFixed(2)}°</span>
            </div>
          </div>

          {selected.type === 'iss' ? (
            <div style={{ marginTop: '0.875rem', padding: '0.625rem', borderRadius: '0.625rem', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.6875rem', color: '#38D1F0' }}>International Space Station</p>
              <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>Alt: ~408 km • Speed: 7.66 km/s</p>
            </div>
          ) : (
            <button
              onClick={() => setSelected(null)}
              style={{
                width: '100%',
                marginTop: '0.875rem',
                padding: '0.5rem',
                borderRadius: '0.625rem',
                background: 'rgba(124,58,237,0.15)',
                border: '1px solid rgba(124,58,237,0.3)',
                color: '#C4B5FD',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Set as Observation Point
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}

const FEATURES_LIST = [
  '🛸 ISS position updated every 5 seconds',
  '🛰️ 8,000+ active satellite tracks',
  '📍 Click any point to explore its sky',
  '🌍 Real-time day/night cycle',
];

export default function GlobeSection() {
  return (
    <section className="globe-section" id="globe">
      <div className="glow-blob" style={{ width: 600, height: 600, top: '20%', left: '-8%', background: 'radial-gradient(circle, rgba(124,58,237,0.08), transparent 65%)' }} />
      <div className="glow-blob" style={{ width: 400, height: 400, bottom: '5%', right: '-5%', background: 'radial-gradient(circle, rgba(6,182,212,0.07), transparent 65%)' }} />

      <div className="section-container">
        <div className="globe-grid">
          {/* Text */}
          <motion.div
            className="globe-text-col"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="section-eyebrow">Interactive Globe</span>
            <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
              Every point on Earth,{' '}
              <span className="gradient-span">the sky above it.</span>
            </h2>
            <p style={{ fontSize: '1.0625rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, marginBottom: '2rem' }}>
              Click any location on the interactive globe to instantly recalculate
              the celestial sphere above it. The ISS is tracked live every 5 seconds.
            </p>

            <ul className="globe-features-list">
              {FEATURES_LIST.map(item => (
                <li key={item} className="globe-feature-item">
                  <div className="globe-feature-dot" />
                  {item}
                </li>
              ))}
            </ul>

            <button className="btn-ghost">
              Open Full Globe →
            </button>
          </motion.div>

          {/* Globe */}
          <motion.div
            className="globe-canvas-col"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{ position: 'relative' }}>
              {/* Glow ring behind globe */}
              <div style={{
                position: 'absolute',
                inset: -32,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(124,58,237,0.2), transparent 65%)',
                filter: 'blur(24px)',
                pointerEvents: 'none',
              }} />
              <Suspense fallback={
                <div style={{ width: 560, height: 480, borderRadius: '1rem', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>Loading globe...</p>
                </div>
              }>
                <GlobeInner />
              </Suspense>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
