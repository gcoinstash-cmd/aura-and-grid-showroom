/**
 * TopHeader Component for APEX-214 Institutional Mission Control
 * Strict Zero-Dollar Gate & Inline Docked Command Header
 */

import React from 'react';
import { CircuitPredicate } from '../types/zk';
import { Cpu, RefreshCw, Play } from 'lucide-react';

interface TopHeaderProps {
  circuits: CircuitPredicate[];
  activeCircuit: CircuitPredicate;
  onSelectCircuit: (circuit: CircuitPredicate) => void;
  onRunVerification: () => void;
  onReset: () => void;
  isVerifying: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  circuits,
  activeCircuit,
  onSelectCircuit,
  onRunVerification,
  onReset,
  isVerifying,
}) => {
  return (
    <header className="border-b border-slate-800 bg-[#070A11] px-3 sm:px-4 lg:px-6 py-2">
      {/* Row 1: Inline Docked Command Header with Zero Right Edge Cutoff */}
      <div className="flex items-center justify-between gap-1 w-full">
        {/* Left cluster: flex items-center gap-1.5 shrink min-w-0 */}
        <div className="flex items-center gap-1.5 shrink min-w-0">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
            <Cpu className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white whitespace-nowrap">
            APEX-214
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 whitespace-nowrap shrink-0">
            TRACK 3 ZK-CORE
          </span>
        </div>

        {/* Right cluster: flex items-center gap-1.5 shrink-0 */}
        <div className="flex items-center gap-1.5 shrink-0">
          <select
            value={activeCircuit.id}
            onChange={(e) => {
              const found = circuits.find((c) => c.id === e.target.value);
              if (found) onSelectCircuit(found);
            }}
            className="bg-slate-950 border border-slate-800 text-[11px] font-mono text-white rounded-md px-2 py-0.5 max-w-[150px] focus:outline-none focus:border-emerald-500 truncate"
          >
            {circuits.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id.replace("CIRCUIT-", "")}
              </option>
            ))}
          </select>

          <button
            onClick={onReset}
            className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-slate-300 bg-slate-900 border border-slate-700/80 rounded hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap"
            title="Reset Public and Witness Inputs"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Reset</span>
          </button>

          <button
            onClick={onRunVerification}
            disabled={isVerifying}
            className="flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500/30 transition-colors whitespace-nowrap disabled:opacity-50"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>{isVerifying ? "Verifying..." : "Verify"}</span>
          </button>
        </div>
      </div>

      {/* Row 2: Subtitle text-xs text-slate-400 */}
      <div className="text-xs text-slate-400 mt-1 truncate">
        Groth16 zk-SNARK · BN254 Bilinear Pairing · R1CS Solver · O(1) Verification
      </div>
    </header>
  );
};
