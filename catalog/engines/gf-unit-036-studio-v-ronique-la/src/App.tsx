/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ArrowRight, Instagram, PinIcon as Pinterest, Mail, MapPin, ShieldCheck } from 'lucide-react';
import React, { useState, useEffect, forwardRef } from 'react';
import { AdminPortalModal } from './AdminPortalModal';

const IMAGES = {
  hero: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1920",
  portfolio1: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1200",
  portfolio2: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=1200",
  portfolio3: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=1200",
};

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackColor?: string;
}

const SafeImage = forwardRef<HTMLImageElement, SafeImageProps>(
  ({ src, alt, className, fallbackColor = "bg-brand-sage/10", ...props }, ref) => {
    const [hasError, setHasError] = useState(false);

    if (hasError || !src) {
      return (
        <div className={`w-full h-full flex flex-col items-center justify-center p-6 text-center ${fallbackColor} ${className}`} style={{ minHeight: '150px' }}>
          <span className="font-serif italic text-base text-brand-charcoal/60 mb-2">{alt || "Studio Véronique"}</span>
          <span className="font-sans text-xs font-semibold tracking-wider tracking-[0.2em] uppercase text-brand-charcoal/40">[ Image Unavailable ]</span>
        </div>
      );
    }

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={className}
        onError={() => setHasError(true)}
        {...props}
      />
    );
  }
);

SafeImage.displayName = 'SafeImage';

const SafeMotionImg = motion.create(SafeImage);

