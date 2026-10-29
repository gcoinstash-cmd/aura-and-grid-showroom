/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * GF-T3-231: Track 3 FP8 Quantization & Dynamic Scaling Cockpit
 * F1 Pit Wall & Cyberpunk Arcade Sim · 100% Above-The-Fold Viewport Lock · Zero Dollar Gate
 */

import React, { useState, useMemo } from 'react';
import {
  FP8Format,
  FP8_FORMAT_SPECS,
  SyntheticCorridor,
  QuantizedBlockTelemetry,
  buildAPAVerificationRecord,
  createInitialQuantBlocks,
  quantizeTensorBlock,
  sanitizeGridSyncInput,
} from './engine/fp8Engine';

type CockpitTab = 'Mesh' | 'FP8' | 'Amax' | 'Stats' | 'APA';

const CORRIDOR_OPTIONS: SyntheticCorridor[] = [
  SyntheticCorridor.ALPHA,
  SyntheticCorridor.BRAVO,
  SyntheticCorridor.GAMMA,
  SyntheticCorridor.DELTA,
];

const COCKPIT_TABS: CockpitTab[] = ['Mesh', 'FP8', 'Amax', 'Stats', 'APA'];

const INITIAL_RADIO_LOGS: string[] = [
  '[00:01.04] 🟢 CREW CHIEF: FP8 E4M3/E5M2 kernels ready · Scale staged',
  '[00:01.08] ⚡ PIT WALL: Block amax reduction done · Zero overflow',
  '[00:01.12] 🟢 TELEMETRY: Cast throughput locked at 1,650 GB/s',
];

const SUPABASE_SCHEMA_SNIPPET =
  'CREATE TABLE fp8_quant_blocks (record_id UUID, block_index VARCHAR(8), fp8_format VARCHAR(8), amax_value NUMERIC(14,6), staged_scale NUMERIC(14,8)) PARTITION BY RANGE (recorded_at); ALTER TABLE fp8_quant_blocks ENABLE ROW LEVEL SECURITY;';

function formatClock(stepIndex: number): string {
  const totalCentiseconds = 112 + stepIndex * 4;
  const seconds = Math.floor(totalCentiseconds / 100);
  const centis = totalCentiseconds % 100;
  const secPad = seconds < 10 ? '0' + String(seconds) : String(seconds);
  const cenPad = centis < 10 ? '0' + String(centis) : String(centis);
  return '[00:' + secPad + '.' + cenPad + ']';
}

