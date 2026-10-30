/**
 * Unit #361: Safe Number Precision Formatter (Sats / Decimals)
 * Track 1 (Lean Tuner) — Arbitrary Decimal BigInt Arithmetic
 */

export function toBaseUnits(decimalStr, decimals = 8) {
  const parts = String(decimalStr).trim().split('.');
  const whole = BigInt(parts[0] || '0');
  const fractionStr = (parts[1] || '').slice(0, decimals).padEnd(decimals, '0');
  const fraction = BigInt(fractionStr);
  const multiplier = 10n ** BigInt(decimals);
  return (whole * multiplier) + fraction;
}

export function fromBaseUnits(baseUnits, decimals = 8) {
  const b = BigInt(baseUnits);
  const divisor = 10n ** BigInt(decimals);
  const whole = b / divisor;
  const fraction = b % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');

  if (fractionStr.length === 0) return whole.toString();
  return `${whole}.${fractionStr}`;
}

export function formatCurrency(baseUnits, decimals = 8, symbol = '') {
  const dec = fromBaseUnits(baseUnits, decimals);
  return symbol ? `${symbol}${dec}` : dec;
}
