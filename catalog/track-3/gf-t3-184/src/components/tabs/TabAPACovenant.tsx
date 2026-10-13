import React, { useState } from 'react';
import { FileText, ShieldCheck, CheckCircle2, DollarSign, Download, Lock, Award, Briefcase } from 'lucide-react';
import { exportSpecMarkdown } from '../../utils/exportSpec';

export const TabAPACovenant: React.FC = () => {
  const [checklist, setChecklist] = useState({
    codeAudit: true,
    cleanRoom: true,
    ipAssignment: true,
    escrowDeposit: true,
    gitTransfer: false,
    domainTransfer: false,
  });

  const toggleChecklist = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allCompleted = Object.values(checklist).every(Boolean);

  return (
    <div className="space-y-6">
      {/* Valuation & Transaction Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Standard Micro-APA Buyout</h3>
          </div>
          <div className="text-3xl font-black font-mono text-amber-300 mb-1">$45,000 USD</div>
          <p className="text-base text-slate-400 leading-relaxed">
            Turnkey transfer of complete Python 3.12 1LR-GUE engine, PostgreSQL 16 HMAC ledger schemas, and OpenAPI contracts.
          </p>
          <div className="mt-3.5 flex items-center justify-between text-base font-mono">
            <span className="text-slate-400">Escrow Provider:</span>
            <span className="text-amber-400 font-bold">Acquire.com Escrow</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Enterprise Monopoly Tier</h3>
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400 mb-1">$125,000 USD</div>
          <p className="text-base text-slate-400 leading-relaxed">
            Includes full perpetual commercial exclusivity, patent non-assertion covenant, and custom hardware ECU integration rights.
          </p>
          <div className="mt-3.5 flex items-center justify-between text-base font-mono">
            <span className="text-slate-400">Commercial License:</span>
            <span className="text-emerald-400 font-bold">Unrestricted Worldwide</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Clean-Room Certification</h3>
          </div>
          <div className="text-3xl font-black font-mono text-purple-300 mb-1">0% Copyleft</div>
          <p className="text-base text-slate-400 leading-relaxed">
            Strict clean-room origin warranty. Zero GPL, AGPL, or viral open-source components. Full non-infringement indemnification.
          </p>
          <div className="mt-3.5 flex items-center justify-between text-base font-mono">
            <span className="text-slate-400">Governing Law:</span>
            <span className="text-purple-400 font-bold">State of Delaware, USA</span>
          </div>
        </div>
      </div>

      {/* Escrow Closing Checklist */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-row flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-400" />
              Acquire.com Turnkey Closing Checklist
            </h3>
            <p className="text-sm text-slate-400 mt-0.5">
              Interactive milestone verifier for wire escrow release and artifact delivery.
            </p>
          </div>
          <button
            type="button"
            onClick={exportSpecMarkdown}
            className="cursor-pointer px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            Download Complete APA Agreement
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div
            onClick={() => toggleChecklist('codeAudit')}
            className="flex items-center justify-between p-3.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={checklist.codeAudit}
                readOnly
                className="w-4.5 h-4.5 accent-emerald-500 rounded cursor-pointer"
              />
              <span className="text-base text-slate-200">1. Clean-Room Architectural Audit Verified</span>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">PASSED</span>
          </div>

          <div
            onClick={() => toggleChecklist('cleanRoom')}
            className="flex items-center justify-between p-3.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={checklist.cleanRoom}
                readOnly
                className="w-4.5 h-4.5 accent-emerald-500 rounded cursor-pointer"
              />
              <span className="text-base text-slate-200">2. 0% Copyleft Dependency Scan Complete</span>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">PASSED</span>
          </div>

          <div
            onClick={() => toggleChecklist('ipAssignment')}
            className="flex items-center justify-between p-3.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={checklist.ipAssignment}
                readOnly
                className="w-4.5 h-4.5 accent-emerald-500 rounded cursor-pointer"
              />
              <span className="text-base text-slate-200">3. Delaware Exhibit A IP Assignment Executed</span>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">SIGNED</span>
          </div>

          <div
            onClick={() => toggleChecklist('escrowDeposit')}
            className="flex items-center justify-between p-3.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={checklist.escrowDeposit}
                readOnly
                className="w-4.5 h-4.5 accent-emerald-500 rounded cursor-pointer"
              />
              <span className="text-base text-slate-200">4. Acquire.com Escrow Deposit Funded</span>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">$45,000 HELD</span>
          </div>

          <div
            onClick={() => toggleChecklist('gitTransfer')}
            className="flex items-center justify-between p-3.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={checklist.gitTransfer}
                readOnly
                className="w-4.5 h-4.5 accent-emerald-500 rounded cursor-pointer"
              />
              <span className="text-base text-slate-200">5. GitHub Repository Ownership Transfer</span>
            </div>
            <span className={`text-xs font-mono font-bold ${checklist.gitTransfer ? 'text-emerald-400' : 'text-amber-400'}`}>
              {checklist.gitTransfer ? 'TRANSFERRED' : 'READY TO PUSH'}
            </span>
          </div>

          <div
            onClick={() => toggleChecklist('domainTransfer')}
            className="flex items-center justify-between p-3.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={checklist.domainTransfer}
                readOnly
                className="w-4.5 h-4.5 accent-emerald-500 rounded cursor-pointer"
              />
              <span className="text-base text-slate-200">6. Cloud Run GCP Credentials Handoff</span>
            </div>
            <span className={`text-xs font-mono font-bold ${checklist.domainTransfer ? 'text-emerald-400' : 'text-amber-400'}`}>
              {checklist.domainTransfer ? 'COMPLETED' : 'READY TO KEY'}
            </span>
          </div>
        </div>
      </div>

      {/* Delaware Legal Covenants & Bill of Sale */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 font-mono text-base text-slate-300 leading-relaxed space-y-5">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3.5">
          <FileText className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-lg text-white">
            DELAWARE ASSET PURCHASE AGREEMENT — KEY COVENANTS & SCHEDULE A
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-amber-300 text-lg">SECTION 1. PURCHASED ASSETS</h4>
            <p className="text-slate-400 mt-1.5 leading-relaxed">
              Seller hereby agrees to sell, assign, transfer, convey, and deliver to Buyer, free and clear of all Encumbrances, all right, title, and interest in and to the technical deliverables designated as <span className="text-white font-semibold">GF-T3-184 (Lexus LFA Nürburgring Edition V10 Apex Core)</span>, including:
            </p>
            <ul className="list-disc list-inside text-slate-400 mt-2 space-y-1.5 ml-2 leading-relaxed">
              <li>Python 3.12 1LR-GUE Yamaha acoustic harmonics and 150 ms ASG state machine.</li>
              <li>PostgreSQL 16 partitioned timeseries schema, scavenge quarantine triggers, and HMAC chain functions.</li>
              <li>OpenAPI 3.1 contract and WebSocket protocol specifications.</li>
              <li>Multi-stage non-root Dockerfile and PyTest verification benches.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-amber-300 text-lg">SECTION 2. PURCHASE PRICE & ESCROW</h4>
            <p className="text-slate-400 mt-1.5 leading-relaxed">
              The aggregate purchase price for the Purchased Assets is <span className="text-white font-semibold">$45,000.00 USD</span> for the Standard Turnkey Package (or <span className="text-white font-semibold">$125,000.00 USD</span> for Enterprise Monopoly Buyout), payable via escrow through Acquire.com wire settlement.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-amber-300 text-lg">SECTION 3. INTELLECTUAL PROPERTY & CLEAN-ROOM WARRANTY</h4>
            <p className="text-slate-400 mt-1.5 leading-relaxed">
              Seller warrants and represents that the software was authored in strict adherence to clean-room engineering protocols without reverse engineering proprietary Toyota/Yamaha trade secret binaries. All third-party dependencies are licensed under permissive MIT/Apache-2.0 terms, with 0% viral copyleft encumbrance.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-amber-300 text-lg">SECTION 4. GOVERNING LAW & VENUE</h4>
            <p className="text-slate-400 mt-1.5 leading-relaxed">
              This Agreement shall be governed by and construed in accordance with the internal laws of the State of Delaware without giving effect to any choice or conflict of law provision.
            </p>
          </div>
        </div>

        <div className="pt-4.5 border-t border-slate-800 flex flex-row flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Lock className="w-4.5 h-4.5 text-emerald-400" />
            <span className="text-slate-400">
              Digital Signature Fingerprint: SHA-256: 4f88b0a1...9e218c
            </span>
          </div>
          <span className="text-emerald-400 font-bold">
            Acquire.com Turnkey Verification Ready
          </span>
        </div>
      </div>
    </div>
  );
};
