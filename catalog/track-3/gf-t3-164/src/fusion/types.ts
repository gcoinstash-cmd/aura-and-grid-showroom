/**
 * GF-T3-164 NeuroDrive Sensory Fusion — Type Definitions
 * Ghost FactoryOS Track 3 F1 Skunkworks Engine
 */

export type TrackStatus = 'TENTATIVE' | 'CONFIRMED' | 'COASTED' | 'DELETED';

export type SensorModality = 'LIDAR_3D' | 'RADAR_DOPPLER' | 'CAMERA_OPTICAL_FLOW';

export interface Measurement {
  sensorId: string;
  modality: SensorModality;
  timestampNs: number;
  data: number[]; // LiDAR: [x,y,z,l,w,h], Radar: [r,az,el,doppler], Camera: [u,v,inv_d,udot,vdot]
  covarianceDiag: number[];
  confidence: number;
}

export interface FusedTrack {
  trackId: string;
  status: TrackStatus;
  x: number[]; // [px, py, pz, v, psi, psi_dot, a, l, w, h, z_dot] (11 elements)
  P_diag: number[]; // diagonal variance
  position: [number, number, number];
  velocityMps: number;
  velocityKmh: number;
  yawRad: number;
  yawRateRads: number;
  accelerationMps2: number;
  dimensions: [number, number, number]; // [l, w, h]
  hits: number;
  misses: number;
  totalUpdates: number;
  lastTimestampNs: number;
  history: [number, number, number][];
  sensorSources: {
    lidar: boolean;
    radar: boolean;
    camera: boolean;
  };
  mahalanobisDistance: number;
}

export interface LFATelemetry {
  speedKmh: number;
  rpm: number;
  gear: number;
  steeringAngleRad: number;
  lateralG: number;
  longitudinalG: number;
  throttlePct: number;
  brakePct: number;
  redlineAlert: boolean;
}

export interface FusionCycleStats {
  cycleTimeMs: number;
  sub3msMet: boolean;
  activeTracksCount: number;
  confirmedTracksCount: number;
  tentativeTracksCount: number;
  oosmReconciledCount: number;
  totalMeasurements: number;
  ptpJitterNs: number;
  ptpLock: boolean;
}

export interface TestResultItem {
  id: string;
  name: string;
  category: string;
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED';
  durationMs: number;
  details: string;
  proofMetrics?: Record<string, any>;
}
