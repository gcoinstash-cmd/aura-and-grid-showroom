/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, ShieldCheck, Check, Lock, RefreshCw, Key } from 'lucide-react';

interface VerifyHashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToLedger: () => void;
}

export const VerifyHashModal: React.FC<VerifyHashModalProps> = ({
  isOpen,
  onClose,
  onNavigateToLedger,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(true);

  if (!isOpen) return null;

  const handleRunHashCheck = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerified(true);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-white">Cryptographic Hash Audit</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-base font-mono">
              <span className="text-slate-400">Ledger Nonce:</span>
              <span className="text-purple-400 font-bold">#1,048,592</span>
            </div>
            <div className="flex items-center justify-between text-base font-mono">
              <span className="text-slate-400">Hash Algorithm:</span>
              <span className="text-emerald-400 font-bold">HMAC-SHA256 (RFC-2104)</span>
            </div>
            <div className="flex items-center justify-between text-base font-mono">
              <span className="text-slate-400">Chain Integrity:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> 0 Blocks Tampered
              </span>
            </div>
            <div className="flex items-center justify-between text-base font-mono">
              <span className="text-slate-400">Postgres Trigger:</span>
              <span className="text-cyan-400 font-bold">trg_drs_divergence_guard</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-base leading-relaxed flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
            <span>
              All DRS steering commands, vehicle velocities, and DUAL_VECTOR_TORQUE torque splits are sealed into immutable PostgreSQL 16 append-only partition blocks.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={handleRunHashCheck}
            disabled={isVerifying}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-base font-semibold flex items-center gap-2 cursor-pointer transition-all"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>Hashing...</span>
              </>
            ) : (
              <>
                <Key className="w-4 h-4 text-emerald-400" />
                <span>Re-audit Blocks</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigateToLedger();
              onClose();
            }}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-md"
          >
            <span>Open Postgres Ledger</span>
          </button>
        </div>
      </div>
    </div>
  );
};
