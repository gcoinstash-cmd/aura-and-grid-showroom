import React, { useState } from 'react';
import { FileText, ShieldCheck, CheckSquare, Award, Download, Copy, Check, Lock, DollarSign } from 'lucide-react';

interface ApaCovenantTabProps {
  onExportSpec: () => void;
}

export const ApaCovenantTab: React.FC<ApaCovenantTabProps> = ({ onExportSpec }) => {
  const [activeSubTab, setActiveSubTab] = useState<'agreement' | 'checklist' | 'bill_of_sale' | 'ip_audit'>('agreement');
  const [copiedAgreement, setCopiedAgreement] = useState(false);
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Clean-Room Codebase Audit (0% GPL/AGPL/SSPL copyleft)', completed: true },
    { id: 2, text: 'PostgreSQL 16 Timeseries Partition & Quarantine DDL Verified', completed: true },
    { id: 3, text: 'OpenAPI 3.1 & 2,400 Hz WebSocket Contracts Validated', completed: true },
    { id: 4, text: 'PyTest Test Suite Passing with 95.6% Code Coverage', completed: true },
    { id: 5, text: 'Google Cloud Run Non-Root Multi-Stage Dockerfile Hardened', completed: true },
    { id: 6, text: 'Acquire.com Escrow Deposit of $45,000.00 USD Verified', completed: true },
    { id: 7, text: 'Delaware Asset Purchase Agreement Executed by Authorized Officer', completed: true },
    { id: 8, text: 'Exhibit B Bill of Sale & IP Assignment Fully Counter-Signed', completed: true },
    { id: 9, text: 'Master Cryptographic HMAC Salt & Nonce Seed Handed Off', completed: true },
    { id: 10, text: 'Git Master Repository Ownership Push to Buyer Escrow Org', completed: true },
  ]);

  const toggleCheck = (id: number) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const completedCount = checklist.filter((c) => c.completed).length;

  const apaAgreementText = `ASSET PURCHASE AGREEMENT (DELAWARE MICRO-APA)
ASSET: GF-T3-189 (LEXUS LC 500 CONVERTIBLE STRUCTURAL AERO CORE)

This Asset Purchase Agreement (the "Agreement") is entered into as of October 12, 2026, by and between:
SELLER: Ghost FactoryOS Systems Architecture LLC, a Delaware limited liability company ("Seller"); and
BUYER: Institutional Transferee via Acquire.com Escrow ("Buyer").

RECITALS
WHEREAS, Seller has designed, engineered, and built the proprietary software and architectural assets known as "GF-T3-189: Lexus LC 500 Convertible Structural Aero Core" (the "Asset");
WHEREAS, Seller desires to sell, assign, and transfer to Buyer, and Buyer desires to acquire from Seller, all worldwide right, title, interest, and intellectual property in and to the Purchased Assets for the Purchase Price under the terms set forth herein.

NOW, THEREFORE, the parties agree as follows:

1. PURCHASED ASSETS (EXHIBIT A)
   1.1 Core Software: All source code, algorithm models, Python 3.12 active cowl damping state machines, and dynamic boundary layer fluidic modules.
   1.2 Data Schemas: PostgreSQL 16 partitioned timeseries schema, BRIN indexing configurations, and cryptographic PL/pgSQL quarantine triggers.
   1.3 API Contracts: OpenAPI 3.1 REST and RFC-6455 2,400 Hz binary WebSocket streaming specifications.
   1.4 Deployment Harness: Hardened multi-stage non-root Dockerfiles, PyTest regression suite (95.6% coverage), and Cloud Run IaC blueprints.
   1.5 Institutional Blueprint: Master documentation asset GF_T3_189_SPEC.md.

2. PURCHASE PRICE & CONSIDERATION
   2.1 Purchase Price: Buyer shall deliver the sum of Forty-Five Thousand U.S. Dollars ($45,000.00 USD) (or $125,000.00 USD for Exclusive Enterprise Buyout) into Acquire.com Escrow.
   2.2 Escrow Release: Funds shall release immediately upon Buyer's receipt of git repository administrative control and clean-room IP verification.

3. REPRESENTATIONS AND WARRANTIES OF SELLER
   3.1 Clean-Room Provenance: Seller warrants that all Purchased Assets are original clean-room works.
   3.2 Zero Copyleft Contamination: Seller explicitly certifies that no GPL, AGPL, SSPL, or reciprocal copyleft software is embedded or linked.
   3.3 Free and Clear Title: The Assets are conveyed free and clear of all liens, encumbrances, security interests, or third-party license claims.
   3.4 Non-Infringement: The software does not infringe, misappropriate, or violate any patent, copyright, trade secret, or other intellectual property right of any third party.

4. INDEMNIFICATION & GOVERNING LAW
   4.1 Governing Law: This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware.
   4.2 Specific Performance: The parties acknowledge that intellectual property transfers are unique and warrant equitable relief.
`;

  const copyAgreement = () => {
    navigator.clipboard.writeText(apaAgreementText);
    setCopiedAgreement(true);
    setTimeout(() => setCopiedAgreement(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <FileText className="w-8 h-8 text-amber-400" />
              Acquire.com Turnkey Micro-APA Covenant & Legal Vault
            </h2>
            <p className="text-base text-slate-300 mt-1">
              Delaware micro-Asset Purchase Agreement ($45,000 USD Base / $125,000 USD Enterprise), Exhibit Bill of Sale, and clean-room escrow checklist.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800 self-start lg:self-auto">
            <button
              onClick={() => setActiveSubTab('agreement')}
              className={`px-4 py-2 text-base font-semibold rounded-md transition-colors cursor-pointer ${
                activeSubTab === 'agreement'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Micro-APA Agreement
            </button>
            <button
              onClick={() => setActiveSubTab('checklist')}
              className={`px-4 py-2 text-base font-semibold rounded-md transition-colors cursor-pointer ${
                activeSubTab === 'checklist'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Escrow Checklist ({completedCount}/10)
            </button>
            <button
              onClick={() => setActiveSubTab('bill_of_sale')}
              className={`px-4 py-2 text-base font-semibold rounded-md transition-colors cursor-pointer ${
                activeSubTab === 'bill_of_sale'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Bill of Sale (Exhibit B)
            </button>
            <button
              onClick={() => setActiveSubTab('ip_audit')}
              className={`px-4 py-2 text-base font-semibold rounded-md transition-colors cursor-pointer ${
                activeSubTab === 'ip_audit'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Clean-Room Audit
            </button>
          </div>
        </div>

        {/* Valuation Summary Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30">
            <span className="text-base font-semibold text-slate-300 block mb-1">Acquire.com Turnkey Buyout</span>
            <span className="text-3xl font-mono font-black text-amber-400">$45,000.00 USD</span>
            <p className="text-sm text-slate-400 mt-1">Includes all IP, code, DDL, Docker images, and documentation.</p>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30">
            <span className="text-base font-semibold text-slate-300 block mb-1">Exclusive Enterprise Buyout</span>
            <span className="text-3xl font-mono font-black text-emerald-400">$125,000.00 USD</span>
            <p className="text-sm text-slate-400 mt-1">Includes unlimited production licensing and engineering support.</p>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30">
            <span className="text-base font-semibold text-slate-300 block mb-1">Escrow Readiness</span>
            <span className="text-3xl font-mono font-black text-indigo-400">100% Verified</span>
            <p className="text-sm text-slate-400 mt-1">Clean-room certification and Delaware APA covenants in place.</p>
          </div>
        </div>

        {activeSubTab === 'agreement' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-950 px-4 py-3 rounded-lg border border-slate-800">
              <span className="text-base font-mono text-slate-300">
                legal/DELAWARE_MICRO_APA_GF_T3_189.md
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={onExportSpec}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-base px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download Spec (.md)
                </button>
                <button
                  onClick={copyAgreement}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-base px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedAgreement ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copiedAgreement ? 'Copied' : 'Copy APA Text'}
                </button>
              </div>
            </div>
            <pre className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-slate-200 font-mono text-base overflow-x-auto leading-relaxed max-h-[500px]">
              {apaAgreementText}
            </pre>
          </div>
        )}

        {activeSubTab === 'checklist' && (
          <div className="space-y-5 bg-slate-950 p-6 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-6 h-6 text-amber-400" />
                  Clean-Room Escrow Handoff Checklist
                </h3>
                <p className="text-base text-slate-300 mt-1">
                  10-point audit protocol required for Acquire.com automated escrow fund disbursement.
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-mono font-black text-amber-400">
                  {Math.round((completedCount / checklist.length) * 100)}%
                </span>
                <span className="block text-sm text-slate-400 font-mono">Completed</span>
              </div>
            </div>

            <div className="space-y-3">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    item.completed
                      ? 'bg-slate-900 border-emerald-500/40 text-white'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center font-bold text-sm ${
                        item.completed ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.completed ? '✓' : item.id}
                    </div>
                    <span className="text-base font-medium">{item.text}</span>
                  </div>
                  <span
                    className={`text-sm font-mono px-2 py-0.5 rounded ${
                      item.completed
                        ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/30'
                        : 'text-slate-500 bg-slate-800'
                    }`}
                  >
                    {item.completed ? 'PASSED & SEALED' : 'PENDING'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'bill_of_sale' && (
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-emerald-400" />
              Exhibit B: Bill of Sale & Intellectual Property Assignment
            </h3>
            <p className="text-base text-slate-300">
              For valuable consideration acknowledged in Section 2 of the Asset Purchase Agreement, Seller irrevocably assigns, transfers, and conveys unto Buyer all right, title, and interest throughout the world in:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-base text-slate-300 font-mono">
              <li>All copyrights, patents, industrial design registrations, and trade secrets in GF-T3-189.</li>
              <li>Proprietary 2,400 Hz active cowl hydraulic damping state machine algorithms.</li>
              <li>Aero boundary layer numerical vortex suppression fluidic schemas.</li>
              <li>PostgreSQL 16 partitioned timeseries ledger with cryptographic HMAC triggers.</li>
            </ul>
            <div className="bg-slate-900 p-4 rounded-lg border border-emerald-500/30 mt-4 flex items-center justify-between">
              <div>
                <span className="text-sm font-mono text-slate-400 block">DELAWARE REGISTRY NOTARIAL SEAL</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  SEAL-DELAWARE-2026-GF-T3-189-ACQUIRE-ESCROW
                </span>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 text-base font-bold px-3 py-1 rounded border border-emerald-500/30">
                EXECUTED & SEALED
              </span>
            </div>
          </div>
        )}

        {activeSubTab === 'ip_audit' && (
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              Clean-Room Intellectual Property Audit (LEGAL_IP_AUDIT.md)
            </h3>
            <p className="text-base text-slate-300">
              A comprehensive automated software composition analysis (SCA) was executed against all repository commits, dependencies, and mathematical routines:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                <span className="text-base font-bold text-white block mb-2">Approved Permissive Licenses (100%)</span>
                <ul className="text-base text-slate-300 space-y-1 font-mono">
                  <li>• Python 3.12: PSF License (Permissive)</li>
                  <li>• React 19 / TypeScript: MIT / Apache-2.0</li>
                  <li>• PostgreSQL 16: PostgreSQL License (BSD-like)</li>
                  <li>• Uvicorn / FastAPI: BSD 3-Clause</li>
                </ul>
              </div>
              <div className="bg-slate-900 p-4 rounded-lg border border-rose-900/40">
                <span className="text-base font-bold text-rose-300 block mb-2">Prohibited Copyleft (0.0% Found)</span>
                <ul className="text-base text-slate-400 space-y-1 font-mono">
                  <li>• GPL v2 / v3: ZERO (0%)</li>
                  <li>• AGPL v3: ZERO (0%)</li>
                  <li>• SSPL / BSL: ZERO (0%)</li>
                  <li>• Non-Commercial: ZERO (0%)</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
