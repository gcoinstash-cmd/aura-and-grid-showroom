/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from "zod";

export const SPEC_CORRIDORS = [
  "SPEC-CORRIDOR-ALPHA (TARGET-DRAFT-TREE-VERIFY · 6400-TOKENS/S)",
  "SPEC-CORRIDOR-BRAVO (TREE-ATTENTION-MASK-BRANCH-PRUNING)",
  "SPEC-CORRIDOR-GAMMA (ASYNC-KV-CACHE-ROLLBACK-RESTORATION)",
  "SPEC-CORRIDOR-DELTA (FALLBACK-AUTOREGRESSIVE-GREEDY)",
] as const;

export type SpecCorridor = (typeof SPEC_CORRIDORS)[number];

export type BranchState = "ACCEPTED" | "PRUNED" | "ROLLBACK";

export interface TokenCandidateNode {
  tokenId: string;
  depth: number;
  parentIndex: number;
  pDraft: number;
  pTarget: number;
  draftLogprob: number;
  targetLogprob: number;
  alpha: number;
  accepted: boolean;
}

export interface SpeculativeBranch {
  branchId: number;
  branchCode: string;
  draftCount: number;
  acceptedCount: number;
  tokens: string[];
  candidates: TokenCandidateNode[];
  alpha: number;
  draftLogprob: number;
  targetLogprob: number;
  kvBasePointer: number;
  kvRollbackPointerHex: string;
  state: BranchState;
}

export interface EngineTelemetryState {
  corridor: SpecCorridor;
  verificationSpeed: number;
  acceptanceLatencyUs: number;
  activeBranches: number;
  totalBranches: number;
  processedTokens: number;
  specXpDelta: number;
  specState: string;
  entropySpikeActive: boolean;
  stepCount: number;
  meanAcceptanceRatePct: number;
  branches: SpeculativeBranch[];
  treeCausalMask: number[][];
}

const FORBIDDEN_PATTERNS = [
  "select ",
  "insert ",
  "update ",
  "delete ",
  "drop ",
  "union ",
  "--",
  ";",
  "<script",
  "javascript:",
  "onerror=",
  "onload=",
];

function isCleanIdentifier(val: string): boolean {
  if (val.length === 0 || val.length > 120) {
    return false;
  }
  const lower = val.toLowerCase();
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (lower.includes(pattern)) {
      return false;
    }
  }
  return true;
}

export const GridSyncCommandSchema = z
  .object({
    action: z.enum(["VERIFY_BURST", "TOGGLE_SPIKE", "STEP_TREE", "FLUSH_TOKENS", "SELECT_CORRIDOR"]),
    corridor: z.enum(SPEC_CORRIDORS).optional(),
    branchId: z.number().int().min(0).max(7).optional(),
    entropyFactor: z.number().min(0).max(1).optional(),
    operatorNote: z
      .string()
      .max(120)
      .refine((val) => isCleanIdentifier(val), {
        message: "GridSync Zero-Trust Gate blocked potentially unsafe payload characters",
      })
      .optional(),
  })
  .strict();

export type GridSyncCommandPayload = z.infer<typeof GridSyncCommandSchema>;

export function sanitizeGridSyncPayload(rawInput: unknown): GridSyncCommandPayload {
  return GridSyncCommandSchema.parse(rawInput);
}

/**
 * Speculative Target-Draft Token Verification Formula:
 * alpha = min(1, P_target(x) / P_draft(x))
 */
export function computeAcceptanceRatio(pTarget: number, pDraft: number): number {
  if (pDraft <= 0 || !Number.isFinite(pDraft)) {
    throw new Error("Draft probability pDraft must be strictly positive and finite");
  }
  if (pTarget < 0 || !Number.isFinite(pTarget)) {
    throw new Error("Target probability pTarget must be non-negative and finite");
  }
  const ratio = pTarget / pDraft;
  return Math.min(1.0, Math.round(ratio * 1000000) / 1000000);
}

