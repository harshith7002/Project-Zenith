'use client';

import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Globe, ArrowDown, ChevronRight, Activity } from 'lucide-react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

import StatsSection from '@/components/stats/StatsSection';
import Footer from '@/components/footer/Footer';

// Dynamic imports for heavy WebGL components
const Earth3D = dynamic(() => import('@/components/hero/Earth3D'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black z-0">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/30 text-xs tracking-widest uppercase">Initializing Celestial Eye...</p>
      </div>
    </div>
  ),
});

const GlobeSection = dynamic(() => import('@/components/globe/GlobeSection'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[480px] flex items-center justify-center bg-transparent max-w-6xl mx-auto my-12">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-white/40 text-xs tracking-wider">Syncing Global Coordinates...</p>
      </div>
    </div>
  ),
});

const SolarSystem = dynamic(() => import('@/components/solar-system/SolarSystem'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[550px] flex items-center justify-center bg-black border border-white/5 rounded-2xl max-w-6xl mx-auto my-12">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-yellow-500/30 border-t-yellow-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/40 text-sm">Loading 3D solar system...</p>
      </div>
    </div>
  ),
});

const Dashboard = dynamic(() => import('@/components/dashboard/Dashboard'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[400px] flex items-center justify-center bg-transparent max-w-6xl mx-auto my-12">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-white/40 text-xs tracking-wider">Establishing Telemetry Feed...</p>
      </div>
    </div>
  ),
});

const Timeline = dynamic(() => import('@/components/timeline/Timeline'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[400px] flex items-center justify-center bg-transparent max-w-6xl mx-auto my-12">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-white/40 text-xs tracking-wider">Retrieving Flight Plan...</p>
      </div>
    </div>
  ),
});

