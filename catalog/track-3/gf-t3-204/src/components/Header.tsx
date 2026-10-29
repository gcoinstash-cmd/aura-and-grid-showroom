import React from 'react';

interface HeaderProps {
  activeTab: 'cockpit' | 'trajectory' | 'audit' | 'openapi';
  setActiveTab: (tab: 'cockpit' | 'trajectory' | 'audit' | 'openapi') => void;
  onInjectMillionOrder: () => void;
  isExecuting: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenAlertSettings: () => void;
  alertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onInjectMillionOrder,
  isExecuting,
  soundEnabled,
  onToggleSound,
  onOpenAlertSettings,
  alertCount,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 bg-zinc-950 border-b border-zinc-800/80 sticky top-0 z-40">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a href="#cockpit" className="text-lg font-bold tracking-tight text-zinc-100 whitespace-nowrap shrink-0 flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-cyan-400 inline-block shadow-[0_0_10px_rgba(6,182,212,0.5)]"></span>
          <span>APEX-204 Execution Engine</span>
        </a>
        <span className="text-sm text-zinc-500 font-mono hidden lg:inline">Track 3 Quant SOR</span>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
        <button
          onClick={() => setActiveTab('cockpit')}
          className={`hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'cockpit' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Execution Cockpit
        </button>
        <button
          onClick={() => setActiveTab('trajectory')}
          className={`hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'trajectory' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Trajectory & Slicing
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'audit' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Audit Ledger
        </button>
        <button
          onClick={() => setActiveTab('openapi')}
          className={`hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'openapi' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          OpenAPI Specification
        </button>
      </nav>

      {/* Zone 3: Primary Action & Alert Controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Sound Toggle */}
        <button
          onClick={onToggleSound}
          className={`min-h-[44px] px-3.5 py-2 rounded-md text-sm font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
            soundEnabled
              ? 'bg-zinc-900 text-cyan-300 border-cyan-500/40 hover:bg-zinc-800'
              : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
          }`}
          title={soundEnabled ? 'Audio Alerts Enabled' : 'Audio Alerts Muted'}
        >
          {soundEnabled ? (
            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          )}
          <span className="hidden sm:inline font-mono">{soundEnabled ? 'Audio' : 'Muted'}</span>
        </button>

        {/* Alert Thresholds Settings Button */}
        <button
          onClick={onOpenAlertSettings}
          className="min-h-[44px] px-3.5 py-2 rounded-md text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-all cursor-pointer flex items-center gap-2"
          title="Configure Slippage & Telemetry Thresholds"
        >
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="hidden sm:inline font-mono">Alerts</span>
          {alertCount > 0 && (
            <span className="px-1.5 py-0.5 rounded text-sm font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {alertCount}
            </span>
          )}
        </button>

        {/* Primary Action Button (min-h-[44px], text-base font-bold, ZERO DOLLAR COMPLIANCE) */}
        <button
          onClick={onInjectMillionOrder}
          disabled={isExecuting}
          className="min-h-[44px] px-5 py-2.5 text-base font-bold text-zinc-950 bg-cyan-400 hover:bg-cyan-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-md transition-all whitespace-nowrap shrink-0 shadow-[0_0_14px_rgba(34,211,238,0.25)] flex items-center gap-2 cursor-pointer"
        >
          <span>Inject 1M Notional Parent Order</span>
        </button>
      </div>
    </header>
  );
};
