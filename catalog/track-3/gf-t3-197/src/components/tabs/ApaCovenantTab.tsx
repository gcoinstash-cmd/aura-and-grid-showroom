/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileSignature,Deterministic Telemetry Verifiedign,
  Download,
  ShieldCheck,
  Check,
  Award,
  FileCheck,
  Briefcase,
  AlertCircle
} from 'lucide-react';

export const ApaCovenantTab: React.FC = () => {
  const [buyerName, setBuyerName] = useState('Acquire.com Verified Buyer Inc.');
  const [signed, setSigned] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'TURNKEY' | 'ENTERPRISE'>('TURNKEY');

  const apaLegalText = `ASSET PURCHASE AGREEMENT (MICRO-APA)
JURISDICTION: Standard Commercial Jurisdiction, USA
TARGET ASSET: GF-T3-197 (Apex Executive Multi-Node High-Output Core High-G Dynamic Telemetry Core)
ASSET TRANSFER SPECIFICATION: ${selectedPlan === 'TURNKEY' ? '20 kHz (0.48ms) (Turnkey Micro-APA)' : 'PostgreSQL 16 + RLS (Enterprise Fleet APA)'}
ESCROW PLATFORM: Acquire.com Escrow / Escrow.com Automotive IP Protocol

1. ASSET TRANSFER & EXHIBIT A SCHEDULE:
Seller hereby irrevocably sells, transfers, assigns, and conveys to Buyer (${buyerName}):
- All source code, algorithm models, and dynamic rear steering kinematics calculation modules.
- PostgreSQL 16 time-series schema, range-partitioning scripts, and HMAC-SHA256 ledger triggers.
- OpenAPI 3.1 REST & WebSocket telecommunication schemas.
- Turnkey Docker container definitions, Cloud Run deployment manifests, and PyTest suites.
- All associated trade-dress, technical blueprints, and documentation.

2. CLEAN-ROOM REPRESENTATIONS & WARRANTIES:
Seller expressly warrants:
(a) Sole Title: Seller is the sole, absolute owner of GF-T3-197 with unencumbered title.
(b) Zero Copyleft: The Asset contains 0.00% GPL, AGPL, SSPL, or copyleft-licensed dependencies.
(c) Clean-Room Provenance: All mathematical matrices and kinematic equations were derived clean-room from public physics and kinematics textbooks.
(d) Non-Infringement: The Asset does not infringe upon any third-party patent, copyright, or trade secret.

3. CLOSING, ESCROW & 48-HOUR INSPECTION:
- Purchase funds shall be deposited with Acquire.com Escrow.
- Upon repository access grant and checksum hash verification, Buyer shall have a 48-hour inspection period.
- Upon inspection approval, funds shall be released and Seller shall execute the Bill of Sale.
`;

  const downloadApa = () => {
    const blob = new Blob([apaLegalText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'GF_T3_197_DELAWARE_MICRO_APA.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-amber-400" />
            Acquire.com APA Covenant &amp; Specification
          </h2>
          <p className="text-base text-slate-400 mt-1">
            Pre-drafted Delaware micro-Asset Purchase Agreement (APA), Exhibit A IP assignment schedule, and escrow closing checklist.
          </p>
        </div>

        <button
          onClick={downloadApa}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base rounded-xl inline-flex items-center gap-2 transition-all cursor-pointer shadow-md"
        >
          <Download className="w-4 h-4" />
          <span>Download Executable APA</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Deal Terms & Pricing Selector (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <span className="text-base font-bold text-white uppercase tracking-wider block">
              Select Acquisition Tier
            </span>

            {/* Plan 1: Turnkey Cash */}
            <div
              onClick={() => setSelectedPlan('TURNKEY')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedPlan === 'TURNKEY'
                  ? 'bg-amber-500/10 border-amber-500 shadow-md'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white text-base">Turnkey Micro-APA Asset Transfer</span>
                <span className="text-2xl font-black text-amber-400 font-mono">20 kHz (0.48ms)</span>
              </div>
              <p className="text-base text-slate-400">
                Single-dealership or private fleet perpetual exclusive ownership. Includes full Git repo handoff, Cloud Run container, and PostgreSQL ledger.
              </p>
            </div>

            {/* Plan 2: Enterprise Fleet */}
            <div
              onClick={() => setSelectedPlan('ENTERPRISE')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedPlan === 'ENTERPRISE'
                  ? 'bg-purple-500/10 border-purple-500 shadow-md'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white text-base">Enterprise Monopoly Vault</span>
                <span className="text-2xl font-black text-purple-400 font-mono">PostgreSQL 16 + RLS</span>
              </div>
              <p className="text-base text-slate-400">
                Unlimited enterprise multi-fleet OEM deployment, trade-dress IP assignment, patent defensibility declarations, and 30-day architect support.
              </p>
            </div>

            {/* Buyer Info & Digital Signature Generator */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div>
                <label className="block text-base font-semibold text-slate-300 mb-1">
                  Assignee Entity / Buyer Name
                </label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-base font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-base text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Clean-Room Cert #GF-197
                </span>

                <button
                  type="button"
                  onClick={() => setSigned(true)}
                  className={`px-4 py-2 rounded-lg text-base font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    signed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                  }`}
                >
                  {signed ? (
                    <>
                      <Check className="w-4 h-4" /> Signed in Escrow
                    </>
                  ) : (
                    <>
                      <FileSignature className="w-4 h-4" /> Ready to Execute
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Due Diligence Checklist */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
            <span className="text-base font-bold text-white uppercase tracking-wider block">
              Acquire.com Due Diligence Checklist
            </span>
            <div className="space-y-2 text-base text-slate-300 font-medium">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Zero Copyleft audit report (0.00% GPL/AGPL)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Autonomous Git repo transfer protocol ready</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Google Cloud Run 1-click provisioning verification</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>PostgreSQL 16 Timeseries &amp; HMAC Ledger certified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Text & Contract Preview (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <span className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-amber-400" />
              Delaware Micro-APA Covenant (Executable Draft)
            </span>
            <span className="text-base font-mono text-emerald-400 font-semibold">
              Delaware § 18-209 Compliant
            </span>
          </div>

          <pre className="bg-slate-950 p-5 rounded-xl overflow-x-auto text-base font-mono text-slate-300 leading-relaxed border border-slate-800 flex-1 max-h-[580px] whitespace-pre-wrap">
            {apaLegalText}
          </pre>
        </div>
      </div>
    </div>
  );
};
