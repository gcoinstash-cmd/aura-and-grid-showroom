export type DriveMode = 'LATENCY_ARBITRAGE' | 'CROSS_EXCHANGE' | 'QUANTUM_SUPERPOSITION' | 'SLIPSTREAM_WARP';

export type CameraPreset = 'SHOWROOM_3D' | 'CORE_MACRO' | 'SUSPENSION_DIFFUSER' | 'COCKPIT_HUD' | 'AERO_WIND_TUNNEL';

export interface QuantumCoreTelemetry {
  coherenceRate: number; // e.g., 99.984%
  qubitsActive: number; // 512
  cryoTempMK: number; // 12.4 mK
  photonFluxTHz: number; // 420.8 THz
  hamiltonianEigenvalue: number; // 4.892 eV
  phaseDriftPs: number; // 0.12 picoseconds
  laserEmeraldOutputW: number; // 48.5 W
  laserGoldOutputW: number; // 36.2 W
}

export interface ArbitrageVector {
  route: string;
  sourceVenue: string;
  targetVenue: string;
  distanceKm: number;
  fiberLatencyNs: number;
  quantumChronoLatencyNs: number;
  deltaGainNs: number;
  projectedAlphaBps: number;
  annualizedYieldUsd: number;
  status: 'OPTIMAL' | 'CONVERGING' | 'EXECUTING';
}

export interface AeroMechanicalTelemetry {
  downforceKgf: number;
  dragCoefficientCd: number;
  diffuserAngleDeg: number;
  frontSplitterSuctionHPa: number;
  pushrodStrainFrontKn: number;
  pushrodStrainRearKn: number;
  rideHeightMm: number;
  speedKmh: number;
  groundEffectVenturiLoadKgf: number;
}

export interface TelemetryState {
  timestamp: string;
  microsecondTime: number;
  driveMode: DriveMode;
  quantum: QuantumCoreTelemetry;
  aero: AeroMechanicalTelemetry;
  arbitrageRoutes: ArbitrageVector[];
  accumulatedAlphaUsd: number;
  systemHealth: number; // 100%
  coolingPumpActive: boolean;
  conduitLaserFreqHz: number;
}

export interface DealershipTier {
  id: 'demo' | 'standard' | 'monopoly';
  name: string;
  tagline: string;
  unitIndex: number;
  priceFormatted: string;
  licenseType: string;
  leadTime: string;
  features: string[];
  deliverables: string[];
  legalStatus: string;
  recommendedFor: string;
}
