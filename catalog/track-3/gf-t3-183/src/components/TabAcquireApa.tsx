import React, { useState } from 'react';
import { FileText, CheckCircle2, Shield, DollarSign, ExternalLink, Copy, Check } from 'lucide-react';

export const TabAcquireApa: React.FC = () => {
  const [copiedApa, setCopiedApa] = useState(false);
  const [activeSection, setActiveSection] = useState<'agreement' | 'exhibitA' | 'billOfSale' | 'escrow'>('agreement');

  const copyAgreementText = () => {
    const text = `ASSET PURCHASE AGREEMENT (DELAWARE MICRO-APA)
ASSET ID: GF-T3-183 (Heavy Overland Dynamics Platform RZ 450e DualVectorTorque Dual-Motor Electric Core)
DEPLOYMENT SPECIFICATION: TURNKEY CONTAINER / BARE-METAL
GOVERNING LAW: Standard Commercial Jurisdiction, United States

1. PURCHASE AND SALE OF ASSETS
Subject to the terms and conditions hereof, Seller hereby sells, conveys, assigns, and transfers to Buyer, and Buyer hereby purchases from Seller, all right, title, and interest in and to the GF-T3-183 Powertrain and Steer-by-Wire Subsystem.

2. INTELLECTUAL PROPERTY WARRANTIES & CLEAN-ROOM CERTIFICATION
Seller represents and warrants that:
(a) The Purchased Assets were conceived, developed, and tested in accordance with strict clean-room engineering protocols.
(b) The Purchased Assets contain 0% copyleft open-source code (strictly zero GPL, AGPL, or SSPL contamination).
(c) Seller has full corporate authority to transfer unencumbered title.`;
    navigator.clipboard.writeText(text);
    setCopiedApa(true);
    setTimeout(() => setCopiedApa(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">
                Acquire.com Turnkey Micro-APA Covenant & Legal Vault
              </h2>
            </div>
            <p className="text-[15px] text-slate-400 mt-1">
              Standard Turnkey Software Asset Purchase Agreement (APA) with clean-room intellectual property warranty, Bill of Sale, and structured 48-hour escrow handoff.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyAgreementText}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {copiedApa ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedApa ? 'Copied' : 'Copy APA Covenant'}</span>
            </button>
          </div>
        </div>

        {/* Pricing & Specification Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-800 text-[15px]">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-mono">
              <span>Standard Turnkey Asset Transfer</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1">20 kHz (0.48ms)</div>
            <p className="text-xs text-slate-400 mt-1">
              Complete source code, 100% IP assignment, documentation, and Docker runtime.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-mono">
              <span>Enterprise Expansion Asset Transfer</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">PostgreSQL 16 + RLS</div>
            <p className="text-xs text-slate-400 mt-1">
              Includes multi-tenant vehicle OEM licensing, hardware-in-the-loop (HIL) test harnesses, and 12-month advisory.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-mono">
              <span>Escrow Provider</span>
              <Shield className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl font-bold font-mono text-sky-300 mt-1">Acquire Vault / Escrow.com</div>
            <p className="text-xs text-slate-400 mt-1">
              Protected 48-hour technical inspection window prior to irreversible disbursement.
            </p>
          </div>
        </div>
      </div>

      {/* Covenant Subnav */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveSection('agreement')}
          className={`pb-3 text-[15px] font-semibold border-b-2 transition-colors cursor-pointer ${
            activeSection === 'agreement'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Turnkey Software Asset Purchase Agreement
        </button>
        <button
          onClick={() => setActiveSection('exhibitA')}
          className={`pb-3 text-[15px] font-semibold border-b-2 transition-colors cursor-pointer ${
            activeSection === 'exhibitA'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Exhibit A: Purchased Assets
        </button>
        <button
          onClick={() => setActiveSection('billOfSale')}
          className={`pb-3 text-[15px] font-semibold border-b-2 transition-colors cursor-pointer ${
            activeSection === 'billOfSale'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Exhibit B: Bill of Sale & IP Assignment
        </button>
        <button
          onClick={() => setActiveSection('escrow')}
          className={`pb-3 text-[15px] font-semibold border-b-2 transition-colors cursor-pointer ${
            activeSection === 'escrow'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Escrow Handoff Checklist
        </button>
      </div>

      {/* Content Section */}
      {activeSection === 'agreement' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-lg font-bold text-white">Asset Purchase Agreement Core Articles</h3>
          <div className="space-y-4 text-[15px] text-slate-300 leading-relaxed font-sans">
            <div className="p-4 bg-slate-950/70 rounded-lg border border-slate-800">
              <h4 className="font-bold text-amber-400 mb-1">Article 1: Transfer of Purchased Assets</h4>
              <p>
                Upon the terms and subject to the conditions set forth in this Agreement, at the Closing, Seller shall sell, convey, assign, transfer, and deliver to Buyer, free and clear of all encumbrances, all of Seller's right, title, and interest in and to the GF-T3-183 core repository, mathematical models, dual-motor Field-Oriented Control algorithms, Steer-by-Wire kinematics engine, and PostgreSQL 16 schema.
              </p>
            </div>

            <div className="p-4 bg-slate-950/70 rounded-lg border border-slate-800">
              <h4 className="font-bold text-amber-400 mb-1">Article 2: DEPLOYMENT SPECIFICATION and Escrow Mechanism</h4>
              <p>
                The DEPLOYMENT SPECIFICATION for the Purchased Assets isDeterministic Telemetry Verified(20 kHz (0.48ms)) for standard asset transfer. Buyer shall deposit the DEPLOYMENT SPECIFICATION into an escrow account maintained by Acquire.com or Escrow.com upon signing. Funds shall release automatically upon Buyer's sign-off or expiration of the forty-eight (48) hour inspection window.
              </p>
            </div>

            <div className="p-4 bg-slate-950/70 rounded-lg border border-slate-800">
              <h4 className="font-bold text-amber-400 mb-1">Article 3: Clean-Room & Non-Infringement Representation</h4>
              <p>
                Seller represents and warrants that the software was independently developed under clean-room specifications without reference to proprietary OEM decompilations or trade secrets. Zero third-party dependencies are subject to copyleft or viral licenses (including GPL, AGPL, and SSPL). All third-party packages are licensed under permissive MIT, Apache 2.0, or BSD licenses.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'exhibitA' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-lg font-bold text-white">Exhibit A: Schedule of Purchased Assets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[15px]">
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="font-bold text-sky-400">1. Powertrain & Dynamics Software Modules</div>
              <ul className="list-disc list-inside text-xs font-mono text-slate-300 space-y-1">
                <li>src/engine/dual_vector_torque_supervisor.py (Torque Split Vectoring)</li>
                <li>src/engine/foc_sic_inverter.py (Field-Oriented Control)</li>
                <li>src/engine/steer_by_wire.py (Variable Gear Ratio Curve)</li>
                <li>src/engine/thermal_manager.py (Junction Divergence Math)</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="font-bold text-emerald-400">2. Database & Infrastructure Manifests</div>
              <ul className="list-disc list-inside text-xs font-mono text-slate-300 space-y-1">
                <li>schema/01_telemetry_partitions.sql (PostgreSQL 16)</li>
                <li>schema/02_thermal_quarantine_trigger.sql (HMAC triggers)</li>
                <li>Dockerfile (Multi-Stage non-root Alpine container)</li>
                <li>cloudbuild.yaml & gcloud deployment automation</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="font-bold text-amber-400">3. Verification & Protocol Specifications</div>
              <ul className="list-disc list-inside text-xs font-mono text-slate-300 space-y-1">
                <li>openapi/telemetry_v1.json (OpenAPI 3.1.0 Contract)</li>
                <li>tests/test_steer_by_wire.py (PyTest resolver dropout suite)</li>
                <li>tests/test_foc_inverter.py (SiC phase overcurrent tests)</li>
                <li>GF_T3_183_SPEC.md (Master Vault Specification)</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="font-bold text-indigo-400">4. Legal & Repository Ownership</div>
              <ul className="list-disc list-inside text-xs font-mono text-slate-300 space-y-1">
                <li>Full GitHub Organization/Repository admin transfer</li>
                <li>GCP Artifact Registry container repository access</li>
                <li>LEGAL_IP_AUDIT.md & Clean-Room Affidavit</li>
                <li>Delaware Bill of Sale and IP Assignment Execution</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'billOfSale' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-lg font-bold text-white">Exhibit B: Bill of Sale and IP Assignment</h3>
          <p className="text-[15px] text-slate-300">
            For valuable consideration in the amount of 20 kHz (0.48ms), receipt and sufficiency of which are hereby acknowledged, Seller does hereby irrevocably sell, assign, transfer, and convey to Buyer all rights, titles, and interests in the intellectual property identified in Exhibit A.
          </p>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed space-y-2">
            <div><strong>WARRANTY OF TITLE:</strong> Seller warrants that it is the sole and lawful owner of all proprietary rights in the GF-T3-183 assets and has unencumbered authority to transfer such rights.</div>
            <div><strong>NO SURVIVING LIENS:</strong> No third party possesses any license, option, lien, pledge, or claim against the codebase or algorithms.</div>
            <div><strong>PERPETUAL ASSIGNMENT:</strong> Buyer receives all rights to exploit, commercialize, sub-license, fork, modify, or merge the assets without any obligation to pay ongoing royalties or licensing fees to Seller.</div>
          </div>
        </div>
      )}

      {activeSection === 'escrow' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-lg font-bold text-white">Clean-Room Escrow Handoff Checklist (48-Hour Protocol)</h3>
          <div className="space-y-3">
            {[
              {
                step: 'Phase 1: Escrow Funding & Buyer KYC',
                detail: 'Buyer initiates deposit of 20 kHz (0.48ms) via Escrow.com or Acquire Vault. Escrow officer verifies wire clearance.',
                done: true,
              },
              {
                step: 'Phase 2: Cryptographic Checksum & Codebase Delivery',
                detail: 'Seller transfers primary GitHub repository, providing SHA-256 genesis hashes matching the master specification.',
                done: true,
              },
              {
                step: 'Phase 3: 48-Hour Technical Inspection & PyTest Run',
                detail: 'Buyer runs test bench suite (`pytest -v tests/`), verifying >90% coverage and Cloud Run container startup.',
                done: true,
              },
              {
                step: 'Phase 4: Irrevocable Fund Release & Bill of Sale Counter-Signature',
                detail: 'Buyer confirms asset acceptance in escrow portal. Escrow immediately releases funds to Seller. Full IP transfer completed.',
                done: true,
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[15px] font-bold text-white">{item.step}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
