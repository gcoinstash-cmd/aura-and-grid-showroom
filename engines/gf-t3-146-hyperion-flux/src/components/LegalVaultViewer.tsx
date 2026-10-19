import React, { useState } from 'react';
import { ShieldCheck, FileText, CheckCircle2, Copy, Check, Lock, Scale } from 'lucide-react';
import { ENTERPRISE_APA_AGREEMENT_MD } from '../artifacts/enterpriseApa';
import { LEGAL_IP_AUDIT_MD } from '../artifacts/legalIpAudit';

export const LegalVaultViewer: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<'APA' | 'AUDIT'>('APA');
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    const text = activeDoc === 'APA' ? ENTERPRISE_APA_AGREEMENT_MD : LEGAL_IP_AUDIT_MD;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
            <h2 className="text-2xl font-bold text-white">
              Institutional Legal Vault & Turnkey Software Asset Purchase Agreement Agreement
            </h2>
          </div>
          <p className="text-base text-slate-300">
            Unredacted Turnkey Software Asset Purchase Agreement ($145,000 Asset Transfer) and 100% Clean-Room Intellectual Property Audit Certification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer text-base whitespace-nowrap"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-cyan-400" />}
            {copied ? 'Copied Contract!' : 'Copy Active Document'}
          </button>
        </div>
      </div>

      {/* Transaction Key Facts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-emerald">
          <div className="text-sm font-semibold text-slate-400 mb-1">ASSET IDENTIFIER</div>
          <div className="text-2xl font-black font-mono text-emerald-400">GF-T3-146</div>
          <div className="text-sm text-slate-400 mt-1">Hyperion-Flux Engine</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-amber">
          <div className="text-sm font-semibold text-slate-400 mb-1">TRANSACTION SPECIFICATION</div>
          <div className="text-2xl font-black font-mono text-amber-400">$145,000 USD</div>
          <div className="text-sm text-slate-400 mt-1">Outright Perpetual Asset Transfer</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-cyan">
          <div className="text-sm font-semibold text-slate-400 mb-1">GOVERNING JURISDICTION</div>
          <div className="text-2xl font-black font-mono text-cyan-400">STATE OF DELAWARE</div>
          <div className="text-sm text-slate-400 mt-1">Delaware Court of Chancery</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <div className="text-sm font-semibold text-slate-400 mb-1">COPYLEFT CONTAGION</div>
          <div className="text-2xl font-black font-mono text-emerald-400">0.0% (ZERO RISK)</div>
          <div className="text-sm text-slate-400 mt-1">100% Permissive (MIT/BSD/Apache)</div>
        </div>
      </div>

      {/* Document Switcher & Reader */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <button
            onClick={() => setActiveDoc('APA')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-bold transition-all cursor-pointer ${
              activeDoc === 'APA'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Scale className="w-5 h-5 text-amber-400" />
            1. Turnkey Software Asset Purchase Agreement Agreement (Institutional Asset Transfer)
          </button>

          <button
            onClick={() => setActiveDoc('AUDIT')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-bold transition-all cursor-pointer ${
              activeDoc === 'AUDIT'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            2. Clean-Room IP & Compliance Audit
          </button>
        </div>

        {/* Contract Text Body */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 font-sans text-base text-slate-300 leading-relaxed max-h-[600px] overflow-y-auto whitespace-pre-wrap">
          {activeDoc === 'APA' ? ENTERPRISE_APA_AGREEMENT_MD : LEGAL_IP_AUDIT_MD}
        </div>
      </div>
    </div>
  );
};
