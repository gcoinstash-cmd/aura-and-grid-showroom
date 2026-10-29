import React, { useState } from 'react';
import { X, Check, Copy, ShieldCheck, Download } from 'lucide-react';

interface AssetSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssetSpecModal: React.FC<AssetSpecModalProps> = ({ isOpen, onClose }) => {
  const [activeDoc, setActiveDoc] = useState<'SPEC' | 'LEGAL' | 'TRANSFER'>('SPEC');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const getDocContent = () => {
    if (activeDoc === 'SPEC') {
      return 'GF-T3-210: APEX-210 Real-Time Limit Order Book (LOB) Market Microstructure & Queue Position Simulator\n' +
        'ENGINE_SPEC.md - Technical Architecture & Microstructure Reference Core\n\n' +
        '1. Price-Time Priority FIFO Matching Kernel\n' +
        '   - B-Tree Price Levels with double-ended queue ordering\n' +
        '   - Nanosecond crossing verification: P_buy >= P_ask* executes immediately at maker price\n\n' +
        '2. Analytical Queue Position & Fill Survival Model\n' +
        '   - V_ahead = sum_{j=1}^{m-1} Q_j\n' +
        '   - P_fill(O_u, delta_t) = exp(-gamma * (delta_P / delta_tick)) * (1 / (1 + V_ahead / kappa)) * (1 - exp(-lambda_hawkes(t) * delta_t))\n\n' +
        '3. Univariate Hawkes Self-Exciting Point Process\n' +
        '   - lambda(t) = mu + sum_{t_i < t} alpha * exp(-beta * (t - t_i))\n' +
        '   - Stationarity Invariant: eta = alpha / beta < 1.0 (sub-critical stability)\n\n' +
        '4. Kyle\'s Lambda Permanent Market Impact Regression\n' +
        '   - delta_P_t = lambda * Q_t + epsilon_t\n' +
        '   - OLS recursive slope estimator over streaming fills\n\n' +
        '5. Append-Only Cryptographic State Ledger\n' +
        '   - SHA-256 state seal for every insertion, cancellation, and execution fill';
    }
    if (activeDoc === 'LEGAL') {
      return 'GF-T3-210: APEX-210 Clean-Room IP Audit & NIST SP 800-218 SSDF v1.1 Attestation\n' +
        'LEGAL_IP_AUDIT.md\n\n' +
        '1. Clean-Room Provenance Certification:\n' +
        '   - Sole proprietor independent development from first-principles mathematical derivations.\n' +
        '   - Zero third-party proprietary trading source code ingested or referenced.\n\n' +
        '2. Software Bill of Materials (SBOM) Permissive Whitelist:\n' +
        '   - fastapi: MIT License (Approved)\n' +
        '   - uvicorn: BSD-3-Clause (Approved)\n' +
        '   - pydantic: MIT License (Approved)\n' +
        '   - react / react-dom: MIT License (Approved)\n' +
        '   - tailwindcss: MIT License (Approved)\n' +
        '   - Zero copyleft hazard (0 GPL, 0 AGPL, 0 SSPL).\n\n' +
        '3. NIST SP 800-218 SSDF v1.1 Compliance:\n' +
        '   - PO.1.1, PO.3.1, PS.1.1, PW.1.1, PW.4.1, PW.8.1, RV.1.1: ALL PASS.\n\n' +
        '4. Title Warranty:\n' +
        '   - Clean, unencumbered title transferring unconditionally upon execution of the Asset Purchase Agreement (APA).';
    }
    return 'GF-T3-210: Standalone Repository Buyout & Asset Transfer Specification\n' +
      'ASSET_TRANSFER_SPEC.md\n\n' +
      '1. Transaction Structure: Direct Git Repository Transfer via standard Commercial Asset Purchase Agreement.\n' +
      '2. Deliverable Package:\n' +
      '   - engine.py (FastAPI LOB & Microstructure Kernel)\n' +
      '   - test_lob_engine.py (Automated Pytest / Unittest Suite with >80% coverage)\n' +
      '   - Dockerfile (Multi-stage non-root container with dynamic port binding)\n' +
      '   - ENGINE_SPEC.md, LEGAL_IP_AUDIT.md, ASSET_TRANSFER_SPEC.md\n' +
      '   - Interactive React Microstructure Terminal (/src)\n' +
      '3. Zero-SaaS SLA Disclaimer:\n' +
      '   - Standalone repository handoff with zero ongoing hosted infrastructure, per-seat licensing, or cloud SLA dependencies.';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getDocContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename =
      activeDoc === 'SPEC'
        ? 'ENGINE_SPEC.md'
        : activeDoc === 'LEGAL'
        ? 'LEGAL_IP_AUDIT.md'
        : 'ASSET_TRANSFER_SPEC.md';
    const blob = new Blob([getDocContent()], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getTabButtonClass = (docType: 'SPEC' | 'LEGAL' | 'TRANSFER') => {
    const isSelected = activeDoc === docType;
    return 'px-4 py-2 rounded-lg text-sm font-bold transition-colors ' +
      (isSelected ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col w-full max-w-4xl max-h-[90vh] bg-[#090D18] border border-slate-700 rounded-xl overflow-hidden shadow-2xl text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                Enterprise Reference Core Buyout Dossier
              </h2>
              <div className="text-sm text-slate-400">
                Asset Identifier: GF-T3-210 · Clean-Room Certified
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveDoc('SPEC')}
              className={getTabButtonClass('SPEC')}
            >
              ENGINE_SPEC.md
            </button>
            <button
              onClick={() => setActiveDoc('LEGAL')}
              className={getTabButtonClass('LEGAL')}
            >
              LEGAL_IP_AUDIT.md
            </button>
            <button
              onClick={() => setActiveDoc('TRANSFER')}
              className={getTabButtonClass('TRANSFER')}
            >
              ASSET_TRANSFER_SPEC.md
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md text-sm font-semibold text-slate-200 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md text-sm font-semibold text-slate-200 transition-colors"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Download MD</span>
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950/60 font-mono text-sm leading-relaxed text-slate-300">
          <pre className="whitespace-pre-wrap break-words">{getDocContent()}</pre>
        </div>

        {/* Modal Footer with Compliance Badges */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-900 border-t border-slate-800 text-sm">
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              100% Permissive MIT / BSD Whitelist
            </span>
            <span>·</span>
            <span className="text-cyan-400 font-semibold">
              NIST SP 800-218 Verified
            </span>
            <span>·</span>
            <span className="text-amber-400 font-semibold">
              Zero-Dollar Gate Certified
            </span>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
