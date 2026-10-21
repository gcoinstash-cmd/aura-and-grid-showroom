import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Calendar, Users, Clock, RotateCcw } from 'lucide-react';
import { RESIDENCY_ATMOSPHERES } from '../data';

const ROOM_IMAGES: Record<string, string> = {
  alcove: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
  hearth: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
  glass: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80',
};

export function ReservationForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:30');
  const [guests, setGuests] = useState(2);
  const [room, setRoom] = useState('alcove');
  const [dietary, setDietary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email || !date) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitted(true);
      setIsSubmitting(false);
    }, 1500);
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setDate('');
    setTime('19:30');
    setGuests(2);
    setDietary('');
    setIsSubmitted(false);
  };

  return (
    <section id="residency" className="bg-[#0A0A0A] py-24 md:py-32 px-6 md:px-[8vw] border-t border-white/5 w-full max-w-none">
      <div className="w-full max-w-none">
        
        {/* Section Header */}
        <div className="text-left mb-16 md:mb-24">
          <span className="text-[#AEAED2] text-xs font-sans tracking-[0.3em] block mb-4 font-semibold uppercase">
            04 // INTIMATE SEATING
          </span>
          <h2 className="font-serif font-light text-white leading-[0.95] tracking-tight mb-4" style={{ fontSize: 'clamp(3rem, 7vw, 6rem)' }}>
             Tasting <br /><span className="italic text-[#AEAED2]">Residencies</span>
          </h2>
          <p className="text-xs text-[#8E8E93] font-sans font-light mt-6 leading-relaxed tracking-wide max-w-xl">
             Prestige dining experiences centered around three curated dining rooms. Select your preferred atmosphere to propose a table booking request.
          </p>
        </div>

        {/* The 3 Distinct Room Cards */}
        <div id="dining-rooms-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {RESIDENCY_ATMOSPHERES.map((atm, idx) => {
            const imageUrl = ROOM_IMAGES[atm.id];
            return (
              <motion.button
                key={atm.id}
                onClick={() => setRoom(atm.id)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: idx * 0.12 }}
                className={`text-left p-6 border transition-all duration-300 relative rounded-none flex flex-col justify-between cursor-pointer group ${
                  room === atm.id
                    ? 'bg-[#0E0E0E] shadow-[0_4px_20px_rgba(255,255,255,0.03)]'
                    : 'bg-[#121212] hover:bg-[#121212]/80'
                }`}
                style={{ borderColor: room === atm.id ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.06)' }}
              >
                <div className="w-full">
                  {/* Image Header Capsule with Razor-Thin Border */}
                  <div 
                    className="w-full aspect-[16/10] overflow-hidden mb-5 border relative bg-[#0D0D0D]" 
                    style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
                  >
                    <img 
                      src={imageUrl} 
                      alt={atm.title} 
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-opacity duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                  </div>

                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-serif text-lg text-white font-medium">{atm.title}</h3>
                    <span className={`${room === atm.id ? 'bg-[#AEAED2] text-black' : 'bg-white/5 text-[#8E8E93]'} text-[8px] font-mono tracking-widest px-2 py-0.5 font-bold uppercase`}>
                      {atm.capacity}
                    </span>
                  </div>
                  <p className="text-xs text-[#8E8E93] font-sans font-light leading-relaxed mb-6">
                    {atm.description}
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto w-full">
                  <span className="font-mono text-[8px] tracking-[0.2em] text-[#AEAED2] uppercase">
                    {room === atm.id ? 'SELECTED ROOM' : 'SELECT THIS ROOM'}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#AEAED2]" style={{ opacity: room === atm.id ? 1 : 0.2 }} />
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Gorgeous Standard Reservation Form Wrapper */}
        <div className="bg-[#121212] border p-8 md:p-12 text-left max-w-3xl mx-auto" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
          <AnimatePresence mode="wait">
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="py-12 px-4 text-center flex flex-col justify-center items-center space-y-8"
                key="success"
              >
                <div className="w-8 h-8 rounded-full border border-[#AEAED2]/50 flex items-center justify-center text-[#AEAED2]">
                  <Check className="w-4 h-4" />
                </div>
                <div className="space-y-6 max-w-md">
                  <p className="font-mono text-[9px] sm:text-xs font-semibold tracking-wider tracking-[0.25em] text-white leading-relaxed uppercase">
                    INTAKE COMPLETE // SYSTEM DISPATCH CODE: SS-RESERVE-2026. OUR CULINARY CONCIERGE WILL CONTACT YOU WITHIN 12 HOURS TO CONFIRM YOUR SEATING ARRANGEMENTS.
                  </p>
                </div>
                <div className="w-full border-t border-white/10 pt-6">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="font-mono text-[8px] tracking-[0.25em] text-[#AEAED2] hover:text-white uppercase transition-colors duration-200 cursor-pointer outline-none underline"
                  >
                    [ FILE ANOTHER RESERVATION ]
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-6"
                key="form"
              >
                <div className="border-b border-white/10 pb-4 mb-6">
                  <span className="font-sans text-[9px] tracking-[0.25em] text-[#AEAED2] uppercase block mb-1 font-semibold">
                    PROPOSE A TABLE
                  </span>
                  <h3 className="text-lg font-serif text-white font-light">
                    For {RESIDENCY_ATMOSPHERES.find(a => a.id === room)?.title}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  
                  {/* Name field */}
                  <div className="space-y-1.5 col-span-1">
                    <label className="block text-[8px] font-sans tracking-[0.25em] text-[#AEAED2] uppercase font-bold">
                      FULL NAME
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="E.G., ALISTAIR VANCE"
                      className="w-full hospitality-input text-xs py-4"
                    />
                  </div>

                  {/* Email field */}
                  <div className="space-y-1.5 col-span-1">
                    <label className="block text-[8px] font-sans tracking-[0.25em] text-[#AEAED2] uppercase font-bold">
                      EMAIL ADDRESS
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="E.G., ALISTAIR@VANCE.COM"
                      className="w-full hospitality-input text-xs py-4"
                    />
                  </div>

                  {/* Date field */}
                  <div className="space-y-1.5 col-span-1">
                    <label className="block text-[8px] font-sans tracking-[0.25em] text-[#AEAED2] uppercase font-bold">
                      PREFERRED DINING DATE
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full hospitality-input text-xs py-4"
                    />
                  </div>

                  {/* Time field */}
                  <div className="space-y-1.5 col-span-1">
                    <label className="block text-[8px] font-sans tracking-[0.25em] text-[#AEAED2] uppercase font-bold">
                      DESIRED SEATING TIME
                    </label>
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full hospitality-input text-xs py-4 cursor-pointer h-[54px]"
                    >
                      <option value="18:00" className="bg-[#0A0A0A] text-white">6:00 PM - Early Seating</option>
                      <option value="19:30" className="bg-[#0A0A0A] text-white">7:30 PM - Prime Seating</option>
                      <option value="21:00" className="bg-[#0A0A0A] text-white">9:00 PM - Late Seating</option>
                    </select>
                  </div>

                  {/* Guests count */}
                  <div className="space-y-1.5 col-span-1">
                    <label className="block text-[8px] font-sans tracking-[0.25em] text-[#AEAED2] uppercase font-bold">
                      NUMBER OF GUESTS
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      required
                      value={guests}
                      onChange={(e) => setGuests(parseInt(e.target.value))}
                      className="w-full hospitality-input text-xs py-4"
                    />
                  </div>

                  {/* Locked selected atmosphere visually, premium display */}
                  <div className="space-y-1.5 col-span-1">
                    <label className="block text-[8px] font-sans tracking-[0.25em] text-[#AEAED2] uppercase font-bold">
                      ATMOSPHERE CONFIRMATION
                    </label>
                    <input
                      type="text"
                      disabled
                      value={RESIDENCY_ATMOSPHERES.find(a => a.id === room)?.title}
                      className="w-full py-4 text-[#AEAED2] text-xs font-sans rounded-none select-none opacity-60"
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}
                    />
                  </div>

                </div>

                {/* Dietary restrictions field */}
                <div className="space-y-1.5">
                  <label className="block text-[8px] font-sans tracking-[0.25em] text-[#AEAED2] uppercase font-bold">
                    DIETARY RESTRICTIONS
                  </label>
                  <textarea
                    rows={2}
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                    placeholder="E.G., SHELLFISH ALLERGIES, GLUTEN-FREE ACCOMMODATIONS..."
                    className="w-full hospitality-input text-xs py-4 resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 mt-6 bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white border border-transparent hover:border-white font-sans text-base font-semibold min-h-[44px] font-semibold tracking-wider tracking-[0.25em] font-bold uppercase transition-all duration-300 cursor-pointer"
                >
                  {isSubmitting ? "PROCESSING REQUEST..." : "AUTHORIZE RESERVATION"}
                </button>

              </motion.form>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
