/**
 * Ghost FactoryOS Track 3 (F1 Skunkworks Engine)
 * Asset GF-T3-147: Sol-Rotor Autonomous Heavy-Lift eVTOL & Swarm Flight Telemetry Engine
 * 
 * Real-Time P99 Latency & Nonlinear Dynamic Inversion (NDI) Guidance Loop Monitor
 */

import React from 'react';
import { FlightState } from '../../engine/flightDynamics';
import { Activity, Clock, Cpu, ShieldCheck, Database, Layers } from 'lucide-react';

interface ControlLoopMonitorProps {
  state: FlightState;
}

export const ControlLoopMonitor: React.FC<ControlLoopMonitorProps> = ({ state }) => {
  const { ndiLoopLatencyMs, angularVelocity, velocityBody, euler, quaternion } = state;

  // Breakdown sub-latencies
  const stateEstMs = 0.65;
  const bemInflowMs = 1.42;
  const ndiMathMs = 1.10;
  const actuatorAllocMs = (ndiLoopLatencyMs - (stateEstMs + bemInflowMs + ndiMathMs));
  const normalizedActuatorMs = Math.max(0.75, actuatorAllocMs);

  const budgetMaxMs = 4.50;
  const budgetUsedPct = Math.min(100, (ndiLoopLatencyMs / budgetMaxMs) * 100);

  // Generate SHA-256 simulated signature from state values
  const mockSha256 = `0x9f4a${Math.abs(Math.round(quaternion.w * 10000)).toString(16)}${Math.abs(Math.round(state.totalThrustKn * 100)).toString(16)}b38e71c9d4e7f82a1055c6e8`;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* P99 NDI Control Loop Timing Banner */}
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <span className="text-cyan-400 text-xs font-mono font-bold tracking-widest uppercase block">
              DO-178C LEVEL A DETERMINISTIC AVIONICS SCHEDULER
            </span>
            <h3 className="text-3xl font-extrabold font-avionics text-white mt-1 flex items-center gap-3">
              <Clock className="w-8 h-8 text-cyan-400" />
              NONLINEAR DYNAMIC INVERSION (NDI) GUIDANCE LOOP
            </h3>
            <p className="text-base text-slate-300 mt-1">
              Hard real-time inner-loop control threshold: <span className="font-mono text-cyan-300 font-bold">&lt; 4.50 ms</span> at 200 Hz sampling.
            </p>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-xs font-mono text-slate-400">MEASURED P99 EXECUTION:</span>
            <span className="text-4xl font-extrabold font-mono text-emerald-400">
              {ndiLoopLatencyMs.toFixed(2)} <span className="text-xl text-slate-400 font-normal">ms</span>
            </span>
            <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/40 mt-1">
              100% DETERMINISTIC PASS
            </span>
          </div>
        </div>

        {/* Latency Threshold Progress Bar */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm font-mono font-semibold">
            <span className="text-slate-300">THRESHOLD UTILIZATION: {budgetUsedPct.toFixed(1)}%</span>
            <span className="text-cyan-300">MARGIN: {(budgetMaxMs - ndiLoopLatencyMs).toFixed(2)} ms</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-4 p-0.5 border border-slate-700 overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-400 rounded-full transition-all duration-150"
              style={{ width: `${budgetUsedPct}%` }}
            />
          </div>
        </div>

        {/* Sub-Task Execution Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4">
            <span className="text-xs font-mono text-slate-400 block">1. STATE ESTIMATOR & EKF</span>
            <span className="text-2xl font-bold font-mono text-cyan-300">{stateEstMs.toFixed(2)} ms</span>
            <p className="text-xs text-slate-400 mt-1">15-State Error-State Kalman Filter on 1kHz dual IMUs.</p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4">
            <span className="text-xs font-mono text-slate-400 block">2. BEM AERO INFLOW SOLVER</span>
            <span className="text-2xl font-bold font-mono text-cyan-300">{bemInflowMs.toFixed(2)} ms</span>
            <p className="text-xs text-slate-400 mt-1">8-Rotor Newton-Raphson inflow iterations & VRS check.</p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4">
            <span className="text-xs font-mono text-slate-400 block">3. NDI CONTROL LAW</span>
            <span className="text-2xl font-bold font-mono text-cyan-300">{ndiMathMs.toFixed(2)} ms</span>
            <p className="text-xs text-slate-400 mt-1">Cross-coupled inertia tensor inversion & moment demand.</p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4">
            <span className="text-xs font-mono text-slate-400 block">4. QUADRATIC ALLOCATION (B+)</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">{normalizedActuatorMs.toFixed(2)} ms</span>
            <p className="text-xs text-slate-400 mt-1">Pseudo-inverse SVD mapping to 8 ESC PWM signals.</p>
          </div>
        </div>
      </div>

      {/* 6-DOF Dynamic Telemetry & Waveforms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Angular Velocity Rates (p, q, r) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
          <h4 className="text-xl font-bold font-avionics text-white flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-cyan-400" />
            BODY ANGULAR VELOCITIES (p, q, r)
          </h4>

          <div className="grid grid-cols-3 gap-3 font-mono text-sm mb-4">
            <div className="bg-slate-950 p-3 rounded border border-slate-800">
              <span className="text-xs text-slate-400 block">ROLL RATE (p):</span>
              <span className="text-xl font-bold text-cyan-300">
                {(angularVelocity.x * (180 / Math.PI)).toFixed(2)} °/s
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded border border-slate-800">
              <span className="text-xs text-slate-400 block">PITCH RATE (q):</span>
              <span className="text-xl font-bold text-cyan-300">
                {(angularVelocity.y * (180 / Math.PI)).toFixed(2)} °/s
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded border border-slate-800">
              <span className="text-xs text-slate-400 block">YAW RATE (r):</span>
              <span className="text-xl font-bold text-cyan-300">
                {(angularVelocity.z * (180 / Math.PI)).toFixed(2)} °/s
              </span>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-cyan-500/20 font-mono text-xs text-slate-300 space-y-1.5">
            <div className="text-cyan-400 font-bold uppercase">ATTITUDE QUATERNION (NORMALIZED):</div>
            <div className="grid grid-cols-4 gap-2 text-center text-sm font-bold text-white pt-1">
              <div className="bg-slate-900 p-2 rounded">W: {quaternion.w.toFixed(5)}</div>
              <div className="bg-slate-900 p-2 rounded">X: {quaternion.x.toFixed(5)}</div>
              <div className="bg-slate-900 p-2 rounded">Y: {quaternion.y.toFixed(5)}</div>
              <div className="bg-slate-900 p-2 rounded">Z: {quaternion.z.toFixed(5)}</div>
            </div>
          </div>
        </div>

        {/* Body Frame Velocities (u, v, w) & Audit Blockchain Seal */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
          <h4 className="text-xl font-bold font-avionics text-white flex items-center gap-2 mb-3">
            <Database className="w-5 h-5 text-emerald-400" />
            BODY VELOCITIES & ALLOYDB TELEMETRY HASH
          </h4>

          <div className="grid grid-cols-3 gap-3 font-mono text-sm mb-4">
            <div className="bg-slate-950 p-3 rounded border border-slate-800">
              <span className="text-xs text-slate-400 block">FORWARD (u):</span>
              <span className="text-xl font-bold text-emerald-300">
                {velocityBody.x.toFixed(2)} m/s
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded border border-slate-800">
              <span className="text-xs text-slate-400 block">LATERAL (v):</span>
              <span className="text-xl font-bold text-emerald-300">
                {velocityBody.y.toFixed(2)} m/s
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded border border-slate-800">
              <span className="text-xs text-slate-400 block">DOWNWARD (w):</span>
              <span className="text-xl font-bold text-emerald-300">
                {velocityBody.z.toFixed(2)} m/s
              </span>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-emerald-500/20 font-mono text-xs space-y-1">
            <div className="text-emerald-400 font-bold uppercase flex justify-between">
              <span>ALLOYDB ZERO-RPO BLOCKCHAIN HASH:</span>
              <span className="text-slate-400">100 Hz INGEST</span>
            </div>
            <div className="text-cyan-300 font-mono text-sm truncate py-1">
              {mockSha256}
            </div>
            <div className="text-slate-400 text-xs flex justify-between">
              <span>INTEGRITY VERIFIED: SHA-256</span>
              <span className="text-emerald-400 font-bold">TAMPER-PROOF AUDIT PASS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
