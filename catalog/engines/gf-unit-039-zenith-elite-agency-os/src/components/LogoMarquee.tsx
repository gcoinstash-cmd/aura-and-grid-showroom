import { motion } from "motion/react";

const LOGOS = ["VELVET", "OBSIDIAN", "MONO", "ARCH", "KINETIC", "SILK", "OAK"];

export const LogoMarquee = () => {
  return (
    <div className="py-24 border-y border-white/5 overflow-hidden bg-base relative z-10 flex flex-col items-center">
      <div className="text-xs font-semibold tracking-wider tracking-[0.5em] opacity-30 uppercase font-mono mb-12">
        Trusted by Sector Leaders
      </div>
      <motion.div 
        animate={{ x: [0, -1035] }}
        transition={{ 
          duration: 30, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className="flex whitespace-nowrap gap-24 items-center"
      >
        {[...LOGOS, ...LOGOS, ...LOGOS].map((logo, i) => (
          <span 
            key={i} 
            className="text-xs font-semibold font-bold tracking-[0.4em] text-accent/20 hover:text-accent/60 transition-colors cursor-default uppercase"
          >
            {logo}
          </span>
        ))}
      </motion.div>
    </div>
  );
};
