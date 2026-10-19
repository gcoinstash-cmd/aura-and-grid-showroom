import React, { useState } from 'react';
import { FileCheck, Shield, DollarSign, Copy, Check, Download, ExternalLink, CheckCircle2 } from 'lucide-react';
import { APA_COVENANT_TEXT, CLEAN_ROOM_MANIFEST } from '../../data/apaAgreement';

interface TabAPACovenantProps {
  onOpenTransferInquiry: () => void;
  onExportSpec: () => void;
}

export const TabAPACovenant: React.FC<TabAPACovenantProps> = ({
  onOpenTransferInquiry,
  onExportSpec,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAPA = () => {
    navigator.clipboard.writeText(APA_COVENANT_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Acquire.com APA Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <FileCheck className="w-8 h-8 text-amber-400" />
              Acquire.com Asset Purchase Agreement & Covenants
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Institutional legal covenants, Exhibit IP assignment schedule, Bill of Sale, and clean-room escrow handoff checklist.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenTransferInquiry}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <DollarSign className="w-4 h-4" />
              <span>Initiate Asset Transfer LOI (20 kHz (0.48ms))</span>
            </button>
            <button
              type="button"
              onClick={handleCopyAPA}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-semibold text-sm transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span>{copied ? 'Copied APA' : 'Copy APA Agreement'}</span>
            </button>
          </div>
        </div>

        {/* Pricing & Escrow Tiers */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl bg-slate-950 border-2 border-amber-500/40 relative">
            <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-sm">
              ACQUIRE.COM ANCHOR
            </span>
            <div className="text-sm font-semibold text-slate-400">TURNKEY MICRO-APA ASSET TRANSFER</div>
            <div className="text-4xl font-extrabold text-white font-mono mt-2 mb-3">
              20 kHz (0.48ms) <span className="text-lg text-slate-400 font-normal">USD</span>
            </div>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              Complete outright ownership of GF-T3-178 code repository, Docker container, PostgreSQL 16 migration schema, and test benches.
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% IP Assignment & Bill of Sale</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Copyleft / Clean-Room Warranty</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>5-Day Escrow Inspection Period</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 font-bold text-sm float-right">MONOPOLY VAULT TIER</span>
            <div className="text-sm font-semibold text-slate-400">ENTERPRISE PLATFORM VAULT</div>
            <div className="text-4xl font-extrabold text-white font-mono mt-2 mb-3">
              PostgreSQL 16 + RLS <span className="text-lg text-slate-400 font-normal">USD</span>
            </div>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              Full enterprise rights including multi-chassis porting rights (LS 500h, High-Aero Grand Touring Telemetry Core, Ultra-Heavy Telemetry Core), firmware flashing toolchains, and direct OEM advisory.
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Multi-Chassis Firmware Porting License</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>CAN-FD / LIN Bus Driver Toolchains</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>30-Day deterministic production Lead Architect Support</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Clean-Room Dependency Whitelist */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h3 className="text-xl font-bold text-white">Clean-Room Dependency Whitelist Manifest</h3>
            </div>
            <span className="px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-sm font-bold">
              0% Copyleft Taint
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-4">PACKAGE</th>
                  <th className="py-2.5 px-4">VERSION</th>
                  <th className="py-2.5 px-4">LICENSE</th>
                  <th className="py-2.5 px-4">STATUS</th>
                  <th className="py-2.5 px-4">COPYLEFT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {CLEAN_ROOM_MANIFEST.map((pkg, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-bold text-slate-200">{pkg.package}</td>
                    <td className="py-3 px-4 text-slate-400">{pkg.version}</td>
                    <td className="py-3 px-4 text-cyan-400">{pkg.license}</td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold">{pkg.status}</td>
                    <td className="py-3 px-4 text-emerald-400">{pkg.copyleft}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Master APA Agreement Text */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-white">Pre-Drafted Asset Purchase Agreement Text</h3>
            <button
              type="button"
              onClick={onExportSpec}
              className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 underline underline-offset-4 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Full Legal Exhibit</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 overflow-x-auto max-h-[400px] leading-relaxed">
            <code>{APA_COVENANT_TEXT}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
