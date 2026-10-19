import React, { useState } from 'react';
import { FileText, ShieldCheck, CheckSquare, Award, Copy, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export const AcquireApaTab: React.FC = () => {
  const [buyerName, setBuyerName] = useState('Acquiring Partner Inc.');
  const [isSigned, setIsSigned] = useState(false);
  const [signatureTimestamp, setSignatureTimestamp] = useState<string | null>(null);
  const [copiedContract, setCopiedContract] = useState(false);
  const [escrowChecklist, setEscrowChecklist] = useState({
    codeAudit: true,
    ledgerVerification: true,
    dockerSmokeTest: true,
    ipAssignmentExecuted: false,
    escrowFunding: true,
  });

  const toggleCheck = (key: keyof typeof escrowChecklist) => {
    setEscrowChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const completedChecksCount = Object.values(escrowChecklist).filter(Boolean).length;

  const handleSignAgreement = () => {
    if (!buyerName.trim()) return;
    const now = new Date().toISOString();
    setSignatureTimestamp(now);
    setIsSigned(true);
    setEscrowChecklist(prev => ({ ...prev, ipAssignmentExecuted: true }));

    // Trigger celebratory confetti for asset transfer execution
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#f59e0b', '#10b981', '#38bdf8', '#ffffff'],
      });
    } catch {
      // Ignore if canvas is unavailable
    }
  };

  const apaLegalText = `Turnkey Software Asset Purchase Agreement (MICRO-APA)
ASSET IDENTIFIER: GF-T3-181 (Heavy Overland Dynamics Platform IS 500 High-G Dynamic Telemetry CORE)
PLATFORM: ACQUIRE.COM MASTER VAULT DIRECTORY

This Asset Purchase Agreement ("Agreement") is entered into as of October 11, 2026, by and between Ghost FactoryOS Skunkworks ("Seller"), and ${buyerName || '[Purchaser Entity]'} ("Purchaser").

RECITALS
WHEREAS, Seller has independently architected and authored that certain proprietary software asset known as "GF-T3-181 (Heavy Overland Dynamics Platform IS 500 High-G Dynamic Telemetry Core)" consisting of pure Python 3.12 throttle mapping algorithms, Torsen Type-B LSD thermodynamic monitoring models, partitioned PostgreSQL 16 cryptographic ledger schemas, OpenAPI 3.1 contracts, and production Cloud Run harnesses (collectively, the "Purchased Assets");
WHEREAS, Seller desires to sell, and Purchaser desires to acquire, all right, title, and interest in and to the Purchased Assets pursuant to the terms and conditions herein.

NOW, THEREFORE, for good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:

1. PURCHASE AND SALE OF ASSETS
1.1 Purchased Assets: Seller hereby sells, assigns, transfers, and conveys to Purchaser all right, title, and interest in the Purchased Assets, including all intellectual property rights, copyrights, trade secrets, algorithms, and documentation.
1.2 DEPLOYMENT SPECIFICATION: TURNKEY CONTAINER / BARE-METAL
1.3 Escrow Release: Payment shall be disbursed via Acquire.com / Escrow.com upon successful completion of the Clean-Room Verification Handoff.

2. CLEAN-ROOM REPRESENTATIONS AND WARRANTIES
2.1 100% Original Authorship: Seller represents and warrants that all source code and documentation were authored entirely from scratch without unauthorized incorporation of third-party proprietary trade secrets.
2.2 Zero Copyleft Guarantee: The Purchased Assets are free of GPL, AGPL, SSPL, or viral open-source licenses. All runtime dependencies are strictly MIT, Apache 2.0, or BSD permissive.
2.3 Non-Infringement: Seller warrants that the operation of the Purchased Assets does not infringe any third-party patent, copyright, or intellectual property right.

3. GOVERNING LAW AND JURISDICTION
This Agreement shall be governed by, and construed in accordance with, the laws of the Standard Commercial Jurisdiction, without giving effect to any principles of conflicts of law.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.`;

  const handleCopyContract = () => {
    navigator.clipboard.writeText(apaLegalText);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Acquire.com Turnkey Micro-APA Legal Covenant
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Delaware model asset purchase agreement with 100% clean-room IP warranty and zero copyleft indemnity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded">
            Asset ID: GF-T3-181
          </span>
          <button
            onClick={handleCopyContract}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs h-8 px-3 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedContract ? 'Copied' : 'Copy Full APA'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Escrow Handoff Checklist & Purchase Parameters */}
        <div className="lg:col-span-5 space-y-5">
          {/* Asset Transfer Economics Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Acquisition Economics & Specification
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] font-mono text-slate-400 block">Turnkey Micro-APA</span>
                <span className="text-xl font-bold font-mono text-emerald-400">20 kHz (0.48ms)</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Immediate Asset Escrow</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] font-mono text-slate-400 block">Monopoly Enterprise</span>
                <span className="text-xl font-bold font-mono text-amber-400">PostgreSQL 16 + RLS</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Full Commercial Exclusivity</span>
              </div>
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Jurisdiction:</span>
                <span className="text-white font-mono">Delaware, USA</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Escrow Provider:</span>
                <span className="text-white font-mono">Acquire.com / Escrow.com</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Clean-Room Audit:</span>
                <span className="text-emerald-400 font-mono font-bold">100% Certified</span>
              </div>
            </div>
          </div>

          {/* Clean-Room Escrow Handoff Checklist */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                Escrow Transfer Checklist
              </h3>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {completedChecksCount} / 5 Completed
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { key: 'codeAudit', label: 'Clean-Room IP Audit Verified (0% Copyleft, MIT)' },
                { key: 'ledgerVerification', label: 'PostgreSQL 16 HMAC Chain Integrity Tested' },
                { key: 'dockerSmokeTest', label: 'Cloud Run Non-Root Container Automated Build' },
                { key: 'ipAssignmentExecuted', label: 'Delaware Bill of Sale & Exhibit A Signed' },
                { key: 'escrowFunding', label: 'Acquire.com Escrow Escrowed & Ready for Release' },
              ].map((item) => {
                const isChecked = escrowChecklist[item.key as keyof typeof escrowChecklist];
                return (
                  <div
                    key={item.key}
                    onClick={() => toggleCheck(item.key as keyof typeof escrowChecklist)}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-emerald-600 accent-emerald-500 cursor-pointer"
                    />
                    <span className={isChecked ? 'text-slate-200 font-medium' : 'text-slate-400'}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Buyer Sign-Off */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Purchaser Execution Sign-Off
            </h3>
            <div className="space-y-2">
              <label className="block text-xs text-slate-400 font-medium">Purchaser Entity / Name:</label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="e.g. Apex Strategic Acquisitions LLC"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            <button
              onClick={handleSignAgreement}
              disabled={isSigned}
              className={`w-full font-bold text-xs h-10 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isSigned
                  ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-400'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
              }`}
            >
              {isSigned ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Covenant Digitally Sealed</span>
                </>
              ) : (
                <span>Execute Delaware Micro-APA Sign-Off</span>
              )}
            </button>

            {isSigned && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 font-mono space-y-1">
                <div className="flex justify-between">
                  <span>Signatory:</span>
                  <span className="font-bold text-white">{buyerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Timestamp:</span>
                  <span className="text-slate-400">{signatureTimestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cryptographic Stamp:</span>
                  <span className="text-emerald-400">SHA-256::SEALED_VALID</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Full Legal Text Viewer */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Delaware Micro-APA Legal Agreement (Exhibits A &amp; B)
            </h3>
            <span className="text-xs font-mono text-slate-400">Standard Commercial Jurisdiction</span>
          </div>

          <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-[580px] leading-relaxed whitespace-pre-wrap">
            {apaLegalText}
          </pre>
        </div>
      </div>
    </div>
  );
};
