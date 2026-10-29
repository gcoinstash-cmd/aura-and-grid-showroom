/**
 * GF-T3-275 Ultra-Wide Dynamic Batching & Continuous In-Flight Request Scheduler Engine
 * Deterministic Mathematical Core + GridSync Zero-Trust Zod Ingress Middleware
 * Zero-Currency Symbol Compliant (0 occurrences of ASCII 36)
 */

import { z } from "zod";

export const SYNTHETIC_CORRIDOR_LIST = [
  "BATCH-CORRIDOR-ALPHA (CONTINUOUS-IN-FLIGHT-REQUEST-SCHEDULER-FABRIC · 34400-GB/S)",
  "BATCH-CORRIDOR-BRAVO (DYNAMIC-ITERATION-STEP-REALLOCATION-ENGINE)",
  "BATCH-CORRIDOR-GAMMA (NON-BLOCKING-REQUEST-JOINING-ROUTER)",
  "BATCH-CORRIDOR-DELTA (FALLBACK-STATIC-BATCH-PASS)",
] as const;

export type SyntheticBatchCorridor = (typeof SYNTHETIC_CORRIDOR_LIST)[number];

export interface CorridorProfile {
  corridorId: string;
  label: SyntheticBatchCorridor;
  modeTag: string;
  peakBandwidthGbps: number;
  baseSchedulingLatencyUs: number;
  tensorAllocationEfficiency: number;
  nonBlockingJoin: boolean;
}

export const CORRIDOR_PROFILES: Record<SyntheticBatchCorridor, CorridorProfile> = {
  "BATCH-CORRIDOR-ALPHA (CONTINUOUS-IN-FLIGHT-REQUEST-SCHEDULER-FABRIC · 34400-GB/S)": {
    corridorId: "BATCH-CORRIDOR-ALPHA",
    label: "BATCH-CORRIDOR-ALPHA (CONTINUOUS-IN-FLIGHT-REQUEST-SCHEDULER-FABRIC · 34400-GB/S)",
    modeTag: "CONTINUOUS_BATCH",
    peakBandwidthGbps: 34400,
    baseSchedulingLatencyUs: 0.01,
    tensorAllocationEfficiency: 1.0,
    nonBlockingJoin: true,
  },
  "BATCH-CORRIDOR-BRAVO (DYNAMIC-ITERATION-STEP-REALLOCATION-ENGINE)": {
    corridorId: "BATCH-CORRIDOR-BRAVO",
    label: "BATCH-CORRIDOR-BRAVO (DYNAMIC-ITERATION-STEP-REALLOCATION-ENGINE)",
    modeTag: "DYNAMIC_STEP_REALLOC",
    peakBandwidthGbps: 31200,
    baseSchedulingLatencyUs: 0.02,
    tensorAllocationEfficiency: 0.96,
    nonBlockingJoin: true,
  },
  "BATCH-CORRIDOR-GAMMA (NON-BLOCKING-REQUEST-JOINING-ROUTER)": {
    corridorId: "BATCH-CORRIDOR-GAMMA",
    label: "BATCH-CORRIDOR-GAMMA (NON-BLOCKING-REQUEST-JOINING-ROUTER)",
    modeTag: "NON_BLOCKING_JOIN",
    peakBandwidthGbps: 28800,
    baseSchedulingLatencyUs: 0.03,
    tensorAllocationEfficiency: 0.92,
    nonBlockingJoin: true,
  },
  "BATCH-CORRIDOR-DELTA (FALLBACK-STATIC-BATCH-PASS)": {
    corridorId: "BATCH-CORRIDOR-DELTA",
    label: "BATCH-CORRIDOR-DELTA (FALLBACK-STATIC-BATCH-PASS)",
    modeTag: "STATIC_FALLBACK_PASS",
    peakBandwidthGbps: 17200,
    baseSchedulingLatencyUs: 0.09,
    tensorAllocationEfficiency: 0.68,
    nonBlockingJoin: false,
  },
};

