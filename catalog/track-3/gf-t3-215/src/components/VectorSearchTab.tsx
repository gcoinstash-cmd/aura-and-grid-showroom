import React, { useState } from 'react';
import { SearchResult, VectorIndexEngine } from '../engine/vectorEngine';
import { Search, CheckCircle2, XCircle, Sliders, Play, RefreshCw, BarChart2, AlertCircle } from 'lucide-react';

interface VectorSearchTabProps {
  engine: VectorIndexEngine;
  searchResult: SearchResult | null;
  onExecuteSearch: (k: number, ef: number) => void;
  onRandomizeQuery: () => void;
}

export const VectorSearchTab: React.FC<VectorSearchTabProps> = ({
  engine,
  searchResult,
  onExecuteSearch,
  onRandomizeQuery,
}) => {
  const [kParam, setKParam] = useState<number>(10);
  const [efParam, setEfParam] = useState<number>(64);

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Search Query Control Console */}
      <div className="rounded-lg border border-slate-800 bg-[#090D18] p-5">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 mb-4 gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Search className="h-5 w-5 text-cyan-400" />
              Interactive Query Vector Runner & Recall Evaluator
            </h2>
            <div className="text-sm text-slate-400 mt-1">
              Deterministic comparison of HNSW heuristic search against exhaustive brute-force L2 ground truth
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRandomizeQuery}
              className="min-h-[44px] px-5 py-2.5 text-base font-bold flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="h-4 w-4 text-cyan-400" />
              <span>Randomize Query Vector</span>
            </button>

            <button
              onClick={() => onExecuteSearch(kParam, efParam)}
              className="min-h-[44px] px-5 py-2.5 text-base font-bold flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Execute Search & Benchmark Recall</span>
            </button>
          </div>
        </div>

        {/* Hyperparameter Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* K Nearest Neighbors */}
          <div>
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-slate-300 font-semibold">Top-K Nearest Neighbors:</span>
              <span className="font-mono text-cyan-400 font-bold">{kParam} Hits</span>
            </div>
            <input
              type="range"
              min="5"
              max="20"
              step="1"
              value={kParam}
              onChange={(e) => setKParam(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-sm text-slate-400 mt-1">
              <span>5</span>
              <span>10 (Default)</span>
              <span>20</span>
            </div>
          </div>

          {/* Search Width ef */}
          <div>
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-slate-300 font-semibold">Search Width (ef_search):</span>
              <span className="font-mono text-amber-400 font-bold">{efParam} Candidates</span>
            </div>
            <input
              type="range"
              min="16"
              max="128"
              step="16"
              value={efParam}
              onChange={(e) => setEfParam(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-sm text-slate-400 mt-1">
              <span>16 (Fastest)</span>
              <span>64 (Balanced)</span>
              <span>128 (Ultra-Recall)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Benchmark Summary Telemetry Strip */}
      {searchResult && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-slate-800 bg-[#090D18] p-4 flex items-center justify-between">
            <div>
              <span className="text-sm text-slate-400 block">Measured Recall@{kParam}:</span>
              <span className="text-3xl font-bold font-mono text-emerald-400">
                {searchResult.recallAtK.toFixed(1)}%
              </span>
            </div>
            <CheckCircle2 className="h-8 w-8 text-emerald-500/60" />
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#090D18] p-4 flex items-center justify-between">
            <div>
              <span className="text-sm text-slate-400 block">Search Latency:</span>
              <span className="text-3xl font-bold font-mono text-slate-100">
                {searchResult.searchLatencyMs.toFixed(2)} <span className="text-base text-slate-400">ms</span>
              </span>
            </div>
            <BarChart2 className="h-8 w-8 text-cyan-500/60" />
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#090D18] p-4 flex items-center justify-between">
            <div>
              <span className="text-sm text-slate-400 block">Candidates Evaluated:</span>
              <span className="text-3xl font-bold font-mono text-violet-400">
                {searchResult.evaluatedCandidates} <span className="text-base text-slate-400">Nodes</span>
              </span>
            </div>
            <Sliders className="h-8 w-8 text-violet-500/60" />
          </div>
        </div>
      )}

      {/* Dual-Column ANN vs Brute-Force L2 Divergence Diff Table */}
      <div className="rounded-lg border border-slate-800 bg-[#090D18] overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-[#0B1120]">
          <h3 className="text-base font-bold text-slate-100">
            ANN vs. Exact Brute-Force L2 Divergence Diff Matrix
          </h3>
          <div className="text-sm text-slate-400 mt-0.5">
            Side-by-side Top-10 vector ID ranking comparison with MATCH and RANK DISPLACED badges
          </div>
        </div>

        {searchResult ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-[#070A11] text-slate-400 font-medium">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">HNSW ANN Node ID (Dist)</th>
                  <th className="py-3 px-4">Exact Brute-Force L2 Truth (Dist)</th>
                  <th className="py-3 px-4">Divergence Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {searchResult.topK.map((annItem, idx) => {
                  const gtItem = searchResult.groundTruthTopK[idx];
                  const isExactMatch = gtItem && gtItem.id === annItem.id;
                  const existsInGt = searchResult.groundTruthTopK.some((g) => g.id === annItem.id);

                  return (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4 text-slate-300 font-bold">#{annItem.rank}</td>
                      
                      {/* ANN Column */}
                      <td className="py-3.5 px-4">
                        <span className="text-cyan-300 font-semibold">Node #{annItem.id}</span>
                        <span className="text-slate-400 text-xs ml-2">({annItem.distance.toFixed(4)})</span>
                      </td>

                      {/* Ground Truth Column */}
                      <td className="py-3.5 px-4">
                        {gtItem ? (
                          <>
                            <span className="text-amber-300 font-semibold">Node #{gtItem.id}</span>
                            <span className="text-slate-400 text-xs ml-2">({gtItem.distance.toFixed(4)})</span>
                          </>
                        ) : (
                          <span className="text-slate-500">N/A</span>
                        )}
                      </td>

                      {/* Divergence Diff Status Badge */}
                      <td className="py-3.5 px-4">
                        {isExactMatch ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-semibold bg-emerald-950/70 border border-emerald-800 text-emerald-300">
                            <CheckCircle2 className="h-4 w-4" />
                            MATCH
                          </span>
                        ) : existsInGt ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-semibold bg-amber-950/70 border border-amber-800 text-amber-300">
                            <AlertCircle className="h-4 w-4" />
                            RANK DISPLACED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-semibold bg-rose-950/70 border border-rose-800 text-rose-300">
                            <XCircle className="h-4 w-4" />
                            HEURISTIC DIVERGENCE
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-sm">
            Click "Execute Search & Benchmark Recall" to evaluate active query vectors.
          </div>
        )}
      </div>
    </div>
  );
};
