/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { templateData } from "../data/templateData";

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <section 
      id="home" 
      ref={containerRef}
      className="relative h-screen w-full flex items-center overflow-hidden"
    >
      {/* Background Image with Overlay */}
      <motion.div 
        style={{ y }}
        className="absolute inset-0 z-0"
      >
        <img
          src={templateData.hero.backgroundImage}
          alt="Hero background"
          className="w-full h-full object-cover grayscale-[20%] sepia-[.3]"
          referrerPolicy="no-referrer"
        />
        {/* Vignette & Gradient Overlays */}
        <div className="absolute inset-0 bg-brand-charcoal/40 bg-gradient-to-t from-brand-charcoal/80 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,rgba(0,0,0,0.5)_100%)] pointer-events-none" />
      </motion.div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-32 flex flex-col items-center justify-center text-center">
        <div className="max-w-4xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-brand-gold font-sans font-semibold uppercase tracking-[0.4em] mb-8 text-xs font-semibold tracking-wider"
          >
            {templateData.brand.tagline}
          </motion.p>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-[10vw] md:text-[80px] lg:text-[96px] text-brand-cream leading-[1.1] mb-12 font-serif tracking-tighter"
          >
            {templateData.hero.title.split(' ').map((word, i) => (
              <span key={i} className={i % 2 !== 0 ? "text-brand-burgundy italic block sm:inline" : ""}>
                {word}{' '}
              </span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="text-lg md:text-xl text-brand-gold/70 max-w-xl mx-auto mb-12 font-light italic leading-relaxed"
          >
            {templateData.hero.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-6 justify-center"
          >
            <motion.a
              href="#reservations"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden px-8 py-4 bg-brand-gold text-brand-charcoal uppercase tracking-[0.2em] text-xs font-semibold tracking-wider font-bold hover:bg-brand-burgundy hover:text-brand-cream transition-all duration-500 text-center group"
            >
              <span className="relative z-10">Book a Table</span>
              {/* Shimmer Effect */}
              <motion.div
                animate={{
                  x: ["-100%", "200%"],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  repeatDelay: 4,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-cream/40 to-transparent skew-x-[-20deg]"
              />
            </motion.a>
            <a
              href="#menu"
              className="px-8 py-4 border border-brand-stone text-brand-cream uppercase tracking-[0.2em] text-xs font-semibold tracking-wider font-bold hover:bg-brand-cream hover:text-brand-charcoal transition-all duration-500 text-center"
            >
              Explore Menu
            </a>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 hidden md:flex"
      >
        <motion.span 
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-xs font-semibold tracking-wider text-brand-gold/50 uppercase tracking-[0.4em] rotate-180 [writing-mode:vertical-lr] font-bold"
        >
          Scroll to Explore
        </motion.span>
        <motion.div 
          animate={{ height: [32, 64, 32], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-px bg-gradient-to-b from-brand-gold to-transparent" 
        />
      </motion.div>
    </section>
  );
}
