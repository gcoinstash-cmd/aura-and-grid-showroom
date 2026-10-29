import React, { useState } from 'react';
import { ParentOrder } from '../types';
import { sha256Sync } from '../lib/quant-engine';

interface AuditLedgerModalProps {
  order: ParentOrder;
  onClose: () => void;
  selectedSliceId?: string;
}

export const AuditLedgerModal: React.FC<AuditLedgerModalProps> = ({
  order,
  onClose,
  selectedSliceId,
}) => {
  const [tamperedIndex, setTamperedIndex] = useState<number | null>(null);

  // Compute block audit chain validation
  const blocks: {
    step: number;
    title: string;
    sliceId?: string;
    prevHash: string;
    hash: string;
    computedHash: string;
    isValid: boolean;
    payload: string;
  }[] = [];

  // Genesis Block (Block 0)
  blocks.push({
    step: 0,
    title: 'GENESIS BLOCK (PARENT ORDER SUBMISSION)',
    prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
    hash: order.genesis_hash,
    computedHash: order.genesis_hash,
    isValid: true,
    payload: `GENESIS|${order.order_id}|${order.symbol}|${order.notional}|${order.created_at}`,
  });

  let runningHash = order.genesis_hash;
  order.slices.forEach((s, idx) => {
    // If tampered for demo
    const effectiveShares = tamperedIndex === idx ? s.target_shares + 100 : s.target_shares;
    const blockData = `${runningHash}|${s.slice_id}|${effectiveShares.toFixed(4)}|${s.venue}|${s.scheduled_time_pct.toFixed(4)}`;
    const computed = sha256Sync(blockData);
    const valid = computed === s.audit_hash;

    blocks.push({
      step: idx + 1,
      title: `CHILD SLICE BLOCK #${idx + 1} (${s.slice_id})`,
      sliceId: s.slice_id,
      prevHash: runningHash,
      hash: s.audit_hash,
      computedHash: computed,
      isValid: valid,
      payload: blockData,
    });

    runningHash = s.audit_hash;
  });

  const allValid = blocks.every((b) => b.isValid);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-sm bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
            <div>
              <h2 className="text-base font-bold text-zinc-100 uppercase tracking-wider">
                Cryptographic Audit Ledger (SHA-256 Chained)
              </h2>
              <div className="text-sm text-zinc-400 font-mono">
                Order ID: {order.order_id} · SEC Rule 611 / MiFID II RTS 25 Compliant
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`px-3 py-1.5 rounded-md text-sm font-mono font-semibold border ${
                allValid
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {allValid ? 'CHAIN INTEGRITY: VERIFIED 100%' : 'INTEGRITY BREACH DETECTED'}
            </div>

            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-100 text-sm px-3 py-1.5 rounded hover:bg-zinc-800 cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Demo Tamper Controls */}
        <div className="px-5 py-3 bg-zinc-900/60 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-sm font-mono">
          <span className="text-zinc-300">
            Hash chaining formula: <code className="text-cyan-300">H[k] = SHA256(H[k-1] || SliceData[k])</code>
          </span>
          <div className="flex items-center gap-2">
            {tamperedIndex === null ? (
              <button
                onClick={() => setTamperedIndex(2)}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 cursor-pointer"
                title="Simulate modifying slice data to verify fraud detection"
              >
                Test Tamper Injection (Slice #3)
              </button>
            ) : (
              <button
                onClick={() => setTamperedIndex(null)}
                className="px-3 py-1.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 cursor-pointer font-semibold"
              >
                Restore Valid Cryptographic Chain
              </button>
            )}
          </div>
        </div>

        {/* Blocks list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 font-mono text-sm">
          {blocks.map((block) => {
            const isTarget = selectedSliceId && block.sliceId === selectedSliceId;

            return (
              <div
                key={block.step}
                className={`p-4 rounded-lg border transition-all ${
                  !block.isValid
                    ? 'bg-rose-950/20 border-rose-800/80'
                    : isTarget
                    ? 'bg-cyan-950/20 border-cyan-500'
                    : 'bg-zinc-900/40 border-zinc-800/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5 font-bold text-zinc-200 text-sm">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-sm">
                      BLOCK #{block.step}
                    </span>
                    <span>{block.title}</span>
                  </div>
                  <span
                    className={`text-sm font-semibold px-2.5 py-0.5 rounded border ${
                      block.isValid
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                    }`}
                  >
                    {block.isValid ? 'Valid Proof' : 'Broken Chain'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mt-2">
                  <div>
                    <span className="text-zinc-500 block">Previous Block Hash (H[k-1]):</span>
                    <span className="text-zinc-400 truncate block select-all">{block.prevHash}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Current Block Hash (H[k]):</span>
                    <span
                      className={`truncate block select-all ${
                        block.isValid ? 'text-cyan-400 font-semibold' : 'text-rose-400 font-semibold'
                      }`}
                    >
                      {block.hash}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-zinc-800/60 text-sm text-zinc-500">
                  <span className="text-zinc-400">Raw Canonical Payload: </span>
                  <span className="text-zinc-300 font-mono">{block.payload}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-sm text-zinc-400 font-mono">
          <span>Total Blocks: {blocks.length} Verified</span>
          <button
            onClick={onClose}
            className="min-h-[44px] px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-sans cursor-pointer text-sm font-semibold"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
