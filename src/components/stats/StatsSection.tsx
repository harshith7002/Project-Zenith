'use client';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { STATS } from '@/lib/constants';

function AnimatedCounter({ target, duration = 2 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const animate = (now: number) => {
            const elapsed = (now - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section className="stats-section">
      {/* Glow blob */}
      <div className="glow-blob" style={{ width: 500, height: 500, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle, rgba(124,58,237,0.08), transparent 65%)' }} />

      <div className="section-container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-eyebrow">By The Numbers</span>
          <h2 className="section-title">
            The scale of the <span className="gradient-span">observable universe</span>
          </h2>
          <p className="section-subtitle">
            Real-time coverage across every orbital shell, constellation, and deep-sky object above you.
          </p>
        </motion.div>

        <div className="stats-grid">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="stat-card glass-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              {/* Top accent line */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '20%',
                right: '20%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #7C3AED, #06B6D4, transparent)',
                borderRadius: '0 0 2px 2px',
              }} />

              <span className="stat-icon">{stat.icon}</span>

              <div className="stat-value">
                <AnimatedCounter target={stat.value} />
                {stat.suffix && <span className="stat-suffix">{stat.suffix}</span>}
              </div>

              <p className="stat-label">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
