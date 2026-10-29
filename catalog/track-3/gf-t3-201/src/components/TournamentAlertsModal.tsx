import React, { useState, useEffect } from 'react';
import { X, Bell, BellOff, Volume2, ShieldAlert, CheckCircle2, Sliders, Zap, ArrowLeft } from 'lucide-react';
import { TournamentAlert } from '../types';
import { audioEngine } from '../utils/audio';

interface TournamentAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: TournamentAlert[];
  onToggleAlert: (alertId: string) => void;
}

export const TournamentAlertsModal: React.FC<TournamentAlertsModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onToggleAlert
}) => {
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [quietHours, setQuietHours] = useState(true);

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

  const handleTestPing = () => {
    audioEngine.playSlotLock();
    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 2500);
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
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sticky Top Close Header */}
        <div className="sticky top-0 z-20 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 p-4 sm:p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Raid Alerts Center</h3>
              <span className="text-base font-mono text-zinc-400">NOTIFICATION CHANNELS</span>
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
          
          {/* Sensory Overload Filter Option */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <div className="text-lg font-bold text-zinc-100">Anti-Dopamine Burnout Filter</div>
                <div className="text-base text-zinc-400 mt-0.5">Mutes non-critical pings during late-night gaming sessions (10 PM – 8 AM)</div>
              </div>
            </div>
            <button
              onClick={() => {
                audioEngine.playClick();
                setQuietHours(!quietHours);
              }}
              className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 shrink-0 ${
                quietHours ? 'bg-cyan-500' : 'bg-zinc-800'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full bg-zinc-950 transition-transform ${
                  quietHours ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Alert Toggles List */}
          <div className="space-y-4">
            <div className="text-base font-mono text-zinc-400 tracking-wider font-bold">
              ACTIVE NOTIFICATION DISPATCH CHANNELS:
            </div>

            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-5 ${
                  alert.enabled
                    ? 'bg-zinc-900/70 border-zinc-800 text-zinc-200'
                    : 'bg-zinc-950 border-zinc-900 text-zinc-500 opacity-60'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-mono font-bold text-cyan-400">
                      {alert.title}
                    </span>
                    <span className="text-base font-mono px-3 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 font-medium">
                      {alert.time}
                    </span>
                  </div>
                  <p className="text-base sm:text-lg text-zinc-300 leading-relaxed">
                    {alert.message}
                  </p>
                </div>

                <button
                  onClick={() => {
                    audioEngine.playClick();
                    onToggleAlert(alert.id);
                  }}
                  className={`py-2.5 px-4 rounded-xl border text-base font-mono font-bold transition-colors shrink-0 ${
                    alert.enabled
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {alert.enabled ? 'ACTIVE' : 'MUTED'}
                </button>
              </div>
            ))}
          </div>

          {/* Test Ping Section */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800">
            <div className="text-base text-zinc-400">
              {testNotificationSent ? (
                <span className="text-emerald-400 font-mono font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Audio Ping Dispatched Successfully
                </span>
              ) : (
                <span>Audio synthesize ping test available for headset checks.</span>
              )}
            </div>

            <button
              onClick={handleTestPing}
              className="py-3 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-mono text-base font-bold flex items-center gap-2.5 transition-colors"
            >
              <Volume2 className="w-5 h-5 text-cyan-400" />
              <span>TRIGGER TEST PING</span>
            </button>
          </div>

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
