import React, { useState } from 'react';
import { FileText, Copy, Check, Terminal, Sparkles, CheckCircle2 } from 'lucide-react';
import { ENGINE_SPEC_MD } from '../artifacts/engineSpec';

export const EngineSpecViewer: React.FC = () => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ENGINE_SPEC_MD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-7 h-7 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">
              ENGINE_SPEC.md: F1 Skunkworks Service Engine (70% Workload Deliverable)
            </h2>
          </div>
          <p className="text-base text-slate-300">
            Autonomous ingestion-ready architectural blueprint formatted for Google Antigravity autonomous agent fleets. Satisfies all 5 Monopoly Vault Criteria.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer text-base whitespace-nowrap"
        >
          {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-cyan-400" />}
          {copied ? 'Copied Spec!' : 'Copy ENGINE_SPEC.md'}
        </button>
      </div>

      {/* Criteria Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: '1. Architectural Topology', desc: 'PCIe Gen4, lock-free ring buffers, CAN-FD egress' },
          { title: '2. Mathematical Rigor', desc: 'Closed-form SAE Lucas-Kanade & LIF spike ODEs' },
          { title: '3. Production AlloyDB DDL', desc: 'Time-range partitioning, BRIN indices, immutable audit triggers' },
          { title: '4. OpenAPI 3.1 Contract', desc: 'Binary packet streams, RFC 7807 problem details' },
          { title: '5. Clean-Room IP Audit', desc: '100% permissive MIT/BSD/Apache, 0% copyleft' },
          { title: '6. Delaware Court Diligence', desc: 'Delaware Chancery Court jurisdiction, perpetual asset transfer' },
        ].map((item, idx) => (
          <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-base font-bold text-white">{item.title}</div>
              <div className="text-sm text-slate-400">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Markdown Document Content */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 font-sans text-base text-slate-300 leading-relaxed max-h-[700px] overflow-y-auto whitespace-pre-wrap">
          {ENGINE_SPEC_MD}
        </div>
      </div>
    </div>
  );
};
