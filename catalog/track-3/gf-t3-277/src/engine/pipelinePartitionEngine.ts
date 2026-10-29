/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from "zod";

export enum CorridorType {
  ALPHA = "PIPE-CORRIDOR-ALPHA (MULTI-GPU-PIPELINE-PARTITIONING-FABRIC · 36000-GB/S)",
  BRAVO = "PIPE-CORRIDOR-BRAVO (LAYER-WISE-TENSOR-SHARDING-ENGINE)",
  GAMMA = "PIPE-CORRIDOR-GAMMA (NON-BLOCKING-PEER-TO-PEER-TENSOR-FORWARDER)",
  DELTA = "PIPE-CORRIDOR-DELTA (FALLBACK-SINGLE-GPU-MONOLITHIC-PASS)",
}

export const SYNTHETIC_PIPELINE_CORRIDORS: readonly CorridorType[] = [
  CorridorType.ALPHA,
  CorridorType.BRAVO,
  CorridorType.GAMMA,
  CorridorType.DELTA,
];

export interface CorridorProfile {
  id: string;
  label: CorridorType;
  nvlinkBandwidthGbs: number;
  baseStagingLatencyUs: number;
  activeStages: number;
  defaultMicroBatches: number;
  modeCode: string;
  interconnectBadge: string;
}

export const CORRIDOR_PROFILES: Record<CorridorType, CorridorProfile> = {
  [CorridorType.ALPHA]: {
    id: "PIPE-CORRIDOR-ALPHA",
    label: CorridorType.ALPHA,
    nvlinkBandwidthGbs: 36000,
    baseStagingLatencyUs: 0.01,
    activeStages: 8,
    defaultMicroBatches: 32,
    modeCode: "PIPELINE_SHARD",
    interconnectBadge: "NVLINK-8X",
  },
  [CorridorType.BRAVO]: {
    id: "PIPE-CORRIDOR-BRAVO",
    label: CorridorType.BRAVO,
    nvlinkBandwidthGbs: 32400,
    baseStagingLatencyUs: 0.02,
    activeStages: 8,
    defaultMicroBatches: 24,
    modeCode: "TENSOR_SHARD",
    interconnectBadge: "NVLINK-8X",
  },
  [CorridorType.GAMMA]: {
    id: "PIPE-CORRIDOR-GAMMA",
    label: CorridorType.GAMMA,
    nvlinkBandwidthGbs: 34800,
    baseStagingLatencyUs: 0.01,
    activeStages: 8,
    defaultMicroBatches: 28,
    modeCode: "P2P_FORWARD",
    interconnectBadge: "NVLINK-8X",
  },
  [CorridorType.DELTA]: {
    id: "PIPE-CORRIDOR-DELTA",
    label: CorridorType.DELTA,
    nvlinkBandwidthGbs: 9600,
    baseStagingLatencyUs: 0.08,
    activeStages: 8,
    defaultMicroBatches: 8,
    modeCode: "MONOLITHIC_PASS",
    interconnectBadge: "PCIE-GEN5",
  },
};

const DANGEROUS_PATTERNS = [
  "DROP ",
  "DELETE ",
  "INSERT ",
  "UPDATE ",
  "SELECT ",
  "<SCRIPT",
  "JAVASCRIPT:",
  "--",
  ";",
  "/*",
  "*/",
];

export const GridSyncPayloadSchema = z.object({
  corridor: z.nativeEnum(CorridorType),
  totalLayers: z.number().int().min(8).max(128),
  numStages: z.number().int().min(1).max(16),
  microBatches: z.number().int().min(1).max(512),
  hiddenDim: z.number().int().min(512).max(65536),
  seqLength: z.number().int().min(64).max(131072),
  burstPassCount: z.number().int().min(0).max(10000),
  imbalanceSpikeActive: z.boolean(),
  imbalanceTargetStage: z.number().int().min(0).max(7),
  customTag: z
    .string()
    .max(64)
    .refine(
      (val) => {
        const upper = val.toUpperCase();
        return !DANGEROUS_PATTERNS.some((pat) => upper.includes(pat));
      },
      { message: "GridSync zero-trust policy blocked unsafe payload sequence" }
    )
    .optional(),
});

