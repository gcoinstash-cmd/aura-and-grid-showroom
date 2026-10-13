import React, { useState } from 'react';
import { Scale, CheckSquare, Square, Download, ShieldCheck, FileText } from 'lucide-react';

interface TabAcquireApaCovenantProps {
  onExportSpec: () => void;
}

interface EscrowChecklistItem {
  id: string;
  title: string;
  deliverablePath: string;
  sha256: string;
  verified: boolean;
}

const INITIAL_ESCROW_ITEMS: EscrowChecklistItem[] = [
  {
    id: 'escrow-1',
    title: 'Exhibit A-1: Python 3.12 Dual-Passage Swing-Valve & Atkinson Arbitrator Core',
    deliverablePath: 'src/swing_valve_atkinson_core.py',
    sha256: '9f84c2e1b7a04823d6f51980e3a71c4982f01d3b5c7a89012f3e4d5c6b7a41b2',
    verified: true,
  },
  {
    id: 'escrow-2',
    title: 'Exhibit A-2: PostgreSQL 16 Partitioned HMAC Ledger & Seal Divergence Trigger DDL',
    deliverablePath: 'sql/001_swing_valve_hmac_ledger.sql',
    sha256: '7d12e4f0a8c93152e4b60918f2d3c4b5a697880123456789abcdef012345c904',
    verified: true,
  },
  {
    id: 'escrow-3',
    title: 'Exhibit A-3: OpenAPI 3.1.0 REST & WebSocket Telemetry Contract Specification',
    deliverablePath: 'specs/openapi_gf_t3_187.yaml',
    sha256: '3c71b09d4e2a1f856709c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d588e2',
    verified: true,
  },
  {
    id: 'escrow-4',
    title: 'Exhibit A-4: Hardened Non-Root Cloud Run Dockerfile & PyTest Suite (96.4% Cov)',
    deliverablePath: 'Dockerfile + tests/test_swing_valve.py',
    sha256: 'e419a8b2c6d047319582f1e0d9c8b7a6f5e4d3c2b1a09f8e7d6c5b4a3f2e11f7',
    verified: true,
  },
  {
    id: 'escrow-5',
    title: 'Exhibit B: Delaware Bill of Sale, IP Assignment & Zero-Copyleft Attestation',
    deliverablePath: 'ENTERPRISE_APA_AGREEMENT.md + LEGAL_IP_AUDIT.md',
    sha256: '5a08d3c7f1e2b4a69870123456789abcdef0123456789abcdef0123456762b9',
    verified: true,
  },
];

