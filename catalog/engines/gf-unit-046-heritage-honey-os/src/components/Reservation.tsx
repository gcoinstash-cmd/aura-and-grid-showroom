/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { Calendar, Clock, Users, CheckCircle, CalendarPlus, MapPin, Phone, Loader2 } from "lucide-react";
import { templateData } from "../data/templateData";

export default function Reservation() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confNumber, setConfNumber] = useState("");

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const accentY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call for premium feel
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setConfNumber(`HH-${randomNum}`);
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <section 
      id="reservations" 
      ref={sectionRef}
      className="py-24 px-6 bg-bg relative overflow-hidden border-b border-border"
    >
      {/* Design Pattern Accents */}
      <motion.div 
        style={{ y: accentY }}
        className="absolute top-0 right-0 w-1/3 h-full bg-card/20 -skew-x-12 translate-x-1/4 -z-0 border-l border-border" 
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-stretch">
          
          <div className="flex-1 flex flex-col justify-center pt-8 md:pt-12 lg:pt-0 min-w-0 w-full">
            <span className="text-xs font-semibold tracking-wider uppercase tracking-[0.5em] text-brand-gold font-bold mb-6 block">Availability</span>
            <h2 className="text-6xl md:text-[84px] text-text mb-8 leading-[0.9] tracking-tighter break-words">
              Secure <br /> the <span className="text-brand-burgundy italic">Evening</span>
            </h2>
            <p className="text-brand-cream/90 text-lg mb-12 w-full max-w-md font-light italic leading-relaxed whitespace-normal break-words">
              We recommend booking in advance to ensure the best possible experience. For parties larger than 8, please contact our concierge directly.
            </p>

            <div className="space-y-10 w-full">
               <div className="flex items-center gap-6 min-w-0">
                  <div className="h-12 w-[1px] bg-brand-burgundy shrink-0"></div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wider uppercase tracking-[0.3em] text-brand-gold mb-1 font-bold">Establishment</p>
                    <p className="text-text font-serif text-lg break-words">{templateData.contact.address}</p>
                  </div>
               </div>
               <div className="flex items-center gap-6 min-w-0">
                  <div className="h-12 w-[1px] bg-brand-gold shrink-0"></div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wider uppercase tracking-[0.3em] text-brand-gold mb-1 font-bold">Direct Line</p>
                    <p className="text-text font-serif text-lg break-words">{templateData.contact.phone}</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="flex-1 bg-card p-8 md:p-14 border border-border shadow-2xl min-h-[500px] flex flex-col justify-center min-w-0 w-full">
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-10" 
                  onSubmit={handleSubmit}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-semibold tracking-wider uppercase tracking-[0.3em] text-brand-gold font-bold mb-3 opacity-60">Guest Name</label>
                      <input
                        required
                        type="text"
                        className="w-full bg-transparent border-b border-border text-text py-4 focus:outline-none focus:border-brand-burgundy transition-colors font-light placeholder:text-text/10"
                        placeholder="E.g. Marcus Reed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold tracking-wider uppercase tracking-[0.3em] text-brand-gold font-bold mb-3 opacity-60">Email Address</label>
                      <input
                        required
                        type="email"
                        className="w-full bg-transparent border-b border-border text-text py-4 focus:outline-none focus:border-brand-burgundy transition-colors font-light placeholder:text-text/10"
                        placeholder="reed@heritage.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="relative">
                      <label className="block text-sm font-semibold tracking-wider uppercase tracking-[0.3em] text-brand-gold font-bold mb-3 opacity-60">Date</label>
                      <input
                        required
                        type="date"
                        className="w-full bg-transparent border-b border-border text-text py-4 focus:outline-none focus:border-brand-burgundy transition-colors font-light appearance-none cursor-pointer"
                      />
                      <div className="absolute right-0 bottom-4 pointer-events-none text-brand-gold/30">
                        <Calendar size={14} />
                      </div>
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-semibold tracking-wider uppercase tracking-[0.3em] text-brand-gold font-bold mb-3 opacity-60">Time Slot</label>
                      <select
                        required
                        className="w-full bg-transparent border-b border-border text-text py-4 focus:outline-none focus:border-brand-burgundy transition-colors font-light appearance-none text-text cursor-pointer"
                      >
                        <option value="" className="bg-bg">Select Time</option>
                        <option className="bg-bg">7:00 PM</option>
                        <option className="bg-bg">7:30 PM</option>
                        <option className="bg-bg">8:00 PM</option>
                        <option className="bg-bg">8:30 PM</option>
                        <option className="bg-bg">9:00 PM</option>
                      </select>
                      <div className="absolute right-0 bottom-4 pointer-events-none text-brand-gold/30">
                        <Clock size={14} />
                      </div>
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-semibold tracking-wider uppercase tracking-[0.3em] text-brand-gold font-bold mb-3 opacity-60">Party Size</label>
                      <select
                        required
                        className="w-full bg-transparent border-b border-border text-text py-4 focus:outline-none focus:border-brand-burgundy transition-colors font-light appearance-none text-text cursor-pointer"
                      >
                        <option value="" className="bg-bg">Select Size</option>
                        <option className="bg-bg">2 Guests</option>
                        <option className="bg-bg">4 Guests</option>
                        <option className="bg-bg">6 Guests</option>
                        <option className="bg-bg">Private Room</option>
                      </select>
                      <div className="absolute right-0 bottom-4 pointer-events-none text-brand-gold/30">
                        <Users size={14} />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 bg-brand-gold text-bg uppercase tracking-[0.4em] text-base font-semibold min-h-[44px] font-semibold tracking-wider font-bold hover:bg-brand-burgundy hover:text-text transition-all duration-700 mt-4 disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Securing your table...
                      </>
                    ) : (
                      "Confirm Table"
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="confirmation"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="text-center py-8"
                >
                  <div className="mb-8 flex justify-center">
                    <div className="p-4 bg-brand-burgundy/10 rounded-full border border-brand-burgundy/20">
                      <CheckCircle className="text-brand-burgundy w-16 h-16" />
                    </div>
                  </div>
                  
                  <h3 className="text-text text-4xl mb-4 tracking-tight">Reservation Confirmed</h3>
                  <p className="text-brand-gold/60 italic font-serif text-lg mb-10 max-w-sm mx-auto">
                    A table has been secured in your honor. We look forward to hosting you soon.
                  </p>
                  
                  <div className="bg-bg/30 border border-border/50 p-6 mb-10 inline-block rounded-sm">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-brand-gold/40 mb-2 font-bold">Confirmation ID</p>
                    <p className="text-text font-mono text-2xl tracking-widest">{confNumber}</p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <motion.a
                      href="#"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center justify-center gap-3 py-4 border border-brand-gold text-brand-gold uppercase tracking-[0.2em] text-xs font-semibold tracking-wider font-bold hover:bg-brand-gold hover:text-bg transition-all duration-300"
                    >
                      <CalendarPlus size={14} />
                      Add to Calendar
                    </motion.a>
                    
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="text-brand-gold/40 hover:text-brand-gold text-[9px] uppercase tracking-widest transition-colors"
                    >
                      New Reservation
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
}
