'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

export default function ServicesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section 
      ref={sectionRef}
      className="bg-black py-28 md:py-40 px-6 overflow-hidden relative"
    >
      {/* Subtle radial gradient overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.02)_0%,_transparent_60%)]" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header row */}
        <motion.div 
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={headerVariants}
          className="flex justify-between items-end mb-12 md:mb-16 border-b border-white/5 pb-6"
        >
          <h2 className="text-3xl md:text-5xl text-white tracking-tight font-normal">
            What we track
          </h2>
          <span className="text-white/40 text-sm tracking-wider uppercase font-medium hidden md:inline">
            Tracking Modules
          </span>
        </motion.div>

        {/* Two-card grid */}
        <motion.div 
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"
        >
          {/* Card 1 */}
          <motion.div 
            variants={cardVariants}
            className="liquid-glass rounded-3xl overflow-hidden group border border-white/5 flex flex-col justify-between"
          >
            {/* Card video area */}
            <div className="aspect-video w-full overflow-hidden relative border-b border-white/5">
              <video
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
                muted
                autoPlay
                loop
                playsInline
                preload="auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>

            {/* Card body */}
            <div className="p-6 md:p-8 flex flex-col flex-1">
              <div className="flex justify-between items-center mb-6">
                <span className="uppercase tracking-widest text-white/40 text-xs font-semibold">
                  Telemetry
                </span>
                <div className="liquid-glass rounded-full p-2 text-white border border-white/10 group-hover:bg-white group-hover:text-black transition-colors duration-300">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-white text-xl md:text-2xl mb-3 tracking-tight font-medium">
                Orbital Vectors & Telemetry
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">
                We ingest active satellite coordinates and space station vectors, mapping their trajectories relative to your exact location in real time.
              </p>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            variants={cardVariants}
            className="liquid-glass rounded-3xl overflow-hidden group border border-white/5 flex flex-col justify-between"
          >
            {/* Card video area */}
            <div className="aspect-video w-full overflow-hidden relative border-b border-white/5">
              <video
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4"
                muted
                autoPlay
                loop
                playsInline
                preload="auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>

            {/* Card body */}
            <div className="p-6 md:p-8 flex flex-col flex-1">
              <div className="flex justify-between items-center mb-6">
                <span className="uppercase tracking-widest text-white/40 text-xs font-semibold">
                  Sky Map
                </span>
                <div className="liquid-glass rounded-full p-2 text-white border border-white/10 group-hover:bg-white group-hover:text-black transition-colors duration-300">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-white text-xl md:text-2xl mb-3 tracking-tight font-medium">
                Celestial Horizon Projection
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Using observer coordinates as the focal point, we calculate and visualize the planets, stars, and constellations passing through your zenith.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
