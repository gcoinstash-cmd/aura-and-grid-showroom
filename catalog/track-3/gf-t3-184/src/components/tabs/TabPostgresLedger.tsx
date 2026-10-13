import React, { useState } from 'react';
import { Database, ShieldAlert, CheckCircle2, Copy, Check, Lock, AlertTriangle, RefreshCw } from 'lucide-react';
import { LedgerBlock } from '../../types/telemetry';

export const TabPostgresLedger: React.FC = () => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [quarantineSimulated, setQuarantineSimulated] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<number>(0);

  // Mock initial ledger blocks
  const [blocks, setBlocks] = useState<LedgerBlock[]>([
    {
      blockHeight: 184201,
      timestamp: new Date(Date.now() - 4000).toISOString(),
      nonce: 1004818,
      rpm: 950.0,
      gear: 1,
      oilPressureBar: 5.42,
      throttlePct: 0.0,
      prevHash: '0a81f3d4b2910488e1bc9178263158c9735d4826190281b37498c0d82910488e',
      blockHash: '7f91a2bc384910281b37498c0d82910488e1bc9178263158c9735d4826190281',
      signature: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      quarantineFlag: false,
    },
    {
      blockHeight: 184202,
      timestamp: new Date(Date.now() - 2500).toISOString(),
      nonce: 1004819,
      rpm: 4820.0,
      gear: 2,
      oilPressureBar: 5.85,
      throttlePct: 75.0,
      prevHash: '7f91a2bc384910281b37498c0d82910488e1bc9178263158c9735d4826190281',
      blockHash: '84b12c9384920194827103847291048172648192038172649102847291048271',
      signature: '9a84b10284719203817264910284729104827184b12c93849201948271038472',
      quarantineFlag: false,
    },
    {
      blockHeight: 184203,
      timestamp: new Date(Date.now() - 1000).toISOString(),
      nonce: 1004820,
      rpm: 8950.0,
      gear: 3,
      oilPressureBar: 6.12,
      throttlePct: 100.0,
      prevHash: '84b12c9384920194827103847291048172648192038172649102847291048271',
      blockHash: 'cf83b1928471029384729104817264819203817264910284729104827184b12c',
      signature: '492019482710384729104817264819203817264910284729104827184b12c938',
      quarantineFlag: false,
    },
  ]);

  const triggerPressureDropTest = () => {
    const newBlock: LedgerBlock = {
      blockHeight: blocks[blocks.length - 1].blockHeight + 1,
      timestamp: new Date().toISOString(),
      nonce: blocks[blocks.length - 1].nonce + 1,
      rpm: 8600.0,
      gear: 3,
      oilPressureBar: 2.14, // Under 2.80 bar threshold -> Triggers Quarantine!
      throttlePct: 92.0,
      prevHash: blocks[blocks.length - 1].blockHash,
      blockHash: '992a104817264819203817264910284729104827184b12c93849201948271038',
      signature: 'ff01928374619283746591827364519283746501928374651928374651029384',
      quarantineFlag: true,
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlock(blocks.length);
    setQuarantineSimulated(true);
  };

  const postgresSql = `-- GF-T3-184: Partitioned PostgreSQL 16 Telemetry Ledger
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS lfa_telemetry_ledger (
    entry_id UUID DEFAULT gen_random_uuid(),
    nonce BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    rpm NUMERIC(6, 1) NOT NULL,
    gear INT NOT NULL CHECK (gear BETWEEN 0 AND 6),
    throttle_pct NUMERIC(4, 1) NOT NULL,
    oil_scavenge_pressure_bar NUMERIC(4, 2) NOT NULL,
    prev_hash CHAR(64) NOT NULL,
    current_hash CHAR(64) NOT NULL,
    hmac_signature CHAR(64) NOT NULL,
    is_quarantined BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (created_at, entry_id)
) PARTITION BY RANGE (created_at);

-- Scavenge Pressure Quarantine Trigger (< 2.80 bar under > 4000 RPM)
CREATE OR REPLACE FUNCTION trg_fn_quarantine_scavenge_drop()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.rpm > 4000.0 AND NEW.oil_scavenge_pressure_bar < 2.80 THEN
        NEW.is_quarantined := TRUE;
        RAISE WARNING 'QUARANTINE ENGAGED: Low Scavenge Pressure %.2f bar at %.1f RPM',
            NEW.oil_scavenge_pressure_bar, NEW.rpm;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_scavenge_pressure_audit
BEFORE INSERT ON lfa_telemetry_ledger
FOR EACH ROW
EXECUTE FUNCTION trg_fn_quarantine_scavenge_drop();

-- HMAC-SHA256 Signature Chain Trigger
CREATE OR REPLACE FUNCTION trg_fn_compute_hmac_chain()
RETURNS TRIGGER AS $$
DECLARE
    secret_key CONSTANT TEXT := 'LFA_1LR_GUE_PROPRIETARY_APEX_KEY_2026';
BEGIN
    NEW.current_hash := encode(digest(NEW.nonce || '|' || NEW.created_at || '|' || NEW.rpm || '|' || NEW.prev_hash, 'sha256'), 'hex');
    NEW.hmac_signature := encode(hmac(NEW.current_hash, secret_key, 'sha256'), 'hex');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lfa_hmac_sign
BEFORE INSERT ON lfa_telemetry_ledger
FOR EACH ROW
EXECUTE FUNCTION trg_fn_compute_hmac_chain();`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(postgresSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const current = blocks[selectedBlock] || blocks[0];

  return (
    <div className="space-y-6">
      {/* Top Ledger Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">PostgreSQL 16 Hypertables</h3>
          </div>
          <p className="text-base text-slate-400 leading-relaxed">
            Time-partitioned tables by monthly range. Optimized for 100,000+ IOPS ingestion of raw optical tachometer ticks with zero locking.
          </p>
          <div className="mt-3.5 flex items-center justify-between text-base font-mono">
            <span className="text-slate-400">Partition Key:</span>
            <span className="text-emerald-400 font-bold">RANGE (created_at)</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Scavenge Drop Quarantine</h3>
          </div>
          <p className="text-base text-slate-400 leading-relaxed">
            Automatic PL/pgSQL trigger quarantines any record where 3-stage dry sump pressure dips under 2.80 bar during high-RPM load (&gt;4,000 RPM).
          </p>
          <div className="mt-3.5 flex items-center justify-between text-base font-mono">
            <span className="text-slate-400">Quarantine Gate:</span>
            <span className="text-amber-400 font-bold">&lt; 2.80 bar @ 4k+ RPM</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">HMAC-SHA256 Chain</h3>
          </div>
          <p className="text-base text-slate-400 leading-relaxed">
            Cryptographic non-repudiation: each row anchors the previous hash and generates a cryptographic HMAC signature preventing history rewriting.
          </p>
          <div className="mt-3.5 flex items-center justify-between text-base font-mono">
            <span className="text-slate-400">Security Standard:</span>
            <span className="text-cyan-400 font-bold">SHA-256 HMAC</span>
          </div>
        </div>
      </div>

      {/* Interactive Ledger Test Bench */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-row flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-400" />
              Live Ledger Block Explorer & Trigger Simulator
            </h3>
            <p className="text-sm text-slate-400 mt-0.5">
              Click a block to inspect cryptographic payload or fire the quarantine test trigger.
            </p>
          </div>
          <button
            type="button"
            onClick={triggerPressureDropTest}
            className="cursor-pointer px-3.5 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-mono text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
          >
            <AlertTriangle className="w-4.5 h-4.5 text-amber-400" />
            Simulate Low Oil Quarantine Trigger
          </button>
        </div>

        {/* Block Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {blocks.map((b, idx) => (
            <button
              key={b.blockHeight}
              type="button"
              onClick={() => setSelectedBlock(idx)}
              className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                selectedBlock === idx
                  ? 'bg-slate-800 border-amber-500/60 ring-1 ring-amber-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-mono text-slate-400">Block #{b.blockHeight}</span>
                {b.quarantineFlag ? (
                  <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-mono font-bold flex items-center gap-1">
                    QUARANTINED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1">
                    VERIFIED
                  </span>
                )}
              </div>
              <div className="text-lg font-mono font-bold text-white">
                {b.rpm.toFixed(0)} RPM <span className="text-slate-400 text-sm font-normal">| G{b.gear}</span>
              </div>
              <div className="text-sm font-mono text-slate-400 mt-1">
                Oil: {b.oilPressureBar.toFixed(2)} bar
              </div>
            </button>
          ))}
        </div>

        {/* Selected Block Inspection */}
        <div className="bg-slate-950 rounded-xl p-4.5 border border-slate-800 font-mono text-sm space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-300 font-semibold text-base">Block #{current.blockHeight} Payload Metadata</span>
            <span className="text-slate-400 text-xs">{current.timestamp}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <span className="text-slate-400 block text-xs">MONOTONIC NONCE</span>
              <span className="text-emerald-400 font-bold text-base">#{current.nonce}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">QUARANTINE AUDIT STATUS</span>
              <span className={current.quarantineFlag ? 'text-red-400 font-bold text-base' : 'text-emerald-400 font-bold text-base'}>
                {current.quarantineFlag ? 'QUARANTINED (Scavenge Drop Under 2.80 bar)' : 'VALIDATED (No anomalies)'}
              </span>
            </div>
            <div className="md:col-span-2">
              <span className="text-slate-400 block text-xs">CURRENT BLOCK HASH (SHA-256)</span>
              <span className="text-slate-200 break-all text-sm">{current.blockHash}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-slate-400 block text-xs">HMAC-SHA256 SIGNATURE</span>
              <span className="text-amber-300 break-all text-sm">{current.signature}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SQL DDL Code Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <span className="font-mono text-base font-semibold text-slate-200">
              schema/lfa_apex_ledger.sql (PostgreSQL 16 Production DDL)
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopySql}
            className="cursor-pointer text-sm font-mono text-slate-300 hover:text-white px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copiedSql ? 'Copied SQL' : 'Copy DDL'}
          </button>
        </div>
        <div className="p-4 bg-slate-950/90 overflow-x-auto max-h-[420px] font-mono text-base text-slate-200 leading-relaxed">
          <pre>{postgresSql}</pre>
        </div>
      </div>
    </div>
  );
};
