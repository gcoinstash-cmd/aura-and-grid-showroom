import React from 'react';
import { FileCode, Layers } from 'lucide-react';
import { SyntheticAssetPair } from '../types/microstructure';

interface TopBarProps {
  currentPair: SyntheticAssetPair;
  onSelectPair: (pair: SyntheticAssetPair) => void;
  onOpenDossier: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentPair,
  onSelectPair,
  onOpenDossier,
}) => {
  return (
    <header className="flex items-center justify-between gap-4 px-6 py-3.5 bg-[#090D18] border-b border-slate-800 text-slate-100 shrink-0">
      {/* Zone 1: Brand wordmark & Track 3 Reference Core badge */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#dashboard"
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap hover:text-cyan-400 transition-colors"
        >
          APEX-210 MICROSTRUCTURE
        </a>
        <span className="px-2.5 py-0.5 bg-cyan-950 border border-cyan-800 rounded text-xs font-mono font-bold text-cyan-300">
          Track 3 Reference Core
        </span>
      </div>

      {/* Zone 2: Asset Pair Selector */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-md text-sm font-mono text-slate-300 shrink-0">
        <Layers className="w-4 h-4 text-cyan-400" />
        <select
          value={currentPair}
          onChange={(e) => onSelectPair(e.target.value as SyntheticAssetPair)}
          className="bg-transparent border-none text-sm font-mono text-slate-200 focus:outline-none cursor-pointer"
        >
          <option value="SYNTH-LOB-01 (CORE-LIQ / BASE-UNIT)" className="bg-slate-900 text-slate-100">
            SYNTH-LOB-01 (CORE-LIQ / BASE-UNIT)
          </option>
          <option value="FAST-BOOK-ALPHA (HIGH-FREQ-INDEX / BENCH)" className="bg-slate-900 text-slate-100">
            FAST-BOOK-ALPHA (HIGH-FREQ-INDEX / BENCH)
          </option>
          <option value="CROSS-VENUE-DELTA (INSTITUTIONAL-SPREAD)" className="bg-slate-900 text-slate-100">
            CROSS-VENUE-DELTA (INSTITUTIONAL-SPREAD)
          </option>
        </select>
      </div>

      {/* Zone 3: Primary Action Button with compact padding and shrink-0 */}
      <div className="flex items-center shrink-0">
        <button
          onClick={onOpenDossier}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-cyan-950"
        >
          <FileCode className="w-4 h-4 text-slate-950" />
          <span>[Buyout Dossier & Spec]</span>
        </button>
      </div>
    </header>
  );
};
