export interface TelemetryState {
  rpm: number;
  targetRpm: number;
  gear: number; // 0 = N, 1-6
  throttlePct: number;
  intakeHarmonicHz: number;
  titaniumValveHz: number;
  surgeTankDecibels: number;
  scavengePressureBar: number; // 3-stage dry sump
  oilTempC: number;
  coolantTempC: number;
  asgShiftDurationMs: number;
  asgHydraulicPressurePsi: number;
  isShifting: boolean;
  shiftForkPositionMm: number;
  telemetryNonce: number;
  hmacSignature: string;
  isRedlining: boolean;
  isRevving: boolean;
}

export interface AcousticHarmonicData {
  fundamentalFreq: number;
  secondHarmonic: number;
  thirdHarmonic: number;
  octaveResonance: number;
  yamahaAcousticDuctDecibels: number;
}

export interface LedgerBlock {
  blockHeight: number;
  timestamp: string;
  nonce: number;
  rpm: number;
  gear: number;
  oilPressureBar: number;
  throttlePct: number;
  prevHash: string;
  blockHash: string;
  signature: string;
  quarantineFlag: boolean;
}

export interface VerificationResult {
  verified: boolean;
  blockHeight: number;
  nonce: number;
  calculatedHash: string;
  expectedHash: string;
  hmacKey: string;
  algorithm: string;
  timestamp: string;
  statusMessage: string;
  cleanRoomAuditPass: boolean;
}