export default function App() {
  const [blocks, setBlocks] = useState<QuantizedBlockTelemetry[]>(() =>
    createInitialQuantBlocks()
  );
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number>(2); // Defaults to B2
  const [corridor, setCorridor] = useState<SyntheticCorridor>(SyntheticCorridor.ALPHA);
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [bandwidthGbs, setBandwidthGbs] = useState<number>(1650);
  const [kernelLatencyMs, setKernelLatencyMs] = useState<number>(0.11);
  const [tokenUnits, setTokenUnits] = useState<number>(640000);
  const [fp8XpK, setFp8XpK] = useState<number>(12.2);
  const [outlierSpikeActive, setOutlierSpikeActive] = useState<boolean>(false);
  const [stepCounter, setStepCounter] = useState<number>(1);
  const [radioLogs, setRadioLogs] = useState<string[]>(INITIAL_RADIO_LOGS);
  const [customTagInput, setCustomTagInput] = useState<string>('GF-T3-231-ESCROW-LOCK');
  const [sanitizationStatus, setSanitizationStatus] = useState<string>(
    'GRIDSYNC VERIFIED · ZERO TRUST'
  );
  const [apaModalAction, setApaModalAction] = useState<string | null>(null);

  const selectedBlock = blocks[selectedBlockIndex] ?? blocks[2];

  const apaRecord = useMemo(() => {
    try {
      return buildAPAVerificationRecord(customTagInput, true);
    } catch {
      return buildAPAVerificationRecord('GF-T3-231-FALLBACK-SEED', true);
    }
  }, [customTagInput]);

  const appendRadioLog = (callsign: string, message: string) => {
    const nextStep = stepCounter + 1;
    setStepCounter(nextStep);
    const line = formatClock(nextStep) + ' ' + callsign + ': ' + message;
    setRadioLogs((prev) => [line, ...prev.slice(0, 5)]);
  };

  // Chaos & FP8 Stress Trigger 1: Trigger FP8 Quantization Burst ("💥 INJECT QUANT BURST")
  const handleInjectQuantBurst = () => {
    const updated = blocks.map((blk, idx) => {
      const scaledWeights = blk.rawWeights.map((w, wIdx) => {
        const harmonic = 1.0 + ((idx + wIdx + 1) % 3) * 0.04;
        return Number((w * harmonic).toFixed(2));
      });
      const res = quantizeTensorBlock(blk.id, idx, scaledWeights, blk.format);
      if (idx === 2 && !outlierSpikeActive) {
        return {
          ...res,
          amax: Number(res.amax.toFixed(2)),
        };
      }
      return res;
    });
    setBlocks(updated);
    setBandwidthGbs((prev) => Math.min(2480, prev + 85));
    setKernelLatencyMs(0.09);
    setTokenUnits((prev) => prev + 64000);
    setFp8XpK((prev) => Number((prev + 2.4).toFixed(1)));
    appendRadioLog('🟢 CREW CHIEF', 'FP8 Quant Burst executed · FP32 Staged');
  };

  // Chaos & FP8 Stress Trigger 2: Inject Outlier Activation ("⚡ TOGGLE OUTLIER SPIKE")
  const handleToggleOutlierSpike = () => {
    const nextOutlier = !outlierSpikeActive;
    setOutlierSpikeActive(nextOutlier);

    if (nextOutlier) {
      const spikedBlocks = blocks.map((blk, idx) => {
        if (idx === selectedBlockIndex || idx === 3 || idx === 6) {
          const outlierMultiplier = blk.format === FP8Format.E4M3 ? 3.25 : 2.5;
          const spikedWeights = blk.rawWeights.map((w, i) =>
            i === 0 ? Number((w * outlierMultiplier).toFixed(2)) : w
          );
          const overrideMult = idx === 6 ? blk.encodeMultiplier * 1.65 : undefined;
          return quantizeTensorBlock(blk.id, idx, spikedWeights, blk.format, overrideMult);
        }
        return blk;
      });
      setBlocks(spikedBlocks);
      setCorridor(SyntheticCorridor.DELTA);
      setKernelLatencyMs(0.14);
      appendRadioLog(
        '⚡ PIT WALL',
        'Outlier spike injected on ' + selectedBlock.id + ' · Amax rescaled'
      );
    } else {
      const restored = createInitialQuantBlocks();
      setBlocks(restored);
      setCorridor(SyntheticCorridor.ALPHA);
      setKernelLatencyMs(0.11);
      appendRadioLog('🟢 TELEMETRY', 'Outlier spike cleared · 8/8 OPTIMIZED');
    }
  };

  // Chaos & FP8 Stress Trigger 3: Step Mixed-Precision Cast Kernel ("🚀 STEP FP8 KERNEL")
  const handleStepFp8Kernel = () => {
    const stepped = blocks.map((blk, idx) => {
      const nextFormat =
        idx === selectedBlockIndex
          ? blk.format === FP8Format.E4M3
            ? FP8Format.E5M2
            : FP8Format.E4M3
          : blk.format;
      return quantizeTensorBlock(blk.id, idx, blk.rawWeights, nextFormat);
    });
    setBlocks(stepped);
    setBandwidthGbs(1720);
    setTokenUnits((prev) => prev + 32000);
    setFp8XpK((prev) => Number((prev + 1.5).toFixed(1)));
    const newFmt =
      selectedBlock.format === FP8Format.E4M3 ? FP8Format.E5M2 : FP8Format.E4M3;
    appendRadioLog(
      '🟢 TELEMETRY',
      'Stepped FP8 Kernel on ' + selectedBlock.id + ' · Format: ' + newFmt
    );
  };

  // Chaos & FP8 Stress Trigger 4: Flush Scaling Stash & Re-Zero Buffers ("🔄 RESET SCALE STASH")
  const handleResetScaleStash = () => {
    const cleanBlocks = createInitialQuantBlocks();
    setBlocks(cleanBlocks);
    setSelectedBlockIndex(2);
    setOutlierSpikeActive(false);
    setCorridor(SyntheticCorridor.ALPHA);
    setBandwidthGbs(1650);
    setKernelLatencyMs(0.11);
    setTokenUnits(640000);
    setFp8XpK(12.2);
    setApaModalAction(null);
    setRadioLogs(INITIAL_RADIO_LOGS);
  };

  const handleHeaderFp8Toggle = () => {
    const nextCorridor =
      corridor === SyntheticCorridor.ALPHA
        ? SyntheticCorridor.BRAVO
        : SyntheticCorridor.ALPHA;
    setCorridor(nextCorridor);
    setActiveTab('FP8');
    appendRadioLog('🟢 CREW CHIEF', 'Corridor switched · E4M3 / E5M2');
  };

  const handleHeaderAmaxSweep = () => {
    setCorridor(SyntheticCorridor.GAMMA);
    setActiveTab('Amax');
    const maxAmax = Math.max(...blocks.map((b) => b.amax));
    appendRadioLog('⚡ PIT WALL', 'Amax sweep done · Peak: ' + maxAmax.toFixed(2));
  };

  const handleValidateCustomTag = (rawVal: string) => {
    try {
      const clean = sanitizeGridSyncInput(rawVal);
      setCustomTagInput(clean);
      setSanitizationStatus('GRIDSYNC VERIFIED · ZERO TRUST');
      appendRadioLog('🟢 CREW CHIEF', 'GridSync verified: ' + clean);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid payload';
      setSanitizationStatus('⚡ FAULT: ' + msg.toUpperCase());
      appendRadioLog('🔴 TELEMETRY', 'GridSync blocked input');
    }
  };

  const activeSpec = FP8_FORMAT_SPECS[selectedBlock.format];
  const lockedCount = blocks.filter((b) => b.state === 'QUANT_OPTIMIZED').length;
  const shortStateLabel =
    selectedBlock.state === 'QUANT_OPTIMIZED' ? 'OPTIMIZED' : selectedBlock.state;
  const shortPtrLabel =
    selectedBlock.index === 2
      ? '0x7F8A_C400'
      : '0x7F8A_C40' + String(selectedBlock.index);
  const shortClampLabel = selectedBlock.saturationFallback ? 'FP16 FALLBACK' : 'DYNAMIC';

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* TOP COMMAND DECK: Row 1 & Row 2 */}
      <header className="w-full shrink-0 border-b border-slate-800/90 pb-0.5">
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm font-mono font-extrabold tracking-tight text-slate-100">
              GF-T3-231
            </h1>
            <span className="px-1 py-0.5 text-[9px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded">
              TRACK 3
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <label htmlFor="corridor-select" className="sr-only">
              Synthetic FP8 Corridor
            </label>
            <select
              id="corridor-select"
              value={corridor}
              onChange={(e) => {
                const next = e.target.value as SyntheticCorridor;
                setCorridor(next);
                appendRadioLog('⚡ PIT WALL', 'Corridor engaged: ' + next.slice(0, 18));
              }}
              className="max-w-[70px] text-[9px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-[#00F0FF]"
            >
              {CORRIDOR_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleHeaderFp8Toggle}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-[#00F0FF]/40 rounded transition-colors cursor-pointer"
            >
              [FP8]
            </button>
            <button
              type="button"
              onClick={handleHeaderAmaxSweep}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-[#FF9F0A]/40 rounded transition-colors cursor-pointer"
            >
              [Amax]
            </button>
            <button
              type="button"
              onClick={handleInjectQuantBurst}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900/80 text-[#10B981] border border-[#10B981]/50 rounded transition-colors cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        <p className="text-[11px] font-mono text-slate-300 text-center whitespace-nowrap truncate">
          FP8 E4M3/E5M2 Quantization · Dynamic Scaling Factors · Mixed-Precision
        </p>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON (2x2 Grid, Compact p-1.5) */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1 w-full shrink-0"
      >
        {/* Card 1: QUANT NITRO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-md p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              QUANT NITRO
            </span>
            <span className="text-[9px] font-mono font-bold text-emerald-400">
              98.4%
            </span>
          </div>
          <div className="text-base font-bold font-mono text-cyan-300 leading-tight">
            {bandwidthGbs.toLocaleString()} GB/s
          </div>
          <span className="text-[10px] text-slate-300 truncate">
            FP8 Cast Throughput
          </span>
        </div>

        {/* Card 2: AMAX STREAK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-md p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              AMAX STREAK
            </span>
            <span className="px-1 text-[9px] font-mono font-bold bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/40 rounded whitespace-nowrap">
              🔥 E4M3/E5M2
            </span>
          </div>
          <div className="text-base font-bold font-mono text-emerald-400 leading-tight">
            {kernelLatencyMs.toFixed(2)} ms
          </div>
          <span className="text-[10px] text-slate-300 truncate">
            {'Kernel Latency: ' + kernelLatencyMs.toFixed(2) + ' ms'}
          </span>
        </div>

        {/* Card 3: ACTIVE BLOCKS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-md p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              ACTIVE BLOCKS
            </span>
            <span className="text-[9px] font-mono font-bold text-[#10B981]">
              {lockedCount === 8 ? '✓ LOCKED' : '⚡ FAULT'}
            </span>
          </div>
          <div className="text-base font-bold font-mono text-emerald-400 leading-tight">
            BLOCKS: 8/8
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            [B0|B1|B2|B3|B4|B5|B6|B7]
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-md p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              TOKEN SCORE
            </span>
            <span className="text-[9px] font-mono font-bold text-[#10B981] whitespace-nowrap">
              {'+' + fp8XpK.toFixed(1) + 'k FP8 XP'}
            </span>
          </div>
          <div className="text-base font-bold font-mono text-amber-300 leading-tight">
            {tokenUnits.toLocaleString()} UNITS
          </div>
          <span className="text-[10px] text-slate-300 truncate">
            Scale Staging: Active
          </span>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS (Tight py-0.5 my-0.5 text-xs) */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-0.5 bg-slate-900/80 border border-slate-800 rounded-md my-0.5 w-full text-center shrink-0"
      >
        {COCKPIT_TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                'py-0.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer ' +
                (isActive
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* 8-BLOCK QUANTIZATION MATRIX BAY (B0–B7, Compact p-0.5 cards) */}
      <section
        aria-label="8-Block Quantization Matrix Bay"
        className="w-full shrink-0 bg-slate-950/90 border border-slate-800 rounded-md p-1"
      >
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
          {blocks.map((blk, idx) => {
            const isSelected = selectedBlockIndex === idx;
            const isFault = blk.state !== 'QUANT_OPTIMIZED';
            return (
              <button
                key={blk.id}
                type="button"
                onClick={() => setSelectedBlockIndex(idx)}
                className={
                  'rounded-sm p-0.5 text-center border transition-colors cursor-pointer flex flex-col items-center justify-center ' +
                  (isSelected
                    ? 'bg-cyan-950/60 border-cyan-400'
                    : isFault
                    ? 'bg-rose-950/40 border-rose-500/70'
                    : 'bg-slate-900/90 border-cyan-500/50 hover:border-cyan-400')
                }
              >
                <div className="text-[10px] font-mono font-bold text-white leading-tight">
                  {blk.id + ' · ' + blk.format}
                </div>
                <div className="text-[9px] font-mono text-cyan-300 leading-tight">
                  {'AMAX ' + String(blk.amax)}
                </div>
                <div className="text-[9px] font-mono text-amber-300 leading-tight">
                  {'SCALE ' + blk.scale.toFixed(4)}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* COMPACT SLICE & BIT-LEVEL INSPECTOR BOX (p-1, text-[10px], Zero Ellipses) */}
      <section
        aria-label="Slice and Bit-Level Inspector"
        className="w-full shrink-0 bg-slate-950/95 border border-slate-800 rounded-md p-1"
      >
        {activeTab === 'Mesh' && (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-[#00F0FF]">
                {'SLICE & BIT-LEVEL INSPECTOR (' + selectedBlock.id + ')'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('APA');
                    setApaModalAction('ACQUIRE_TITLE');
                  }}
                  className="px-1 py-0.2 bg-[#00F0FF]/15 border border-[#00F0FF]/50 text-[#00F0FF] text-[9px] font-mono font-bold rounded-sm cursor-pointer"
                >
                  ACQUIRE TITLE (APA)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('APA');
                    setApaModalAction('VAULT_BUYOUT');
                  }}
                  className="px-1 py-0.2 bg-[#FF9F0A]/15 border border-[#FF9F0A]/50 text-[#FF9F0A] text-[9px] font-mono font-bold rounded-sm cursor-pointer"
                >
                  INQUIRE VAULT BUYOUT
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
              <div className="bg-slate-900/90 border border-slate-800 rounded-sm px-1.5 py-0.5 text-cyan-300 whitespace-nowrap">
                {'PTR: ' + shortPtrLabel}
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-sm px-1.5 py-0.5 text-amber-300 whitespace-nowrap">
                {'BITS: [' + selectedBlock.sampleBits + ']'}
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-sm px-1.5 py-0.5 text-slate-100 whitespace-nowrap">
                {'MULT: ' + selectedBlock.encodeMultiplier.toFixed(4) + 'x'}
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-sm px-1.5 py-0.5 text-emerald-400 whitespace-nowrap">
                {'CLAMP: ' + shortClampLabel}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'FP8' && (
          <div className="flex flex-col gap-0.5 text-[10px] font-mono">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#FF9F0A]">
                {'DUAL FORMAT (' + selectedBlock.id + ' · ' + selectedBlock.format + ')'}
              </span>
              <span className="text-emerald-400">
                {'SNR: ' + selectedBlock.snrDb + ' dB · MAX: ' + activeSpec.maxNormal}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <div className="bg-slate-900 border border-slate-800 rounded-sm px-1.5 py-0.5 text-cyan-300">
                E4M3: 1S·4E·3M (Max 448.0)
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-sm px-1.5 py-0.5 text-amber-300">
                E5M2: 1S·5E·2M (Max 57,344)
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Amax' && (
          <div className="flex flex-col gap-0.5 text-[10px] font-mono">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#00F0FF]">GRIDSYNC SANITIZER</span>
              <span className="text-emerald-400">{sanitizationStatus}</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                aria-label="GridSync Tag Input"
                type="text"
                value={customTagInput}
                onChange={(e) => handleValidateCustomTag(e.target.value)}
                className="flex-1 bg-black border border-slate-700 rounded-sm px-1.5 py-0.5 text-[10px] font-mono text-cyan-300 focus:outline-none focus:border-[#00F0FF]"
              />
              <span className="text-slate-400 whitespace-nowrap">
                {'CLIP: ' + (selectedBlock.clippingRatio * 100).toFixed(1) + '%'}
              </span>
            </div>
          </div>
        )}

        {activeTab === 'Stats' && (
          <div className="flex flex-col gap-0.5 text-[10px] font-mono">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400">SUPABASE RLS SCHEMA</span>
              <span className="text-cyan-300">MIT CLEAN-ROOM</span>
            </div>
            <div className="bg-black/90 border border-slate-800 rounded-sm px-1.5 py-0.5 text-[9px] text-slate-300 truncate">
              {SUPABASE_SCHEMA_SNIPPET}
            </div>
          </div>
        )}

        {activeTab === 'APA' && (
          <div className="flex flex-col gap-0.5 text-[10px] font-mono">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#00F0FF]">
                {'APA: ' + apaRecord.dualSignedStatus}
              </span>
              <span className="text-amber-300">
                {'MERKLE: ' + apaRecord.merkleEscrowRoot.slice(0, 12)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => {
                  setApaModalAction('ACQUIRE_TITLE');
                  appendRadioLog('🟢 CREW CHIEF', 'APA Title Dossier verified');
                }}
                className="py-0.5 px-1.5 bg-[#00F0FF]/20 border border-[#00F0FF] text-[#00F0FF] text-[10px] font-mono font-bold rounded-sm cursor-pointer"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() => {
                  setApaModalAction('VAULT_BUYOUT');
                  appendRadioLog('⚡ PIT WALL', 'Vault Buyout Escrow locked');
                }}
                className="py-0.5 px-1.5 bg-[#FF9F0A]/20 border border-[#FF9F0A] text-[#FF9F0A] text-[10px] font-mono font-bold rounded-sm cursor-pointer"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        )}
      </section>

      {/* UNCLIPPED COMPACT FP8 TELEMETRY INSPECTOR STRIP */}
      <div
        aria-label="FP8 Telemetry Inspector Strip"
        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-0.5 flex items-center justify-between shrink-0"
      >
        <span className="text-[11px] font-mono font-bold text-cyan-300 whitespace-nowrap">
          {selectedBlock.id +
            ' · ' +
            selectedBlock.format +
            ' · AMAX ' +
            selectedBlock.amax.toFixed(2) +
            ' · SCALE ' +
            selectedBlock.scale.toFixed(4) +
            ' · ' +
            shortStateLabel}
        </span>
      </div>

      {/* TACTICAL LAUNCH CONTROL BUTTONS (4 Switches Fully Visible Above Bezel) */}
      <section
        aria-label="Tactical Launch Controls"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1 w-full shrink-0"
      >
        <button
          type="button"
          onClick={handleInjectQuantBurst}
          className="amber alert border border-[#FF9F0A] bg-[#FF9F0A]/10 hover:bg-[#FF9F0A]/20 text-[#FF9F0A] rounded text-[11px] font-mono font-bold py-1 text-center transition-colors cursor-pointer"
        >
          💥 INJECT QUANT BURST
        </button>

        <button
          type="button"
          onClick={handleToggleOutlierSpike}
          className="bright cyan electric glow border border-[#00F0FF] bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 text-[#00F0FF] rounded text-[11px] font-mono font-bold py-1 text-center transition-colors cursor-pointer"
        >
          ⚡ TOGGLE OUTLIER SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepFp8Kernel}
          className="emerald launch switch border border-[#10B981] bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] rounded text-[11px] font-mono font-bold py-1 text-center transition-colors cursor-pointer"
        >
          🚀 STEP FP8 KERNEL
        </button>

        <button
          type="button"
          onClick={handleResetScaleStash}
          className="rose reset switch border border-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] rounded text-[11px] font-mono font-bold py-1 text-center transition-colors cursor-pointer"
        >
          🔄 RESET SCALE STASH
        </button>
      </section>

      {/* PIT-WALL RADIO LOG (Compact h-12, Unclipped above bottom bezel) */}
      <footer
        aria-label="Pit-Wall Radio Log"
        className="h-12 overflow-hidden font-mono text-[10px] px-2 py-1 bg-black/95 border border-slate-800 rounded shrink-0 text-slate-200 leading-tight flex flex-col justify-between"
      >
        {radioLogs.slice(0, 3).map((logLine, idx) => (
          <div key={idx} className="text-[10px] font-mono leading-tight truncate">
            {logLine}
          </div>
        ))}
      </footer>
    </div>
  );
}
