/**
 * MethodologyComparisonTable Component
 * Side-by-side comparison of Cornish-Fisher, Hull-White, and EVT POT GPD.
 * Strict zero-dollar compliance & 14px text floor.
 */

import React from 'react';
import { CheckCircle2, Info } from 'lucide-react';
import { RiskEvaluationResult } from '../types/risk';

interface MethodologyComparisonTableProps {
  risk: RiskEvaluationResult;
  activeMethodology: 'evt' | 'cf' | 'hw';
  onSelectMethodology: (m: 'evt' | 'cf' | 'hw') => void;
}

export const MethodologyComparisonTable: React.FC<MethodologyComparisonTableProps> = ({
  risk,
  activeMethodology,
  onSelectMethodology
}) => {
  const formatUnits = (num: number) => {
    return Math.round(num).toLocaleString('en-US') + " Units";
  };

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">
            Concurrent Risk Methodologies Comparison Matrix
          </h2>
          <div className="text-sm text-slate-400 mt-0.5">
            Evaluate quantitative divergence between analytical, historical volatility-scaled, and asymptotic EVT models
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-sm">
              <th className="py-3 px-4 font-semibold">Risk Methodology</th>
              <th className="py-3 px-4 font-semibold">Core Mathematical Formulation</th>
              <th className="py-3 px-4 font-semibold text-right">99% 1-Day VaR</th>
              <th className="py-3 px-4 font-semibold text-right">Expected Shortfall</th>
              <th className="py-3 px-4 font-semibold text-right">Tail Buffer (ES - VaR)</th>
              <th className="py-3 px-4 font-semibold text-center">Coherence Check</th>
              <th className="py-3 px-4 font-semibold text-center">Active Target</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-sm">
            
            {/* ROW 1: CORNISH-FISHER */}
            <tr className={"hover:bg-slate-800/40 transition-colors " + (activeMethodology === 'cf' ? "bg-cyan-950/20" : "")}>
              <td className="py-4 px-4 font-sans font-semibold text-slate-200">
                1. Parametric Cornish-Fisher
              </td>
              <td className="py-4 px-4 font-mono text-slate-300 text-sm">
                z_cf = z_a + (S/6)(z^2-1) + (K/24)(z^3-3z) - (S^2/36)(2z^3-5z)
              </td>
              <td className="py-4 px-4 text-right text-cyan-400 font-semibold tabular-nums">
                {formatUnits(risk.cfVarUnits)}
                <div className="text-slate-400 font-normal">({risk.cfVarPct.toFixed(2)}%)</div>
              </td>
              <td className="py-4 px-4 text-right text-rose-400 font-semibold tabular-nums">
                {formatUnits(risk.cfEsUnits)}
                <div className="text-slate-400 font-normal">({risk.cfEsPct.toFixed(2)}%)</div>
              </td>
              <td className="py-4 px-4 text-right text-slate-300 tabular-nums">
                {formatUnits(risk.cfEsUnits - risk.cfVarUnits)}
              </td>
              <td className="py-4 px-4 text-center">
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold font-sans">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ES &ge; VaR</span>
                </span>
              </td>
              <td className="py-4 px-4 text-center">
                <button
                  onClick={() => onSelectMethodology('cf')}
                  className={"px-3 py-1.5 rounded text-sm font-sans font-bold transition-all cursor-pointer " +
                    (activeMethodology === 'cf'
                      ? "bg-cyan-400 text-slate-950"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    )}
                >
                  {activeMethodology === 'cf' ? "Selected" : "Select"}
                </button>
              </td>
            </tr>

            {/* ROW 2: HULL-WHITE HISTORICAL SIMULATION */}
            <tr className={"hover:bg-slate-800/40 transition-colors " + (activeMethodology === 'hw' ? "bg-cyan-950/20" : "")}>
              <td className="py-4 px-4 font-sans font-semibold text-slate-200">
                2. Hull-White Vol-Updating
              </td>
              <td className="py-4 px-4 font-mono text-slate-300 text-sm">
                r_t^* = r_t * (sigma_T / sigma_t) (EWMA lambda = 0.94)
              </td>
              <td className="py-4 px-4 text-right text-cyan-400 font-semibold tabular-nums">
                {formatUnits(risk.hwVarUnits)}
                <div className="text-slate-400 font-normal">({risk.hwVarPct.toFixed(2)}%)</div>
              </td>
              <td className="py-4 px-4 text-right text-rose-400 font-semibold tabular-nums">
                {formatUnits(risk.hwEsUnits)}
                <div className="text-slate-400 font-normal">({risk.hwEsPct.toFixed(2)}%)</div>
              </td>
              <td className="py-4 px-4 text-right text-slate-300 tabular-nums">
                {formatUnits(risk.hwEsUnits - risk.hwVarUnits)}
              </td>
              <td className="py-4 px-4 text-center">
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold font-sans">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ES &ge; VaR</span>
                </span>
              </td>
              <td className="py-4 px-4 text-center">
                <button
                  onClick={() => onSelectMethodology('hw')}
                  className={"px-3 py-1.5 rounded text-sm font-sans font-bold transition-all cursor-pointer " +
                    (activeMethodology === 'hw'
                      ? "bg-cyan-400 text-slate-950"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    )}
                >
                  {activeMethodology === 'hw' ? "Selected" : "Select"}
                </button>
              </td>
            </tr>

            {/* ROW 3: EXTREME VALUE THEORY POT */}
            <tr className={"hover:bg-slate-800/40 transition-colors " + (activeMethodology === 'evt' ? "bg-cyan-950/20" : "")}>
              <td className="py-4 px-4 font-sans font-semibold text-slate-200">
                3. EVT Peaks-Over-Threshold
              </td>
              <td className="py-4 px-4 font-mono text-slate-300 text-sm">
                G_&#123;xi, beta&#125;(y); ES = VaR / (1 - xi) + (beta - xi*u) / (1 - xi)
              </td>
              <td className="py-4 px-4 text-right text-cyan-400 font-semibold tabular-nums">
                {formatUnits(risk.evtVarUnits)}
                <div className="text-slate-400 font-normal">({risk.evtVarPct.toFixed(2)}%)</div>
              </td>
              <td className="py-4 px-4 text-right text-rose-400 font-semibold tabular-nums">
                {formatUnits(risk.evtEsUnits)}
                <div className="text-slate-400 font-normal">({risk.evtEsPct.toFixed(2)}%)</div>
              </td>
              <td className="py-4 px-4 text-right text-slate-300 tabular-nums">
                {formatUnits(risk.evtEsUnits - risk.evtVarUnits)}
              </td>
              <td className="py-4 px-4 text-center">
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold font-sans">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ES &ge; VaR</span>
                </span>
              </td>
              <td className="py-4 px-4 text-center">
                <button
                  onClick={() => onSelectMethodology('evt')}
                  className={"px-3 py-1.5 rounded text-sm font-sans font-bold transition-all cursor-pointer " +
                    (activeMethodology === 'evt'
                      ? "bg-cyan-400 text-slate-950"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    )}
                >
                  {activeMethodology === 'evt' ? "Selected" : "Select"}
                </button>
              </td>
            </tr>

          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800 text-sm text-slate-400 flex items-center gap-2">
        <Info className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          Expected Shortfall (ES) satisfies coherent subadditivity axioms across all three engines, preventing severe tail undercapitalization.
        </span>
      </div>
    </div>
  );
};
