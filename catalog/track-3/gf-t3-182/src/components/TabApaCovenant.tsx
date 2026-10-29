import React, { useState } from 'react';
import { FileText, Copy, Check, ShieldCheck, CheckSquare, Scale } from 'lucide-react';

const APA_AGREEMENT_TEXT = `================================================================================
ASSET PURCHASE AGREEMENT (MICRO-APA)
ASSET IDENTIFIER: GF-T3-182 (Apex Executive RC F TRACK EDITION AERO CORE)
ACQUIRE.COM ESCROW TRANSACTION REF: ACQ-GHOST-RCF-182
================================================================================

This ASSET PURCHASE AGREEMENT ("Agreement") is executed as of October 11, 2026,
by and between:

SELLER: Ghost FactoryOS Architecture Fleet ("Assignor")
BUYER:  Acquiring Institutional Principal / Verified Buyer via Acquire.com ("Assignee")

RECITALS
WHEREAS, Seller has independently developed, architected, and validated the active
aerodynamic control engine, mathematical torque vectoring algorithms, partitioned
PostgreSQL ledger, and associated technical documentation identified as GF-T3-182;
WHEREAS, Buyer desires to purchase, and Seller desires to sell, transfer, assign,
and convey all right, title, and interest in and to the Purchased Assets.

NOW, THEREFORE, the parties agree as follows:

SECTION 1: PURCHASE AND SALE OF ASSETS
1.1 Purchased Assets:
    (a) Complete Git repository source tree containing src/rcf_aero_core.py,
        PostgreSQL 16 partitioned schema DDL, OpenAPI 3.1 specifications, Dockerfile,
        and PyTest verification bench (>94% coverage).
    (b) CFD aerodynamic simulation matrices, lift-to-drag calibrated polar curves,
        and Apex Executive RC F Track Edition vehicle dynamics parameter maps.
    (c) Monotonic HMAC-SHA256 telemetry ledger database scripts and quarantine triggers.
    (d) All structural novelty design patent claims and trade-dress rights.
1.2 DEPLOYMENT SPECIFICATION & Terms:
    The total DEPLOYMENT SPECIFICATION is 20 kHz (0.48ms) for the Micro-APA Asset Transfer (PostgreSQL 16 + RLS for
    the Enterprise Exclusive Perpetual Asset Transfer), payable via Acquire.com / Escrow.com.

SECTION 2: EXHIBIT A - BILL OF SALE & IP ASSIGNMENT
Seller hereby sells, assigns, transfers, conveys, and delivers unto Buyer, its successors
and assigns forever, all right, title, and interest of Seller in and to the Purchased
Assets, free and clear of all liens, mortgages, pledges, encumbrances, or third-party
claims of any nature whatsoever.

SECTION 3: REPRESENTATIONS & CLEAN-ROOM WARRANTIES
3.1 Clean-Room Certification:
    Seller expressly warrants that 100% of the codebase was authored in a clean-room
    environment under permissive open-source licenses (MIT/BSD/Apache 2.0). Zero lines
    of code incorporate GPL, AGPL, SSPL, or proprietary third-party encumbrances.
3.2 Non-Infringement Warranty:
    Seller warrants that the operation of the GF-T3-182 Aero Core does not infringe
    upon any existing patent, copyright, or trade secret of any third party.

SECTION 4: ESCROW CLOSING & HANDOFF PROCEDURES
Upon confirmation of funds deposited with Acquire.com Escrow:
    1. Transfer of private GitHub organization repository ownership to Buyer.
    2. Delivery of signed cryptographic release keys and master HMAC seeds.
    3. Final execution of bilateral Bill of Sale and electronic signature exchange.
================================================================================
`;

