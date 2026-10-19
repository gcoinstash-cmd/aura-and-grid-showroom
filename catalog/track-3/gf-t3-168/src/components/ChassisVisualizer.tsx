import React from 'react';
import { EKFState, SensorInput } from '../types/telemetry';

interface ChassisVisualizerProps {
  ekfState: EKFState;
  sensorInput: SensorInput;
  isStreaming: boolean;
}

export const ChassisVisualizer: React.FC<ChassisVisualizerProps> = ({
  ekfState,
  sensorInput,
  isStreaming,
}) => {
  // Vehicle metrics derived
  const speedKmh = Math.sqrt(ekfState.vx ** 2 + ekfState.vy ** 2) * 3.6;
  const yawRateDeg = sensorInput.gz;
  const drsAngle = sensorInput.rearSteerAngleDeg;
  const frontTorque = sensorInput.frontTorquePct;
  const rearTorque = sensorInput.rearTorquePct;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>DUAL_VECTOR_TORQUE All-Wheel Drive & Dynamic Rear Steering (DRS) Telemetry</span>
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Real-time chassis kinematics observer fused with 9-DOF IMU & GNSS RTK
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-slate-200">
          <div>
            <span className="text-slate-400">Velocity:</span>{' '}
            <strong className="text-cyan-400 font-bold">{speedKmh.toFixed(1)} km/h</strong>
          </div>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <div>
            <span className="text-slate-400">Yaw Rate:</span>{' '}
            <strong className="text-white font-bold">{yawRateDeg.toFixed(2)} °/s</strong>
          </div>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <div>
            <span className="text-slate-400">DRS Angle:</span>{' '}
            <strong className={`font-bold ${Math.abs(drsAngle) > 0.1 ? 'text-amber-400' : 'text-slate-300'}`}>
              {drsAngle > 0 ? `+${drsAngle.toFixed(1)}` : drsAngle.toFixed(1)}°
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Chassis Diagram Stage (SVG Blueprint) */}
        <div className="lg:col-span-7 relative bg-slate-950 rounded-lg p-5 border border-slate-800/80 overflow-hidden flex items-center justify-center min-h-[340px]">
          {/* Subtle Grid Canvas Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

          <svg
            viewBox="0 0 620 340"
            className="w-full max-w-2xl h-auto select-none relative z-10"
          >
            {/* Centerline */}
            <line x1="70" y1="170" x2="550" y2="170" stroke="#334155" strokeWidth="1.5" strokeDasharray="5 5" />
            <line x1="310" y1="20" x2="310" y2="320" stroke="#334155" strokeWidth="1.5" strokeDasharray="5 5" />

            {/* Vehicle Perimeter Silhouette (Heavy Overland Dynamics Platform Dual-Vector Performance Core Body) */}
            <path
              d="M 110 65 
                 C 170 55, 430 55, 490 65
                 C 545 75, 555 125, 555 170
                 C 555 215, 545 265, 490 275
                 C 430 285, 170 285, 110 275
                 C 55 265, 45 215, 45 170
                 C 45 125, 55 75, 110 65 Z"
              fill="#090d16"
              stroke="#334155"
              strokeWidth="2.5"
            />

            {/* Front Transaxle & DUAL_VECTOR_TORQUE Electric Motor */}
            <rect x="420" y="115" width="56" height="110" rx="6" fill="#0f172a" stroke="#06b6d4" strokeWidth="2.5" />
            <text x="448" y="157" textAnchor="middle" fill="#06b6d4" fontSize="14" fontFamily="monospace" fontWeight="bold">
              FRONT
            </text>
            <text x="448" y="177" textAnchor="middle" fill="#cbd5e1" fontSize="14" fontFamily="monospace" fontWeight="bold">
              {frontTorque}% TQ
            </text>

            {/* Rear eAxle Electric Motor */}
            <rect x="130" y="115" width="56" height="110" rx="6" fill="#0f172a" stroke="#06b6d4" strokeWidth="2.5" />
            <text x="158" y="157" textAnchor="middle" fill="#06b6d4" fontSize="14" fontFamily="monospace" fontWeight="bold">
              REAR
            </text>
            <text x="158" y="177" textAnchor="middle" fill="#cbd5e1" fontSize="14" fontFamily="monospace" fontWeight="bold">
              {rearTorque}% TQ
            </text>

            {/* Drive Axles */}
            <line x1="448" y1="45" x2="448" y2="295" stroke="#06b6d4" strokeWidth="3.5" opacity="0.85" />
            <line x1="158" y1="45" x2="158" y2="295" stroke="#06b6d4" strokeWidth="3.5" opacity="0.85" />

            {/* FRONT WHEELS */}
            {/* Front Left Wheel */}
            <g transform={`translate(448, 45) rotate(${sensorInput.gz * 0.4})`}>
              <rect x="-35" y="-16" width="70" height="32" rx="5" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />
              <text x="0" y="5" textAnchor="middle" fill="#f8fafc" fontSize="14" fontFamily="monospace" fontWeight="bold">
                {sensorInput.wheelSpeedFL.toFixed(0)} km/h
              </text>
            </g>
            {/* Front Right Wheel */}
            <g transform={`translate(448, 295) rotate(${sensorInput.gz * 0.4})`}>
              <rect x="-35" y="-16" width="70" height="32" rx="5" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />
              <text x="0" y="5" textAnchor="middle" fill="#f8fafc" fontSize="14" fontFamily="monospace" fontWeight="bold">
                {sensorInput.wheelSpeedFR.toFixed(0)} km/h
              </text>
            </g>

            {/* REAR WHEELS WITH DYNAMIC REAR STEERING (DRS) ANGLE ROTATION */}
            {/* Rear Left Wheel */}
            <g transform={`translate(158, 45) rotate(${drsAngle})`}>
              <rect x="-35" y="-16" width="70" height="32" rx="5" fill="#1e293b" stroke={Math.abs(drsAngle) > 0.1 ? '#f59e0b' : '#38bdf8'} strokeWidth="2.5" />
              <text x="0" y="5" textAnchor="middle" fill="#f8fafc" fontSize="14" fontFamily="monospace" fontWeight="bold">
                {sensorInput.wheelSpeedRL.toFixed(0)} km/h
              </text>
            </g>
            {/* Rear Right Wheel */}
            <g transform={`translate(158, 295) rotate(${drsAngle})`}>
              <rect x="-35" y="-16" width="70" height="32" rx="5" fill="#1e293b" stroke={Math.abs(drsAngle) > 0.1 ? '#f59e0b' : '#38bdf8'} strokeWidth="2.5" />
              <text x="0" y="5" textAnchor="middle" fill="#f8fafc" fontSize="14" fontFamily="monospace" fontWeight="bold">
                {sensorInput.wheelSpeedRR.toFixed(0)} km/h
              </text>
            </g>

            {/* DRS Actuator Bar */}
            <line x1="158" y1="75" x2="158" y2="265" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4 4" />
            <text x="180" y="105" fill="#f59e0b" fontSize="14" fontFamily="monospace" fontWeight="bold">
              DRS Actuator (±4°)
            </text>

            {/* Vehicle Center of Gravity (IMU location) */}
            <g transform="translate(310, 170)">
              <circle r="16" fill="#090d16" stroke="#10b981" strokeWidth="2.5" />
              <line x1="-12" y1="0" x2="12" y2="0" stroke="#10b981" strokeWidth="2" />
              <line x1="0" y1="-12" x2="0" y2="12" stroke="#10b981" strokeWidth="2" />
              <text x="24" y="6" fill="#10b981" fontSize="14" fontFamily="monospace" fontWeight="bold">
                9-DOF IMU (CoG)
              </text>
            </g>

            {/* GNSS RTK Dual Antenna */}
            <circle cx="225" cy="170" r="8" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
            <text x="225" y="196" textAnchor="middle" fill="#38bdf8" fontSize="14" fontFamily="monospace" fontWeight="bold">
              GNSS RTK L1/L5
            </text>

            {/* Torque Flow Vectors */}
            {isStreaming && (
              <>
                <line x1="420" y1="170" x2="350" y2="170" stroke="#06b6d4" strokeWidth="3" strokeDasharray="5 3" />
                <line x1="186" y1="170" x2="260" y2="170" stroke="#06b6d4" strokeWidth="3" strokeDasharray="5 3" />
              </>
            )}
          </svg>
        </div>

        {/* Real-Time EKF State Vector HUD */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-950 p-5 rounded-lg border border-slate-800">
            <div className="text-sm font-mono uppercase tracking-wider text-slate-300 font-bold mb-3 flex items-center justify-between">
              <span>15-STATE FILTER VECTOR (X̂)</span>
              <span className="text-emerald-400 font-bold">1,000 Hz</span>
            </div>
            <div className="space-y-2.5 text-sm font-mono leading-relaxed">
              <div className="flex justify-between py-1 border-b border-slate-800/70">
                <span className="text-slate-400 font-medium">Position NED [m]:</span>
                <span className="text-white font-bold">[{ekfState.px.toFixed(2)}, {ekfState.py.toFixed(2)}, {ekfState.pz.toFixed(2)}]</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/70">
                <span className="text-slate-400 font-medium">Velocity [m/s]:</span>
                <span className="text-cyan-400 font-bold">[{ekfState.vx.toFixed(2)}, {ekfState.vy.toFixed(2)}, {ekfState.vz.toFixed(2)}]</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/70">
                <span className="text-slate-400 font-medium">Roll / Pitch / Yaw:</span>
                <span className="text-slate-200 font-bold">
                  {(ekfState.roll * 57.2958).toFixed(1)}°, {(ekfState.pitch * 57.2958).toFixed(1)}°, {(ekfState.yaw * 57.2958).toFixed(1)}°
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/70">
                <span className="text-slate-400 font-medium">Accel Biases [m/s²]:</span>
                <span className="text-slate-300 font-bold">[{ekfState.b_ax.toFixed(4)}, {ekfState.b_ay.toFixed(4)}, {ekfState.b_az.toFixed(4)}]</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-medium">Gyro Biases [rad/s]:</span>
                <span className="text-slate-300 font-bold">[{ekfState.b_gx.toFixed(5)}, {ekfState.b_gy.toFixed(5)}, {ekfState.b_gz.toFixed(5)}]</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-5 rounded-lg border border-slate-800">
            <div className="text-sm font-mono uppercase tracking-wider text-slate-300 font-bold mb-3 flex items-center justify-between">
              <span>DUAL_VECTOR_TORQUE Torque Distribution</span>
              <span className="text-cyan-400 font-bold">{frontTorque}% : {rearTorque}%</span>
            </div>
            <div className="space-y-3 font-mono">
              <div className="flex justify-between text-sm text-slate-200 font-semibold">
                <span>Front Motor: {frontTorque}%</span>
                <span>Rear eAxle: {rearTorque}%</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex">
                <div style={{ width: `${frontTorque}%` }} className="bg-cyan-500 h-full" />
                <div style={{ width: `${rearTorque}%` }} className="bg-blue-600 h-full" />
              </div>
              <div className="text-base text-slate-200 pt-1 leading-relaxed font-sans">
                Dynamic cornering bias shifts rear torque up to 80% under lateral load to prevent understeer.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