const BLOCKED_INJECTION_TOKENS = [
  "DROP TABLE",
  "UNION SELECT",
  "INSERT INTO",
  "DELETE FROM",
  "UPDATE ",
  "--",
  ";",
  "<SCRIPT",
  "JAVASCRIPT:",
  "ONERROR=",
  "__PROTO__",
  "CONSTRUCTOR",
];

/**
 * GridSync Zero-Trust String Sanitizer
 * Blocks SQL injection, XSS vectors, prototype pollution, and forbidden ASCII 36 character.
 */
export function sanitizeGridSyncString(rawInput: string): string {
  if (typeof rawInput !== "string") {
    throw new Error("GridSync validation error: input must be a string");
  }
  const trimmed = rawInput.trim();
  if (trimmed.length === 0) {
    throw new Error("GridSync validation error: input cannot be empty");
  }
  if (trimmed.indexOf(String.fromCharCode(36)) !== -1) {
    throw new Error("GridSync security gate: forbidden currency symbol detected");
  }
  const upper = trimmed.toUpperCase();
  for (const token of BLOCKED_INJECTION_TOKENS) {
    if (upper.indexOf(token) !== -1) {
      throw new Error("GridSync security gate blocked malicious vector: " + token);
    }
  }
  return trimmed;
}

export const GridSyncActionPayloadSchema = z
  .object({
    corridor: z.enum(SYNTHETIC_CORRIDOR_LIST),
    selectedSlotIndex: z.number().int().min(0).max(7),
    addedTokensK: z.number().int().min(1).max(256),
    addedRequests: z.number().int().min(1).max(64),
    operatorCallsign: z.string().min(2).max(64),
  })
  .strict();

export type GridSyncActionPayload = z.infer<typeof GridSyncActionPayloadSchema>;

export function validateGridSyncPayload(input: unknown): GridSyncActionPayload {
  const parsed = GridSyncActionPayloadSchema.parse(input);
  sanitizeGridSyncString(parsed.operatorCallsign);
  sanitizeGridSyncString(parsed.corridor);
  return parsed;
}

export interface BatchSlotTelemetry {
  slotIndex: number;
  slotId: string;
  titleLabel: string;
  hexPtr: string;
  inspectorPtr: string;
  tokensK: number;
  queueReq: number;
  latencyMs: number;
  ratePct: number;
  statusLabel: string;
  locked: boolean;
  iterationStep: number;
}

export interface RadioCommsLogEntry {
  timestamp: string;
  icon: string;
  callsign: "CREW CHIEF" | "TELEMETRY" | "PIT WALL";
  message: string;
}

export interface ContinuousBatchState {
  projectTitle: "GF-T3-275";
  corridor: SyntheticBatchCorridor;
  meshPtr: string;
  modeTag: string;
  activeBatchesCount: number;
  totalBatchesCapacity: number;
  batchThroughputGbps: number;
  throughputSaturationPct: number;
  schedulingLatencyUs: number;
  processedTokensUnits: number;
  engineXpK: number;
  batchStateLabel: string;
  concurrencySpikeActive: boolean;
  burstCycleCount: number;
  stepPassCount: number;
  selectedSlotIndex: number;
  vectorTelemetry: [number, number, number, number];
  slots: BatchSlotTelemetry[];
  radioLogs: RadioCommsLogEntry[];
}

/**
 * Continuous In-Flight Request Batching Formula:
 * B_cont = sum_{j=1..M} Token_active(j) + Queue_pending
 */
export function computeContinuousBatchTokens(
  activeTokensPerSlotK: number[],
  pendingQueuePerSlot: number[],
  tokensPerRequestK = 2
): number {
  if (activeTokensPerSlotK.length !== pendingQueuePerSlot.length) {
    throw new Error("Slot token array and queue array must have equal length");
  }
  if (activeTokensPerSlotK.length === 0) {
    return 0;
  }
  let activeSumK = 0;
  let pendingSumK = 0;
  for (let i = 0; i < activeTokensPerSlotK.length; i += 1) {
    activeSumK += Math.max(0, activeTokensPerSlotK[i]);
    pendingSumK += Math.max(0, pendingQueuePerSlot[i]) * Math.max(1, tokensPerRequestK);
  }
  const continuousPipelineMultiplier = 2.6;
  return Math.round((activeSumK + pendingSumK) * continuousPipelineMultiplier * 1000);
}

