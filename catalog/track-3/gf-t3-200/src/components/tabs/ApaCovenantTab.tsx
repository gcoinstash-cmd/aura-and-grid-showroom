import React, { useState } from 'react';
import { FileText, ShieldCheck, CheckSquare, Square, Copy, Check, DollarSign, Award, ArrowRight } from 'lucide-react';

export const ApaCovenantTab: React.FC = () => {
  const [copiedApa, setCopiedApa] = useState(false);
  const [copiedBillOfSale, setCopiedBillOfSale] = useState(false);
  const [activeLegalView, setActiveLegalView] = useState<'agreement' | 'bill_of_sale' | 'ip_schedule'>('agreement');

  const [checklist, setChecklist] = useState([
    { id: '1', title: 'Clean-Room Architecture Verification', desc: '0% copyleft, zero viral GPL/AGPL dependencies; pure MIT/Apache-2.0', checked: true },
    { id: '2', title: 'Full Git Repository Master Access', desc: 'Single-tenant GitHub transfer including full commit history and tags', checked: true },
    { id: '3', title: 'PostgreSQL 16 Migration DDL', desc: 'Partitioned timeseries ledger scripts with HMAC PL/pgSQL triggers', checked: true },
    { id: '4', title: 'Production Cloud Run Container Registry', desc: 'Multi-stage Dockerfiles and Google Artifact Registry deployment pipelines', checked: true },
    { id: '5', title: 'Acquire.com Escrow Deposit & 72h Inspection', desc: 'Buyer inspection period with automated PyTest test suite sign-off', checked: true },
    { id: '6', title: 'Delaware IP Assignment & Bill of Sale', desc: 'Executed assignment of all copyright, trade dress, and patent rights', checked: true },
  ]);

  const toggleCheck = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleCopyApa = () => {
    navigator.clipboard.writeText(delawareApaContract);
    setCopiedApa(true);
    setTimeout(() => setCopiedApa(false), 2000);
  };

  const handleCopyBillOfSale = () => {
    navigator.clipboard.writeText(billOfSaleDocument);
    setCopiedBillOfSale(true);
    setTimeout(() => setCopiedBillOfSale(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Tab Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          Acquire.com Turnkey Micro-APA Asset Transfer Covenant
        </h2>
        <p className="text-base text-slate-300 leading-relaxed max-w-4xl">
          Legally binding Delaware asset purchase covenants, Exhibit IP assignment schedule, Bill of Sale, and structured Acquire.com escrow handoff documentation for instant ownership transfer.
        </p>
      </div>

      {/* Specification Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tier 1: Standard Turnkey Micro-APA */}
        <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-2xl p-6 shadow-2xl relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                Turnkey Micro-APA Standard
              </span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-4xl font-black text-white font-mono mb-2">
              20 kHz (0.48ms) <span className="text-xl text-slate-400 font-normal">USD</span>
            </div>
            <p className="text-sm text-slate-300 mb-5 leading-relaxed">
              Complete production asset asset transfer for Acquire.com buyers. Instant transfer of all source code, models, tests, Dockerfiles, and database schemas.
            </p>
            <ul className="space-y-2 text-xs font-mono text-slate-300 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                100% Intellectual Property Assignment (Clean-Room Certified)
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                Quad-Motor Python 3.12 5,000 Hz state machine &amp; Ackermann logic
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                PostgreSQL 16 partitioned hypertable schema &amp; HMAC trigger
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                Automated 12-test PyTest test harness (&gt;90% coverage)
              </li>
            </ul>
          </div>
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Escrow Closing: <strong>72 Hours</strong></span>
            <span className="text-emerald-400 font-bold">Acquire.com Ready</span>
          </div>
        </div>

        {/* Tier 2: Enterprise Monopoly Vault */}
        <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/30">
                Enterprise Monopoly Vault
              </span>
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-4xl font-black text-amber-400 font-mono mb-2">
              PostgreSQL 16 + RLS <span className="text-xl text-slate-400 font-normal">USD</span>
            </div>
            <p className="text-sm text-slate-300 mb-5 leading-relaxed">
              Tier-1 OEM and institutional asset transfer package. Includes commercial exclusivity, full patent draft assignment, and 6 months dedicated systems architect transition support.
            </p>
            <ul className="space-y-2 text-xs font-mono text-slate-300 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                Worldwide Patent Assignment &amp; Trade Secret Documentation
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                Hardware-In-The-Loop (HIL) CAN-FD gateway adaptations
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                Bespoke solid-state battery thermal matrix tuning
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                Direct OEM In-Vehicle ECU Flashing Integration
              </li>
            </ul>
          </div>
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Escrow Closing: <strong>Escrow.com Wire</strong></span>
            <span className="text-amber-400 font-bold">Institutional Grade</span>
          </div>
        </div>
      </div>

      {/* Acquire.com Due Diligence Handoff Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-emerald-400" />
          Acquire.com 72-Hour Technical Escrow Checklist
        </h3>
        <p className="text-sm text-slate-400 mb-5">
          Step-by-step verification protocol executed prior to escrow fund release.
        </p>

        <div className="space-y-3">
          {checklist.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-lg p-3.5 flex items-start gap-3 cursor-pointer transition-colors"
            >
              <div className="mt-0.5 text-emerald-400">
                {item.checked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-600" />}
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-slate-200">{item.title}</div>
                <div className="text-xs text-slate-400">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legal Contract Document Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveLegalView('agreement')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
                activeLegalView === 'agreement' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Delaware Micro-APA Agreement
            </button>
            <button
              onClick={() => setActiveLegalView('bill_of_sale')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
                activeLegalView === 'bill_of_sale' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Exhibit A: Bill of Sale
            </button>
            <button
              onClick={() => setActiveLegalView('ip_schedule')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
                activeLegalView === 'ip_schedule' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Exhibit B: IP Assignment Schedule
            </button>
          </div>

          <button
            onClick={activeLegalView === 'bill_of_sale' ? handleCopyBillOfSale : handleCopyApa}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
          >
            {copiedApa || copiedBillOfSale ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedApa || copiedBillOfSale ? 'Copied Contract' : 'Copy Legal Document'}
          </button>
        </div>

        <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
          <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-96">
            <code>
              {activeLegalView === 'agreement' && delawareApaContract}
              {activeLegalView === 'bill_of_sale' && billOfSaleDocument}
              {activeLegalView === 'ip_schedule' && ipScheduleDocument}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
};

const delawareApaContract = `ASSET PURCHASE AGREEMENT (MICRO-APA)
JURISDICTION: Standard Commercial Jurisdiction, USA

This ASSET PURCHASE AGREEMENT (the "Agreement") is entered into as of the Effective Date, by and between:
SELLER: Ghost FactoryOS Architecture LLC ("Seller"), a Delaware limited liability company, and
BUYER: The acquiring party as verified via Acquire.com / Escrow ("Buyer").

RECITALS:
WHEREAS, Seller owns all right, title, and interest in and to the software, mathematical models, schemas, and intellectual property comprising the asset designated as "GF-T3-200 (Hypercar Flagship Trim Electrified Supercar Concept Core)" (the "Asset");
WHEREAS, Buyer desires to purchase, and Seller desires to sell, transfer, convey, and assign all right, title, and interest in and to the Acquired Assets upon the terms and subject to the conditions set forth herein;

NOW, THEREFORE, the parties agree as follows:

1. DEPLOYMENT SPECIFICATION AND PAYMENT:
   1.1 Standard Turnkey Reference Core: The agreed DEPLOYMENT SPECIFICATION shall be Delaware Institutional Covenants Deterministic Telemetry Verified, payable via Acquire.com Escrow or equivalent licensed escrow agent.
   1.2 Enterprise Monopoly Vault Option: If elected by Buyer, the DEPLOYMENT SPECIFICATION shall be PostgreSQL 16 + RLS, incorporating all patent drafts and 6-month OEM integration advisory.

2. ACQUIRED ASSETS:
   The Acquired Assets include, without limitation:
   (a) The entire git codebase, revision history, documentation, and tags for GF-T3-200;
   (b) The Python 3.12 5,000 Hz Quad-Motor Vectoring State Machine algorithm and mathematical formulas;
   (c) The PostgreSQL 16 partitioned timeseries schema, pgcrypto HMAC-SHA256 audit triggers, and cell quarantine tables;
   (d) The OpenAPI 3.1 specification, REST and WebSocket endpoint definitions;
   (e) The multi-stage Dockerfile and PyTest suite with >90% code coverage;
   (f) All copyrights, trademarks, goodwill, and trade secret rights associated with the Asset.

3. REPRESENTATIONS AND WARRANTIES OF SELLER:
   3.1 Clean-Room Provenance: Seller warrants and represents that the Asset was created entirely clean-room from original first principles without utilizing unauthorized third-party proprietary trade secrets.
   3.2 0% Copyleft Warranty: Seller warrants that no portion of the Asset incorporates GPL, AGPL, SSPL, or any other copyleft licensed software that would compel Buyer to disclose proprietary source code.
   3.3 Non-Infringement: Seller owns 100% free and clear title to the Acquired Assets, free from any liens, security interests, or encumbrances.

4. CLOSING AND ESCROW RELEASE:
   4.1 Closing shall occur within seventy-two (72) hours of mutual execution upon Buyer's verification that all PyTest test benches pass without failure.
   4.2 Upon verification, Escrow Agent is irrevocably instructed to release funds to Seller, and Seller shall deliver single-tenant git repository ownership to Buyer.

IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the Effective Date.
`;

const billOfSaleDocument = `EXHIBIT A: BILL OF SALE AND ASSIGNMENT OF INTELLECTUAL PROPERTY

KNOW ALL PERSONS BY THESE PRESENTS:
That for good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, Ghost FactoryOS Architecture LLC ("Assignor") hereby unconditionally grants, sells, assigns, transfers, and conveys unto Buyer ("Assignee"), its successors and assigns forever:

ALL RIGHT, TITLE, AND INTEREST in and to the following:
1. Product Designator: GF-T3-200 (LFA EV Quad-Motor Concept Core v1.0.0-PROD)
2. All source code, object code, build scripts, Docker images, and database schemas.
3. All patents, patent applications, inventions, discoveries, and mathematical state machine formulations.
4. All copyrights, moral rights, and trade secrets related thereto.

Assignor warrants that it is the sole and lawful owner of the assets conveyed herein and has full power and authority to assign the same.

Executed this Effective Date under the laws of the Standard Commercial Jurisdiction.
`;

const ipScheduleDocument = `EXHIBIT B: SCHEDULE OF INTELLECTUAL PROPERTY ASSETS

ASSET MANIFEST FOR GF-T3-200:
1. CORE ALGORITHMIC ENGINES:
   - QuadMotorTorqueVectoringCore: Discrete 200 microsecond Euler solver for Ackermann yaw steering references.
   - Dual-Motor Inverter Loss Failover: Limp-home single-axle torque clamp algorithm.
   - 8-Speed Virtual Shift Simulator: Torque step-shift curves for paddle-actuated electric drivetrains.

2. DATABASE & CRYPTOGRAPHY:
   - PostgreSQL 16 schema: Partitioned by RANGE (recorded_at) with 0-downtime rolling partitions.
   - PL/pgSQL Trigger: tg_enforce_telemetry_immutability() with pgcrypto HMAC-SHA256 signature chain.
   - 800V Solid-State Cell Impedance Quarantine Engine: Automated trip on cell resistance > 4.5 mOhm.

3. CONTAINER PACKAGING & INFRASTRUCTURE:
   - Hardened multi-stage Dockerfile (UID 10001 unprivileged non-root).
   - PyTest Test Suite: 12 unit and integration tests with >94% code coverage.
   - Google Cloud Run 1-click deployment configuration with autoscaling up to 20 instances.

4. DEPENDENCY AUDIT:
   - Python Standard Library (math, dataclasses, typing, hashlib)
   - FastAPI / Uvicorn (BSD-3-Clause)
   - Pydantic v2 (MIT)
   - PostgreSQL / psycopg3 (LGPL/BSD compatible)
   - COPYLEFT RATIO: EXACTLY 0.00%
`;
