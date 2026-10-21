/**
 * Ghost Factory™ — Heritage & Honey OS | Header Component
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Instagram } from "lucide-react";
import { templateData } from "../data/templateData";

interface HeaderProps {
  onOpenAdmin?: () => void;
}

export default function Header({ onOpenAdmin }: HeaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine if scrolled enough to change background
      setIsScrolled(currentScrollY > 50);

      // determine visibility based on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false); // Scrolling down - hide
      } else {
        setIsVisible(true); // Scrolling up - show
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <header
      id="main-header"
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 border-b ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      } ${
        isScrolled ? "bg-bg/95 border-border backdrop-blur-md py-4 shadow-xl" : "bg-transparent border-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex flex-col">
          <span className="editorial-subheader !text-brand-gold/40 mb-2">
            {templateData.brand.tagline}
          </span>
          <a 
            href="#home" 
            id="logo-link"
            className="text-2xl font-serif font-bold tracking-tight text-brand-gold leading-none"
          >
            {templateData.brand.name}
          </a>
        </div>

        {/* Desktop Navigation */}
        <nav id="desktop-nav" className="hidden md:flex items-center space-x-12">
          {templateData.navigation.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="group relative text-xs font-semibold uppercase tracking-[0.2em] font-medium text-text hover:text-brand-gold transition-colors duration-300"
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-brand-gold transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
          <a
            href="#reservations"
            className="px-6 py-2 border border-brand-gold text-brand-gold text-xs font-semibold tracking-wider uppercase tracking-[0.2em] font-semibold hover:bg-brand-gold hover:text-bg transition-all duration-500"
          >
            Book a Table
          </a>
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="px-3 py-1.5 border border-brand-gold/40 text-brand-gold/60 text-[9px] uppercase tracking-[0.2em] font-mono hover:border-brand-gold hover:text-brand-gold transition-all duration-300 cursor-pointer"
            >
              [ ADMIN ]
            </button>
          )}
        </nav>

        {/* Mobile Toggle Group */}
        <div className="flex items-center space-x-6 md:hidden">
          <button
            id="mobile-menu-toggle"
            aria-label="Toggle menu"
            className="text-brand-gold"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-full left-0 w-full bg-bg/98 backdrop-blur-xl border-t border-border shadow-2xl md:hidden origin-top"
          >
            <div className="flex flex-col p-10 space-y-8">
              {templateData.navigation.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.1, duration: 0.5 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-3xl font-serif text-text hover:text-brand-gold transition-colors"
                >
                  {item.label}
                </motion.a>
              ))}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="pt-8 border-t border-border/50 flex flex-col space-y-4"
              >
                <div className="flex items-center space-x-4 text-brand-gold">
                  <Instagram size={20} />
                  <span className="text-xs uppercase tracking-[0.3em] font-bold">{templateData.social.instagram}</span>
                </div>
                <p className="text-xs font-semibold tracking-wider uppercase tracking-[0.2em] text-brand-gold/40">© {new Date().getFullYear()} {templateData.brand.name}</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
