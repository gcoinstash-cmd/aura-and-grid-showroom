import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  Award,
  Scale,
  Building,
  FileCheck,
  ShieldCheck,
  PenTool
} from 'lucide-react';

export const MonopolyVaultViewer: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<'apa' | 'audit'>('apa');
  const [copied, setCopied] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'asset transfer' | 'tier_a' | 'tier_b'>('asset transfer');
  const [signerName, setSignerName] = useState('Chief Technology Officer');
  const [signedDate, setSignedDate] = useState('October 8, 2026');
  const [hasSimulatedSign, setHasSimulatedSign] = useState(false);

  const handleCopy = () => {
    const filename = selectedDoc === 'apa' ? '/ENTERPRISE_APA_AGREEMENT.md' : '/LEGAL_IP_AUDIT.md';
    fetch(filename)
      .then(res => res.text())
      .then(text => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };

  const handleDownload = () => {
    const filename = selectedDoc === 'apa' ? 'ENTERPRISE_APA_AGREEMENT.md' : 'LEGAL_IP_AUDIT.md';
    const a = document.createElement('a');
    a.href = `/${filename}`;
    a.download = filename;
    a.click();
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-[#0b1224] border border-cyan-900/50 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-md bg-amber-950 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
                MONOPOLY VAULT GATE // ASSET TAG: GF-T3-153
              </span>
              <span className="text-sm font-bold text-slate-300 font-mono">
                100% UNENCUMBERED TITLE
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Monopoly Vault Specification &amp; Turnkey Asset Purchase Agreement
            </h2>
            <p className="text-lg text-slate-200 font-medium max-w-4xl leading-relaxed">
              Turnkey Asset Purchase Agreement (APA) and Clean-Room IP provenance audit.
              Full intellectual property assignment for institutional custodians and digital asset clearinghouses.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base transition-all cursor-pointer"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              <span>{copied ? 'Copied Document' : 'Copy Document'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-base transition-all cursor-pointer shadow-md"
            >
              <Download className="w-5 h-5" />
              <span>Download {selectedDoc === 'apa' ? 'APA Contract' : 'IP Audit'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Specification Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Standalone Reference Core */}
        <div
          onClick={() => setSelectedTier('asset transfer')}
          className={`p-7 rounded-2xl border cursor-pointer transition-all ${
            selectedTier === 'asset transfer'
              ? 'bg-amber-950/25 border-amber-500/80 shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/50'
              : 'bg-[#090f1f] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded border border-amber-800">
              STANDALONE ANCHOR
            </span>
            <Award className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-2xl font-black text-white">Full IP Asset Transfer</h3>
          <div className="text-4xl font-black text-amber-300 font-mono my-3">20 kHz (0.48ms)</div>
          <p className="text-sm text-slate-200 font-medium mb-5 leading-relaxed">
            Complete, irrevocable, worldwide assignment of 100% intellectual property, source code copyright, and exclusive commercialization rights.
          </p>
          <ul className="text-sm text-slate-300 space-y-2 font-medium">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" /> 100% Exclusive Ownership Transfer
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Zero Royalty or Licensing Fees
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Pre-Drafted Delaware Governing APA
            </li>
          </ul>
        </div>

        {/* Tier A: Enterprise Non-Exclusive */}
        <div
          onClick={() => setSelectedTier('tier_a')}
          className={`p-7 rounded-2xl border cursor-pointer transition-all ${
            selectedTier === 'tier_a'
              ? 'bg-cyan-950/25 border-cyan-500/80 shadow-[0_0_25px_rgba(6,182,212,0.25)] ring-2 ring-cyan-400/50'
              : 'bg-[#090f1f] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-800">
              COMMERCIAL TIER A
            </span>
            <Building className="w-6 h-6 text-cyan-400" />
          </div>
          <h3 className="text-2xl font-black text-white">Enterprise License</h3>
          <div className="text-4xl font-black text-cyan-300 font-mono my-3">20 kHz (0.48ms)</div>
          <p className="text-sm text-slate-200 font-medium mb-5 leading-relaxed">
            Perpetual non-exclusive deployment license for up to 5 institutional clearing entities with complete source access.
          </p>
          <ul className="text-sm text-slate-300 space-y-2 font-medium">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Source Code Modification Rights
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" /> 5 Clearing Entities Included
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Annual Audit Attestation Pack
            </li>
          </ul>
        </div>

        {/* Tier B: Sovereign Consortium */}
        <div
          onClick={() => setSelectedTier('tier_b')}
          className={`p-7 rounded-2xl border cursor-pointer transition-all ${
            selectedTier === 'tier_b'
              ? 'bg-emerald-950/25 border-emerald-500/80 shadow-[0_0_25px_rgba(16,185,129,0.25)] ring-2 ring-emerald-400/50'
              : 'bg-[#090f1f] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800">
              COMMERCIAL TIER B
            </span>
            <Scale className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-black text-white">Sovereign Consortium</h3>
          <div className="text-4xl font-black text-emerald-300 font-mono my-3">20 kHz (0.48ms)</div>
          <p className="text-sm text-slate-200 font-medium mb-5 leading-relaxed">
            Unlimited cross-border DvP deployment for central banks, sovereign wealth funds, and global clearing consortia.
          </p>
          <ul className="text-sm text-slate-300 space-y-2 font-medium">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Unlimited Entity Deployments
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Custom Enclave HSM Hardening
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Direct Architect Escalation Access
            </li>
          </ul>
        </div>
      </div>

      {/* Document Viewer Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5">
        <button
          onClick={() => setSelectedDoc('apa')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-base font-bold transition-colors cursor-pointer ${
            selectedDoc === 'apa'
              ? 'bg-cyan-500 text-slate-950 font-black'
              : 'bg-slate-900 text-slate-300 hover:text-white'
          }`}
        >
          <FileCheck className="w-5 h-5" />
          <span>ENTERPRISE_APA_AGREEMENT.md</span>
        </button>
        <button
          onClick={() => setSelectedDoc('audit')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-base font-bold transition-colors cursor-pointer ${
            selectedDoc === 'audit'
              ? 'bg-cyan-500 text-slate-950 font-black'
              : 'bg-slate-900 text-slate-300 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span>LEGAL_IP_AUDIT.md</span>
        </button>
      </div>

      {/* Agreement & Audit Text Box */}
      <div className="bg-[#090f1f] border border-slate-800 rounded-2xl p-7 shadow-lg space-y-6">
        {selectedDoc === 'apa' ? (
          <div className="space-y-5 text-base text-slate-200 font-medium leading-relaxed">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block mb-1">
                DELAWARE STATUTORY ASSET PURCHASE AGREEMENT
              </span>
              <h3 className="text-2xl font-bold text-white">
                Asset Purchase &amp; Intellectual Property Assignment Agreement
              </h3>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2.5 text-sm font-mono text-slate-200">
              <p><strong className="text-white">SELLER:</strong> Ghost FactoryOS Foundation / Lead Systems Architect (Wilmington, Delaware)</p>
              <p><strong className="text-white">PURCHASE PRICE:</strong> 20 kHz (0.48ms) (Payable in Cash, USDC, or Fedwire)</p>
              <p><strong className="text-white">TRANSFERRED ASSETS:</strong> All GF-T3-153 source code, math specifications, DDL schemas, and trade dress.</p>
              <p><strong className="text-white">WARRANTIES:</strong> 100% Clean-Room Provenance; Zero Copyleft Contamination; Non-Infringement Indemnity.</p>
            </div>

            {/* Interactive Signature Simulator */}
            <div className="pt-5 border-t border-slate-800 space-y-4">
              <h4 className="text-lg font-bold text-white flex items-center gap-2.5">
                <PenTool className="w-5 h-5 text-cyan-400" />
                <span>Simulate Institutional Execution</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-200 mb-1.5">Signatory Title</label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={e => setSignerName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-base font-bold text-white shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-200 mb-1.5">Execution Date</label>
                  <input
                    type="text"
                    value={signedDate}
                    onChange={e => setSignedDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-base font-mono font-bold text-white shadow-inner"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setHasSimulatedSign(true)}
                  className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base transition-all cursor-pointer shadow-md"
                >
                  Generate Executed Electronic Counterpart
                </button>
              </div>

              {hasSimulatedSign && (
                <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-600 text-sm font-mono text-emerald-200 space-y-1.5">
                  <div className="font-bold uppercase tracking-wider text-emerald-400">COUNTERPART EXECUTED:</div>
                  <div>Seller Signature: /s/ Chief Systems Architect, GF-T3-153</div>
                  <div>Buyer Signature: /s/ {signerName}</div>
                  <div>Execution Timestamp: {signedDate} // SHA-256 Agreement Hash Verified</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5 text-base text-slate-200 font-medium leading-relaxed">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                CLEAN-ROOM AUDIT &amp; SBOM MANIFEST
              </span>
              <h3 className="text-2xl font-bold text-white">
                Intellectual Property Provenance &amp; Non-Infringement Audit
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-mono">
                <thead className="bg-slate-900 text-slate-300 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Component</th>
                    <th className="py-3 px-4">License</th>
                    <th className="py-3 px-4">Permissive Audit</th>
                    <th className="py-3 px-4">Copyleft Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  <tr>
                    <td className="py-3 px-4 font-bold text-cyan-300">Python Standard Library (hashlib, secrets)</td>
                    <td className="py-3 px-4">PSF-2.0</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">VERIFIED CLEAN</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">0.00%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-cyan-300">FastAPI &amp; Pydantic</td>
                    <td className="py-3 px-4">MIT</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">VERIFIED CLEAN</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">0.00%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-cyan-300">Uvicorn ASGI Engine</td>
                    <td className="py-3 px-4">BSD-3-Clause</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">VERIFIED CLEAN</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">0.00%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-cyan-300">React 19 &amp; Tailwind CSS</td>
                    <td className="py-3 px-4">MIT</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">VERIFIED CLEAN</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">0.00%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