export type GridSyncPayload = z.infer<typeof GridSyncPayloadSchema>;

export interface PipelineStageNode {
  stageIndex: number;
  stageCode: string;
  titleLabel: string;
  hexPtr: string;
  layerStart: number;
  layerEnd: number;
  layersLabel: string;
  tokensK: number;
  tokensLabel: string;
  latencyMs: number;
  latencyLabel: string;
  stagePartitionCost: number;
  p2pBandwidthGbs: number;
  syncPercent: number;
  microBatchQueueDepth: number;
  isBalanced: boolean;
  statusText: string;
  pipeHealth: "OK" | "REROUTE";
}

export interface PipelineTelemetryState {
  corridor: CorridorType;
  modeCode: string;
  meshPtr: string;
  partitionThroughputGbs: number;
  throughputFormatted: string;
  saturationPercent: number;
  stagingLatencyUs: number;
  stagingLatencyFormatted: string;
  interconnectBadge: string;
  activeStagesCount: number;
  totalStagesCount: number;
  processedTokensUnits: number;
  processedTokensFormatted: string;
  engineXpK: number;
  engineXpFormatted: string;
  pipelineStateLabel: string;
  bubbleFractionPct: number;
  balanceParityPct: number;
  vectorSignature: [number, number, number, number];
  stages: PipelineStageNode[];
  stepCounter: number;
  imbalanceSpikeActive: boolean;
}

/**
 * Sanitizes and validates incoming simulation parameters via Zod (GridSync API Architecture).
 */
export function sanitizeGridSyncInput(rawInput: unknown): GridSyncPayload {
  return GridSyncPayloadSchema.parse(rawInput);
}

/**
 * Computes transformer decoder layer FLOPs (Forward + Backward passes):
 * FLOPs(l) = 24 * B * S * H^2 + 4 * B * S^2 * H
 */
export function calculateLayerFlops(
  hiddenDim: number,
  seqLength: number,
  microBatchSize: number = 4
): number {
  if (hiddenDim <= 0 || seqLength <= 0 || microBatchSize <= 0) {
    throw new Error("Dimensions must be strictly positive");
  }
  const projectionFlops = 24 * microBatchSize * seqLength * hiddenDim * hiddenDim;
  const attentionFlops = 4 * microBatchSize * seqLength * seqLength * hiddenDim;
  return projectionFlops + attentionFlops;
}

/**
 * Implements the Layer-Wise Pipeline Stage Sharding cost formula:
 * P_stage = sum_{l=1}^{L_stage} ( FLOPs(l) / Bandwidth_nvlink )
 */
export function calculateStagePartitionCost(
  layerCount: number,
  hiddenDim: number,
  seqLength: number,
  nvlinkBandwidthGbs: number,
  loadMultiplier: number = 1.0
): number {
  if (nvlinkBandwidthGbs <= 0) {
    throw new Error("NVLink bandwidth must be greater than zero");
  }
  const singleLayerFlops = calculateLayerFlops(hiddenDim, seqLength, 4);
  const stageTotalTflops = (singleLayerFlops * layerCount * loadMultiplier) / 1e12;
  const rawCost = (stageTotalTflops / nvlinkBandwidthGbs) * 10000;
  return Math.round(rawCost * 1000) / 1000;
}

/**
 * Computes 1F1B (One-Forward-One-Backward) micro-batch pipelining bubble percentage:
 * Bubble = ((P - 1) / (M + P - 1)) * 100
 */
export function calculate1F1BBubblePercent(
  numStages: number,
  microBatches: number
): number {
  if (numStages <= 1) {
    return 0;
  }
  if (microBatches <= 0) {
    throw new Error("Micro-batches must be greater than zero");
  }
  const ratio = (numStages - 1) / (microBatches + numStages - 1);
  return Math.round(ratio * 10000) / 100;
}

