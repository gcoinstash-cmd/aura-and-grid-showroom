/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Flame,
  LayoutGrid,
  Leaf,
  Settings2,
  Download,
  Sparkles,
  Globe,
  Calendar,
  MapPin,
  Menu,
  Clock,
  ArrowRight,
  Star,
  Check,
  DollarSign,
  HelpCircle,
  Sliders,
  ChevronRight,
  Monitor,
  CheckSquare,
  CheckCircle2,
  FileText,
  Mail,
  Instagram,
  Compass
} from 'lucide-react';
import { BRAND_ANGLES, THEMES, MENU_ITEMS, LAB_METRICS, REVIEWS } from './data';
import { BrandAngleId, ThemeId, MenuItem, BrandAngleConfig } from './types';
import RadarChart from './components/RadarChart';
import IntakeForm from './components/IntakeForm';
import CheckoutModal from './components/CheckoutModal';
import CustomBuildModal from './components/CustomBuildModal';
import TemplateReadme from './components/TemplateReadme';
import { SafeImage } from './components/SafeImage';
import { ScrollReveal } from './components/ScrollReveal';
import { QRMenuBlock } from './components/QRMenuBlock';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Storefront Customizer State
  const [selectedAngleId, setSelectedAngleId] = useState<BrandAngleId>('burger-lab');
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeId>('light');
  const [showDocs, setShowDocs] = useState<boolean>(false);
  const [isPresetOpen, setIsPresetOpen] = useState<boolean>(false);
  const [activeMenuCategory, setActiveMenuCategory] = useState<'burgers' | 'sides' | 'shakes' | 'late-night'>('burgers');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  
  // Checkout Modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCustomBuildOpen, setIsCustomBuildOpen] = useState(false);
  const [checkoutPrice, setCheckoutPrice] = useState(129); // Standard Gumroad Price
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  // Selected config models
  const currentBrandAngle = useMemo(() => {
    return BRAND_ANGLES.find(angle => angle.id === selectedAngleId) || BRAND_ANGLES[0];
  }, [selectedAngleId]);

  const currentTheme = useMemo(() => {
    return THEMES.find(t => t.id === selectedThemeId) || THEMES[0];
  }, [selectedThemeId]);

  // Selected burger detail modal / active inspection sheet
  const [inspectedBurgerId, setInspectedBurgerId] = useState<string | null>('bl-01');
  const inspectedBurger = useMemo(() => {
    return MENU_ITEMS.find(item => item.id === inspectedBurgerId) || MENU_ITEMS[0];
  }, [inspectedBurgerId]);

  // Filtered menu items for category preview
  const filteredMenuItems = useMemo(() => {
    return MENU_ITEMS.filter(item => item.category === activeMenuCategory);
  }, [activeMenuCategory]);

  // Custom accent color derived dynamically
  const accentColor = currentBrandAngle.accentHex;

  // Let's configure custom template variables based on brand angle
  const layoutClass = currentBrandAngle.primaryFont;

  // Handle launch pricing simulator toggle
  const [isLaunchPriceSimulated, setIsLaunchPriceSimulated] = useState(true);
  const activeTemplatePrice = isLaunchPriceSimulated ? 99 : 129;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-all duration-300 ${currentTheme.bgColor} ${currentTheme.textColor}`} id="app-root">
      
      {/* 1. GLOBAL STOREFRONT CONTROLLER & HUD BAR */}
      <section className="sticky top-0 z-40 bg-zinc-950 text-white border-b border-zinc-900" id="storefront-hub">
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-center font-mono text-[10px] tracking-wider opacity-95">
          <span className="text-zinc-300 font-sans font-medium">Burger Lab Template</span>
        </div>
      </section>

      {/* 2. DEVELOPER EXPLORER PANEL SIDEBAR (If toggled open) */}
      {showDocs && (
        <section className="bg-zinc-900 border-b border-zinc-800 p-4 shrink-0 shadow-inner" id="dev-explorer-drawer">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3.5 text-xs text-zinc-300">
              <h3 className="font-mono text-[#E1FF01] uppercase tracking-widest text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Template Asset Package
              </h3>
              <p className="font-sans leading-relaxed">
                Gumroad deliverable comprises a clean, standards-compliant single page web app written in React 19, TypeScript, and TailwindCSS v4.0. Hand-coded for instant brand swaps.
              </p>
              <div className="space-y-1.5 font-mono text-[11px] text-zinc-400">
                <div className="flex gap-2">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Curated CSS Class architecture</span>
                </div>
                <div className="flex gap-2">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>4 curated style systems preset out-of-the-box</span>
                </div>
                <div className="flex gap-2">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Configured radar stats charts & intakes</span>
                </div>
                <div className="flex gap-2">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fully mobile responsive block grids</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <TemplateReadme currentTheme={currentTheme} accentColor={accentColor} />
            </div>

          </div>
        </section>
      )}

      {/* 3. CURATED PREMIUM WEB TEMPLATE CANVAS CLIENT VIEW */}
      <main className={`flex-1 transition-colors duration-300 ${layoutClass}`} id="premium-template-canvas">
        
        {/* Custom style bindings for accent coloring */}
        <div style={{ '--brand-accent': accentColor } as React.CSSProperties}>

          {/* A. NAV HEADER FOR THE TEMPLATE */}
          <nav className={`border-b ${currentTheme.borderColor} py-4 transition-colors duration-300 relative`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
              
              {/* Brand Lettermark Logo */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 border flex items-center justify-center font-bold tracking-tighter rounded-full text-xs shrink-0"
                  style={{ borderColor: accentColor }}
                >
                  <span>
                    {selectedAngleId === 'burger-lab' && 'BL'}
                    {selectedAngleId === 'smash-theory' && 'ST'}
                    {selectedAngleId === 'field-notes' && 'FN'}
                    {selectedAngleId === 'char-grid' && 'CG'}
                  </span>
                </div>
                <span className="font-semibold text-sm uppercase tracking-tight font-grotesk truncate pr-1">
                  {currentBrandAngle.name}
                </span>
              </div>

              {/* Desktop links inside the template */}
              <div className="hidden md:flex items-center gap-6 sm:gap-8 text-xs font-mono uppercase tracking-wider">
                <a href="#signature-builds" className="hover:opacity-100 opacity-60 transition-opacity">Menu</a>
                <a href="#brand-manifesto" className="hover:opacity-100 opacity-60 transition-opacity">About</a>
                <a href="#testimonials-strip" className="hover:opacity-100 opacity-60 transition-opacity">Reviews</a>
                <a href="#lab-booking" className="hover:opacity-100 transition-opacity font-bold" style={{ color: accentColor }}>Inquire</a>
              </div>

              {/* Mobile Hamburger Toggle */}
              <div className="md:hidden flex items-center">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-1.5 hover:bg-neutral-500/10 rounded transition-colors focus:outline-none"
                  aria-label="Toggle navigation menu"
                  id="mobile-menu-toggle"
                >
                  {isMobileMenuOpen ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round" />
                      <line x1="6" y1="6" x2="18" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <line x1="4" y1="6" x2="20" strokeWidth="2" strokeLinecap="round" />
                      <line x1="4" y1="12" x2="20" strokeWidth="2" strokeLinecap="round" />
                      <line x1="4" y1="18" x2="20" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              </div>

            </div>

            {/* Mobile Dropdown Menu Drawer */}
            {isMobileMenuOpen && (
              <div className={`md:hidden absolute top-full left-0 right-0 border-b ${currentTheme.borderColor} ${currentTheme.bgColor} z-30 py-4 px-6 flex flex-col gap-4 shadow-xl transition-colors duration-200`}>
                <a
                  href="#signature-builds"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1.5 hover:opacity-100 opacity-70 text-xs font-mono uppercase tracking-widest border-b border-zinc-500/10"
                >
                  Menu
                </a>
                <a
                  href="#brand-manifesto"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1.5 hover:opacity-100 opacity-70 text-xs font-mono uppercase tracking-widest border-b border-zinc-500/10"
                >
                  About
                </a>
                <a
                  href="#testimonials-strip"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1.5 hover:opacity-100 opacity-70 text-xs font-mono uppercase tracking-widest border-b border-zinc-500/10"
                >
                  Reviews
                </a>
                <a
                  href="#lab-booking"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1.5 hover:opacity-100 text-xs font-mono uppercase tracking-widest font-bold"
                  style={{ color: accentColor }}
                >
                  Inquire
                </a>
              </div>
            )}
          </nav>

          {/* B. HERO SECTION */}
          <header className={`border-b ${currentTheme.borderColor} ${currentTheme.gridLineColor} py-12 md:py-20 lg:py-24 relative overflow-hidden`}>
            
            {/* Ambient Background Grid coordinates (Subtle design craft focus) */}
            <div className="absolute inset-x-0 top-0 h-full w-full grid grid-cols-4 md:grid-cols-6 divide-x opacity-25 pointer-events-none" style={{ borderColor: currentTheme.gridLineColor.split(' ')[1] }}>
              <div></div><div></div><div></div><div></div><div></div><div></div>
            </div>

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 relative z-10">
              
              {/* Left Column statement */}
              <div className="lg:col-span-7 xl:col-span-6 flex flex-col justify-center space-y-6 md:space-y-8">
                
                {/* Supporting Eyebrow */}
                <ScrollReveal delay={100} duration={800} distance="20px">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest opacity-60 block">
                      Modern Burger Brand Template
                    </span>
                  </div>
                </ScrollReveal>

                {/* Main Hero Header */}
                <ScrollReveal delay={200} duration={800} distance="24px">
                  <div className="space-y-4">
                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-grotesk tracking-tight font-black leading-none uppercase max-w-2xl">
                      {currentBrandAngle.name}
                    </h1>
                    <p className="block italic font-light text-lg sm:text-xl md:text-2xl opacity-75 tracking-normal leading-tight font-sans text-neutral-400" style={{ fontFamily: selectedAngleId === 'field-notes' ? 'Fraunces, serif' : undefined }}>
                      {selectedAngleId === 'burger-lab' ? 'Precision-built burgers. Curated flavors. Design in every bite.' : currentBrandAngle.slogan}
                    </p>
                    <p className={`text-sm md:text-base leading-relaxed max-w-xl pt-1 ${currentTheme.textColorMuted}`}>
                      {selectedAngleId === 'burger-lab' ? (
                        "A clean, editorial website template for modern burger and culinary brands. Perfect for showcasing a refined craft menu with elegant typography and a distinctive minimalist layout."
                      ) : (
                        `${currentBrandAngle.description} Designed to present your craft menu beautifully, build local reputation, and provide an elegant, friction-free experience for your guests.`
                      )}
                    </p>
                  </div>
                </ScrollReveal>

                {/* Hero CTAs */}
                <ScrollReveal delay={300} duration={800} distance="24px">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                    <a
                      href="#signature-builds"
                      className="px-6 py-3.5 text-xs font-mono font-bold uppercase tracking-wider text-center transition-all duration-200 border cursor-pointer hover:opacity-90"
                      style={{ backgroundColor: accentColor, color: '#000000', borderColor: accentColor }}
                    >
                      Explore Signature Builds 👇
                    </a>
                    <button
                      onClick={() => setIsCustomBuildOpen(true)}
                      className={`px-6 py-3.5 text-xs font-mono uppercase tracking-wider text-center border cursor-pointer transition-colors duration-200 hover:bg-neutral-500/10 ${currentTheme.borderColor} focus:outline-none`}
                    >
                      Configure Custom Build
                    </button>
                  </div>
                </ScrollReveal>

                {/* Secondary highlight specs strip matching current angle */}
                <ScrollReveal delay={400} duration={800} distance="24px">
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t" style={{ borderColor: `${accentColor}30` }}>
                    {currentBrandAngle.labSpecs.map((spec, i) => (
                      <div key={i} className="space-y-1">
                        <span className="block text-[10px] font-mono uppercase tracking-wider opacity-60">
                          {spec.label}
                        </span>
                        <span className="block font-sans text-base font-black tracking-tight" style={{ color: selectedThemeId === 'light' ? undefined : accentColor }}>
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollReveal>

              </div>

              {/* Right Column: Beautiful hero burger design graphic */}
              <div className="lg:col-span-5 xl:col-span-6 flex flex-col xl:flex-row items-center justify-center gap-6 xl:gap-8 relative">
                
                {/* Subtle dark atmospheric layer & editorial background texture */}
                <div 
                  className="absolute -inset-12 bg-radial pointer-events-none opacity-40 mix-blend-screen"
                  style={{
                    background: currentTheme.id === 'light' 
                      ? 'radial-gradient(circle, rgba(245,245,245,0.85) 0%, rgba(255,255,255,0) 70%)'
                      : `radial-gradient(circle, ${accentColor}12 0%, rgba(0,0,0,0) 70%)`
                  }}
                />

                <ScrollReveal delay={300} duration={1000} distance="40px" className="w-full flex justify-center xl:w-auto shrink-0">
                  <div className="relative flex items-center justify-center">
                    {/* Tech Blueprint circles in background of burger */}
                    <div className="absolute w-72 sm:w-80 h-72 sm:h-80 rounded-full border border-dashed opacity-20 animate-spin-slow pointer-events-none" style={{ borderColor: accentColor }} />
                    
                    <div className={`relative p-4 border rounded-none ${currentTheme.cardBg} ${currentTheme.borderColor} shadow-2xl overflow-hidden group max-w-[280px] sm:max-w-[320px] shrink-0`}>
                      <SafeImage
                        src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&h=600&q=80"
                        alt="Core Premium Smashburger"
                        className="w-full aspect-square object-cover filter brightness-95 contrast-105"
                        referrerPolicy="no-referrer"
                        accentColor={accentColor}
                      />
                      
                      {/* Floating badge */}
                      <div className="absolute bottom-6 right-6 bg-black text-white px-3 py-1 font-mono text-[9px] border border-neutral-700 tracking-widest flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-[#E1FF01] rounded-full"></span>
                        <span>MODEL NO. BL-01</span>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Beautifully Framed Minimalist Culinary Layout Placeholder Block */}
                <ScrollReveal delay={450} duration={1000} distance="40px" className="w-full max-w-sm flex">
                  <div className={`border ${currentTheme.borderColor} ${currentTheme.cardBg} p-5 md:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between h-auto w-full min-h-[290px]`}>
                    
                    {/* Technical Crosshair accents in corners for deep blueprint/lab design craft */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l opacity-30" style={{ borderColor: accentColor }} />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t border-r opacity-30" style={{ borderColor: accentColor }} />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l opacity-30" style={{ borderColor: accentColor }} />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r opacity-30" style={{ borderColor: accentColor }} />

                    {/* Header */}
                    <div className="space-y-1 pb-4 border-b border-neutral-300/10">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-mono tracking-widest opacity-60 uppercase">MASS METRICS // SPEC_01</span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-sm bg-neutral-500/10 text-neutral-400">PASSED</span>
                      </div>
                      <h4 className="font-grotesk tracking-tight text-lg font-black uppercase text-current leading-tight font-sans">
                        CRAFT MECHANICS
                      </h4>
                    </div>

                    {/* Body specs list with stylized bars */}
                    <div className="py-4 space-y-3.5 font-mono text-[10px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="opacity-50">01 / HEAT CONDUCTOR</span>
                          <span className="font-bold text-neutral-100" style={{ color: currentTheme.id === 'light' ? undefined : accentColor }}>Cast Iron Sear [450°F]</span>
                        </div>
                        <div className="h-[2px] bg-neutral-300/10 w-full overflow-hidden">
                          <div className="h-full bg-current opacity-80" style={{ width: '85%', backgroundColor: accentColor }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="opacity-50">02 / BEEF COMPOSITION</span>
                          <span className="font-bold text-neutral-100" style={{ color: currentTheme.id === 'light' ? undefined : accentColor }}>80-20 Premium Chuck</span>
                        </div>
                        <div className="h-[2px] bg-neutral-300/10 w-full overflow-hidden">
                          <div className="h-full bg-current opacity-80" style={{ width: '80%', backgroundColor: accentColor }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="opacity-50">03 / BUN RIGIDITY</span>
                          <span className="font-bold text-neutral-100" style={{ color: currentTheme.id === 'light' ? undefined : accentColor }}>Brioche Symmetry 1:1</span>
                        </div>
                        <div className="h-[2px] bg-neutral-300/10 w-full overflow-hidden">
                          <div className="h-full bg-current opacity-80" style={{ width: '92%', backgroundColor: accentColor }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="opacity-50">04 / MOISTURE INDEX</span>
                          <span className="font-bold text-neutral-100" style={{ color: currentTheme.id === 'light' ? undefined : accentColor }}>Beef Tallow Infusion</span>
                        </div>
                        <div className="h-[2px] bg-neutral-300/10 w-full overflow-hidden">
                          <div className="h-full bg-current opacity-80" style={{ width: '74%', backgroundColor: accentColor }} />
                        </div>
                      </div>
                    </div>

                    {/* Footer status coordinates block */}
                    <div className="pt-3 border-t border-neutral-300/10 flex justify-between items-center text-[8px] font-mono opacity-50">
                      <span>SYS: ACTIVE_BURGER_MATRIX</span>
                      <span>COORD: 37.7749° N, 122.4194° W</span>
                    </div>

                  </div>
                </ScrollReveal>
              </div>

            </div>
          </header>

          {/* C. BRAND MANIFESTO SECTION */}
          <section className={`border-b ${currentTheme.borderColor} ${currentTheme.gridLineColor} py-16 md:py-20`} id="brand-manifesto">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
              
              <ScrollReveal delay={100} duration={800} distance="24px" className="space-y-4 w-full">
                <div className="space-y-4">
                  <span className="text-xs font-mono uppercase tracking-widest opacity-60 block">02/ Core kitchen philosophy</span>
                  <h3 className="text-3xl sm:text-4xl font-grotesk tracking-tight font-black uppercase leading-tight">
                    {currentBrandAngle.philosophyTitle}
                  </h3>
                  <div className="h-1 w-20" style={{ backgroundColor: accentColor }}></div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={205} duration={800} distance="24px" className="space-y-6 text-sm leading-relaxed text-gray-400 w-full">
                <div className="space-y-6 text-sm leading-relaxed text-gray-400">
                  <p className={`${currentTheme.textColor}`}>
                    {currentBrandAngle.philosophyText} We replace standard fast-food guessing with precise, artisanal execution. Each premium beef cut is ground fresh in-house daily, seasoned with flaky sea salt, and seared to order on a raw cast iron hearth.
                  </p>
                  <p className={`${currentTheme.textColorMuted}`}>
                    This template gives modern food brands a clearer, more premium visual position. It leaves behind cartoon flames and diner clichés in favor of thoughtful design, premium sourcing, and a more refined guest experience.
                  </p>

                  {/* Sourcing credentials checkboxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-mono text-current">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                      <span>Single-Origin Grass-Fed Beef</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                      <span>Custom 80:20 Chuck & Rib Blend</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                      <span>Proprietary High-Melt Slices</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                      <span>Crispy, hand-pressed griddle edges</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

            </div>
          </section>

          {/* D. SIGNATURE BUILDS DISPLAY (BENTO-STYLE LAYOUT) */}
          <section className={`border-b ${currentTheme.borderColor} ${currentTheme.gridLineColor} py-16 md:py-24`} id="signature-builds">
            <div className="max-w-7xl mx-auto px-6 space-y-12">
              
              {/* Header stats line */}
              <ScrollReveal delay={100} duration={800} distance="20px">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6" style={{ borderColor: currentTheme.gridLineColor.split(' ')[1] }}>
                  <div className="space-y-2">
                    <span className="text-xs font-mono tracking-widest opacity-60 uppercase block">01 / Signature Builds</span>
                    <h3 className="text-3xl font-grotesk tracking-tight font-black uppercase">
                      Signature House Builds
                    </h3>
                  </div>
                  <p className="text-xs font-mono opacity-80 max-w-md">
                    We maintain an intentional rotation of signature recipes. Select any build below to view its precise premium ingredients, sear profiles, and chef's flavor pairing notes.
                  </p>
                </div>
              </ScrollReveal>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-2">
                
                {/* Left side: Premium selection list (7 Cols column) */}
                <ScrollReveal delay={150} duration={800} distance="32px" className="lg:col-span-7 space-y-4 w-full">
                  <div className="space-y-4">
                    {MENU_ITEMS.filter(it => it.category === 'burgers').map((burger) => {
                      const isSelected = inspectedBurgerId === burger.id;
                      return (
                        <div
                          key={burger.id}
                          onClick={() => setInspectedBurgerId(burger.id)}
                          className={`p-4 rounded-lg border transition-all duration-300 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                            isSelected
                              ? 'bg-neutral-800/10 border-current shadow-mdScale'
                              : `${currentTheme.cardBg} ${currentTheme.borderColor} hover:bg-neutral-500/5`
                          }`}
                          style={{ borderColor: isSelected ? accentColor : undefined }}
                        >
                          <div className="flex items-center gap-4">
                            <SafeImage
                              src={burger.image}
                              alt={burger.name}
                              className="w-16 h-16 rounded object-cover filter brightness-95"
                              referrerPolicy="no-referrer"
                              accentColor={accentColor}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border" style={{ borderColor: `${accentColor}40`, color: selectedThemeId === 'light' ? undefined : accentColor }}>
                                  {burger.code}
                                </span>
                                <span className="text-[10px] font-mono opacity-60">
                                  {burger.calories}
                                </span>
                              </div>
                              <h4 className="text-sm font-sans font-bold uppercase mt-1">
                                {burger.name}
                              </h4>
                              <p className="text-xs opacity-75 max-w-sm mt-0.5 line-clamp-1">
                                {burger.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                            <span className="text-xs font-mono opacity-60 sm:hidden">Price:</span>
                            <span className="text-lg font-bold font-grotesk" style={{ color: selectedThemeId === 'light' ? undefined : accentColor }}>
                              {burger.price}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollReveal>

                {/* Right side: Specialized Technical Lab Readout Sheet (5 Cols) */}
                <ScrollReveal delay={250} duration={800} distance="32px" className="lg:col-span-5 w-full">
                  <div className="h-full" id="rd-readout-sheet-container">
                    <div className={`p-6 border rounded-lg h-full flex flex-col justify-between ${currentTheme.cardBg} ${currentTheme.borderColor}`}>
                      
                      <div className="space-y-4">
                        {/* Active header block */}
                        <div className="flex justify-between items-start border-b pb-3" style={{ borderColor: currentTheme.gridLineColor.split(' ')[1] }}>
                          <div>
                            <span className="text-[9px] font-mono tracking-widest uppercase opacity-75">
                              Chef's Build Notes
                            </span>
                            <h4 className="text-base font-sans font-black uppercase mt-0.5 leading-none" style={{ color: selectedThemeId === 'light' ? undefined : accentColor }}>
                              {inspectedBurger.name}
                            </h4>
                          </div>
                          <span className="text-xs font-mono font-bold border border-emerald-500/30 text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                            {inspectedBurger.code}
                          </span>
                        </div>

                        {/* Technical Composition specs summary */}
                        <div className="space-y-2">
                          <span className="block text-[10px] font-mono uppercase tracking-widest opacity-60">
                            Key Ingredient Composition
                          </span>
                          <div className="space-y-2.5 text-xs">
                            {inspectedBurger.composition.map((comp, idx) => (
                              <div key={idx} className="flex justify-between items-baseline border-b pb-1 border-dashed border-neutral-300/10">
                                <span className="opacity-75 font-mono text-[10px]">{comp.label}</span>
                                <span className="font-sans font-bold">{comp.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Radar Interactive Graph */}
                        <div className="pt-2">
                          <span className="block text-[10px] font-mono uppercase tracking-widest text-center opacity-60 mb-2">
                            Flavor Profile
                          </span>
                          <RadarChart
                            maillardScore={inspectedBurger.maillardScore || 9.0}
                            fatRatio={'80/20'}
                            hydrationIndex={inspectedBurger.hydrationIndex || '65%'}
                            accentColor={accentColor}
                            textColor={currentTheme.textColor}
                          />
                        </div>

                      </div>

                      {/* Operational CTA within template */}
                      <div className="pt-4 border-t border-neutral-300/10 mt-4 flex items-center justify-between">
                        <div className="text-xs font-mono">
                          <span className="block opacity-60 text-[9px] uppercase">Menu Price</span>
                          <span className="block text-base font-bold">{inspectedBurger.price}</span>
                        </div>
                        <button
                          onClick={handleAddToOrder}
                          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 font-mono text-[10px] rounded text-white font-bold tracking-widest flex items-center justify-center gap-1.5 cursor-pointer min-w-[115px] h-8 relative overflow-hidden transition-all duration-300"
                        >
                          <AnimatePresence mode="wait">
                            {!isAdded ? (
                              <motion.span
                                key="add"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.15 }}
                                className="flex items-center gap-1"
                              >
                                Add to Order
                                <ArrowRight className="w-3.5 h-3.5" style={{ color: accentColor }} />
                              </motion.span>
                            ) : (
                              <motion.span
                                key="added"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.15 }}
                                className="flex items-center gap-1 text-emerald-400 font-bold"
                              >
                                Added ✓
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </button>
                      </div>

                    </div>
                  </div>
                </ScrollReveal>

              </div>

            </div>
          </section>

          {/* E. INTERACTIVE MENU BOARD VIEW */}
          <section className={`border-b ${currentTheme.borderColor} ${currentTheme.gridLineColor} py-16 md:py-20`} id="menu-preview">
            <div className="max-w-7xl mx-auto px-6 space-y-10">
              
              {/* Category selector strip */}
              <ScrollReveal delay={100} duration={800} distance="20px">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-6" style={{ borderColor: currentTheme.gridLineColor.split(' ')[1] }}>
                  <div>
                    <span className="text-xs font-mono tracking-widest opacity-60 uppercase block">03 / Seasonal Selections</span>
                    <h3 className="text-3xl font-grotesk tracking-tight font-black uppercase">
                      Our Curated Menu
                    </h3>
                  </div>

                  {/* Sub-selectors */}
                  <div className="flex flex-wrap gap-2" id="menu-category-selectors">
                    {(['burgers', 'sides', 'shakes', 'late-night'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveMenuCategory(cat)}
                        className={`px-4 py-2 font-mono text-[10px] uppercase tracking-wider rounded border transition-all cursor-pointer ${
                          activeMenuCategory === cat
                            ? 'bg-current font-black'
                            : `hover:bg-neutral-500/5 ${currentTheme.borderColor}`
                        }`}
                        style={{
                          backgroundColor: activeMenuCategory === cat ? accentColor : 'transparent',
                          color: activeMenuCategory === cat ? '#000000' : 'inherit',
                          borderColor: activeMenuCategory === cat ? accentColor : undefined
                        }}
                      >
                        {cat.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              {/* Items grid */}
              <ScrollReveal delay={150} duration={800} distance="32px">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="menu-items-grid">
                {filteredMenuItems.map((item) => (
                  <div
                    key={item.id}
                    className={`border rounded-lg overflow-hidden flex flex-col justify-between group hover:shadow-xl transition-all duration-300 ${currentTheme.cardBg} ${currentTheme.borderColor}`}
                  >
                    
                    <div>
                      {/* Technical Image and Code */}
                      <div className="relative aspect-video overflow-hidden bg-black/10">
                        <SafeImage
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95"
                          referrerPolicy="no-referrer"
                          accentColor={accentColor}
                        />
                        <span className="absolute top-3 left-3 bg-black/80 font-mono text-[9px] font-bold text-white px-2 py-0.5 border border-neutral-700/50 backdrop-blur-xs tracking-wider">
                          CODE: {item.code}
                        </span>
                        <span className="absolute bottom-3 right-3 bg-black/80 font-mono text-[9px] text-zinc-300 px-2 py-0.5 border border-neutral-700/50 backdrop-blur-xs">
                          {item.calories}
                        </span>
                      </div>

                      {/* Info body */}
                      <div className="p-5 space-y-3">
                        <div className="flex justify-between items-baseline">
                          <h4 className="text-sm font-sans font-bold uppercase tracking-tight line-clamp-1">
                            {item.name}
                          </h4>
                          <span className="text-base font-bold font-grotesk shrink-0" style={{ color: selectedThemeId === 'light' ? undefined : accentColor }}>
                            {item.price}
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed line-clamp-2 ${currentTheme.textColorMuted}`}>
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Technical stats pill tags */}
                    <div className="px-5 pb-5 pt-1.5 border-t border-neutral-300/5 flex flex-wrap gap-1.5">
                      {item.composition.slice(0, 2).map((comp, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-black/20 text-[9px] font-mono opacity-80 border"
                          style={{ borderColor: `${accentColor}25` }}
                        >
                          {comp.label}: <strong>{comp.value}</strong>
                        </span>
                      ))}
                    </div>

                  </div>
                ))}
              </div>
              </ScrollReveal>

            </div>
          </section>

          {/* F. TEST KITCHEN METRICS PROOF STRIP */}
          <section className={`border-b ${currentTheme.borderColor} ${currentTheme.gridLineColor} py-12 bg-black/5`}>
            <ScrollReveal delay={100} duration={800} distance="16px">
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <span className="block text-xs font-mono opacity-60 uppercase mb-1">{LAB_METRICS.pattiesSmashed.label}</span>
                <span className="block text-2xl sm:text-3xl font-grotesk font-black" style={{ color: selectedThemeId === 'light' ? undefined : accentColor }}>
                  {LAB_METRICS.pattiesSmashed.value}
                </span>
              </div>
              <div>
                <span className="block text-xs font-mono opacity-60 uppercase mb-1">{LAB_METRICS.maillardIndex.label}</span>
                <span className="block text-2xl sm:text-3xl font-grotesk font-black" style={{ color: selectedThemeId === 'light' ? undefined : accentColor }}>
                  {LAB_METRICS.maillardIndex.value}
                </span>
              </div>
              <div>
                <span className="block text-xs font-mono opacity-60 uppercase mb-1">{LAB_METRICS.fatEmulsion.label}</span>
                <span className="block text-2xl sm:text-3xl font-grotesk font-black" style={{ color: selectedThemeId === 'light' ? undefined : accentColor }}>
                  {LAB_METRICS.fatEmulsion.value}
                </span>
              </div>
              <div>
                <span className="block text-xs font-mono opacity-60 uppercase mb-1">{LAB_METRICS.supplierDirect.label}</span>
                <span className="block text-2xl sm:text-3xl font-grotesk font-black" style={{ color: selectedThemeId === 'light' ? undefined : accentColor }}>
                  {LAB_METRICS.supplierDirect.value}
                </span>
              </div>
            </div>
            </ScrollReveal>
          </section>

          {/* G. REVIEWS & PROOF BLOCK */}
          <section className={`border-b ${currentTheme.borderColor} ${currentTheme.gridLineColor} py-16 md:py-20`} id="testimonials-strip">
            <div className="max-w-7xl mx-auto px-6 space-y-10">
              
              <ScrollReveal delay={100} duration={800} distance="20px">
                <div className="text-center space-y-2 max-w-xl mx-auto">
                  <span className="text-xs font-mono tracking-widest opacity-60 uppercase block">Diner & critic consensus</span>
                  <h3 className="text-3xl font-grotesk tracking-tight font-black uppercase">
                    Guestbook & Reviews
                  </h3>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={150} duration={800} distance="32px">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="reviews-grid">
                {REVIEWS.map((review) => (
                  <div
                    key={review.id}
                    className={`p-6 border rounded-lg flex flex-col justify-between ${currentTheme.cardBg} ${currentTheme.borderColor}`}
                  >
                    <div className="space-y-4">
                      {/* Stars */}
                      <div className="flex gap-1">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                        ))}
                      </div>
                      <p className={`text-xs leading-relaxed italic ${currentTheme.textColorMuted}`}>
                        "{review.text}"
                      </p>
                    </div>

                    <div className="pt-4 border-t border-neutral-300/10 mt-4 flex justify-between items-center text-[10px] font-mono">
                      <div className="flex items-center gap-3">
                        {/* Minimalist circular avatar wrapper */}
                        <div className={`relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border shrink-0 ${currentTheme.id === 'light' ? 'border-neutral-900/10 bg-neutral-100' : 'border-neutral-800 bg-neutral-900'}`}>
                          {review.avatarUrl ? (
                            <img 
                              src={review.avatarUrl} 
                              alt={review.author} 
                              className="w-full h-full object-cover filter grayscale contrast-[115%] brightness-[90%]"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-[9px] font-bold text-neutral-500 tracking-tight">
                              {review.initials}
                            </span>
                          )}
                          <div className="absolute inset-0 border border-black/5 dark:border-white/5 rounded-full pointer-events-none" />
                        </div>
                        <div>
                          <span className="block font-bold">{review.author}</span>
                          <span className="block opacity-60 leading-tight">{review.role}</span>
                        </div>
                      </div>
                      <span className="opacity-40 shrink-0">{review.date}</span>
                    </div>
                  </div>
                ))}
              </div>
              </ScrollReveal>

            </div>
          </section>

          {/* H. INTENSE HIGH-TICKET CONSULTATION BOOKING INTAKE CONTAINER */}
          <ScrollReveal delay={100} duration={800} distance="32px">
            <section className={`border-b ${currentTheme.borderColor} ${currentTheme.gridLineColor} py-16 md:py-24 relative`} id="lab-booking">
              <div className="max-w-3xl mx-auto px-6 space-y-10">
                
                <div className="text-center space-y-3 max-w-lg mx-auto">
                  <span className="text-xs font-mono tracking-widest opacity-60 uppercase block">04 / Custom Design & Development</span>
                  <h3 className="text-3xl sm:text-4xl font-grotesk tracking-tight font-black uppercase leading-tight">
                    Bespoke Design Commissions
                  </h3>
                  <p className={`text-xs md:text-sm ${currentTheme.textColorMuted} leading-relaxed`}>
                    Need a custom design tailored specifically to your restaurant's physical space and visual identity? Commission Aura & Grid Co. directly for premium custom development ($3,500–$6,500). Complete our inquiry form to begin:
                  </p>
                </div>

                <IntakeForm currentTheme={currentTheme} accentColor={accentColor} />

              </div>
            </section>
          </ScrollReveal>

          {/* I. TABLESIDE QR MENU INTEGRATION BLOCK */}
          <ScrollReveal delay={100} duration={800} distance="32px">
            <QRMenuBlock
              currentTheme={currentTheme}
              accentColor={accentColor}
              currentBrandAngle={currentBrandAngle}
            />
          </ScrollReveal>

          {/* J. MASTER FOOTER */}
          <footer className={`py-12 bg-black text-zinc-400 font-mono text-xs`} id="template-footer">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 border border-zinc-700 flex items-center justify-center font-bold">
                    <span>AG</span>
                  </div>
                  <span className="font-bold uppercase tracking-wider text-white">
                    Burger Lab Template
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-500 font-sans">
                  A premium editorial-style design template for modern culinary brands, focusing on exquisite typography, clean layouts, and seamless local ordering.
                </p>
              </div>

              <div>
                <h5 className="font-bold uppercase tracking-wider text-white mb-3">BRAND PRESETS</h5>
                <ul className="space-y-1.5 text-[11px] text-zinc-500">
                  <li><a href="#" onClick={(e) => { e.preventDefault(); setSelectedAngleId('burger-lab'); }} className="hover:text-white transition-colors">BL // Burger Lab Style</a></li>
                  <li><a href="#" onClick={(e) => { e.preventDefault(); setSelectedAngleId('smash-theory'); }} className="hover:text-white transition-colors">ST // Smash Theory Style</a></li>
                  <li><a href="#" onClick={(e) => { e.preventDefault(); setSelectedAngleId('field-notes'); }} className="hover:text-white transition-colors">FN // Organic Field Notes</a></li>
                  <li><a href="#" onClick={(e) => { e.preventDefault(); setSelectedAngleId('char-grid'); }} className="hover:text-white transition-colors">CG // Char & Grid Alignment</a></li>
                </ul>
              </div>

              <div>
                <h5 className="font-bold uppercase tracking-wider text-white mb-3">LICENSE DETAILS</h5>
                <ul className="space-y-1.5 text-[11px] text-zinc-500 font-sans">
                  <li>Single Asset Purchase Agreement (APA) title transfer</li>
                  <li>Editable source files included</li>
                  <li>Designed for one brand or project</li>
                  <li>Documentation included for easy setup</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h5 className="font-bold uppercase tracking-wider text-white">CONTACT & SUPPORT</h5>
                <p className="text-[11px] leading-relaxed text-zinc-500 font-sans">
                  Have questions about configuration? Contact our direct support team for custom layouts, technical help, or bespoke options:
                </p>
                <div className="flex gap-2">
                  <a 
                    href="mailto:gcoinstash@gmail.com" 
                    className="p-2 border border-zinc-800 hover:border-zinc-700 rounded text-zinc-300 flex items-center justify-center transition-colors hover:bg-zinc-900/50 hover:text-white"
                    title="Send Email Support Inquiry"
                    aria-label="Email support: gcoinstash@gmail.com"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                  <a 
                    href="https://instagram.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 border border-zinc-800 hover:border-zinc-700 rounded text-zinc-300 flex items-center justify-center transition-colors hover:bg-zinc-900/50 hover:text-white"
                    title="Follow on Instagram"
                    aria-label="Visit Instagram Profile"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a 
                    href="https://google.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 border border-zinc-800 hover:border-zinc-700 rounded text-zinc-300 flex items-center justify-center transition-colors hover:bg-zinc-900/50 hover:text-white"
                    title="Explore Developer Showcase"
                    aria-label="Browse Creator Website"
                  >
                    <Compass className="w-4 h-4" />
                  </a>
                </div>
              </div>

            </div>

            <div className="max-w-7xl mx-auto px-6 border-t border-zinc-800 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between text-[11px] text-zinc-600 gap-4">
              {/* 
                ==================================================================
                BRAND & CREATIVE CREDIT (EDITABLE FOR BUYERS)
                Locate and replace the text below to customize your storefront's
                signature or design attribute.
                ==================================================================
              */}
              <div id="storefront-brand-[brand-credit]" className="hover:text-zinc-400 transition-colors duration-200">
                Designed by Aura & Grid Co. © 2026.
              </div>
              <span>
                Premium Commercial Web Template • Single-Brand License
              </span>
            </div>
          </footer>

        </div>

      </main>

            {/* 4. FLOATING DEV PRESET CONTROL DOCK (Ultra-Premium, Floating, Quiet) */}
      {/* Invisible backdrop to dismiss when clicked away */}
      {isPresetOpen && (
        <div 
          className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsPresetOpen(false)}
        />
      )}

      {/* Launcher Button on Bottom-Right */}
      <button
        onClick={() => setIsPresetOpen(!isPresetOpen)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-zinc-950 text-white border border-zinc-800 hover:border-zinc-700 shadow-2xl flex items-center justify-center transition-all duration-300 group cursor-pointer focus:outline-none"
        style={{ borderColor: isPresetOpen ? '#E1FF01' : undefined }}
        aria-label="Preset customization panel"
        id="preset-studio-trigger"
      >
        <span className="relative w-full h-full flex items-center justify-center">
          <Settings2 
            className={`w-5 h-5 transition-transform duration-500 ease-out ${
              isPresetOpen ? 'rotate-180 scale-90 opacity-0' : 'rotate-0 scale-100 opacity-100 group-hover:rotate-45 text-[#E1FF01]'
            }`} 
          />
          <span 
            className={`absolute font-sans text-sm font-light transition-all duration-500 ease-out ${
              isPresetOpen ? 'rotate-0 scale-100 opacity-100 text-[#E1FF01]' : 'rotate-180 scale-50 opacity-0'
            }`}
          >
            ✕
          </span>
        </span>
      </button>

      {/* Sliding Customize Drawer / Popover Panel */}
      <div 
        className={`fixed right-6 z-50 bg-zinc-950/98 text-white border border-zinc-800 shadow-3xl rounded-2xl p-5 w-80 max-w-[calc(100vw-3rem)] transition-all duration-300 ease-out flex flex-col gap-4 font-mono select-none ${
          isPresetOpen 
            ? 'bottom-20 opacity-100 translate-y-0 scale-100 pointer-events-auto' 
            : 'bottom-16 opacity-0 translate-y-4 scale-95 pointer-events-none'
        }`}
        style={{ borderColor: '#27272a' }}
        id="preset-studio-expanded"
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
          <div className="flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5 text-[#E1FF01]" />
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Preset Studio</span>
          </div>
          <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest font-sans">v1.2.0</span>
        </div>

        {/* Brand Presets */}
        <div className="space-y-2">
          <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">1. Brand Identity Customizer</label>
          <div className="flex flex-col gap-1.5">
            {BRAND_ANGLES.map((angle) => {
              const isSelected = selectedAngleId === angle.id;
              return (
                <button
                  key={angle.id}
                  onClick={() => {
                    setSelectedAngleId(angle.id);
                    if (angle.id === 'smash-theory') setSelectedThemeId('dark');
                    else if (angle.id === 'field-notes') setSelectedThemeId('light');
                    else if (angle.id === 'char-grid') setSelectedThemeId('steel');
                    setIsPresetOpen(false); // Minimize on selection
                  }}
                  className={`w-full text-left px-3 py-2 text-[10px] rounded-lg cursor-pointer flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-zinc-900 text-white font-bold border border-zinc-700'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {angle.id === 'burger-lab' && <Sliders className="w-3 h-3 text-[#E1FF01]" />}
                    {angle.id === 'smash-theory' && <Flame className="w-3 h-3 text-[#DC2626]" />}
                    {angle.id === 'field-notes' && <Leaf className="w-3 h-3 text-[#22C55E]" />}
                    {angle.id === 'char-grid' && <LayoutGrid className="w-3 h-3 text-[#EA580C]" />}
                    <span className="tracking-tight">{angle.name}</span>
                  </div>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E1FF01]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Themes Presets */}
        <div className="space-y-2">
          <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">2. Canvas Styling Theme</label>
          <div className="grid grid-cols-3 bg-zinc-900/60 rounded-lg p-1 border border-zinc-900">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  setSelectedThemeId(theme.id);
                  setIsPresetOpen(false); // Minimize on selection
                }}
                className={`py-1.5 text-[9px] rounded-md cursor-pointer text-center transition-all ${
                  selectedThemeId === theme.id
                    ? 'bg-zinc-800 text-[#E1FF01] font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {theme.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Docs & Setup Guide Toggle Link */}
        <div className="pt-2 border-t border-zinc-900 flex gap-2">
          <button
            onClick={() => {
              setShowDocs(!showDocs);
              setIsPresetOpen(false); // Minimize on selection
            }}
            className={`w-full py-2.5 rounded-lg font-mono text-[10px] uppercase font-bold tracking-widest text-center cursor-pointer transition-all ${
              showDocs
                ? 'bg-[#E1FF01] text-black font-extrabold'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            {showDocs ? 'Close Setup Guide' : 'Open Setup Guide'}
          </button>
        </div>
      </div>

      {/* 5. GUMROAD CHECKOUT SIMULATION MODAL */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        brandAngleName={currentBrandAngle.name}
        price={checkoutPrice}
        currentTheme={currentTheme}
        accentColor={accentColor}
      />

      {/* 6. INTERACTIVE EXPERIMENTAL CUSTOM BUILD MODAL */}
      <CustomBuildModal
        isOpen={isCustomBuildOpen}
        onClose={() => setIsCustomBuildOpen(false)}
        currentTheme={currentTheme}
        accentColor={accentColor}
      />

    </div>
  );
}
