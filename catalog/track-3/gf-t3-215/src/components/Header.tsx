import React from 'react';
import { Cpu, RefreshCw } from 'lucide-react';
import { PartitionId, PARTITION_REGISTRY } from '../engine/vectorEngine';

interface HeaderProps {
  activePartition: PartitionId;
  onSelectPartition: (partition: PartitionId) => void;
  onResetEngine: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePartition,
  onSelectPartition,
  onResetEngine,
}) => {
  return (
    <header className="border-b border-slate-800 bg-[#070A11] px-4 py-2">
      {/* Row 1: Inline Command Bar */}
      <div className="flex items-center justify-between gap-2 w-full">
        {/* Left cluster: zero truncation, whitespace-nowrap */}
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shrink-0">
            <Cpu className="h-4 w-4" />
          </div>
          <span className="text-sm sm:text-base font-bold tracking-tight text-slate-100 whitespace-nowrap">
            GF-T3-215 (export)
          </span>
          <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-cyan-950 text-cyan-300 border border-cyan-800 tracking-wider whitespace-nowrap shrink-0">
            TRACK 3 HNSW
          </span>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-1.5 shrink min-w-0">
          <select
            aria-label="Select synthetic vector partition"
            value={activePartition}
            onChange={(e) => onSelectPartition(e.target.value as PartitionId)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-[11px] rounded px-2 py-1 max-w-[130px] font-mono focus:outline-none focus:border-cyan-500 truncate"
          >
            {Object.keys(PARTITION_REGISTRY).map((pKey) => (
              <option key={pKey} value={pKey}>
                {PARTITION_REGISTRY[pKey as PartitionId].name}
              </option>
            ))}
          </select>

          <button
            onClick={onResetEngine}
            className="px-2 py-1 text-[11px] font-bold shrink-0 flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 rounded transition-colors whitespace-nowrap cursor-pointer"
            title="Re-index vector topology"
          >
            <RefreshCw className="h-3 w-3" />
            <span>[Re-index]</span>
          </button>
        </div>
      </div>

      {/* Row 2: Subtitle */}
      <div className="text-xs text-slate-400 mt-0.5">
        HNSW Skip-Graph · Product Quantization (PQ) · Asymmetric Distance (ADC) · O(log N)
      </div>
    </header>
  );
};
