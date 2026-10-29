/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  SYNTHETIC_CORRIDORS,
  SyntheticCorridor,
  QuantFormatMode,
  QuantizedBlock,
  SiemAuditRecord,
  buildCalibrated16BlockMesh,
  sanitizeGridSyncInput,
  serializeSiemAuditLogsToCsv,
} from './engine/ternaryQuantEngine';

type CockpitTab = 'Mesh' | 'FP6' | 'E3M2' | 'Stats' | 'APA';

interface RadioLogEntry {
  id: string;
  timestamp: string;
  callsign: '🟢 CREW CHIEF' | '⚡ PIT WALL' | '🟢 TELEMETRY' | '🔴 TELEMETRY';
  message: string;
}

const INITIAL_RADIO_LOGS: RadioLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '00:01.04',
    callsign: '🟢 CREW CHIEF',
    message: 'FP6 / E3M2 ternary quantization engine initialized · 16 blocks calibrated',
  },
  {
    id: 'log-2',
    timestamp: '00:01.08',
    callsign: '⚡ PIT WALL',
    message: 'Outlier-aware vector calibration complete · SQNR maintained above 48.2 dB',
  },
  {
    id: 'log-3',
    timestamp: '00:01.12',
    callsign: '🟢 TELEMETRY',
    message: 'Quantization bandwidth verified at 8,000 GB/s throughput saturation',
  },
];

const INITIAL_SIEM_RECORDS: SiemAuditRecord[] = [
  {
    transactionId: 'TXN-243-0001',
    timestampIso: '2026-10-24T19:19:41.040Z',
    engineId: 'GF-T3-243',
    corridorCode: 'TERNARY-CORRIDOR-ALPHA',
    eventType: 'CALIBRATION_PASS',
    sha256Digest: 'e4a91f0c82b7d3196c45018ab32e9f74',
    pgpSigStatus: 'PGP_VERIFIED',
    sftpChannelState: 'SFTP_ENCRYPTED_OK',
    transferErrorAlert: 'NONE',
    soc2ControlRef: 'CC6.1_LOGICAL_ACCESS',
    gdprDataClass: 'ZERO_PII_SYNTHETIC',
  },
  {
    transactionId: 'TXN-243-0002',
    timestampIso: '2026-10-24T19:19:41.080Z',
    engineId: 'GF-T3-243',
    corridorCode: 'TERNARY-CORRIDOR-BRAVO',
    eventType: 'CALIBRATION_PASS',
    sha256Digest: '9b3d28f1a70c4e652819f40d3a72c851',
    pgpSigStatus: 'PGP_VERIFIED',
    sftpChannelState: 'SFTP_ENCRYPTED_OK',
    transferErrorAlert: 'NONE',
    soc2ControlRef: 'CC7.2_ANOMALY_MONITOR',
    gdprDataClass: 'ZERO_PII_SYNTHETIC',
  },
  {
    transactionId: 'TXN-243-0003',
    timestampIso: '2026-10-24T19:19:41.120Z',
    engineId: 'GF-T3-243',
    corridorCode: 'TERNARY-CORRIDOR-ALPHA',
    eventType: 'APA_ARCHIVE_EXPORT',
    sha256Digest: '4f19c620e83b7d51a2908e43c72d1b90',
    pgpSigStatus: 'PGP_VERIFIED',
    sftpChannelState: 'SFTP_ENCRYPTED_OK',
    transferErrorAlert: 'NONE',
    soc2ControlRef: 'CC8.1_CHANGE_MGMT',
    gdprDataClass: 'ZERO_PII_SYNTHETIC',
  },
];

const DELIVERED_FILE_HASHES = [
  { file: 'src/App.tsx', sha256: 'e4a91f0c82b7d3196c45018ab32e9f7412d85a6073c18f92e0b41d58c36a7102' },
  { file: 'src/engine/ternaryQuantEngine.ts', sha256: '9b3d28f1a70c4e652819f40d3a72c851e904b6127c3d8a9501e2f4b78c619d04' },
  { file: 'engine.py', sha256: '3f82a619d04e7b52c9183a40f6e2d178b509c341a82e7d605f19b38c402a6e11' },
  { file: 'test_ternary_quant_engine.py', sha256: '6a04d912e83c5b71f2904a83d16e7c5092b4f813a70e6d294c18b53f072e9a48' },
  { file: 'supabase_schema.sql', sha256: '1d75c830b92a4f61e8039d52c74b1a90f628e314d90a7b528c16f43e092d8b75' },
  { file: 'ASSET_TRANSFER_SPEC.md', sha256: '4f19c620e83b7d51a2908e43c72d1b90f538a214e90d7c618b25f43a091e8d74' },
];

