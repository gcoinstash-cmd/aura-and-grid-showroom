import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Calculator,
  TrendingDown,
  CheckCircle2,
  HelpCircle,
  Sigma,
  Zap,
  RotateCcw,
} from 'lucide-react';

interface LloydMathDerivationProps {
  currentEnergy?: number;
}

export const LloydMathDerivation: React.FC<LloydMathDerivationProps> = ({
  currentEnergy = 425000,
}) => {
  // Historical convergence tracker
  const [history, setHistory] = useState<{ step: number; energy: number }[]>([]);
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Accumulate energy history samples
  useEffect(() => {
    setHistory((prev) => {
      const nextStep = prev.length > 0 ? prev[prev.length - 1].step + 1 : 1;
      const updated = [...prev, { step: nextStep, energy: currentEnergy }];
      // Keep last 60 samples
      if (updated.length > 60) return updated.slice(updated.length - 60);
      return updated;
    });
  }, [currentEnergy]);

  // Render Lyapunov Convergence Chart
  useEffect(() => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 40; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, height - 30);
      ctx.stroke();
    }
    for (let y = 30; y < height - 30; y += 40) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(width - 20, y);
      ctx.stroke();
    }

    if (history.length < 2) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ACCUMULATING LYAPUNOV SAMPLES IN LIVE ENGINE...', width / 2, height / 2);
      return;
    }

    const energies = history.map((h) => h.energy);
    const minE = Math.min(...energies) * 0.95;
    const maxE = Math.max(...energies) * 1.05;
    const rangeE = Math.max(1, maxE - minE);

    const plotX = (idx: number) => 45 + (idx / (history.length - 1)) * (width - 70);
    const plotY = (val: number) => height - 35 - ((val - minE) / rangeE) * (height - 65);

    // Draw gradient area under curve
    const grad = ctx.createLinearGradient(0, 20, 0, height - 30);
    grad.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
    grad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

    ctx.beginPath();
    ctx.moveTo(plotX(0), height - 35);
    for (let i = 0; i < history.length; i++) {
      ctx.lineTo(plotX(i), plotY(history[i].energy));
    }
    ctx.lineTo(plotX(history.length - 1), height - 35);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw stroke line
    ctx.beginPath();
    ctx.moveTo(plotX(0), plotY(history[0].energy));
    for (let i = 1; i < history.length; i++) {
      ctx.lineTo(plotX(i), plotY(history[i].energy));
    }
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Current point dot
    const lastX = plotX(history.length - 1);
    const lastY = plotY(history[history.length - 1].energy);
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(maxE)}`, 38, 30);
    ctx.fillText(`${Math.round(minE)}`, 38, height - 35);
    ctx.textAlign = 'center';
    ctx.fillText('Iteration Steps t →', width / 2, height - 10);
  }, [history]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-md shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1 font-semibold">
            <Sigma className="w-4 h-4" />
            <span>Mathematical Foundations & Formal Invariants</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
            Centroidal Voronoi Tessellation & LaSalle Invariance
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Decentralized spatial load-balancing via gradient descent on continuous spatial density distributions.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col items-end">
            <span className="text-slate-400">INSTANTANEOUS H(P):</span>
            <span className="text-cyan-400 font-bold text-base">
              {Math.round(currentEnergy).toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setHistory([])}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold"
            aria-label="Reset convergence graph history"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reset History</span>
          </button>
        </div>
      </div>

      {/* Live Lyapunov Graph & Instant Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph Card */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-slate-800 bg-slate-950 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-slate-100 font-mono text-sm sm:text-base">
                REAL-TIME LYAPUNOV CONVERGENCE // H(P) vs t
              </h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300">
              dH/dt ≤ 0 MONOTONIC DESCENT
            </span>
          </div>

          <div className="w-full h-64 relative bg-slate-950 rounded-lg border border-slate-800/80 overflow-hidden">
            <canvas
              ref={chartCanvasRef}
              width={700}
              height={260}
              className="w-full h-full block"
              aria-label="Live Lyapunov Energy Convergence Chart"
            />
          </div>

          <p className="text-xs text-slate-400 font-mono">
            Energy functional measures spatial variance of territory from agent positions: <code className="text-cyan-300">H(P) = Σ ∫ ||q - p_i||² dq</code>.
            As agents execute Lloyd relaxation, <code className="text-emerald-300">dH/dt &lt; 0</code> until entering the invariant set where all <code className="text-slate-200">p_i = C_i</code>.
          </p>
        </div>

        {/* Invariant Checklist */}
        <div className="lg:col-span-1 p-5 rounded-xl border border-slate-800 bg-slate-900/90 flex flex-col gap-4 shadow-xl">
          <h3 className="font-bold text-slate-100 font-mono text-sm sm:text-base border-b border-slate-800 pb-2">
            FORMAL STABILITY INVARIANTS
          </h3>

          <div className="flex flex-col gap-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-200 font-bold block">1. Compact Domain Invariance</span>
                <span className="text-slate-400">
                  Domain Ω is compact, convex, and bounded in ℝ². Swarm positions P(t) remain in Ω for all t ≥ 0.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-200 font-bold block">2. Continuous Differentiability</span>
                <span className="text-slate-400">
                  H(P) is continuously differentiable across partition topology changes (Cortés et al. 2004).
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-200 font-bold block">3. LaSalle Invariance Guarantee</span>
                <span className="text-slate-400">
                  All trajectories asymptotically converge to the critical set: Ω_crit = &#123;P | p_i = C_i(V_i), ∀ i&#125;.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Mathematical Derivation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Domain & Voronoi Partition */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-mono font-bold text-cyan-400">LEMMA 1</span>
            <h3 className="font-bold text-slate-100 text-base">
              Spatial Domain & Voronoi Partitions
            </h3>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-sm text-cyan-300 leading-relaxed overflow-x-auto">
            {`V_i(P) = { q ∈ Ω | ||q - p_i|| ≤ ||q - p_j||, ∀ j ≠ i }`}
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            Let <strong className="text-slate-100">Ω ⊂ ℝ²</strong> be a bounded convex polygon and let{' '}
            <strong className="text-slate-100">P = (p₁, ..., p_N)</strong> denote the configuration of N autonomous agents.
            The spatial density distribution <strong className="text-slate-100">ϕ(q) &gt; 0</strong> denotes the probability or mission demand
            over points <strong className="text-slate-100">q ∈ Ω</strong>. The collection{' '}
            <code className="text-cyan-300 font-mono">&#123;V_1, ..., V_N&#125;</code> constitutes a valid partition of Ω:
          </p>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300">
            {`⋃_{i=1}^N V_i = Ω,   and   int(V_i) ∩ int(V_j) = ∅ (∀ i ≠ j)`}
          </div>
        </div>

        {/* Card 2: Continuous Coverage Matrix Functional */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-mono font-bold text-emerald-400">LEMMA 2</span>
            <h3 className="font-bold text-slate-100 text-base">
              Lyapunov Coverage Performance Functional
            </h3>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-sm text-emerald-300 leading-relaxed overflow-x-auto">
            {`ℋ(P) = ∑_{i=1}^N ∫_{V_i} ||q - p_i||² ϕ(q) dq`}
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            The functional <strong className="text-slate-100">ℋ(P)</strong> represents the total sensing error variance across the fleet.
            We define the mass <strong className="text-slate-100">M_{`{V_i}`}</strong> and centroid <strong className="text-slate-100">C_i</strong> of cell V_i as:
          </p>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300 space-y-1">
            <div>{`M_{V_i} = ∫_{V_i} ϕ(q) dq`}</div>
            <div>{`C_i = (1 / M_{V_i}) ∫_{V_i} q ϕ(q) dq`}</div>
          </div>
        </div>

        {/* Card 3: Gradient Derivation */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-mono font-bold text-violet-400">THEOREM 1</span>
            <h3 className="font-bold text-slate-100 text-base">
              Decentralized Gradient Control Law
            </h3>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-sm text-violet-300 leading-relaxed overflow-x-auto">
            {`∂ℋ / ∂p_i = 2 M_{V_i} (p_i - C_i)`}
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            By Leibniz’s Integral Rule and the boundary bisector condition <code className="text-slate-200 font-mono">||q - p_i|| = ||q - p_j||</code> on{' '}
            <code className="text-slate-200 font-mono">∂V_i ∩ ∂V_j</code>, boundary boundary derivatives cancel identically. Therefore:
          </p>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300">
            {`ṗ_i = -k_i (p_i - C_i),   where k_i = 2 γ M_{V_i} > 0`}
          </div>

          <p className="text-xs text-slate-400">
            Crucially, this control law is <strong className="text-slate-200">completely decentralized</strong>: node i only requires knowledge
            of its immediate Delaunay Voronoi neighbors to evaluate C_i.
          </p>
        </div>

        {/* Card 4: Obstacle Warping & Geodesic Avoidance */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-mono font-bold text-amber-400">THEOREM 2</span>
            <h3 className="font-bold text-slate-100 text-base">
              Exclusion-Zone Boundary Warping
            </h3>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-sm text-amber-300 leading-relaxed overflow-x-auto">
            {`ṗ_i = -k_i (p_i - C_i) + ∑_{k} F_rep(p_i, 𝒪_k)`}
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            For non-convex flight domains with exclusion zones <strong className="text-slate-100">𝒪_k</strong>,
            the spatial density is penalized: <code className="text-amber-300 font-mono">ϕ(q) → 0, ∀ q ∈ 𝒪_k</code>.
            The repulsive field <code className="text-amber-300 font-mono">F_rep</code> guarantees no-fly zone clearance:
          </p>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300">
            {`F_rep(p_i, 𝒪_k) = η · (1/d - 1/d_0) · (1/d²) · ∇d(p_i, 𝒪_k)`}
          </div>

          <p className="text-xs text-slate-400">
            As a result, Voronoi cells bend and wrap naturally around threat bubbles, redistributing workload evenly across peripheral swarms.
          </p>
        </div>
      </div>
    </div>
  );
};
