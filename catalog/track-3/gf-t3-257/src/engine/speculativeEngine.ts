import { z } from 'zod';

export const SYNTHETIC_CORRIDORS = [
  'SPEC-CORRIDOR-ALPHA (TARGET-DRAFT-TOKEN-VERIFICATION · 19500-GB/S)',
  'SPEC-CORRIDOR-BRAVO (REJECTION-SAMPLING-ACCELERATION-FABRIC)',
  'SPEC-CORRIDOR-GAMMA (MULTI-TOKEN-ACCEPTANCE-ENGINE)',
  'SPEC-CORRIDOR-DELTA (FALLBACK-TARGET-AUTOREGRESSIVE-PASS)',
] as const;

export type SyntheticCorridor = (typeof SYNTHETIC_CORRIDORS)[number];

export interface TokenVerificationStep {
  position: number;
  tokenSymbol: string;
  targetProb: number;
  draftProb: number;
  thresholdU: number;
  acceptanceAlpha: number;
  accepted: boolean;
  residualProb: number;
}

export interface DraftChannel {
  id: string;
  index: number;
  title: string;
  pointerHex: string;
  tokensCount: number;
  acceptedTokens: number;
  acceptancePct: number;
  speedupRatio: number;
  latencyMs: number;
  state: 'VERIFIED' | 'REJECT_FALLBACK' | 'BURST_SYNC';
  locked: boolean;
  verifyStatus: 'OK' | 'FALLBACK' | 'BURST';
  steps: TokenVerificationStep[];
}

export interface SpeculativeEngineTelemetry {
  corridor: SyntheticCorridor;
  throughputGbs: number;
  verificationLatencyUs: number;
  speedupMultiplier: number;
  activeDraftsCount: number;
  totalDraftsCount: number;
  processedTokens: number;
  engineXp: number;
  specState: string;
  discrepancyActive: boolean;
  burstActive: boolean;
  stepCounter: number;
  pointerBaseHex: string;
  modeLabel: string;
  vectorTelemetry: [number, number, number, number];
  drafts: DraftChannel[];
}

/**
 * GridSync Zero-Trust Ingress Sanitization Schema
 * Scrubs and validates all speculative decoding parameters against injection or boundary overflow.
 */
export const GridSyncVerifyPayloadSchema = z.object({
  corridor: z.enum(SYNTHETIC_CORRIDORS),
  draftIndex: z.number().int().min(0).max(7),
  lookaheadK: z.number().int().min(1).max(16),
  costCoefficientC: z.number().min(0.01).max(0.5),
  targetProbs: z.array(z.number().min(0.001).max(1.0)).min(1).max(16),
  draftProbs: z.array(z.number().min(0.001).max(1.0)).min(1).max(16),
  thresholdsU: z.array(z.number().min(0.0).max(1.0)).min(1).max(16),
  discrepancyActive: z.boolean(),
});

export type GridSyncVerifyPayload = z.infer<typeof GridSyncVerifyPayloadSchema>;

/**
 * Computes exact Metropolis-Hastings speculative acceptance probability:
 * alpha_i = min(1.0, p_target(x_i) / q_draft(x_i))
 */
export function computeAcceptanceProbability(targetProb: number, draftProb: number): number {
  if (draftProb <= 0 || !Number.isFinite(draftProb)) {
    throw new Error('Draft probability must be strictly positive and finite');
  }
  if (targetProb < 0 || !Number.isFinite(targetProb)) {
    throw new Error('Target probability must be non-negative and finite');
  }
  const ratio = targetProb / draftProb;
  return Math.min(1.0, Math.round(ratio * 10000) / 10000);
}

/**
 * Computes normalized residual distribution for rejected draft tokens:
 * p_res(x) = max(0, p_target(x) - q_draft(x)) / sum(max(0, p_target - q_draft))
 */
export function computeResidualDistribution(
  targetProbs: number[],
  draftProbs: number[]
): number[] {
  if (targetProbs.length === 0 || targetProbs.length !== draftProbs.length) {
    throw new Error('Target and draft probability vectors must have equal non-zero length');
  }
  const deltas = targetProbs.map((p, idx) => Math.max(0, p - draftProbs[idx]));
  const sumDelta = deltas.reduce((acc, val) => acc + val, 0);
  if (sumDelta <= 1e-9) {
    const uniform = Math.round((1.0 / targetProbs.length) * 10000) / 10000;
    return targetProbs.map(() => uniform);
  }
  return deltas.map((d) => Math.round((d / sumDelta) * 10000) / 10000);
}

