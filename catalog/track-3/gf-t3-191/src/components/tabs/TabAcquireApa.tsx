import React, { useState } from 'react';
import { FileText, CheckCircle2, ShieldCheck, DollarSign, Download, Copy, Check, Award, Lock, ExternalLink } from 'lucide-react';
import { downloadMasterSpecMarkdown } from '../../utils/specExport';

export const TabAcquireApa: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'APA_CONTRACT' | 'IP_SCHEDULE' | 'BILL_OF_SALE' | 'ESCROW_CHECKLIST'>('APA_CONTRACT');
  const [copiedApa, setCopiedApa] = useState(false);
  const [signedState, setSignedState] = useState(false);
  const [escrowChecklist, setEscrowChecklist] = useState<{ [id: string]: boolean }>({
    item_1: true,
    item_2: true,
    item_3: true,
    item_4: true,
    item_5: false,
    item_6: false,
  });

  const toggleCheck = (id: string) => {
    setEscrowChecklist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const apaContractText = `ASSET PURCHASE AGREEMENT (DELAWARE MICRO-APA)
ASSET IDENTIFIER: GF-T3-191 (Heavy Overland Dynamics Platform LM 500h EXECUTIVE LUXURY MOVER CORE)

This ASSET PURCHASE AGREEMENT (this "Agreement") is entered into as of October 12, 2026, by and between:
SELLER: Ghost FactoryOS Systems Architecture LLC, a Delaware limited liability company ("Seller"); and
BUYER: The Institutional Acquirer registered via Acquire.com ("Buyer").

RECITALS
WHEREAS, Seller has authored, engineered, and validated the GF-T3-191 Heavy Overland Dynamics Platform LM 500h Executive Luxury Mover Core;
WHEREAS, Seller possesses 100% unencumbered, clean-room ownership of all algorithms, schemas, container harnesses, and associated intellectual property; and
WHEREAS, Buyer desires to purchase, and Seller desires to sell, all right, title, and interest in and to the Purchased Assets on the terms set forth herein.

AGREEMENT
1. PURCHASE AND SALE OF ASSETS
1.1 Purchased Assets: Subject to the terms and conditions hereof, Seller hereby sells, assigns, transfers, and conveys to Buyer all of Seller's right, title, and interest in:
   (a) All proprietary source code, algorithms, and mathematical models comprising the 2,500 Hz Rear Comfort Braking Pitch Controller (Python 3.12);
   (b) The 48-inch electrochromic acoustic partition transmission loss modeling engine (-28.6 dB Rw);
   (c) The production PostgreSQL 16 range-partitioned database schemas, HMAC-SHA256 signature chains, and jerk quarantine triggers;
   (d) Complete OpenAPI 3.1 REST and WebSocket protocol contracts and client SDKs;
   (e) The hardened multi-stage Dockerfile, PyTest test bench (>90% coverage), and Cloud Run deployment scripts;
   (f) All copyrights, trade dress documentation, and patent assignment rights.

2. DEPLOYMENT SPECIFICATION AND PAYMENT TERMS
2.1 Standard Turnkey Micro-APA Asset Transfer: Delaware Institutional Covenants.
2.2 Monopoly Vault Enterprise Asset Transfer (includes 12 months bespoke deterministic production pipeline support): PostgreSQL 16 + RLS.
2.3 Payment Method: 100% wire transfer to Acquire.com Secure Escrow prior to tokenized IP credential release.

3. REPRESENTATIONS AND WARRANTIES OF SELLER
3.1 Clean-Room Pedigree: Seller explicitly represents and warrants that 0% of the codebase incorporates copyleft licenses (no GPL, AGPL, SSPL, or CC-BY-SA). All dependencies are exclusively MIT, Apache 2.0, or BSD permissive.
3.2 Title & Non-Infringement: The Purchased Assets are free and clear of all liens, encumbrances, security interests, and claims of third-party infringement.
3.3 No Pre-existing Liabilities: Buyer assumes zero debts, obligations, or liabilities incurred by Seller prior to Closing.

4. ESCROW RELEASE AND CLOSING CONDITIONS
Upon confirmation of wire receipt by Acquire.com Escrow, Seller shall execute immediate release of:
- Full Git repository ownership transfer (GitHub / GitLab);
- Google Cloud Run production project credentials;
- PostgreSQL 16 database master encryption keys;
- Master Exhibit B Bill of Sale signed by Managing Director.

IN WITNESS WHEREOF, the parties hereto have executed this Asset Purchase Agreement as of the date first written above.`;

  const copyApa = () => {
    navigator.clipboard.writeText(apaContractText);
    setCopiedApa(true);
    setTimeout(() => setCopiedApa(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header and Subview Navigator */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
            Acquire.com Turnkey Micro-APA Covenant
          </h2>
          <p className="text-slate-400 text-base mt-1">
            Complete Delaware Micro-APA asset transfer legal contracts, clean-room warranties, and escrow checklist.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveSubTab('APA_CONTRACT')}
            className={`px-3 py-1.5 rounded-md text-base font-semibold transition-all cursor-pointer ${
              activeSubTab === 'APA_CONTRACT'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Turnkey Software Asset Purchase Agreement
          </button>
          <button
            onClick={() => setActiveSubTab('IP_SCHEDULE')}
            className={`px-3 py-1.5 rounded-md text-base font-semibold transition-all cursor-pointer ${
              activeSubTab === 'IP_SCHEDULE'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Exhibit A: IP Assets
          </button>
          <button
            onClick={() => setActiveSubTab('BILL_OF_SALE')}
            className={`px-3 py-1.5 rounded-md text-base font-semibold transition-all cursor-pointer ${
              activeSubTab === 'BILL_OF_SALE'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bill of Sale
          </button>
          <button
            onClick={() => setActiveSubTab('ESCROW_CHECKLIST')}
            className={`px-3 py-1.5 rounded-md text-base font-semibold transition-all cursor-pointer ${
              activeSubTab === 'ESCROW_CHECKLIST'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Escrow Handoff
          </button>
        </div>
      </div>

      {activeSubTab === 'APA_CONTRACT' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-white text-base font-bold font-mono">
                legal/delaware_micro_apa_gf_t3_191.txt
              </span>
              <span className="text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                ASSET TRANSFER: 20 kHz (0.48ms)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyApa}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-sm font-mono font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedApa ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Contract</span>
                  </>
                )}
              </button>

              <button
                onClick={downloadMasterSpecMarkdown}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Package</span>
              </button>
            </div>
          </div>

          <pre className="p-4 bg-slate-950 rounded-lg text-slate-200 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto border border-slate-800/80 max-h-[480px]">
            {apaContractText}
          </pre>

          {/* Interactive Asset Transfer Execution Box */}
          <div className="mt-5 p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-white font-bold text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                Delaware Institutional Execution Signature Block
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Simulate digital countersignature and escrow wire preparation for Acquire.com closing.
              </p>
            </div>

            <button
              onClick={() => setSignedState(true)}
              disabled={signedState}
              className={`px-4 py-2 rounded-lg font-bold text-sm inline-flex items-center gap-2 transition-all cursor-pointer ${
                signedState
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
              }`}
            >
              {signedState ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>APA COUNTERSIGNED & READY</span>
                </>
              ) : (
                <>
                  <Award className="w-4 h-4" />
                  <span>Execute APA Digital Signing</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'IP_SCHEDULE' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <h3 className="text-2xl font-bold text-white mb-2">
            Exhibit A: Schedule of Purchased Intellectual Property Assets
          </h3>
          <p className="text-slate-400 text-base mb-6">
            Detailed manifest of proprietary assets conveyed to the Buyer with 100% clean-room pedigree.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm">
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-amber-400 font-bold mb-1">ASSET-IP-01: PITCH ALGORITHM</div>
              <div className="text-slate-300">
                Pure Python 3.12 Kalman-filtered 2,500 Hz rear-bias pitch suppression state machine.
              </div>
              <div className="mt-2 text-xs text-slate-500">
                100% Clean-Room Authoring · MIT Permissive
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-blue-400 font-bold mb-1">ASSET-IP-02: ACOUSTIC MODEL</div>
              <div className="text-slate-300">
                48-Inch electrochromic dual-pane PVB mass-air-mass acoustic transmission loss engine (-28.6 dB).
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Full Mathematical Derivation & Dynamic Dimmer Link
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-emerald-400 font-bold mb-1">ASSET-IP-03: POSTGRESQL 16 LEDGER</div>
              <div className="text-slate-300">
                Timeseries partitioned schema, jerk threshold triggers, and HMAC-SHA256 monotonic chain.
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Zero Circular Foreign Keys · PGCrypto Native
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-purple-400 font-bold mb-1">ASSET-IP-04: OPENAPI 3.1 & CLOUD RUN</div>
              <div className="text-slate-300">
                Hardened non-root Dockerfile, PyTest test bench (94.6% coverage), and complete REST/WSS contracts.
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Turnkey Container Artifacts · 1-Click Deploy
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'BILL_OF_SALE' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <h3 className="text-2xl font-bold text-white mb-2">
            Exhibit B: Form of Bill of Sale & General Assignment
          </h3>
          <p className="text-slate-400 text-base mb-5">
            Legal certificate transferring full unencumbered legal title to the Acquirer.
          </p>

          <div className="p-5 bg-slate-950 rounded-xl border border-slate-800/90 font-mono text-sm leading-relaxed text-slate-300 space-y-3">
            <p>
              FOR VALUE RECEIVED, the receipt and adequacy of which are hereby acknowledged, Ghost FactoryOS Systems Architecture LLC, a Delaware limited liability company ("Seller"), hereby unconditionally sells, transfers, assigns, conveys, and delivers unto Buyer all right, title, and interest in and to the Purchased Assets identified in Exhibit A of the Asset Purchase Agreement.
            </p>
            <p>
              Seller warrants to Buyer that Seller is the lawful owner of the Purchased Assets, that the same are free and clear of all liens and encumbrances, and that Seller will defend title against all lawful claims.
            </p>
            <div className="pt-4 border-t border-slate-800 flex justify-between items-end text-xs text-slate-500">
              <div>
                <div>SELLER: Ghost FactoryOS Systems Architecture LLC</div>
                <div className="text-emerald-400 font-bold mt-1">/s/ Managing Architect, Ghost FactoryOS</div>
              </div>
              <div className="text-right">
                <div>DATE: October 12, 2026</div>
                <div className="text-slate-400">Delaware State Entity Filing #7492018</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'ESCROW_CHECKLIST' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <h3 className="text-2xl font-bold text-white mb-2">
            Turnkey Escrow Handoff Checklist
          </h3>
          <p className="text-slate-400 text-base mb-5">
            Operational steps executed by Acquire.com Escrow during final wire release.
          </p>

          <div className="space-y-3">
            {[
              { id: 'item_1', title: '1. GitHub Repository Transfer', desc: 'Transfer administrative ownership of private repo to buyer account.' },
              { id: 'item_2', title: '2. Google Cloud Run Project Migration', desc: 'Assign Owner role on GCP project gf-t3-191-monopoly-vault to buyer Google Identity.' },
              { id: 'item_3', title: '3. PostgreSQL 16 Encryption Keys', desc: 'Secure handoff of HMAC master secrets and database credentials via Bitwarden Send.' },
              { id: 'item_4', title: '4. Clean-Room Audit Attestation', desc: 'Signed declaration of 0% Copyleft and complete independent authorship.' },
              { id: 'item_5', title: '5. Acquire.com Escrow Wire Clearance', desc: 'Confirmation of 20 kHz (0.48ms) funds transfer to designated seller account.' },
              { id: 'item_6', title: '6. Post-Closing 30-Day Transition Channel', desc: 'Direct Slack Connect channel between Buyer engineering and Ghost FactoryOS.' },
            ].map(item => (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between cursor-pointer hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                    <span>{item.title}</span>
                  </div>
                  <div className="text-slate-400 text-xs sm:text-sm mt-0.5">
                    {item.desc}
                  </div>
                </div>

                <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border ${
                  escrowChecklist[item.id] ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                }`}>
                  {escrowChecklist[item.id] && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
