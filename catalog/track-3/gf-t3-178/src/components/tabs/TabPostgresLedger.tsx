import React, { useState } from 'react';
import { Database, Copy, Check, Terminal, ShieldAlert, Layers } from 'lucide-react';
import { POSTGRES_SCHEMA_SQL } from '../../data/postgresSchema';
import { LedgerBlock } from '../../types';

export const TabPostgresLedger: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<'blocks' | 'quarantine' | 'schema'>('blocks');
  const [queryInput, setQueryInput] = useState('SELECT block_id, recorded_at, attenuation_db, actual_boost_psi, hmac_sha256_signature FROM flagship_telemetry.ledger_blocks ORDER BY block_id DESC LIMIT 5;');

  const mockBlocks: LedgerBlock[] = [
    {
      blockIndex: 1048580,
      timestamp: '2026-10-11T19:42:00.124Z',
      partitionKey: 'ledger_2026_q4',
      engineRpm: 2400,
      acousticFreqHz: 120.0,
      attenuationDb: -18.42,
      boostPressurePsi: 16.92,
      quarantineTriggered: false,
      previousHash: 'a71e89f92c10b45d2994f31b790d965e6a8e3cb98ffc6742014b2d35e19741c0',
      blockHash: '0d49f69ce831d4592ca972f778a481c00a6cb4433c2a685f67b55f1710b10e3c',
    },
    {
      blockIndex: 1048579,
      timestamp: '2026-10-11T19:41:59.874Z',
      partitionKey: 'ledger_2026_q4',
      engineRpm: 2380,
      acousticFreqHz: 119.0,
      attenuationDb: -18.35,
      boostPressurePsi: 16.85,
      quarantineTriggered: false,
      previousHash: '39a2bc9166cf8e78f9901aa48c8bcf6279f6e80b2a95c378e9f2ca97fbb9d123',
      blockHash: 'a71e89f92c10b45d2994f31b790d965e6a8e3cb98ffc6742014b2d35e19741c0',
    },
    {
      blockIndex: 1048578,
      timestamp: '2026-10-11T19:41:59.624Z',
      partitionKey: 'ledger_2026_q4',
      engineRpm: 2350,
      acousticFreqHz: 117.5,
      attenuationDb: -18.21,
      boostPressurePsi: 16.78,
      quarantineTriggered: false,
      previousHash: '5e8b417e0b512c0199d7a2245e3590928a6fcf74b726c5982e04f056d8199341',
      blockHash: '39a2bc9166cf8e78f9901aa48c8bcf6279f6e80b2a95c378e9f2ca97fbb9d123',
    },
    {
      blockIndex: 1048577,
      timestamp: '2026-10-11T19:41:42.100Z',
      partitionKey: 'ledger_2026_q4',
      engineRpm: 5200,
      acousticFreqHz: 260.0,
      attenuationDb: -14.10,
      boostPressurePsi: 23.45,
      quarantineTriggered: true,
      previousHash: '88e99acb452140a7cf611832049e917d23f4058b871fa009b45e2a9b69103c81',
      blockHash: '5e8b417e0b512c0199d7a2245e3590928a6fcf74b726c5982e04f056d8199341',
    },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(POSTGRES_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Overview & Ledger Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Database className="w-8 h-8 text-cyan-400" />
              Partitioned PostgreSQL 16 Flagship Ledger
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Timeseries range-partitioned hypertables with zero circular foreign keys, trigger-enforced boost quarantine, and HMAC-SHA256 chains.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveView('blocks')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeView === 'blocks'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              Live Telemetry Blocks
            </button>
            <button
              type="button"
              onClick={() => setActiveView('quarantine')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeView === 'quarantine'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              Quarantine Events (1)
            </button>
            <button
              type="button"
              onClick={() => setActiveView('schema')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeView === 'schema'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              SQL DDL Migration
            </button>
          </div>
        </div>

        {/* View 1: Live Blocks */}
        {activeView === 'blocks' && (
          <div className="mt-6 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-sm font-mono">
                    <th className="py-3 px-4 font-semibold">BLOCK #</th>
                    <th className="py-3 px-4 font-semibold">TIMESTAMP</th>
                    <th className="py-3 px-4 font-semibold">PARTITION</th>
                    <th className="py-3 px-4 font-semibold">RPM / FREQ</th>
                    <th className="py-3 px-4 font-semibold">ATTENUATION</th>
                    <th className="py-3 px-4 font-semibold">MAP PSI</th>
                    <th className="py-3 px-4 font-semibold">HMAC-SHA256</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-sm">
                  {mockBlocks.map((b) => (
                    <tr
                      key={b.blockIndex}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        b.quarantineTriggered ? 'bg-rose-500/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-cyan-300">#{b.blockIndex}</td>
                      <td className="py-3.5 px-4 text-slate-300 text-sm">{b.timestamp.split('T')[1].replace('Z', '')}</td>
                      <td className="py-3.5 px-4 text-slate-400">{b.partitionKey}</td>
                      <td className="py-3.5 px-4 text-amber-300">
                        {b.engineRpm} RPM · {b.acousticFreqHz} Hz
                      </td>
                      <td className="py-3.5 px-4 text-emerald-400 font-bold">
                        {b.attenuationDb.toFixed(2)} dB
                      </td>
                      <td className="py-3.5 px-4">
                        {b.quarantineTriggered ? (
                          <span className="text-rose-400 font-bold">{b.boostPressurePsi.toFixed(2)} PSI ⚠️</span>
                        ) : (
                          <span className="text-slate-200">{b.boostPressurePsi.toFixed(2)} PSI</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-sm" title={b.blockHash}>
                        {b.blockHash.substring(0, 12)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Interactive Query Sandbox */}
            <div className="mt-6 p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-300">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Interactive Timeseries Query Console</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => alert(`Executed on PostgreSQL 16 cluster: 4 rows returned in 1.18ms.`)}
                  className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Run Query
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View 2: Quarantine Events */}
        {activeView === 'quarantine' && (
          <div className="mt-6 space-y-4">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-base font-bold text-rose-300">
                  Overshoot Quarantine Audit Trigger (trg_watchdog_overshoot)
                </h4>
                <p className="text-sm text-slate-300 mt-1">
                  Enforces strict microsecond isolation. When Manifold Absolute Pressure exceeds 22.80 PSI, 
                  the trigger sets <code className="text-rose-300">quarantine_flag = TRUE</code> and commands an immediate 100% wastegate solenoid dump.
                </p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800 text-sm font-mono">
                <span className="text-slate-400 font-semibold">INCIDENT ID: 8c50c507-60e7-4bd9-9e80-77a82b9e661b</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  CONTAINED IN 0.385 ms
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm font-mono">
                <div>
                  <div className="text-slate-400">Peak MAP Pressure:</div>
                  <div className="text-rose-400 font-bold text-base">23.45 PSI</div>
                </div>
                <div>
                  <div className="text-slate-400">Overshoot Margin:</div>
                  <div className="text-amber-400 font-bold text-base">+0.65 PSI</div>
                </div>
                <div>
                  <div className="text-slate-400">Valve Vent Latency:</div>
                  <div className="text-cyan-400 font-bold text-base">0.385 ms</div>
                </div>
                <div>
                  <div className="text-slate-400">Failsafe Action:</div>
                  <div className="text-emerald-400 font-bold text-base">VENT_100_PCT</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View 3: SQL DDL Schema */}
        {activeView === 'schema' && (
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                PostgreSQL 16 Partitioned DDL Schema (001_flagship_ledger.sql)
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                <span>{copied ? 'Copied SQL' : 'Copy DDL'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 overflow-x-auto max-h-[480px] leading-relaxed">
              <code>{POSTGRES_SCHEMA_SQL}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