function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const ringX = useSpring(cursorX, { stiffness: 240, damping: 28 });
  const ringY = useSpring(cursorY, { stiffness: 240, damping: 28 });

  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const isInteractive = target.closest('a, button, input, select, textarea, [role="button"], .planet-chip, .glass-card, .stat-card, .timeline-bullet, .range-slider');
      if (isInteractive) {
        setHovered(true);
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const isInteractive = target.closest('a, button, input, select, textarea, [role="button"], .planet-chip, .glass-card, .stat-card, .timeline-bullet, .range-slider');
      if (isInteractive) {
        setHovered(false);
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
    };
  }, [cursorX, cursorY]);

  // Hide cursor on touch devices / mobile
  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) return null;

  return (
    <>
      {/* Inner Dot */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: '#fff',
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      />
      {/* Outer Glow Ring */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: hovered ? 46 : 24,
          height: hovered ? 46 : 24,
          borderRadius: '50%',
          border: hovered ? '1.5px solid rgba(6, 182, 212, 0.8)' : '1.5px solid rgba(255, 255, 255, 0.3)',
          boxShadow: hovered ? '0 0 16px rgba(6, 182, 212, 0.5)' : 'none',
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
          pointerEvents: 'none',
          zIndex: 9998,
        }}
        animate={{
          scale: hovered ? 1.15 : 1,
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      />
    </>
  );
}

export default function Home() {
  // Lenis smooth scroll initialization
  useEffect(() => {
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    import('lenis').then(({ default: Lenis }) => {
      lenis = new Lenis({
        duration: 1.5,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.2,
      });

      function raf(time: number) {
        lenis?.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    });

    return () => {
      if (lenis) lenis.destroy();
    };
  }, []);

  return (
    <main className="bg-transparent min-h-screen text-white relative overflow-x-hidden">
      {/* ── Fixed Background 3D Earth ── */}
      <Suspense fallback={null}>
        <Earth3D />
      </Suspense>

      {/* ── Cosmic Nebula Overlay ── */}
      <div className="fixed inset-0 pointer-events-none z-1 overflow-hidden opacity-12">
        <div className="absolute w-[500px] h-[500px] top-[-5%] left-[-10%] rounded-full filter blur-[120px] bg-[radial-gradient(circle,_rgba(124,58,237,0.15),_transparent_70%)]" />
        <div className="absolute w-[450px] h-[450px] top-[20%] right-[-5%] rounded-full filter blur-[100px] bg-[radial-gradient(circle,_rgba(6,182,212,0.12),_transparent_70%)]" />
      </div>

      {/* ── Navbar ── */}
      <header className="fixed top-0 inset-x-0 z-50 px-6 py-6 w-full pointer-events-none">
        <div className="navbar-glass rounded-full max-w-5xl mx-auto px-6 py-3 flex items-center justify-between shadow-2xl pointer-events-auto">
          {/* Left */}
          <div className="flex items-center">
            <Globe className="w-5 h-5 text-white mr-2" />
            <span className="text-white font-semibold text-base tracking-[0.2em] uppercase">Zenith</span>
          </div>

          {/* Center Links */}
          <div className="hidden md:flex gap-8 items-center">
            <a href="#hero" className="text-white/70 hover:text-white text-xs tracking-wider uppercase transition-colors">Mission Start</a>
            <a href="#briefing" className="text-white/70 hover:text-white text-xs tracking-wider uppercase transition-colors">Briefing</a>
            <a href="#command-center" className="text-white/70 hover:text-white text-xs tracking-wider uppercase transition-colors">Command Center</a>
            <a href="#solar" className="text-white/70 hover:text-white text-xs tracking-wider uppercase transition-colors">Solar Orbit</a>
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            <a 
              href="#dashboard" 
              className="liquid-glass rounded-full px-5 py-1.5 text-white text-xs font-semibold tracking-wider uppercase hover:bg-white/5 transition-colors border border-white/10"
            >
              Open Radar
            </a>
          </div>
        </div>
      </header>

      {/* ── SECTION 1: HERO LANDING EXPERIENCE ── */}
      <section id="hero" className="relative min-h-screen flex flex-col justify-between items-center px-6 py-20 z-10">
        {/* Top Spacer */}
        <div />

        {/* Hero Copy (Minimalist Apple/SpaceX style) */}
        <div className="text-center max-w-4xl mx-auto flex flex-col items-center">
          <motion.p
            initial={{ opacity: 0, letterSpacing: '0.1em' }}
            animate={{ opacity: 1, letterSpacing: '0.45em' }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="text-cyan-400 text-xs md:text-sm font-bold uppercase mb-4"
          >
            The Celestial Eye
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl lg:text-8xl text-white tracking-widest uppercase font-extrabold mb-6 leading-tight"
          >
            PROJECT ZENITH
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-white/60 text-base md:text-lg max-w-lg leading-relaxed mb-10 font-light"
          >
            Observe Everything Above You
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <a 
              href="#briefing" 
              className="liquid-glass rounded-full px-8 py-3.5 text-white text-xs font-bold tracking-[0.2em] uppercase hover:bg-white/5 transition-all border border-white/10 shadow-lg cursor-pointer inline-block"
            >
              Begin Mission
            </a>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 0.5, y: 0 }}
          transition={{ delay: 1.4, duration: 1.2, repeat: Infinity, repeatType: 'reverse' }}
          className="flex flex-col items-center gap-2 pointer-events-none"
        >
          <span className="text-[10px] tracking-[0.3em] uppercase text-white/40">Scroll to descend</span>
          <ArrowDown className="w-4 h-4 text-white/40" />
        </motion.div>
      </section>

      {/* ── SECTION 2: MISSION BRIEFING ── */}
      <section id="briefing" className="min-h-screen flex items-center justify-center py-32 px-6 relative z-10 bg-transparent">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Spacer to make room for fixed background 3D Earth */}
          <div className="hidden md:block" />

          {/* Briefing Text Column */}
          <div className="flex flex-col justify-center">
            <motion.span 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-cyan-400 text-xs tracking-[0.25em] uppercase font-bold mb-4 flex items-center gap-2"
            >
              <Activity className="w-4 h-4 animate-pulse" /> MISSION PROFILE
            </motion.span>
            
            <motion.h2 
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl md:text-5xl text-white font-normal leading-tight mb-6 tracking-tight"
              style={{ fontFamily: 'var(--font-instrument)' }}
            >
              Tracking the infinite sky, <em className="italic text-white/70">moment by moment</em>.
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-white/60 text-base md:text-lg leading-relaxed mb-8 font-light"
            >
              Project Zenith functions as a real-time cosmic radar, calculating the exact path of space assets and celestial bodies currently intersecting Nagpur&apos;s meridian and global locations.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <a href="#dashboard" className="liquid-glass rounded-full px-8 py-3 text-white text-xs tracking-wider uppercase font-medium hover:bg-white/5 transition-colors border border-white/10 shadow-md inline-flex items-center gap-2">
                Access Radar Terminal <ChevronRight className="w-4 h-4" />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: COMMAND CENTER (Centerpiece) ── */}
      <div id="command-center" className="relative z-10 bg-transparent">
        {/* Numbers HUD */}
        <StatsSection />

        {/* 3D Observation Globe (Coordinate Capture HUD) */}
        <Suspense fallback={null}>
          <GlobeSection />
        </Suspense>

        {/* Telemetry Radar Dashboard */}
        <Suspense fallback={null}>
          <Dashboard />
        </Suspense>

        {/* Flight Timeline Axis */}
        <Suspense fallback={null}>
          <Timeline />
        </Suspense>
      </div>

      {/* ── SECTION 4: SOLAR SYSTEM VISUALIZATION ── */}
      <div id="solar" className="relative z-10 bg-black">
        <Suspense fallback={null}>
          <SolarSystem />
        </Suspense>
      </div>

      {/* ── FOOTER ── */}
      <Footer />

      {/* ── Custom Interactive Cursor ── */}
      <CustomCursor />
    </main>
  );
}