/**
 * Residual recovery distribution upon draft token rejection:
 * P_residual(x) = norm(max(0, P_target(x) - P_draft(x)))
 */
export function computeResidualDistribution(targetDist: number[], draftDist: number[]): number[] {
  if (targetDist.length === 0 || targetDist.length !== draftDist.length) {
    throw new Error("Target and draft distributions must have identical non-zero length");
  }
  const clipped = targetDist.map((t, idx) => Math.max(0, t - draftDist[idx]));
  const mass = clipped.reduce((acc, v) => acc + v, 0);
  if (mass <= 1e-12) {
    const tSum = targetDist.reduce((acc, v) => acc + v, 0);
    return targetDist.map((t) => t / (tSum || 1));
  }
  return clipped.map((c) => c / mass);
}

/**
 * Verifies exact mathematical distribution parity between Speculative Decoding
 * and Target Autoregressive Decoding:
 * P_spec(x) = min(P_draft(x), P_target(x)) + (1 - beta) * P_residual(x)
 */
export function verifyDistributionParity(
  targetDist: number[],
  draftDist: number[]
): { speculativeDist: number[]; normalizedTargetDist: number[]; maxAbsError: number; betaAcceptanceMass: number } {
  if (targetDist.length === 0 || targetDist.length !== draftDist.length) {
    throw new Error("Distribution length mismatch");
  }
  const tSum = targetDist.reduce((a, b) => a + b, 0);
  const dSum = draftDist.reduce((a, b) => a + b, 0);
  if (tSum <= 0 || dSum <= 0) {
    throw new Error("Distributions must have positive total probability mass");
  }
  const tNorm = targetDist.map((v) => v / tSum);
  const dNorm = draftDist.map((v) => v / dSum);

  const acceptedMass = tNorm.map((t, i) => Math.min(dNorm[i], t));
  const beta = acceptedMass.reduce((a, b) => a + b, 0);
  const rejectionRate = Math.max(0, 1.0 - beta);
  const residual = computeResidualDistribution(tNorm, dNorm);

  const speculativeDist = acceptedMass.map((acc, i) => acc + rejectionRate * residual[i]);
  let maxAbsError = 0;
  for (let i = 0; i < tNorm.length; i++) {
    const err = Math.abs(speculativeDist[i] - tNorm[i]);
    if (err > maxAbsError) {
      maxAbsError = err;
    }
  }

  return {
    speculativeDist,
    normalizedTargetDist: tNorm,
    maxAbsError,
    betaAcceptanceMass: Math.round(beta * 10000) / 10000,
  };
}

/**
 * Non-Flat Tree Attention Causal Mask Builder:
 * Evaluates multiple draft token candidates concurrently in a single target forward pass.
 * M[i][j] = 1 iff node j is an ancestor of node i or j === i.
 */
export function buildTreeCausalMask(parentIndices: number[]): number[][] {
  const n = parentIndices.length;
  const mask: number[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));

  for (let i = 0; i < n; i++) {
    let curr = i;
    const visited = new Set<number>();
    while (curr !== -1) {
      if (curr < 0 || curr >= n || visited.has(curr)) {
        throw new Error("Invalid tree parent index or cycle detected at node " + String(i));
      }
      visited.add(curr);
      mask[i][curr] = 1;
      curr = parentIndices[curr];
    }
  }
  return mask;
}

/**
 * Dynamic KV Cache Rollback & State Restoration:
 * Computes pointer restoration without memory reallocation or CPU sync stalls.
 */
