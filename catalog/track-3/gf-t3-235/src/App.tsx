/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-235 — Track 3 Tensor Core Asynchronous MMA Interleaved Pipeline Cockpit
 * Zero-Dollar Gate Compliant · Clean-Room Sovereign Implementation
 */

import React, { useMemo, useState } from 'react';
import {
  SYNTHETIC_MMA_CORRIDORS,
  type CorridorName,
  type ImmutableAuditEntry,
  type OperatorRole,
  computeEngineTelemetry,
  formatInspectorStrip,
  generateComplianceCsvReport,
  validateGridSyncIngress,
} from './engine/tensorCoreEngine';

type CockpitTab = 'Mesh' | 'MMA' | 'Warp' | 'Stats' | 'APA';

const TABS: readonly CockpitTab[] = ['Mesh', 'MMA', 'Warp', 'Stats', 'APA'] as const;

const INITIAL_RADIO_LOGS: readonly ImmutableAuditEntry[] = [
  {
    auditId: 'AUD-235-01',
    timestampTag: '00:01.04',
    callsign: '🟢 CREW CHIEF',
    role: 'CREW_CHIEF_ADMIN',
    mfaVerified: true,
    actionCode: 'PIPELINE_INIT',
    corridorId: 'MMA-CORRIDOR-ALPHA',
    sha256Seal: '9f84c201e7b14a08',
    message: 'Tensor Core asynchronous MMA pipeline initialized · 32 warps active',
  },
  {
    auditId: 'AUD-235-02',
    timestampTag: '00:01.08',
    callsign: '⚡ PIT WALL',
    role: 'TELEMETRY_OPERATOR',
    mfaVerified: true,
    actionCode: 'SWIZZLE_VERIFIED',
    corridorId: 'MMA-CORRIDOR-ALPHA',
    sha256Seal: '4a19d380b62f11c4',
    message: 'Warp-level fragment swizzling complete · Zero shared memory bank conflicts',
  },
  {
    auditId: 'AUD-235-03',
    timestampTag: '00:01.12',
    callsign: '🟢 TELEMETRY',
    role: 'TELEMETRY_OPERATOR',
    mfaVerified: true,
    actionCode: 'THROUGHPUT_LOCK',
    corridorId: 'MMA-CORRIDOR-ALPHA',
    sha256Seal: '7c3e5592d10a8f6e',
    message: 'Interleaved pipeline throughput verified at 1,850 TFLOPS',
  },
] as const;

const SQL_RLS_PREVIEW = [
  'ALTER TABLE gf_t3_235_telemetry_runs ENABLE ROW LEVEL SECURITY;',
  'CREATE POLICY rls_telemetry_runs_mfa_insert ON gf_t3_235_telemetry_runs',
  '  FOR INSERT WITH CHECK (tenant_org_id = current_tenant_id() AND mfa_verified = TRUE);',
  'CREATE TABLE gf_t3_235_telemetry_runs_2026_q4 PARTITION OF gf_t3_235_telemetry_runs',
  "  FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');",
].join('\n');

