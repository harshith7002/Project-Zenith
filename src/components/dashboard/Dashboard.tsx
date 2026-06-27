'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import * as Astronomy from 'astronomy-engine';
import * as satellite from 'satellite.js';
import { FALLBACK_TLE_DATA } from '@/lib/tleData';

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn("localStorage is not accessible", e);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn("localStorage is not accessible", e);
    }
  }
};

interface ZenithPerfMetrics {
  clickTime: number;
  geoTime: number;
  weatherTime: number;
  astronomyTime: number;
  sgpTime: number;
  aiTime: number;
}

interface ISSData {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
}

interface VisibleObject {
  name: string;
  type: string;
  altitude: number;
  azimuth: number;
  icon: string;
}

interface VisibleSatellite {
  name: string;
  type: string;
  altitude: number;
  azimuth: number;
  latitude: number;
  longitude: number;
  height: number;
  icon: string;
}

interface ISSPass {
  riseTime: Date;
  peakTime: Date;
  peakElevation: number;
  durationSeconds: number;
}

interface SkyQualityScoreCardProps {
  cloudCover: number;
  setCloudCover: (v: number) => void;
  humidity: number;
  setHumidity: (v: number) => void;
  bortle: number;
  setBortle: (v: number) => void;
  moonBrightness: number;
  setMoonBrightness: (v: number) => void;
  astronomyScore: number;
  condition: string;
  color: string;
  weatherLoading: boolean;
}

interface AISpaceGuideCardProps {
  observerCoords: { lat: number; lng: number; label: string };
  cloudCover: number;
  humidity: number;
  bortle: number;
  moonBrightness: number;
  astronomyScore: number;
  condition: string;
  combinedVisible: (VisibleObject | VisibleSatellite)[];
  issNextPass: ISSPass | null;
  issCountdown: number;
}

interface CosmicEventPredictorCardProps {
  timers: { iss: number; meteor: number; alignment: number; eclipse: number };
  observerLabel: string;
}

// Major stars catalog with J2000 RA and Dec (converted to hours for RA)
const MAJOR_STARS = [
  { name: 'Sirius', type: 'Star', ra: 101.287 / 15, dec: -16.716, icon: '✨' },
  { name: 'Vega', type: 'Star', ra: 279.234 / 15, dec: 38.784, icon: '✨' },
  { name: 'Betelgeuse', type: 'Star', ra: 88.792 / 15, dec: 7.407, icon: '🔴' },
  { name: 'Rigel', type: 'Star', ra: 78.634 / 15, dec: -8.201, icon: '✨' },
  { name: 'Polaris', type: 'Star', ra: 37.953 / 15, dec: 89.264, icon: '⭐' },
  { name: 'Capella', type: 'Star', ra: 79.172 / 15, dec: 45.998, icon: '✨' },
  { name: 'Arcturus', type: 'Star', ra: 213.915 / 15, dec: 19.182, icon: '✨' },
  { name: 'Aldebaran', type: 'Star', ra: 68.98 / 15, dec: 16.509, icon: '✨' },
  { name: 'Altair', type: 'Star', ra: 297.695 / 15, dec: 8.868, icon: '✨' },
  { name: 'Antares', type: 'Star', ra: 247.351 / 15, dec: -26.432, icon: '🔴' },
];

const CONSTELLATIONS = [
  { name: 'Orion', type: 'Constellation', ra: 88.79 / 15, dec: 7.41, icon: '🌌' },
  { name: 'Ursa Major', type: 'Constellation', ra: 165.0 / 15, dec: 55.0, icon: '🌌' },
  { name: 'Cassiopeia', type: 'Constellation', ra: 15.0 / 15, dec: 60.0, icon: '🌌' },
  { name: 'Cygnus', type: 'Constellation', ra: 308.3 / 15, dec: 42.3, icon: '🌌' },
  { name: 'Leo', type: 'Constellation', ra: 160.0 / 15, dec: 12.0, icon: '🌌' },
  { name: 'Scorpius', type: 'Constellation', ra: 250.0 / 15, dec: -26.0, icon: '🌌' },
];

// Heuristic to estimate Bortle light pollution index based on major cities proximity
function getEstimatedBortle(lat: number, lng: number): number {
  const CITY_BORTLES = [
    { lat: 28.6139, lng: 77.2090, bortle: 8 },  // New Delhi
    { lat: 40.7128, lng: -74.0060, bortle: 8 }, // New York
    { lat: 51.5074, lng: -0.1278, bortle: 8 },  // London
    { lat: 35.6762, lng: 139.6503, bortle: 9 }, // Tokyo
    { lat: -33.8688, lng: 151.2093, bortle: 7 }, // Sydney
    { lat: -1.2921, lng: 36.8219, bortle: 6 },  // Nairobi
    { lat: 21.1458, lng: 79.0882, bortle: 5 },  // Nagpur
  ];

  let minDistance = Infinity;
  let closestBortle = 4; // default suburban

  for (const city of CITY_BORTLES) {
    const d = Math.sqrt((city.lat - lat) ** 2 + (city.lng - lng) ** 2);
    if (d < minDistance) {
      minDistance = d;
      closestBortle = city.bortle;
    }
  }

  // If far away from city centers
  if (minDistance > 3.0) {
    return 2; // dark sky
  }
  return closestBortle;
}

// SGP4 TLE orbital propagation wrapper using satellite.js
function propagateTLE(tleLine1: string, tleLine2: string, date: Date, obsLat: number, obsLng: number) {
  try {
    const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
    const positionAndVelocity = satellite.propagate(satrec, date);
    if (!positionAndVelocity || !positionAndVelocity.position || typeof positionAndVelocity.position === 'boolean') {
      return null;
    }
    
    const pos = positionAndVelocity.position;
    const gmst = satellite.gstime(date);
    const observerGd = {
      latitude: satellite.degreesToRadians(obsLat),
      longitude: satellite.degreesToRadians(obsLng),
      height: 0.1 // km
    };
    
    const positionEcf = satellite.eciToEcf(pos, gmst);
    const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);
    
    const elevation = satellite.radiansToDegrees(lookAngles.elevation);
    const azimuth = satellite.radiansToDegrees(lookAngles.azimuth);
    
    const positionGd = satellite.eciToGeodetic(pos, gmst);
    const satLat = satellite.radiansToDegrees(positionGd.latitude);
    const satLng = satellite.radiansToDegrees(positionGd.longitude);
    const satAlt = positionGd.height; // km

    return {
      elevation,
      azimuth,
      latitude: satLat,
      longitude: satLng,
      altitude: satAlt
    };
  } catch (err) {
    console.error("TLE propagation error", err);
    return null;
  }
}

// Predicts next ISS pass in 24 hour window
function predictNextISSPass(obsLat: number, obsLng: number, tleLine1: string, tleLine2: string) {
  try {
    const observer = {
      latitude: satellite.degreesToRadians(obsLat),
      longitude: satellite.degreesToRadians(obsLng),
      height: 0 // km
    };
    
    const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
    const now = new Date();
    
    let passStart: Date | null = null;
    let passPeak: Date | null = null;
    let maxElevation = -90;
    let passEnd: Date | null = null;
    
    // Step in 5-minute increments first to locate candidates
    for (let minutes = 0; minutes < 1440; minutes += 5) {
      const checkTime = new Date(now.getTime() + minutes * 60 * 1000);
      const posVal = satellite.propagate(satrec, checkTime);
      if (!posVal || !posVal.position || typeof posVal.position === 'boolean') continue;
      const pos = posVal.position;
      const gmst = satellite.gstime(checkTime);
      const posEcf = satellite.eciToEcf(pos, gmst);
      const look = satellite.ecfToLookAngles(observer, posEcf);
      const el = satellite.radiansToDegrees(look.elevation);
      
      if (el > 2) { // Candidate found
        const t = checkTime.getTime();
        const step = 15 * 1000; // 15 seconds refinement
        
        // Scan backward to find the exact rise (crossing 0 degrees)
        let checkT = t;
        let currentEl = el;
        while (currentEl > 0 && checkT > now.getTime()) {
          checkT -= step;
          const posValCheck = satellite.propagate(satrec, new Date(checkT));
          if (!posValCheck || !posValCheck.position || typeof posValCheck.position === 'boolean') break;
          const posCheck = posValCheck.position;
          const g = satellite.gstime(new Date(checkT));
          const lookAngles = satellite.ecfToLookAngles(observer, satellite.eciToEcf(posCheck, g));
          currentEl = satellite.radiansToDegrees(lookAngles.elevation);
        }
        passStart = new Date(checkT);
        
        // Scan forward to find peak elevation and end of pass
        checkT = t;
        currentEl = el;
        while (currentEl > 0 && checkT < now.getTime() + 24 * 3600 * 1000) {
          checkT += step;
          const posValCheck = satellite.propagate(satrec, new Date(checkT));
          if (!posValCheck || !posValCheck.position || typeof posValCheck.position === 'boolean') break;
          const posCheck = posValCheck.position;
          const g = satellite.gstime(new Date(checkT));
          const lookAngles = satellite.ecfToLookAngles(observer, satellite.eciToEcf(posCheck, g));
          currentEl = satellite.radiansToDegrees(lookAngles.elevation);
          if (currentEl > maxElevation) {
            maxElevation = currentEl;
            passPeak = new Date(checkT);
          }
        }
        passEnd = new Date(checkT);
        
        if (passStart && passEnd && passPeak && maxElevation > 10) {
          return {
            riseTime: passStart,
            peakTime: passPeak,
            peakElevation: maxElevation,
            durationSeconds: Math.round((passEnd.getTime() - passStart.getTime()) / 1000)
          };
        }
      }
    }
  } catch (err) {
    console.error("Pass prediction error", err);
  }
  return null;
}

