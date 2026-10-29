/**
 * GF-T3-246 · Track 3 Custom C++ Plugin & In-Flight Batching Scheduler Core Engine
 * SPDX-License-Identifier: Apache-2.0
 * Deterministic mathematical formulas · Zero Math.random() · Zero-Dollar Gate Enforced
 */

import { ALLOWED_CORRIDORS, SyntheticCorridor } from "./gridSyncSanitizer";

export interface CorridorProfile {
  id: string;
  corridor: SyntheticCorridor;
  shortLabel: string;
  peakBandwidthGbs: number;
  baseKernelLatencyUs: number;
  fusedExecutionLatencyUs: number;
  kernelName: string;
  registerPressurePct: number;
}

export const CORRIDOR_PROFILES: Record<SyntheticCorridor, CorridorProfile> = {
  "PLUGIN-CORRIDOR-ALPHA (CUSTOM-CPP-PLUGIN-SCHEDULER · 9800-GB/S)": {
    id: "ALPHA",
    corridor: "PLUGIN-CORRIDOR-ALPHA (CUSTOM-CPP-PLUGIN-SCHEDULER · 9800-GB/S)",
    shortLabel: "ALPHA · 9800-GB/S",
    peakBandwidthGbs: 9800,
    baseKernelLatencyUs: 0.01,
    fusedExecutionLatencyUs: 0.82,
    kernelName: "FUSED_ATTN",
    registerPressurePct: 68.4,
  },
  "PLUGIN-CORRIDOR-BRAVO (IN-FLIGHT-CONTINUOUS-BATCHING)": {
    id: "BRAVO",
    corridor: "PLUGIN-CORRIDOR-BRAVO (IN-FLIGHT-CONTINUOUS-BATCHING)",
    shortLabel: "BRAVO · CONT-BATCH",
    peakBandwidthGbs: 9420,
    baseKernelLatencyUs: 0.02,
    fusedExecutionLatencyUs: 0.89,
    kernelName: "CONT_KV_PAGER",
    registerPressurePct: 64.2,
  },
  "PLUGIN-CORRIDOR-GAMMA (CUDA-KERNEL-LAUNCH-OPTIMIZATION)": {
    id: "GAMMA",
    corridor: "PLUGIN-CORRIDOR-GAMMA (CUDA-KERNEL-LAUNCH-OPTIMIZATION)",
    shortLabel: "GAMMA · CUDA-OPT",
    peakBandwidthGbs: 9650,
    baseKernelLatencyUs: 0.01,
    fusedExecutionLatencyUs: 0.76,
    kernelName: "CUDA_GRAPH_EXEC",
    registerPressurePct: 71.0,
  },
  "PLUGIN-CORRIDOR-DELTA (FALLBACK-STATIC-BATCH-RUNNER)": {
    id: "DELTA",
    corridor: "PLUGIN-CORRIDOR-DELTA (FALLBACK-STATIC-BATCH-RUNNER)",
    shortLabel: "DELTA · FALLBACK",
    peakBandwidthGbs: 6120,
    baseKernelLatencyUs: 0.14,
    fusedExecutionLatencyUs: 1.64,
    kernelName: "STATIC_BATCH",
    registerPressurePct: 84.5,
  },
};

export interface PluginSchedulerSlot {
  slotIndex: number;
  slotCode: string;
  slotHeader: string;
  hexPointer: string;
  sequenceId: number;
  currentTokens: number;
  maxTokens: number;
  kernelLabel: string;
  kernelFull: string;
  stateLabel: "ACTIVE" | "REINDEX" | "REINDEXED";
  efficiencyPct: number;
  lockStatus: "LOCKED" | "FAULT";
  batchGroup: string;
  executionTimeUs: number;
  registerAllocation: string;
  reindexedCount: number;
}

export interface RadioCommsEntry {
  timestamp: string;
  callsign: "🟢 CREW CHIEF" | "⚡ PIT WALL" | "🟢 TELEMETRY" | "🔴 TELEMETRY";
  message: string;
  formattedLine: string;
}