/**
 * Dynamic Iteration Step Reallocation Formula:
 * Computes per-slot tensor core rate (%) and scheduling latency (ms)
 */
export function computeDynamicStepReallocation(
  tokensK: number,
  queueReq: number,
  corridorEfficiency: number,
  spikeActive: boolean
): { ratePct: number; latencyMs: number } {
  if (tokensK < 0 || queueReq < 0) {
    throw new Error("Token count and queue requests must be non-negative");
  }
  const clampedEff = Math.max(0.1, Math.min(1.0, corridorEfficiency));
  const loadRatio = (tokensK + queueReq * 2.0) / 320.0;
  const rawPct = clampedEff * 100.0 * Math.min(1.0, loadRatio);
  const ratePct = Math.round(Math.min(100, Math.max(50, rawPct)));
  const baseMs = 0.02 / clampedEff;
  const spikePenaltyMs = spikeActive ? queueReq / 1600.0 : 0.0;
  const latencyMs = Number((baseMs + spikePenaltyMs).toFixed(2));
  return { ratePct, latencyMs };
}

/**
 * Sub-Microsecond Queue Synchronization Formula:
 * Coordinates waiting requests across streaming multiprocessors with zero CPU polling overhead.
 */
export function computeSubMicrosecondSyncLatency(
  baseLatencyUs: number,
  activeSlotsCount: number,
  spikeActive: boolean,
  stepPassCount: number
): number {
  if (activeSlotsCount <= 0) {
    return 0.09;
  }
  const smBalanceFactor = 8.0 / Math.max(1, activeSlotsCount);
  const stepDamping = Math.max(0.85, 1.0 - stepPassCount * 0.01);
  const spikeOffset = spikeActive ? 0.02 : 0.0;
  const computed = baseLatencyUs * smBalanceFactor * stepDamping + spikeOffset;
  return Number(Math.max(0.01, computed).toFixed(2));
}

export function computeSaturatedThroughputGbps(
  peakGbps: number,
  slots: BatchSlotTelemetry[],
  spikeActive: boolean
): number {
  if (slots.length === 0) {
    return 0;
  }
  const avgRate = slots.reduce((acc, s) => acc + s.ratePct, 0) / (100.0 * slots.length);
  const lockedRatio = slots.filter((s) => s.locked).length / slots.length;
  const spikeFactor = spikeActive ? 0.94 : 1.0;
  const gbps = peakGbps * avgRate * (0.85 + 0.15 * lockedRatio) * spikeFactor;
  return Math.round(gbps);
}

export function formatStopwatchTimestamp(totalTickCount: number): string {
  const baseHundredths = 104 + totalTickCount * 4;
  const totalSeconds = Math.floor(baseHundredths / 100);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const hundredths = baseHundredths % 100;
  const mm = mins < 10 ? "0" + String(mins) : String(mins);
  const ss = secs < 10 ? "0" + String(secs) : String(secs);
  const hs = hundredths < 10 ? "0" + String(hundredths) : String(hundredths);
  return "[" + mm + ":" + ss + "." + hs + "]";
}

function buildBaselineSlots(): BatchSlotTelemetry[] {
  const slots: BatchSlotTelemetry[] = [];
  for (let i = 0; i < 8; i += 1) {
    slots.push({
      slotIndex: i,
      slotId: "H" + String(i),
      titleLabel: "Batch " + String(i) + " (H" + String(i) + ")",
      hexPtr: "0x900" + String(i),
      inspectorPtr: "0x90" + String(i) + "0",
      tokensK: 256,
      queueReq: 32,
      latencyMs: 0.02,
      ratePct: 100,
      statusLabel: "SCHEDULED · LOCKED",
      locked: true,
      iterationStep: 1,
    });
  }
  return slots;
}

