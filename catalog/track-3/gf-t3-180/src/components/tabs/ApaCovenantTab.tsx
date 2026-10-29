import React, { useState } from 'react';
import { 
  FileText, ShieldCheck, DollarSign, Award, CheckCircle2, Copy, Check, 
  ExternalLink, Lock, CheckSquare, Layers, ArrowRight 
} from 'lucide-react';

export const ApaCovenantTab: React.FC = () => {
  const [copiedAgreement, setCopiedAgreement] = useState(false);
  const [tierSelection, setTierSelection] = useState<'turnkey' | 'enterprise'>('turnkey');

  const copyAgreement = () => {
    const agreement = `ASSET PURCHASE AGREEMENT (DELAWARE MICRO-APA)
ASSET: GF-T3-180 (Apex Executive Ultra-Heavy Telemetry Core Ultra Luxury Executive Core)
ACQUIRE.COM LISTING ID: ACQ-GF-LX600-180

1. PARTIES & RECITALS
This Asset Purchase Agreement ("Agreement") is executed as of October 11, 2026, by and between Ghost FactoryOS Systems Architecture Group ("Seller") and Authorized Acquiring Buyer ("Buyer").

2. PURCHASED ASSETS & ASSIGNMENT
2.1 Assignment of Intellectual Property: Seller hereby irrevocably sells, assigns, and transfers to Buyer all right, title, and interest in and to:
    (a) Pure Python 3.12 4-Wheel AHC Suspension & Damping Engine (Overland_lx600_ahc_core.py);
    (b) PostgreSQL 16 Partitioned Timeseries Schema & Hydraulic Quarantine Triggers;
    (c) OpenAPI 3.1 & WebSocket 1,250 Hz Binary Telemetry Contracts;
    (d) Non-root Multi-stage Dockerfile and PyTest Test Suite (>90% coverage);
    (e) Master Specification GF_T3_180_SPEC.md.

3. DEPLOYMENT SPECIFICATION & ESCROW
3.1 Turnkey DEPLOYMENT SPECIFICATION: TURNKEY CONTAINER / BARE-METAL
3.2 Escrow Mechanics: Disbursed via Escrow.com upon automated verification of test suite execution and GitHub repository transfer.

4. REPRESENTATIONS & WARRANTIES
4.1 Clean-Room Title: Seller warrants that all code was authored under strict clean-room protocols, containing zero copyleft (GPL, AGPL, SSPL) dependencies.
4.2 Non-Infringement: The Purchased Assets do not infringe upon any third-party intellectual property rights.

IN WITNESS WHEREOF, the parties hereto have executed this Asset Purchase Agreement.`;

    navigator.clipboard.writeText(agreement);
    setCopiedAgreement(true);
    setTimeout(() => setCopiedAgreement(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-bold text-white">
                Acquire.com Turnkey Micro-APA Covenant &amp; Escrow Blueprint
              </h2>
            </div>
            <p className="text-[15px] text-slate-400 mt-0.5">
              Standard Commercial Code Asset Purchase Agreement with clean-room intellectual property warranty
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTierSelection('turnkey')}
              className={`px-3 py-1.5 rounded-lg text-[15px] font-mono font-bold cursor-pointer transition-colors border ${
                tierSelection === 'turnkey'
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              Turnkey Asset Transfer: 20 kHz (0.48ms)
            </button>
            <button
              onClick={() => setTierSelection('enterprise')}
              className={`px-3 py-1.5 rounded-lg text-[15px] font-mono font-bold cursor-pointer transition-colors border ${
                tierSelection === 'enterprise'
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              Enterprise Vault: PostgreSQL 16 + RLS
            </button>
          </div>
        </div>

        {/* Milestone Steps Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-slate-950/70 rounded-xl border border-slate-800/80">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-mono font-bold text-[15px] shrink-0">
              1
            </div>
            <div>
              <div className="text-[15px] font-bold text-white">Escrow Deposit</div>
              <div className="text-[15px] text-slate-400">Escrow.com / Acquire Vault</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-mono font-bold text-[15px] shrink-0">
              2
            </div>
            <div>
              <div className="text-[15px] font-bold text-white">Code &amp; Key Handoff</div>
              <div className="text-[15px] text-slate-400">Git Org Transfer &amp; Secrets</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-mono font-bold text-[15px] shrink-0">
              3
            </div>
            <div>
              <div className="text-[15px] font-bold text-white">Automated Verification</div>
              <div className="text-[15px] text-slate-400">PyTest &gt;90% &amp; HMAC pass</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-mono font-bold text-[15px] shrink-0">
              4
            </div>
            <div>
              <div className="text-[15px] font-bold text-white">Title Release</div>
              <div className="text-[15px] text-emerald-400 font-semibold">Immediate Funds Release</div>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Specification Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={`bg-slate-900/90 border rounded-xl p-5 shadow-lg transition-all ${
            tierSelection === 'turnkey' ? 'border-amber-500 ring-1 ring-amber-500/40' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-0.5 rounded text-[15px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              TURNKEY STANDARD APA
            </span>
            <span className="text-2xl font-black font-mono text-white">20 kHz (0.48ms)</span>
          </div>
          <p className="text-[15px] text-slate-300 mb-4">
            Full outright acquisition of GF-T3-180 code, state machine, PostgreSQL schemas, and Docker harness.
          </p>
          <ul className="space-y-2 text-[15px] text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full GitHub repository ownership transfer</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Pure Python 3.12 AHC hydraulic algorithm suite</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>PostgreSQL 16 timeseries schema with quarantine triggers</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Clean-Room legal IP assignment warranty</span>
            </li>
          </ul>
        </div>

        <div
          className={`bg-slate-900/90 border rounded-xl p-5 shadow-lg transition-all ${
            tierSelection === 'enterprise' ? 'border-amber-500 ring-1 ring-amber-500/40' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-0.5 rounded text-[15px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
              ENTERPRISE MONOPOLY VAULT
            </span>
            <span className="text-2xl font-black font-mono text-amber-300">PostgreSQL 16 + RLS</span>
          </div>
          <p className="text-[15px] text-slate-300 mb-4">
            Exclusive perpetual category monopoly asset transfer with 90-day systems architect transition support.
          </p>
          <ul className="space-y-2 text-[15px] text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Includes everything in Turnkey Standard APA</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Exclusive perpetual anti-competition non-compete covenant</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Direct CAN-FD bus reverse-engineering trace captures</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>90 days dedicated Lead Systems Architect onboarding</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Legal Agreement Viewer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
          <span className="text-[15px] font-mono font-bold text-slate-300">
            DELAWARE_MICRO_APA_GF_T3_180.md (Pre-Drafted Ready for Signature)
          </span>
          <button
            onClick={copyAgreement}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md text-[15px] font-mono font-semibold cursor-pointer"
          >
            {copiedAgreement ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedAgreement ? 'Copied' : 'Copy APA Agreement'}</span>
          </button>
        </div>
        <pre className="p-5 font-mono text-[15px] text-slate-300 overflow-x-auto leading-relaxed max-h-[420px] bg-slate-950/70 whitespace-pre-wrap">
          {`ASSET PURCHASE AGREEMENT (DELAWARE MICRO-APA)
ASSET IDENTIFIER: GF-T3-180 (Apex Executive Ultra-Heavy Telemetry Core Ultra Luxury Executive Core)
SPECIFICATION: 20 kHz (0.48ms) (Turnkey) | PostgreSQL 16 + RLS (Enterprise Extended)
GOVERNING JURISDICTION: Standard Commercial Jurisdiction, United States

SECTION 1. DEFINITIONS & RECITALS
1.1 "Purchased Assets" means all software code, schemas, mathematical algorithms, and documentation associated with the GF-T3-180 project.
1.2 "Seller" means Ghost FactoryOS Systems Architecture Group.
1.3 "Buyer" means the verified acquiring entity executed via Acquire.com escrow.

SECTION 2. PURCHASE AND SALE OF ASSETS
2.1 Transfer of IP: Seller unconditionally conveys, assigns, and transfers to Buyer worldwide, perpetual, royalty-free, exclusive title to the following:
    - Pure Python 3.12 4-Wheel AHC Electro-Hydraulic Damping Engine
    - PostgreSQL 16 Partitioned Timeseries Schema with Divergence Triggers
    - OpenAPI 3.1 & WebSocket 1,250 Hz Low-Latency Protocol Specifications
    - Multi-Stage Hardened Non-Root Container Harness (Dockerfile)
    - PyTest Test Bench with >90% Coverage and Rollover Simulation
    - GF_T3_180_SPEC.md Master Vault Specification

SECTION 3. REPRESENTATIONS AND WARRANTIES
3.1 Organization and Authority: Seller has full corporate power and authority to execute this Agreement.
3.2 Intellectual Property Clean-Room Warranty: Seller warrants that all deliverables were authored from first-principles specifications with ZERO contamination from copyleft or viral licenses (including GPL, AGPL, and SSPL).
3.3 Non-Infringement: The Purchased Assets do not violate, misappropriate, or infringe any valid patent, copyright, or trademark of any third party.

SECTION 4. ESCROW AND CLOSING CONDITIONS
4.1 Escrow Mechanics: Closing shall occur concurrently with automated validation of the PyTest benchmark and deployment verification on Google Cloud Run. Upon buyer written sign-off or expiration of the 7-day inspection period, Escrow.com shall disburse funds to Seller.`}
        </pre>
      </div>
    </div>
  );
};
