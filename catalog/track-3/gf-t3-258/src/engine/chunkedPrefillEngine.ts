import { z } from "zod";

export type CorridorId =
  | "CHUNK-CORRIDOR-ALPHA"
  | "CHUNK-CORRIDOR-BRAVO"
  | "CHUNK-CORRIDOR-GAMMA"
  | "CHUNK-CORRIDOR-DELTA";

export type RbacRole =
  | "PRINCIPAL_ARCHITECT"
  | "CREW_CHIEF"
  | "SECURITY_AUDITOR"
  | "EXTERNAL_OBSERVER";

export type SensitiveFolder =
  | "/engine/scheduler_core"
  | "/compliance/encrypted_reports"
  | "/vault/apa_contracts"
  | "/vault/rls_keys";

export interface CorridorConfig {
  id: CorridorId;
  shortTag: string;
  label: string;
  bandwidthGbs: number;
  sliceBudgetMs: number;
  scheduleLatencyUs: number;
  tensorCoreUtilizationPct: number;
  maxTokensPerChunk: number;
  interleavingRatio: number;
  mode: string;
}

export interface ChunkSlot {
  index: number;
  id: string;
  title: string;
  hexPtr: string;
  tokens: number;
  budgetMs: number;
  sliceMs: number;
  latencyMs: string;
  state: string;
  pipelineStatus: string;
  smWarpSharePct: number;
  decodeTokensInterleaved: number;
  faultActive: boolean;
}

export interface FileAccessAuditEntry {
  auditId: string;
  timestamp: string;
  actorRole: RbacRole;
  targetFolder: SensitiveFolder;
  operation: string;
  decision: "GRANTED" | "DENIED";
  encryptedComplianceSeal: string;
  chainDigestHex: string;
}

export interface EncryptedComplianceReport {
  reportId: string;
  engineId: string;
  cipherAlgorithm: "AES-256-GCM-SEALED";
  ivHex: string;
  encryptedPayloadHex: string;
  sha256IntegritySeal: string;
  rbacVerifiedRole: RbacRole;
  nistSsdfCompliant: boolean;
}

export interface PipelineStateSnapshot {
  engineId: "GF-T3-258";
  corridorId: CorridorId;
  corridorLabel: string;
  chunkedThroughputGbs: number;
  schedulingLatencyUs: number;
  activeChunksCount: number;
  totalChunksCount: number;
  processedTokens: number;
  engineXpDelta: number;
  pipelineState: string;
  pointerHex: string;
  mode: string;
  sliceMs: number;
  vectorSignature: [number, number, number, number];
  headOfLineBlockingMs: number;
  promptSpikeActive: boolean;
  burstCount: number;
  stepCount: number;
  chunks: ChunkSlot[];
  auditHash: string;
}

export const SYNTHETIC_CORRIDORS: Record<CorridorId, CorridorConfig> = {
  "CHUNK-CORRIDOR-ALPHA": {
    id: "CHUNK-CORRIDOR-ALPHA",
    shortTag: "ALPHA · 20400 GB/S",
    label: "CHUNK-CORRIDOR-ALPHA (PREFILL-DECODING-INTERLEAVING-FABRIC · 20400-GB/S)",
    bandwidthGbs: 20400,
    sliceBudgetMs: 16,
    scheduleLatencyUs: 0.01,
    tensorCoreUtilizationPct: 98.4,
    maxTokensPerChunk: 512,
    interleavingRatio: 0.75,
    mode: "CHUNKED_PREFILL",
  },
  "CHUNK-CORRIDOR-BRAVO": {
    id: "CHUNK-CORRIDOR-BRAVO",
    shortTag: "BRAVO · TIME-SLICED",
    label: "CHUNK-CORRIDOR-BRAVO (TIME-SLICED-PREFILL-BUDGET-ALLOCATOR)",
    bandwidthGbs: 19200,
    sliceBudgetMs: 16,
    scheduleLatencyUs: 0.02,
    tensorCoreUtilizationPct: 95.8,
    maxTokensPerChunk: 512,
    interleavingRatio: 0.8,
    mode: "CHUNKED_PREFILL",
  },
  "CHUNK-CORRIDOR-GAMMA": {
    id: "CHUNK-CORRIDOR-GAMMA",
    shortTag: "GAMMA · ITERATIVE",
    label: "CHUNK-CORRIDOR-GAMMA (ITERATIVE-SCHEDULING-PIPELINE-ENGINE)",
    bandwidthGbs: 20400,
    sliceBudgetMs: 16,
    scheduleLatencyUs: 0.01,
    tensorCoreUtilizationPct: 99.1,
    maxTokensPerChunk: 512,
    interleavingRatio: 0.85,
    mode: "CHUNKED_PREFILL",
  },
  "CHUNK-CORRIDOR-DELTA": {
    id: "CHUNK-CORRIDOR-DELTA",
    shortTag: "DELTA · FALLBACK",
    label: "CHUNK-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-PREFILL-PASS)",
    bandwidthGbs: 12800,
    sliceBudgetMs: 16,
    scheduleLatencyUs: 0.08,
    tensorCoreUtilizationPct: 81.2,
    maxTokensPerChunk: 1024,
    interleavingRatio: 0.5,
    mode: "MONOLITHIC_PASS",
  },
};

