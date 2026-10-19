import React from 'react';
import { CalculatedTorque, PowertrainState } from '../types';

interface ChassisVisualizerProps {
  state: PowertrainState;
  torque: CalculatedTorque;
}

export const ChassisVisualizer: React.FC<ChassisVisualizerProps> = ({ state, torque }) => {
  const { driveMode, batteryTempC } = state;
  const isIceActive = torque.iceTorqueNm > 5;
  const isFrontMotorActive = Math.abs(torque.frontMotorTorqueNm) > 5;
  const isRearMotorActive = Math.abs(torque.rearMotorTorqueNm) > 5;

  // Max arrow scale length for wheels
  const flArrowLen = Math.min(70, Math.max(10, (torque.frontLeftTorqueNm / 200) * 60));
  const frArrowLen = Math.min(70, Math.max(10, (torque.frontRightTorqueNm / 200) * 60));
  const rlArrowLen = Math.min(70, Math.max(10, (torque.rearLeftTorqueNm / 120) * 60));
  const rrArrowLen = Math.min(70, Math.max(10, (torque.rearRightTorqueNm / 120) * 60));

  return (
    <div className="relative w-full rounded-xl bg-slate-900 border border-slate-800 p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
        <div>
          <span className="text-slate-400 font-medium text-sm">Chassis Topology · Heavy Overland Dynamics Platform GA-K Platform</span>
          <h3 className="text-2xl font-bold text-slate-100">Dynamic E-Four Torque Vectoring Geometry</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm font-mono text-slate-200">
            <span>Yaw: {torque.yawMomentNm > 0 ? `+${torque.yawMomentNm}` : torque.yawMomentNm} Nm</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm font-mono text-cyan-400">
            <span>Split: {((torque.frontMotorTorqueNm / (torque.frontMotorTorqueNm + torque.rearMotorTorqueNm || 1)) * 100).toFixed(0)}% F / {((torque.rearMotorTorqueNm / (torque.frontMotorTorqueNm + torque.rearMotorTorqueNm || 1)) * 100).toFixed(0)}% R</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas for Automotive Schematic */}
      <div className="w-full flex justify-center py-2">
        <svg
          viewBox="0 0 800 500"
          className="w-full max-w-3xl h-auto select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="batteryGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0369A1" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="iceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EA580C" />
              <stop offset="100%" stopColor="#C2410C" />
            </linearGradient>
            <linearGradient id="motorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowOrange" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Heavy Overland Dynamics Platform GA-K Vehicle Chassis Silhouette Outline */}
          <path
            d="M 220 50 
               C 280 40, 520 40, 580 50 
               C 620 60, 650 90, 660 150 
               C 670 230, 670 280, 660 360 
               C 650 420, 620 450, 580 460 
               C 520 470, 280 470, 220 460 
               C 180 450, 150 420, 140 360 
               C 130 280, 130 230, 140 150 
               C 150 90, 180 60, 220 50 Z"
            fill="url(#bodyGrad)"
            stroke="#334155"
            strokeWidth="2.5"
            strokeDasharray="4 4"
          />

          {/* Wheelbase Axle Centerlines */}
          <line x1="160" y1="120" x2="640" y2="120" stroke="#1E293B" strokeWidth="2" strokeDasharray="6 6" />
          <line x1="160" y1="390" x2="640" y2="390" stroke="#1E293B" strokeWidth="2" strokeDasharray="6 6" />
          <line x1="400" y1="60" x2="400" y2="450" stroke="#1E293B" strokeWidth="1.5" strokeDasharray="4 4" />

          {/* Front Transaxle Assembly (ICE + 5NM e-CVT) */}
          {/* A25A-FXS 2.5L Atkinson Engine */}
          <rect
            x="320"
            y="70"
            width="90"
            height="55"
            rx="6"
            fill={isIceActive ? "url(#iceGrad)" : "#1E293B"}
            stroke={isIceActive ? "#F97316" : "#475569"}
            strokeWidth="2"
            filter={isIceActive ? "url(#glowOrange)" : "none"}
          />
          <text x="365" y="94" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="bold">
            A25A-FXS
          </text>
          <text x="365" y="113" textAnchor="middle" fill="#CBD5E1" fontSize="14">
            {isIceActive ? `${torque.iceTorqueNm} Nm` : 'OFF (EV)'}
          </text>

          {/* 5NM Front Motor Generator (134 kW / 270 Nm) */}
          <rect
            x="420"
            y="70"
            width="80"
            height="55"
            rx="6"
            fill={isFrontMotorActive ? "url(#motorGrad)" : "#1E293B"}
            stroke={isFrontMotorActive ? "#38BDF8" : "#475569"}
            strokeWidth="2"
            filter={isFrontMotorActive ? "url(#glowCyan)" : "none"}
          />
          <text x="460" y="94" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="bold">
            5NM e-Axle
          </text>
          <text x="460" y="113" textAnchor="middle" fill="#E0F2FE" fontSize="14">
            {torque.frontMotorTorqueNm} Nm
          </text>

          {/* Planetary Power Split Transmission Hub */}
          <circle cx="415" cy="97" r="14" fill="#0F172A" stroke="#E2E8F0" strokeWidth="2" />
          <text x="415" y="101" textAnchor="middle" fill="#E2E8F0" fontSize="14" fontWeight="bold">
            e
          </text>

          {/* High Voltage 18.1 kWh Underfloor Traction Battery Pack */}
          <rect
            x="290"
            y="180"
            width="220"
            height="145"
            rx="10"
            fill="url(#batteryGrad)"
            stroke="#0284C7"
            strokeWidth="2"
          />
          {/* Cell Matrix Pattern */}
          <g opacity="0.35" stroke="#FFFFFF" strokeWidth="1">
            <line x1="330" y1="180" x2="330" y2="325" />
            <line x1="370" y1="180" x2="370" y2="325" />
            <line x1="400" y1="180" x2="400" y2="325" />
            <line x1="430" y1="180" x2="430" y2="325" />
            <line x1="470" y1="180" x2="470" y2="325" />
            <line x1="290" y1="230" x2="510" y2="230" />
            <line x1="290" y1="280" x2="510" y2="280" />
          </g>
          <text x="400" y="212" textAnchor="middle" fill="#FFFFFF" fontSize="15" fontWeight="bold">
            18.1 kWh Traction Battery (355.2V)
          </text>
          <text x="400" y="240" textAnchor="middle" fill="#E0F2FE" fontSize="14" fontWeight="600">
            SoC: {state.stateOfCharge}% · Temp: {batteryTempC}°C
          </text>
          <text x="400" y="265" textAnchor="middle" fill="#BAE6FD" fontSize="14">
            96-Cell Series · Liquid Glycol Loop
          </text>
          <text x="400" y="292" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="500">
            Thermal Headroom: {(torque.thermalThrottlingFactor * 100).toFixed(0)}%
          </text>

          {/* High Voltage DC Bus Power Lines (Front to Battery, Battery to Rear) */}
          <path
            d="M 460 125 L 460 180"
            stroke="#38BDF8"
            strokeWidth="4"
            strokeDasharray={isFrontMotorActive ? "6 3" : "none"}
            className={isFrontMotorActive ? "animate-pulse" : ""}
          />
          <path
            d="M 400 325 L 400 365"
            stroke="#38BDF8"
            strokeWidth="4"
            strokeDasharray={isRearMotorActive ? "6 3" : "none"}
            className={isRearMotorActive ? "animate-pulse" : ""}
          />

          {/* Rear 4NM PMSM (E-Four Electric Drive Unit) */}
          <rect
            x="340"
            y="365"
            width="120"
            height="50"
            rx="6"
            fill={isRearMotorActive ? "url(#motorGrad)" : "#1E293B"}
            stroke={isRearMotorActive ? "#38BDF8" : "#475569"}
            strokeWidth="2"
            filter={isRearMotorActive ? "url(#glowCyan)" : "none"}
          />
          <text x="400" y="388" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="bold">
            4NM Rear E-Four
          </text>
          <text x="400" y="406" textAnchor="middle" fill="#E0F2FE" fontSize="14">
            {torque.rearMotorTorqueNm} Nm (40 kW Peak)
          </text>

          {/* Wheels with Torque Distribution & Vector Arrows */}

          {/* Front Left Wheel */}
          <g transform="translate(130, 85)">
            <rect x="0" y="0" width="55" height="70" rx="6" fill="#0F172A" stroke="#475569" strokeWidth="2.5" />
            <line x1="27" y1="0" x2="27" y2="70" stroke="#334155" strokeWidth="3" />
            {/* Torque arrow pointing forward */}
            <path
              d={`M 27 0 L 27 ${-flArrowLen}`}
              stroke="#38BDF8"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <polygon
              points={`22,${-flArrowLen + 6} 27,${-flArrowLen - 2} 32,${-flArrowLen + 6}`}
              fill="#38BDF8"
            />
            <text x="27" y="35" textAnchor="middle" fill="#F8FAFC" fontSize="14" fontWeight="bold">
              FL
            </text>
            <text x="27" y="55" textAnchor="middle" fill="#38BDF8" fontSize="14" fontWeight="bold">
              {torque.frontLeftTorqueNm}N
            </text>
          </g>

          {/* Front Right Wheel */}
          <g transform="translate(615, 85)">
            <rect x="0" y="0" width="55" height="70" rx="6" fill="#0F172A" stroke="#475569" strokeWidth="2.5" />
            <line x1="27" y1="0" x2="27" y2="70" stroke="#334155" strokeWidth="3" />
            <path
              d={`M 27 0 L 27 ${-frArrowLen}`}
              stroke="#38BDF8"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <polygon
              points={`22,${-frArrowLen + 6} 27,${-frArrowLen - 2} 32,${-frArrowLen + 6}`}
              fill="#38BDF8"
            />
            <text x="27" y="35" textAnchor="middle" fill="#F8FAFC" fontSize="14" fontWeight="bold">
              FR
            </text>
            <text x="27" y="55" textAnchor="middle" fill="#38BDF8" fontSize="14" fontWeight="bold">
              {torque.frontRightTorqueNm}N
            </text>
          </g>

          {/* Rear Left Wheel */}
          <g transform="translate(130, 355)">
            <rect x="0" y="0" width="55" height="70" rx="6" fill="#0F172A" stroke="#475569" strokeWidth="2.5" />
            <line x1="27" y1="0" x2="27" y2="70" stroke="#334155" strokeWidth="3" />
            <path
              d={`M 27 0 L 27 ${-rlArrowLen}`}
              stroke="#F43F5E"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <polygon
              points={`22,${-rlArrowLen + 6} 27,${-rlArrowLen - 2} 32,${-rlArrowLen + 6}`}
              fill="#F43F5E"
            />
            <text x="27" y="35" textAnchor="middle" fill="#F8FAFC" fontSize="14" fontWeight="bold">
              RL
            </text>
            <text x="27" y="55" textAnchor="middle" fill="#FDA4AF" fontSize="14" fontWeight="bold">
              {torque.rearLeftTorqueNm}N
            </text>
          </g>

          {/* Rear Right Wheel */}
          <g transform="translate(615, 355)">
            <rect x="0" y="0" width="55" height="70" rx="6" fill="#0F172A" stroke="#475569" strokeWidth="2.5" />
            <line x1="27" y1="0" x2="27" y2="70" stroke="#334155" strokeWidth="3" />
            <path
              d={`M 27 0 L 27 ${-rrArrowLen}`}
              stroke="#F43F5E"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <polygon
              points={`22,${-rrArrowLen + 6} 27,${-rrArrowLen - 2} 32,${-rrArrowLen + 6}`}
              fill="#F43F5E"
            />
            <text x="27" y="35" textAnchor="middle" fill="#F8FAFC" fontSize="14" fontWeight="bold">
              RR
            </text>
            <text x="27" y="55" textAnchor="middle" fill="#FDA4AF" fontSize="14" fontWeight="bold">
              {torque.rearRightTorqueNm}N
            </text>
          </g>

          {/* Lateral G Indicator Vector */}
          <g transform="translate(400, 470)">
            <line x1="-80" y1="0" x2="80" y2="0" stroke="#475569" strokeWidth="1.5" />
            <line x1="0" y1="-8" x2="0" y2="8" stroke="#64748B" strokeWidth="2" />
            <circle cx={state.lateralG * 80} cy="0" r="7" fill="#F43F5E" />
            <text x="0" y="24" textAnchor="middle" fill="#CBD5E1" fontSize="14">
              Lateral Acceleration: {state.lateralG.toFixed(2)} G (Yaw Vector Target)
            </text>
          </g>
        </svg>
      </div>

      {/* Status Callout Bar below graphic with strict >= 14px font size */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 mt-2 border-t border-slate-800 text-sm">
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          <div className="text-slate-400">Total System Power</div>
          <div className="text-lg font-bold font-mono text-slate-100">{torque.totalSystemPowerHp.toFixed(0)} HP ({torque.totalSystemPowerKw} kW)</div>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          <div className="text-slate-400">Battery C-Rate</div>
          <div className="text-lg font-bold font-mono text-cyan-400">{torque.cRate.toFixed(2)} C</div>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          <div className="text-slate-400">ICE Fuel Rate</div>
          <div className="text-lg font-bold font-mono text-amber-400">{torque.fuelConsumptionLph.toFixed(2)} L/hr</div>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          <div className="text-slate-400">MPC Solve Latency</div>
          <div className="text-lg font-bold font-mono text-emerald-400">{torque.mpcSolveTimeMs.toFixed(3)} ms (500 Hz)</div>
        </div>
      </div>
    </div>
  );
};
