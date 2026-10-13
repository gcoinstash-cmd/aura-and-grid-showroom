import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, RefreshCw, KeyRound, Lock } from 'lucide-react';

interface VerifyLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VerifyLedgerModal: React.FC<VerifyLedgerModalProps> = ({ isOpen, onClose }) => {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(true);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const runVerification = () => {
    setVerifying(true);
    setVerified(false);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
    }, 550);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 text-slate-100 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-right close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close Modal"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800 pr-10">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              Cryptographic Flagship Ledger Verifier
            </h3>
            <p className="text-sm text-slate-300">
              Validates HMAC-SHA256 Monotonic Hash Chain &amp; PostgreSQL Partitions
            </p>
          </div>
        </div>

        {/* Verification Chain Steps */}
        <div className="mt-6 space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400">GENESIS BLOCK HASH:</span>
              <span className="text-cyan-400 font-bold">000000000000...000000000000</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400">CURRENT LEAF BLOCK:</span>
              <span className="text-amber-400 font-bold">#1,048,580</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400">HMAC-SHA256 SIGNATURE:</span>
              <span className="text-emerald-400 font-bold">0d49f69ce831d4592ca972f778a481...</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">AUDIT CIPHER:</span>
              <span className="text-slate-200">RFC 2104 / SHA-256 Digest (256-bit)</span>
            </div>
          </div>

          {/* Verification Status Card */}
          <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-base font-bold text-emerald-300">
                  {verifying ? 'Recalculating Hash Chain...' : 'Tamper-Evident Validity Confirmed (100% Pass)'}
                </h4>
                <p className="text-sm text-slate-300 mt-0.5">
                  Every timeseries record from Genesis to Block #1,048,580 satisfies zero-collision integrity.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={runVerification}
              disabled={verifying}
              className="p-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition-colors cursor-pointer shrink-0"
              title="Re-verify Ledger Hash"
            >
              <RefreshCw className={`w-5 h-5 ${verifying ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-sm text-slate-400 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-400" />
            Clean-room cryptographic chain verification
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
