export interface EKFState {
  timeMs: number;
  // Position (meters in NED / Local Tangent Plane)
  px: number;
  py: number;
  pz: number;
  // Velocity (m/s)
  vx: number;
  vy: number;
  vz: number;
  // Euler angles (radians & deg)
  roll: number;
  pitch: number;
  yaw: number;
  // Sensor Biases
  b_ax: number;
  b_ay: number;
  b_az: number;
  b_gx: number;
  b_gy: number;
  b_gz: number;
  // Covariance matrix trace and condition number
  traceP: number;
  conditionNumber: number;
  // Innovation vector magnitude
  innovationNorm: number;
}

export interface SensorInput {
  // 9-DOF IMU
  ax: number; // m/s^2
  ay: number;
  az: number;
  gx: number; // deg/s or rad/s
  gy: number;
  gz: number;
  mx: number; // uT
  my: number;
  mz: number;
  // GPS RTK (20Hz)
  lat: number;
  lon: number;
  alt: number;
  gpsFix: 'RTK_FIXED' | 'RTK_FLOAT' | 'DGPS' | 'STANDALONE';
  gpsAccuracy: number; // meters (e.g. 0.014 m)
  // Wheel Speeds (km/h) & Rear Steering
  wheelSpeedFL: number;
  wheelSpeedFR: number;
  wheelSpeedRL: number;
  wheelSpeedRR: number;
  rearSteerAngleDeg: number; // Dynamic Rear Steering (DRS) +/- 4 deg
  // DIRECT4 AWD Torque Split
  frontTorquePct: number;
  rearTorquePct: number;
}

export interface LedgerBlock {
  height: number;
  timestamp: string;
  sensorPayload: {
    imu_tick: number;
    gps_time_utc: string;
    ekf_state_hash: string;
    wheel_speeds_rpm: [number, number, number, number];
    torque_distribution_nm: [number, number];
  };
  prevHash: string;
  hash: string;
  hmacSignature: string;
  merkleRoot: string;
  isTampered?: boolean;
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'WSS';
  path: string;
  description: string;
  requestPayload?: string;
  responsePayload: string;
  status: number;
}

export interface TestResult {
  id: string;
  name: string;
  file: string;
  durationMs: number;
  passed: boolean;
  assertions: number;
  coveragePct: number;
  log: string;
}

export interface ApaClause {
  section: string;
  title: string;
  valuation: string;
  summary: string;
  legalText: string;
  status: 'AUDITED' | 'ENFORCEABLE' | 'VERIFIED';
}
