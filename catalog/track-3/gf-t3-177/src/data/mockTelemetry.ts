import { TelemetryState, LedgerBlock, TestCaseResult, RearSteeringPhase } from '../types/telemetry';

export const INITIAL_TELEMETRY: TelemetryState = {
  speedKph: 84.5,
  steeringWheelAngleDeg: 28.0,
  lateralG: 0.38,
  engineRpm: 3650,
  engineLoadPct: 54.0,
  topStatus: 'STOWED',
  rearWheelAngleDeg: 0.52,
  phase: 'IN_PHASE',
  yawRateDegS: 14.8,
  targetYawRateDegS: 14.2,
  exhaustFlapDutyPct: 48.0,
  exhaustDecibels: 78.4,
  harmonicFreqHz: 243.3,
  loopFrequencyHz: 1000,
  loopJitterMs: 0.02,
  monotonicSeq: 1048576,
};

export function computeVehicleDynamics(
  speedKph: number,
  steeringWheelAngleDeg: number,
  lateralG: number,
  engineRpm: number,
  engineLoadPct: number,
  topStatus: 'STOWED' | 'DEPLOYED'
): Omit<TelemetryState, 'speedKph' | 'steeringWheelAngleDeg' | 'lateralG' | 'engineRpm' | 'engineLoadPct' | 'topStatus' | 'loopFrequencyHz' | 'loopJitterMs' | 'monotonicSeq'> {
  const steeringRatio = 13.6;
  const wheelbaseM = 2.870;
  const understeerGrad = 0.0022;
  const frontWheelAngleDeg = steeringWheelAngleDeg / steeringRatio;
  const speedMs = Math.max(0.1, speedKph / 3.6);

  // Target yaw rate
  const deltaFRad = (frontWheelAngleDeg * Math.PI) / 180;
  const denom = wheelbaseM + (understeerGrad * Math.pow(speedMs, 2));
  const targetYawRateRadS = (speedMs / denom) * deltaFRad;
  const targetYawRateDegS = (targetYawRateRadS * 180) / Math.PI;

  // Approximate actual yaw rate
  const approxYawRadS = (speedMs / wheelbaseM) * deltaFRad;
  const measuredYawRateDegS = (approxYawRadS * 180) / Math.PI + (lateralG * 2.5);

  // Phase calculation with 80 km/h threshold
  let phase: RearSteeringPhase = 'NEUTRAL';
  let rearSteerAngleDeg = 0.0;

  if (speedKph < 77.5) {
    phase = 'COUNTER_PHASE';
    // Opposes front wheel angle
    rearSteerAngleDeg = -1.0 * (frontWheelAngleDeg * 0.024) - ((measuredYawRateDegS - targetYawRateDegS) * 0.015);
  } else if (speedKph > 82.5) {
    phase = 'IN_PHASE';
    // Same direction as front wheel angle
    rearSteerAngleDeg = (frontWheelAngleDeg * 0.018) + (lateralG * 0.28);
  } else {
    phase = 'NEUTRAL';
    rearSteerAngleDeg = 0.0;
  }

  // Actuator physical clamping ±2.0 deg
  rearSteerAngleDeg = Math.max(-2.0, Math.min(2.0, rearSteerAngleDeg));

  // Acoustic dual exhaust calculation
  const v8Hz = (engineRpm / 60) * 4;
  let baseDuty = 0;
  if (engineRpm < 3200 && engineLoadPct < 45) {
    baseDuty = 0;
  } else if (engineRpm >= 4200 || engineLoadPct >= 70) {
    baseDuty = 100;
  } else {
    const rpmFactor = (engineRpm - 3200) / (4200 - 3200);
    const loadFactor = (engineLoadPct - 45) / (70 - 45);
    baseDuty = Math.max(0, Math.min(100, (rpmFactor * 0.6 + loadFactor * 0.4) * 100));
  }

  let finalDuty = baseDuty;
  let decibels = 66.0;
  if (topStatus === 'STOWED') {
    if (engineRpm > 2200) finalDuty = Math.min(100, baseDuty + 8);
    decibels = 72.0 + (finalDuty / 100) * 22.0;
  } else {
    decibels = 66.0 + (finalDuty / 100) * 20.0;
  }

  return {
    rearWheelAngleDeg: parseFloat(rearSteerAngleDeg.toFixed(3)),
    phase,
    yawRateDegS: parseFloat(measuredYawRateDegS.toFixed(2)),
    targetYawRateDegS: parseFloat(targetYawRateDegS.toFixed(2)),
    exhaustFlapDutyPct: parseFloat(finalDuty.toFixed(1)),
    exhaustDecibels: parseFloat(decibels.toFixed(1)),
    harmonicFreqHz: parseFloat(v8Hz.toFixed(1)),
  };
}

