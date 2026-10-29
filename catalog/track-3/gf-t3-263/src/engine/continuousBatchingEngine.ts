/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-263 Continuous Batching & In-Flight Batch Expansion Core Engine
 * Clean-Room Track 3 Implementation · Zero-Dollar Telemetry Invariant
 */

import { z } from 'zod';

export const SYNTHETIC_CORRIDORS = [
  'BATCH-CORRIDOR-ALPHA (IN-FLIGHT-BATCH-EXPANSION-FABRIC · 25000-GB/S)',
  'BATCH-CORRIDOR-BRAVO (ITERATIVE-TOKEN-SCHEDULING-ENGINE)',
  'BATCH-CORRIDOR-GAMMA (DYNAMIC-SLOT-RE-ALLOCATION-PIPELINE)',
  'BATCH-CORRIDOR-DELTA (FALLBACK-STATIC-BATCH-PASS)',
] as const;

export type CorridorId = (typeof SYNTHETIC_CORRIDORS)[number];

export type TabId = 'Mesh' | 'Btch' | 'Schd' | 'Stats' | 'APA';

export interface CorridorProfile {
  id: CorridorId;
  shortCode: string;
  peakBandwidthGbs: number;
  baseSchedulerLatencyUs: number;
  modeTag: string;
  smEfficiency: number;
  pointerBase: string;
}

export const CORRIDOR_PROFILES: Record<CorridorId, CorridorProfile> = {
  'BATCH-CORRIDOR-ALPHA (IN-FLIGHT-BATCH-EXPANSION-FABRIC · 25000-GB/S)': {
    id: 'BATCH-CORRIDOR-ALPHA (IN-FLIGHT-BATCH-EXPANSION-FABRIC · 25000-GB/S)',
    shortCode: 'ALPHA-25K',
    peakBandwidthGbs: 25000,
    baseSchedulerLatencyUs: 0.01,
    modeTag: 'CONTINUOUS_BATCH',
    smEfficiency: 1.0,
    pointerBase: '0xBF8DC0',
  },
  'BATCH-CORRIDOR-BRAVO (ITERATIVE-TOKEN-SCHEDULING-ENGINE)': {
    id: 'BATCH-CORRIDOR-BRAVO (ITERATIVE-TOKEN-SCHEDULING-ENGINE)',
    shortCode: 'BRAVO-ITER',
    peakBandwidthGbs: 22400,
    baseSchedulerLatencyUs: 0.02,
    modeTag: 'ITERATIVE_SCHED',
    smEfficiency: 0.96,
    pointerBase: '0xBF9A40',
  },
  'BATCH-CORRIDOR-GAMMA (DYNAMIC-SLOT-RE-ALLOCATION-PIPELINE)': {
    id: 'BATCH-CORRIDOR-GAMMA (DYNAMIC-SLOT-RE-ALLOCATION-PIPELINE)',
    shortCode: 'GAMMA-DYN',
    peakBandwidthGbs: 19800,
    baseSchedulerLatencyUs: 0.03,
    modeTag: 'DYNAMIC_REALLOC',
    smEfficiency: 0.92,
    pointerBase: '0xBFA210',
  },
  'BATCH-CORRIDOR-DELTA (FALLBACK-STATIC-BATCH-PASS)': {
    id: 'BATCH-CORRIDOR-DELTA (FALLBACK-STATIC-BATCH-PASS)',
    shortCode: 'DELTA-STAT',
    peakBandwidthGbs: 12500,
    baseSchedulerLatencyUs: 0.08,
    modeTag: 'STATIC_FALLBACK',
    smEfficiency: 0.68,
    pointerBase: '0xBFC000',
  },
};

export const SLOT_HEX_POINTERS = [
  '0xC000',
  '0xC100',
  '0xC200',
  '0xC300',
  '0xC400',
  '0xC500',
  '0xC600',
  '0xC700',
] as const;

export interface SlotTelemetry {
  index: number;
  slotCode: string;
  titleLabel: string;
  hexPtr: string;
  tokensK: number;
  queueTag: 'IN-FLIGHT' | 'EXPANDING' | 'RE-ALLOC' | 'STATIC-WAIT';
  latencyMs: number;
  stateLabel: 'SCHEDULED · LOCKED' | 'RE-ALLOC · LOCKED' | 'BURST · LOCKED' | 'FAULT · RECOVER';
  utilizationPct: number;
  remainingSteps: number;
  sequenceTag: string;
}

export interface RadioLogEntry {
  timestamp: string;
  callsign: '🟢 CREW CHIEF' | '🟢 TELEMETRY' | '🔴 TELEMETRY' | '⚡ PIT WALL';
  message: string;
}

