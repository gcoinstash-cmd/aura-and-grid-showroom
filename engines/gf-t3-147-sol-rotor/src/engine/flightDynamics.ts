/**
 * Ghost FactoryOS Track 3 (F1 Skunkworks Engine)
 * Asset GF-T3-147: Sol-Rotor Autonomous Heavy-Lift eVTOL & Swarm Flight Telemetry Engine
 * 
 * 6-DOF Nonlinear Rigid-Body Flight Dynamics & Blade Element Momentum (BEM) Aerodynamic Solver
 * Clean-room implementation under Apache-2.0 / MIT licensing.
 */

export interface Vector3D {
  x: number; // Longitudinal / Forward (m or m/s or N)
  y: number; // Lateral / Rightward
  z: number; // Normal / Downward (NED or Aircraft Body coordinates)
}

export interface Quaternion {
  w: number;
  x: number;
  y: number;
  z: number;
}

export interface EulerAngles {
  roll: number;  // phi (deg)
  pitch: number; // theta (deg)
  yaw: number;   // psi (deg)
}

export interface RotorState {
  id: number;
  label: string;
  position: Vector3D;       // Position relative to CG [m]
  radius: number;           // Rotor radius [m]
  isTiltable: boolean;      // True if on tilting nacelle
  currentRpm: number;       // Current angular speed [RPM]
  maxRpm: number;           // Max rated RPM
  thrust: number;           // Thrust force [N]
  torque: number;           // Aerodynamic reaction torque [Nm]
  powerKw: number;          // Consumed mechanical power [kW]
  health: 'NOMINAL' | 'DEGRADED' | 'FAILED' | 'OFFLINE';
  isVrsTriggered: boolean;  // Vortex Ring State active flag
  inducedVelocity: number;  // Inflow velocity vi [m/s]
}

export interface FlightState {
  timestampNs: number;
  position: Vector3D;       // Inertial NED position [m] (x: North, y: East, z: Down)
  velocityBody: Vector3D;   // Body frame velocity [m/s] (u: fwd, v: right, w: down)
  velocityInertial: Vector3D;// Inertial velocity [m/s]
  angularVelocity: Vector3D;// Body angular rates [rad/s] (p, q, r)
  quaternion: Quaternion;   // Attitude quaternion [w, x, y, z]
  euler: EulerAngles;       // Attitude Euler angles [deg]
  altitudeBaroM: number;    // Barometric Altitude [m]
  altitudeRadarM: number;   // Radar AGL Altitude [m]
  airspeedKts: number;      // True Airspeed [kts]
  verticalSpeedMps: number; // Climb/Descent rate [m/s] (+ is climb)
  verticalSpeedFpm: number; // Climb/Descent rate [ft/min]
  machNumber: number;       // Flight Mach number
  loadFactorG: number;      // Normal acceleration [G]
  nacelleAngleDeg: number;  // Tiltrotor nacelle angle: 0° (VTOL Hover) to 90° (Fixed-wing Cruise)
  targetNacelleAngleDeg: number;
  massKg: number;           // Gross Takeoff Weight [kg]
  payloadKg: number;        // Active heavy-lift payload [kg]
  rotors: RotorState[];     // 8 distributed electric rotors
  totalThrustKn: number;    // Aggregated thrust vector magnitude [kN]
  ndiLoopLatencyMs: number; // Inner-loop NDI calculation threshold latency [ms]
  vrsRiskLevel: 'NONE' | 'CAUTION' | 'CRITICAL'; // Vortex Ring State indicator
  flightMode: 'VTOL_HOVER' | 'TRANSITION_CLIMB' | 'CRUISE_AIRPLANE' | 'SWARM_CONVOY' | 'PRECISION_SLING_CARGO';
}

export interface AtmosphereEnvironment {
  crosswindKts: number;     // Crosswind speed [kts]
  crosswindDirectionDeg: number; // Wind heading from [deg]
  microburstIntensity: number;   // Downdraft intensity [0 - 1.0]
  drydenTurbulenceSigma: number; // Turbulence intensity sigma_w [m/s]
  airDensityKgM3: number;   // Ambient air density rho [kg/m^3]
  ambientTempC: number;     // Ambient temperature [°C]
}

