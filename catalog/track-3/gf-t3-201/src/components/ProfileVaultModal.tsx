import React, { useState, useEffect } from 'react';
import { X, BookmarkCheck, Download, Upload, Shield, Trash2, Check, RefreshCw, ArrowLeft, Zap } from 'lucide-react';
import { Perk, PlayerStats, LoadoutSlotData, DayLog } from '../types';
import { audioEngine } from '../utils/audio';

interface ProfileVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultPerks: Perk[];
  onRemoveVaultPerk: (perkId: string) => void;
  stats: PlayerStats;
  slots: LoadoutSlotData[];
  logs: DayLog[];
  onImportData: (data: { stats: PlayerStats; slots: LoadoutSlotData[]; vaultPerks: Perk[]; logs: DayLog[] }) => void;
}

export const ProfileVaultModal: React.FC<ProfileVaultModalProps> = ({
  isOpen,
  onClose,
  vaultPerks,
  onRemoveVaultPerk,
  stats,
  slots,
  logs,
  onImportData
}) => {
  const [activeTab, setActiveTab] = useState<'vault' | 'backup'>('vault');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Wire Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        audioEngine.playClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleExportJson = () => {
    audioEngine.playSlotLock();
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      stats,
      slots,
      vaultPerks,
      logs
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `titan-core-backup-lvl${stats.level}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.stats && parsed.slots) {
          onImportData({
            stats: parsed.stats,
            slots: parsed.slots,
            vaultPerks: parsed.vaultPerks || [],
            logs: parsed.logs || []
          });
          audioEngine.playOvercharge();
          setImportStatus('Backup profile restored successfully!');
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('Invalid backup file structure.');
        }
      } catch {
        setImportStatus('Error parsing JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          audioEngine.playClick();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
    >
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sticky Top Close Header */}
        <div className="sticky top-0 z-20 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 p-4 sm:p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Codex Vault & Backups</h3>
              <span className="text-base font-mono text-zinc-400">ENCRYPTED DATA MODULE</span>
            </div>
          </div>

          <button
            onClick={() => {
              audioEngine.playClick();
              onClose();
            }}
            className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-mono text-base font-bold flex items-center gap-2 transition-all hover:border-cyan-400 shadow-md"
            title="Close modal (Escape)"
          >
            <X className="w-5 h-5 text-cyan-400" />
            <span>✕ CLOSE COCKPIT (ESC)</span>
          </button>
        </div>

        {/* Scrollable Modal Content Container */}
        <div className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-6">
          
          {/* Sub-Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl w-fit">
            <button
              onClick={() => {
                audioEngine.playClick();
                setActiveTab('vault');
              }}
              className={`py-2.5 px-5 text-base font-mono font-bold rounded-xl transition-colors ${
                activeTab === 'vault' ? 'bg-zinc-800 text-cyan-300 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              SAVED PERKS ({vaultPerks.length})
            </button>
            <button
              onClick={() => {
                audioEngine.playClick();
                setActiveTab('backup');
              }}
              className={`py-2.5 px-5 text-base font-mono font-bold rounded-xl transition-colors ${
                activeTab === 'backup' ? 'bg-zinc-800 text-cyan-300 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              DATA BACKUP & SYNC
            </button>
          </div>

          {/* Tab 1: Saved Perks */}
          {activeTab === 'vault' && (
            <div className="space-y-4">
              {vaultPerks.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-zinc-800 rounded-3xl p-8">
                  <BookmarkCheck className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                  <div className="text-lg font-bold text-zinc-300">Your Codex Vault is empty</div>
                  <div className="text-base text-zinc-500 mt-2 max-w-sm mx-auto leading-relaxed">
                    Hit the "Save" button on any perk card in the deck to store it here for quick recall.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {vaultPerks.map((perk) => (
                    <div
                      key={perk.id}
                      className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between text-base font-mono mb-2">
                          <span className="text-cyan-400 font-bold">{perk.title}</span>
                          <span className="text-amber-400 font-bold">{perk.rarity}</span>
                        </div>
                        {perk.synergyTag && (
                          <div className="mb-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-sm font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <Zap className="w-3.5 h-3.5 text-amber-400" />
                              <span>SYNERGY: {perk.synergyTag}</span>
                            </span>
                          </div>
                        )}
                        <blockquote className="text-lg font-bold text-white leading-snug">
                          “{perk.affirmation}”
                        </blockquote>
                        <p className="text-base text-zinc-300 mt-2 leading-relaxed">
                          {perk.subtext}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-base font-mono">
                        <span className="text-emerald-400 font-bold">{perk.statBonus}</span>
                        <button
                          onClick={() => {
                            audioEngine.playClick();
                            onRemoveVaultPerk(perk.id);
                          }}
                          className="text-zinc-400 hover:text-red-400 transition-colors p-2"
                          title="Remove from Codex"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Data Backup & Cloud Sync */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-5">
                <div>
                  <h4 className="text-lg font-bold text-white flex items-center gap-2.5">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <span>Zero-Data-Loss Local & Cloud Backups</span>
                  </h4>
                  <p className="text-base sm:text-lg text-zinc-300 mt-1.5 max-w-xl leading-relaxed">
                    Titan Core never tracks personal data. All affirmations, victory logs, and stats are preserved safely in your device local storage. Export full profile snapshots anytime to sync across devices.
                  </p>
                </div>

                {/* Status Message */}
                {importStatus && (
                  <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-base font-mono font-bold">
                    {importStatus}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <button
                    onClick={handleExportJson}
                    className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-left transition-colors group"
                  >
                    <div className="flex items-center justify-between text-base font-mono font-bold text-cyan-400 mb-1.5">
                      <span>DOWNLOAD BACKUP JSON</span>
                      <Download className="w-5 h-5 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <div className="text-base text-zinc-300 leading-relaxed">
                      Export your current XP, level, streak, logs, and saved perks into a portable file.
                    </div>
                  </button>

                  <label className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-left transition-colors group cursor-pointer block">
                    <div className="flex items-center justify-between text-base font-mono font-bold text-emerald-400 mb-1.5">
                      <span>RESTORE BACKUP FILE</span>
                      <Upload className="w-5 h-5 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <div className="text-base text-zinc-300 leading-relaxed">
                      Upload an existing .json backup to restore previous player statistics.
                    </div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportJson}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Simulated Cloud Sync Check */}
              <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between text-base">
                <div className="flex items-center gap-3 text-zinc-300">
                  <RefreshCw className="w-5 h-5 text-emerald-400" />
                  <span>Offline-first local cache active. Automatic local persistent sync enabled.</span>
                </div>
                <span className="font-mono text-emerald-400 text-base font-bold">STATUS: SYNCED</span>
              </div>
            </div>
          )}

        </div>

        {/* Pinned Bottom Action Bar */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/95 shrink-0 flex items-center justify-between gap-4">
          <div className="text-base text-zinc-400">
            Press <kbd className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono text-base">Esc</kbd> or click outside to dismiss.
          </div>

          <button
            onClick={() => {
              audioEngine.playClick();
              onClose();
            }}
            className="py-3 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-base font-mono flex items-center gap-2.5 transition-all shadow-md active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>EXIT TO COCKPIT</span>
          </button>
        </div>

      </div>
    </div>
  );
};
