import React from 'react';
import { Search, PlusCircle, AlertTriangle, Scissors, RotateCcw } from 'lucide-react';

interface ChaosBarProps {
  onRunQuery: () => void;
  onHeavyIngestion: () => void;
  onSimulateDrift: () => void;
  onPruneLinks: () => void;
  onRecalibrate: () => void;
  isDrifting: boolean;
}

export const ChaosBar: React.FC<ChaosBarProps> = ({
  onRunQuery,
  onHeavyIngestion,
  onSimulateDrift,
  onPruneLinks,
  onRecalibrate,
  isDrifting,
}) => {
  return (
    <div className="bg-[#0A0F1D] px-4 py-1.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <span className="font-semibold text-slate-300">Chaos Engine:</span>
        <span className="hidden sm:inline">Stress-testing & graph re-balancing</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {/* Trigger 1: Query Nearest Neighbors */}
        <button
          onClick={onRunQuery}
          className="text-[10px] px-2 py-0.5 font-bold flex items-center gap-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="Execute active ANN query against HNSW graph"
        >
          <Search className="h-3 w-3" />
          <span>Query (K=10, ef=64)</span>
        </button>

        {/* Trigger 2: Force Heavy Vector Ingestion */}
        <button
          onClick={onHeavyIngestion}
          className="text-[10px] px-2 py-0.5 font-bold flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="Inject 24 synthetic vectors into the HNSW index"
        >
          <PlusCircle className="h-3 w-3 text-emerald-400" />
          <span>Force Ingestion</span>
        </button>

        {/* Trigger 3: Simulate Codebook Centroid Drift */}
        <button
          onClick={onSimulateDrift}
          className="text-[10px] px-2 py-0.5 font-bold flex items-center gap-1 rounded bg-slate-800 hover:bg-amber-950/60 text-slate-200 border border-slate-700 hover:border-amber-600/60 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="Perturb centroid Voronoi codebooks to test degradation"
        >
          <AlertTriangle className="h-3 w-3 text-amber-400" />
          <span>Simulate Drift</span>
        </button>

        {/* Trigger 4: Prune Stale Node Links */}
        <button
          onClick={onPruneLinks}
          className="text-[10px] px-2 py-0.5 font-bold flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="Prune edges exceeding target heuristic degree threshold"
        >
          <Scissors className="h-3 w-3 text-violet-400" />
          <span>Prune Links</span>
        </button>

        {/* Reset / Re-calibrate if drifting */}
        {isDrifting && (
          <button
            onClick={onRecalibrate}
            className="text-[10px] px-2 py-0.5 font-bold flex items-center gap-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title="Re-calibrate centroid codebooks back to zero drift"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Re-calibrate</span>
          </button>
        )}
      </div>
    </div>
  );
};
