/**
 * AttackMatrixView Component
 * Cryptographic Soundness & Tamper Attack Simulator
 * 4 Interactive simulation triggers with real-time audit logs and soundness proofs
 * Zero-Dollar Compliance & 14px Typographic Floor
 */

import React from 'react';
import { AttackScenario, CircuitPredicate, VerificationResult } from '../types/zk';
import { ShieldCheck, ShieldAlert, AlertTriangle, Bug, Terminal, Play, Lock } from 'lucide-react';

interface AttackMatrixViewProps {
  circuit: CircuitPredicate;
  activeScenario: AttackScenario;
  onTriggerScenario: (scenario: AttackScenario) => void;
  result: VerificationResult;
  isSimulating: boolean;
}

export const AttackMatrixView: React.FC<AttackMatrixViewProps> = ({
  circuit,
  activeScenario,
  onTriggerScenario,
  result,
  isSimulating,
}) => {
  const scenarios: {
    id: AttackScenario;
    title: string;
    description: string;
    threatModel: string;
    expectedOutcome: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
  }[] = [
    {
      id: 'HONEST_PROOF',
      title: 'Verify Honest Proof (e(A,B) Valid)',
      description: 'Generates valid witness s, satisfies all quadratic gates, synthesizes proof π, and verifies e(A, B) = e(α, β) · e(L_pub, γ) · e(C, δ).',
      threatModel: 'Baseline honest prover adhering strictly to protocol rules.',
      expectedOutcome: 'VERIFIED: Pairing product equals 1_GT (Equality Satisfied)',
      icon: ShieldCheck,
      accentColor: 'border-emerald-500/50 hover:bg-emerald-500/5 text-emerald-400',
    },
    {
      id: 'TAMPER_PUBLIC_INPUT',
      title: 'Tamper Public Input x (Reject Soundness Failure)',
      description: 'Perturbs public input vector x by flipping 1 least-significant bit. Multi-scalar accumulation ∑ x_i · γ_abc_i shifts, violating bilinear balance.',
      threatModel: 'Adversary attempting to claim state transition without valid witness.',
      expectedOutcome: 'REJECTED: Soundness Failure (Public input digest mismatch in GT)',
      icon: AlertTriangle,
      accentColor: 'border-rose-500/50 hover:bg-rose-500/5 text-rose-400',
    },
    {
      id: 'CORRUPT_PROOF_G1',
      title: 'Corrupt Proof Coordinate G1 (Detect Forgery)',
      description: 'Forges point A or C coordinate by injecting random non-pairing scalar. Bilinear pairing fails target identity evaluation in GT.',
      threatModel: 'Malicious prover injecting synthetic elliptic curve points.',
      expectedOutcome: 'REJECTED: Pairing equality failure e(A, B) != e(alpha, beta)...',
      icon: Bug,
      accentColor: 'border-amber-500/50 hover:bg-amber-500/5 text-amber-400',
    },
    {
      id: 'INVALID_WITNESS_R1CS',
      title: 'Invalid Witness R1CS Non-Satisfaction',
      description: 'Supplies secret witness elements that violate intermediate gate equality (A · s) ◦ (B · s) != (C · s). Synthesis engine aborts prior to proof generation.',
      threatModel: 'Prover lacking secret preimage or valid Merkle authentication path.',
      expectedOutcome: 'REJECTED: R1CS gate non-satisfiability detected at wire evaluation',
      icon: ShieldAlert,
      accentColor: 'border-rose-500/50 hover:bg-rose-500/5 text-rose-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Soundness Simulation Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white uppercase tracking-wider">
              Cryptographic Soundness &amp; Tamper Attack Simulator
            </span>
            <span className="text-sm font-mono text-slate-400">·</span>
            <span className="text-sm font-mono text-rose-400">128-Bit Soundness Margin</span>
          </div>
          <span className="text-sm font-mono text-slate-400">
            q-DLIN Assumption on BN254
          </span>
        </div>

        <p className="text-sm text-slate-300">
          Execute interactive attack vectors against the Groth16 verification state machine.
          Each simulation asserts that any perturbation to public parameters, curve coordinates, or witness assignments is rejected deterministically in O(1) time.
        </p>
      </div>

      {/* 4 Interactive Simulation Trigger Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isSelected = activeScenario === sc.id;
          return (
            <div
              key={sc.id}
              className={
                "bg-slate-900/70 border rounded-xl p-5 transition-all flex flex-col justify-between " +
                (isSelected
                  ? "border-emerald-500 bg-slate-900/95 ring-1 ring-emerald-500/30"
                  : "border-slate-800 hover:border-slate-700")
              }
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={"p-2 rounded-lg bg-slate-950 border border-slate-800 " + sc.accentColor}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-white">{sc.title}</h3>
                  </div>
                </div>

                <p className="text-sm text-slate-300 mb-3">{sc.description}</p>

                <div className="space-y-2 text-sm font-mono bg-slate-950 p-3 rounded-lg border border-slate-800/80 mb-4">
                  <div>
                    <span className="text-slate-400">Threat Model: </span>
                    <span className="text-slate-200">{sc.threatModel}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Expected: </span>
                    <span className="text-slate-200">{sc.expectedOutcome}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onTriggerScenario(sc.id)}
                disabled={isSimulating}
                className={
                  "w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg border transition-all " +
                  (isSelected
                    ? "bg-emerald-500 text-slate-950 border-emerald-400 hover:bg-emerald-400"
                    : "bg-slate-850 text-white border-slate-700 hover:bg-slate-800")
                }
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Trigger Simulation Attack</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Live Attack Verification Log & Diagnostic Feed */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Cryptographic Attack Verification Console</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-slate-400">Status:</span>
            <span
              className={
                "font-mono text-sm font-bold px-2.5 py-0.5 rounded " +
                (result.verified
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30")
              }
            >
              {result.verified ? "VERIFIED" : "SOUNDNESS_VIOLATION_REJECTED"}
            </span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-sm space-y-2">
          <div className="text-slate-400">
            [SESSION] Executing cryptographic pairing verification over BN254 subgroup...
          </div>
          {result.auditTrail.map((log, idx) => (
            <div
              key={idx}
              className={
                log.includes("Failure") || log.includes("Rejection") || log.includes("rejected")
                  ? "text-rose-400 font-semibold"
                  : "text-slate-300"
              }
            >
              {"> " + log}
            </div>
          ))}
          {result.tamperReason && (
            <div className="text-amber-400 font-semibold pt-1 border-t border-slate-800/80">
              [DIAGNOSTIC] {result.tamperReason}
            </div>
          )}
          <div className="text-slate-400 pt-2 border-t border-slate-800 flex justify-between">
            <span>Resulting Group Element in GT:</span>
            <span className={result.verified ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
              {result.pairingProductCheck}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
