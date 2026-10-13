export type CrawlSpeedMode = 'OFF' | 'LO' | 'MED_LO' | 'MED' | 'MED_HI' | 'HI';

export type TransferCaseMode = '4H' | '4L';

export type TerrainMode = 'AUTO' | 'DIRT' | 'SAND' | 'MUD' | 'DEEP_SNOW' | 'ROCK';

export interface EkdssValveState {
  frontAccumulatorValve: 'OPEN' | 'CLOSED';
  rearAccumulatorValve: 'OPEN' | 'CLOSED';
  frontPressureMpa: number;
  rearPressureMpa: number;
  differentialPressureMpa: number;
  rollStiffnessNmPerDeg: number;
  mode: 'DISCONNECTED_ARTICULATING' | 'CONNECTED_STABILIZED' | 'FAILSAFE_LOCKED';
}

export interface WheelStrokeTelemetry {
  frontLeftMm: number;
  frontRightMm: number;
  rearLeftMm: number;
  rearRightMm: number;
  crossAxleArticulationIndexMm: number;
  contactForceN: {
    fl: number;
    fr: number;
    rl: number;
    rr: number;
  };
}

export interface CrawlControlState {
  enabled: boolean;
  targetSpeedMph: number;
  currentSpeedMph: number;
  brakeDutyCyclePercent: {
    fl: number;
    fr: number;
    rl: number;
    rr: number;
  };
  throttleOpeningPercent: number;
  brakeRotorTempC: number;
  pitchDeg: number;
  rollDeg: number;
}

export interface TelemetryBlock {
  nonce: number;
  timestamp: string;
  speedMph: number;
  articulationAngleDeg: number;
  frontPressureMpa: number;
  rearPressureMpa: number;
  frontValve: 'OPEN' | 'CLOSED';
  rearValve: 'OPEN' | 'CLOSED';
  crawlMode: CrawlSpeedMode;
  transferCase: TransferCaseMode;
  rearDiffLocked: boolean;
  rollStiffness: number;
  tampered?: boolean;
  prevHash: string;
  blockHash: string;
}
