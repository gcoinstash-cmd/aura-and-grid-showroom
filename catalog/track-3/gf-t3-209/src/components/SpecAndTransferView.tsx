/**
 * SpecAndTransferView Component
 * Interactive documentation of Track 3 Reference Core:
 * - Mathematical Proofs & Formulas (EVT GPD POT, Cornish-Fisher, Hull-White)
 * - NIST SP 800-218 SSDF v1.1 Audit & Clean-Room IP Warranty
 * - Standard Commercial Asset Transfer Specification (Direct Repo Buyout)
 * Strict zero-dollar compliance & 14px floor.
 */

import React, { useState } from 'react';
import { BookOpen, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

export const SpecAndTransferView: React.FC = () => {
  const [subTab, setSubTab] = useState<'math' | 'audit' | 'apa'>('math');

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">
            GF-T3-209: Production Reference Core & Handoff Suite
          </h2>
          <div className="text-sm text-slate-400 mt-0.5">
            Peer-reviewed mathematical derivations, NIST SSDF compliance, and clean APA transfer criteria
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-md border border-slate-800">
          <button
            onClick={() => setSubTab('math')}
            className={"px-3 py-1.5 rounded text-sm font-semibold transition-all cursor-pointer " +
              (subTab === 'math' ? "bg-cyan-400 text-slate-950 shadow-sm" : "text-slate-400 hover:text-slate-200")
            }
          >
            Mathematical Engine
          </button>
          <button
            onClick={() => setSubTab('audit')}
            className={"px-3 py-1.5 rounded text-sm font-semibold transition-all cursor-pointer " +
              (subTab === 'audit' ? "bg-cyan-400 text-slate-950 shadow-sm" : "text-slate-400 hover:text-slate-200")
            }
          >
            Legal & SBOM Audit
          </button>
          <button
            onClick={() => setSubTab('apa')}
            className={"px-3 py-1.5 rounded text-sm font-semibold transition-all cursor-pointer " +
              (subTab === 'apa' ? "bg-cyan-400 text-slate-950 shadow-sm" : "text-slate-400 hover:text-slate-200")
            }
          >
            APA Transfer Spec
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: MATHEMATICAL DERIVATIONS */}
      {subTab === 'math' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5">
            <h3 className="text-base font-bold text-cyan-400 mb-2 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <span>1. Peaks-Over-Threshold Extreme Value Theory (EVT POT)</span>
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-3">
              By the Balkema-de Haan-Pickands theorem, distribution of excess losses Y = L - u over a high threshold u converges asymptotically to the Generalized Pareto Distribution (GPD):
            </p>
            <div className="bg-slate-950 p-4 rounded font-mono text-sm text-slate-200 border border-slate-800/80 mb-3 space-y-1">
              <div>G_&#123;xi, beta&#125;(y) = 1 - (1 + (xi * y) / beta)^(-1 / xi)</div>
              <div className="text-cyan-400 font-bold mt-2">Closed-Form Asymptotic VaR:</div>
              <div>VaR_alpha = u + (beta / xi) * [ ((N / N_u) * (1 - alpha))^(-xi) - 1 ]</div>
              <div className="text-rose-400 font-bold mt-2">Closed-Form Asymptotic Expected Shortfall (CVaR):</div>
              <div>ES_alpha = VaR_alpha / (1 - xi) + (beta - xi * u) / (1 - xi)</div>
            </div>
            <p className="text-sm text-slate-400">
              When xi &gt; 0, the distribution lies in the Fréchet domain of attraction (heavy tails). The closed-form ES identity guarantees coherence: because xi &lt; 1 and beta &gt; 0, ES_alpha is strictly greater than or equal to VaR_alpha across all confidence intervals.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5">
            <h3 className="text-base font-bold text-cyan-400 mb-2 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <span>2. Parametric Cornish-Fisher Higher-Moment Expansion</span>
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-3">
              Adjusts the standard Gaussian quantile z_alpha for empirical skewness S and excess kurtosis K:
            </p>
            <div className="bg-slate-950 p-4 rounded font-mono text-sm text-slate-200 border border-slate-800/80 mb-3">
              <div>z_cf = z_alpha + (S / 6)*(z_alpha^2 - 1) + (K / 24)*(z_alpha^3 - 3*z_alpha) - (S^2 / 36)*(2*z_alpha^3 - 5*z_alpha)</div>
            </div>
            <p className="text-sm text-slate-400">
              Convergence property: When S = 0 and K = 0, z_cf identically equals z_alpha, preserving pure Gaussian normality for ideal synthetic baselines.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5">
            <h3 className="text-base font-bold text-cyan-400 mb-2 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <span>3. Hull-White Volatility Updating (EWMA lambda = 0.94)</span>
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-3">
              Scales historical return observations by current rolling volatility:
            </p>
            <div className="bg-slate-950 p-4 rounded font-mono text-sm text-slate-200 border border-slate-800/80 mb-3">
              <div>r_t^* = r_t * (sigma_T / sigma_t)</div>
              <div>sigma_t^2 = 0.06 * r_&#123;t-1&#125;^2 + 0.94 * sigma_&#123;t-1&#125;^2</div>
            </div>
            <p className="text-sm text-slate-400">
              Eliminates the phantom risk tail effect where outdated low-volatility historical returns depress modern crisis tail protection.
            </p>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: LEGAL & SBOM AUDIT */}
      {subTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5">
            <h3 className="text-base font-bold text-emerald-400 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              <span>Clean-Room IP Provenance Attestation</span>
            </h3>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>100% Independent Development: All routines written de novo from academic literature.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Zero Reciprocal Copyleft: Explicitly blacklist GPL, AGPL, SSPL, and copyleft libraries.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Clean Title Warranty: Free and unencumbered perpetual assignment under standard APA terms.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>NIST SP 800-218 SSDF v1.1 Aligned: Deterministic math tests, non-root Docker container (UID 10001).</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide mb-3">
              Software Bill of Materials (SBOM) Manifest
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-3">Dependency Component</th>
                    <th className="py-2 px-3">Permissive License</th>
                    <th className="py-2 px-3">Copyleft Encumbrance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="py-2 px-3 text-slate-200 font-semibold">Python 3.10 Core Math / Hashlib</td>
                    <td className="py-2 px-3 text-cyan-400">PSFL</td>
                    <td className="py-2 px-3 text-emerald-400 font-sans">Zero (Verified Permissive)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-200 font-semibold">FastAPI & Uvicorn</td>
                    <td className="py-2 px-3 text-cyan-400">MIT / BSD 3-Clause</td>
                    <td className="py-2 px-3 text-emerald-400 font-sans">Zero (Verified Permissive)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-200 font-semibold">React 19 & Tailwind CSS 4</td>
                    <td className="py-2 px-3 text-cyan-400">MIT</td>
                    <td className="py-2 px-3 text-emerald-400 font-sans">Zero (Verified Permissive)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-200 font-semibold">Lucide Icons & Motion</td>
                    <td className="py-2 px-3 text-cyan-400">ISC / MIT</td>
                    <td className="py-2 px-3 text-emerald-400 font-sans">Zero (Verified Permissive)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: APA TRANSFER SPEC */}
      {subTab === 'apa' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5">
            <h3 className="text-base font-bold text-slate-200 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span>Standard Commercial Asset Transfer Specification</span>
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Structure designed exclusively for direct repository IP assignment under a standard commercial Asset Purchase Agreement:
            </p>
            
            <div className="space-y-3 text-sm text-slate-300">
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="font-bold text-slate-100 block mb-1">Direct Standalone Repo Transfer:</span>
                Entire codebase packaged as an independent, self-contained Git repository with engine.py, test suite, Dockerfile, and frontend terminal.
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="font-bold text-slate-100 block mb-1">Zero Ongoing SaaS or Subscription Burdens:</span>
                No per-seat fees, no per-node licensing, and no recurring maintenance invoices. Title transfers completely upon execution.
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="font-bold text-slate-100 block mb-1">SaaS SLA Disclaimer:</span>
                Operational deployment and container custody reside with the purchasing organization. Zero ongoing operational SaaS support SLAs are provided.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
