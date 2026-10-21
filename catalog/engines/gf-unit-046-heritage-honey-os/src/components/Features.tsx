/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion } from "motion/react";
import { templateData } from "../data/templateData";
import Lightbox from "./Lightbox";

export default function Features() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <section id="features" className="py-24 px-6 bg-bg overflow-hidden border-y border-border">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
          <div className="max-w-xl">
            <span className="editorial-subheader mb-4 block">{templateData.signatureSelections.subtitle}</span>
            <h2 className="text-5xl md:text-7xl text-text mb-6 leading-tight">
              {templateData.signatureSelections.title.split(' ')[0]} <br /> <span className="italic font-normal text-brand-gold opacity-80">{templateData.signatureSelections.title.split(' ').slice(1).join(' ')}</span>
            </h2>
            <p className="text-brand-gold/60 text-lg font-light italic">
              Experience the heartbeat of Los Angeles through modern comfort.
            </p>
          </div>
          <a
            href="#menu"
            className="text-xs font-semibold tracking-wider font-bold uppercase tracking-[0.3em] border border-border px-8 py-3 hover:bg-brand-gold hover:text-bg transition-all duration-500"
          >
            Explore Menu
          </a>
        </div>

        <div id="features-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {templateData.signatureSelections.items.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="group bg-card p-8 border-l-4 border-brand-burgundy flex flex-col justify-between min-h-[400px]"
            >
              <div>
                <div 
                  className="relative overflow-hidden mb-6 aspect-video cursor-zoom-in"
                  onClick={() => setSelectedImage(item.image)}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 brightness-[0.8] group-hover:brightness-100 grayscale-[30%] sepia-[.3] group-hover:sepia-0 group-hover:grayscale-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_20%,rgba(0,0,0,0.6)_100%)] pointer-events-none opacity-60 group-hover:opacity-20 transition-opacity duration-700" />
                </div>
                <div className="flex items-baseline justify-between mb-4">
                  <h3 className="text-2xl text-text leading-tight">{item.name}</h3>
                </div>
                <p className="text-brand-gold/50 leading-relaxed font-light text-sm italic">
                  {item.description}
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
                 <span className="text-brand-gold font-serif text-2xl">${item.price}</span>
                 <span className="text-xs font-semibold tracking-wider uppercase tracking-widest text-brand-gold/30">Order Now</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <Lightbox image={selectedImage} onClose={() => setSelectedImage(null)} />
    </section>
  );
}
