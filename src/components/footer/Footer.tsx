'use client';
import { motion } from 'framer-motion';

const LINK_COLS = [
  {
    title: 'Platform',
    links: ['Live Globe', 'Solar System', 'ISS Tracker', 'Satellite Radar', 'Sky Dashboard'],
  },
  {
    title: 'Data Sources',
    links: ['NASA APIs', 'Open Notify', 'CelesTrak', 'OpenWeather', 'HYG Star Catalog'],
  },
  {
    title: 'Resources',
    links: ['Documentation', 'GitHub', 'API Reference', 'About', 'Contact'],
  },
];

// Generate stable star positions (not random on each render)
const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  w: (i % 3 === 0 ? 2 : i % 3 === 1 ? 1.5 : 1),
  x: ((i * 37 + 13) % 100),
  y: ((i * 53 + 7) % 100),
  op: 0.1 + (i % 5) * 0.08,
  dur: 2 + (i % 4),
  delay: (i % 6) * 0.5,
}));

export default function Footer() {
  return (
    <footer className="footer">
      {/* Animated stars */}
      <div className="footer-stars">
        {STARS.map(s => (
          <motion.div
            key={s.id}
            className="footer-star"
            style={{
              width: s.w,
              height: s.w,
              left: `${s.x}%`,
              top: `${s.y}%`,
              '--op': s.op,
              '--dur': `${s.dur}s`,
              '--delay': `${s.delay}s`,
            } as React.CSSProperties}
            animate={{ opacity: [s.op, s.op * 2.5, s.op] }}
            transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Top gradient line */}
      <div style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.45), rgba(6,182,212,0.45), transparent)' }} />

      <div className="footer-inner">
        <div className="footer-grid">
          {/* Brand column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div className="navbar-logo-icon">🌌</div>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 900, letterSpacing: '0.15em', color: '#fff' }}>PROJECT ZENITH</p>
                <p style={{ fontSize: '0.5625rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>The Celestial Eye</p>
              </div>
            </div>
            <p className="footer-brand-tagline">
              Bringing the infinite cosmos within a single browser tab.
              Real-time space intelligence for everyone.
            </p>
            <div className="footer-socials">
              {['GitHub', 'Twitter', 'Discord'].map(s => (
                <button key={s} className="footer-social-btn">{s}</button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {LINK_COLS.map(col => (
            <div key={col.title}>
              <h4 className="footer-col-title">{col.title}</h4>
              <ul className="footer-links">
                {col.links.map(link => (
                  <li key={link}><a href="#">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Status bar */}
        <div className="footer-status-bar glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="live-indicator">
              <span className="live-dot" />
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#4ADE80' }}>All Systems Operational</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>ISS API · Weather API · Satellite Feed</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)' }}>Data refreshed every 5 seconds</span>
        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © 2025 Project Zenith. Built with ♥ by Harshith and Risheek for astronomy enthusiasts worldwide.
          </p>
          <p className="footer-quote">
            &ldquo;Bringing the infinite cosmos within a single browser tab.&rdquo;
          </p>
        </div>
      </div>
    </footer>
  );
}