export const INITIAL_LEDGER_BLOCKS: LedgerBlock[] = [
  {
    blockIndex: 1048572,
    timestampUtc: '2026-10-11T18:07:58.120Z',
    speedKph: 68.4,
    rearSteerAngleDeg: -1.240,
    yawRateDegS: 18.2,
    lateralG: 0.52,
    exhaustFlapDutyPct: 15.0,
    prevHash: '4f72c3d1b99a80e45f9c09938b8d41ae7cf15c294191a20a4b77f804561b3e9a',
    blockHash: '7a911e389df0b2e35a16d8e5781a742858102fc233481230bb731cd9a2bc18e0',
    verified: true,
  },
  {
    blockIndex: 1048573,
    timestampUtc: '2026-10-11T18:07:59.120Z',
    speedKph: 79.1,
    rearSteerAngleDeg: -0.150,
    yawRateDegS: 15.6,
    lateralG: 0.44,
    exhaustFlapDutyPct: 28.5,
    prevHash: '7a911e389df0b2e35a16d8e5781a742858102fc233481230bb731cd9a2bc18e0',
    blockHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    verified: true,
  },
  {
    blockIndex: 1048574,
    timestampUtc: '2026-10-11T18:08:00.120Z',
    speedKph: 81.8,
    rearSteerAngleDeg: 0.320,
    yawRateDegS: 14.1,
    lateralG: 0.39,
    exhaustFlapDutyPct: 42.0,
    prevHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    blockHash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
    verified: true,
  },
  {
    blockIndex: 1048575,
    timestampUtc: '2026-10-11T18:08:01.120Z',
    speedKph: 83.2,
    rearSteerAngleDeg: 0.480,
    yawRateDegS: 14.4,
    lateralG: 0.38,
    exhaustFlapDutyPct: 46.5,
    prevHash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
    blockHash: '1a52e008d5196f7c9e196e8d2e43bc374a2fa373400a4ff0a3aa4621c97a8e2b',
    verified: true,
  },
  {
    blockIndex: 1048576,
    timestampUtc: '2026-10-11T18:08:02.120Z',
    speedKph: 84.5,
    rearSteerAngleDeg: 0.520,
    yawRateDegS: 14.8,
    lateralG: 0.38,
    exhaustFlapDutyPct: 48.0,
    prevHash: '1a52e008d5196f7c9e196e8d2e43bc374a2fa373400a4ff0a3aa4621c97a8e2b',
    blockHash: '8b94a28bb18d45e69e4f3a7638d21b3309a4714e8a4fe6480b85292c68e1462a',
    verified: true,
  },
];

export const INITIAL_TEST_CASES: TestCaseResult[] = [
  {
    id: 'test_1',
    name: 'test_counter_phase_sub_80kph',
    description: 'Validates negative rear wheel deflection below 80 km/h for low-speed agility',
    durationMs: 4.2,
    status: 'PASSED',
    assertion: 'output.phase == COUNTER_PHASE && output.rear_steer_angle_deg < 0.0',
  },
  {
    id: 'test_2',
    name: 'test_in_phase_sup_80kph',
    description: 'Validates positive rear wheel deflection above 80 km/h for lateral stability',
    durationMs: 3.8,
    status: 'PASSED',
    assertion: 'output.phase == IN_PHASE && output.rear_steer_angle_deg > 0.0',
  },
  {
    id: 'test_3',
    name: 'test_exhaust_bimodal_high_load_rpm',
    description: 'Validates 100% flap duty cycle above 4,200 RPM / 70% throttle load',
    durationMs: 2.9,
    status: 'PASSED',
    assertion: 'output.left_flap == 100.0 && output.acoustic_pressure_db >= 90.0',
  },
  {
    id: 'test_4',
    name: 'test_divergence_failsafe_quarantine',
    description: 'Quarantines illegal counter-phase requests at speeds exceeding 100 km/h',
    durationMs: 5.1,
    status: 'PASSED',
    assertion: 'record.is_quarantined == True && divergence_log.count == 1',
  },
  {
    id: 'test_5',
    name: 'test_convertible_top_acoustic_mapping',
    description: 'Verifies open-air acoustic resonance profile compensation when top stowed',
    durationMs: 3.4,
    status: 'PASSED',
    assertion: 'out_stowed.left_duty >= out_deployed.left_duty',
  },
  {
    id: 'test_6',
    name: 'test_latency_loop_under_1ms',
    description: 'Executes 5,000 real-time iterations ensuring average cycle time < 500us',
    durationMs: 34.6,
    status: 'PASSED',
    assertion: 'avg_latency_us = 340.2us < 500.0us SLA threshold',
  },
];
