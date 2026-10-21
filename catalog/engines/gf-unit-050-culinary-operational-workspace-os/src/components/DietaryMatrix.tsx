/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { Plus, Edit, Trash2, ShieldAlert, CheckCircle2, UserCheck, Calendar, EyeOff, Save, X, Sparkles, Filter, AlertTriangle } from "lucide-react";
import { DietaryRecord, Booking, MenuItem, DietaryPreference } from "../types";
import { checkImpactedItem } from "../data";

interface DietaryMatrixProps {
  dietaryRecords: DietaryRecord[];
  bookings: Booking[];
  menuItems: MenuItem[];
  onAddRecord: (record: DietaryRecord) => void;
  onUpdateRecord: (record: DietaryRecord) => void;
  onDeleteRecord: (id: string) => void;
  onOpenQuickMenu: boolean; // Flag to force form open
  onResetQuickMenu: () => void;
  isClientView: boolean;
}

export default function DietaryMatrix({
  dietaryRecords,
  bookings,
  menuItems,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onOpenQuickMenu,
  onResetQuickMenu,
  isClientView,
}: DietaryMatrixProps) {
  const [selectedRecord, setSelectedRecord] = useState<DietaryRecord | null>(dietaryRecords[0] || null);
  const [filterBookingId, setFilterBookingId] = useState<string>("All");
  const [isAdding, setIsAdding] = useState(onOpenQuickMenu);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<DietaryRecord>>({
    guestIdentifier: "",
    bookingId: bookings[0]?.id || "",
    criticalAllergies: [],
    preference: DietaryPreference.None,
  });

  const [allergyInput, setAllergyInput] = useState("");

  // Handle forcing active quick addition from App
  if (onOpenQuickMenu && !isAdding) {
    setIsAdding(true);
    setFormData({
      id: "diet_" + Date.now(),
      guestIdentifier: "",
      bookingId: bookings[0]?.id || "",
      criticalAllergies: [],
      preference: DietaryPreference.None,
    });
    setAllergyInput("");
    onResetQuickMenu();
  }

  const startAddNew = () => {
    setFormData({
      id: "diet_" + Date.now(),
      guestIdentifier: "",
      bookingId: bookings[0]?.id || "",
      criticalAllergies: [],
      preference: DietaryPreference.None,
    });
    setAllergyInput("");
    setIsAdding(true);
    setIsEditing(false);
  };

  const startEdit = (record: DietaryRecord) => {
    setFormData({ ...record });
    setAllergyInput(record.criticalAllergies.join(", "));
    setIsEditing(true);
    setIsAdding(false);
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();

    // Parse comma allergies list
    const parsedAllergies = allergyInput
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    const finalized: DietaryRecord = {
      id: (formData.id as string) || "diet_" + Date.now(),
      guestIdentifier: formData.guestIdentifier || "Guest Seat / Suite",
      bookingId: formData.bookingId || bookings[0]?.id || "",
      criticalAllergies: parsedAllergies,
      preference: (formData.preference as DietaryPreference) || DietaryPreference.None,
    };

    if (isAdding) {
      onAddRecord(finalized);
      setSelectedRecord(finalized);
    } else {
      onUpdateRecord(finalized);
      if (selectedRecord?.id === finalized.id) {
        setSelectedRecord(finalized);
      }
    }

    setIsAdding(false);
    setIsEditing(false);
  };

  // Filter records based on selected dropdown event filter
  const filteredRecords = filterBookingId === "All"
    ? dietaryRecords
    : dietaryRecords.filter((rec) => rec.bookingId === filterBookingId);

  // Helper: map a single record to its Booking name
  const getBookingName = (bId: string) => {
    const found = bookings.find((b) => b.id === bId);
    return found ? found.eventName : "Archived Proposal";
  };

  // Compute Impacted Menu Items for a given Dietary record
  const getImpactedItemsForRecord = (record: DietaryRecord) => {
    const parentBooking = bookings.find((b) => b.id === record.bookingId);
    if (!parentBooking) return [];

    // Filter menu items that are associated with this booking
    const activeMenuForEvent = menuItems.filter((m) => parentBooking.menuItemIds.includes(m.id));

    // Evaluate each
    const impactedList = activeMenuForEvent
      .map((item) => {
        const check = checkImpactedItem(item, record);
        return {
          item,
          isImpacted: check.isImpacted,
          reasons: check.reasons,
        };
      })
      .filter((res) => res.isImpacted);

    return impactedList;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT COLUMN: GUEST LIST (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="border-b border-white/5 pb-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-serif text-white tracking-tight">Dietary Tracking Matrix</h3>
              <p className="text-xs text-neutral-400 mt-1">Cross-reference safety protocols and allergens.</p>
            </div>
            <button
              onClick={startAddNew}
              className="flex items-center gap-1 bg-gold-400 hover:bg-gold-500 text-neutral-900 font-mono text-base font-semibold min-h-[44px] font-semibold uppercase tracking-wider px-3 py-1.5 font-semibold transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Log Profile
            </button>
          </div>

          {/* Filter dropdown */}
          <div className="flex items-center gap-2 bg-[#121212] border border-white/5 px-3 py-2">
            <Filter className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <select
              value={filterBookingId}
              onChange={(e) => setFilterBookingId(e.target.value)}
              className="bg-transparent border-none text-xs text-neutral-300 focus:outline-none w-full"
            >
              <option value="All" className="bg-[#121212] text-white">All Events & Residencies</option>
              {bookings.map((b) => (
                <option key={b.id} value={b.id} className="bg-[#121212] text-white">
                  {b.eventName} ({b.clientName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Guest dietary logs */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {filteredRecords.map((record) => {
            const isSelected = selectedRecord?.id === record.id;
            const impacts = getImpactedItemsForRecord(record);
            const hasConflict = impacts.length > 0;

            return (
              <div
                key={record.id}
                onClick={() => {
                  setSelectedRecord(record);
                  setIsAdding(false);
                  setIsEditing(false);
                }}
                className={`p-5 cursor-pointer text-left transition-all duration-300 border ${
                  isSelected
                    ? "border-gold-400/40 bg-[#121212]"
                    : "border-white/5 bg-[#0e0e0e]/50 hover:bg-[#121212]/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-serif text-base text-white truncate font-medium">
                    {record.guestIdentifier}
                  </span>
                  {hasConflict ? (
                    <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400">
                      <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" /> {impacts.length} Conflicts
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> Menu Safe
                    </span>
                  )}
                </div>

                <p className="text-xs font-semibold font-mono text-neutral-400 truncate flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-gold-400" />
                  {getBookingName(record.bookingId)}
                </p>

                {/* Badges preview */}
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/5 pt-3">
                  {record.preference !== DietaryPreference.None && (
                    <span className="px-1.5 py-0.5 bg-gold-400/10 border border-gold-300/30 text-xs font-semibold tracking-wider font-mono uppercase text-gold-400">
                      {record.preference}
                    </span>
                  )}
                  {record.criticalAllergies.map((all, id) => (
                    <span key={id} className="px-1.5 py-0.5 bg-neutral-900 border border-white/5 text-xs font-semibold tracking-wider text-neutral-300">
                      {all}
                    </span>
                  ))}
                  {record.criticalAllergies.length === 0 && record.preference === DietaryPreference.None && (
                    <span className="text-xs font-semibold text-neutral-500 italic">No dietary restrictions recorded</span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredRecords.length === 0 && (
            <div className="border border-dashed border-white/5 p-12 text-center text-neutral-500 text-xs">
              No guest record matched this event. Create a custom register.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: DETAIL DISPLAY OR DATABASE WRITING (7 cols) */}
      <div className="lg:col-span-7">
        {isAdding || isEditing ? (
          /* Form for database additions */
          <form onSubmit={handleSave} className="bg-[#121212] border border-white/5 p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-lg font-serif text-white tracking-tight">
                {isAdding ? "Establish Guest Dietary Profile" : `Modify Profile: ${formData.guestIdentifier}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setIsEditing(false);
                }}
                className="text-neutral-500 hover:text-white transition-colors"
                title="Discard Changes"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="block text-sm font-semibold tracking-wider font-mono uppercase tracking-wider text-neutral-400">
                    Guest Name / Label
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Lady Sterling (Bride's Mother) or Seat 6"
                    value={formData.guestIdentifier || ""}
                    onChange={(e) => setFormData({ ...formData, guestIdentifier: e.target.value })}
                    className="w-full bg-[#161616] border border-white/10 p-3 text-sm text-white focus:outline-none focus:border-gold-400/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-semibold tracking-wider font-mono uppercase tracking-wider text-neutral-400">
                    Associated Dining Event
                  </label>
                  <select
                    value={formData.bookingId || ""}
                    onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                    className="w-full bg-[#161616] border border-white/10 p-3 text-xs text-white focus:outline-none focus:border-gold-400/50"
                  >
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.eventName} ({b.clientName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="block text-sm font-semibold tracking-wider font-mono uppercase tracking-wider text-neutral-400">
                    Lifestyle/Dietary Preference
                  </label>
                  <select
                    value={formData.preference || DietaryPreference.None}
                    onChange={(e) => setFormData({ ...formData, preference: e.target.value as DietaryPreference })}
                    className="w-full bg-[#161616] border border-white/10 p-3 text-xs text-white focus:outline-none focus:border-gold-400/50"
                  >
                    {Object.values(DietaryPreference).map((pref) => (
                      <option key={pref} value={pref}>
                        {pref}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-semibold tracking-wider font-mono uppercase tracking-wider text-neutral-400">
                      Critical Allergens
                    </label>
                    <span className="font-mono text-[9px] text-neutral-500">Comma separated</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Oysters, Gluten, Honey, Egg"
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 p-3 text-sm text-white focus:outline-none focus:border-gold-400/50"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 border border-white/5 bg-[#161616] flex gap-3 text-xs text-neutral-400 leading-relaxed">
              <Sparkles className="w-5 h-5 text-gold-400 shrink-0" />
              <span>
                <strong>Intelligent Formula Triggers</strong>: Altering allergens or preference selections will instantly recalculate collision states of mapped recipes on the flight.
              </span>
            </div>

            <div className="flex gap-4 border-t border-white/5 pt-5 justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setIsEditing(false);
                }}
                className="px-4 py-2 bg-[#161616] text-xs font-semibold font-mono uppercase tracking-widest text-[#9b9b9b] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-3 min-h-[44px] bg-gold-400 hover:bg-gold-500 text-neutral-900 font-mono text-base font-semibold min-h-[44px] font-semibold uppercase tracking-widest font-semibold transition-colors"
              >
                Save Profile
              </button>
            </div>
          </form>
        ) : selectedRecord ? (
          /* Detailed inspect view */
          <div className="bg-[#121212] border border-white/5 p-8 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-white/5 pb-6">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-gold-400">
                  Guest Intake Dossier
                </span>
                <h3 className="text-2xl font-serif text-white tracking-tight mt-1">
                  {selectedRecord.guestIdentifier}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
                  <span className="text-neutral-500">Scheduled Event:</span>
                  <span className="text-white font-medium">{getBookingName(selectedRecord.bookingId)}</span>
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(selectedRecord)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-white/5 hover:border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white font-mono text-xs uppercase tracking-wider transition-all"
                >
                  <Edit className="w-3.5 h-3.5" /> Modify
                </button>
                <button
                  onClick={() => {
                    if (confirm("Disconnect and wipe dietary register?")) {
                      onDeleteRecord(selectedRecord.id);
                      setSelectedRecord(dietaryRecords.find((r) => r.id !== selectedRecord.id) || null);
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 border border-red-500/10 hover:border-red-500/30 hover:bg-red-500/5 text-red-400 hover:text-red-400 font-mono text-xs uppercase tracking-wider transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Wipe
                </button>
              </div>
            </div>

            {/* Preference & Allergies Info Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#0a0a0a]/40 p-6 border border-white/5">
              <div className="space-y-1">
                <span className="text-xs font-semibold tracking-wider font-mono text-neutral-500 uppercase tracking-widest block">
                  Dietary Protocol
                </span>
                <span className="text-lg font-serif text-white">
                  {selectedRecord.preference === DietaryPreference.None
                    ? "Omnivorous (Standard)"
                    : selectedRecord.preference}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold tracking-wider font-mono text-neutral-500 uppercase tracking-widest block">
                  Critical Allergens Registered
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedRecord.criticalAllergies.map((allergy, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-red-400/10 border border-red-400/20 text-xs text-red-300 font-mono"
                    >
                      {allergy}
                    </span>
                  ))}
                  {selectedRecord.criticalAllergies.length === 0 && (
                    <span className="text-xs text-neutral-400 italic">No standard allergy triggers</span>
                  )}
                </div>
              </div>
            </div>

            {/* FORMULA REACTION: Impacted Course Checker */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-mono text-neutral-400 uppercase tracking-widest">
                  Impacted Menu Items Report (Intelligent Cross-Check)
                </h4>
                <div className="h-[1px] bg-white/5 grow mx-4" />
              </div>

              {(() => {
                const results = getImpactedItemsForRecord(selectedRecord);
                if (results.length === 0) {
                  return (
                    <div className="flex items-center gap-3 p-5 bg-emerald-500/5 border border-emerald-500/25">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-sm font-serif font-medium text-white block">No Course Conflicts Confirmed</span>
                        <p className="text-xs text-neutral-400 leading-normal mt-0.5">
                          Every assigned course in the lookbook progresses with ingredients that bypass mapped allergies and lifestyle restrictions. Ready for active prep.
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3.5">
                    <div className="p-4 bg-red-500/5 border border-red-500/25 flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-pulse" />
                      <div className="text-left">
                        <span className="text-sm font-serif font-medium text-white block">
                          Critical Collision Warning: {results.length} course(s) flagged
                        </span>
                        <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                          Ingredients matched active guest restriction lists. Alternative courses or custom plating substitutions are required for safety.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {results.map(({ item, reasons }, index) => (
                        <div key={index} className="p-4 border border-white/5 bg-[#161616] space-y-2">
                          <div className="flex justify-between items-center gap-2">
                            <span className="font-serif text-sm font-medium text-white">{item.name}</span>
                            <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400">
                              {item.category}
                            </span>
                          </div>
                          
                          <div className="space-y-1 pt-1.5 border-t border-white/5">
                            {reasons.map((r, i) => (
                              <p key={i} className="text-xs text-red-300 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0" />
                                {r}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>
        ) : (
          <div className="border border-dashed border-white/5 h-[350px] flex items-center justify-center bg-[#121212]/30">
            <p className="text-neutral-500 text-sm">Select an intake card from the registry list to trigger live formula inspections.</p>
          </div>
        )}
      </div>
    </div>
  );
}
