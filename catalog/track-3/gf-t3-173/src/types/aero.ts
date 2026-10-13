export interface AeroTelemetry {
  sequenceNonce: number;
  timestamp: string;
  speedKmh: number;
  speedMs: number;
  dynamicPressurePa: number;
  lateralG: number;
  longitudinalG: number;
  yawRateDegS: number;
  frontDownforceN: number;
  rearDownforceN: number;
  totalDownforceN: number;
  dragForceN: number;
  liftToDragRatio: number;
  frontAeroBalancePct: number;
  rearAeroBalancePct: number;
  leftFlapAoADeg: number;
  rightFlapAoADeg: number;
  airbrakeActive: boolean;
  drsActive: boolean;
  stateMode: 'NOMINAL_DOWNFORCE' | 'CORNERING_VECTORING' | 'HIGH_SPEED_STABILITY' | 'LOW_DRAG_DRS' | 'EMERGENCY_AIRBRAKE';
  previousHash: string;
  currentHash: string;
}

export interface PitotSensorReading {
  sensorId: string;
  location: string;
  pressurePa: number;
  localVelocityMs: number;
  relativeCp: number;
}

export interface SimulationPreset {
  id: string;
  name: string;
  trackContext: string;
  speedKmh: number;
  lateralG: number;
  longitudinalG: number;
  yawRateDegS: number;
}
