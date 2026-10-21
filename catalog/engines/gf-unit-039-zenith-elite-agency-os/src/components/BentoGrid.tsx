import { Reveal } from "./Reveal";
import { cn } from "@/src/lib/utils";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useRef, MouseEvent } from "react";

const ITEMS = [
  {
    id: "01",
    title: "Project Obsidian",
    category: "Identity / 3D",
    size: "col-span-1 md:col-span-2 row-span-2",
  },
  {
    id: "02",
    title: "Lumina Arc",
    category: "Web / Product",
    size: "col-span-1 md:col-span-2 row-span-1",
  },
  {
    id: "03",
    title: "Void Loop",
    category: "Motion / Visual",
    size: "col-span-1 row-span-1",
  },
  {
    id: "04",
    title: "Atmospheric Fragments",
    category: "Digital Series",
    size: "col-span-1 row-span-1",
  },
];

const BentoCard = ({ item }: { item: typeof ITEMS[0] }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 400 };
  const spotlightX = useSpring(mouseX, springConfig);
  const spotlightY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: MouseEvent) => {
    if (!cardRef.current) return;
    const { left, top } = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative w-full h-full glass rounded-xl p-8 flex flex-col justify-end overflow-hidden transition-all duration-700",
        "border-transparent hover:backdrop-blur-[30px] hover:shadow-[0_0_30px_rgba(204,255,0,0.05)]"
      )}
    >
      {/* Glass-Stroke Border */}
      <div className="absolute inset-0 z-0 p-[1px] rounded-xl overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent group-hover:from-white/20 transition-colors" />
        <div className="absolute inset-[1px] bg-base rounded-[calc(0.75rem-1px)]" />
      </div>

      {/* Dynamic Spotlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
        style={{
          background: useTransform(
            [spotlightX, spotlightY],
            ([x, y]) => `radial-gradient(600px circle at ${x}px ${y}px, rgba(204,255,0,0.08), transparent 40%)`
          ),
        }}
      />

      <div className="absolute top-0 right-0 w-full h-full bg-white/[0.01] translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-out z-0" />
      
      <motion.div 
        className="relative z-20"
        whileHover={{ y: -5 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="text-xs font-semibold tracking-wider mb-2 opacity-30 uppercase tracking-[0.3em] font-mono transition-opacity group-hover:opacity-60">
          {item.id} / {item.category}
        </div>
        <h3 className="font-serif text-3xl italic tracking-tight text-accent group-hover:translate-x-2 transition-transform duration-500">
          {item.title}
        </h3>
        <div className="h-px w-full bg-white/10 mt-6 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700" />
      </motion.div>
    </div>
  );
};

export const BentoGrid = () => {
  return (
    <section className="py-32 px-6 max-w-7xl mx-auto">
      <Reveal className="mb-20">
        <div className="flex items-center gap-6">
          <div className="h-px w-24 bg-white/10" />
          <h2 className="text-xs font-semibold tracking-wider tracking-[0.5em] opacity-30 uppercase font-mono italic">Recent Archive</h2>
        </div>
      </Reveal>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[300px]">
        {ITEMS.map((item, i) => (
          <Reveal key={i} width="100%" delay={i * 0.1} className={item.size}>
            <BentoCard item={item} />
          </Reveal>
        ))}
      </div>
    </section>
  );
};