export function createInitialBatchEngineState(): ContinuousBatchState {
  const defaultCorridor: SyntheticBatchCorridor =
    "BATCH-CORRIDOR-ALPHA (CONTINUOUS-IN-FLIGHT-REQUEST-SCHEDULER-FABRIC · 34400-GB/S)";
  return {
    projectTitle: "GF-T3-275",
    corridor: defaultCorridor,
    meshPtr: "0x8F8DC0",
    modeTag: "CONTINUOUS_BATCH",
    activeBatchesCount: 8,
    totalBatchesCapacity: 8,
    batchThroughputGbps: 34400,
    throughputSaturationPct: 100,
    schedulingLatencyUs: 0.01,
    processedTokensUnits: 6656000,
    engineXpK: 75.0,
    batchStateLabel: "Continuous Active",
    concurrencySpikeActive: false,
    burstCycleCount: 0,
    stepPassCount: 0,
    selectedSlotIndex: 3,
    vectorTelemetry: [3.71, 3.75, 3.72, 3.74],
    slots: buildBaselineSlots(),
    radioLogs: [
      {
        timestamp: "[00:01.04]",
        icon: "🟢",
        callsign: "CREW CHIEF",
        message: "Continuous in-flight request scheduler engine initialized · 8 batches linked",
      },
      {
        timestamp: "[00:01.08]",
        icon: "🟢",
        callsign: "TELEMETRY",
        message: "In-flight batching execution verified at 34,400 GB/s with zero queue stalls",
      },
    ],
  };
}

function recalculateDerivedTelemetry(
  state: ContinuousBatchState,
  newLogEntries?: RadioCommsLogEntry[]
): ContinuousBatchState {
  const profile = CORRIDOR_PROFILES[state.corridor];
  const updatedSlots = state.slots.map((slot) => {
    const realloc = computeDynamicStepReallocation(
      slot.tokensK,
      slot.queueReq,
      profile.tensorAllocationEfficiency,
      state.concurrencySpikeActive
    );
    const isSpikedSlot = state.concurrencySpikeActive && (slot.slotIndex === 2 || slot.slotIndex === 5);
    return {
      ...slot,
      ratePct: realloc.ratePct,
      latencyMs: realloc.latencyMs,
      locked: !isSpikedSlot,
      statusLabel: isSpikedSlot ? "RE-ORDER · SPIKE" : "SCHEDULED · LOCKED",
    };
  });

  const activeTokens = updatedSlots.map((s) => s.tokensK);
  const pendingQueues = updatedSlots.map((s) => s.queueReq);
  const processedTokensUnits = computeContinuousBatchTokens(activeTokens, pendingQueues, 2);
  const activeBatchesCount = updatedSlots.filter((s) => s.tokensK > 0).length;
  const schedulingLatencyUs = computeSubMicrosecondSyncLatency(
    profile.baseSchedulingLatencyUs,
    activeBatchesCount,
    state.concurrencySpikeActive,
    state.stepPassCount
  );
  const batchThroughputGbps = computeSaturatedThroughputGbps(
    profile.peakBandwidthGbps,
    updatedSlots,
    state.concurrencySpikeActive
  );
  const throughputSaturationPct = Math.min(
    100,
    Math.max(15, Math.round((batchThroughputGbps / 34400) * 100))
  );
  const engineXpK = Number(
    (75.0 + state.burstCycleCount * 4.5 + state.stepPassCount * 2.5).toFixed(1)
  );
  const batchStateLabel = state.concurrencySpikeActive
    ? "Concurrency Re-Order"
    : "Continuous Active";
  const vecOffset = Number(((state.burstCycleCount + state.stepPassCount) * 0.01).toFixed(2));
  const vectorTelemetry: [number, number, number, number] = [
    Number((3.71 + vecOffset).toFixed(2)),
    Number((3.75 + vecOffset).toFixed(2)),
    Number((3.72 + vecOffset).toFixed(2)),
    Number((3.74 + vecOffset).toFixed(2)),
  ];

  return {
    ...state,
    modeTag: profile.modeTag,
    activeBatchesCount,
    batchThroughputGbps,
    throughputSaturationPct,
    schedulingLatencyUs,
    processedTokensUnits,
    engineXpK,
    batchStateLabel,
    vectorTelemetry,
    slots: updatedSlots,
    radioLogs: newLogEntries ? newLogEntries.slice(-2) : state.radioLogs,
  };
}

