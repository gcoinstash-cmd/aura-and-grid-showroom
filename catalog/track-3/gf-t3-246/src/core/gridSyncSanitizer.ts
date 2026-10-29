/**
 * GF-T3-246 · GridSync Zero-Trust Ingress & Sanitization Middleware
 * SPDX-License-Identifier: Apache-2.0
 * Enforces strict Zod validation against SQLi, XSS, schema pollution, and Zero-Dollar Gate violations.
 */

import { z } from "zod";

export const ALLOWED_CORRIDORS = [
  "PLUGIN-CORRIDOR-ALPHA (CUSTOM-CPP-PLUGIN-SCHEDULER · 9800-GB/S)",
  "PLUGIN-CORRIDOR-BRAVO (IN-FLIGHT-CONTINUOUS-BATCHING)",
  "PLUGIN-CORRIDOR-GAMMA (CUDA-KERNEL-LAUNCH-OPTIMIZATION)",
  "PLUGIN-CORRIDOR-DELTA (FALLBACK-STATIC-BATCH-RUNNER)",
] as const;

export type SyntheticCorridor = (typeof ALLOWED_CORRIDORS)[number];

const FORBIDDEN_SQLI_XSS_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /onerror=/i,
  /onload=/i,
  /DROP\s+TABLE/i,
  /UNION\s+SELECT/i,
  /--/,
  /;.*SELECT/i,
  /__proto__/i,
  /constructor/i,
];

export function containsForbiddenPattern(input: string): boolean {
  // Also reject ASCII 36 (dollar character) to enforce the Zero-Dollar Gate at ingress
  if (input.indexOf(String.fromCharCode(36)) !== -1) {
    return true;
  }
  return FORBIDDEN_SQLI_XSS_PATTERNS.some((regex) => regex.test(input));
}

export const CorridorSelectionSchema = z
  .object({
    corridor: z.enum(ALLOWED_CORRIDORS),
  })
  .strict();

export const InFlightBurstPayloadSchema = z
  .object({
    sequenceCount: z.number().int().min(1).max(64),
    burstTokens: z.number().int().min(512).max(1048576),
    sequencePrefix: z
      .string()
      .min(2)
      .max(24)
      .refine((val) => !containsForbiddenPattern(val), {
        message: "GridSync Security Gate: Forbidden SQLi, XSS, or restricted character detected",
      }),
  })
  .strict();

export const CustomSequenceInsertSchema = z
  .object({
    sequenceId: z.number().int().min(100).max(99999),
    tokenBudget: z.number().int().min(64).max(2048),
    targetSlotIndex: z.number().int().min(0).max(7),
    batchTag: z
      .string()
      .min(2)
      .max(24)
      .refine((val) => !containsForbiddenPattern(val), {
        message: "GridSync Security Gate: Payload rejected by Zero-Trust sanitizer",
      }),
  })
  .strict();

export type InFlightBurstPayload = z.infer<typeof InFlightBurstPayloadSchema>;
export type CustomSequenceInsertPayload = z.infer<typeof CustomSequenceInsertSchema>;

export interface SanitizationResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export function sanitizeBurstIngress(rawInput: unknown): SanitizationResult<InFlightBurstPayload> {
  const parsed = InFlightBurstPayloadSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      ok: false,
      error: firstIssue ? firstIssue.message : "Invalid burst payload",
    };
  }
  return { ok: true, data: parsed.data };
}

export function sanitizeSequenceIngress(rawInput: unknown): SanitizationResult<CustomSequenceInsertPayload> {
  const parsed = CustomSequenceInsertSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      ok: false,
      error: firstIssue ? firstIssue.message : "Invalid sequence insertion payload",
    };
  }
  return { ok: true, data: parsed.data };
}

export function verifyZeroDollarGate(serializedText: string): boolean {
  return serializedText.indexOf(String.fromCharCode(36)) === -1;
}
