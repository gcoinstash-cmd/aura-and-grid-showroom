import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Calendar, Users, Phone, Mail, Globe } from 'lucide-react';

export function Order() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('');
  const [guestCount, setGuestCount] = useState(10);
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInquirySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !date) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitted(true);
      setIsSubmitting(false);
    }, 1200);
  };

  const handleReset = () => {
    setFullName('');
    setEmail('');
    setDate('');
    setGuestCount(10);
    setNotes('');
    setIsSubmitted(false);
  };

  return (
    <section id="order" className="bg-[#0A0A0A] py-24 md:py-32 px-6 md:px-[8vw] border-t border-white/5 w-full max-w-none">
      <div className="w-full max-w-none">
        
        {/* Section Header */}
        <div className="text-left mb-16 md:mb-24">
          <span className="text-[#AEAED2] text-xs font-sans tracking-[0.3em] block mb-3 font-semibold uppercase">
            03 // BESPOKE SERVICES
          </span>
          <h2 className="font-serif font-light text-white leading-[0.95] tracking-tight mb-4" style={{ fontSize: 'clamp(3rem, 7vw, 6rem)' }}>
            Private Events <br />
            <span className="italic text-[#AEAED2]">&amp; Custom Catering</span>
          </h2>
          <p className="text-xs text-[#8E8E93] font-sans font-light mt-6 leading-relaxed tracking-wide max-w-2xl">
            Acquire pristine culinary compositions for private home gatherings, elegant corporate occasions, or grand celebratory banquets. Build your inquiry below to compose your customized experience with our curators.
          </p>
        </div>

        {/* 50/50 Editorial & Form Split */}
        <div id="order-split-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          
          {/* Left: Beautiful Editorial Storytelling */}
          <div className="space-y-8 text-left">
            <div className="font-serif text-base sm:text-lg text-[#AEAED2] leading-[1.8] space-y-6 font-light">
              <p className="first-letter:text-5xl first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:text-white first-letter:font-bold">
                E
              </p>
              <p className="pt-1">
                very grand gathering begins as an empty page. Soul &amp; Spice offers comprehensive private event planning that centers the beautiful warmth of Southern woodsmoke and seasoned cast iron directly at your estate or gallery.
              </p>
              <p className="text-xs text-[#8E8E93] font-sans font-light leading-relaxed">
                Whether you select a custom-staged live hickory fire pit on your lawn or opt for pristine, hand-delivered thermal platters, our services are customized entirely to your guest dimensions. We do not mass-produce; we curate individual hospitality experiences that celebrate our deep Southern culinary roots.
              </p>
            </div>

            {/* Structured Hospitality Services */}
            <div className="space-y-6 pt-8 border-t border-white/5">
              <span className="text-[#AEAED2] font-sans text-xs font-semibold tracking-wider tracking-[0.25em] uppercase font-bold block mb-4">
                CULINARY SERVICE ARRANGEMENTS
              </span>

              {/* Service Item 1 */}
              <div className="flex items-start space-x-4">
                <span className="font-serif text-xs text-[#AEAED2] italic font-semibold mt-0.5">01/</span>
                <div>
                  <h4 className="font-sans text-xs font-semibold tracking-wider tracking-[0.2em] uppercase text-white font-semibold mb-1">
                    ESTATE PRIVATE CHEF STAGING
                  </h4>
                  <p className="text-xs text-[#8E8E93] font-sans font-light leading-relaxed">
                    Our live oak-hearth staging team sets up on-site, preparing charcoal heirloom cuts and wood-smoked provisions directly in front of your guests.
                  </p>
                </div>
              </div>

              {/* Service Item 2 */}
              <div className="flex items-start space-x-4 border-t border-white/5 pt-5">
                <span className="font-serif text-xs text-[#AEAED2] italic font-semibold mt-0.5">02/</span>
                <div>
                  <h4 className="font-sans text-xs font-semibold tracking-wider tracking-[0.2em] uppercase text-white font-semibold mb-1">
                    PRISTINE THERMAL COLLECTION
                  </h4>
                  <p className="text-xs text-[#8E8E93] font-sans font-light leading-relaxed">
                    Custom-brined family boxes pack-sealed in luxurious heat-retentive slate cases. Ready for immediate dinner collection in our Chicago home.
                  </p>
                </div>
              </div>

              {/* Service Item 3 */}
              <div className="flex items-start space-x-4 border-t border-white/5 pt-5">
                <span className="font-serif text-xs text-[#AEAED2] italic font-semibold mt-0.5">03/</span>
                <div>
                  <h4 className="font-sans text-xs font-semibold tracking-wider tracking-[0.2em] uppercase text-white font-semibold mb-1">
                    BOURBON &amp; BOTANICAL PAIRINGS
                  </h4>
                  <p className="text-xs text-[#8E8E93] font-sans font-light leading-relaxed">
                    Hand-curated single barrel flights, raw molasses, and organic warm chicory tea selections paired perfectly with your chosen menu items.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Elegant Thin-Lined Inquiry Form */}
          <div className="bg-[#121212] border p-8 md:p-10 text-left" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
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
                      [ SUBMIT ANOTHER INQUIRY ]
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleInquirySubmit}
                  className="space-y-6"
                  key="form"
                >
                  <div className="border-b border-white/10 pb-4 mb-4">
                    <span className="font-sans text-[9px] tracking-[0.25em] text-[#AEAED2] uppercase block mb-1 font-semibold">
                      PLANNING INTAKE
                    </span>
                    <h3 className="text-lg font-serif text-white font-light">
                      Event Catering &amp; Logistics
                    </h3>
                  </div>

                  <div className="space-y-5">
                    
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="block text-[8px] font-sans tracking-[0.25em] text-[#AEAED2] uppercase font-bold">
                        FULL NAME
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="E.G., KATHERINE VANCE"
                        className="w-full hospitality-input text-xs py-4"
                      />
                    </div>

                    {/* Email Address */}
                    <div className="space-y-1.5">
                      <label className="block text-[8px] font-sans tracking-[0.25em] text-[#AEAED2] uppercase font-bold">
                        EMAIL ADDRESS
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="E.G., KATHERINE@VANCE.COM"
                        className="w-full hospitality-input text-xs py-4"
                      />
                    </div>

                    {/* Event Date */}
                    <div className="space-y-1.5">
                      <label className="block text-[8px] font-sans tracking-[0.25em] text-[#AEAED2] uppercase font-bold">
                        PROPOSED OCCASION DATE
                      </label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full hospitality-input text-xs py-4"
                      />
                    </div>

                    {/* Guest Count */}
                    <div className="space-y-1.5">
                      <label className="block text-[8px] font-sans tracking-[0.25em] text-[#AEAED2] uppercase font-bold">
                        APPROXIMATE GUEST COUNT
                      </label>
                      <input
                        type="number"
                        min={2}
                        max={500}
                        required
                        value={guestCount}
                        onChange={(e) => setGuestCount(parseInt(e.target.value))}
                        className="w-full hospitality-input text-xs py-4"
                      />
                    </div>

                    {/* Notes Detail */}
                    <div className="space-y-1.5">
                      <label className="block text-[8px] font-sans tracking-[0.25em] text-[#AEAED2] uppercase font-bold">
                        EVENT SCOPE &amp; PRIVATE DETAILS
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="E.G., TABLE SETUP PREFERENCES, HOME PATIO CAPABILITIES, DIETARY SENSITIVITIES, OR EVENT TIMING PREFERENCES..."
                        className="w-full hospitality-input text-xs py-4 resize-none leading-relaxed"
                      />
                    </div>

                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 mt-6 bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white border border-transparent hover:border-white font-sans text-base font-semibold min-h-[44px] font-semibold tracking-wider tracking-[0.25em] font-bold uppercase transition-all duration-300 cursor-pointer"
                  >
                    {isSubmitting ? "SUBMITTING REQUEST..." : "AUTHORIZE SERVICES"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
}
