/**
 * APEX-214: zk-SNARK Groth16 Verifier Type Definitions
 * Permissive MIT Clean-Room Implementation
 * Zero-Dollar Compliance: Dimensionless technical metrics
 */

export interface G1Point {
  x: string;
  y: string;
}

export interface G2Point {
  x: [string, string];
  y: [string, string];
}

export interface Groth16Proof {
  A: G1Point;
  B: G2Point;
  C: G1Point;
}

export interface VerificationKey {
  alpha_g1: G1Point;
  beta_g2: G2Point;
  gamma_g2: G2Point;
  delta_g2: G2Point;
  gamma_abc_g1: G1Point[];
}

export interface R1CSConstraintRow {
  gateIndex: number;
  label: string;
  aTerms: { varIndex: number; name: string; coeff: string }[];
  bTerms: { varIndex: number; name: string; coeff: string }[];
  cTerms: { varIndex: number; name: string; coeff: string }[];
  satisfied: boolean;
  leftVal: string;
  rightVal: string;
  outputVal: string;
}

export interface CircuitPredicate {
  id: string;
  name: string;
  domain: string;
  description: string;
  constraints: number;
  variables: number;
  publicInputsCount: number;
  privateInputsCount: number;
  provingWorkUnits: number;
  deterministicLatencyMs: number;
  vkDigest: string;
  defaultPublicInputs: string[];
  defaultPrivateInputs: string[];
}

export interface VerificationResult {
  verified: boolean;
  latencyMs: number;
  pairingProductCheck: string;
  publicInputDigest: string;
  soundnessMarginBits: number;
  auditTrail: string[];
  tamperReason?: string;
  timestamp: string;
}

export type AttackScenario =
  | 'HONEST_PROOF'
  | 'TAMPER_PUBLIC_INPUT'
  | 'CORRUPT_PROOF_G1'
  | 'INVALID_WITNESS_R1CS';
