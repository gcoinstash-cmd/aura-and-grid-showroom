/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Heavy Overland Dynamics Platform RZ 450e Steer-by-Wire Precision Core (GF-T3-174)
 * Type Definitions & Architectural Constants
 */

export interface DualChannelTelemetry {
  channelAAngleDeg: number;
  channelBAngleDeg: number;
  divergenceDeltaDeg: number;
  syncRatioPercent: number;
  consensusStatus: 'NOMINAL_ASIL_D' | 'DEGRADED_FAIL_OP' | 'FAULT_LOCKDOWN';
  channelACrc32: string;
  channelBCrc32: string;
  frequencyHz: number;
  redundancyMode: 'LOCKSTEP_DUAL_CHANNEL';
}

export interface LatencyBreakdown {
  totalActuationLatencyMs: number;
  canFdIngestMs: number;
  lockstepArbitrationMs: number;
  kalmanFilterMs: number;
  actuatorPwmOutputMs: number;
  jitterVarianceMs: number;
  busStandard: 'CAN-FD 5Mbps / FlexRay 10Mbps';
}

export interface VehicleDynamicsState {
  yokeAngleDeg: number;          // -150° to +150° (One Motion Grip)
  vehicleSpeedKmh: number;       // 0 to 220 km/h
  effectiveGearRatio: number;    // 6.5:1 (park) to 14.8:1 (highway)
  roadWheelAngleDeg: number;     // calculated road wheel angle
  lateralAccelerationG: number;  // computed lateral G
  yawRateDegPerSec: number;      // computed yaw rate
  counterTorqueNm: number;       // active feedback torque
  surfaceTexture: 'asphalt' | 'cobblestone' | 'ice' | 'rumble';
}

export interface ActuationLedgerEntry {
  id: string;
  nonce: number;
  timestamp: string;
  channelA: number;
  channelB: number;
  divergence: number;
  hmacSignature: string;
  auditPass: boolean;
  status: 'COMMITTED' | 'VERIFIED';
}

export interface TestCaseResult {
  id: string;
  name: string;
  category: 'LATENCY' | 'REDUNDANCY' | 'KINEMATICS' | 'FAULT_TOLERANCE';
  assertion: string;
  durationMs: number;
  passed: boolean;
  outputLog: string;
}
