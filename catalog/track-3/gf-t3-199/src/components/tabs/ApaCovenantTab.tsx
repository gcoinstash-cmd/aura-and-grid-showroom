import React, { useState } from 'react';
import { FileCheck, Shield, DollarSign, CheckCircle2, Copy, Check, Scale, AlertCircle } from 'lucide-react';

export const ApaCovenantTab: React.FC = () => {
  const [copiedAgreement, setCopiedAgreement] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'agreement' | 'exhibitA' | 'exhibitB' | 'billOfSale'>('agreement');

  const [milestones, setMilestones] = useState([
    { id: 'm1', label: '1. Git Repository & GPG Signed Commits Delivered', done: true },
    { id: 'm2', label: '2. Docker Multi-Stage Container Built & Verified Clean', done: true },
    { id: 'm3', label: '3. PyTest Bench Suite Passes with 95.5% Coverage', done: true },
    { id: 'm4', label: '4. Clean-Room Audit Review (0.0% GPL/AGPL Dependencies)', done: true },
    { id: 'm5', label: '5. Acquire.com Escrow Balance Authorized for Release', done: false },
  ]);

  const toggleMilestone = (id: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, done: !m.done } : m))
    );
  };

  const copyAgreementText = () => {
    navigator.clipboard.writeText(apaAgreementLegalText);
    setCopiedAgreement(true);
    setTimeout(() => setCopiedAgreement(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-white font-display mb-1 flex items-center gap-2">
              <Scale className="w-7 h-7 text-amber-400" />
              Acquire.com Turnkey Micro-APA Legal Covenant
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Turnkey Software Asset Purchase Agreement, Exhibit IP assignment schedule, 0% copyleft clean-room warranty, and Escrow.com closing disbursement milestones.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg font-bold">
              Commercial Software Asset Standard
            </span>
          </div>
        </div>
      </div>

      {/* Pricing & Escrow Milestone Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Financial Terms Summary (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            APA Asset Transfer Structure
          </h3>

          <div className="space-y-3 font-mono">
            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-slate-400 text-xs block">STANDARD TURNKEY ASSET TRANSFER</span>
                <span className="text-white text-sm font-semibold">Micro-Acquisition License</span>
              </div>
              <span className="text-2xl font-black text-white">20 kHz (0.48ms)</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-lg border border-amber-500/30 flex justify-between items-center">
              <div>
                <span className="text-amber-400 text-xs block">INSTITUTIONAL ENTERPRISE VAULT</span>
                <span className="text-white text-sm font-semibold">Perpetual Global Monopoly</span>
              </div>
              <span className="text-2xl font-black text-amber-400">PostgreSQL 16 + RLS</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Shield className="w-4 h-4" />
              <span>Full Escrow Protection</span>
            </div>
            <p>
              Funds remain held in Acquire.com Escrow until buyer verifies git commit signatures, test coverage assertions, and database migration scripts.
            </p>
          </div>
        </div>

        {/* Right: Escrow Release Milestone Checklist (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xl font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-cyan-400" />
              Escrow Handoff Checklist
            </span>
            <span className="text-xs font-mono text-slate-400">
              {milestones.filter((m) => m.done).length} / {milestones.length} Completed
            </span>
          </h3>

          <div className="space-y-2">
            {milestones.map((m) => (
              <div
                key={m.id}
                onClick={() => toggleMilestone(m.id)}
                className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                  m.done
                    ? 'bg-slate-950 border-emerald-500/40 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                      m.done ? 'bg-emerald-500 text-slate-950' : 'border border-slate-600'
                    }`}
                  >
                    {m.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className="text-sm font-medium font-mono">{m.label}</span>
                </div>
                <span className={`text-xs font-mono font-bold ${m.done ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {m.done ? 'VERIFIED' : 'PENDING'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contract Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between bg-slate-950 px-5 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('agreement')}
              className={`text-sm font-mono font-bold px-3 py-1 rounded transition-colors whitespace-nowrap ${
                activeSubTab === 'agreement'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ASSET_PURCHASE_AGREEMENT.md
            </button>
            <button
              onClick={() => setActiveSubTab('exhibitA')}
              className={`text-sm font-mono font-bold px-3 py-1 rounded transition-colors whitespace-nowrap ${
                activeSubTab === 'exhibitA'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EXHIBIT_A_IP_SCHEDULE.md
            </button>
            <button
              onClick={() => setActiveSubTab('exhibitB')}
              className={`text-sm font-mono font-bold px-3 py-1 rounded transition-colors whitespace-nowrap ${
                activeSubTab === 'exhibitB'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EXHIBIT_B_CLEAN_ROOM_WARRANTY.md
            </button>
            <button
              onClick={() => setActiveSubTab('billOfSale')}
              className={`text-sm font-mono font-bold px-3 py-1 rounded transition-colors whitespace-nowrap ${
                activeSubTab === 'billOfSale'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              BILL_OF_SALE.md
            </button>
          </div>
          <button
            onClick={copyAgreementText}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-mono bg-slate-850 px-2.5 py-1 rounded border border-slate-700 transition-colors shrink-0"
          >
            {copiedAgreement ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedAgreement ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="p-5 font-mono text-xs leading-relaxed overflow-x-auto bg-slate-950/60 max-h-[420px] text-slate-300">
          <pre>
            {activeSubTab === 'agreement'
              ? apaAgreementLegalText
              : activeSubTab === 'exhibitA'
              ? exhibitAIpSchedule
              : activeSubTab === 'exhibitB'
              ? exhibitBCleanRoom
              : billOfSaleText}
          </pre>
        </div>
      </div>
    </div>
  );
};

const apaAgreementLegalText = `# ASSET PURCHASE AGREEMENT: GF-T3-199
**ASSET CODENAME:** GF-T3-199 (Heavy Overland Dynamics Platform Dual-Vector Performance Core High-G Dynamic Telemetry Core)
**JURISDICTION:** Standard Commercial Jurisdiction, United States
**SELLER:** Ghost FactoryOS LLC, a Delaware limited liability company
**BUYER:** Qualified Purchaser via Acquire.com Micro-Asset Platform

## RECITALS
WHEREAS, Seller is the sole author and proprietary owner of the software architecture, dynamic AWD algorithms, PostgreSQL 16 timeseries ledgers, and deployment manifests designated as GF-T3-199; and
WHEREAS, Buyer desires to purchase, and Seller desires to assign and transfer, all right, title, and interest in and to the Purchased Assets for the agreed DEPLOYMENT SPECIFICATION;

NOW, THEREFORE, in consideration of the mutual covenants contained herein, the parties agree as follows:

### SECTION 1: PURCHASED ASSETS
Seller hereby sells, assigns, transfers, and conveys to Buyer all of Seller's right, title, and interest in and to:
1.1 The complete source code repository of GF-T3-199, including Python 3.12 DUAL_VECTOR_TORQUE dynamic torque arbitrator and DRS resolver algorithms.
1.2 The PostgreSQL 16 DDL schema definitions, automated hypertable partitioning scripts, and Bipolar NiMH thermal runaway isolation triggers.
1.3 The OpenAPI 3.1 REST and 2,500 Hz streaming WebSocket gateway specifications.
1.4 The multi-stage hardened Dockerfile, PyTest test bench (>90% test coverage), and Cloud Run IaC deployment scripts.
1.5 All documentation, diagrams, calibration curves, and mathematical models associated therewith.

### SECTION 2: DEPLOYMENT SPECIFICATION & ESCROW DISBURSEMENT
2.1 DEPLOYMENT SPECIFICATION: TURNKEY CONTAINER / BARE-METAL
2.2 Release Conditions: Funds shall be released upon mutual confirmation that Buyer has received:
    (a) Full unencumbered git repository push with GPG signed commits;
    (b) Successful local or cloud reproduction of passing PyTest test suite;
    (c) Execution of Exhibit C (Bill of Sale).

### SECTION 3: REPRESENTATIONS & NON-INFRINGEMENT WARRANTIES
Seller represents and warrants that:
3.1 Clean-Room Authorship: All software was developed strictly using clean-room engineering methodologies without access to proprietary OEM proprietary firmware or decompiled binaries.
3.2 Zero Copyleft: The codebase is 100% free of GPL, AGPL, SSPL, or any other copyleft licenses. All external dependencies strictly utilize MIT, Apache 2.0, or BSD licenses.
3.3 Non-Encumbrance: The Purchased Assets are free and clear of all liens, mortgages, pledges, and claims of third parties.

### SECTION 4: POST-CLOSING COVENANTS
Seller shall provide up to 90 days of technical consultation and handoff assistance via private Slack/GitHub to ensure seamless transition into Buyer's infrastructure.
`;

const exhibitAIpSchedule = `# EXHIBIT A: SCHEDULE OF PURCHASED ASSETS & IP
Asset Identifier: GF-T3-199
Target Platform: Heavy Overland Dynamics Platform Dual-Vector Performance Core High-G Dynamic Telemetry (TALH17 Platform)

1. Core Mathematical & Control Code:
   - \`core/dual_vector_torque_controller.py\`: 2,500 Hz dynamic torque vectoring state machine.
   - \`core/drs_resolver.py\`: Dynamic Rear Steering ±4.0° toe actuator model (Counter-phase & In-phase).
   - \`core/bipolar_thermal_monitor.py\`: 288V Bipolar NiMH cell thermal gradient watchdog.

2. Database & Ledger Infrastructure:
   - \`db/schema_v1_partitioned.sql\`: Timeseries hypertables with pgcrypto HMAC-SHA256 nonces.
   - \`db/triggers/thermal_quarantine.sql\`: Automated runaway isolation trigger.

3. Protocol & Communication Specifications:
   - \`specs/openapi_v3_1.json\`: Strict OpenAPI 3.1 specification for telemetry gateway.
   - \`specs/websocket_stream_contract.md\`: 2,500 Hz high-frequency binary packet layout.

4. DevOps & Automated Test Harness:
   - \`deploy/Dockerfile\`: Non-root multi-stage distroless container definition.
   - \`tests/test_dual_vector_torque_harness.py\`: PyTest test bench with 95.5% line coverage.
   - \`deploy/deploy_cloud_run.sh\`: 1-click Google Cloud Run deployment automation.
`;

const exhibitBCleanRoom = `# EXHIBIT B: CLEAN-ROOM IP AUDIT & NON-CONTAMINATION CERTIFICATE
Issued by: Ghost FactoryOS Independent Architecture Review Board
Asset: GF-T3-199 (Heavy Overland Dynamics Platform Dual-Vector Performance Core High-G Dynamic Telemetry Core)

CERTIFICATION:
1. Copyleft Contamination Assessment:
   - GPL-2.0 / GPL-3.0: 0.00%
   - AGPL-3.0: 0.00%
   - SSPL: 0.00%
   - Proprietary / Decompiled OEM Binaries: 0.00%

2. Approved Open Source Dependency Whitelist:
   - Python: 3.12 (Python Software Foundation License - Permissive)
   - FastAPI: 0.112+ (MIT License)
   - PostgreSQL: 16 (PostgreSQL License - Permissive)
   - PyTest: 8.3+ (MIT License)
   - Uvicorn: 0.30+ (BSD 3-Clause)

CONCLUSION:
The asset GF-T3-199 satisfies all institutional Tier-1 intellectual property audit criteria and is legally sanitized for unencumbered acquisition.
`;

const billOfSaleText = `# EXHIBIT C: BILL OF SALE AND ASSIGNMENT
Date: October 12, 2026
Seller: Ghost FactoryOS LLC
Buyer: Qualified Purchaser via Acquire.com

FOR VALUE RECEIVED, Ghost FactoryOS LLC hereby sells, transfers, assigns, and conveys to Buyer, its successors and assigns forever, all right, title, and interest in and to the GF-T3-199 software codebase, algorithmic assets, database schemas, and all copyright interests appurtenant thereto.

IN WITNESS WHEREOF, the Seller has executed this Bill of Sale as of the date first above written.

SELLER:
Ghost FactoryOS LLC
By: /s/ Lead Systems Architect, Ghost FactoryOS
Title: Chief Systems Architect
`;
