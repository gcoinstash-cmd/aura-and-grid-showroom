/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Eye, EyeOff, Shield, ShieldCheck, Sparkles, Database, Layers, Calendar, Clipboard, FolderHeart, Laptop, Users, Lock } from "lucide-react";
import { Booking, MenuItem, DietaryRecord, EventStatus } from "./types";
import { INITIAL_MENU_ITEMS, INITIAL_BOOKINGS, INITIAL_DIETARY_RECORDS } from "./data";
import CommandCenter from "./components/CommandCenter";
import BookingManager from "./components/BookingManager";
import MenuBuilder from "./components/MenuBuilder";
import DietaryMatrix from "./components/DietaryMatrix";
import IntegrationLayer from "./components/IntegrationLayer";
import AdminPortalModal from "./components/AdminPortalModal";

export default function App() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setIsAdminOpen(true);
    }
  }, []);

  // Load initial states from localStorage or defaults
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem("maison_bookings");
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem("maison_menu_items");
    return saved ? JSON.parse(saved) : INITIAL_MENU_ITEMS;
  });

  const [dietaryRecords, setDietaryRecords] = useState<DietaryRecord[]>(() => {
    const saved = localStorage.getItem("maison_dietary_records");
    return saved ? JSON.parse(saved) : INITIAL_DIETARY_RECORDS;
  });

  const [isClientView, setIsClientView] = useState<boolean>(() => {
    const saved = localStorage.getItem("maison_client_view");
    return saved ? saved === "true" : false;
  });

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Force-open form flags for Quick Actions from CommandCenter
  const [forceNewBookingOpen, setForceNewBookingOpen] = useState(false);
  const [forceNewMenuOpen, setForceNewMenuOpen] = useState(false);
  const [forceNewDietaryOpen, setForceNewDietaryOpen] = useState(false);

  // Synchronize storage
  useEffect(() => {
    localStorage.setItem("maison_bookings", JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem("maison_menu_items", JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem("maison_dietary_records", JSON.stringify(dietaryRecords));
  }, [dietaryRecords]);

  useEffect(() => {
    localStorage.setItem("maison_client_view", String(isClientView));
  }, [isClientView]);

  // Operations handlers
  const handleAddBooking = (newB: Booking) => {
    setBookings((prev) => [newB, ...prev]);
  };

  const handleUpdateBooking = (updatedB: Booking) => {
    setBookings((prev) => prev.map((b) => (b.id === updatedB.id ? updatedB : b)));
  };

  const handleDeleteBooking = (id: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
    // Orphan records cleanup optionally, or keep relational links as is.
  };

  const handleAddMenuItem = (newItem: MenuItem) => {
    setMenuItems((prev) => [newItem, ...prev]);
  };

  const handleUpdateMenuItem = (updatedItem: MenuItem) => {
    setMenuItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
  };

  const handleDeleteMenuItem = (id: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddDietary = (newD: DietaryRecord) => {
    setDietaryRecords((prev) => [newD, ...prev]);
  };

  const handleUpdateDietary = (updatedD: DietaryRecord) => {
    setDietaryRecords((prev) => prev.map((r) => (r.id === updatedD.id ? updatedD : r)));
  };

  const handleDeleteDietary = (id: string) => {
    setDietaryRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // Quick Action Navigator
  const handleQuickAction = (type: "booking" | "menu" | "dietary") => {
    if (type === "booking") {
      setForceNewBookingOpen(true);
      setActiveTab("bookings");
    } else if (type === "menu") {
      setForceNewMenuOpen(true);
      setActiveTab("lookbook");
    } else if (type === "dietary") {
      setForceNewDietaryOpen(true);
      setActiveTab("allergens");
    }
  };

  return (
    <div className="min-h-screen bg-[#090909] text-neutral-200 selection:bg-gold-500 selection:text-neutral-900 font-sans antialiased overflow-x-hidden">
      
      {/* Outer Luxury Border Framing (Minimalist Accent) */}
      <div className="hidden xl:block fixed inset-0 border-[6px] border-[#121212] pointer-events-none z-50" />

      {/* Corporate Editorial Header */}
      <header className="border-b border-white/5 bg-[#0b0b0b] sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="text-left">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-gold-400 font-semibold block">
              Operational Workspace
            </span>
            <h1 className="text-2xl font-serif tracking-tight text-white mt-1">
              MAISON <span className="text-gold-400 italic">Culinaire</span>
            </h1>
          </div>

          {/* Luxury Presentation Override switch */}
          <div className="flex items-center gap-4 bg-[#141414] border border-white/5 p-2 rounded-none self-start sm:self-auto">
            <div className="text-right">
              <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 block font-medium">
                Client View Override
              </span>
              <span className="text-xs font-semibold tracking-wider text-neutral-500 block">
                {isClientView ? "Confidential Metrics Hidden" : "Full Ledger Mode"}
              </span>
            </div>

            <button
              onClick={() => setIsClientView(!isClientView)}
              className={`flex items-center justify-between w-20 p-1 border rounded-none transition-all duration-300 focus:outline-none ${
                isClientView
                  ? "border-gold-400/50 bg-gold-400/5 text-gold-400"
                  : "border-white/10 bg-neutral-900 text-neutral-500"
              }`}
              title="Toggle Client-Only display state"
            >
              <div className="flex items-center gap-1.5 grow px-1 text-[9px] font-mono uppercase font-bold tracking-wider">
                {isClientView ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>ON</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>OFF</span>
                  </>
                )}
              </div>
            </button>

            {/* Ghost Factory Admin Pass */}
            <button
              onClick={() => setIsAdminOpen(true)}
              className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400 text-amber-400 hover:text-amber-300 text-[9px] font-mono uppercase tracking-widest font-bold transition-all cursor-pointer"
              id="culinary-admin-pass-btn"
            >
              [ ADMIN PASS ]
            </button>
          </div>
        </div>

        {/* Global Tab Selector Navigation */}
        <div className="border-t border-white/5 bg-[#0c0c0c]/90">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <nav className="flex items-center gap-6 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`py-3.5 text-xs font-mono uppercase tracking-[0.15em] transition-all relative border-b-2 whitespace-nowrap ${
                  activeTab === "dashboard"
                    ? "border-gold-400 text-white font-medium"
                    : "border-transparent text-neutral-500 hover:text-neutral-300"
                }`}
              >
                Command Center
              </button>

              <button
                onClick={() => setActiveTab("bookings")}
                className={`py-3.5 text-xs font-mono uppercase tracking-[0.15em] transition-all relative border-b-2 whitespace-nowrap ${
                  activeTab === "bookings"
                    ? "border-gold-400 text-white font-medium"
                    : "border-transparent text-neutral-500 hover:text-neutral-300"
                }`}
              >
                Inquiries & Bookings
              </button>

              <button
                onClick={() => setActiveTab("lookbook")}
                className={`py-3.5 text-xs font-mono uppercase tracking-[0.15em] transition-all relative border-b-2 whitespace-nowrap ${
                  activeTab === "lookbook"
                    ? "border-gold-400 text-white font-medium"
                    : "border-transparent text-neutral-500 hover:text-neutral-300"
                }`}
              >
                Course Lookbook
              </button>

              <button
                onClick={() => setActiveTab("allergens")}
                className={`py-3.5 text-xs font-mono uppercase tracking-[0.15em] transition-all relative border-b-2 whitespace-nowrap ${
                  activeTab === "allergens"
                    ? "border-gold-400 text-white font-medium"
                    : "border-transparent text-neutral-500 hover:text-neutral-300"
                }`}
              >
                Dietary Matrix
              </button>

              <button
                onClick={() => setActiveTab("integrations")}
                className={`py-3.5 text-xs font-mono uppercase tracking-[0.15em] transition-all relative border-b-2 whitespace-nowrap ${
                  activeTab === "integrations"
                    ? "border-gold-400 text-white font-medium"
                    : "border-transparent text-neutral-500 hover:text-neutral-300"
                }`}
              >
                Integration
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Luxury Sandbox Container */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-10 min-h-[75vh]">
        
        {/* Dynamic Tab router switch */}
        {activeTab === "dashboard" && (
          <CommandCenter
            bookings={bookings}
            menuItems={menuItems}
            isClientView={isClientView}
            onNavigate={(tab) => setActiveTab(tab)}
            onQuickAction={handleQuickAction}
          />
        )}

        {activeTab === "bookings" && (
          <BookingManager
            bookings={bookings}
            menuItems={menuItems}
            isClientView={isClientView}
            onAddBooking={handleAddBooking}
            onUpdateBooking={handleUpdateBooking}
            onDeleteBooking={handleDeleteBooking}
            onOpenQuickMenu={forceNewBookingOpen}
            onResetQuickMenu={() => setForceNewBookingOpen(false)}
          />
        )}

        {activeTab === "lookbook" && (
          <MenuBuilder
            menuItems={menuItems}
            isClientView={isClientView}
            onAddMenuItem={handleAddMenuItem}
            onUpdateMenuItem={handleUpdateMenuItem}
            onDeleteMenuItem={handleDeleteMenuItem}
            onOpenQuickMenu={forceNewMenuOpen}
            onResetQuickMenu={() => setForceNewMenuOpen(false)}
          />
        )}

        {activeTab === "allergens" && (
          <DietaryMatrix
            dietaryRecords={dietaryRecords}
            bookings={bookings}
            menuItems={menuItems}
            onAddRecord={handleAddDietary}
            onUpdateRecord={handleUpdateDietary}
            onDeleteRecord={handleDeleteDietary}
            onOpenQuickMenu={forceNewDietaryOpen}
            onResetQuickMenu={() => setForceNewDietaryOpen(false)}
            isClientView={isClientView}
          />
        )}

        {activeTab === "integrations" && <IntegrationLayer />}

      </main>

      {/* Elegant Editorial Footer */}
      <footer className="border-t border-white/5 bg-[#080808] py-12 text-left transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-8 text-xs text-neutral-500">
          
          <div className="space-y-1.5 text-center md:text-left">
            <span className="font-serif text-sm text-neutral-300 tracking-wider">
              MAISON <span className="text-gold-400 italic">Culinaire</span>
            </span>
            <p className="font-mono text-xs font-semibold tracking-wider text-neutral-600">
              PRISTINE CATERING WORKSPACE & DATABASE ENVIRONMENT
            </p>
          </div>

          <div className="text-center md:text-right font-mono text-xs font-semibold tracking-wider space-y-1">
            <p className="text-neutral-600">SYSTEM ARCHITECTURE: STATIC INTEGRITY COMPILATION</p>
            <p className="text-neutral-500">
              © {new Date().getFullYear()} MAISON CULINAIRE. DESIGN FOR LUXURY DINING.
            </p>
          </div>

        </div>
      </footer>

      <AdminPortalModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onSelectTab={(t) => setActiveTab(t)}
      />

    </div>
  );
}