// Wrapper to track mouse and assign CSS variables for glowing glassmorphism spotlight
function GlassSpotlightCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);

  const handleMouseEnter = () => {
    if (cardRef.current) {
      rectRef.current = cardRef.current.getBoundingClientRect();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card || !rectRef.current) return;
    const rect = rectRef.current;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      className={`dashboard-card glass-card ${className}`}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
    >
      {/* Top light bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '10%',
        right: '10%',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.4), rgba(6, 182, 212, 0.4), transparent)',
        zIndex: 2,
        pointerEvents: 'none'
      }} />
      <div style={{ position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

// Smooth numeric count interpolator (so telemetry slides smoothly when updated every 5s)
function DashboardValueCounter({ value, decimals = 1, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    let active = true;
    const startTime = performance.now();
    const startVal = prevValue.current;
    const endVal = value;
    const duration = 800; // animate over 800ms

    const animate = (now: number) => {
      if (!active) return;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      const eased = 1.0 - Math.pow(1.0 - progress, 3.0); // cubic ease out
      const current = startVal + (endVal - startVal) * eased;
      
      setDisplayValue(current);

      if (progress < 1.0) {
        requestAnimationFrame(animate);
      } else {
        prevValue.current = endVal;
      }
    };

    requestAnimationFrame(animate);
    return () => { active = false; };
  }, [value]);

  return <span style={{ fontFamily: 'monospace' }}>{displayValue.toFixed(decimals)}{suffix}</span>;
}

// Radar SVG widget displaying real satellites
function RadarWidget({ satellites }: { satellites: VisibleSatellite[] }) {
  const [hoveredSat, setHoveredSat] = useState<VisibleSatellite | null>(null);

  const blips = satellites.map((sat) => {
    const el = sat.altitude;
    const az = sat.azimuth;
    // Map polar coordinates to Cartesian SVG space
    // Center is 100, 100. Horizon radius is 90.
    const d = 90 * (90 - el) / 90;
    const thetaRad = (az * Math.PI) / 180;
    const cx = 100 + d * Math.sin(thetaRad);
    const cy = 100 - d * Math.cos(thetaRad);

    // Color based on satellite type
    let color = '#7C3AED'; // default ISS (violet)
    if (sat.type === 'GPS') color = '#06B6D4';     // cyan
    if (sat.type === 'Weather') color = '#F59E0B'; // amber
    if (sat.type === 'Starlink') color = '#10B981'; // green
    if (sat.type === 'Nav') color = '#EF4444';      // red

    return {
      cx,
      cy,
      color,
      r: sat.name.includes('ISS') ? 4 : 3,
      label: sat.name.split(' ')[0],
      sat
    };
  });

  return (
    <div style={{ position: 'relative', width: 190, height: 190, margin: '0.5rem auto' }}>
      {hoveredSat && (
        <div style={{
          position: 'absolute',
          top: '-2.75rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(5, 8, 22, 0.95)',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          borderRadius: '0.5rem',
          padding: '0.35rem 0.55rem',
          fontSize: '0.625rem',
          zIndex: 40,
          color: '#fff',
          boxShadow: '0 0 10px rgba(6, 182, 212, 0.2)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.05rem',
          textAlign: 'center'
        }}>
          <strong style={{ color: '#06B6D4' }}>{hoveredSat.name}</strong>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>
            Alt: {hoveredSat.height.toFixed(0)} km | Vel: {Math.sqrt(398600.44 / (6371 + hoveredSat.height)).toFixed(2)} km/s
          </span>
        </div>
      )}

      <svg viewBox="0 0 200 200" width="100%" height="100%">
        <defs>
          <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.08" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="90" fill="url(#radarGrad)" stroke="rgba(124,58,237,0.2)" strokeWidth="1" />
        <circle cx="100" cy="100" r="67" fill="none" stroke="rgba(124,58,237,0.12)" strokeWidth="1" />
        <circle cx="100" cy="100" r="44" fill="none" stroke="rgba(124,58,237,0.1)" strokeWidth="1" />
        <circle cx="100" cy="100" r="22" fill="none" stroke="rgba(124,58,237,0.08)" strokeWidth="1" />
        <line x1="10" y1="100" x2="190" y2="100" stroke="rgba(124,58,237,0.12)" strokeWidth="1" />
        <line x1="100" y1="10" x2="100" y2="190" stroke="rgba(124,58,237,0.12)" strokeWidth="1" />

        {/* Sweep line */}
        <motion.line
          x1="100" y1="100" x2="190" y2="100"
          stroke="rgba(6,182,212,0.85)" strokeWidth="1.5"
          animate={{ rotate: 360 }}
          transition={{ duration: 4.0, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '100px', originY: '100px' }}
        />

        {/* Blips */}
        {blips.map((b, i) => (
          <g 
            key={i}
            onMouseEnter={() => setHoveredSat(b.sat)}
            onMouseLeave={() => setHoveredSat(null)}
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          >
            <circle cx={b.cx} cy={b.cy} r={b.r} fill={b.color} opacity="0.9" />
            <circle cx={b.cx} cy={b.cy} r={b.r}>
              <animate attributeName="r" from={b.r} to={b.r * 4.0} dur={`${1.6 + i * 0.4}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.5" to="0" dur={`${1.6 + i * 0.4}s`} repeatCount="indefinite" />
              <animate attributeName="fill" from={b.color} to={b.color} dur="0s" />
            </circle>
          </g>
        ))}
      </svg>
    </div>
  );
}

function ISSCard({ data, countdownText }: { data: ISSData | null; countdownText: string }) {
  const values = {
    altitude: data ? data.altitude : 408.3,
    velocity: data ? data.velocity / 1000 : 7.66,
    latitude: data ? data.latitude : 32.40,
    longitude: data ? data.longitude : 74.20
  };

  const rows = [
    { icon: '📡', label: 'Altitude', value: values.altitude, suffix: ' km', decimals: 1 },
    { icon: '⚡', label: 'Velocity', value: values.velocity, suffix: ' km/s', decimals: 2 },
    { icon: '🌐', label: 'Latitude', value: values.latitude, suffix: '°', decimals: 2 },
    { icon: '📍', label: 'Longitude', value: values.longitude, suffix: '°', decimals: 2 },
  ];

  return (
    <GlassSpotlightCard>
      <div className="dashboard-card-header">
        <span className="dashboard-card-icon">🛸</span>
        <div>
          <h3 className="dashboard-card-title">ISS Tracker</h3>
          <div className="live-indicator" style={{ display: 'inline-flex', marginTop: '0.25rem', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', background: 'rgba(74,222,128,0.1)' }}>
            <span className="live-dot" />
            <span style={{ fontSize: '0.625rem', color: '#4ADE80', fontWeight: 700 }}>LIVE</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {rows.map(row => (
          <div key={row.label} className="dashboard-data-row">
            <span className="dashboard-data-label">{row.icon} {row.label}</span>
            <span className="dashboard-data-value" style={{ color: '#A78BFA', fontWeight: 700 }}>
              <DashboardValueCounter value={row.value} decimals={row.decimals} suffix={row.suffix} />
            </span>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: '1.25rem',
        padding: '0.75rem',
        borderRadius: '0.75rem',
        background: 'rgba(124,58,237,0.06)',
        border: '1px solid rgba(124,58,237,0.15)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '0.75rem', color: '#C4B5FD' }}>🕐 {countdownText}</p>
      </div>
    </GlassSpotlightCard>
  );
}

function SkyQualityScoreCard({ 
  cloudCover, setCloudCover,
  humidity, setHumidity,
  bortle, setBortle,
  moonBrightness, setMoonBrightness,
  astronomyScore, color,
  weatherLoading
}: SkyQualityScoreCardProps) {
  const [showScoreInfo, setShowScoreInfo] = useState(false);

  return (
    <GlassSpotlightCard>
      <div className="dashboard-card-header">
        <span className="dashboard-card-icon">🌤️</span>
        <div>
          <h3 className="dashboard-card-title">Sky Quality Score</h3>
          <span style={{ fontSize: '0.625rem', color: '#A78BFA', fontWeight: 600 }}>Real-Time Calculator</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center' }}>
        {/* Cloud Cover Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>☁️ Cloud Cover</span>
            <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600 }}>
              {weatherLoading ? <span className="text-cyan-400 animate-pulse">Loading...</span> : `${cloudCover}%`}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={cloudCover}
            onChange={(e) => setCloudCover(Number(e.target.value))}
            className="range-slider"
          />
        </div>

        {/* Humidity Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>💧 Humidity</span>
            <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600 }}>
              {weatherLoading ? <span className="text-cyan-400 animate-pulse">Loading...</span> : `${humidity}%`}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={humidity}
            onChange={(e) => setHumidity(Number(e.target.value))}
            className="range-slider"
          />
        </div>

        {/* Light Pollution Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>🌃 Light Pollution (Bortle)</span>
            <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600 }}>Class {bortle}</span>
          </div>
          <input
            type="range"
            min="1"
            max="9"
            value={bortle}
            onChange={(e) => setBortle(Number(e.target.value))}
            className="range-slider"
          />
        </div>

        {/* Moon Brightness Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>🌙 Moon Brightness</span>
            <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600 }}>{moonBrightness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={moonBrightness}
            onChange={(e) => setMoonBrightness(Number(e.target.value))}
            className="range-slider"
          />
        </div>
      </div>

      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', alignItems: 'center', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Observation Quality</span>
            <div 
              onMouseEnter={() => setShowScoreInfo(true)}
              onMouseLeave={() => setShowScoreInfo(false)}
              style={{
                fontSize: '0.625rem',
                color: 'rgba(255,255,255,0.35)',
                cursor: 'help',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '50%',
                width: '13px',
                height: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                pointerEvents: 'auto'
              }}
            >
              ⓘ
            </div>

            {showScoreInfo && (
              <div style={{
                position: 'absolute',
                bottom: '1.75rem',
                left: '0',
                width: '210px',
                background: 'rgba(5, 8, 22, 0.95)',
                border: '1px solid rgba(124, 58, 237, 0.4)',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.75rem',
                fontSize: '0.6875rem',
                zIndex: 40,
                color: 'rgba(255,255,255,0.9)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
                lineHeight: '1.25'
              }}>
                <strong style={{ color: '#C4B5FD', display: 'block', marginBottom: '0.15rem' }}>Viewing Formula Breakdown:</strong>
                <div>• Cloud Cover: <span style={{ color: '#EF4444' }}>-{Math.round(cloudCover * 0.45)}</span> points</div>
                <div>• Humidity (ideal &lt;40%): <span style={{ color: '#EF4444' }}>-{Math.round(Math.max(0, humidity - 40) * 0.25)}</span> points</div>
                <div>• Light Pollution: <span style={{ color: '#EF4444' }}>-{Math.round((bortle - 1) * 6.0)}</span> points</div>
                <div>• Moon Glow: <span style={{ color: '#EF4444' }}>-{Math.round(moonBrightness * 0.2)}</span> points</div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '0.25rem', paddingTop: '0.25rem', fontWeight: 'bold' }}>
                  Total Deduction: <span style={{ color: '#F59E0B' }}>-{100 - astronomyScore}</span> points
                </div>
              </div>
            )}
          </div>
          <span style={{ fontSize: '0.9375rem', color: '#fff', fontWeight: 800 }}>
            Score: <span style={{ color }}>{astronomyScore}</span>/100
          </span>
        </div>
        <div className="progress-bar-track" style={{ marginBottom: '0.375rem', background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="progress-bar-fill"
            style={{ width: `${astronomyScore}%`, background: `linear-gradient(90deg, #7C3AED, ${color})`, transition: 'width 0.2s ease' }}
          />
        </div>
        <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 1.3, marginBottom: '0.35rem' }}>
          Estimated observation quality derived from cloud cover, humidity, moon illumination, and an approximate light-pollution model.
        </p>
      </div>
    </GlassSpotlightCard>
  );
}

function SkyChart({ objects }: { objects: VisibleObject[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 150, 150);

    ctx.beginPath();
    ctx.arc(75, 75, 68, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(5, 8, 22, 0.6)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(124, 58, 237, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', 75, 12);
    ctx.fillText('S', 75, 138);
    ctx.fillText('E', 138, 75);
    ctx.fillText('W', 12, 75);

    ctx.beginPath();
    ctx.arc(75, 75, 45, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(124, 58, 237, 0.1)';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(75, 75, 22, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(75, 75, 1.5, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.fill();

    const visibleConstellations = objects.filter(o => o.type === 'Constellation');

    const constellationsStars: Record<string, { dx: number; dy: number }[]> = {
      'Ursa Major': [
        { dx: -20, dy: -10 }, { dx: -10, dy: -12 }, { dx: 0, dy: -5 },
        { dx: 5, dy: 5 }, { dx: 15, dy: 5 }, { dx: 15, dy: 15 },
        { dx: 5, dy: 15 }, { dx: 5, dy: 5 }
      ],
      'Orion': [
        { dx: -10, dy: -15 }, { dx: 10, dy: -15 },
        { dx: -5, dy: 0 }, { dx: 0, dy: 0 }, { dx: 5, dy: 0 },
        { dx: -8, dy: 15 }, { dx: 8, dy: 15 },
        { dx: -10, dy: -15 }, { dx: -8, dy: 15 },
        { dx: 10, dy: -15 }, { dx: 8, dy: 15 }
      ],
      'Cassiopeia': [
        { dx: -15, dy: -5 }, { dx: -7, dy: 5 }, { dx: 0, dy: -5 },
        { dx: 7, dy: 5 }, { dx: 15, dy: -5 }
      ],
      'Taurus': [
        { dx: -12, dy: -10 }, { dx: -4, dy: -2 }, { dx: 4, dy: 2 },
        { dx: 12, dy: 10 }, { dx: 4, dy: 2 }, { dx: 0, dy: 10 }
      ],
      'Leo': [
        { dx: -15, dy: 5 }, { dx: -5, dy: 5 }, { dx: 5, dy: 0 },
        { dx: 10, dy: -10 }, { dx: 5, dy: -15 }, { dx: 0, dy: -10 },
        { dx: -5, dy: 5 }, { dx: -10, dy: -10 }
      ],
      'Cygnus': [
        { dx: 0, dy: -15 }, { dx: 0, dy: 15 },
        { dx: -15, dy: 0 }, { dx: 15, dy: 0 }
      ],
      'Pegasus': [
        { dx: -10, dy: -10 }, { dx: 10, dy: -10 },
        { dx: 10, dy: 10 }, { dx: -10, dy: 10 },
        { dx: -10, dy: -10 }
      ]
    };

    visibleConstellations.forEach(c => {
      const alt = c.altitude;
      const az = c.azimuth;
      const r = 60 * (90 - alt) / 90;
      const rad = (az * Math.PI) / 180;
      const cx = 75 + r * Math.sin(rad);
      const cy = 75 - r * Math.cos(rad);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '6px monospace';
      ctx.fillText(c.name, cx, cy - 8);

      const stars = constellationsStars[c.name] || [
        { dx: -5, dy: -5 }, { dx: 5, dy: -5 }, { dx: 5, dy: 5 }, { dx: -5, dy: 5 }
      ];

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1;
      stars.forEach((star, idx) => {
        const sx = cx + star.dx * 0.45;
        const sy = cy + star.dy * 0.45;
        if (idx === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.stroke();

      stars.forEach(star => {
        const sx = cx + star.dx * 0.45;
        const sy = cy + star.dy * 0.45;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.2, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
      });
    });
  }, [objects]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
      <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.45)', fontWeight: 650, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        🌌 Constellation Overlay
      </span>
      <canvas 
        ref={canvasRef} 
        width={150} 
        height={150} 
        style={{ 
          background: 'radial-gradient(circle, rgba(12,10,32,0.6) 0%, rgba(3,2,10,0.9) 100%)',
          borderRadius: '50%',
          border: '1px solid rgba(124, 58, 237, 0.2)' 
        }} 
      />
    </div>
  );
}

function VisibleObjectsCard({ objects }: { objects: VisibleObject[] }) {
  const displayObjects = objects.slice(0, 5);

  return (
    <GlassSpotlightCard>
      <div className="dashboard-card-header">
        <span className="dashboard-card-icon">🔭</span>
        <h3 className="dashboard-card-title">Visible Now</h3>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem', justifyContent: 'center' }}>
        {displayObjects.length > 0 ? (
          displayObjects.map((obj, i) => (
            <motion.div
              key={obj.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.625rem',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                transition: 'all 0.2s',
              }}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ backgroundColor: 'rgba(124, 58, 237, 0.08)', borderColor: 'rgba(124, 58, 237, 0.2)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{ fontSize: '1.125rem' }}>{obj.icon}</span>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>{obj.name}</p>
                  <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)' }}>{obj.type}</p>
                </div>
              </div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#38D1F0', fontFamily: 'monospace' }}>
                {Math.round(obj.altitude)}°
              </span>
            </motion.div>
          ))
        ) : (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
            No prominent bodies above the horizon.
          </div>
        )}
      </div>

      <SkyChart objects={objects} />
    </GlassSpotlightCard>
  );
}

function SatelliteRadarCard({ satellites }: { satellites: VisibleSatellite[] }) {
  const legend = [
    { color: '#7C3AED', label: 'ISS' },
    { color: '#06B6D4', label: 'GPS' },
    { color: '#F59E0B', label: 'Weather' },
    { color: '#10B981', label: 'Starlink' },
    { color: '#EF4444', label: 'Nav' },
  ];

  return (
    <GlassSpotlightCard>
      <div className="dashboard-card-header">
        <span className="dashboard-card-icon">🛰️</span>
        <h3 className="dashboard-card-title">Satellite Radar</h3>
      </div>

      <RadarWidget satellites={satellites} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', marginTop: '0.5rem', justifyContent: 'center' }}>
        {legend.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.45)' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </GlassSpotlightCard>
  );
}

function AISpaceGuideCard({ 
  observerCoords, cloudCover, humidity, 
  bortle, moonBrightness, astronomyScore, 
  combinedVisible, issNextPass, issCountdown 
}: AISpaceGuideCardProps) {
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([
    { sender: 'bot', text: 'Hello! I am your AI Space Guide. Ask me anything about what is visible in the sky above you right now.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [aiPlaceholder, setAiPlaceholder] = useState('Ask your AI guide...');

  useEffect(() => {
    const placeholders = [
      "Ask about tonight's sky...",
      "When is the ISS visible?",
      "Which planets are overhead?",
      "Is tonight good for observation?"
    ];
    const randomIndex = Math.floor(Math.random() * placeholders.length);
    setAiPlaceholder(placeholders[randomIndex]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    // Generate initial bot greeting message once when data becomes available
    const generateWelcomeMessage = () => {
      const startAi = performance.now();
      const loc = observerCoords.label;
      const score = astronomyScore;
      
      const visiblePlanets = combinedVisible.filter((o) => o.type === 'Planet');
      const visibleStars = combinedVisible.filter((o) => o.type === 'Star');
      const visibleConsts = combinedVisible.filter((o) => o.type === 'Constellation');
      
      let pText = '';
      if (visiblePlanets.length > 0) {
        pText = `${visiblePlanets[0].name} is visible at ${visiblePlanets[0].altitude.toFixed(0)}° altitude. `;
      } else {
        pText = 'No major planets are currently visible. ';
      }
      
      const objectsList: string[] = [];
      visibleConsts.slice(0, 2).forEach(c => objectsList.push(c.name));
      visibleStars.slice(0, 3).forEach(s => objectsList.push(s.name));
      
      const skyObjectsText = objectsList.length > 0 
        ? `${objectsList.join(', ')} are above the horizon. ` 
        : '';
        
      const issText = issNextPass 
        ? `The ISS is expected to pass overhead in ${Math.floor(issCountdown / 3600)}h ${Math.floor((issCountdown % 3600) / 60)}m.` 
        : 'No visible ISS passes expected tonight.';

      const summary = `Current Sky Summary:\nFrom ${loc}, ${pText}${skyObjectsText}Cloud cover is ${cloudCover}% with humidity at ${humidity}%, giving an estimated observation score of ${score}/100. ${issText}`;
      
      setMessages([
        { sender: 'bot', text: 'Hello! I am your AI Space Guide. Ask me anything about what is visible in the sky above you right now.' },
        { sender: 'bot', text: summary }
      ]);

      if (typeof window !== 'undefined') {
        const perf = (window as unknown as { __zenith_perf?: ZenithPerfMetrics }).__zenith_perf;
        if (perf && perf.clickTime > 0) {
          perf.aiTime = performance.now() - startAi;
          console.log(`[Perf] AI Guide welcome text generation: ${perf.aiTime.toFixed(2)}ms`);
          console.timeEnd("Total Use My Location Flow");
          const totalTime = performance.now() - perf.clickTime;
          
          console.log(`[Visual Log] [${totalTime.toFixed(2)}ms] AI Summary Updated: Greeting text complete`);
          console.log(`[Visual Log] [${totalTime.toFixed(2)}ms] DASHBOARD READY`);
          
          console.log("==================================================");
          console.log("📡 USER METRICS: USE MY LOCATION TELEMETRY SCORECARD");
          console.log("--------------------------------------------------");
          console.log(`⏱️ 1. Geolocation API Latency : ${(perf.geoTime - perf.clickTime).toFixed(2)}ms`);
          console.log(`🗺️ 2. Reverse Geocoding Time  : 0.00ms (Local)`);
          console.log(`☁️ 3. Open-Meteo Weather Fetch : ${perf.weatherTime > 0 ? perf.weatherTime.toFixed(2) + 'ms' : '0.00ms (Cached)'}`);
          console.log(`🌌 4. Astronomy Calculations   : ${perf.astronomyTime.toFixed(2)}ms`);
          console.log(`🛰️ 5. SGP4 Satellite Prop      : ${perf.sgpTime.toFixed(2)}ms`);
          console.log(`🧠 6. AI Space Guide Gen      : ${perf.aiTime.toFixed(2)}ms`);
          console.log("--------------------------------------------------");
          console.log(`🔥 TOTAL DASHBOARD UPDATE TIME : ${totalTime.toFixed(2)}ms`);
          console.log("==================================================");
          
          // Clear clickTime to avoid double logs
          perf.clickTime = 0;
        }
      }
    };

    if (combinedVisible.length > 0) {
      generateWelcomeMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observerCoords.label, combinedVisible.length]);

  const generateGuideResponse = (question: string) => {
    const q = question.toLowerCase();
    const loc = observerCoords.label;
    const score = astronomyScore;
    
    // Extract visible categories
    const visiblePlanets = combinedVisible.filter((o) => o.type === 'Planet');
    const visibleStars = combinedVisible.filter((o) => o.type === 'Star');
    const visibleSats = combinedVisible.filter((o) => o.type !== 'Planet' && o.type !== 'Star' && o.type !== 'Natural Satellite' && o.type !== 'Constellation');

    let reply = '';

    if (q.includes('see') || q.includes('seeing') || q.includes('above me') || q.includes('look up') || q.includes('now') || q.includes('visible')) {
      const pText = visiblePlanets.length > 0
        ? `planets ${visiblePlanets.map((p) => `${p.name} (${p.altitude.toFixed(0)}°)`).join(', ')}`
        : 'no major planets';
      const sText = visibleStars.length > 0
        ? `stars like ${visibleStars.slice(0, 3).map((s) => `${s.name} (${s.altitude.toFixed(0)}°)`).join(', ')}`
        : 'no catalogued major stars';
      const satText = visibleSats.length > 0
        ? `tracking ${visibleSats.length} satellites overhead (including ${visibleSats[0].name})`
        : 'no visible satellites';

      reply = `Observing from ${loc}, sky quality is currently ${score}/100. Overhead you can see ${pText}, and ${sText}. Our radar is also ${satText}.`;
    } 
    else if (q.includes('iss') || q.includes('space station') || q.includes('flyover') || q.includes('pass')) {
      const issObj = visibleSats.find((s) => s.name.includes('ISS'));
      if (issObj) {
        reply = `The ISS is visible directly overhead right now at an altitude of ${issObj.altitude.toFixed(1)}° (Azimuth: ${issObj.azimuth.toFixed(0)}°). Spot it as a bright white dot crossing the sky!`;
      } else if (issNextPass) {
        const timeStr = issNextPass.riseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const remainingMin = Math.round(issCountdown / 60);
        reply = `The ISS is currently below the horizon. The next visible flyover will occur in ${remainingMin} minutes (at ${timeStr} local time), reaching a peak altitude of ${issNextPass.peakElevation.toFixed(0)}° and lasting ${Math.floor(issNextPass.durationSeconds / 60)}m ${issNextPass.durationSeconds % 60}s.`;
      } else {
        reply = `No visible ISS passes predicted for ${loc} over the next 24 hours. The orbit is currently not crossing your zenith.`;
      }
    } 
    else if (q.includes('weather') || q.includes('cloud') || q.includes('condition') || q.includes('humidity') || q.includes('pollution') || q.includes('bortle') || q.includes('tonight') || q.includes('observing') || q.includes('observe')) {
      let advice = '';
      if (score >= 80) advice = 'Observations will be crystal clear. Perfect night for stargazing!';
      else if (score >= 50) advice = 'Skies are fair. Good for observing bright planets or the Moon.';
      else advice = 'High cloud cover or humidity. Conditions are sub-optimal.';
      
      reply = `Atmospheric profile for ${loc}: Cloud cover is ${cloudCover}%, humidity is ${humidity}%, moon brightness is ${moonBrightness}%, and light pollution is estimated at Bortle Class ${bortle}. ${advice}`;
    } 
    else if (q.includes('constellation')) {
      const visibleConsts = combinedVisible.filter((o) => o.type === 'Constellation');
      if (visibleConsts.length > 0) {
        reply = `Overhead constellations currently visible from ${loc} include: ${visibleConsts.slice(0, 4).map(c => c.name).join(', ')}. The most prominent one is ${visibleConsts[0].name}.`;
      } else {
        reply = `No major constellations are catalogued above your horizon at this moment.`;
      }
    }
    else if (q.includes('brightest') || q.includes('bright')) {
      if (visiblePlanets.some(p => p.name === 'Venus')) {
        reply = `The brightest planet visible in the sky right now is Venus. It is glowing intensely at magnitude -4.4 and can be seen easily in the twilight.`;
      } else if (visiblePlanets.some(p => p.name === 'Jupiter')) {
        reply = `The brightest planet visible in your sky right now is Jupiter. It is shining brightly at magnitude -2.5 and is high above the horizon.`;
      } else if (visibleStars.length > 0) {
        reply = `The brightest star above your horizon right now is ${visibleStars[0].name}. It stands out clearly against the other deep-sky catalogued elements.`;
      } else {
        reply = `The Moon is currently the brightest object visible in the night sky.`;
      }
    }
    else if (q.includes('mars')) {
      const m = visiblePlanets.find((p) => p.name === 'Mars');
      reply = m 
        ? `Mars is visible above the horizon (Alt: ${m.altitude.toFixed(0)}°, Az: ${m.azimuth.toFixed(0)}°). It shines with a steady, warm orange-red color.`
        : `Mars is currently below the horizon at ${loc}.`;
    }
    else if (q.includes('jupiter')) {
      const j = visiblePlanets.find((p) => p.name === 'Jupiter');
      reply = j 
        ? `Jupiter is visible overhead (Alt: ${j.altitude.toFixed(0)}°, Az: ${j.azimuth.toFixed(0)}°). It is extremely bright and easily resolved with binoculars.`
        : `Jupiter is currently below the horizon at ${loc}.`;
    }
    else if (q.includes('saturn')) {
      const s = visiblePlanets.find((p) => p.name === 'Saturn');
      reply = s 
        ? `Saturn is visible at an altitude of ${s.altitude.toFixed(0)}°. A great target for checking planetary ring structures.`
        : `Saturn is currently below the horizon at ${loc}.`;
    }
    else if (q.includes('satellite') || q.includes('radar') || q.includes('starlink') || q.includes('gps')) {
      const starlinks = visibleSats.filter((s) => s.type === 'Starlink');
      reply = `We are tracking ${visibleSats.length} satellites overhead at ${loc}, including ${starlinks.length} Starlink units, and various GPS/Nav assets.`;
    }
    else {
      reply = `System scan complete for ${loc}. We have calculated ${combinedVisible.length} visible bodies above the horizon (Planets, Stars, Constellations, and Satellites). Ask me about visible objects, weather, or the next ISS pass!`;
    }

    return reply;
  };

  const simulateAiReply = (userQuestion: string) => {
    setMessages(prev => [...prev, { sender: 'user', text: userQuestion }]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const reply = generateGuideResponse(userQuestion);
      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 800);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    simulateAiReply(inputText);
    setInputText('');
  };

  return (
    <GlassSpotlightCard>
      <div className="dashboard-card-header">
        <span className="dashboard-card-icon">🧠</span>
        <div>
          <h3 className="dashboard-card-title">AI Space Guide</h3>
          <span style={{ fontSize: '0.625rem', color: '#10B981', fontWeight: 600 }}>Astronomy Assistant</span>
        </div>
      </div>

      <div className="ai-guide-chat" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        {/* Messages */}
        <div className="ai-guide-conversation" style={{ flex: 1, maxHeight: '160px', overflowY: 'auto' }}>
          {messages.map((m, i) => (
            <div key={i} className={`ai-bubble ${m.sender === 'user' ? 'ai-bubble-user' : 'ai-bubble-bot'}`}>
              {m.text}
            </div>
          ))}
          {isTyping && (
            <div className="ai-typing-indicator">
              <span className="ai-typing-dot" />
              <span className="ai-typing-dot" />
              <span className="ai-typing-dot" />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.5rem', marginTop: '0.5rem' }}>
          <button 
            onClick={() => simulateAiReply('What am I seeing above me right now?')} 
            className="ai-prompt-chip"
            disabled={isTyping}
            style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.375rem', padding: '0.35rem 0.5rem', fontSize: '0.7rem', color: '#A78BFA', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124,58,237,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          >
            💬 &quot;What am I seeing above me right now?&quot;
          </button>
        </div>

        {/* Input */}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.375rem', marginTop: 'auto' }}>
          <input
            type="text"
            placeholder={aiPlaceholder}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isTyping}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '0.5rem',
              padding: '0.5rem 0.75rem',
              fontSize: '0.75rem',
              color: '#fff',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={isTyping}
            style={{
              background: 'rgba(124,58,237,0.2)',
              border: '1px solid rgba(124,58,237,0.4)',
              color: '#C4B5FD',
              borderRadius: '0.5rem',
              padding: '0.5rem 0.75rem',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124,58,237,0.35)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(124,58,237,0.2)'}
          >
            Send
          </button>
        </form>
      </div>
    </GlassSpotlightCard>
  );
}

function CosmicEventPredictorCard({ timers, observerLabel }: CosmicEventPredictorCardProps) {
  const formatDuration = (seconds: number) => {
    if (seconds > 24 * 3600) {
      const days = Math.floor(seconds / (24 * 3600));
      const hours = Math.floor((seconds % (24 * 3600)) / 3600);
      return `In ${days}d ${hours}h`;
    }
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const events = [
    { name: 'ISS Pass Tonight', time: timers.iss, icon: '🛸' },
    { name: 'Meteor Shower Peak', time: timers.meteor, icon: '🌠' },
    { name: 'Planetary Alignment', time: timers.alignment, icon: '🪐' },
    { name: 'Lunar Eclipse', time: timers.eclipse, icon: '🌑' },
  ];

  return (
    <GlassSpotlightCard>
      <div className="dashboard-card-header">
        <span className="dashboard-card-icon">⏳</span>
        <div>
          <h3 className="dashboard-card-title">Cosmic Event Predictor</h3>
          <span style={{ fontSize: '0.625rem', color: '#06B6D4', fontWeight: 600 }}>📍 {observerLabel}</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
        {events.map(ev => (
          <div key={ev.name} className="countdown-item" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.125rem' }}>{ev.icon}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 650, color: 'rgba(255,255,255,0.85)' }}>{ev.name}</span>
            </div>
            <span className="countdown-timer-text" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#06B6D4' }}>{formatDuration(ev.time)}</span>
          </div>
        ))}
      </div>
      
      <div style={{
        marginTop: '0.75rem',
        padding: '0.5rem 0.75rem',
        borderRadius: '0.5rem',
        background: 'rgba(6,182,212,0.05)',
        border: '1px solid rgba(6,182,212,0.15)',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '0.6875rem', color: '#22D3EE' }}>Proactive monitoring of local meridian coordinates</p>
      </div>
    </GlassSpotlightCard>
  );
}

export default function Dashboard() {
  const [observerCoords, setObserverCoords] = useState({
    lat: 21.1458,
    lng: 79.0882,
    label: 'Nagpur, India'
  });

  const [issData, setIssData] = useState<ISSData | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const weatherCache = useRef<{ lat: number; lng: number; cloud: number; humidity: number; timestamp: number } | null>(null);
  const [satellites, setSatellites] = useState(FALLBACK_TLE_DATA);
  const [visibleSatsList, setVisibleSatsList] = useState<VisibleSatellite[]>([]);
  const [issNextPass, setIssNextPass] = useState<ISSPass | null>(null);
  const [issCountdown, setIssCountdown] = useState<number>(9195);
  const [countdownText, setCountdownText] = useState('Calculating next pass...');

  // Telemetry Onboarding States & UTC clock
  const [syncState, setSyncState] = useState<'idle' | 'analyzing' | 'telemetry' | 'locked' | 'ready'>('idle');
  const [utcTime, setUtcTime] = useState('');

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ display_name: string; lat: number; lon: number }[]>([]);

  // Autocomplete debounced suggestions search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&accept-language=en`, {
          headers: { 'User-Agent': 'ZenithApp/1.0' }
        });
        if (res.ok) {
          const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
          setSuggestions(data.map((item) => ({
            display_name: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon)
          })));
        }
      } catch (e) {
        console.error("Autocomplete search failed", e);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Trigger telemetry lock-on sequence when observerCoords change
  useEffect(() => {
    setSyncState('analyzing');
    const t1 = setTimeout(() => setSyncState('telemetry'), 600);
    const t2 = setTimeout(() => setSyncState('locked'), 1200);
    const t3 = setTimeout(() => setSyncState('ready'), 1700);
    const t4 = setTimeout(() => setSyncState('idle'), 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [observerCoords.lat, observerCoords.lng]);

  // Live UTC Clock
  useEffect(() => {
    const update = () => {
      const d = new Date();
      const hrs = String(d.getUTCHours()).padStart(2, '0');
      const mins = String(d.getUTCMinutes()).padStart(2, '0');
      const secs = String(d.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${hrs}:${mins}:${secs} UTC`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, []);

  // Weather states (pre-populated dynamically, can still be adjusted by user)
  const [cloudCover, setCloudCover] = useState(15);
  const [humidity, setHumidity] = useState(30);
  const [bortle, setBortle] = useState(4);
  const [moonBrightness, setMoonBrightness] = useState(8);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Clear toast after timeout
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const handleSelectLocation = (lat: number, lng: number, label: string) => {
    const cleanedLabel = label.split(',').slice(0, 2).join(',').trim();
    
    setWeatherLoading(true);
    setObserverCoords({ lat, lng, label: cleanedLabel });
    
    window.dispatchEvent(new CustomEvent('zenith-coordinate-change', {
      detail: { lat, lng, label: cleanedLabel, source: 'use-my-location' }
    }));
    
    setToastMessage(`✅ Mission Control synchronized`);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check if query is raw coordinates: e.g. "17.40, 78.37"
    const coordRegex = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;
    const match = searchQuery.match(coordRegex);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        handleSelectLocation(lat, lng, `Coordinates (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`);
        setSearchQuery('');
        return;
      }
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&accept-language=en`, {
        headers: { 'User-Agent': 'ZenithApp/1.0' }
      });
      if (res.ok) {
        const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
        if (data && data.length > 0) {
          const item = data[0];
          handleSelectLocation(parseFloat(item.lat), parseFloat(item.lon), item.display_name);
          setSearchQuery('');
        } else {
          setToastMessage(`❌ Location not found. Please try another city.`);
        }
      }
    } catch {
      setToastMessage(`❌ Location not found. Please try another city.`);
    }
  };

  // Geolocation trigger on demand
  const handleUseMyLocation = async () => {
    if (isDetecting) {
      console.log("[Visual Log] Click ignored: Geolocation request already in progress.");
      return; // Ignore clicks if already detecting to prevent duplicate requests
    }
    
    setIsDetecting(true);
    let clickTime = 0;
    if (typeof window !== 'undefined') {
      clickTime = performance.now();
      console.log(`[Visual Log] [0.00ms] CLICK`);
      console.log(`[Visual Log] [0.00ms] Button Disabled ("📍 Detecting...")`);
      console.time("Total Use My Location Flow");
      (window as unknown as { __zenith_perf?: ZenithPerfMetrics }).__zenith_perf = {
        clickTime: clickTime,
        geoTime: 0,
        weatherTime: 0,
        astronomyTime: 0,
        sgpTime: 0,
        aiTime: 0
      };
    }

    setToastMessage('📡 Detecting your location...');
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setToastMessage(`Geolocation is not supported by your browser.`);
      setIsDetecting(false);
      return;
    }

    // Cache-First: Optimistically load from localStorage for instant response
    let cachedCoords: { lat: number; lng: number; label: string } | null = null;
    try {
      const stored = safeLocalStorage.getItem('zenith_last_coords');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number' && typeof parsed.label === 'string') {
          cachedCoords = parsed;
        }
      }
    } catch (e) {
      console.error("Failed to parse cached coordinates", e);
    }

    if (cachedCoords) {
      console.log(`[Visual Log] [${(performance.now() - clickTime).toFixed(2)}ms] Optimistic Cache-Hit: Using stored coordinates`);
      // Update UI immediately with cached coordinates
      setObserverCoords(cachedCoords);
      window.dispatchEvent(new CustomEvent('zenith-coordinate-change', {
        detail: { lat: cachedCoords.lat, lng: cachedCoords.lng, label: cachedCoords.label, source: 'use-my-location' }
      }));
    }

    const finalCachedCoords = cachedCoords;

    // Wrap navigator.geolocation.getCurrentPosition in a Promise
    const getPosition = (options: PositionOptions): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
    };

    try {
      // Use maximumAge: Infinity to leverage browser cache instantly (often resolves in <10ms)
      const position = await getPosition({
        enableHighAccuracy: false,
        timeout: 3000,
        maximumAge: Infinity
      });

      const geoReturn = performance.now();
      const latency = clickTime > 0 ? geoReturn - clickTime : 0;
      
      console.log(`[Visual Log] [${latency.toFixed(2)}ms] PERMISSION GRANTED`);
      console.log(`[Visual Log] [${latency.toFixed(2)}ms] COORDINATES RECEIVED`);

      if (typeof window !== 'undefined') {
        const perf = (window as unknown as { __zenith_perf?: ZenithPerfMetrics }).__zenith_perf;
        if (perf) {
          perf.geoTime = geoReturn;
        }
      }

      const { latitude, longitude } = position.coords;
      const latStr = latitude.toFixed(2);
      const lngStr = longitude.toFixed(2);
      
      // Check if coordinates changed significantly from cache (threshold of ~1km / 0.01 degrees)
      const isNewLocation = !finalCachedCoords || 
        Math.abs(finalCachedCoords.lat - latitude) > 0.01 || 
        Math.abs(finalCachedCoords.lng - longitude) > 0.01;

      const tempLabel = isNewLocation 
        ? `Updating... (${latStr}°, ${lngStr}°)` 
        : finalCachedCoords.label;

      setToastMessage(`🌍 Updating observation point...`);
      setWeatherLoading(true);
      setIsDetecting(false); // Enable button

      if (isNewLocation) {
        // Update header and fly globe immediately
        setObserverCoords({ lat: latitude, lng: longitude, label: tempLabel });
        
        const headerUpdateTime = performance.now() - clickTime;
        console.log(`[Visual Log] [${headerUpdateTime.toFixed(2)}ms] HEADER UPDATED`);

        window.dispatchEvent(new CustomEvent('zenith-coordinate-change', {
          detail: { lat: latitude, lng: longitude, label: tempLabel, source: 'use-my-location' }
        }));
        console.log(`[Visual Log] [${(performance.now() - clickTime).toFixed(2)}ms] GLOBE UPDATED`);
      } else {
        console.log(`[Visual Log] [${(performance.now() - clickTime).toFixed(2)}ms] Coordinates match cache. Skipping redundant UI repaint.`);
      }

      console.log(`[Visual Log] [${(performance.now() - clickTime).toFixed(2)}ms] WEATHER STARTED`);

      // Fire geocoding and weather fetch concurrently in parallel using Promise.all
      const [geocodeResult] = await Promise.all([
        // Task A: Nominatim Reverse Geocoding
        (async () => {
          if (!isNewLocation && finalCachedCoords) {
            return finalCachedCoords.label;
          }
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`, {
              headers: { 'User-Agent': 'ZenithApp/1.0' }
            });
            if (res.ok) {
              const data = await res.json();
              const address = data.address;
              if (data && address) {
                const city = address.city || address.town || address.village || address.suburb || address.county || '';
                const country = address.country || '';
                if (city && country) {
                  const labelStr = `${city}, ${country}`;
                  safeLocalStorage.setItem('zenith_last_coords', JSON.stringify({ lat: latitude, lng: longitude, label: labelStr }));
                  return labelStr;
                } else if (country) {
                  safeLocalStorage.setItem('zenith_last_coords', JSON.stringify({ lat: latitude, lng: longitude, label: country }));
                  return country;
                }
              }
            }
          } catch (e) {
            console.error("Reverse geocoding failed", e);
          }
          const fallbackLabel = `My Location (${latStr}°, ${lngStr}°)`;
          safeLocalStorage.setItem('zenith_last_coords', JSON.stringify({ lat: latitude, lng: longitude, label: fallbackLabel }));
          return fallbackLabel;
        })(),

        // Task B: Open-Meteo Weather Fetching (or cache load)
        (async () => {
          const startWeather = performance.now();
          if (
            weatherCache.current &&
            Math.abs(weatherCache.current.lat - latitude) < 0.09 &&
            Math.abs(weatherCache.current.lng - longitude) < 0.09 &&
            Date.now() - weatherCache.current.timestamp < 600000
          ) {
            setCloudCover(weatherCache.current.cloud);
            setHumidity(weatherCache.current.humidity);
            setWeatherLoading(false);
            console.log(`[Visual Log] [${(performance.now() - clickTime).toFixed(2)}ms] WEATHER FINISHED (CACHED)`);
            return;
          }

          try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=cloud_cover,relative_humidity_2m`);
            if (res.ok) {
              const data = await res.json();
              if (data && data.current) {
                setCloudCover(data.current.cloud_cover);
                setHumidity(data.current.relative_humidity_2m);
                weatherCache.current = {
                  lat: latitude,
                  lng: longitude,
                  cloud: data.current.cloud_cover,
                  humidity: data.current.relative_humidity_2m,
                  timestamp: Date.now()
                };
              }
            }
            if (typeof window !== 'undefined') {
              const perf = (window as unknown as { __zenith_perf?: ZenithPerfMetrics }).__zenith_perf;
              if (perf) {
                perf.weatherTime = performance.now() - startWeather;
              }
            }
          } catch {
            setCloudCover(10);
            setHumidity(35);
          }
          setWeatherLoading(false);
          console.log(`[Visual Log] [${(performance.now() - clickTime).toFixed(2)}ms] WEATHER FINISHED`);
        })()
      ]);

      // 4. Update coordinates state with the geocoded city label progressively
      setObserverCoords({ lat: latitude, lng: longitude, label: geocodeResult });
      
      console.log(`[Visual Log] [${(performance.now() - clickTime).toFixed(2)}ms] Location Geocoded: ${geocodeResult}`);
      setToastMessage(`✅ Mission Control synchronized`);

    } catch (error) {
      setIsDetecting(false);
      setWeatherLoading(false);
      if (cachedCoords) {
        setToastMessage(`Unable to update current coordinates. Staying on cached location.`);
      } else {
        setToastMessage(`Location permission denied or timed out. Continuing with default observation point.`);
      }
      console.error("Geolocation request failed", error);
    }
  };

  // 1. Listen for global coordinate changes from the Globe
  useEffect(() => {
    const handleCoordinateChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ lat: number; lng: number; label: string; source?: string }>;
      if (customEvent.detail) {
        // If coordinate shift was triggered by handleUseMyLocation, ignore to avoid duplicate cycles
        if (customEvent.detail.source === 'use-my-location') {
          return;
        }
        
        const cleanedLabel = customEvent.detail.label.replace('Coordinates: ', '').replace(' Meridian', '');
        const { lat, lng } = customEvent.detail;
        
        // Prevent duplicate coordinate updates if coordinates match exactly
        setObserverCoords(prev => {
          if (prev.lat === lat && prev.lng === lng && prev.label === cleanedLabel) {
            return prev;
          }
          return {
            lat,
            lng,
            label: cleanedLabel
          };
        });
        setToastMessage(`Now showing the sky above ${cleanedLabel}`);

        // If it is a raw coordinate click, reverse-geocode in the background progressively
        if (cleanedLabel.includes('Coordinates') || cleanedLabel.includes('°')) {
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`, {
            headers: { 'User-Agent': 'ZenithApp/1.0' }
          })
            .then(res => {
              if (res.ok) return res.json();
              throw new Error();
            })
            .then(data => {
              const address = data.address;
              if (data && address) {
                const city = address.city || address.town || address.village || address.suburb || address.county || '';
                const country = address.country || '';
                if (city && country) {
                  const resolvedLabel = `${city}, ${country}`;
                  setObserverCoords(prev => {
                    if (prev.lat === lat && prev.lng === lng) {
                      return { ...prev, label: resolvedLabel };
                    }
                    return prev;
                  });
                  setToastMessage(`Now showing the sky above ${resolvedLabel}`);
                } else if (country) {
                  setObserverCoords(prev => {
                    if (prev.lat === lat && prev.lng === lng) {
                      return { ...prev, label: country };
                    }
                    return prev;
                  });
                  setToastMessage(`Now showing the sky above ${country}`);
                }
              }
            })
            .catch(() => { /* fallback coordinates already set */ });
        }
      }
    };

    window.addEventListener('zenith-coordinate-change', handleCoordinateChange);
    return () => {
      window.removeEventListener('zenith-coordinate-change', handleCoordinateChange);
    };
  }, []);

  // Trigger Visual Log for Dashboard Widgets Updated
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const perf = (window as unknown as { __zenith_perf?: ZenithPerfMetrics }).__zenith_perf;
      if (perf && perf.clickTime > 0) {
        console.log(`[Visual Log] [${(performance.now() - perf.clickTime).toFixed(2)}ms] Dashboard Widgets Updated (Initial Layout & Positions)`);
      }
    }
  }, [observerCoords]);

  // 2. Fetch fresh TLE sets from CelesTrak (with fallback)
  const fetchCelesTrakTLE = async (noradId: number, fallback: { line1: string; line2: string }) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
      
      const res = await fetch(`https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=TLE`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const text = await res.text();
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length >= 3) {
          return {
            line1: lines[1],
            line2: lines[2]
          };
        }
      }
    } catch { /* use fallback */ }
    return fallback;
  };

  useEffect(() => {
    const fetchAllTLEs = async () => {
      const updated = await Promise.all(
        FALLBACK_TLE_DATA.map(async (sat) => {
          const fresh = await fetchCelesTrakTLE(sat.noradId, { line1: sat.line1, line2: sat.line2 });
          return {
            ...sat,
            line1: fresh.line1,
            line2: fresh.line2
          };
        })
      );
      setSatellites(updated);
    };
    fetchAllTLEs();
  }, []);

  // 3. Track live ISS position (WhereTheISS API)
  useEffect(() => {
    const fetchISS = async () => {
      try {
        const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
        const data = await res.json();
        setIssData({
          latitude: data.latitude,
          longitude: data.longitude,
          altitude: data.altitude,
          velocity: data.velocity
        });
      } catch {
        // Use local propagation if live API fails
        const issTLE = satellites.find(s => s.noradId === 25544);
        if (issTLE) {
          const prop = propagateTLE(issTLE.line1, issTLE.line2, new Date(), observerCoords.lat, observerCoords.lng);
          if (prop) {
            setIssData({
              latitude: prop.latitude,
              longitude: prop.longitude,
              altitude: prop.altitude,
              velocity: 27560 // typical speed in km/h
            });
          }
        }
      }
    };
    fetchISS();
    const interval = setInterval(fetchISS, 5000);
    return () => clearInterval(interval);
  }, [satellites, observerCoords.lat, observerCoords.lng]);

  // 4. Propagate all satellites in real-time
  useEffect(() => {
    let active = true;
    const propagateAll = () => {
      const startSgp = performance.now();
      const date = new Date();
      const visibleSats: VisibleSatellite[] = [];

      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastUpdated(`${timeStr} Local`);

      satellites.forEach(sat => {
        const prop = propagateTLE(sat.line1, sat.line2, date, observerCoords.lat, observerCoords.lng);
        if (prop && prop.elevation > 0) {
          visibleSats.push({
            name: sat.name,
            type: sat.type,
            altitude: prop.elevation,
            azimuth: prop.azimuth,
            latitude: prop.latitude,
            longitude: prop.longitude,
            height: prop.altitude,
            icon: sat.icon
          });
        }
      });

      setVisibleSatsList(visibleSats);

      if (typeof window !== 'undefined') {
        const perf = (window as unknown as { __zenith_perf?: ZenithPerfMetrics }).__zenith_perf;
        if (perf && perf.clickTime > 0 && perf.sgpTime === 0) {
          perf.sgpTime = performance.now() - startSgp;
          console.log(`[Perf] SGP4 satellite propagation: ${perf.sgpTime.toFixed(2)}ms`);
        }
      }

      // Defer the heavy ISS pass prediction calculation to keep coordinate updates responsive
      setTimeout(() => {
        if (!active) return;
        const issTLE = satellites.find(s => s.noradId === 25544);
        if (issTLE) {
          const pass = predictNextISSPass(observerCoords.lat, observerCoords.lng, issTLE.line1, issTLE.line2);
          if (pass) {
            setIssNextPass(pass);
          }
        }
      }, 150);
    };

    propagateAll();
    const interval = setInterval(propagateAll, 4000); // propagate every 4 seconds to conserve CPU
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [satellites, observerCoords.lat, observerCoords.lng]);

  // 5. Update countdown timer to next ISS pass
  useEffect(() => {
    if (!issNextPass) {
      setCountdownText('Calculating next pass...');
      setIssCountdown(9195);
      return;
    }
    const updateCountdown = () => {
      const diff = issNextPass.riseTime.getTime() - Date.now();
      const diffSeconds = Math.max(0, Math.round(diff / 1000));
      setIssCountdown(diffSeconds);

      if (diff <= 0) {
        setCountdownText('ISS is visible now!');
      } else {
        const hours = Math.floor(diffSeconds / 3600);
        const mins = Math.floor((diffSeconds % 3600) / 60);
        const secs = diffSeconds % 60;
        
        let text = '';
        if (hours > 0) text += `${hours}h `;
        if (mins > 0 || hours > 0) text += `${mins}m `;
        text += `${secs}s`;
        setCountdownText(`Next pass in ${text}`);
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [issNextPass]);

  // 6. Fetch Open-Meteo weather coordinates & Moon phase
  useEffect(() => {
    let active = true;
    const fetchWeather = async () => {
      const startWeather = performance.now();
      
      // Check cache (within ~10 km / 0.09 degrees and less than 10 minutes old)
      if (
        weatherCache.current &&
        Math.abs(weatherCache.current.lat - observerCoords.lat) < 0.09 &&
        Math.abs(weatherCache.current.lng - observerCoords.lng) < 0.09 &&
        Date.now() - weatherCache.current.timestamp < 600000
      ) {
        setCloudCover(weatherCache.current.cloud);
        setHumidity(weatherCache.current.humidity);
        setWeatherLoading(false);
        if (typeof window !== 'undefined') {
          const perf = (window as unknown as { __zenith_perf?: ZenithPerfMetrics }).__zenith_perf;
          if (perf) {
            perf.weatherTime = performance.now() - startWeather;
            console.log(`[Perf] Open-Meteo Weather: ${perf.weatherTime.toFixed(2)}ms (CACHED)`);
            if (perf.clickTime > 0) {
              console.log(`[Visual Log] [${(performance.now() - perf.clickTime).toFixed(2)}ms] Weather Loaded: Cloud Cover ${weatherCache.current.cloud}%, Humidity ${weatherCache.current.humidity}% (CACHED)`);
            }
          }
        }
        return;
      }

      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${observerCoords.lat}&longitude=${observerCoords.lng}&current=cloud_cover,relative_humidity_2m`);
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          if (data.current) {
            setCloudCover(data.current.cloud_cover);
            setHumidity(data.current.relative_humidity_2m);
            
            // Update cache
            weatherCache.current = {
              lat: observerCoords.lat,
              lng: observerCoords.lng,
              cloud: data.current.cloud_cover,
              humidity: data.current.relative_humidity_2m,
              timestamp: Date.now()
            };
            
            if (typeof window !== 'undefined') {
              const perf = (window as unknown as { __zenith_perf?: ZenithPerfMetrics }).__zenith_perf;
              if (perf && perf.clickTime > 0) {
                console.log(`[Visual Log] [${(performance.now() - perf.clickTime).toFixed(2)}ms] Weather Loaded: Cloud Cover ${data.current.cloud_cover}%, Humidity ${data.current.relative_humidity_2m}%`);
              }
            }
          }
        }
        setWeatherLoading(false);
        if (typeof window !== 'undefined') {
          const perf = (window as unknown as { __zenith_perf?: ZenithPerfMetrics }).__zenith_perf;
          if (perf) {
            perf.weatherTime = performance.now() - startWeather;
            console.log(`[Perf] Open-Meteo weather fetch duration: ${perf.weatherTime.toFixed(2)}ms`);
          }
        }
      } catch {
        setWeatherLoading(false);
        if (active) {
          setCloudCover(10);
          setHumidity(35);
        }
      }
    };

    fetchWeather();
    
    try {
      const time = Astronomy.MakeTime(new Date());
      const ill = Astronomy.Illumination(Astronomy.Body.Moon, time);
      setMoonBrightness(Math.round(ill.phase_fraction * 100));
    } catch {
      setMoonBrightness(8);
    }

    setBortle(getEstimatedBortle(observerCoords.lat, observerCoords.lng));

    return () => { active = false; };
  }, [observerCoords.lat, observerCoords.lng]);

  // 7. Calculate overall observation quality score
  const astronomyScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 -
          cloudCover * 0.4 -
          humidity * 0.15 -
          (bortle - 1) * 6 -
          moonBrightness * 0.25
      )
    )
  );

  let condition = 'Poor Observation Conditions';
  let color = '#F87171';
  if (astronomyScore >= 85) {
    condition = 'Excellent Observation Conditions';
    color = '#4ADE80';
  } else if (astronomyScore >= 70) {
    condition = 'Good Observation Conditions';
    color = '#60A5FA';
  } else if (astronomyScore >= 50) {
    condition = 'Fair Observation Conditions';
    color = '#FBBF24';
  }

  // 8. Calculate visible sky objects
  const calculateVisibleObjects = (lat: number, lng: number, date: Date) => {
    const startAst = performance.now();
    const obs = new Astronomy.Observer(lat, lng, 0);
    const time = Astronomy.MakeTime(date);

    const bodies = [
      { name: 'Moon', body: Astronomy.Body.Moon, icon: '🌙' },
      { name: 'Mercury', body: Astronomy.Body.Mercury, icon: '🪐' },
      { name: 'Venus', body: Astronomy.Body.Venus, icon: '✨' },
      { name: 'Mars', body: Astronomy.Body.Mars, icon: '🔴' },
      { name: 'Jupiter', body: Astronomy.Body.Jupiter, icon: '🪐' },
      { name: 'Saturn', body: Astronomy.Body.Saturn, icon: '🪐' },
    ];

    const visible: VisibleObject[] = [];

    bodies.forEach(b => {
      try {
        const equ = Astronomy.Equator(b.body, time, obs, true, true);
        const hor = Astronomy.Horizon(time, obs, equ.ra, equ.dec, 'normal');
        if (hor.altitude > 0) {
          visible.push({
            name: b.name,
            type: b.name === 'Moon' ? 'Natural Satellite' : 'Planet',
            altitude: hor.altitude,
            azimuth: hor.azimuth,
            icon: b.icon
          });
        }
      } catch (e) {
        console.error(e);
      }
    });

    MAJOR_STARS.forEach(s => {
      try {
        const hor = Astronomy.Horizon(time, obs, s.ra, s.dec, 'normal');
        if (hor.altitude > 0) {
          visible.push({
            name: s.name,
            type: s.type,
            altitude: hor.altitude,
            azimuth: hor.azimuth,
            icon: s.icon
          });
        }
      } catch (e) {
        console.error(e);
      }
    });

    CONSTELLATIONS.forEach(c => {
      try {
        const hor = Astronomy.Horizon(time, obs, c.ra, c.dec, 'normal');
        if (hor.altitude > 0) {
          visible.push({
            name: c.name,
            type: c.type,
            altitude: hor.altitude,
            azimuth: hor.azimuth,
            icon: c.icon
          });
        }
      } catch (e) {
        console.error(e);
      }
    });

    if (typeof window !== 'undefined') {
      const perf = (window as unknown as { __zenith_perf?: ZenithPerfMetrics }).__zenith_perf;
      if (perf && perf.clickTime > 0 && perf.astronomyTime === 0) {
        perf.astronomyTime = performance.now() - startAst;
        console.log(`[Perf] Astronomy Engine calculations: ${perf.astronomyTime.toFixed(2)}ms`);
      }
    }

    return visible;
  };

  const combinedVisible = [
    ...calculateVisibleObjects(observerCoords.lat, observerCoords.lng, new Date()),
    ...visibleSatsList
  ].sort((a, b) => b.altitude - a.altitude);

  // 9. Predictor Card timers
  const [timers, setTimers] = useState({
    iss: 9195,
    meteor: 18700,
    alignment: 53042,
    eclipse: 130750,
  });

  useEffect(() => {
    const updatePredictors = () => {
      const now = Date.now();
      
      const meteorTarget = new Date('2026-07-28T22:00:00Z').getTime();
      const alignmentTarget = new Date('2026-09-15T05:00:00Z').getTime();
      const eclipseTarget = new Date('2026-08-28T02:00:00Z').getTime();
      
      const issSeconds = issCountdown;
      const meteorSeconds = Math.max(0, Math.round((meteorTarget - now) / 1000));
      const alignmentSeconds = Math.max(0, Math.round((alignmentTarget - now) / 1000));
      const eclipseSeconds = Math.max(0, Math.round((eclipseTarget - now) / 1000));
      
      setTimers({
        iss: issSeconds,
        meteor: meteorSeconds,
        alignment: alignmentSeconds,
        eclipse: eclipseSeconds
      });
    };
    
    updatePredictors();
    const interval = setInterval(updatePredictors, 1000);
    return () => clearInterval(interval);
  }, [issCountdown]);

  return (
    <section className="dashboard-section" id="dashboard" style={{ position: 'relative', scrollMarginTop: '8.5rem' }}>
      {/* Top divider glow */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', maxWidth: 700, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.5), rgba(6,182,212,0.5), transparent)' }} />
      <div className="glow-blob" style={{ width: 600, height: 600, top: '-10%', right: '-5%', background: 'radial-gradient(circle, rgba(6,182,212,0.06), transparent 65%)' }} />

      <div className="section-container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-eyebrow">Mission Control</span>
          <h2 className="section-title">
            Celestial <span className="gradient-span">Radar</span> Dashboard
          </h2>
          <p className="section-subtitle">
            Real-time space intelligence. Everything happening above you, right now.
          </p>
        </motion.div>

        {/* Status bar */}
        <motion.div
          className="dashboard-status-bar glass-card"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          {/* Top highlight line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(167, 139, 250, 0.4), transparent)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', position: 'relative', zIndex: 3 }}>
            <div className="live-indicator">
              <span className="live-dot" />
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#4ADE80', letterSpacing: '0.08em' }}>All Systems Nominal</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.15)' }} className="hidden md:inline">|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
              <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)' }} className="hidden lg:inline">
                🌍 Observation Point:
              </span>
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>🔍</span>
                    <input
                      type="text"
                      placeholder="Search any city, country, or coordinates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onBlur={() => {
                        // Delay clearing suggestions to allow click events to register
                        setTimeout(() => setSuggestions([]), 200);
                      }}
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.5rem',
                        padding: '0.35rem 0.625rem 0.35rem 1.75rem',
                        fontSize: '0.75rem',
                        color: '#fff',
                        outline: 'none',
                        transition: 'all 0.2s',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.border = '1px solid rgba(124, 58, 237, 0.6)';
                        e.currentTarget.style.boxShadow = '0 0 10px rgba(124, 58, 237, 0.2)';
                      }}
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={isDetecting}
                    title="Use My Location"
                    style={{
                      background: isDetecting ? 'rgba(255, 255, 255, 0.05)' : 'rgba(124, 58, 237, 0.15)',
                      border: isDetecting ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(124, 58, 237, 0.3)',
                      color: isDetecting ? 'rgba(255, 255, 255, 0.4)' : '#C4B5FD',
                      fontSize: '0.6875rem',
                      padding: '0.35rem 0.625rem',
                      borderRadius: '0.5rem',
                      cursor: isDetecting ? 'not-allowed' : 'pointer',
                      fontWeight: 650,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      transition: 'all 0.2s',
                      pointerEvents: isDetecting ? 'none' : 'auto'
                    }}
                    onMouseEnter={(e) => {
                      if (!isDetecting) {
                        e.currentTarget.style.background = 'rgba(124, 58, 237, 0.3)';
                        e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isDetecting) {
                        e.currentTarget.style.background = 'rgba(124, 58, 237, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.3)';
                      }
                    }}
                  >
                    {isDetecting ? '📍 GPS...' : '📍 GPS'}
                  </button>
                </form>

                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '110%',
                    left: 0,
                    right: 0,
                    background: 'rgba(8, 12, 32, 0.95)',
                    border: '1px solid rgba(124, 58, 237, 0.3)',
                    borderRadius: '0.5rem',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 100,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(16px)',
                  }}>
                    {suggestions.map((s, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          handleSelectLocation(s.lat, s.lon, s.display_name);
                          setSearchQuery('');
                          setSuggestions([]);
                        }}
                        style={{
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.725rem',
                          color: '#C4B5FD',
                          cursor: 'pointer',
                          borderBottom: idx < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(124, 58, 237, 0.25)';
                          e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#C4B5FD';
                        }}
                      >
                        {s.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="dashboard-status-bar-right" style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', position: 'relative', zIndex: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>Telemetry Feed</span>
              <span style={{ fontSize: '0.75rem', color: '#38D1F0', fontWeight: 650, fontFamily: 'monospace' }}>LIVE</span>
              <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.75rem' }}>|</span>
              <span style={{ fontSize: '0.75rem', color: '#A78BFA', fontWeight: 650, fontFamily: 'monospace' }}>{utcTime}</span>
            </div>
            {lastUpdated && (
              <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                Last Updated: {lastUpdated}
              </span>
            )}
          </div>
        </motion.div>

        {/* Dashboard grid wrapper */}
        <div style={{ position: 'relative', minHeight: '300px' }}>
          {syncState !== 'idle' && (
            <motion.div
              style={{
                position: 'absolute',
                inset: -8,
                background: 'rgba(5, 8, 22, 0.88)',
                backdropFilter: 'blur(12px)',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.5rem',
                borderRadius: '1.5rem',
                border: '1px solid rgba(124, 58, 237, 0.2)'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Conic sweep animation */}
              <div style={{
                position: 'relative',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                border: '2px solid rgba(6, 182, 212, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  background: 'conic-gradient(from 0deg, rgba(6, 182, 212, 0.4), transparent)',
                  animation: 'spin 1.5s linear infinite',
                  borderRadius: '50%'
                }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#06B6D4', boxShadow: '0 0 10px #06B6D4' }} />
              </div>
              
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.6875rem', color: '#7C3AED', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                  System Coordinate Lock
                </span>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#fff', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
                  {syncState === 'analyzing' && '📡 ANALYZING SKY DOME...'}
                  {syncState === 'telemetry' && '📥 RECEIVING ORBITAL TELEMETRY...'}
                  {syncState === 'locked' && '🎯 SATELLITE CHANNELS LOCKED'}
                  {syncState === 'ready' && '🛰️ MISSION CONTROL ONLINE'}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                  Target: {observerCoords.label} ({observerCoords.lat.toFixed(4)}°, {observerCoords.lng.toFixed(4)}°)
                </p>
              </div>
            </motion.div>
          )}

          {/* Dashboard grid */}
          <motion.div 
            className="dashboard-grid"
            key={`${observerCoords.lat}-${observerCoords.lng}`}
            initial={{ opacity: 0.78, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <ISSCard data={issData} countdownText={countdownText} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <SkyQualityScoreCard 
                cloudCover={cloudCover} setCloudCover={setCloudCover}
                humidity={humidity} setHumidity={setHumidity}
                bortle={bortle} setBortle={setBortle}
                moonBrightness={moonBrightness} setMoonBrightness={setMoonBrightness}
                astronomyScore={astronomyScore}
                condition={condition}
                color={color}
                weatherLoading={weatherLoading}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <VisibleObjectsCard objects={combinedVisible} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <SatelliteRadarCard satellites={visibleSatsList} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <AISpaceGuideCard 
                observerCoords={observerCoords}
                cloudCover={cloudCover}
                humidity={humidity}
                bortle={bortle}
                moonBrightness={moonBrightness}
                astronomyScore={astronomyScore}
                condition={condition}
                combinedVisible={combinedVisible}
                issNextPass={issNextPass}
                issCountdown={issCountdown}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <CosmicEventPredictorCard timers={timers} observerLabel={observerCoords.label} />
            </div>
          </motion.div>
        </div>

        {/* Data Source Credits Badge */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1.25rem',
          marginTop: '2rem',
          padding: '0.75rem',
          fontSize: '0.625rem',
          color: 'rgba(255,255,255,0.25)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          flexWrap: 'wrap',
          textAlign: 'center'
        }}>
          <span>🛸 ISS • <strong style={{ color: 'rgba(255,255,255,0.4)' }}>WhereTheISS.at</strong></span>
          <span>🌤️ Weather • <strong style={{ color: 'rgba(255,255,255,0.4)' }}>Open-Meteo</strong></span>
          <span>🪐 Planets • <strong style={{ color: 'rgba(255,255,255,0.4)' }}>Astronomy Engine</strong></span>
          <span>🛰️ Satellites • <strong style={{ color: 'rgba(255,255,255,0.4)' }}>CelesTrak TLE</strong></span>
        </div>
      </div>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              zIndex: 10000,
              background: 'rgba(5, 8, 22, 0.95)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.25)',
              backdropFilter: 'blur(20px)',
              padding: '1rem 1.5rem',
              borderRadius: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#fff',
              maxWidth: '350px',
              pointerEvents: 'auto'
            }}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <span style={{ fontSize: '1.25rem' }}>📍</span>
            <div>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#38D1F0', margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Observation Point Updated
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.85)', margin: '0.15rem 0 0 0', lineHeight: 1.3 }}>
                {toastMessage}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
