import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, FileText, ArrowRight, X } from 'lucide-react';
import { JournalEntry } from '../types';
import { JOURNAL_ENTRIES } from '../data';

export function Journal() {
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  return (
    <section id="journal" className="bg-[#121212] py-24 md:py-32 px-6 md:px-[8vw] editorial-border-t-razor">
      <div className="w-full">
        
        {/* Section Header */}
        <div className="max-w-xl mb-16 md:mb-24">
          <span className="text-[#AEAED2] text-xs font-sans tracking-[0.25em] block mb-3 font-semibold uppercase">
            03 // OUR STORY &amp; PHILOSOPHY
          </span>
          <h2 className="font-serif font-light text-white leading-[0.95] tracking-tight mb-4" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: 0.95 }}>
            Our Story &amp; <span className="italic">Culinary Philosophy</span>
          </h2>
          <p className="text-xs text-[#8E8E93] font-sans font-light mt-4 leading-relaxed tracking-wide">
            Generational Mississippi Roots Meets Contemporary Chicago Soul.
          </p>
        </div>

        {/* List of Entries */}
        <div className="space-y-12">
          {JOURNAL_ENTRIES.map((entry) => (
            <div
              key={entry.number}
              onClick={() => setSelectedEntry(entry)}
              className="group grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 py-10 border-b border-white/10 hover:border-[#AEAED2] transition-colors duration-500 cursor-pointer text-left"
            >
              {/* Entry Number */}
              <div className="md:col-span-1 flex items-baseline">
                <span className="font-mono text-2xl md:text-3xl font-light text-[#AEAED2]/50 group-hover:text-white transition-colors duration-500">
                  {entry.number}
                </span>
              </div>

              {/* Editorial Title / Subtitle */}
              <div className="md:col-span-6 flex flex-col justify-center">
                <span className="font-sans text-xs font-semibold tracking-wider tracking-[0.25em] text-[#AEAED2] uppercase mb-2">
                  {entry.date}
                </span>
                <h3 className="text-xl md:text-2xl font-serif text-white group-hover:text-[#AEAED2] transition-colors duration-500 mb-2 font-medium">
                  {entry.title}
                </h3>
                <h4 className="font-mono text-xs font-semibold tracking-wider text-[#8E8E93] uppercase">
                  {entry.subtitle}
                </h4>
              </div>

              {/* Excerpt */}
              <div className="md:col-span-4 flex items-center">
                <p className="text-xs text-[#8E8E93] font-light leading-relaxed group-hover:text-[#AEAED2] transition-colors duration-500">
                  {entry.excerpt}
                </p>
              </div>

              {/* Action Indicator */}
              <div className="md:col-span-1 flex items-center justify-end">
                <div className="p-2 border border-[#1F1F1F] group-hover:border-white text-[#8E8E93] group-hover:text-white transition-all duration-500">
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exquisite Journal Treatise Expanded View Modall */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-md flex items-center justify-center p-4 md:p-12 overflow-y-auto"
            onClick={() => setSelectedEntry(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="bg-[#121212] editorial-border-razor max-w-3xl w-full p-8 md:p-16 text-left relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Absolute Close */}
              <button
                onClick={() => setSelectedEntry(null)}
                className="absolute top-6 right-6 text-[#8E8E93] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header block */}
              <div className="mb-8 md:mb-12 border-b border-white/10 pb-8">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="font-mono text-sm text-[#AEAED2]">VOL. {selectedEntry.number}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#AEAED2]"></span>
                  <span className="font-sans text-xs font-semibold tracking-wider tracking-[0.25em] text-[#8E8E93] uppercase">{selectedEntry.date}</span>
                </div>
                <h3 className="text-2xl md:text-4xl font-serif text-white tracking-tight mb-3">
                  {selectedEntry.title}
                </h3>
                <h4 className="font-sans text-xs tracking-[0.25em] text-[#AEAED2] uppercase">
                  {selectedEntry.subtitle}
                </h4>
              </div>

              {/* Treatise Body */}
              <div className="font-serif text-sm md:text-base text-[#AEAED2] leading-[1.8] space-y-6 font-light">
                <p className="first-letter:text-4xl first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:text-white first-letter:font-bold">
                  {selectedEntry.content}
                </p>
                <p>
                  Our culinary arts run deep, honoring historical cooking methods, slow wood-fired smokes, and meticulously curated plates that serve as markers of Southern hospitality and flavor mastery.
                </p>
                <p className="italic text-[#8E8E93] text-xs pt-4 border-t border-white/10">
                  &mdash; Soul &amp; Spice Kitchen Collective, Chicago.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
