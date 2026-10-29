import { z } from 'zod';

export const SYNTHETIC_CORRIDORS = [
  'PREFILL-CORRIDOR-ALPHA (CHUNKED-PREFILL-DECODE-SPLIT · 13000-GB/S)',
  'PREFILL-CORRIDOR-BRAVO (ASYNCHRONOUS-GENERATION-OVERLAP-PIPELINE)',
  'PREFILL-CORRIDOR-GAMMA (INTERFERENCE-MITIGATION-SCHEDULER)',
  'PREFILL-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-PREFILL)',
] as const;

export type SyntheticCorridor = (typeof SYNTHETIC_CORRIDORS)[number];

const FORBIDDEN_PATTERNS = [
  'drop table',
  'delete from',
  'insert into',
  'union select',
  '<script',
  'javascript:',
  'onerror=',
  'onload=',
  '--',
  ';',
];

export const GridSyncIngressSchema = z.object({
  promptTokens: z.number().int().min(64).max(131072),
  chunkBoundTokens: z.number().int().min(64).max(4096),
  activeDecodeRequests: z.number().int().min(1).max(1024),
  corridor: z
    .string()
    .min(1)
    .refine(
      (val) => {
        const lower = val.toLowerCase();
        return !FORBIDDEN_PATTERNS.some((pat) => lower.includes(pat));
      },
      { message: 'GridSync Zero-Trust Violation: Malicious payload pattern detected' }
    )
    .refine(
      (val): val is SyntheticCorridor =>
        (SYNTHETIC_CORRIDORS as readonly string[]).includes(val),
      { message: 'GridSync Zero-Trust Violation: Unregistered synthetic prefill corridor' }
    ),
  saturationFault: z.boolean(),
  stepPassCount: z.number().int().min(0).max(100000),
  burstCount: z.number().int().min(0).max(100000),
  asyncOverlapEnabled: z.boolean(),
});

export type GridSyncIngressPayload = z.infer<typeof GridSyncIngressSchema>;

export interface ChunkSlotTelemetry {
  id: number;
  code: string;
  title: string;
  hexPtr: string;
  tokens: number;
  sizeMb: number;
  overlapPct: number;
  latencyMs: number;
  stateLabel: string;
  locked: boolean;
  decodeSync: 'OK' | 'RESYNC' | 'STALL_RISK';
  computeQuantaShare: number;
  decodeInterferenceUs: number;
  pipelineStage: string;
}

export interface PrefillEngineSnapshot {
  engineTitle: 'GF-T3-250';
  corridor: SyntheticCorridor;
  prefillThroughputGbs: number;
   formattedThroughput: string;
  overlapLatencyUs: number;
  formattedOverlapLatency: string;
  activeChunks: number;
  maxChunks: number;
  processedTokens: number;
  formattedProcessedTokens: string;
  prefillXpDelta: string;
  prefillState: string;
  modeTag: string;
  meshPtr: string;
  overlapAvgPct: number;
  featureVector: [number, number, number, number];
  chunks: ChunkSlotTelemetry[];
  zeroStallVerified: boolean;
}

export function sanitizeAndValidateIngress(raw: unknown): GridSyncIngressPayload {
  return GridSyncIngressSchema.parse(raw);
}

export function splitPromptIntoBoundedChunks(
  promptTokens: number,
  chunkBoundTokens: number = 512,
  maxChunks: number = 8
): number[] {
  if (!Number.isFinite(promptTokens) || promptTokens <= 0) {
    throw new Error('promptTokens must be a positive integer');
  }
  if (!Number.isFinite(chunkBoundTokens) || chunkBoundTokens <= 0) {
    throw new Error('chunkBoundTokens must be a positive integer');
  }
  if (!Number.isFinite(maxChunks) || maxChunks <= 0) {
    throw new Error('maxChunks must be a positive integer');
  }

  const requiredChunks = Math.ceil(promptTokens / chunkBoundTokens);
  const numChunks = Math.min(maxChunks, Math.max(1, requiredChunks));
  const allocations: number[] = [];
  let remaining = promptTokens;

  for (let i = 0; i < numChunks; i += 1) {
    const slotsLeft = numChunks - i;
    let chunkTokens: number;
    if (remaining <= chunkBoundTokens * slotsLeft) {
      chunkTokens = Math.min(chunkBoundTokens, Math.max(1, remaining));
    } else {
      chunkTokens = Math.ceil(remaining / slotsLeft);
    }
    allocations.push(chunkTokens);
    remaining = Math.max(0, remaining - chunkTokens);
  }

  return allocations;
}

