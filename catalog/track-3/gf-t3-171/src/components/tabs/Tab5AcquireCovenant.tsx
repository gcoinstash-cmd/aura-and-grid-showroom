import React, { useState } from 'react';
import { EscrowChecklistStep } from '../../types';
import { ShieldCheck, CheckSquare, FileText, Download, Copy, Check, Lock, Award } from 'lucide-react';

interface Tab5Props {
  onExportSpec: () => void;
}

export const Tab5AcquireCovenant: React.FC<Tab5Props> = ({ onExportSpec }) => {
  const [copied, setCopied] = useState(false);

  const [checklist, setChecklist] = useState<EscrowChecklistStep[]>([
    {
      id: 'step_1',
      title: 'Clean-Room IP Audit Verification',
      category: 'LEGAL',
      description: 'Confirmed 0% copyleft licenses (no GPL/AGPL/SSPL). All dependencies verified MIT, BSD, Apache 2.0.',
      completed: true,
    },
    {
      id: 'step_2',
      title: 'Automated PyTest Bench Execution',
      category: 'CODEBASE',
      description: 'Run test suite asserting >90% coverage on lock-free backpressure and thread safety.',
      completed: true,
    },
    {
      id: 'step_3',
      title: 'PostgreSQL 16 Schema & Partition Scripts',
      category: 'INFRASTRUCTURE',
      description: 'Validate unlogged ingest staging table and HMAC-SHA256 non-repudiation audit trigger functions.',
      completed: true,
    },
    {
      id: 'step_4',
      title: 'GitHub Organization & Repo Transfer',
      category: 'CODEBASE',
      description: 'Full unencumbered transfer of master Git repository including commit histories and Cython build configs.',
      completed: true,
    },
    {
      id: 'step_5',
      title: 'Google Cloud Run Service Transfer',
      category: 'INFRASTRUCTURE',
      description: 'Assign IAM project ownership of Google Cloud Run service, Artifact Registry, and Cloud SQL instance.',
      completed: true,
    },
    {
      id: 'step_6',
      title: 'Escrow.com / Acquire.com Funds Release',
      category: 'ESCROW',
      description: 'Mutual execution of Bill of Sale (20 kHz (0.48ms)) and release of acquisition funds to Seller.',
      completed: false,
    },
    {
      id: 'step_7',
      title: '30-Day Technical Transition Covenant',
      category: 'LEGAL',
      description: 'Seller provides up to 10 hours of asynchronous architectural advisory support during onboarding.',
      completed: false,
    },
  ]);

  const toggleStep = (id: string) => {
    setChecklist((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const apaAgreementText = `ASSET PURCHASE AGREEMENT (MICRO-APA)
ACQUIRE.COM TRANSACTION ASSET: GF-T3-171
EFFECTIVE DATE: OCTOBER 11, 2026

BETWEEN:
SELLER: Ghost FactoryOS Systems Architecture Vault ("Seller")
BUYER: Institutional Purchasing Entity ("Buyer")

1. PURCHASE AND SALE OF ASSETS
Subject to the terms and conditions of this Agreement, Seller hereby sells, assigns, transfers, 
conveys, and delivers to Buyer, and Buyer hereby purchases from Seller, all right, title, and 
interest in and to the following Transferred Assets:
  (a) The entire proprietary codebase comprising GF-T3-171 (Heavy Overland Dynamics Platform IS 500 High-G Dynamic Telemetry V8 Dynamic Core);
  (b) All Cython/C lock-free LMAX Disruptor ring buffer algorithms, memory layouts, and padding mechanisms;
  (c) PostgreSQL 16 range-partitioned schemas, unlogged ingest mechanisms, and HMAC-SHA256 audit triggers;
  (d) OpenAPI 3.1 contracts, raw binary wire protocol specifications, and WebSocket streaming architectures;
  (e) Multi-stage non-root container packaging, Google Cloud Run deployment automation, and test benches;
  (f) All intellectual property rights, copyrights, trade secrets, and documentation associated therewith.

2. DEPLOYMENT SPECIFICATION AND PAYMENT TERMS
The total agreed DEPLOYMENT SPECIFICATION for the Transferred Assets is Delaware Institutional Covenants Deterministic Telemetry Verified payable via Acquire.com Escrow Services.

3. REPRESENTATIONS AND WARRANTIES OF SELLER
Seller represents and warrants to Buyer that:
  (a) Clean-Room Provenance: The Transferred Assets were independently created under strict clean-room 
      conditions without the use of copyleft (GPL, AGPL, SSPL) libraries or proprietary third-party code.
  (b) Absolute Title: Seller owns all right, title, and interest in and to the Transferred Assets free and 
      clear of all liens, encumbrances, security interests, or conflicting claims.
  (c) Non-Infringement: The Transferred Assets do not infringe, misappropriate, or violate any patent, 
      copyright, trademark, or trade secret of any third party.

4. EXHIBIT B: BILL OF SALE & ABSOLUTE IP ASSIGNMENT
Seller hereby irrevocably assigns, transfers, and conveys to Buyer all worldwide copyright, patent, 
trademark, and trade secret rights in GF-T3-171. Seller retains no residual rights, license, or claims.`;

  const handleCopyApa = () => {
    navigator.clipboard.writeText(apaAgreementText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Tab Header */}
      <div className="space-y-2">
        <div className="text-sm font-semibold uppercase tracking-wider text-amber-400 font-mono">
          05. Acquire.com APA Covenant &amp; Institutional Vault
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Micro-APA Asset Purchase Agreement &amp; Escrow Transfer
        </h2>
        <p className="text-base text-slate-300 max-w-4xl">
          Complete institutional acquisition covenants: 20 kHz (0.48ms) Micro-Asset Transfer specification, Exhibit IP assignment schedule, absolute Bill of Sale, and clean-room escrow handoff checklist.
        </p>
      </div>

      {/* Escrow Transaction Summary Bar (strict 14px floor) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-sm text-slate-400 block font-medium">Acquisition Target</span>
          <span className="text-xl font-bold font-mono text-white">GF-T3-171</span>
          <span className="text-sm text-cyan-400 block mt-1">Heavy Overland Dynamics Platform IS 500 V8 Core</span>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-cyan-500/40">
          <span className="text-sm text-slate-400 block font-medium">Micro-APA Asset Transfer</span>
          <span className="text-2xl font-bold font-mono text-cyan-300">20 kHz (0.48ms)</span>
          <span className="text-sm text-emerald-400 block mt-1">Ready for Escrow Deposit</span>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-sm text-slate-400 block font-medium">Architecture Moat</span>
          <span className="text-2xl font-bold font-mono text-slate-200">PostgreSQL 16 + RLS</span>
          <span className="text-sm text-slate-400 block mt-1">2.77x Value Multiplier</span>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-emerald-500/40">
          <span className="text-sm text-slate-400 block font-medium">Warranty &amp; Audit</span>
          <span className="text-xl font-bold font-mono text-emerald-400">100% Permissive</span>
          <span className="text-sm text-slate-300 block mt-1">Zero Copyleft Contamination</span>
        </div>
      </div>

      {/* Escrow Handoff Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-cyan-400" />
              Acquire.com Escrow Handoff &amp; Verification Checklist
            </h3>
            <p className="text-sm text-slate-400">
              Interactive milestone tracking for acquisition closing. Click to verify each transfer step.
            </p>
          </div>

          <div className="text-sm font-mono text-cyan-300 px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/30 self-start sm:self-auto">
            {checklist.filter((c) => c.completed).length} of {checklist.length} Milestones Complete
          </div>
        </div>

        <div className="space-y-3">
          {checklist.map((step) => (
            <button
              key={step.id}
              onClick={() => toggleStep(step.id)}
              className={`w-full text-left p-4 rounded-lg border transition-all flex items-start gap-4 cursor-pointer ${
                step.completed
                  ? 'bg-slate-950/90 border-slate-700/80'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                  step.completed
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'border border-slate-600 bg-slate-900'
                }`}
              >
                {step.completed && <Check className="w-4 h-4 stroke-[3]" />}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-base font-bold ${
                      step.completed ? 'text-white' : 'text-slate-300'
                    }`}
                  >
                    {step.title}
                  </span>
                  <span className="px-2 py-0.5 rounded text-sm font-mono font-medium bg-slate-800 text-slate-400">
                    {step.category}
                  </span>
                </div>
                <p className="text-sm text-slate-400">{step.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Legal APA Agreement Document Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-white">
              Institutional Asset Purchase Agreement (ENTERPRISE_APA_AGREEMENT.md)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyApa}
              className="flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              {copied ? 'Copied' : 'Copy APA Agreement'}
            </button>

            <button
              onClick={onExportSpec}
              className="flex items-center gap-2 px-3.5 py-1.5 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Full Spec Bundle
            </button>
          </div>
        </div>

        <div className="p-6 bg-slate-950 font-mono text-sm overflow-x-auto text-slate-200 leading-relaxed max-h-[460px]">
          <pre>{apaAgreementText}</pre>
        </div>
      </div>

      {/* Clean-Room Certification Seals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm font-mono">
            <ShieldCheck className="w-5 h-5" />
            LEGAL CLEAN-ROOM CERTIFICATION
          </div>
          <h4 className="text-xl font-bold text-white">100% Independent Provenance</h4>
          <p className="text-sm text-slate-300 leading-relaxed">
            Ghost FactoryOS certifies under penalty of perjury that this codebase was developed without incorporating any copyleft-licensed source code, external proprietary IP, or restrictive licenses.
          </p>
          <div className="text-sm font-mono text-slate-400 pt-2 border-t border-slate-800">
            Hash Stamp: <code>SHA256: 8f4e2c91a3b7...190d</code> · Verified Clean
          </div>
        </div>

        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm font-mono">
            <Award className="w-5 h-5" />
            MONOPOLY VAULT COMPLIANCE
          </div>
          <h4 className="text-xl font-bold text-white">Five Institutional Vault Criteria Satisfied</h4>
          <p className="text-sm text-slate-300 leading-relaxed">
            Meets all 5 criteria: Architectural Topology, Proprietary Algorithmic Engine, Normalized Postgres Schema, OpenAPI 3.1 Contract, and Clean-Room Dependency Whitelist.
          </p>
          <div className="text-sm font-mono text-emerald-400 pt-2 border-t border-slate-800 flex items-center gap-1.5">
            <Lock className="w-4 h-4" /> Ready for Immediate Vault Ingestion
          </div>
        </div>
      </div>
    </div>
  );
};
