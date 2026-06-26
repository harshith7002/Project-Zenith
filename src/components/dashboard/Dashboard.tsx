'use client';
import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

interface ISSData {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
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

// Radar SVG widget
function RadarWidget() {
  const blips = [
    { cx: 100, cy: 60, color: '#7C3AED', r: 4, label: 'ISS' },
    { cx: 140, cy: 110, color: '#06B6D4', r: 3, label: 'Jupiter' },
    { cx: 70, cy: 130, color: '#F59E0B', r: 3, label: 'Mars' },
    { cx: 150, cy: 70, color: '#10B981', r: 3, label: 'Starlink' },
    { cx: 55, cy: 90, color: '#EF4444', r: 2.5, label: 'GPS-24' },
  ];

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

function ISSCard({ data }: { data: ISSData | null }) {
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
        <p style={{ fontSize: '0.75rem', color: '#C4B5FD' }}>🕐 Next pass in <strong>2h 34m</strong></p>
      </div>
    </GlassSpotlightCard>
  );
}

function SkyQualityScoreCard() {
  const [cloudCover, setCloudCover] = useState(5);
  const [humidity, setHumidity] = useState(20);
  const [bortle, setBortle] = useState(2);
  const [moonBrightness, setMoonBrightness] = useState(8);

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

  return (
    <GlassSpotlightCard>
      <div className="dashboard-card-header">
        <span className="dashboard-card-icon">🌤️</span>
        <div>
          <h3 className="dashboard-card-title">Sky Quality Score</h3>
          <span style={{ fontSize: '0.625rem', color: '#A78BFA', fontWeight: 600 }}>Interactive Calculator</span>
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
        <p style={{ fontSize: '0.6875rem', color, fontWeight: 700, textAlign: 'center', transition: 'color 0.2s' }}>
          {condition}
        </p>
      </div>
    </GlassSpotlightCard>
  );
}

function VisibleObjectsCard() {
  const objects = [
    { name: 'Jupiter', type: 'Planet', altitude: '47°', icon: '🪐' },
    { name: 'Mars', type: 'Planet', altitude: '32°', icon: '🔴' },
    { name: 'Orion', type: 'Constellation', altitude: '58°', icon: '⭐' },
    { name: 'Sirius', type: 'Star', altitude: '23°', icon: '✨' },
    { name: 'Starlink-2847', type: 'Satellite', altitude: '65°', icon: '🛰️' },
  ];

  return (
    <GlassSpotlightCard>
      <div className="dashboard-card-header">
        <span className="dashboard-card-icon">🔭</span>
        <h3 className="dashboard-card-title">Visible Now</h3>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem', justifyContent: 'center' }}>
        {objects.map((obj, i) => (
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
              {obj.altitude}
            </span>
          </motion.div>
        ))}
      </div>
    </GlassSpotlightCard>
  );
}

function SatelliteRadarCard() {
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

      <RadarWidget />

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

function AISpaceGuideCard() {
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([
    { sender: 'bot', text: 'Hello! I am your AI Space Guide. Ask me anything about what is visible in the sky above you right now.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const simulateAiReply = (userQuestion: string) => {
    setMessages(prev => [...prev, { sender: 'user', text: userQuestion }]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let fullReply = '';

      if (userQuestion.includes('seeing above me right now') || userQuestion.includes('above me right now')) {
        fullReply = 'The bright object visible at 67° altitude is Jupiter. It is currently one of the brightest objects in the night sky. Through binoculars you may observe its Galilean moons.';
      } else if (userQuestion.toLowerCase().includes('iss') || userQuestion.toLowerCase().includes('space station')) {
        fullReply = 'The International Space Station (ISS) is moving rapidly. Next pass will occur tonight at 9:42 PM. It will appear in the NW sky at 10° elevation and rise to 42° before setting.';
      } else if (userQuestion.toLowerCase().includes('mars')) {
        fullReply = 'Mars is visible at 32° altitude, shining with a steady orange-red light in the constellation Taurus. A telescope reveals its polar ice caps.';
      } else {
        fullReply = 'Scanning night sky coordinates... We see Jupiter at 67° altitude, Mars at 32° altitude, and Starlink-2847 satellite path crossing over. Sky conditions are excellent.';
      }

      setMessages(prev => [...prev, { sender: 'bot', text: fullReply }]);
    }, 1200);
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

function CosmicEventPredictorCard() {
  const [timers, setTimers] = useState({
    iss: 9195,        // 2h 33m 15s
    meteor: 18700,    // 5h 11m 40s
    alignment: 53042, // 14h 44m 02s
    eclipse: 130750,  // 36h 19m 10s
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => ({
        iss: prev.iss > 0 ? prev.iss - 1 : 9195,
        meteor: prev.meteor > 0 ? prev.meteor - 1 : 18700,
        alignment: prev.alignment > 0 ? prev.alignment - 1 : 53042,
        eclipse: prev.eclipse > 0 ? prev.eclipse - 1 : 130750,
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
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
          <span style={{ fontSize: '0.625rem', color: '#06B6D4', fontWeight: 600 }}>📍 Nagpur, India</span>
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
        <p style={{ fontSize: '0.6875rem', color: '#22D3EE' }}>Proactive monitoring of Nagpur meridian coordinates</p>
      </div>
    </GlassSpotlightCard>
  );
}

export default function Dashboard() {
  const [issData, setIssData] = useState<ISSData | null>(null);

  useEffect(() => {
    const fetchISS = async () => {
      try {
        const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
        const data = await res.json();
        setIssData({ latitude: data.latitude, longitude: data.longitude, altitude: data.altitude, velocity: data.velocity });
      } catch { /* use defaults */ }
    };
    fetchISS();
    const interval = setInterval(fetchISS, 5000);
    return () => clearInterval(interval);
  }, []);

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
            <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)' }}>📍 Nagpur Meridian & Global Satellites</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative', zIndex: 3 }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>Telemetry Feed</span>
            <span style={{ fontSize: '0.75rem', color: '#38D1F0', fontWeight: 600, fontFamily: 'monospace' }}>active</span>
          </div>
        </motion.div>

        {/* Dashboard grid */}
        <div className="dashboard-grid">
          {[ISSCard, SkyQualityScoreCard, VisibleObjectsCard, SatelliteRadarCard, AISpaceGuideCard, CosmicEventPredictorCard].map((Card, i) => (
            <motion.div
              key={i}
              style={{ display: 'flex', flexDirection: 'column' }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              {i === 0 ? <ISSCard data={issData} /> :
               i === 1 ? <SkyQualityScoreCard /> :
               i === 2 ? <VisibleObjectsCard /> :
               i === 3 ? <SatelliteRadarCard /> :
               i === 4 ? <AISpaceGuideCard /> :
               <CosmicEventPredictorCard />}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
