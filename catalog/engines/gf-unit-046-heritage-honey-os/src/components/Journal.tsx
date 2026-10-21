/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Calendar, User, X } from "lucide-react";
import { templateData } from "../data/templateData";

export default function Journal() {
  const [selectedPost, setSelectedPost] = useState<typeof templateData.journal[0] | null>(null);

  return (
    <section id="journal" className="py-24 px-6 bg-bg transition-colors duration-500 overflow-hidden border-b border-border">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
          <div className="max-w-xl">
            <span className="editorial-subheader mb-4 block">The Chronicle</span>
            <h2 className="text-5xl md:text-7xl text-text mb-6 leading-tight">
              Our <span className="italic font-normal text-brand-gold opacity-80">Journal</span>
            </h2>
            <p className="text-brand-gold/60 text-lg font-light italic">
              Reflections on flavor, culture, and the art of modern tradition.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {templateData.journal.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="group cursor-pointer"
              onClick={() => setSelectedPost(post)}
            >
              <div className="relative aspect-[4/5] overflow-hidden mb-8 border border-border group-hover:border-brand-gold/30 transition-colors duration-500">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover grayscale-[30%] sepia-[.2] transition-all duration-1000 group-hover:scale-105 group-hover:grayscale-0 group-hover:sepia-0"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-bg/80 backdrop-blur-md text-brand-gold text-[9px] uppercase tracking-widest font-bold border border-border">
                    {post.category}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-[9px] uppercase tracking-widest text-brand-gold/40 font-bold">
                  <span className="flex items-center gap-1.5"><Calendar size={10} /> {post.date}</span>
                  <div className="w-1 h-1 bg-brand-stone rounded-full" />
                  <span className="flex items-center gap-1.5"><User size={10} /> {post.author}</span>
                </div>
                <h3 className="text-2xl text-text group-hover:text-brand-gold transition-colors duration-300 leading-tight">
                  {post.title}
                </h3>
                <p className="text-brand-gold/60 text-sm font-light italic leading-relaxed line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-2 pt-2 text-brand-burgundy text-xs font-semibold tracking-wider uppercase tracking-widest font-bold group-hover:gap-4 transition-all duration-300">
                  Read Article <ArrowRight size={14} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Post Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
          >
            <div 
              className="absolute inset-0 bg-brand-charcoal/90 backdrop-blur-xl"
              onClick={() => setSelectedPost(null)}
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-4xl max-h-[85vh] bg-bg overflow-y-auto border border-border shadow-2xl"
            >
              <button 
                onClick={() => setSelectedPost(null)}
                className="absolute top-6 right-6 z-10 p-2 text-brand-gold bg-bg/50 backdrop-blur-md rounded-full border border-border hover:bg-brand-burgundy hover:text-brand-cream transition-all duration-300"
              >
                <X size={24} />
              </button>

              <div className="flex flex-col">
                <div className="w-full aspect-video overflow-hidden">
                  <img 
                    src={selectedPost.image} 
                    alt={selectedPost.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div className="p-8 md:p-16">
                  <div className="flex items-center gap-6 text-xs font-semibold tracking-wider uppercase tracking-[0.3em] text-brand-gold font-bold mb-8 opacity-60">
                    <span className="flex items-center gap-2"><Calendar size={12} /> {selectedPost.date}</span>
                    <span className="flex items-center gap-2"><User size={12} /> {selectedPost.author}</span>
                    <span className="px-3 py-1 border border-brand-gold/30">{selectedPost.category}</span>
                  </div>
                  
                  <h2 className="text-4xl md:text-6xl font-serif text-text mb-10 leading-tight">
                    {selectedPost.title}
                  </h2>
                  
                  <div className="w-20 h-px bg-brand-burgundy mb-12" />
                  
                  <div className="prose prose-invert max-w-none">
                    <p className="text-text/80 text-xl leading-relaxed font-light italic mb-10 first-letter:text-5xl first-letter:font-serif first-letter:text-brand-gold first-letter:mr-3 first-letter:float-left">
                      {selectedPost.content}
                    </p>
                    <p className="text-text/70 leading-relaxed font-light">
                      At Heritage & Honey, we believe that every ingredient has a story, and every story deserves to be told. Whether it's the specific heat of our habanero infusion or the architectural dialogue between our LA roots and Southern heritage, we are constantly exploring what it means to be a modern soul in a historic kitchen.
                    </p>
                  </div>
                  
                  <div className="mt-20 pt-10 border-t border-border flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-px bg-brand-stone" />
                      <p className="text-xs font-semibold tracking-wider uppercase tracking-widest text-brand-gold/40 font-bold">End of Dispatch</p>
                    </div>
                    <button 
                      onClick={() => setSelectedPost(null)}
                      className="text-brand-burgundy text-xs font-semibold tracking-wider uppercase tracking-widest font-bold hover:tracking-[0.2em] transition-all"
                    >
                      Return to Journal
                    </button>
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
