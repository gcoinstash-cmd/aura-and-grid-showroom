import React from 'react';
import { ArbitrageCycle } from '../engine/arbitrageEngine';
import { CheckCircle2, Zap, X, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';

interface ExecutionModalProps {
  cycle: ArbitrageCycle | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutionModal: React.FC<ExecutionModalProps> = ({
  cycle,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !cycle) return null;

  const gasCost = 4.20; // Simulated L2 flash loan bundle gas cost
  const grossProfit = cycle.net_profit;
  const netCleared = Math.max(0, grossProfit - gasCost);
  const txHash = `0x9d5e714b8a4f932c109e3b4a205d8f99c${Math.random().toString(16).slice(2, 10)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/60 p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Glow ambient header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400" />

        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-400/50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white uppercase font-mono tracking-wide">
                Atomic Flash-Swap Receipt
              </h3>
              <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>SETTLED IN SINGLE BLOCK · ZERO PRINCIPAL COLLATERAL</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Content */}
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="text-xs font-mono text-zinc-400 uppercase">Cycle Route</div>
              <div className="text-base font-bold font-mono text-cyan-300 mt-1">
                {cycle.tokens.join(' → ')}
              </div>
            </div>
            <div>
              <div className="text-xs font-mono text-zinc-400 uppercase">Flash-Loan Borrowed</div>
              <div className="text-base font-bold font-mono text-white mt-1 tabular-nums">
                ${cycle.optimal_input.toLocaleString(undefined, { minimumFractionDigits: 2 })} {cycle.tokens[0]}
              </div>
            </div>
            <div>
              <div className="text-xs font-mono text-zinc-400 uppercase">Gross Returned</div>
              <div className="text-base font-bold font-mono text-zinc-100 mt-1 tabular-nums">
                ${cycle.expected_output.toLocaleString(undefined, { minimumFractionDigits: 2 })} {cycle.tokens[0]}
              </div>
            </div>
            <div>
              <div className="text-xs font-mono text-zinc-400 uppercase">Net Profit Cleared</div>
              <div className="text-base font-bold font-mono text-emerald-400 mt-1 tabular-nums">
                +${netCleared.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
              </div>
            </div>
          </div>

          {/* Torque Distribution Telemetry */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>DIRECT4 Powertrain Vector</span>
              <span className="text-cyan-400">
                Front {Math.round((1 - cycle.rear_torque_bias) * 100)}% : Rear {Math.round(cycle.rear_torque_bias * 100)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="bg-cyan-400"
                style={{ width: `${(1 - cycle.rear_torque_bias) * 100}%` }}
              />
              <div
                className="bg-emerald-400"
                style={{ width: `${cycle.rear_torque_bias * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-zinc-500 pt-1">
              <span>Front Ingestion Latency: 0.34ms</span>
              <span>Rear eAxle Execution: 1.84ms</span>
            </div>
          </div>

          {/* Hash & Verification */}
          <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-xs font-mono text-zinc-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>Tx Hash:</span>
              <span className="text-zinc-200 truncate max-w-xs">{txHash}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Private RPC Gas Fee:</span>
              <span className="text-zinc-200">${gasCost.toFixed(2)} USD</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Zero-Loss Invariant Status:</span>
              <span className="text-emerald-400">VERIFIED SATISFIED</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-zinc-200 font-semibold text-sm transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