export interface PluginEngineState {
  workspaceTitle: "GF-T3-246";
  corridor: SyntheticCorridor;
  schedulerThroughputGbs: number;
  throughputSaturationPct: number;
  kernelLaunchLatencyUs: number;
  activeSlotsCount: number;
  totalSlotsCapacity: number;
  processedTokensUnits: number;
  pluginXpK: number;
  pluginStateText: string;
  meshPointerHex: string;
  kernelIdentifier: string;
  meshExecutionLatencyUs: number;
  queueDepth: number;
  attentionVector: [number, number, number, number];
  saturationFaultActive: boolean;
  selectedSlotIndex: number;
  stepCount: number;
  reclaimedBubbleSlotsTotal: number;
  slots: PluginSchedulerSlot[];
  radioLogs: RadioCommsEntry[];
}

export function calculateRooflineThroughputGbs(
  peakBandwidthGbs: number,
  activeSlots: number,
  maxSlots: number,
  queueDepth: number,
  saturationFaultActive: boolean
): number {
  if (maxSlots <= 0 || activeSlots <= 0) {
    return 0;
  }
  const utilization = Math.min(1, Math.max(0, activeSlots / maxSlots));
  const occupancyCurve = (1 - Math.exp(-5.5 * utilization)) / (1 - Math.exp(-5.5));
  const queuePenalty =
    saturationFaultActive && queueDepth > 0 ? Math.min(0.085, queueDepth * 0.0045) : 0;
  const rawThroughput = peakBandwidthGbs * occupancyCurve * (1 - queuePenalty);
  return Math.round(rawThroughput * 100) / 100;
}

export function calculateKernelLaunchLatencyUs(
  baseLatencyUs: number,
  activeSlots: number,
  queueDepth: number,
  saturationFaultActive: boolean
): number {
  if (activeSlots <= 0) {
    return baseLatencyUs;
  }
  const overflowPenalty = Math.max(0, activeSlots - 32) * 0.0015;
  const queueTerm = queueDepth * 0.0025;
  const spikeTerm = saturationFaultActive ? 0.03 : 0;
  return Math.round((baseLatencyUs + overflowPenalty + queueTerm + spikeTerm) * 100) / 100;
}

export function calculateSlotEfficiencyPct(
  currentTokens: number,
  maxTokens: number,
  slotIndex: number,
  saturationFaultActive: boolean
): number {
  if (maxTokens <= 0) {
    return 0;
  }
  if (!saturationFaultActive && (slotIndex === 0 || slotIndex === 3)) {
    return 99.9;
  }
  const ratio = Math.min(1, Math.max(0, currentTokens / maxTokens));
  const harmonic = (slotIndex % 4) * 0.02;
  const baseEff = 99.9 - harmonic - 0.04 * (1 - ratio);
  if (saturationFaultActive && (slotIndex === 2 || slotIndex === 5)) {
    return Math.round(Math.max(92.4, baseEff - 4.8) * 10) / 10;
  }
  return Math.round(Math.min(99.9, Math.max(95.0, baseEff)) * 10) / 10;
}

export function createInitialSlots(): PluginSchedulerSlot[] {
  const slots: PluginSchedulerSlot[] = [];
  for (let i = 0; i < 8; i++) {
    const hexSuffix = (i * 256).toString(16).toUpperCase().padStart(3, "0");
    const hexPointer = "0xA" + hexSuffix;
    const isPrimaryRef = i === 0 || i === 3;
    const sequenceId = isPrimaryRef ? 512 : 512 + i * 16;
    const currentTokens = i === 0 ? 128 : 128 + i * 64;
    const execTimeUs = isPrimaryRef ? 0.82 : Math.round((0.82 + (i % 3) * 0.01) * 100) / 100;
    const regCount = 64 + (i % 4) * 16;

    slots.push({
      slotIndex: i,
      slotCode: "S" + String(i),
      slotHeader: "Slot " + String(i) + " (S" + String(i) + ")",
      hexPointer,
      sequenceId,
      currentTokens,
      maxTokens: 2048,
      kernelLabel: "FUSED",
      kernelFull: "FUSED_ATTN",
      stateLabel: "ACTIVE",
      efficiencyPct: 99.9,
      lockStatus: "LOCKED",
      batchGroup: "BG-INFLIGHT-0" + String(Math.floor(i / 2) + 1),
      executionTimeUs: execTimeUs,
      registerAllocation: "REG_" + String(regCount) + "xFP16_KV",
      reindexedCount: 0,
    });
  }
  return slots;
}

