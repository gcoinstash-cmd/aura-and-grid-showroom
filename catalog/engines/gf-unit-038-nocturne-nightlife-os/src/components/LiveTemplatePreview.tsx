import React, { useState } from "react";
import { 
  Music, 
  Flame, 
  GlassWater, 
  Crown, 
  Compass, 
  Waves, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  ArrowUp, 
  Menu, 
  X, 
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { VenueContent } from "../types";

interface LiveTemplatePreviewProps {
  activeContent: VenueContent;
  activeTheme: "theme-neon-velvet" | "theme-gold-noir" | "theme-emerald-dark";
  onOpenAdmin: () => void;
}

export default function LiveTemplatePreview({
  activeContent,
  activeTheme,
  onOpenAdmin
}: LiveTemplatePreviewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Reservation Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    guests: "2",
    date: "",
    time: "7:00 PM",
    occasion: "None",
    notes: ""
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  const renderIcon = (iconName: string) => {
    const props = { className: "w-9 h-9 stroke-[1.25px] text-theme-brand" };
    switch (iconName) {
      case "Music": return <Music {...props} />;
      case "Flame": return <Flame {...props} />;
      case "GlassWater": return <GlassWater {...props} />;
      case "Crown": return <Crown {...props} />;
      case "Compass": return <Compass {...props} />;
      case "Waves": return <Waves {...props} />;
      case "ShieldCheck": return <ShieldCheck {...props} />;
      default: return <Compass {...props} />;
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    
    setTimeout(() => {
      setFormLoading(false);
      setFormSubmitted(true);
      setFormData({
        name: "",
        email: "",
        guests: "2",
        date: "",
        time: "7:00 PM",
        occasion: "None",
        notes: ""
      });
      
      setTimeout(() => {
        setFormSubmitted(false);
      }, 6000);
    }, 1000);
  };

  const filteredMenuItems = selectedCategory === "all"
    ? activeContent.menuItems
    : activeContent.menuItems.filter(item => item.category === selectedCategory);

  return (
    <div className={`${activeTheme} bg-theme-main text-theme-body font-sans transition-all duration-300 relative w-full`}>
      
      {/* 1. ANNOUNCEMENT / NOT mOCK BAR */}
      <div className="bg-[var(--color-brand)] text-[var(--color-bg-main)] font-display text-xs font-semibold font-bold tracking-widest text-center py-2 px-4 select-none relative z-[1010] flex items-center justify-center gap-2">
        <span className="inline-block w-1.5 h-1.5 bg-[var(--color-bg-main)] rounded-full animate-ping"></span>
        <span>{activeContent.announcement}</span>
      </div>

      {/* 2. NAVIGATION */}
      <header className="sticky top-0 bg-theme-main/90 backdrop-blur-md border-b border-theme/80 z-[1000] h-20 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="logo-container">
            <a href="#" className="font-display text-xl font-bold tracking-wider text-theme-lead hover:opacity-90">
              {activeContent.brandName.split(" ")[0]}
              <span className="text-theme-brand font-display font-bold">
                {activeContent.brandName.split(" ").slice(1).join(" ") ? " " + activeContent.brandName.split(" ").slice(1).join(" ") : ""}
              </span>
            </a>
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            <a href="#about" className="font-display text-xs font-semibold tracking-widest text-theme-dim hover:text-theme-brand transition-colors">OUR STORY</a>
            <a href="#rituals" className="font-display text-xs font-semibold tracking-widest text-theme-dim hover:text-theme-brand transition-colors">THE ROOM</a>
            <a href="#menu" className="font-display text-xs font-semibold tracking-widest text-theme-dim hover:text-theme-brand transition-colors">OUR MENU</a>
            <a href="#weekly" className="font-display text-xs font-semibold tracking-widest text-theme-dim hover:text-theme-brand transition-colors">EVENTS</a>
            <a href="#reservations" className="font-display text-xs font-semibold tracking-widest text-theme-dim hover:text-theme-brand transition-colors">RESERVATIONS</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500/15 border border-amber-500/35 text-amber-300 font-mono text-base font-semibold min-h-[44px] font-semibold tracking-wider uppercase tracking-widest hover:bg-amber-500/25 transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">[ NOCTURNE PASS ]</span>
              <span className="sm:hidden">PASS</span>
            </button>
            <a 
              href="#reservations" 
              className="bg-[var(--color-brand)] hover:opacity-90 text-[var(--color-bg-main)] font-display text-xs font-semibold tracking-wider font-bold tracking-widest px-4 py-2.5 transition-all duration-350 select-none uppercase"
              style={{ borderRadius: "var(--radius-btn)" }}
            >
              Reserve a Table
            </a>
            
            <button 
              id="mobile-nav-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="lg:hidden p-2 text-theme-lead hover:bg-theme-muted transition-colors rounded-lg cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE NAV DRAWER */}
      {mobileMenuOpen && (
        <div id="mobile-menu-drawer" className="lg:hidden fixed top-[112px] left-0 right-0 bottom-0 bg-theme-muted border-t border-theme z-[999] p-8 flex flex-col gap-6 font-display animate-in fade-in duration-300">
          <a onClick={() => setMobileMenuOpen(false)} href="#about" className="text-xl font-medium tracking-wide text-theme-lead hover:text-theme-brand">OUR STORY</a>
          <a onClick={() => setMobileMenuOpen(false)} href="#rituals" className="text-xl font-medium tracking-wide text-theme-lead hover:text-theme-brand">THE ROOM</a>
          <a onClick={() => setMobileMenuOpen(false)} href="#menu" className="text-xl font-medium tracking-wide text-theme-lead hover:text-theme-brand">OUR MENU</a>
          <a onClick={() => setMobileMenuOpen(false)} href="#weekly" className="text-xl font-medium tracking-wide text-theme-lead hover:text-theme-brand">EVENTS</a>
          <a onClick={() => setMobileMenuOpen(false)} href="#reservations" className="text-xl font-medium tracking-wide text-theme-lead text-theme-brand font-bold">RESERVATIONS</a>
        </div>
      )}

      {/* 3. HERO SECTION */}
      <section id="hero" className="relative min-height-[75vh] py-16 lg:py-28 overflow-hidden z-20 flex items-center border-b border-theme/50">
        <div className="absolute top-[-5%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(var(--color-glow)_0%,transparent_70%)] blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 w-full">
          <div className="lg:col-span-12 xl:col-span-7 flex flex-col items-start gap-6">
            <span className="font-display text-xs font-semibold font-bold text-theme-brand tracking-widest uppercase mt-2">
              [ {activeContent.tagline} ]
            </span>
            <h1 className="font-serif text-[clamp(2.2rem,4.5vw,4.2rem)] leading-[1.08] text-theme-lead tracking-tight font-medium">
              {activeContent.heroTitle}
            </h1>
            <p className="text-theme-body text-base lg:text-lg max-w-2xl font-light leading-relaxed">
              {activeContent.heroSub}
            </p>
            <div className="flex flex-wrap gap-4 mt-4 w-full sm:w-auto">
              <a 
                href="#reservations" 
                className="w-full sm:w-auto bg-[var(--color-brand)] text-[var(--color-bg-main)] font-display text-xs font-semibold font-bold tracking-widest px-8 py-4 uppercase text-center hover:bg-theme-lead hover:text-[var(--color-bg-main)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                style={{ borderRadius: "var(--radius-btn)" }}
              >
                {activeContent.ctaPrimaryText}
              </a>
              <a 
                href="#weekly" 
                className="w-full sm:w-auto border border-theme-strong text-theme-lead font-display text-xs font-semibold font-bold tracking-widest px-8 py-4 uppercase text-center hover:border-theme-brand hover:shadow-[0_0_15px_var(--color-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                style={{ borderRadius: "var(--radius-btn)" }}
              >
                {activeContent.ctaSecondaryText}
              </a>
            </div>
          </div>

          {/* Asymmetrical Right Hero Visual Frame */}
          <div className="hidden xl:block xl:col-span-5 relative h-[480px] w-full rounded-xl overflow-hidden border border-theme group">
            <div className="absolute inset-0 bg-gradient-to-r from-theme-main via-transparent to-transparent z-10"></div>
            <div className="absolute inset-0 bg-[linear-gradient(0deg,var(--color-bg-main)_0%,transparent_30%)] z-10"></div>
            <img 
              src={activeContent.id === "neon-soul" 
                ? "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80" 
                : "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=80"} 
              alt="Nightlife Energy" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover saturate-[0.8] contrast-[1.05] transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </div>
      </section>

      {/* 4. SIGNATURE VENUE FEATURES */}
      <section id="rituals" className="py-24 bg-theme-muted/50 border-b border-theme/50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-xl mb-16">
            <span className="font-display text-xs font-semibold tracking-wider font-bold text-theme-brand tracking-widest block mb-2 uppercase">
              {activeContent.featuresSub}
            </span>
            <h2 className="font-serif text-3xl lg:text-4xl text-theme-lead tracking-tight">
              {activeContent.featuresTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeContent.features.map((feature, idx) => (
              <div 
                key={idx}
                className="bg-theme-card border border-theme rounded-xl p-8 hover:border-theme-brand hover:shadow-[0_10px_30px_var(--color-glow)] hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="mb-6 opacity-90 group-hover:opacity-100 transition-opacity">
                  {renderIcon(feature.iconName)}
                </div>
                <h3 className="font-display text-sm font-semibold tracking-wide text-theme-lead mb-3 uppercase">
                  {feature.title}
                </h3>
                <p className="text-theme-dim text-xs leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. STORY / ATMOSPHERE SECTION */}
      <section id="about" className="py-24 border-b border-theme/50 bg-theme-main">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            <div className="lg:col-span-6 flex flex-col items-start text-left">
              <span className="font-display text-xs font-semibold tracking-wider font-bold text-theme-brand tracking-widest block mb-2 uppercase">
                Our Story
              </span>
              <h2 className="font-serif text-3xl lg:text-4xl text-theme-lead tracking-tight mb-8">
                {activeContent.storyTitle}
              </h2>
              <p className="font-serif text-theme-lead text-lg italic leading-relaxed mb-6 font-medium">
                “ {activeContent.storyLead} ”
              </p>
              <p className="text-theme-body text-sm leading-relaxed mb-4 font-light">
                {activeContent.storyParagraph1}
              </p>
              <p className="text-theme-body text-sm leading-relaxed mb-8 font-light">
                {activeContent.storyParagraph2}
              </p>
              
              <div className="border-l-2 border-theme-brand pl-6">
                <span className="font-serif text-lg text-theme-lead block font-semibold leading-tight">
                  {activeContent.storySignatureAuthor}
                </span>
                <span className="font-display text-xs font-semibold tracking-wider font-bold text-theme-dim tracking-wider uppercase">
                  {activeContent.storySignatureLabel}
                </span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-xl overflow-hidden border border-theme h-[440px] shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-[rgba(var(--color-brand-rgb),0.12)] to-transparent pointer-events-none z-10"></div>
                <img 
                  src={activeContent.id === "neon-soul" 
                    ? "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80" 
                    : "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=1200&q=80"} 
                  alt="Atmospheric interior space" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover saturate-[0.8] contrast-[1.05]"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. MENU SELECTIONS & OFFERINGS */}
      <section id="menu" className="py-24 bg-theme-muted/30 border-b border-theme/50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-14">
            <span className="font-display text-xs font-semibold tracking-wider font-bold text-theme-brand tracking-widest block mb-2 uppercase">
              {activeContent.menuSub}
            </span>
            <h2 className="font-serif text-2xl lg:text-4xl text-theme-lead tracking-tight">
              {activeContent.menuTitle}
            </h2>
          </div>

          {/* Interactive filter list */}
          <div className="flex flex-wrap gap-2 border-b border-theme pb-4 mb-10 text-xs font-display overflow-x-auto">
            <button 
              id="filter-all"
              onClick={() => setSelectedCategory("all")} 
              className={`px-4 py-2 font-medium tracking-widest uppercase transition-all duration-200 cursor-pointer ${selectedCategory === "all" ? "text-theme-brand border-b-2 border-theme-brand" : "text-theme-dim hover:text-theme-lead"}`}
            >
              All
            </button>
            <button 
              id="filter-cocktails"
              onClick={() => setSelectedCategory("cocktails")} 
              className={`px-4 py-2 font-medium tracking-widest uppercase transition-all duration-200 cursor-pointer ${selectedCategory === "cocktails" ? "text-theme-brand border-b-2 border-theme-brand" : "text-theme-dim hover:text-theme-lead"}`}
            >
              Cocktails
            </button>
            <button 
              id="filter-bites"
              onClick={() => setSelectedCategory("bites")} 
              className={`px-4 py-2 font-medium tracking-widest uppercase transition-all duration-200 cursor-pointer ${selectedCategory === "bites" ? "text-theme-brand border-b-2 border-theme-brand" : "text-theme-dim hover:text-theme-lead"}`}
            >
              Bites
            </button>
            <button 
              id="filter-plates"
              onClick={() => setSelectedCategory("plates")} 
              className={`px-4 py-2 font-medium tracking-widest uppercase transition-all duration-200 cursor-pointer ${selectedCategory === "plates" ? "text-theme-brand border-b-2 border-theme-brand" : "text-theme-dim hover:text-theme-lead"}`}
            >
              Plates
            </button>
            <button 
              id="filter-spirits"
              onClick={() => setSelectedCategory("wine-spirits")} 
              className={`px-4 py-2 font-medium tracking-widest uppercase transition-all duration-200 cursor-pointer ${selectedCategory === "wine-spirits" ? "text-theme-brand border-b-2 border-theme-brand" : "text-theme-dim hover:text-theme-lead"}`}
            >
              Spirits & Wine
            </button>
          </div>

          {/* Interactive Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredMenuItems.map((item, index) => (
              <div 
                key={index}
                className="bg-theme-card border border-theme rounded-xl p-6 hover:border-theme-strong hover:scale-[1.01] transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-6 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-serif text-base font-semibold text-theme-lead">
                      {item.name}
                    </h4>
                    {item.badge && (
                      <span className="text-[9px] font-display font-black bg-theme-muted/80 text-theme-brand border border-theme-strong/60 px-1.5 py-0.5 tracking-wider uppercase">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="font-display text-sm font-semibold text-theme-brand">
                    {item.price}
                  </span>
                </div>
                <p className="text-theme-dim text-xs leading-relaxed font-light">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. EVENTS / WEEKLY PROGRAMMING */}
      <section id="weekly" className="py-24 border-b border-theme/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-14">
            <span className="font-display text-xs font-semibold tracking-wider font-bold text-theme-brand tracking-widest block mb-2 uppercase">
              {activeContent.eventsSub}
            </span>
            <h2 className="font-serif text-3xl lg:text-4xl text-theme-lead tracking-tight">
              {activeContent.eventsTitle}
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {activeContent.events.map((event, index) => (
              <div 
                key={index}
                className="bg-theme-card border border-theme p-6 lg:p-8 rounded-xl flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between hover:border-theme-brand hover:shadow-[0_5_25px_var(--color-glow)] transition-all duration-300 group"
              >
                <div className="flex flex-col gap-1 min-w-[140px] font-display">
                  <span className="text-2xl font-bold text-theme-brand tracking-wider">{event.day}</span>
                  <span className="text-xs font-semibold tracking-wider text-theme-dim tracking-wider uppercase font-semibold">{event.time}</span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h4 className="font-serif text-lg font-semibold text-theme-lead">
                      {event.title}
                    </h4>
                    {event.badge && (
                      <span className="bg-[var(--color-brand)] text-[var(--color-bg-main)] font-display text-[9px] font-extrabold px-2 py-0.5 tracking-wider uppercase">
                        {event.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-theme-dim text-xs leading-relaxed max-w-2xl font-light mb-1">
                    {event.description}
                  </p>
                  <span className="font-mono text-xs font-semibold tracking-wider text-theme-brand/80">{event.genre}</span>
                </div>

                <div className="w-full lg:w-auto">
                  <a 
                    href="#reservations"
                    className="w-full lg:w-auto text-center inline-block border border-theme-strong hover:border-theme-brand text-theme-lead hover:shadow-[0_0_10px_var(--color-glow)] font-display text-xs font-semibold tracking-wider font-bold tracking-widest px-5 py-2.5 uppercase transition-all"
                    style={{ borderRadius: "var(--radius-btn)" }}
                  >
                    Reserve a Table
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. TESTIMONIAL PRESETS / PRAISE */}
      <section id="testimonials" className="py-24 bg-theme-card border-b border-theme-strong/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="font-display text-xs font-semibold tracking-wider font-bold text-theme-brand tracking-widest block mb-2 uppercase">
              {activeContent.testimonialsSub}
            </span>
            <h2 className="font-serif text-2xl lg:text-3xl text-theme-lead tracking-tight">
              {activeContent.testimonialsTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {activeContent.testimonials.map((testimonial, idx) => (
              <blockquote 
                key={idx}
                className="bg-theme-muted/40 border border-theme p-8 lg:p-10 rounded-xl relative flex flex-col justify-between"
              >
                <div>
                  <span className="font-serif text-6xl text-theme-brand/35 absolute top-4 left-6 pointer-events-none select-none">“</span>
                  <p className="font-serif text-theme-lead text-base leading-relaxed italic relative z-10 mb-8 pt-4">
                    {testimonial.quote}
                  </p>
                </div>
                <cite className="not-italic inline-flex flex-col gap-1 border-t border-theme/60 pt-4">
                  <span className="font-display text-xs font-semibold tracking-wider text-theme-lead uppercase">
                    {testimonial.author}
                  </span>
                  <span className="font-sans text-xs font-semibold text-theme-dim">
                    {testimonial.role} — {testimonial.source}
                  </span>
                </cite>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* 9 & 10. RESERVATIONS & PRIVATE GROUP EVENTS CELLAR */}
      <section id="reservations" className="py-24 relative select-text">
        <div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(var(--color-glow)_0%,transparent_70%)] blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            
            {/* Live Interactive Form */}
            <div className="lg:col-span-7 bg-theme-card border border-theme rounded-xl p-8 lg:p-12">
              <span className="font-display text-xs font-semibold tracking-wider font-bold text-theme-brand tracking-widest block mb-2 uppercase">
                {activeContent.reservationSub}
              </span>
              <h2 className="font-serif text-2xl lg:text-3xl text-theme-lead tracking-tight mb-4">
                {activeContent.reservationTitle}
              </h2>
              
              {formSubmitted ? (
                <div id="demo-form-success" className="bg-emerald-950/20 border border-emerald-500 text-emerald-400 p-6 rounded-lg font-sans text-xs space-y-2 mt-8 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold uppercase tracking-wider font-display text-xs">Reservation Received</span>
                  </div>
                  <p className="text-neutral-300">
                    Thank you! Your reservation request has been successfully submitted. We will send a confirmation email shortly. We look forward to welcoming you.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-6 mt-8 font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="name" className="font-display text-sm font-semibold font-bold text-theme-lead tracking-wider">Name</label>
                      <input 
                        type="text" 
                        id="name" 
                        value={formData.name}
                        onChange={handleFormChange}
                        className="bg-theme-muted border border-theme focus:border-theme-brand text-theme-lead p-3 rounded text-base min-h-[44px] focus:outline-none"
                        placeholder="Your full name" 
                        required 
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="email" className="font-display text-sm font-semibold font-bold text-theme-lead tracking-wider">Email</label>
                      <input 
                        type="email" 
                        id="email" 
                        value={formData.email}
                        onChange={handleFormChange}
                        className="bg-theme-muted border border-theme focus:border-theme-brand text-theme-lead p-3 rounded text-base min-h-[44px] focus:outline-none"
                        placeholder="Your email address" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="guests" className="font-display text-sm font-semibold font-bold text-theme-lead tracking-wider">Guests</label>
                      <select 
                        id="guests" 
                        value={formData.guests}
                        onChange={handleFormChange}
                        className="bg-theme-muted border border-theme focus:border-theme-brand text-theme-lead p-3 rounded text-base min-h-[44px] focus:none outline-none appearance-none cursor-pointer"
                      >
                        <option value="1">1 Guest</option>
                        <option value="2">2 Guests</option>
                        <option value="3">3 Guests</option>
                        <option value="4">4 Guests</option>
                        <option value="5">5 Guests</option>
                        <option value="6">6 Guests</option>
                        <option value="7+">7+ Guests</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="date" className="font-display text-sm font-semibold font-bold text-theme-lead tracking-wider">Date</label>
                      <input 
                        type="date" 
                        id="date" 
                        value={formData.date}
                        onChange={handleFormChange}
                        className="bg-theme-muted border border-theme focus:border-theme-brand text-theme-lead p-3 rounded text-base min-h-[44px] focus:outline-none cursor-pointer" 
                        required 
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="time" className="font-display text-sm font-semibold font-bold text-theme-lead tracking-wider">Time</label>
                      <select 
                        id="time" 
                        value={formData.time}
                        onChange={handleFormChange}
                        className="bg-theme-muted border border-theme focus:border-theme-brand text-theme-lead p-3 rounded text-base min-h-[44px] focus:none outline-none appearance-none cursor-pointer"
                      >
                        <option value="5:00 PM">5:00 PM</option>
                        <option value="5:30 PM">5:30 PM</option>
                        <option value="6:00 PM">6:00 PM</option>
                        <option value="6:30 PM">6:30 PM</option>
                        <option value="7:00 PM">7:00 PM</option>
                        <option value="7:30 PM">7:30 PM</option>
                        <option value="8:00 PM">8:00 PM</option>
                        <option value="8:30 PM">8:30 PM</option>
                        <option value="9:00 PM">9:00 PM</option>
                        <option value="9:30 PM">9:30 PM</option>
                        <option value="10:00 PM">10:00 PM</option>
                        <option value="10:30 PM">10:30 PM</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="occasion" className="font-display text-sm font-semibold font-bold text-theme-lead tracking-wider">Occasion</label>
                    <select 
                      id="occasion" 
                      value={formData.occasion}
                      onChange={handleFormChange}
                      className="bg-theme-muted border border-theme focus:border-theme-brand text-theme-lead p-3 rounded text-base min-h-[44px] focus:none outline-none appearance-none cursor-pointer"
                    >
                      <option value="None">No Special Occasion</option>
                      <option value="Birthday">Birthday</option>
                      <option value="Anniversary">Anniversary</option>
                      <option value="Date Night">Date Night</option>
                      <option value="Business Dinner">Business Dinner</option>
                      <option value="Other">Other Celebration</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="notes" className="font-display text-sm font-semibold font-bold text-theme-lead tracking-wider">Special Requests</label>
                    <textarea 
                      id="notes" 
                      rows={3} 
                      value={formData.notes}
                      onChange={handleFormChange}
                      className="bg-theme-muted border border-theme focus:border-theme-brand text-theme-lead p-3 rounded text-base min-h-[44px] focus:outline-none"
                      placeholder="Add any special requests..."
                    ></textarea>
                  </div>

                  <button 
                    id="submit-res-btn"
                    type="submit" 
                    disabled={formLoading}
                    className="w-full bg-[var(--color-brand)] text-[var(--color-bg-main)] font-display text-base font-semibold min-h-[44px] font-semibold font-bold tracking-widest py-4 uppercase hover:bg-theme-lead hover:text-[var(--color-bg-main)] transition-all cursor-pointer"
                    style={{ borderRadius: "var(--radius-btn)" }}
                  >
                    {formLoading ? "Submitting Reservation..." : "Submit Reservation"}
                  </button>
                </form>
              )}
            </div>

            {/* Private Events Upsell Pitch */}
            <div className="lg:col-span-5 bg-gradient-to-br from-theme-card to-[rgba(var(--color-brand-rgb),0.04)] border border-theme rounded-xl p-8 lg:p-12 flex flex-col justify-between">
              <div>
                <span className="font-display text-xs font-semibold tracking-wider font-bold text-theme-brand tracking-widest block mb-2 uppercase">
                  {activeContent.privateEventsSub}
                </span>
                <h3 className="font-serif text-2xl lg:text-3xl text-theme-lead tracking-tight mb-6">
                  {activeContent.privateEventsTitle}
                </h3>
                <p className="text-theme-body text-xs font-light leading-relaxed mb-8">
                  {activeContent.privateEventsCopy}
                </p>

                <div className="space-y-4 border-t border-theme/85 pt-6">
                  <div className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-theme-brand"></span>
                    <span className="text-xs font-semibold text-theme-lead tracking-wide font-sans">{activeContent.privateEventsHighlight1}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-theme-brand"></span>
                    <span className="text-xs font-semibold text-theme-lead tracking-wide font-sans">{activeContent.privateEventsHighlight2}</span>
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <a 
                  id="pdf-eventdeck-download"
                  href={`mailto:${activeContent.email}?subject=Private%20Event%20Inquiry`} 
                  className="w-full text-center block border border-theme-strong hover:border-theme-brand text-theme-lead hover:shadow-[0_0_15px_var(--color-glow)] font-display text-xs font-semibold tracking-wider font-bold tracking-widest py-4 uppercase transition-all duration-350"
                  style={{ borderRadius: "var(--radius-btn)" }}
                >
                  Inquire About Private Events
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 11. LOCATION / HOURS / CONTACT SECTION */}
      <section id="contact" className="py-24 bg-theme-muted/30 border-b border-theme/50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <span className="font-display text-xs font-semibold tracking-wider font-bold text-theme-brand tracking-widest block mb-2 uppercase">
                  Find Us
                </span>
                <h2 className="font-serif text-3xl text-theme-lead tracking-tight mb-8">
                  {activeContent.contactTitle}
                </h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <MapPin className="w-5 h-5 text-theme-brand flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-display text-xs font-semibold tracking-wider tracking-wider text-theme-lead font-bold uppercase mb-1">Address</p>
                      <p className="text-theme-body text-xs font-light">{activeContent.address}</p>
                      <p className="text-theme-dim text-xs font-light">{activeContent.cityState}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Phone className="w-5 h-5 text-theme-brand flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-display text-xs font-semibold tracking-wider tracking-wider text-theme-lead font-bold uppercase mb-1">Telephone</p>
                      <p className="text-theme-body text-xs font-light">{activeContent.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Mail className="w-5 h-5 text-theme-brand flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-display text-xs font-semibold tracking-wider tracking-wider text-theme-lead font-bold uppercase mb-1">Inquiries</p>
                      <p className="text-theme-body text-xs font-light">{activeContent.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Operating Cycles list */}
              <div className="border-t border-theme/60 pt-8 mt-12">
                <h4 className="font-display text-xs font-semibold tracking-wider tracking-wider text-theme-lead font-bold uppercase mb-4">Hours of Operation</h4>
                <div className="space-y-3">
                  {activeContent.hours.map((hour, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-theme-lead font-display text-xs font-semibold font-semibold">{hour.days}</span>
                      <div className="flex-1 border-b border-dotted border-theme mx-4"></div>
                      <span className="text-theme-brand font-mono">{hour.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Map Frame Grid Box Design */}
            <div className="lg:col-span-7 h-[420px] bg-theme-card border border-theme rounded-xl flex items-center justify-center p-8 relative overflow-hidden">
              <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(var(--color-text-dim)_1px,transparent_1px)", backgroundSize: "20px 20px" }}></div>
              
              <div className="bg-theme-main border border-theme-brand max-w-sm p-8 text-center relative z-10 shadow-2xl space-y-4" style={{ borderWidth: "1px" }}>
                <span className="font-display text-xs font-semibold tracking-wider tracking-wider text-theme-brand font-bold uppercase">Arrival & Parking</span>
                <h4 className="font-serif text-lg font-semibold text-theme-lead">
                  {activeContent.id === "neon-soul" ? "Downtown New Orleans" : "SoHo, Manhattan"}
                </h4>
                <p className="text-theme-dim text-xs leading-relaxed font-light">
                  {activeContent.id === "neon-soul" 
                    ? "Located on Decatur Street near the corner entrance. Look for the bronze sign above the door. Valet parking is available Friday and Saturday evenings."
                    : "Located on Prince Street, down the lower-level stairs. Look for the bronze sign above the door. Valet parking is available Friday and Saturday."}
                </p>
                <a 
                  id="google-maps-redirect"
                  href={`https://maps.google.com/?q=${encodeURIComponent(activeContent.address + " " + activeContent.cityState)}`}
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-2 border border-theme-brand hover:bg-theme-brand hover:text-theme-main text-theme-lead font-display text-xs font-semibold tracking-wider px-4 py-2 font-bold tracking-widest uppercase transition-all"
                  style={{ borderRadius: "var(--radius-btn)" }}
                >
                  <span>GET DIRECTIONS</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 12. PREMIUM FOOTER */}
      <footer className="bg-theme-card border-t border-theme/80 py-16 text-xs text-theme-dim">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          <div className="space-y-4">
            <h4 className="font-display text-base font-bold text-theme-lead tracking-wider">
              {activeContent.brandName}
            </h4>
            <p className="text-theme-dim font-light text-xs max-w-xs leading-relaxed">
              {activeContent.tagline}
            </p>
            <p className="text-xs font-semibold tracking-wider text-theme-dim/75 font-mono">
              © 2026 {activeContent.brandName}. All rights reserved.
            </p>
          </div>

          <div className="space-y-4">
            <h5 className="font-display text-xs font-semibold tracking-wider font-bold tracking-widest text-theme-lead">Navigate</h5>
            <ul className="space-y-2 font-display text-xs font-semibold tracking-wider font-semibold tracking-wider">
              <li><a href="#about" className="hover:text-theme-brand hover:pl-1 transition-all">Our Story</a></li>
              <li><a href="#rituals" className="hover:text-theme-brand hover:pl-1 transition-all">The Room</a></li>
              <li><a href="#menu" className="hover:text-theme-brand hover:pl-1 transition-all">Our Menu</a></li>
              <li><a href="#weekly" className="hover:text-theme-brand hover:pl-1 transition-all">Upcoming Events</a></li>
              <li><a href="#reservations" className="hover:text-theme-brand hover:pl-1 transition-all">Reserve a Table</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h5 className="font-display text-xs font-semibold tracking-wider font-bold tracking-widest text-theme-lead">Resources</h5>
            <ul className="space-y-2 font-display text-xs font-semibold tracking-wider font-semibold tracking-wider">
              <li><a href="#reservations" className="hover:text-theme-brand hover:pl-1 transition-all">Reservations</a></li>
              <li><a href="#contact" className="hover:text-theme-brand hover:pl-1 transition-all">Find Us</a></li>
              <li><a href={`mailto:${activeContent.email}?subject=Private%20Event%20Inquiry`} className="hover:text-theme-brand hover:pl-1 transition-all">Private Events</a></li>
              <li><a href="#menu" className="hover:text-theme-brand hover:pl-1 transition-all">Our Menu</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h5 className="font-display text-xs font-semibold tracking-wider font-bold tracking-widest text-theme-lead">Newsletter</h5>
            <p className="text-theme-dim leading-relaxed text-xs font-light">
              Subscribe to receive exclusive invitations, upcoming event announcements, and seasonal menu specials.
            </p>
            {newsletterSubmitted ? (
              <p className="text-theme-brand text-xs font-semibold animate-fade-in mt-2">
                Thank you for subscribing!
              </p>
            ) : (
              <div className="flex gap-2">
                <input 
                  id="footer-email-input"
                  type="email" 
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address" 
                  className="bg-theme-muted border border-theme focus:border-theme-brand p-2 text-xs text-theme-lead focus:outline-none w-full"
                />
                <button 
                  id="footer-email-submit"
                  onClick={() => {
                    if (newsletterEmail.trim()) {
                      setNewsletterSubmitted(true);
                      setNewsletterEmail("");
                    }
                  }} 
                  className="bg-theme-brand text-[var(--color-bg-main)] font-display text-xs font-semibold tracking-wider font-black px-4 hover:opacity-90 select-none cursor-pointer"
                >
                  Join
                </button>
              </div>
            )}
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 border-t border-theme/60 pt-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-xs font-semibold tracking-wider font-light max-w-xl text-theme-dim">
            Live music and classic dining daily. Table reservations are recommended for weekend music sets. Smart casual dress code.
          </p>
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 border border-theme px-4 py-2 hover:border-theme-brand text-theme-lead font-display text-xs font-semibold tracking-wider font-bold tracking-widest uppercase transition-all cursor-pointer"
            style={{ borderRadius: "var(--radius-btn)" }}
          >
            <span>Back to Top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>

    </div>
  );
}
