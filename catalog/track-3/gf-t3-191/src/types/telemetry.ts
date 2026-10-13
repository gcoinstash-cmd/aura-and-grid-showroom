export interface TelemetryPacket {
  nonce: number;
  timestamp: string;
  speedKmh: number;
  decelerationG: number;
  pitchAngleDeg: number;
  conventionalPitchDeg: number;
  frontBrakeBar: number;
  rearBrakeBar: number;
  rearBiasPercent: number;
  partitionOpacityPercent: number;
  exteriorSplDb: number;
  cabinSplDb: number;
  splAttenuationDb: number;
  jerkGPerSec: number;
  hmacSignature: string;
  isQuarantined: boolean;
}

export interface LedgerBlock {
  blockId: number;
  nonce: number;
  timestamp: string;
  eventType: 'BRAKING_ARBITRATION' | 'ACOUSTIC_SEAL_VERIFIED' | 'JERK_QUARANTINE_TRIGGER' | 'CHASSIS_STABILIZATION';
  pitchAngleDeg: number;
  jerkGPerSec: number;
  rearBiasRatio: string;
  prevHash: string;
  hmacSignature: string;
  status: 'COMMITTED' | 'QUARANTINED' | 'AUDITED';
  tampered?: boolean;
}

export interface PyTestCase {
  id: string;
  name: string;
  description: string;
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED';
  durationMs: number;
  assertion: string;
  log: string;
}
