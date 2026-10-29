import React from 'react';
import { QuantEngineTelemetry } from '../engine/types';

interface StateSpaceMatrixViewProps {
  telemetry: QuantEngineTelemetry;
}

export const StateSpaceMatrixView: React.FC<StateSpaceMatrixViewProps> = ({ telemetry }) => {
  const { kalman, welford, ou, priceX, priceY } = telemetry;
  const detP = kalman.p00 * kalman.p11 - kalman.p01 * kalman.p10;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-4 font-mono text-xs space-y-4">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800">
        <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] font-sans">
          State-Space Kalman Filter & Linear Algebra Diagnostics
        </span>
        <p className="text-[11px] text-slate-500 font-sans mt-0.5">
          Real-time observation of recursive state estimation vectors, covariance matrices, and stochastic parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: State Vector Theta & Observation Matrix H */}
        <div className="bg-slate-950 border border-slate-800/80 rounded p-3 space-y-2">
          <div className="text-slate-400 font-semibold text-[11px] font-sans">
            State Vector θ_t & Observation H_t
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center py-1 border-b border-slate-900">
              <span className="text-slate-500">Hedge Ratio (β):</span>
              <span className="text-cyan-400 font-bold tabular-nums">{kalman.beta.toFixed(6)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-900">
              <span className="text-slate-500">Intercept (α):</span>
              <span className="text-slate-200 tabular-nums">{kalman.alpha.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-900">
              <span className="text-slate-500">Observation H_t:</span>
              <span className="text-slate-400 tabular-nums">[{priceX.toFixed(2)}, 1.0]</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Fair Value ŷ_t:</span>
              <span className="text-slate-200 tabular-nums">{kalman.fairValueY.toFixed(2)} pts</span>
            </div>
          </div>
        </div>

        {/* Card 2: Covariance Matrix P & Determinant */}
        <div className="bg-slate-950 border border-slate-800/80 rounded p-3 space-y-2">
          <div className="text-slate-400 font-semibold text-[11px] font-sans">
            Error Covariance Matrix P_t (2×2)
          </div>
          <div className="bg-slate-900/80 rounded p-2 text-center space-y-1 border border-slate-800">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-1.5 bg-slate-950 rounded text-cyan-300 tabular-nums">
                P₀₀: {kalman.p00.toExponential(3)}
              </div>
              <div className="p-1.5 bg-slate-950 rounded text-slate-400 tabular-nums">
                P₀₁: {kalman.p01.toExponential(3)}
              </div>
              <div className="p-1.5 bg-slate-950 rounded text-slate-400 tabular-nums">
                P₁₀: {kalman.p10.toExponential(3)}
              </div>
              <div className="p-1.5 bg-slate-950 rounded text-cyan-300 tabular-nums">
                P₁₁: {kalman.p11.toExponential(3)}
              </div>
            </div>
          </div>
          <div className="flex justify-between text-[11px] pt-1">
            <span className="text-slate-500">det(P) (Positive Definite):</span>
            <span className="text-emerald-400 tabular-nums font-semibold">{detP.toExponential(3)} &gt; 0</span>
          </div>
        </div>

        {/* Card 3: Kalman Gain & Innovation */}
        <div className="bg-slate-950 border border-slate-800/80 rounded p-3 space-y-2">
          <div className="text-slate-400 font-semibold text-[11px] font-sans">
            Kalman Gain Vector K_t & Innovation
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center py-1 border-b border-slate-900">
              <span className="text-slate-500">Gain K_β (Slope update):</span>
              <span className="text-slate-300 tabular-nums">{kalman.kalmanGainBeta.toExponential(4)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-900">
              <span className="text-slate-500">Gain K_α (Intercept update):</span>
              <span className="text-slate-300 tabular-nums">{kalman.kalmanGainAlpha.toExponential(4)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-900">
              <span className="text-slate-500">Innovation residual (e_t):</span>
              <span className="text-amber-400 tabular-nums font-semibold">{kalman.spread.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Innovation variance (F_t):</span>
              <span className="text-slate-400 tabular-nums">{kalman.innovationVariance.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Welford Running Moments */}
        <div className="bg-slate-950 border border-slate-800/80 rounded p-3 space-y-2">
          <div className="text-slate-400 font-semibold text-[11px] font-sans">
            Welford Algorithm Moments (O(1))
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center py-1 border-b border-slate-900">
              <span className="text-slate-500">Sample Count:</span>
              <span className="text-slate-200 tabular-nums">{welford.count}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-900">
              <span className="text-slate-500">Running Mean (μ):</span>
              <span className="text-slate-200 tabular-nums">{welford.mean.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-900">
              <span className="text-slate-500">Sample Variance (s²):</span>
              <span className="text-slate-200 tabular-nums">{welford.variance.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Standard Deviation (σ):</span>
              <span className="text-slate-200 tabular-nums">{welford.stdev.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Card 5: Ornstein-Uhlenbeck Parameters */}
        <div className="bg-slate-950 border border-slate-800/80 rounded p-3 space-y-2">
          <div className="text-slate-400 font-semibold text-[11px] font-sans">
            Ornstein-Uhlenbeck AR(1) OLS
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center py-1 border-b border-slate-900">
              <span className="text-slate-500">Reversion Speed (θ):</span>
              <span className="text-cyan-400 tabular-nums font-semibold">{ou.theta.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-900">
              <span className="text-slate-500">Calculated Half-Life (τ₁/₂):</span>
              <span className="text-slate-200 tabular-nums font-semibold">
                {isFinite(ou.halfLife) ? `${ou.halfLife.toFixed(1)} ticks` : '∞ (Trending)'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-900">
              <span className="text-slate-500">Stationarity Status:</span>
              <span className={ou.isMeanReverting ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {ou.isMeanReverting ? 'Stationary Mean-Reverting' : 'Non-Stationary / Explosive'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Residual Variance:</span>
              <span className="text-slate-400 tabular-nums">{ou.residualVariance.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Card 6: Noise Hyperparameters */}
        <div className="bg-slate-950 border border-slate-800/80 rounded p-3 space-y-2">
          <div className="text-slate-400 font-semibold text-[11px] font-sans">
            Kalman Hyperparameters
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center py-1 border-b border-slate-900">
              <span className="text-slate-500">Measurement Noise (R):</span>
              <span className="text-slate-300 tabular-nums">1.000e-3</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-900">
              <span className="text-slate-500">Process Noise (Q):</span>
              <span className="text-slate-300 tabular-nums">1.000e-5</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-900">
              <span className="text-slate-500">Z-Score Trigger Bounds:</span>
              <span className="text-slate-300 tabular-nums">±2.00σ Entry / ±0.50σ Exit</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Stop-Out Bound:</span>
              <span className="text-rose-400 tabular-nums">±3.50σ Breakout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
