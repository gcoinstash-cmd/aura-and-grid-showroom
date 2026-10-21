/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Calendar, Users, DollarSign, PlusCircle, ArrowRight, MapPin, EyeOff, ShieldAlert, BookOpen, Utensils } from "lucide-react";
import { Booking, MenuItem, EventStatus } from "../types";

interface CommandCenterProps {
  bookings: Booking[];
  menuItems: MenuItem[];
  isClientView: boolean;
  onNavigate: (tab: string) => void;
  onQuickAction: (actionType: "booking" | "menu" | "dietary") => void;
}

export default function CommandCenter({
  bookings,
  menuItems,
  isClientView,
  onNavigate,
  onQuickAction,
}: CommandCenterProps) {
  // Compute metrics
  const activeBookings = bookings.filter(
    (b) => b.status !== EventStatus.Completed && b.status !== EventStatus.Archived
  );

  const totalPipelineRevenue = bookings.reduce(
    (sum, b) => sum + b.guestCount * b.pricePerPlate,
    0
  );

  const activeGuestVolume = activeBookings.reduce((sum, b) => sum + b.guestCount, 0);

  // Sorting active bookings by date for upcoming timeline
  const sortedUpcoming = [...activeBookings].sort(
    (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );

  return (
    <div className="space-y-12">
      {/* Alert if client view only mode is active */}
      {isClientView && (
        <div className="bg-gold-400/5 border border-gold-400/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <EyeOff className="w-5 h-5 text-gold-400" />
            <div>
              <span className="font-serif text-sm font-medium text-white">Client Presentation Mode Active</span>
              <p className="text-xs text-neutral-400">Sensitive pricing models, prep complexities, and profit metrics are safely masked.</p>
            </div>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#a37225]">Screen Share Private</span>
        </div>
      )}

      {/* KPI Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1: Revenue (SaaS Model) or Masked Safe */}
        <div className="border border-white/5 bg-[#121212] p-6 shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between text-neutral-400 font-mono text-xs font-semibold tracking-wider uppercase tracking-widest mb-4">
            <span>Financial Pipeline</span>
            <DollarSign className="w-4 h-4 text-gold-400" />
          </div>
          <div className="mt-2">
            {isClientView ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-serif text-gold-400 tracking-tight text-neutral-400 italic">
                  [CONFIDENTIAL]
                </span>
                <span className="group relative cursor-help" title="Sensitive pricing is hidden from screens">
                  <EyeOff className="w-4 h-4 text-neutral-500" />
                </span>
              </div>
            ) : (
              <span className="text-4xl font-serif text-white tracking-tight">
                ${totalPipelineRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
            <p className="text-xs text-neutral-500 mt-2">
              Cumulative value of all inquiries, signed contracts, and active services.
            </p>
          </div>
        </div>

        {/* KPI 2: Active Guest Volume */}
        <div className="border border-white/5 bg-[#121212] p-6 shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between text-neutral-400 font-mono text-xs font-semibold tracking-wider uppercase tracking-widest mb-4">
            <span>Active Guest Capacity</span>
            <Users className="w-4 h-4 text-gold-400" />
          </div>
          <div className="mt-2">
            <span className="text-4xl font-serif text-white tracking-tight">
              {activeGuestVolume} <span className="text-sm font-sans font-light text-neutral-400">Covers</span>
            </span>
            <p className="text-xs text-neutral-500 mt-2">
              Sum of guest volumes currently slated across {activeBookings.length} unarchived events.
            </p>
          </div>
        </div>

        {/* KPI 3: Curated Lookbook Menu Count */}
        <div className="border border-white/5 bg-[#121212] p-6 shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between text-neutral-400 font-mono text-xs font-semibold tracking-wider uppercase tracking-widest mb-4">
            <span>Bespoke Menu Registry</span>
            <Utensils className="w-4 h-4 text-gold-400" />
          </div>
          <div className="mt-2">
            <span className="text-4xl font-serif text-white tracking-tight">
              {menuItems.length} <span className="text-sm font-sans font-light text-neutral-400">Lookbook Recipes</span>
            </span>
            <p className="text-xs text-neutral-500 mt-2">
              Signature culinary course offerings actively mapped to luxurious client options.
            </p>
          </div>
        </div>
      </div>

      {/* Main Panel Content: Timeline vs Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Visual Timeline Panel (Left 7 Columns) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="text-xl font-serif text-white tracking-tight">Upcoming Operational Timeline</h3>
            <p className="text-xs text-neutral-400 mt-1">Chronological flow of active luxury catering and private dinners.</p>
          </div>

          {sortedUpcoming.length === 0 ? (
            <div className="border border-dashed border-white/5 p-12 text-center">
              <p className="text-neutral-500 text-sm">No active operations scheduled.</p>
              <button
                onClick={() => onQuickAction("booking")}
                className="mt-4 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-gold-400 hover:text-gold-300 transition-colors"
              >
                Record your first booking <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="relative border-l border-white/10 pl-6 ml-3 py-2 space-y-8">
              {sortedUpcoming.map((booking, idx) => {
                const dateObj = new Date(booking.eventDate);
                const formattedDate = dateObj.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                
                return (
                  <div key={booking.id} className="relative group">
                    {/* Visual dot on timeline */}
                    <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-gold-400 border-2 border-[#000000] group-hover:scale-125 transition-transform" />

                    <div className="bg-[#121212] border border-white/5 p-6 hover:border-gold-400/20 transition-all duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <span className="font-mono text-xs font-semibold tracking-wider text-neutral-400 font-medium tracking-wider flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gold-400" />
                          {formattedDate}
                        </span>
                        <span className={`inline-block px-2 py-0.5 text-xs font-semibold tracking-wider uppercase tracking-wider font-mono border rounded-none ${
                          booking.status === EventStatus.DepositPaid
                            ? "bg-amber-400/5 text-amber-400 border-amber-400/20"
                            : booking.status === EventStatus.ContractSigned
                            ? "bg-blue-400/5 text-blue-400 border-blue-400/20"
                            : booking.status === EventStatus.ActivePrep
                            ? "bg-emerald-400/5 text-emerald-400 border-emerald-400/20"
                            : "bg-neutral-800 text-neutral-400 border-neutral-700"
                        }`}>
                          {booking.status}
                        </span>
                      </div>

                      <h4 className="font-serif text-lg text-white mb-1 group-hover:text-gold-400 transition-colors">
                        {booking.eventName}
                      </h4>
                      <p className="text-xs text-neutral-400 mb-4 flex items-center gap-1">
                        Client: <span className="text-white font-medium">{booking.clientName}</span>
                        <span className="mx-2 text-neutral-600">•</span>
                        <span>{booking.guestCount} Premium Covers</span>
                      </p>

                      {/* Info bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/5 pt-4 text-xs text-neutral-500">
                        <span className="flex items-center gap-1.5 font-sans">
                          <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                          {booking.venueAddress}
                        </span>
                        
                        {!isClientView && (
                          <span className="font-mono text-gold-400">
                            Total Valuation: ${(booking.guestCount * booking.pricePerPlate).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Action Panel (Right 4 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="text-xl font-serif text-white tracking-tight">Executive Actions</h3>
            <p className="text-xs text-neutral-400 mt-1">Spin up records instantaneously into modules.</p>
          </div>

          <div className="bg-[#121212] border border-white/5 p-6 space-y-4">
            <button
              onClick={() => onQuickAction("booking")}
              className="w-full flex items-center justify-between p-4 bg-[#161616] border border-white/5 hover:border-gold-400/30 text-left transition-all duration-300 group"
            >
              <div className="space-y-1">
                <span className="font-serif text-sm font-medium text-white group-hover:text-gold-400 transition-colors">
                  Create Master Booking
                </span>
                <p className="text-xs text-neutral-400 leading-snug">
                  Draft a novel inquiry, proposal, or culinary engagement contract.
                </p>
              </div>
              <PlusCircle className="w-5 h-5 text-neutral-500 group-hover:text-gold-400 shrink-0 transition-colors" />
            </button>

            <button
              onClick={() => onQuickAction("menu")}
              className="w-full flex items-center justify-between p-4 bg-[#161616] border border-white/5 hover:border-gold-400/30 text-left transition-all duration-300 group"
            >
              <div className="space-y-1">
                <span className="font-serif text-sm font-medium text-white group-hover:text-gold-400 transition-colors">
                  Compose Dish Lookbook
                </span>
                <p className="text-xs text-neutral-400 leading-snug">
                  Add high-end dishes, pricing, complexity scores, or ingredients.
                </p>
              </div>
              <PlusCircle className="w-5 h-5 text-neutral-500 group-hover:text-gold-400 shrink-0 transition-colors" />
            </button>

            <button
              onClick={() => onQuickAction("dietary")}
              className="w-full flex items-center justify-between p-4 bg-[#161616] border border-white/5 hover:border-gold-400/30 text-left transition-all duration-300 group"
            >
              <div className="space-y-1">
                <span className="font-serif text-sm font-medium text-white group-hover:text-gold-400 transition-colors">
                  Register Guest Dietary profile
                </span>
                <p className="text-xs text-neutral-400 leading-snug">
                  Log allergy markers and trigger automated menu safety inspections.
                </p>
              </div>
              <PlusCircle className="w-5 h-5 text-neutral-500 group-hover:text-gold-400 shrink-0 transition-colors" />
            </button>
          </div>

          {/* Quick Stats Summary Footer inside Actions panel */}
          <div className="bg-[#121212]/50 border border-white/5 p-6 rounded-none space-y-4">
            <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 block">
              Workspace Overview
            </span>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400">Active Bookings Count:</span>
                <span className="font-mono text-white text-right">{activeBookings.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400">Total Lookbook Courses:</span>
                <span className="font-mono text-white text-right">{menuItems.length}</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate("bookings")}
              className="w-full py-2.5 border border-white/5 text-xs text-neutral-400 text-center uppercase tracking-widest font-mono hover:bg-white/5 hover:border-white/10 active:bg-white/10 transition-all block"
            >
              Examine Database Master
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
