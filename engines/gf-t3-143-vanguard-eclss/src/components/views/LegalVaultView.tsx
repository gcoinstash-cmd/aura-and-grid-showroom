/**
 * Vanguard-ECLSS: Monopoly Vault & Legal IP Compliance View
 * Unredacted Turnkey Software Asset Purchase Agreement & Clean-Room IP Audit
 * Upgraded Font Floor & High-Legibility Typography
 */

import React, { useState } from 'react';
import { ShieldCheck, FileCheck, Copy, Check, Lock, Award, DollarSign, Scale } from 'lucide-react';
import { ENTERPRISE_APA_AGREEMENT_MD } from '../../artifacts/enterpriseApa';
import { LEGAL_IP_AUDIT_MD } from '../../artifacts/legalIpAudit';

export const LegalVaultView: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<'APA' | 'IP_AUDIT'>('APA');
  const [copied, setCopied] = useState(false);

  const handleCopyCurrent = () => {
    const content = activeDoc === 'APA' ? ENTERPRISE_APA_AGREEMENT_MD : LEGAL_IP_AUDIT_MD;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-amber-400" />
            MONOPOLY VAULT & $140,000 USD ENTERPRISE APA
          </h2>
          <p className="text-base text-slate-300 font-medium mt-1">
            Institutional Clean-Room Certification, unredacted Turnkey Software Asset Purchase Agreement, and copyleft immunization.
          </p>
        </div>

        <button
          onClick={handleCopyCurrent}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700 text-base font-bold font-mono transition cursor-pointer shadow-md"
        >
          {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
          <span>{copied ? 'DOCUMENT COPIED' : `COPY ${activeDoc === 'APA' ? 'ENTERPRISE_APA' : 'LEGAL_IP_AUDIT'}.MD`}</span>
        </button>
      </div>

      {/* Transaction & Specification Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono text-base">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 text-amber-400 font-bold text-lg">
            <DollarSign className="w-6 h-6" />
            <span>ASSET TRANSFER SPECIFICATION</span>
          </div>
          <div className="text-3xl font-extrabold text-white">
            $140,000.00 <span className="text-base font-normal text-slate-400">USD</span>
          </div>
          <p className="text-sm text-slate-300">
            Perpetual worldwide transfer of source code, mathematical engines, DDL schemas, and design IP.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-lg">
            <Scale className="w-6 h-6" />
            <span>DELAWARE JURISDICTION</span>
          </div>
          <div className="text-2xl font-bold text-white">Court of Chancery</div>
          <p className="text-sm text-slate-300">
            Governed under the laws of the State of Delaware with exclusive forum selection and standard non-infringement warranties.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-lg">
            <Award className="w-6 h-6" />
            <span>CLEAN-ROOM PROVENANCE</span>
          </div>
          <div className="text-2xl font-bold text-cyan-300">0.00% Copyleft Risk</div>
          <p className="text-sm text-slate-300">
            100% Permissive MIT / Apache-2.0 whitelist. Zero GPL, AGPL, or SSPL contagion verified.
          </p>
        </div>
      </div>

      {/* Document Selector & Markdown Viewer */}
      <div className="p-6 sm:p-7 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
        {/* Toggle tabs */}
        <div className="flex flex-wrap gap-3 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveDoc('APA')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-mono font-bold transition cursor-pointer ${
              activeDoc === 'APA'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-900/50'
                : 'bg-slate-950 text-slate-200 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <FileCheck className="w-5 h-5" />
            <span>ENTERPRISE_APA_AGREEMENT.MD ($140K ASSET TRANSFER)</span>
          </button>

          <button
            onClick={() => setActiveDoc('IP_AUDIT')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-mono font-bold transition cursor-pointer ${
              activeDoc === 'IP_AUDIT'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-900/50'
                : 'bg-slate-950 text-slate-200 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span>LEGAL_IP_AUDIT.MD (CLEAN-ROOM CERTIFICATE)</span>
          </button>
        </div>

        {/* Formatted Markdown Content */}
        <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm sm:text-base text-slate-200 overflow-x-auto max-h-[650px] leading-relaxed whitespace-pre-wrap select-all">
          {activeDoc === 'APA' ? ENTERPRISE_APA_AGREEMENT_MD : LEGAL_IP_AUDIT_MD}
        </div>
      </div>
    </div>
  );
};