const Navbar = ({ onOpenAdmin }: { onOpenAdmin: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      <header className="sticky top-0 z-[100] bg-brand-cream/80 backdrop-blur-md py-6 border-b border-brand-charcoal/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center relative">
          <div className="text-lg sm:text-xl md:text-base lg:text-xl xl:text-2xl font-serif tracking-widest uppercase font-medium text-brand-charcoal">
            STUDIO VÉRONIQUE <span className="text-xs md:text-xs font-semibold tracking-wider lg:text-sm font-sans tracking-normal opacity-50 ml-1">/ LA</span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {['Portfolio', 'Philosophy', 'Services'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`} 
                className="text-xs lg:text-sm uppercase tracking-widest hover:text-brand-terracotta transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-brand-terracotta transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
            <button
              type="button"
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand-charcoal/5 border border-brand-charcoal/20 text-brand-charcoal font-mono text-base font-semibold min-h-[44px] font-semibold tracking-wider uppercase tracking-widest hover:bg-brand-charcoal hover:text-brand-cream transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-brand-terracotta" />
              [ ATELIER PASS ]
            </button>
            <a href="#inquiry" className="px-4 lg:px-8 py-2 md:py-2.5 lg:py-3 border border-brand-charcoal text-xs lg:text-sm uppercase tracking-widest hover:bg-brand-charcoal hover:text-brand-cream transition-all duration-300">
              Inquire
            </a>
          </div>

          {/* Mobile Menu Action Zone (Close / Hamburger) */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={onOpenAdmin}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-brand-charcoal/5 border border-brand-charcoal/20 text-brand-charcoal font-mono text-[9px] uppercase tracking-widest"
            >
              <ShieldCheck className="w-3 h-3 text-brand-terracotta" />
              PASS
            </button>
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="relative z-[110] p-4 flex items-center justify-center min-w-[48px] min-h-[48px]" 
              aria-label="Toggle Menu"
            >
              {isOpen ? <X size={24} className="text-brand-charcoal" /> : <Menu size={24} className="text-brand-charcoal" />}
            </button>
          </div>
        </div>
      </header>

      {/* Hardware-accelerated full-screen inline mobile menu overlay */}
      <div className={`fixed inset-0 bg-brand-cream z-[90] flex flex-col justify-between pt-32 pb-12 px-8 transition-all duration-500 ease-in-out md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col space-y-6 my-auto">
          {['Portfolio', 'Philosophy', 'Services'].map((item) => (
            <a 
              key={item}
              href={`#${item.toLowerCase()}`} 
              onClick={() => setIsOpen(false)} 
              className="font-serif text-4xl text-brand-charcoal py-3 tracking-wide hover:text-brand-terracotta transition-colors duration-300"
            >
              {item}
            </a>
          ))}
        </div>

        {/* CTA Section inside overlay */}
        <div className="pt-8 border-t border-brand-charcoal/10">
          <a 
            href="#inquiry"
            onClick={() => setIsOpen(false)}
            className="w-full block text-center py-5 bg-brand-charcoal text-brand-cream text-xs uppercase tracking-[0.3em] font-medium hover:bg-brand-sage transition-colors duration-500"
          >
            Inquire
          </a>
        </div>
      </div>
    </>
  );
};

const Hero = () => (
  <section className="relative min-h-screen flex flex-col lg:grid lg:grid-cols-2 overflow-hidden bg-brand-cream">
    {/* Left Side: Content */}
    <div className="flex-1 flex items-center z-10 px-6 py-24 sm:py-32 md:px-12 lg:px-24">
      <div className="max-w-2xl">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
          className="text-5xl sm:text-7xl lg:text-8xl tracking-tight leading-[1.1] mb-8"
        >
          Crafting Light, Space, and Stillness.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="text-lg md:text-xl text-brand-charcoal/70 mb-12 max-w-lg leading-relaxed"
        >
          A boutique interior design studio in Los Angeles dedicated to organic modernism, curated textures, and spaces that breathe.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-8"
        >
          <a href="#portfolio" className="group relative bg-brand-charcoal text-brand-cream px-10 py-5 text-sm uppercase tracking-[0.2em] font-medium overflow-hidden transition-colors duration-500 active:scale-95 inline-block text-center">
            <span className="relative z-10 transition-colors duration-500 group-hover:text-brand-cream">Explore Portfolio</span>
            <div className="absolute inset-0 bg-brand-sage translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
          </a>
          <a href="#inquiry" className="group flex items-center gap-3 text-sm uppercase tracking-[0.2em] font-medium hover:text-brand-terracotta transition-colors duration-300">
            Book a Consultation
            <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-300" />
          </a>
        </motion.div>
      </div>
    </div>

    {/* Right Side: Image */}
    <div className="h-[60vh] lg:h-auto lg:min-h-full relative overflow-hidden bg-brand-cream">
      <SafeMotionImg
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        src={IMAGES.hero}
        alt="LA Living Room"
        className="w-full h-full object-cover grayscale-[20%]"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-brand-charcoal/[0.03]"></div>
    </div>

    <div className="absolute bottom-12 left-12 hidden lg:block z-20">
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="flex flex-col items-center gap-4"
      >
        <div className="w-px h-24 bg-brand-charcoal/20"></div>
        <span className="text-xs font-semibold tracking-wider uppercase tracking-[0.3em] vertical-rl opacity-50">Scroll</span>
      </motion.div>
    </div>
  </section>
);

const Philosophy = () => (
  <section id="philosophy" className="scroll-mt-16 py-12 sm:py-16 md:py-24 bg-white overflow-hidden">
    <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1 }}
      >
        <h2 className="text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] mb-12">
          Spaces Shaped by the California Subdued Lifestyle.
        </h2>
        <p className="text-xl text-brand-charcoal/70 leading-relaxed font-light mb-8">
          We believe luxury is a feeling of ease. Our approach fuses raw architectural textures, natural light, and functional minimalism to create residential sanctuaries that stand the test of time.
        </p>
        <p className="text-xl text-brand-charcoal/70 leading-relaxed font-light">
          Deeply rooted in the Los Angeles design heritage, we curate homes that embrace the play between indoors and out, creating a seamless narrative for contemporary living.
        </p>
      </motion.div>
      
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, delay: 0.3 }}
          className="aspect-[4/5] bg-brand-cream overflow-hidden rounded-[2px]"
        >
          <SafeImage 
            src="https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=1200" 
            alt="Interior Detail"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </div>
    </div>
  </section>
);

