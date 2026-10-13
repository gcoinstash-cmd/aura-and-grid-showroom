export type RearSteeringPhase = 'COUNTER_PHASE' | 'NEUTRAL' | 'IN_PHASE';

export interface TelemetryState {
  speedKph: number;
  steeringWheelAngleDeg: number;
  lateralG: number;
  engineRpm: number;
  engineLoadPct: number;
  topStatus: 'STOWED' | 'DEPLOYED'; // Convertible roof
  rearWheelAngleDeg: number;
  phase: RearSteeringPhase;
  yawRateDegS: number;
  targetYawRateDegS: number;
  exhaustFlapDutyPct: number;
  exhaustDecibels: number;
  harmonicFreqHz: number;
  loopFrequencyHz: number;
  loopJitterMs: number;
  monotonicSeq: number;
}

export interface LedgerBlock {
  blockIndex: number;
  timestampUtc: string;
  speedKph: number;
  rearSteerAngleDeg: number;
  yawRateDegS: number;
  lateralG: number;
  exhaustFlapDutyPct: number;
  prevHash: string;
  blockHash: string;
  verified: boolean;
}

export interface TestCaseResult {
  id: string;
  name: string;
  description: string;
  durationMs: number;
  status: 'PASSED' | 'FAILED' | 'RUNNING';
  assertion: string;
}