export function computeChunkOverlapMetrics(
  chunkTokens: number,
  chunkBoundTokens: number,
  activeDecodeRequests: number,
  corridor: SyntheticCorridor,
  saturationFault: boolean,
  asyncOverlapEnabled: boolean
): {
  overlapPct: number;
  latencyMs: number;
  interferenceUs: number;
  quantaShare: number;
} {
  const isMonolithic = corridor.includes('FALLBACK-MONOLITHIC-PREFILL') || !asyncOverlapEnabled;
  const loadRatio = chunkTokens / Math.max(1, chunkBoundTokens);
  const decodePressure = Math.min(1.0, activeDecodeRequests / 512.0);

  if (isMonolithic) {
    const overlapPct = Math.max(42.0, Number((68.5 - loadRatio * 12.0).toFixed(1)));
    const latencyMs = Number((0.85 * loadRatio + 0.35 * decodePressure).toFixed(2));
    const interferenceUs = Number((14.2 * loadRatio).toFixed(3));
    const quantaShare = Number(Math.min(0.95, 0.78 + 0.1 * loadRatio).toFixed(3));
    return { overlapPct, latencyMs, interferenceUs, quantaShare };
  }

  if (saturationFault) {
    const overlapPct = Number(Math.max(84.2, 92.4 - loadRatio * 3.1).toFixed(1));
    const latencyMs = Number((0.28 * loadRatio + 0.08 * decodePressure).toFixed(2));
    const interferenceUs = Number((0.42 * loadRatio).toFixed(3));
    const quantaShare = Number(Math.min(0.85, 0.62 + 0.05 * loadRatio).toFixed(3));
    return { overlapPct, latencyMs, interferenceUs, quantaShare };
  }

  let baseOverlap = 99.8;
  if (corridor.includes('INTERFERENCE-MITIGATION')) {
    baseOverlap = 99.9;
  } else if (corridor.includes('ASYNCHRONOUS-GENERATION')) {
    baseOverlap = 99.85;
  }

  const penalty = Math.max(0.0, (loadRatio - 1.0) * 1.4);
  const overlapPct = Number(Math.max(95.0, baseOverlap - penalty).toFixed(1));
  const latencyMs = Number((0.12 * loadRatio).toFixed(2));
  const interferenceUs = Number((0.01 * loadRatio).toFixed(3));
  const quantaShare = Number((0.5 / Math.max(1.0, loadRatio * 0.5 + 0.5)).toFixed(3));

  return { overlapPct, latencyMs, interferenceUs, quantaShare };
}

