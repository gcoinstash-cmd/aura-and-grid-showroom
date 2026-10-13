export interface WheelArticulationState {
  frontLeft: number;  // inches: -12.0 to +12.5 (24.5 in travel)
  frontRight: number;
  rearLeft: number;
  rearRight: number;
}

export interface EkdssValveState {
  frontAccumulatorPressureMpa: number; // 0 - 20 MPa
  rearAccumulatorPressureMpa: number;
  frontStabilizerDecoupled: boolean;
  rearStabilizerDecoupled: boolean;
  hydraulicLockActive: boolean;
  rollStiffnessNmPerRad: number; // 12,000 to 45,000 Nm/rad
  valveCycleLatencyMs: number;
}

export interface DifferentialLockState {
  torsenTorqueSplit: { front: number; rear: number }; // e.g. { front: 40, rear: 60 }
  centerLockerEngaged: boolean;
  rearElectronicLockerEngaged: boolean;
  crawlControlMph: number;
  wheelSlipDetected: boolean;
}

export interface TerrainTelemetryFrame {
  sequenceId: number;
  timestamp: string;
  pitchDeg: number;
  rollDeg: number;
  yawRateDegPerSec: number;
  roughnessIndex: number; // 0.0 (smooth highway) to 1.0 (extreme rock crawl)
  speedKph: number;
  wheelTravel: WheelArticulationState;
  valveState: EkdssValveState;
  diffState: DifferentialLockState;
  blockHashSha256: string;
  hmacSignature: string;
}

export interface LedgerBlock {
  blockHeight: number;
  recordedAt: string;
  partitionName: string;
  pitchDeg: number;
  rollDeg: number;
  articulationInches: number;
  torsenSplit: string;
  rearDiffLocked: boolean;
  prevHash: string;
  blockHash: string;
  hmacSha256: string;
  quarantined: boolean;
}

export interface TestResultItem {
  id: string;
  name: string;
  category: 'SUSPENSION' | 'HYDRAULIC_FAILOVER' | 'DIFF_LOCK' | 'LEDGER_HMAC' | 'CRAWL_CONTROL';
  durationMs: number;
  status: 'PASSED' | 'FAILED';
  details: string;
}
