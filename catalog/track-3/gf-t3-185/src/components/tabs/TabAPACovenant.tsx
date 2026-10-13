import React, { useState } from 'react';
import { FileText, CheckCircle2, ShieldCheck, Scale, Award, DollarSign, Check, Copy } from 'lucide-react';

export const TabAPACovenant: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<'standard' | 'monopoly'>('standard');
  const [checklist, setChecklist] = useState({
    codeAudit: true,
    shaVerification: true,
    delawareEntity: true,
    noCopyleft: true,
    domainTransfer: true,
    escrowSignoff: false,
  });
  const [buyerSignature, setBuyerSignature] = useState('Acquiring Partner Corp');
  const [signed, setSigned] = useState(false);
  const [copiedAgreement, setCopiedAgreement] = useState(false);

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const agreementText = `DELAWARE ASSET PURCHASE AGREEMENT (MICRO-APA)
ASSET IDENTIFIER: GF-T3-185 (Lexus NX 450h+ F SPORT Handling Plug-In Core)

This Asset Purchase Agreement ("Agreement") is entered into as of October 2026 by and between:
SELLER: Ghost FactoryOS LLC, a Delaware limited liability company
BUYER: ${buyerSignature} (via Acquire.com Escrow Facilities)

1. PURCHASED ASSETS & VALUATION:
The Seller hereby agrees to sell, assign, transfer, and deliver to Buyer:
- Linear Solenoid 650-step Adaptive Variable Suspension (AVS) algorithmic engine
- Predictive Deceleration Support (PDS) PHEV energy recovery state machine
- PostgreSQL 16 range-partitioned timeseries hypertables and quarantine triggers
- OpenAPI 3.1 & WebSocket stream definitions
- Full intellectual property assignment and 100% clean-room authorship warranty
AGREED VALUATION: ${selectedTier === 'standard' ? '$45,000 USD (Turnkey Micro-APA)' : '$125,000 USD (Enterprise Monopoly Vault)'}

2. NON-INFRINGEMENT & ZERO-COPYLEFT WARRANTY:
Seller warrants and covenants that:
a) The Software was authored from scratch under strict clean-room isolation.
b) 0% of the codebase incorporates GPL, AGPL, SSPL, or any other copyleft licenses.
c) All external dependencies are strictly permissive (MIT, Apache 2.0, or BSD).
d) The Software does not infringe any third-party patents or trade secrets.

3. CLOSING & ESCROW DISBURSEMENT:
Funds held in Acquire.com escrow shall be released immediately upon delivery of:
- Cryptographic Git repository commit bundle with matching SHA-256 root hash
- Production Cloud Run deployment secrets and master PostgreSQL HMAC keys
- Fully executed Bill of Sale (Exhibit B)`;

  const handleCopy = () => {
    navigator.clipboard.writeText(agreementText);
    setCopiedAgreement(true);
    setTimeout(() => setCopiedAgreement(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <Scale className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Acquire.com Delaware Asset Purchase Agreement (APA)
            </h2>
            <p className="text-xs text-slate-400">
              Institutional legal covenants, Bill of Sale, and clean-room escrow handoff checklist for GF-T3-185
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
        >
          {copiedAgreement ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedAgreement ? 'Copied' : 'Copy APA Covenant'}</span>
        </button>
      </div>

      {/* Tier Valuation Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => setSelectedTier('standard')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedTier === 'standard'
              ? 'bg-amber-500/10 border-amber-500/60 shadow-lg'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold font-mono text-amber-400">TURNKEY MICRO-BUYOUT</span>
            <span className="text-2xl font-black font-mono text-emerald-400">$45,000 USD</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            Single-operator turnkey micro-APA deployment. Includes complete codebase, PostgreSQL schema, OpenAPI gateway, and perpetual MIT assignment.
          </p>
          <div className="text-xs text-slate-500 font-mono">Recommended for Acquire.com micro-PE buyers</div>
        </div>

        <div
          onClick={() => setSelectedTier('monopoly')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedTier === 'monopoly'
              ? 'bg-amber-500/10 border-amber-500/60 shadow-lg'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold font-mono text-cyan-400">ENTERPRISE MONOPOLY VAULT</span>
            <span className="text-2xl font-black font-mono text-amber-400">$125,000 USD</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            Full enterprise buyout with unlimited white-label exclusivity, trade-dress defense patents, perpetual OEM sublicensing rights, and warranty indemnification.
          </p>
          <div className="text-xs text-slate-500 font-mono">Institutional Tier 1 Dealership Fleet Asset</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Clean-Room Escrow Checklist (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-4 md:p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200">
              Clean-Room Escrow Handoff Checklist
            </span>
          </div>

          <div className="space-y-2.5">
            {[
              { key: 'codeAudit', label: '100% Clean-Room Authoring Certification', desc: 'Zero code scraped; certified author logs' },
              { key: 'noCopyleft', label: '0% Copyleft License Verification', desc: 'No GPL/AGPL/SSPL in recursive tree' },
              { key: 'shaVerification', label: 'Cryptographic SHA-256 Commit Manifest', desc: 'Hash: 4f98...e281 verified by escrow' },
              { key: 'delawareEntity', label: 'Delaware LLC Intellectual Property Assignment', desc: 'Good standing with Delaware Sec of State' },
              { key: 'domainTransfer', label: 'API Gateway Subdomain & Cloud Run Vault', desc: 'Automated transfer of telemetry endpoint' },
              { key: 'escrowSignoff', label: 'Acquire.com Escrow Mutual Release', desc: 'Click to authorize final disbursement' },
            ].map(({ key, label, desc }) => {
              const isChecked = checklist[key as keyof typeof checklist];
              return (
                <div
                  key={key}
                  onClick={() => toggleCheck(key as keyof typeof checklist)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-slate-950 border-emerald-500/40 text-slate-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        isChecked ? 'text-emerald-400' : 'text-slate-600'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="text-xs font-bold">{label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Signing Block */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-3">
            <span className="text-xs font-bold text-slate-300 block">
              Electronic Counterpart Signature
            </span>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Purchaser Entity / Name:</label>
              <input
                type="text"
                value={buyerSignature}
                onChange={(e) => setBuyerSignature(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              onClick={() => setSigned(!signed)}
              className={`w-full py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                signed
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
            >
              {signed ? 'Counterpart Signed & Timestamped' : 'Execute Digital Bill of Sale'}
            </button>
            {signed && (
              <div className="text-xs text-emerald-400 font-mono text-center">
                Signed on {new Date().toLocaleDateString()} · Escrow Order #ACQ-2026-9812
              </div>
            )}
          </div>
        </div>

        {/* Legal Agreement Text (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-4 md:p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold text-slate-300">
                Exhibit A & B: Complete Delaware Legal Text
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">Formal Instrument</span>
          </div>

          <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed border border-slate-800 max-h-[550px] overflow-y-auto">
            <code>{agreementText}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