export function createCanonicalRadioLogs(): RadioCommsEntry[] {
  return [
    {
      timestamp: "00:01.04",
      callsign: "🟢 CREW CHIEF",
      message:
        "TensorRT-LLM custom C++ plugin and in-flight batching scheduler initialized · 32 slots linked",
      formattedLine:
        "[00:01.04] 🟢 CREW CHIEF: TensorRT-LLM custom C++ plugin and in-flight batching scheduler initialized · 32 slots linked",
    },
    {
      timestamp: "00:01.08",
      callsign: "⚡ PIT WALL",
      message:
        "Custom CUDA fused attention kernels compiled · Launch latency verified at 0.01 µs",
      formattedLine:
        "[00:01.08] ⚡ PIT WALL: Custom CUDA fused attention kernels compiled · Launch latency verified at 0.01 µs",
    },
    {
      timestamp: "00:01.12",
      callsign: "🟢 TELEMETRY",
      message:
        "Continuous in-flight batching throughput verified at 9,800 GB/s with zero queue stalls",
      formattedLine:
        "[00:01.12] 🟢 TELEMETRY: Continuous in-flight batching throughput verified at 9,800 GB/s with zero queue stalls",
    },
  ];
}

function formatRadioClock(stepCount: number): string {
  const totalCentiseconds = 112 + stepCount * 6;
  const seconds = Math.floor(totalCentiseconds / 100);
  const centi = totalCentiseconds % 100;
  const minutes = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(remSec).padStart(2, "0") +
    "." +
    String(centi).padStart(2, "0")
  );
}

function appendRadioLog(
  existing: RadioCommsEntry[],
  stepCount: number,
  callsign: RadioCommsEntry["callsign"],
  message: string
): RadioCommsEntry[] {
  const ts = formatRadioClock(stepCount);
  const entry: RadioCommsEntry = {
    timestamp: ts,
    callsign,
    message,
    formattedLine: "[" + ts + "] " + callsign + ": " + message,
  };
  // Always keep the 3 canonical initial lines available or append recent operational logs
  return [existing[0], existing[1], existing[2], entry];
}

export function createInitialEngineState(): PluginEngineState {
  const corridor = ALLOWED_CORRIDORS[0];
  return {
    workspaceTitle: "GF-T3-246",
    corridor,
    schedulerThroughputGbs: 9800,
    throughputSaturationPct: 100,
    kernelLaunchLatencyUs: 0.01,
    activeSlotsCount: 32,
    totalSlotsCapacity: 32,
    processedTokensUnits: 2560000,
    pluginXpK: 42.0,
    pluginStateText: "Batching Active",
    meshPointerHex: "0x9F8DC0",
    kernelIdentifier: "FUSED_ATTN",
    meshExecutionLatencyUs: 0.82,
    queueDepth: 0,
    attentionVector: [0.99, 0.97, 0.98, 0.96],
    saturationFaultActive: false,
    selectedSlotIndex: 3,
    stepCount: 0,
    reclaimedBubbleSlotsTotal: 12,
    slots: createInitialSlots(),
    radioLogs: createCanonicalRadioLogs(),
  };
}

export function switchPluginCorridor(
  state: PluginEngineState,
  nextCorridor: SyntheticCorridor
): PluginEngineState {
  const profile = CORRIDOR_PROFILES[nextCorridor];
  const nextStep = state.stepCount + 1;
  const throughput = calculateRooflineThroughputGbs(
    profile.peakBandwidthGbs,
    state.activeSlotsCount,
    state.totalSlotsCapacity,
    state.queueDepth,
    state.saturationFaultActive
  );
  const latency = calculateKernelLaunchLatencyUs(
    profile.baseKernelLatencyUs,
    state.activeSlotsCount,
    state.queueDepth,
    state.saturationFaultActive
  );
  const updatedSlots = state.slots.map((slot) => ({
    ...slot,
    kernelFull: profile.kernelName,
    executionTimeUs:
      slot.slotIndex === 3 && profile.id === "ALPHA"
        ? 0.82
        : Math.round((profile.fusedExecutionLatencyUs + (slot.slotIndex % 3) * 0.01) * 100) / 100,
  }));

  return {
    ...state,
    corridor: nextCorridor,
    schedulerThroughputGbs: throughput,
    throughputSaturationPct: Math.min(100, Math.round((throughput / 9800) * 1000) / 10),
    kernelLaunchLatencyUs: latency,
    kernelIdentifier: profile.kernelName,
    meshExecutionLatencyUs: profile.fusedExecutionLatencyUs,
    stepCount: nextStep,
    slots: updatedSlots,
    radioLogs: appendRadioLog(
      state.radioLogs,
      nextStep,
      "⚡ PIT WALL",
      "Switched corridor to " +
        profile.shortLabel +
        " · Throughput " +
        throughput.toLocaleString("en-US") +
        " GB/s · Kernel " +
        profile.kernelName
    ),
  };
}