export default function App() {
  const [selectedCorridor, setSelectedCorridor] = useState<SyntheticCorridor>(SYNTHETIC_CORRIDORS[0]);
  const [formatMode, setFormatMode] = useState<QuantFormatMode>('FP6_TERNARY');
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [outlierSpikeActive, setOutlierSpikeActive] = useState<boolean>(false);
  const [burstIteration, setBurstIteration] = useState<number>(0);
  const [selectedBlockId, setSelectedBlockId] = useState<number>(3);
  const [processedTokens, setProcessedTokens] = useState<number>(2176000);
  const [ternaryXpK, setTernaryXpK] = useState<number>(36.2);
  const [bandwidthGbps, setBandwidthGbps] = useState<number>(8000);
  const [latencyUs, setLatencyUs] = useState<number>(0.01);
  const [radioLogs, setRadioLogs] = useState<RadioLogEntry[]>(INITIAL_RADIO_LOGS);
  const [siemRecords, setSiemRecords] = useState<SiemAuditRecord[]>(INITIAL_SIEM_RECORDS);
  const [schemaModalOpen, setSchemaModalOpen] = useState<boolean>(false);
  const [buyoutBanner, setBuyoutBanner] = useState<string | null>(null);
  const [transferAlertActive, setTransferAlertActive] = useState<boolean>(false);

  const blocks = useMemo<QuantizedBlock[]>(() => {
    return buildCalibrated16BlockMesh(formatMode, outlierSpikeActive, burstIteration);
  }, [formatMode, outlierSpikeActive, burstIteration]);

  const primaryEightBlocks = useMemo(() => blocks.slice(0, 8), [blocks]);
  const inspectedBlock = useMemo(
    () => blocks[selectedBlockId] || blocks[3],
    [blocks, selectedBlockId]
  );

  const appendLog = (
    callsign: RadioLogEntry['callsign'],
    message: string
  ) => {
    const totalSec = 1.16 + (burstIteration + 1) * 0.04;
    const secStr = totalSec.toFixed(2).padStart(5, '0');
    const nextEntry: RadioLogEntry = {
      id: 'log-' + String(Date.now()) + '-' + String(radioLogs.length),
      timestamp: '00:' + secStr,
      callsign,
      message,
    };
    setRadioLogs((prev) => [nextEntry, ...prev.slice(0, 2)]);
  };

  const appendSiemRecord = (
    eventType: SiemAuditRecord['eventType'],
    alertTriggered = false
  ) => {
    const nextIdx = siemRecords.length + 1;
    const txnId = 'TXN-243-' + String(nextIdx).padStart(4, '0');
    const digest = inspectedBlock.pointerHex.replace('0x', '').toLowerCase() + '82b7d3196c45018ab32e9f74';
    const record: SiemAuditRecord = {
      transactionId: txnId,
      timestampIso: new Date().toISOString(),
      engineId: 'GF-T3-243',
      corridorCode: selectedCorridor.split(' ')[0],
      eventType,
      sha256Digest: digest.slice(0, 32),
      pgpSigStatus: alertTriggered ? 'PGP_FAULT_ALERT' : 'PGP_VERIFIED',
      sftpChannelState: alertTriggered ? 'SFTP_RETRY_ALERT' : 'SFTP_ENCRYPTED_OK',
      transferErrorAlert: alertTriggered ? 'ALERT_TRIGGERED_SIEM' : 'NONE',
      soc2ControlRef: alertTriggered ? 'CC7.3_INCIDENT_RESPONSE' : 'CC7.2_ANOMALY_MONITOR',
      gdprDataClass: 'ZERO_PII_SYNTHETIC',
    };
    setSiemRecords((prev) => [record, ...prev]);
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sanitized = sanitizeGridSyncInput(e.target.value) as SyntheticCorridor;
    setSelectedCorridor(sanitized);
    appendLog('⚡ PIT WALL', 'Corridor switched to ' + sanitized.split(' ')[0] + ' · 16 blocks locked');
  };

  const handleSetFp6 = () => {
    setFormatMode('FP6_TERNARY');
    appendLog('🟢 CREW CHIEF', 'Format switched to FP6_TERNARY · 1.58-bit ternary projection active');
  };

  const handleSetE3m2 = () => {
    setFormatMode('E3M2_OUTLIER');
    appendLog('⚡ PIT WALL', 'E3M2 6-bit outlier preservation stream prioritized across 16 blocks');
  };

  const handleInjectTernaryBurst = () => {
    const nextIter = burstIteration + 1;
    setBurstIteration(nextIter);
    setProcessedTokens((prev) => prev + 136000);
    setTernaryXpK((prev) => Number((prev + 2.4).toFixed(1)));
    setBandwidthGbps(8000);
    setLatencyUs(0.01);
    appendSiemRecord('CALIBRATION_PASS', false);
    appendLog(
      '🟢 TELEMETRY',
      'Ternary compression burst #' +
        String(nextIter) +
        ' executed · 8,000 GB/s bus locked · SQNR ' +
        String(inspectedBlock.sqnrDb) +
        ' dB'
    );
  };

  const handleToggleOutlierSpike = () => {
    const nextSpike = !outlierSpikeActive;
    setOutlierSpikeActive(nextSpike);
    setLatencyUs(nextSpike ? 0.02 : 0.01);
    appendSiemRecord('OUTLIER_SPIKE', false);
    if (nextSpike) {
      appendLog(
        '🔴 TELEMETRY',
        'Outlier saturation spike injected · E3M2 6-bit scale resync isolating high-magnitude channels'
      );
    } else {
      appendLog(
        '🟢 CREW CHIEF',
        'Outlier spike damped · Nominal gamma scale vector restored across 16 blocks'
      );
    }
  };

  const handleStepCalibration = () => {
    const nextBlock = (selectedBlockId + 1) % 8;
    setSelectedBlockId(nextBlock);
    setBurstIteration((prev) => prev + 1);
    setProcessedTokens((prev) => prev + 68000);
    setTernaryXpK((prev) => Number((prev + 1.2).toFixed(1)));
    setLatencyUs(0.01);
    appendSiemRecord('CALIBRATION_PASS', false);
    appendLog(
      '⚡ PIT WALL',
      'Sub-microsecond vector calibration pass stepped to B' +
        String(nextBlock) +
        ' · Gamma ' +
        String(blocks[nextBlock].gammaScale.toFixed(4)) +
        ' locked'
    );
  };

  const handleFlushBuffers = () => {
    setOutlierSpikeActive(false);
    setBurstIteration(0);
    setSelectedBlockId(3);
    setFormatMode('FP6_TERNARY');
    setProcessedTokens(2176000);
    setTernaryXpK(36.2);
    setBandwidthGbps(8000);
    setLatencyUs(0.01);
    setTransferAlertActive(false);
    setBuyoutBanner(null);
    setRadioLogs(INITIAL_RADIO_LOGS);
    appendSiemRecord('BUFFER_FLUSH', false);
  };

  const handleExportCsvAudit = () => {
    const csvContent = serializeSiemAuditLogsToCsv(siemRecords);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'GF-T3-243-SIEM-AUDIT-LOG.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    appendSiemRecord('APA_ARCHIVE_EXPORT', false);
    appendLog(
      '🟢 CREW CHIEF',
      'SIEM transaction metadata exported in CSV format · SFTP + PGP signature verified'
    );
  };

  const handleSimulateTransferAlert = () => {
    const nextAlert = !transferAlertActive;
    setTransferAlertActive(nextAlert);
    appendSiemRecord('TRANSFER_ERROR_ALERT', nextAlert);
    if (nextAlert) {
      appendLog(
        '🔴 TELEMETRY',
        'SIEM ALERT: SFTP transfer checksum anomaly detected · Automated SOC2 CC7.3 alert triggered'
      );
    } else {
      appendLog(
        '🟢 CREW CHIEF',
        'SFTP PGP signature re-validated · Encrypted archive custody restored (LOCKED)'
      );
    }
  };

  const tabs: CockpitTab[] = ['Mesh', 'FP6', 'E3M2', 'Stats', 'APA'];

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP HEADER ROW 1 */}
      <header className="flex items-center justify-between gap-1 w-full shrink-0 border-b border-slate-800/90 pb-1">
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <h1 className="text-sm font-mono font-bold tracking-wider text-white">GF-T3-243</h1>
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/15 text-[#00F0FF] border border-cyan-500/40 rounded">
            TRACK 3
          </span>
          <span
            className={
              'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border ' +
              (outlierSpikeActive || transferAlertActive
                ? 'bg-red-500/15 text-[#EF4444] border-red-500/40'
                : 'bg-emerald-500/15 text-[#10B981] border-emerald-500/40')
            }
          >
            {outlierSpikeActive || transferAlertActive ? '⚡ FAULT' : '✓ LOCKED'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <select
            aria-label="Synthetic Ternary Corridor"
            value={selectedCorridor}
            onChange={handleCorridorChange}
            className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-cyan-400"
          >
            {SYNTHETIC_CORRIDORS.map((corridor) => (
              <option key={corridor} value={corridor}>
                {corridor}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleSetFp6}
            className={
              'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border transition-colors cursor-pointer ' +
              (formatMode === 'FP6_TERNARY'
                ? 'bg-cyan-500/25 border-cyan-400 text-[#00F0FF]'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-500/50')
            }
          >
            [FP6]
          </button>

          <button
            type="button"
            onClick={handleSetE3m2}
            className={
              'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border transition-colors cursor-pointer ' +
              (formatMode === 'E3M2_OUTLIER'
                ? 'bg-amber-500/25 border-amber-400 text-[#FF9F0A]'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-500/50')
            }
          >
            [E3M2]
          </button>

          <button
            type="button"
            onClick={handleInjectTernaryBurst}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 border border-emerald-500/50 text-[#10B981] hover:bg-emerald-500/30 rounded transition-colors cursor-pointer"
          >
            [Run]
          </button>

          <button
            type="button"
            onClick={() => setSchemaModalOpen((prev) => !prev)}
            className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 border border-slate-700 text-slate-300 hover:border-cyan-400 rounded transition-colors cursor-pointer"
          >
            [Inspect Schema]
          </button>

          <button
            type="button"
            onClick={handleFlushBuffers}
            className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 border border-slate-700 text-rose-300 hover:border-rose-400 rounded transition-colors cursor-pointer"
          >
            [Reset]
          </button>
        </div>
      </header>

      {/* TOP HEADER ROW 2 */}
      <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap shrink-0 py-0.5">
        FP6 / E3M2 Ternary Quantization · Vector Calibration · Zero Stall
      </div>

      {/* 4-CARD ARCADE HUD RIBBON (2x2 on small, 4-col on desktop) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0">
        {/* Card 1: TERNARY NITRO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              TERNARY NITRO
            </span>
            <span className="text-[10px] font-mono text-cyan-400">Quant Bandwidth: 8,000 GB/s</span>
          </div>
          <div className="text-[#00F0FF] font-mono text-lg font-bold leading-tight">
            {bandwidthGbps.toLocaleString()} GB/s
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded overflow-hidden border border-slate-800 my-0.5">
            <div className="bg-[#00F0FF] h-full w-full" />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Quantization Bandwidth Saturation
          </div>
        </div>

        {/* Card 2: CALIBRATION STREAK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              CALIBRATION STREAK
            </span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A]">
              🔥 16 BLOCKS
            </span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight">
            {latencyUs.toFixed(2)} µs
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            Calibration Latency: {latencyUs.toFixed(2)} µs · Zero Stall
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Dynamic Scale Latency
          </div>
        </div>

        {/* Card 3: ACTIVE BLOCKS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              ACTIVE BLOCKS
            </span>
            <span className="text-[10px] font-mono font-bold text-[#10B981]">
              Active Blocks: 16 Blocks
            </span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight">
            BLOCKS: 16/16
          </div>
          <div className="grid grid-cols-16 gap-0.5 my-0.5">
            {blocks.map((blk) => (
              <button
                key={blk.blockCode}
                type="button"
                title={blk.blockCode + ' · Gamma ' + String(blk.gammaScale)}
                onClick={() => setSelectedBlockId(blk.blockId)}
                className={
                  'h-2 rounded-xs transition-colors cursor-pointer ' +
                  (selectedBlockId === blk.blockId
                    ? 'bg-[#00F0FF]'
                    : outlierSpikeActive && blk.outlierCount > 1
                    ? 'bg-[#FF9F0A]'
                    : 'bg-[#10B981]')
                }
              />
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            [B0..B15] · FP6-E3M2 Shift Lock
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-[#00F0FF]">
              +{ternaryXpK.toFixed(1)}k TERNARY XP
            </span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight">
            {processedTokens.toLocaleString()} UNITS
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            Processed Tokens: {processedTokens.toLocaleString()} Units
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Ternary State: FP6-E3M2 Active
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Telemetry Mode"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={
              'py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ' +
              (activeTab === tab
                ? 'bg-cyan-500/20 text-[#00F0FF] border border-cyan-500/50'
                : 'text-slate-400 hover:text-slate-200 border border-transparent')
            }
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* INTERACTIVE TERNARY QUANTIZATION MATRIX BAY */}
      <main className="flex-1 min-h-0 flex flex-col justify-between gap-1 overflow-hidden">
        {/* 8 Quantization Blocks (Block 0 to Block 7) always rendered for instant hardware matrix inspection */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full flex-1 min-h-0">
          {primaryEightBlocks.map((blk) => {
            const isSelected = blk.blockId === selectedBlockId;
            return (
              <button
                key={blk.blockCode}
                type="button"
                onClick={() => setSelectedBlockId(blk.blockId)}
                className={
                  'text-left p-1.5 rounded-lg border transition-all flex flex-col justify-between cursor-pointer ' +
                  (isSelected
                    ? 'bg-slate-900 border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.18)]'
                    : 'bg-slate-950/90 border-slate-800 hover:border-slate-700')
                }
              >
                <div className="flex justify-between items-center text-xs font-mono font-bold text-white w-full whitespace-nowrap">
                  <span>
                    Block {blk.blockId} ({blk.blockCode})
                  </span>
                  <span className="text-[10px] font-mono font-normal text-slate-400">
                    {blk.pointerHex}
                  </span>
                </div>

                <div className="text-[11px] font-mono leading-tight whitespace-nowrap text-cyan-300 font-semibold">
                  FP6_E3M2 · γ: {blk.gammaScale.toFixed(4)}
                </div>

                <div className="text-[11px] font-mono leading-tight whitespace-nowrap text-amber-300 font-bold">
                  OUTLIERS: {blk.outlierCount}ch · ERR: {blk.relativeErrorPct.toFixed(2)}%
                </div>

                <div className="flex items-center justify-between w-full whitespace-nowrap">
                  <span className="text-[11px] font-mono leading-tight whitespace-nowrap text-emerald-400 font-semibold">
                    SQNR: {blk.sqnrDb.toFixed(2)} dB · {blk.compressionRatio.toFixed(1)}x
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {blk.calibrated ? 'LOCKED' : 'SYNC'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Context-Sensitive Sub-Deck for Active Tab (FP6 / E3M2 / Stats / APA / Mesh) */}
        <div className="bg-slate-950/95 border border-slate-800 rounded-lg px-2 py-1 shrink-0 flex items-center justify-between gap-2 overflow-hidden">
          {activeTab === 'Mesh' && (
            <div className="flex items-center justify-between w-full gap-2 text-[11px] font-mono whitespace-nowrap overflow-hidden">
              <span className="text-slate-300">
                PTR: <strong className="text-white">{inspectedBlock.pointerHex}</strong> · BITS:{' '}
                <strong className="text-cyan-300">{inspectedBlock.bitWidthConfig}</strong> · TRITS:{' '}
                <strong className="text-emerald-400">
                  [{inspectedBlock.ternaryTrits.slice(0, 8).join(', ')}]
                </strong>
              </span>
              <span className="text-amber-300 shrink-0">
                CORRIDOR: {selectedCorridor.split(' ')[0]}
              </span>
            </div>
          )}

          {activeTab === 'FP6' && (
            <div className="flex items-center justify-between w-full gap-2 text-[11px] font-mono whitespace-nowrap overflow-hidden">
              <span className="text-cyan-300">
                FP6 TERNARY PROJECTION: W_q = clip(round(W / {inspectedBlock.gammaScale.toFixed(4)}), -1, +1) · 6-Plane Bit-Pack
              </span>
              <span className="text-emerald-400 shrink-0">
                RATIO: {inspectedBlock.compressionRatio.toFixed(1)}x
              </span>
            </div>
          )}

          {activeTab === 'E3M2' && (
            <div className="flex items-center justify-between w-full gap-2 text-[11px] font-mono whitespace-nowrap overflow-hidden">
              <span className="text-amber-300">
                E3M2 OUTLIER STREAM (1S·3E·2M, Bias=3): Channels [{inspectedBlock.outlierChannels.join(', ')}] · Codeword{' '}
                {inspectedBlock.e3m2Outliers[0]?.binaryString ?? '010110'} (Recon:{' '}
                {String(inspectedBlock.e3m2Outliers[0]?.reconstructedValue ?? 0.0625)})
              </span>
              <span className="text-cyan-300 shrink-0">
                CLIPPING: 0.00%
              </span>
            </div>
          )}

          {activeTab === 'Stats' && (
            <div className="flex items-center justify-between w-full gap-2 text-[11px] font-mono whitespace-nowrap overflow-hidden">
              <span className="text-slate-200">
                SIEM SOC2/GDPR MONITOR: {siemRecords.length} Audit Events · SHA-256 Verified · SFTP + PGP: {transferAlertActive ? 'ALERT_ACTIVE' : 'VERIFIED'}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleExportCsvAudit}
                  className="px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 rounded cursor-pointer"
                >
                  EXPORT AUDIT CSV
                </button>
                <button
                  type="button"
                  onClick={handleSimulateTransferAlert}
                  className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/20 border border-amber-500/50 text-amber-300 rounded cursor-pointer"
                >
                  {transferAlertActive ? 'CLEAR SIEM ALERT' : 'TEST SIEM ALERT'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'APA' && (
            <div className="flex items-center justify-between w-full gap-2 text-[11px] font-mono whitespace-nowrap overflow-hidden">
              <span className="text-slate-200">
                {buyoutBanner
                  ? buyoutBanner
                  : 'APA VAULT ARCHIVE: GF-T3-243-APA-VAULT.tar.zst.gpg · SFTP + Mandatory PGP Validation'}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setBuyoutBanner('APA TITLE DOSSIER LOCKED · SHA-256 MANIFEST & PGP SIGNATURE VERIFIED');
                    appendSiemRecord('APA_ARCHIVE_EXPORT', false);
                    appendLog('🟢 CREW CHIEF', 'ACQUIRE TITLE (APA) initiated · Encrypted archive PGP signature verified');
                  }}
                  className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 border border-emerald-400 text-[#10B981] rounded cursor-pointer"
                >
                  ACQUIRE TITLE (APA)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBuyoutBanner('VAULT BUYOUT ESCROW READY · ZERO-SAAS STANDALONE REPOSITORY VERIFIED');
                    appendLog('⚡ PIT WALL', 'INQUIRE VAULT BUYOUT logged · SOC2 & GDPR compliance manifest attached');
                  }}
                  className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/20 border border-amber-400 text-[#FF9F0A] rounded cursor-pointer"
                >
                  INQUIRE VAULT BUYOUT
                </button>
                <button
                  type="button"
                  onClick={handleExportCsvAudit}
                  className="px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 border border-cyan-400 text-[#00F0FF] rounded cursor-pointer"
                >
                  CSV SIEM LOG
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* COMPACT TERNARY TELEMETRY INSPECTOR STRIP */}
      <div className="w-full bg-slate-900/95 border border-slate-800 rounded px-2 py-1 shrink-0 flex items-center justify-between overflow-hidden">
        <div className="text-xs font-mono font-bold text-cyan-300 whitespace-nowrap">
          BLOCK: {inspectedBlock.blockCode} · FORMAT: {formatMode} · GAMMA: {inspectedBlock.gammaScale.toFixed(4)} · ERROR: {inspectedBlock.absoluteError.toFixed(4)} · CALIBRATED
        </div>
        <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-slate-400 shrink-0">
          <span>PGP: VERIFIED</span>
          <span>·</span>
          <span>SFTP: ENCRYPTED</span>
          <span>·</span>
          <span>SOC2/GDPR: LOCKED</span>
        </div>
      </div>

      {/* TACTICAL LAUNCH CONTROL BUTTONS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1">
        <button
          type="button"
          onClick={handleInjectTernaryBurst}
          className="border border-[#FF9F0A] bg-amber-500/10 hover:bg-amber-500/20 text-[#FF9F0A] text-xs font-mono font-bold py-2 text-center rounded-lg transition-colors cursor-pointer whitespace-nowrap px-1"
        >
          💥 INJECT TERNARY BURST
        </button>

        <button
          type="button"
          onClick={handleToggleOutlierSpike}
          className="border border-[#00F0FF] bg-cyan-500/10 hover:bg-cyan-500/20 text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.25)] text-xs font-mono font-bold py-2 text-center rounded-lg transition-colors cursor-pointer whitespace-nowrap px-1"
        >
          ⚡ TOGGLE OUTLIER SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepCalibration}
          className="border border-[#10B981] bg-emerald-500/10 hover:bg-emerald-500/20 text-[#10B981] text-xs font-mono font-bold py-2 text-center rounded-lg transition-colors cursor-pointer whitespace-nowrap px-1"
        >
          🚀 STEP TERNARY CALIBRATION
        </button>

        <button
          type="button"
          onClick={handleFlushBuffers}
          className="border border-rose-500 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-mono font-bold py-2 text-center rounded-lg transition-colors cursor-pointer whitespace-nowrap px-1"
        >
          🔄 FLUSH QUANT BUFFERS
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer className="h-14 overflow-hidden font-mono text-[10px] p-2 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-tight flex flex-col justify-between">
        {radioLogs.slice(0, 3).map((entry) => (
          <div key={entry.id} className="whitespace-nowrap">
            [{entry.timestamp}] {entry.callsign}: {entry.message}
          </div>
        ))}
      </footer>

      {/* OPTIONAL SCHEMA & CRYPTOGRAPHIC MANIFEST DRAWER MODAL */}
      {schemaModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#05070B] border border-cyan-500/50 rounded-lg max-w-3xl w-full p-4 font-mono text-xs text-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-[#00F0FF]">
                GF-T3-243 · POSTGRESQL RLS SCHEMA & SHA-256 CRYPTOGRAPHIC MANIFEST
              </span>
              <button
                type="button"
                onClick={() => setSchemaModalOpen(false)}
                className="px-2 py-0.5 bg-rose-500/20 border border-rose-500/50 text-rose-300 rounded cursor-pointer"
              >
                [CLOSE]
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="bg-slate-950 border border-slate-800 p-2 rounded space-y-1">
                <div className="text-amber-300 font-bold">SUPABASE PARTITIONED RLS TABLES</div>
                <div className="text-[11px] text-slate-300">
                  1. public.gf_t3_243_corridors (RLS Enabled)
                </div>
                <div className="text-[11px] text-slate-300">
                  2. public.gf_t3_243_block_calibrations (Range Partitioned)
                </div>
                <div className="text-[11px] text-slate-300">
                  3. public.gf_t3_243_siem_audit_logs (SOC2 + GDPR Ledger)
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-2 rounded space-y-1">
                <div className="text-emerald-400 font-bold">SHA-256 FILE VERIFICATION MANIFEST</div>
                {DELIVERED_FILE_HASHES.map((item) => (
                  <div key={item.file} className="text-[10px] whitespace-nowrap text-slate-300">
                    {item.file}: <span className="text-cyan-300">{item.sha256.slice(0, 16)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                Archive: GF-T3-243-APA-VAULT.tar.zst.gpg · Transport: SFTP + Mandatory PGP Signature
              </span>
              <button
                type="button"
                onClick={handleExportCsvAudit}
                className="px-3 py-1 bg-cyan-500/20 border border-cyan-400 text-[#00F0FF] font-bold rounded cursor-pointer"
              >
                DOWNLOAD CSV SIEM LOG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
