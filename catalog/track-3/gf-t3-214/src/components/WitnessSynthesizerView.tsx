/**
 * WitnessSynthesizerView Component
 * Interactive Witness Vector Solver s = [1, x_pub, w_priv] and Groth16 Proof Synthesizer
 * Zero-Dollar Compliance & 14px Typographic Floor
 */

import React, { useState } from 'react';
import { CircuitPredicate, Groth16Proof } from '../types/zk';
import { Cpu, CheckCircle2, Wand2, Copy, Check, ArrowRight } from 'lucide-react';

interface WitnessSynthesizerViewProps {
  circuit: CircuitPredicate;
  publicInputs: string[];
  privateInputs: string[];
  witnessVector: string[];
  onUpdatePublicInput: (index: number, value: string) => void;
  onUpdatePrivateInput: (index: number, value: string) => void;
  onSolveWitness: () => void;
  onSynthesizeProof: () => void;
  isSynthesizing: boolean;
  synthesizedProof: Groth16Proof | null;
}

export const WitnessSynthesizerView: React.FC<WitnessSynthesizerViewProps> = ({
  circuit,
  publicInputs,
  privateInputs,
  witnessVector,
  onUpdatePublicInput,
  onUpdatePrivateInput,
  onSolveWitness,
  onSynthesizeProof,
  isSynthesizing,
  synthesizedProof,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Witness Synthesis Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white uppercase tracking-wider">
              Interactive Witness Generation &amp; Proof Synthesizer
            </span>
            <span className="text-sm font-mono text-slate-400">·</span>
            <span className="text-sm font-mono text-violet-400">R1CS Solver Engine</span>
          </div>
          <span className="text-sm font-mono text-slate-400">
            Witness Vector Length: {witnessVector.length} Elements
          </span>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-mono text-base font-semibold text-violet-300">
              s = [ 1,  x_0, ..., x_l,  w_0, ..., w_m ]
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Linear witness decomposition enforcing (A · s) ◦ (B · s) = (C · s) across all constraint rows.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onSolveWitness}
              className="px-4 py-2 text-sm font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
            >
              Solve Intermediate Wires
            </button>
            <button
              onClick={onSynthesizeProof}
              disabled={isSynthesizing}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-slate-950 bg-violet-400 hover:bg-violet-300 rounded-lg shadow-sm transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <Wand2 className="h-4 w-4" />
              <span>{isSynthesizing ? "Synthesizing..." : "Synthesize Proof π = {A, B, C}"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Public Inputs vs Private Witness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Public Inputs (x_pub) */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400"></span>
              <h3 className="text-base font-bold text-white">Public Input Vector (x_pub)</h3>
            </div>
            <span className="text-sm font-mono text-slate-400">
              {publicInputs.length} Public Parameters
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Public values committed in the verification key via multi-scalar multiplication over γ_abc bases.
          </p>

          <div className="space-y-3">
            {publicInputs.map((val, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm font-mono text-slate-400 mb-1">
                  <span>Input x_{idx} (Index {idx + 1}):</span>
                  <span>Fr Scalar (Hex)</span>
                </div>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => onUpdatePublicInput(idx, e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-sm font-mono text-cyan-300 rounded px-3 py-1.5 focus:outline-none focus:border-cyan-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Private Witness Elements (w_priv) */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-violet-400"></span>
              <h3 className="text-base font-bold text-white">Private Witness Vector (w_priv)</h3>
            </div>
            <span className="text-sm font-mono text-slate-400">
              {circuit.privateInputsCount} Secret Elements
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Secret inputs (preimages, path siblings, blinding factors) known exclusively to the prover.
          </p>

          <div className="space-y-3">
            {privateInputs.map((val, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm font-mono text-slate-400 mb-1">
                  <span>Secret Wire w_{idx} (Index {idx + 1 + publicInputs.length}):</span>
                  <span className="text-violet-400 font-semibold">Zero-Knowledge Shielded</span>
                </div>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => onUpdatePrivateInput(idx, e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-sm font-mono text-violet-300 rounded px-3 py-1.5 focus:outline-none focus:border-violet-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Synthesized Proof Preview Banner */}
      {synthesizedProof && (
        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Synthesized Proof Tuple π = { "{ A, B, C }" }</h3>
            </div>
            <span className="text-sm font-mono text-emerald-400">
              Ready for Bilinear Pairing Verification
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-sm">
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400 block mb-1">Point A (G1.x):</span>
              <span className="text-slate-200 truncate block">{synthesizedProof.A.x}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400 block mb-1">Point B (G2.x0):</span>
              <span className="text-slate-200 truncate block">{synthesizedProof.B.x[0]}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400 block mb-1">Point C (G1.x):</span>
              <span className="text-slate-200 truncate block">{synthesizedProof.C.x}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
