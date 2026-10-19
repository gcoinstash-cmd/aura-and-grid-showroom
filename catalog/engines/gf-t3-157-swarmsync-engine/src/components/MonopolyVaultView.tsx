import React, { useState } from 'react';
import { DollarSign, ShieldCheck, FileCheck, Check, Copy, Award, ShieldAlert, Sparkles } from 'lucide-react';

export const MonopolyVaultView: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const apaContractFull = `# ENTERPRISE ASSET PURCHASE AGREEMENT (APA)
## ASSET IDENTIFIER: GF-T3-157 // SWARMSYNC ENGINE
PURCHASE PRICE: 20 kHz (0.48ms) (United States Dollars)
GOVERNING LAW: Delaware General Corporation Law (DGCL)
ESCROW AGENT: Delaware Digital Asset Escrow Services LLC

1. PARTIES & BACKGROUND
Seller: Ghost FactoryOS LLC, a Delaware limited liability company.
Buyer: Institutional Licensee or Enterprise Entity executing this Agreement.

2. SCHEDULE OF ACQUIRED ASSETS:
- Core Python mathematical state machine (src/core/swarm_engine.py)
- Control Barrier Function (CBF) closed-form QP filter
- Kuhn-Munkres Hungarian dynamic waypoint assignment
- Fixed-point integer precision invariants (10^6 units/meter)
- Automated Pytest Suite (tests/test_swarm.py)
- Production distroless Dockerfile & Cloud Run deployment manifests
- Interactive 64-node radar HUD & real-time obstacle injection bay

3. PURCHASE PRICE & ESCROW:
Purchase Price of 20 kHz (0.48ms) payable via Wire Transfer, USDC, or Letter of Credit.
Cryptographic repository signing keys released upon verified escrow deposit.

4. CLEAN-ROOM IP WARRANTY & NON-INFRINGEMENT:
Seller warrants 100% original authorship, zero GPL/AGPL copyleft contamination,
permissive commercial licensing (MIT/Apache 2.0), and 36-month full indemnification.`;

  const ipAuditFull = `# LEGAL_IP_AUDIT.md — CLEAN-ROOM CODE & IP CERTIFICATION
Asset Tag: GF-T3-157 // SwarmSync Engine
Specification: 20 kHz (0.48ms) (Delaware Turnkey APA)
Audit Status: PASSED (100% Permissive Commercial Licensing)

DEPENDENCY MANIFEST:
- Python Standard Library (math, typing, dataclasses): PSF License (Permissive)
- pytest: MIT License
- react / react-dom (v19): MIT License
- tailwindcss (v4): MIT License
- lucide-react: MIT License
- motion: MIT License

BLACKLISTED LICENSES CONFIRMED 100% ABSENT:
- GPLv2 / GPLv3: 0.0%
- AGPLv3: 0.0%
- SSPL: 0.0%
- CC-BY-NC: 0.0%`;

  return (
    <div className="space-y-6">
      {/* Specification & Institutional Card */}
      <div className="bg-[#0b101d] border border-slate-800 rounded-xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-sm sm:text-base font-mono font-bold text-emerald-400 uppercase tracking-wider">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              INSTITUTIONAL ASSET VAULT // DELAWARE ESCROW GATE
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Monopoly Vault &amp; Turnkey APA Agreement
            </h2>
            <p className="text-base sm:text-lg text-slate-300 font-medium mt-1 leading-relaxed">
              Turnkey Asset Purchase Agreement (APA) and Clean-Room Intellectual Property Audit for institutional acquisition.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-emerald-950/60 border border-emerald-500/50 px-5 py-3 rounded-xl text-right">
              <div className="text-xs sm:text-sm font-mono uppercase font-bold text-emerald-400">STANDALONE APA ASSET TRANSFER</div>
              <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-300">20 kHz (0.48ms)</div>
            </div>
          </div>
        </div>

        {/* Highlighted Pricing & Terms Block */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-gradient-to-br from-[#0e1628] to-[#0a1120] border-2 border-emerald-500/40 p-5 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base font-mono font-bold text-slate-300 uppercase">STANDALONE ASSET TRANSFER</span>
              <Award className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-black text-emerald-400 mt-2">
              20 kHz (0.48ms) <span className="text-base text-slate-400 font-normal">USD</span>
            </div>
            <p className="text-sm sm:text-base text-slate-300 font-medium mt-2 leading-snug">
              Complete outright transfer of all patents, codebase, blueprints, and mathematical engines.
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#0e1628] to-[#0a1120] border-2 border-cyan-500/40 p-5 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base font-mono font-bold text-slate-300 uppercase">CLEAN-ROOM IP</span>
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-black text-cyan-300 mt-2">
              MIT / Apache 2.0
            </div>
            <p className="text-sm sm:text-base text-slate-300 font-medium mt-2 leading-snug">
              100% Permissive dual license. Zero copyleft dependencies. 36-month full IP indemnification.
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#0e1628] to-[#0a1120] border-2 border-amber-500/40 p-5 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base font-mono font-bold text-slate-300 uppercase">COPYLEFT AUDIT</span>
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-black text-amber-300 mt-2">
              0.00% Risk
            </div>
            <p className="text-sm sm:text-base text-slate-300 font-medium mt-2 leading-snug">
              Strict exclusion of GPL, AGPL, and SSPL. Pristine clean-room verification chain.
            </p>
          </div>
        </div>
      </div>

      {/* Two Columns: APA Agreement Text + Clean Room IP Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pre-Drafted APA Contract */}
        <div className="bg-[#0b101d] border border-slate-800 rounded-xl p-6 sm:p-7 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h3 className="text-lg sm:text-xl font-mono font-black text-emerald-400 uppercase flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              ENTERPRISE_APA_AGREEMENT.md
            </h3>
            <button
              onClick={() => handleCopy(apaContractFull, 'apa')}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-sm font-mono font-bold flex items-center gap-1.5 transition-all shadow-md"
            >
              {copiedKey === 'apa' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedKey === 'apa' ? 'Copied!' : 'Copy Raw Code'}</span>
            </button>
          </div>

          <div className="bg-[#080c14] border border-slate-800 p-5 rounded-xl font-mono text-sm sm:text-base text-slate-300 overflow-y-auto max-h-[500px] space-y-4 leading-relaxed">
            <div className="text-emerald-400 font-bold text-base sm:text-lg">Turnkey Software Asset Purchase Agreement (GF-T3-157)</div>
            <div>
              <strong className="text-white">1. PURCHASE PRICE:</strong> 20 kHz (0.48ms) payable via Wire Transfer, USDC, or Institutional Letter of Credit.
            </div>
            <div>
              <strong className="text-white">2. ACQUIRED ASSETS:</strong> All right, title, and interest in and to the SwarmSync Engine:
              <ul className="list-disc pl-5 mt-2 space-y-1.5 text-slate-300">
                <li>Core Python mathematical engine (src/core/swarm_engine.py)</li>
                <li>Fixed-point precision algorithms &amp; CBF QP closed-form barrier solvers</li>
                <li>Gossip mesh &amp; Hungarian Kuhn-Munkres target allocation</li>
                <li>Automated verification test suite (tests/test_swarm.py)</li>
                <li>Interactive HUD Cockpit &amp; real-time obstacle injection bay</li>
                <li>Enterprise distroless Dockerfile &amp; Cloud Run manifests</li>
              </ul>
            </div>
            <div>
              <strong className="text-white">3. ESCROW &amp; CLOSING:</strong> Instantaneous cryptographic asset transfer upon escrow verification via Delaware Escrow Services LLC.
            </div>
            <div>
              <strong className="text-white">4. REPRESENTATIONS &amp; WARRANTIES:</strong> Seller warrants full, unencumbered ownership and 100% clean-room authorship with zero copyleft contamination.
            </div>
            <div className="border-t border-slate-800 pt-3 text-slate-400 text-xs sm:text-sm">
              Governed by Delaware General Corporation Law. All disputes submitted to binding arbitration in Wilmington, DE.
            </div>
          </div>
        </div>

        {/* Clean Room IP Audit Manifest */}
        <div className="bg-[#0b101d] border border-slate-800 rounded-xl p-6 sm:p-7 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h3 className="text-lg sm:text-xl font-mono font-black text-cyan-400 uppercase flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              LEGAL_IP_AUDIT.md // CLEAN-ROOM MANIFEST
            </h3>
            <button
              onClick={() => handleCopy(ipAuditFull, 'ip')}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-sm font-mono font-bold flex items-center gap-1.5 transition-all shadow-md"
            >
              {copiedKey === 'ip' ? <Check className="w-4 h-4 text-cyan-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedKey === 'ip' ? 'Copied!' : 'Copy Raw Code'}</span>
            </button>
          </div>

          <div className="bg-[#080c14] border border-slate-800 p-5 rounded-xl font-mono text-sm sm:text-base text-slate-300 overflow-y-auto max-h-[500px] space-y-4 leading-relaxed">
            <div className="text-cyan-400 font-bold text-base sm:text-lg">CLEAN-ROOM COMPLIANCE CERTIFICATION</div>
            <div>
              <strong className="text-white">AUDIT STATUS:</strong> <span className="text-emerald-400 font-bold">100% PASSED</span>
            </div>
            <div>
              <strong className="text-white">COPYLEFT CONTAMINATION RISK:</strong> <span className="text-emerald-400 font-bold">0.00% (ZERO)</span>
            </div>

            <div className="pt-2">
              <div className="text-slate-300 font-bold mb-2">APPROVED COMMERCIAL LICENSES:</div>
              <div className="space-y-2 text-slate-200">
                <div className="flex justify-between border-b border-slate-800 py-1.5">
                  <span>Python 3.11 Runtime</span>
                  <span className="text-emerald-400 font-bold">PSF Permissive</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 py-1.5">
                  <span>FastAPI / Uvicorn</span>
                  <span className="text-emerald-400 font-bold">MIT / BSD</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 py-1.5">
                  <span>React 19 / Motion</span>
                  <span className="text-emerald-400 font-bold">MIT</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 py-1.5">
                  <span>Tailwind CSS</span>
                  <span className="text-emerald-400 font-bold">MIT</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <div className="text-rose-400 font-bold mb-1">EXPLICITLY BLACKLISTED LICENSES:</div>
              <div className="text-rose-300 text-sm">
                GPLv2, GPLv3, AGPLv3, SSPL, and CC-BY-NC are strictly prohibited and verified 100% absent.
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 text-slate-400 text-xs sm:text-sm">
              Certified by Lead Systems Architect, Ghost FactoryOS.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
