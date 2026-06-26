'use client';
import { useRef } from 'react';
import { motion } from 'framer-motion';
import { FEATURES } from '@/lib/constants';

function FeatureSpotlightCard({ feature, delay }: { feature: typeof FEATURES[number]; delay: number }) {
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
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className="feature-card glass-card"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      style={{ '--feature-color': feature.color, position: 'relative' } as React.CSSProperties}
    >
      {/* Dynamic spot gradient behind card */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        background: `linear-gradient(135deg, ${feature.color}15, transparent 60%)`,
        opacity: 0,
        transition: 'opacity 0.4s ease',
        zIndex: 0,
        pointerEvents: 'none'
      }}
        className="feature-hover-overlay"
      />

      {/* Glow dot */}
      <div
        className="feature-glow-dot"
        style={{ backgroundColor: feature.color, boxShadow: `0 0 8px ${feature.color}`, zIndex: 3 }}
      />

      {/* Icon */}
      <div
        className="feature-icon-wrap"
        style={{
          background: `${feature.color}18`,
          border: `1px solid ${feature.color}30`,
          zIndex: 3
        }}
      >
        {feature.icon}
      </div>

      <h3 className="feature-title" style={{ zIndex: 3 }}>{feature.title}</h3>
      <p className="feature-desc" style={{ zIndex: 3 }}>{feature.description}</p>
    </motion.div>
  );
}

export default function FeaturesSection() {
  return (
    <section className="features-section" id="features">
      {/* Glow blobs */}
      <div className="glow-blob" style={{ width: 500, height: 500, top: '-10%', right: '-5%', background: 'radial-gradient(circle, rgba(124,58,237,0.15), transparent 65%)' }} />
      <div className="glow-blob" style={{ width: 400, height: 400, bottom: '0%', left: '-5%', background: 'radial-gradient(circle, rgba(6,182,212,0.1), transparent 65%)' }} />

      <div className="section-container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-eyebrow">Core Capabilities</span>
          <h2 className="section-title">
            Everything you need to{' '}
            <span className="gradient-span">explore space</span>
          </h2>
          <p className="section-subtitle">
            A unified platform that brings real-time space intelligence to your browser. No telescope required.
          </p>
        </motion.div>

        <div className="features-grid">
          {FEATURES.map((feature, i) => (
            <FeatureSpotlightCard
              key={feature.title}
              feature={feature}
              delay={i * 0.08}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