export interface EngineTelemetryState {
  corridor: CorridorId;
  throughputGbs: number;
  schedulerLatencyUs: number;
  activeSlotsCount: number;
  maxSlotsCount: number;
  processedTokens: number;
  engineXpK: number;
  batchStateLabel: string;
  selectedSlotIndex: number;
  activeTab: TabId;
  spikeActive: boolean;
  burstActive: boolean;
  iterationPass: number;
  incomingQueueDepth: number;
  completedLastStep: number;
  admittedLastStep: number;
  vectorSignature: [number, number, number, number];
  slots: SlotTelemetry[];
  radioLogs: RadioLogEntry[];
}

// GridSync Zero-Trust Ingress Schema (Scrubs SQLi, XSS, and prohibited currency chars)
const DANGEROUS_TOKEN_REGEX = /(;|--|\/\*|\*\/|<script|DROP\s+TABLE|UNION\s+SELECT)/i;

export const GridSyncIngressSchema = z.object({
  corridor: z.enum(SYNTHETIC_CORRIDORS),
  incomingRequests: z.number().int().min(0).max(256),
  completedRequests: z.number().int().min(0).max(8),
  operatorNote: z
    .string()
    .max(140)
    .transform((val) => val.split(String.fromCharCode(36)).join('').trim())
    .refine((val) => !DANGEROUS_TOKEN_REGEX.test(val), {
      message: 'Zero-Trust Ingress Gate blocked potentially malicious payload token',
    }),
});

export type GridSyncIngressPayload = z.infer<typeof GridSyncIngressSchema>;

export function sanitizeZeroDollarText(input: string): string {
  const forbiddenChar = String.fromCharCode(36);
  const cleaned = input.split(forbiddenChar).join('').trim();
  if (DANGEROUS_TOKEN_REGEX.test(cleaned)) {
    throw new Error('Zero-Trust Security Gate: Malicious SQL/XSS sequence rejected');
  }
  return cleaned;
}

/**
 * Core In-Flight Batch Expansion Formula:
 * At each token generation step, completed sequences are immediately evicted and
 * replaced by incoming waiting requests:
 * N_active = N_retained + N_admitted (and under full slot turnover, N_active = N_completed + N_incoming)
 */
export interface InFlightExpansionResult {
  priorActive: number;
  completedEvicted: number;
  retainedInFlight: number;
  incomingAdmitted: number;
  nextActiveSlots: number;
  remainingQueueDepth: number;
  utilizationRatio: number;
}

export function calculateInFlightBatchExpansion(
  priorActive: number,
  completedCount: number,
  incomingQueue: number,
  maxSlots: number = 8
): InFlightExpansionResult {
  if (priorActive < 0 || completedCount < 0 || incomingQueue < 0 || maxSlots <= 0) {
    throw new Error('Batch expansion parameters must be non-negative and maxSlots positive');
  }
  const boundedPrior = Math.min(priorActive, maxSlots);
  const completedEvicted = Math.min(boundedPrior, completedCount);
  const retainedInFlight = boundedPrior - completedEvicted;
  const openSlots = maxSlots - retainedInFlight;
  const incomingAdmitted = Math.min(openSlots, incomingQueue);
  const nextActiveSlots = retainedInFlight + incomingAdmitted;
  const remainingQueueDepth = Math.max(0, incomingQueue - incomingAdmitted);
  const utilizationRatio = Number((nextActiveSlots / maxSlots).toFixed(4));

  return {
    priorActive: boundedPrior,
    completedEvicted,
    retainedInFlight,
    incomingAdmitted,
    nextActiveSlots,
    remainingQueueDepth,
    utilizationRatio,
  };
}

