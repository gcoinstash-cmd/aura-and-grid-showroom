import React, { useState } from 'react';
import { X, Download, Copy, Check, FileText } from 'lucide-react';
import { GF_T3_169_SPEC_MARKDOWN } from '../data/specDocument';

interface SpecExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export const SpecExportModal: React.FC<SpecExportModalProps> = ({
  isOpen,
  onClose,
  onDownload,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(GF_T3_169_SPEC_MARKDOWN);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="flex items-start justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-slate-400 font-semibold text-sm">Monopoly Vault 70% Master Blueprint</span>
              <span className="px-2.5 py-0.5 rounded bg-rose-950 border border-rose-700 text-rose-300 text-sm font-semibold">
                GF_T3_169_SPEC.md
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-100">
              Institutional Technical & Legal Vault Archival Package
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <span className="text-sm text-slate-400">
            Complete zero-placeholder markdown specification for Deterministic Production Pipeline autonomous code generation.
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy All'}</span>
            </button>
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold transition-all cursor-pointer shadow-lg shadow-rose-950/50"
            >
              <Download className="w-4 h-4" />
              <span>Download GF_T3_169_SPEC.md</span>
            </button>
          </div>
        </div>

        {/* Markdown Preview Box */}
        <div className="rounded-xl bg-slate-950 p-6 border border-slate-800 font-mono text-sm overflow-x-auto text-slate-300 leading-relaxed max-h-[60vh]">
          <pre className="whitespace-pre-wrap">{GF_T3_169_SPEC_MARKDOWN}</pre>
        </div>
      </div>
    </div>
  );
};