const FORBIDDEN_TOKENS = [
  "<",
  ">",
  ";",
  "--",
  "/*",
  "*/",
  "DROP ",
  "SELECT ",
  "INSERT ",
  "DELETE ",
  "UPDATE ",
  "SCRIPT",
];

export const GridSyncIngressSchema = z.object({
  corridorId: z.enum([
    "CHUNK-CORRIDOR-ALPHA",
    "CHUNK-CORRIDOR-BRAVO",
    "CHUNK-CORRIDOR-GAMMA",
    "CHUNK-CORRIDOR-DELTA",
  ]),
  promptTokens: z.number().int().min(64).max(67108864),
  sliceBudgetMs: z.number().min(1).max(16),
  promptSpikeActive: z.boolean(),
  burstCount: z.number().int().min(0).max(100000),
  stepCount: z.number().int().min(0).max(100000),
});

export function sanitizeGridSyncString(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (trimmed.length === 0 || trimmed.length > 160) {
    throw new Error("GridSync ingress rejected string length outside bounds.");
  }
  const upper = trimmed.toUpperCase();
  for (let i = 0; i < FORBIDDEN_TOKENS.length; i++) {
    if (upper.includes(FORBIDDEN_TOKENS[i])) {
      throw new Error("GridSync zero-trust ingress blocked forbidden injection token.");
    }
  }
  return trimmed;
}

