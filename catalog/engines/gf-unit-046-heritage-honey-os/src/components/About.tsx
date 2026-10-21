/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { templateData } from "../data/templateData";

export default function About() {
  const imageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: imageRef,
    offset: ["start end", "end start"]
  });

  const imgY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <section id="about" className="py-24 px-6 bg-bg text-text overflow-hidden relative">
      {/* Background Image Texture with Dark Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none" 
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&auto=format&fit=crop")',
        }}
      />
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.82)' }} 
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          {/* Content Column */}
          <div className="flex-1 order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="editorial-subheader mb-6">
                {templateData.brand.tagline}
              </h3>
              <h2 className="text-4xl md:text-6xl mb-10 leading-tight">
                {templateData.brand.name}
              </h2>
              <p className="text-text/70 text-lg leading-relaxed mb-12 font-light italic">
                {templateData.brand.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-12 border-t border-border">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex flex-col"
                >
                  <p className="text-brand-gold text-3xl font-serif mb-2">2024</p>
                  <p className="text-text/40 uppercase tracking-[0.2em] text-xs font-semibold tracking-wider font-bold">
                    Established
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex flex-col"
                >
                  <p className="text-brand-gold text-3xl font-serif mb-2">3x</p>
                  <p className="text-text/40 uppercase tracking-[0.2em] text-xs font-semibold tracking-wider font-bold">
                    James Beard Nom
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="flex flex-col"
                >
                  <p className="text-brand-gold text-3xl font-serif mb-2">LA</p>
                  <p className="text-text/40 uppercase tracking-[0.2em] text-xs font-semibold tracking-wider font-bold">
                    Roots
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Image Column */}
          <div className="flex-1 relative order-1 lg:order-2" ref={imageRef}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="aspect-[3/4] overflow-hidden grayscale-[50%] relative"
            >
              <motion.img
                style={{ y: imgY, scale: 1.2 }}
                src={templateData.hero.backgroundImage}
                alt="The Establishment"
                className="w-full h-full object-cover transition-all duration-700 hover:grayscale-0"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            {/* Design Accents */}
            <div className="absolute -bottom-8 -left-8 w-48 h-48 border border-border hidden lg:block" />
            <div className="absolute -top-8 -right-8 w-48 h-48 border border-brand-burgundy/30 hidden lg:block" />
          </div>
        </div>

        {/* Meet the Chef Subsection */}
        <div className="mt-40 pt-24 border-t border-border">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex-1 w-full max-w-md"
            >
              <div className="relative aspect-square overflow-hidden border-2 border-brand-gold p-4">
                <img
                  src={templateData.chef.image}
                  alt={templateData.chef.name}
                  className="w-full h-full object-cover grayscale-[30%] hover:grayscale-0 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/10 -mr-12 -mt-12 rounded-full hidden md:block" />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex-1"
            >
              <span className="text-brand-burgundy uppercase tracking-[0.4em] text-xs font-semibold tracking-wider font-bold mb-4 block">The Soul in the Kitchen</span>
              <h2 className="text-5xl font-serif mb-6 text-text">{templateData.chef.name}</h2>
              <p className="text-brand-gold uppercase tracking-[0.2em] text-xs font-bold mb-8">
                {templateData.chef.role}
              </p>
              <div className="space-y-6">
                <p className="text-text/80 text-lg leading-relaxed font-light italic border-l-2 border-border pl-6 py-2">
                  {templateData.chef.bio}
                </p>
                <div className="pt-4">
                  <div className="w-16 h-px bg-brand-gold mb-4" />
                  <p className="text-brand-gold/40 text-[9px] uppercase tracking-[0.5em] font-bold italic">Heritage & Honey Executive</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
