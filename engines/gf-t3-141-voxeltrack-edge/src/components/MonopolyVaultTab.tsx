/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  FileCheck, 
  Lock, 
  Award, 
  DollarSign, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Key, 
  Sparkles,
  Layers,
  Scale
} from 'lucide-react';
import { ENTERPRISE_APA_AGREEMENT_MD, LEGAL_IP_AUDIT_MD } from '../data/specData';

export const MonopolyVaultTab: React.FC = () => {
  const [copiedApa, setCopiedApa] = useState<boolean>(false);
  const [copiedAudit, setCopiedAudit] = useState<boolean>(false);
  const [signedState, setSignedState] = useState<boolean>(true);

  const copyApa = () => {
    navigator.clipboard.writeText(ENTERPRISE_APA_AGREEMENT_MD);
    setCopiedApa(true);
    setTimeout(() => setCopiedApa(false), 2000);
  };

  const copyAudit = () => {
    navigator.clipboard.writeText(LEGAL_IP_AUDIT_MD);
    setCopiedAudit(true);
    setTimeout(() => setCopiedAudit(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Vault Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-emerald-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              INSTITUTIONAL MONOPOLY VAULT CLEARANCE
            </span>
            <span className="px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-xs font-bold">
              DELAWARE JURISDICTION
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Turnkey Software Asset Purchase Agreement & Clean-Room IP Certification
          </h2>
          <p className="text-sm text-zinc-300 mt-1 max-w-2xl leading-relaxed">
            Institutional reference core (PostgreSQL 16 + RLS), clean-room legal IP audit, and complete non-infringement indemnity for Track 3 Engine GF-T3-140.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/90 border border-emerald-500/30 text-right font-mono shrink-0 shadow-lg">
          <div className="text-[11px] text-zinc-400 uppercase tracking-wider">
            SPECIFICATION & MONOPOLY ASSET TRANSFER
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-0.5">
            PostgreSQL 16 + RLS
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Escrow Wire / Immediate IP Assignment
          </div>
        </div>
      </div>

      {/* 4 Core Legal Assurance Pillar Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/85 border border-zinc-800 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-500/30 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Clean-Room Score: 10/10</div>
            <div className="text-xs text-zinc-400 mt-0.5">100% de novo synthesized code without third-party trade secrets.</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/85 border border-zinc-800 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/30 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Zero Copyleft Assertion</div>
            <div className="text-xs text-zinc-400 mt-0.5">Strict blacklist: 0% GPL, AGPL, or SSPL codebases.</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/85 border border-zinc-800 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-950 text-purple-400 border border-purple-500/30 shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Permissive Licenses Only</div>
            <div className="text-xs text-zinc-400 mt-0.5">MIT, Apache 2.0, and 3-Clause BSD dependency manifest.</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/85 border border-zinc-800 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-950 text-amber-400 border border-amber-500/30 shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Full IP Assignment</div>
            <div className="text-xs text-zinc-400 mt-0.5">Global irrevocability, patent warranties & trade secret transfer.</div>
          </div>
        </div>
      </div>

      {/* Dual Document Viewers */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Document 1: Turnkey Software Asset Purchase Agreement Agreement */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-zinc-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                ENTERPRISE_APA_AGREEMENT.md
              </h3>
            </div>
            <button
              onClick={copyApa}
              className="px-3 py-1 rounded-lg bg-slate-950 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              {copiedApa ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedApa ? 'COPIED' : 'COPY APA'}</span>
            </button>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-zinc-800/80 font-mono text-xs overflow-x-auto max-h-[440px] overflow-y-auto">
            <pre className="text-slate-300 whitespace-pre leading-relaxed">
              {ENTERPRISE_APA_AGREEMENT_MD}
            </pre>
          </div>

          {/* Digital Signature Box */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-emerald-500/30 flex items-center justify-between gap-4 font-mono text-xs">
            <div>
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                DIGITALLY SEALED UNDER GHOST FACTORYOS MONOPOLY PROTOCOL
              </div>
              <div className="text-zinc-500 text-[11px] mt-0.5">
                Timestamp: 2026-10-05T16:47:45Z • Escrow Clearance ID: #GF-ESC-125K-98124
              </div>
            </div>
            <span className="px-3 py-1 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/40 shrink-0">
              SIGNED & SEALED
            </span>
          </div>
        </div>

        {/* Document 2: Clean-Room IP Audit Certificate */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-zinc-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <h3 className="text-base font-bold text-white">
                LEGAL_IP_AUDIT.md
              </h3>
            </div>
            <button
              onClick={copyAudit}
              className="px-3 py-1 rounded-lg bg-slate-950 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              {copiedAudit ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAudit ? 'COPIED' : 'COPY AUDIT'}</span>
            </button>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-zinc-800/80 font-mono text-xs overflow-x-auto max-h-[440px] overflow-y-auto">
            <pre className="text-cyan-200/90 whitespace-pre leading-relaxed">
              {LEGAL_IP_AUDIT_MD}
            </pre>
          </div>

          {/* Clean Room Certification Stamp */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-cyan-500/30 flex items-center justify-between gap-4 font-mono text-xs">
            <div>
              <div className="text-cyan-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                IP GOVERNANCE BOARD CERTIFICATE: 10.0 / 10.0 SCORE
              </div>
              <div className="text-zinc-500 text-[11px] mt-0.5">
                SHA-256 Audit Digest: 77bdf8219038abce1982736182903841e73a988d8b4e4dfb
              </div>
            </div>
            <span className="px-3 py-1 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40 shrink-0">
              PASSED 10/10
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
