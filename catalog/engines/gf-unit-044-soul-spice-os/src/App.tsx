import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Storefront } from './components/Storefront';
import { Order } from './components/Order';
import { ReservationForm } from './components/ReservationForm';
import { Concierge } from './components/Concierge';
import AdminPortalModal from './components/AdminPortalModal';
import { ArrowRight } from 'lucide-react';

export default function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Sync scroll positioning & track active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'philosophy', 'curation', 'order', 'residency', 'contact'];
      const scrollPosition = window.scrollY + 250;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const offsetTop = el.offsetTop;
          const offsetHeight = el.offsetHeight;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (window.location.pathname === '/admin') setIsAdminOpen(true);
  }, []);

  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="bg-[#0A0A0A] text-[#8E8E93] min-h-screen relative font-sans selection:bg-white selection:text-black">
      
      {/* Top Header Interface */}
      <Navigation
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Main Column Layout Blocks */}
      <main className="w-full">
        
        {/* BLOCK 1: THE HERO MATRIX */}
        <div id="hero" className="scroll-mt-20">
          <Hero
            onExploreMenu={() => handleScrollTo('curation')}
            onReserveTable={() => handleScrollTo('residency')}
          />
        </div>

        {/* BLOCK 2: THE EDITORIAL MENU */}
        <div id="curation" className="scroll-mt-20">
          <Storefront />
        </div>

        {/* BLOCK 3: OUR PHILOSOPHY (The Story Section) */}
        <div id="philosophy" className="scroll-mt-20">
          <About />
        </div>

        {/* BLOCK 4: PRIVATE EVENTS & CATERING */}
        <div id="order" className="scroll-mt-20">
          <Order />
        </div>

        {/* BLOCK 5: TASTING RESIDENCIES */}
        <div id="residency" className="scroll-mt-20">
          <ReservationForm />
        </div>

        {/* BLOCK 6: CONCIERGE DIRECTORY & SPATIAL MAP */}
        <div id="contact" className="scroll-mt-20">
          <Concierge />
        </div>
      </main>

      {/* Editorial Luxury Footer */}
      <footer className="bg-[#0A0A0A] border-t border-white/5 pt-28 pb-14 px-6 md:px-[8vw] text-left">
        <div className="w-full max-w-none">
          
          {/* Main Footer Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 pb-16">
            
            {/* Column 1: Editorial Description */}
            <div className="space-y-4">
              <span className="font-sans text-xs tracking-[0.3em] text-white font-bold block uppercase">
                SOUL &amp; SPICE
              </span>
              <p className="text-xs font-semibold text-[#8E8E93] font-sans font-light leading-relaxed max-w-xs">
                An elevated private kitchen and contemporary Southern culinary archive. We construct elegant dining environments, wood-fired heritage plates, and bespoke catering configurations that redefine comfort gastronomy.
              </p>
            </div>

            {/* Column 2: Structured Directories */}
            <div className="space-y-3">
              <span className="font-sans text-[9px] tracking-[0.25em] text-[#AEAED2] uppercase font-bold block">
                RESTAURANT DIRECTORY
              </span>
              <div className="flex flex-col space-y-2 text-xs font-semibold font-sans">
                <button
                  onClick={() => handleScrollTo('philosophy')}
                  className="text-left text-[#8E8E93] hover:text-white transition-colors cursor-pointer uppercase tracking-wider py-0 bg-transparent h-auto"
                >
                  01 // OUR PHILOSOPHY
                </button>
                <button
                  onClick={() => handleScrollTo('curation')}
                  className="text-left text-[#8E8E93] hover:text-white transition-colors cursor-pointer uppercase tracking-wider py-0 bg-transparent h-auto"
                >
                  02 // SEASONAL MENU
                </button>
                <button
                  onClick={() => handleScrollTo('order')}
                  className="text-left text-[#8E8E93] hover:text-white transition-colors cursor-pointer uppercase tracking-wider py-0 bg-transparent h-auto"
                >
                  03 // PRIVATE CATERING
                </button>
                <button
                  onClick={() => handleScrollTo('residency')}
                  className="text-left text-[#8E8E93] hover:text-white transition-colors cursor-pointer uppercase tracking-wider py-0 bg-transparent h-auto"
                >
                  04 // SEATING HOUSES
                </button>
                <button
                  onClick={() => handleScrollTo('contact')}
                  className="text-left text-[#8E8E93] hover:text-white transition-colors cursor-pointer uppercase tracking-wider py-0 bg-transparent h-auto"
                >
                  05 // CONTACT DESK
                </button>
              </div>
            </div>

            {/* Column 3: Reservation Hours */}
            <div className="space-y-3">
              <span className="font-sans text-[9px] tracking-[0.25em] text-[#AEAED2] uppercase font-bold block">
                RESERVATION TIMES
              </span>
              <div className="space-y-2 text-xs font-semibold text-[#8E8E93] font-light leading-relaxed font-sans">
                <div>
                  <p className="text-white font-semibold uppercase tracking-wider text-[9px] mb-0.5">CHICAGO TABLE:</p>
                  <p>1100 S. Michigan Avenue, Chicago</p>
                  <p>Wednesday &mdash; Saturday // 6:00 PM &amp; 9:30 PM Seating</p>
                </div>
                <div>
                  <p className="text-white font-semibold uppercase tracking-wider text-[9px] mb-0.5">EXCLUSIVITY:</p>
                  <p>Reservations open thirty days in advance.</p>
                </div>
              </div>
            </div>

            {/* Column 4: Newsletter Subscriber Form */}
            <div className="space-y-4">
              <span className="font-sans text-[9px] tracking-[0.25em] text-[#AEAED2] uppercase font-bold block">
                THE SEASONAL DISPATCH
              </span>
              <p className="text-xs font-semibold text-[#8E8E93] font-sans font-light leading-relaxed">
                Register your email address to acquire prioritized table booking releases, tasting menus, and secret culinary dispatches.
              </p>
              
              {newsletterSubscribed ? (
                <div className="p-3 bg-zinc-900/60 border border-zinc-800 text-[#AEAED2] text-xs font-mono text-center tracking-wider">
                  DISPATCH SUBSCRIPTION ACTIVE
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newsletterEmail) {
                      setNewsletterSubscribed(true);
                      setNewsletterEmail('');
                    }
                  }}
                  className="flex items-center space-x-2 border-b border-[#222222] hover:border-zinc-700 focus-within:border-white transition-all py-1"
                >
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="your.email@domain.com"
                    className="bg-transparent text-xs text-white placeholder-[#8E8E93]/30 focus:outline-none w-full py-1.5 font-sans"
                  />
                  <button type="submit" className="text-[#AEAED2] hover:text-white transition-colors cursor-pointer p-1">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>

          </div>

          {/* Subtle Horizontal Rule */}
          <div className="border-t border-white/5 w-full my-8" />

          {/* Legal Navigation Subbar */}
          <div className="flex flex-col lg:flex-row justify-between items-center text-xs font-semibold tracking-wider text-[#8E8E93] space-y-6 lg:space-y-0 font-sans">
            
            {/* Legal Alignment Links */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-2 uppercase tracking-widest font-sans font-medium text-[9px]">
              <a href="#philosophy" className="hover:text-white transition-colors">PRIVACY POLICY</a>
              <a href="#order" className="hover:text-white transition-colors">CATERING GUIDELINES</a>
              <a href="#philosophy" className="hover:text-white transition-colors">TERMS OF SERVICE</a>
              <a href="#residency" className="hover:text-white transition-colors">RESERVE A TABLE</a>
            </div>

            {/* Copyright Statement */}
            <div className="flex items-center space-x-6 text-right">
              <span className="font-sans text-[#AEAED2] uppercase tracking-widest text-[9px] font-medium">CHICAGO // EST. 2024</span>
              <span className="font-light tracking-wide">
                &copy; {new Date().getFullYear()} SOUL &amp; SPICE. FINE SOUTHERN HOSPITALITY.
              </span>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center space-x-1 outline-none text-[#8E8E93] hover:text-white transition-colors cursor-pointer uppercase font-sans tracking-[0.15em] text-[8px] font-bold border border-[#1F1F1F] hover:border-white px-2 py-1"
              >
                <span>TOP</span>
              </button>
            </div>

          </div>

        </div>
      </footer>
      <AdminPortalModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </div>
  );
}