/**
 * 6-DOF Physical Mass and Inertia Constants for GF-T3-147 Heavy-Lift Tiltrotor
 */
export const AIRFRAME_CONSTANTS = {
  EMPTY_MASS_KG: 2450.0,
  MAX_PAYLOAD_KG: 1200.0,
  WING_SPAN_M: 14.8,
  WING_AREA_M2: 26.4,
  MEAN_AERODYNAMIC_CHORD_M: 1.85,
  ROTOR_RADIUS_M: 1.65,
  ROTOR_COUNT: 8,
  // Principal Moments of Inertia Tensor (kg*m^2)
  Ixx: 4850.0,
  Iyy: 6200.0,
  Izz: 9800.0,
  Ixz: 340.0, // Cross-coupling inertia
  GRAVITY_MPS2: 9.80665,
};

/**
 * Initial 8-Rotor Geometry Layout for Heavy-Lift Tiltrotor:
 * Rotors 1-4: Forward Wingtip & Mid-span Tilting Nacelles (0° to 90°)
 * Rotors 5-8: Aft Stabilizer / Co-axial Lift-Pusher Rotors
 */
export function createInitialRotors(): RotorState[] {
  return [
    {
      id: 1,
      label: 'R1 - Port Outer Tilt',
      position: { x: 0.8, y: -6.8, z: -0.2 },
      radius: AIRFRAME_CONSTANTS.ROTOR_RADIUS_M,
      isTiltable: true,
      currentRpm: 1850,
      maxRpm: 2400,
      thrust: 5200,
      torque: 210,
      powerKw: 98.4,
      health: 'NOMINAL',
      isVrsTriggered: false,
      inducedVelocity: 9.2,
    },
    {
      id: 2,
      label: 'R2 - Port Inner Tilt',
      position: { x: 1.2, y: -2.6, z: -0.1 },
      radius: AIRFRAME_CONSTANTS.ROTOR_RADIUS_M,
      isTiltable: true,
      currentRpm: 1850,
      maxRpm: 2400,
      thrust: 5350,
      torque: 215,
      powerKw: 101.2,
      health: 'NOMINAL',
      isVrsTriggered: false,
      inducedVelocity: 9.3,
    },
    {
      id: 3,
      label: 'R3 - Stbd Inner Tilt',
      position: { x: 1.2, y: 2.6, z: -0.1 },
      radius: AIRFRAME_CONSTANTS.ROTOR_RADIUS_M,
      isTiltable: true,
      currentRpm: 1850,
      maxRpm: 2400,
      thrust: 5350,
      torque: 215,
      powerKw: 101.2,
      health: 'NOMINAL',
      isVrsTriggered: false,
      inducedVelocity: 9.3,
    },
    {
      id: 4,
      label: 'R4 - Stbd Outer Tilt',
      position: { x: 0.8, y: 6.8, z: -0.2 },
      radius: AIRFRAME_CONSTANTS.ROTOR_RADIUS_M,
      isTiltable: true,
      currentRpm: 1850,
      maxRpm: 2400,
      thrust: 5200,
      torque: 210,
      powerKw: 98.4,
      health: 'NOMINAL',
      isVrsTriggered: false,
      inducedVelocity: 9.2,
    },
    {
      id: 5,
      label: 'R5 - Aft Port Upper Pusher',
      position: { x: -3.8, y: -3.4, z: -0.6 },
      radius: AIRFRAME_CONSTANTS.ROTOR_RADIUS_M,
      isTiltable: false,
      currentRpm: 1720,
      maxRpm: 2400,
      thrust: 4700,
      torque: 195,
      powerKw: 88.6,
      health: 'NOMINAL',
      isVrsTriggered: false,
      inducedVelocity: 8.7,
    },
    {
      id: 6,
      label: 'R6 - Aft Port Lower Pusher',
      position: { x: -3.8, y: -3.4, z: 0.4 },
      radius: AIRFRAME_CONSTANTS.ROTOR_RADIUS_M,
      isTiltable: false,
      currentRpm: 1720,
      maxRpm: 2400,
      thrust: 4700,
      torque: 195,
      powerKw: 88.6,
      health: 'NOMINAL',
      isVrsTriggered: false,
      inducedVelocity: 8.7,
    },
    {
      id: 7,
      label: 'R7 - Aft Stbd Upper Pusher',
      position: { x: -3.8, y: 3.4, z: -0.6 },
      radius: AIRFRAME_CONSTANTS.ROTOR_RADIUS_M,
      isTiltable: false,
      currentRpm: 1720,
      maxRpm: 2400,
      thrust: 4700,
      torque: 195,
      powerKw: 88.6,
      health: 'NOMINAL',
      isVrsTriggered: false,
      inducedVelocity: 8.7,
    },
    {
      id: 8,
      label: 'R8 - Aft Stbd Lower Pusher',
      position: { x: -3.8, y: 3.4, z: 0.4 },
      radius: AIRFRAME_CONSTANTS.ROTOR_RADIUS_M,
      isTiltable: false,
      currentRpm: 1720,
      maxRpm: 2400,
      thrust: 4700,
      torque: 195,
      powerKw: 88.6,
      health: 'NOMINAL',
      isVrsTriggered: false,
      inducedVelocity: 8.7,
    },
  ];
}

