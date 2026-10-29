import React from 'react';
import { ToastAlert, NotificationSettings } from '../types';

interface ToastContainerProps {
  toasts: ToastAlert[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  settings: NotificationSettings;
  onToggleSound: () => void;
  onTestSound: () => void;
  onOpenSettings?: () => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  onClearAll,
  settings,
  onToggleSound,
  onTestSound,
  onOpenSettings,
}) => {
  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 max-w-md w-full pointer-events-none"
      aria-live="polite"
    >
      {/* Sound & Notification Control Bar (when toasts exist or toggle hovered) */}
      <div className="pointer-events-auto flex items-center gap-2 bg-zinc-950/95 border border-zinc-800 rounded-lg px-3 py-2 shadow-2xl backdrop-blur-md">
        <button
          onClick={onToggleSound}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all cursor-pointer ${
            settings.soundEnabled
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
              : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
          }`}
          title="Toggle Quant Execution Audio Alerts"
        >
          {settings.soundEnabled ? (
            <>
              <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              <span>Audio Alerts: ON</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
              <span>Audio Alerts: MUTED</span>
            </>
          )}
        </button>

        <button
          onClick={onTestSound}
          className="px-2.5 py-1.5 rounded-md text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
          title="Play sample chime"
        >
          Test Chime
        </button>

        {toasts.length > 0 && (
          <button
            onClick={onClearAll}
            className="px-2.5 py-1.5 rounded-md text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            Clear ({toasts.length})
          </button>
        )}
      </div>

      {/* Render Active Toasts */}
      {toasts.map((toast) => {
        let borderClass = 'border-cyan-500/40 bg-zinc-950/95';
        let badgeClass = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
        let iconBg = 'bg-cyan-500';

        if (toast.severity === 'critical') {
          borderClass = 'border-rose-500/70 bg-zinc-950/95 shadow-[0_0_20px_rgba(244,63,94,0.25)]';
          badgeClass = 'text-rose-300 bg-rose-500/20 border-rose-500/50';
          iconBg = 'bg-rose-500';
        } else if (toast.severity === 'warning') {
          borderClass = 'border-amber-500/60 bg-zinc-950/95 shadow-[0_0_20px_rgba(245,158,11,0.2)]';
          badgeClass = 'text-amber-300 bg-amber-500/20 border-amber-500/40';
          iconBg = 'bg-amber-500';
        } else if (toast.severity === 'success') {
          borderClass = 'border-emerald-500/60 bg-zinc-950/95 shadow-[0_0_20px_rgba(16,185,129,0.2)]';
          badgeClass = 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40';
          iconBg = 'bg-emerald-500';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full border rounded-lg p-4 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${borderClass}`}
            role="alert"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${iconBg} shadow-sm`}></span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold text-zinc-100">{toast.title}</span>
                    <span className={`px-2.5 py-0.5 rounded text-sm font-mono font-semibold border ${badgeClass}`}>
                      {toast.triggerType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300 mt-1 leading-relaxed">{toast.message}</p>
                  
                  {toast.metricValue && (
                    <div className="mt-2 inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-sm font-mono font-bold text-zinc-200">
                      <span>Telemetry Reading:</span>
                      <span className="text-amber-400">{toast.metricValue}</span>
                    </div>
                  )}

                  <div className="text-sm font-mono text-zinc-500 mt-2">
                    {toast.timestamp}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDismiss(toast.id)}
                className="text-zinc-500 hover:text-zinc-200 p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                aria-label="Dismiss alert"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