export function formatNumberWithCommas(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

export function createInitialSlots(): SlotTelemetry[] {
  const slots: SlotTelemetry[] = [];
  for (let i = 0; i < 8; i++) {
    slots.push({
      index: i,
      slotCode: 'S' + String(i),
      titleLabel: 'Slot ' + String(i) + ' (S' + String(i) + ')',
      hexPtr: SLOT_HEX_POINTERS[i],
      tokensK: 128,
      queueTag: 'IN-FLIGHT',
      latencyMs: 0.02,
      stateLabel: 'SCHEDULED · LOCKED',
      utilizationPct: 100,
      remainingSteps: 2 + (i % 4),
      sequenceTag: 'SEQ-' + String(400 + i),
    });
  }
  return slots;
}

export function createInitialEngineState(): EngineTelemetryState {
  return {
    corridor: 'BATCH-CORRIDOR-ALPHA (IN-FLIGHT-BATCH-EXPANSION-FABRIC · 25000-GB/S)',
    throughputGbs: 25000,
    schedulerLatencyUs: 0.01,
    activeSlotsCount: 8,
    maxSlotsCount: 8,
    processedTokens: 4736000,
    engineXpK: 75.0,
    batchStateLabel: 'In-Flight Active',
    selectedSlotIndex: 3,
    activeTab: 'Mesh',
    spikeActive: false,
    burstActive: false,
    iterationPass: 128,
    incomingQueueDepth: 16,
    completedLastStep: 4,
    admittedLastStep: 4,
    vectorSignature: [2.51, 2.55, 2.52, 2.54],
    slots: createInitialSlots(),
    radioLogs: [
      {
        timestamp: '00:01.04',
        callsign: '🟢 CREW CHIEF',
        message: 'Continuous batching and in-flight expansion engine initialized · 8 slots linked',
      },
      {
        timestamp: '00:01.08',
        callsign: '🟢 TELEMETRY',
        message: 'Iterative token scheduling verified at 25,000 GB/s with zero GPU idle time',
      },
    ],
  };
}

function formatClockStamp(iterationPass: number): string {
  const totalCentiseconds = 108 + (iterationPass - 128) * 7;
  const minutes = Math.floor(totalCentiseconds / 6000);
  const seconds = Math.floor((totalCentiseconds % 6000) / 100);
  const centis = Math.abs(totalCentiseconds % 100);
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const cc = String(centis).padStart(2, '0');
  return mm + ':' + ss + '.' + cc;
}

export function stepIterativeSchedulingPass(
  state: EngineTelemetryState,
  incomingDelta: number = 4
): EngineTelemetryState {
  const nextPass = state.iterationPass + 1;
  const profile = CORRIDOR_PROFILES[state.corridor];
  const queueAvailable = state.incomingQueueDepth + Math.max(0, incomingDelta);

  // Identify slots completing at this token generation step
  let completedThisStep = 0;
  const updatedSlots = state.slots.map((slot) => {
    const decremented = slot.remainingSteps - 1;
    if (decremented <= 0) {
      completedThisStep += 1;
    }
    return {
      ...slot,
      remainingSteps: decremented,
    };
  });

  if (completedThisStep === 0) {
    completedThisStep = 2;
  }

  const expansion = calculateInFlightBatchExpansion(
    state.activeSlotsCount,
    completedThisStep,
    queueAvailable,
    state.maxSlotsCount
  );

  let refillBudget = expansion.incomingAdmitted;
  const nextSlots: SlotTelemetry[] = updatedSlots.map((slot, idx) => {
    if (slot.remainingSteps <= 0 && refillBudget > 0) {
      refillBudget -= 1;
      const nextTokensK = 128 + ((nextPass + idx) % 3) * 16;
      return {
        ...slot,
        tokensK: nextTokensK,
        queueTag: 'IN-FLIGHT',
        latencyMs: 0.02,
        stateLabel: 'SCHEDULED · LOCKED',
        utilizationPct: 100,
        remainingSteps: 3 + (idx % 3),
        sequenceTag: 'SEQ-' + String(nextPass * 10 + idx),
      };
    }
    return {
      ...slot,
      queueTag: state.spikeActive ? (idx % 2 === 0 ? 'EXPANDING' : 'RE-ALLOC') : 'IN-FLIGHT',
      latencyMs: state.spikeActive ? 0.03 : 0.02,
      stateLabel: 'SCHEDULED · LOCKED',
      utilizationPct: 100,
    };
  });

  const activeSlotsCount = expansion.nextActiveSlots;
  const effectiveThroughput = Math.round(
    profile.peakBandwidthGbs * (activeSlotsCount / state.maxSlotsCount) * profile.smEfficiency
  );
  const addedTokens = activeSlotsCount * 16000;
  const nextProcessedTokens = state.processedTokens + addedTokens;
  const nextXp = Number((state.engineXpK + addedTokens / 10000).toFixed(1));
  const stamp = formatClockStamp(nextPass);

  const vec: [number, number, number, number] = [
    Number((2.51 + ((nextPass % 5) * 0.01)).toFixed(2)),
    Number((2.55 + ((nextPass % 3) * 0.01)).toFixed(2)),
    Number((2.52 + ((nextPass % 4) * 0.01)).toFixed(2)),
    Number((2.54 + ((nextPass % 6) * 0.01)).toFixed(2)),
  ];

  const newLogs: RadioLogEntry[] = [
    {
      timestamp: stamp,
      callsign: '🟢 CREW CHIEF',
      message:
        'Step #' +
        String(nextPass) +
        ' in-flight expansion: ' +
        String(expansion.completedEvicted) +
        ' completed evicted, ' +
        String(expansion.incomingAdmitted) +
        ' incoming spliced',
    },
    {
      timestamp: stamp,
      callsign: '🟢 TELEMETRY',
      message:
        'Iterative token scheduling verified at ' +
        formatNumberWithCommas(effectiveThroughput) +
        ' GB/s · Active Slots ' +
        String(activeSlotsCount) +
        '/8',
    },
  ];

  return {
    ...state,
    throughputGbs: effectiveThroughput,
    schedulerLatencyUs: profile.baseSchedulerLatencyUs,
    activeSlotsCount,
    processedTokens: nextProcessedTokens,
    engineXpK: nextXp,
    batchStateLabel: 'In-Flight Active',
    iterationPass: nextPass,
    incomingQueueDepth: expansion.remainingQueueDepth + 4,
    completedLastStep: expansion.completedEvicted,
    admittedLastStep: expansion.incomingAdmitted,
    vectorSignature: vec,
    slots: nextSlots,
    radioLogs: newLogs,
  };
}

export function triggerContinuousBatchBurst(state: EngineTelemetryState): EngineTelemetryState {
  const nextPass = state.iterationPass + 1;
  const profile = CORRIDOR_PROFILES[state.corridor];
  const burstThroughput = profile.peakBandwidthGbs;
  const stamp = formatClockStamp(nextPass);

  const burstSlots: SlotTelemetry[] = state.slots.map((slot, idx) => ({
    ...slot,
    tokensK: idx % 2 === 0 ? 160 : 128,
    queueTag: 'IN-FLIGHT',
    latencyMs: 0.01,
    stateLabel: 'SCHEDULED · LOCKED',
    utilizationPct: 100,
    remainingSteps: 5,
    sequenceTag: 'BST-' + String(nextPass * 10 + idx),
  }));

  return {
    ...state,
    throughputGbs: burstThroughput,
    schedulerLatencyUs: 0.01,
    activeSlotsCount: 8,
    processedTokens: state.processedTokens + 256000,
    engineXpK: Number((state.engineXpK + 12.8).toFixed(1)),
    batchStateLabel: 'In-Flight Active',
    spikeActive: false,
    burstActive: true,
    iterationPass: nextPass,
    completedLastStep: 8,
    admittedLastStep: 8,
    vectorSignature: [2.58, 2.61, 2.59, 2.62],
    slots: burstSlots,
    radioLogs: [
      {
        timestamp: stamp,
        callsign: '⚡ PIT WALL',
        message:
          'Continuous batch burst engaged · All 8 tensor slots saturated at ' +
          formatNumberWithCommas(burstThroughput) +
          ' GB/s',
      },
      {
        timestamp: stamp,
        callsign: '🟢 TELEMETRY',
        message: 'Sub-microsecond scheduler yield locked at 0.01 µs · Zero SM stall cycles',
      },
    ],
  };
}

export function toggleRequestQueueSpike(state: EngineTelemetryState): EngineTelemetryState {
  const nextSpike = !state.spikeActive;
  const nextPass = state.iterationPass + 1;
  const profile = CORRIDOR_PROFILES[state.corridor];
  const stamp = formatClockStamp(nextPass);

  if (nextSpike) {
    const spikeSlots: SlotTelemetry[] = state.slots.map((slot, idx) => ({
      ...slot,
      tokensK: idx < 4 ? 192 : 144,
      queueTag: idx % 2 === 0 ? 'EXPANDING' : 'RE-ALLOC',
      latencyMs: 0.03,
      stateLabel: 'RE-ALLOC · LOCKED',
      utilizationPct: 100,
      remainingSteps: 4,
    }));

    return {
      ...state,
      throughputGbs: profile.peakBandwidthGbs,
      schedulerLatencyUs: Number((profile.baseSchedulerLatencyUs + 0.01).toFixed(2)),
      activeSlotsCount: 8,
      processedTokens: state.processedTokens + 192000,
      engineXpK: Number((state.engineXpK + 9.6).toFixed(1)),
      batchStateLabel: 'In-Flight Active',
      spikeActive: true,
      burstActive: false,
      iterationPass: nextPass,
      incomingQueueDepth: state.incomingQueueDepth + 32,
      completedLastStep: 4,
      admittedLastStep: 4,
      vectorSignature: [2.64, 2.68, 2.65, 2.67],
      slots: spikeSlots,
      radioLogs: [
        {
          timestamp: stamp,
          callsign: '🔴 TELEMETRY',
          message:
            'Ingress queue spike detected (+32 sequences) · Dynamic slot re-allocation active on S0-S7',
        },
        {
          timestamp: stamp,
          callsign: '🟢 CREW CHIEF',
          message:
            'In-flight batch expansion absorbed spike without batch stall · 8/8 slots locked',
        },
      ],
    };
  }

  const nominalSlots: SlotTelemetry[] = state.slots.map((slot) => ({
    ...slot,
    tokensK: 128,
    queueTag: 'IN-FLIGHT',
    latencyMs: 0.02,
    stateLabel: 'SCHEDULED · LOCKED',
    utilizationPct: 100,
  }));

  return {
    ...state,
    throughputGbs: profile.peakBandwidthGbs,
    schedulerLatencyUs: profile.baseSchedulerLatencyUs,
    spikeActive: false,
    iterationPass: nextPass,
    incomingQueueDepth: 16,
    vectorSignature: [2.51, 2.55, 2.52, 2.54],
    slots: nominalSlots,
    radioLogs: [
      {
        timestamp: stamp,
        callsign: '🟢 CREW CHIEF',
        message: 'Request queue spike cleared · Nominal 128K in-flight slot cadence restored',
      },
      {
        timestamp: stamp,
        callsign: '🟢 TELEMETRY',
        message:
          'Iterative token scheduling verified at ' +
          formatNumberWithCommas(profile.peakBandwidthGbs) +
          ' GB/s with zero GPU idle time',
      },
    ],
  };
}

export function switchBatchCorridor(
  state: EngineTelemetryState,
  corridor: CorridorId
): EngineTelemetryState {
  const sanitized = sanitizeZeroDollarText(corridor) as CorridorId;
  const profile = CORRIDOR_PROFILES[sanitized];
  const nextPass = state.iterationPass + 1;
  const stamp = formatClockStamp(nextPass);

  const updatedSlots: SlotTelemetry[] = state.slots.map((slot) => ({
    ...slot,
    queueTag: sanitized.includes('DELTA') ? 'STATIC-WAIT' : 'IN-FLIGHT',
    latencyMs: sanitized.includes('DELTA') ? 0.08 : 0.02,
    stateLabel: 'SCHEDULED · LOCKED',
    utilizationPct: Math.round(profile.smEfficiency * 100),
  }));

  return {
    ...state,
    corridor: sanitized,
    throughputGbs: profile.peakBandwidthGbs,
    schedulerLatencyUs: profile.baseSchedulerLatencyUs,
    iterationPass: nextPass,
    slots: updatedSlots,
    radioLogs: [
      {
        timestamp: stamp,
        callsign: '🟢 CREW CHIEF',
        message: 'Switched fabric to ' + profile.shortCode + ' · Mode ' + profile.modeTag,
      },
      {
        timestamp: stamp,
        callsign: '🟢 TELEMETRY',
        message:
          'Corridor bandwidth locked at ' +
          formatNumberWithCommas(profile.peakBandwidthGbs) +
          ' GB/s · Latency ' +
          String(profile.baseSchedulerLatencyUs) +
          ' µs',
      },
    ],
  };
}

export function flushBatchBuffersAndReset(): EngineTelemetryState {
  return createInitialEngineState();
}

export const SUPABASE_RLS_SCHEMA_SQL = [
  'CREATE TABLE batch_corridors (corridor_id UUID PRIMARY KEY, corridor_name TEXT UNIQUE, peak_bandwidth_gbs NUMERIC(10,2), base_latency_us NUMERIC(8,4));',
  'CREATE TABLE batch_execution_slots (slot_uuid UUID PRIMARY KEY, corridor_id UUID REFERENCES batch_corridors(corridor_id), slot_index SMALLINT CHECK (slot_index BETWEEN 0 AND 7), pointer_hex VARCHAR(16), tokens_k INT, queue_state VARCHAR(24), owner_tenant_id UUID);',
  'CREATE TABLE batch_iteration_telemetry (telemetry_id UUID, recorded_at TIMESTAMPTZ, corridor_id UUID, iteration_step BIGINT, active_slots SMALLINT, throughput_gbs NUMERIC(10,2), owner_tenant_id UUID, PRIMARY KEY (telemetry_id, recorded_at)) PARTITION BY RANGE (recorded_at);',
  'ALTER TABLE batch_execution_slots ENABLE ROW LEVEL SECURITY;',
  'CREATE POLICY rls_slots_tenant_isolation ON batch_execution_slots FOR ALL TO authenticated USING (owner_tenant_id = auth.uid()) WITH CHECK (owner_tenant_id = auth.uid());',
].join('\n');