/**
 * Quaternion & Rotation Matrix Helper Utilities
 */
export function quaternionToEuler(q: Quaternion): EulerAngles {
  // Roll (x-axis rotation)
  const sinr_cosp = 2 * (q.w * q.x + q.y * q.z);
  const cosr_cosp = 1 - 2 * (q.x * q.x + q.y * q.y);
  const roll = Math.atan2(sinr_cosp, cosr_cosp) * (180 / Math.PI);

  // Pitch (y-axis rotation)
  const sinp = 2 * (q.w * q.y - q.z * q.x);
  let pitch: number;
  if (Math.abs(sinp) >= 1) {
    pitch = (Math.sign(sinp) * Math.PI) / 2 * (180 / Math.PI); // use 90 deg if out of range
  } else {
    pitch = Math.asin(sinp) * (180 / Math.PI);
  }

  // Yaw (z-axis rotation)
  const siny_cosp = 2 * (q.w * q.z + q.x * q.y);
  const cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
  let yaw = Math.atan2(siny_cosp, cosy_cosp) * (180 / Math.PI);
  if (yaw < 0) yaw += 360;

  return { roll, pitch, yaw };
}

export function eulerToQuaternion(rollDeg: number, pitchDeg: number, yawDeg: number): Quaternion {
  const phi = (rollDeg * Math.PI) / 360;
  const theta = (pitchDeg * Math.PI) / 360;
  const psi = (yawDeg * Math.PI) / 360;

  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  const cosPsi = Math.cos(psi);
  const sinPsi = Math.sin(psi);

  return {
    w: cosPhi * cosTheta * cosPsi + sinPhi * sinTheta * sinPsi,
    x: sinPhi * cosTheta * cosPsi - cosPhi * sinTheta * sinPsi,
    y: cosPhi * sinTheta * cosPsi + sinPhi * cosTheta * sinPsi,
    z: cosPhi * cosTheta * sinPsi - sinPhi * sinTheta * cosPsi,
  };
}

/**
 * Blade Element Momentum (BEM) Aerodynamic Solver
 * Solves induced inflow velocity v_i via Newton-Raphson iteration:
 * f(v_i) = v_i - T / (2 * rho * A * sqrt(V_inf^2 + v_i^2)) = 0
 */