export function switchBatchCorridor(
  current: ContinuousBatchState,
  nextCorridor: SyntheticBatchCorridor
): ContinuousBatchState {
  sanitizeGridSyncString(nextCorridor);
  const profile = CORRIDOR_PROFILES[nextCorridor];
  const tick = current.burstCycleCount + current.stepPassCount + 2;
  const logs: RadioCommsLogEntry[] = [
    current.radioLogs[current.radioLogs.length - 1],
    {
      timestamp: formatStopwatchTimestamp(tick),
      icon: "🟢",
      callsign: "CREW CHIEF",
      message:
        "Switched fabric to " +
        profile.corridorId +
        " · Mode " +
        profile.modeTag +
        " locked at " +
        profile.peakBandwidthGbps.toLocaleString("en-US") +
        " GB/s",
    },
  ];
  return recalculateDerivedTelemetry(
    {
      ...current,
      corridor: nextCorridor,
    },
    logs
  );
}

export function triggerContinuousBatchBurst(
  current: ContinuousBatchState,
  addedTokensK = 32,
  addedRequests = 8
): ContinuousBatchState {
  validateGridSyncPayload({
    corridor: current.corridor,
    selectedSlotIndex: current.selectedSlotIndex,
    addedTokensK,
    addedRequests,
    operatorCallsign: "CREW CHIEF",
  });

  const nextBurstCount = current.burstCycleCount + 1;
  const tick = nextBurstCount + current.stepPassCount + 2;
  const updatedSlots = current.slots.map((slot, idx) => {
    const staggerK = (idx % 2) * 4;
    return {
      ...slot,
      tokensK: Math.min(512, slot.tokensK + addedTokensK + staggerK),
      queueReq: Math.min(128, slot.queueReq + addedRequests),
      iterationStep: slot.iterationStep + 1,
    };
  });

  const nextState = recalculateDerivedTelemetry({
    ...current,
    burstCycleCount: nextBurstCount,
    slots: updatedSlots,
  });

  const logs: RadioCommsLogEntry[] = [
    {
      timestamp: formatStopwatchTimestamp(tick),
      icon: "🟢",
      callsign: "CREW CHIEF",
      message:
        "Continuous batch burst #" +
        String(nextBurstCount) +
        " ingested · +" +
        String(addedTokensK) +
        "K tok/slot joined in-flight",
    },
    {
      timestamp: formatStopwatchTimestamp(tick + 1),
      icon: "🟢",
      callsign: "TELEMETRY",
      message:
        "Processed tokens scaled to " +
        nextState.processedTokensUnits.toLocaleString("en-US") +
        " Units at " +
        nextState.batchThroughputGbps.toLocaleString("en-US") +
        " GB/s",
    },
  ];

  return {
    ...nextState,
    radioLogs: logs,
  };
}

export function toggleConcurrencySpike(current: ContinuousBatchState): ContinuousBatchState {
  const nextSpike = !current.concurrencySpikeActive;
  const tick = current.burstCycleCount + current.stepPassCount + 3;
  const updatedSlots = current.slots.map((slot, idx) => {
    const deltaReq = idx === 2 || idx === 5 ? 16 : 6;
    return {
      ...slot,
      queueReq: nextSpike
        ? Math.min(128, slot.queueReq + deltaReq)
        : Math.max(32, slot.queueReq - deltaReq),
    };
  });

  const nextState = recalculateDerivedTelemetry({
    ...current,
    concurrencySpikeActive: nextSpike,
    slots: updatedSlots,
  });

  const logs: RadioCommsLogEntry[] = nextSpike
    ? [
        {
          timestamp: formatStopwatchTimestamp(tick),
          icon: "🔴",
          callsign: "PIT WALL",
          message: "Concurrency spike injected on H2 & H5 · Priority queue re-ordering active",
        },
        {
          timestamp: formatStopwatchTimestamp(tick + 1),
          icon: "⚡",
          callsign: "TELEMETRY",
          message:
            "Dynamic step reallocation holding " +
            nextState.batchThroughputGbps.toLocaleString("en-US") +
            " GB/s at " +
            String(nextState.schedulingLatencyUs) +
            " µs sync",
        },
      ]
    : [
        {
          timestamp: formatStopwatchTimestamp(tick),
          icon: "🟢",
          callsign: "CREW CHIEF",
          message: "Concurrency spike cleared · All 8 in-flight batch slots re-locked",
        },
        {
          timestamp: formatStopwatchTimestamp(tick + 1),
          icon: "🟢",
          callsign: "TELEMETRY",
          message:
            "Nominal saturation restored at " +
            nextState.batchThroughputGbps.toLocaleString("en-US") +
            " GB/s · Latency " +
            String(nextState.schedulingLatencyUs) +
            " µs",
        },
      ];

  return {
    ...nextState,
    radioLogs: logs,
  };
}

