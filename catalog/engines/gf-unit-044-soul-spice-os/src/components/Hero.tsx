import { motion } from 'motion/react';
import { ArrowDown } from 'lucide-react';

interface HeroProps {
  onExploreMenu: () => void;
  onReserveTable: () => void;
}

export function Hero({ onExploreMenu, onReserveTable }: HeroProps) {
  return (
    <section
      id="hero"
      className="relative min-h-screen bg-[#0A0A0A] flex flex-col justify-between overflow-hidden pt-32 pb-12"
    >
      {/* Editorial Background Image with vignette overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1600"
          alt="Luxury Southern Hearth"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover grayscale brightness-[0.22] contrast-[1.12] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-[#0A0A0A]/50" />
      </div>

      {/* Decorative Elegant Header Label */}
      <div className="relative z-10 w-full px-6 md:px-[8vw] flex justify-between items-center text-[#8E8E93] text-[9px] tracking-[0.3em] font-sans border-b border-white/5 pb-6">
        <span className="uppercase text-[#AEAED2] font-semibold">SOUL &amp; SPICE CHICAGO</span>
        <span className="hidden sm:inline uppercase font-light">AN ELITE SOUTHERN CULINARY ARCHIVE</span>
      </div>

      {/* Hero Content Grid */}
      <div className="relative z-10 w-full px-6 md:px-[8vw] my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
        
        {/* Left: Heading with premium transition */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="lg:col-span-8 text-left space-y-4"
        >
          <div className="flex flex-col space-y-4">
            <span className="text-[#AEAED2] font-sans text-xs tracking-[0.25em] uppercase block font-semibold">
              GENUINE MISSISSIPPI HERITAGE &bull; MODERN ARTISTRY
            </span>
            <h1 className="font-serif font-light text-white leading-[0.95] tracking-tight text-left animate-fade-in-up" style={{ fontSize: 'clamp(2.8rem, 7.5vw, 5.8rem)' }}>
              AUTHENTIC SOUTHERN COMFORT. <br />
              <span className="italic text-[#AEAED2]">SEATED IN ELITE LUXURY.</span>
            </h1>
          </div>
        </motion.div>

        {/* Right: Narrative Description & Actions with staggered transition */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="lg:col-span-4 text-left lg:border-l lg:border-white/10 lg:pl-10 space-y-8 py-4"
        >
          <p className="text-base font-semibold text-[#8E8E93] font-sans font-light leading-relaxed tracking-wide">
            Where multi-generational Mississippi heritage meets contemporary culinary artistry. We honor classic Southern flavors through meticulous wood-fired techniques and hand-selected seasonal heirloom ingredients.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onExploreMenu}
              className="px-8 py-4 bg-white text-[#0A0A0A] font-sans text-base font-semibold min-h-[44px] font-semibold tracking-wider tracking-[0.25em] hover:bg-[#AEAED2] transition-colors duration-300 font-bold uppercase cursor-pointer"
            >
              EXPLORE THE MENU
            </button>
            <button
              onClick={onReserveTable}
              className="px-8 py-4 border border-white/10 hover:border-white text-white bg-black/40 backdrop-blur-sm transition-colors duration-300 font-sans text-base font-semibold min-h-[44px] font-semibold tracking-wider tracking-[0.25em] font-semibold uppercase cursor-pointer"
            >
              RESERVE A TABLE
            </button>
          </div>
        </motion.div>

      </div>

      {/* Minimal Accent Bar */}
      <div className="relative z-10 w-full px-6 md:px-[8vw] mt-10">
        <div className="flex justify-between items-center border-t border-white/5 pt-8 text-[#8E8E93]">
          <div className="font-serif text-xs font-semibold italic text-[#AEAED2]">
            Dinner Service &bull; Chicago, IL
          </div>
          <button
            onClick={onExploreMenu}
            className="flex items-center space-x-2 text-[9px] tracking-[0.25em] text-[#AEAED2] hover:text-white transition-colors cursor-pointer"
          >
            <span className="uppercase">EXPLORE COOKERY</span>
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          </button>
        </div>
      </div>
    </section>
  );
}
