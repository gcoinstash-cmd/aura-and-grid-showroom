import React from 'react';
import { AssetPairId } from '../engine/types';
import { ASSET_PAIRS } from '../engine/tickGenerator';

interface TopBarProps {
  activeTab: 'telemetry' | 'audit' | 'statespace' | 'openapi' | 'spec';
  setActiveTab: (tab: 'telemetry' | 'audit' | 'statespace' | 'openapi' | 'spec') => void;
  selectedPair: AssetPairId;
  onSelectPair: (pair: AssetPairId) => void;
  isStreaming: boolean;
  onToggleStreaming: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  selectedPair,
  onSelectPair,
  isStreaming,
  onToggleStreaming,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950 border-b border-slate-800/80 sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a href="#" className="text-base font-bold tracking-tight text-white whitespace-nowrap font-['Plus_Jakarta_Sans']">
          APEX-203
        </a>
        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          / Quant Arbitrage Terminal
        </span>
      </div>

      {/* Zone 2: 4-5 clean single-line navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`hover:text-slate-200 transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'telemetry' ? 'text-cyan-400 border-cyan-400 font-semibold' : 'border-transparent'
          }`}
        >
          Live Telemetry
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`hover:text-slate-200 transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'audit' ? 'text-cyan-400 border-cyan-400 font-semibold' : 'border-transparent'
          }`}
        >
          SHA-256 Audit Log
        </button>
        <button
          onClick={() => setActiveTab('statespace')}
          className={`hover:text-slate-200 transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'statespace' ? 'text-cyan-400 border-cyan-400 font-semibold' : 'border-transparent'
          }`}
        >
          State-Space Matrix
        </button>
        <button
          onClick={() => setActiveTab('openapi')}
          className={`hover:text-slate-200 transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'openapi' ? 'text-cyan-400 border-cyan-400 font-semibold' : 'border-transparent'
          }`}
        >
          OpenAPI 3.1 Spec
        </button>
        <button
          onClick={() => setActiveTab('spec')}
          className={`hover:text-slate-200 transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'spec' ? 'text-cyan-400 border-cyan-400 font-semibold' : 'border-transparent'
          }`}
        >
          Engine Spec (Gate 1-4)
        </button>
      </nav>

      {/* Zone 3: 1 primary action area */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Pair selector */}
        <div className="relative">
          <select
            value={selectedPair}
            onChange={(e) => onSelectPair(e.target.value as AssetPairId)}
            className="bg-slate-900 border border-slate-700/80 text-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-mono cursor-pointer"
          >
            {(Object.keys(ASSET_PAIRS) as AssetPairId[]).map((id) => (
              <option key={id} value={id}>
                {ASSET_PAIRS[id].name}
              </option>
            ))}
          </select>
        </div>

        {/* Primary simulation toggle button */}
        <button
          onClick={onToggleStreaming}
          className={`px-3.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 font-mono flex items-center gap-1.5 ${
            isStreaming
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-emerald-600 text-white hover:bg-emerald-500'
          }`}
        >
          <span>{isStreaming ? 'Pause Stream' : 'Resume Stream'}</span>
        </button>
      </div>
    </header>
  );
};
