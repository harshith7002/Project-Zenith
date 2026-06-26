'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function FeaturedVideoSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section className="bg-black pt-6 md:pt-10 pb-20 md:pb-32 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl overflow-hidden aspect-video w-full group border border-white/5 shadow-2xl"
        >
          {/* Video element */}
          <video
            className="w-full h-full object-cover"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260402_054547_9875cfc5-155a-4229-8ec8-b7ba7125cbf8.mp4"
            muted
            autoPlay
            loop
            playsInline
            preload="auto"
          />

          {/* Gradient overlay on video */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

          {/* Bottom overlay content */}
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 relative z-10">
            {/* Left: Our Approach Card */}
            <div className="liquid-glass rounded-2xl p-6 md:p-8 max-w-md border border-white/10 shadow-lg">
              <span className="block text-white/50 text-[10px] md:text-xs tracking-widest uppercase mb-3 font-semibold">
                Observer Horizon
              </span>
              <p className="text-white text-sm md:text-base leading-relaxed font-normal">
                By calculating the local horizon coordinates relative to geographic coordinates, Project Zenith projects orbital paths, active satellite transits, and stellar meridians directly overhead in real time.
              </p>
            </div>

            {/* Right: Explore More Button */}
            <div className="flex justify-start md:justify-end md:pb-2">
              <a href="#globe" className="inline-block">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="liquid-glass rounded-full px-8 py-3 text-white text-sm font-medium hover:bg-white/5 transition-colors cursor-pointer border border-white/10 shadow-md"
                >
                  Activate Radar
                </motion.button>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