export function computeKvPointerRollback(
  basePointer: number,
  draftLength: number,
  acceptedLength: number,
  slotStrideBytes: number = 0x100
): {
  allocatedTipPointer: number;
  restoredCommitPointer: number;
  restoredHex: string;
  reclaimedSlots: number;
} {
  if (draftLength < 0 || acceptedLength < 0 || acceptedLength > draftLength) {
    throw new Error("Invalid KV cache draft/accepted length bounds");
  }
  const allocatedTipPointer = basePointer + draftLength * slotStrideBytes;
  const restoredCommitPointer = basePointer + acceptedLength * slotStrideBytes;
  const reclaimedSlots = draftLength - acceptedLength;
  const restoredHex = "0x" + restoredCommitPointer.toString(16).toUpperCase();

  return {
    allocatedTipPointer,
    restoredCommitPointer,
    restoredHex,
    reclaimedSlots,
  };
}

const INITIAL_BRANCH_CONFIGS: Array<{
  branchId: number;
  tokens: string[];
  pDrafts: number[];
  pTargets: number[];
  alphaOverride?: number;
  kvBase: number;
}> = [
  {
    branchId: 0,
    tokens: ["t12", "t48", "t71", "t93"],
    pDrafts: [0.84, 0.79, 0.82, 0.76],
    pTargets: [0.81, 0.75, 0.77, 0.70],
    alphaOverride: 0.94,
    kvBase: 0x8000,
  },
  {
    branchId: 1,
    tokens: ["t15", "t39", "t64", "t88"],
    pDrafts: [0.82, 0.80, 0.75, 0.72],
    pTargets: [0.79, 0.74, 0.68, 0.65],
    alphaOverride: 0.916,
    kvBase: 0x8200,
  },
  {
    branchId: 2,
    tokens: ["t21", "t53", "t77"],
    pDrafts: [0.78, 0.74, 0.70],
    pTargets: [0.72, 0.65, 0.61],
    alphaOverride: 0.891,
    kvBase: 0x8400,
  },
  {
    branchId: 3,
    tokens: ["t82", "t19", "t44"],
    pDrafts: [0.85, 0.81, 0.78],
    pTargets: [0.78, 0.72, 0.68],
    alphaOverride: 0.892,
    kvBase: 0x8500,
  },
  {
    branchId: 4,
    tokens: ["t31", "t62", "t90", "t14"],
    pDrafts: [0.80, 0.77, 0.74, 0.71],
    pTargets: [0.77, 0.72, 0.69, 0.66],
    alphaOverride: 0.938,
    kvBase: 0x8900,
  },
  {
    branchId: 5,
    tokens: ["t09", "t41", "t83"],
    pDrafts: [0.76, 0.73, 0.68],
    pTargets: [0.69, 0.64, 0.58],
    alphaOverride: 0.879,
    kvBase: 0x8C00,
  },
  {
    branchId: 6,
    tokens: ["t27", "t58", "t79", "t96"],
    pDrafts: [0.83, 0.81, 0.78, 0.75],
    pTargets: [0.80, 0.77, 0.73, 0.71],
    alphaOverride: 0.949,
    kvBase: 0x8F00,
  },
  {
    branchId: 7,
    tokens: ["t36", "t67", "t91"],
    pDrafts: [0.79, 0.75, 0.72],
    pTargets: [0.73, 0.68, 0.64],
    alphaOverride: 0.906,
    kvBase: 0x9200,
  },
];

// Global 8-node representative tree parent structure across branches
export const DEFAULT_TREE_PARENTS = [-1, 0, 1, 0, 3, 1, 4, 2];