/**
 * Non-Blocking Peer-to-Peer Tensor Forwarding latency across NVLink interconnects.
 */
export function calculateP2PTensorForwardLatencyUs(
  hiddenDim: number,
  seqLength: number,
  nvlinkBandwidthGbs: number,
  nonBlockingOverlap: boolean = true
): number {
  const tensorBytes = 2 * hiddenDim * seqLength;
  const wireUs = (tensorBytes / (nvlinkBandwidthGbs * 1e9)) * 1e6;
  const overlapFactor = nonBlockingOverlap ? 0.005 : 1.0;
  const effectiveUs = Math.max(0.01, Math.round(wireUs * overlapFactor * 100) / 100);
  return effectiveUs;
}

/**
 * Formats integer with standard comma separators without locale discrepancy.
 */
export function formatIntegerUnits(value: number): string {
  const rounded = Math.round(value);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Executes a full deterministic multi-GPU pipeline partitioning & layer-wise tensor sharding pass.
 */
export function evaluatePipelinePartitionState(
  rawPayload: GridSyncPayload
): PipelineTelemetryState {
  const payload = sanitizeGridSyncInput(rawPayload);
  const profile = CORRIDOR_PROFILES[payload.corridor];

  const burstBonusGbs = payload.burstPassCount * 150;
  const effectiveBandwidthGbs = profile.nvlinkBandwidthGbs + burstBonusGbs;

  const layersPerStage = Math.floor(payload.totalLayers / payload.numStages);
  const stages: PipelineStageNode[] = [];
  const stageCosts: number[] = [];

  for (let i = 0; i < payload.numStages; i++) {
    const lStart = i * layersPerStage;
    const lEnd =
      i === payload.numStages - 1 ? payload.totalLayers : lStart + layersPerStage;
    const stageLayerCount = lEnd - lStart;

    const isImbalancedStage =
      payload.imbalanceSpikeActive && i === payload.imbalanceTargetStage;
    const isNeighborReroute =
      payload.imbalanceSpikeActive &&
      Math.abs(i - payload.imbalanceTargetStage) === 1;

    const loadMult = isImbalancedStage ? 1.85 : isNeighborReroute ? 1.15 : 1.0;

    const stageCost = calculateStagePartitionCost(
      stageLayerCount,
      payload.hiddenDim,
      payload.seqLength,
      effectiveBandwidthGbs,
      loadMult
    );
    stageCosts.push(stageCost);

    const baseTokensK = 256 + payload.burstPassCount * 16;
    const stageTokensK = isImbalancedStage
      ? Math.round(baseTokensK * 1.5)
      : isNeighborReroute
      ? Math.round(baseTokensK * 1.125)
      : baseTokensK;

    const baseStageLatencyMs =
      profile.nvlinkBandwidthGbs >= 30000 ? 0.02 : 0.05;
    const stageLatencyMs = isImbalancedStage
      ? Math.round(baseStageLatencyMs * 3.5 * 100) / 100
      : baseStageLatencyMs;

    const syncPercent = isImbalancedStage
      ? 84
      : isNeighborReroute
      ? 96
      : 100;

    const hexNum = 0xb000 + i * 0x0010;
    const hexPtr = "0x" + hexNum.toString(16).toUpperCase();

    const statusText = isImbalancedStage
      ? "IMBALANCE · ⚡ FAULT"
      : "BALANCED · LOCKED";

    stages.push({
      stageIndex: i,
      stageCode: "P" + String(i),
      titleLabel: "Stage " + String(i) + " (P" + String(i) + ")",
      hexPtr,
      layerStart: lStart,
      layerEnd: lEnd,
      layersLabel: "LAYERS: L" + String(lStart) + "-L" + String(lEnd),
      tokensK: stageTokensK,
      tokensLabel: "TOK: " + String(stageTokensK) + "K",
      latencyMs: stageLatencyMs,
      latencyLabel: stageLatencyMs.toFixed(2) + "ms",
      stagePartitionCost: stageCost,
      p2pBandwidthGbs: Math.round(effectiveBandwidthGbs / loadMult),
      syncPercent,
      microBatchQueueDepth: isImbalancedStage
        ? payload.microBatches + 6
        : Math.max(4, Math.floor(payload.microBatches / payload.numStages)),
      isBalanced: !isImbalancedStage,
      statusText,
      pipeHealth: isImbalancedStage ? "REROUTE" : "OK",
    });
  }

  const meanCost =
    stageCosts.reduce((acc, val) => acc + val, 0) / stageCosts.length;
  const variance =
    stageCosts.reduce((acc, val) => acc + (val - meanCost) * (val - meanCost), 0) /
    stageCosts.length;
  const stdDev = Math.sqrt(variance);
  const balanceParityPct = payload.imbalanceSpikeActive
    ? Math.max(72.4, Math.round((100 - stdDev * 18) * 10) / 10)
    : 100.0;

  const bubbleFractionPct = calculate1F1BBubblePercent(
    payload.numStages,
    payload.microBatches + payload.burstPassCount * 4
  );

  const stagingLatencyUs = payload.imbalanceSpikeActive
    ? 0.04
    : calculateP2PTensorForwardLatencyUs(
        payload.hiddenDim,
        payload.seqLength,
        effectiveBandwidthGbs,
        true
      );

  const baseTokensUnits = 6912000;
  const processedTokensUnits =
    baseTokensUnits + payload.burstPassCount * 262144;
  const engineXpK = Math.round((75.0 + payload.burstPassCount * 4.5) * 10) / 10;

  const saturationPercent = Math.min(
    100,
    Math.round((effectiveBandwidthGbs / 36000) * 100)
  );

  const vecOffset = Math.round(payload.burstPassCount * 0.01 * 100) / 100;
  const vectorSignature: [number, number, number, number] = [
    Number((3.91 + vecOffset).toFixed(2)),
    Number((3.95 + vecOffset).toFixed(2)),
    Number((3.92 + vecOffset).toFixed(2)),
    Number((3.94 + vecOffset).toFixed(2)),
  ];

  const activeBalancedCount = stages.filter((s) => s.isBalanced).length;

  return {
    corridor: payload.corridor,
    modeCode: profile.modeCode,
    meshPtr: "0xAF8DC0",
    partitionThroughputGbs: effectiveBandwidthGbs,
    throughputFormatted: formatIntegerUnits(effectiveBandwidthGbs) + " GB/s",
    saturationPercent,
    stagingLatencyUs,
    stagingLatencyFormatted: stagingLatencyUs.toFixed(2) + " µs",
    interconnectBadge: "🔥 " + profile.interconnectBadge,
    activeStagesCount: activeBalancedCount,
    totalStagesCount: payload.numStages,
    processedTokensUnits,
    processedTokensFormatted:
      formatIntegerUnits(processedTokensUnits) + " UNITS",
    engineXpK,
    engineXpFormatted: "+" + engineXpK.toFixed(1) + "k ENGINE XP",
    pipelineStateLabel: payload.imbalanceSpikeActive
      ? "Pipeline State: Micro-Batch Re-Routing"
      : "Pipeline State: Partition Active",
    bubbleFractionPct,
    balanceParityPct,
    vectorSignature,
    stages,
    stepCounter: payload.burstPassCount,
    imbalanceSpikeActive: payload.imbalanceSpikeActive,
  };
}

export function createInitialPayload(): GridSyncPayload {
  return {
    corridor: CorridorType.ALPHA,
    totalLayers: 32,
    numStages: 8,
    microBatches: 32,
    hiddenDim: 8192,
    seqLength: 4096,
    burstPassCount: 0,
    imbalanceSpikeActive: false,
    imbalanceTargetStage: 3,
  };
}
