/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { templateData } from "../data/templateData";

interface MenuItem {
  name: string;
  description: string;
  price: string;
  tags?: string[];
}

const categories = ["All", "Vegan", "Gluten-Free", "Signature"];

export default function Menu() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredMenu = Object.entries(templateData.menu.categories)
    .filter(([key]) => key !== 'all') // We handle 'all' separately or exclude if we want tabs
    .map(([key, category]) => ({
      name: category.categoryName,
      items: category.items,
      id: key
    }))
    .filter(cat => activeFilter === "All" || cat.id.toLowerCase() === activeFilter.toLowerCase());

  return (
    <section id="menu" className="py-24 px-6 bg-bg border-b border-border relative overflow-hidden">
      {/* Moody Food Photography Background with Dark Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none" 
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop")',
        }}
      />
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.88)' }} 
      />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-6xl md:text-[80px] text-text mb-6 leading-none tracking-tighter">The Menu</h2>
          <div className="w-16 h-px bg-brand-burgundy mx-auto mb-8" />
          <p className="text-brand-gold/40 uppercase tracking-[0.4em] text-xs font-semibold tracking-wider font-bold mb-12">
            Curated Heirloom Selections
          </p>

          {/* Filter Bar */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-12">
            {categories.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`editorial-subheader py-2 transition-all duration-300 border-b-2 bg-transparent ${
                  activeFilter === filter 
                  ? "text-brand-gold border-brand-gold" 
                  : "text-text/20 border-transparent hover:text-text/60"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <LayoutGroup>
          <motion.div layout className="space-y-32">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeFilter}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-32"
              >
                {activeFilter === "All" ? (
                  <div>
                    <h3 className="text-brand-burgundy font-serif italic text-4xl mb-12 border-b border-border pb-6 editorial-subheader tracking-[0.05em] uppercase text-xs !italic-none !font-sans">
                      All Selections
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12">
                      {templateData.menu.categories.all.items.map((item, itemIndex) => (
                        <motion.div
                          layout
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: itemIndex * 0.05 }}
                          className="group border-b border-border pb-4"
                        >
                          <div className="flex justify-between items-baseline mb-3">
                            <h4 className="text-xl text-text group-hover:text-brand-gold transition-colors cursor-default">
                              {item.name}
                            </h4>
                            <span className="text-brand-gold font-serif text-lg opacity-80">
                              ${item.price}
                            </span>
                          </div>
                          <p className="text-brand-gold/40 text-[13px] font-light italic leading-relaxed">
                            {item.description}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  filteredMenu.map((category) => (
                    <motion.div layout key={category.id}>
                      <h3 className="text-brand-burgundy font-serif italic text-4xl mb-12 border-b border-border pb-6 editorial-subheader tracking-[0.05em] uppercase text-xs !italic-none !font-sans">
                        {category.name}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12">
                        {category.items.map((item, itemIndex) => (
                          <motion.div
                            layout
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: itemIndex * 0.05 }}
                            className="group border-b border-border pb-4"
                          >
                            <div className="flex justify-between items-baseline mb-3">
                              <h4 className="text-xl text-text group-hover:text-brand-gold transition-colors cursor-default">
                                {item.name}
                              </h4>
                              <span className="text-brand-gold font-serif text-lg opacity-80">
                                ${item.price}
                              </span>
                            </div>
                            <p className="text-brand-gold/40 text-[13px] font-light italic leading-relaxed">
                              {item.description}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>

        <div className="mt-32 text-center">
           <p className="text-xs font-semibold tracking-wider text-brand-gold/30 uppercase tracking-widest max-w-lg mx-auto leading-loose">
             *Consuming raw or undercooked meats, poultry, seafood, shellfish, or eggs may increase your risk of foodborne illness.
           </p>
        </div>
      </div>
    </section>
  );
}
