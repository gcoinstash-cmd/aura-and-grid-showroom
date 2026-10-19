/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Scale, ShieldCheck, CheckSquare, Square, FileText, Copy, Check, Download, AlertCircle } from 'lucide-react';
import { APA_AGREEMENT_TEXT, DEPENDENCY_WHITELIST, ESCROW_CHECKLIST_ITEMS } from '../../data/apaLegalData';

interface TabApaCovenantProps {
  onExportSpec: () => void;
}

export const TabApaCovenant: React.FC<TabApaCovenantProps> = ({ onExportSpec }) => {
  const [checklist, setChecklist] = useState(ESCROW_CHECKLIST_ITEMS);
  const [copiedApa, setCopiedApa] = useState(false);

  const toggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, defaultChecked: !item.defaultChecked } : item))
    );
  };

  const copyApa = () => {
    navigator.clipboard.writeText(APA_AGREEMENT_TEXT);
    setCopiedApa(true);
    setTimeout(() => setCopiedApa(false), 2000);
  };

  const completedCount = checklist.filter((i) => i.defaultChecked).length;

  return (
    <div className="space-y-6">
      {/* Top APA Covenant Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Scale className="w-6 h-6 text-emerald-400" />
              Acquire.com Asset Purchase Agreement (Micro-APA) & IP Covenants
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-4xl">
              Turnkey micro-acquisition legal covenants, clean-room dependency certification, Bill of Sale, and bilateral intellectual property assignment schedule.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-sm font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Clean-Room Escrow Warranties
            </span>
          </div>
        </div>
      </div>

      {/* Deal Metrics & Escrow Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Deal Specification Overview */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-white pb-3 border-b border-slate-800">
              Transaction Covenants
            </h3>

            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30">
                <span className="text-slate-400 text-sm font-mono">Agreed DEPLOYMENT SPECIFICATION: TURNKEY CONTAINER / BARE-METAL</span>
                <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-0.5">
                  Delaware Institutional Covenants
                </div>
                <div className="text-sm font-mono text-emerald-300/80 mt-1">
                  100% All-Cash Escrow Deposit
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Escrow Provider:</span>
                  <span className="text-slate-200">Escrow.com / Acquire Pay</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Closing Velocity:</span>
                  <span className="text-emerald-400 font-bold">&lt; 24 Hours Post-Deposit</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">IP Warranty:</span>
                  <span className="text-cyan-300">100% Unencumbered</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Liabilities Transferred:</span>
                  <span className="text-emerald-400 font-bold">Zero (20 kHz (0.48ms))</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={onExportSpec}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Vault Dossier & APA Package
            </button>
          </div>
        </div>

        {/* Turnkey Escrow Handoff Checklist */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
              Turnkey Escrow Handoff Checklist
            </h3>
            <span className="text-sm font-mono text-emerald-400 font-bold">
              {completedCount}/{checklist.length} Verified
            </span>
          </div>

          <div className="space-y-3 mt-4">
            {checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleChecklist(item.id)}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition flex items-center gap-3"
              >
                {item.defaultChecked ? (
                  <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-500 shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    item.defaultChecked
                      ? 'text-slate-200 font-medium'
                      : 'text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clean-Room Dependency Whitelist Audit */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Clean-Room Dependency Whitelist (0% Copyleft Risk)
            </h3>
            <p className="text-slate-400 text-sm mt-0.5">
              Strict audit ensuring zero GPL, AGPL, or SSPL copyleft packages enter the production build.
            </p>
          </div>
          <span className="text-sm font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded border border-emerald-800">
            AUDIT PASSED
          </span>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-sm font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">PACKAGE</th>
                <th className="py-2.5 px-3">VERSION</th>
                <th className="py-2.5 px-3">LICENSE</th>
                <th className="py-2.5 px-3">FUNCTION</th>
                <th className="py-2.5 px-3">COPYLEFT RISK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {DEPENDENCY_WHITELIST.map((dep) => (
                <tr key={dep.name} className="hover:bg-slate-950/50">
                  <td className="py-2.5 px-3 font-bold text-slate-100">{dep.name}</td>
                  <td className="py-2.5 px-3 text-slate-400">{dep.version}</td>
                  <td className="py-2.5 px-3 text-cyan-400 font-semibold">{dep.license}</td>
                  <td className="py-2.5 px-3 text-slate-300">{dep.purpose}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">{dep.copyleftRisk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legal Contract Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-sm font-bold text-emerald-400">
              ACQUIRE_MICRO_APA_AGREEMENT.txt
            </span>
            <span className="text-slate-500 text-sm">• Standard Delaware Asset Purchase Contract</span>
          </div>
          <button
            onClick={copyApa}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-mono transition"
          >
            {copiedApa ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                Copied Legal Text
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Full APA
              </>
            )}
          </button>
        </div>

        <div className="p-4 bg-slate-950 overflow-x-auto max-h-[360px]">
          <pre className="font-mono text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {APA_AGREEMENT_TEXT}
          </pre>
        </div>
      </div>
    </div>
  );
};
