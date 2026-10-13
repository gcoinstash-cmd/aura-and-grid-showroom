/**
 * Deterministic Telemetry Engine & Cryptographic HMAC Verification
 * Calibrated specifically for Lexus LC 500 Convertible (URZ100 Platform)
 */

export interface TelemetryState {
  speedMph: number;
  roofState: 'STOWED' | 'CLOSED';
  crosswindKt: number;
  cowlDamperForce: number; // 0 to 100%
  // Computed values
  harmonicFrequencyHz: number;
  cowlDeflectionUm: number;
  cabinDecibels: number;
  suppressionDeltaDb: number;
  torsionalStiffnessGainPct: number;
  hydraulicPressurePsi: number;
  currentNonce: number;
}

export interface LedgerRecord {
  nonce: number;
  recordedAt: string;
  speedMph: number;
  roofState: 'STOWED' | 'CLOSED';
  cowlDeflectionUm: number;
  cabinSplDb: number;
  damperForceN: number;
  harmonicFreqHz: number;
  prevHash: string;
  hmacSignature: string;
  status: 'VERIFIED' | 'QUARANTINED';
  tampered?: boolean;
}

// Compute aerodynamic and cowl damper response
export function computeAeroMetrics(
  speedMph: number,
  roofState: 'STOWED' | 'CLOSED',
  crosswindKt: number,
  damperForcePct: number
) {
  // Base structural frequency of LC 500 Convertible cowl:
  // With roof CLOSED: ~26.8 Hz
  // With roof STOWED: drops to ~19.4 Hz (torsional flex increases)
  const baseFreq = roofState === 'STOWED' ? 19.4 : 26.8;
  const speedHarmonicShift = (speedMph / 100) * 1.8;
  const harmonicFrequencyHz = +(baseFreq + speedHarmonicShift).toFixed(2);

  // Micro-deflection at cowl bulkhead (microns):
  // Closed roof: ~12-25 um. Stowed roof: 45-120 um without damping.
  // With active damper force (0-100%): up to 74% reduction.
  const rawDeflection = roofState === 'STOWED' 
    ? 28 + (speedMph * 0.45) + (crosswindKt * 0.6)
    : 10 + (speedMph * 0.15) + (crosswindKt * 0.25);
  
  const damperReductionFactor = 1 - (damperForcePct / 100) * 0.72;
  const cowlDeflectionUm = +(rawDeflection * damperReductionFactor).toFixed(2);

  // Cabin decibels (SPL):
  // Closed: ~64 dB at 60mph, ~72 dB at 100mph
  // Stowed roof: ~82 dB at 60mph, ~94 dB at 100mph without aero suppression
  const rawSpl = roofState === 'STOWED'
    ? 68 + (speedMph * 0.22) + (crosswindKt * 0.18)
    : 58 + (speedMph * 0.13) + (crosswindKt * 0.08);

  // Aero acoustic suppression (deflector + cowl boundary layer energized):
  const maxSuppression = roofState === 'STOWED' ? 14.2 : 6.5;
  const currentSuppression = +(maxSuppression * (damperForcePct / 100) * Math.min(1.2, speedMph / 55)).toFixed(1);
  const cabinDecibels = +(rawSpl - currentSuppression).toFixed(1);

  // Torsional rigidity gain from active cowl cross-brace damping
  const torsionalStiffnessGainPct = +(18.4 * (damperForcePct / 100)).toFixed(1);

  // Hydraulic pressure in cowl performance damper actuator
  const hydraulicPressurePsi = Math.round(450 + (damperForcePct / 100) * 1850 + speedMph * 4.2);

  return {
    harmonicFrequencyHz,
    cowlDeflectionUm,
    cabinDecibels,
    suppressionDeltaDb: currentSuppression,
    torsionalStiffnessGainPct,
    hydraulicPressurePsi,
  };
}

// Pseudo-HMAC-SHA256 simulation using Web Crypto API or fast deterministic fallback
export async function generateSha256(message: string): Promise<string> {
  try {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback deterministic hex string
    let hash = 0x811c9dc5;
    for (let i = 0; i < message.length; i++) {
      hash ^= message.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return Math.abs(hash).toString(16).padStart(16, '0') + 'c79f42b8e3a1059d68241b';
  }
}

// Initial verified ledger records
export const INITIAL_LEDGER_RECORDS: LedgerRecord[] = [
  {
    nonce: 1000042,
    recordedAt: '2026-10-12T02:44:48.102Z',
    speedMph: 85.0,
    roofState: 'STOWED',
    cowlDeflectionUm: 24.3,
    cabinSplDb: 74.8,
    damperForceN: 4850.0,
    harmonicFreqHz: 21.15,
    prevHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    hmacSignature: 'a89c72e45bf09931d5cb098ef11293a4087b22a910dc84bf8e937213ac991a02',
    status: 'VERIFIED',
  },
  {
    nonce: 1000041,
    recordedAt: '2026-10-12T02:44:47.102Z',
    speedMph: 84.5,
    roofState: 'STOWED',
    cowlDeflectionUm: 24.8,
    cabinSplDb: 74.9,
    damperForceN: 4800.0,
    harmonicFreqHz: 21.12,
    prevHash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    hmacSignature: '38a7c92bdf612809e6c1a8470bc55d91894b83017281f6c77bb32190eeac4951',
    status: 'VERIFIED',
  },
  {
    nonce: 1000040,
    recordedAt: '2026-10-12T02:44:46.102Z',
    speedMph: 82.0,
    roofState: 'STOWED',
    cowlDeflectionUm: 25.4,
    cabinSplDb: 75.2,
    damperForceN: 4720.0,
    harmonicFreqHz: 21.05,
    prevHash: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
    hmacSignature: '09a5b3f1c84918e7724a1b0288cd916c58902fa4319451da7782b194aa0891c3',
    status: 'VERIFIED',
  },
  {
    nonce: 1000039,
    recordedAt: '2026-10-12T02:44:45.102Z',
    speedMph: 78.5,
    roofState: 'STOWED',
    cowlDeflectionUm: 26.1,
    cabinSplDb: 75.8,
    damperForceN: 4500.0,
    harmonicFreqHz: 20.95,
    prevHash: 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
    hmacSignature: 'fc92a18843b0271649a1d95ec8912ba470e84b23199850dae66100234ac994b1',
    status: 'VERIFIED',
  },
  {
    nonce: 1000038,
    recordedAt: '2026-10-12T02:44:44.102Z',
    speedMph: 72.0,
    roofState: 'STOWED',
    cowlDeflectionUm: 27.5,
    cabinSplDb: 76.4,
    damperForceN: 4200.0,
    harmonicFreqHz: 20.80,
    prevHash: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
    hmacSignature: 'b119a4e8d3567129038fc99a632b7194ef40182650198aaef7892b4501cd9912',
    status: 'VERIFIED',
  },
];
