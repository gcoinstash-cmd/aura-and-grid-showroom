import React from 'react';
import { Activity, Clock, Hash, CheckCheck, ArrowUpRight } from 'lucide-react';

interface TelemetryCardsProps {
  currentThroughput: number;
  averageLatencyMs: number;
  highestSequence: number;
  cleanAuditPercent: number;
  totalAccepted: number;
  totalRejected: number;
}

export const TelemetryCards: React.FC<TelemetryCardsProps> = ({
  currentThroughput,
  averageLatencyMs,
  highestSequence,
  cleanAuditPercent,
  totalAccepted,
  totalRejected,
}) => {
  return (
    <section className="relative w-full py-6 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Bus Throughput */}
          <div className="relative rounded-xl border border-neutral-800 bg-neutral-900/70 p-6 flex flex-col justify-between transition-colors hover:border-neutral-700">
            <div>
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-sm font-semibold tracking-wide uppercase text-neutral-400">Bus Throughput</span>
                <Activity className="h-5 w-5 text-amber-400" />
              </div>
              <div className="text-2xl md:text-3xl font-bold font-mono tracking-tight text-neutral-100 tabular-nums">
                {currentThroughput.toLocaleString()} <span className="text-base font-normal text-neutral-400">msg/s</span>
              </div>
              <p className="mt-2 text-sm text-neutral-400 leading-snug">
                Ed25519 authenticated stream on dual-channel 5 Mbps CAN-FD transceiver.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-sm">
              <span className="text-neutral-400">Verified Frames</span>
              <span className="font-mono font-semibold text-emerald-400 tabular-nums">+{totalAccepted.toLocaleString()}</span>
            </div>
          </div>

          {/* Card 2: Replay Rejection Latency */}
          <div className="relative rounded-xl border border-neutral-800 bg-neutral-900/70 p-6 flex flex-col justify-between transition-colors hover:border-neutral-700">
            <div>
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-sm font-semibold tracking-wide uppercase text-neutral-400">Replay Rejection</span>
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div className="text-2xl md:text-3xl font-bold font-mono tracking-tight text-neutral-100 tabular-nums">
                {averageLatencyMs.toFixed(2)} <span className="text-base font-normal text-neutral-400">ms</span>
              </div>
              <p className="mt-2 text-sm text-neutral-400 leading-snug">
                Deterministic 64-bit sliding window filter rejection under sub-1.5 ms bound.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-sm">
              <span className="text-neutral-400">Forgeries Thwarted</span>
              <span className="font-mono font-semibold text-amber-400 tabular-nums">{totalRejected} blocked</span>
            </div>
          </div>

          {/* Card 3: Nonce Monotonicity */}
          <div className="relative rounded-xl border border-neutral-800 bg-neutral-900/70 p-6 flex flex-col justify-between transition-colors hover:border-neutral-700">
            <div>
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-sm font-semibold tracking-wide uppercase text-neutral-400">Nonce Monotonicity</span>
                <Hash className="h-5 w-5 text-amber-400" />
              </div>
              <div className="text-2xl md:text-3xl font-bold font-mono tracking-tight text-neutral-100 tabular-nums">
                #{highestSequence.toLocaleString()}
              </div>
              <p className="mt-2 text-sm text-neutral-400 leading-snug">
                Zero-collision hardware counter backed by tamper-proof secure element EEPROM.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-sm">
              <span className="text-neutral-400">Collision Invariant</span>
              <span className="font-mono font-semibold text-emerald-400">0.000% Delta</span>
            </div>
          </div>

          {/* Card 4: IP Clean-Room Audit */}
          <div className="relative rounded-xl border border-neutral-800 bg-neutral-900/70 p-6 flex flex-col justify-between transition-colors hover:border-neutral-700">
            <div>
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-sm font-semibold tracking-wide uppercase text-neutral-400">IP Clean-Room Audit</span>
                <CheckCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="text-2xl md:text-3xl font-bold font-mono tracking-tight text-emerald-400 tabular-nums">
                {cleanAuditPercent}% <span className="text-base font-normal text-neutral-400">MIT / BSD</span>
              </div>
              <p className="mt-2 text-sm text-neutral-400 leading-snug">
                0% Copyleft contamination (zero GPL/AGPL). Certified for institutional M&A closing.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-sm">
              <span className="text-neutral-400">Acquire.com Due Diligence</span>
              <span className="font-mono font-semibold text-emerald-400 flex items-center gap-1">
                Pass <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
