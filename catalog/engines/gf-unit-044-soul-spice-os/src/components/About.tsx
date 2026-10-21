import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function About() {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  return (
    <section id="philosophy" className="bg-[#0A0A0A] py-24 md:py-32 px-6 md:px-[8vw] border-t border-white/5 w-full max-w-none">
      <div className="w-full max-w-none">
        
        {/* Section Header */}
        <div className="text-left mb-16 md:mb-24">
          <span className="text-[#AEAED2] text-xs font-sans tracking-[0.3em] block mb-3 font-semibold uppercase">
            01 // OUR PHILOSOPHY
          </span>
          <h2 className="font-serif font-light text-white leading-[0.95] tracking-tight text-left" style={{ fontSize: 'clamp(3rem, 7vw, 6rem)' }}>
            Culinary Precision <br />
            <span className="italic text-[#AEAED2]">&amp; Southern Heritage</span>
          </h2>
        </div>

        {/* Minimalist 2-column Layout */}
        <div id="philosophy-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-stretch">
          
          {/* Left Column: Storytelling Typographies */}
          <div className="flex flex-col justify-center space-y-12 text-left">
            
            {/* Part 1: The Art of the 24-Hour Brine */}
            <div className="space-y-4">
              <h3 className="font-serif text-xl sm:text-2xl text-white font-light tracking-wide flex items-center space-x-2">
                <span className="font-sans text-xs font-semibold tracking-wider tracking-[0.25em] text-[#AEAED2] uppercase font-bold mr-2">I //</span>
                The Art of the 24-Hour Brine
              </h3>
              <p className="text-base font-semibold text-[#8E8E93] font-sans font-light leading-relaxed tracking-wide">
                We believe that chicken, duck, and pork demand structural patience. Our wet brine process is timed flawlessly to twenty-four hours, utilizing sweet honeysuckle blossoms, roasted bay laurels, and dark molasses blocks. This method allows the proteins to hold absolute tenderness before exposure to aggressive hickory flames.
              </p>
            </div>

            {/* Part 2: The Smoke Archive */}
            <div className="space-y-4 pt-8 border-t border-white/5">
              <h3 className="font-serif text-xl sm:text-2xl text-white font-light tracking-wide flex items-center space-x-2">
                <span className="font-sans text-xs font-semibold tracking-wider tracking-[0.25em] text-[#AEAED2] uppercase font-bold mr-2">II //</span>
                The Smoke Archive: Hardwood Oak &amp; Hickory
              </h3>
              <p className="text-base font-semibold text-[#8E8E93] font-sans font-light leading-relaxed tracking-wide">
                Our hearth operates under scientific smoke densities. We utilize dried shagbark hickory splits to generate powerful, sweet-noted temperature spikes, balanced by hard white oak cords that provide deep, steady heat retention. This wood combination creates sweet, translucent blue smoke that finishes each provision with sensory resonance and an eye-safe woodsmoke aroma.
              </p>
            </div>

          </div>

          {/* Right Column: High-End Culinary Photography Container */}
          <div className="flex flex-col justify-between h-auto w-full">
            <button
              onClick={() => setIsLightboxOpen(true)}
              className="w-full text-left bg-transparent border-0 p-0 cursor-pointer select-none outline-none group focus:ring-1 focus:ring-[#AEAED2]/30"
              title="Click to view image details in high resolution"
              id="view-photo-lightbox-trigger"
            >
              <div 
                className="w-full h-full aspect-[4/5] bg-[#0A0A0A] border p-6 flex flex-col justify-between text-left relative overflow-hidden transition-all duration-300" 
                style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}
              >
                
                {/* Real high-end culinary image background */}
                <img 
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80" 
                  alt="Southern Brisket Plating" 
                  className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:opacity-60 transition-opacity duration-[750ms] z-0"
                  referrerPolicy="no-referrer"
                />

                {/* Background blueprint subtle grids & vignette overlays */}
                <div className="absolute inset-0 z-10 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-[#0A0A0A]/40 z-10" />

                {/* Minimal Border Frame Indicator */}
                <div className="relative z-20 flex justify-between items-start text-[8px] font-mono tracking-[0.2em] text-[#AEAED2]/80">
                  <span>FILE // SS-CH-01</span>
                  <span>VOL. 24 // PLATING</span>
                </div>

                {/* Centered technical blueprint asset name */}
                <div className="relative z-20 my-auto text-center space-y-2">
                  <span className="font-mono text-[9px] tracking-[0.35em] text-[#AEAED2] uppercase block">
                    IMAGE // SOUTHERN BRISKET CRUST CONCEPT
                  </span>
                  <span className="font-sans text-[8px] tracking-[0.2em] text-[#8E8E93] uppercase block font-light">
                    [ 1200 PX &times; 1500 PX // SECTOR 04 ]
                  </span>
                </div>

                <div className="relative z-20 space-y-1 mt-auto border-t border-white/5 pt-4 flex justify-between items-end">
                  <div>
                    <span className="font-mono text-[9px] tracking-[0.25em] text-[#AEAED2] block uppercase">
                      MISSISSIPPI WOOD &amp; IRON
                    </span>
                    <span className="font-serif italic text-xs text-white block">
                      A balanced visual plating study
                    </span>
                  </div>
                  <span className="font-mono text-[8px] tracking-[0.2em] text-[#AEAED2]/40 group-hover:text-white transition-colors duration-300">
                    [ CLICK TO EXPAND ]
                  </span>
                </div>
              </div>
            </button>
            
            {/* Metric Caption */}
            <div className="mt-4 flex justify-between items-center px-1 text-[8px] font-mono tracking-[0.25em] text-[#8E8E93] uppercase">
              <span>HICKORY STUDY // VOL_09</span>
              <span>EST. CHICAGO</span>
            </div>
          </div>

        </div>

      </div>

      {/* Premium Native Lightbox Expansion modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#070707] bg-opacity-95 backdrop-blur-md p-6 select-none"
            onClick={() => setIsLightboxOpen(false)}
            id="lightbox-overlay"
          >
            {/* Elegant Close Button Upper Right */}
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-8 right-8 z-50 bg-transparent border-none text-[#AEAED2] hover:text-white font-mono text-[9px] tracking-[0.3em] uppercase cursor-pointer py-2 px-4 transition-all duration-300 outline-none select-none"
              id="lightbox-close-btn"
            >
              ✕ CLOSE
            </button>

            {/* Lightbox Content Wrap */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking actual image
            >
              {/* Image Frame with Razor-Thin Boundary Border */}
              <div 
                className="bg-[#0A0A0A] p-4 border relative max-w-full"
                style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
              >
                <img
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1500&q=95"
                  alt="Southern Brisket Plating HD"
                  className="max-w-full max-h-[70vh] object-contain block opacity-95 hover:opacity-100 transition-opacity duration-300"
                  referrerPolicy="no-referrer"
                />

                {/* Fine metadata details */}
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[8px] font-mono tracking-[0.2em] text-[#AEAED2]">
                  <span>HD PRESET // VOL. 24 // SECTOR 04</span>
                  <span className="text-[#8E8E93]">[ 1500 PX &times; 1875 PX // HIGH PRECISION PLATING STUDY ]</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

