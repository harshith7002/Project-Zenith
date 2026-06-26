'use client';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

const NAV_LINKS = [
  { label: 'Globe', href: '#globe' },
  { label: 'Solar System', href: '#solar' },
  { label: 'Dashboard', href: '#dashboard' },
  { label: 'Timeline', href: '#timeline' },
  { label: 'Features', href: '#features' },
];

interface AlertNotification {
  id: string;
  message: string;
  time: string;
  icon: string;
  read: boolean;
}

const INITIAL_ALERTS: AlertNotification[] = [
  { id: '1', message: 'ISS visible in 23 minutes.', time: '23m ago', icon: '🛸', read: false },
  { id: '2', message: 'Jupiter will be visible at 8:41 PM.', time: 'Today', icon: '🪐', read: false },
  { id: '3', message: 'Meteor shower starts tonight.', time: 'Tonight', icon: '🌠', read: false },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertNotification[]>(INITIAL_ALERTS);
  const [toasts, setToasts] = useState<AlertNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 60));

  // Auto trigger toasts on mount for visual feedback
  useEffect(() => {
    const timers = [
      setTimeout(() => {
        setToasts(prev => {
          if (prev.some(t => t.id === '1')) return prev;
          return [...prev, INITIAL_ALERTS[0]];
        });
      }, 1500),
      setTimeout(() => {
        setToasts(prev => {
          if (prev.some(t => t.id === '2')) return prev;
          return [...prev, INITIAL_ALERTS[1]];
        });
      }, 3000),
      setTimeout(() => {
        setToasts(prev => {
          if (prev.some(t => t.id === '3')) return prev;
          return [...prev, INITIAL_ALERTS[2]];
        });
      }, 4500)
    ];

    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      timers.forEach(clearTimeout);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadCount = alerts.filter(a => !a.read).length;

  const handleMarkAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  };

  const handleRetriggerToasts = () => {
    setToasts([]);
    // Sequence them
    setTimeout(() => {
      setToasts([INITIAL_ALERTS[0]]);
    }, 300);
    setTimeout(() => {
      setToasts(prev => [...prev, INITIAL_ALERTS[1]]);
    }, 1500);
    setTimeout(() => {
      setToasts(prev => [...prev, INITIAL_ALERTS[2]]);
    }, 2700);
  };

  const handleDismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <>
      <motion.header
        className="navbar"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={`navbar-inner ${scrolled ? 'scrolled' : ''}`}>
          {/* Logo */}
          <a href="#hero" className="navbar-logo">
            <div className="navbar-logo-icon">Z</div>
            <div>
              <p style={{ fontSize: '0.8125rem', fontWeight: 900, letterSpacing: '0.12em', color: '#fff', lineHeight: 1.2 }}>
                ZENITH
              </p>
              <p style={{ fontSize: '0.5625rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
                Celestial Eye
              </p>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex">
            <ul className="navbar-links">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <div className="live-indicator">
              <span className="live-dot" />
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#4ADE80', letterSpacing: '0.1em' }}>LIVE</span>
            </div>

            {/* Notification Bell */}
            <div className="notification-container" ref={dropdownRef}>
              <button 
                className="notification-bell-btn" 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="Alerts"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    className="notification-dropdown"
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="notification-dropdown-header">
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>Personalized Alerts</h4>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={handleRetriggerToasts}
                          style={{ background: 'none', border: 'none', color: '#38D1F0', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600 }}
                          title="Test Alerts Screen Popup"
                        >
                          Test Toasts
                        </button>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            style={{ background: 'none', border: 'none', color: '#A78BFA', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Read All
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="notification-list">
                      {alerts.map(item => (
                        <div 
                          key={item.id} 
                          className="notification-item"
                          style={{ opacity: item.read ? 0.6 : 1 }}
                        >
                          <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '0.75rem', color: '#fff', fontWeight: item.read ? 400 : 600 }}>{item.message}</p>
                            <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.125rem' }}>{item.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              className="btn-primary"
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem', borderRadius: '0.75rem' }}
            >
              Launch App
            </button>
          </div>

          {/* Mobile toggle & bell */}
          <div className="flex md:hidden items-center gap-3">
            {/* Bell icon in mobile too */}
            <div className="notification-container" ref={dropdownRef}>
              <button 
                className="notification-bell-btn" 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{ padding: '0.375rem 0.5rem', fontSize: '1rem' }}
              >
                🔔
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    className="notification-dropdown"
                    style={{ right: '-60px', width: '280px' }}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="notification-dropdown-header">
                      <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fff' }}>Personalized Alerts</h4>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={handleRetriggerToasts}
                          style={{ background: 'none', border: 'none', color: '#38D1F0', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Test Toasts
                        </button>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            style={{ background: 'none', border: 'none', color: '#A78BFA', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Read All
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="notification-list">
                      {alerts.map(item => (
                        <div 
                          key={item.id} 
                          className="notification-item"
                          style={{ opacity: item.read ? 0.6 : 1 }}
                        >
                          <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '0.7rem', color: '#fff', fontWeight: item.read ? 400 : 600 }}>{item.message}</p>
                            <p style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.125rem' }}>{item.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.25rem', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <motion.div
            style={{
              maxWidth: '1280px',
              margin: '0.5rem auto 0',
              borderRadius: '1rem',
              background: 'rgba(5,8,22,0.95)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
              padding: '1rem 1.25rem',
            }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'block',
                  padding: '0.75rem 0',
                  fontSize: '0.9375rem',
                  color: 'rgba(255,255,255,0.6)',
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {link.label}
              </a>
            ))}
          </motion.div>
        )}
      </motion.header>

      {/* Floating Toast Notification Stack */}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              className="toast-alert"
              initial={{ opacity: 0, x: 50, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{toast.icon}</span>
                <div>
                  <h5 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#A78BFA' }}>Space Alert</h5>
                  <p style={{ fontSize: '0.75rem', color: '#fff', marginTop: '0.125rem' }}>{toast.message}</p>
                </div>
              </div>
              <button 
                className="toast-close"
                onClick={() => handleDismissToast(toast.id)}
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

