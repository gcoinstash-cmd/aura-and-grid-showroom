/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-267: Dynamic Rank-R LoRA Weight Fusion & Zero-Copy Workspace Arena Core
 * Zero-Trust GridSync Zod Sanitization + Real Linear Algebra Execution
 */

import { z } from 'zod';

export type CorridorId =
  | 'LORA-CORRIDOR-ALPHA'
  | 'LORA-CORRIDOR-BRAVO'
  | 'LORA-CORRIDOR-GAMMA'
  | 'LORA-CORRIDOR-DELTA';

export interface SyntheticCorridorSpec {
  id: CorridorId;
  shortTag: string;
  fullLabel: string;
  bandwidthGbs: number;
  swapLatencyUs: number;
  basePtrHex: string;
  modeTag: string;
  zeroCopy: boolean;
}

export const SYNTHETIC_CORRIDORS: readonly SyntheticCorridorSpec[] = [
  {
    id: 'LORA-CORRIDOR-ALPHA',
    shortTag: 'ALPHA · 28000 GB/s',
    fullLabel: 'LORA-CORRIDOR-ALPHA (DYNAMIC-ADAPTER-WEIGHT-FUSION-FABRIC · 28000-GB/S)',
    bandwidthGbs: 28000,
    swapLatencyUs: 0.01,
    basePtrHex: '0xFF8DC0',
    modeTag: 'LORA_FUSION',
    zeroCopy: true,
  },
  {
    id: 'LORA-CORRIDOR-BRAVO',
    shortTag: 'BRAVO · ARENA',
    fullLabel: 'LORA-CORRIDOR-BRAVO (ZERO-COPY-WORKSPACE-ARENA-ALLOCATOR)',
    bandwidthGbs: 26400,
    swapLatencyUs: 0.01,
    basePtrHex: '0xFF8EC0',
    modeTag: 'ARENA_ZERO_COPY',
    zeroCopy: true,
  },
  {
    id: 'LORA-CORRIDOR-GAMMA',
    shortTag: 'GAMMA · ROUTER',
    fullLabel: 'LORA-CORRIDOR-GAMMA (SUB-MICROSECOND-ADAPTER-SWAP-ROUTER)',
    bandwidthGbs: 27200,
    swapLatencyUs: 0.01,
    basePtrHex: '0xFF8FC0',
    modeTag: 'STREAM_SWAP',
    zeroCopy: true,
  },
  {
    id: 'LORA-CORRIDOR-DELTA',
    shortTag: 'DELTA · STATIC',
    fullLabel: 'LORA-CORRIDOR-DELTA (FALLBACK-STATIC-BASE-WEIGHT-PASS)',
    bandwidthGbs: 19800,
    swapLatencyUs: 0.04,
    basePtrHex: '0xFF90C0',
    modeTag: 'STATIC_BASE',
    zeroCopy: false,
  },
];

export type AdapterStatusLabel =
  | 'FUSED · LOCKED'
  | 'SWAP · ACTIVE'
  | 'RANK · SPIKED'
  | 'FAULT · STREAM';

export interface AdapterUnitState {
  index: number;
  id: string;
  title: string;
  ptrHex: string;
  tokensK: number;
  rankR: number;
  alpha: number;
  latencyMs: number;
  hitRatePct: number;
  loraHealth: 'OK' | 'WARN' | 'FAULT';
  statusLabel: AdapterStatusLabel;
  streamId: number;
  fusedVector: [number, number, number, number];
}

export interface FusionMathResult {
  w0Projected: [number, number, number, number];
  lowRankZ: [number, number];
  loraDelta: [number, number, number, number];
  fusedOutputH: [number, number, number, number];
  scaleFactor: number;
  l2Norm: number;
  flopsSavedPct: number;
}

const SQLI_XSS_PATTERN = /(<script|javascript:|onerror=|onload=|;--|\/\*|\*\/|drop\s+table|union\s+select|insert\s+into|delete\s+from)/i;

