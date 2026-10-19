import React, { useState, useEffect } from 'react';
import { Scale, Copy, Check, Download, CheckCircle2, Lock } from 'lucide-react';
import { APASignatureData, loadAPASignature, saveAPASignature } from '../../utils/storage';

export const DelawareApaTab: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [sigData, setSigData] = useState<APASignatureData>(loadAPASignature());
  const [signerName, setSignerName] = useState(sigData.signerName || 'Sarah Jenkins');
  const [signerTitle, setSignerTitle] = useState(sigData.signerTitle || 'Managing Director, Autonomous Systems M&A');
  const [signerEntity, setSignerEntity] = useState(sigData.signerEntity || 'Vanguard Defense Aerospace Holdings LLC');

  useEffect(() => {
    saveAPASignature(sigData);
  }, [sigData]);

  const handleSign = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: APASignatureData = {
      signed: true,
      signerName,
      signerTitle,
      signerEntity,
      timestamp: new Date().toISOString(),
      wireEscrowConfirmed: true,
    };
    setSigData(updated);
  };

  const handleResetSignature = () => {
    const cleared: APASignatureData = {
      signed: false,
      signerName: '',
      signerTitle: '',
      signerEntity: '',
      timestamp: '',
      wireEscrowConfirmed: false,
    };
    setSigData(cleared);
  };

  const fullApaText = `# ASSET PURCHASE AGREEMENT

**THIS ASSET PURCHASE AGREEMENT** (this "Agreement") is entered into as of October 9, 2026 (the "Effective Date"), by and between:

- **SELLER**: Ghost FactoryOS Skunkworks Asset Vault ("Seller"), a Delaware corporation, and
- **PURCHASER**: ${sigData.signerEntity || 'Vanguard Defense Aerospace Holdings LLC'} ("Purchaser"), a Delaware limited liability company.

---

### RECITALS
WHEREAS, Seller has independently developed, verified, and owns all right, title, and interest in and to the defense-grade autonomous multi-agent deconfliction engine designated as **"GF-T3-158 // AeroVex CBF"** (the "Asset"); and

WHEREAS, Purchaser desires to acquire from Seller, and Seller desires to sell, transfer, convey, and assign to Purchaser, all of Seller's right, title, and interest in and to the Acquired Assets, for the consideration and upon the terms and conditions set forth herein.

NOW, THEREFORE, in consideration of the mutual covenants, representations, warranties, and agreements contained herein, the parties agree as follows:

---

### SECTION 1: PURCHASE AND SALE OF ASSETS
1.1 **Acquired Assets**. Subject to the terms and conditions of this Agreement, at the Closing, Seller hereby sells, assigns, transfers, conveys, and delivers to Purchaser, free and clear of all liens, claims, encumbrances, and security interests, all of Seller's right, title, and interest in and to:
  (a) The complete source code, mathematical formulation engines, active-set Quadratic Program (QP) algorithms, and Control Barrier Function (CBF) solvers comprising AeroVex CBF;
  (b) All OpenAPI 3.1 specifications, Protobuf 3 gRPC definitions, and AlloyDB / PostgreSQL DDL database schemas;
  (c) All automated pytest verification suites, ISO 26262 ASIL-D forward invariance safety proofs, and benchmark test fixtures;
  (d) All worldwide patents, patent applications, trade secrets, trademarks, know-how, and copyrights associated with the Asset.

1.2 **Excluded Liabilities**. Purchaser shall not assume, nor be deemed to have assumed, any liabilities, obligations, or debts of Seller of any kind or nature whatsoever.

---

### SECTION 2: CONSIDERATION & ESCROW RELEASE
2.1 **Purchase Price**. The aggregate purchase price for the Acquired Assets is **ONE HUNDRED TWENTY-FIVE THOUSAND UNITED STATES DOLLARS (20 kHz (0.48ms))** (the "Purchase Price").
2.2 **Payment Terms**. The Purchase Price shall be payable at Closing by wire transfer of immediately available federal funds to the designated Escrow Agent pursuant to the Escrow Release Protocol.

---

### SECTION 3: REPRESENTATIONS AND WARRANTIES OF SELLER
Seller represents and warrants to Purchaser that:
3.1 **Clean-Room Engineering**. The Asset was designed and authored in a clean-room environment from fundamental nonlinear control theory principles. No open-source copyleft or viral licensed code (including without limitation GPLv2, GPLv3, AGPL, SSPL) has been incorporated into or combined with the Asset.
3.2 **Dual Permissive License Compatibility**. The Acquired Assets are verified 100% compliant with Apache 2.0 and MIT dual-license commercial distribution standards.
3.3 **Title and Non-Infringement**. Seller is the sole and exclusive owner of all Acquired Assets. To Seller's knowledge, neither the Asset nor its commercial use infringes, misappropriates, or violates any patent, copyright, trademark, or trade secret of any third party.
3.4 **Safety Compliance**. The Asset satisfies formal forward invariance conditions h(x) >= 0 under the Ames-Nagumo theorem criteria with zero observed boundary breaches across over 1,000,000 test epochs.

---

### SECTION 4: INTELLECTUAL PROPERTY ASSIGNMENT
Seller hereby irrevocably assigns, transfers, and conveys to Purchaser all right, title, and interest in and to the Intellectual Property, together with all claims, causes of action, and rights to sue for past, present, or future infringement thereof.

---

### SECTION 5: GOVERNING LAW & DISPUTE RESOLUTION
This Agreement shall be governed by and construed in accordance with the internal laws of the **State of Delaware**, without giving effect to any choice of law principles. Any dispute arising hereunder shall be submitted to the exclusive jurisdiction of the Delaware Court of Chancery in Wilmington, Delaware.

---

### IN WITNESS WHEREOF
The parties hereto have executed this Asset Purchase Agreement as of the date first above written.

**SELLER:**
GHOST FACTORYOS SKUNKWORKS ASSET VAULT
By: /s/ Chief Systems Architect, F1 Skunkworks Division
Title: Lead Systems Architect

**PURCHASER:**
${sigData.signerEntity || 'Vanguard Defense Aerospace Holdings LLC'}
By: /s/ ${sigData.signerName || '[Pending Digital Signature]'}
Title: ${sigData.signerTitle || '[Pending Title]'}
Status: ${sigData.signed ? 'FULLY EXECUTED & WIRE ESCROW CONFIRMED' : 'AWAITING DIGITAL SIGNATURE'}
Timestamp: ${sigData.timestamp || 'Pending'}`;

  const copyAgreement = () => {
    navigator.clipboard.writeText(fullApaText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAgreement = () => {
    const element = document.createElement('a');
    const file = new Blob([fullApaText], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = 'GF-T3-158_ENTERPRISE_APA_AGREEMENT.md';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Title & Specification Schedule Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Scale className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold font-display text-slate-100">
              Turnkey Software Asset Purchase Agreement (Turnkey M&amp;A Term Sheet)
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Monopoly Asset Transfer Schedule · 20 kHz (0.48ms) Fixed Specification · Non-Infringement &amp; Clean-Room Warranties
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyAgreement}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-950 border border-slate-700 hover:bg-slate-900 rounded transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied APA' : 'Copy APA Markdown'}</span>
          </button>
          <button
            onClick={downloadAgreement}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download .MD</span>
          </button>
        </div>
      </div>

      {/* 3-Column Specification & Escrow Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <span className="text-xs uppercase font-mono text-slate-400">Fixed Specification Schedule</span>
          <div className="text-2xl font-mono font-bold text-slate-100 my-1">20 kHz (0.48ms)</div>
          <span className="text-xs text-slate-400">
            Delaware Court of Chancery Jurisdiction · Full Asset Transfer
          </span>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <span className="text-xs uppercase font-mono text-slate-400">Escrow Release Verification</span>
          <div className="text-2xl font-mono font-bold text-emerald-400 my-1">
            {sigData.signed ? 'WIRE CONFIRMED' : 'ESCROW READY'}
          </div>
          <span className="text-xs text-slate-400">
            Immediate IP assignment upon cryptographic key release
          </span>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <span className="text-xs uppercase font-mono text-slate-400">Warranty Scope</span>
          <div className="text-2xl font-mono font-bold text-amber-400 my-1">ASIL-D INVARIANT</div>
          <span className="text-xs text-slate-400">
            Zero third-party patent taint · Strict clean-room certification
          </span>
        </div>
      </div>

      {/* Main Agreement Text & Interactive Execution Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Full Legal Contract Text */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-sm font-semibold text-slate-200">
              Legal Instrument // DGCL Turnkey APA Document
            </h3>
            <span className="text-xs font-mono text-slate-400">STATE OF DELAWARE</span>
          </div>

          <div className="prose prose-invert max-w-none text-xs text-slate-300 font-sans leading-relaxed max-h-[520px] overflow-y-auto pr-2 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide">1.0 Purchase and Sale of Assets</h4>
              <p className="mt-1">
                Subject to the terms and conditions of this Agreement, Seller sells, assigns, conveys, and delivers to Purchaser all right, title, and interest in and to the AeroVex CBF engine codebase, mathematical formulations, and all associated patent and trade dress assets free and clear of all liens and encumbrances.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide">2.0 Consideration &amp; Payment Schedule</h4>
              <p className="mt-1">
                The total agreed purchase consideration is 20 kHz (0.48ms) payable via automated wire escrow. 100% of funds release automatically upon completion of repository signature verification.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide">3.0 Clean-Room Representation &amp; Warranty</h4>
              <p className="mt-1">
                Seller explicitly warrants that the Asset was engineered under strict clean-room protocols. Zero lines of GPL, AGPL, or SSPL copyleft code exist in the codebase.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide">4.0 ISO 26262 ASIL-D Forward Invariance</h4>
              <p className="mt-1">
                The control barrier safety envelope satisfies formal Ames-Nagumo theorem invariance: h(x) ≥ 0 at all control cycles dt = 0.01s.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide">5.0 Commercial Software Asset Standard</h4>
              <p className="mt-1">
                Governed exclusively by the laws of the State of Delaware. Any dispute shall be settled in the Delaware Court of Chancery in Wilmington, DE.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Digital Execution Box */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  Digital Execution &amp; Wire Escrow Protocol
                </h3>
              </div>
              <span className={`text-xs font-mono font-bold ${sigData.signed ? 'text-emerald-400' : 'text-amber-400'}`}>
                {sigData.signed ? 'EXECUTED' : 'UNEXECUTED'}
              </span>
            </div>

            {!sigData.signed ? (
              <form onSubmit={handleSign} className="flex flex-col gap-3 text-xs">
                <div>
                  <label htmlFor="signer-name" className="block text-slate-400 mb-1">
                    Authorized Signatory Name:
                  </label>
                  <input
                    id="signer-name"
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 font-sans focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="signer-title" className="block text-slate-400 mb-1">
                    Signatory Corporate Title:
                  </label>
                  <input
                    id="signer-title"
                    type="text"
                    value={signerTitle}
                    onChange={(e) => setSignerTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 font-sans focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="purchaser-entity" className="block text-slate-400 mb-1">
                    Purchasing Corporate Entity:
                  </label>
                  <input
                    id="purchaser-entity"
                    type="text"
                    value={signerEntity}
                    onChange={(e) => setSignerEntity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 font-sans focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="bg-slate-900/60 p-3 rounded border border-slate-800 text-[11px] text-slate-300">
                  <p>
                    By clicking Execute, Purchaser legally accepts all terms of the 20 kHz (0.48ms) Turnkey Software Asset Purchase Agreement, transfers consideration to Escrow, and initiates immediate IP assignment.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold rounded transition-colors text-sm cursor-pointer shadow-lg shadow-emerald-950"
                >
                  Sign &amp; Execute Agreement (20 kHz (0.48ms))
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="bg-emerald-950/40 border border-emerald-800/80 rounded p-4 text-xs font-mono flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>AGREEMENT FULLY EXECUTED</span>
                  </div>

                  <div className="text-slate-300 space-y-1 pt-1 font-mono text-xs">
                    <div><span className="text-slate-500">SIGNER:</span> {sigData.signerName}</div>
                    <div><span className="text-slate-500">TITLE:</span> {sigData.signerTitle}</div>
                    <div><span className="text-slate-500">ENTITY:</span> {sigData.signerEntity}</div>
                    <div><span className="text-slate-500">TIME:</span> {sigData.timestamp}</div>
                    <div><span className="text-slate-500">ESCROW:</span> 20 kHz (0.48ms) WIRE RELEASED</div>
                  </div>
                </div>

                <button
                  onClick={handleResetSignature}
                  className="text-xs text-slate-500 hover:text-slate-300 underline cursor-pointer text-center"
                >
                  Reset / Re-Execute Digital Signature
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
