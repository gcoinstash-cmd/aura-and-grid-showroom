/**
 * Unit #382: Precision Math Interpolation, Clamp & Scale Unit
 * Track 1 (Lean Tuner) — Telemetry Math & Normalization Primitives
 */

export function clamp(val, min, max) {
  if (min > max) [min, max] = [max, min];
  return Math.max(min, Math.min(max, val));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function inverseLerp(a, b, val, shouldClamp = false) {
  if (a === b) return 0;
  const t = (val - a) / (b - a);
  return shouldClamp ? clamp(t, 0, 1) : t;
}

export function mapRange(val, inMin, inMax, outMin, outMax, shouldClamp = false) {
  const t = inverseLerp(inMin, inMax, val, shouldClamp);
  const result = lerp(outMin, outMax, t);
  return shouldClamp ? clamp(result, Math.min(outMin, outMax), Math.max(outMin, outMax)) : result;
}

export function smoothstep(min, max, val) {
  const x = clamp((val - min) / (max - min), 0, 1);
  return x * x * (3 - 2 * x);
}