export function formatWithCommas(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

export function evaluatePrefillEngineState(rawInput: GridSyncIngressPayload): PrefillEngineSnapshot {
  const validated = sanitizeAndValidateIngress(rawInput);
  const allocations = splitPromptIntoBoundedChunks(
    validated.promptTokens,
    validated.chunkBoundTokens,
    8
  );

  const chunks: ChunkSlotTelemetry[] = [];
  for (let idx = 0; idx < 8; idx += 1) {
    const tok = idx < allocations.length ? allocations[idx] : validated.chunkBoundTokens;
    const metrics = computeChunkOverlapMetrics(
      tok,
      validated.chunkBoundTokens,
      validated.activeDecodeRequests,
      validated.corridor,
      validated.saturationFault,
      validated.asyncOverlapEnabled
    );

    const rawSizeMb = (tok * 4096) / (1024 * 1024);
    const sizeMb = Number.isInteger(rawSizeMb) ? rawSizeMb : Number(rawSizeMb.toFixed(1));
    const hexPtr = '0xE' + String(idx) + '00';
    const isFaultedChunk = validated.saturationFault && (idx === 2 || idx === 5);
    const isMonolithic =
      validated.corridor.includes('FALLBACK-MONOLITHIC-PREFILL') || !validated.asyncOverlapEnabled;

    let stateLabel = 'PIPELINED · LOCKED';
    let locked = true;
    let decodeSync: 'OK' | 'RESYNC' | 'STALL_RISK' = 'OK';
    let pipelineStage =
      'ASYNC_OVERLAP_STAGE_' + String((idx + validated.stepPassCount + validated.burstCount) % 4);

    if (isFaultedChunk) {
      stateLabel = 'SATURATED · FAULT';
      locked = false;
      decodeSync = 'RESYNC';
      pipelineStage = 'QUANTA_RESYNC_BARRIER';
    } else if (isMonolithic) {
      stateLabel = 'SERIALIZED · LOCKED';
      locked = true;
      decodeSync = 'STALL_RISK';
      pipelineStage = 'MONOLITHIC_BLOCKING_PASS';
    }

    chunks.push({
      id: idx,
      code: 'C' + String(idx),
      title: 'Chunk ' + String(idx) + ' (C' + String(idx) + ')',
      hexPtr,
      tokens: tok,
      sizeMb,
      overlapPct: metrics.overlapPct,
      latencyMs: metrics.latencyMs,
      stateLabel,
      locked,
      decodeSync,
      computeQuantaShare: metrics.quantaShare,
      decodeInterferenceUs: metrics.interferenceUs,
      pipelineStage,
    });
  }

  const totalOverlap = chunks.reduce((acc, c) => acc + c.overlapPct, 0);
  const overlapAvgPct = Number((totalOverlap / chunks.length).toFixed(1));
  const isMonolithic =
    validated.corridor.includes('FALLBACK-MONOLITHIC-PREFILL') || !validated.asyncOverlapEnabled;

  let prefillThroughputGbs = 13000 + validated.stepPassCount * 150 + validated.burstCount * 250;
  let overlapLatencyUs = 0.01;
  let prefillState = 'Chunked Active';
  let modeTag = 'CHUNKED_PREFILL';
  let zeroStallVerified = true;

  if (isMonolithic) {
    prefillThroughputGbs = 7400;
    overlapLatencyUs = 1.45;
    prefillState = 'Monolithic Fallback';
    modeTag = 'MONOLITHIC_FALLBACK';
    zeroStallVerified = false;
  } else if (validated.saturationFault) {
    prefillThroughputGbs = 10850;
    overlapLatencyUs = 0.09;
    prefillState = 'Chunk Resync Active';
    modeTag = 'SATURATION_RESYNC';
    zeroStallVerified = false;
  }

  const processedTokens =
    3072000 + validated.stepPassCount * 50000 + validated.burstCount * 128000;
  const xpRate = 50.0 + validated.stepPassCount * 2.5 + validated.burstCount * 5.0;
  const offset = (validated.stepPassCount + validated.burstCount) * 0.01;

  const featureVector: [number, number, number, number] = [
    Number((1.22 + offset).toFixed(2)),
    Number((1.25 + offset).toFixed(2)),
    Number((1.21 + offset).toFixed(2)),
    Number((1.23 + offset).toFixed(2)),
  ];

  return {
    engineTitle: 'GF-T3-250',
    corridor: validated.corridor,
    prefillThroughputGbs,
    formattedThroughput: formatWithCommas(prefillThroughputGbs) + ' GB/s',
    overlapLatencyUs,
    formattedOverlapLatency: overlapLatencyUs.toFixed(2) + ' µs',
    activeChunks: chunks.filter((c) => c.locked).length,
    maxChunks: 8,
    processedTokens,
    formattedProcessedTokens: formatWithCommas(processedTokens) + ' UNITS',
    prefillXpDelta: '+' + xpRate.toFixed(1) + 'k PREFILL XP',
    prefillState,
    modeTag,
    meshPtr: '0xDF8DC0',
    overlapAvgPct,
    featureVector,
    chunks,
    zeroStallVerified,
  };
}

export const SUPABASE_SQL_SCHEMA_EXPORT = `-- GF-T3-250 PostgreSQL / Supabase Persistence Layer
-- Partitioned Chunk Telemetry + Row-Level Security (RLS)

CREATE TABLE IF NOT EXISTS prefill_corridors (
  corridor_code TEXT PRIMARY KEY,
  corridor_label TEXT NOT NULL UNIQUE,
  max_bandwidth_gbs INTEGER NOT NULL CHECK (max_bandwidth_gbs > 0),
  target_overlap_pct NUMERIC(5,2) NOT NULL CHECK (target_overlap_pct BETWEEN 0 AND 100)
);

CREATE TABLE IF NOT EXISTS prefill_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  engine_id TEXT NOT NULL DEFAULT 'GF-T3-250',
  corridor_code TEXT NOT NULL REFERENCES prefill_corridors(corridor_code),
  prompt_tokens INTEGER NOT NULL CHECK (prompt_tokens BETWEEN 64 AND 131072),
  prefill_throughput_gbs INTEGER NOT NULL,
  overlap_latency_us NUMERIC(8,3) NOT NULL,
  processed_tokens BIGINT NOT NULL DEFAULT 3072000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prefill_chunk_telemetry (
  telemetry_id UUID NOT NULL DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES prefill_sessions(session_id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  chunk_index SMALLINT NOT NULL CHECK (chunk_index BETWEEN 0 AND 7),
  hex_ptr TEXT NOT NULL,
  token_count INTEGER NOT NULL,
  overlap_pct NUMERIC(5,2) NOT NULL,
  latency_ms NUMERIC(8,3) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (telemetry_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

ALTER TABLE prefill_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prefill_chunk_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_tenant_sessions_isolation ON prefill_sessions
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

CREATE POLICY rls_tenant_chunks_isolation ON prefill_chunk_telemetry
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());`;
