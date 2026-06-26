'use client';
import { motion } from 'framer-motion';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const StarField = dynamic(() => import('./StarField'), { ssr: false });
const Earth3D = dynamic(() => import('./Earth3D'), { ssr: false });

function ShootingStar({ delay, duration, startX, startY }: {
  delay: number; duration: number; startX: string; startY: string;
}) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        height: '1px',
        width: '160px',
        left: startX,
        top: startY,
        rotate: '-35deg',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
        pointerEvents: 'none',
        zIndex: 5,
      }}
      initial={{ opacity: 0, x: -200 }}
      animate={{ opacity: [0, 1, 0], x: [0, 500] }}
      transition={{ delay, duration, repeat: Infinity, repeatDelay: Math.random() * 10 + 6, ease: 'easeOut' }}
    />
  );
}

function NebulaBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* Main violet nebula */}
      <div className="glow-blob" style={{ width: 700, height: 700, top: '5%', left: '-10%', background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 65%)' }} />
      {/* Cyan nebula right */}
      <div className="glow-blob" style={{ width: 500, height: 500, top: '20%', right: '-5%', background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 65%)' }} />
      {/* Deep blue bottom */}
      <div className="glow-blob" style={{ width: 600, height: 600, bottom: '-10%', left: '30%', background: 'radial-gradient(circle, rgba(30,64,175,0.12) 0%, transparent 65%)' }} />
      {/* Noise overlay */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '200px 200px',
      }} />
    </div>
  );
}

export default function HeroSection() {
  return (
    <section id="hero" className="hero-section">
      <NebulaBackground />

      {/* Star field */}
      <Suspense fallback={null}>
        <StarField />
      </Suspense>

      {/* Shooting stars */}
      {[
        { delay: 3, duration: 1.4, startX: '8%', startY: '15%' },
        { delay: 7, duration: 1.8, startX: '55%', startY: '8%' },
        { delay: 11, duration: 1.2, startX: '25%', startY: '55%' },
        { delay: 16, duration: 2, startX: '70%', startY: '25%' },
        { delay: 20, duration: 1.5, startX: '15%', startY: '72%' },
      ].map((s, i) => <ShootingStar key={i} {...s} />)}

      {/* 3D Earth container */}
      <div
        style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}
      >
        <Suspense fallback={null}>
          <Earth3D />
        </Suspense>
      </div>

      {/* Hero content */}
      <div className="hero-content">
        {/* Live badge */}
        <motion.div
          className="live-badge"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="live-dot" />
          Live · Real-Time Space Intelligence
        </motion.div>

        {/* Title - Cinematic sliding reveal */}
        <h1 style={{ width: '100%', overflow: 'hidden' }}>
          <div style={{ overflow: 'hidden', paddingBottom: '4px' }}>
            <motion.span
              className="hero-title-line1"
              style={{ display: 'block' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              PROJECT
            </motion.span>
          </div>
          <div style={{ overflow: 'hidden', paddingBottom: '4px' }}>
            <motion.span
              className="hero-title-line2"
              style={{ display: 'block' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ duration: 1.2, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              ZENITH
            </motion.span>
          </div>
        </h1>

        {/* Subtitle - Expanding tracking */}
        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0, letterSpacing: '0.05em' }}
          animate={{ opacity: 1, letterSpacing: '0.25em' }}
          transition={{ duration: 1.4, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          The Celestial Eye
        </motion.p>

        {/* Description */}
        <motion.p
          className="hero-desc"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
        >
          Discover satellites, planets, stars, and constellations visible above any
          location on Earth — in real time. No telescope required.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="hero-buttons"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <button className="btn-primary">
            🌌 Explore Universe
          </button>
          <button className="btn-ghost">
            🛸 ISS Live Tracking
            <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>→</motion.span>
          </button>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="hero-scroll"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2, duration: 1.2 }}
      >
        <span>Scroll to explore</span>
        <div className="hero-scroll-line" />
      </motion.div>

      {/* Bottom vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 15,
        background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, #050816 100%)',
      }} />
    </section>
  );
}
