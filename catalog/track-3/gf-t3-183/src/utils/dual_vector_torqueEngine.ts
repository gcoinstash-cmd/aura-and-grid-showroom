import { PowertrainState, LedgerBlock } from '../types/telemetry';
import { computeHmacSha256, computeSha256 } from './crypto';

// Physical constants of Apex Executive RZ 450e DualVectorTorque
export const MOTOR_SPECS = {
  FRONT_MAX_POWER_KW: 150,
  FRONT_MAX_TORQUE_NM: 266.3,
  FRONT_MAX_RPM: 13000,
  REAR_MAX_POWER_KW: 80,
  REAR_MAX_TORQUE_NM: 168.5,
  REAR_MAX_RPM: 13000,
  TOTAL_MAX_POWER_KW: 230,
  TOTAL_MAX_TORQUE_NM: 434.8,
  GEAR_RATIO: 10.28,
  TIRE_RADIUS_M: 0.364,
  BATTERY_NOMINAL_V: 355.2,
  BATTERY_CAPACITY_KWH: 71.4,
  MAX_STEER_YOKE_DEG: 150,
  MAX_ROAD_WHEEL_DEG: 35,
};

/**
 * Computes steer-by-wire variable steering gear ratio based on vehicle speed.
 * Low speed: fast ratio ~4.5:1 (full wheel cut with slight yoke angle).
 * High speed: stable ratio ~12.5:1 (relaxed, lane stability).
 */
export function calculateVariableSteeringRatio(speedKmh: number): number {
  if (speedKmh <= 15) {
    return 4.5 + (speedKmh / 15) * 1.5; // 4.5 to 6.0:1
  } else if (speedKmh <= 60) {
    const norm = (speedKmh - 15) / 45;
    return 6.0 + norm * 3.5; // 6.0 to 9.5:1
  } else if (speedKmh <= 120) {
    const norm = (speedKmh - 60) / 60;
    return 9.5 + norm * 2.5; // 9.5 to 12.0:1
  } else {
    const norm = Math.min(1.0, (speedKmh - 120) / 60);
    return 12.0 + norm * 0.8; // capped around 12.8:1
  }
}

/**
 * Calculates road wheel steering angle from yoke input angle and speed.
 */
export function calculateRoadWheelAngle(yokeAngleDeg: number, speedKmh: number): number {
  const ratio = calculateVariableSteeringRatio(speedKmh);
  const roadWheelAngle = yokeAngleDeg / ratio;
  // Clamp to physical rack limit of 35 degrees
  return Math.max(-MOTOR_SPECS.MAX_ROAD_WHEEL_DEG, Math.min(MOTOR_SPECS.MAX_ROAD_WHEEL_DEG, roadWheelAngle));
}

/**
 * Calculates DualVectorTorque front/rear torque distribution percentage.
 * Under acceleration, cornering, and braking.
 */
export function calculateDualVectorTorqueBias(
  speedKmh: number,
  throttleDemand: number,
  yokeAngleDeg: number,
  roadFrictionMu: number
): { frontPercent: number; rearPercent: number; mode: string } {
  const absYoke = Math.abs(yokeAngleDeg);
  const isBraking = throttleDemand < 0;

  if (isBraking) {
    // Regenerative braking: front weight transfer demands 80:20 or 75:25
    return { frontPercent: 78, rearPercent: 22, mode: 'REGEN_DECEL_BIAS' };
  }

  if (speedKmh < 10 && throttleDemand > 40) {
    // Standstill Launch: 60:40 or 50:50 to lock rear traction without spin
    return { frontPercent: 55, rearPercent: 45, mode: 'LAUNCH_TRACTION_LOCK' };
  }

  if (absYoke > 30) {
    // Cornering active
    if (throttleDemand > 45) {
      // Corner exit under throttle: rear-biased 20:80 to 40:60 for agile exit
      const rearBias = Math.min(80, 50 + (throttleDemand / 100) * 30);
      return { frontPercent: 100 - rearBias, rearPercent: rearBias, mode: 'CORNER_EXIT_VECTORING' };
    } else {
      // Corner entry / apex: 50:50 or 60:40 neutral balance
      return { frontPercent: 55, rearPercent: 45, mode: 'YAW_NEUTRAL_BALANCE' };
    }
  }

  if (speedKmh > 80 && absYoke <= 15) {
    // Steady cruising: 70:30 front-bias for maximum motor efficiency
    return { frontPercent: 70, rearPercent: 30, mode: 'CRUISE_EFFICIENCY' };
  }

  // Low friction icy compensation
  if (roadFrictionMu < 0.4) {
    return { frontPercent: 50, rearPercent: 50, mode: 'LOW_MU_TRACTION_EQUAL' };
  }

  // Standard dynamic balance
  return { frontPercent: 60, rearPercent: 40, mode: 'DYNAMIC_DUAL_VECTOR_TORQUE_NOMINAL' };
}

/**
 * Calculates Inverter Field-Oriented Control (FOC) current vectors and flux weakening.
 */
