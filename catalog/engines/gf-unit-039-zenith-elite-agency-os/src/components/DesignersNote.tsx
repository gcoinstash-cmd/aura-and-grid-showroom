import { Reveal } from "./Reveal";
import { motion, AnimatePresence } from "motion/react";
import { Info, X } from "lucide-react";

interface DesignersNoteProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const DesignersNote = ({ isOpen, setIsOpen }: DesignersNoteProps) => {
  return (
    <>
      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-12 left-12 z-[100] group"
      >
        <div className="glass px-6 py-3 rounded-full flex items-center gap-3 border-white/10 hover:border-neon/40 hover:shadow-[0_0_20px_rgba(204,255,0,0.15)] transition-all">
          <Info size={16} className="text-accent/60 group-hover:text-neon transition-colors" />
          <span className="text-xs font-semibold tracking-wider font-bold tracking-[0.2em] uppercase text-accent/60 group-hover:text-accent transition-colors">
            Behind the Design
          </span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.section 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed inset-x-0 bottom-0 z-[90] py-32 px-6 glass border-t border-white/10 shadow-[0_-50px_100px_rgba(0,0,0,0.5)] max-h-[80vh] overflow-y-auto no-scrollbar"
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-12 right-12 text-accent/40 hover:text-accent transition-colors"
            >
              <X size={24} />
            </button>

            <div className="max-w-4xl mx-auto relative z-10">
              <Reveal>
                <span className="font-mono text-xs font-semibold tracking-wider uppercase tracking-[0.5em] text-accent/30 mb-8 block">
                  ETSY SELLER VALUE-ADD: DESIGNER'S NOTE
                </span>
              </Reveal>
              
              <Reveal delay={0.2}>
                <h3 className="font-serif text-3xl md:text-4xl italic tracking-tight mb-12 text-accent">
                  Why the "Zen-Dark" Architecture Converts
                </h3>
              </Reveal>

              <div className="grid md:grid-cols-2 gap-16 text-accent/50 leading-relaxed font-sans text-sm pb-12">
                <Reveal delay={0.3}>
                  <div className="space-y-6">
                    <p>
                      <strong className="text-accent/80 font-medium tracking-wide uppercase text-xs font-semibold tracking-wider block mb-2 font-mono">Cognitive Clarity</strong>
                      By utilizing aggressive negative space and a restricted monochrome palette, we eliminate the "Visual Noise" that plagues modern portfolios. This directs focus purely on the work, increasing retention.
                    </p>
                    <p>
                      <strong className="text-accent/80 font-medium tracking-wide uppercase text-xs font-semibold tracking-wider block mb-2 font-mono">Premium Positioning</strong>
                      High-contrast dark mode combined with glassmorphism signals luxury and technical proficiency. It positions your client as an authority rather than just another service provider.
                    </p>
                  </div>
                </Reveal>
                <Reveal delay={0.4}>
                  <div className="space-y-6">
                    <p>
                      <strong className="text-accent/80 font-medium tracking-wide uppercase text-xs font-semibold tracking-wider block mb-2 font-mono">Motion Hierarchy</strong>
                      Every scroll reveal is intentionally timed to guide the eye through the narrative. Animation is used strategically to focus attention on core content and conversions.
                    </p>
                    <p>
                      <strong className="text-accent/80 font-medium tracking-wide uppercase text-xs font-semibold tracking-wider block mb-2 font-mono">Minimal Friction</strong>
                      The Schibsted Grotesk + Playfair Display pairing creates a legible yet sophisticated environment that reduces cognitive load, leading to higher quality inquiries.
                    </p>
                  </div>
                </Reveal>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
};
