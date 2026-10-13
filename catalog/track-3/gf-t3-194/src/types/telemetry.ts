export type CornerId = 'FL' | 'FR' | 'RL' | 'RR';

export interface CornerTelemetry {
  id: CornerId;
  label: string;
  position: 'Front Left' | 'Front Right' | 'Rear Left' | 'Rear Right';
  pressureBar: number;
  heightMm: number;
  targetMm: number;
  flowRateLpm: number;
  gasChamberBar: number;
  valveState: 'IDLE' | 'CHARGING' | 'DISCHARGING' | 'RESTRICTED';
  springRateNmm: number;
}

export type HeightLevel = 'LOW' | 'NORMAL' | 'HIGH_1' | 'HIGH_2' | 'EXTRA_HIGH';

export interface HeightSpec {
  level: HeightLevel;
  label: string;
  offsetMm: number;
  description: string;
  maxSpeedKmh: number;
}

export type DriveMode = 'COMFORT' | 'NORMAL' | 'SPORT_S' | 'SPORT_S_PLUS' | 'CUSTOM';

export type MtsMode = 'AUTO' | 'DIRT' | 'SAND' | 'MUD' | 'DEEP_SNOW' | 'ROCK';

export interface MtsSpec {
  mode: MtsMode;
  label: string;
  surface: string;
  dampingMultiplier: number;
  throttleMapping: string;
  accumRatio: number;
  description: string;
}

export interface HydraulicState {
  frequencyHz: number;
  linePressureBar: number;
  maxSafetyBar: number;
  pumpDutyCycle: number;
  pumpTempC: number;
  fluidReservoirLevelPct: number;
  reliefValveActive: boolean;
  aeroLoweringActive: boolean;
  speedKmh: number;
  rollDeg: number;
  pitchDeg: number;
  corners: Record<CornerId, CornerTelemetry>;
  driveMode: DriveMode;
  mtsMode: MtsMode;
  heightLevel: HeightLevel;
  totalStrokeCapacityMm: number;
}

export interface LedgerBlock {
  blockIndex: number;
  timestamp: string;
  prevHash: string;
  hash: string;
  nonce: number;
  cornerPressures: Record<CornerId, number>;
  heightLevel: HeightLevel;
  mtsMode: MtsMode;
  pumpTempC: number;
  hmacSignature: string;
  quarantined: boolean;
  tampered?: boolean;
}

export type TabKey = 'ahc' | 'ledger' | 'openapi' | 'cloudrun' | 'apa';
