import React from 'react';
import { ShieldCheck, X, CheckCircle2, Hash, Lock, AlertTriangle } from 'lucide-react';
import { LedgerBlock } from '../types/telemetry';

interface VerifyHashModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: LedgerBlock[];
}

export const VerifyHashModal: React.FC<VerifyHashModalProps> = ({
  isOpen,
  onClose,
  blocks,
}) => {
  if (!isOpen) return null;

  const hasCorruptedBlock = blocks.some((b) => b.tampered);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                Cryptographic HMAC-SHA256 Verification
              </h3>
              <p className="text-slate-400 text-base">
                Verifying monotonic telemetry chain for GF-T3-194 Apex Executive Ultra-Heavy Telemetry Core
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Status Card */}
        <div
          className={`p-4 rounded-xl border mb-4 ${
            hasCorruptedBlock
              ? 'bg-red-950/40 border-red-500/80 text-red-300'
              : 'bg-emerald-950/40 border-emerald-500/80 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-base">
            {hasCorruptedBlock ? (
              <>
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <span>INTEGRITY FAILURE: Malicious tampering detected in ledger history!</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>INTEGRITY CERTIFIED: 100% Cryptographic Match Across All Ledger Blocks</span>
              </>
            )}
          </div>
          <p className="text-slate-300 text-base mt-1">
            {hasCorruptedBlock
              ? 'A previous block payload was altered, causing hash mismatch against its stored HMAC signature.'
              : 'All blocks possess strictly monotonic nonces, valid parent hashes, and authentic HMAC-SHA256 signatures.'}
          </p>
        </div>

        {/* Detailed Blocks List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {blocks.map((block) => (
            <div
              key={block.blockIndex}
              className={`p-3 rounded-lg border text-base font-mono ${
                block.tampered
                  ? 'bg-red-950/30 border-red-500/70'
                  : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-slate-300 pb-1 mb-1 border-b border-slate-800/80">
                <span className="font-bold text-indigo-400 flex items-center gap-1">
                  <Hash className="w-4 h-4" />
                  Block #{block.blockIndex} (Nonce #{block.nonce})
                </span>
                <span className="text-slate-400">{block.timestamp}</span>
              </div>
              <div className="text-slate-400 text-base truncate">
                Parent: {block.prevHash}
              </div>
              <div className="text-emerald-400 text-base font-bold truncate flex items-center justify-between mt-1">
                <span className="truncate">HMAC: {block.hmacSignature}</span>
                <span className={`px-2 py-0.5 rounded text-base shrink-0 ml-2 ${block.tampered ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {block.tampered ? 'MISMATCH' : 'MATCH (256-bit)'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-slate-400 text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            Clean-Room Institutional Audit Vault Verified
          </div>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-base px-5 py-2 rounded-lg cursor-pointer transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