export function createInitialTelemetryState(): EngineTelemetryState {
  const branches: SpeculativeBranch[] = INITIAL_BRANCH_CONFIGS.map((cfg) => {
    const candidates: TokenCandidateNode[] = cfg.tokens.map((tok, idx) => {
      const pDraft = cfg.pDrafts[idx];
      const pTarget = cfg.pTargets[idx];
      const alpha = computeAcceptanceRatio(pTarget, pDraft);
      const draftLogprob = Math.round(Math.log(pDraft) * 1000) / 1000;
      const targetLogprob = Math.round(Math.log(pTarget) * 1000) / 1000;
      return {
        tokenId: tok,
        depth: idx,
        parentIndex: idx - 1,
        pDraft,
        pTarget,
        draftLogprob,
        targetLogprob,
        alpha: Math.round(alpha * 1000) / 1000,
        accepted: true,
      };
    });

    const totalDraftLp =
      Math.round(candidates.reduce((acc, c) => acc + c.draftLogprob, 0) * 100) / 100;
    const totalTargetLp =
      Math.round(candidates.reduce((acc, c) => acc + c.targetLogprob, 0) * 100) / 100;
    const computedMeanAlpha =
      Math.round(
        (candidates.reduce((acc, c) => acc + c.alpha, 0) / candidates.length) * 1000
      ) / 1000;

    const kv = computeKvPointerRollback(cfg.kvBase, cfg.tokens.length, cfg.tokens.length);

    return {
      branchId: cfg.branchId,
      branchCode: "BR" + String(cfg.branchId),
      draftCount: cfg.tokens.length,
      acceptedCount: cfg.tokens.length,
      tokens: cfg.tokens,
      candidates,
      alpha: cfg.alphaOverride !== undefined ? cfg.alphaOverride : computedMeanAlpha,
      draftLogprob: totalDraftLp,
      targetLogprob: totalTargetLp,
      kvBasePointer: cfg.kvBase,
      kvRollbackPointerHex: kv.restoredHex.toLowerCase(),
      state: "ACCEPTED",
    };
  });

  const treeCausalMask = buildTreeCausalMask(DEFAULT_TREE_PARENTS);

  return {
    corridor: SPEC_CORRIDORS[0],
    verificationSpeed: 6400,
    acceptanceLatencyUs: 0.02,
    activeBranches: 8,
    totalBranches: 8,
    processedTokens: 1920000,
    specXpDelta: 32000,
    specState: "Tree Active",
    entropySpikeActive: false,
    stepCount: 1,
    meanAcceptanceRatePct: 91.4,
    branches,
    treeCausalMask,
  };
}

/**
 * Deterministic mathematical stepping function for speculative tree passes,
 * verification bursts, and draft entropy spikes (no Math.random filler).
 */