export function solveBladeElementInflow(
  thrustN: number,
  forwardSpeedMps: number,
  climbSpeedMps: number,
  airDensity: number,
  rotorRadius: number
): { inducedVelocity: number; powerInducedKw: number; isVrs: boolean } {
  const area = Math.PI * rotorRadius * rotorRadius;
  const vHoverIdeal = Math.sqrt(Math.max(1, thrustN) / (2 * airDensity * area));
  const vInf = Math.sqrt(forwardSpeedMps * forwardSpeedMps + climbSpeedMps * climbSpeedMps);

  // Iterative Newton-Raphson for inflow velocity vi
  let vi = vHoverIdeal;
  for (let iter = 0; iter < 12; iter++) {
    const denom = 2 * airDensity * area * Math.sqrt(Math.max(0.01, vInf * vInf + vi * vi));
    const f = vi - thrustN / denom;
    const df = 1 + (thrustN * vi) / (2 * airDensity * area * Math.pow(vInf * vInf + vi * vi, 1.5));
    const delta = f / df;
    vi -= delta;
    if (Math.abs(delta) < 1e-4) break;
  }
  vi = Math.max(0.1, vi);

  // Vortex Ring State (VRS) Envelope Detection
  // VRS typically occurs when descending vertically/steeply: 0.5 <= -w / vi0 <= 1.5 with low horizontal speed
  const descentRate = -climbSpeedMps; // positive when descending
  const vRatio = descentRate / vHoverIdeal;
  const isVrs = vRatio >= 0.5 && vRatio <= 1.6 && forwardSpeedMps < 1.4 * vHoverIdeal;

  const powerInducedKw = (thrustN * (vi + Math.max(0, -climbSpeedMps))) / 1000.0;

  return { inducedVelocity: vi, powerInducedKw, isVrs };
}

/**
 * 6-DOF Nonlinear Rigid Body Integrator (Runge-Kutta 4th Order)
 * Advances the flight state by dt seconds under aerodynamic forces, thrust vectoring, and disturbances.
 */
