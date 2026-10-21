import { motion, useInView } from "motion/react";
import React, { useRef, ReactNode } from "react";
import { cn } from "@/src/lib/utils";

interface RevealProps {
  children: ReactNode;
  width?: "fit-content" | "100%";
  className?: string;
  delay?: number;
}

export const Reveal: React.FC<RevealProps> = ({ children, width = "fit-content", className, delay = 0.2 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -100px 0px" });

  return (
    <div ref={ref} style={{ width }} className={cn("relative overflow-hidden", className)}>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 30 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        transition={{ duration: 0.8, delay, ease: [0.2, 0.65, 0.3, 0.9] }}
      >
        {children}
      </motion.div>
    </div>
  );
};
