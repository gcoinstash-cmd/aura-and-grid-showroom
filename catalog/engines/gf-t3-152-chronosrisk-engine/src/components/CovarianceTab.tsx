/**
 * CHRONOSRISK ENGINE // GF-T3-152
 * Tab 2: Covariance Matrix & Asset Allocation
 */

import React from 'react';
import { PieChart, Sliders, RefreshCw, BarChart3, AlertCircle, ArrowUpRight } from 'lucide-react';
import {
  AssetPosition,
  RiskMetricsResult,
  DEFAULT_CORRELATION_MATRIX,
} from '../core/riskEngineTs';

interface CovarianceTabProps {
  assets: AssetPosition[];
  setAssets: (assets: AssetPosition[]) => void;
  corrMatrix: number[][];
  setCorrMatrix: (matrix: number[][]) => void;
  riskResult: RiskMetricsResult;
  onLogAuditAction: (action: string, details: string) => void;
}

export const CovarianceTab: React.FC<CovarianceTabProps> = ({
  assets,
  setAssets,
  corrMatrix,
  setCorrMatrix,
  riskResult,
  onLogAuditAction,
}) => {
  const handleWeightChange = (index: number, newWeight: number) => {
    const updated = [...assets];
    updated[index] = { ...updated[index], weight: Math.max(0, Math.min(1, newWeight)) };
    setAssets(updated);
  };

  const handleNormalizeWeights = () => {
    const sum = assets.reduce((s, a) => s + a.weight, 0);
    if (sum === 0) return;
    const normalized = assets.map((a) => ({
      ...a,
      weight: parseFloat((a.weight / sum).toFixed(4)),
    }));
    setAssets(normalized);
    onLogAuditAction('WEIGHTS_NORMALIZED', `Normalized ${assets.length} assets to sum exactly to 1.00`);
  };

  const applyPreset = (presetName: string, weights: Record<string, number>) => {
    const updated = assets.map((a) => ({
      ...a,
      weight: weights[a.symbol] ?? 0.0,
    }));
    setAssets(updated);
    onLogAuditAction('PRESET_APPLIED', `Allocated portfolio preset: ${presetName}`);
  };

  const presets = [
    {
      name: 'Crypto Momentum',
      desc: 'High beta digital asset alpha',
      weights: { BTC: 0.50, ETH: 0.30, SOL: 0.20, SPX: 0.00, GOLD: 0.00, USD: 0.00 },
    },
    {
      name: '60/40 Institutional',
      desc: 'Traditional equities & hedge mix',
      weights: { BTC: 0.10, ETH: 0.05, SOL: 0.00, SPX: 0.50, GOLD: 0.25, USD: 0.10 },
    },
    {
      name: 'Macro Capital Hedge',
      desc: 'Flight-to-safety risk parity',
      weights: { BTC: 0.05, ETH: 0.00, SOL: 0.00, SPX: 0.20, GOLD: 0.45, USD: 0.30 },
    },
    {
      name: 'Balanced Fleet Tier',
      desc: 'Standard multi-asset risk distribution',
      weights: { BTC: 0.35, ETH: 0.25, SOL: 0.15, SPX: 0.15, GOLD: 0.08, USD: 0.02 },
    },
  ];

  const totalWeight = assets.reduce((s, a) => s + a.weight, 0);

  return (
    <div className="space-y-8">
      {/* Allocation Presets Header */}
      <div className="bg-[#0e1626] border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 mb-6 gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
              Portfolio Asset Allocation & Risk Weights
            </h2>
            <p className="text-sm text-slate-400">
              Adjust position weight vectors or activate institutional risk-parity presets
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleNormalizeWeights}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-lg border border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>NORMALIZE (1.00)</span>
            </button>
            <div className="text-xs font-mono font-bold px-3 py-1.5 rounded bg-slate-900 border border-slate-700">
              SUM: <span className={Math.abs(totalWeight - 1.0) < 0.01 ? 'text-emerald-400' : 'text-amber-400'}>
                {(totalWeight * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Preset Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {presets.map((preset) => (
            <div
              key={preset.name}
              onClick={() => applyPreset(preset.name, preset.weights)}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-900 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-white group-hover:text-amber-400 transition">
                  {preset.name}
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
              </div>
              <p className="text-xs text-slate-400">{preset.desc}</p>
            </div>
          ))}
        </div>

        {/* Sliders for each Asset */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset, idx) => (
            <div
              key={asset.id}
              className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-white text-base mr-2">{asset.symbol}</span>
                  <span className="text-xs text-slate-400">{asset.name}</span>
                </div>
                <span className="text-sm font-mono font-bold text-amber-400">
                  {(asset.weight * 100).toFixed(1)}%
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={asset.weight}
                onChange={(e) => handleWeightChange(idx, parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />

              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80 text-xs font-mono text-slate-400">
                <div>
                  <span className="text-slate-500 block">Ann. Vol</span>
                  <span className="text-white font-semibold">{(asset.annualVol * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Skewness</span>
                  <span className={asset.skewness < 0 ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                    {asset.skewness.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Kurtosis</span>
                  <span className="text-amber-400 font-semibold">{asset.excessKurtosis.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Component VaR Risk Contribution Breakdown */}
      <div className="bg-[#0e1626] border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div>
            <h3 className="text-xl font-bold text-white tracking-wide">
              Euler Marginal & Component VaR Decomposition
            </h3>
            <p className="text-sm text-slate-400">
              Demonstrates which asset drives marginal portfolio downside loss (Euler allocation theorem)
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded">
            TOTAL VAR: ${(riskResult.cornishFisherVaRAmount / 1_000_000).toFixed(2)}M
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-4">Allocation Weight</th>
                <th className="py-3 px-4">Marginal VaR (MVaR)</th>
                <th className="py-3 px-4">Component VaR (UNITS)</th>
                <th className="py-3 px-4 text-right">Risk Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {riskResult.componentVaR.map((c) => (
                <tr key={c.symbol} className="hover:bg-slate-900/60 transition">
                  <td className="py-3 px-4 font-bold text-white">{c.symbol}</td>
                  <td className="py-3 px-4 text-slate-300">{(c.weight * 100).toFixed(1)}%</td>
                  <td className="py-3 px-4 text-sky-400">{(c.marginalVaR * 100).toFixed(2)}%</td>
                  <td className="py-3 px-4 text-amber-400 font-bold">
                    ${(c.componentVaRAmount / 1_000_000).toFixed(3)}M
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${Math.max(0, Math.min(100, c.percentContribution))}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-white w-12 text-right">
                        {c.percentContribution.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6x6 Correlation & Covariance Matrix */}
      <div className="bg-[#0e1626] border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div>
            <h3 className="text-xl font-bold text-white tracking-wide">
              Cross-Asset Correlation & Covariance Matrix
            </h3>
            <p className="text-sm text-slate-400">
              Real-time pairwise Pearson correlation coefficients (ρ_ij) driving portfolio variance w^T Σ w
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="w-3 h-3 rounded bg-amber-500/80"></span>
            <span className="text-slate-400">High (&gt;0.6)</span>
            <span className="w-3 h-3 rounded bg-slate-700 ml-2"></span>
            <span className="text-slate-400">Neutral</span>
            <span className="w-3 h-3 rounded bg-emerald-600/80 ml-2"></span>
            <span className="text-slate-400">Negative Hedge</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center font-mono text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="py-2.5 px-3 text-left text-slate-400 font-semibold">Asset</th>
                {assets.map((a) => (
                  <th key={a.id} className="py-2.5 px-3 text-slate-300 font-bold">
                    {a.symbol}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assets.map((rowAsset, i) => (
                <tr key={rowAsset.id} className="border-b border-slate-800/40">
                  <td className="py-3 px-3 text-left font-bold text-white">{rowAsset.symbol}</td>
                  {assets.map((colAsset, j) => {
                    const rho = corrMatrix[i]?.[j] ?? (i === j ? 1.0 : 0.0);
                    let bgClass = 'bg-slate-900/60 text-slate-300';
                    if (i === j) {
                      bgClass = 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30';
                    } else if (rho >= 0.7) {
                      bgClass = 'bg-amber-600/30 text-amber-300 font-bold';
                    } else if (rho >= 0.3) {
                      bgClass = 'bg-amber-900/20 text-amber-200';
                    } else if (rho < 0) {
                      bgClass = 'bg-emerald-900/30 text-emerald-300 font-semibold';
                    }

                    return (
                      <td key={colAsset.id} className="p-1.5">
                        <div className={`py-2 px-1 rounded-lg text-xs transition ${bgClass}`}>
                          {rho.toFixed(2)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
