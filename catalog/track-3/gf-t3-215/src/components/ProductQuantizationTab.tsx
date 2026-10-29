import React, { useState } from 'react';
import { VectorIndexEngine } from '../engine/vectorEngine';
import { Layers, HardDrive, Cpu, HelpCircle, ArrowRight } from 'lucide-react';

interface ProductQuantizationTabProps {
  engine: VectorIndexEngine;
  activeQuery: Float32Array;
}

export const ProductQuantizationTab: React.FC<ProductQuantizationTabProps> = ({
  engine,
  activeQuery,
}) => {
  const stats = engine.getCodebookStats();
  const [selectedSubspace, setSelectedSubspace] = useState<number>(0);
  const [inspectedCentroid, setInspectedCentroid] = useState<number | null>(0);

  // Compute live ADC Lookup Table for active query
  const adcLut = engine.computeADCLookupTable(activeQuery);

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Memory Compression Card */}
        <div className="rounded-lg border border-slate-800 bg-[#090D18] p-5">
          <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
            <span className="font-semibold text-slate-200">Memory Footprint Compression</span>
            <HardDrive className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold tracking-tight text-cyan-400 font-mono">
            {stats.compressionRatio}x <span className="text-base font-normal text-slate-400">Reduction</span>
          </div>
          <div className="text-sm text-slate-400 mt-2">
            Raw Float32: <span className="text-slate-200 font-mono">{stats.rawVectorBytes} Bytes</span> / vector
            <br />
            Quantized Code: <span className="text-emerald-400 font-mono">{stats.quantizedVectorBytes} Bytes</span> / vector
          </div>
        </div>

        {/* Subspace Decomposition Card */}
        <div className="rounded-lg border border-slate-800 bg-[#090D18] p-5">
          <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
            <span className="font-semibold text-slate-200">Orthogonal Sub-spaces</span>
            <Layers className="h-5 w-5 text-violet-400" />
          </div>
          <div className="text-3xl font-bold tracking-tight text-violet-400 font-mono">
            {stats.mSubspaces} <span className="text-base font-normal text-slate-400">Sub-vectors</span>
          </div>
          <div className="text-sm text-slate-400 mt-2">
            Sub-vector Dim: <span className="text-slate-200 font-mono">{stats.subvectorDim} Dimensions</span>
            <br />
            Voronoi Centroids: <span className="text-slate-200 font-mono">{stats.kCentroids} Centroids</span> per sub-space
          </div>
        </div>

        {/* Asymmetric Distance Advantage Card */}
        <div className="rounded-lg border border-slate-800 bg-[#090D18] p-5">
          <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
            <span className="font-semibold text-slate-200">ADC Computational Velocity</span>
            <Cpu className="h-5 w-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold tracking-tight text-amber-400 font-mono">
            Zero <span className="text-base font-normal text-slate-400">Decompression</span>
          </div>
          <div className="text-sm text-slate-400 mt-2">
            Lookup Complexity: <span className="text-slate-200 font-mono">O(M)</span> additions only
            <br />
            Precomputed Table: <span className="text-slate-200 font-mono">{stats.mSubspaces} x 256 LUT floats</span>
          </div>
        </div>
      </div>

      {/* Main Grid: ADC Lookup Table Heatmap & Centroid Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ADC Precalculated Lookup Matrix Heatmap */}
        <div className="lg:col-span-2 rounded-lg border border-slate-800 bg-[#090D18] p-5 flex flex-col">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Asymmetric Distance Computation (ADC) Lookup Matrix
              </h2>
              <div className="text-sm text-slate-400 mt-0.5">
                Precalculated squared distance between query sub-vectors and 256 Voronoi centroids
              </div>
            </div>

            {/* Subspace Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Subspace:</span>
              <select
                aria-label="Select subspace for ADC inspection"
                value={selectedSubspace}
                onChange={(e) => setSelectedSubspace(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded px-3 py-1.5 font-mono focus:outline-none focus:border-cyan-500"
              >
                {Array.from({ length: stats.mSubspaces }, (_, idx) => (
                  <option key={idx} value={idx}>
                    Sub-space #{idx} (Dim {idx * stats.subvectorDim} - {(idx + 1) * stats.subvectorDim - 1})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 256 Voronoi Centroids Distance Matrix Heatmap (16x16 grid) */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
              <span>256 Centroids in Subspace #{selectedSubspace} (Click to inspect coordinates):</span>
              <span className="font-mono text-cyan-400">Color: Distance to Query</span>
            </div>

            <div className="grid grid-cols-16 gap-1 p-3 bg-[#070A11] rounded-lg border border-slate-800 overflow-x-auto">
              {Array.from({ length: 256 }, (_, cIdx) => {
                const distSq = adcLut[selectedSubspace]?.[cIdx] || 0;
                // Normalize for heat intensity
                const intensity = Math.min(1.0, Math.max(0.1, distSq / 6.0));
                const isInspected = inspectedCentroid === cIdx;

                return (
                  <button
                    key={cIdx}
                    onClick={() => setInspectedCentroid(cIdx)}
                    title={'Centroid #' + cIdx + ': DistanceSq = ' + distSq.toFixed(3)}
                    className={
                      'h-6 w-6 rounded-sm transition-transform cursor-pointer flex items-center justify-center font-mono text-[10px] ' +
                      (isInspected ? 'ring-2 ring-white scale-110 z-10' : 'hover:scale-105')
                    }
                    style={{
                      backgroundColor: 'rgba(6, 182, 212, ' + intensity + ')',
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Mathematical Pipeline Explanation */}
          <div className="mt-auto p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-sm text-slate-300 flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-100 block mb-1">
                Zero Decompression Asymmetric Distance Math:
              </span>
              Given uncompressed query vector <code className="text-cyan-300">q</code> and quantized database code <code className="text-amber-300">c = [c_0, c_1, ..., c_15]</code>, the approximate L2 distance is directly resolved via 16 cache lookups:
              <div className="font-mono text-sm text-emerald-400 mt-1 bg-[#070A11] p-2 rounded">
                ADC(q, x) = sqrt( LUT[0, c[0]] + LUT[1, c[1]] + ... + LUT[15, c[15]] )
              </div>
            </div>
          </div>
        </div>

        {/* Centroid Codebook Inspector Card */}
        <div className="rounded-lg border border-slate-800 bg-[#090D18] p-5 flex flex-col">
          <div className="border-b border-slate-800 pb-3 mb-4">
            <h2 className="text-base font-bold text-slate-100">
              Voronoi Centroid Inspector
            </h2>
            <div className="text-sm text-slate-400 mt-0.5">
              Subspace #{selectedSubspace} · Centroid #{inspectedCentroid ?? 0}
            </div>
          </div>

          {inspectedCentroid !== null && engine.codebooks[selectedSubspace]?.[inspectedCentroid] ? (
            <div className="flex flex-col gap-4 text-sm">
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded">
                <span className="text-slate-400 block text-sm">Squared Distance to Query:</span>
                <span className="text-2xl font-bold font-mono text-cyan-400">
                  {adcLut[selectedSubspace]?.[inspectedCentroid]?.toFixed(4)}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-2 font-medium">
                  Centroid Sub-vector Coordinates ({stats.subvectorDim} Dimensions):
                </span>
                <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                  {Array.from(engine.codebooks[selectedSubspace][inspectedCentroid]).map((coord, dIdx) => (
                    <div
                      key={dIdx}
                      className="flex items-center justify-between p-2 rounded bg-[#070A11] border border-slate-800 font-mono text-sm"
                    >
                      <span className="text-slate-400">
                        Dim #{selectedSubspace * stats.subvectorDim + dIdx}
                      </span>
                      <span className="text-slate-200 font-bold">{coord.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-violet-950/30 border border-violet-800/40 rounded text-sm text-violet-300">
                1-byte index: <span className="font-mono font-bold">0x{inspectedCentroid.toString(16).toUpperCase().padStart(2, '0')}</span> (uint8)
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">
              Select a centroid cell from the 16x16 matrix to inspect coordinates.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