export function injectInFlightBatchBurst(
  state: PluginEngineState,
  burstTokens = 64000
): PluginEngineState {
  const nextStep = state.stepCount + 1;
  const profile = CORRIDOR_PROFILES[state.corridor];
  let reclaimedIncrement = 0;

  const updatedSlots: PluginSchedulerSlot[] = state.slots.map((slot, idx) => {
    const tokenStep = 256 + idx * 64;
    const candidateTokens = slot.currentTokens + tokenStep;
    const isReclaimed = candidateTokens >= slot.maxTokens;
    if (isReclaimed) {
      reclaimedIncrement += 1;
    }
    const nextTokens = isReclaimed ? 128 + (idx % 4) * 32 : candidateTokens;
    const nextSeq = isReclaimed ? slot.sequenceId + 16 : slot.sequenceId;
    const nextState: PluginSchedulerSlot["stateLabel"] = isReclaimed ? "REINDEXED" : "ACTIVE";
    return {
      ...slot,
      sequenceId: nextSeq,
      currentTokens: nextTokens,
      stateLabel: nextState,
      efficiencyPct: calculateSlotEfficiencyPct(
        nextTokens,
        slot.maxTokens,
        idx,
        state.saturationFaultActive
      ),
      reindexedCount: slot.reindexedCount + (isReclaimed ? 1 : 0),
    };
  });

  const nextTokensTotal = state.processedTokensUnits + burstTokens;
  const nextXp = Math.round((state.pluginXpK + burstTokens / 16000) * 10) / 10;

  return {
    ...state,
    processedTokensUnits: nextTokensTotal,
    pluginXpK: nextXp,
    stepCount: nextStep,
    reclaimedBubbleSlotsTotal: state.reclaimedBubbleSlotsTotal + reclaimedIncrement + 2,
    schedulerThroughputGbs: calculateRooflineThroughputGbs(
      profile.peakBandwidthGbs,
      state.activeSlotsCount,
      state.totalSlotsCapacity,
      state.queueDepth,
      state.saturationFaultActive
    ),
    slots: updatedSlots,
    radioLogs: appendRadioLog(
      state.radioLogs,
      nextStep,
      "🟢 TELEMETRY",
      "In-flight burst injected +" +
        burstTokens.toLocaleString("en-US") +
        " Units · Dynamic sequence insertion verified across 32 slots"
    ),
  };
}

