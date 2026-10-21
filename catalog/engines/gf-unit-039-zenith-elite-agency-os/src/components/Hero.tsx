import { motion } from "motion/react";
import { Reveal } from "./Reveal";

export const Hero = ({ onOpenAdmin }: { onOpenAdmin?: () => void }) => {
  return (
    <section className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-base px-6">
      {onOpenAdmin && (
        <div className="absolute top-8 right-8 z-30">
          <button
            type="button"
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-white/20 hover:border-white/40 text-accent font-mono text-base font-semibold min-h-[44px] font-semibold tracking-wider uppercase tracking-widest transition-all cursor-pointer shadow-lg"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
            [ ATELIER PASS ]
          </button>
        </div>
      )}
      <div className="relative z-10 max-w-5xl text-center flex flex-col items-center">
        <Reveal delay={0.1}>
          <div className="text-xs font-semibold tracking-wider tracking-[0.2em] opacity-60 mb-8 uppercase font-mono">
            Creative Direction & Narrative Design
          </div>
        </Reveal>
        
        <Reveal delay={0.2} className="mb-4">
          <h1 className="font-serif text-8xl md:text-9xl font-light tracking-tight leading-none italic text-accent">
            Ethereal Forms.
          </h1>
        </Reveal>

        <Reveal delay={0.4} className="mx-auto">
          <p className="max-w-md mx-auto text-xs font-semibold leading-relaxed opacity-40 uppercase tracking-[0.25em] font-sans">
            Digital craftsmanship for the elite creative sector. We shape the void between technical precision and cinematic atmosphere.
          </p>
        </Reveal>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-24"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-px h-16 bg-gradient-to-b from-accent/20 to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
