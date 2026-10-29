/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GridSync API Architecture - Zero-Trust Ingress & Payload Sanitization Middleware
 * Scrubs routing vectors, corridor identifiers, and telemetry payloads against
 * SQL injection, XSS vectors, and schema pollution.
 */

import { z } from 'zod';

export const MOE_CORRIDORS = [
  'MOE-CORRIDOR-ALPHA (SWITCH-TRANSFORMER-TOP2-ROUTER · 12000-GB/S)',
  'MOE-CORRIDOR-BRAVO (EXPERT-PARALLELISM-LOAD-BALANCING)',
  'MOE-CORRIDOR-GAMMA (AUXILIARY-LOSS-EXPERT-COLLAPSE-PREVENTION)',
  'MOE-CORRIDOR-DELTA (FALLBACK-DENSE-FEED-FORWARD)',
] as const;

export type MoeCorridorId = (typeof MOE_CORRIDORS)[number];

const DANGEROUS_PATTERNS = [
  /<script\b[^>]*>/i,
  /<\/script>/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|EXEC|TRUNCATE)\b.*\b(FROM|INTO|TABLE|WHERE|ALL)\b)/i,
  /--\s/,
  /;\s*(DROP|DELETE|UPDATE|INSERT)/i,
  /__proto__/i,
  /constructor\s*\[/i,
  /prototype\s*\[/i,
];

export function containsMaliciousPattern(input: string): boolean {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(input)) {
      return true;
    }
  }
  return false;
}

export function scrubString(raw: string): string {
  return raw
    .replace(/[<>'"`;]/g, '')
    .replace(/--/g, '')
    .trim();
}

export const CorridorSchema = z.enum(MOE_CORRIDORS);

export const TokenVectorSchema = z
  .array(
    z
      .number()
      .finite()
      .min(-100.0, 'Token activation below numerical floor')
      .max(100.0, 'Token activation exceeds numerical ceiling')
  )
  .min(4, 'Token feature vector requires minimum 4 dimensions')
  .max(16, 'Token feature vector exceeds maximum 16 dimensions');

export const RoutingDispatchPayloadSchema = z
  .object({
    corridor: CorridorSchema,
    tokenBatchCount: z.number().int().min(64).max(65536),
    capacityFactor: z.number().min(1.0).max(2.5),
    auxiliaryLossAlpha: z.number().min(0.0001).max(0.1),
    featureVector: TokenVectorSchema,
    saturationSpikeActive: z.boolean(),
    operatorCallsign: z
      .string()
      .min(2)
      .max(64)
      .refine((val) => !containsMaliciousPattern(val), {
        message: 'GridSync Security Gate: Malicious SQLi/XSS signature detected in callsign',
      }),
  })
  .strict();

export type RoutingDispatchPayload = z.infer<typeof RoutingDispatchPayloadSchema>;

export interface GridSyncValidationResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  sanitizedTimestamp: string;
}

export function validateIngressPayload(
  rawPayload: unknown
): GridSyncValidationResult<RoutingDispatchPayload> {
  const timestamp = new Date().toISOString();

  if (typeof rawPayload !== 'object' || rawPayload === null || Array.isArray(rawPayload)) {
    return {
      ok: false,
      error: 'GridSync Security Gate: Payload must be a strict JSON object',
      sanitizedTimestamp: timestamp,
    };
  }

  const rawRecord = rawPayload as Record<string, unknown>;
  const rawKeys = Object.keys(rawRecord);
  for (const key of rawKeys) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return {
        ok: false,
        error: 'GridSync Security Gate: Prototype pollution attempt blocked',
        sanitizedTimestamp: timestamp,
      };
    }
  }

  const parsed = RoutingDispatchPayloadSchema.safeParse(rawPayload);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const issueMessage = firstIssue ? firstIssue.message : 'Schema validation failed';
    return {
      ok: false,
      error: 'GridSync Validation Fault: ' + issueMessage,
      sanitizedTimestamp: timestamp,
    };
  }

  return {
    ok: true,
    data: {
      ...parsed.data,
      operatorCallsign: scrubString(parsed.data.operatorCallsign),
    },
    sanitizedTimestamp: timestamp,
  };
}