export function advanceSpeculativeSimulation(
  current: EngineTelemetryState,
  mode: "STEP_TREE" | "VERIFY_BURST" | "TOGGLE_SPIKE" | "FLUSH_TOKENS",
  corridorOverride?: SpecCorridor
): EngineTelemetryState {
  if (mode === "FLUSH_TOKENS") {
    const fresh = createInitialTelemetryState();
    return {
      ...fresh,
      corridor: corridorOverride || current.corridor,
    };
  }

  const nextStep = current.stepCount + 1;
  const nextSpike =
    mode === "TOGGLE_SPIKE" ? !current.entropySpikeActive : current.entropySpikeActive;
  const activeCorridor = corridorOverride || current.corridor;

  const updatedBranches: SpeculativeBranch[] = current.branches.map((br, bIdx) => {
    // Deterministic harmonic phase modulation per branch & step
    const phase = (nextStep * 7 + bIdx * 13) % 29;
    const harmonicDelta = (phase - 14) * 0.0035;

    let acceptedCount = 0;
    let prefixAlive = true;

    const updatedCandidates: TokenCandidateNode[] = br.candidates.map((cand, cIdx) => {
      const baseDraft = INITIAL_BRANCH_CONFIGS[bIdx].pDrafts[cIdx];
      const baseTarget = INITIAL_BRANCH_CONFIGS[bIdx].pTargets[cIdx];

      const pDraft = Math.min(0.98, Math.max(0.15, Math.round((baseDraft - harmonicDelta * 0.5) * 1000) / 1000));
      let pTarget = Math.min(0.98, Math.max(0.08, Math.round((baseTarget + harmonicDelta) * 1000) / 1000));

      // If entropy spike is active, degrade target/draft alignment on odd/high-depth branches to force rollback
      if (nextSpike && (bIdx % 2 === 1 || cIdx >= 2)) {
        pTarget = Math.max(0.05, Math.round(pDraft * (0.38 + 0.06 * cIdx) * 1000) / 1000);
      } else if (mode === "VERIFY_BURST") {
        pTarget = Math.min(0.99, Math.round(Math.max(pTarget, pDraft * 0.96) * 1000) / 1000);
      }

      const alpha = computeAcceptanceRatio(pTarget, pDraft);
      const acceptanceGate = nextSpike ? 0.72 : 0.62;
      const accepted = prefixAlive && alpha >= acceptanceGate;
      if (accepted) {
        acceptedCount += 1;
      } else {
        prefixAlive = false;
      }

      const nextTokenNum = ((parseInt(cand.tokenId.slice(1), 10) + nextStep * 3 + cIdx) % 89) + 10;
      const tokenId = bIdx === 3 && nextStep === 1 ? cand.tokenId : "t" + String(nextTokenNum);

      return {
        tokenId,
        depth: cIdx,
        parentIndex: cIdx - 1,
        pDraft,
        pTarget,
        draftLogprob: Math.round(Math.log(pDraft) * 1000) / 1000,
        targetLogprob: Math.round(Math.log(pTarget) * 1000) / 1000,
        alpha: Math.round(alpha * 1000) / 1000,
        accepted,
      };
    });

    const meanAlpha =
      Math.round(
        (updatedCandidates.reduce((acc, c) => acc + c.alpha, 0) / updatedCandidates.length) * 1000
      ) / 1000;

    const kv = computeKvPointerRollback(br.kvBasePointer, updatedCandidates.length, acceptedCount);

    let state: BranchState = "ACCEPTED";
    if (acceptedCount === 0) {
      state = "ROLLBACK";
    } else if (acceptedCount < updatedCandidates.length) {
      state = "PRUNED";
    }

    const activeTokens =
      acceptedCount > 0
        ? updatedCandidates.slice(0, acceptedCount).map((c) => c.tokenId)
        : updatedCandidates.map((c) => c.tokenId);

    return {
      ...br,
      draftCount: updatedCandidates.length,
      acceptedCount,
      tokens: activeTokens,
      candidates: updatedCandidates,
      alpha: meanAlpha,
      draftLogprob:
        Math.round(updatedCandidates.reduce((acc, c) => acc + c.draftLogprob, 0) * 100) / 100,
      targetLogprob:
        Math.round(updatedCandidates.reduce((acc, c) => acc + c.targetLogprob, 0) * 100) / 100,
      kvRollbackPointerHex: kv.restoredHex.toLowerCase(),
      state,
    };
  });

  const nonRollbackBranches = updatedBranches.filter((b) => b.state !== "ROLLBACK").length;
  const avgAlpha =
    updatedBranches.reduce((acc, b) => acc + b.alpha, 0) / updatedBranches.length;

  let verificationSpeed = 6400;
  if (mode === "VERIFY_BURST" && !nextSpike) {
    verificationSpeed = 7680;
  } else if (nextSpike) {
    verificationSpeed = 4120;
  } else {
    verificationSpeed = Math.round(6400 * (0.75 + 0.25 * avgAlpha));
  }

  const acceptanceLatencyUs = nextSpike ? 0.05 : mode === "VERIFY_BURST" ? 0.01 : 0.02;
  const tokenGain = mode === "VERIFY_BURST" ? 64000 : nextSpike ? 12800 : 32000;

  return {
    corridor: activeCorridor,
    verificationSpeed,
    acceptanceLatencyUs,
    activeBranches: nonRollbackBranches,
    totalBranches: 8,
    processedTokens: current.processedTokens + tokenGain,
    specXpDelta: tokenGain,
    specState: nextSpike ? "Rollback Guard" : "Tree Active",
    entropySpikeActive: nextSpike,
    stepCount: nextStep,
    meanAcceptanceRatePct: Math.round(avgAlpha * 1000) / 10,
    branches: updatedBranches,
    treeCausalMask: current.treeCausalMask,
  };
}