export function stepInFlightSchedulingPass(current: ContinuousBatchState): ContinuousBatchState {
  const nextStep = current.stepPassCount + 1;
  const tick = current.burstCycleCount + nextStep + 2;
  const updatedSlots = current.slots.map((slot) => {
    const drained = Math.min(slot.queueReq, 8);
    return {
      ...slot,
      queueReq: Math.max(16, slot.queueReq - drained + 4),
      tokensK: Math.min(512, slot.tokensK + drained * 2),
      iterationStep: slot.iterationStep + 1,
    };
  });

  const nextState = recalculateDerivedTelemetry({
    ...current,
    stepPassCount: nextStep,
    slots: updatedSlots,
  });

  const logs: RadioCommsLogEntry[] = [
    {
      timestamp: formatStopwatchTimestamp(tick),
      icon: "🟢",
      callsign: "CREW CHIEF",
      message:
        "In-flight scheduling pass #" +
        String(nextStep) +
        " committed · Per-token iteration step synchronized",
    },
    {
      timestamp: formatStopwatchTimestamp(tick + 1),
      icon: "🟢",
      callsign: "TELEMETRY",
      message:
        "Active tokens advanced to " +
        nextState.processedTokensUnits.toLocaleString("en-US") +
        " Units · Sync " +
        String(nextState.schedulingLatencyUs) +
        " µs",
    },
  ];

  return {
    ...nextState,
    radioLogs: logs,
  };
}

export function flushBatchQueuesAndReset(): ContinuousBatchState {
  return createInitialBatchEngineState();
}

export const POSTGRES_RLS_SCHEMA_SQL = [
  "-- GF-T3-275 Partitioned PostgreSQL / Supabase Persistence Schema",
  "CREATE TABLE IF NOT EXISTS continuous_batch_corridors (",
  "  corridor_id TEXT PRIMARY KEY,",
  "  corridor_label TEXT NOT NULL UNIQUE,",
  "  execution_mode TEXT NOT NULL,",
  "  peak_bandwidth_gbps NUMERIC(10, 2) NOT NULL CHECK (peak_bandwidth_gbps > 0),",
  "  base_scheduling_latency_us NUMERIC(8, 4) NOT NULL CHECK (base_scheduling_latency_us > 0)",
  ");",
  "",
  "CREATE TABLE IF NOT EXISTS continuous_batch_telemetry (",
  "  telemetry_id UUID NOT NULL DEFAULT gen_random_uuid(),",
  "  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),",
  "  tenant_org_id UUID NOT NULL,",
  "  project_code TEXT NOT NULL DEFAULT 'GF-T3-275',",
  "  corridor_id TEXT NOT NULL REFERENCES continuous_batch_corridors(corridor_id),",
  "  batch_throughput_gbps NUMERIC(10, 2) NOT NULL,",
  "  scheduling_latency_us NUMERIC(8, 4) NOT NULL,",
  "  processed_tokens_units BIGINT NOT NULL,",
  "  PRIMARY KEY (telemetry_id, recorded_at)",
  ") PARTITION BY RANGE (recorded_at);",
  "",
  "ALTER TABLE continuous_batch_telemetry ENABLE ROW LEVEL SECURITY;",
  "CREATE POLICY rls_telemetry_tenant_isolation ON continuous_batch_telemetry",
  "  FOR ALL TO authenticated",
  "  USING (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::uuid);",
].join("\n");
