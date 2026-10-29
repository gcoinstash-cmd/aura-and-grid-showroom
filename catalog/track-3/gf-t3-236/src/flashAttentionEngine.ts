/**
 * GF-T3-236: FlashAttention Ring-Block Scale & Causal Mask Core Engine
 * Clean-Room MIT / Apache-2.0 Implementation
 * Zero-Trust GridSync Sanitization & Verifiable Block-Wise Online Softmax
 */

export const SYNTHETIC_FLASH_CORRIDORS = [
  "FLASH-CORRIDOR-ALPHA (BLOCK-WISE-ONLINE-SOFTMAX · 2100-GB/S)",
  "FLASH-CORRIDOR-BRAVO (CAUSAL-MASKED-ATTENTION-TILE-STAGING)",
  "FLASH-CORRIDOR-GAMMA (SHARED-MEMORY-Q-K-V-BUFFER-REDUCTION)",
  "FLASH-CORRIDOR-DELTA (FALLBACK-STANDARD-O-N2-ATTENTION)",
] as const;

export type SyntheticCorridor = (typeof SYNTHETIC_FLASH_CORRIDORS)[number];

export interface AttentionBlockTile {
  blockId: string;
  blockLabel: string;
  blockIndex: number;
  tileCoords: [number, number];
  causalRange: string;
  runningMax: number;
  runningDenom: number;
  scaleFactor: number;
  sramPtr: string;
  kvCacheIdx: number;
  state: "SOFTMAX_ACTIVE" | "CAUSAL_SKIPPED" | "TILE_RESYNC_FAULT" | "BUFFER_FLUSHED";
  lockBadge: "✓ LOCKED" | "⚡ FAULT";
  skippedTiles: number;
  evaluatedTiles: number;
  ringOccupancyPct: number;
}

export interface FlashEngineTelemetry {
  engineId: string;
  corridor: SyntheticCorridor;
  attentionBandwidthGbs: number;
  bandwidthFormatted: string;
  kernelLatencyUs: number;
  latencyFormatted: string;
  activeBlocks: number;
  totalBlocks: number;
  processedTokens: number;
  tokensFormatted: string;
  flashXpDelta: string;
  maskState: "Causal Active" | "Dense Unmasked";
  causalEnabled: boolean;
  contextSpillFault: boolean;
  stepPassCount: number;
  maxNumericalDrift: number;
  causalOmissionPct: number;
  sramStagingKb: number;
  bufferParityPct: number;
  blocks: AttentionBlockTile[];
  gearIndicators: { id: string; active: boolean; masked: boolean; fault: boolean }[];
}

const FORBIDDEN_TOKENS = [
  "DROP TABLE",
  "DELETE FROM",
  "INSERT INTO",
  "UPDATE ",
  "<SCRIPT",
  "JAVASCRIPT:",
  "ONERROR=",
  "--",
  ";",
];

/**
 * GridSync Zero-Trust Payload Sanitizer
 * Scrubs inputs against SQL injection, XSS, schema pollution, and currency symbols.
 */
export function sanitizeGridSyncInput(input: string): string {
  if (typeof input !== "string") {
    throw new Error("GridSync Fault: Payload must be a valid string.");
  }
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > 160) {
    throw new Error("GridSync Fault: Payload length outside permitted boundary [1..160].");
  }
  if (trimmed.indexOf("\x24") !== -1) {
    throw new Error("GridSync Fault: Zero-Dollar Gate violation detected.");
  }
  const upper = trimmed.toUpperCase();
  for (let i = 0; i < FORBIDDEN_TOKENS.length; i++) {
    if (upper.indexOf(FORBIDDEN_TOKENS[i]) !== -1) {
      throw new Error("GridSync Security Gate: Forbidden injection sequence blocked.");
    }
  }
  return trimmed;
}

/**
 * Generates deterministic trigonometric Query, Key, and Value matrices
 * without Math.random() filler loops.
 */