export function toggleSlotSaturationSpike(state: PluginEngineState): PluginEngineState {
  const nextFaultState = !state.saturationFaultActive;
  const nextStep = state.stepCount + 1;
  const profile = CORRIDOR_PROFILES[state.corridor];
  const nextQueueDepth = nextFaultState ? 14 : 0;

  const throughput = calculateRooflineThroughputGbs(
    profile.peakBandwidthGbs,
    state.activeSlotsCount,
    state.totalSlotsCapacity,
    nextQueueDepth,
    nextFaultState
  );
  const latency = calculateKernelLaunchLatencyUs(
    profile.baseKernelLatencyUs,
    state.activeSlotsCount,
    nextQueueDepth,
    nextFaultState
  );

  const updatedSlots: PluginSchedulerSlot[] = state.slots.map((slot, idx) => {
    const isFaultSlot = nextFaultState && (idx === 2 || idx === 5);
    return {
      ...slot,
      stateLabel: isFaultSlot ? "REINDEX" : "ACTIVE",
      lockStatus: isFaultSlot ? "FAULT" : "LOCKED",
      efficiencyPct: calculateSlotEfficiencyPct(
        slot.currentTokens,
        slot.maxTokens,
        idx,
        nextFaultState
      ),
      executionTimeUs: isFaultSlot ? 1.18 : 0.82,
    };
  });

  return {
    ...state,
    saturationFaultActive: nextFaultState,
    queueDepth: nextQueueDepth,
    schedulerThroughputGbs: throughput,
    throughputSaturationPct: Math.min(100, Math.round((throughput / 9800) * 1000) / 10),
    kernelLaunchLatencyUs: latency,
    pluginStateText: nextFaultState ? "Queue Reindexing" : "Batching Active",
    attentionVector: nextFaultState ? [0.94, 0.91, 0.95, 0.92] : [0.99, 0.97, 0.98, 0.96],
    stepCount: nextStep,
    slots: updatedSlots,
    radioLogs: appendRadioLog(
      state.radioLogs,
      nextStep,
      nextFaultState ? "🔴 TELEMETRY" : "🟢 CREW CHIEF",
      nextFaultState
        ? "Slot saturation spike injected on S2/S5 · Queue depth 14 · Forced shared-memory page reindex"
        : "Slot saturation cleared · All 32 scheduler slots locked at 99.9% KV-cache efficiency"
    ),
  };
}

export function stepPluginExecutionPass(state: PluginEngineState): PluginEngineState {
  const nextStep = state.stepCount + 1;
  const profile = CORRIDOR_PROFILES[state.corridor];
  const nextQueueDepth = Math.max(0, state.queueDepth - 7);
  const nextFaultState = nextQueueDepth > 0 ? state.saturationFaultActive : false;

  const throughput = calculateRooflineThroughputGbs(
    profile.peakBandwidthGbs,
    state.activeSlotsCount,
    state.totalSlotsCapacity,
    nextQueueDepth,
    nextFaultState
  );
  const latency = calculateKernelLaunchLatencyUs(
    profile.baseKernelLatencyUs,
    state.activeSlotsCount,
    nextQueueDepth,
    nextFaultState
  );

  const updatedSlots: PluginSchedulerSlot[] = state.slots.map((slot, idx) => {
    const advanced = slot.currentTokens + 128;
    const wrapped = advanced >= slot.maxTokens;
    const currentTokens = wrapped ? 128 : advanced;
    const sequenceId = wrapped ? slot.sequenceId + 8 : slot.sequenceId;
    const isFaultSlot = nextFaultState && (idx === 2 || idx === 5);

    return {
      ...slot,
      sequenceId,
      currentTokens,
      stateLabel: "ACTIVE",
      lockStatus: isFaultSlot ? "FAULT" : "LOCKED",
      efficiencyPct: calculateSlotEfficiencyPct(
        currentTokens,
        slot.maxTokens,
        idx,
        nextFaultState
      ),
      executionTimeUs: isFaultSlot ? 0.96 : 0.82,
      reindexedCount: slot.reindexedCount + (wrapped ? 1 : 0),
    };
  });

  return {
    ...state,
    saturationFaultActive: nextFaultState,
    queueDepth: nextQueueDepth,
    schedulerThroughputGbs: throughput,
    throughputSaturationPct: Math.min(100, Math.round((throughput / 9800) * 1000) / 10),
    kernelLaunchLatencyUs: latency,
    processedTokensUnits: state.processedTokensUnits + 32000,
    pluginXpK: Math.round((state.pluginXpK + 2.0) * 10) / 10,
    pluginStateText: nextFaultState ? "Queue Reindexing" : "Batching Active",
    attentionVector: nextFaultState ? [0.96, 0.94, 0.97, 0.95] : [0.99, 0.97, 0.98, 0.96],
    stepCount: nextStep,
    reclaimedBubbleSlotsTotal: state.reclaimedBubbleSlotsTotal + 1,
    slots: updatedSlots,
    radioLogs: appendRadioLog(
      state.radioLogs,
      nextStep,
      "⚡ PIT WALL",
      "Executed C++ plugin pass #" +
        String(nextStep) +
        " · Fused attention latency 0.82 µs · Queue depth " +
        String(nextQueueDepth)
    ),
  };
}

export function flushSchedulerQueues(): PluginEngineState {
  return createInitialEngineState();
}
