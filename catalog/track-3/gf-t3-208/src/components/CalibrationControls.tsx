/**
 * APEX-208 Calibration Control Station
 * Interactive parameter sliders, Nelder-Mead optimization triggers, and stress shock injection.
 * Strict Zero-Dollar Compliance: Spot and strikes rendered in pts, shocks in bps or pts.
 * Minimum 14px typography floor and min-h-[44px] action button heights.
 */

import React from 'react';
import { SyntheticAsset, SABRParameters } from '../quant/types.ts';
import { SYNTHETIC_ASSETS } from '../quant/assets.ts';
import { Sliders, Zap, RotateCcw, Activity, ShieldAlert, Sparkles } from 'lucide-react';

interface CalibrationControlsProps {
  currentAsset: SyntheticAsset;
  onSelectAsset: (asset: SyntheticAsset) => void;
  params: SABRParameters;
  onChangeParams: (newParams: SABRParameters) => void;
  onRunOptimization: () => void;
  isCalibrating: boolean;
  liveSimulation: boolean;
  onToggleLiveSimulation: () => void;
  onApplyStressShock: (type: 'vol_spike' | 'skew_steepen' | 'convexity_surge' | 'reset') => void;
}

export const CalibrationControls: React.FC<CalibrationControlsProps> = ({
  currentAsset,
  onSelectAsset,
  params,
  onChangeParams,
  onRunOptimization,
  isCalibrating,
  liveSimulation,
  onToggleLiveSimulation,
  onApplyStressShock
}) => {
  return (
    <div className="w-full bg-[#090D16] border border-slate-800 rounded-lg p-5 flex flex-col gap-6">
      {/* Section 1: Synthetic Asset Selection */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>SYNTHETIC UNDERLYING SELECTION</span>
          </h3>
          <span className="text-sm font-mono text-slate-400">
            Clean-Room Asset Benchmarks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SYNTHETIC_ASSETS.map(asset => {
            const isSelected = asset.id === currentAsset.id;
            return (
              <button
                key={asset.id}
                onClick={() => onSelectAsset(asset)}
                className={
                  'p-4 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-1.5 ' +
                  (isSelected
                    ? 'bg-cyan-950/30 border-cyan-500 shadow-md shadow-cyan-950/20'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900')
                }
              >
                <div className="flex items-center justify-between">
                  <span className={'text-base font-bold ' + (isSelected ? 'text-cyan-400' : 'text-slate-200')}>
                    {asset.id}
                  </span>
                  <span className="text-sm font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {asset.spot.toFixed(2) + ' pts'}
                  </span>
                </div>
                <div className="text-sm text-slate-400">
                  {asset.name}
                </div>
                <div className="text-sm font-mono text-slate-400 mt-1">
                  {'Base Spread: ' + asset.baseSpreadBps.toFixed(1) + ' bps'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: SABR Parameter Sliders */}
      <div className="flex flex-col gap-4 pt-4 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h4 className="text-base font-semibold text-slate-200">
            SABR Model Parameters (Hagan et al. 2002)
          </h4>
          <div className="text-sm text-slate-400 font-mono">
            {'Fixed Backbone: beta = ' + params.beta.toFixed(2) + ' (CEV Exponent)'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Alpha (Initial Volatility) */}
          <div className="flex flex-col gap-2 p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-200">
                Alpha [alpha] (Vol Level)
              </label>
              <span className="text-sm font-mono font-bold text-cyan-400">
                {params.alpha.toFixed(3)}
              </span>
            </div>
            <input
              type="range"
              min="0.20"
              max="2.50"
              step="0.01"
              value={params.alpha}
              onChange={e => onChangeParams({ ...params, alpha: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-sm text-slate-400 font-mono">
              <span>0.20</span>
              <span>1.35</span>
              <span>2.50</span>
            </div>
          </div>

          {/* Rho (Spot-Vol Correlation) */}
          <div className="flex flex-col gap-2 p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-200">
                Rho [rho] (Correlation)
              </label>
              <span className="text-sm font-mono font-bold text-violet-400">
                {params.rho.toFixed(3)}
              </span>
            </div>
            <input
              type="range"
              min="-0.90"
              max="0.90"
              step="0.01"
              value={params.rho}
              onChange={e => onChangeParams({ ...params, rho: parseFloat(e.target.value) })}
              className="w-full accent-violet-500 cursor-pointer"
            />
            <div className="flex justify-between text-sm text-slate-400 font-mono">
              <span>-0.90 (Skew Left)</span>
              <span>0.00</span>
              <span>+0.90 (Skew Right)</span>
            </div>
          </div>

          {/* Nu (Vol of Vol) */}
          <div className="flex flex-col gap-2 p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-200">
                Nu [nu] (Vol of Vol)
              </label>
              <span className="text-sm font-mono font-bold text-amber-400">
                {params.nu.toFixed(3)}
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.50"
              step="0.01"
              value={params.nu}
              onChange={e => onChangeParams({ ...params, nu: parseFloat(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-sm text-slate-400 font-mono">
              <span>0.05 (Flat)</span>
              <span>0.75</span>
              <span>1.50 (Convex)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Optimizer Trigger & Stress Testing Actions */}
      <div className="flex flex-col gap-3 pt-4 border-t border-slate-800">
        <h4 className="text-base font-semibold text-slate-200">
          Optimization & Quantitative Stress Shocks
        </h4>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onRunOptimization}
            disabled={isCalibrating}
            className="min-h-[44px] px-6 py-2.5 text-base font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/30 disabled:opacity-50"
          >
            <Zap className="w-5 h-5 fill-slate-950" />
            <span>{isCalibrating ? 'Calibrating...' : 'Execute Nelder-Mead Optimization'}</span>
          </button>

          <button
            onClick={onToggleLiveSimulation}
            className={
              'min-h-[44px] px-5 py-2.5 text-base font-bold rounded-lg border transition-colors flex items-center gap-2 cursor-pointer ' +
              (liveSimulation
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white')
            }
          >
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>{liveSimulation ? 'Live Skew Drift: ACTIVE' : 'Simulate Live Skew Drift'}</span>
          </button>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <button
              onClick={() => onApplyStressShock('vol_spike')}
              className="min-h-[44px] px-4 py-2 text-sm font-semibold rounded-lg bg-slate-900 border border-slate-700 text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Add 500 bps to ATM implied volatility"
            >
              +500 bps Vol Shock
            </button>

            <button
              onClick={() => onApplyStressShock('skew_steepen')}
              className="min-h-[44px] px-4 py-2 text-sm font-semibold rounded-lg bg-slate-900 border border-slate-700 text-violet-300 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Shift correlation rho by -0.20"
            >
              Steepen Skew
            </button>

            <button
              onClick={() => onApplyStressShock('convexity_surge')}
              className="min-h-[44px] px-4 py-2 text-sm font-semibold rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Increase vol of vol nu by +0.30"
            >
              Wing Convexity (+0.30)
            </button>

            <button
              onClick={() => onApplyStressShock('reset')}
              className="min-h-[44px] px-4 py-2 text-sm font-semibold rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Nominal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