export function calculateFocVector(
  torqueNm: number,
  rpm: number,
  maxTorqueNm: number,
  dcBusV: number
): {
  idFluxA: number;
  iqTorqueA: number;
  fluxWeakeningActive: boolean;
  modulationIndex: number;
} {
  const baseSpeedRpm = 6200; // Knee point where back-EMF hits limit
  const torqueFraction = Math.max(0, Math.min(1.0, Math.abs(torqueNm) / maxTorqueNm));
  const baseIq = torqueFraction * 240; // Max Iq around 240A

  if (rpm > baseSpeedRpm) {
    // Flux weakening zone: inject negative Id demagnetizing current
    const excessRpm = rpm - baseSpeedRpm;
    const fluxWeakeningRatio = Math.min(1.0, excessRpm / (MOTOR_SPECS.FRONT_MAX_RPM - baseSpeedRpm));
    const idFluxA = -(fluxWeakeningRatio * 145); // Negative demagnetizing d-axis
    // Max current circle constraint: I_total = sqrt(Id^2 + Iq^2) <= 260A
    const maxIqAllowed = Math.sqrt(Math.max(0, 260 * 260 - idFluxA * idFluxA));
    const iqTorqueA = Math.min(baseIq, maxIqAllowed);
    const modulationIndex = Math.min(1.15, 0.85 + (rpm / MOTOR_SPECS.FRONT_MAX_RPM) * 0.28);
    return { idFluxA, iqTorqueA, fluxWeakeningActive: true, modulationIndex };
  } else {
    // MTPA (Maximum Torque Per Ampere) mode
    const idFluxA = -12 * torqueFraction; // Small d-axis current for reluctance torque
    const iqTorqueA = baseIq;
    const modulationIndex = (rpm / baseSpeedRpm) * 0.82;
    return { idFluxA, iqTorqueA, fluxWeakeningActive: false, modulationIndex };
  }
}

/**
 * Master step simulator returning full vehicle powertrain state.
 */
export async function simulateStep(
  current: PowertrainState,
  inputs: {
    speedKmh?: number;
    throttleDemand?: number;
    yokeAngleDeg?: number;
    roadFrictionMu?: number;
  }
): Promise<PowertrainState> {
  const speedKmh = inputs.speedKmh !== undefined ? inputs.speedKmh : current.speedKmh;
  const throttleDemand = inputs.throttleDemand !== undefined ? inputs.throttleDemand : current.throttleDemand;
  const yokeAngleDeg = inputs.yokeAngleDeg !== undefined ? inputs.yokeAngleDeg : current.yokeAngleDeg;
  const roadFrictionMu = inputs.roadFrictionMu !== undefined ? inputs.roadFrictionMu : current.roadFrictionMu;

  const steeringRatio = calculateVariableSteeringRatio(speedKmh);
  const roadWheelAngleDeg = calculateRoadWheelAngle(yokeAngleDeg, speedKmh);
  const { frontPercent, rearPercent } = calculateDualVectorTorqueBias(speedKmh, throttleDemand, yokeAngleDeg, roadFrictionMu);

  // Calculate motor RPMs from speed
  const wheelRpm = (speedKmh * 1000) / 60 / (2 * Math.PI * MOTOR_SPECS.TIRE_RADIUS_M);
  const motorRpm = Math.min(MOTOR_SPECS.FRONT_MAX_RPM, Math.round(wheelRpm * MOTOR_SPECS.GEAR_RATIO));

  // Power and Torque calculations
  const totalDemand = Math.abs(throttleDemand) / 100;
  const isRegen = throttleDemand < 0;

  const maxTotalNm = isRegen ? MOTOR_SPECS.TOTAL_MAX_TORQUE_NM * 0.65 : MOTOR_SPECS.TOTAL_MAX_TORQUE_NM;
  const requestedTotalNm = totalDemand * maxTotalNm;

  const frontTorqueNm = (requestedTotalNm * (frontPercent / 100)) * (isRegen ? -1 : 1);
  const rearTorqueNm = (requestedTotalNm * (rearPercent / 100)) * (isRegen ? -1 : 1);

  const frontPowerKw = (Math.abs(frontTorqueNm) * motorRpm * 2 * Math.PI) / 60 / 1000;
  const rearPowerKw = (Math.abs(rearTorqueNm) * motorRpm * 2 * Math.PI) / 60 / 1000;

  // Inverter FOC vector calculations
  const frontFoc = calculateFocVector(frontTorqueNm, motorRpm, MOTOR_SPECS.FRONT_MAX_TORQUE_NM, 355.2);

  // Electrical bus
  const totalKw = (frontPowerKw + rearPowerKw) * (isRegen ? -0.92 : 1.08); // Inverter efficiency
  const dcBusVoltage = Math.max(310, Math.min(390, MOTOR_SPECS.BATTERY_NOMINAL_V - (totalKw / 300) * 12));
  const packCurrentA = (totalKw * 1000) / dcBusVoltage;
  const cellDeltaMv = 8 + (Math.abs(packCurrentA) / 400) * 14 + (current.monotonicNonce % 3);

  // Inverter thermal modeling
  const frontInverterTempC = 42.0 + (frontPowerKw / MOTOR_SPECS.FRONT_MAX_POWER_KW) * 31.5;
  const rearInverterTempC = 40.5 + (rearPowerKw / MOTOR_SPECS.REAR_MAX_POWER_KW) * 28.0;

  const nextNonce = current.monotonicNonce + 1;

  // Compute HMAC signature for this telemetry slice
  const payloadToSign = `${nextNonce}:${speedKmh.toFixed(1)}:${frontTorqueNm.toFixed(1)}:${rearTorqueNm.toFixed(1)}:${yokeAngleDeg}:${dcBusVoltage.toFixed(1)}`;
  const hmacSignature = await computeHmacSha256('Apex Executive-RZ450E-DUAL_VECTOR_TORQUE-HMAC-SECRET-PROD-2026', payloadToSign);

  return {
    speedKmh,
    throttleDemand,
    yokeAngleDeg,
    roadFrictionMu,
    frontTorqueNm: Math.round(frontTorqueNm * 10) / 10,
    rearTorqueNm: Math.round(rearTorqueNm * 10) / 10,
    frontPowerKw: Math.round(frontPowerKw * 10) / 10,
    rearPowerKw: Math.round(rearPowerKw * 10) / 10,
    frontRpm: motorRpm,
    rearRpm: motorRpm,
    frontInverterTempC: Math.round(frontInverterTempC * 10) / 10,
    rearInverterTempC: Math.round(rearInverterTempC * 10) / 10,
    dual_vector_torqueSplitFront: frontPercent,
    dual_vector_torqueSplitRear: rearPercent,
    steeringRatio: Math.round(steeringRatio * 10) / 10,
    roadWheelAngleDeg: Math.round(roadWheelAngleDeg * 10) / 10,
    fluxWeakeningActive: frontFoc.fluxWeakeningActive,
    idFluxA: Math.round(frontFoc.idFluxA * 10) / 10,
    iqTorqueA: Math.round(frontFoc.iqTorqueA * 10) / 10,
    dcBusVoltage: Math.round(dcBusVoltage * 10) / 10,
    packCurrentA: Math.round(packCurrentA * 10) / 10,
    batterySoc: current.batterySoc,
    batteryCellDeltaMv: Math.round(cellDeltaMv * 10) / 10,
    focFrequencyHz: 2500,
    monotonicNonce: nextNonce,
    hmacSignature,
  };
}