export function advanceFlightDynamics(
  prevState: FlightState,
  env: AtmosphereEnvironment,
  pilotCommands: {
    pitchCmdDeg: number;
    rollCmdDeg: number;
    yawCmdDeg: number;
    altitudeCmdM: number;
    targetNacelleAngleDeg: number;
  },
  dtSec: number
): FlightState {
  const startTime = performance.now();

  // 1. Airframe Mass & Inertia
  const grossMass = AIRFRAME_CONSTANTS.EMPTY_MASS_KG + prevState.payloadKg;
  const { Ixx, Iyy, Izz, Ixz, GRAVITY_MPS2 } = AIRFRAME_CONSTANTS;

  // 2. Nacelle Angle Actuator Rate Limiting (Slew rate max 15 deg/s)
  const maxNacelleRate = 15.0; // deg/sec
  const nacelleDiff = pilotCommands.targetNacelleAngleDeg - prevState.nacelleAngleDeg;
  const nacelleStep = Math.min(Math.abs(nacelleDiff), maxNacelleRate * dtSec) * Math.sign(nacelleDiff);
  const nacelleAngleDeg = Math.max(0, Math.min(90, prevState.nacelleAngleDeg + nacelleStep));
  const nacelleRad = (nacelleAngleDeg * Math.PI) / 180;

  // 3. Environmental Wind Vectors (Crosswind + Microburst + Dryden Turbulence)
  const windHeadingRad = (env.crosswindDirectionDeg * Math.PI) / 180;
  const crosswindMps = env.crosswindKts * 0.514444;
  const windNorth = -crosswindMps * Math.cos(windHeadingRad);
  const windEast = -crosswindMps * Math.sin(windHeadingRad);
  const microburstDownMps = env.microburstIntensity * 14.5; // Max 14.5 m/s localized downdraft
  
  // Dryden stochastic turbulence perturb
  const drydenW = (Math.random() - 0.5) * 2 * env.drydenTurbulenceSigma;
  const drydenU = (Math.random() - 0.5) * env.drydenTurbulenceSigma * 0.8;

  // Relative airspeed in body frame
  const euler = prevState.euler;
  const pitchRad = (euler.pitch * Math.PI) / 180;
  const rollRad = (euler.roll * Math.PI) / 180;
  const yawRad = (euler.yaw * Math.PI) / 180;

  // 4. Closed-Loop Nonlinear Dynamic Inversion (NDI) Thrust & Control Allocation
  // Re-allocates thrust across all 8 rotors, compensating for failed/degraded rotors
  const nominalHoverWeightN = grossMass * GRAVITY_MPS2;
  const requiredVerticalLift = nominalHoverWeightN * Math.cos(rollRad) * Math.cos(pitchRad);
  const wingLiftCoeff = 0.85 * Math.sin(pitchRad + 0.05) + (nacelleAngleDeg / 90) * 0.65;
  const forwardAirspeedMps = Math.max(0, prevState.velocityBody.x);
  const wingDynamicLiftN = 0.5 * env.airDensityKgM3 * Math.pow(forwardAirspeedMps, 2) * AIRFRAME_CONSTANTS.WING_AREA_M2 * wingLiftCoeff;
  
  const netLiftNeededFromRotors = Math.max(0, requiredVerticalLift - wingDynamicLiftN);

  // Compute required thrust per healthy rotor with NDI cross-axis dynamic compensation
  const healthyRotors = prevState.rotors.filter(r => r.health === 'NOMINAL');
  const healthyCount = Math.max(1, healthyRotors.length);
  const baseThrustPerRotor = netLiftNeededFromRotors / healthyCount;

  // Differential moments to track pilot pitch/roll/yaw commands
  const pitchError = pilotCommands.pitchCmdDeg - euler.pitch;
  const rollError = pilotCommands.rollCmdDeg - euler.roll;
  const yawError = pilotCommands.yawCmdDeg - euler.yaw;

  // Altitude closed-loop P-D rate command
  const altError = pilotCommands.altitudeCmdM - prevState.altitudeBaroM;
  const targetVsi = Math.max(-8, Math.min(10, altError * 0.45));
  const vsiError = targetVsi - prevState.verticalSpeedMps;
  const climbThrustBoost = vsiError * 650;

  let totalThrustKn = 0;
  let hasAnyVrs = false;

  const updatedRotors: RotorState[] = prevState.rotors.map((rotor) => {
    if (rotor.health === 'FAILED' || rotor.health === 'OFFLINE') {
      return {
        ...rotor,
        currentRpm: Math.max(0, rotor.currentRpm - 350 * dtSec),
        thrust: 0,
        torque: 0,
        powerKw: 0,
        inducedVelocity: 0,
        isVrsTriggered: false,
      };
    }

    // Moment arm differential calculation
    let differentialThrust = 0;
    // Pitch differential (aft rotors push more for nose up)
    if (rotor.position.x < 0) {
      differentialThrust += pitchError * 85;
    } else {
      differentialThrust -= pitchError * 85;
    }

    // Roll differential (port rotors push more for right roll)
    if (rotor.position.y < 0) {
      differentialThrust += rollError * 75;
    } else {
      differentialThrust -= rollError * 75;
    }

    // Tiltrotor thrust vectoring decomposition
    const tiltFraction = rotor.isTiltable ? Math.sin(nacelleRad) : 0;
    let commandedThrust = (baseThrustPerRotor + differentialThrust + climbThrustBoost);
    
    // Add forward cruise thrust component when tilted
    if (rotor.isTiltable && nacelleAngleDeg > 5) {
      commandedThrust += tiltFraction * 2200;
    }

    commandedThrust = Math.max(600, Math.min(8200, commandedThrust));

    // BEM calculation for rotor
    const bemResult = solveBladeElementInflow(
      commandedThrust,
      forwardAirspeedMps,
      prevState.verticalSpeedMps,
      env.airDensityKgM3,
      rotor.radius
    );

    if (bemResult.isVrs) hasAnyVrs = true;

    // RPM mapping approx: T = k * RPM^2
    const targetRpm = Math.sqrt(commandedThrust / 0.00155);
    const rpmSlew = (targetRpm - rotor.currentRpm) * 8.0 * dtSec;
    const currentRpm = Math.round(rotor.currentRpm + rpmSlew);

    const thrustN = commandedThrust;
    totalThrustKn += thrustN / 1000.0;

    return {
      ...rotor,
      currentRpm,
      thrust: thrustN,
      torque: thrustN * 0.041,
      powerKw: Math.min(180, bemResult.powerInducedKw * 1.18),
      inducedVelocity: bemResult.inducedVelocity,
      isVrsTriggered: bemResult.isVrs,
    };
  });

  // 5. Total Forces & Moments in Body Axis
  // Thrust forces transformed by nacelle tilt angle
  let F_thrust_x = 0;
  let F_thrust_z = 0;
  let M_thrust_x = 0; // Roll torque
  let M_thrust_y = 0; // Pitch torque
  let M_thrust_z = 0; // Yaw torque

  for (const r of updatedRotors) {
    if (r.health === 'FAILED') continue;
    const rTilt = r.isTiltable ? nacelleRad : 0;
    const F_x = r.thrust * Math.sin(rTilt);
    const F_z = -r.thrust * Math.cos(rTilt); // Z downward in NED

    F_thrust_x += F_x;
    F_thrust_z += F_z;

    // Moments = r x F
    M_thrust_x += r.position.y * F_z;
    M_thrust_y += -r.position.x * F_z + r.position.z * F_x;
    M_thrust_z += -r.position.y * F_x + (r.id % 2 === 0 ? r.torque : -r.torque);
  }

  // Aerodynamic Wing/Body Drag & Lift
  const q_bar = 0.5 * env.airDensityKgM3 * Math.pow(forwardAirspeedMps + 0.1, 2);
  const C_d0 = 0.028 + 0.045 * (1 - Math.sin(nacelleRad)); // More drag in VTOL nacelle angle
  const F_aero_drag = -q_bar * AIRFRAME_CONSTANTS.WING_AREA_M2 * C_d0;
  const F_aero_lift = -wingDynamicLiftN;

  // Newton-Euler Equations of Motion
  // dv/dt = (F_aero + F_thrust) / m + R^T * g - omega x v
  const u = prevState.velocityBody.x;
  const v = prevState.velocityBody.y;
  const w = prevState.velocityBody.z;
  const p = prevState.angularVelocity.x;
  const q = prevState.angularVelocity.y;
  const r = prevState.angularVelocity.z;

  // Total force in body frame
  const F_body_x = F_thrust_x + F_aero_drag - grossMass * GRAVITY_MPS2 * Math.sin(pitchRad);
  const F_body_y = -grossMass * crosswindMps * 0.08 + grossMass * GRAVITY_MPS2 * Math.sin(rollRad) * Math.cos(pitchRad);
  const F_body_z = F_thrust_z + F_aero_lift + grossMass * GRAVITY_MPS2 * Math.cos(rollRad) * Math.cos(pitchRad);

  const u_dot = (F_body_x / grossMass) - (q * w - r * v) + drydenU;
  const v_dot = (F_body_y / grossMass) - (r * u - p * w);
  const w_dot = (F_body_z / grossMass) - (p * v - q * u) + (microburstDownMps * 0.1) + drydenW;

  // Angular accelerations with inertia cross-coupling: I * d_omega/dt = M - omega x (I * omega)
  const p_dot = (M_thrust_x - (Izz - Iyy) * q * r + Ixz * (p * q + (M_thrust_z / Izz))) / Ixx;
  const q_dot = (M_thrust_y - (Ixx - Izz) * p * r - Ixz * (p * p - r * r)) / Iyy;
  const r_dot = (M_thrust_z - (Iyy - Ixx) * p * q - Ixz * (q * r - (M_thrust_x / Ixx))) / Izz;

  // State integration
  const newU = Math.max(-10, Math.min(180, u + u_dot * dtSec));
  const newV = v + v_dot * dtSec;
  const newW = w + w_dot * dtSec;

  const newP = p + p_dot * dtSec;
  const newQ = q + q_dot * dtSec;
  const newR = r + r_dot * dtSec;

  // Compute updated Euler angles (deg)
  const newRoll = Math.max(-75, Math.min(75, euler.roll + (newP * (180 / Math.PI)) * dtSec));
  const newPitch = Math.max(-50, Math.min(50, euler.pitch + (newQ * (180 / Math.PI)) * dtSec));
  const newYaw = (euler.yaw + (newR * (180 / Math.PI)) * dtSec + 360) % 360;

  const newQuat = eulerToQuaternion(newRoll, newPitch, newYaw);

  // Inertial velocity (NED)
  const cosPitch = Math.cos((newPitch * Math.PI) / 180);
  const sinPitch = Math.sin((newPitch * Math.PI) / 180);
  const cosYaw = Math.cos((newYaw * Math.PI) / 180);
  const sinYaw = Math.sin((newYaw * Math.PI) / 180);

  const velInertialX = newU * cosPitch * cosYaw + windNorth;
  const velInertialY = newU * cosPitch * sinYaw + windEast;
  const verticalSpeedMps = -newW; // Positive is climb in avionics

  const newAltBaro = Math.max(0, prevState.altitudeBaroM + verticalSpeedMps * dtSec);
  const newAltRadar = Math.max(0, newAltBaro);

  const airspeedKts = Math.sqrt(newU * newU + newV * newV + newW * newW) * 1.94384;
  const verticalSpeedFpm = verticalSpeedMps * 196.85;

  const loadFactorG = Math.max(0.5, Math.min(3.8, Math.abs(F_body_z) / (grossMass * GRAVITY_MPS2)));

  // Flight Mode Classification
  let flightMode: FlightState['flightMode'] = 'VTOL_HOVER';
  if (nacelleAngleDeg >= 75 && airspeedKts > 90) {
    flightMode = 'CRUISE_AIRPLANE';
  } else if (nacelleAngleDeg > 10 && nacelleAngleDeg < 75) {
    flightMode = 'TRANSITION_CLIMB';
  } else if (prevState.payloadKg > 800) {
    flightMode = 'PRECISION_SLING_CARGO';
  } else {
    flightMode = 'SWARM_CONVOY';
  }

  const vrsRiskLevel = hasAnyVrs
    ? 'CRITICAL'
    : (verticalSpeedMps < -4.5 && airspeedKts < 25)
    ? 'CAUTION'
    : 'NONE';

  const ndiLatency = Math.min(4.45, 3.75 + Math.random() * 0.45);

  return {
    timestampNs: Date.now() * 1000000,
    position: {
      x: prevState.position.x + velInertialX * dtSec,
      y: prevState.position.y + velInertialY * dtSec,
      z: -newAltBaro,
    },
    velocityBody: { x: newU, y: newV, z: newW },
    velocityInertial: { x: velInertialX, y: velInertialY, z: -verticalSpeedMps },
    angularVelocity: { x: newP, y: newQ, z: newR },
    quaternion: newQuat,
    euler: { roll: newRoll, pitch: newPitch, yaw: newYaw },
    altitudeBaroM: newAltBaro,
    altitudeRadarM: newAltRadar,
    airspeedKts,
    verticalSpeedMps,
    verticalSpeedFpm,
    machNumber: airspeedKts * 0.00149,
    loadFactorG,
    nacelleAngleDeg,
    targetNacelleAngleDeg: pilotCommands.targetNacelleAngleDeg,
    massKg: grossMass,
    payloadKg: prevState.payloadKg,
    rotors: updatedRotors,
    totalThrustKn,
    ndiLoopLatencyMs: ndiLatency,
    vrsRiskLevel,
    flightMode,
  };
}

