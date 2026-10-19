/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface KinematicsState {
  vehicleSpeedMph: number;
  steeringWheelAngleDeg: number;
  lateralG: number;
  frictionCoeff: number;
  drivingMode: 'NORMAL' | 'SPORT_PLUS' | 'CUSTOM_TRACK';
  calculatedFrontSteerDeg: number;
  calculatedRearSteerDeg: number;
  rearSteerPhase: 'COUNTER_PHASE' | 'NEUTRAL' | 'IN_PHASE';
  turningRadiusMeters: number;
  turningRadiusReductionPct: number;
  dual_vector_torqueFrontPct: number;
  dual_vector_torqueRearPct: number;
  yawRateDegPerSec: number;
  sideSlipAngleBetaDeg: number;
}

export interface LedgerEntry {
  id: string;
  nonce: number;
  timestamp: string;
  speedMph: number;
  frontSteerDeg: number;
  rearSteerDeg: number;
  torqueSplit: string;
  payloadHash: string;
  previousHash: string;
  hmacSignature: string;
  quarantined: boolean;
  status: 'VALIDATED' | 'QUARANTINED';
  divergenceReason?: string;
}

export interface TestCaseResult {
  id: string;
  name: string;
  description: string;
  category: 'KINEMATICS' | 'FAILSAFE' | 'SECURITY' | 'LATENCY';
  status: 'PASS' | 'RUNNING' | 'FAIL' | 'IDLE';
  durationMs: number;
  assertions: number;
}
