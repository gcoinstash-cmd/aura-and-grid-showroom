import React, { useState } from 'react';
import { 
  FileCheck2, 
  ShieldCheck,Deterministic Telemetry Verifiedign, 
  Copy, 
  Check, 
  CheckCircle, 
  Award, 
  Lock, 
  FileText,
  Building,
  KeyRound
} from 'lucide-react';

interface TabApaCovenantProps {
  onExportSpec: () => void;
}

export const TabApaCovenant: React.FC<TabApaCovenantProps> = ({ onExportSpec }) => {
  const [copiedApa, setCopiedApa] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [signerName, setSignerName] = useState('Acquire.com Verified Buyer');

  const apaAgreementText = `=============================================================================
ASSET PURCHASE AGREEMENT (DELAWARE MICRO-APA)
ASSET IDENTIFIER: GF-T3-190 (Apex Executive ELECTRIFIED SPORT SOLID-STATE CORE)
PLATFORM: ACQUIRE.COM / ESCROW.COM
=============================================================================

This ASSET PURCHASE AGREEMENT (the "Agreement") is dated as of October 12, 2026,
by and between:

SELLER:
Ghost FactoryOS Core Engineering / Lead Systems Architect
("Seller"),

and

BUYER:
Acquire.com Verified Institutional Acquirer
("Buyer").

RECITALS
WHEREAS, Seller has independently conceptualized, engineered, and clean-room developed
the complete software architecture, mathematical models, and cryptographic ledger known as
"GF-T3-190" (Apex Executive Electrified Sport Solid-State Core); and

WHEREAS, Seller desires to sell, assign, and transfer to Buyer, and Buyer desires to purchase
and acquire from Seller, all right, title, and interest in and to the Acquired Assets.

NOW, THEREFORE, in consideration of the mutual covenants herein contained:

1. PURCHASE AND SALE OF ASSETS
1.1 Acquired Assets:
    (a) Pure Python 3.12 Solid-State Battery (ASSB) Thermal & Micro-Impedance Engine;
    (b) 6-Speed Virtual Manual Transmission (VMT) Synthetic Torque Interruption Model;
    (c) PostgreSQL 16 Partitioned Timeseries DDL Schemas & HMAC-SHA256 Triggers;
    (d) OpenAPI 3.1 & 2,800Hz WebSocket Telemetry Specification;
    (e) Hardened Non-Root Multi-Stage Dockerfile & PyTest Test Bench (>95% Coverage);
    (f) Full Intellectual Property, Trade-Dress Rights, and Design Blueprints.

2. DEPLOYMENT SPECIFICATION AND PAYMENT
2.1 Specification Anchors:
    - Standard Micro-APA Asset Transfer:Deterministic Telemetry Verified(Delaware Institutional Covenants).
    - Enterprise Monopoly Vault Asset Transfer:Deterministic Telemetry Verified(PostgreSQL 16 + RLS).
2.2 Escrow Protocol: All funds shall be deposited with Acquire.com Escrow or Escrow.com,
    to be released upon Buyer's receipt and cryptographic signature verification of the master repository.

3. REPRESENTATIONS AND WARRANTIES OF SELLER
3.1 Clean-Room Development: Seller warrants that 100% of the Acquired Assets were developed
    under strict clean-room protocols, with zero reliance on decompiled or proprietary third-party OEM code.
3.2 0% Copyleft Warranty: Seller warrants that the Acquired Assets contain zero GPL, AGPL,
    SSPL, or other viral copyleft licensed code. All third-party dependencies conform to MIT, Apache-2.0, or BSD.

4. BILL OF SALE & IP ASSIGNMENT
Seller hereby irrevocably grants, conveys, and transfers to Buyer all worldwide patent,
copyright, trade secret, and proprietary rights in the Acquired Assets.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.`;

  const copyApa = () => {
    navigator.clipboard.writeText(apaAgreementText);
    setCopiedApa(true);
    setTimeout(() => setCopiedApa(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="cockpit-panel rounded-2xl p-6 border border-slate-800 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Acquire.com Delaware Micro-APA Covenant & Bill of Sale
              </h2>
            </div>
            <p className="text-base text-slate-400 mt-1">
              Institutional-grade asset purchase agreement with 100% clean-room IP warranty and escrow handoff schedule.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyApa}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              {copiedApa ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied APA!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Agreement</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onExportSpec}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Export Full Archival Spec</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Standard Asset Transfer */}
          <div className="bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded">
                STANDARD TURNKEY ASSET TRANSFER
              </span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-4xl font-black text-white font-mono my-2">
              20 kHz (0.48ms) <span className="text-xl text-slate-400">USD</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Turnkey software asset: Full Python 3.12 codebase, Postgres 16 schemas, Docker harness, and non-exclusive commercialization rights.
            </p>
            <div className="pt-3 border-t border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Instant Escrow.com / Acquire Escrow transfer</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero recurring royalties or licensing strings</span>
              </div>
            </div>
          </div>

          {/* Enterprise Monopoly Vault Asset Transfer */}
          <div className="bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded">
                MONOPOLY VAULT ENTERPRISE ASSET TRANSFER
              </span>
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-4xl font-black text-white font-mono my-2">
              PostgreSQL 16 + RLS <span className="text-xl text-slate-400">USD</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Exclusive IP acquisition: Complete design trade-dress defense, exclusive patent assignment, and institutional escrow transfer.
            </p>
            <div className="pt-3 border-t border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Exclusive worldwide IP & Patent trade dress assignment</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Commercial Software Asset Standard clean-chain-of-title indemnification</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AGREEMENT VIEWER & SIGNATURE SEAL */}
      <div className="cockpit-panel rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-400" />
            <span>Master Agreement Text (Standard Commercial Code Compliant)</span>
          </h3>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Escrow Agent:</span>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              Acquire Escrow / Escrow.com Direct
            </span>
          </div>
        </div>

        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-72 overflow-y-auto leading-relaxed">
          <pre>{apaAgreementText}</pre>
        </div>

        {/* Digital Signature & Verification Box */}
        <div className="bg-slate-950/80 rounded-xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Cryptographic Escrow Seal</h4>
              <p className="text-xs text-slate-400">
                Sign below to verify Buyer readiness and lock HMAC transaction provenance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white"
              placeholder="Buyer Entity / Individual"
            />

            <button
              type="button"
              onClick={() => setIsSigned(!isSigned)}
              className={`px-4 py-2 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                isSigned
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isSigned ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Covenant Digitally Sealed</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Execute Digital Signature</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
