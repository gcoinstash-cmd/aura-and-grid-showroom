import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";

export const ZenSpacer = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const pathLength = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div ref={ref} className="relative h-[300px] w-full flex items-center justify-center">
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-white/[0.03]" />
      <motion.div
        style={{ 
          scaleY: pathLength,
          originY: 0
        }}
        className="absolute top-0 h-full left-1/2 -translate-x-1/2 w-[2px] bg-gradient-to-b from-neon/40 to-transparent shadow-[0_0_15px_rgba(204,255,0,0.2)]"
      />
    </div>
  );
};
