import React, { useState } from 'react';
import { ShieldCheck, DollarSign, FileCheck, Copy, Check, Download, Landmark, Award } from 'lucide-react';

export const MonopolyVaultTab: React.FC = () => {
  const [copiedAgreement, setCopiedAgreement] = useState(false);
  const [copiedAudit, setCopiedAudit] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'ASSET TRANSFER' | 'SEAT' | 'CONSORTIUM'>('ASSET TRANSFER');

  const copyAgreement = () => {
    navigator.clipboard.writeText(`ENTERPRISE_APA_AGREEMENT.md - GF-T3-154 Reference Core: 20 kHz (0.48ms)`);
    setCopiedAgreement(true);
    setTimeout(() => setCopiedAgreement(false), 2000);
  };

  const copyAudit = () => {
    navigator.clipboard.writeText(`LEGAL_IP_AUDIT.md - 100% Permissive Clean-Room Certification`);
    setCopiedAudit(true);
    setTimeout(() => setCopiedAudit(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Landmark className="w-7 h-7 text-amber-400" />
            <h2 className="text-2xl font-black tracking-tight text-white uppercase font-mono">
              Monopoly Vault // Turnkey Asset Purchase Agreement (Commercial Software Asset Standard)
            </h2>
          </div>
          <p className="text-sm font-semibold text-slate-300 mt-1">
            Pre-drafted, institutional-grade M&amp;A contract and clean-room IP audit for immediate asset asset transfer
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={copyAgreement}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-mono font-black flex items-center gap-2 transition-all shadow-lg shadow-amber-600/35"
          >
            {copiedAgreement ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiedAgreement ? 'COPIED APA' : 'COPY APA AGREEMENT'}
          </button>
          <button
            onClick={copyAudit}
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-mono font-black flex items-center gap-2 transition-all shadow-lg shadow-emerald-700/35"
          >
            {copiedAudit ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            {copiedAudit ? 'COPIED AUDIT' : 'COPY IP AUDIT'}
          </button>
        </div>
      </div>

      {/* Licensing Schedule Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Tier 1: Single Seat */}
        <div
          onClick={() => setSelectedTier('SEAT')}
          className={`cursor-pointer bg-[#0d121f] rounded-xl p-6 border transition-all ${
            selectedTier === 'SEAT'
              ? 'border-violet-500 bg-violet-950/25 shadow-xl shadow-violet-600/25 ring-1 ring-violet-500'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-sm font-black uppercase tracking-wider text-slate-300 font-mono">
              Tier 1 // Single Seat
            </span>
            <span className="text-xs font-black px-2.5 py-1 rounded bg-slate-800 text-slate-200">
              NON-EXCLUSIVE
            </span>
          </div>
          <div className="text-3xl font-black font-mono text-white mb-2">20 kHz (0.48ms)</div>
          <p className="text-sm text-slate-300 font-medium leading-relaxed">
            Perpetual single hedge fund deployment license. Unlimited trade flow, Docker container delivery, and 1 year security patches.
          </p>
        </div>

        {/* Tier 2: Institutional Reference Core */}
        <div
          onClick={() => setSelectedTier('ASSET TRANSFER')}
          className={`cursor-pointer bg-[#0d121f] rounded-xl p-6 border transition-all ${
            selectedTier === 'ASSET TRANSFER'
              ? 'border-amber-500 bg-amber-950/25 shadow-xl shadow-amber-600/25 ring-2 ring-amber-500'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-sm font-black uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
              <Award className="w-4 h-4" /> Standalone Reference Core
            </span>
            <span className="text-xs font-black px-2.5 py-1 rounded bg-amber-900/70 text-amber-300 border border-amber-600/70">
              FULL IP ASSIGNMENT
            </span>
          </div>
          <div className="text-4xl font-black font-mono text-amber-300 mb-2">20 kHz (0.48ms)</div>
          <p className="text-sm text-slate-200 font-medium leading-relaxed">
            Complete irreversible IP acquisition under Turnkey Software Asset Purchase Agreement. 100% exclusive source rights, trade secrets, and non-infringement indemnity.
          </p>
        </div>

        {/* Tier 3: Consortium Sovereign */}
        <div
          onClick={() => setSelectedTier('CONSORTIUM')}
          className={`cursor-pointer bg-[#0d121f] rounded-xl p-6 border transition-all ${
            selectedTier === 'CONSORTIUM'
              ? 'border-emerald-500 bg-emerald-950/25 shadow-xl shadow-emerald-600/25 ring-1 ring-emerald-500'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-sm font-black uppercase tracking-wider text-emerald-400 font-mono">
              Tier 3 // Consortium Sovereign
            </span>
            <span className="text-xs font-black px-2.5 py-1 rounded bg-emerald-900/70 text-emerald-300 border border-emerald-600/70">
              UNLIMITED RESALE
            </span>
          </div>
          <div className="text-3xl font-black font-mono text-white mb-2">20 kHz (0.48ms)</div>
          <p className="text-sm text-slate-300 font-medium leading-relaxed">
            Global multi-venue white-label license, sub-licensing distribution rights, and co-location kernel optimization modules.
          </p>
        </div>
      </div>

      {/* Main Legal Clauses Inspector */}
      <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h3 className="text-xl font-black tracking-tight text-white uppercase font-mono flex items-center gap-2.5">
            <FileCheck className="w-6 h-6 text-amber-400" />
            Executed Agreement Summary &amp; Legal Verification
          </h3>
          <p className="text-sm text-slate-300 mt-1">
            Governing Turnkey Software Asset Purchase Agreement clauses for GF-T3-154
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-xl bg-[#07090e] border border-slate-800 space-y-2.5">
            <div className="text-sm font-black uppercase text-amber-400 font-mono">
              Section 1.1 // Acquired Assets Schedule
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              Transfer encompasses complete source code for <code className="text-violet-300 font-bold">router_engine.py</code>, test harnesses, distroless Docker containers, mathematical proofs, and all design patents covering the radial route split visual trade-dress.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#07090e] border border-slate-800 space-y-2.5">
            <div className="text-sm font-black uppercase text-emerald-400 font-mono">
              Section 3.2 // Clean-Room Warranty
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              Seller explicitly represents and warrants that 0% copyleft open source (GPL/AGPL/SSPL) contaminated the asset. 100% of code utilizes permissive Apache 2.0 or MIT licenses with zero third-party encumbrance.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#07090e] border border-slate-800 space-y-2.5">
            <div className="text-sm font-black uppercase text-violet-400 font-mono">
              Section 4.1 // Worldwide IP Assignment
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              Seller unconditionally conveys and assigns all worldwide right, title, interest, copyright registrations, and rights of action for past or future infringement to Buyer in perpetuity.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#07090e] border border-slate-800 space-y-2.5">
            <div className="text-sm font-black uppercase text-blue-400 font-mono">
              Section 6.1 // Delaware Law &amp; AAA Arbitration
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              Governed strictly by Delaware General Corporation Law. Expedited binding commercial arbitration conducted in Wilmington, DE under AAA Commercial Arbitration Rules.
            </p>
          </div>
        </div>

        {/* Clean-Room License Table */}
        <div className="pt-5 border-t border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-sm font-mono font-black uppercase text-slate-300">
              Clean-Room Permissive Dependency Manifest (LEGAL_IP_AUDIT.md)
            </span>
            <span className="text-sm font-mono font-black text-emerald-400">
              COPYLEFT CONTAMINATION: ZERO (0.00%)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-300 uppercase">
                  <th className="py-3 px-4 font-black">Package</th>
                  <th className="py-3 px-4 font-black">License</th>
                  <th className="py-3 px-4 font-black">Commercial Re-sale</th>
                  <th className="py-3 px-4 font-black">Patent Grant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-200">
                <tr>
                  <td className="py-3 px-4 font-black text-white">Python Standard Lib</td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">PSF 2.0 (Permissive)</td>
                  <td className="py-3 px-4 text-emerald-400 font-black">AUTHORIZED</td>
                  <td className="py-3 px-4 text-emerald-400 font-black">YES</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-black text-white">FastAPI / Pydantic</td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">MIT (Permissive)</td>
                  <td className="py-3 px-4 text-emerald-400 font-black">AUTHORIZED</td>
                  <td className="py-3 px-4 text-emerald-400 font-black">YES</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-black text-white">Google Distroless</td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">Apache 2.0 (Permissive)</td>
                  <td className="py-3 px-4 text-emerald-400 font-black">AUTHORIZED</td>
                  <td className="py-3 px-4 text-emerald-400 font-black">EXPLICIT GRANT</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-black text-white">React / Tailwind</td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">MIT (Permissive)</td>
                  <td className="py-3 px-4 text-emerald-400 font-black">AUTHORIZED</td>
                  <td className="py-3 px-4 text-emerald-400 font-black">YES</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Digital Signature Block */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3.5">
            <ShieldCheck className="w-9 h-9 text-emerald-400 shrink-0" />
            <div>
              <div className="text-sm font-mono font-black text-white uppercase">
                Digital Delaware M&amp;A Escrow Ready
              </div>
              <div className="text-xs text-slate-300 font-mono mt-0.5">
                Hash: <span className="text-violet-400 font-bold">SHA256: 9b2d8e4f1a073c...gf154</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-base font-mono font-black text-amber-400">
              SPECIFICATION: 20 kHz (0.48ms)
            </div>
            <div className="text-xs font-mono text-slate-300 font-medium">
              Escrow Settlement: Fedwire / USDC
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
