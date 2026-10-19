/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ghost FactoryOS GF-T3-145 (Nexus-ATS)
 * Turnkey Software Asset Purchase Agreement ($150k Asset Transfer)
 */

import React, { useState } from 'react';
import { ENTERPRISE_APA_AGREEMENT_MD } from '../data/apaAgreement';
import { FileText, Copy, Check, DollarSign, Scale, Landmark, ShieldCheck } from 'lucide-react';

export const ApaAgreementModal: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ENTERPRISE_APA_AGREEMENT_MD);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/40 rounded-xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50 flex items-center gap-1.5 w-fit">
            <Landmark className="w-3.5 h-3.5" /> Institutional Asset Transfer Contract
          </span>
          <h2 className="text-3xl font-black text-white mt-2 flex items-center gap-3">
            <Scale className="w-8 h-8 text-emerald-400" />
            Turnkey Software Asset Purchase Agreement ($150,000 USD)
          </h2>
          <p className="text-slate-300 text-base mt-1 max-w-4xl">
            Unredacted Turnkey Software Asset Purchase Agreement for the complete perpetual intellectual property transfer of asset GF-T3-145 (Nexus-ATS) under exclusive Delaware Court of Chancery jurisdiction.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-base tracking-wide uppercase transition-all shadow-lg shadow-emerald-950 cursor-pointer"
        >
          {copied ? <Check className="w-5 h-5 text-slate-950" /> : <Copy className="w-5 h-5" />}
          <span>{copied ? 'AGREEMENT COPIED' : 'COPY ENTERPRISE_APA.MD'}</span>
        </button>
      </div>

      {/* Contract Key Terms Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
          <div className="text-xs font-bold uppercase text-slate-400">Total Purchase Price</div>
          <div className="text-2xl font-black text-emerald-400 font-mono-numbers mt-1">$150,000.00 USD</div>
          <div className="text-xs text-slate-400 mt-0.5">Wire Transfer at Closing</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
          <div className="text-xs font-bold uppercase text-slate-400">Target Asset</div>
          <div className="text-lg font-bold text-white font-mono-numbers mt-1">GF-T3-145 (Nexus-ATS)</div>
          <div className="text-xs text-slate-400 mt-0.5">100% IP & Codebase Assignment</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
          <div className="text-xs font-bold uppercase text-slate-400">Governing Law & Venue</div>
          <div className="text-lg font-bold text-amber-300 mt-1">State of Delaware</div>
          <div className="text-xs text-slate-400 mt-0.5">Delaware Court of Chancery</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
          <div className="text-xs font-bold uppercase text-slate-400">Warranties & Indemnity</div>
          <div className="text-lg font-bold text-teal-300 mt-1">Perpetual Survival</div>
          <div className="text-xs text-slate-400 mt-0.5">Non-infringement & Title</div>
        </div>
      </div>

      {/* Raw Agreement Document Preview */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-slate-300 text-sm font-bold uppercase">
          <span>ENTERPRISE_APA_AGREEMENT.md Full Contract Text</span>
          <span className="text-xs text-slate-400 font-mono-numbers">Transaction ID: APA-GF-T3-145-2026-OCT</span>
        </div>
        <pre className="text-xs md:text-sm text-emerald-200 font-mono-numbers overflow-x-auto p-4 bg-slate-950/90 rounded-lg border border-slate-800/80 max-h-[520px] leading-relaxed select-all whitespace-pre-wrap">
          {ENTERPRISE_APA_AGREEMENT_MD}
        </pre>
      </div>
    </div>
  );
};
