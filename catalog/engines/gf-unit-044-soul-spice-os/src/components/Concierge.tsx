import React from 'react';
import { MapPin, Phone, Clock, Globe } from 'lucide-react';

export function Concierge() {
  return (
    <section id="contact" className="bg-[#0A0A0A] py-24 md:py-32 px-6 md:px-[8vw] editorial-border-t-razor">
      <div className="w-full">
        
        {/* Section Title */}
        <div className="max-w-xl mb-16 md:mb-20 text-left">
          <span className="text-[#AEAED2] text-xs font-sans tracking-[0.25em] block mb-3 font-semibold uppercase">
            06 // THE CONCIERGE
          </span>
          <h2 className="font-serif font-light text-white leading-[0.95] tracking-tight mb-4" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: 0.95 }}>
            Directory &amp; <br />
            <span className="italic">Spatial Map</span>
          </h2>
          <p className="text-xs text-[#8E8E93] font-sans font-light mt-4 leading-relaxed tracking-wide">
            Commune with our hosts or map the physical location of our beautiful Chicago restaurant home.
          </p>
        </div>

        {/* 2. Concierge Grid: Minimalist directory layout with border separators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-b border-white/10 divide-y sm:divide-y-0 sm:divide-x divide-white/10 py-8 mb-16 font-sans">
          
          {/* Node 1: Location */}
          <div className="p-6 text-left space-y-3 first:pl-0 last:pr-0">
            <div className="flex items-center space-x-2 text-[#AEAED2]">
              <MapPin className="w-3.5 h-3.5" />
              <span className="font-sans text-xs font-semibold tracking-wider tracking-[0.25em] uppercase font-bold">
                01 // OUR LOCATION
              </span>
            </div>
            <p className="text-xs text-[#8E8E93] uppercase tracking-wider leading-relaxed font-light">
              SOUL &amp; SPICE CHICAGO <br />
              1100 S. MICHIGAN AVENUE <br />
              CHICAGO, IL 60605
            </p>
          </div>

          {/* Node 2: Telecom */}
          <div className="p-6 text-left space-y-3 lg:pl-10 last:pr-0">
            <div className="flex items-center space-x-2 text-[#AEAED2]">
              <Phone className="w-3.5 h-3.5" />
              <span className="font-sans text-xs font-semibold tracking-wider tracking-[0.25em] uppercase font-bold">
                02 // TABLE BOOKINGS &amp; INQUIRIES
              </span>
            </div>
            <p className="text-xs text-[#8E8E93] uppercase tracking-wider leading-relaxed font-light font-mono">
              P // +1 (312) 555-0199 <br />
              E // CONCIERGE@SOULSPICE.NET <br />
              W // SOULSPICE.NET
            </p>
          </div>

          {/* Node 3: Temporal */}
          <div className="p-6 text-left space-y-3 lg:pl-10 last:pr-0">
            <div className="flex items-center space-x-2 text-[#AEAED2]">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-sans text-xs font-semibold tracking-wider tracking-[0.25em] uppercase font-bold">
                03 // DINNER SERVICE HOURS
              </span>
            </div>
            <p className="text-xs text-[#8E8E93] uppercase tracking-wider leading-relaxed font-light">
              WEDNESDAY &mdash; SATURDAY <br />
              FIRST SEATING &mdash; 6:00 PM <br />
              SECOND SEATING &mdash; 9:30 PM
            </p>
          </div>

          {/* Node 4: Amenities */}
          <div className="p-6 text-left space-y-3 lg:pl-10 last:pr-0">
            <div className="flex items-center space-x-2 text-[#AEAED2]">
              <Globe className="w-3.5 h-3.5" />
              <span className="font-sans text-xs font-semibold tracking-wider tracking-[0.25em] uppercase font-bold">
                04 // GUEST SERVICES
              </span>
            </div>
            <p className="text-xs text-[#8E8E93] uppercase tracking-wider leading-relaxed font-light">
              VALET PARKING // Complimentary valet service available at the main entrance <br /><br />
              PRIVATE EVENTS // For groups of 8 or more, coordinate with our dedicated event director.
            </p>
          </div>

        </div>

        {/* 3. Map Frame Container */}
        <div className="relative w-full aspect-[21/9] min-h-[300px] editorial-border-razor bg-[#0A0A0A] overflow-hidden p-2">
          {/* Accent border framing */}
          <div className="w-full h-full relative overflow-hidden bg-zinc-950">
            
            {/* Dark tinted Unsplash map image */}
            <img
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1600"
              alt="Secured Satellite Overlay"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover grayscale brightness-[0.12] contrast-[1.4] opacity-50 select-none pointer-events-none"
            />

            {/* Grid line effect layering */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:30px_30px]" />
            
            {/* Vignette dark overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-[#0A0A0A]/90" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/90 via-transparent to-[#0A0A0A]/90" />

            {/* Centered coordinates tag */}
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 z-10">
              <div className="p-1 px-4 border border-[#AEAED2]/40 bg-black/80 font-sans text-xs font-semibold tracking-wider md:text-xs text-[#AEAED2] tracking-[0.3em] uppercase font-medium">
                1100 S. MICHIGAN AVENUE &bull; CHICAGO, ILLINOIS
              </div>
              <span className="font-sans text-[8px] tracking-[0.4em] uppercase text-[#8E8E93] selection:bg-white select-none font-semibold">
                OUR CHICAGO HOME // VALET &amp; ARRIVAL
              </span>
            </div>

            {/* Corner styling guides */}
            <div className="absolute top-2 left-2 border-t border-l border-[#AEAED2]/25 w-4 h-4" />
            <div className="absolute top-2 right-2 border-t border-r border-[#AEAED2]/25 w-4 h-4" />
            <div className="absolute bottom-2 left-2 border-b border-l border-[#AEAED2]/25 w-4 h-4" />
            <div className="absolute bottom-2 right-2 border-b border-r border-[#AEAED2]/25 w-4 h-4" />
          </div>
        </div>

      </div>
    </section>
  );
}
