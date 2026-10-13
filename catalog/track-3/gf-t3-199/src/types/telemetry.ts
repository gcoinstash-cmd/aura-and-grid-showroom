export type DriveMode = 'NORMAL' | 'SPORT' | 'CUSTOM' | 'TRAIL';

export type CorneringPhase = 'STRAIGHT' | 'TURN_IN' | 'APEX' | 'ACCEL_EXIT' | 'TRAIL_BRAKE';

export interface TelemetryState {
  speedMph: number;
  throttlePercent: number;
  brakePercent: number;
  steeringAngleDeg: number;
  yawRateDegPerSec: number;
  lateralG: number;
  longitudinalG: number;
  driveMode: DriveMode;
  corneringPhase: CorneringPhase;
  frontTorqueSplit: number; // e.g. 70 means 70%
  rearTorqueSplit: number;  // e.g. 30 means 30%
  drsAngleDeg: number;      // -4.0 to +4.0 degrees
  inverterFreqHz: number;
  frontMotorKw: number;
  engineHp: number;
  rearEaxleKw: number;
  bipolarBatteryTempC: number;
  batterySocPercent: number;
  nonce: number;
  ledgerHmac: string;
}

export interface LedgerBlock {
  blockHeight: number;
  timestamp: string;
  inverterTorqueNm: number;
  drsToeDeg: number;
  bipolarGradientDeltaC: number;
  hmacSignature: string;
  status: 'VERIFIED' | 'TAMPER_DETECTED' | 'QUARANTINE_LOCKED';
}
