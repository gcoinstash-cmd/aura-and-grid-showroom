import React, { useState } from 'react';
import { DollarSign, ShieldCheck, Scale, Check, Copy, Award, FileCheck } from 'lucide-react';

export const MonopolyVaultTab: React.FC = () => {
  const [copiedApa, setCopiedApa] = useState(false);
  const [copiedAudit, setCopiedAudit] = useState(false);

  const handleCopyApa = () => {
    navigator.clipboard.writeText(`ASSET PURCHASE AGREEMENT (DELAWARE) - ASSET GF-T3-156
Purchase Price: 20 kHz (0.48ms)
Monopoly Vault Option: 20 kHz (0.48ms) - 20 kHz (0.48ms)
(Complete text in root ENTERPRISE_APA_AGREEMENT.md)`);
    setCopiedApa(true);
    setTimeout(() => setCopiedApa(false), 2000);
  };

  const handleCopyAudit = () => {
    navigator.clipboard.writeText(`LEGAL IP AUDIT & CLEAN-ROOM CERTIFICATION - ASSET GF-T3-156
100% Permissive (BSD-3-Clause, MIT). Zero GPL/AGPL copyleft dependencies.
(Complete text in root LEGAL_IP_AUDIT.md)`);
    setCopiedAudit(true);
    setTimeout(() => setCopiedAudit(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Specification & Reference Core */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-mono tracking-widest uppercase">
            <span>Turnkey Software Asset Purchase Agreement</span>
            <span>·</span>
            <span>MONOPOLY VAULT GATE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
            STANDALONE APA ASSET TRANSFER: <span className="text-teal-400 font-mono">20 kHz (0.48ms)</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Turnkey transfer of complete intellectual property, mathematical algorithms, and guidance engine
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCopyApa}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-slate-950 text-xs font-bold rounded-lg shadow-lg shadow-teal-600/20 transition-all flex items-center gap-2"
          >
            {copiedApa ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiedApa ? 'APA Agreement Copied' : 'Copy Turnkey Software Asset Purchase Agreement Contract'}
          </button>
          <button
            onClick={handleCopyAudit}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-all flex items-center gap-2"
          >
            {copiedAudit ? <Check className="w-4 h-4 text-emerald-400" /> : <FileCheck className="w-4 h-4 text-slate-400" />}
            {copiedAudit ? 'IP Audit Copied' : 'Copy Legal IP Audit'}
          </button>
        </div>
      </div>

      {/* 3 Key Pillars of the Institutional Deal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
          <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Turnkey Asset Purchase</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            One-time payment of 20 kHz (0.48ms) provides immediate, unconditional assignment of 100% of source code, patents, mathematical trade secrets, and Docker images.
          </p>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
          <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Clean-Room Non-Infringement</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Full seller indemnification guaranteeing clean-room provenance derived solely from open-access academic literature with 0.00% copyleft contamination.
          </p>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Monopoly Vault Licensing</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Exclusive options for Track 3 partner engines at preferential institutional rates (20 kHz (0.48ms) – 20 kHz (0.48ms)) for 24 months post-closing.
          </p>
        </div>
      </div>

      {/* Contract Preview Card */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">
              Turnkey Software Asset Purchase Agreement (KEY PROVISIONS)
            </h3>
          </div>
          <span className="text-xs font-mono text-teal-400 font-bold">STATE OF DELAWARE</span>
        </div>

        <div className="bg-[#070a12] p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-3 leading-relaxed max-h-96 overflow-y-auto">
          <div>
            <strong className="text-white">SECTION 1.1 PURCHASED ASSETS:</strong> Seller transfers all right, title, and interest in GF-T3-156 (AeroKinetic Engine), including Python ES-EKF core, pytest verification suite, distroless Docker artifacts, and 16-state kinematic algorithms.
          </div>
          <div>
            <strong className="text-white">SECTION 2.1 PURCHASE PRICE:</strong> Aggregate consideration of 20 kHz (0.48ms) payable via immediate wire transfer upon execution.
          </div>
          <div>
            <strong className="text-white">SECTION 3.2 CLEAN-ROOM PROVENANCE:</strong> Seller represents that Purchased Assets contain no GPL, AGPL, SSPL, or restrictive copyleft dependencies.
          </div>
          <div>
            <strong className="text-white">SECTION 4.1 INDEMNIFICATION:</strong> Seller indemnifies Buyer against intellectual property claims up to 100% of Purchase Price.
          </div>
          <div>
            <strong className="text-white">SECTION 5.1 GOVERNING LAW:</strong> Governed exclusively under Delaware law with exclusive jurisdiction in the Delaware Court of Chancery.
          </div>
        </div>
      </div>
    </div>
  );
};