/**
 * Generate seed ledger blocks with real SHA-256 and HMAC
 */
export async function generateInitialLedgerBlocks(): Promise<LedgerBlock[]> {
  const blocks: LedgerBlock[] = [];
  let prevHash = '0000000000000000000000000000000000000000000000000000000000000000';

  const baseNonce = 1000180;
  const sampleData = [
    { torqueF: 154.2, torqueR: 102.8, yoke: 0, ratio: 9.8, tempDiv: 1.5, quarantined: false },
    { torqueF: 168.0, torqueR: 124.5, yoke: -18, ratio: 8.4, tempDiv: 2.1, quarantined: false },
    { torqueF: 80.5, torqueR: 145.2, yoke: -65, ratio: 5.6, tempDiv: 3.4, quarantined: false },
    { torqueF: 45.0, torqueR: 162.0, yoke: -85, ratio: 4.8, tempDiv: 3.8, quarantined: false },
    { torqueF: -185.0, torqueR: -52.0, yoke: -12, ratio: 7.2, tempDiv: 2.9, quarantined: false },
    { torqueF: 120.0, torqueR: 110.0, yoke: 5, ratio: 11.4, tempDiv: 1.8, quarantined: false },
  ];

  for (let i = 0; i < sampleData.length; i++) {
    const item = sampleData[i];
    const nonce = baseNonce + i;
    const timestamp = new Date(Date.now() - (sampleData.length - i) * 800).toISOString();
    const rawContent = `${i + 1}:${timestamp}:${nonce}:${item.torqueF}:${item.torqueR}:${item.yoke}:${item.ratio}:${item.tempDiv}:${prevHash}`;
    const blockHash = await computeSha256(rawContent);
    const hmacDigest = await computeHmacSha256('Apex Executive-RZ450E-DUAL_VECTOR_TORQUE-HMAC-SECRET-PROD-2026', blockHash);

    blocks.push({
      blockHeight: i + 1,
      timestamp,
      nonce,
      frontTorqueNm: item.torqueF,
      rearTorqueNm: item.torqueR,
      yokeAngle: item.yoke,
      steeringRatio: item.ratio,
      thermalDivergenceC: item.tempDiv,
      quarantined: item.quarantined,
      prevHash,
      blockHash,
      hmacDigest,
    });

    prevHash = blockHash;
  }

  return blocks;
}