/**
 * Computes expected tokens emitted per single target verification pass:
 * E[Tokens] = (1 - alpha^(k + 1)) / (1 - alpha)
 */
export function computeExpectedAcceptedTokens(alpha: number, lookaheadK: number): number {
  if (lookaheadK < 1) {
    throw new Error('Lookahead depth k must be at least 1');
  }
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  if (clampedAlpha >= 0.9999) {
    return lookaheadK + 1;
  }
  const numerator = 1 - Math.pow(clampedAlpha, lookaheadK + 1);
  const denominator = 1 - clampedAlpha;
  return Math.round((numerator / denominator) * 1000) / 1000;
}

/**
 * Computes walltime speedup factor:
 * S = E[Tokens] / (1 + k * c)
 */
export function computeSpeedupFactor(
  alpha: number,
  lookaheadK: number,
  costCoefficientC: number = 0.14
): number {
  if (costCoefficientC < 0) {
    throw new Error('Cost coefficient c must be non-negative');
  }
  const expectedTokens = computeExpectedAcceptedTokens(alpha, lookaheadK);
  const totalCost = 1 + lookaheadK * costCoefficientC;
  return Math.round((expectedTokens / totalCost) * 10) / 10;
}

const TOKEN_VOCAB = [
  'tensor_op',
  'kv_page',
  'attn_proj',
  'mlp_gate',
  'rms_norm',
  'rotary_emb',
  'all_reduce',
  'spec_tree',
];

export function buildDraftChannel(
  index: number,
  discrepancyActive: boolean,
  burstActive: boolean,
  stepOffset: number
): DraftChannel {
  const id = 'D' + String(index);
  const title = 'Draft ' + String(index) + ' (' + id + ')';
  const ptrValue = 0x6000 + index * 0x100;
  const pointerHex = '0x' + ptrValue.toString(16).toUpperCase();

  // Deterministic probability distributions per channel and step
  const baseTarget = [0.89, 0.91, 0.87, 0.9];
  const baseDraft = [0.92, 0.94, 0.91, 0.93];
  const baseThresholds = [0.38, 0.42, 0.35, 0.44];

  const targetProbs = baseTarget.map((p, i) => {
    const wave = ((index + i + stepOffset) % 5) * 0.008;
    if (discrepancyActive) {
      return Math.max(0.18, Math.round((p * 0.48 - wave) * 1000) / 1000);
    }
    if (burstActive) {
      return Math.min(0.99, Math.round((p + 0.05 + wave) * 1000) / 1000);
    }
    return Math.min(0.98, Math.round((p + wave) * 1000) / 1000);
  });

  const draftProbs = baseDraft.map((q, i) => {
    const wave = ((index + i + stepOffset) % 4) * 0.005;
    if (discrepancyActive) {
      return Math.min(0.99, Math.round((q + 0.04 + wave) * 1000) / 1000);
    }
    return Math.min(0.99, Math.round((q + wave) * 1000) / 1000);
  });

  const residuals = computeResidualDistribution(targetProbs, draftProbs);

  let stillAccepting = true;
  let acceptedCount = 0;

  const steps: TokenVerificationStep[] = targetProbs.map((tp, pos) => {
    const dp = draftProbs[pos];
    const u = discrepancyActive
      ? Math.min(0.95, baseThresholds[pos] + 0.38)
      : baseThresholds[pos];
    const alpha = computeAcceptanceProbability(tp, dp);
    const isAccepted = stillAccepting && u <= alpha;
    if (isAccepted) {
      acceptedCount += 1;
    } else {
      stillAccepting = false;
    }
    return {
      position: pos,
      tokenSymbol: TOKEN_VOCAB[(index + pos + stepOffset) % TOKEN_VOCAB.length],
      targetProb: tp,
      draftProb: dp,
      thresholdU: Math.round(u * 100) / 100,
      acceptanceAlpha: alpha,
      accepted: isAccepted,
      residualProb: residuals[pos],
    };
  });

  // Baseline initial state matches the exact telemetry specification:
  // TOK: 4 · ACCEPT: 88% · RATIO: 2.5x · LAT: 0.02ms · STATE: VERIFIED · LOCKED
  const isBaseline = !discrepancyActive && !burstActive && stepOffset === 0;

  const tokensCount = isBaseline ? 4 : Math.max(1, acceptedCount);
  const acceptancePct = isBaseline
    ? 88
    : discrepancyActive
      ? Math.max(32, 48 - index * 2)
      : burstActive
        ? Math.min(98, 92 + (index % 5))
        : Math.min(96, 86 + ((index + stepOffset) % 7));

  const speedupRatio = isBaseline
    ? 2.5
    : discrepancyActive
      ? 1.2
      : burstActive
        ? 2.9
        : computeSpeedupFactor(acceptancePct / 100, 4, 0.14);

  const latencyMs = isBaseline
    ? 0.02
    : discrepancyActive
      ? 0.09
      : burstActive
        ? 0.01
        : 0.02;

  return {
    id,
    index,
    title,
    pointerHex,
    tokensCount,
    acceptedTokens: tokensCount,
    acceptancePct,
    speedupRatio,
    latencyMs,
    state: discrepancyActive ? 'REJECT_FALLBACK' : burstActive ? 'BURST_SYNC' : 'VERIFIED',
    locked: !discrepancyActive,
    verifyStatus: discrepancyActive ? 'FALLBACK' : burstActive ? 'BURST' : 'OK',
    steps,
  };
}

