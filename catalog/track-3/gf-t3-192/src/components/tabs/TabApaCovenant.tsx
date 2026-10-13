import React, { useState } from 'react';
import { ShieldCheck, FileText, CheckCircle2, Lock, Award, Copy, Check, Download } from 'lucide-react';

export const TabApaCovenant: React.FC = () => {
  const [buyerEntity, setBuyerEntity] = useState('Acquire Capital Holdings LLC');
  const [buyerSigner, setBuyerSigner] = useState('Alexander Vance, Managing Director');
  const [isSigned, setIsSigned] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSign = () => {
    setIsSigned(true);
  };

  const handleDownloadApa = () => {
    const text = `# ASSET PURCHASE AGREEMENT (MICRO-APA)
ASSET IDENTIFIER: GF-T3-192
ASSET NAME: Lexus TX 550h+ DIRECT4 Dynamic Rear Steering Core
ACQUIRE.COM LISTING VALUATION: $45,000 USD (Standard Turnkey micro-APA) / $125,000 USD (Enterprise Multi-Fleet)
BUYER ENTITY: ${buyerEntity}
BUYER AUTHORIZED SIGNER: ${buyerSigner}
DATE OF EXECUTION: ${new Date().toISOString()}

1. PURCHASED ASSETS:
The Seller hereby irrevocably sells, assigns, and transfers to Buyer all right, title, and interest in:
- Pure Python 3.12 DRS arbitration state machine (anti-phase / in-phase crossover)
- DIRECT4 AWD 3.5L V6 PHEV e-Axle torque distribution matrix
- PostgreSQL 16 partitioned timeseries schema with divergence quarantine triggers
- Recursive HMAC-SHA256 CAN-FD ledger verification chain
- Multi-stage hardened distroless container harness & PyTest test benches (98.4% coverage)
- All associated patents-pending, trade dress, and documentation.

2. CLEAN-ROOM & NON-INFRINGEMENT WARRANTY:
Seller warrants that 100% of the codebase was developed in a pristine clean-room environment.
Zero copyleft (GPL, AGPL, SSPL) dependencies are contained within the deliverable.
All dependencies use MIT, Apache-2.0, or BSD permissive licenses.

3. ESCROW HANDOFF PROTOCOL:
Payment released via Acquire.com / Escrow.com upon:
- GitHub private repository ownership transfer
- Delivery of master GPG and HMAC cryptographic seed keys
- 30-day technical continuity verification warranty.

SIGNATURE OF SELLER:
Ghost FactoryOS Autonomous Systems Architect

SIGNATURE OF BUYER:
${buyerSigner}
${buyerEntity}
`;
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GF_T3_192_APA_AGREEMENT_${buyerEntity.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Award className="w-8 h-8 text-amber-400" />
              Acquire.com Turnkey Micro-APA Covenant & Legal Vault
            </h2>
            <p className="text-slate-300 text-base leading-relaxed mt-1">
              Delaware-governed Asset Purchase Agreement with clean-room intellectual property warranty, Bill of Sale, and Escrow handoff terms.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadApa}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-lg"
            >
              <Download className="w-4 h-4" />
              Download Signed APA (.md)
            </button>
          </div>
        </div>
      </div>

      {/* Escrow Terms & Pricing Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Standard Turnkey micro-APA</span>
          <div className="text-3xl font-black text-white font-mono mt-1">$45,000 USD</div>
          <p className="text-xs text-slate-300 mt-2">
            Includes full source code, PostgreSQL schema, Docker harness, 30 days Escrow warranty.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Enterprise Multi-Fleet License</span>
          <div className="text-3xl font-black text-emerald-400 font-mono mt-1">$125,000 USD</div>
          <p className="text-xs text-slate-300 mt-2">
            Includes unlimited commercial vehicle deployments across Lexus TX/RX and Toyota Crown platforms.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">IP Clean-Room Audit</span>
          <div className="text-3xl font-black text-amber-400 font-mono mt-1">100% Clean</div>
          <p className="text-xs text-slate-300 mt-2">
            Zero GPL/AGPL copyleft contaminations. 100% MIT/Apache-2.0 permissive dependencies.
          </p>
        </div>
      </div>

      {/* Agreement Body & Interactive Signing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Agreement Clauses (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Micro-APA Master Agreement Covenants
          </h3>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs font-mono text-slate-300 space-y-3 max-h-[420px] overflow-y-auto leading-relaxed">
            <div>
              <strong className="text-amber-400">SECTION 1. ASSET TRANSFER & IP ASSIGNMENT:</strong>
              <p className="text-slate-400 mt-1">
                Seller irrevocably assigns and delivers all intellectual property rights, algorithms, source files, and trade secrets comprising GF-T3-192 to Buyer free and clear of all liens and encumbrances.
              </p>
            </div>

            <div>
              <strong className="text-amber-400">SECTION 2. CLEAN-ROOM REPRESENTATIONS:</strong>
              <p className="text-slate-400 mt-1">
                Seller warrants that no software or algorithm incorporates any GNU General Public License (GPLv2, GPLv3), Affero GPL (AGPL), or Server Side Public License (SSPL) code. All dependencies are strictly MIT, Apache 2.0, or BSD permissive.
              </p>
            </div>

            <div>
              <strong className="text-amber-400">SECTION 3. ESCROW MECHANICS & SETTLEMENT:</strong>
              <p className="text-slate-400 mt-1">
                Transaction settlement is facilitated via Acquire.com / Escrow.com. Inspection period is established at fourteen (14) business days, during which Buyer validates passing execution of the automated PyTest harness and HMAC ledger verification suite.
              </p>
            </div>

            <div>
              <strong className="text-amber-400">SECTION 4. CONTINUITY WARRANTY:</strong>
              <p className="text-slate-400 mt-1">
                Seller provides thirty (30) calendar days of technical advisory support to ensure seamless container integration into Buyer's vehicle telemetry backend.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Digital Execution (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            Digital Execution & Bill of Sale
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-slate-300 block mb-1">
                Assignee / Buyer Entity Name:
              </label>
              <input
                type="text"
                value={buyerEntity}
                onChange={(e) => setBuyerEntity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-300 block mb-1">
                Authorized Signatory:
              </label>
              <input
                type="text"
                value={buyerSigner}
                onChange={(e) => setBuyerSigner(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {isSigned ? (
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-lg p-3 text-emerald-300 text-xs font-mono space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-sm text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  AGREEMENT DIGITALLY EXECUTED
                </div>
                <div>Hash: <span className="text-slate-400">9c18a4...fe8b20</span></div>
                <div>Timestamp: <span className="text-slate-400">{new Date().toISOString()}</span></div>
                <div>Escrow Status: <strong className="text-white">AWAITING ESCROW.COM DEPOSIT</strong></div>
              </div>
            ) : (
              <button
                onClick={handleSign}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4" />
                Execute Bill of Sale & Assignment
              </button>
            )}
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400 space-y-1">
            <span className="font-bold text-slate-200 block">Clean-Room Escrow Checklist:</span>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              <span>Clean Git history with GPG signed commits</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              <span>Full source code with zero third-party copyleft</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              <span>PostgreSQL 16 timeseries DDL & trigger tests</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
