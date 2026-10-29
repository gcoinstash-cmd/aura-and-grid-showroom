import React, { useState } from 'react';
import { FileText, ShieldCheck, CheckSquare, Square, Copy, Check, DollarSign } from 'lucide-react';

export const ApaCovenantTab: React.FC = () => {
  const [tier, setTier] = useState<'standard' | 'enterprise'>('standard');
  const [checklist, setChecklist] = useState({
    cleanRoomAudit: true,
    gitBundleSha: true,
    pgMigrationsVerified: true,
    cloudRunVulnerabilityFree: true,
    escrowDepositLocked: true,
    billOfSaleSigned: true,
  });
  const [contractCopied, setContractCopied] = useState(false);

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecksComplete = Object.values(checklist).every(Boolean);
  const purchasePrice = tier === 'standard' ? '20 kHz (0.48ms)' : 'PostgreSQL 16 + RLS';

  const apaContractText = `Turnkey Software Asset Purchase Agreement (MICRO-APA)
ASSET IDENTIFIER: GF-T3-198 (Apex Executive LFA NÜRBURGRING EDITION V10 TELEMATICS CORE)
PLATFORM ESCROW: ACQUIRE.COM / ESCROW.COM
GOVERNING LAW: Standard Commercial Jurisdiction

THIS ASSET PURCHASE AGREEMENT (this "Agreement") is entered into as of the closing date by and between Ghost FactoryOS Architectural Holdings LLC ("Seller"), and the acquiring entity registered on Acquire.com ("Buyer").

RECITALS
WHEREAS, Seller owns 100% right, title, and interest in and to the proprietary algorithmic engine, valvetrain telematics core, acoustic harmonic mapping, PostgreSQL 16 schema, and associated IP designated as "GF-T3-198"; and
WHEREAS, Buyer desires to purchase and acquire all rights, title, source code, and intellectual property embodied in GF-T3-198, free and clear of all liens and encumbrances.

NOW, THEREFORE, the parties agree as follows:

1. PURCHASE AND SALE OF ASSETS
Subject to the terms and conditions hereof, Seller hereby sells, assigns, transfers, conveys, and delivers to Buyer, and Buyer purchases from Seller, all right, title, and interest in the following Acquired Assets:
(a) The 1LR-GUE 72° V10 acoustic harmonic synthesis algorithm and Yamaha surge tank Helmholtz resonance formulas;
(b) The Automated Sequential Gearbox (ASG) 150ms electro-hydraulic shift state machine;
(c) The production PostgreSQL 16 partitioned hypertable schema and 7-stage scavenge pressure drop quarantine triggers;
(d) The OpenAPI 3.1 REST specification and 100 Hz binary WebSocket framing protocol;
(e) The Cloud Run multi-stage Dockerfile and PyTest automated validation test bench (>90% coverage);
(f) All copyrights, trade-dress blueprints, and technical documentation.

2. DEPLOYMENT SPECIFICATION & ESCROW FUNDING
The total DEPLOYMENT SPECIFICATION for the Acquired Assets shall be ${purchasePrice} in immediate available funds, disbursed via Acquire.com Escrow upon confirmation of repository transfer and SHA-256 verification.

3. CLEAN-ROOM PROVENANCE & NON-INFRINGEMENT WARRANTIES
Seller explicitly warrants and represents:
(a) Clean-Room Development: All software and mathematical algorithms were developed in an isolated clean-room environment with zero derivation from proprietary Toyota Motor Corporation or Yamaha Motor Co. source code.
(b) Dependency Whitelist: 100% of third-party dependencies are licensed strictly under permissive MIT or Apache 2.0 terms. Zero GPL, AGPL, or copyleft licenses are incorporated.
(c) Freedom from Encumbrances: The Acquired Assets are free from any liens, security interests, claims, or ongoing royalties.

4. EXHIBIT A: BILL OF SALE & IP ASSIGNMENT
Seller hereby grants, bargains, sells, conveys, and assigns to Buyer, its successors and assigns forever, the entire worldwide right, title, and interest in and to any and all inventions, patents, patent applications, copyrights, and trade dress arising out of or related to GF-T3-198.

5. ESCROW RELEASE CONDITION PRECEDENT
Escrow shall be released to Seller immediately upon Buyer's receipt of:
(1) Cryptographic Git bundle with signed master commit;
(2) SHA-256 manifest matching the master verification nonce;
(3) Completed execution of this Agreement.

IN WITNESS WHEREOF, the parties have executed this Asset Purchase Agreement as of the date first written above.

SELLER: Ghost FactoryOS Architectural Holdings LLC
By: Chief Systems Architect, Fleet Tier 3

BUYER: [Acquire.com Verified Buyer Signatory]`;

  const copyContract = () => {
    navigator.clipboard.writeText(apaContractText);
    setContractCopied(true);
    setTimeout(() => setContractCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Tier & Pricing Selection Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 mb-6 border-b border-slate-800 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-amber-400" />
              <span>Acquire.com Turnkey Micro-APA Covenant</span>
            </h2>
            <p className="text-base text-slate-400 mt-1">
              Delaware legal instrument with full IP assignment schedule, Bill of Sale, and clean-room provenance warranties.
            </p>
          </div>

          {/* Tier Switcher */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setTier('standard')}
              className={`px-4 py-2 text-base font-bold rounded-lg transition-colors cursor-pointer ${
                tier === 'standard'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Standard Asset Transfer (20 kHz (0.48ms))
            </button>
            <button
              onClick={() => setTier('enterprise')}
              className={`px-4 py-2 text-base font-bold rounded-lg transition-colors cursor-pointer ${
                tier === 'enterprise'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Enterprise Vault (PostgreSQL 16 + RLS)
            </button>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800">
            <span className="text-base font-semibold text-slate-400">Total DEPLOYMENT SPECIFICATION: TURNKEY CONTAINER / BARE-METAL</span>
            <div className="text-3xl font-black font-mono text-amber-400 my-1">
              {purchasePrice}
            </div>
            <span className="text-base text-slate-400">All-Cash Escrow (No Earnout)</span>
          </div>

          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800">
            <span className="text-base font-semibold text-slate-400">Legal Jurisdiction:</span>
            <div className="text-3xl font-black font-mono text-white my-1">
              DELAWARE
            </div>
            <span className="text-base text-slate-400">Chancery Court Standard</span>
          </div>

          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800">
            <span className="text-base font-semibold text-slate-400">Escrow Handoff:</span>
            <div className="text-3xl font-black font-mono text-emerald-400 my-1">
              &lt; 24 HOURS
            </div>
            <span className="text-base text-emerald-400 font-bold">1-Click Git Bundle Transfer</span>
          </div>
        </div>

        {/* Escrow Release Checklist */}
        <div className="p-5 bg-slate-950/70 rounded-xl border border-slate-800 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <span>Clean-Room Escrow Closing Checklist</span>
            </h3>
            <span
              className={`text-base font-mono font-bold px-3 py-1 rounded-md ${
                allChecksComplete
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}
            >
              {allChecksComplete ? 'READY FOR ESCROW RELEASE' : 'PENDING CLOSING VERIFICATION'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-base">
            <div
              onClick={() => toggleCheck('cleanRoomAudit')}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700"
            >
              {checklist.cleanRoomAudit ? (
                <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-slate-500 shrink-0" />
              )}
              <span className="text-slate-200">Clean-room audit verified (0% copyleft / MIT-only)</span>
            </div>

            <div
              onClick={() => toggleCheck('gitBundleSha')}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700"
            >
              {checklist.gitBundleSha ? (
                <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-slate-500 shrink-0" />
              )}
              <span className="text-slate-200">SHA-256 Git bundle integrity hash signed</span>
            </div>

            <div
              onClick={() => toggleCheck('pgMigrationsVerified')}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700"
            >
              {checklist.pgMigrationsVerified ? (
                <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-slate-500 shrink-0" />
              )}
              <span className="text-slate-200">PostgreSQL 16 partitioned schema test passed</span>
            </div>

            <div
              onClick={() => toggleCheck('cloudRunVulnerabilityFree')}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700"
            >
              {checklist.cloudRunVulnerabilityFree ? (
                <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-slate-500 shrink-0" />
              )}
              <span className="text-slate-200">Cloud Run container security scan 0 CVEs</span>
            </div>

            <div
              onClick={() => toggleCheck('escrowDepositLocked')}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700"
            >
              {checklist.escrowDepositLocked ? (
                <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-slate-500 shrink-0" />
              )}
              <span className="text-slate-200">Acquire.com escrow deposit funded (20 kHz (0.48ms))</span>
            </div>

            <div
              onClick={() => toggleCheck('billOfSaleSigned')}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700"
            >
              {checklist.billOfSaleSigned ? (
                <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-slate-500 shrink-0" />
              )}
              <span className="text-slate-200">Bill of Sale executed by Chief Architect</span>
            </div>
          </div>
        </div>

        {/* Legal Text Viewer */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span className="text-base font-bold text-white">
                Turnkey Software Asset Purchase Agreement Text (`APA_AGREEMENT.txt`)
              </span>
            </div>

            <button
              onClick={copyContract}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-base font-bold h-10 px-4 rounded-lg inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              {contractCopied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              <span>{contractCopied ? 'Contract Copied!' : 'Copy Legal Contract'}</span>
            </button>
          </div>

          <pre className="text-base font-mono text-slate-300 overflow-x-auto max-h-96 leading-relaxed whitespace-pre-wrap">
            {apaContractText}
          </pre>
        </div>
      </div>
    </div>
  );
};
