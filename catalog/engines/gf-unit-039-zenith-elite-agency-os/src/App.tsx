/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Hero } from "./components/Hero";
import { BentoGrid } from "./components/BentoGrid";
import { LogoMarquee } from "./components/LogoMarquee";
import { Footer } from "./components/Footer";
import { DesignersNote } from "./components/DesignersNote";
import { ZenSpacer } from "./components/ZenSpacer";
import { AdminPortalModal } from "./components/AdminPortalModal";
import { useState, useEffect } from "react";

export default function App() {
  const [showNote, setShowNote] = useState(false);
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
    <main className="min-h-screen relative bg-base">
      <AdminPortalModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      <div className="grain z-50 overflow-hidden" />
      
      {/* Ambient Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10">
        <Hero onOpenAdmin={() => setIsAdminOpen(true)} />
        <LogoMarquee />
        <BentoGrid />
        <ZenSpacer />
        <DesignersNote isOpen={showNote} setIsOpen={setShowNote} />
        <Footer />
      </div>
    </main>
  );
}

