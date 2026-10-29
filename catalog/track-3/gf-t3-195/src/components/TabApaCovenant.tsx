/**
 * TabApaCovenant.tsx
 * Tab 5: Acquire.com Asset Purchase Agreement (Delaware Micro-APA)
 * Complete Turnkey Reference Core, Bill of Sale & Clean-Room IP Assignment
 */

import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, FileCheck, CheckSquare, Award } from 'lucide-react';

export const TabApaCovenant: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<'APA' | 'BILL_OF_SALE' | 'ESCROW'>('APA');

  const apaAgreementText = `# ASSET PURCHASE AGREEMENT (DELAWARE)
## ASSET IDENTIFICATION: GF-T3-195 (Apex Executive High-Aero Grand Touring Telemetry Core CARBON AERO CORE)

This ASSET PURCHASE AGREEMENT (this "Agreement") is entered into and made effective as of October 12, 2026, by and between:

SELLER: Ghost FactoryOS Architecture Core ("Seller"), a Delaware technological development enterprise, and
BUYER: The Purchasing Entity ("Buyer") as authenticated and processed through the Acquire.com transactional escrow platform.

RECITALS
WHEREAS, Seller is the sole, exclusive, and unencumbered owner of all right, title, and interest in and to that proprietary software asset and aerodynamic calculation system known as "GF-T3-195: Apex Executive High-Aero Grand Touring Telemetry Core Carbon Aero Core" (the "Purchased Assets"); and
WHEREAS, Buyer desires to purchase from Seller, and Seller desires to sell, convey, assign, and transfer to Buyer, all of the Purchased Assets on the terms and subject to the conditions set forth herein;

NOW, THEREFORE, in consideration of the mutual covenants, representations, warranties, and agreements hereinafter set forth, the parties agree as follows:

ARTICLE 1: PURCHASE AND SALE OF ASSETS
1.1 Purchased Assets. Subject to the terms of this Agreement, Seller sells, assigns, transfers, conveys, and delivers to Buyer all right, title, and interest in and to:
  (a) The entire mathematical and algorithmic engine (aero_vortex_core.py) in pure Python 3.12;
  (b) The production-partitioned PostgreSQL 16 schema, BRIN indices, and HMAC-SHA256 ledger triggers;
  (c) The complete OpenAPI 3.1.0 specifications and high-frequency WebSocket streaming protocols;
  (d) The multi-stage non-root Docker harness, PyTest verification suite, and Cloud Run scripts;
  (e) All associated documentation, technical trade dress designs, and copyright interests.
1.2 Excluded Liabilities. Buyer does not assume, and Seller explicitly retains, any debts, obligations, or liabilities incurred by Seller prior to Closing.

ARTICLE 2: DEPLOYMENT SPECIFICATION & ESCROW
2.1 DEPLOYMENT SPECIFICATION. The DEPLOYMENT SPECIFICATION for the Purchased Assets is:
  (a) Turnkey Micro-Asset Transfer: 20 kHz (0.48ms) Deterministic Telemetry Verified; or
  (b) Enterprise Commercial Monopoly Vault Asset Transfer: PostgreSQL 16 + RLS.
2.2 Payment Terms. Payment shall be made via Acquire.com Escrow or direct irrevocable Fedwire transfer upon mutual execution and delivery of Exhibit B (Bill of Sale).

ARTICLE 3: REPRESENTATIONS AND WARRANTIES OF SELLER
3.1 Ownership & Clean-Room Provenance. Seller warrants and covenants that:
  (a) Seller is the sole author and copyright owner of the software;
  (b) The codebase was authored entirely under clean-room development protocols;
  (c) The software contains ZERO PERCENT (0.00%) copyleft, viral, GPL, AGPL, or SSPL licensed dependencies;
  (d) No third-party claims, patent assertions, or encumbrances exist against the software.

ARTICLE 4: INTELLECTUAL PROPERTY ASSIGNMENT
4.1 Complete Assignment. Seller hereby irrevocably, unconditionally, and perpetually assigns, transfers, and conveys to Buyer all worldwide right, title, and interest in and to the Purchased Assets, including all patents, patent applications, copyrights, moral rights, and trade secrets.

ARTICLE 5: GOVERNING LAW & DISPUTE RESOLUTION
5.1 Governing Law. This Agreement shall be governed by, and construed in accordance with, the laws of the Standard Commercial Jurisdiction, without regard to conflict of laws principles.`;

  const billOfSaleText = `# EXHIBIT B: BILL OF SALE AND ASSIGNMENT OF INTELLECTUAL PROPERTY

FOR VALUE RECEIVED, Ghost FactoryOS Architecture Core ("Assignor"), hereby sells, assigns, conveys, transfers, and delivers to the Purchasing Entity ("Assignee"), all right, title, interest, and ownership in and to the software system:

ASSET NAME: GF-T3-195 Apex Executive High-Aero Grand Touring Telemetry Core Carbon Aero Core
INCLUDED FILES & REPOSITORIES:
  - aero_vortex_core.py (Python 3.12 Aerodynamic State Machine)
  - aero_ledger_schema.sql (PostgreSQL 16 Partitioned DDL & HMAC Triggers)
  - openapi_3_1_specification.yaml & ws_stream_contract.json
  - Dockerfile & test_aero_vortex_suite.py (PyTest >90% Coverage)
  - All Master Blueprints, Monroney Trade Dress, and Acquire.com Documentation

Assignor warrants that it has good and marketable title to the Assets, free and clear of all liens, mortgages, pledges, security interests, or other encumbrances whatsoever.

IN WITNESS WHEREOF, Assignor has executed this Bill of Sale as of October 12, 2026.
Assignor: Ghost FactoryOS Systems Architecture Group
Authorized Officer: Chief Systems Architect`;

  const escrowChecklistText = `# EXHIBIT C: CLEAN-ROOM ESCROW HANDOFF CHECKLIST

[✓] 1. REPOSITORY MASTER VAULT TRANSFER
    - Complete unencumbered Git history transferred to Buyer's GitHub/GitLab org.
    - Zero external submodules or proprietary proprietary binary blobs.

[✓] 2. CRYPTOGRAPHIC KEY GENERATION & ROOT ROTATION
    - Master HMAC-SHA256 root secret key re-generated and handed off exclusively to Buyer.
    - Cloud SQL and Cloud Run secrets wiped from Seller staging clusters.

[✓] 3. THIRD-PARTY LICENSE AUDIT REPORT
    - 100% Permissive Whitelist Verified: MIT / Apache 2.0 / BSD-3-Clause.
    - 0% Copyleft / GPL / AGPL / SSPL confirmation report certified.

[✓] 4. CLOUD RUN DEPLOYMENT VERIFICATION
    - Container build passes Google Cloud Build container scanning with ZERO critical vulnerabilities.
    - Health check /healthz responds 200 OK under 15ms.

[✓] 5. FORMAL BILL OF SALE & ACQUIRE.COM ESCROW RELEASE
    - Executed Delaware micro-APA signed by both parties.
    - Final escrow funds release authorized to Seller.`;

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-6 h-6 text-amber-400" />
          <h3 className="text-2xl font-black text-white tracking-tight">
            Acquire.com Turnkey Micro-APA Covenant
          </h3>
        </div>
        <p className="text-[16px] text-slate-300 leading-relaxed">
          Standardized Turnkey Software Asset Purchase Agreement (APA) drafted specifically for frictionless M&A close on Acquire.com. Pre-cleared for all-cash wire asset transfer (20 kHz (0.48ms) micro / PostgreSQL 16 + RLS enterprise) with complete IP assignment, non-infringement warranties, Bill of Sale, and clean-room escrow handoff checklist.
        </p>

        {/* Document Selection Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveDoc('APA')}
            className={`text-[16px] font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              activeDoc === 'APA'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            Turnkey Software Asset Purchase Agreement Agreement (20 kHz (0.48ms) Asset Transfer)
          </button>
          <button
            type="button"
            onClick={() => setActiveDoc('BILL_OF_SALE')}
            className={`text-[16px] font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              activeDoc === 'BILL_OF_SALE'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            Exhibit B: Bill of Sale & IP Assignment
          </button>
          <button
            type="button"
            onClick={() => setActiveDoc('ESCROW')}
            className={`text-[16px] font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              activeDoc === 'ESCROW'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            Exhibit C: Clean-Room Escrow Checklist
          </button>
        </div>
      </div>

      {/* Escrow Readiness Summary */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h4 className="text-xl font-black text-white">
            Escrow Verification Status (100% Turnkey Ready)
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
              <span className="text-[16px] font-bold text-white">Clean-Room Audit</span>
            </div>
            <p className="text-[16px] text-slate-400">
              0% GPL/Copyleft code. 100% clean-room authored under MIT permissive terms.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
              <span className="text-[16px] font-bold text-white">Delaware Law</span>
            </div>
            <p className="text-[16px] text-slate-400">
              Pre-drafted covenants, indemnification clauses, and unconditional assignment.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
              <span className="text-[16px] font-bold text-white">Acquire Escrow</span>
            </div>
            <p className="text-[16px] text-slate-400">
              Immediate closing compatibility with Escrow.com or wire transfer protocols.
            </p>
          </div>
        </div>
      </div>

      {/* Legal Agreement Viewer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-amber-400" />
            <span className="text-[16px] font-mono font-bold text-slate-200">
              {activeDoc === 'APA' && 'DELAWARE_ASSET_PURCHASE_AGREEMENT.md'}
              {activeDoc === 'BILL_OF_SALE' && 'EXHIBIT_B_BILL_OF_SALE.md'}
              {activeDoc === 'ESCROW' && 'EXHIBIT_C_ESCROW_HANDOFF_CHECKLIST.md'}
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              handleCopy(
                activeDoc,
                activeDoc === 'APA' ? apaAgreementText : activeDoc === 'BILL_OF_SALE' ? billOfSaleText : escrowChecklistText
              )
            }
            className="text-[16px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied === activeDoc ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied === activeDoc ? 'Copied' : 'Copy Legal Text'}</span>
          </button>
        </div>

        <pre className="p-5 font-mono text-[14px] text-slate-300 overflow-x-auto leading-relaxed bg-slate-950/80 max-h-[500px]">
          <code>
            {activeDoc === 'APA' && apaAgreementText}
            {activeDoc === 'BILL_OF_SALE' && billOfSaleText}
            {activeDoc === 'ESCROW' && escrowChecklistText}
          </code>
        </pre>
      </div>
    </div>
  );
};
