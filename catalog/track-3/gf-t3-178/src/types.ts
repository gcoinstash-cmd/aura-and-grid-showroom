export interface TelemetryState {
  engineRpm: number;
  engineHarmonicHz: number;
  primaryNoiseDb: number;
  antiPhaseAttenuationDb: number;
  residualCabinDb: number;
  targetBoostPsi: number;
  actualBoostPsi: number;
  wastegateDutyPercent: number;
  throttlePositionPercent: number;
  secondaryPathLatencyMs: number;
  filterConvergenceEpochs: number;
  isSimulating: boolean;
  isAntiPhaseActive: boolean;
  ledgerSequenceId: number;
  lastHmacHash: string;
}

export interface LedgerBlock {
  blockIndex: number;
  timestamp: string;
  partitionKey: string;
  engineRpm: number;
  acousticFreqHz: number;
  attenuationDb: number;
  boostPressurePsi: number;
  quarantineTriggered: boolean;
  previousHash: string;
  blockHash: string;
}

export type ActiveTab = 'fxlms' | 'postgres' | 'openapi' | 'cloudrun' | 'apa';
