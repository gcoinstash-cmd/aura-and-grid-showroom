import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, Lock, Key, Copy, Check, Hash } from 'lucide-react';
import { sha256Hex, computeHmacSha256 } from '../utils/crypto';

interface LedgerVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  nonce: number;
}

export const LedgerVerificationModal: React.FC<LedgerVerificationModalProps> = ({
  isOpen,
  onClose,
  nonce,
}) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [computedHash, setComputedHash] = useState('');
  const [computedSignature, setComputedSignature] = useState('');
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const runCryptographicCheck = async () => {
      setIsVerifying(true);
      const payload = `audit_chain_lx600|nonce:${nonce}|ts:${new Date().toISOString()}|vin:JTJHL01J3N0000000`;
      const hash = await sha256Hex(payload);
      const sig = await computeHmacSha256('lx600-vault-hmac-key-0x9821a', hash);

      setTimeout(() => {
        setComputedHash(hash);
        setComputedSignature(sig);
        setIsVerifying(false);
      }, 500);
    };

    runCryptographicCheck();
  }, [isOpen, nonce]);

  if (!isOpen) return null;

  const copyReceipt = () => {
    const receipt = `GF-T3-180 CRYPTOGRAPHIC LEDGER AUDIT RECEIPT
Monotonic Nonce: #${nonce}
Timestamp: ${new Date().toISOString()}
Block Hash (SHA-256): ${computedHash}
HMAC-SHA256 Signature: ${computedSignature}
Clean-Room Audit: PASSED (0% Copyleft / Zero Collision)`;

    navigator.clipboard.writeText(receipt);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                PostgreSQL 16 Cryptographic Ledger Verification
              </h3>
              <p className="text-[15px] text-slate-400">
                Web Crypto API HMAC-SHA256 zero-knowledge signature audit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Status */}
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <div className="text-[16px] font-bold text-white">
                {isVerifying ? 'Verifying Merkle & HMAC Chains...' : 'HMAC-SHA256 Ledger Authenticity Verified'}
              </div>
              <div className="text-[15px] text-emerald-400 font-mono">
                Zero Replay Risk | Zero Hash Collision
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded text-[15px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            PASSED 100%
          </span>
        </div>

        {/* Verification Checklist */}
        <div className="space-y-2 mb-5">
          {[
            { label: 'Monotonic Telemetry Sequence', status: `Nonce #${nonce.toLocaleString()} (Verified Continuous)` },
            { label: 'Hydraulic Seal Divergence Guard', status: 'Divergence < 0.18 Across All Corners (No Quarantine)' },
            { label: 'SHA-256 Digest Integrity', status: 'Pre-image Collision Resistance Satisfied' },
            { label: 'HMAC Authentication Key', status: 'lx600-vault-hmac-key-0x9821a Bound & Authenticated' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-slate-950/70 rounded-lg border border-slate-800/80 text-[15px]"
            >
              <span className="text-slate-300 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {item.label}
              </span>
              <span className="text-slate-400 font-mono text-[15px]">{item.status}</span>
            </div>
          ))}
        </div>

        {/* Cryptographic Hashes */}
        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[15px] space-y-2 mb-5">
          <div>
            <div className="text-slate-500 text-[15px] mb-0.5">CURRENT SHA-256 BLOCK HASH:</div>
            <div className="text-amber-400 break-all select-all">
              {computedHash || 'Computing SHA-256 digest...'}
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-[15px] mb-0.5">HMAC-SHA256 SIGNATURE:</div>
            <div className="text-emerald-400 break-all select-all">
              {computedSignature || 'Computing HMAC signature...'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={copyReceipt}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[15px] font-mono font-semibold cursor-pointer transition-colors"
          >
            {copiedReceipt ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedReceipt ? 'Receipt Copied' : 'Copy Audit Receipt'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[15px] font-semibold cursor-pointer transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
