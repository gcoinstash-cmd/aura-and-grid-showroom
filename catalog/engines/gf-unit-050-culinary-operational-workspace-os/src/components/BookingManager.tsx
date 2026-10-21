/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { Plus, Edit, Trash2, Calendar, MapPin, Users, DollarSign, Tag, Info, Check, EyeOff, Save, X, Sparkles } from "lucide-react";
import { Booking, MenuItem, EventStatus } from "../types";

interface BookingManagerProps {
  bookings: Booking[];
  menuItems: MenuItem[];
  isClientView: boolean;
  onAddBooking: (booking: Booking) => void;
  onUpdateBooking: (booking: Booking) => void;
  onDeleteBooking: (id: string) => void;
  onOpenQuickMenu: boolean; // flag to open the modal directly if requested by quick action
  onResetQuickMenu: () => void;
}

export default function BookingManager({
  bookings,
  menuItems,
  isClientView,
  onAddBooking,
  onUpdateBooking,
  onDeleteBooking,
  onOpenQuickMenu,
  onResetQuickMenu,
}: BookingManagerProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(bookings[0] || null);
  const [isAdding, setIsAdding] = useState(onOpenQuickMenu);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Booking>>({
    eventName: "",
    clientName: "",
    eventDate: "",
    guestCount: 10,
    pricePerPlate: 150,
    status: EventStatus.Inquiry,
    venueAddress: "",
    notes: "",
    menuItemIds: [],
  });

  // If app requested open quick additions
  if (onOpenQuickMenu && !isAdding) {
    setIsAdding(true);
    setFormData({
      id: "booking_" + Date.now(),
      eventName: "",
      clientName: "",
      eventDate: new Date().toISOString().split("T")[0],
      guestCount: 8,
      pricePerPlate: 250,
      status: EventStatus.Inquiry,
      venueAddress: "",
      notes: "",
      menuItemIds: menuItems.slice(0, 3).map((item) => item.id), // preset initial 3 items for lookbook ease
    });
    onResetQuickMenu();
  }

  const startAddNew = () => {
    setFormData({
      id: "booking_" + Date.now(),
      eventName: "",
      clientName: "",
      eventDate: new Date().toISOString().split("T")[0],
      guestCount: 10,
      pricePerPlate: 250,
      status: EventStatus.Inquiry,
      venueAddress: "",
      notes: "",
      menuItemIds: menuItems.slice(0, 4).map((m) => m.id), // match default menu items
    });
    setIsAdding(true);
    setIsEditing(false);
  };

  const startEdit = (booking: Booking) => {
    setFormData({ ...booking });
    setIsEditing(true);
    setIsAdding(false);
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();

    const finalized: Booking = {
      id: (formData.id as string) || "booking_" + Date.now(),
      eventName: formData.eventName || "Untitled Event",
      clientName: formData.clientName || "Anonymous Client",
      eventDate: formData.eventDate || new Date().toISOString().split("T")[0],
      guestCount: Number(formData.guestCount) || 1,
      pricePerPlate: Number(formData.pricePerPlate) || 0,
      status: (formData.status as EventStatus) || EventStatus.Inquiry,
      venueAddress: formData.venueAddress || "Private Venue",
      notes: formData.notes || "",
      menuItemIds: formData.menuItemIds || [],
    };

    if (isAdding) {
      onAddBooking(finalized);
      setSelectedBooking(finalized);
    } else {
      onUpdateBooking(finalized);
      if (selectedBooking?.id === finalized.id) {
        setSelectedBooking(finalized);
      }
    }

    setIsAdding(false);
    setIsEditing(false);
  };

  const toggleMenuItemId = (itemId: string) => {
    const current = formData.menuItemIds || [];
    if (current.includes(itemId)) {
      setFormData({
        ...formData,
        menuItemIds: current.filter((id) => id !== itemId),
      });
    } else {
      setFormData({
        ...formData,
        menuItemIds: [...current, itemId],
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT PANEL: BOOKINGS LIST (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h3 className="text-xl font-serif text-white tracking-tight">Master Bookings DB</h3>
            <p className="text-xs text-neutral-400 mt-1">Institutional records, inquiries, and contracts.</p>
          </div>
          <button
            onClick={startAddNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-400 hover:bg-gold-500 text-neutral-900 font-mono text-base font-semibold min-h-[44px] uppercase tracking-wider font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Booking
          </button>
        </div>

        {/* List of bookings */}
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {bookings.map((booking) => {
            const isSelected = selectedBooking?.id === booking.id;
            const revenue = booking.guestCount * booking.pricePerPlate;

            return (
              <div
                key={booking.id}
                onClick={() => {
                  setSelectedBooking(booking);
                  setIsAdding(false);
                  setIsEditing(false);
                }}
                className={`p-5 cursor-pointer text-left transition-all duration-300 border ${
                  isSelected
                    ? "border-gold-400/40 bg-[#121212]"
                    : "border-white/5 bg-[#0e0e0e]/50 hover:bg-[#121212]/40"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-semibold tracking-wider text-neutral-500 uppercase tracking-wider">
                    {booking.eventDate}
                  </span>
                  <span className={`px-2 py-0.5 text-[9px] uppercase tracking-wider font-mono border ${
                    booking.status === EventStatus.DepositPaid
                      ? "bg-amber-400/5 text-amber-400 border-amber-400/20"
                      : booking.status === EventStatus.ContractSigned
                      ? "bg-blue-400/5 text-blue-400 border-blue-400/20"
                      : booking.status === EventStatus.ActivePrep
                      ? "bg-emerald-400/5 text-emerald-400 border-emerald-400/20"
                      : booking.status === EventStatus.Completed
                      ? "bg-neutral-800 text-neutral-400 border-neutral-700"
                      : "bg-[#161616] text-neutral-400 border-[#2a2a2a]"
                  }`}>
                    {booking.status}
                  </span>
                </div>

                <h4 className="font-serif text-[17px] text-white line-clamp-1 group-hover:text-gold-400">
                  {booking.eventName}
                </h4>
                <p className="text-xs text-neutral-400 mt-1">
                  Client: <span className="text-neutral-200">{booking.clientName}</span>
                </p>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <Users className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{booking.guestCount} Covers</span>
                  </div>

                  <div className="text-right">
                    {isClientView ? (
                      <span className="text-xs font-semibold tracking-wider font-mono uppercase text-neutral-500 italic flex items-center gap-1">
                        <EyeOff className="w-3 h-3 text-neutral-600" /> Protected
                      </span>
                    ) : (
                      <span className="font-mono text-xs font-semibold text-gold-400">
                        ${revenue.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {bookings.length === 0 && (
            <div className="text-center py-12 border border-dashed border-white/5">
              <p className="text-neutral-500 text-sm">No bookings recorded.</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: DETAILS, EDIT, OR ADD (7 cols) */}
      <div className="lg:col-span-7">
        {isAdding || isEditing ? (
          /* Form for Create or Edit */
          <form onSubmit={handleSave} className="bg-[#121212] border border-white/5 p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-lg font-serif text-white tracking-tight">
                {isAdding ? "Initiate Culinary Booking" : `Refine Booking: ${formData.eventName}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setIsEditing(false);
                }}
                className="text-neutral-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="block text-sm font-semibold font-mono uppercase tracking-wider text-neutral-400">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Saffron Gala Dinner"
                  value={formData.eventName || ""}
                  onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                  className="w-full bg-[#161616] border border-white/10 p-3 text-sm text-white focus:outline-none focus:border-gold-400/50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold font-mono uppercase tracking-wider text-neutral-400">
                  Client Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Lord Alistair Sterling"
                  value={formData.clientName || ""}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full bg-[#161616] border border-white/10 p-3 text-sm text-white focus:outline-none focus:border-gold-400/50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold font-mono uppercase tracking-wider text-neutral-400">
                  Booking Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.eventDate || ""}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  className="w-full bg-[#161616] border border-white/10 p-3 text-sm text-white focus:outline-none focus:border-gold-400/50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold font-mono uppercase tracking-wider text-neutral-400">
                  Event Status
                </label>
                <select
                  value={formData.status || EventStatus.Inquiry}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as EventStatus })}
                  className="w-full bg-[#161616] border border-white/10 p-3 text-sm text-white focus:outline-none focus:border-gold-400/50"
                >
                  {Object.values(EventStatus).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold font-mono uppercase tracking-wider text-neutral-400">
                  Guest Volume (Covers)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.guestCount || ""}
                  onChange={(e) => setFormData({ ...formData, guestCount: Number(e.target.value) })}
                  className="w-full bg-[#161616] border border-white/10 p-3 text-sm text-white focus:outline-none focus:border-gold-400/50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold font-mono uppercase tracking-wider text-neutral-400">
                  Price Per Plate ($)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.pricePerPlate || ""}
                  onChange={(e) => setFormData({ ...formData, pricePerPlate: Number(e.target.value) })}
                  className="w-full bg-[#161616] border border-white/10 p-3 text-sm text-white focus:outline-none focus:border-gold-400/50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold font-mono uppercase tracking-wider text-neutral-400">
                Venue Address
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Suite 45, Cliffside Estate, Malibu"
                value={formData.venueAddress || ""}
                onChange={(e) => setFormData({ ...formData, venueAddress: e.target.value })}
                className="w-full bg-[#161616] border border-white/10 p-3 text-sm text-white focus:outline-none focus:border-gold-400/50"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold font-mono uppercase tracking-wider text-neutral-400">
                Internal Chef Note & Requests
              </label>
              <textarea
                rows={3}
                placeholder="Wine cellar choices, custom floral accents, silverware requirements..."
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-[#161616] border border-white/10 p-3 text-sm text-white focus:outline-none focus:border-gold-400/50 resize-none font-sans"
              />
            </div>

            {/* Relations Link section */}
            <div className="space-y-3 pt-2">
              <span className="block text-xs font-semibold font-mono uppercase tracking-wider text-neutral-400">
                Link Course Menu Items (Bespoke Menu DB Relation)
              </span>
              <p className="text-[11.5px] text-neutral-400 mb-2">
                Associate custom dishes from your Lookbook to form the signature multi-course proposal.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto p-1 border border-white/5 bg-[#0e0e0e]/50">
                {menuItems.map((item) => {
                  const isChecked = (formData.menuItemIds || []).includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleMenuItemId(item.id)}
                      className={`flex items-center gap-3 p-2 border cursor-pointer select-none transition-all ${
                        isChecked
                          ? "border-gold-400/30 bg-gold-400/5"
                          : "border-white/5 bg-[#161616] hover:bg-white/5"
                      }`}
                    >
                      <div className={`w-4 h-4 flex items-center justify-center rounded-none border border-gold-400/40 text-neutral-900 ${
                        isChecked ? "bg-gold-400" : ""
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className="truncate">
                        <p className="text-xs text-white truncate font-serif font-medium">{item.name}</p>
                        <span className="text-xs font-semibold tracking-wider text-neutral-400 font-mono uppercase">{item.category}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-4 border-t border-white/5 pt-6 justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setIsEditing(false);
                }}
                className="px-5 py-2.5 bg-[#161616] text-xs font-mono uppercase tracking-widest text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1 px-6 py-2.5 bg-gold-400 hover:bg-gold-500 text-neutral-900 font-mono text-base font-semibold min-h-[44px] uppercase tracking-widest font-semibold transition-colors"
              >
                <Save className="w-4 h-4" /> Save Record
              </button>
            </div>
          </form>
        ) : selectedBooking ? (
          /* View Details Pane */
          <div className="bg-[#121212] border border-white/5 p-8 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-white/5 pb-6">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-gold-400">
                  Active Booking Sheet
                </span>
                <h3 className="text-3xl font-serif text-white tracking-tight mt-1">
                  {selectedBooking.eventName}
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Exclusive Client: <span className="text-white font-medium">{selectedBooking.clientName}</span>
                </p>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => startEdit(selectedBooking)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-white/5 hover:border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white font-mono text-xs uppercase tracking-wider transition-all"
                >
                  <Edit className="w-3.5 h-3.5" /> Adjust
                </button>
                <button
                  onClick={() => {
                    if (confirm("Permanently archive this dining contract?")) {
                      onDeleteBooking(selectedBooking.id);
                      setSelectedBooking(bookings.find((b) => b.id !== selectedBooking.id) || null);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500/10 hover:border-red-500/30 hover:bg-red-500/5 text-red-400/80 hover:text-red-400 font-mono text-xs uppercase tracking-wider transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Wipe
                </button>
              </div>
            </div>

            {/* Metadata Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 border-b border-white/5 pb-8">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold tracking-wider font-mono text-neutral-500 uppercase tracking-widest block flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" /> Dining Date
                </span>
                <span className="text-lg font-serif text-white">
                  {new Date(selectedBooking.eventDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold tracking-wider font-mono text-neutral-500 uppercase tracking-widest block flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-neutral-500" /> Guest Volume
                </span>
                <span className="text-lg font-serif text-white">{selectedBooking.guestCount} Covers</span>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold tracking-wider font-mono text-neutral-500 uppercase tracking-widest block flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-neutral-500" /> Event Status
                </span>
                <span className="font-mono text-xs text-gold-400 uppercase tracking-widest">
                  {selectedBooking.status}
                </span>
              </div>
            </div>

            {/* Financial Analysis (Hide if Client View is enabled) */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Executive Ledger</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-[#0a0a0a]/50 p-6 border border-white/5">
                <div>
                  <span className="text-xs font-semibold tracking-wider text-neutral-500 uppercase tracking-wide block">Price Per Plate</span>
                  {isClientView ? (
                    <span className="text-sm font-mono text-neutral-400 italic">Protected</span>
                  ) : (
                    <span className="text-xl font-serif text-white mt-1 block">
                      ${selectedBooking.pricePerPlate.toLocaleString("en-US")}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-xs font-semibold tracking-wider text-neutral-500 uppercase tracking-wide block">Total Valuation</span>
                  {isClientView ? (
                    <span className="text-sm font-mono text-neutral-400 italic">Protected</span>
                  ) : (
                    <span className="text-xl font-serif text-gold-400 mt-1 block">
                      ${(selectedBooking.guestCount * selectedBooking.pricePerPlate).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-xs font-semibold tracking-wider text-neutral-500 uppercase tracking-wide block">Chef Deposit Due (50%)</span>
                  {isClientView ? (
                    <span className="text-sm font-mono text-neutral-400 italic">Protected</span>
                  ) : (
                    <span className="text-xl font-serif text-neutral-400 mt-1 block">
                      ${((selectedBooking.guestCount * selectedBooking.pricePerPlate) * 0.5).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Info / Logistical notes */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest block">Venue Logistics</span>
              <div className="bg-[#161616] border border-white/5 p-4 flex gap-3 text-sm text-neutral-300">
                <MapPin className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                <span>{selectedBooking.venueAddress}</span>
              </div>
            </div>

            {/* Private notes */}
            {selectedBooking.notes && (
              <div className="space-y-2">
                <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest block">Chef Special Notes</span>
                <div className="p-4 border border-white/5 bg-[#161616] text-xs text-neutral-400 leading-relaxed font-sans italic">
                  &quot;{selectedBooking.notes}&quot;
                </div>
              </div>
            )}

            {/* Course Builder Link Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-mono text-neutral-400 uppercase tracking-widest">
                  Associated Menu Courses ({selectedBooking.menuItemIds.length})
                </h4>
                <div className="h-[1px] bg-white/5 grow mx-4" />
              </div>

              {selectedBooking.menuItemIds.length === 0 ? (
                <div className="border border-dashed border-white/5 p-6 text-center text-xs text-neutral-500">
                  No Lookbook Courses associated. Refine this booking to map culinary items.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {menuItems
                    .filter((item) => selectedBooking.menuItemIds.includes(item.id))
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-3 bg-[#161616] border border-white/5 p-3 hover:border-gold-300/10 transition-colors"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 object-cover bg-neutral-900 border border-white/5 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-gold-400">
                            {item.category}
                          </span>
                          <h5 className="font-serif text-sm text-white truncate">{item.name}</h5>
                          {!isClientView && (
                            <p className="text-xs font-semibold tracking-wider text-neutral-500 font-mono">
                              Cost per serving: ${item.costPerServing.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="border border-dashed border-white/5 h-[400px] flex items-center justify-center bg-[#121212]/30">
            <div className="text-center space-y-2">
              <p className="text-neutral-500 text-sm">Select an active reservation from the database log.</p>
              <button
                onClick={startAddNew}
                className="text-base font-semibold min-h-[44px] text-gold-400 font-mono tracking-wider uppercase hover:underline"
              >
                Or establish a new contract now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
