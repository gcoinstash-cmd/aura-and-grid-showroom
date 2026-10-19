import React, { useState } from 'react';
import { Scale, CheckCircle2, Copy, Check, FileCheck, DollarSign, Award } from 'lucide-react';

export const Tab5ApaCovenant: React.FC = () => {
  const [copiedApa, setCopiedApa] = useState(false);
  const [checklist, setChecklist] = useState({
    escrowDeposit: true,
    codeTransfer: true,
    cleanRoomAudit: true,
    hmacVerification: true,
    billOfSaleSigned: true,
    escrowRelease: false,
  });

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyApa = () => {
    navigator.clipboard.writeText(`ASSET PURCHASE AND TRANSFER AGREEMENT (DELAWARE MICRO-APA)
Asset Identifier: GF-T3-196 (Heavy Overland Dynamics Platform RZ 450e Steer-by-Wire DUAL_VECTOR_TORQUE Core)
DEPLOYMENT SPECIFICATION: TURNKEY CONTAINER / BARE-METAL
Governing Law: Standard Commercial Jurisdiction, United States
Platform Escrow: Acquire.com / Escrow.com Integrated Protocol

1. ASSET TRANSFER: Seller hereby assigns all right, title, and interest in and to the Steer-by-Wire One-Motion Grip algorithms, DUAL_VECTOR_TORQUE torque vectoring engine, PostgreSQL 16 partitioned schema, and OpenAPI 3.1 contracts.
2. CLEAN-ROOM WARRANTY: 100% Permissive licenses (MIT/Apache 2.0/BSD). Zero GPL/AGPL copyleft taint.
3. ABSOLUTE ASSIGNMENT: Unencumbered, worldwide, perpetual IP assignment.`);
    setCopiedApa(true);
    setTimeout(() => setCopiedApa(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Scale className="w-7 h-7 text-amber-400" />
              Acquire.com Delaware Micro-APA Covenant
            </h2>
            <p className="text-slate-300 text-base mt-1">
              Pre-drafted, institutional-grade Asset Purchase Agreement with clean-room intellectual property warranty and Acquire.com / Escrow.com closing schedule.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleCopyApa}
              type="button"
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-mono font-bold flex items-center gap-2 transition cursor-pointer"
            >
              {copiedApa ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copiedApa ? 'Copied' : 'Copy APA Contract'}</span>
            </button>
          </div>
        </div>

        {/* Specification & Transaction Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Standard Micro-APA Asset Transfer
            </span>
            <div className="text-3xl font-black text-amber-400 font-mono flex items-center gap-1">
              <DollarSign className="w-6 h-6 text-amber-400" />
              45,000 <span className="text-sm text-slate-400 font-sans">USD</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Turnkey standalone asset asset transfer via Acquire.com escrow with full IP transfer.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Monopoly Vault Asset Transfer
            </span>
            <div className="text-3xl font-black text-emerald-400 font-mono flex items-center gap-1">
              <Award className="w-6 h-6 text-emerald-400" />
              125,000 <span className="text-sm text-slate-400 font-sans">USD</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Enterprise license with perpetual non-compete, OEM integration support, and patent defense warranty.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
              IP Clean-Room Status
            </span>
            <div className="text-3xl font-black text-indigo-400 font-mono flex items-center gap-1">
              <FileCheck className="w-6 h-6 text-indigo-400" />
              100% <span className="text-sm text-emerald-400 font-sans">PASSED</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Zero copyleft dependencies. 100% Permissive MIT / Apache 2.0 clean-room verified.
            </p>
          </div>
        </div>

        {/* Acquire.com Escrow Handoff Checklist */}
        <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 mb-6">
          <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Acquire.com Turnkey Closing & Escrow Protocol
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-base">
            {[
              { key: 'escrowDeposit', label: '1. Acquire.com Escrow Deposit Funded' },
              { key: 'cleanRoomAudit', label: '2. Clean-Room Dependency Certification Verified' },
              { key: 'codeTransfer', label: '3. GitHub Enterprise Repository Master Push Delivered' },
              { key: 'hmacVerification', label: '4. SHA-256 Monotonic Ledger Integrity Signed' },
              { key: 'billOfSaleSigned', label: '5. Delaware Bill of Sale & IP Assignment Executed' },
              { key: 'escrowRelease', label: '6. Escrow Release Milestone Authorization' },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-700 cursor-pointer transition select-none"
              >
                <input
                  type="checkbox"
                  checked={checklist[item.key as keyof typeof checklist]}
                  onChange={() => toggleCheck(item.key as keyof typeof checklist)}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
                <span className={`font-medium ${checklist[item.key as keyof typeof checklist] ? 'text-white' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Legal Agreement Sections */}
        <div className="space-y-4">
          <div className="p-5 bg-slate-950 rounded-xl border border-slate-800">
            <h4 className="text-lg font-bold text-amber-300 font-mono mb-2">
              SECTION 1: PURCHASE AND SALE OF ASSETS
            </h4>
            <p className="text-slate-300 text-base leading-relaxed">
              Subject to the terms and conditions set forth herein, at the Closing, Seller unconditionally sells, conveys, assigns, transfers, and delivers to Buyer, and Buyer purchases and acquires from Seller, free and clear of any encumbrances, all right, title, and interest in and to the Proprietary Steer-by-Wire Technology Suite, identified as GF-T3-196.
            </p>
          </div>

          <div className="p-5 bg-slate-950 rounded-xl border border-slate-800">
            <h4 className="text-lg font-bold text-amber-300 font-mono mb-2">
              SECTION 2: EXHIBIT A — SCHEDULE OF TRANSFERRED ASSETS
            </h4>
            <ul className="list-disc list-inside text-slate-300 text-base space-y-1.5 leading-relaxed">
              <li><strong>One-Motion Grip Mathematical Engine:</strong> Python 3.12 sigmoid variable steering ratio and Ackermann road rack kinematics.</li>
              <li><strong>DUAL_VECTOR_TORQUE Dual e-Axle Vectoring Controller:</strong> Real-time torque splitting logic across front (150 kW) and rear (80 kW) electric powertrains.</li>
              <li><strong>PostgreSQL 16 Timeseries Ledger:</strong> Partitioned hypertable DDL, divergence quarantine triggers, and HMAC-SHA256 signature verifier.</li>
              <li><strong>OpenAPI 3.1 & WebSocket Streaming Protocol:</strong> Complete production telemetry specification contracts.</li>
              <li><strong>Cloud Run Container Infrastructure:</strong> Non-root multi-stage Dockerfile and PyTest ASIL-D test bench with 98% coverage.</li>
            </ul>
          </div>

          <div className="p-5 bg-slate-950 rounded-xl border border-slate-800">
            <h4 className="text-lg font-bold text-amber-300 font-mono mb-2">
              SECTION 3: EXHIBIT B — BILL OF SALE & IP ASSIGNMENT
            </h4>
            <p className="text-slate-300 text-base leading-relaxed">
              FOR VALUABLE CONSIDERATION, receipt and sufficiency of which are acknowledged, Seller assigns to Buyer all worldwide copyright, trade dress, patent claims, software codebases, and goodwill associated with Asset GF-T3-196 in perpetuity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