const ProjectCard = ({ title, location, image, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8 }}
    className={`group relative overflow-hidden cursor-pointer ${className}`}
  >
    <div className="aspect-[3/4] overflow-hidden rounded-[2px] bg-brand-cream">
      <SafeMotionImg
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.8 }}
        src={image}
        alt={title}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
    </div>
    
    {/* Touch Screens & Mobile: Persistent high-end metadata block */}
    <div className="mt-4 md:hidden flex justify-between items-center px-1">
      <div>
        <h3 className="text-2xl font-serif text-brand-charcoal">{title}</h3>
        <p className="text-xs uppercase tracking-[0.2em] font-light text-brand-charcoal/50 mt-1">{location}</p>
      </div>
      <div className="w-10 h-10 rounded-full border border-brand-charcoal/10 flex items-center justify-center text-brand-terracotta active:scale-90 transition-all">
        <ArrowRight size={18} />
      </div>
    </div>

    {/* Desktop & Larger Screens: Immersive parallax visual hover screen */}
    <div className="hidden md:flex absolute inset-0 bg-brand-charcoal/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex-col items-center justify-center text-brand-cream p-12 text-center backdrop-blur-[2px]">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-3xl mb-3 font-serif">{title}</h3>
        <p className="text-sm uppercase tracking-widest font-light opacity-80 mb-8">{location}</p>
        <div className="overflow-hidden">
          <div
            className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] font-medium border-b border-brand-cream/30 pb-2 hover:border-brand-terracotta hover:text-brand-terracotta transition-all duration-300"
          >
            View Project <ArrowRight size={14} />
          </div>
        </div>
      </motion.div>
    </div>
  </motion.div>
);

const Portfolio = () => (
  <section id="portfolio" className="scroll-mt-16 py-12 sm:py-16 md:py-24 bg-brand-cream">
    <div className="max-w-7xl mx-auto px-6 md:px-12">
      <div className="flex flex-col md:flex-row justify-between items-end mb-24">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-brand-terracotta mb-4 block">The Collection</span>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.1] mb-4">Featured Work</h2>
        </div>
        <p className="max-w-md text-brand-charcoal/60 mt-8 md:mt-0 leading-relaxed">
          A curated gallery of residential sanctuaries across Southern California, from coastal Malibu estates to the industrial lofts of the Arts District.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-24">
        <div className="md:col-span-7">
          <ProjectCard 
            title="Malibu Coastal Sanctuary" 
            location="Malibu, CA" 
            image={IMAGES.portfolio1} 
          />
        </div>
        <div className="md:col-span-5 md:pt-48">
          <ProjectCard 
            title="Silver Lake Revival" 
            location="Silver Lake, CA" 
            image={IMAGES.portfolio2} 
          />
        </div>
        <div className="md:col-span-5 md:-mt-24">
          <ProjectCard 
            title="Arts District Loft" 
            location="Arts District, LA" 
            image={IMAGES.portfolio3} 
          />
        </div>
        <div className="md:col-span-7 flex flex-col justify-center items-center p-8 md:p-12 lg:p-24 bg-brand-charcoal text-brand-cream text-center group transition-colors duration-700 hover:bg-brand-sage/10 hover:text-brand-charcoal">
            <h3 className="text-4xl mb-8 font-serif">Want to see more?</h3>
            <button className="group flex items-center gap-3 text-sm uppercase tracking-[0.2em] font-medium border-b border-current pb-2 hover:text-brand-terracotta transition-colors duration-300">
              View All Projects
              <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-300" />
            </button>
        </div>
      </div>
    </div>
  </section>
);