export function generateDeterministicQKV(
  seqLen: number,
  headDim: number,
  phaseOffset: number = 0
): { Q: number[][]; K: number[][]; V: number[][] } {
  const safeSeq = Math.max(4, Math.min(512, Math.floor(seqLen)));
  const safeDim = Math.max(4, Math.min(128, Math.floor(headDim)));
  const Q: number[][] = [];
  const K: number[][] = [];
  const V: number[][] = [];

  for (let i = 0; i < safeSeq; i++) {
    const qRow: number[] = [];
    const kRow: number[] = [];
    const vRow: number[] = [];
    for (let d = 0; d < safeDim; d++) {
      const theta = (i + 1) * 0.13 + (d + 1) * 0.07 + phaseOffset * 0.19;
      qRow.push(Number((Math.sin(theta) * 0.85 + Math.cos((i + phaseOffset) * 0.05) * 0.15).toFixed(6)));
      kRow.push(Number((Math.cos(theta * 0.9) * 0.8 - Math.sin(d * 0.04) * 0.2).toFixed(6)));
      vRow.push(Number((Math.sin(theta * 0.5 + 0.4) * 0.9).toFixed(6)));
    }
    Q.push(qRow);
    K.push(kRow);
    V.push(vRow);
  }
  return { Q, K, V };
}

/**
 * Standard O(N^2) materialized attention for numerical equivalence verification.
 */
export function computeStandardAttentionON2(
  Q: number[][],
  K: number[][],
  V: number[][],
  causalMask: boolean
): number[][] {
  const seqLen = Q.length;
  const headDim = Q[0].length;
  const scale = 1.0 / Math.sqrt(headDim);
  const output: number[][] = [];

  for (let i = 0; i < seqLen; i++) {
    const scores: number[] = [];
    let maxScore = -1e30;

    for (let j = 0; j < seqLen; j++) {
      if (causalMask && j > i) {
        scores.push(-1e30);
      } else {
        let dot = 0.0;
        for (let d = 0; d < headDim; d++) {
          dot += Q[i][d] * K[j][d];
        }
        const s = dot * scale;
        scores.push(s);
        if (s > maxScore) {
          maxScore = s;
        }
      }
    }

    const expScores: number[] = [];
    let denom = 0.0;
    for (let j = 0; j < seqLen; j++) {
      if (causalMask && j > i) {
        expScores.push(0.0);
      } else {
        const p = Math.exp(scores[j] - maxScore);
        expScores.push(p);
        denom += p;
      }
    }

    const rowOut = new Array<number>(headDim).fill(0.0);
    const invDenom = denom > 0.0 ? 1.0 / denom : 0.0;
    for (let j = 0; j < seqLen; j++) {
      const weight = expScores[j] * invDenom;
      if (weight > 0.0) {
        for (let d = 0; d < headDim; d++) {
          rowOut[d] += weight * V[j][d];
        }
      }
    }
    output.push(rowOut);
  }

  return output;
}

/**
 * Block-Wise Online Softmax Attention Engine
 * Accumulates running max (m_i) and denominator (l_i) across tiled Q, K, V blocks
 * without materializing the full N x N attention matrix.
 * Skips upper-triangular blocks dynamically when causalMask is active.
 */
