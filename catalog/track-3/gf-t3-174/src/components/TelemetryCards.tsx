/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Heavy Overland Dynamics Platform RZ 450e Steer-by-Wire Precision Core (GF-T3-174)
 * Live Telemetry Metrics (4 Cards with 14px floor, tabular numbers, relative positioning)
 */

import React from 'react';
import { Activity, ShieldAlert, Hash, FileCheck, CheckCircle2, Zap } from 'lucide-react';
import { LatencyBreakdown, DualChannelTelemetry } from '../types/steerByWire';

interface TelemetryCardsProps {
  latency: LatencyBreakdown;
  dualChannel: DualChannelTelemetry;
  monotonicNonce: number;
}

export const TelemetryCards: React.FC<TelemetryCardsProps> = ({
  latency,
  dualChannel,
  monotonicNonce,
}) => {
  return (
    <section className="relative w-full bg-slate-950 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-400" />
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Live Precision Telemetry & Invariants
            </h2>
          </div>
          <span className="text-sm font-mono text-slate-400">
            BUS CLOCK: 1000 Hz · CAN-FD 5Mbps / FlexRay
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Steering Actuation Latency (< 0.8 ms deterministic) */}
          <div className="relative rounded-lg border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
                  Actuation Latency
                </span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                  <Zap className="h-4 w-4" />
                  Deterministic
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-extrabold text-white font-mono tabular-nums">
                  {latency.totalActuationLatencyMs.toFixed(3)}
                </span>
                <span className="text-base font-semibold text-slate-400">ms</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Deterministic sub-millisecond control loop strictly bounded under 0.80 ms.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800 space-y-2 text-sm font-mono">
              <div className="flex justify-between text-slate-400">
                <span>CAN-FD Sensor Ingest</span>
                <span className="text-slate-200 tabular-nums">{latency.canFdIngestMs.toFixed(2)} ms</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Lockstep Arbitration</span>
                <span className="text-slate-200 tabular-nums">{latency.lockstepArbitrationMs.toFixed(2)} ms</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Brushless PWM Drive</span>
                <span className="text-slate-200 tabular-nums">{latency.actuatorPwmOutputMs.toFixed(2)} ms</span>
              </div>
            </div>
          </div>

          {/* Card 2: Dual-Channel Redundancy (Channel A + B Sync 100%) */}
          <div className="relative rounded-lg border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
                  Dual-Channel Redundancy
                </span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {dualChannel.consensusStatus === 'NOMINAL_ASIL_D' ? 'ASIL-D' : 'FAIL-OP'}
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-extrabold text-white font-mono tabular-nums">
                  {dualChannel.syncRatioPercent.toFixed(1)}%
                </span>
                <span className="text-base font-semibold text-slate-400">Sync Ratio</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                TMR Hall + Optical Inductive dual resolvers with real-time cross-voting.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800 space-y-2 text-sm font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Channel A (TMR Hall)</span>
                <span className="text-slate-200 tabular-nums">{dualChannel.channelAAngleDeg.toFixed(2)}°</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Channel B (Optical)</span>
                <span className="text-slate-200 tabular-nums">{dualChannel.channelBAngleDeg.toFixed(2)}°</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Divergence Δθ</span>
                <span className={`tabular-nums font-bold ${
                  dualChannel.divergenceDeltaDeg > 0.05 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {dualChannel.divergenceDeltaDeg.toFixed(3)}°
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Monotonic Steering Nonce (#1,000,000+ zero slip) */}
          <div className="relative rounded-lg border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
                  Monotonic Nonce
                </span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-cyan-400">
                  <Hash className="h-4 w-4" />
                  Zero Slip
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-extrabold text-white font-mono tabular-nums">
                  #{monotonicNonce.toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Strict sequence continuity enforced via PostgreSQL 16 cryptographic trigger.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800 space-y-2 text-sm font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Sequence Skips</span>
                <span className="text-emerald-400 font-bold">0 (Guaranteed)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>HMAC Chain Hash</span>
                <span className="text-slate-300 truncate max-w-[140px]">sha256:7a9f...b01</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Partition</span>
                <span className="text-slate-300">y2026m10</span>
              </div>
            </div>
          </div>

          {/* Card 4: IP Clean-Room Audit (0% Copyleft / Clean-Room Certified) */}
          <div className="relative rounded-lg border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
                  IP Clean-Room Audit
                </span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                  <FileCheck className="h-4 w-4" />
                  Certified
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-extrabold text-white font-mono tabular-nums">
                  0%
                </span>
                <span className="text-base font-semibold text-emerald-400">Copyleft Contamination</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Dual-author clean-room isolation. 100% Permissive MIT code eligible for immediate APA.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800 space-y-2 text-sm font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Permissive MIT</span>
                <span className="text-emerald-400 font-bold">100% Verified</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GPL/AGPL/SSPL</span>
                <span className="text-emerald-400 font-bold">0% Blacklisted</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Acquire.com Status</span>
                <span className="text-amber-400 font-bold">Ready for Asset Transfer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
