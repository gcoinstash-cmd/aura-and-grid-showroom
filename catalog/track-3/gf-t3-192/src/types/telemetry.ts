export type DrsPhaseMode = 'ANTI_PHASE_TURNING' | 'IN_PHASE_STABILIZATION' | 'NEUTRAL_ZERO_OFFSET' | 'CRAB_LANE_CHANGE';

export type DualVectorTorqueMode = 'AUTO_VECTORING' | 'SPORT_DYNAMIC' | 'TRAIL_SNOW' | 'ECO_HIGHWAY';

export interface DrsPhysicsState {
  vehicleSpeedKmh: number;
  steeringWheelDeg: number;
  frontWheelAngleDeg: number;
  rearWheelAngleDeg: number;
  phaseMode: DrsPhaseMode;
  dual_vector_torqueFrontRatio: number;
  dual_vector_torqueRearRatio: number;
  lateralAccelG: number;
  yawRateDegSec: number;
  turningRadiusMeters: number;
  curbRadiusDeltaMeters: number;
  rackDisplacementMm: number;
  bldcPhaseCurrentAmps: number;
  canCycleTimeUs: number;
  isStallProtected: boolean;
}

export interface TelemetryLedgerRow {
  nonce: number;
  timestamp: string;
  speedKmh: number;
  pinionAngleDeg: number;
  rearToeTargetDeg: number;
  rearToeActualDeg: number;
  divergenceMm: number;
  frontRearSplit: string;
  status: 'NOMINAL' | 'QUARANTINED' | 'SYNCED';
  prevHmac: string;
  currentHmac: string;
}

export interface ApiTestResult {
  endpoint: string;
  method: string;
  status: number;
  statusText: string;
  latencyMs: number;
  headers: Record<string, string>;
  responseBody: unknown;
}
