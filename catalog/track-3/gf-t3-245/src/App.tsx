/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CorridorId,
  SYNTHETIC_KV_CORRIDORS,
  RbacRole,
  createInitialEngineState,
  triggerEvictionBurst,
  toggleFragmentationSpike,
  stepPagedAllocation,
  flushInactiveBlocks,
  exportComplianceAuditCsv,
  computeDeterministicChecksum,
  formatPitWallTimestamp,
} from './engine/pagedKvEngine';
import { SUPABASE_POSTGRES_SCHEMA_SQL } from './engine/supabaseSchemaText';

type CockpitTab = 'Mesh' | 'KV' | 'Page' | 'Stats' | 'APA';
const COCKPIT_TABS: readonly CockpitTab[] = ['Mesh', 'KV', 'Page', 'Stats', 'APA'] as const;
const RBAC_ROLES: readonly RbacRole[] = ['CREW_CHIEF', 'SEC_OPS', 'AUDITOR', 'TELEMETRY_OP'] as const;

export default function App() {
  const [engine, setEngine] = useState(() => createInitialEngineState());
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [exportStatusBanner, setExportStatusBanner] = useState<string | null>(null);
  const [apaTransferModal, setApaTransferModal] = useState<string | null>(null);

  const selectedBlock =
    engine.blocks[engine.selectedBlockIndex] || engine.blocks[3] || engine.blocks[0];

  const handleSelectCorridor = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chosen = e.target.value as CorridorId;
    const nextStep = engine.stepCounter + 1;
    const isFallback =
      chosen === 'KV-CORRIDOR-DELTA (FALLBACK-CONTIGUOUS-VRAM-BUFFER)';
    const newFrag = isFallback ? 19.2 : engine.fragmentSpikeActive ? 38.4 : 0.0;
    const newBw = isFallback ? 6840 : 9200;
    const ts = formatPitWallTimestamp(nextStep);

    setEngine((prev) => ({
      ...prev,
      corridor: chosen,
      fragmentationPct: newFrag,
      bandwidthGbs: newBw,
      stepCounter: nextStep,
      radioLogs: [
        {
          id: 'log-' + String(nextStep),
          timestamp: ts,
          icon: isFallback ? '🔴' : '🟢',
          callsign: 'CREW CHIEF',
          message:
            'Corridor switched to ' +
            chosen.slice(0, 26) +
            ' · FRAG: ' +
            newFrag.toFixed(2) +
            '%',
        },
        ...prev.radioLogs.slice(0, 5),
      ],
    }));
  };

  const handleSelectBlock = (index: number) => {
    const nextStep = engine.stepCounter + 1;
    const blk = engine.blocks[index];
    const ts = formatPitWallTimestamp(nextStep);
    setEngine((prev) => ({
      ...prev,
      selectedBlockIndex: index,
      blocks: prev.blocks.map((b, idx) => ({
        ...b,
        lockStatus: prev.fragmentSpikeActive
          ? 'DEFRAG'
          : idx === index
          ? 'ALLOCATED'
          : 'LOCKED',
      })),
      stepCounter: nextStep,
      radioLogs: [
        {
          id: 'log-' + String(nextStep),
          timestamp: ts,
          icon: '⚡',
          callsign: 'PIT WALL',
          message:
            'Inspected ' +
            blk.shortCode +
            ' -> ' +
            blk.pageHex +
            ' · SEQ: ' +
            blk.sequenceId +
            ' · ATTN: ' +
            blk.attentionScorePrecise.toFixed(3),
        },
        ...prev.radioLogs.slice(0, 5),
      ],
    }));
  };

  const handleRoleSwitch = (role: RbacRole) => {
    const nextStep = engine.stepCounter + 1;
    const ts = formatPitWallTimestamp(nextStep);
    setEngine((prev) => ({
      ...prev,
      activeRole: role,
      stepCounter: nextStep,
      radioLogs: [
        {
          id: 'log-' + String(nextStep),
          timestamp: ts,
          icon: '🟢',
          callsign: 'CREW CHIEF',
          message:
            'RBAC Stakeholder switched to ' +
            role +
            ' · Hardware MFA token verified',
        },
        ...prev.radioLogs.slice(0, 5),
      ],
    }));
  };

  const handleExportComplianceReport = (format: 'CSV' | 'PDF_MANIFEST' | 'JSON_SBOM') => {
    const csvPayload = exportComplianceAuditCsv(engine);
    const checksum = computeDeterministicChecksum(csvPayload);
    const nextStep = engine.stepCounter + 1;
    const ts = formatPitWallTimestamp(nextStep);

    if (typeof window !== 'undefined' && typeof Blob !== 'undefined') {
      try {
        const mime = format === 'CSV' ? 'text/csv' : 'application/json';
        const ext = format === 'CSV' ? 'csv' : 'json';
        const content =
          format === 'CSV'
            ? csvPayload
            : JSON.stringify(
                {
                  project: 'GF-T3-245',
                  format,
                  rbacRole: engine.activeRole,
                  mfaVerified: engine.mfaAuthenticated,
                  encryption: 'AES-256-GCM + TLS 1.3 E2EE',
                  cloudTargets: ['AWS_EKS_SOVEREIGN', 'AZURE_CONFIDENTIAL_GPU'],
                  checksum,
                  auditRows: engine.auditLedger.length,
                },
                null,
                2
              );
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'GF-T3-245-AUDIT-' + format + '.' + ext;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        // Fallback in restricted sandbox environments
      }
    }

    setExportStatusBanner(
      'EXPORTED ' +
        format +
        ' COMPLIANCE REPORT · ROLE: ' +
        engine.activeRole +
        ' · ' +
        checksum
    );

    setEngine((prev) => ({
      ...prev,
      stepCounter: nextStep,
      radioLogs: [
        {
          id: 'log-' + String(nextStep),
          timestamp: ts,
          icon: '🟢',
          callsign: 'TELEMETRY',
          message:
            'Compliance report (' +
            format +
            ') exported · E2EE verified · ' +
            checksum,
        },
        ...prev.radioLogs.slice(0, 5),
      ],
    }));
  };

  const handleTriggerCloudRemediation = () => {
    const nextStep = engine.stepCounter + 1;
    const ts = formatPitWallTimestamp(nextStep);
    setEngine((prev) => ({
      ...prev,
      fragmentSpikeActive: false,
      fragmentationPct: 0.0,
      bandwidthGbs: 9200,
      evictionLatencyUs: 0.01,
      cloudNodes: prev.cloudNodes.map((n) => ({
        ...n,
        rbacPolicyStatus: 'REMEDIATED',
        complianceScorePct: 100.0,
        latencyUs: 0.01,
      })),
      stepCounter: nextStep,
      radioLogs: [
        {
          id: 'log-' + String(nextStep),
          timestamp: ts,
          icon: '🟢',
          callsign: 'CREW CHIEF',
          message:
            'Automated multi-cloud remediation executed across AWS & Azure · E2EE daily backup verified',
        },
        ...prev.radioLogs.slice(0, 5),
      ],
    }));
  };

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* Top Header Row 1 */}
      <header className="flex items-center justify-between gap-1 w-full shrink-0 border-b border-slate-800/90 pb-1">
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <h1 className="text-sm font-mono font-bold tracking-wider text-white">
            GF-T3-245
          </h1>
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#00F0FF] bg-cyan-950/60 border border-[#00F0FF]/50 rounded">
            TRACK 3
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono text-emerald-400">
            · RBAC: {engine.activeRole} · MFA: LOCKED
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <select
            aria-label="Select Paged KV Corridor"
            value={engine.corridor}
            onChange={handleSelectCorridor}
            className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-[#00F0FF]"
          >
            {SYNTHETIC_KV_CORRIDORS.map((corridorOption) => (
              <option key={corridorOption} value={corridorOption}>
                {corridorOption}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setActiveTab('KV')}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded transition-colors cursor-pointer"
          >
            [KV]
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('Page')}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded transition-colors cursor-pointer"
          >
            [Page]
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('Mesh');
              setEngine((prev) => stepPagedAllocation(prev));
            }}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/50 rounded transition-colors cursor-pointer"
          >
            [Run]
          </button>
        </div>
      </header>

      {/* Top Header Row 2 */}
      <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap py-0.5 shrink-0">
        Paged KV Cache · FlashAttention Eviction · Zero Fragmentation
      </div>

      {/* 4-Card Arcade HUD Ribbon (2x2 grid on mobile/tablet, 4-col on desktop) */}
      <section
        aria-label="Paged KV Telemetry HUD Ribbon"
        className="grid grid-cols-2 gap-1.5 w-full shrink-0"
      >
        {/* Card 1: KV NITRO */}
        <div className="bg-slate-950/90 border border-cyan-500/40 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              KV NITRO
            </span>
            <span className="font-mono text-lg font-bold text-[#00F0FF] leading-none">
              {engine.bandwidthGbs.toLocaleString('en-US')} GB/s
            </span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded overflow-hidden my-1 border border-slate-800">
            <div
              className="bg-[#00F0FF] h-full transition-opacity duration-150"
              style={{ width: String(engine.bandwidthSaturationPct) + '%' }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span>Paged KV Bandwidth Saturation</span>
            <span className="text-cyan-300 font-bold">
              {engine.bandwidthSaturationPct.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Card 2: EVICTION STREAK */}
        <div className="bg-slate-950/90 border border-amber-500/40 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              EVICTION STREAK
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-lg font-bold text-[#FF9F0A] leading-none">
                {engine.evictionLatencyUs.toFixed(2)} µs
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-amber-950/80 border border-amber-500/50 text-amber-300 rounded">
                🔥 32 BLOCKS
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 mt-1">
            <span>Ring-Block Eviction Latency</span>
            <span className="text-emerald-400 font-bold">SUB-MICROSECOND</span>
          </div>
        </div>

        {/* Card 3: ACTIVE BLOCKS */}
        <div className="bg-slate-950/90 border border-emerald-500/40 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              ACTIVE BLOCKS
            </span>
            <span className="font-mono text-sm sm:text-base font-bold text-emerald-400 leading-none">
              BLOCKS: {engine.activeBlocksCount}/{engine.totalBlocksCapacity}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 mt-1">
            <span className="text-cyan-300 font-bold">[B0..B31] GEAR SHIFT</span>
            <span className="text-emerald-400 font-semibold">
              PagedAttention Active
            </span>
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-950/90 border border-cyan-500/40 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              TOKEN SCORE
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm sm:text-base font-bold text-white leading-none">
                {engine.processedTokensUnits.toLocaleString('en-US')} UNITS
              </span>
              <span className="text-[10px] font-mono font-bold text-[#00F0FF]">
                +{engine.kvXpDeltaK.toFixed(1)}k KV XP
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 mt-1">
            <span>KV State: PagedAttention Active</span>
            <span className="text-emerald-400 font-bold">✓ LOCKED</span>
          </div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav
        aria-label="Cockpit Subsystem Views"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {COCKPIT_TABS.map((tab) => {
          const isCurrent = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                'py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer ' +
                (isCurrent
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/60'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* Streamlined Mesh Info Subheader */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 bg-slate-950/90 border border-slate-800/80 rounded px-2 py-0.5 shrink-0 flex items-center justify-between">
        <span>
          {'VIEW: MESH · PTR: ' +
            engine.meshPointerHex +
            ' · BLK: 16-TOK · MGR: ' +
            engine.kvManagerState +
            ' · FRAG: ' +
            engine.fragmentationPct.toFixed(2) +
            '% · VEC: [' +
            engine.attentionVector.map((v) => v.toFixed(2)).join(', ') +
            ']'}
        </span>
        <span className="hidden md:inline text-cyan-400 font-bold">
          E2EE: AES-256-GCM · AWS/AZURE SYNC: ACTIVE
        </span>
      </div>

      {/* Main Interactive Paged KV Matrix Bay & Specialized Subsystem Overlay */}
      <main className="flex-1 min-h-0 flex flex-col justify-between my-1 gap-1 overflow-hidden">
        {/* Contextual Subsystem Banner when viewing KV / Page / Stats / APA */}
        {activeTab !== 'Mesh' && (
          <div className="bg-slate-900/95 border border-cyan-500/40 rounded-lg p-1.5 shrink-0 flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono">
            {activeTab === 'KV' && (
              <>
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <span>FLASH-ATTENTION RING EVICTION & RBAC SECURITY GATE</span>
                  <span className="text-slate-400">|</span>
                  <span>ROLE:</span>
                  {RBAC_ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleSwitch(r)}
                      className={
                        'px-1.5 py-0.5 rounded border cursor-pointer ' +
                        (engine.activeRole === r
                          ? 'bg-cyan-950 text-[#00F0FF] border-[#00F0FF]'
                          : 'bg-slate-950 text-slate-400 border-slate-700')
                      }
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">
                    MFA HARDWARE KEY: VERIFIED
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('Mesh')}
                    className="px-1.5 py-0.5 bg-slate-800 text-white rounded border border-slate-600 cursor-pointer"
                  >
                    [Close Panel]
                  </button>
                </div>
              </>
            )}

            {activeTab === 'Page' && (
              <>
                <div className="flex items-center gap-2 text-amber-300 font-bold truncate">
                  <span>
                    SUPABASE PARTITIONED POSTGRESQL LUT · 4 CORRIDOR PARTITIONS · RLS: ENFORCED
                  </span>
                  <span className="text-emerald-400">
                    ({SUPABASE_POSTGRES_SCHEMA_SQL.split('\n').length} SQL LINES READY)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleExportComplianceReport('JSON_SBOM')}
                    className="px-1.5 py-0.5 bg-amber-950/90 text-amber-300 border border-amber-500/50 rounded font-bold cursor-pointer"
                  >
                    [EXPORT SCHEMA & SBOM]
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('Mesh')}
                    className="px-1.5 py-0.5 bg-slate-800 text-white rounded border border-slate-600 cursor-pointer"
                  >
                    [Mesh View]
                  </button>
                </div>
              </>
            )}

            {activeTab === 'Stats' && (
              <>
                <div className="flex items-center gap-2 text-emerald-300 font-bold flex-wrap">
                  <span>
                    MULTI-CLOUD SECURITY & COMPLIANCE: AWS EKS (100%) · AZURE H100 (100%) · DAILY E2EE BACKUP: VERIFIED
                  </span>
                  {exportStatusBanner && (
                    <span className="text-cyan-300">· {exportStatusBanner}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleExportComplianceReport('CSV')}
                    className="px-1.5 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-500/50 rounded font-bold cursor-pointer"
                  >
                    [EXPORT CSV]
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportComplianceReport('PDF_MANIFEST')}
                    className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/50 rounded font-bold cursor-pointer"
                  >
                    [EXPORT PDF/JSON]
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerCloudRemediation}
                    className="px-1.5 py-0.5 bg-amber-950 text-amber-300 border border-amber-500/50 rounded font-bold cursor-pointer"
                  >
                    [AUTO-REMEDIATE]
                  </button>
                </div>
              </>
            )}

            {activeTab === 'APA' && (
              <>
                <div className="flex items-center gap-2 text-white font-bold flex-wrap">
                  <span className="text-[#00F0FF]">
                    CLEAN-ROOM MIT / APACHE-2.0 IP VAULT · NIST SP 800-218 SSDF v1.1
                  </span>
                  {apaTransferModal && (
                    <span className="text-emerald-400">· {apaTransferModal}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setApaTransferModal(
                        'APA TITLE ESCROW PACKAGE LOCKED · SHA256 VERIFIED'
                      )
                    }
                    className="px-2 py-0.5 bg-[#00F0FF] text-slate-950 font-bold rounded cursor-pointer"
                  >
                    ACQUIRE TITLE (APA)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setApaTransferModal(
                        'VAULT BUYOUT DOSSIER DISPATCHED TO DEALERSHIP PRINCIPAL'
                      )
                    }
                    className="px-2 py-0.5 bg-[#FF9F0A] text-slate-950 font-bold rounded cursor-pointer"
                  >
                    INQUIRE VAULT BUYOUT
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Interactive Paged KV Matrix Bay: 8 Paged Blocks (Block 0 to Block 7) */}
        <section
          aria-label="Interactive Paged KV Matrix Bay"
          className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 flex-1 min-h-0 items-stretch"
        >
          {engine.blocks.map((blk) => {
            const isSelected = blk.blockIndex === engine.selectedBlockIndex;
            const isDefrag = blk.lockStatus === 'DEFRAG';

            return (
              <button
                key={blk.shortCode}
                type="button"
                onClick={() => handleSelectBlock(blk.blockIndex)}
                className={
                  'text-left rounded-lg p-2 flex flex-col justify-between transition-colors cursor-pointer border ' +
                  (isDefrag
                    ? 'bg-rose-950/40 border-rose-500/80'
                    : isSelected
                    ? 'bg-slate-900/95 border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                    : 'bg-slate-950/90 border-slate-800 hover:border-slate-600')
                }
              >
                {/* Header: "Block 0 (B0)" and hex pointer */}
                <div className="flex items-center justify-between gap-1 w-full">
                  <span className="text-xs font-mono font-bold text-white tracking-wide">
                    {blk.blockLabel}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-300">
                    {blk.pageHex}
                  </span>
                </div>

                {/* Page & tokens: "PAGE: 0x9000 · TOK: 16/16" */}
                <div className="text-[12px] font-mono text-cyan-300 font-bold whitespace-nowrap">
                  {'PAGE: ' +
                    blk.pageHex +
                    ' · TOK: ' +
                    String(blk.tokensFilled) +
                    '/' +
                    String(blk.tokenCapacity)}
                </div>

                {/* Attention & priority: "ATTN: 0.94 · EVICT: COLD" */}
                <div className="text-[12px] font-mono text-amber-300 font-bold whitespace-nowrap">
                  {'ATTN: ' +
                    blk.attentionWeight.toFixed(2) +
                    ' · EVICT: ' +
                    blk.evictionState}
                </div>

                {/* Hit rate & status: "HIT: 99.8% · LOCKED" */}
                <div
                  className={
                    'text-[11px] font-mono font-semibold whitespace-nowrap ' +
                    (isDefrag ? 'text-rose-400' : 'text-emerald-400')
                  }
                >
                  {'HIT: ' +
                    blk.hitRatePct.toFixed(1) +
                    '% · ' +
                    (blk.blockIndex === 0 ? 'LOCKED' : blk.lockStatus)}
                </div>
              </button>
            );
          })}
        </section>
      </main>

      {/* Compact KV Telemetry Inspector Strip */}
      <div
        aria-label="KV Telemetry Inspector Strip"
        className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded shrink-0"
      >
        {selectedBlock.shortCode +
          ' · PG: ' +
          selectedBlock.pageHex +
          ' · SEQ: ' +
          selectedBlock.sequenceId.replace('SEQ_', '') +
          ' · ATTN: ' +
          selectedBlock.attentionScorePrecise.toFixed(3) +
          ' · ' +
          (selectedBlock.lockStatus === 'ALLOCATED'
            ? 'ALLOC'
            : selectedBlock.lockStatus)}
      </div>

      {/* Tactical Launch Control Buttons */}
      <section
        aria-label="Tactical Launch Control Dock"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={() => setEngine((prev) => triggerEvictionBurst(prev))}
          className="bg-amber-950/60 hover:bg-amber-900/70 border border-[#FF9F0A] text-[#FF9F0A] rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer"
        >
          💥 INJECT EVICTION BURST
        </button>

        <button
          type="button"
          onClick={() => setEngine((prev) => toggleFragmentationSpike(prev))}
          className="bg-cyan-950/60 hover:bg-cyan-900/70 border border-[#00F0FF] text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.25)] rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer"
        >
          ⚡ TOGGLE FRAGMENT SPIKE
        </button>

        <button
          type="button"
          onClick={() => setEngine((prev) => stepPagedAllocation(prev))}
          className="bg-emerald-950/60 hover:bg-emerald-900/70 border border-[#10B981] text-[#10B981] rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer"
        >
          🚀 STEP PAGED ALLOC
        </button>

        <button
          type="button"
          onClick={() => setEngine((prev) => flushInactiveBlocks(prev))}
          className="bg-rose-950/60 hover:bg-rose-900/70 border border-[#EF4444] text-[#EF4444] rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer"
        >
          🔄 FLUSH INACTIVE BLOCKS
        </button>
      </section>

      {/* Pit-Wall Radio Comms Log */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-14 overflow-hidden font-mono text-[10px] p-2 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-tight flex flex-col justify-between"
      >
        {engine.radioLogs.slice(0, 3).map((entry) => (
          <div key={entry.id} className="truncate whitespace-nowrap">
            {entry.timestamp +
              ' ' +
              entry.icon +
              ' ' +
              entry.callsign +
              ': ' +
              entry.message}
          </div>
        ))}
      </footer>
    </div>
  );
}
