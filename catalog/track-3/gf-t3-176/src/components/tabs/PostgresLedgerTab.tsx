import React, { useState } from 'react';
import { Database, Copy, Check, Play, AlertOctagon, CheckCircle2, ShieldCheck, Terminal } from 'lucide-react';
import { POSTGRES_TERRAIN_LEDGER_SQL } from '../../data/sqlSchema';
import { LedgerBlock } from '../../types/terrain';

export const PostgresLedgerTab: React.FC = () => {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [activeQuery, setActiveQuery] = useState<string>('SELECT_RECENT_BLOCKS');
  const [quarantineTriggered, setQuarantineTriggered] = useState<boolean>(false);

  // Initial sequential blocks
  const [blocks, setBlocks] = useState<LedgerBlock[]>([
    {
      blockHeight: 1000424,
      recordedAt: '2026-10-11T16:54:30.100Z',
      partitionName: 'terrain_telemetry_2026_m10',
      pitchDeg: 14.8,
      rollDeg: -8.4,
      articulationInches: 22.8,
      torsenSplit: '50:50',
      rearDiffLocked: true,
      prevHash: '7a1f8b3c9d2e4051a82649b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3',
      blockHash: '0x8f2ac94b8e721a3b9012f45811cba908d1f2e456c7890abcdef1234567890abc',
      hmacSha256: '0x9942aef01823bb456cde789012345678abcdef0123456789abcdef0123456789',
      quarantined: false,
    },
    {
      blockHeight: 1000423,
      recordedAt: '2026-10-11T16:54:30.000Z',
      partitionName: 'terrain_telemetry_2026_m10',
      pitchDeg: 14.2,
      rollDeg: -7.9,
      articulationInches: 21.4,
      torsenSplit: '40:60',
      rearDiffLocked: false,
      prevHash: '4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c',
      blockHash: '7a1f8b3c9d2e4051a82649b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3',
      hmacSha256: '0x384faec49204018eacbf09419401bca0194819eacba940184bacc410948ac019',
      quarantined: false,
    },
    {
      blockHeight: 1000422,
      recordedAt: '2026-10-11T16:54:29.900Z',
      partitionName: 'terrain_telemetry_2026_m10',
      pitchDeg: 13.9,
      rollDeg: -6.8,
      articulationInches: 18.2,
      torsenSplit: '40:60',
      rearDiffLocked: false,
      prevHash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      blockHash: '4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c',
      hmacSha256: '0x718aef829104019bca0194819eacba940184bacc410948ac0194819eacba9401',
      quarantined: false,
    },
    {
      blockHeight: 1000421,
      recordedAt: '2026-10-11T16:54:29.800Z',
      partitionName: 'terrain_telemetry_2026_m10',
      pitchDeg: 12.5,
      rollDeg: -4.5,
      articulationInches: 14.5,
      torsenSplit: '40:60',
      rearDiffLocked: false,
      prevHash: '9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d',
      blockHash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      hmacSha256: '0x9948ac0194819eacba940184bacc410948ac0194819eacba940184bacc410948',
      quarantined: false,
    },
  ]);

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(POSTGRES_TERRAIN_LEDGER_SQL);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleInjectSlipAnomaly = () => {
    const anomalousBlock: LedgerBlock = {
      blockHeight: 1000425,
      recordedAt: new Date().toISOString(),
      partitionName: 'terrain_telemetry_2026_m10',
      pitchDeg: 28.5,
      rollDeg: -19.4,
      articulationInches: 24.2,
      torsenSplit: '30:70',
      rearDiffLocked: true,
      prevHash: blocks[0].blockHash,
      blockHash: '0xee91a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3',
      hmacSha256: '0xQUARANTINED_SLIP_DESYNC_SIG_89a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6',
      quarantined: true,
    };
    setBlocks([anomalousBlock, ...blocks]);
    setQuarantineTriggered(true);
  };

  return (
    <div className="relative w-full space-y-8 p-6 md:p-8 bg-neutral-950 text-neutral-100">
      
      {/* Intro Header */}
      <div className="border-b border-neutral-800 pb-5">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          PostgreSQL 16 Terrain Ledger & Cryptographic Chain
        </h2>
        <p className="mt-2 text-[16px] text-neutral-400 max-w-4xl leading-relaxed">
          High-throughput partitioned timeseries tables partitioned by month. Stores 100 Hz kinematic vectors, LVDT stroke differentials, and real-time HMAC-SHA256 signature chains. Includes automatic database triggers to quarantine anomalous slip desync events.
        </p>
      </div>

      {/* Control Strip & Quarantine Simulation */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 md:p-5 bg-neutral-900 border border-neutral-800 rounded-xl">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-sky-400" />
          <span className="text-base font-semibold text-white">
            Partition Table: <span className="font-mono text-sky-300">terrain_vault.terrain_telemetry_2026_m10</span>
          </span>
          <span className="text-neutral-500">|</span>
          <span className="text-base text-emerald-400 font-mono flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="w-5 h-5" />
            HMAC Chain: UNBROKEN
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleInjectSlipAnomaly}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-200 border border-rose-500/50 font-bold text-base rounded-xl transition-colors cursor-pointer"
          >
            <AlertOctagon className="w-5 h-5 text-rose-400" />
            <span>Simulate Slip Event Quarantine Trigger</span>
          </button>
        </div>
      </div>

      {/* Quarantine Alert if fired */}
      {quarantineTriggered && (
        <div className="p-5 bg-rose-950/40 border border-rose-600/60 rounded-xl text-rose-200 flex items-start gap-4 animate-in fade-in">
          <AlertOctagon className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h4 className="text-lg font-bold text-white">
              PostgreSQL Trigger Fired: trg_quarantine_slip_events
            </h4>
            <p className="text-base text-rose-200 leading-relaxed">
              Cross-axle stroke delta reached 8.5" while Dynamic Kinetic Suspension Telemetry was in transition. Row flagged with <code className="bg-rose-900/60 px-1.5 py-0.5 rounded text-white font-mono font-bold">quarantined = TRUE</code> and audit recorded in <code className="bg-rose-900/60 px-1.5 py-0.5 rounded text-white font-mono font-bold">quarantine_slip_log</code>.
            </p>
          </div>
        </div>
      )}

      {/* Interactive SQL Query Workbench */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            <h3 className="text-xl font-bold text-white">Live Query Runner</h3>
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            {[
              { id: 'SELECT_RECENT_BLOCKS', label: 'Recent Blocks (BRIN Scan)' },
              { id: 'VERIFY_HMAC_CHAIN', label: 'Audit HMAC Signatures' },
              { id: 'QUARANTINE_LOGS', label: 'Quarantined Slip Outliers' },
            ].map((q) => (
              <button
                key={q.id}
                onClick={() => setActiveQuery(q.id)}
                className={`px-3.5 py-2 text-base rounded-lg border font-semibold transition-colors cursor-pointer ${
                  activeQuery === q.id
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Displaying Live Table Results */}
        <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/80 text-base font-mono text-neutral-400">
                <th className="py-3.5 px-4">BLOCK #</th>
                <th className="py-3.5 px-4">RECORDED AT</th>
                <th className="py-3.5 px-4">PITCH / ROLL</th>
                <th className="py-3.5 px-4">ARTICULATION</th>
                <th className="py-3.5 px-4">TORSEN / LOCKER</th>
                <th className="py-3.5 px-4">HMAC-SHA256 SIGNATURE</th>
                <th className="py-3.5 px-4">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-base font-mono">
              {blocks.map((b) => (
                <tr key={b.blockHeight} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-amber-400 num-tabular">
                    #{b.blockHeight}
                  </td>
                  <td className="py-3.5 px-4 text-neutral-200">
                    {b.recordedAt.replace('T', ' ').replace('Z', '')}
                  </td>
                  <td className="py-3.5 px-4 text-neutral-100">
                    {b.pitchDeg}° / {b.rollDeg}°
                  </td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold num-tabular">
                    {b.articulationInches}"
                  </td>
                  <td className="py-3.5 px-4 text-neutral-200">
                    {b.torsenSplit} {b.rearDiffLocked && <span className="text-amber-400 font-bold">[REAR LOCKED]</span>}
                  </td>
                  <td className="py-3.5 px-4 text-neutral-300 truncate max-w-xs" title={b.hmacSha256}>
                    {b.hmacSha256.slice(0, 18)}...{b.hmacSha256.slice(-8)}
                  </td>
                  <td className="py-3.5 px-4">
                    {b.quarantined ? (
                      <span className="px-3 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-base">
                        QUARANTINED
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-base">
                        COMMITTED
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center text-base text-neutral-400 pt-1">
          <span>Executed in: <strong className="text-emerald-400 font-mono font-bold">1.12 ms</strong> via BRIN scan</span>
          <span>Rows: <strong className="text-white font-mono font-bold">{blocks.length}</strong></span>
        </div>
      </div>

      {/* Production PostgreSQL 16 DDL Script Display */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-neutral-950 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-mono font-bold text-white">
              schema/terrain_ledger_partitioned.sql
            </span>
            <span className="text-[15px] px-2.5 py-0.5 rounded bg-sky-500/10 text-sky-400 font-mono border border-sky-500/20">
              PostgreSQL 16 Enterprise DDL
            </span>
          </div>

          <button
            onClick={handleCopySql}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[15px] font-medium transition-colors cursor-pointer"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-neutral-400" />}
            <span>{isCopied ? 'Copied to Clipboard' : 'Copy SQL Schema'}</span>
          </button>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto bg-neutral-950 text-neutral-300 font-mono text-[15px] leading-relaxed">
          <pre><code>{POSTGRES_TERRAIN_LEDGER_SQL}</code></pre>
        </div>
      </div>

    </div>
  );
};
