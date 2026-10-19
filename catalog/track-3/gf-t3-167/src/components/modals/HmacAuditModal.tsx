import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Key, 
  Lock, 
  Terminal, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Copy,
  Check
} from 'lucide-react';
import { MASTER_HMAC_SECRET, computeHmacSha256 } from '../../utils/crypto';
import { TradeTick } from '../../types/engine';

interface HmacAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticks: TradeTick[];
}

export const HmacAuditModal: React.FC<HmacAuditModalProps> = ({
  isOpen,
  onClose,
  ticks,
}) => {
  const [testPayload, setTestPayload] = useState('1000192|2026-10-10T21:30:02.891Z|High-Aero Grand Touring Telemetry Core-DYN|SELL|104525.00|20|5c6d7e8f901a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f901a2b3c4d5e6f7a8b');
  const [computedSignature, setComputedSignature] = useState<string>('');
  const [isComputing, setIsComputing] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen) return null;

  const handleComputeCustom = async () => {
    setIsComputing(true);
    try {
      const sig = await computeHmacSha256(testPayload, MASTER_HMAC_SECRET);
      setComputedSignature(sig);
    } finally {
      setIsComputing(false);
    }
  };

  const hasTampered = ticks.some(t => t.isTampered);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-zinc-950 px-6 py-4.5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider">
                Cryptographic HMAC-SHA256 Non-Repudiation Audit
              </h3>
              <p className="text-sm text-zinc-400 font-mono">
                Master Security HSM Engine // FIPS 140-3 Non-Repudiation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close HMAC modal"
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-6 font-mono text-base sm:text-lg">
          {/* Status Banner */}
          <div className={`p-5 rounded-2xl border flex items-center justify-between ${
            hasTampered
              ? 'bg-rose-950/50 border-rose-500/60 text-rose-200'
              : 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
          }`}>
            <div className="flex items-center gap-4">
              {hasTampered ? (
                <AlertTriangle className="w-8 h-8 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
              )}
              <div>
                <div className="font-black text-lg sm:text-xl">
                  {hasTampered ? 'TAMPERED STATE DETECTED IN ACTIVE TICK CHAIN' : 'ACTIVE LEDGER CHAIN IS 100% CRYPTOGRAPHICALLY SOUND'}
                </div>
                <div className="text-base opacity-90 mt-1 leading-relaxed">
                  {hasTampered 
                    ? 'One or more ticks failed canonical HMAC recomputation. Audit trigger halts commit.'
                    : 'All monotonic sequences #1,000,000+ match chained SHA-256 HMAC signatures.'}
                </div>
              </div>
            </div>
          </div>

          {/* Master HSM Secret Display */}
          <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between text-base text-zinc-300 font-bold uppercase">
              <span className="flex items-center gap-2.5">
                <Key className="w-5 h-5 text-amber-400" />
                Master HMAC Secret Key (HSM Vault Anchor)
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(MASTER_HMAC_SECRET);
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                }}
                className="flex items-center gap-2 text-zinc-300 hover:text-white font-bold"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="bg-zinc-900 p-4 rounded-xl font-mono text-base sm:text-lg text-amber-300 break-all select-all border border-zinc-800">
              {MASTER_HMAC_SECRET}
            </div>
          </div>

          {/* Canonical Formulation */}
          <div className="space-y-2 text-base text-zinc-300">
            <div className="font-bold text-zinc-200 uppercase">Canonical Payload Serialization:</div>
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-zinc-200 text-base leading-relaxed">
              <code>sequence_id | timestamp | symbol | side | price | quantity | prev_hash</code>
            </div>
          </div>

          {/* Real-Time Live WebCrypto Hash Calculator */}
          <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-base font-black text-white uppercase flex items-center gap-2.5">
                <Terminal className="w-5 h-5 text-cyan-400" />
                Interactive WebCrypto Hash Re-computation
              </span>
            </div>

            <textarea
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              rows={2}
              aria-label="Canonical Tick Payload"
              placeholder="Enter canonical tick payload to compute signature"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-base text-zinc-100 font-mono focus:outline-none focus:border-cyan-500"
            />

            <button
              onClick={handleComputeCustom}
              disabled={isComputing}
              className="w-full py-3.5 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-base uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-98"
            >
              {isComputing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
              <span>Compute Browser-Native HMAC-SHA256</span>
            </button>

            {computedSignature && (
              <div className="p-4.5 bg-zinc-900 rounded-xl border border-zinc-800 space-y-2">
                <div className="text-sm text-zinc-400 uppercase font-bold">Generated HMAC-SHA256:</div>
                <div className="text-base sm:text-lg text-emerald-400 break-all font-mono font-black">
                  {computedSignature}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-zinc-950 px-6 py-4.5 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-base font-mono font-bold uppercase transition-colors"
          >
            Close Audit Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
