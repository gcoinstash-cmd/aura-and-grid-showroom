import React, { useEffect, useState } from 'react';
import { X, Briefcase, Download, ShieldCheck, CheckCircle2, Copy, Check } from 'lucide-react';
import { APA_AGREEMENT_MARKDOWN } from '../../data/codeSnippets';

interface ApaContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportSpec: () => void;
}

export const ApaContractModal: React.FC<ApaContractModalProps> = ({
  isOpen,
  onClose,
  onExportSpec,
}) => {
  const [copiedAgreement, setCopiedAgreement] = useState(false);
  const [signedState, setSignedState] = useState(false);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(APA_AGREEMENT_MARKDOWN);
    setCopiedAgreement(true);
    setTimeout(() => setCopiedAgreement(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-700 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-neutral-100 my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-right close button (✕) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Modal"
          className="absolute top-6 right-6 p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div className="pr-12">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded bg-amber-500/10 text-amber-400 font-mono font-bold text-base border border-amber-500/30">
              Acquire.com Verified Micro-APA
            </span>
            <span className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-base border border-emerald-500/30">
              20 kHz (0.48ms) / PostgreSQL 16 + RLS Asset Transfer
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-white">
            Asset Purchase Agreement (APA) & IP Assignment
          </h2>
          <p className="text-base text-neutral-300 mt-2">
            GF-T3-177 turnkey legal covenant, Exhibit A Intellectual Property Assignment Schedule, Bill of Sale, and clean-room non-infringement warranties.
          </p>
        </div>

        {/* Contract Text Body */}
        <div className="flex-1 overflow-y-auto p-5 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-base leading-relaxed text-neutral-200">
          <pre className="whitespace-pre-wrap font-sans">
            {APA_AGREEMENT_MARKDOWN}
          </pre>
        </div>

        {/* Action Controls & Digital Signature Simulation */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-neutral-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-base font-semibold transition-colors cursor-pointer"
            >
              {copiedAgreement ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-neutral-400" />}
              <span>{copiedAgreement ? 'Copied APA Text!' : 'Copy Agreement Text'}</span>
            </button>

            <button
              type="button"
              onClick={onExportSpec}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-base font-bold transition-colors cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Download Master Spec (.md)</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSignedState(!signedState)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-bold transition-colors cursor-pointer ${
                signedState
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{signedState ? 'Buyer Signature Validated ✓' : 'Simulate Buyer Digital Signing'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-base transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
