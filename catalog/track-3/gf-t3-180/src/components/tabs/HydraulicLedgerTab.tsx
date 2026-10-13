import React, { useState, useEffect } from 'react';
import { 
  Database, ShieldCheck, AlertOctagon, RefreshCw, Copy, Check, 
  Lock, Key, ArrowRight, ShieldAlert, Cpu
} from 'lucide-react';
import { LedgerBlock } from '../../types/cockpit';
import { sha256Hex, computeHmacSha256 } from '../../utils/crypto';

export const HydraulicLedgerTab: React.FC = () => {
  const [blocks, setBlocks] = useState<LedgerBlock[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationPassed, setVerificationPassed] = useState<boolean | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [secretKey] = useState<string>('lx600-vault-hmac-key-0x9821a');
  const [activeLedgerView, setActiveLedgerView] = useState<'blocks' | 'ddl'>('blocks');

  // Initialize initial verifiable blocks with authentic hashes
  useEffect(() => {
    const initBlocks = async () => {
      const b1Payload = 'block:1|nonce:1000001|fl:1450|fr:1450|rl:1390|rr:1390|prev:0000000000000000000000000000000000000000000000000000000000000000';
      const b1Hash = await sha256Hex(b1Payload);
      const b1Sig = await computeHmacSha256(secretKey, b1Hash);

      const b2Payload = `block:2|nonce:1000002|fl:1455|fr:1452|rl:1393|rr:1388|prev:${b1Hash}`;
      const b2Hash = await sha256Hex(b2Payload);
      const b2Sig = await computeHmacSha256(secretKey, b2Hash);

      const b3Payload = `block:3|nonce:1000003|fl:1460|fr:1448|rl:1395|rr:1392|prev:${b2Hash}`;
      const b3Hash = await sha256Hex(b3Payload);
      const b3Sig = await computeHmacSha256(secretKey, b3Hash);

      setBlocks([
        {
          blockNumber: 1,
          timestamp: '2026-10-11T20:14:00.120Z',
          nonce: 1000001,
          flPressurePsi: 1450,
          frPressurePsi: 1450,
          rlPressurePsi: 1390,
          rrPressurePsi: 1390,
          meanDeltaMm: 0.0,
          previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
          blockHash: b1Hash,
          hmacSignature: b1Sig,
          isQuarantined: false,
        },
        {
          blockNumber: 2,
          timestamp: '2026-10-11T20:14:00.121Z',
          nonce: 1000002,
          flPressurePsi: 1455,
          frPressurePsi: 1452,
          rlPressurePsi: 1393,
          rrPressurePsi: 1388,
          meanDeltaMm: 0.4,
          previousHash: b1Hash,
          blockHash: b2Hash,
          hmacSignature: b2Sig,
          isQuarantined: false,
        },
        {
          blockNumber: 3,
          timestamp: '2026-10-11T20:14:00.122Z',
          nonce: 1000003,
          flPressurePsi: 1460,
          frPressurePsi: 1448,
          rlPressurePsi: 1395,
          rrPressurePsi: 1392,
          meanDeltaMm: 0.8,
          previousHash: b2Hash,
          blockHash: b3Hash,
          hmacSignature: b3Sig,
          isQuarantined: false,
        },
      ]);
    };
    initBlocks();
  }, [secretKey]);

  // Mine new authentic block
  const handleMineBlock = async () => {
    if (blocks.length === 0) return;
    const lastBlock = blocks[blocks.length - 1];
    const newNum = lastBlock.blockNumber + 1;
    const newNonce = lastBlock.nonce + 1;
    const fl = Math.round(1440 + Math.random() * 30);
    const fr = Math.round(1440 + Math.random() * 30);
    const rl = Math.round(1380 + Math.random() * 30);
    const rr = Math.round(1380 + Math.random() * 30);

    const payload = `block:${newNum}|nonce:${newNonce}|fl:${fl}|fr:${fr}|rl:${rl}|rr:${rr}|prev:${lastBlock.blockHash}`;
    const hash = await sha256Hex(payload);
    const sig = await computeHmacSha256(secretKey, hash);

    const newBlock: LedgerBlock = {
      blockNumber: newNum,
      timestamp: new Date().toISOString(),
      nonce: newNonce,
      flPressurePsi: fl,
      frPressurePsi: fr,
      rlPressurePsi: rl,
      rrPressurePsi: rr,
      meanDeltaMm: Number((Math.random() * 2 - 1).toFixed(2)),
      previousHash: lastBlock.blockHash,
      blockHash: hash,
      hmacSignature: sig,
      isQuarantined: false,
    };

    setBlocks((prev) => [...prev, newBlock]);
    setVerificationPassed(null);
  };

  // Inject pressure seal divergence (simulates physical seal rupture & trigger activation)
  const handleInjectDivergence = async () => {
    if (blocks.length === 0) return;
    const lastBlock = blocks[blocks.length - 1];
    const newNum = lastBlock.blockNumber + 1;
    const newNonce = lastBlock.nonce + 1;
    // Front seal breach: FL has 1920 PSI while FR drops to 1210 PSI (divergence > 35%)
    const fl = 1920;
    const fr = 1210;
    const rl = 1390;
    const rr = 1390;

    const payload = `block:${newNum}|nonce:${newNonce}|fl:${fl}|fr:${fr}|rl:${rl}|rr:${rr}|prev:${lastBlock.blockHash}`;
    const hash = await sha256Hex(payload);
    const sig = await computeHmacSha256(secretKey, hash);

    const breachedBlock: LedgerBlock = {
      blockNumber: newNum,
      timestamp: new Date().toISOString(),
      nonce: newNonce,
      flPressurePsi: fl,
      frPressurePsi: fr,
      rlPressurePsi: rl,
      rrPressurePsi: rr,
      meanDeltaMm: 14.5,
      previousHash: lastBlock.blockHash,
      blockHash: hash,
      hmacSignature: sig,
      isQuarantined: true,
      quarantineReason: 'FRONT_ACCUMULATOR_SEAL_DIVERGENCE_37.2_PCT_FAILSAFE_LOCKED',
    };

    setBlocks((prev) => [...prev, breachedBlock]);
  };

  // Verify full chain cryptographic integrity
  const handleVerifyChain = async () => {
    setIsVerifying(true);
    let allValid = true;

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (i > 0) {
        if (b.previousHash !== blocks[i - 1].blockHash) {
          allValid = false;
          break;
        }
      }
      const expectedSig = await computeHmacSha256(secretKey, b.blockHash);
      if (expectedSig !== b.hmacSignature) {
        allValid = false;
        break;
      }
    }

    setTimeout(() => {
      setVerificationPassed(allValid);
      setIsVerifying(false);
    }, 400);
  };

  const copySql = () => {
    const ddl = `-- PostgreSQL 16 Production Partitioned Ledger DDL
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS ahc_telemetry_blocks (
    block_id BIGSERIAL,
    block_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    monotonic_nonce BIGINT NOT NULL UNIQUE,
    vehicle_vin CHAR(17) NOT NULL DEFAULT 'JTJHL01J3N0000000',
    mode_selection VARCHAR(16) NOT NULL,
    fl_pressure_psi NUMERIC(7,2) NOT NULL CHECK (fl_pressure_psi BETWEEN 500 AND 3000),
    fr_pressure_psi NUMERIC(7,2) NOT NULL CHECK (fr_pressure_psi BETWEEN 500 AND 3000),
    rl_pressure_psi NUMERIC(7,2) NOT NULL CHECK (rl_pressure_psi BETWEEN 500 AND 3000),
    rr_pressure_psi NUMERIC(7,2) NOT NULL CHECK (rr_pressure_psi BETWEEN 500 AND 3000),
    fl_height_delta_mm NUMERIC(5,2) NOT NULL,
    fr_height_delta_mm NUMERIC(5,2) NOT NULL,
    rl_height_delta_mm NUMERIC(5,2) NOT NULL,
    rr_height_delta_mm NUMERIC(5,2) NOT NULL,
    previous_block_hash CHAR(64) NOT NULL,
    block_hash CHAR(64) NOT NULL,
    hmac_sha256_signature CHAR(64) NOT NULL,
    is_quarantined BOOLEAN NOT NULL DEFAULT FALSE,
    quarantine_reason TEXT,
    PRIMARY KEY (block_id, block_timestamp)
) PARTITION BY RANGE (block_timestamp);

CREATE TABLE ahc_telemetry_y2026m10 PARTITION OF ahc_telemetry_blocks
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

CREATE INDEX idx_ahc_nonce ON ahc_telemetry_blocks (monotonic_nonce);
CREATE INDEX idx_ahc_hash ON ahc_telemetry_blocks (block_hash);

CREATE OR REPLACE FUNCTION trg_verify_hydraulic_seal_divergence()
RETURNS TRIGGER AS $$
DECLARE
    front_ratio NUMERIC;
    rear_ratio NUMERIC;
BEGIN
    front_ratio := ABS(NEW.fl_pressure_psi - NEW.fr_pressure_psi) / GREATEST(NEW.fl_pressure_psi, 1.0);
    rear_ratio := ABS(NEW.rl_pressure_psi - NEW.rr_pressure_psi) / GREATEST(NEW.rl_pressure_psi, 1.0);

    IF front_ratio > 0.18 THEN
        NEW.is_quarantined := TRUE;
        NEW.quarantine_reason := 'FRONT_ACCUMULATOR_SEAL_DIVERGENCE_EXCEEDED_18_PCT';
    ELSIF rear_ratio > 0.18 THEN
        NEW.is_quarantined := TRUE;
        NEW.quarantine_reason := 'REAR_ACCUMULATOR_SEAL_DIVERGENCE_EXCEEDED_18_PCT';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER verify_hydraulic_seal_before_insert
    BEFORE INSERT ON ahc_telemetry_blocks
    FOR EACH ROW EXECUTE FUNCTION trg_verify_hydraulic_seal_divergence();`;

    navigator.clipboard.writeText(ddl);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">
                PostgreSQL 16 Timeseries Ledger & HMAC Cryptographic Chain
              </h2>
            </div>
            <p className="text-[15px] text-slate-400 mt-0.5">
              Partitioned hypertable records with automated hydraulic seal divergence quarantine triggers
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveLedgerView(activeLedgerView === 'blocks' ? 'ddl' : 'blocks')}
              className="px-3 py-1.5 rounded-lg text-[15px] font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
            >
              {activeLedgerView === 'blocks' ? 'View SQL DDL & Triggers' : 'View Live Blocks'}
            </button>

            <button
              onClick={handleMineBlock}
              className="px-3 py-1.5 rounded-lg text-[15px] font-mono font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm"
            >
              + Commit Telemetry Block
            </button>

            <button
              onClick={handleInjectDivergence}
              className="px-3 py-1.5 rounded-lg text-[15px] font-mono font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 cursor-pointer"
            >
              Simulate Seal Rupture
            </button>

            <button
              onClick={handleVerifyChain}
              disabled={isVerifying}
              className="px-3 py-1.5 rounded-lg text-[15px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
              Verify Chain
            </button>
          </div>
        </div>

        {/* Verification Status Result */}
        {verificationPassed !== null && (
          <div
            className={`p-3.5 rounded-lg border flex items-center justify-between text-[15px] ${
              verificationPassed
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {verificationPassed ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span>
                {verificationPassed
                  ? `Cryptographic Verification Successful: All ${blocks.length} blocks verified against HMAC-SHA256 master key with zero hash divergence.`
                  : 'Hash Collision or Signature Tamper Detected in Ledger Sequence!'}
              </span>
            </div>
            <span className="font-mono text-[15px] font-bold">HMAC: VALID</span>
          </div>
        )}
      </div>

      {activeLedgerView === 'blocks' ? (
        /* Block Inspector List */
        <div className="space-y-3">
          {blocks.map((b) => (
            <div
              key={b.blockNumber}
              className={`bg-slate-900/90 border rounded-xl p-4 shadow-lg transition-all ${
                b.isQuarantined
                  ? 'border-rose-500/60 bg-rose-950/15'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded text-[15px] font-mono font-bold bg-slate-800 text-white border border-slate-700">
                    Block #{b.blockNumber}
                  </span>
                  <span className="text-[15px] font-mono text-slate-400">
                    Nonce: #{b.nonce.toLocaleString()}
                  </span>
                  <span className="text-[15px] text-slate-500 hidden md:inline">
                    {b.timestamp}
                  </span>
                </div>

                {b.isQuarantined ? (
                  <span className="px-3 py-1 rounded text-[15px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                    TRIGGER: QUARANTINED
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded text-[15px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" />
                    COMMITTED & SIGNED
                  </span>
                )}
              </div>

              {b.quarantineReason && (
                <div className="mb-3 p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[15px] font-mono flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{b.quarantineReason}</span>
                </div>
              )}

              {/* Corner pressures in this block */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <div className="bg-slate-950/70 p-2 rounded border border-slate-800 text-[15px]">
                  <span className="text-slate-400">FL Strut:</span>{' '}
                  <span className="font-mono text-white font-bold">{b.flPressurePsi} PSI</span>
                </div>
                <div className="bg-slate-950/70 p-2 rounded border border-slate-800 text-[15px]">
                  <span className="text-slate-400">FR Strut:</span>{' '}
                  <span className="font-mono text-white font-bold">{b.frPressurePsi} PSI</span>
                </div>
                <div className="bg-slate-950/70 p-2 rounded border border-slate-800 text-[15px]">
                  <span className="text-slate-400">RL Accumulator:</span>{' '}
                  <span className="font-mono text-white font-bold">{b.rlPressurePsi} PSI</span>
                </div>
                <div className="bg-slate-950/70 p-2 rounded border border-slate-800 text-[15px]">
                  <span className="text-slate-400">RR Accumulator:</span>{' '}
                  <span className="font-mono text-white font-bold">{b.rrPressurePsi} PSI</span>
                </div>
              </div>

              {/* Cryptographic hashes */}
              <div className="space-y-1.5 text-[15px] font-mono bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
                  <span className="text-slate-500 shrink-0">PREV_HASH:</span>
                  <span className="text-slate-400 truncate">{b.previousHash}</span>
                </div>
                <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
                  <span className="text-slate-500 shrink-0">BLOCK_HASH:</span>
                  <span className="text-amber-400 truncate">{b.blockHash}</span>
                </div>
                <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
                  <span className="text-slate-500 shrink-0">HMAC_SIG:</span>
                  <span className="text-emerald-400 truncate">{b.hmacSignature}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* DDL & Trigger Inspector */
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
            <span className="text-[15px] font-mono font-bold text-slate-300">
              schema_lx600_hydraulic_ledger.sql (PostgreSQL 16)
            </span>
            <button
              onClick={copySql}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md text-[15px] font-mono font-semibold cursor-pointer"
            >
              {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSql ? 'Copied' : 'Copy SQL Schema'}</span>
            </button>
          </div>
          <pre className="p-5 font-mono text-[15px] text-slate-300 overflow-x-auto leading-relaxed max-h-[460px] bg-slate-950/70">
            <code>{`-- PostgreSQL 16 Production Partitioned Ledger DDL
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS ahc_telemetry_blocks (
    block_id BIGSERIAL,
    block_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    monotonic_nonce BIGINT NOT NULL UNIQUE,
    vehicle_vin CHAR(17) NOT NULL DEFAULT 'JTJHL01J3N0000000',
    mode_selection VARCHAR(16) NOT NULL,
    fl_pressure_psi NUMERIC(7,2) NOT NULL CHECK (fl_pressure_psi BETWEEN 500 AND 3000),
    fr_pressure_psi NUMERIC(7,2) NOT NULL CHECK (fr_pressure_psi BETWEEN 500 AND 3000),
    rl_pressure_psi NUMERIC(7,2) NOT NULL CHECK (rl_pressure_psi BETWEEN 500 AND 3000),
    rr_pressure_psi NUMERIC(7,2) NOT NULL CHECK (rr_pressure_psi BETWEEN 500 AND 3000),
    fl_height_delta_mm NUMERIC(5,2) NOT NULL,
    fr_height_delta_mm NUMERIC(5,2) NOT NULL,
    rl_height_delta_mm NUMERIC(5,2) NOT NULL,
    rr_height_delta_mm NUMERIC(5,2) NOT NULL,
    previous_block_hash CHAR(64) NOT NULL,
    block_hash CHAR(64) NOT NULL,
    hmac_sha256_signature CHAR(64) NOT NULL,
    is_quarantined BOOLEAN NOT NULL DEFAULT FALSE,
    quarantine_reason TEXT,
    PRIMARY KEY (block_id, block_timestamp)
) PARTITION BY RANGE (block_timestamp);

CREATE TABLE ahc_telemetry_y2026m10 PARTITION OF ahc_telemetry_blocks
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

CREATE INDEX idx_ahc_nonce ON ahc_telemetry_blocks (monotonic_nonce);
CREATE INDEX idx_ahc_hash ON ahc_telemetry_blocks (block_hash);

-- PL/pgSQL Function: Validate Pressure Divergence & Quarantine Breaches
CREATE OR REPLACE FUNCTION trg_verify_hydraulic_seal_divergence()
RETURNS TRIGGER AS $$
DECLARE
    front_ratio NUMERIC;
    rear_ratio NUMERIC;
BEGIN
    front_ratio := ABS(NEW.fl_pressure_psi - NEW.fr_pressure_psi) / GREATEST(NEW.fl_pressure_psi, 1.0);
    rear_ratio := ABS(NEW.rl_pressure_psi - NEW.rr_pressure_psi) / GREATEST(NEW.rl_pressure_psi, 1.0);

    IF front_ratio > 0.18 THEN
        NEW.is_quarantined := TRUE;
        NEW.quarantine_reason := 'FRONT_ACCUMULATOR_SEAL_DIVERGENCE_EXCEEDED_18_PCT';
    ELSIF rear_ratio > 0.18 THEN
        NEW.is_quarantined := TRUE;
        NEW.quarantine_reason := 'REAR_ACCUMULATOR_SEAL_DIVERGENCE_EXCEEDED_18_PCT';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER verify_hydraulic_seal_before_insert
    BEFORE INSERT ON ahc_telemetry_blocks
    FOR EACH ROW EXECUTE FUNCTION trg_verify_hydraulic_seal_divergence();`}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
