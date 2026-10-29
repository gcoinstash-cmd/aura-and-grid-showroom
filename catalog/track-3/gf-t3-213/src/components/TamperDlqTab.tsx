/**
 * APEX-213 Cryptographic Audit Trail & Dead-Letter Queue (DLQ) Matrix
 * Rolling SHA-256 Hash Chain Verification & Stale Mutation Capture
 * Strictly 14px+ typographic floor. Dimensionless unit telemetry.
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Bug,
  CheckCircle2,
  XCircle,
  Inbox,
  ArrowRight,
} from 'lucide-react';
import { ClientCQRSEngine } from '../engine/cqrsEngine';

interface TamperDlqTabProps {
  engine: ClientCQRSEngine;
  onRefresh: () => void;
}

export const TamperDlqTab: React.FC<TamperDlqTabProps> = ({ engine, onRefresh }) => {
  const [tamperSeq, setTamperSeq] = useState<number>(2);
  const [tamperUnits, setTamperUnits] = useState<number>(999999);
  const [auditResult, setAuditResult] = useState(engine.verifyCryptographicAuditChain());

  const handleRunAudit = () => {
    const res = engine.verifyCryptographicAuditChain();
    setAuditResult(res);
    onRefresh();
  };

  const handleInjectTamper = () => {
    const success = engine.tamperPayload(tamperSeq, tamperUnits);
    if (success) {
      const res = engine.verifyCryptographicAuditChain();
      setAuditResult(res);
      onRefresh();
    }
  };

  const handleRestoreIntegrity = () => {
    engine.recalculateHashChain();
    const res = engine.verifyCryptographicAuditChain();
    setAuditResult(res);
    onRefresh();
  };

  const dlqRecords = engine.dlq;

  return (
    <div className="space-y-6">
      {/* Cryptographic SHA-256 Audit Card */}
      <div className="bg-[#0B111E] border border-slate-800 rounded-lg p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              {auditResult.valid ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              )}
              Rolling Cryptographic SHA-256 Audit Chain
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Every committed event envelope cryptographically seals the previous envelope hash. Any unauthorized modification to an event payload destroys chain continuity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunAudit}
              className="min-h-[44px] px-5 py-2.5 text-base font-bold bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 rounded-md transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              Run Full Audit Scan
            </button>
          </div>
        </div>

        {/* Audit Status Banner */}
        {auditResult.valid ? (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <div className="font-bold text-emerald-300">
                AUDIT VERIFIED: ALL {auditResult.inspected_count} EVENT ENVELOPES CRYPTOGRAPHICALLY SECURE
              </div>
              <p className="text-slate-300">
                Zero tamper detected. Monotonic sequence ordering, previous hash pointers, and payload preimages match canonical SHA-256 seals.
              </p>
              {auditResult.head_hash && (
                <div className="font-mono text-sm text-slate-400 break-all pt-1">
                  Verified Head Hash: {auditResult.head_hash}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-rose-950/50 border border-rose-500/60 rounded-lg flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <div className="font-bold text-rose-300 text-base">
                CRYPTOGRAPHIC INTEGRITY ALERT: TAMPER DETECTED AT SEQUENCE #{auditResult.tamper_detected_at_sequence}
              </div>
              <p className="text-slate-200">
                {auditResult.error_reason}
              </p>
              <div className="p-3 bg-slate-950/80 rounded border border-rose-500/40 font-mono text-sm space-y-1">
                {auditResult.recorded_hash && (
                  <div>
                    <span className="text-slate-400">Recorded Seal:</span>{' '}
                    <span className="text-slate-300 break-all">{auditResult.recorded_hash}</span>
                  </div>
                )}
                {auditResult.recomputed_hash && (
                  <div>
                    <span className="text-slate-400">Computed Hash:</span>{' '}
                    <span className="text-rose-400 font-bold break-all">{auditResult.recomputed_hash}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tamper Simulation Console */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Bug className="w-4 h-4 text-rose-400" />
              Cryptographic Attack & Tamper Verification Harness
            </span>
            <span className="text-sm font-mono text-slate-400">
              Interactive Test Suite Invariant
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300">
                Target Historical Sequence to Mutate
              </label>
              <input
                type="number"
                min="1"
                max={Math.max(1, engine.globalSequence)}
                value={tamperSeq}
                onChange={(e) => setTamperSeq(Number(e.target.value))}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm font-mono bg-slate-950 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300">
                Malicious Injected Units Value
              </label>
              <input
                type="number"
                value={tamperUnits}
                onChange={(e) => setTamperUnits(Number(e.target.value))}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm font-mono bg-slate-950 border border-slate-700 rounded-md text-rose-300 focus:outline-none focus:border-rose-400"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={handleInjectTamper}
              className="min-h-[44px] px-5 py-2.5 text-base font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/50 rounded-md transition-all flex items-center gap-2"
            >
              <Bug className="w-4 h-4 text-rose-400" />
              Inject Malicious Payload Mutation at Sequence #{tamperSeq}
            </button>

            <button
              onClick={handleRestoreIntegrity}
              className="min-h-[44px] px-5 py-2.5 text-base font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/50 rounded-md transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Recalculate &amp; Re-Seal Chain (Restore Integrity)
            </button>
          </div>
        </div>
      </div>

      {/* Dead-Letter Queue (DLQ) Table */}
      <div className="bg-[#0B111E] border border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Inbox className="w-5 h-5 text-amber-400" />
              Dead-Letter Queue (DLQ) &amp; Out-of-Order Rejection Matrix
            </h4>
            <p className="text-sm text-slate-400 mt-0.5">
              Mutations violating OCC aggregate version constraints or business invariants are rejected from the write log and preserved here for audit.
            </p>
          </div>
          <span className="font-mono text-sm px-3 py-1 bg-slate-900 border border-slate-800 rounded text-amber-400 font-bold">
            {dlqRecords.length + ' Rejected Records'}
          </span>
        </div>

        {dlqRecords.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400 bg-slate-950/50 rounded-lg border border-dashed border-slate-800">
            Dead-Letter Queue is currently empty. Use "Force OCC Collision Race" in the Command Bus tab to witness automated capture of stale mutations.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">DLQ Record ID</th>
                  <th className="py-2.5 px-3">Corridor</th>
                  <th className="py-2.5 px-3">Error Code</th>
                  <th className="py-2.5 px-3">Collision Reason</th>
                  <th className="py-2.5 px-3 text-right">Raw Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {dlqRecords.map((r) => (
                  <tr key={r.record_id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-3 text-cyan-300 font-bold">
                      {r.record_id}
                    </td>
                    <td className="py-3 px-3 text-slate-300 truncate max-w-[140px]">
                      {r.corridor_id}
                    </td>
                    <td className="py-3 px-3 text-rose-400 font-semibold">
                      {r.error_code}
                    </td>
                    <td className="py-3 px-3 text-slate-200">
                      {r.reason}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
                        {JSON.stringify(r.raw_payload).slice(0, 30) + '...'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
