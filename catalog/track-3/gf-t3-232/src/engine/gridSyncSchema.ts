/**
 * GF-T3-232: GridSync Zero-Trust Ingress & Payload Sanitization Middleware
 * Scrubs inputs against SQL injection, XSS vectors, and schema pollution.
 * SPDX-License-Identifier: MIT
 */

import { z } from 'zod';

const FORBIDDEN_PATTERNS = [
  '<script',
  '</script',
  'javascript:',
  'onerror=',
  'onload=',
  'drop table',
  'union select',
  'insert into',
  'delete from',
  '--;',
  '/*',
  '*/',
];

export function containsForbiddenVector(input: string): boolean {
  const lower = input.toLowerCase();
  if (input.indexOf('\u0024') !== -1) {
    return true;
  }
  for (const token of FORBIDDEN_PATTERNS) {
    if (lower.indexOf(token) !== -1) {
      return true;
    }
  }
  return false;
}

export function isValidHexAliasPointer(ptr: string): boolean {
  const trimmed = ptr.trim();
  if (!trimmed.startsWith('0x') || trimmed.length < 6 || trimmed.length > 24) {
    return false;
  }
  const allowedChars = '0123456789ABCDEFabcdef_x';
  for (let i = 0; i < trimmed.length; i++) {
    if (allowedChars.indexOf(trimmed[i]) === -1) {
      return false;
    }
  }
  return true;
}

export const GraphCorridorEnum = z.enum([
  'GRAPH-CORRIDOR-ALPHA (STREAM-CAPTURE-ISOLATION · 128-NODES)',
  'GRAPH-CORRIDOR-BRAVO (CPU-DISPATCH-BYPASS · ZERO-OVERHEAD)',
  'GRAPH-CORRIDOR-GAMMA (MUTUAL-DEPENDENCY-NODE-ALIASING)',
  'GRAPH-CORRIDOR-DELTA (FALLBACK-SYNCHRONOUS-STREAM)',
]);

export type GraphCorridorType = z.infer<typeof GraphCorridorEnum>;

export const StreamCaptureStateEnum = z.enum([
  'UNINITIALIZED',
  'CAPTURING',
  'CAPTURED',
  'REPLAYING',
  'STALL_CONFLICT',
  'FLUSHED',
]);

export type StreamCaptureStateType = z.infer<typeof StreamCaptureStateEnum>;

export const KernelTypeEnum = z.enum([
  'ELEMENTWISE_NORM',
  'QKV_PROJECTION',
  'ROTARY_EMBED',
  'GEMM_FP16',
  'SOFTMAX_REDUCE',
  'ATTENTION_FUSED',
  'MLP_SWIGLU',
  'ALLREDUCE_RING',
]);

export type KernelTypeValue = z.infer<typeof KernelTypeEnum>;

export const GraphNodeSchema = z
  .object({
    nodeId: z.number().int().min(0).max(127),
    label: z
      .string()
      .min(2)
      .max(8)
      .refine((val) => !containsForbiddenVector(val), {
        message: 'Forbidden injection vector in node label',
      }),
    kernelType: KernelTypeEnum,
    parentIds: z.array(z.number().int().min(0).max(127)),
    childIds: z.array(z.number().int().min(0).max(127)),
    executionTimeUs: z.number().positive().max(1000),
    cpuSubmitOverheadUs: z.number().positive().max(1000),
    replayOverheadUs: z.number().positive().max(100),
    memoryAliasPtr: z
      .string()
      .refine((val) => isValidHexAliasPointer(val) && !containsForbiddenVector(val), {
        message: 'Invalid or unsafe hexadecimal memory alias pointer',
      }),
    registerFootprintKb: z.number().int().positive().max(1024),
    scaleFactor: z.number().min(-10).max(10),
    biasOffset: z.number().min(-100).max(100),
    dispatchState: z
      .string()
      .min(2)
      .max(32)
      .refine((val) => !containsForbiddenVector(val), {
        message: 'Forbidden vector in dispatch state',
      }),
  })
  .strict();

export type GraphNodeModel = z.infer<typeof GraphNodeSchema>;

export const CaptureBurstPayloadSchema = z
  .object({
    corridor: GraphCorridorEnum,
    subGraphClusters: z.number().int().min(1).max(32),
    tokensPerPass: z.number().int().min(1024).max(1048576),
    operatorCallsign: z
      .string()
      .min(2)
      .max(32)
      .refine((val) => !containsForbiddenVector(val), {
        message: 'Security policy violation: SQLi/XSS or prohibited token detected',
      }),
  })
  .strict();

export type CaptureBurstPayload = z.infer<typeof CaptureBurstPayloadSchema>;

export const EquivalenceInputSchema = z
  .object({
    inputVector: z.array(z.number().finite()).min(1).max(64),
    iterations: z.number().int().min(1).max(1000),
  })
  .strict();

export type EquivalenceInputPayload = z.infer<typeof EquivalenceInputSchema>;

export function sanitizeBurstIngress(rawPayload: unknown): CaptureBurstPayload {
  return CaptureBurstPayloadSchema.parse(rawPayload);
}

export function sanitizeNodeIngress(rawNode: unknown): GraphNodeModel {
  return GraphNodeSchema.parse(rawNode);
}
