export type DriveMode = 'NORMAL' | 'SPORT_S' | 'SPORT_S_PLUS' | 'EV' | 'AUTO_EV_HEV';

export interface DamperCornerState {
  corner: 'FL' | 'FR' | 'RL' | 'RR';
  solenoidCurrentMa: number; // 200mA - 1800mA
  forceStep: number; // 1 to 650
  dampingCoefficientNs: number; // 1200 - 6800 Ns/m
  strokeVelocityMmS: number; // mm/s
  hydraulicPressureBar: number; // 12.0 - 45.0 bar
  sealStatus: 'NOMINAL' | 'DIVERGENT' | 'QUARANTINE';
}

export interface TelemetryFrame {
  nonce: number;
  timestamp: string;
  speedMph: number;
  rollAngleDeg: number;
  pitchVelocityDegS: number;
  verticalAccelG: number;
  lateralAccelG: number;
  driveMode: DriveMode;
  dampers: {
    FL: DamperCornerState;
    FR: DamperCornerState;
    RL: DamperCornerState;
    RR: DamperCornerState;
  };
  phev: {
    batterySocPercent: number; // 0 - 100%
    batteryPackVoltageV: number; // ~355V
    regenPowerKw: number; // 0 - 62 kW
    brakeBlendingRatio: number; // 0.0 - 1.0 (regen vs friction)
    predictiveDecelActive: boolean;
  };
  blockHash: string;
  previousHash: string;
}

export interface LedgerBlock {
  blockNumber: number;
  nonce: number;
  timestamp: string;
  event: string;
  solenoidAvgStep: number;
  regenKw: number;
  sealIntegrity: '100% NOMINAL' | 'FAULT_DETECTED';
  previousHash: string;
  merkleRoot: string;
  signatureHmac: string;
  verified: boolean;
}
