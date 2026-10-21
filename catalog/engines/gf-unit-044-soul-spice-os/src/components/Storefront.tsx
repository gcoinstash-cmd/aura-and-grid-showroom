import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer } from 'lucide-react';
import { StoreItem } from '../types';
import { STORE_ITEMS } from '../data';

export function Storefront() {
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);

  // Categorize items
  const mains = STORE_ITEMS.filter(it => it.category === 'provisions' && it.id.includes('stone'));
  const elixirs = STORE_ITEMS.filter(it => it.category === 'provisions' && (it.id.includes('prov') || it.id.includes('stone-02')));
  const desserts = STORE_ITEMS.filter(it => it.category === 'literature');

  const categories = [
    {
      title: "Hearth Mains & Charcoal Provisions",
      subtitle: "Slow wood-fired heritage plates shaped by hickory embers",
      items: STORE_ITEMS.filter(it => it.id === 'stone-01' || it.id === 'prov-02')
    },
    {
      title: "Elixirs & Curated Southern Aviations",
      subtitle: "Cold-infused extractions, single barrel flights and teas",
      items: STORE_ITEMS.filter(it => it.id === 'prov-01' || it.id === 'stone-02')
    },
    {
      title: "Heirloom Confections & Sweet Crusts",
      subtitle: "Skillet-baked and hand-churned southern finishes",
      items: desserts
    }
  ];

  return (
    <section id="curation" className="bg-[#0A0A0A] py-24 md:py-32 px-6 md:px-[8vw] border-t border-white/5 w-full max-w-none">
      <div className="w-full max-w-none">
        
        {/* Section Title with scroll-driven entrance */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20 md:mb-28"
        >
          <div className="text-left">
            <span className="text-[#AEAED2] text-xs font-sans tracking-[0.35em] block mb-4 font-semibold uppercase">
              02 // THE DAILY MENU
            </span>
            <h2 className="font-serif font-light text-white leading-[0.95] tracking-tight mb-4" style={{ fontSize: 'clamp(3rem, 7vw, 6rem)' }}>
              Seasonal Culinary <span className="italic text-[#AEAED2]">Provisions</span>
            </h2>
            <div className="w-12 h-[1px] bg-[#AEAED2]/40 mt-8" />
          </div>
          
          <button
            onClick={() => window.print()}
            className="flex items-center gap-3 border border-[#AEAED2]/20 hover:border-white text-[#AEAED2] hover:text-white px-6 py-4 font-mono text-[9px] tracking-[0.25em] uppercase transition-all duration-300 rounded-none bg-transparent cursor-pointer select-none self-start md:self-end"
            title="Download or Print Menu as 8.5x11 PDF"
            id="print-menu-btn"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT COMPOSITION // 8.5 &times; 11 PDF</span>
          </button>
        </motion.div>

        {/* Print-Style Menu Columns */}
        <div className="space-y-20">
          {categories.map((category, catIdx) => (
            <motion.div 
              key={catIdx} 
              className="space-y-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: catIdx * 0.15 }}
            >
              
              {/* Category Header */}
              <div className="text-left border-b border-white/5 pb-4">
                <h3 className="font-sans text-xs tracking-[0.25em] text-[#AEAED2] uppercase font-bold">
                  {category.title}
                </h3>
                <p className="text-xs font-semibold text-[#8E8E93] font-sans font-light italic mt-1 font-mono tracking-wider">
                  &bull; {category.subtitle}
                </p>
              </div>

              {/* Items List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 seasonal-menu-grid">
                {category.items.map((item) => (
                  <div 
                    key={item.id} 
                    className="group cursor-pointer text-left focus:outline-none"
                    onClick={() => setSelectedItem(item)}
                  >
                    {/* Name and Price Line */}
                    <div className="flex items-baseline justify-between gap-3 mb-1">
                      <span className="font-serif text-sm sm:text-base text-white group-hover:text-[#AEAED2] transition-colors duration-300 font-medium tracking-wide">
                        {item.name}
                      </span>
                      {/* Beautiful Print-style dots filler */}
                      <span className="flex-1 border-b border-dotted border-white/10 mx-2" />
                      <span className="font-mono text-base font-semibold text-white tracking-widest font-light">
                        ${item.price}
                      </span>
                    </div>

                    {/* Appetizing Sensory Description */}
                    <p className="text-xs font-semibold sm:text-xs text-[#8E8E93] font-serif italic font-light leading-relaxed tracking-wide group-hover:text-[#AEAED2]/90 transition-colors duration-300 pl-1 mt-1">
                      {item.subtitle}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Ambient Note */}
        <p className="text-center font-serif italic text-xs text-[#8E8E93] mt-24">
          All provisions are sustainably sourced and prepared fresh daily. Private inquiries for whole-table bookings or special dietary configurations can be specified with our coordinator.
        </p>

      </div>

      {/* Immersive Lookup Overlay */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-md flex items-center justify-center p-4 md:p-12 overflow-y-auto font-sans"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="bg-[#0D0D0D] border border-white/10 max-w-4xl w-full p-8 md:p-14 text-left relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 text-[#8E8E93] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
                
                {/* Left Side: Elegant Text Card */}
                <div className="aspect-[4/5] bg-[#121212] border border-white/5 flex flex-col justify-center items-center p-8 text-center select-none overflow-hidden pb-12">
                  <span className="text-[9px] font-sans tracking-[0.25em] text-[#AEAED2] uppercase block mb-3 font-semibold">
                    {selectedItem.category === 'provisions' ? 'HEARTH PROVISION' : selectedItem.category === 'stoneware' ? 'CURATED FLIGHT' : 'SEASONAL CONFECTION'}
                  </span>
                  
                  <div className="h-[1px] w-8 bg-white/10 my-4" />
                  
                  <span className="text-white font-serif italic text-xl leading-relaxed max-w-[260px]">
                    {selectedItem.name}
                  </span>
                  
                  <span className="font-sans text-[8px] text-[#8E8E93] uppercase tracking-[0.25em] mt-8 bg-white/5 px-2 py-1 border border-white/5">
                    {selectedItem.availability}
                  </span>
                </div>

                {/* Right Side: Narrative Blueprint */}
                <div className="flex flex-col justify-between h-auto">
                  <div className="space-y-6">
                    <div>
                      <span className="font-sans text-[9px] tracking-[0.25em] text-[#AEAED2] uppercase block mb-1">
                        PLATE BLUEPRINT
                      </span>
                      <h3 className="text-2xl md:text-3xl font-serif text-white tracking-tight">
                        {selectedItem.name}
                      </h3>
                    </div>

                    <p className="text-xs text-[#8E8E93] font-sans font-light leading-relaxed">
                      {selectedItem.description}
                    </p>

                    {/* Characteristics */}
                    <div className="border-t border-white/5 pt-6 space-y-4">
                      <span className="font-sans text-[9px] tracking-[0.2em] text-[#AEAED2] uppercase block font-semibold">
                        CRAFT SPECS:
                      </span>
                      <ul className="space-y-3">
                        {selectedItem.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-xs text-[#8E8E93] font-sans font-light">
                            <span className="text-[#AEAED2] select-none font-medium">0{idx + 1}//</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-8 mt-8 border-t border-white/5 flex justify-between items-baseline">
                    <span className="text-xs text-[#8E8E93] uppercase tracking-wider font-light">PROVISION VALUE</span>
                    <span className="font-serif text-xl text-white font-medium">${selectedItem.price}.00</span>
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
