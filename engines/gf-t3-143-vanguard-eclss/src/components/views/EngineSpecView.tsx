/**
 * Vanguard-ECLSS: F1 Skunkworks Engine Specification Viewer (70% Workload Deliverable)
 * Upgraded Font Floor & High-Legibility Typography
 */

import React, { useState } from 'react';
import { FileText, Copy, Check, Terminal, Cpu, Database, CheckCircle2 } from 'lucide-react';
import { ENGINE_SPEC_T3_VANGUARD_MD } from '../../artifacts/engineSpec';

export const EngineSpecView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ENGINE_SPEC_T3_VANGUARD_MD);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-purple-400" />
            ENGINE_SPEC_T3_VANGUARD.MD (70% WORKLOAD DELIVERABLE)
          </h2>
          <p className="text-base text-slate-300 font-medium mt-1">
            Comprehensive, zero-placeholder technical blueprint satisfying all 5 Monopoly Vault Criteria.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-700 text-base font-bold font-mono transition cursor-pointer shadow-md"
        >
          {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
          <span>{copied ? 'SPEC COPIED TO CLIPBOARD' : 'COPY ENGINE_SPEC.MD'}</span>
        </button>
      </div>

      {/* Criteria Audit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono text-base">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-lg">
            <Cpu className="w-5 h-5" />
            <span>1. TOPOLOGY & MIMO-MPC</span>
          </div>
          <p className="text-sm text-slate-300">
            Container boundaries, CAN-FD / SpaceWire streaming, quadratic optimization under &lt;6.5ms threshold.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-lg">
            <Database className="w-5 h-5" />
            <span>2. ALLOYDB DDL SCHEMA</span>
          </div>
          <p className="text-sm text-slate-300">
            PostgreSQL 16 normalized tables, time-series partitions, check constraints, zero circular keys.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2.5 text-purple-400 font-bold text-lg">
            <CheckCircle2 className="w-5 h-5" />
            <span>3. CLEAN-ROOM & APA</span>
          </div>
          <p className="text-sm text-slate-300">
            Turnkey Software Asset Purchase Agreement Ledger, 0.00% copyleft contamination, zero NASA/ITAR proprietary source dependencies.
          </p>
        </div>
      </div>

      {/* Markdown Document Content */}
      <div className="p-6 sm:p-7 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-purple-400" />
            <span className="font-mono text-base font-bold text-white">ENGINE_SPEC_T3_VANGUARD.md</span>
          </div>
          <span className="text-sm font-mono text-slate-400">Track 3 F1 Skunkworks Spec</span>
        </div>

        <pre className="p-6 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-sm sm:text-base text-slate-200 overflow-x-auto max-h-[700px] leading-relaxed select-all whitespace-pre-wrap">
          {ENGINE_SPEC_T3_VANGUARD_MD}
        </pre>
      </div>
    </div>
  );
};