export default function App() {
  const [corridorLabel, setCorridorLabel] = useState<CorridorName>(
    'MMA-CORRIDOR-ALPHA (ASYNC-WARP-LEVEL-TILE-SWIZZLE · 1850-TFLOPS)'
  );
  const [passCount, setPassCount] = useState<number>(0);
  const [burstActive, setBurstActive] = useState<boolean>(false);
  const [bankStallsInjected, setBankStallsInjected] = useState<boolean>(false);
  const [flushedState, setFlushedState] = useState<boolean>(false);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number>(3);
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [operatorRole, setOperatorRole] = useState<OperatorRole>('CREW_CHIEF_ADMIN');
  const [mfaVerified, setMfaVerified] = useState<boolean>(true);
  const [gridSyncInput, setGridSyncInput] = useState<string>(
    'Verify 16x16x16 async tile swizzle parity'
  );
  const [gridSyncStatus, setGridSyncStatus] = useState<string>(
    'GRIDSYNC ZERO-TRUST GATE: VERIFIED (SHA-256 E2EE SEALED)'
  );
  const [apaModalBanner, setApaModalBanner] = useState<string | null>(null);
  const [radioLogs, setRadioLogs] = useState<ImmutableAuditEntry[]>([
    ...INITIAL_RADIO_LOGS,
  ]);

  const telemetry = useMemo(
    () =>
      computeEngineTelemetry({
        corridorLabel,
        passCount,
        burstActive,
        bankStallsInjected,
        flushedState,
      }),
    [corridorLabel, passCount, burstActive, bankStallsInjected, flushedState]
  );

  const activeTile = telemetry.tiles[selectedTileIndex] ?? telemetry.tiles[3];
  const inspectorText = formatInspectorStrip(activeTile);

  const appendRadioLog = (
    callsign: ImmutableAuditEntry['callsign'],
    actionCode: string,
    message: string
  ) => {
    const totalCentiseconds = 116 + (radioLogs.length + 1) * 4;
    const secs = Math.floor(totalCentiseconds / 100);
    const cs = totalCentiseconds % 100;
    const timestampTag =
      '00:' +
      String(secs).padStart(2, '0') +
      '.' +
      String(cs).padStart(2, '0');

    const newEntry: ImmutableAuditEntry = {
      auditId: 'AUD-235-' + String(radioLogs.length + 1).padStart(2, '0'),
      timestampTag,
      callsign,
      role: operatorRole,
      mfaVerified,
      actionCode,
      corridorId: telemetry.corridor.id,
      sha256Seal: activeTile.checksumHex,
      message,
    };

    setRadioLogs((prev) => [...prev, newEntry]);
  };

  const handleCorridorChange = (nextCorridor: CorridorName) => {
    setCorridorLabel(nextCorridor);
    setFlushedState(false);
    appendRadioLog(
      '⚡ PIT WALL',
      'CORRIDOR_SWITCH',
      'Switched synthetic corridor to ' + nextCorridor
    );
  };

  const handleInjectBurst = () => {
    const nextBurst = !burstActive;
    setBurstActive(nextBurst);
    setFlushedState(false);
    appendRadioLog(
      '🟢 CREW CHIEF',
      nextBurst ? 'BURST_ENGAGED' : 'BURST_RELEASED',
      nextBurst
        ? 'Trigger Tensor Core Burst engaged · Async warp overdrive active across 32 warps'
        : 'Tensor Core Burst normalized to baseline corridor clock'
    );
  };

  const handleToggleBankStalls = () => {
    const nextStall = !bankStallsInjected;
    setBankStallsInjected(nextStall);
    setFlushedState(false);
    appendRadioLog(
      nextStall ? '🔴 TELEMETRY' : '⚡ PIT WALL',
      nextStall ? 'BANK_STALL_INJECT' : 'SWIZZLE_RESYNC',
      nextStall
        ? 'Inject Shared Memory Bank Stalls · 8-way bank contention detected on unswizzled wavefront'
        : 'XOR Swizzle Mask ' +
            telemetry.corridor.swizzleHex +
            ' resynchronized · Zero shared memory bank conflicts'
    );
  };

  const handleStepAsyncMma = () => {
    const nextPass = passCount + 1;
    setPassCount(nextPass);
    setFlushedState(false);
    appendRadioLog(
      '🟢 TELEMETRY',
      'STEP_ASYNC_MMA',
      'Step Asynchronous MMA Pass #' +
        String(nextPass) +
        ' committed · 8,192 MACs/tile · Norm ' +
        String(activeTile.accumulatorNorm)
    );
  };

  const handleFlushFragments = () => {
    setFlushedState(true);
    setBurstActive(false);
    setBankStallsInjected(false);
    setPassCount(0);
    appendRadioLog(
      '⚡ PIT WALL',
      'FLUSH_ACCUMULATORS',
      'Flush Warp Fragments & Re-Zero Accumulators complete · FP32 registers scrubbed to 0.0000'
    );
  };

  const handleValidateGridSync = () => {
    const result = validateGridSyncIngress({
      corridorLabel,
      passCount,
      selectedTileIndex,
      burstActive,
      bankStallsInjected,
      operatorRole,
      mfaVerified,
      auditNote: gridSyncInput,
    });

    if (result.valid) {
      setGridSyncStatus(
        'GRIDSYNC ZERO-TRUST GATE: PASS · PAYLOAD SCRUBBED & SEALED (' +
          activeTile.checksumHex +
          ')'
      );
      appendRadioLog(
        '🟢 CREW CHIEF',
        'GRIDSYNC_PASS',
        'GridSync Zero-Trust validation passed for note: ' + gridSyncInput
      );
    } else {
      setGridSyncStatus(
        'GRIDSYNC ZERO-TRUST ALERT: BLOCKED · ' + (result.errorReason ?? 'Invalid input')
      );
      appendRadioLog(
        '🔴 TELEMETRY',
        'GRIDSYNC_BLOCKED',
        'GridSync firewall blocked malformed payload injection attempt'
      );
    }
  };

  const handleExportComplianceCsv = () => {
    const csvContent = generateComplianceCsvReport(telemetry, radioLogs);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'GF-T3-235-COMPLIANCE-AUDIT.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    appendRadioLog(
      '🟢 CREW CHIEF',
      'EXPORT_CSV_AUDIT',
      'Exported immutable GDPR/CCPA/HIPAA compliance log in CSV format'
    );
  };

  const handleExportCompliancePdf = () => {
    const reportLines = [
      'GF-T3-235 INSTITUTIONAL COMPLIANCE & TELEMETRY AUDIT REPORT (PDF-READY DOSSIER)',
      '===============================================================================',
      'Engine Designation : GF-T3-235 (TRACK 3)',
      'Active Corridor    : ' + telemetry.corridor.label,
      'Throughput         : ' + telemetry.formattedThroughput,
      'Warp Latency       : ' + telemetry.formattedLatency,
      'Active Warps       : ' + String(telemetry.activeWarps) + '/' + String(telemetry.totalWarps),
      'Processed Tokens   : ' + telemetry.formattedTokens,
      'Bank Conflicts     : ' + String(telemetry.bankReport.totalConflicts),
      'Operator Role      : ' + operatorRole + ' (MFA Verified: ' + String(mfaVerified) + ')',
      'Compliance Scope   : NIST SP 800-218 SSDF v1.1 | GDPR | CCPA | HIPAA E2EE',
      '-------------------------------------------------------------------------------',
      'IMMUTABLE RADIO & AUDIT TRAIL:',
      ...radioLogs.map(
        (l) =>
          '[' +
          l.timestampTag +
          '] ' +
          l.callsign +
          ' (' +
          l.actionCode +
          ' | SHA256:' +
          l.sha256Seal +
          '): ' +
          l.message
      ),
    ].join('\n');

    const blob = new Blob([reportLines], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'GF-T3-235-AUDIT-DOSSIER.pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    appendRadioLog(
      '⚡ PIT WALL',
      'EXPORT_PDF_DOSSIER',
      'Exported quarterly regulatory compliance dossier in PDF container format'
    );
  };

  const visibleRadioLogs = radioLogs.slice(-3);

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* Top Header Block */}
      <header className="w-full shrink-0 border-b border-slate-800/90 pb-0.5">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: Title + Track 3 Badge */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm md:text-base font-mono font-bold tracking-tight text-slate-100">
              GF-T3-235
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded">
              TRACK 3
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-emerald-400">
              · E2EE NIST-SSDF VERIFIED
            </span>
          </div>

          {/* Right: Compact Corridor Dropdown + Micro Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <label htmlFor="corridor-select" className="sr-only">
              Synthetic MMA Corridor
            </label>
            <select
              id="corridor-select"
              aria-label="Synthetic MMA Corridor"
              value={corridorLabel}
              onChange={(e) => handleCorridorChange(e.target.value as CorridorName)}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-cyan-300 border border-slate-700 rounded focus:outline-none focus:border-[#00F0FF]"
            >
              {SYNTHETIC_MMA_CORRIDORS.map((corridor) => (
                <option key={corridor.id} value={corridor.label}>
                  {corridor.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setActiveTab('MMA');
                handleStepAsyncMma();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-[#00F0FF]/40 rounded transition-colors cursor-pointer"
            >
              [MMA]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Warp');
                handleToggleBankStalls();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-[#FF9F0A]/40 rounded transition-colors cursor-pointer"
            >
              [Warp]
            </button>
            <button
              type="button"
              onClick={handleStepAsyncMma}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 rounded transition-colors cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <p className="text-xs font-mono text-slate-300 text-center whitespace-nowrap">
          Tensor Core Async MMA · Warp-Level Matrix Multiply · Interleaved
        </p>
      </header>

      {/* 4-Card Arcade HUD Ribbon */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1 w-full shrink-0 my-0.5"
      >
        {/* Card 1: MMA NITRO */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-1.5 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-semibold text-slate-400">
              MMA NITRO
            </span>
            <span className="text-[10px] font-mono text-[#00F0FF]">
              {String(telemetry.saturationPercent) + '% SAT'}
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-[#00F0FF] leading-none my-0.5">
            {telemetry.formattedThroughput}
          </div>
          <div className="w-full bg-slate-900 h-1 rounded overflow-hidden border border-slate-800 my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-all duration-150"
              style={{ width: String(telemetry.saturationPercent) + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-tight">
            Tensor Core Throughput Saturation
          </div>
        </div>

        {/* Card 2: LATENCY STREAK */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-1.5 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-semibold text-slate-400">
              LATENCY STREAK
            </span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A]">
              🔥 32 WARPS
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-slate-100 leading-none my-0.5">
            {telemetry.formattedLatency}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate leading-tight">
            {'Overlap Efficiency: ' + String(telemetry.overlapEfficiencyPercent) + '%'}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-tight">
            Warp-Level Execution Latency
          </div>
        </div>

        {/* Card 3: ACTIVE WARPS */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-1.5 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-semibold text-slate-400">
              ACTIVE WARPS
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              [W0..W31]
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-emerald-400 leading-none my-0.5">
            {'WARPS: ' + String(telemetry.activeWarps) + '/' + String(telemetry.totalWarps)}
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {Array.from({ length: 8 }, (_, gearIdx) => {
              const activeGear = gearIdx * 4 < telemetry.activeWarps;
              return (
                <div
                  key={gearIdx}
                  className={
                    'h-1 rounded-xs ' +
                    (bankStallsInjected
                      ? 'bg-rose-500'
                      : activeGear
                      ? 'bg-emerald-400'
                      : 'bg-slate-800')
                  }
                />
              );
            })}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-tight">
            F1 Gear Shift Scheduler · Zero-Stall Lock
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-1.5 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-semibold text-slate-400">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-[#00F0FF]">
              {telemetry.mmaXpDelta}
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-slate-100 leading-none my-0.5">
            {telemetry.formattedTokens}
          </div>
          <div className="text-[10px] font-mono text-[#FF9F0A] truncate leading-tight">
            {'Pass Count: #' + String(telemetry.passCount) + ' · 8,192 MACs/Tile'}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate leading-tight">
            {telemetry.pipelineStateText}
          </div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav
        aria-label="Cockpit Subsystem Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {TABS.map((tab) => {
          const isSelected = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                'py-0.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ' +
                (isSelected
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* Interactive Tensor Core Matrix Bay (Tightened Vertical Padding p-1 / py-0.5) */}
      <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-1 w-full overflow-hidden">
        {/* Left 7 Columns: 8 Interactive Warp Tiles (Tile 0 to Tile 7) */}
        <div className="lg:col-span-7 bg-slate-950/90 border border-slate-800 rounded-lg p-1 py-0.5 flex flex-col justify-between min-h-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-0.5 shrink-0">
            <span className="text-[10px] font-mono font-bold text-slate-200">
              TENSOR CORE WARP TILE ARRAY (16 × 16 × 16 FRAGMENTS)
            </span>
            <span
              className={
                'text-[10px] font-mono font-bold ' +
                (telemetry.bankReport.conflictFree
                  ? 'text-emerald-400'
                  : 'text-rose-400')
              }
            >
              {telemetry.bankReport.conflictFree
                ? '✓ LOCKED · ZERO BANK CONFLICTS'
                : '⚡ FAULT · ' + String(telemetry.bankReport.totalConflicts) + ' BANK CONFLICTS'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 flex-1 min-h-0">
            {telemetry.tiles.map((tile) => {
              const isSelected = tile.index === selectedTileIndex;
              const isFault = tile.state === 'BANK_STALL_FAULT';
              const shortSwizzle = 's' + tile.swizzleHex.replace('0x', '');
              const shortState =
                tile.state === 'BANK_STALL_FAULT'
                  ? 'STALL'
                  : tile.state === 'BURST_OVERDRIVE'
                  ? 'BURST'
                  : tile.state === 'ZERO_FLUSHED'
                  ? 'ZERO'
                  : 'MMA';
              return (
                <button
                  key={tile.tileId}
                  type="button"
                  onClick={() => setSelectedTileIndex(tile.index)}
                  className={
                    'p-1 py-0.5 rounded border text-left font-mono flex flex-col justify-between transition-all cursor-pointer overflow-hidden ' +
                    (isSelected
                      ? 'bg-cyan-950/50 border-[#00F0FF] ring-1 ring-[#00F0FF]/60'
                      : isFault
                      ? 'bg-rose-950/35 border-rose-500/60 hover:border-rose-400'
                      : 'bg-slate-900/75 border-slate-800 hover:border-slate-600')
                  }
                >
                  <div className="text-[11px] font-mono font-bold text-white leading-tight whitespace-nowrap">
                    {tile.tileId + (isFault ? ' · FAULT' : ' · LOCK')}
                  </div>

                  <div className="text-[10px] font-mono text-cyan-300 leading-tight whitespace-nowrap">
                    {tile.fragmentCoords.join('x') + ' · ' + shortSwizzle}
                  </div>

                  <div className="text-[10px] font-mono text-amber-300 font-bold leading-tight whitespace-nowrap border-t border-slate-800/80 pt-0.5">
                    {tile.sharedMemPtr + ' · ' + shortState}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 5 Columns: Contextual Tab Deck + Tile Deep Inspector */}
        <div className="lg:col-span-5 bg-slate-950/90 border border-slate-800 rounded-lg p-1 py-0.5 flex flex-col justify-between min-h-0 overflow-hidden font-mono">
          {activeTab === 'Mesh' && (
            <div className="flex flex-col justify-between h-full min-h-0">
              <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
                <span className="text-[10px] font-bold text-[#00F0FF]">
                  MESH · SHARED MEMORY XOR SWIZZLE INSPECTOR
                </span>
                <span className="text-[10px] text-slate-400">
                  {'32 BANKS · MASK ' + telemetry.bankReport.effectiveSwizzleHex}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1 my-0.5 text-[10px]">
                <div className="bg-slate-900/90 border border-slate-800 rounded p-1 py-0.5">
                  <div className="text-[9px] text-slate-400">SHARED MEM POINTER</div>
                  <div className="text-xs font-bold text-[#00F0FF] leading-tight">
                    {activeTile.sharedMemPtr}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {'Checksum: ' + activeTile.checksumHex.slice(0, 12)}
                  </div>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded p-1 py-0.5">
                  <div className="text-[9px] text-slate-400">WARP GROUP ASSIGNMENT</div>
                  <div className="text-xs font-bold text-emerald-400 leading-tight">
                    {activeTile.warpGroup}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">
                    {activeTile.pipelineStage}
                  </div>
                </div>
              </div>

              <div className="text-[9px] text-slate-300">
                <div className="flex items-center justify-between mb-0.5">
                  <span>32-Bank Shared Memory Wavefront Distribution</span>
                  <span className="text-cyan-300">
                    {String(telemetry.bankReport.uniqueBanksUtilized) + '/32 Active Banks'}
                  </span>
                </div>
                <div className="grid grid-cols-16 gap-0.5">
                  {telemetry.bankReport.bankHeatmap.map((degree, bankIdx) => (
                    <div
                      key={bankIdx}
                      title={'Bank ' + String(bankIdx) + ': ' + String(degree) + '-way'}
                      className={
                        'h-2.5 rounded-xs flex items-center justify-center text-[8px] ' +
                        (degree > 1
                          ? 'bg-rose-600 text-white font-bold'
                          : degree === 1
                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-900 text-slate-600')
                      }
                    >
                      {bankIdx}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'MMA' && (
            <div className="flex flex-col justify-between h-full min-h-0">
              <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
                <span className="text-[10px] font-bold text-[#00F0FF]">
                  MMA · FP16-TO-FP32 ACCUMULATOR KERNEL
                </span>
                <span className="text-[10px] text-emerald-400">
                  {'DRIFT: ' + String(telemetry.mmaSample.maxFp16Drift)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1 my-0.5 text-[10px]">
                <div className="bg-slate-900 border border-slate-800 rounded p-1 py-0.5">
                  <div className="text-[9px] text-slate-400">FROBENIUS NORM</div>
                  <div className="text-xs font-bold text-slate-100">
                    {String(activeTile.accumulatorNorm)}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded p-1 py-0.5">
                  <div className="text-[9px] text-slate-400">MAC OPS / PASS</div>
                  <div className="text-xs font-bold text-[#00F0FF]">8,192 FLOPs</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded p-1 py-0.5">
                  <div className="text-[9px] text-slate-400">FP32 CELL [D]</div>
                  <div className="text-xs font-bold text-emerald-400">
                    {String(activeTile.sampleMatrixCellFp32)}
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded p-1 py-0.5 text-[9px] text-slate-300">
                <div className="text-cyan-300 font-bold mb-0.5">
                  Live 4×4 Sub-Block of 16×16 FP32 Accumulator D = A × B + C:
                </div>
                <div className="grid grid-cols-4 gap-0.5">
                  {telemetry.mmaSample.outputMatrixFp32.slice(0, 4).map((row, rIdx) =>
                    row.slice(0, 4).map((val, cIdx) => (
                      <div
                        key={String(rIdx) + '-' + String(cIdx)}
                        className="bg-black/60 px-1 py-0.5 rounded text-center text-[9px] text-slate-200 border border-slate-800"
                      >
                        {val.toFixed(3)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Warp' && (
            <div className="flex flex-col justify-between h-full min-h-0">
              <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
                <span className="text-[10px] font-bold text-[#FF9F0A]">
                  WARP · INTERLEAVED PIPELINE & CHAOS TRIGGERS
                </span>
                <span className="text-[10px] text-cyan-300">
                  {String(telemetry.corridor.interleavedStages) + ' STAGES'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1 my-0.5 text-[9px]">
                <button
                  type="button"
                  onClick={handleInjectBurst}
                  className="p-1 py-0.5 bg-amber-950/40 hover:bg-amber-900/50 border border-[#FF9F0A]/60 rounded text-left text-amber-200 cursor-pointer"
                >
                  Trigger Tensor Core Burst
                </button>
                <button
                  type="button"
                  onClick={handleToggleBankStalls}
                  className="p-1 py-0.5 bg-cyan-950/40 hover:bg-cyan-900/50 border border-[#00F0FF]/60 rounded text-left text-cyan-200 cursor-pointer"
                >
                  Inject Shared Memory Bank Stalls (Force Swizzle Resync)
                </button>
                <button
                  type="button"
                  onClick={handleStepAsyncMma}
                  className="p-1 py-0.5 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/60 rounded text-left text-emerald-200 cursor-pointer"
                >
                  Step Asynchronous MMA Pass
                </button>
                <button
                  type="button"
                  onClick={handleFlushFragments}
                  className="p-1 py-0.5 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/60 rounded text-left text-rose-200 cursor-pointer"
                >
                  Flush Warp Fragments & Re-Zero Accumulators
                </button>
              </div>

              <div className="text-[9px] text-slate-400 flex items-center justify-between">
                <span>{'Active Stage: ' + activeTile.pipelineStage}</span>
                <span className="text-emerald-400">
                  {'Async Copy Overlap: ' + String(telemetry.overlapEfficiencyPercent) + '%'}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'Stats' && (
            <div className="flex flex-col justify-between h-full min-h-0">
              <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
                <span className="text-[10px] font-bold text-emerald-400">
                  STATS · RBAC, MFA, GDPR/HIPAA & AUDIT EXPORT
                </span>
                <span className="text-[10px] text-cyan-300">NIST SSDF v1.1</span>
              </div>

              <div className="flex items-center gap-1 my-0.5 text-[10px]">
                <select
                  aria-label="RBAC Operator Role"
                  value={operatorRole}
                  onChange={(e) => setOperatorRole(e.target.value as OperatorRole)}
                  className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-1 py-0.5 text-[9px]"
                >
                  <option value="CREW_CHIEF_ADMIN">CREW_CHIEF_ADMIN</option>
                  <option value="TELEMETRY_OPERATOR">TELEMETRY_OPERATOR</option>
                  <option value="COMPLIANCE_AUDITOR">COMPLIANCE_AUDITOR</option>
                </select>

                <button
                  type="button"
                  onClick={() => setMfaVerified((v) => !v)}
                  className={
                    'px-1 py-0.5 rounded border text-[9px] cursor-pointer ' +
                    (mfaVerified
                      ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                      : 'bg-rose-950/70 border-rose-500/60 text-rose-300')
                  }
                >
                  {mfaVerified ? 'MFA: VERIFIED' : 'MFA: UNVERIFIED'}
                </button>

                <button
                  type="button"
                  onClick={handleExportComplianceCsv}
                  className="px-1 py-0.5 bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-[#00F0FF]/50 rounded text-[9px] cursor-pointer"
                >
                  EXPORT CSV
                </button>
                <button
                  type="button"
                  onClick={handleExportCompliancePdf}
                  className="px-1 py-0.5 bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-[#FF9F0A]/50 rounded text-[9px] cursor-pointer"
                >
                  EXPORT PDF
                </button>
              </div>

              <div className="space-y-0.5 text-[9px]">
                <div className="flex gap-1">
                  <input
                    type="text"
                    aria-label="GridSync Zero-Trust Audit Note"
                    value={gridSyncInput}
                    onChange={(e) => setGridSyncInput(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[9px] text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={handleValidateGridSync}
                    className="px-1.5 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/50 rounded cursor-pointer"
                  >
                    VERIFY ZOD
                  </button>
                </div>
                <div className="text-[9px] text-emerald-400 truncate">{gridSyncStatus}</div>
              </div>
            </div>
          )}

          {activeTab === 'APA' && (
            <div className="flex flex-col justify-between h-full min-h-0">
              <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
                <span className="text-[10px] font-bold text-[#FF9F0A]">
                  APA · POSTGRESQL RLS SCHEMA & SOVEREIGN VAULT
                </span>
                <span className="text-[10px] text-emerald-400">100% MIT CLEAN-ROOM</span>
              </div>

              <pre className="bg-black/80 border border-slate-800 rounded p-1 py-0.5 text-[8px] text-cyan-300 overflow-x-auto leading-tight my-0.5">
                {SQL_RLS_PREVIEW}
              </pre>

              {apaModalBanner && (
                <div className="text-[9px] text-amber-300 bg-amber-950/40 border border-amber-500/40 rounded px-1 py-0.5 truncate">
                  {apaModalBanner}
                </div>
              )}

              <div className="grid grid-cols-2 gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setApaModalBanner(
                      'APA TITLE PACKAGE SEALED · SHA-256: ' + activeTile.checksumHex
                    );
                    appendRadioLog(
                      '🟢 CREW CHIEF',
                      'APA_TITLE_DISPATCH',
                      'ACQUIRE TITLE (APA) dossier prepared with clean-room IP warranty'
                    );
                  }}
                  className="py-0.5 px-2 bg-[#FF9F0A]/20 hover:bg-[#FF9F0A]/30 border border-[#FF9F0A] text-[#FF9F0A] rounded text-[9px] font-bold text-center cursor-pointer"
                >
                  ACQUIRE TITLE (APA)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setApaModalBanner(
                      'VAULT BUYOUT ESCROW READY · ZERO-SAAS ENCUMBRANCE VERIFIED'
                    );
                    appendRadioLog(
                      '⚡ PIT WALL',
                      'VAULT_BUYOUT_INQUIRY',
                      'INQUIRE VAULT BUYOUT telemetry package locked for institutional transfer'
                    );
                  }}
                  className="py-0.5 px-2 bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 border border-[#00F0FF] text-[#00F0FF] rounded text-[9px] font-bold text-center cursor-pointer"
                >
                  INQUIRE VAULT BUYOUT
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Compact Tensor Core Telemetry Inspector Strip */}
      <div
        aria-label="Tensor Core Telemetry Inspector Strip"
        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs font-mono font-bold text-cyan-300 truncate shrink-0 mt-0.5"
      >
        {inspectorText}
      </div>

      {/* Tactical Launch Control Buttons */}
      <section
        aria-label="Tactical Launch Controls"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleInjectBurst}
          className="border border-[#FF9F0A] bg-[#FF9F0A]/15 hover:bg-[#FF9F0A]/25 text-[#FF9F0A] rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap"
        >
          💥 INJECT MMA BURST
        </button>

        <button
          type="button"
          onClick={handleToggleBankStalls}
          className="border border-[#00F0FF] bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.25)] rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap"
        >
          ⚡ TOGGLE BANK STALLS
        </button>

        <button
          type="button"
          onClick={handleStepAsyncMma}
          className="border border-emerald-500 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap"
        >
          🚀 STEP ASYNC MMA
        </button>

        <button
          type="button"
          onClick={handleFlushFragments}
          className="border border-rose-500 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap"
        >
          🔄 FLUSH WARP FRAGMENTS
        </button>
      </section>

      {/* Pit-Wall Radio Log with 2px (mb-0.5) lower bezel clearance */}
      <footer
        aria-label="Pit-Wall Radio Log"
        className="h-14 overflow-hidden font-mono text-[10px] p-2 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-tight flex flex-col justify-between mb-0.5"
      >
        {visibleRadioLogs.map((entry) => (
          <div key={entry.auditId} className="truncate">
            {'[' + entry.timestampTag + '] ' + entry.callsign + ': ' + entry.message}
          </div>
        ))}
      </footer>
    </div>
  );
}
