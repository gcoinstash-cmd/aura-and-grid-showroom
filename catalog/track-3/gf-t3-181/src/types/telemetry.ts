export type DriveMode = 'ECO' | 'NORMAL' | 'SPORT' | 'SPORT_PLUS';

export interface TelemetryState {
  pedalPct: number; // 0 - 100
  rpm: number; // 1000 - 7300
  driveMode: DriveMode;
  throttleValveAnglePct: number; // calculated non-linear
  engineTorqueLbFt: number; // calculated
  enginePowerHp: number; // calculated
  diffOilTempC: number; // calculated based on load & duration
  kinematicViscosityCSt: number; // SAE 75W-85 model
  torqueBiasRatio: number; // TBR 2.8:1 nominal
  leftWheelRpm: number;
  rightWheelRpm: number;
  wheelSlipDelta: number;
  nonce: number;
  hash: string;
  isSimulating: boolean;
}

export interface LedgerBlock {
  blockNumber: number;
  timestamp: string;
  nonce: number;
  pedalPct: number;
  throttleAnglePct: number;
  rpm: number;
  diffTempC: number;
  viscosityCSt: number;
  prevHash: string;
  blockHmac: string;
  isQuarantined?: boolean;
}

export interface TestCaseResult {
  id: string;
  name: string;
  module: string;
  status: 'passed' | 'failed' | 'running' | 'idle';
  durationMs: number;
  assertion: string;
  detail: string;
}
