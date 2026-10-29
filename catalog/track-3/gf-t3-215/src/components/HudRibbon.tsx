import React from 'react';
import { Layers, Zap, Target, Database } from 'lucide-react';
import { PartitionMeta } from '../engine/vectorEngine';

interface HudRibbonProps {
  partition: PartitionMeta;
  searchLatencyMs: number;
  recallAt10: number;
  totalIndexedVectors: number;
}

export const HudRibbon: React.FC<HudRibbonProps> = ({
  partition,
  searchLatencyMs,
  recallAt10,
  totalIndexedVectors,
}) => {
  return (
    <div className="px-4 bg-[#070A11]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-3 w-full">
        {/* Card 1: Active Partition */}
        <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Partition</span>
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-bold tracking-tight text-cyan-400 font-mono truncate" title={partition.id}>
              {partition.id}
            </div>
            <div className="text-xs text-slate-400 mt-0.5 truncate">
              {partition.distributionType} · {partition.dimension}D
            </div>
          </div>
        </div>

        {/* Card 2: Search Latency */}
        <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Search Latency</span>
            <Zap className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 font-mono tabular-nums">
              {searchLatencyMs.toFixed(2)} <span className="text-xs font-normal text-slate-400">ms</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 truncate">
              Top-10 ef=64 · O(log N)
            </div>
          </div>
        </div>

        {/* Card 3: Recall@10 */}
        <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Recall@10</span>
            <Target className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-400 font-mono tabular-nums">
              {recallAt10.toFixed(1)} <span className="text-xs font-normal text-slate-400">%</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 truncate">
              vs Exact Brute-Force L2
            </div>
          </div>
        </div>

        {/* Card 4: Total Indexed Vectors with Quantization Compression Chip */}
        <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Indexed Corpus</span>
            <Database className="h-3.5 w-3.5 text-violet-400" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 font-mono tabular-nums">
              {totalIndexedVectors.toLocaleString()} <span className="text-xs font-normal text-slate-400">Units</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5 truncate">
              <span className="text-slate-400">Target: {partition.totalVectors.toLocaleString()}</span>
              <span className="text-cyan-400 font-mono text-[10px] bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800/60 whitespace-nowrap">
                16x PQ Compression · 24.2 MB Footprint
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
