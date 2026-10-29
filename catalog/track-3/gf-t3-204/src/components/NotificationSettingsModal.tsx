import React from 'react';
import { NotificationSettings, ToastAlert } from '../types';
import { playQuantAlert } from '../lib/sound';

interface NotificationSettingsModalProps {
  settings: NotificationSettings;
  setSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  onClose: () => void;
  alertHistory: ToastAlert[];
  onClearHistory: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  settings,
  setSettings,
  onClose,
  alertHistory,
  onClearHistory,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-sm bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
            <div>
              <h2 className="text-base font-bold text-zinc-100 uppercase tracking-wider">
                Telemetry Alert & Sound Thresholds
              </h2>
              <div className="text-sm text-zinc-400 font-mono">
                Real-Time Execution Boundary Monitors
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 text-sm px-3 py-1.5 rounded hover:bg-zinc-800 cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-base">
          {/* Audio Master Control */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 flex items-center justify-between gap-4">
            <div>
              <div className="font-bold text-zinc-100">Audio Synthesizer Status</div>
              <div className="text-sm text-zinc-400 mt-0.5">
                Emits synthetic algorithmic alerts via Web Audio API when thresholds are crossed.
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
                className={`min-h-[44px] px-5 py-2.5 rounded-md text-base font-bold transition-all cursor-pointer ${
                  settings.soundEnabled
                    ? 'bg-cyan-500 text-zinc-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}
              >
                {settings.soundEnabled ? 'Audio: ENABLED' : 'Audio: MUTED'}
              </button>
            </div>
          </div>

          {/* Sound Preview Tests */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-4 space-y-3">
            <div className="text-sm font-semibold text-zinc-300 uppercase tracking-wide font-mono">
              Test Audio Alerts
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => playQuantAlert('slippage_breach', true)}
                className="min-h-[44px] px-4 py-2.5 rounded bg-zinc-900 hover:bg-zinc-800 text-rose-300 border border-rose-900/60 text-sm font-mono font-semibold flex items-center justify-between cursor-pointer"
              >
                <span>Slippage Warning Alert</span>
                <span className="text-xs text-rose-400">Play ▶</span>
              </button>

              <button
                onClick={() => playQuantAlert('order_complete', true)}
                className="min-h-[44px] px-4 py-2.5 rounded bg-zinc-900 hover:bg-zinc-800 text-emerald-300 border border-emerald-900/60 text-sm font-mono font-semibold flex items-center justify-between cursor-pointer"
              >
                <span>Order Complete Chime</span>
                <span className="text-xs text-emerald-400">Play ▶</span>
              </button>
            </div>
          </div>

          {/* Configurable Threshold Rules */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-zinc-300 uppercase tracking-wide font-mono">
              Alert Trigger Conditions
            </div>

            {/* Rule 1: Slippage Threshold */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-200">Adverse Slippage Threshold</div>
                  <div className="text-sm text-zinc-400">
                    Triggers high-priority alert when execution slippage breaches target level.
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={settings.notifyOnSlippageBreach}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, notifyOnSlippageBreach: e.target.checked }))
                  }
                  className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <span className="text-sm font-mono text-zinc-400">Breach Limit:</span>
                {[5.0, 8.0, 10.0, 15.0].map((bps) => (
                  <button
                    key={bps}
                    onClick={() => setSettings((s) => ({ ...s, slippageThresholdBps: bps }))}
                    className={`px-3 py-1.5 rounded text-sm font-mono font-semibold transition-all cursor-pointer ${
                      settings.slippageThresholdBps === bps
                        ? 'bg-rose-500 text-zinc-950 font-bold'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    &gt; {bps.toFixed(1)} bps
                  </button>
                ))}
              </div>
            </div>

            {/* Rule 2: Parent Order Completion */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-zinc-200">Parent Order Complete</div>
                <div className="text-sm text-zinc-400">
                  Fires completion chime when all child slices achieve 100% fill status.
                </div>
              </div>

              <input
                type="checkbox"
                checked={settings.notifyOnOrderComplete}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, notifyOnOrderComplete: e.target.checked }))
                }
                className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
              />
            </div>

            {/* Rule 3: Sudden Volume Spike */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-zinc-200">Intraday Volume Shock</div>
                <div className="text-sm text-zinc-400">
                  Alerts on liquidity shock injection requiring schedule recalibration.
                </div>
              </div>

              <input
                type="checkbox"
                checked={settings.notifyOnVolumeShock}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, notifyOnVolumeShock: e.target.checked }))
                }
                className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
              />
            </div>

            {/* Rule 4: Spread Widening */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-zinc-200">Bid-Ask Spread Widening</div>
                <div className="text-sm text-zinc-400">
                  Warns when crossing costs widen to 15.0 bps under market stress.
                </div>
              </div>

              <input
                type="checkbox"
                checked={settings.notifyOnSpreadWidening}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, notifyOnSpreadWidening: e.target.checked }))
                }
                className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Historical Alert Log */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-300 uppercase tracking-wide font-mono">
                Recent Alert History ({alertHistory.length})
              </span>
              {alertHistory.length > 0 && (
                <button
                  onClick={onClearHistory}
                  className="text-sm text-zinc-400 hover:text-zinc-200 font-mono cursor-pointer"
                >
                  Clear History
                </button>
              )}
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-lg max-h-48 overflow-y-auto divide-y divide-zinc-800/60">
              {alertHistory.length === 0 ? (
                <div className="p-4 text-center text-sm text-zinc-500 font-mono">
                  No alerts recorded in this session.
                </div>
              ) : (
                alertHistory.map((item) => (
                  <div key={item.id} className="p-3 text-sm flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-zinc-200">{item.title}</span>
                      <span className="text-zinc-400 block text-sm">{item.message}</span>
                    </div>
                    <span className="text-sm font-mono text-zinc-500">{item.timestamp}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-end">
          <button
            onClick={onClose}
            className="min-h-[44px] px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold rounded text-base cursor-pointer transition-all"
          >
            Save &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
