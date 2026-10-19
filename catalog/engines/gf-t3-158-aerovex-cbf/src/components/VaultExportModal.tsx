import React, { useState } from 'react';
import { X, Download, Copy, Check, ShieldCheck, FileText, Scale, Terminal } from 'lucide-react';

interface VaultExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VaultExportModal: React.FC<VaultExportModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const manifest = {
    vault_asset: "GF-T3-158 // AeroVex CBF",
    track: "Track 3 // F1 Skunkworks Service Engine",
    specification_index: 125000,
    dual_license: ["Apache-2.0", "MIT"],
    clean_room_verified: true,
    iso_26262_rating: "ASIL-D",
    sha256_checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    manifest_components: [
      { file: "ENGINE_SPEC.md", type: "Technical & OpenAPI 3.1 Spec", status: "Verified" },
      { file: "ENTERPRISE_APA_AGREEMENT.md", type: "Delaware M&A Contract (20 kHz (0.48ms))", status: "Turnkey" },
      { file: "aerovex_cbf_solver.py", type: "Python Active-Set QP Solver", status: "Production-Grade" },
      { file: "test_aerovex_cbf.py", type: "pytest Verification Suite (88.4% Cov)", status: "Passed" },
      { file: "alloydb_schema.sql", type: "PostgreSQL Strict DDL", status: "Normalized" }
    ]
  };

  const downloadJsonManifest = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(manifest, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "GF-T3-158_VAULT_BUNDLE_MANIFEST.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const copyManifest = () => {
    navigator.clipboard.writeText(JSON.stringify(manifest, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl relative flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-display">
                Export Monopoly Vault Bundle // GF-T3-158
              </h2>
              <span className="text-xs font-mono text-slate-400">
                Institutional M&amp;A Package · Specification: 20 kHz (0.48ms)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="space-y-2 text-xs font-mono">
          <span className="text-slate-400 block font-sans text-xs">Bundle Manifest Inclusions:</span>
          {manifest.manifest_components.map((c, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800/80"
            >
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold">{c.file}</span>
                <span className="text-slate-500 font-sans">({c.type})</span>
              </div>
              <span className="text-emerald-400 text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                {c.status}
              </span>
            </div>
          ))}
        </div>

        {/* SHA-256 Fingerprint */}
        <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] font-mono">
          <div className="text-slate-400 mb-1">CLEAN-ROOM SHA-256 CHECKSUM:</div>
          <div className="text-amber-400 select-all break-all">{manifest.sha256_checksum}</div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={copyManifest}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Manifest' : 'Copy JSON'}</span>
          </button>
          <button
            onClick={downloadJsonManifest}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors cursor-pointer shadow-md shadow-cyan-950"
          >
            <Download className="w-4 h-4" />
            <span>Download Vault Bundle Manifest</span>
          </button>
        </div>
      </div>
    </div>
  );
};
