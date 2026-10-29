/**
 * GF-T3-281: Dynamic Speculative Draft-Target Verification & Multi-Token Parallel Acceptance
 * Deterministic Mathematical Engine & GridSync Zero-Trust Zod Ingress Sanitizer
 * License: Apache-2.0 / MIT Clean-Room
 */

import { z } from 'zod';

export enum SyntheticCorridorId {
  ALPHA = 'ACCEL-CORRIDOR-ALPHA',
  BRAVO = 'ACCEL-CORRIDOR-BRAVO',
  GAMMA = 'ACCEL-CORRIDOR-GAMMA',
  DELTA = 'ACCEL-CORRIDOR-DELTA',
}

export interface CorridorConfig {
  id: SyntheticCorridorId;
  fullLabel: string;
  shortTag: string;
  peakBandwidthGbs: number;
  baseLatencyUs: number;
  draftLookaheadK: number;
  baseVector: [number, number, number, number];
}

export const SYNTHETIC_CORRIDORS: Record<SyntheticCorridorId, CorridorConfig> = {
  [SyntheticCorridorId.ALPHA]: {
    id: SyntheticCorridorId.ALPHA,
    fullLabel: 'ACCEL-CORRIDOR-ALPHA (DYNAMIC-SPECULATIVE-DRAFT-TARGET-VERIFICATION-FABRIC · 39200-GB/S)',
    shortTag: 'ALPHA · 39.2K GB/S',
    peakBandwidthGbs: 39200,
    baseLatencyUs: 0.01,
    draftLookaheadK: 5,
    baseVector: [4.31, 4.35, 4.32, 4.34],
  },
  [SyntheticCorridorId.BRAVO]: {
    id: SyntheticCorridorId.BRAVO,
    fullLabel: 'ACCEL-CORRIDOR-BRAVO (MULTI-TOKEN-PARALLEL-ACCEPTANCE-ENGINE)',
    shortTag: 'BRAVO · 36.4K GB/S',
    peakBandwidthGbs: 36400,
    baseLatencyUs: 0.015,
    draftLookaheadK: 4,
    baseVector: [3.94, 3.98, 3.91, 3.96],
  },
  [SyntheticCorridorId.GAMMA]: {
    id: SyntheticCorridorId.GAMMA,
    fullLabel: 'ACCEL-CORRIDOR-GAMMA (BATCHED-VERIFICATION-TREE-ROUTER)',
    shortTag: 'GAMMA · 32.8K GB/S',
    peakBandwidthGbs: 32800,
    baseLatencyUs: 0.02,
    draftLookaheadK: 4,
    baseVector: [3.62, 3.68, 3.65, 3.64],
  },
  [SyntheticCorridorId.DELTA]: {
    id: SyntheticCorridorId.DELTA,
    fullLabel: 'ACCEL-CORRIDOR-DELTA (FALLBACK-SINGLE-TOKEN-AUTOREGRESSIVE-PASS)',
    shortTag: 'DELTA · 14.2K GB/S',
    peakBandwidthGbs: 14200,
    baseLatencyUs: 0.045,
    draftLookaheadK: 1,
    baseVector: [1.0, 1.0, 1.0, 1.0],
  },
};

export interface TokenCandidatePair {
  stepK: number;
  tokenSymbol: string;
  targetProbP: number;
  draftProbQ: number;
  acceptanceProbAlpha: number;
  residualProb: number;
}

export interface StreamVerificationUnit {
  index: number;
  streamCode: string;
  title: string;
  pointerHex: string;
  tokensK: number;
  acceptanceRatePct: number;
  ringSyncPct: number;
  latencyMs: number;
  stateLabel: 'VERIFIED · LOCKED' | '⚡ FAULT · RE-EVAL' | 'BURST · LOCKED' | 'ARENA · ZEROED';
  acceptStatus: 'OK' | 'RE-EVAL' | 'BURST';
  aMultiScore: number;
  klDivergence: number;
}

export interface ParallelAcceptanceComputation {
  aMulti: number;
  velocityMultiplier: number;
  meanAcceptancePct: number;
  klDivergenceNats: number;
  candidates: TokenCandidatePair[];
}

const DISALLOWED_PATTERNS = [
  'DROP TABLE',
  'DELETE FROM',
  'INSERT INTO',
  'UPDATE ',
  '<SCRIPT',
  'JAVASCRIPT:',
  'ONERROR=',
  '--',
  ';',
];

/**
 * GridSync Zero-Trust Ingress Schema using Zod
 * Scrubs inputs against SQL injection, XSS, and schema pollution.
 */
