/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GridSync Zero-Trust Ingress & Payload Sanitization Middleware
 * Strictly validates and scrubs all kernel dispatch payloads, stream corridor mutations,
 * and synchronization barrier injections against SQL injection, XSS, and schema pollution.
 */

import { z } from 'zod';

export const STREAM_CORRIDORS = [
  'STREAM-CORRIDOR-ALPHA (HIGH-PRIORITY-KV-DECODE · 16-CONCURRENT)',
  'STREAM-CORRIDOR-BRAVO (NORMAL-PRIORITY-PROFILING-PASS)',
  'STREAM-CORRIDOR-GAMMA (LOW-PRIORITY-BACKGROUND-PREFETCH)',
  'STREAM-CORRIDOR-DELTA (BARRIER-SYNCHRONIZATION-FALLBACK)',
] as const;

export type StreamCorridor = (typeof STREAM_CORRIDORS)[number];

export type PriorityLevel = 'HIGH' | 'NORMAL' | 'LOW';

export type BarrierState = 'LOCKED' | 'FAULT' | 'ACTIVE_CONCURRENT' | 'SYNC_WAIT';

const SQLI_XSS_BLACKLIST = [
  'SELECT ',
  'INSERT ',
  'UPDATE ',
  'DELETE ',
  'DROP ',
  'UNION ',
  'ALTER ',
  'EXEC(',
  '<SCRIPT',
  'JAVASCRIPT:',
  'ONERROR=',
  'ONLOAD=',
  '--',
  ';--',
  '/*',
  '*/',
];

export function isCleanIdentifier(val: string): boolean {
  if (!val || val.length === 0 || val.length > 64) {
    return false;
  }
  const upper = val.toUpperCase();
  for (let i = 0; i < SQLI_XSS_BLACKLIST.length; i++) {
    if (upper.includes(SQLI_XSS_BLACKLIST[i])) {
      return false;
    }
  }
  for (let i = 0; i < val.length; i++) {
    const code = val.charCodeAt(i);
    const isUpper = code >= 65 && code <= 90;
    const isLower = code >= 97 && code <= 122;
    const isDigit = code >= 48 && code <= 57;
    const isAllowedSymbol =
      val[i] === '_' ||
      val[i] === '-' ||
      val[i] === ':' ||
      val[i] === '.' ||
      val[i] === ' ';
    if (!isUpper && !isLower && !isDigit && !isAllowedSymbol) {
      return false;
    }
  }
  return true;
}

export function isCleanHexFlag(val: string): boolean {
  if (!val.startsWith('0x') || val.length < 6 || val.length > 14) {
    return false;
  }
  for (let i = 2; i < val.length; i++) {
    const ch = val[i];
    const code = val.charCodeAt(i);
    const isDigit = code >= 48 && code <= 57;
    const isUpperHex = code >= 65 && code <= 70;
    const isLowerHex = code >= 97 && code <= 102;
    const isUnderscore = ch === '_';
    if (!isDigit && !isUpperHex && !isLowerHex && !isUnderscore) {
      return false;
    }
  }
  return true;
}

export const KernelDispatchPayloadSchema = z
  .object({
    streamId: z.number().int().min(0).max(15),
    priority: z.enum(['HIGH', 'NORMAL', 'LOW']),
    kernelName: z
      .string()
      .min(3)
      .max(32)
      .refine(isCleanIdentifier, {
        message: 'Kernel identifier failed GridSync zero-trust sanitization gate',
      }),
    tokenUnits: z.number().int().min(64).max(262144),
    eventDependencyFlag: z
      .string()
      .refine(isCleanHexFlag, {
        message: 'Event synchronization flag must be a valid hex pointer',
      }),
    kvBlockIndex: z.number().int().min(0).max(4095),
    corridor: z.enum(STREAM_CORRIDORS),
  })
  .strict();

export type KernelDispatchPayload = z.infer<typeof KernelDispatchPayloadSchema>;

export const CorridorSelectionSchema = z
  .object({
    corridor: z.enum(STREAM_CORRIDORS),
    preemptionEnabled: z.boolean(),
  })
  .strict();

export interface SanitizationResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  sanitizedTimestampMs: number;
}

export function sanitizeKernelDispatch(
  rawPayload: unknown,
  cycleTick: number
): SanitizationResult<KernelDispatchPayload> {
  const parsed = KernelDispatchPayloadSchema.safeParse(rawPayload);
  const deterministicTime = 1700000000000 + cycleTick * 18;
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      ok: false,
      error:
        'GRIDSYNC_INGRESS_REJECT: ' +
        (firstIssue ? firstIssue.message : 'Schema violation'),
      sanitizedTimestampMs: deterministicTime,
    };
  }
  return {
    ok: true,
    data: parsed.data,
    sanitizedTimestampMs: deterministicTime,
  };
}
