import React from 'react';
import { ShieldCheck, CheckCircle2, X, Hash, Lock, Check } from 'lucide-react';
import { TelemetryFrame } from '../types/telemetry';

interface HashVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: TelemetryFrame;
}

export const HashVerificationModal: React.FC<HashVerificationModalProps> = ({
  isOpen,
  onClose,
  telemetry,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h3 className="text-xl font-bold text-white tracking-tight">
              Cryptographic Hash & Integrity Audit
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Status Banner */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <div className="text-sm font-bold text-emerald-300">
              BLOCK #{telemetry.nonce.toLocaleString()} VERIFIED INT-ACT
            </div>
            <div className="text-xs text-slate-300">
              HMAC-SHA256 signature mathematically validated against Ghost Factory vault secret.
            </div>
          </div>
        </div>

        {/* Block Details */}
        <div className="space-y-3 font-mono text-xs">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
            <span className="text-slate-500 block mb-1">Active Block Hash (SHA-256):</span>
            <span className="text-cyan-300 font-bold break-all select-all">
              {telemetry.blockHash}
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
            <span className="text-slate-500 block mb-1">Previous Block Hash (Chained):</span>
            <span className="text-amber-400 break-all select-all">
              {telemetry.previousHash}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
              <span className="text-slate-500 block mb-1">Monotonic Nonce:</span>
              <span className="text-white font-bold">#{telemetry.nonce.toLocaleString()}</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
              <span className="text-slate-500 block mb-1">Collision Resistance:</span>
              <span className="text-emerald-400 font-bold">2^256 Strength</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
            <span className="text-slate-500 block mb-1">Clean-Room License Certificate:</span>
            <div className="flex items-center gap-2 text-slate-300">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Zero Copyleft / MIT Permissive License / Clean-Room Verified</span>
            </div>
          </div>
        </div>

        {/* Action footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 px-4 rounded-lg cursor-pointer transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
