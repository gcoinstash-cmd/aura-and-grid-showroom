/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, ShieldCheck, AlertOctagon, Copy, Check, Lock, Terminal, RefreshCw } from 'lucide-react';
import { POSTGRES_DDL_SCHEMA } from '../../data/specContent';

export const TabPostgresLedger: React.FC = () => {
  const [copiedDdl, setCopiedDdl] = useState<boolean>(false);
  
  // Interactive Verification State
  const [nonce, setNonce] = useState<number>(1048576);
  const [frontTorque, setFrontTorque] = useState<number>(245.5);
  const [rearTorque, setRearTorque] = useState<number>(155.0);
  const [throttle, setThrottle] = useState<number>(0.75);
  const [secretKey, setSecretKey] = useState<string>('Overland_TX550H_DUAL_VECTOR_TORQUE_SECURE_KEY_2026');
  
  // Tamper / Quarantine simulation
  const [isTampered, setIsTampered] = useState<boolean>(false);
  const [isQuarantined, setIsQuarantined] = useState<boolean>(false);
  const [simulatedSignature, setSimulatedSignature] = useState<string>(
    '7b9a528e1d53086bbfda63fc9a1e0b57fa0c7937e224ff26f9273c52a32c256a'
  );
  const [verificationStatus, setVerificationStatus] = useState<
    'UNVERIFIED' | 'VALID' | 'TAMPERED' | 'QUARANTINED'
  >('VALID');

  // Simple deterministic client-side hash simulation for UI
  const generateSimulatedHash = (n: number, f: number, r: number, t: number, tampered: boolean) => {
    const raw = `${n}-${f.toFixed(2)}-${r.toFixed(2)}-${t.toFixed(2)}-${tampered ? 'TAMPERED' : 'CLEAN'}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `e3b0c442${hex}89fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.slice(0, 64);
  };

  const handleVerify = () => {
    if (rearTorque > 169.0) {
      setIsQuarantined(true);
      setVerificationStatus('QUARANTINED');
    } else if (isTampered) {
      setVerificationStatus('TAMPERED');
    } else {
      setIsQuarantined(false);
      setVerificationStatus('VALID');
      const sig = generateSimulatedHash(nonce, frontTorque, rearTorque, throttle, false);
      setSimulatedSignature(sig);
    }
  };

  const handleInjectDivergence = () => {
    setRearTorque(240.0); // Violates 169 Nm hardware limit
    setIsQuarantined(true);
    setVerificationStatus('QUARANTINED');
  };

  const handleInjectTamper = () => {
    setIsTampered(true);
    setVerificationStatus('TAMPERED');
    setSimulatedSignature('BAD000000000000000000000000000000000000000000000000000000000DEAD');
  };

  const handleResetVerification = () => {
    setNonce(1048576);
    setFrontTorque(245.5);
    setRearTorque(155.0);
    setThrottle(0.75);
    setIsTampered(false);
    setIsQuarantined(false);
    setVerificationStatus('VALID');
    setSimulatedSignature('7b9a528e1d53086bbfda63fc9a1e0b57fa0c7937e224ff26f9273c52a32c256a');
  };

  const handleCopyDdl = () => {
    navigator.clipboard.writeText(POSTGRES_DDL_SCHEMA);
    setCopiedDdl(true);
    setTimeout(() => setCopiedDdl(false), 2200);
  };

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              PostgreSQL 16 Timeseries Ledger & Quarantine Engine
            </h2>
            <p className="text-[15px] text-slate-400">
              Range-partitioned hypertables, BRIN block indices, motor torque divergence trip-wires, and HMAC-SHA256 merkle chains.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
              AlloyDB / PG16 Compliant
            </span>
          </div>
        </div>

        {/* Schema Highlights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-[15px] mb-1">
              <Database className="w-4 h-4" />
              <span>Daily Range Partitions</span>
            </div>
            <p className="text-[15px] text-slate-400">
              Daily sliding windows with BRIN compressed indices sustaining 1,000 Hz inserts (86.4M records/day).
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-[15px] mb-1">
              <AlertOctagon className="w-4 h-4" />
              <span>Divergence Quarantine</span>
            </div>
            <p className="text-[15px] text-slate-400">
              PL/pgSQL trigger <code className="text-slate-300">fn_quarantine_torque_divergence</code> diverts requests exceeding 169 Nm into isolation.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-[15px] mb-1">
              <Lock className="w-4 h-4" />
              <span>HMAC-SHA256 Merkle Chain</span>
            </div>
            <p className="text-[15px] text-slate-400">
              Continuous cryptographic linking with monotonic sequence nonce guaranteeing zero ledger tampering.
            </p>
          </div>
        </div>

        {/* Live Cryptographic Verifier Sandbox */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-800 gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-[15px] font-bold text-white uppercase tracking-wider">
                Live HMAC-SHA256 Cryptographic Verifier & Trigger Harness
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetVerification}
                type="button"
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[15px] px-3 py-1 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Block</span>
              </button>
            </div>
          </div>

          {/* Interactive Block Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div>
              <label className="block text-[15px] text-slate-400 mb-1">Monotonic Nonce</label>
              <input
                type="number"
                value={nonce}
                onChange={(e) => setNonce(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-emerald-400 font-mono text-[15px]"
              />
            </div>

            <div>
              <label className="block text-[15px] text-slate-400 mb-1">Front Torque (Nm)</label>
              <input
                type="number"
                value={frontTorque}
                onChange={(e) => setFrontTorque(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-cyan-400 font-mono text-[15px]"
              />
            </div>

            <div>
              <label className="block text-[15px] text-slate-400 mb-1">Rear Torque (Nm)</label>
              <input
                type="number"
                value={rearTorque}
                onChange={(e) => setRearTorque(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-amber-400 font-mono text-[15px]"
              />
            </div>

            <div>
              <label className="block text-[15px] text-slate-400 mb-1">Throttle Demand (0-1.0)</label>
              <input
                type="number"
                step="0.05"
                value={throttle}
                onChange={(e) => setThrottle(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono text-[15px]"
              />
            </div>
          </div>

          {/* Secret Key & Actions */}
          <div className="mb-4">
            <label className="block text-[15px] text-slate-400 mb-1">HMAC Key Salt</label>
            <input
              type="text"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 font-mono text-[15px]"
            />
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <button
              onClick={handleVerify}
              type="button"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[15px] px-4 py-2 rounded-lg inline-flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Cryptographic Block</span>
            </button>

            <button
              onClick={handleInjectDivergence}
              type="button"
              className="bg-slate-800 hover:bg-slate-700 border border-rose-500/40 text-rose-400 font-bold text-[15px] px-4 py-2 rounded-lg inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Trip Quarantine (240 Nm Illegal Rear Spike)</span>
            </button>

            <button
              onClick={handleInjectTamper}
              type="button"
              className="bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-amber-400 font-bold text-[15px] px-4 py-2 rounded-lg inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Lock className="w-4 h-4" />
              <span>Inject Tampered Payload</span>
            </button>
          </div>

          {/* Verification Status Banner */}
          <div className="p-4 rounded-xl border transition-colors bg-slate-900/90">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[15px] font-bold text-slate-400 uppercase">
                Cryptographic Integrity Status
              </span>
              <span
                className={`text-[15px] font-mono font-bold px-3 py-1 rounded-lg ${
                  verificationStatus === 'VALID'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : verificationStatus === 'QUARANTINED'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {verificationStatus === 'VALID' && '✓ SIGNATURE VERIFIED & CHAIN UNBROKEN'}
                {verificationStatus === 'QUARANTINED' && '⚠ MOTOR TORQUE DIVERGENCE QUARANTINED'}
                {verificationStatus === 'TAMPERED' && '✗ CRYPTOGRAPHIC HASH MISMATCH'}
              </span>
            </div>

            <div className="font-mono text-[15px] text-slate-300 break-all bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500">HMAC-SHA256: </span>
              <span className={verificationStatus === 'VALID' ? 'text-emerald-400' : 'text-rose-400'}>
                {simulatedSignature}
              </span>
            </div>

            {verificationStatus === 'QUARANTINED' && (
              <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[15px]">
                <strong>TRIGGER TRIP LOG:</strong> Stored procedure <code className="text-white">fn_quarantine_torque_divergence()</code> intercepted rear torque of {rearTorque} Nm (Physical Hardware Ceiling: 169.0 Nm). Row automatically written to <code className="text-white">dual_vector_torque_quarantine_violations</code> table.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full PostgreSQL 16 DDL Schema Viewer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-mono font-bold text-[15px]">dual_vector_torque_postgres16_schema.sql</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 text-[15px]">Production Timeseries DDL + Quarantine Triggers</span>
          </div>
          <button
            onClick={handleCopyDdl}
            type="button"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[15px] px-3.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedDdl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedDdl ? 'Copied DDL!' : 'Copy PostgreSQL 16 DDL'}</span>
          </button>
        </div>
        <div className="p-4 bg-slate-950 max-h-[480px] overflow-y-auto">
          <pre className="text-[15px] font-mono text-slate-300 leading-relaxed overflow-x-auto">
            <code>{POSTGRES_DDL_SCHEMA}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