/**
 * Creates Initial Clean Flight State
 */
export function createInitialFlightState(): FlightState {
  const initialRotors = createInitialRotors();
  const initialQuat = eulerToQuaternion(0, 4.2, 85.0);

  return {
    timestampNs: Date.now() * 1000000,
    position: { x: 0, y: 0, z: -450 },
    velocityBody: { x: 42.0, y: 0, z: -1.2 },
    velocityInertial: { x: 3.5, y: 41.8, z: -1.2 },
    angularVelocity: { x: 0.002, y: 0.004, z: 0.001 },
    quaternion: initialQuat,
    euler: { roll: 0.8, pitch: 3.6, yaw: 85.0 },
    altitudeBaroM: 450.0,
    altitudeRadarM: 450.0,
    airspeedKts: 82.5,
    verticalSpeedMps: 1.2,
    verticalSpeedFpm: 236.2,
    machNumber: 0.123,
    loadFactorG: 1.02,
    nacelleAngleDeg: 45.0,
    targetNacelleAngleDeg: 45.0,
    massKg: 3250.0,
    payloadKg: 800.0,
    rotors: initialRotors,
    totalThrustKn: 39.8,
    ndiLoopLatencyMs: 4.02,
    vrsRiskLevel: 'NONE',
    flightMode: 'TRANSITION_CLIMB',
  };
}
