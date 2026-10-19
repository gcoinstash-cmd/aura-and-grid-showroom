export interface PowertrainState {
  speedKmh: number;
  throttleDemand: number; // -100 to 100%
  yokeAngleDeg: number; // -150 to +150 deg
  roadFrictionMu: number; // 0.1 to 1.0
  frontTorqueNm: number;
  rearTorqueNm: number;
  frontPowerKw: number;
  rearPowerKw: number;
  frontRpm: number;
  rearRpm: number;
  frontInverterTempC: number;
  rearInverterTempC: number;
  dual_vector_torqueSplitFront: number; // e.g. 60
  dual_vector_torqueSplitRear: number; // e.g. 40
  steeringRatio: number; // e.g. 4.5:1 to 12.0:1
  roadWheelAngleDeg: number; // -35 to +35 deg
  fluxWeakeningActive: boolean;
  idFluxA: number; // d-axis demagnetizing current
  iqTorqueA: number; // q-axis torque current
  dcBusVoltage: number; // V
  packCurrentA: number; // A
  batterySoc: number; // %
  batteryCellDeltaMv: number; // mV delta across 96s
  focFrequencyHz: number; // 2500 Hz
  monotonicNonce: number;
  hmacSignature: string;
}

export interface LedgerBlock {
  blockHeight: number;
  timestamp: string;
  nonce: number;
  frontTorqueNm: number;
  rearTorqueNm: number;
  yokeAngle: number;
  steeringRatio: number;
  thermalDivergenceC: number;
  quarantined: boolean;
  prevHash: string;
  blockHash: string;
  hmacDigest: string;
}

export interface TestCaseResult {
  id: string;
  name: string;
  module: string;
  status: 'passed' | 'running' | 'failed';
  executionTimeMs: number;
  assertions: number;
  description: string;
  logOutput: string;
}