export const GridSyncSanitizedStringSchema = z
  .string()
  .min(1)
  .max(128)
  .refine((val) => !SQLI_XSS_PATTERN.test(val), {
    message: 'GridSync Zero-Trust Gate: Rejected potentially malicious payload token',
  })
  .refine((val) => val.indexOf(String.fromCharCode(36)) === -1, {
    message: 'GridSync Zero-Dollar Gate: Prohibited currency symbol detected',
  });

export const GridSyncFusionPayloadSchema = z.object({
  corridorId: z.enum([
    'LORA-CORRIDOR-ALPHA',
    'LORA-CORRIDOR-BRAVO',
    'LORA-CORRIDOR-GAMMA',
    'LORA-CORRIDOR-DELTA',
  ]),
  slotIndex: z.number().int().min(0).max(7),
  rankR: z.number().int().refine((r) => [4, 8, 16, 32, 64, 128].includes(r), {
    message: 'Rank R must be a valid tensor rank in {4, 8, 16, 32, 64, 128}',
  }),
  alpha: z.number().min(1).max(512),
  inputVector: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  tenantTag: GridSyncSanitizedStringSchema,
});

export type GridSyncFusionPayload = z.infer<typeof GridSyncFusionPayloadSchema>;

// Base transformer weight matrix W_0 (4x4) and low-rank matrices B (4x2) and A (2x4)
// Calibrated so that at default input x = [1.0, 1.0, 1.0, 1.0], alpha = 32, r = 16 (scale = 2.0):
// W_0 * x = [1.91, 1.95, 1.92, 1.94]
// B * (A * x) = [0.50, 0.50, 0.50, 0.50]
// h = W_0 * x + (alpha / r) * B * A * x = [2.91, 2.95, 2.92, 2.94]
export const CANONICAL_W0: readonly (readonly [number, number, number, number])[] = [
  [1.01, 0.30, 0.30, 0.30],
  [0.30, 1.05, 0.30, 0.30],
  [0.30, 0.30, 1.02, 0.30],
  [0.30, 0.30, 0.30, 1.04],
];

export const CANONICAL_LORA_B: readonly (readonly [number, number])[] = [
  [0.30, 0.20],
  [0.25, 0.25],
  [0.20, 0.30],
  [0.28, 0.22],
];

export const CANONICAL_LORA_A: readonly (readonly [number, number, number, number])[] = [
  [0.25, 0.25, 0.25, 0.25],
  [0.25, 0.25, 0.25, 0.25],
];

/**
 * Executes authentic Dynamic Rank-R LoRA Weight Fusion:
 *   h = W_0 * x + (alpha / r) * B * (A * x)
 */
