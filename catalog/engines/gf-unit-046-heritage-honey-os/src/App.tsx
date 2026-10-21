/**
 * Ghost Factory™ — Heritage & Honey OS v1.0.0 | Hospitality Vault
 */

import { useState, useEffect } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Features from "./components/Features";
import About from "./components/About";
import Menu from "./components/Menu";
import Reservation from "./components/Reservation";
import Gallery from "./components/Gallery";
import Journal from "./components/Journal";
import Testimonials from "./components/Testimonials";
import Footer from "./components/Footer";
import BackToTop from "./components/BackToTop";
import AdminPortalModal from "./components/AdminPortalModal";

import { ThemeProvider } from "./context/ThemeContext";

export default function App() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  useEffect(() => {
    if (window.location.pathname === '/admin') setIsAdminOpen(true);
  }, []);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-bg selection:bg-brand-gold selection:text-brand-charcoal">
        <Header onOpenAdmin={() => setIsAdminOpen(true)} />
        <main id="main-content" className="relative isolate">
          <Hero />
          <Features />
          <About />
          <Testimonials />
          <Menu />
          <Reservation />
          <Gallery />
          <Journal />
          <Footer />
        </main>
        <BackToTop />
        <AdminPortalModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      </div>
    </ThemeProvider>
  );
}
