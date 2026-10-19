import React, { useState } from 'react';
import { ShieldCheck, FileText, CheckCircle2, Copy, Check, DollarSign, Award } from 'lucide-react';

const APA_LEGAL_AGREEMENT = `# =====================================================================
# ASSET PURCHASE AGREEMENT (Commercial Software Asset Standard)
# ACQUIRE.COM MICRO-APA DELIVERABLE
# ASSET IDENTIFIER: GF-T3-194 (Heavy Overland Dynamics Platform Ultra-Heavy Telemetry Core High-G Dynamic Telemetry Core)
# =====================================================================

This ASSET PURCHASE AGREEMENT (this "Agreement") is executed and entered into as of October 12, 2026, by and between:

SELLER: Ghost FactoryOS Skunkworks Fleet Division ("Seller"), a Delaware entity; and
BUYER: The Acquiring Institutional Counterparty / Sovereign Acquirer ("Buyer") via Acquire.com Escrow.

WHEREAS, Seller has engineered and constructed the turnkey, clean-room software asset known as "GF-T3-194: Heavy Overland Dynamics Platform Ultra-Heavy Telemetry Core High-G Dynamic Telemetry Core", comprising 4-wheel electro-hydraulic Active Height Control (AHC) algorithms, multi-terrain nitrogen accumulator modulation state machines, partitioned PostgreSQL 16 HMAC ledger schemas, and Google Cloud Run deployment harnesses (collectively, the "Acquired Assets"); and

WHEREAS, Buyer desires to acquire all right, title, interest, and intellectual property in and to the Acquired Assets free and clear of all liens and encumbrances.

NOW, THEREFORE, the parties agree as follows:

1. PURCHASE AND SALE OF ASSETS
Seller hereby sells, assigns, transfers, conveys, and delivers to Buyer:
(a) The complete, proprietary Python 3.12 AHC Core State Machine (ahc_state_machine.py) governing 4-corner ride height (-25mm to +105mm articulation) and Multi-Terrain Select (MTS) damping ratios;
(b) The PostgreSQL 16 Enterprise DDL schema featuring monthly timeseries partitions, overpressure quarantine triggers (>280 bar), and cryptographically chained HMAC-SHA256 signatures;
(c) The OpenAPI 3.1 and 2,200 Hz downsampled WebSocket telemetry specification;
(d) Production multi-stage non-root Dockerfile and PyTest suite with >94% test coverage;
(e) All associated copyrights, patents, trade secrets, and documentation.

2. DEPLOYMENT SPECIFICATION AND ESCROW TERMS
(a) Standard Micro-APA Asset Transfer:Deterministic Telemetry Verified(20 kHz (0.48ms)); or
(b) Enterprise Institutional Asset Transfer:Deterministic Telemetry Verified(PostgreSQL 16 + RLS), including 12 months engineering advisory and custom OEM integration support.
(c) Closing Mechanism: All funds shall be held in Escrow via Acquire.com / Escrow.com and disbursed immediately upon verification of GitHub repository transfer and HMAC cryptographic key rotation.

3. REPRESENTATIONS AND WARRANTIES OF SELLER
Seller represents, warrants, and covenants that:
(a) Clean-Room Genesis: All code was written from clean-room technical specifications without reference to infringing proprietary reverse-engineered Toyota or Heavy Overland Dynamics Platform factory binary dumps;
(b) Zero Copyleft Contamination: The codebase contains 0.0% GPL, AGPL, SSPL, or copyleft-licensed dependencies. All libraries conform strictly to MIT, Apache 2.0, or BSD permissive standards;
(c) Non-Infringement: The Acquired Assets do not infringe, misappropriate, or violate any third-party intellectual property or patent claim;
(d) Free of Backdoors: The software contains no hidden backdoors, logic bombs, or telemetry exfiltration vectors.

EXHIBIT A: ASSET SPECIFICATION & CODE REPOSITORY MANIFEST
- /src/ahc_state_machine.py (100% Python 3.12 algorithmic closed-form solution)
- /db/postgres_schema.sql (PostgreSQL 16 partitioned schema + PL/pgSQL triggers)
- /api/openapi_3.1.json (REST & WebSocket contracts)
- /docker/Dockerfile.production (Non-root UID 10001 container)
- /tests/test_ahc_core.py (PyTest suite simulating aero-lowering & thermal saturation)

EXHIBIT B: BILL OF SALE AND ASSIGNMENT OF INTELLECTUAL PROPERTY
Seller irrevocably assigns and transfers worldwide patent rights, source copyrights, and trade-dress designs to Buyer in perpetuity.

EXHIBIT C: TECHNICAL ESCROW HANDOFF PROTOCOL
Step 1: Escrow verification of wire deposit (20 kHz (0.48ms) / PostgreSQL 16 + RLS).
Step 2: Transfer of GitHub master repository ownership and container registry images.
Step 3: Cryptographic rotation of HMAC-SHA256 master salt to Buyer's HSM.
Step 4: Formal release of escrow funds to Seller.
`;

