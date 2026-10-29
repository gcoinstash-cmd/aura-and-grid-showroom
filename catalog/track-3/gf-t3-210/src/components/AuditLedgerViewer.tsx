import React, { useState } from 'react';
import { AuditBlock } from '../types/microstructure';
import { ShieldCheck, AlertOctagon, KeyRound, CheckCircle2 } from 'lucide-react';

interface AuditLedgerViewerProps {
  blocks: AuditBlock[];
  onVerify: () => Promise<{ valid: boolean; errorIndex?: number; reason?: string }>;
  onTamper: (index: number) => Promise<void>;
  onResetChain: () => void;
}

export const AuditLedgerViewer: React.FC<AuditLedgerViewerProps> = ({
  blocks,
  onVerify,
  onTamper,
  onResetChain,
}) => {
  const [verificationResult, setVerificationResult] = useState<{
    tested: boolean;
    valid: boolean;
    errorIndex?: number;
    reason?: string;
  }>({ tested: false, valid: true });
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    const res = await onVerify();
    setVerificationResult({
      tested: true,
      valid: res.valid,
      errorIndex: res.errorIndex,
      reason: res.reason,
    });
    setIsVerifying(false);
  };

  const handleTamperClick = async () => {
    if (blocks.length > 2) {
      const targetIndex = blocks[Math.floor(blocks.length / 2)].index;
      await onTamper(targetIndex);
      // Immediately run verification to prove tamper detection
      const res = await onVerify();
      setVerificationResult({
        tested: true,
        valid: res.valid,
        errorIndex: res.errorIndex,
        reason: res.reason,
      });
    }
  };

  const bannerClass = 'p-3 border-b text-sm font-mono flex items-center justify-between ' +
    (verificationResult.valid
      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
      : 'bg-rose-950/80 border-rose-800 text-rose-200');

  return (
    <div className="flex flex-col h-full bg-[#090D18] border border-slate-800 rounded-lg overflow-hidden text-slate-100">
      {/* Header with verification toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Cryptographic SHA-256 State Ledger
            </h2>
            <div className="text-sm text-slate-400">
              Immutable state transitions · {blocks.length} Blocks Recorded
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="flex items-center gap-1.5 min-h-[44px] px-4 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 rounded-lg text-sm font-bold transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Verify Integrity</span>
          </button>
          <button
            onClick={handleTamperClick}
            className="flex items-center gap-1.5 min-h-[44px] px-4 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-sm font-bold transition-colors"
          >
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span>Simulate Tamper</span>
          </button>
        </div>
      </div>

      {/* Verification Status Banner */}
      {verificationResult.tested && (
        <div className={bannerClass}>
          <div className="flex items-center gap-2">
            {verificationResult.valid ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-bold">
                  CRYPTOGRAPHIC CHAIN INTEGRITY VALID · ZERO VIOLATIONS
                </span>
              </>
            ) : (
              <>
                <AlertOctagon className="w-5 h-5 text-rose-400" />
                <span className="font-bold">
                  TAMPER DETECTED: {verificationResult.reason} (Block #{verificationResult.errorIndex})
                </span>
              </>
            )}
          </div>
          {!verificationResult.valid && (
            <button
              onClick={onResetChain}
              className="px-3 py-1 bg-slate-900 text-white rounded text-sm font-bold border border-slate-700 hover:bg-slate-800"
            >
              Re-Seal Chain
            </button>
          )}
        </div>
      )}

      {/* Block List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 font-mono text-sm p-4 space-y-3">
        {blocks.map((block) => (
          <div
            key={block.hash + block.index}
            className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1.5 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-300 font-bold">
                  Block #{block.index}
                </span>
                <span className="text-white font-semibold">{block.eventType}</span>
              </div>
              <span className="text-slate-400">
                {new Date(block.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="text-slate-400 truncate">
              <span className="text-slate-500">Hash: </span>
              <span className="text-cyan-400 font-semibold">{block.hash}</span>
            </div>

            <div className="text-slate-500 truncate">
              <span>Prev: </span>
              <span>{block.prevHash}</span>
            </div>

            <div className="p-2 bg-slate-900/90 rounded text-slate-300 overflow-x-auto text-sm">
              <pre className="whitespace-pre-wrap break-all">
                {JSON.stringify(block.payload, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
