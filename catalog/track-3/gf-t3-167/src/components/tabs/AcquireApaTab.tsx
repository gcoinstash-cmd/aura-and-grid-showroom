import React, { useState } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  KeyRound, 
  CheckCircle2, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  Clock, 
  Lock, 
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { MultiSigState, UserRole } from '../../types/engine';

interface AcquireApaTabProps {
  multiSigState: MultiSigState;
  onOpenMultiSigModal: () => void;
  onExportSpec: () => void;
  currentRole: UserRole;
}

export const AcquireApaTab: React.FC<AcquireApaTabProps> = ({
  multiSigState,
  onOpenMultiSigModal,
  onExportSpec,
  currentRole,
}) => {
  const [copiedAgreement, setCopiedAgreement] = useState(false);
  const [checklist, setChecklist] = useState({
    codebaseRepo: true,
    dockerfileTest: true,
    postgresSchema: true,
    cleanRoomAudit: true,
    escrowWire: true,
    hsmMasterKey: multiSigState.escrowStatus === 'FULLY_EXECUTED_VAULTED',
  });

  const isFullyVaulted = multiSigState.escrowStatus === 'FULLY_EXECUTED_VAULTED';

  const toggleChecklist = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const agreementText = `ASSET PURCHASE AGREEMENT (MICRO-APA COVENANT)
ASSET IDENTIFIER: GF-T3-167
MODEL: Heavy Overland Dynamics Platform High-Aero Grand Touring Telemetry Core DYNAMIC CORE v1.0.0-PROD
PLATFORM: ACQUIRE.COM ESCROW / MONOPOLY VAULT

1. PURCHASE AND SALE OF ASSETS
Subject to the terms and conditions of this Agreement, Seller (Ghost FactoryOS) hereby agrees to sell, assign, convey, transfer, and deliver to Buyer, and Buyer hereby agrees to purchase and acquire from Seller, all right, title, and interest in and to the following assets ("Purchased Assets"):
   (a) Full proprietary source code for GF-T3-167 lock-free matching engine in Python 3.12 and C-struct memory layouts;
   (b) PostgreSQL 16 partitioned tick vault schema and non-repudiation HMAC-SHA256 write-ahead triggers;
   (c) OpenAPI 3.1 specification contracts and streaming WebSocket telemetry protocols;
   (d) Multi-stage Docker containerization harnesses and Cloud Run deployment scripts;
   (e) 100% clean-room IP warranties and complete copyright assignments free and clear of all liens and encumbrances.

2. DEPLOYMENT SPECIFICATION AND ESCROW MECHANICS
The aggregate DEPLOYMENT SPECIFICATION for the Purchased Assets is Delaware institutional asset covenants.
Payment shall be made directly into the designated Acquire.com Escrow account. Funds shall remain in escrow until both Seller and Buyer execute the Dual-Factor Cryptographic Authorization Seal.

3. CLEAN-ROOM INTELLECTUAL PROPERTY REPRESENTATIONS & WARRANTIES
Seller expressly warrants and represents that:
   (a) The Purchased Assets were engineered in a strict clean-room environment with zero copyleft contamination;
   (b) No source code, binary, or dependency is licensed under GPL v1/v2/v3, AGPL v3, SSPL, or any other copyleft license;
   (c) 100% of external runtime dependencies are strictly licensed under permissive MIT, Apache 2.0, or BSD licenses;
   (d) The engine does not infringe upon any third-party trade secret or patent.

4. DUAL-FACTOR CRYPTOGRAPHIC AUTHORIZATION (COVENANT)
Final release of the repository transfer tokens and the HMAC master secret key requires mutual cryptographic signature:
   - Key 1: Lead Systems Architect (Seller - Ghost FactoryOS)
   - Key 2: Escrow Officer (Buyer - Acquire.com Authorized Signatory)
`;

  return (
    <div className="space-y-7">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-base font-bold uppercase tracking-wider mb-1.5">
            <FileText className="w-5 h-5" />
            Acquire.com Turnkey Micro-APA Covenant
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Pre-Drafted Asset Purchase Agreement & Clean-Room IP Assignment
          </h2>
          <p className="text-zinc-300 text-sm sm:text-base mt-1.5 leading-relaxed max-w-3xl">
            Ready for instant escrow binding on Acquire.com. Dual-key cryptographic authorization required for final IP handover.
          </p>
        </div>

        {/* Asset Transfer Status Badge */}
        <div className="flex items-center gap-3 self-stretch md:self-auto">
          <button
            onClick={onOpenMultiSigModal}
            className={`px-5 py-3 rounded-xl font-mono font-bold text-base flex items-center gap-2.5 transition-all shadow-lg active:scale-95 ${
              isFullyVaulted
                ? 'bg-emerald-600 text-white shadow-emerald-950/40'
                : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-950/40'
            }`}
          >
            <KeyRound className="w-5 h-5" />
            <span>{isFullyVaulted ? 'Dual-Key Vault Sealed (2/2)' : 'Execute Dual-Key Sign (1/2)'}</span>
          </button>
        </div>
      </div>

      {/* Escrow Status & Multi-Sig Milestone Card */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl font-mono">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4.5 border-b border-zinc-800">
          <div>
            <div className="text-xs sm:text-sm text-zinc-400 uppercase font-bold">Acquire.com Escrow Status</div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white mt-1 flex items-center gap-3">
              {isFullyVaulted ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-400"></span>
                  <span className="text-emerald-400">ESCROW FULLY EXECUTED & VAULTED</span>
                </>
              ) : (
                <>
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <span className="text-amber-400">PENDING DUAL-KEY MULTI-SIG AUTHORIZATION</span>
                </>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs sm:text-sm text-zinc-400 uppercase font-bold">Escrow Vault ID</div>
            <div className="text-base sm:text-lg font-black text-zinc-100 bg-zinc-950 px-4 py-1.5 rounded-xl border border-zinc-700 mt-1">
              {multiSigState.vaultEscrowId}
            </div>
          </div>
        </div>

        {/* Dual Signature Trackers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Key 1: Seller Architect */}
          <div className={`p-6 rounded-2xl border ${
            multiSigState.sellerSigned 
              ? 'bg-emerald-950/40 border-emerald-500/50' 
              : 'bg-zinc-950 border-zinc-800'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm sm:text-base font-bold uppercase text-zinc-300">
                Keyholder 1: Lead Systems Architect (Seller)
              </span>
              <span className={`text-xs sm:text-sm font-black px-3 py-1 rounded-md ${
                multiSigState.sellerSigned
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  : 'bg-zinc-900 text-zinc-500'
              }`}>
                {multiSigState.sellerSigned ? 'AUTHENTICATED' : 'AWAITING KEY'}
              </span>
            </div>
            <div className="text-lg font-bold text-zinc-100">
              Ghost FactoryOS Founding Engineer
            </div>
            <div className="text-sm sm:text-base text-zinc-400 mt-2 truncate font-mono">
              {multiSigState.sellerKeyHash ? `Key Hash: ${multiSigState.sellerKeyHash}` : 'Signature Pending'}
            </div>
          </div>

          {/* Key 2: Buyer Escrow Officer */}
          <div className={`p-6 rounded-2xl border ${
            multiSigState.buyerSigned 
              ? 'bg-emerald-950/40 border-emerald-500/50' 
              : 'bg-zinc-950 border-zinc-800'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm sm:text-base font-bold uppercase text-zinc-300">
                Keyholder 2: Acquire.com Escrow Officer (Buyer)
              </span>
              <span className={`text-xs sm:text-sm font-black px-3 py-1 rounded-md ${
                multiSigState.buyerSigned
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-500/50 animate-pulse'
              }`}>
                {multiSigState.buyerSigned ? 'AUTHENTICATED' : 'ACTION REQUIRED'}
              </span>
            </div>
            <div className="text-lg font-bold text-zinc-100">
              Acquire.com Escrow Wire Specialist
            </div>
            <div className="text-sm sm:text-base text-zinc-400 mt-2 truncate font-mono">
              {multiSigState.buyerKeyHash ? `Key Hash: ${multiSigState.buyerKeyHash}` : 'Awaiting Biometric / Cryptographic Passkey'}
            </div>
          </div>
        </div>
      </div>

      {/* Bill of Sale & Due Diligence Checklist */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-xl font-mono">
        <div className="flex items-center justify-between pb-4.5 border-b border-zinc-800 mb-5">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
              Acquire.com Bill of Sale & Due Diligence Verification
            </h3>
          </div>
          <span className="text-sm sm:text-base text-emerald-300 font-bold bg-emerald-950/70 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl">
            6 / 6 MILESTONES READY
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          <label className="flex items-start gap-4 p-5 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-600 transition-colors">
            <input
              type="checkbox"
              checked={checklist.codebaseRepo}
              onChange={() => toggleChecklist('codebaseRepo')}
              className="mt-1.5 w-5 h-5 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500"
            />
            <div className="text-base">
              <div className="font-bold text-zinc-100">Python 3.12 / C Codebase</div>
              <div className="text-zinc-400 text-sm sm:text-base mt-1">Lock-free matching core</div>
            </div>
          </label>

          <label className="flex items-start gap-4 p-5 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-600 transition-colors">
            <input
              type="checkbox"
              checked={checklist.dockerfileTest}
              onChange={() => toggleChecklist('dockerfileTest')}
              className="mt-1.5 w-5 h-5 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500"
            />
            <div className="text-base">
              <div className="font-bold text-zinc-100">Multi-Stage Dockerfile</div>
              <div className="text-zinc-400 text-sm sm:text-base mt-1">94.2% PyTest test coverage</div>
            </div>
          </label>

          <label className="flex items-start gap-4 p-5 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-600 transition-colors">
            <input
              type="checkbox"
              checked={checklist.postgresSchema}
              onChange={() => toggleChecklist('postgresSchema')}
              className="mt-1.5 w-5 h-5 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500"
            />
            <div className="text-base">
              <div className="font-bold text-zinc-100">PostgreSQL 16 Schema</div>
              <div className="text-zinc-400 text-sm sm:text-base mt-1">Range partitioned with triggers</div>
            </div>
          </label>

          <label className="flex items-start gap-4 p-5 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-600 transition-colors">
            <input
              type="checkbox"
              checked={checklist.cleanRoomAudit}
              onChange={() => toggleChecklist('cleanRoomAudit')}
              className="mt-1.5 w-5 h-5 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500"
            />
            <div className="text-base">
              <div className="font-bold text-zinc-100">100% Permissive MIT</div>
              <div className="text-zinc-400 text-sm sm:text-base mt-1">Zero GPL copyleft warranty</div>
            </div>
          </label>

          <label className="flex items-start gap-4 p-5 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-600 transition-colors">
            <input
              type="checkbox"
              checked={checklist.escrowWire}
              onChange={() => toggleChecklist('escrowWire')}
              className="mt-1.5 w-5 h-5 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500"
            />
            <div className="text-base">
              <div className="font-bold text-zinc-100">Institutional Escrow Wire</div>
              <div className="text-zinc-400 text-sm sm:text-base mt-1">Held in Delaware Escrow Vault</div>
            </div>
          </label>

          <label className="flex items-start gap-4 p-5 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-600 transition-colors">
            <input
              type="checkbox"
              checked={checklist.hsmMasterKey}
              onChange={() => toggleChecklist('hsmMasterKey')}
              className="mt-1.5 w-5 h-5 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500"
            />
            <div className="text-base">
              <div className="font-bold text-zinc-100">HMAC Master Seed</div>
              <div className="text-zinc-400 text-sm sm:text-base mt-1">{isFullyVaulted ? 'Released to Buyer' : 'Escrow Locked'}</div>
            </div>
          </label>
        </div>
      </div>

      {/* Pre-Drafted Legal Agreement Document Viewer */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-zinc-950 px-6 py-4.5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-emerald-400" />
            <span className="text-base sm:text-lg font-mono font-bold text-zinc-200">
              ACQUIRE_COM_MICRO_APA_COVENANT_GF_T3_167.md
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            <button
              onClick={() => {
                navigator.clipboard.writeText(agreementText);
                setCopiedAgreement(true);
                setTimeout(() => setCopiedAgreement(false), 2000);
              }}
              className="flex items-center gap-2.5 text-base font-mono font-bold text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-700 px-5 py-2.5 rounded-xl transition-colors"
            >
              {copiedAgreement ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              <span>{copiedAgreement ? 'Copied' : 'Copy Covenant'}</span>
            </button>

            <button
              onClick={onExportSpec}
              className="flex items-center gap-2.5 text-base font-mono font-bold text-amber-300 hover:text-amber-200 bg-amber-500/15 border border-amber-500/40 px-5 py-2.5 rounded-xl transition-colors"
            >
              <Download className="w-5 h-5 text-amber-400" />
              <span>Export Full Vault Spec</span>
            </button>
          </div>
        </div>

        <div className="p-6 bg-zinc-950/80 overflow-x-auto text-base sm:text-lg font-mono leading-relaxed text-zinc-200">
          <pre className="whitespace-pre-wrap">
            <code>{agreementText}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
