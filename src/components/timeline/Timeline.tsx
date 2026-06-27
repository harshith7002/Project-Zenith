'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { TIMELINE_STEPS } from '@/lib/constants';

function TimelineSpotlightCard({ item }: { item: typeof TIMELINE_STEPS[number] }) {
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
      className="timeline-card glass-card"
      style={{ position: 'relative', overflow: 'hidden' }}
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
      <div style={{ position: 'relative', zIndex: 3 }}>
        <span className="timeline-card-icon">{item.icon}</span>
        <p className="timeline-card-step" style={{ color: '#06B6D4', fontWeight: 700 }}>Step {item.step}</p>
        <h3 className="timeline-card-title">{item.title}</h3>
        <p className="timeline-card-desc">{item.description}</p>
      </div>
    </div>
  );
}

export default function Timeline() {
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start 85%', 'end 15%'] });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section className="timeline-section" id="timeline">
      {/* Glow */}
      <div className="glow-blob" style={{ width: 400, height: 400, top: '30%', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgba(124,58,237,0.06), transparent 65%)' }} />

      <div className="section-container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-eyebrow">How It Works</span>
          <h2 className="section-title">
            Your journey to the <span className="gradient-span">stars</span>
          </h2>
          <p className="section-subtitle">
            Five steps from a single click to a full celestial exploration experience.
          </p>
        </motion.div>

        {/* Timeline track */}
        <div className="timeline-track" ref={trackRef}>
          {/* Background axis line */}
          <div className="timeline-axis" />
          {/* Animated progress fill */}
          <motion.div
            className="timeline-axis-fill"
            style={{ height: lineHeight }}
          />

          <div className="timeline-items">
            {TIMELINE_STEPS.map((item, i) => {
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={item.step}
                  className="timeline-item"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                >
                  {/* Left slot */}
                  <div className="timeline-item-left">
                    {isLeft && (
                      <TimelineSpotlightCard item={item} />
                    )}
                  </div>

                  {/* Center node */}
                  <div className="timeline-item-center">
                    <motion.div
                      className="timeline-node"
                      whileHover={{ scale: 1.15 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.step}
                    </motion.div>
                  </div>

                  {/* Right slot */}
                  <div className="timeline-item-right">
                    {!isLeft && (
                      <TimelineSpotlightCard item={item} />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
