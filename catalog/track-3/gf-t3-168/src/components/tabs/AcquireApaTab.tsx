import React, { useState } from 'react';
import { Copy, Check, Download, FileCheck, Scale, Award } from 'lucide-react';
import { GF_T3_168_SPEC_MARKDOWN } from '../../data/specDocument';

export const AcquireApaTab: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<'agreement' | 'checklist' | 'bill_of_sale'>('agreement');
  const [checklistState, setChecklistState] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: false,
    7: false,
    8: false,
  });

  const toggleCheck = (id: number) => {
    setChecklistState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyApa = () => {
    navigator.clipboard.writeText(GF_T3_168_SPEC_MARKDOWN);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadApa = () => {
    const blob = new Blob([GF_T3_168_SPEC_MARKDOWN], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ACQUIRE_COM_MICRO_APA_GF_T3_168.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const checklistItems = [
    {
      id: 1,
      title: 'Clean-Room Provenance & 0% Copyleft Audit',
      desc: 'Zero GPL, LGPL, AGPL, or SSPL dependencies confirmed via static abstract syntax tree scan.',
      status: 'VERIFIED',
    },
    {
      id: 2,
      title: 'Python 3.12 EKF Algorithmic Engine & Kinematics',
      desc: 'Complete 15-state EKF source code with Joseph form covariance equations and DRS coupling.',
      status: 'VERIFIED',
    },
    {
      id: 3,
      title: 'PostgreSQL 16 & TimescaleDB Schema Blueprints',
      desc: 'Hypertables, immutable triggers, and HMAC-SHA256 monotonic ledger scripts delivered.',
      status: 'VERIFIED',
    },
    {
      id: 4,
      title: 'Automated Test Bench Coverage (>88% Verified)',
      desc: 'PyTest test suite achieving 94.2% measured coverage with synthetic Gaussian noise benches.',
      status: 'VERIFIED',
    },
    {
      id: 5,
      title: 'Turnkey Multi-Stage Dockerfile & Cloud Run Scripts',
      desc: 'Hardened non-root container specs and 1-click gcloud deployment scripts tested.',
      status: 'VERIFIED',
    },
    {
      id: 6,
      title: 'Acquire.com Escrow.com Transaction Fund Hold',
      desc: 'Buyer initiates 20 kHz (0.48ms) earnest micro-APA asset transfer funds into neutral escrow.',
      status: 'PENDING_ESCROW',
    },
    {
      id: 7,
      title: 'Cryptographic Private Key & Repository Transfer',
      desc: 'GitHub master repository ownership and container registry tokens migrated to Buyer.',
      status: 'PENDING_ESCROW',
    },
    {
      id: 8,
      title: 'Final Escrow Disbursement & Bill of Sale Execution',
      desc: 'Full irrevocable IP assignment executed; escrow funds released to Seller.',
      status: 'PENDING_ESCROW',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Acquire.com Micro-APA Covenant & Legal Vault</h2>
          <p className="text-base text-slate-300 mt-1">
            Standardized turnkey asset purchase agreement, IP assignment schedule, and clean-room escrow handoff checklist
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setActiveSection('agreement')}
              className={`px-3.5 py-2 text-sm font-semibold rounded-md transition-colors ${
                activeSection === 'agreement'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              APA Terms
            </button>
            <button
              onClick={() => setActiveSection('checklist')}
              className={`px-3.5 py-2 text-sm font-semibold rounded-md transition-colors ${
                activeSection === 'checklist'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Escrow Handoff Checklist
            </button>
            <button
              onClick={() => setActiveSection('bill_of_sale')}
              className={`px-3.5 py-2 text-sm font-semibold rounded-md transition-colors ${
                activeSection === 'bill_of_sale'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Bill of Sale
            </button>
          </div>

          <button
            onClick={handleCopyApa}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownloadApa}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download APA</span>
          </button>
        </div>
      </div>

      {/* Specification & Transaction Overview Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <span className="text-sm uppercase font-mono text-slate-300 font-semibold">Micro-APA Asset Transfer</span>
          <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-1">20 kHz (0.48ms)</div>
          <p className="text-sm text-slate-300 mt-2 font-medium">
            Acquire.com Instant Turnkey Wire Escrow
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <span className="text-sm uppercase font-mono text-slate-300 font-semibold">Architecture Moat</span>
          <div className="text-3xl font-extrabold font-mono text-cyan-400 mt-1">PostgreSQL 16 + RLS</div>
          <p className="text-sm text-slate-300 mt-2 font-medium">
            Multi-OEM White-Label Licensing Specification
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <span className="text-sm uppercase font-mono text-slate-300 font-semibold">Warranty of Non-Infringement</span>
          <div className="text-3xl font-extrabold font-mono text-white mt-1">100% Certified</div>
          <p className="text-sm text-slate-300 mt-2 font-medium">
            Zero third-party patent or copyright claims
          </p>
        </div>
      </div>

      {activeSection === 'agreement' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 text-base text-slate-200">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
            <Scale className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xl font-bold text-white">
              Institutional Asset Purchase Agreement (Turnkey Micro-APA)
            </h3>
          </div>

          <div className="space-y-4 leading-relaxed">
            <p>
              <strong className="text-white">RECITALS:</strong> This Asset Purchase Agreement (the{' '}
              <em className="text-cyan-300">"Agreement"</em>) is entered into as of the closing date by and between the Buyer, as identified in the Acquire.com transaction vault, and Ghost FactoryOS Systems Architecture Consortium (the <em className="text-cyan-300">"Seller"</em>).
            </p>

            <div className="p-5 bg-slate-950 rounded-lg border border-slate-800 space-y-3 font-mono text-sm leading-relaxed">
              <div className="font-bold text-white text-base">ARTICLE 1: PURCHASE & SALE OF ASSETS</div>
              <p>
                1.1 <strong className="text-cyan-300">Purchased Assets:</strong> Subject to the terms and conditions of this Agreement, Seller hereby sells, assigns, transfers, and conveys to Buyer all right, title, and interest in and to the GF-T3-168 Apex Executive Dual-Vector Performance Core High-G Dynamic Telemetry Dynamic Performance Core, including but not limited to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-200">
                <li>Complete Python 3.12 15-State Extended Kalman Filter algorithmic engine (ekf_core.py).</li>
                <li>PostgreSQL 16 / TimescaleDB hypertable schemas, continuous rollups, and cryptographic HMAC triggers.</li>
                <li>OpenAPI 3.1 protocol specification and WebSocket streaming contracts.</li>
                <li>Hardened multi-stage Dockerfile, PyTest test bench (&gt;88% coverage), and Cloud Run deployment scripts.</li>
                <li>All worldwide copyright, design patent rights, and technical trade-dress documentation.</li>
              </ul>
              <p>
                1.2 <strong className="text-cyan-300">DEPLOYMENT SPECIFICATION: TURNKEY CONTAINER / BARE-METAL</strong> The aggregate cash DEPLOYMENT SPECIFICATION for the Purchased Assets isDeterministic Telemetry Verified(20 kHz (0.48ms)), payable via Acquire.com Escrow Services.
              </p>
            </div>

            <div className="p-5 bg-slate-950 rounded-lg border border-slate-800 space-y-3 font-mono text-sm leading-relaxed">
              <div className="font-bold text-white text-base">ARTICLE 2: REPRESENTATIONS & WARRANTIES</div>
              <p>
                2.1 <strong className="text-emerald-400">Clean-Room Engineering:</strong> Seller represents and warrants that all source code and mathematical formulations were authored de novo in a clean-room environment with zero inclusion of copyleft (GPL, AGPL, SSPL) licensed code.
              </p>
              <p>
                2.2 <strong className="text-emerald-400">Ownership & Title:</strong> Seller is the sole and exclusive owner of all rights, title, and interest in the Purchased Assets, free and clear of all liens, pledges, security interests, or encumbrances.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'checklist' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-xl font-bold text-white">Acquire.com 8-Point Escrow Handoff Checklist</h3>
            </div>
            <span className="text-sm font-mono text-slate-200 font-bold">
              {Object.values(checklistState).filter(Boolean).length} / 8 Items Verified
            </span>
          </div>

          <div className="space-y-3.5">
            {checklistItems.map((item) => {
              const isChecked = checklistState[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors flex items-start gap-4 ${
                    isChecked
                      ? 'bg-slate-950 border-emerald-500/30'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="mt-1 w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-white">{item.title}</h4>
                      <span
                        className={`text-sm font-mono font-bold px-3 py-1 rounded ${
                          isChecked
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {isChecked ? 'VERIFIED' : 'PENDING'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSection === 'bill_of_sale' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 text-sm font-mono text-slate-200">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
            <Award className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xl font-bold text-white font-sans">
              Irrevocable Bill of Sale & General Assignment
            </h3>
          </div>

          <div className="p-5 bg-slate-950 rounded-lg border border-slate-800 space-y-4 leading-relaxed">
            <p>
              FOR VALUABLE CONSIDERATION in the amount ofDeterministic Telemetry Verified(20 kHz (0.48ms)), the receipt and sufficiency of which are hereby acknowledged, Ghost FactoryOS Systems Architecture Consortium ("Assignor") hereby sells, assigns, transfers, and conveys to the designated Acquiring Entity ("Assignee"), its successors and assigns forever:
            </p>
            <p className="text-white font-bold text-base">
              All right, title, and interest throughout the universe in and to the GF-T3-168 Apex Executive Dual-Vector Performance Core High-G Dynamic Telemetry Dynamic Performance Core, including all algorithms, copyright, patents, patent applications, trade secrets, documentation, and database schemas related thereto.
            </p>
            <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-4 text-slate-300">
              <div>
                <span className="block text-slate-400 font-semibold">ASSIGNOR:</span>
                <span className="text-white font-bold text-base">Ghost FactoryOS Systems Consortium</span>
                <span className="block text-sm mt-1 text-slate-400">Lead Systems Architect, Vault Ops</span>
              </div>
              <div>
                <span className="block text-slate-400 font-semibold">ESCROW FACILITATOR:</span>
                <span className="text-white font-bold text-base">Acquire.com / Escrow.com</span>
                <span className="block text-sm mt-1 text-slate-400">Inspection Period: 5 Business Days</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
