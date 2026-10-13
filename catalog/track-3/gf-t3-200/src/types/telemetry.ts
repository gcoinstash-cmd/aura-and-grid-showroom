export interface WheelTorque {
  fl: number; // Front Left (Nm)
  fr: number; // Front Right (Nm)
  rl: number; // Rear Left (Nm)
  rr: number; // Rear Right (Nm)
}

export interface WheelSlip {
  fl: number; // Slip ratio %
  fr: number;
  rl: number;
  rr: number;
}

export interface WheelRpm {
  fl: number;
  fr: number;
  rl: number;
  rr: number;
}

export interface VehicleDynamics {
  speedMph: number;
  steeringAngleDeg: number; // -45 to +45
  throttlePct: number; // 0 to 100
  lateralG: number; // -1.5 to +1.5
  yawRateDegPerSec: number;
  totalTorqueNm: number;
  totalPowerKw: number;
  virtualGear: number; // 1-8 or 0 (Direct Drive)
  launchControlActive: boolean;
  surfaceFrictionMu: number; // 1.0 = Dry, 0.6 = Wet, 0.15 = Ice
  regenerativeYawMomentNm: number;
}

export interface BatteryCell {
  id: number;
  quadrant: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  voltageV: number; // 3.2V to 4.2V nominal
  impedanceMOhm: number; // 1.1 to 1.8 mOhm nominal, > 4.5 is anomaly
  tempC: number; // 24 to 38 C
  quarantined: boolean;
}

export interface LedgerBlock {
  blockHeight: number;
  timestamp: string;
  nonce: number;
  telemetryHash: string;
  previousHash: string;
  signatureHmac: string;
  verified: boolean;
  event: string;
}

export interface TestCaseResult {
  id: string;
  name: string;
  description: string;
  durationMs: number;
  passed: boolean;
  assertionsCount: number;
  category: 'vectoring' | 'thermal' | 'failover' | 'cryptography';
}