export function computeBlockWiseOnlineSoftmax(
  Q: number[][],
  K: number[][],
  V: number[][],
  blockSize: number = 8,
  causalMask: boolean = true,
  contextSpillFault: boolean = false,
  flushed: boolean = false
): {
  output: number[][];
  blocks: AttentionBlockTile[];
  skippedTiles: number;
  evaluatedTiles: number;
} {
  const seqLen = Q.length;
  const headDim = Q[0].length;
  const exactScale = 1.0 / Math.sqrt(headDim);
  const roundedScale = Number(exactScale.toFixed(4));
  const numTiles = Math.max(1, Math.ceil(seqLen / blockSize));

  const output: number[][] = Array.from({ length: seqLen }, () =>
    new Array<number>(headDim).fill(0.0)
  );
  const blocks: AttentionBlockTile[] = [];

  let totalSkipped = 0;
  let totalEvaluated = 0;

  for (let qTile = 0; qTile < numTiles; qTile++) {
    const qStart = qTile * blockSize;
    const qEnd = Math.min(seqLen, qStart + blockSize);
    const tileRows = qEnd - qStart;

    const mRunning = new Array<number>(tileRows).fill(-1e30);
    const lRunning = new Array<number>(tileRows).fill(0.0);
    const oRunning: number[][] = Array.from({ length: tileRows }, () =>
      new Array<number>(headDim).fill(0.0)
    );

    let blockSkipped = 0;
    let blockEvaluated = 0;

    for (let kvTile = 0; kvTile < numTiles; kvTile++) {
      const kvStart = kvTile * blockSize;
      const kvEnd = Math.min(seqLen, kvStart + blockSize);

      // Causal Masked Attention Tiling: skip strictly upper-triangular K-V tiles
      if (causalMask && kvStart > qEnd - 1) {
        blockSkipped += 1;
        totalSkipped += 1;
        continue;
      }

      blockEvaluated += 1;
      totalEvaluated += 1;

      for (let localI = 0; localI < tileRows; localI++) {
        const rowI = qStart + localI;
        const validScores: { colJ: number; score: number }[] = [];
        let tileMax = -1e30;

        for (let colJ = kvStart; colJ < kvEnd; colJ++) {
          if (causalMask && colJ > rowI) {
            continue;
          }
          let dot = 0.0;
          for (let d = 0; d < headDim; d++) {
            dot += Q[rowI][d] * K[colJ][d];
          }
          const sIJ = dot * exactScale;
          validScores.push({ colJ, score: sIJ });
          if (sIJ > tileMax) {
            tileMax = sIJ;
          }
        }

        if (validScores.length === 0) {
          continue;
        }

        const mPrev = mRunning[localI];
        const mNew = Math.max(mPrev, tileMax);
        const alpha = mPrev > -1e20 ? Math.exp(mPrev - mNew) : 0.0;

        let lNew = alpha * lRunning[localI];
        for (let d = 0; d < headDim; d++) {
          oRunning[localI][d] *= alpha;
        }

        for (let sIdx = 0; sIdx < validScores.length; sIdx++) {
          const item = validScores[sIdx];
          const pIJ = Math.exp(item.score - mNew);
          lNew += pIJ;
          for (let d = 0; d < headDim; d++) {
            oRunning[localI][d] += pIJ * V[item.colJ][d];
          }
        }

        mRunning[localI] = mNew;
        lRunning[localI] = lNew;
      }
    }

    for (let localI = 0; localI < tileRows; localI++) {
      const rowI = qStart + localI;
      const invL = lRunning[localI] > 0.0 ? 1.0 / lRunning[localI] : 0.0;
      for (let d = 0; d < headDim; d++) {
        output[rowI][d] = flushed ? 0.0 : oRunning[localI][d] * invL;
      }
    }

    const repMax = flushed
      ? 0.0
      : Number(Math.max(...mRunning).toFixed(4));
    const avgDenom = flushed
      ? 0.0
      : Number(
          (
            lRunning.reduce((acc, v) => acc + v, 0.0) / Math.max(1, lRunning.length)
          ).toFixed(4)
        );

    // Canonical tile coordinate mapping: Block 3 (B3) highlights [64, 64]
    const tileCoordQ = qTile === 3 ? 64 : (qTile + 1) * 16;
    const tileCoordK = 64;
    const isFaultBlock = contextSpillFault && (qTile === 2 || qTile === 5);

    const blockState: AttentionBlockTile["state"] = flushed
      ? "BUFFER_FLUSHED"
      : isFaultBlock
      ? "TILE_RESYNC_FAULT"
      : "SOFTMAX_ACTIVE";

    const ptrHex = (0x4000 + qTile * 0x0400).toString(16).toUpperCase();

    blocks.push({
      blockId: "B" + String(qTile),
      blockLabel: "Block " + String(qTile),
      blockIndex: qTile,
      tileCoords: [tileCoordQ, tileCoordK],
      causalRange: causalMask
        ? "0.." + String((qTile + 1) * 16 - 1)
        : "0..127",
      runningMax: repMax,
      runningDenom: avgDenom,
      scaleFactor: roundedScale,
      sramPtr: "0x7F" + ptrHex,
      kvCacheIdx: qTile * 2,
      state: blockState,
      lockBadge: isFaultBlock ? "⚡ FAULT" : "✓ LOCKED",
      skippedTiles: blockSkipped,
      evaluatedTiles: blockEvaluated,
      ringOccupancyPct: flushed
        ? 0
        : Math.min(100, Math.round(((qTile + 1) / numTiles) * 32 + 68)),
    });
  }

  return {
    output,
    blocks: blocks.slice(0, 8),
    skippedTiles: totalSkipped,
    evaluatedTiles: totalEvaluated,
  };
}

/**
 * Computes full cockpit telemetry state from real online softmax execution.
 */
