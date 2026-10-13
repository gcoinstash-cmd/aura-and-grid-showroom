export interface CellData {
  id: number;
  voltage: number; // e.g. 3.702 V
  temperature: number; // e.g. 28.4 C
  internalResistance: number; // mOhm
  balancing: boolean;
  status: 'nominal' | 'warning' | 'quarantined';
}

export interface TelemetryFrame {
  sequenceId: number;
  timestamp: string;
  packVoltage: number; // V
  packCurrent: number; // A (negative = regen charging, positive = discharge)
  soc: number; // State of Charge %
  soh: number; // State of Health %
  regenPowerKw: number; // kW
  speedKmh: number; // km/h
  decelerationMps2: number; // m/s^2
  regenSplitRatio: number; // % (e.g. 91.8%)
  avgCellTemp: number; // C
  maxDeltaV: number; // mV
  hmacSignature: string;
  prevHash: string;
}

export interface LedgerBlock {
  blockHeight: number;
  sequenceId: number;
  timestamp: string;
  prevHash: string;
  currHash: string;
  payloadDigest: string;
  metrics: {
    soc: number;
    soh: number;
    packVoltage: number;
    regenKwh: number;
    anomalousCells: number;
  };
  verified: boolean;
}

export interface TestCaseResult {
  id: string;
  name: string;
  category: 'SOC_ALGO' | 'REGEN_BLEND' | 'THERMAL' | 'LEDGER_HMAC' | 'SAFETY';
  status: 'passed' | 'running' | 'pending';
  executionTimeMs: number;
  assertion: string;
}
