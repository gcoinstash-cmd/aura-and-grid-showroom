/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ConsensusPhase = 'PROPOSE' | 'PRE-PREPARE' | 'PREPARE' | 'COMMIT' | 'DECIDE';

export interface SwarmNode {
  id: string;
  name: string;
  role: 'Leader Proposer' | 'Steer-by-Wire Node' | 'Front eAxle Node' | 'Rear eAxle Node';
  ip: string;
  publicKey: string;
  status: 'ONLINE' | 'BYZANTINE' | 'OFFLINE';
  latencyMs: number;
  lastVote: 'ACCEPTED' | 'REJECTED' | 'EQUIVOCATION' | 'PENDING';
  signatureVerified: boolean;
}

export interface Direct4Telemetry {
  speedKmh: number;
  throttlePct: number;
  steeringAngleDeg: number;
  yawRateDegS: number;
  lateralG: number;
  frontTorquePct: number;
  rearTorquePct: number;
  frontPowerKw: number;
  rearPowerKw: number;
  torqueVectorMode: 'CRUISE_EFFICIENCY' | 'TURN_IN_TRACTION' | 'APEX_STABILITY' | 'EXIT_LAUNCH';
}

export interface EpochRecord {
  epochNumber: number;
  timestampIso: string;
  proposerId: string;
  proposerNode: string;
  blockHash: string;
  merkleRoot: string;
  txCount: number;
  frontRearSplit: string;
  commitLatencyMs: number;
  quorumSignatures: string[];
  status: 'COMMITTED_FINAL' | 'QUARANTINED';
  leafHashes: {
    telemetry: string;
    direct4Vector: string;
    steerByWire: string;
    quorumSignatures: string;
  };
}

export interface PyTestResult {
  testName: string;
  durationMs: number;
  status: 'PASSED' | 'FAILED' | 'RUNNING';
  description: string;
}