export function executeDynamicLoraFusion(
  inputX: readonly [number, number, number, number],
  rankR: number,
  alpha: number,
  slotOffset: number = 0
): FusionMathResult {
  if (rankR <= 0) {
    throw new Error('LoRA rank r must be strictly positive');
  }

  const scale = alpha / rankR;
  const slotBias = slotOffset * 0.0025;

  // Step 1: Base transformer projection W_0 * x
  const w0Projected: [number, number, number, number] = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    let sum = 0;
    for (let j = 0; j < 4; j++) {
      sum += CANONICAL_W0[i][j] * inputX[j];
    }
    w0Projected[i] = Number(sum.toFixed(4));
  }

  // Step 2: Associative low-rank down-projection z = A * x (dimension 2)
  const lowRankZ: [number, number] = [0, 0];
  for (let k = 0; k < 2; k++) {
    let sum = 0;
    for (let j = 0; j < 4; j++) {
      sum += (CANONICAL_LORA_A[k][j] + slotBias) * inputX[j];
    }
    lowRankZ[k] = Number(sum.toFixed(4));
  }

  // Step 3: Low-rank up-projection and scaling delta_h = (alpha / r) * (B * z)
  const loraDelta: [number, number, number, number] = [0, 0, 0, 0];
  const fusedOutputH: [number, number, number, number] = [0, 0, 0, 0];

  for (let i = 0; i < 4; i++) {
    let bDotZ = 0;
    for (let k = 0; k < 2; k++) {
      bDotZ += CANONICAL_LORA_B[i][k] * lowRankZ[k];
    }
    const scaledDelta = scale * bDotZ;
    loraDelta[i] = Number(scaledDelta.toFixed(4));
    fusedOutputH[i] = Number((w0Projected[i] + scaledDelta).toFixed(2));
  }

  const l2Norm = Number(
    Math.sqrt(
      fusedOutputH[0] * fusedOutputH[0] +
        fusedOutputH[1] * fusedOutputH[1] +
        fusedOutputH[2] * fusedOutputH[2] +
        fusedOutputH[3] * fusedOutputH[3]
    ).toFixed(4)
  );

  // Compare dense 4096x4096 matmul ops vs rank-r factored ops: 1 - (2 * 4096 * r) / (4096 * 4096)
  const hiddenDim = 4096;
  const denseOps = hiddenDim * hiddenDim;
  const lowRankOps = 2 * hiddenDim * rankR;
  const flopsSavedPct = Number((((denseOps - lowRankOps) / denseOps) * 100).toFixed(2));

  return {
    w0Projected,
    lowRankZ,
    loraDelta,
    fusedOutputH,
    scaleFactor: Number(scale.toFixed(4)),
    l2Norm,
    flopsSavedPct,
  };
}

/**
 * Formats a 16-bit arena offset pointer in canonical uppercase hex without template literals.
 */
export function formatArenaHexPointer(slotIndex: number, baseAddress: number = 0x1000, stride: number = 0x0010): string {
  if (slotIndex < 0 || slotIndex > 63) {
    throw new Error('Arena slot index out of valid hardware range');
  }
  const addr = baseAddress + slotIndex * stride;
  const hex = addr.toString(16).toUpperCase().padStart(4, '0');
  return '0x' + hex;
}

/**
 * Initializes the 8 multi-tenant adapter slots (K0..K7) with deterministic Zero-Copy Arena pointers.
 */
export function createInitialAdapterMatrix(): AdapterUnitState[] {
  const units: AdapterUnitState[] = [];
  for (let i = 0; i < 8; i++) {
    const math = executeDynamicLoraFusion([1.0, 1.0, 1.0, 1.0], 16, 32, 0);
    units.push({
      index: i,
      id: 'K' + String(i),
      title: 'Adapter ' + String(i) + ' (K' + String(i) + ')',
      ptrHex: formatArenaHexPointer(i, 0x1000, 0x0010),
      tokensK: 256,
      rankR: 16,
      alpha: 32,
      latencyMs: 0.02,
      hitRatePct: 100,
      loraHealth: 'OK',
      statusLabel: 'FUSED · LOCKED',
      streamId: i,
      fusedVector: math.fusedOutputH,
    });
  }
  return units;
}

/**
 * Verifies that all 8 adapter arena slots maintain disjoint, 16-byte aligned pointers with 0% fragmentation.
 */
export function verifyArenaIsolation(units: readonly AdapterUnitState[]): {
  isolated: boolean;
  fragmentationPct: number;
  alignedCount: number;
} {
  const seen = new Set<number>();
  let alignedCount = 0;

  for (let i = 0; i < units.length; i++) {
    const numericAddr = parseInt(units[i].ptrHex.replace('0x', ''), 16);
    if (Number.isNaN(numericAddr)) {
      return { isolated: false, fragmentationPct: 100, alignedCount };
    }
    if (numericAddr % 16 === 0) {
      alignedCount += 1;
    }
    seen.add(numericAddr);
  }

  const isolated = seen.size === units.length && alignedCount === units.length;
  return {
    isolated,
    fragmentationPct: isolated ? 0 : Number((((units.length - seen.size) / units.length) * 100).toFixed(2)),
    alignedCount,
  };
}
