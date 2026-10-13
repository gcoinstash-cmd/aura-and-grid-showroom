export interface TelemetryFrame {
  nonce: number;
  timestamp: string;
  roadSurface: 'dry_asphalt' | 'wet_tarmac' | 'packed_snow' | 'black_ice';
  frictionCoeff: number; // mu: 0.9, 0.6, 0.3, 0.15
  throttlePercent: number; // 0 - 100%
  vehicleSpeedKmh: number; // 0 - 180 km/h
  steeringAngleDeg: number; // -45 to +45 deg
  iceRpm: number; // M20A-FXS: 0 or 1000 - 6000 RPM
  mg1Rpm: number; // Sun gear: -10000 to +10000 RPM
  mg2Rpm: number; // Ring gear / drive: 0 to 14000 RPM
  rearInverterCurrentA: number; // 0 to 125 A
  rearMotorTorqueNm: number; // 0 to 84 Nm (instant e-Axle)
  frontTorquePercent: number; // 20% to 100%
  rearTorquePercent: number; // 0% to 80%
  batterySocPercent: number; // 40% to 80%
  batteryVoltageV: number; // ~222V nominal
  cellVoltageSpreadMv: number; // max - min (nominal 12-28mV, threshold >45mV)
  quarantineTriggered: boolean;
  prevBlockHash: string;
  currentBlockHash: string;
  hmacSignature: string;
}

export interface LedgerBlock {
  id: number;
  nonce: number;
  timestamp: string;
  cellSpreadMv: number;
  rearTorqueNm: number;
  torqueSplit: string;
  status: 'NOMINAL' | 'QUARANTINE_ALERT' | 'CHAIN_TAMPERED';
  prevHash: string;
  blockHash: string;
  hmac: string;
  tampered?: boolean;
}
