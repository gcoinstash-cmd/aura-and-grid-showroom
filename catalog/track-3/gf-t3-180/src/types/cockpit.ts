export type RideHeightMode = 'LOW' | 'NORMAL' | 'COMFORT' | 'SPORT_PLUS' | 'HIGH1' | 'HIGH2' | 'ROCK';

export interface CornerTelemetry {
  corner: 'FL' | 'FR' | 'RL' | 'RR';
  name: string;
  pressurePsi: number; // typical 1100 - 2400 PSI
  heightDeltaMm: number; // -30mm to +70mm
  heightDeltaIn: number;
  dampingStep: number; // 1 to 16
  dampingForceN: number;
  nitrogenPrechargeMpa: number;
  valveDutyPercent: number;
  status: 'OPTIMAL' | 'COMPENSATING' | 'QUARANTINE';
}

export interface TurboTelemetry {
  rpm: number;
  boostPsi: number;
  targetBoostPsi: number;
  wastegateDutyPercent: number;
  chargeAirTempC: number;
  airflowCfm: number;
  exhaustGasTempC: number;
  surgeRisk: 'NONE' | 'LOW' | 'DETECTED';
}

export interface ChassisAttitude {
  rollDeg: number;
  pitchDeg: number;
  yawRateDegS: number;
  hydraulicCrossFlowLMin: number;
  chassisGroundClearanceIn: number;
  dampingMode: string;
}

export interface LedgerBlock {
  blockNumber: number;
  timestamp: string;
  nonce: number;
  flPressurePsi: number;
  frPressurePsi: number;
  rlPressurePsi: number;
  rrPressurePsi: number;
  meanDeltaMm: number;
  previousHash: string;
  blockHash: string;
  hmacSignature: string;
  isQuarantined: boolean;
  quarantineReason?: string;
}

export interface TelemetryMetrics {
  ahcLoopHz: number;
  jitterMs: number;
  flowRateLMin: number;
  currentHeightIn: number;
  currentMode: RideHeightMode;
  monotonicNonce: number;
  hashVerified: boolean;
  cleanRoomScore: number;
}
