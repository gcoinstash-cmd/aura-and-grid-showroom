import { Reveal } from "./Reveal";
import { ArrowUpRight } from "lucide-react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useRef, MouseEvent } from "react";

const MagneticArrow = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 15, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
    
    if (dist < 150) {
      mouseX.set((e.clientX - centerX) * 0.4);
      mouseY.set((e.clientY - centerY) * 0.4);
    } else {
      mouseX.set(0);
      mouseY.set(0);
    }
  };

  return (
    <div 
      className="flex items-center justify-center w-32 h-32"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
    >
      <motion.div 
        ref={ref}
        style={{ x, y }}
        className="w-24 h-24 rounded-full glass flex items-center justify-center border-white/20 hover:border-neon/40 hover:shadow-[0_0_20px_rgba(204,255,0,0.15)] transition-all cursor-pointer"
      >
        <ArrowUpRight size={40} className="text-accent/60 group-hover:text-neon transition-colors" />
      </motion.div>
    </div>
  );
};

export const Footer = () => {
  return (
    <footer className="pt-48 pb-12 px-12 relative z-10 bg-base border-t border-white/[0.05]">
      <div className="max-w-7xl mx-auto flex flex-col gap-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
          <div className="space-y-4">
            <div className="text-xs font-semibold tracking-wider tracking-[0.5em] opacity-30 uppercase font-mono">
              Next Stage
            </div>
            <Reveal>
              <a 
                href="mailto:hello@zenith.studio"
                className="group inline-flex items-center gap-8"
              >
                <h2 className="font-serif text-6xl md:text-9xl font-extralight italic tracking-tighter text-accent/80 group-hover:text-accent transition-all duration-700 hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  Start a Project.
                </h2>
                <div className="hidden md:block">
                  <MagneticArrow />
                </div>
              </a>
            </Reveal>
          </div>
          
          <div className="flex flex-col gap-6 md:items-end">
            <div className="glass px-10 py-4 rounded-full text-xs font-semibold tracking-wider font-bold tracking-[0.3em] uppercase cursor-pointer hover:bg-white/10 transition-all shadow-2xl border-white/10 text-accent/60 hover:text-accent">
              View Manifest
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-12 border-t border-white/[0.03]">
          <div className="flex gap-12 font-mono text-[9px] tracking-[0.2em] text-[#666666] uppercase">
            <a href="#" className="hover:text-accent transition-colors">Instagram</a>
            <a href="#" className="hover:text-accent transition-colors">Twitter</a>
            <a href="#" className="hover:text-accent transition-colors">Archive</a>
          </div>
          
          <div className="font-mono text-[9px] tracking-[0.2em] text-[#666666] uppercase">
            &copy; 2024 Zenith Studio / Legal
          </div>
        </div>
      </div>
      
      {/* Background visual flair */}
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-white/[0.01] blur-[120px] rounded-full pointer-events-none -z-10" />
    </footer>
  );
};