export const TabApaCovenant: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [checklist, setChecklist] = useState({
    escrowDeposit: true,
    codeAudit: true,
    cleanRoomCert: true,
    gitTransfer: false,
    keysHandoff: false,
    finalBillOfSale: false
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(APA_AGREEMENT_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-sm font-mono text-cyan-400 uppercase tracking-wider mb-1">
              Tab 5 · Acquire.com Turnkey Micro-APA Covenant
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Asset Purchase Agreement & Escrow Transfer Protocol
            </h2>
          </div>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied APA Terms' : 'Copy APA Agreement'}</span>
          </button>
        </div>

        <p className="mt-3 text-sm text-slate-300 max-w-3xl">
          Complete legal covenants for Acquire.com micro-APA transactions (20 kHz (0.48ms) asset transfer) with Exhibit A Bill of Sale, clean-room non-infringement warranties, patent waiver clauses, and step-by-step escrow handoff procedures.
        </p>

        {/* Pricing & Commercial Structure */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <div className="text-sm font-mono text-slate-400">MICRO-APA ASSET TRANSFER</div>
            <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">20 kHz (0.48ms)</div>
            <div className="text-sm text-slate-300 mt-1">Single-entity asset transfer · Full source tree</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <div className="text-sm font-mono text-slate-400">ENTERPRISE ASSET TRANSFER</div>
            <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">PostgreSQL 16 + RLS</div>
            <div className="text-sm text-slate-300 mt-1">Exclusive monopoly rights · Escrow included</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <div className="text-sm font-mono text-slate-400">ESCROW PARTNER</div>
            <div className="text-2xl font-bold font-mono text-white mt-1">Acquire.com</div>
            <div className="text-sm text-slate-300 mt-1">Automated milestone disbursement</div>
          </div>
        </div>
      </div>

      {/* Escrow Closing Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 text-white font-semibold text-lg mb-4">
          <CheckSquare className="w-5 h-5 text-cyan-400" />
          <span>Acquire.com Escrow Closing Checklist</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label
            onClick={() => toggleCheck('escrowDeposit')}
            className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-900/80 transition-colors"
          >
            <input
              type="checkbox"
              checked={checklist.escrowDeposit}
              readOnly
              className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
            />
            <span className="text-sm font-medium text-slate-200">
              1. Escrow.com / Acquire.com Purchase Deposit Secured (20 kHz (0.48ms))
            </span>
          </label>

          <label
            onClick={() => toggleCheck('codeAudit')}
            className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-900/80 transition-colors"
          >
            <input
              type="checkbox"
              checked={checklist.codeAudit}
              readOnly
              className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
            />
            <span className="text-sm font-medium text-slate-200">
              2. Technical Code Audit & PyTest Coverage Verification (&gt;94%)
            </span>
          </label>

          <label
            onClick={() => toggleCheck('cleanRoomCert')}
            className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-900/80 transition-colors"
          >
            <input
              type="checkbox"
              checked={checklist.cleanRoomCert}
              readOnly
              className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
            />
            <span className="text-sm font-medium text-slate-200">
              3. Clean-Room IP Audit: 0% Copyleft Certified (MIT Permissive)
            </span>
          </label>

          <label
            onClick={() => toggleCheck('gitTransfer')}
            className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-900/80 transition-colors"
          >
            <input
              type="checkbox"
              checked={checklist.gitTransfer}
              readOnly
              className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
            />
            <span className="text-sm font-medium text-slate-200">
              4. Transfer Private GitHub Repository to Buyer Organization
            </span>
          </label>

          <label
            onClick={() => toggleCheck('keysHandoff')}
            className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-900/80 transition-colors"
          >
            <input
              type="checkbox"
              checked={checklist.keysHandoff}
              readOnly
              className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
            />
            <span className="text-sm font-medium text-slate-200">
              5. Cryptographic Release Keys & HMAC System Seeds Conveyance
            </span>
          </label>

          <label
            onClick={() => toggleCheck('finalBillOfSale')}
            className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-900/80 transition-colors"
          >
            <input
              type="checkbox"
              checked={checklist.finalBillOfSale}
              readOnly
              className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
            />
            <span className="text-sm font-medium text-slate-200">
              6. Execution of Exhibit A Bill of Sale & Escrow Disbursement
            </span>
          </label>
        </div>
      </div>

      {/* Legal Text Area */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-mono text-slate-200">legal/ENTERPRISE_APA_AGREEMENT.md</span>
            <span className="text-sm font-mono text-slate-500">· Pre-Drafted APA Contract</span>
          </div>
          <span className="text-sm font-mono text-emerald-400">Escrow.com Form</span>
        </div>

        <div className="p-4 overflow-x-auto">
          <pre className="text-sm font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
            {APA_AGREEMENT_TEXT}
          </pre>
        </div>
      </div>
    </div>
  );
};
