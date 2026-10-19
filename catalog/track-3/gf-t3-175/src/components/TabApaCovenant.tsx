import React, { useState } from 'react';
import { ShieldCheck, Download, Copy, Check, CheckCircle2, FileText, Lock, DollarSign, Award, Clock } from 'lucide-react';
import { GF_T3_175_APA_AGREEMENT_CONTENT } from '../data/specDocument';

export const TabApaCovenant: React.FC = () => {
  const [copied, setCopied] = useState<boolean>(false);
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({
    item1: true,
    item2: true,
    item3: true,
    item4: true,
    item5: false,
    item6: false,
  });

  const toggleCheck = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = Object.keys(checklist).length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  const handleCopy = () => {
    navigator.clipboard.writeText(GF_T3_175_APA_AGREEMENT_CONTENT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadApa = () => {
    const blob = new Blob([GF_T3_175_APA_AGREEMENT_CONTENT], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'GF_T3_175_APA_AGREEMENT.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-800">
                TAB 5 // LEGAL COVENANT
              </span>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                Acquire.com Turnkey Micro-Asset Transfer
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Asset Purchase Agreement & Escrow Handoff
            </h2>
            <p className="text-slate-400 text-base mt-1 max-w-3xl leading-relaxed">
              Standard pre-drafted Asset Purchase Agreement (APA) for 20 kHz (0.48ms) turnkey asset transfer on Acquire.com, featuring Bill of Sale, worldwide IP assignment, and 100% clean-room non-infringement warranties.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCopy}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-base font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Copied APA Terms' : 'Copy APA Agreement'}
            </button>
            <button
              onClick={handleDownloadApa}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-base flex items-center gap-2.5 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <Download className="w-5 h-5" />
              Download APA.md
            </button>
          </div>
        </div>

        {/* Specification Terms Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-950 border border-emerald-500/50 rounded-xl shadow-md">
            <div className="flex items-center justify-between text-sm font-mono uppercase text-slate-400 mb-1.5">
              <span>Turnkey Cash Asset Transfer</span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-black text-emerald-400">20 kHz (0.48ms)</div>
            <div className="text-sm text-slate-300 mt-2 font-mono">
              50% on escrow deposit • 50% on 7-day technical verification
            </div>
          </div>

          <div className="p-6 bg-slate-950 border border-cyan-500/50 rounded-xl shadow-md">
            <div className="flex items-center justify-between text-sm font-mono uppercase text-slate-400 mb-1.5">
              <span>Architecture Moat</span>
              <Award className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-black text-cyan-400">PostgreSQL 16 + RLS</div>
            <div className="text-sm text-slate-300 mt-2 font-mono">
              Independent DCF & replacement matrix skunkworks appraisal
            </div>
          </div>

          <div className="p-6 bg-slate-950 border border-purple-500/50 rounded-xl shadow-md">
            <div className="flex items-center justify-between text-sm font-mono uppercase text-slate-400 mb-1.5">
              <span>Inspection Period</span>
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-black text-purple-300">7 Business Days</div>
            <div className="text-sm text-slate-300 mt-2 font-mono">
              Full Git repo transfer, PyTest test bench, & Docker verification
            </div>
          </div>
        </div>
      </div>

      {/* Escrow Handoff Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              Acquire.com Clean-Room Escrow Handoff Checklist
            </h3>
            <p className="text-base text-slate-300 mt-1">
              Milestone items required prior to automated escrow fund release to seller.
            </p>
          </div>
          <div className="text-right font-mono">
            <span className="text-3xl font-black text-emerald-400">{progressPct}%</span>
            <span className="text-sm text-slate-400 block">{completedCount} of {totalCount} Completed</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 mb-7">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Checklist items with strict 15px+ floor */}
        <div className="space-y-3.5">
          {[
            {
              id: 'item1',
              title: 'Clean-Room IP Audit Verified (0% Copyleft)',
              desc: 'Explicit confirmation that zero GPL, AGPL, or SSPL libraries are included. 100% Permissive MIT dependencies.',
            },
            {
              id: 'item2',
              title: 'PostgreSQL 16 Timeseries Partition Schemas Delivered',
              desc: 'All DDL tables, BRIN indices, and automated PL/pgSQL thermal quarantine triggers compile with zero errors.',
            },
            {
              id: 'item3',
              title: 'OpenAPI 3.1 & WebSocket Protocol Validation',
              desc: 'REST and WebSocket JSON schemas strictly validated against OpenAPI 3.1 tooling with sub-millisecond latencies.',
            },
            {
              id: 'item4',
              title: 'PyTest Suite 100% Green (>90% Coverage Target)',
              desc: 'All 10 unit test cases passing under 2.0 ms execution budgets, including cold-soak OCV convergence at -10°C.',
            },
            {
              id: 'item5',
              title: 'Google Cloud Run Distroless Container Registry Handoff',
              desc: 'Private artifact registry transfer to purchaser GCP project with non-root UID 10001 runtime configuration.',
            },
            {
              id: 'item6',
              title: 'Delaware Bill of Sale & Mutual IP Assignment Signatures',
              desc: 'Bilateral digital signature execution via Acquire.com native escrow legal execution flow.',
            },
          ].map((item) => {
            const isChecked = checklist[item.id];
            return (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`p-4.5 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                  isChecked
                    ? 'bg-slate-950 border-emerald-500/50 text-slate-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  className="mt-1 w-6 h-6 accent-emerald-500 rounded cursor-pointer shrink-0"
                />
                <div className="flex-1">
                  <div className="text-lg font-bold text-white flex items-center gap-2.5">
                    {item.title}
                    {isChecked && (
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
                        VERIFIED
                      </span>
                    )}
                  </div>
                  <div className="text-base text-slate-300 mt-1 leading-relaxed">
                    {item.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contract Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-mono text-slate-300">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>legal/GF_T3_175_APA_AGREEMENT.md</span>
          </div>
          <span className="text-xs font-mono text-slate-500">Commercial Software Asset Standard Standard Form</span>
        </div>
        <div className="p-6 bg-slate-950/80 font-mono text-xs sm:text-sm text-slate-300 overflow-x-auto leading-relaxed max-h-[500px]">
          <pre><code>{GF_T3_175_APA_AGREEMENT_CONTENT}</code></pre>
        </div>
      </div>
    </div>
  );
};
