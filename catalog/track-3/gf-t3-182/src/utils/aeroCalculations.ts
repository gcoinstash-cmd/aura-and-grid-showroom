import { AeroTelemetry, PitotSensorReading } from '../types/aero';

// Air density at standard sea level (15°C, 1013.25 hPa)
export const RHO_AIR = 1.225; // kg/m^3
export const REF_FRONTAL_AREA = 2.12; // m^2 (Apex Executive RC F Track Edition)
export const MAX_DOWNFORCE_REF_250_KMH = 3850; // N

// Simple SHA-256 implementation using Web Crypto API or fast fallback for telemetry chains
export async function computeSha256Hex(message: string): Promise<string> {
  try {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Deterministic fallback for environments without crypto.subtle
    let hash = 0x811c9dc5;
    for (let i = 0; i < message.length; i++) {
      hash ^= message.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(64, 'a');
  }
}

export function computeAeroState(
  speedKmh: number,
  lateralG: number,
  longitudinalG: number,
  yawRateDegS: number,
  sequenceNonce: number,
  previousHash: string
): Omit<AeroTelemetry, 'currentHash'> {
  const speedMs = (speedKmh * 1000) / 3600;
  // Dynamic pressure q = 0.5 * rho * v^2
  const dynamicPressurePa = 0.5 * RHO_AIR * Math.pow(speedMs, 2);

  let stateMode: AeroTelemetry['stateMode'] = 'NOMINAL_DOWNFORCE';
  let leftFlapAoADeg = 10.5; // Base high-downforce angle
  let rightFlapAoADeg = 10.5;
  let airbrakeActive = false;
  let drsActive = false;

  // Active Aerodynamic Control State Machine Logic
  if (longitudinalG <= -0.75 && speedKmh >= 100) {
    // Airbrake Deployment Mode
    stateMode = 'EMERGENCY_AIRBRAKE';
    leftFlapAoADeg = 35.0;
    rightFlapAoADeg = 35.0;
    airbrakeActive = true;
  } else if (speedKmh > 180 && longitudinalG >= 0.05 && Math.abs(lateralG) < 0.3) {
    // DRS / Low Drag Cruise
    stateMode = 'LOW_DRAG_DRS';
    leftFlapAoADeg = -3.5;
    rightFlapAoADeg = -3.5;
    drsActive = true;
  } else if (Math.abs(lateralG) > 0.45 || Math.abs(yawRateDegS) > 8.0) {
    // Cornering Torque Vectoring Mode (Differential Flap Deflection)
    stateMode = 'CORNERING_VECTORING';
    const yawDelta = Math.max(-14, Math.min(14, yawRateDegS * 0.35 + lateralG * 6.5));
    // Asymmetric aerodynamic trimming
    leftFlapAoADeg = Math.max(0, Math.min(28, 12.0 + yawDelta));
    rightFlapAoADeg = Math.max(0, Math.min(28, 12.0 - yawDelta));
  } else if (speedKmh > 220) {
    // High Speed Stability Trim
    stateMode = 'HIGH_SPEED_STABILITY';
    leftFlapAoADeg = 14.0;
    rightFlapAoADeg = 14.0;
  }

  // Aerodynamic Coefficients based on wing angles and vehicle configuration
  const avgFlapAoA = (leftFlapAoADeg + rightFlapAoADeg) / 2;
  
  // Base downforce coefficient Cl = Cl_base + dCl/dAlpha * flap_aoa
  // Calibrated so at 250 km/h (v=69.44 m/s, q ~ 2953.5 Pa), total downforce hits ~3,850 N
  const clFront = 0.28 + (speedKmh > 160 ? 0.04 : 0.0);
  const clRear = 0.38 + (avgFlapAoA / 35.0) * 0.44;
  const totalCl = clFront + clRear;

  // Actual Downforce in Newtons: Fz = q * Cl * A
  // Scale factor adjusted to match Apex Executive RC F Track Edition wind tunnel specs
  const velocityRatio250 = Math.pow(speedKmh / 250, 2);
  const totalDownforceN = Math.round(velocityRatio250 * MAX_DOWNFORCE_REF_250_KMH * (totalCl / 0.82));
  
  // Front / Rear Distribution
  const frontRatio = clFront / totalCl;
  const frontDownforceN = Math.round(totalDownforceN * frontRatio);
  const rearDownforceN = totalDownforceN - frontDownforceN;

  const frontAeroBalancePct = Math.round((frontDownforceN / (totalDownforceN || 1)) * 100);
  const rearAeroBalancePct = 100 - frontAeroBalancePct;

  // Drag calculation: Cd = Cd_0 + induced drag
  const cdBase = 0.34;
  const cdInduced = 0.05 + (avgFlapAoA / 35.0) * (airbrakeActive ? 0.38 : 0.12);
  const totalCd = cdBase + cdInduced;
  const dragForceN = Math.round(dynamicPressurePa * totalCd * REF_FRONTAL_AREA);

  const liftToDragRatio = Number((totalDownforceN / (dragForceN || 1)).toFixed(2));

  return {
    sequenceNonce,
    timestamp: new Date().toISOString(),
    speedKmh,
    speedMs: Number(speedMs.toFixed(1)),
    dynamicPressurePa: Math.round(dynamicPressurePa),
    lateralG: Number(lateralG.toFixed(2)),
    longitudinalG: Number(longitudinalG.toFixed(2)),
    yawRateDegS: Number(yawRateDegS.toFixed(1)),
    frontDownforceN,
    rearDownforceN,
    totalDownforceN,
    dragForceN,
    liftToDragRatio,
    frontAeroBalancePct,
    rearAeroBalancePct,
    leftFlapAoADeg: Number(leftFlapAoADeg.toFixed(1)),
    rightFlapAoADeg: Number(rightFlapAoADeg.toFixed(1)),
    airbrakeActive,
    drsActive,
    stateMode,
    previousHash
  };
}

export function generatePitotReadings(speedKmh: number, dynamicPressurePa: number): PitotSensorReading[] {
  const speedMs = (speedKmh * 1000) / 3600;
  return [
    {
      sensorId: 'PITOT-FL-01',
      location: 'Front Splitter Carbon Port',
      pressurePa: Math.round(dynamicPressurePa * 1.08),
      localVelocityMs: Number((speedMs * 1.04).toFixed(1)),
      relativeCp: 1.08
    },
    {
      sensorId: 'PITOT-FR-02',
      location: 'Front Splitter Carbon Starboard',
      pressurePa: Math.round(dynamicPressurePa * 1.07),
      localVelocityMs: Number((speedMs * 1.03).toFixed(1)),
      relativeCp: 1.07
    },
    {
      sensorId: 'PITOT-UB-03',
      location: 'Underbody Venturi Throat Lead',
      pressurePa: Math.round(dynamicPressurePa * -0.62),
      localVelocityMs: Number((speedMs * 1.28).toFixed(1)),
      relativeCp: -0.62
    },
    {
      sensorId: 'PITOT-UB-04',
      location: 'Underbody Venturi Diffuser Exit',
      pressurePa: Math.round(dynamicPressurePa * -0.25),
      localVelocityMs: Number((speedMs * 1.12).toFixed(1)),
      relativeCp: -0.25
    },
    {
      sensorId: 'PITOT-RW-05',
      location: 'Swan-Neck Left Wing Suction Face',
      pressurePa: Math.round(dynamicPressurePa * -0.95),
      localVelocityMs: Number((speedMs * 1.35).toFixed(1)),
      relativeCp: -0.95
    },
    {
      sensorId: 'PITOT-RW-06',
      location: 'Swan-Neck Right Wing Suction Face',
      pressurePa: Math.round(dynamicPressurePa * -0.94),
      localVelocityMs: Number((speedMs * 1.34).toFixed(1)),
      relativeCp: -0.94
    },
    {
      sensorId: 'PITOT-CN-07',
      location: 'Front Bumper Dual Dive Canards',
      pressurePa: Math.round(dynamicPressurePa * 0.45),
      localVelocityMs: Number((speedMs * 0.92).toFixed(1)),
      relativeCp: 0.45
    },
    {
      sensorId: 'PITOT-ST-08',
      location: 'Rear Carbon Decklid Stagnation Zone',
      pressurePa: Math.round(dynamicPressurePa * 0.88),
      localVelocityMs: Number((speedMs * 0.85).toFixed(1)),
      relativeCp: 0.88
    }
  ];
}
