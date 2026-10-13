import { CalculatedTorque, PowertrainState } from '../types';

/**
 * Deterministic Powertrain & MPC Solver Simulation
 * Accurately models Lexus NX 450h+ F SPORT PHEV AWD Architecture
 * - A25A-FXS 2.5L Atkinson ICE: max 227 Nm, 136 kW (182 hp)
 * - 5NM Front PMSM: max 270 Nm, 134 kW (180 hp)
 * - 4NM Rear PMSM (E-Four): max 121 Nm, 40 kW (54 hp)
 * - Net combined peak output: 227 kW (304 hp)
 */
export function calculatePowertrainDynamics(state: PowertrainState): CalculatedTorque {
  const {
    throttlePercent,
    lateralG,
    stateOfCharge,
    driveMode,
    regenLevel,
    batteryTempC,
  } = state;

  // 1. Thermal Throttling Barrier Function
  // P_avail = 1 / (1 + exp((T - T_crit) / tau))
  const tCrit = 45.0;
  const tau = 2.0;
  let thermalThrottlingFactor = 1.0;
  if (batteryTempC > 38.0) {
    thermalThrottlingFactor = 1.0 / (1.0 + Math.exp((batteryTempC - tCrit) / tau));
    thermalThrottlingFactor = Math.max(0.25, Math.min(1.0, thermalThrottlingFactor));
  }

  // 2. SoC Power Limit
  let socPowerFactor = 1.0;
  if (stateOfCharge < 20.0) {
    socPowerFactor = Math.max(0.3, stateOfCharge / 20.0);
  }

  const electricFactor = thermalThrottlingFactor * socPowerFactor;

  // Max motor capacities
  const MAX_FRONT_NM = 270.0;
  const MAX_REAR_NM = 121.0;
  const MAX_ICE_NM = 227.0;

  let frontMotorTorqueNm = 0;
  let rearMotorTorqueNm = 0;
  let iceTorqueNm = 0;
  let fuelConsumptionLph = 0;

  const throttleRatio = throttlePercent / 100.0;

  // 3. Drive Mode Allocations
  switch (driveMode) {
    case 'EV':
      // Pure electric: ICE off, front + rear motors
      iceTorqueNm = 0;
      frontMotorTorqueNm = throttleRatio * MAX_FRONT_NM * electricFactor;
      // In EV mode, rear motor provides stability up to 40% of demand
      rearMotorTorqueNm = throttleRatio * MAX_REAR_NM * electricFactor * 0.8;
      fuelConsumptionLph = 0.0;
      break;

    case 'AUTO_EV_HEV':
      // EV prioritized under low demand; ICE starts on high pedal demand (> 65%)
      if (throttlePercent > 65 || stateOfCharge < 25) {
        iceTorqueNm = ((throttlePercent - 40) / 60) * MAX_ICE_NM * 0.85;
        frontMotorTorqueNm = throttleRatio * MAX_FRONT_NM * electricFactor * 0.9;
        rearMotorTorqueNm = throttleRatio * MAX_REAR_NM * electricFactor * 0.85;
        fuelConsumptionLph = (iceTorqueNm / MAX_ICE_NM) * 5.4;
      } else {
        iceTorqueNm = 0;
        frontMotorTorqueNm = throttleRatio * MAX_FRONT_NM * electricFactor;
        rearMotorTorqueNm = throttleRatio * MAX_REAR_NM * electricFactor * 0.7;
        fuelConsumptionLph = 0.0;
      }
      break;

    case 'HYBRID_HEV':
      // Balanced blended power: ICE provides cruise efficiency, motors assist
      iceTorqueNm = throttleRatio * MAX_ICE_NM * 0.92;
      frontMotorTorqueNm = throttleRatio * MAX_FRONT_NM * electricFactor * 0.85;
      rearMotorTorqueNm = throttleRatio * MAX_REAR_NM * electricFactor * 0.8;
      fuelConsumptionLph = (iceTorqueNm / MAX_ICE_NM) * 6.8;
      break;

    case 'SPORT_S_PLUS':
      // Maximum dynamic response: aggressive E-Four rear bias, instant torque fill
      iceTorqueNm = throttleRatio * MAX_ICE_NM;
      frontMotorTorqueNm = throttleRatio * MAX_FRONT_NM * electricFactor;
      // Elevated rear authority in Sport S+ (up to 100% of rear capacity)
      rearMotorTorqueNm = throttleRatio * MAX_REAR_NM * electricFactor;
      fuelConsumptionLph = (iceTorqueNm / MAX_ICE_NM) * 8.6;
      break;
  }

  // Regen Braking adjustment when throttle is 0 or low
  if (throttlePercent < 5) {
    const regenForce = regenLevel * 35.0; // Nm regen drag
    frontMotorTorqueNm = -regenForce * 0.65;
    rearMotorTorqueNm = -regenForce * 0.35;
    fuelConsumptionLph = 0.0;
  }

  // 4. E-Four Agile Yaw-Moment Torque Vectoring
  // Lateral G causes torque shift between left and right wheels
  // Positive lateral G = right turn (load shifts to left wheels)
  // Negative lateral G = left turn (load shifts to right wheels)
  const trackWidthM = 1.60;
  const wheelRadiusM = 0.36;
  const yawGain = driveMode === 'SPORT_S_PLUS' ? 1.6 : 1.0;
  const yawMomentNm = lateralG * 1200.0 * yawGain; // Target yaw moment
  const deltaTorqueNm = (yawMomentNm * wheelRadiusM) / trackWidthM;

  // Front e-axle split (open diff with brake-based torque vectoring)
  const frontTotal = frontMotorTorqueNm + (iceTorqueNm * 0.7);
  const frontLeftTorqueNm = Math.max(0, (frontTotal / 2) + (lateralG * 25));
  const frontRightTorqueNm = Math.max(0, (frontTotal / 2) - (lateralG * 25));

  // Rear E-Four direct motor vectoring (fine independent control)
  const rearLeftTorqueNm = Math.max(0, (rearMotorTorqueNm / 2) + (deltaTorqueNm * 0.5));
  const rearRightTorqueNm = Math.max(0, (rearMotorTorqueNm / 2) - (deltaTorqueNm * 0.5));

  // 5. Total System Power & C-Rate
  // Motor power: P = T * omega (assume nominal speed ~3500 RPM = 366.5 rad/s equivalent)
  const nominalRadS = 366.5;
  const motorElectricPowerKw = ((frontMotorTorqueNm + rearMotorTorqueNm) * nominalRadS) / 1000.0;
  const iceMechanicalPowerKw = (iceTorqueNm * nominalRadS) / 1000.0;
  
  // Lexus combined rated peak is 227 kW (304 hp)
  const rawKw = Math.max(0, motorElectricPowerKw + iceMechanicalPowerKw);
  const totalSystemPowerKw = Math.min(227.0, rawKw);
  const totalSystemPowerHp = totalSystemPowerKw * 1.34102;

  // Battery pack is 18.1 kWh. C-rate = Power in kW / 18.1 kWh
  const cRate = Math.max(0, (Math.abs(motorElectricPowerKw) / 18.1));

  // MPC Solve Time simulation (0.35 - 0.55 ms deterministic envelope)
  const mpcSolveTimeMs = Number((0.38 + (Math.abs(lateralG) * 0.08) + (throttlePercent * 0.0005)).toFixed(3));

  return {
    frontMotorTorqueNm: Number(frontMotorTorqueNm.toFixed(1)),
    rearMotorTorqueNm: Number(rearMotorTorqueNm.toFixed(1)),
    iceTorqueNm: Number(iceTorqueNm.toFixed(1)),
    frontLeftTorqueNm: Number(frontLeftTorqueNm.toFixed(1)),
    frontRightTorqueNm: Number(frontRightTorqueNm.toFixed(1)),
    rearLeftTorqueNm: Number(rearLeftTorqueNm.toFixed(1)),
    rearRightTorqueNm: Number(rearRightTorqueNm.toFixed(1)),
    totalSystemPowerKw: Number(totalSystemPowerKw.toFixed(1)),
    totalSystemPowerHp: Number(totalSystemPowerHp.toFixed(1)),
    fuelConsumptionLph: Number(fuelConsumptionLph.toFixed(2)),
    cRate: Number(cRate.toFixed(2)),
    mpcSolveTimeMs,
    thermalThrottlingFactor: Number(thermalThrottlingFactor.toFixed(2)),
    yawMomentNm: Number(yawMomentNm.toFixed(1)),
  };
}
