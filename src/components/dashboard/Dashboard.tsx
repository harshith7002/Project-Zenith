'use client';
import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import * as Astronomy from 'astronomy-engine';
import * as satellite from 'satellite.js';
import { FALLBACK_TLE_DATA } from '@/lib/tleData';

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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      ref={cardRef}
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
      label: sat.name.split(' ')[0]
    };
  });

  return (
    <div style={{ position: 'relative', width: 190, height: 190, margin: '0.5rem auto' }}>
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
          <g key={i}>
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
  astronomyScore, color
}: SkyQualityScoreCardProps) {
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
            <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600 }}>{cloudCover}%</span>
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
            <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600 }}>{humidity}%</span>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Observation Quality</span>
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    // Generate initial bot greeting message once when data becomes available
    const generateWelcomeMessage = () => {
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
    else if (q.includes('weather') || q.includes('cloud') || q.includes('condition') || q.includes('humidity') || q.includes('pollution') || q.includes('bortle')) {
      let advice = '';
      if (score >= 80) advice = 'Observations will be crystal clear. Perfect night for stargazing!';
      else if (score >= 50) advice = 'Skies are fair. Good for observing bright planets or the Moon.';
      else advice = 'High cloud cover or humidity. Conditions are sub-optimal.';
      
      reply = `Atmospheric profile for ${loc}: Cloud cover is ${cloudCover}%, humidity is ${humidity}%, moon brightness is ${moonBrightness}%, and light pollution is estimated at Bortle Class ${bortle}. ${advice}`;
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
            placeholder="Ask your AI guide..."
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
  const [satellites, setSatellites] = useState(FALLBACK_TLE_DATA);
  const [visibleSatsList, setVisibleSatsList] = useState<VisibleSatellite[]>([]);
  const [issNextPass, setIssNextPass] = useState<ISSPass | null>(null);
  const [issCountdown, setIssCountdown] = useState<number>(9195);
  const [countdownText, setCountdownText] = useState('Calculating next pass...');

  // Weather states (pre-populated dynamically, can still be adjusted by user)
  const [cloudCover, setCloudCover] = useState(15);
  const [humidity, setHumidity] = useState(30);
  const [bortle, setBortle] = useState(4);
  const [moonBrightness, setMoonBrightness] = useState(8);

  // 1. Listen for global coordinate changes from the Globe
  useEffect(() => {
    const handleCoordinateChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ lat: number; lng: number; label: string }>;
      if (customEvent.detail) {
        setObserverCoords({
          lat: customEvent.detail.lat,
          lng: customEvent.detail.lng,
          label: customEvent.detail.label || `${customEvent.detail.lat.toFixed(2)}°, ${customEvent.detail.lng.toFixed(2)}°`
        });
      }
    };

    window.addEventListener('zenith-coordinate-change', handleCoordinateChange);
    return () => {
      window.removeEventListener('zenith-coordinate-change', handleCoordinateChange);
    };
  }, []);

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
  }, [satellites, observerCoords]);

  // 4. Propagate all satellites in real-time
  useEffect(() => {
    const propagateAll = () => {
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

      // Update ISS next pass
      const issTLE = satellites.find(s => s.noradId === 25544);
      if (issTLE) {
        const pass = predictNextISSPass(observerCoords.lat, observerCoords.lng, issTLE.line1, issTLE.line2);
        if (pass) {
          setIssNextPass(pass);
        }
      }

      setVisibleSatsList(visibleSats);
    };

    propagateAll();
    const interval = setInterval(propagateAll, 4000); // propagate every 4 seconds to conserve CPU
    return () => clearInterval(interval);
  }, [satellites, observerCoords]);

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
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${observerCoords.lat}&longitude=${observerCoords.lng}&current=cloud_cover,relative_humidity_2m`);
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          if (data.current) {
            setCloudCover(data.current.cloud_cover);
            setHumidity(data.current.relative_humidity_2m);
          }
        }
      } catch {
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
  }, [observerCoords]);

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
    <section className="dashboard-section" id="dashboard" style={{ position: 'relative' }}>
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
            <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)' }}>📍 {observerCoords.label} Meridian</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.15rem', position: 'relative', zIndex: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>Telemetry Feed</span>
              <span style={{ fontSize: '0.75rem', color: '#38D1F0', fontWeight: 650, fontFamily: 'monospace' }}>LIVE</span>
            </div>
            {lastUpdated && (
              <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                Last Updated: {lastUpdated}
              </span>
            )}
          </div>
        </motion.div>

        {/* Dashboard grid */}
        <div className="dashboard-grid">
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
    </section>
  );
}
