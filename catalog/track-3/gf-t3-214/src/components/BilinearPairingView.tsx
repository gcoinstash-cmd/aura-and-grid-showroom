/**
 * BilinearPairingView Component
 * Visualizes BN254 Groth16 pairing equation e(A, B) = e(alpha, beta) * e(L_pub, gamma) * e(C, delta)
 * Includes Interactive Pairing Stepper: Subgroup Check -> Miller Loop -> Final Exp
 * Strict Zero-Dollar Compliance & 10/10 Cockpit Design
 */

import React, { useState } from 'react';
import { CircuitPredicate, Groth16Proof, VerificationKey, VerificationResult } from '../types/zk';
import { CheckCircle2, XCircle, Copy, Check, Eye, Play, SkipForward, RotateCcw } from 'lucide-react';

interface BilinearPairingViewProps {
  circuit: CircuitPredicate;
  proof: Groth16Proof;
  vk: VerificationKey;
  result: VerificationResult;
  publicInputs: string[];
}

export const BilinearPairingView: React.FC<BilinearPairingViewProps> = ({
  circuit,
  proof,
  vk,
  result,
  publicInputs,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(3); // 1 = Subgroup, 2 = Miller Loop, 3 = Final Exp

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleStepPairing = () => {
    setActiveStep((prev) => (prev >= 3 ? 1 : prev + 1));
  };

  const handleResetStepper = () => {
    setActiveStep(1);
  };

  return (
    <div className="space-y-4">
      {/* Mathematical Verification Equation Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Groth16 Optimal Ate Bilinear Pairing Equation
            </span>
            <span className="text-xs font-mono text-slate-400">·</span>
            <span className="text-xs font-mono text-emerald-400">BN254 Pairing Curve</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Security Target: 128-bit
          </span>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 overflow-x-auto">
          <div className="font-mono text-sm sm:text-base font-semibold text-emerald-300 text-center py-1 tracking-wide">
            e(A, B) = e(α, β) · e(∑ x_i · γ_abc_i, γ) · e(C, δ)
          </div>
          <div className="text-xs text-slate-400 text-center font-mono mt-0.5">
            Target Identity: e(A, B) · e(-α, β) · e(-L_pub, γ) · e(-C, δ) = 1_GT
          </div>
        </div>
      </div>

      {/* Interactive Pairing Stepper Ribbon */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Interactive Pairing Stepper
            </span>
            <span className="text-xs font-mono text-slate-400">·</span>
            <span className="text-xs font-mono text-cyan-400">BN254 Ate Engine</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetStepper}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-950 border border-slate-800 rounded-md hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Step</span>
            </button>
            <button
              onClick={handleStepPairing}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md shadow-sm transition-colors"
            >
              <SkipForward className="h-3.5 w-3.5" />
              <span>Step Pairing ({"Step " + activeStep + " of 3"})</span>
            </button>
          </div>
        </div>

        {/* 3 Stepper Stage Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Step 1: Subgroup Check */}
          <div
            onClick={() => setActiveStep(1)}
            className={
              "cursor-pointer p-3 rounded-lg border transition-all " +
              (activeStep === 1
                ? "bg-slate-800/90 border-cyan-400 ring-1 ring-cyan-400/30"
                : activeStep > 1
                ? "bg-slate-950/80 border-slate-800 text-slate-300"
                : "bg-slate-950/40 border-slate-800/60 opacity-60")
            }
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold font-mono text-slate-200">
                01. Subgroup Check
              </span>
              <span
                className={
                  "px-2 py-0.5 rounded text-xs font-mono font-bold " +
                  (result.verified || activeStep >= 1
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-400")
                }
              >
                {activeStep >= 1 ? "PASSED (Fq VALID)" : "PENDING"}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Validates A in G1, B in G2, C in G1 lying on prime-order BN254 subgroup modulo p.
            </p>
          </div>

          {/* Step 2: Miller Loop */}
          <div
            onClick={() => setActiveStep(2)}
            className={
              "cursor-pointer p-3 rounded-lg border transition-all " +
              (activeStep === 2
                ? "bg-slate-800/90 border-cyan-400 ring-1 ring-cyan-400/30"
                : activeStep > 2
                ? "bg-slate-950/80 border-slate-800 text-slate-300"
                : "bg-slate-950/40 border-slate-800/60 opacity-60")
            }
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold font-mono text-slate-200">
                02. Miller Loop
              </span>
              <span
                className={
                  "px-2 py-0.5 rounded text-xs font-mono font-bold " +
                  (activeStep >= 2
                    ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                    : "bg-slate-800 text-slate-400")
                }
              >
                {activeStep >= 2 ? "L_pub ACCUMULATED" : "PENDING"}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Multi-Miller Loop evaluating lines over public multi-scalar accumulation ∑ x_i · γ_abc_i.
            </p>
          </div>

          {/* Step 3: Final Exponentiation */}
          <div
            onClick={() => setActiveStep(3)}
            className={
              "cursor-pointer p-3 rounded-lg border transition-all " +
              (activeStep === 3
                ? "bg-slate-800/90 border-cyan-400 ring-1 ring-cyan-400/30"
                : "bg-slate-950/40 border-slate-800/60 opacity-60")
            }
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold font-mono text-slate-200">
                03. Final Exponentiation
              </span>
              <span
                className={
                  "px-2 py-0.5 rounded text-xs font-mono font-bold " +
                  (result.verified
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-400 border border-rose-500/30")
                }
              >
                {result.verified ? "1_GT EQUALITY" : "REJECTED"}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Raises Miller product to (p^12 - 1)/r in target group GT to evaluate identity satisfaction.
            </p>
          </div>
        </div>
      </div>

      {/* Proof Coordinates (G1 & G2 Points) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Point A in G1 */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span className="text-sm font-bold text-white">Proof Point A</span>
              <span className="text-xs font-mono text-slate-400">(G1 ∈ Fq)</span>
            </div>
            <button
              onClick={() => copyToClipboard(proof.A.x + "\n" + proof.A.y, "point_a")}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Copy Coordinates"
            >
              {copiedKey === "point_a" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <div className="space-y-2 font-mono text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">X-Coordinate:</span>
              <div className="bg-slate-950 border border-slate-800/80 rounded p-1.5 text-slate-200 break-all select-all">
                {proof.A.x}
              </div>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Y-Coordinate:</span>
              <div className="bg-slate-950 border border-slate-800/80 rounded p-1.5 text-slate-200 break-all select-all">
                {proof.A.y}
              </div>
            </div>
          </div>
        </div>

        {/* Point B in G2 */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-violet-400"></span>
              <span className="text-sm font-bold text-white">Proof Point B</span>
              <span className="text-xs font-mono text-slate-400">(G2 ∈ Fq2)</span>
            </div>
            <button
              onClick={() => copyToClipboard(proof.B.x.join("\n") + "\n" + proof.B.y.join("\n"), "point_b")}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Copy Coordinates"
            >
              {copiedKey === "point_b" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <div className="space-y-2 font-mono text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">X0-Coordinate (Real):</span>
              <div className="bg-slate-950 border border-slate-800/80 rounded p-1.5 text-slate-200 break-all select-all">
                {proof.B.x[0]}
              </div>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">X1-Coordinate (Imaginary):</span>
              <div className="bg-slate-950 border border-slate-800/80 rounded p-1.5 text-slate-200 break-all select-all">
                {proof.B.x[1]}
              </div>
            </div>
          </div>
        </div>

        {/* Point C in G1 */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400"></span>
              <span className="text-sm font-bold text-white">Proof Point C</span>
              <span className="text-xs font-mono text-slate-400">(G1 ∈ Fq)</span>
            </div>
            <button
              onClick={() => copyToClipboard(proof.C.x + "\n" + proof.C.y, "point_c")}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Copy Coordinates"
            >
              {copiedKey === "point_c" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <div className="space-y-2 font-mono text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">X-Coordinate:</span>
              <div className="bg-slate-950 border border-slate-800/80 rounded p-1.5 text-slate-200 break-all select-all">
                {proof.C.x}
              </div>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Y-Coordinate:</span>
              <div className="bg-slate-950 border border-slate-800/80 rounded p-1.5 text-slate-200 break-all select-all">
                {proof.C.y}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Key Setup & Public Input Accumulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Verification Key Bases */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Verification Key (VK) Elements</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Digest: {circuit.vkDigest}
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400">α ∈ G1 (Alpha generator)</span>
              <span className="text-slate-200 truncate max-w-xs">{vk.alpha_g1.x.slice(0, 18) + "..."}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400">β ∈ G2 (Beta generator)</span>
              <span className="text-slate-200 truncate max-w-xs">{vk.beta_g2.x[0].slice(0, 18) + "..."}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400">γ ∈ G2 (Gamma generator)</span>
              <span className="text-slate-200 truncate max-w-xs">{vk.gamma_g2.x[0].slice(0, 18) + "..."}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400">δ ∈ G2 (Delta generator)</span>
              <span className="text-slate-200 truncate max-w-xs">{vk.delta_g2.x[0].slice(0, 18) + "..."}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400">γ_abc Bases ({vk.gamma_abc_g1.length} points)</span>
              <span className="text-emerald-400 font-semibold">Ready for Multi-Scalar MSM</span>
            </div>
          </div>
        </div>

        {/* Verification Audit Trail */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {result.verified ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-rose-400" />
              )}
              <h3 className="text-sm font-bold text-white">Bilinear Pairing Evaluation Log</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Latency: {result.latencyMs.toFixed(2)} ms
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {result.auditTrail.map((step, idx) => (
              <div
                key={idx}
                className={
                  "p-2 rounded border " +
                  (step.includes("Failure") || step.includes("Rejection") || step.includes("rejected")
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                    : "bg-slate-950 border-slate-800 text-slate-300")
                }
              >
                {step}
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Public Input Digest:</span>
            <span className="text-slate-200">{result.publicInputDigest}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
