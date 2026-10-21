import React, { useState, useEffect } from "react";
import { jazzSoulContent, speakeasyContent } from "./data";
import { VenueContent } from "./types";
import LiveTemplatePreview from "./components/LiveTemplatePreview";
import { AdminPortalModal } from "./components/AdminPortalModal";

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

  // Read theme and concept from search params to allow testing multiple niches cleanly/stealthily
  const searchParams = new URLSearchParams(window.location.search);
  const selectedConcept = searchParams.get("concept") === "speakeasy" ? "speakeasy" : "jazz";
  const selectedTheme = (searchParams.get("theme") || "theme-gold-noir") as "theme-neon-velvet" | "theme-gold-noir" | "theme-emerald-dark";

  const activeContent: VenueContent = selectedConcept === "jazz" ? jazzSoulContent : speakeasyContent;

  return (
    <div className="min-h-screen bg-theme-main text-theme-body antialiased selection:bg-theme-brand selection:text-theme-main">
      <AdminPortalModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      <LiveTemplatePreview 
        activeContent={activeContent}
        activeTheme={selectedTheme}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />
    </div>
  );
}