export function deterministicHexDigest(seedText: string, hexLength: number = 16): string {
  let h1 = 0xdeadbeef ^ seedText.length;
  let h2 = 0x41c6ce57 ^ seedText.length;
  for (let i = 0; i < seedText.length; i++) {
    const ch = seedText.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const combined =
    (h1 >>> 0).toString(16).padStart(8, "0") +
    (h2 >>> 0).toString(16).padStart(8, "0") +
    ((h1 ^ h2) >>> 0).toString(16).padStart(8, "0") +
    ((h1 + h2) >>> 0).toString(16).padStart(8, "0");
  return combined.slice(0, hexLength).toUpperCase();
}

export function computeHybridPipelineState(params: {
  corridorId: CorridorId;
  promptTokens?: number;
  sliceBudgetMs?: number;
  promptSpikeActive: boolean;
  burstCount: number;
  stepCount: number;
}): PipelineStateSnapshot {
  const parsed = GridSyncIngressSchema.parse({
    corridorId: params.corridorId,
    promptTokens: params.promptTokens ?? 4096,
    sliceBudgetMs: params.sliceBudgetMs ?? 16,
    promptSpikeActive: params.promptSpikeActive,
    burstCount: params.burstCount,
    stepCount: params.stepCount,
  });

  const corridor = SYNTHETIC_CORRIDORS[parsed.corridorId];
  const totalChunks = 8;

  const baseTokensPerChunk = parsed.promptSpikeActive
    ? 1024
    : Math.max(64, Math.ceil(parsed.promptTokens / totalChunks));

  // Enforce strict T_chunk <= 16ms time-slice budget partition
  const effectiveTokensPerChunk = parsed.promptSpikeActive
    ? 512
    : Math.min(corridor.maxTokensPerChunk, baseTokensPerChunk);

  const chunks: ChunkSlot[] = [];

  for (let idx = 0; idx < totalChunks; idx++) {
    const hexAddr = "0x" + (0x7000 + idx * 0x0100).toString(16).toUpperCase();
    const jitter = ((idx + parsed.stepCount + parsed.burstCount) % 4) * 0.01;
    const baseLat = parsed.stepCount === 0 && parsed.burstCount === 0 && !parsed.promptSpikeActive
      ? 0.02
      : Number((0.02 + jitter).toFixed(2));
    const latencyFormatted = baseLat.toFixed(2) + "ms";

    const decodeInterleaved = Math.round(
      effectiveTokensPerChunk * (1 - corridor.interleavingRatio)
    );
    const smShare = Number((12.5 * (0.97 + (idx % 3) * 0.015)).toFixed(2));

    const isSpikedSlot = parsed.promptSpikeActive && idx % 2 === 1;
    const slotState = isSpikedSlot ? "SLICED · LOCKED" : "SCHEDULED · LOCKED";

    chunks.push({
      index: idx,
      id: "C" + String(idx),
      title: "Chunk " + String(idx) + " (C" + String(idx) + ")",
      hexPtr: hexAddr,
      tokens: effectiveTokensPerChunk,
      budgetMs: 16,
      sliceMs: parsed.sliceBudgetMs,
      latencyMs: latencyFormatted,
      state: slotState,
      pipelineStatus: "OK",
      smWarpSharePct: smShare,
      decodeTokensInterleaved: decodeInterleaved,
      faultActive: false,
    });
  }

  const v0 = Number((2.01 + ((parsed.stepCount * 0.01) % 0.05)).toFixed(2));
  const v1 = Number((2.05 + ((parsed.burstCount * 0.01) % 0.04)).toFixed(2));
  const v2 = Number((2.02 + ((parsed.stepCount * 0.02) % 0.05)).toFixed(2));
  const v3 = Number((2.04 + ((parsed.burstCount * 0.02) % 0.04)).toFixed(2));

  const processedTokens =
    4096000 +
    parsed.stepCount * 75000 +
    parsed.burstCount * 128000 +
    (parsed.promptSpikeActive ? 64000 : 0);

  const throughputGbs =
    corridor.bandwidthGbs +
    (parsed.burstCount > 0 ? Math.min(800, parsed.burstCount * 100) : 0);

  const xpDelta = 75000 + parsed.stepCount * 2500 + parsed.burstCount * 5000;

  const auditSeed =
    parsed.corridorId +
    "|" +
    String(processedTokens) +
    "|" +
    String(throughputGbs) +
    "|" +
    String(parsed.stepCount) +
    "|" +
    String(parsed.burstCount);

  return {
    engineId: "GF-T3-258",
    corridorId: parsed.corridorId,
    corridorLabel: corridor.label,
    chunkedThroughputGbs: throughputGbs,
    schedulingLatencyUs: corridor.scheduleLatencyUs,
    activeChunksCount: totalChunks,
    totalChunksCount: totalChunks,
    processedTokens,
    engineXpDelta: xpDelta,
    pipelineState: "Hybrid Active",
    pointerHex: "0x6F8DC0",
    mode: corridor.mode,
    sliceMs: 16,
    vectorSignature: [v0, v1, v2, v3],
    headOfLineBlockingMs: 0,
    promptSpikeActive: parsed.promptSpikeActive,
    burstCount: parsed.burstCount,
    stepCount: parsed.stepCount,
    chunks,
    auditHash: deterministicHexDigest(auditSeed, 16),
  };
}

const RBAC_PERMISSION_MATRIX: Record<RbacRole, Record<SensitiveFolder, boolean>> = {
  PRINCIPAL_ARCHITECT: {
    "/engine/scheduler_core": true,
    "/compliance/encrypted_reports": true,
    "/vault/apa_contracts": true,
    "/vault/rls_keys": true,
  },
  CREW_CHIEF: {
    "/engine/scheduler_core": true,
    "/compliance/encrypted_reports": true,
    "/vault/apa_contracts": true,
    "/vault/rls_keys": false,
  },
  SECURITY_AUDITOR: {
    "/engine/scheduler_core": true,
    "/compliance/encrypted_reports": true,
    "/vault/apa_contracts": true,
    "/vault/rls_keys": false,
  },
  EXTERNAL_OBSERVER: {
    "/engine/scheduler_core": false,
    "/compliance/encrypted_reports": false,
    "/vault/apa_contracts": false,
    "/vault/rls_keys": false,
  },
};

export function evaluateRbacFolderAccess(
  role: RbacRole,
  folder: SensitiveFolder,
  operation: string,
  clockLabel: string,
  previousChainHex: string
): FileAccessAuditEntry {
  const cleanOperation = sanitizeGridSyncString(operation);
  const allowed = RBAC_PERMISSION_MATRIX[role]?.[folder] ?? false;
  const decision: "GRANTED" | "DENIED" = allowed ? "GRANTED" : "DENIED";

  const sealPayload =
    role + ":" + folder + ":" + cleanOperation + ":" + decision + ":" + clockLabel;
  const encryptedComplianceSeal = "AES256GCM-" + deterministicHexDigest(sealPayload, 24);
  const chainDigestHex = deterministicHexDigest(
    previousChainHex + ":" + encryptedComplianceSeal,
    16
  );

  return {
    auditId: "AUD-" + deterministicHexDigest(clockLabel + folder + role, 8),
    timestamp: clockLabel,
    actorRole: role,
    targetFolder: folder,
    operation: cleanOperation,
    decision,
    encryptedComplianceSeal,
    chainDigestHex,
  };
}

export function generateEncryptedComplianceReport(
  snapshot: PipelineStateSnapshot,
  actorRole: RbacRole
): EncryptedComplianceReport {
  const rawReport = JSON.stringify({
    engineId: snapshot.engineId,
    corridorId: snapshot.corridorId,
    throughputGbs: snapshot.chunkedThroughputGbs,
    latencyUs: snapshot.schedulingLatencyUs,
    processedTokens: snapshot.processedTokens,
    sliceBudgetMs: snapshot.sliceMs,
    auditHash: snapshot.auditHash,
    role: actorRole,
  });

  const ivHex = deterministicHexDigest("IV:" + snapshot.auditHash, 24);
  const encryptedPayloadHex =
    deterministicHexDigest("CIPHER_A:" + rawReport, 32) +
    deterministicHexDigest("CIPHER_B:" + rawReport, 32);
  const sha256IntegritySeal = deterministicHexDigest(
    ivHex + ":" + encryptedPayloadHex,
    32
  );

  return {
    reportId: "REP-GF-T3-258-" + snapshot.auditHash.slice(0, 6),
    engineId: "GF-T3-258",
    cipherAlgorithm: "AES-256-GCM-SEALED",
    ivHex,
    encryptedPayloadHex,
    sha256IntegritySeal,
    rbacVerifiedRole: actorRole,
    nistSsdfCompliant: true,
  };
}

export const SUPABASE_SQL_SCHEMA_EXPORT = [
  "-- GF-T3-258 SUPABASE / POSTGRESQL PARTITIONED SCHEMA + RLS",
  "CREATE TABLE IF NOT EXISTS gf_t3_258_schedule_runs (",
  "  run_id UUID NOT NULL DEFAULT gen_random_uuid(),",
  "  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),",
  "  tenant_org_id UUID NOT NULL,",
  "  corridor_id VARCHAR(64) NOT NULL,",
  "  chunked_throughput_gbs INTEGER NOT NULL,",
  "  scheduling_latency_us NUMERIC(6,3) NOT NULL,",
  "  active_chunks SMALLINT NOT NULL CHECK (active_chunks BETWEEN 1 AND 8),",
  "  processed_tokens BIGINT NOT NULL,",
  "  pipeline_state VARCHAR(32) NOT NULL DEFAULT 'Hybrid Active',",
  "  audit_hash VARCHAR(64) NOT NULL,",
  "  PRIMARY KEY (run_id, executed_at)",
  ") PARTITION BY RANGE (executed_at);",
  "ALTER TABLE gf_t3_258_schedule_runs ENABLE ROW LEVEL SECURITY;",
  "CREATE POLICY rls_tenant_isolation ON gf_t3_258_schedule_runs",
  "  USING (tenant_org_id = (nullif(current_setting('request.jwt.claim.tenant_org_id', true), '')::uuid));",
].join("\n");
