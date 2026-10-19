/**
 * CHRONOS KINETIC-9: MagLev Telemetry & Vector Rig
 * Operational & Structural Type Definitions
 */

export type RunMode = 'STATIONARY_LEVITATION' | 'SUPERCONDUCTING_LAUNCH' | 'MAX_FLUX_SPRINT';

export interface BogieStatus {
  id: 'FL' | 'FR' | 'RL' | 'RR';
  label: string;
  gapMm: number; // Target: 15.0mm (nominal 14.2 - 15.8mm)
  targetGapMm: number;
  fluxTesla: number; // Magnetic flux density (T)
  status: 'nominal' | 'calibrating' | 'warning';
}

export interface CryoLoop {
  coilTempKelvin: number; // Target: 4.2K
  coolantPressureBar: number;
  heliumFlowRateLpm: number;
  superconductingState: boolean;
  purgeActive: boolean;
}

export interface StatorSector {
  sector: number;
  loadPercent: number; // 0 - 100%
  phaseDeg: number;
  frequencyHz: number;
  activePulse: boolean;
}

export interface CapacitorBank {
  id: 'A' | 'B';
  chargePercent: number;
  voltageKv: number;
  tempCelsius: number;
  regCaptureKw: number;
}

export interface TelemetryLog {
  id: string;
  timestamp: string;
  source: 'FLUX_CONTROLLER' | 'STATOR_SYNC' | 'CRYO_SYSTEM' | 'GUIDEWAY_SENSOR' | 'BRAKE_ACTUATOR';
  message: string;
  level: 'INFO' | 'WARN' | 'CRITICAL' | 'SUCCESS';
}

export interface VehicleTelemetry {
  velocityKmh: number;
  targetVelocityKmh: number;
  accelG: number;
  maxVelocityKmh: number;
  lateralDisplacementMm: number; // Center deviation (-5mm to +5mm)
  dampingResponsePercent: number;
  runMode: RunMode;
  linearBrakingEngaged: boolean;
  emergencyScram: boolean;
  suspensionStiffness: number; // N/mm (120 to 320)
  fluxBias: number; // % (-15% to +15%)
  bogies: BogieStatus[];
  cryo: CryoLoop;
  capacitorBanks: [CapacitorBank, CapacitorBank];
  sectors: StatorSector[];
  logs: TelemetryLog[];
}

export interface TradeDressDefense {
  noveltyPoints: string[];
  patentDeclarations: {
    system: string;
    claim: string;
    defenseRationale: string;
  }[];
  dealershipInventory: {
    assetName: string;
    chassisClass: string;
    demoLicensePrice: string;
    apatransferPrice: string;
    monopolyVaulttransfer: string;
    cleanRoomLicensing: string;
    specifications: Record<string, string>;
  };
}
