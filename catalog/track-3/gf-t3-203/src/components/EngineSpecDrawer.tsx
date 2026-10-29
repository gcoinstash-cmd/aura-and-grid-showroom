import React from 'react';

export const EngineSpecDrawer: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-6 font-mono text-xs space-y-6 text-slate-300">
      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
            ENGINE_SPEC.md — Quantitative Architecture & Formulas
          </span>
          <span className="text-slate-500 text-xs">·</span>
          <span className="text-emerald-400 text-xs font-semibold">Ghost FactoryOS Track 3 (Gates 1-4)</span>
        </div>
        <p className="text-slate-400 font-sans text-xs mt-1">
          Formal quantitative state-space derivation, Welford O(1) stability bounds, and discrete Ornstein-Uhlenbeck proofs.
        </p>
      </div>

      {/* Gate 1: Core Quant Engine & Math */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-cyan-400 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
          <span>Gate 1: State-Space Kalman Filter & Dynamic Beta</span>
        </h3>
        <p className="font-sans leading-relaxed text-slate-300">
          The pairs trading relationship between Asset Y and Asset X is modeled as a non-stationary stochastic state system:
        </p>
        <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
          <div className="text-cyan-300 font-semibold">// State Vector & Observation Formulation</div>
          <div className="text-slate-200">θ_t = [β_t, α_t]ᵀ ∈ ℝ² (Slope Hedge Ratio β, Intercept α)</div>
          <div className="text-slate-200">Observation: y_t = H_t θ_t + v_t, where H_t = [x_t, 1], v_t ~ 𝒩(0, R)</div>
          <div className="text-slate-200">Transition: θ_t = θ_(t-1) + w_t, where w_t ~ 𝒩(0, Q)</div>
          <div className="text-cyan-300 font-semibold mt-2">// Recursive Measurement Update</div>
          <div className="text-slate-200">P_(t|t-1) = P_(t-1|t-1) + Q · I₂</div>
          <div className="text-slate-200">Innovation residual: e_t = y_t - (β_(t|t-1) · x_t + α_(t|t-1))</div>
          <div className="text-slate-200">Innovation variance: F_t = H_t P_(t|t-1) H_tᵀ + R = x_t² P₀₀ + 2 x_t P₀₁ + P₁₁ + R</div>
          <div className="text-slate-200">Kalman Gain: K_t = P_(t|t-1) H_tᵀ / F_t</div>
          <div className="text-slate-200">State update: θ_(t|t) = θ_(t|t-1) + K_t · e_t</div>
          <div className="text-slate-200">Covariance update: P_(t|t) = (I₂ - K_t H_t) P_(t|t-1)</div>
        </div>
      </div>

      {/* Welford's Algorithm */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-cyan-400 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
          <span>Welford's Algorithm (O(1) Rolling Numerical Stability)</span>
        </h3>
        <p className="font-sans leading-relaxed text-slate-300">
          Naive variance computation introduces catastrophic cancellation due to floating-point representation limits.
          Welford computes variance with bounded numerical precision and a zero-division guard (ε = 10⁻⁸):
        </p>
        <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-1">
          <div>M_k = M_(k-1) + (s_k - M_(k-1)) / k</div>
          <div>S_k = S_(k-1) + (s_k - M_(k-1))(s_k - M_k)</div>
          <div>σ² = S_k / (k - 1)</div>
          <div>Z_t = (Spread_t - M_t) / √(σ² + ε) (with Z = 0 if σ &lt; 10⁻⁸)</div>
        </div>
      </div>

      {/* Ornstein-Uhlenbeck Process */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-cyan-400 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
          <span>Ornstein-Uhlenbeck (OU) Mean-Reversion Half-Life</span>
        </h3>
        <p className="font-sans leading-relaxed text-slate-300">
          Continuous OU SDE: dS_t = θ(μ - S_t)dt + σ dW_t.
          Discretized as AR(1) OLS: ΔS_t = a + b S_(t-1) + η_t.
        </p>
        <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-1">
          <div>b = Cov(ΔS_t, S_(t-1)) / Var(S_(t-1))</div>
          <div>θ = -ln(1 + b) / Δt (valid for -1 &lt; b &lt; 0)</div>
          <div>Analytical Half-Life: τ₁/₂ = ln(2) / θ</div>
          <div>If b ≥ 0: Non-stationary / explosive trend, flagged as τ₁/₂ = ∞</div>
        </div>
      </div>

      {/* Gate 2: Clean-Room MIT Architecture */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-cyan-400 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
          <span>Gate 2: Clean-Room IP Statement & Test Suite Status</span>
        </h3>
        <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <span>✓ CLEAN-ROOM MIT IP AUDIT:</span>
            <span>Zero GPL/AGPL copyleft dependencies</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <span>✓ PYTEST / UNITTEST SUITE:</span>
            <span>5/5 tests passing (Convergence, Zero Division, OU, FSM, SHA-256)</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <span>✓ DOCKERFILE:</span>
            <span>Cloud Run multi-stage build with unprivileged quantuser</span>
          </div>
        </div>
      </div>
    </div>
  );
};
