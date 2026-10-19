import React, { useState } from 'react';
import { ShieldCheck, FileCheck, DollarSign, Award, CheckCircle2, Lock, ArrowRight, ExternalLink } from 'lucide-react';

interface ApaCovenantTabProps {
  onSignEscrow: () => void;
  isEscrowSigned: boolean;
}

export const ApaCovenantTab: React.FC<ApaCovenantTabProps> = ({
  onSignEscrow,
  isEscrowSigned,
}) => {
  const [checklist, setChecklist] = useState([
    { id: 'c1', label: 'GitHub Repository Transfer & Git Commit Tree Handover', checked: true },
    { id: 'c2', label: 'Cloud Run v2 Production Service Accounts & Secrets Escrow', checked: true },
    { id: 'c3', label: 'TimescaleDB / Postgres Master Encryption Keys & Hypertables', checked: true },
    { id: 'c4', label: 'Clean-Room IP Non-Infringement Warranty & 0% Copyleft Affidavit', checked: true },
    { id: 'c5', label: '30-Day Technical Architecture Transition SLA Signed', checked: true },
  ]);

  const toggleCheck = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const allChecked = checklist.every((c) => c.checked);

  return (
    <div className="space-y-8">
      {/* Acquire.com Asset Purchase Agreement Overview Card */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 md:p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded bg-rose-950/80 border border-rose-700 text-rose-300 font-mono text-sm font-bold">
                ACQUIRE.COM ASSET PURCHASE AGREEMENT (APA)
              </span>
              <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Escrow Ready
              </span>
            </div>
            <h3 className="text-3xl font-extrabold text-slate-100">
              GF-T3-169 Turnkey Micro-APA Covenant
            </h3>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Legally binding turnkey micro-acquisition framework for the Heavy Overland Dynamics Platform NX 450h+ High-G Dynamic Telemetry Agile Hybrid Core powertrain controller and telemetry engine.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center w-full sm:w-auto">
              <div className="text-slate-400 text-sm">Purchase Consideration</div>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">20 kHz (0.48ms)</div>
              <div className="text-slate-500 text-sm">Escrow.com Wire Lock</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center w-full sm:w-auto">
              <div className="text-slate-400 text-sm">Architecture Moat</div>
              <div className="text-3xl font-extrabold text-blue-400 font-mono">PostgreSQL 16 + RLS</div>
              <div className="text-slate-500 text-sm">Asset Basis Specification</div>
            </div>
          </div>
        </div>

        {/* Covenants & Warranties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>Clean-Room Warranty</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              100% clean-room engineered. Strict zero-copyleft audit certifies complete absence of GPL, AGPL, or SSPL contamination.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <FileCheck className="w-5 h-5" />
              <span>Full IP Assignment</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Irrevocable, worldwide transfer of all patents, trade dress, MPC weights, algorithms, database schemas, and documentation.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Award className="w-5 h-5" />
              <span>Seller Support Warranty</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              30-day dedicated onboarding and deployment support by the Chief Systems Architect to ensure seamless operational continuity.
            </p>
          </div>
        </div>

        {/* Turnkey Escrow Handoff Checklist */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
          <h4 className="text-xl font-bold text-slate-100 mb-4 flex items-center justify-between">
            <span>Exhibit C: Turnkey Escrow Handoff Checklist</span>
            <span className="text-sm font-semibold text-emerald-400">
              {checklist.filter((c) => c.checked).length} of {checklist.length} Verified
            </span>
          </h4>

          <div className="space-y-3 mb-6">
            {checklist.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:bg-slate-900 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleCheck(item.id)}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
                <span className="text-slate-200 text-sm font-semibold">{item.label}</span>
              </label>
            ))}
          </div>

          {/* Interactive Escrow Release Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <div className="text-slate-400 text-sm">
              Status: {isEscrowSigned ? (
                <span className="text-emerald-400 font-bold">ESCROW SIGNED & WIRE RELEASE AUTHORIZED</span>
              ) : (
                <span className="text-amber-400 font-bold">READY FOR MUTUAL EXECUTION</span>
              )}
            </div>

            <button
              onClick={onSignEscrow}
              disabled={!allChecked}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                isEscrowSigned
                  ? 'bg-emerald-950 border border-emerald-600 text-emerald-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60'
              }`}
            >
              {isEscrowSigned ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>APA Covenant Executed & Stamped</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Execute Escrow Release (20 kHz (0.48ms))</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Exhibit A & Exhibit B Legal Agreements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-3">
          <h4 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-cyan-400" />
            <span>Exhibit A: IP Assignment Schedule</span>
          </h4>
          <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside">
            <li>Repository Commit History (100% verified SHA-256 tree)</li>
            <li>Convex MPC Weight Matrices ($Q, R$) and Barrier Certs</li>
            <li>PostgreSQL TimescaleDB DDL and HMAC Trigger Scripts</li>
            <li>OpenAPI 3.1 REST and WebSocket Telemetry Protocols</li>
            <li>Production Non-Root Dockerfile and PyTest Benches</li>
          </ul>
        </div>

        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-3">
          <h4 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <span>Exhibit B: Bill of Sale & Release</span>
          </h4>
          <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside">
            <li>Absolute transfer of title free and clear of all liens</li>
            <li>Non-solicitation and non-disparagement covenants</li>
            <li>Warranties survive closing for 24 months</li>
            <li>Governing Law: Standard Commercial Jurisdiction (Chancery Court)</li>
            <li>Dispute Resolution: Expedited AAA Commercial Arbitration</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