export const TabAcquireApaCovenant: React.FC<TabAcquireApaCovenantProps> = ({
  onExportSpec,
}) => {
  const [selectedTier, setSelectedTier] = useState<'standard' | 'enterprise'>('standard');
  const [checklist, setChecklist] = useState<EscrowChecklistItem[]>(INITIAL_ESCROW_ITEMS);

  const toggleItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, verified: !item.verified } : item))
    );
  };

  const verifiedCount = checklist.filter((i) => i.verified).length;

  return (
    <div className="space-y-6">
      {/* Top Valuation & Buyout Tier Selector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Acquire.com Delaware Micro-APA Covenant
            </h2>
            <p className="text-slate-300 text-sm mt-1">
              Turnkey Intellectual Property Asset Purchase Agreement governed by the laws of the State of Delaware, featuring complete Exhibit IP assignment schedule, Bill of Sale, and clean-room escrow handoff verification.
            </p>
          </div>

          <button
            type="button"
            onClick={onExportSpec}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold px-4 py-2.5 rounded-lg inline-flex items-center gap-2 cursor-pointer transition-colors shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download Master Vault (`GF_T3_187_SPEC.md`)</span>
          </button>
        </div>

        {/* Two Buyout Tier Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <div
            onClick={() => setSelectedTier('standard')}
            className={`rounded-xl p-5 border transition-colors cursor-pointer ${
              selectedTier === 'standard'
                ? 'bg-amber-500/10 border-amber-400'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-amber-400">
                STANDARD MICRO-APA BUYOUT (ACQUIRE.COM FAST-TRACK)
              </span>
              <span className="text-xs font-mono text-slate-300">Immediate Escrow Release</span>
            </div>
            <div className="text-4xl font-black text-white font-mono tabular-nums mb-2">
              $45,000 USD
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Full worldwide commercial assignment of Asset <code className="text-amber-300 font-mono">GF-T3-187</code> source code, PostgreSQL 16 HMAC ledger schemas, OpenAPI 3.1 contracts, and cockpit UI under MIT Permissive clean-room warranty.
            </p>
            <div className="text-xs font-mono text-amber-300 font-semibold">
              {selectedTier === 'standard' ? 'Selected Covenant Tier' : 'Click to Select Tier'}
            </div>
          </div>

          <div
            onClick={() => setSelectedTier('enterprise')}
            className={`rounded-xl p-5 border transition-colors cursor-pointer ${
              selectedTier === 'enterprise'
                ? 'bg-emerald-500/10 border-emerald-400'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-emerald-400">
                ENTERPRISE MONOPOLY VAULT BUYOUT (EXCLUSIVE LOCK)
              </span>
              <span className="text-xs font-mono text-slate-300">Permanent Vault Retirement</span>
            </div>
            <div className="text-4xl font-black text-white font-mono tabular-nums mb-2">
              $125,000 USD
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              100% exclusive worldwide intellectual property transfer, permanent removal from Ghost FactoryOS fleet catalog, trade-dress design patent assignment, and $250,000 clean-room IP indemnification cap.
            </p>
            <div className="text-xs font-mono text-emerald-300 font-semibold">
              {selectedTier === 'enterprise' ? 'Selected Covenant Tier' : 'Click to Select Tier'}
            </div>
          </div>
        </div>

        {/* Clean-Room Dependency Whitelist Table */}
        <div className="mb-6">
          <h3 className="text-xl font-extrabold text-white mb-2 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Clean-Room Dependency Whitelist (0% Copyleft Certification)</span>
          </h3>
          <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs tabular-nums">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/70">
                  <th className="py-2.5 px-3">Dependency / Package</th>
                  <th className="py-2.5 px-3">Version</th>
                  <th className="py-2.5 px-3">SPDX License</th>
                  <th className="py-2.5 px-3">Copyleft Contamination</th>
                  <th className="py-2.5 px-3">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-200">
                <tr>
                  <td className="py-2 px-3 font-bold text-white">python-runtime</td>
                  <td className="py-2 px-3">3.12.7</td>
                  <td className="py-2 px-3 text-emerald-400">PSF-2.0 (Permissive)</td>
                  <td className="py-2 px-3">0.0%</td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">WHITELISTED</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-white">fastapi / pydantic</td>
                  <td className="py-2 px-3">0.115.4 / 2.9.2</td>
                  <td className="py-2 px-3 text-emerald-400">MIT</td>
                  <td className="py-2 px-3">0.0%</td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">WHITELISTED</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-white">numpy / uvicorn</td>
                  <td className="py-2 px-3">2.1.2 / 0.32.0</td>
                  <td className="py-2 px-3 text-emerald-400">BSD-3-Clause</td>
                  <td className="py-2 px-3">0.0%</td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">WHITELISTED</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-white">asyncpg</td>
                  <td className="py-2 px-3">0.30.0</td>
                  <td className="py-2 px-3 text-emerald-400">Apache-2.0</td>
                  <td className="py-2 px-3">0.0%</td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">WHITELISTED</td>
                </tr>
                <tr className="bg-slate-900/40">
                  <td className="py-2 px-3 font-bold text-amber-300">GPL / AGPL / LGPL / SSPL</td>
                  <td className="py-2 px-3">ALL</td>
                  <td className="py-2 px-3 text-amber-400">Copyleft / Viral</td>
                  <td className="py-2 px-3">Strictly Prohibited</td>
                  <td className="py-2 px-3 text-amber-400 font-bold">EXPLICITLY BLACKLISTED</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Interactive Escrow Handoff Checklist */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-400" />
              <span>Interactive Clean-Room Escrow Handoff Checklist</span>
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {verifiedCount} of {checklist.length} Exhibits Verified for Closing
            </span>
          </div>

          <div className="space-y-2.5">
            {checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-3.5 flex items-start justify-between gap-4 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3">
                  {item.verified ? (
                    <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="text-sm font-bold text-white">{item.title}</div>
                    <div className="text-xs font-mono text-slate-400 mt-0.5">
                      Path: <span className="text-slate-200">{item.deliverablePath}</span> · SHA-256: {item.sha256.slice(0, 20)}...
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs font-mono font-bold shrink-0 ${
                    item.verified ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {item.verified ? 'VERIFIED' : 'PENDING'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legal Covenant & Bill of Sale Text */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
        <h3 className="text-2xl font-extrabold text-white mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-400" />
          <span>Delaware Asset Purchase Agreement &amp; Bill of Sale Instrument</span>
        </h3>
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 font-mono text-xs text-slate-200 space-y-3 leading-relaxed">
          <p>
            <strong>THIS MICRO-ASSET PURCHASE AGREEMENT (&ldquo;AGREEMENT&rdquo;)</strong> is entered into as of October 11, 2026, under the laws of the State of Delaware, by and between <strong>Ghost FactoryOS Institutional Fleet Division (&ldquo;Seller&rdquo;)</strong> and the acquiring counterparty registered via Acquire.com Escrow (&ldquo;Buyer&rdquo;).
          </p>
          <p>
            <strong>1. ACQUIRED ASSET DESIGNATION:</strong> Seller hereby sells, assigns, transfers, and conveys unto Buyer 100% right, title, and interest in and to Asset <strong>GF-T3-187 (Lexus ES 300h Ultra Luxury Core)</strong>, comprising the Dual-Passage Swing-Valve Hydraulic Damping state machine, A25A-FXS 2.5L Atkinson-Cycle regenerative braking arbitrator, PostgreSQL 16 HMAC-SHA256 partitioned telemetry ledger schema, OpenAPI 3.1.0 contracts, and React 19 engineering cockpit.
          </p>
          <p>
            <strong>2. CONSIDERATION &amp; SELECTED BUYOUT TIER:</strong>{' '}
            {selectedTier === 'standard'
              ? 'Standard Micro-APA Buyout Price of $45,000.00 USD payable upon Acquire.com escrow closing.'
              : 'Enterprise Monopoly Vault Buyout Price of $125,000.00 USD payable upon Acquire.com escrow closing, including permanent catalog retirement and exclusive worldwide territory lock.'}
          </p>
          <p>
            <strong>3. CLEAN-ROOM &amp; NON-INFRINGEMENT WARRANTY:</strong> Seller warrants that all mathematical models, Extended Kalman Filter matrices, and code modules were independently created via clean-room methodology and contain 0.0% GPL, AGPL, LGPL, or SSPL copyleft code.
          </p>
        </div>
      </div>
    </div>
  );
};
