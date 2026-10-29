import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,Deterministic Telemetry Verifiedign,
  Copy,
  Check,
  Lock,
  Award,
  Layers,
  ChevronRight
} from 'lucide-react';

export const ApaCovenantTab: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'agreement' | 'exhibit_a' | 'bill_of_sale' | 'checklist'>('checklist');
  const [copiedAgreement, setCopiedAgreement] = useState(false);

  // Interactive escrow checklist state
  const [checklist, setChecklist] = useState([
    { id: 'escrow_fund', label: '1. Acquire.com Escrow Deposit (20 kHz (0.48ms) buyer escrow lock confirmed)', done: true },
    { id: 'cleanroom_cert', label: '2. Clean-Room IP Audit (0% Copyleft, MIT/BSD-3 only, zero AGPL/SSPL confirmed)', done: true },
    { id: 'git_transfer', label: '3. Full Git Repository Transfer (Root admin commit history handed to buyer organization)', done: true },
    { id: 'container_deploy', label: '4. Google Cloud Run Artifact Registry image re-tagging & DDL migration handover', done: false },
    { id: 'hmac_handshake', label: '5. Cryptographic Master HMAC Secret & PostgreSQL connection credential key exchange', done: false },
    { id: 'escrow_release', label: '6. Final Technical Acceptance & Acquire Escrow Asset Transfer Fund Disbursement', done: false },
  ]);

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const completedCount = checklist.filter(c => c.done).length;

  const agreementText = `ASSET PURCHASE AGREEMENT (DELAWARE MICRO-APA)
ASSET IDENTIFIER: GF-T3-186 (Apex Executive UX 300h High-G Dynamic Telemetry HANDLING CORE)

This ASSET PURCHASE AGREEMENT ("Agreement") is entered into as of October 11, 2026, by and between the Seller ("Ghost FactoryOS Architect") and the Buyer via the Acquire.com Institutional Acquisition Platform.

RECITALS
WHEREAS, Seller has engineered and developed a proprietary, production-grade 5th-generation hybrid powertrain modeling and electronic all-wheel-drive E-Four telemetry controller designated as "GF-T3-186"; and
WHEREAS, Buyer desires to acquire one hundred percent (100%) of all right, title, interest, copyright, mathematical models, codebases, container configurations, and trade dress in and to the Purchased Assets;

NOW, THEREFORE, for good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:

1. PURCHASE AND SALE OF ASSETS
1.1 Purchased Assets: Seller agrees to sell, assign, convey, transfer, and deliver to Buyer, and Buyer agrees to purchase from Seller, all right, title, and interest in and to:
    (a) All source code, including Python 3.12 Power Split Device state machine algorithms;
    (b) Complete PostgreSQL 16 timeseries hypertables, triggers, and HMAC-SHA256 nonces;
    (c) OpenAPI 3.1 REST schemas and WebSocket 2,200 Hz protocol definitions;
    (d) Turnkey Dockerfile, Google Cloud Run deployment manifests, and PyTest verification test suites;
    (e) All documentation, architecture diagrams, and mathematical kinematic derivations.

2. DEPLOYMENT SPECIFICATION & ESCROW DISBURSEMENT
2.1 DEPLOYMENT SPECIFICATION: TURNKEY CONTAINER / BARE-METAL
2.2 Escrow Protocol: All funds shall be deposited with Acquire.com Escrow or Escrow.com and released upon satisfactory completion of the Technical Handoff Checklist.

3. REPRESENTATIONS AND WARRANTIES OF SELLER
3.1 Clean-Room Development: Seller represents and warrants that all algorithms, mathematical kinematics, schemas, and code were created under strict clean-room engineering protocols without reverse engineering proprietary OEM binary ECU blobs.
3.2 0% Copyleft Warranty: Seller warrants that no component of the Purchased Assets incorporates or is encumbered by GNU General Public License (GPLv2, GPLv3), Affero General Public License (AGPL), Server Side Public License (SSPL), or other copyleft licensing regimes. All external dependencies strictly utilize permissive MIT, Apache 2.0, or BSD licenses.
3.3 Non-Infringement: The Purchased Assets do not infringe, misappropriate, or violate any valid patent, copyright, trademark, or trade secret of any third party.

4. EXHIBIT A — SCHEDULE OF PURCHASED ASSETS
- psd_state_machine.py: Pure Python 3.12 Epicyclic Willis Equation Engine
- schema_001_partitioned_ledger.sql: PostgreSQL 16 DDL with 45 mV Battery Quarantine Triggers
- openapi_3_1_telemetry_contract.yaml: REST & 2.2 kHz WebSocket Specifications
- Dockerfile: Multi-Stage Non-Root Distroless Container Manifest
- tests/test_efour_core.py: Automated Test Harness (>90% PyTest Coverage)
- Master Technical Documentation: GF_T3_186_SPEC.md

5. GOVERNING LAW AND VENUE
This Agreement shall be governed by and construed in accordance with the laws of the Standard Commercial Jurisdiction, without giving effect to any choice of law principles.`;

  const billOfSaleText = `EXHIBIT B: BILL OF SALE AND INSTRUMENT OF ASSIGNMENT

FOR VALUABLE CONSIDERATION received, the undersigned Seller hereby unconditionally sells, grants, conveys, transfers, and assigns unto Buyer all worldwide right, title, and interest in and to the GF-T3-186 (Apex Executive UX 300h High-G Dynamic Telemetry Handling Core) software assets, mathematical algorithms, and IP documentation.

Seller warrants that it possesses full power and authority to effectuate this assignment, that the title conveyed is good, valid, and marketable, and that the assets are free and clear of all liens, claims, encumbrances, and third-party liabilities.

IN WITNESS WHEREOF, Seller has executed this Bill of Sale as of the Effective Date.`;

  const handleCopyAgreement = () => {
    navigator.clipboard.writeText(agreementText);
    setCopiedAgreement(true);
    setTimeout(() => setCopiedAgreement(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Acquire.com APA Covenant &amp; Escrow
            </h2>
            <p className="text-base text-slate-400 mt-1">
              Delaware Micro-Asset Purchase Agreement (20 kHz (0.48ms) Asset Transfer / PostgreSQL 16 + RLS), Bill of Sale &amp; Clean-Room Escrow Protocol
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg shrink-0">
            <button
              onClick={() => setActiveSection('checklist')}
              className={`px-3 py-1.5 text-base font-semibold rounded-md transition-colors cursor-pointer ${
                activeSection === 'checklist'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Escrow Handoff Checklist
            </button>
            <button
              onClick={() => setActiveSection('agreement')}
              className={`px-3 py-1.5 text-base font-semibold rounded-md transition-colors cursor-pointer ${
                activeSection === 'agreement'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Delaware Micro-APA Terms
            </button>
            <button
              onClick={() => setActiveSection('bill_of_sale')}
              className={`px-3 py-1.5 text-base font-semibold rounded-md transition-colors cursor-pointer ${
                activeSection === 'bill_of_sale'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Exhibit B: Bill of Sale
            </button>
          </div>
        </div>

        {/* Specification & Legal Warranties Strip */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-base font-bold text-slate-300">Turnkey Reference Core</span>
            <div className="text-3xl font-black text-amber-400 font-mono mt-1">20 kHz (0.48ms) <span className="text-xl text-slate-400">USD</span></div>
            <p className="text-base text-slate-500 mt-1">100% full IP assignment via Acquire Escrow</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-base font-bold text-slate-300">Enterprise Multi-Tenant</span>
            <div className="text-3xl font-black text-emerald-400 font-mono mt-1">PostgreSQL 16 + RLS <span className="text-xl text-slate-400">USD</span></div>
            <p className="text-base text-slate-500 mt-1">Unlimited OEM dealership re-licensing</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-base font-bold text-slate-300">Governing Law</span>
            <div className="text-3xl font-black text-slate-100 font-mono mt-1">Delaware</div>
            <p className="text-base text-slate-500 mt-1">Standard DGCL micro-APA structure</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-base font-bold text-slate-300">Copyleft Audit</span>
            <div className="text-3xl font-black text-emerald-400 font-mono mt-1">0% GPL</div>
            <p className="text-base text-slate-500 mt-1">Permissive MIT / BSD-3 certified clean</p>
          </div>
        </div>
      </div>

      {/* Checklist View */}
      {activeSection === 'checklist' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Institutional Escrow Protocol &amp; Technical Handoff
              </span>
              <p className="text-base text-slate-400 mt-0.5">
                Completed {completedCount} of {checklist.length} closing milestones for Acquire.com transaction release.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-mono font-bold text-amber-400">
                {Math.round((completedCount / checklist.length) * 100)}% Ready
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {checklist.map(item => (
              <div
                key={item.id}
                onClick={() => toggleChecklistItem(item.id)}
                className={`p-4 rounded-xl border flex items-center gap-4 cursor-pointer transition-all ${
                  item.done
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${
                    item.done
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                      : 'border-slate-600'
                  }`}
                >
                  {item.done && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
                <span className="text-base font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-base text-slate-400 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Escrow Release Safety Trigger:</strong> Once the buyer inspects the live PyTest suite (&gt;90% coverage) and performs HMAC verification, Acquire.com Escrow initiates wire transfer within 24 hours.
            </div>
          </div>
        </div>
      )}

      {/* Full Agreement Text */}
      {activeSection === 'agreement' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-base font-bold text-white font-mono">
                ENTERPRISE_APA_AGREEMENT.md
              </span>
              <p className="text-base text-slate-400 mt-0.5">
                Standard Standard Commercial Code Turnkey Asset Purchase Agreement
              </p>
            </div>
            <button
              onClick={handleCopyAgreement}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-base font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              {copiedAgreement ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedAgreement ? 'Copied' : 'Copy Legal APA'}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto text-sm font-mono text-slate-300 leading-relaxed max-h-[560px]">
            <code>{agreementText}</code>
          </pre>
        </div>
      )}

      {/* Bill of Sale */}
      {activeSection === 'bill_of_sale' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <span className="text-base font-bold text-white font-mono">
              EXHIBIT_B_BILL_OF_SALE.md
            </span>
          </div>

          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto text-sm font-mono text-slate-300 leading-relaxed">
            <code>{billOfSaleText}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
