export interface SbwState {
  timestamp: string;
  nonce: number;
  vehicleSpeedKmh: number;
  yokeAngleDeg: number;       // -150 to +150
  rackAngleDeg: number;       // computed steering rack angle
  steeringRatio: number;      // 1:6 (low speed) to 1:18 (high speed)
  hapticFeedbackTorqueNm: number;
  roadFrictionCoeff: number;  // 0.2 (ice) to 1.0 (dry tarmac)
  lateralAccG: number;
  dual_vector_torqueFrontRatio: number;  // e.g. 75
  dual_vector_torqueRearRatio: number;   // e.g. 25
  frontMotorCurrentA: number;
  rearMotorCurrentA: number;
  canBusAHealthy: boolean;
  canBusBHealthy: boolean;
  activeCanBus: 'BUS_A' | 'BUS_B';
  failoverLatencyMicroseconds: number;
  hmacSignature: string;
}

export interface LedgerRecord {
  id: string;
  nonce: number;
  recordedAt: string;
  yokeAngle: number;
  rackAngle: number;
  divergenceDelta: number;
  pinionResistanceNm: number;
  dual_vector_torqueSplit: string; // "75:25"
  canBusState: string;
  hmacSignature: string;
  verified: boolean;
}

export type TabKey = 'sbw-core' | 'postgres-ledger' | 'openapi-contract' | 'cloudrun-harness' | 'apa-covenant';
