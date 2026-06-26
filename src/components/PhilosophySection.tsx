'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function PhilosophySection() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  
  const headingInView = useInView(headingRef, { once: true, margin: "-100px" });
  const gridInView = useInView(gridRef, { once: true, margin: "-100px" });

  return (
    <section className="bg-black py-28 md:py-40 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <motion.h2
          ref={headingRef}
          initial={{ opacity: 0, y: 40 }}
          animate={headingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-7xl lg:text-8xl text-white tracking-tight mb-16 md:mb-24"
        >
          <span className="font-serif italic text-white/40 mr-4" style={{ fontFamily: 'var(--font-instrument)' }}>
            Telemetry then x
          </span> 
          Vision
        </motion.h2>

        {/* Two-Column Grid */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left: Video */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={gridInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl overflow-hidden aspect-[4/3] w-full border border-white/5 shadow-2xl"
          >
            <video
              className="w-full h-full object-cover"
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4"
              muted
              autoPlay
              loop
              playsInline
              preload="auto"
            />
          </motion.div>

          {/* Right: Text Blocks */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={gridInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-8 md:gap-10"
          >
            {/* Block 1 */}
            <div className="flex flex-col">
              <span className="text-white/40 text-xs tracking-widest uppercase mb-4 font-semibold">
                Real-Time Tracking
              </span>
              <p className="text-white/70 text-base md:text-lg leading-relaxed font-normal">
                Every celestial orbit is tracked with precision. We integrate live telemetry feeds to dynamically calculate and plot the exact path of active satellites, orbital vectors, and space station paths.
              </p>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-white/10" />

            {/* Block 2 */}
            <div className="flex flex-col">
              <span className="text-white/40 text-xs tracking-widest uppercase mb-4 font-semibold">
                Horizon Mapping
              </span>
              <p className="text-white/70 text-base md:text-lg leading-relaxed font-normal">
                We believe that science becomes immersive when paired with intuitive design. Our horizon modules translate geographic intersections and stellar vectors into a personalized view of the cosmos.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
