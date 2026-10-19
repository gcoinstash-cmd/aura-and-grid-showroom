/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Heavy Overland Dynamics Platform RZ 450e Steer-by-Wire Precision Core (GF-T3-174)
 * Tab 5: Acquire.com Asset Purchase Agreement (APA) & IP Assignment Covenant
 */

import React, { useState } from 'react';
import { DollarSign, ShieldCheck, CheckSquare, Square, Copy, Check, Award, FileText, Download } from 'lucide-react';
import { ACQUIRE_APA_AGREEMENT_TEXT, APA_CHECKLIST_ITEMS } from '../../data/acquireApaCovenantData';

export const TabAcquireApaCovenant: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [checklist, setChecklist] = useState(APA_CHECKLIST_ITEMS);

  const toggleCheck = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(ACQUIRE_APA_AGREEMENT_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadApa = () => {
    const blob = new Blob([ACQUIRE_APA_AGREEMENT_TEXT], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'GF_T3_174_ENTERPRISE_APA_AGREEMENT.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Award className="h-6 w-6 text-amber-400" />
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Tab 5: Acquire.com Micro-APA Covenant & IP Transfer
          </h2>
        </div>
        <p className="mt-2 text-base text-slate-300">
          Turnkey Asset Purchase Agreement terms, Exhibit IP assignment schedule, Bill of Sale, and clean-room escrow handoff checklist for immediate transfer on Acquire.com or Escrow.com.
        </p>
      </div>

      {/* Financial terms card */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <span className="text-sm font-semibold text-amber-400 block uppercase tracking-wider">
            Micro-APA Reference Core
          </span>
          <span className="text-3xl md:text-4xl font-extrabold text-white font-mono mt-1 block">
            20 kHz (0.48ms)
          </span>
          <p className="mt-1 text-sm text-slate-300">
            Immediate turnkey asset transfer consideration via Acquire.com / Escrow.com.
          </p>
        </div>

        <div>
          <span className="text-sm font-semibold text-cyan-400 block uppercase tracking-wider">
            Architecture Moat
          </span>
          <span className="text-3xl md:text-4xl font-extrabold text-white font-mono mt-1 block">
            PostgreSQL 16 + RLS
          </span>
          <p className="mt-1 text-sm text-slate-300">
            Benchmarked against Tier-1 automotive ASIL-D software deliverables.
          </p>
        </div>

        <div>
          <span className="text-sm font-semibold text-emerald-400 block uppercase tracking-wider">
            License & IP Warranties
          </span>
          <span className="text-2xl md:text-3xl font-bold text-white font-mono mt-1 block">
            100% Permissive MIT
          </span>
          <p className="mt-1 text-sm text-slate-300">
            Clean-room certified. Zero GPL/copyleft taint. Sole unencumbered title.
          </p>
        </div>
      </div>

      {/* Escrow Handoff Checklist */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            Exhibit B: Clean-Room Escrow Handoff Checklist
          </h3>
          <span className="text-sm font-mono text-emerald-400">
            {checklist.filter((c) => c.completed).length} of {checklist.length} Verified
          </span>
        </div>

        <div className="space-y-3">
          {checklist.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-colors"
            >
              <button className="mt-0.5 text-emerald-400">
                {item.completed ? (
                  <CheckSquare className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Square className="h-5 w-5 text-slate-500" />
                )}
              </button>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-base font-semibold ${item.completed ? 'text-white' : 'text-slate-300'}`}>
                    {item.title}
                  </span>
                  <span className="text-sm font-mono text-slate-400">{item.id}</span>
                </div>
                <p className="mt-0.5 text-sm text-slate-400">{item.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Complete APA Text Agreement with Actions */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between bg-slate-900 px-6 py-4 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-400" />
            <span className="font-mono text-base font-semibold text-slate-200">
              ENTERPRISE_APA_AGREEMENT.md
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadApa}
              className="flex items-center gap-2 rounded border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-1.5 text-sm font-semibold text-amber-300 transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Download APA</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-sm font-medium text-slate-200 transition-colors cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
          </div>
        </div>

        <pre className="p-6 text-sm font-mono text-slate-200 overflow-x-auto max-h-[600px] leading-relaxed whitespace-pre-wrap">
          <code>{ACQUIRE_APA_AGREEMENT_TEXT}</code>
        </pre>
      </div>
    </div>
  );
};