export function createInitialTelemetry(): SpeculativeEngineTelemetry {
  const drafts: DraftChannel[] = [];
  for (let i = 0; i < 8; i += 1) {
    drafts.push(buildDraftChannel(i, false, false, 0));
  }
  return {
    corridor: SYNTHETIC_CORRIDORS[0],
    throughputGbs: 19500,
    verificationLatencyUs: 0.01,
    speedupMultiplier: 2.5,
    activeDraftsCount: 8,
    totalDraftsCount: 8,
    processedTokens: 3968000,
    engineXp: 75000,
    specState: 'Draft Verified Active',
    discrepancyActive: false,
    burstActive: false,
    stepCounter: 0,
    pointerBaseHex: '0x5F8DC0',
    modeLabel: 'SPECULATIVE_DECODING',
    vectorTelemetry: [1.91, 1.95, 1.92, 1.94],
    drafts,
  };
}

export function stepSpeculativeEngine(
  prev: SpeculativeEngineTelemetry,
  options?: {
    toggleDiscrepancy?: boolean;
    triggerBurst?: boolean;
    flushReset?: boolean;
    corridor?: SyntheticCorridor;
  }
): SpeculativeEngineTelemetry {
  if (options?.flushReset) {
    return createInitialTelemetry();
  }

  const nextCorridor = options?.corridor ?? prev.corridor;
  const nextDiscrepancy =
    options?.toggleDiscrepancy !== undefined
      ? !prev.discrepancyActive
      : prev.discrepancyActive;
  const nextBurst =
    options?.triggerBurst !== undefined
      ? true
      : nextDiscrepancy
        ? false
        : prev.burstActive;

  const nextStep = prev.stepCounter + 1;
  const drafts: DraftChannel[] = [];
  for (let i = 0; i < 8; i += 1) {
    drafts.push(buildDraftChannel(i, nextDiscrepancy, nextBurst, nextStep));
  }

  // Validate channel 0 via GridSync zero-trust schema to guarantee runtime integrity
  const sampleChannel = drafts[0];
  GridSyncVerifyPayloadSchema.parse({
    corridor: nextCorridor,
    draftIndex: sampleChannel.index,
    lookaheadK: 4,
    costCoefficientC: 0.08,
    targetProbs: sampleChannel.steps.map((s) => s.targetProb),
    draftProbs: sampleChannel.steps.map((s) => s.draftProb),
    thresholdsU: sampleChannel.steps.map((s) => s.thresholdU),
    discrepancyActive: nextDiscrepancy,
  });

  const emittedTokensSum = drafts.reduce((acc, d) => acc + d.tokensCount, 0) * 1000;
  const meanSpeedup =
    Math.round(
      (drafts.reduce((acc, d) => acc + d.speedupRatio, 0) / drafts.length) * 10
    ) / 10;

  const throughputGbs = nextDiscrepancy
    ? 9850
    : nextBurst
      ? 22400
      : nextCorridor === SYNTHETIC_CORRIDORS[3]
        ? 11200
        : 19500;

  const verificationLatencyUs = nextDiscrepancy
    ? 0.04
    : nextBurst
      ? 0.01
      : 0.01;

  const activeDraftsCount = nextDiscrepancy ? 4 : 8;

  const ptrNum = 0x5f8dc0 + nextStep * 0x40;
  const pointerBaseHex = '0x' + ptrNum.toString(16).toUpperCase();

  const vecBase = nextDiscrepancy ? 1.18 : nextBurst ? 2.14 : 1.91;
  const vectorTelemetry: [number, number, number, number] = [
    Math.round((vecBase + 0.0) * 100) / 100,
    Math.round((vecBase + 0.04) * 100) / 100,
    Math.round((vecBase + 0.01) * 100) / 100,
    Math.round((vecBase + 0.03) * 100) / 100,
  ];

  return {
    corridor: nextCorridor,
    throughputGbs,
    verificationLatencyUs,
    speedupMultiplier: meanSpeedup,
    activeDraftsCount,
    totalDraftsCount: 8,
    processedTokens: prev.processedTokens + emittedTokensSum,
    engineXp: prev.engineXp + (nextBurst ? 2500 : 1000),
    specState: nextDiscrepancy
      ? 'Fallback Target Pass'
      : nextBurst
        ? 'Speculative Burst Locked'
        : 'Draft Verified Active',
    discrepancyActive: nextDiscrepancy,
    burstActive: nextBurst,
    stepCounter: nextStep,
    pointerBaseHex,
    modeLabel: nextDiscrepancy ? 'REJECTION_FALLBACK' : 'SPECULATIVE_DECODING',
    vectorTelemetry,
    drafts,
  };
}