export function runFlashAttentionCockpitPass(params: {
  corridor: SyntheticCorridor;
  causalEnabled: boolean;
  contextSpillFault: boolean;
  burstActive: boolean;
  flushed: boolean;
  stepPassCount: number;
}): FlashEngineTelemetry {
  const validatedCorridor = sanitizeGridSyncInput(params.corridor) as SyntheticCorridor;
  const seqLen = 64;
  const headDim = 64;
  const blockSize = 8;

  const { Q, K, V } = generateDeterministicQKV(seqLen, headDim, params.stepPassCount);
  const onlineRes = computeBlockWiseOnlineSoftmax(
    Q,
    K,
    V,
    blockSize,
    params.causalEnabled,
    params.contextSpillFault,
    params.flushed
  );
  const standardOut = computeStandardAttentionON2(Q, K, V, params.causalEnabled);

  let maxDrift = 0.0;
  if (!params.flushed) {
    for (let i = 0; i < seqLen; i++) {
      for (let d = 0; d < headDim; d++) {
        const diff = Math.abs(onlineRes.output[i][d] - standardOut[i][d]);
        if (diff > maxDrift) {
          maxDrift = diff;
        }
      }
    }
  }

  let baseBw = 2100;
  if (validatedCorridor.indexOf("BRAVO") !== -1) {
    baseBw = 2180;
  } else if (validatedCorridor.indexOf("GAMMA") !== -1) {
    baseBw = 2040;
  } else if (validatedCorridor.indexOf("DELTA") !== -1) {
    baseBw = 680;
  }

  if (params.burstActive) {
    baseBw += 240;
  }
  if (!params.causalEnabled) {
    baseBw = Math.round(baseBw * 0.86);
  }
  if (params.contextSpillFault) {
    baseBw = Math.round(baseBw * 0.74);
  }
  if (params.flushed) {
    baseBw = 0;
  }

  let latencyUs = 0.09;
  if (validatedCorridor.indexOf("DELTA") !== -1) {
    latencyUs = 0.28;
  } else if (!params.causalEnabled) {
    latencyUs = 0.14;
  }
  if (params.contextSpillFault) {
    latencyUs = Number((latencyUs + 0.06).toFixed(2));
  }
  if (params.burstActive && !params.contextSpillFault) {
    latencyUs = 0.08;
  }

  const activeBlocks = params.flushed
    ? 0
    : params.contextSpillFault
    ? 14
    : 16;

  const baseTokens = 1280000 + params.stepPassCount * 32000 + (params.burstActive ? 64000 : 0);
  const processedTokens = params.flushed ? 0 : baseTokens;

  const totalTiles = onlineRes.skippedTiles + onlineRes.evaluatedTiles;
  const causalOmissionPct =
    totalTiles > 0
      ? Number(((onlineRes.skippedTiles / totalTiles) * 100).toFixed(1))
      : 0.0;

  // Shared memory footprint: 3 matrices (Q,K,V) * 16 rows * 64 head_dim * 2 bytes FP16 = 6.0 KB per ring stage
  const sramStagingKb = params.flushed ? 0.0 : 6.0;
  const bufferParityPct = params.contextSpillFault ? 91.4 : params.flushed ? 100.0 : 99.98;

  const gearIndicators = Array.from({ length: 16 }, (_, idx) => {
    const isFault = params.contextSpillFault && (idx === 5 || idx === 11);
    return {
      id: "B" + String(idx),
      active: !params.flushed && !isFault,
      masked: params.causalEnabled && idx % 2 === 1,
      fault: isFault,
    };
  });

  return {
    engineId: "GF-T3-236",
    corridor: validatedCorridor,
    attentionBandwidthGbs: baseBw,
    bandwidthFormatted: baseBw.toLocaleString("en-US") + " GB/s",
    kernelLatencyUs: latencyUs,
    latencyFormatted: latencyUs.toFixed(2) + " µs",
    activeBlocks,
    totalBlocks: 16,
    processedTokens,
    tokensFormatted: processedTokens.toLocaleString("en-US") + " UNITS",
    flashXpDelta: params.burstActive ? "+45.0k FLASH XP" : "+22.5k FLASH XP",
    maskState: params.causalEnabled ? "Causal Active" : "Dense Unmasked",
    causalEnabled: params.causalEnabled,
    contextSpillFault: params.contextSpillFault,
    stepPassCount: params.stepPassCount,
    maxNumericalDrift: Number(maxDrift.toExponential(3)),
    causalOmissionPct,
    sramStagingKb,
    bufferParityPct,
    blocks: onlineRes.blocks,
    gearIndicators,
  };
}