const Services = () => (
  <section id="services" className="scroll-mt-16 py-12 sm:py-16 md:py-24 bg-white">
    <div className="max-w-7xl mx-auto px-6 md:px-12">
      <div className="text-center mb-32">
        <h2 className="text-5xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.1] mb-8">Curated Services</h2>
        <p className="max-w-xl mx-auto text-brand-charcoal/60 leading-relaxed">
          Our process is deeply collaborative and tailored to the exact way you wish to move through your world.
        </p>
      </div>

      <div className="space-y-1">
        {[
          {
            title: "Full-Scale Interior Architecture",
            desc: "From concept to completion. Layout planning, bespoke material selection, and rigorous project oversight for new builds and extensive renovations."
          },
          {
            title: "Spatial Styling & Curation",
            desc: "For spaces that need a soul. Sourcing custom furniture, natural textiles, fine art portfolios, and rare vintage objects from across the globe."
          },
          {
            title: "Turnkey Transformations",
            desc: "Complete residential furniture curation and installation. Optimized for high-end lifestyle enthusiasts who desire effortless, move-in-ready living."
          }
        ].map((service, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="group py-16 border-t border-brand-charcoal/10 grid grid-cols-1 md:grid-cols-12 gap-8 hover:bg-brand-sage/[0.03] transition-colors duration-700 px-6 cursor-default"
          >
            <div className="md:col-span-1 text-sm font-sans tracking-[0.3em] text-brand-sage opacity-40 group-hover:opacity-100 transition-all duration-500">0{idx + 1}</div>
            <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-10 gap-8">
              <div className="md:col-span-4">
                <h3 className="text-3xl md:text-4xl font-serif group-hover:text-brand-sage transition-colors duration-500">{service.title}</h3>
              </div>
              <div className="md:col-span-5 text-brand-charcoal/60 leading-relaxed font-light group-hover:text-brand-charcoal transition-colors duration-500">
                {service.desc}
              </div>
              <div className="md:col-span-1 flex justify-end items-start md:opacity-0 md:-translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-700">
                <ArrowRight size={32} strokeWidth={1} className="text-brand-terracotta" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const Testimonial = () => (
  <section className="py-12 sm:py-24 md:py-48 bg-brand-charcoal text-brand-cream text-center overflow-hidden">
    <div className="max-w-4xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1 }}
      >
        <span className="text-8xl font-serif opacity-10 leading-none">“</span>
        <blockquote className="text-3xl sm:text-5xl lg:text-6xl font-serif tracking-tight leading-[1.1] -mt-8 mb-12 italic">
          They didn't just design a house; they captured the exact way we wanted to live. Every corner feels intentional, warm, and distinctly Californian.
        </blockquote>
        <cite className="text-sm uppercase tracking-[0.3em] font-light opacity-60 block not-italic">
          — The Hollywood Hills Residence
        </cite>
      </motion.div>
    </div>
  </section>
);

const Inquiry = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="inquiry" className="scroll-mt-16 py-12 sm:py-16 md:py-24 bg-brand-cream">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-24">
        <div>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.1] mb-8">Let’s build your sanctuary.</h2>
          <p className="text-xl text-brand-charcoal/60 mb-12">
            We are currently accepting inquiries for late 2025 and early 2026 projects. Our studio takes on limited commissions each season to ensure uncompromising quality.
          </p>
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-brand-charcoal/70">
              <Mail size={20} className="text-brand-terracotta" />
              <span className="tracking-widest uppercase text-xs">studio@veroniquela.com</span>
            </div>
            <div className="flex items-start gap-4 text-brand-charcoal/70">
              <MapPin size={20} className="text-brand-terracotta mt-1" />
              <span className="tracking-widest uppercase text-xs">Arts District, Los Angeles</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 md:p-16 shadow-2xl shadow-brand-charcoal/5 flex flex-col justify-center min-h-[400px]">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form 
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-10" 
                onSubmit={handleSubmit}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="relative group">
                    <input type="text" id="name" placeholder="Name" className="w-full bg-transparent border-b border-brand-charcoal/20 py-4 focus:border-brand-terracotta outline-none transition-colors peer" required />
                  </div>
                  <div className="relative group">
                    <input type="email" id="email" placeholder="Email" className="w-full bg-transparent border-b border-brand-charcoal/20 py-4 focus:border-brand-terracotta outline-none transition-colors peer" required />
                  </div>
                </div>
                <div className="relative group">
                  <label htmlFor="project" className="sr-only">Project Type</label>
                  <select id="project" className="w-full bg-transparent border-b border-brand-charcoal/20 py-4 focus:border-brand-terracotta outline-none transition-colors appearance-none text-brand-charcoal/50 pr-10 cursor-pointer">
                    <option value="">Project Type</option>
                    <option value="architecture">Interior Architecture</option>
                    <option value="styling">Styling & Curation</option>
                    <option value="turnkey">Turnkey Transformation</option>
                  </select>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-brand-charcoal/30">
                    <ArrowRight size={16} className="rotate-90" />
                  </div>
                </div>
                <div className="relative group">
                  <textarea id="message" rows={4} placeholder="Tell us about your space" className="w-full bg-transparent border-b border-brand-charcoal/20 py-4 focus:border-brand-terracotta outline-none transition-colors resize-none"></textarea>
                </div>
                <button type="submit" className="group relative w-full bg-brand-charcoal text-brand-cream py-6 uppercase tracking-[0.3em] text-base font-semibold min-h-[44px] font-medium overflow-hidden transition-all duration-500">
                  <span className="relative z-10">Submit Inquiry</span>
                  <div className="absolute inset-0 bg-brand-terracotta translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                </button>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="space-y-6 text-center md:text-left"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-sage/10 text-brand-sage mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif text-brand-charcoal tracking-wide leading-snug">Inquiry Received</h3>
                <p className="text-brand-charcoal/80 font-serif italic text-lg sm:text-xl leading-relaxed">
                  Thank you. Your space has our attention. We will reach out within 48 hours to schedule your consultation.
                </p>
                <div className="pt-6">
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="text-xs uppercase tracking-[0.2em] text-brand-charcoal/60 hover:text-brand-terracotta transition-colors border-b border-brand-charcoal/20 hover:border-brand-terracotta pb-1"
                  >
                    Send another message
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="py-12 bg-brand-cream border-t border-brand-charcoal/5">
    <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-12">
      <div className="text-xl font-serif tracking-widest uppercase">
        STUDIO VÉRONIQUE / LA
      </div>
      
      <div className="flex items-center space-x-10">
        <a href="#" aria-label="Instagram" className="opacity-50 hover:opacity-100 hover:text-brand-terracotta transition-all duration-300 transform hover:-translate-y-1"><Instagram size={20} /></a>
        <a href="#" aria-label="Pinterest" className="opacity-50 hover:opacity-100 hover:text-brand-terracotta transition-all duration-300 transform hover:-translate-y-1"><Pinterest size={20} /></a>
        {['Philosophy', 'Privacy Policy'].map(item => (
          <a key={item} href={item === 'Philosophy' ? '#philosophy' : '#'} className="hidden sm:inline-block text-xs font-semibold tracking-wider uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">{item}</a>
        ))}
      </div>

      <div className="text-xs font-semibold tracking-wider uppercase tracking-widest opacity-35">
        © 2026 STUDIO VÉRONIQUE. ALL RIGHTS RESERVED.
      </div>
    </div>
  </footer>
);

export default function App() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (path.includes('admin') || hash.includes('admin') || search.includes('admin')) {
        setIsAdminOpen(true);
      }
    }
  }, []);

  return (
    <main className="bg-brand-cream selection:bg-brand-terracotta/30">
      <Navbar onOpenAdmin={() => setIsAdminOpen(true)} />
      <AdminPortalModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      <Hero />
      <Philosophy />
      <Portfolio />
      <Services />
      <Testimonial />
      <Inquiry />
      <Footer />
    </main>
  );
}
