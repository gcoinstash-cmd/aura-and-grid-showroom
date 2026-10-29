import React, { useState } from 'react';
import { 
  Trophy, 
  Users, 
  Zap, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Edit3, 
  Plus, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { LoadoutSlotData, SlotKey } from '../types';
import { audioEngine } from '../utils/audio';

interface LoadoutSlotsProps {
  slots: LoadoutSlotData[];
  onUpdateSlot: (slotId: SlotKey, content: string, locked: boolean) => void;
  onResetAllSlots: () => void;
}

export const LoadoutSlots: React.FC<LoadoutSlotsProps> = ({
  slots,
  onUpdateSlot,
  onResetAllSlots
}) => {
  const [editingSlotId, setEditingSlotId] = useState<SlotKey | null>(null);
  const [tempText, setTempText] = useState<string>('');
  const [justLockedId, setJustLockedId] = useState<SlotKey | null>(null);

  const startEditing = (slot: LoadoutSlotData) => {
    audioEngine.playClick();
    setEditingSlotId(slot.id);
    setTempText(slot.content);
  };

  const cancelEditing = () => {
    audioEngine.playClick();
    setEditingSlotId(null);
    setTempText('');
  };

  const saveSlot = (slotId: SlotKey) => {
    if (!tempText.trim()) return;
    audioEngine.playSlotLock();
    onUpdateSlot(slotId, tempText.trim(), true);
    setEditingSlotId(null);
    setJustLockedId(slotId);
    setTimeout(() => setJustLockedId(null), 1200);
  };

  const unlockSlot = (slotId: SlotKey, currentContent: string) => {
    audioEngine.playClick();
    onUpdateSlot(slotId, currentContent, false);
    setEditingSlotId(slotId);
    setTempText(currentContent);
  };

  const getSlotIcon = (id: SlotKey) => {
    switch (id) {
      case 'slot_boss':
        return <Trophy className="w-6 h-6 text-amber-400" />;
      case 'slot_squad':
        return <Users className="w-6 h-6 text-cyan-400" />;
      case 'slot_energy':
        return <Zap className="w-6 h-6 text-emerald-400" />;
    }
  };

  const lockedCount = slots.filter((s) => s.locked).length;

  return (
    <section id="tactical-loadout-slots" className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7 pb-5 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">The 3-Slot Tactical Loadout</h2>
            <span className="text-base font-mono font-bold px-3 py-1 rounded-lg bg-zinc-800 text-cyan-400 border border-zinc-700">
              {lockedCount}/3 SLOTS SEALED
            </span>
          </div>
          <p className="text-base sm:text-lg text-zinc-300 mt-1">
            Lock in your 3 daily wins to supercharge your Core Shield (+150 XP per slot).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lockedCount === 3 ? (
            <div className="text-base font-mono text-emerald-300 font-bold flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>SHIELD AT 100% MAXIMUM</span>
            </div>
          ) : (
            <div className="text-base font-mono text-cyan-300 font-bold flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
              <span>{3 - lockedCount} MORE TO OVERCHARGE</span>
            </div>
          )}
        </div>
      </div>

      {/* 3 Interactive Slots Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {slots.map((slot) => {
          const isEditing = editingSlotId === slot.id;
          const isJustLocked = justLockedId === slot.id;

          return (
            <div
              key={slot.id}
              className={`group relative rounded-2xl bg-zinc-950 border p-6 transition-all duration-300 flex flex-col justify-between ${
                slot.locked 
                  ? 'border-zinc-800/90 shadow-md' 
                  : 'border-zinc-700/70 bg-zinc-950/95'
              } ${isJustLocked ? 'ring-2 ring-emerald-400 scale-[1.01]' : ''}`}
            >
              <div>
                {/* Slot Top Bar */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                      {getSlotIcon(slot.id)}
                    </div>
                    <div>
                      <div className="text-base font-mono text-zinc-400 font-semibold tracking-wider">
                        {slot.label}
                      </div>
                      <div className="text-xl font-bold text-white tracking-tight mt-0.5">
                        {slot.title}
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  {slot.locked ? (
                    <span className="text-base font-mono font-bold px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-emerald-400" />
                      SEALED
                    </span>
                  ) : (
                    <span className="text-base font-mono font-bold px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1.5 animate-pulse">
                      <Unlock className="w-4 h-4 text-amber-400" />
                      UNARMED
                    </span>
                  )}
                </div>

                <p className="text-base text-zinc-300 mb-4 min-h-[44px] leading-relaxed">
                  {slot.prompt}
                </p>

                {/* Content View / Edit Area */}
                {isEditing ? (
                  <div className="space-y-4">
                    <textarea
                      value={tempText}
                      onChange={(e) => setTempText(e.target.value)}
                      placeholder={slot.placeholder}
                      rows={3}
                      className="w-full text-lg bg-zinc-900/90 border border-cyan-500/50 rounded-xl p-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 leading-relaxed"
                      autoFocus
                    />

                    {/* Quick ADHD Presets */}
                    <div className="space-y-2">
                      <div className="text-base font-mono text-zinc-400 font-bold">
                        RAPID-SELECT HINTS (TAP TO INSERT):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {slot.presetHints.slice(0, 3).map((hint, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              audioEngine.playClick();
                              setTempText(hint);
                            }}
                            className="text-base text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-cyan-300 border border-zinc-800 rounded-lg py-2 px-3 text-left transition-colors font-medium"
                          >
                            + {hint}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-3 pt-3">
                      <button
                        onClick={cancelEditing}
                        className="py-3 px-5 rounded-xl text-base font-mono font-semibold text-zinc-400 hover:text-white transition-colors"
                      >
                        CANCEL
                      </button>
                      <button
                        onClick={() => saveSlot(slot.id)}
                        disabled={!tempText.trim()}
                        className="py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-mono font-bold text-base flex items-center gap-2 transition-all shadow-md"
                      >
                        <Lock className="w-4 h-4" />
                        <span>SEAL +150 XP</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-zinc-900/80 border border-zinc-800/80 p-4 min-h-[105px] flex flex-col justify-between">
                    {slot.locked && slot.content ? (
                      <p className="text-lg font-medium text-zinc-100 leading-relaxed">
                        "{slot.content}"
                      </p>
                    ) : (
                      <div className="text-base text-zinc-400 italic py-2 flex items-center gap-2">
                        <span>No entry logged yet for this slot today.</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-800/60 text-base font-mono text-zinc-400">
                      <span>{slot.timestamp || 'Ready for entry'}</span>
                      <span className="text-emerald-400 font-bold">+150 XP AWARDED</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Slot Footer Action */}
              {!isEditing && (
                <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  {slot.locked ? (
                    <button
                      onClick={() => unlockSlot(slot.id, slot.content)}
                      className="text-base font-mono text-zinc-300 hover:text-cyan-400 flex items-center gap-2 transition-colors py-2 font-bold"
                    >
                      <Edit3 className="w-5 h-5" />
                      <span>EDIT ENTRY</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => startEditing(slot)}
                      className="w-full py-3.5 px-5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-base font-mono font-bold flex items-center justify-center gap-2.5 transition-all shadow-sm"
                    >
                      <Plus className="w-5 h-5 text-cyan-400" />
                      <span>EQUIP VICTORY</span>
                    </button>
                  )}

                  {slot.locked && (
                    <span className="text-base font-mono text-zinc-400">
                      SHIELD SECURE
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Loadout Management Bottom Bar */}
      <div className="mt-7 pt-5 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-base text-zinc-400">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span>Local storage active: All 3 loadouts automatically auto-save to browser device memory.</span>
        </div>

        <button
          onClick={() => {
            if (confirm('Reset all 3 slots for a new daily rotation? (Current XP will be retained)')) {
              audioEngine.playClick();
              onResetAllSlots();
            }
          }}
          className="text-zinc-400 hover:text-white font-mono text-base transition-colors py-1.5 px-3 rounded-lg hover:bg-zinc-800 font-semibold"
        >
          [CLEAR TODAY'S SLOTS]
        </button>
      </div>
    </section>
  );
};
