/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { templateData } from "../data/templateData";
import { Star } from "lucide-react";

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 px-6 bg-bg overflow-hidden border-b border-border">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
           <span className="editorial-subheader mb-4 block">The Community</span>
           <h2 className="text-5xl md:text-7xl text-text mb-4">Guest Experiences</h2>
           <p className="text-brand-gold/60 font-serif italic text-lg opacity-80">Voices from the heartbeat of Los Angeles.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {templateData.testimonials.map((t, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="bg-brand-beige/90 p-10 md:p-12 relative border-t-2 border-t-brand-burgundy border-x border-b border-brand-stone/50 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-1 text-brand-burgundy mb-8">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="text-brand-cream/95 text-[17px] md:text-lg font-serif italic mb-10 leading-relaxed">
                  "{t.quote}"
                </p>
              </div>
              <div>
                <div className="h-px w-8 bg-brand-stone/60 mb-6"></div>
                <p className="font-semibold text-brand-cream tracking-[0.15em] text-xs font-serif">{t.author}</p>
                <div className="mt-2.5">
                  <span className="bg-brand-burgundy/10 text-brand-burgundy border border-brand-burgundy/20 text-[9px] px-2.5 py-1 tracking-[0.14em] font-semibold uppercase inline-block font-sans">
                    {t.role}
                  </span>
                </div>
              </div>
              {/* Decorative accent */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-brand-stone/30 to-transparent -z-0" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
