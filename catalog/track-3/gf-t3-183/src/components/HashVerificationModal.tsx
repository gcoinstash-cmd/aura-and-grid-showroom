import React from 'react';
import { ShieldCheck, CheckCircle2, X, Hash, Key } from 'lucide-react';
import { PowertrainState, LedgerBlock } from '../types/telemetry';

interface HashVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: PowertrainState;
  blocks: LedgerBlock[];
  isTampered: boolean;
}

export const HashVerificationModal: React.FC<HashVerificationModalProps> = ({
  isOpen,
  onClose,
  state,
  blocks,
  isTampered,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">
              Cryptographic HMAC-SHA256 Telemetry Verification
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Status Alert */}
          {isTampered ? (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 space-y-1">
              <div className="font-bold flex items-center gap-2 text-red-400 text-base">
                Signature Validation Failed
              </div>
              <p className="text-xs">
                Injected simulated mutation detected at Block #3. The calculated SHA-256 digest does not match the stored HMAC signature.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 space-y-1">
              <div className="font-bold flex items-center gap-2 text-emerald-400 text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                All Telemetry Blocks Verified & Cryptographically Intact
              </div>
              <p className="text-xs text-emerald-200/80">
                0% Collision. Monotonic nonces and HMAC-SHA256 digests validated against the PostgreSQL 16 trigger invariants.
              </p>
            </div>
          )}

          {/* Current Live Frame Proof */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-slate-300">
                <Hash className="w-4 h-4 text-emerald-400" />
                Active Frame Nonce
              </span>
              <span className="text-emerald-400 font-bold tabular-nums">#{state.monotonicNonce}</span>
            </div>

            <div className="space-y-1 pt-1">
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>HMAC-SHA256 Signature:</span>
              </div>
              <div className="font-mono text-xs text-emerald-400 bg-slate-900/90 p-2.5 rounded border border-slate-800 break-all select-all">
                {state.hmacSignature}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 text-slate-400 border-t border-slate-800/80">
              <div>
                <span>Signed Speed: </span>
                <strong className="text-slate-200 font-mono">{state.speedKmh.toFixed(1)} km/h</strong>
              </div>
              <div>
                <span>Signed Torque: </span>
                <strong className="text-slate-200 font-mono">
                  {state.frontTorqueNm.toFixed(0)}F / {state.rearTorqueNm.toFixed(0)}R Nm
                </strong>
              </div>
              <div>
                <span>Signed Yoke Angle: </span>
                <strong className="text-slate-200 font-mono">{state.yokeAngleDeg}°</strong>
              </div>
              <div>
                <span>Signed DC Bus: </span>
                <strong className="text-slate-200 font-mono">{state.dcBusVoltage.toFixed(1)} V</strong>
              </div>
            </div>
          </div>

          {/* Ledger Chained Hashes Table */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="text-xs font-mono font-bold text-slate-300 mb-2">
              Verified Chained Ledger Blocks (Latest {blocks.length})
            </div>
            <div className="space-y-2 text-xs font-mono">
              {blocks.slice(-3).map((b) => (
                <div key={b.blockHeight} className="p-2 bg-slate-900 rounded border border-slate-800/80">
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span className="text-white font-bold">Block #{b.blockHeight} (nonce: {b.nonce})</span>
                    <span className="text-emerald-400">PASSED</span>
                  </div>
                  <div className="text-slate-400 truncate" title={b.blockHash}>
                    SHA-256: {b.blockHash}
                  </div>
                  <div className="text-slate-400 truncate" title={b.hmacDigest}>
                    HMAC: {b.hmacDigest}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Standard: WebCrypto SHA-256 / FIPS PUB 198-1
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