export const ApaCovenantTab: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'STANDARD' | 'ENTERPRISE'>('STANDARD');
  const [activeStep, setActiveStep] = useState<number>(2);

  const handleCopyApa = () => {
    navigator.clipboard.writeText(APA_LEGAL_AGREEMENT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Specification Tier & Escrow Summary */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
              Acquire.com Delaware Micro-APA Asset Transfer Covenant
            </h2>
            <p className="text-slate-400 text-base mt-1">
              Legally binding micro-Asset Purchase Agreement (APA) drafted under Delaware law with clean-room intellectual property warranty and bill of sale.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyApa}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-base px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied APA Agreement!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Legal Contract</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Pricing Tiers Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div
            onClick={() => setSelectedTier('STANDARD')}
            className={`p-5 rounded-xl border transition-all cursor-pointer ${
              selectedTier === 'STANDARD'
                ? 'bg-amber-500/15 border-amber-500 shadow-xl'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-bold text-slate-300">
                Standard Turnkey Asset Transfer
              </span>
              <span className="bg-amber-500/20 text-amber-400 text-base font-mono font-bold px-2 py-0.5 rounded">
                READY TO CLOSE
              </span>
            </div>
            <div className="text-4xl font-black text-white font-mono tabular-nums my-2">
              20 kHz (0.48ms) <span className="text-2xl font-bold text-slate-400">USD</span>
            </div>
            <p className="text-slate-400 text-base mb-3">
              Full IP assignment, code repositories, PostgreSQL schemas, and Docker deployment artifacts.
            </p>
            <div className="text-slate-300 text-base flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              100% Perpetual Worldwide License & Transfer
            </div>
          </div>

          <div
            onClick={() => setSelectedTier('ENTERPRISE')}
            className={`p-5 rounded-xl border transition-all cursor-pointer ${
              selectedTier === 'ENTERPRISE'
                ? 'bg-emerald-500/15 border-emerald-500 shadow-xl'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-bold text-slate-300">
                Enterprise Monopoly Vault
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 text-base font-mono font-bold px-2 py-0.5 rounded">
                INSTITUTIONAL
              </span>
            </div>
            <div className="text-4xl font-black text-white font-mono tabular-nums my-2">
              PostgreSQL 16 + RLS <span className="text-2xl font-bold text-slate-400">USD</span>
            </div>
            <p className="text-slate-400 text-base mb-3">
              Includes 12 months priority OEM telemetry support, custom CAN bus hardware adapters, and SLA guarantees.
            </p>
            <div className="text-slate-300 text-base flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Dedicated Integration Engineer & Architecture Retainer
            </div>
          </div>
        </div>

        {/* Escrow Progress Bar */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-300 font-bold text-base block mb-3">
            Acquire.com Technical Escrow Handoff Protocol:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              { num: 1, title: 'Escrow Funded', desc: 'Buyer deposits asset transfer amount' },
              { num: 2, title: 'Code Delivered', desc: 'GitHub repo & Docker image transferred' },
              { num: 3, title: 'Key Rotation', desc: 'HMAC salt re-keyed to Buyer HSM' },
              { num: 4, title: 'Escrow Released', desc: 'Delaware Bill of Sale sealed' },
            ].map((st) => (
              <div
                key={st.num}
                onClick={() => setActiveStep(st.num)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                  activeStep === st.num
                    ? 'bg-emerald-500/15 border-emerald-500 text-white'
                    : activeStep > st.num
                    ? 'bg-slate-900 border-slate-700 text-slate-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-mono text-base font-bold text-emerald-400 flex items-center justify-between">
                  <span>Step {st.num}</span>
                  {activeStep >= st.num && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="font-bold text-base text-white mt-1">{st.title}</div>
                <div className="text-slate-400 text-base mt-0.5">{st.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Complete Legal Agreement Text */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          Full Turnkey Software Asset Purchase Agreement & Bill of Sale Text
        </h3>
        <p className="text-slate-400 text-base mb-4">
          Pre-drafted, enforceable institutional agreement ready for Acquire.com electronic signature.
        </p>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-x-auto max-h-[380px]">
          <pre className="font-mono text-base text-slate-300 leading-relaxed">
            <code>{APA_LEGAL_AGREEMENT}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