export const GridSyncVerificationPayloadSchema = z.object({
  corridorId: z.nativeEnum(SyntheticCorridorId),
  streamIndex: z.number().int().min(0).max(7),
  commandTag: z
    .string()
    .min(2)
    .max(64)
    .refine(
      (val) => {
        const upper = val.toUpperCase();
        return !DISALLOWED_PATTERNS.some((pat) => upper.includes(pat));
      },
      { message: 'GridSync Zero-Trust Gate blocked potentially malicious SQLi/XSS token' }
    ),
  targetProbs: z.array(z.number().gt(0).lte(1)).min(1).max(8),
  draftProbs: z.array(z.number().gt(0).lte(1)).min(1).max(8),
}).refine((data) => data.targetProbs.length === data.draftProbs.length, {
  message: 'Target P and Draft Q probability vectors must have identical length K',
});

export type GridSyncVerificationPayload = z.infer<typeof GridSyncVerificationPayloadSchema>;

/**
 * Sanitize and validate incoming verification payload via GridSync Zod gate.
 */
export function sanitizeVerificationPayload(rawInput: unknown): GridSyncVerificationPayload {
  return GridSyncVerificationPayloadSchema.parse(rawInput);
}

/**
 * Core Mathematical Formula:
 * A_multi = sum_{k=1}^{K} min(1, P(x_k | x_<k) / Q(x_k | x_<k))
 * Multiplies token generation velocity by up to 5x per forward pass.
 */
export function computeMultiTokenParallelAcceptance(
  targetProbs: number[],
  draftProbs: number[],
  symbols?: string[]
): ParallelAcceptanceComputation {
  if (targetProbs.length === 0 || targetProbs.length !== draftProbs.length) {
    throw new Error('Target P and Draft Q arrays must be non-empty and of equal length');
  }

  let aMultiSum = 0;
  let klSum = 0;
  const candidates: TokenCandidatePair[] = [];

  for (let i = 0; i < targetProbs.length; i++) {
    const p = targetProbs[i];
    const q = draftProbs[i];
    if (p <= 0 || p > 1 || q <= 0 || q > 1 || Number.isNaN(p) || Number.isNaN(q)) {
      throw new Error('Probabilities P and Q must be valid numbers in (0, 1]');
    }

    const ratio = p / q;
    const alphaK = Math.min(1.0, ratio);
    const residual = Math.max(0.0, p - q);
    aMultiSum += alphaK;
    klSum += p * Math.log(p / q);

    candidates.push({
      stepK: i + 1,
      tokenSymbol: symbols && symbols[i] ? symbols[i] : 'TOK_' + String(i + 1),
      targetProbP: Number(p.toFixed(4)),
      draftProbQ: Number(q.toFixed(4)),
      acceptanceProbAlpha: Number(alphaK.toFixed(4)),
      residualProb: Number(residual.toFixed(4)),
    });
  }

  const kCount = targetProbs.length;
  const meanAcceptancePct = Number(((aMultiSum / kCount) * 100).toFixed(1));
  const velocityMultiplier = Number(Math.min(5.0, 1.0 + aMultiSum).toFixed(2));

  return {
    aMulti: Number(aMultiSum.toFixed(3)),
    velocityMultiplier,
    meanAcceptancePct,
    klDivergenceNats: Number(Math.abs(klSum).toFixed(4)),
    candidates,
  };
}

/**
 * Computes deterministic 8-Stream (X0..X7) verification matrix state.
 */
export function buildInitialStreams(corridorId: SyntheticCorridorId): StreamVerificationUnit[] {
  const baseTarget = [0.94, 0.91, 0.89, 0.92, 0.87];
  const baseDraft = [0.95, 0.93, 0.92, 0.94, 0.91];
  const calc = computeMultiTokenParallelAcceptance(baseTarget, baseDraft);

  const streams: StreamVerificationUnit[] = [];
  for (let i = 0; i < 8; i++) {
    const ptrVal = 0xf000 + i * 0x0010;
    const ptrHex = '0x' + ptrVal.toString(16).toUpperCase();
    const rateOffset = corridorId === SyntheticCorridorId.ALPHA ? 0 : -1.2;
    const accp = Number(Math.min(99.9, Math.max(50.0, 96.5 + rateOffset)).toFixed(1));

    streams.push({
      index: i,
      streamCode: 'X' + String(i),
      title: 'Stream ' + String(i) + ' (X' + String(i) + ')',
      pointerHex: ptrHex,
      tokensK: 256,
      acceptanceRatePct: accp,
      ringSyncPct: 100,
      latencyMs: 0.02,
      stateLabel: 'VERIFIED · LOCKED',
      acceptStatus: 'OK',
      aMultiScore: calc.aMulti,
      klDivergence: calc.klDivergenceNats,
    });
  }
  return streams;
}

/**
 * Rotates hardware verification buffer pointers across sub-microsecond step passes.
 */
export function rotateStreamPointerHex(currentHex: string, stepDelta: number): string {
  const clean = currentHex.replace(/^0x/i, '');
  const parsed = parseInt(clean, 16);
  const base = Number.isNaN(parsed) ? 0xf000 : parsed;
  const nextVal = 0xf000 + ((base - 0xf000 + stepDelta * 0x0004) % 0x0100);
  return '0x' + nextVal.toString(16).toUpperCase().padStart(4, '0');
}
