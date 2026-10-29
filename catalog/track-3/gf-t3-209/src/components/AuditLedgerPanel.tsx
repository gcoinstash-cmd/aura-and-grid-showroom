/**
 * AuditLedgerPanel Component
 * Cryptographic SHA-256 append-only state ledger inspector
 * Demonstrates immutable chain verification, hash linkage, and active tamper rejection.
 * Strict zero-dollar compliance & 14px floor.
 */

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Lock, Bug, ArrowDown, Hash, RefreshCcw, Search, X } from 'lucide-react';
import { AuditBlockData } from '../types/risk';
import { verifyLedgerChain } from '../lib/quantMath';

interface AuditLedgerPanelProps {
  ledger: AuditBlockData[];
  onAddSnapshotEvent: () => void;
}

export const AuditLedgerPanel: React.FC<AuditLedgerPanelProps> = ({
  ledger,
  onAddSnapshotEvent
}) => {
  const [tamperedBlockIndex, setTamperedBlockIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Compute active chain state (normal or simulated tamper)
  const activeChain = React.useMemo(() => {
    if (tamperedBlockIndex === null) return ledger;
    return ledger.map(b => {
      if (b.index === tamperedBlockIndex) {
        return {
          ...b,
          payload: { ...b.payload, simulated_tamper_attack: true, value_modified: "UNAUTHORIZED_STATE_MUTATION" }
        };
      }
      return b;
    });
  }, [ledger, tamperedBlockIndex]);

  const { isValid, error } = React.useMemo(() => {
    return verifyLedgerChain(activeChain);
  }, [activeChain]);

  // Instantaneous block filtering by hash, event type, block height (index), or payload content
  const filteredBlocks = React.useMemo(() => {
    if (!searchQuery.trim()) return activeChain;
    const q = searchQuery.toLowerCase().trim();
    return activeChain.filter(b => 
      b.index.toString().includes(q) ||
      b.eventType.toLowerCase().includes(q) ||
      b.blockHash.toLowerCase().includes(q) ||
      b.prevHash.toLowerCase().includes(q) ||
      b.payloadHash.toLowerCase().includes(q) ||
      JSON.stringify(b.payload).toLowerCase().includes(q)
    );
  }, [activeChain, searchQuery]);

  const toggleTamper = (index: number) => {
    if (tamperedBlockIndex === index) {
      setTamperedBlockIndex(null);
    } else {
      setTamperedBlockIndex(index);
    }
  };

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">
            SHA-256 Append-Only Cryptographic State Ledger
          </h2>
          <div className="text-sm text-slate-400 mt-0.5">
            Immutable mathematical state audit trail hashing risk vectors, covariance matrices, and backtests
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onAddSnapshotEvent}
            className="min-h-[44px] px-4 py-2.5 rounded text-sm font-bold bg-cyan-950/80 border border-cyan-500 text-cyan-300 hover:bg-cyan-900 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Commit Risk Snapshot Block</span>
          </button>
        </div>
      </div>

      {/* Chain Status Bar */}
      <div className={"p-4 rounded-lg border mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 " +
        (isValid
          ? "bg-emerald-950/40 border-emerald-500/80 text-emerald-300"
          : "bg-rose-950/40 border-rose-500/80 text-rose-300"
        )}
      >
        <div className="flex items-center gap-3">
          {isValid ? (
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
          ) : (
            <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
          )}
          <div>
            <div className="text-base font-bold">
              {isValid
                ? "CRYPTOGRAPHIC CHAIN INTEGRITY: 100% VERIFIED"
                : "CHAIN INTEGRITY VIOLATION DETECTED"
              }
            </div>
            <div className="text-sm opacity-90 font-mono">
              {isValid
                ? "All " + activeChain.length + " blocks sequentially linked via SHA-256 Merkle headers. Zero unauthorized state mutations."
                : error
              }
            </div>
          </div>
        </div>

        {tamperedBlockIndex !== null && (
          <button
            onClick={() => setTamperedBlockIndex(null)}
            className="px-3 py-1.5 rounded text-sm font-bold bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-400 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Restore Genesis State</span>
          </button>
        )}
      </div>

      {/* Block Search & Filter Bar */}
      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter blocks by hash, type, or height..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-0.5 rounded"
              title="Clear search filter"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="text-sm text-slate-400 font-mono flex items-center gap-2 shrink-0 self-end sm:self-center">
          <span className="text-cyan-400 font-bold">{filteredBlocks.length}</span> of {activeChain.length} Blocks
        </div>
      </div>

      {/* Block Stream */}
      <div className="space-y-4">
        {filteredBlocks.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-lg text-slate-400 text-sm font-mono">
            No audit ledger blocks match the filter: &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          filteredBlocks.map((block, idx) => {
          const isTampered = tamperedBlockIndex === block.index;
          return (
            <div key={block.index} className="relative">
              {idx > 0 && (
                <div className="flex justify-center -my-2.5 z-10 relative">
                  <span className="p-1 rounded-full bg-slate-900 border border-slate-700 text-slate-400">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </span>
                </div>
              )}

              <div className={"rounded-lg border p-5 transition-all " +
                (isTampered
                  ? "bg-rose-950/30 border-rose-500 shadow-lg shadow-rose-950/30"
                  : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded bg-slate-800 text-cyan-400">
                      <Hash className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-base font-bold text-slate-100">
                        Block #{block.index}: {block.eventType}
                      </span>
                      <div className="text-sm text-slate-400 font-mono">
                        {block.timestamp}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleTamper(block.index)}
                      className={"px-3 py-1.5 rounded text-sm font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer " +
                        (isTampered
                          ? "bg-rose-500 text-white border-rose-400"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:text-rose-300 hover:border-rose-800"
                        )}
                    >
                      <Bug className="w-3.5 h-3.5" />
                      <span>{isTampered ? "Tampering Active" : "Simulate Tamper Attack"}</span>
                    </button>
                  </div>
                </div>

                {/* Hashes */}
                <div className="space-y-1.5 text-sm font-mono my-3 bg-slate-950/90 p-3 rounded border border-slate-800/80">
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <span className="text-slate-500 w-32 shrink-0">BLOCK HASH:</span>
                    <span className={"font-bold break-all " + (isTampered ? "text-rose-400" : "text-cyan-400")}>
                      {block.blockHash}
                    </span>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <span className="text-slate-500 w-32 shrink-0">PREV HASH:</span>
                    <span className="text-slate-400 break-all">{block.prevHash}</span>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <span className="text-slate-500 w-32 shrink-0">PAYLOAD HASH:</span>
                    <span className="text-purple-400 break-all">{block.payloadHash}</span>
                  </div>
                </div>

                {/* Payload data */}
                <div className="text-sm">
                  <span className="text-slate-400 font-semibold">Committed Risk Payload:</span>
                  <pre className="mt-1 p-2.5 rounded bg-slate-950 text-slate-300 font-mono text-sm overflow-x-auto border border-slate-800/60">
                    {JSON.stringify(block.payload, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
};