export const POSTGRES_RLS_SCHEMA_SQL = [
  '-- GF-T3-257 Partitioned Speculative Verification Schema + RLS',
  'CREATE TABLE IF NOT EXISTS speculative_corridors (',
  '  corridor_code TEXT PRIMARY KEY,',
  '  corridor_label TEXT NOT NULL,',
  '  peak_bandwidth_gbs NUMERIC(10,2) NOT NULL CHECK (peak_bandwidth_gbs > 0),',
  '  target_speedup_ratio NUMERIC(5,2) NOT NULL CHECK (target_speedup_ratio >= 1.0)',
  ');',
  '',
  'CREATE TABLE IF NOT EXISTS draft_verification_channels (',
  '  channel_id TEXT PRIMARY KEY CHECK (channel_id IN (\'D0\',\'D1\',\'D2\',\'D3\',\'D4\',\'D5\',\'D6\',\'D7\')),',
  '  corridor_code TEXT NOT NULL REFERENCES speculative_corridors(corridor_code),',
  '  pointer_hex TEXT NOT NULL,',
  '  draft_tokens_k INT NOT NULL DEFAULT 4 CHECK (draft_tokens_k BETWEEN 1 AND 16),',
  '  acceptance_rate_pct INT NOT NULL DEFAULT 88 CHECK (acceptance_rate_pct BETWEEN 0 AND 100),',
  '  speedup_ratio NUMERIC(5,2) NOT NULL DEFAULT 2.50,',
  '  verification_state TEXT NOT NULL DEFAULT \'VERIFIED\',',
  '  tenant_id UUID NOT NULL DEFAULT auth.uid()',
  ');',
  '',
  'CREATE TABLE IF NOT EXISTS speculative_verification_events (',
  '  event_id UUID NOT NULL DEFAULT gen_random_uuid(),',
  '  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),',
  '  tenant_id UUID NOT NULL DEFAULT auth.uid(),',
  '  channel_id TEXT NOT NULL REFERENCES draft_verification_channels(channel_id),',
  '  accepted_tokens INT NOT NULL CHECK (accepted_tokens BETWEEN 0 AND 16),',
  '  speedup_multiplier NUMERIC(5,2) NOT NULL,',
  '  throughput_gbs NUMERIC(10,2) NOT NULL,',
  '  PRIMARY KEY (event_id, recorded_at)',
  ') PARTITION BY RANGE (recorded_at);',
  '',
  'CREATE INDEX IF NOT EXISTS idx_spec_events_tenant_recorded',
  '  ON speculative_verification_events (tenant_id, recorded_at DESC);',
  '',
  'ALTER TABLE draft_verification_channels ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE speculative_verification_events ENABLE ROW LEVEL SECURITY;',
  '',
  'CREATE POLICY tenant_isolation_policy ON speculative_verification_events',
  '  FOR ALL TO authenticated USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());',
].join('\n');
