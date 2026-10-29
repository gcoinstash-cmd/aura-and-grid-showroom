/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CorridorId,
  createInitialEngineState,
  EngineTelemetryState,
  ScaleChannelNode,
  stepCalibrationPass,
  SYNTHETIC_FP8_CORRIDORS,
  toggleOutlierSaturationState,
} from './engine/fp8Engine';

type TabKey = 'Mesh' | 'FP8' | 'Scal' | 'Stats' | 'APA';

const TABS: TabKey[] = ['Mesh', 'FP8', 'Scal', 'Stats', 'APA'];

const INITIAL_LOGS: string[] = [
  '[00:01.04] 🟢 CREW CHIEF: TensorRT-LLM FP8 quantization and dynamic scaling factor engine initialized · 8 scales linked',
  '[00:01.12] 🟢 TELEMETRY: FP8 tensor core throughput verified at 16,500 GB/s with hardware acceleration',
];

export default function App() {
  const [engineState, setEngineState] = useState<EngineTelemetryState>(() =>
    createInitialEngineState('FP8-CORRIDOR-ALPHA')
  );
  const [selectedScaleIdx, setSelectedScaleIdx] = useState<number>(3);
  const [activeTab, setActiveTab] = useState<TabKey>('Mesh');
  const [radioLogs, setRadioLogs] = useState<string[]>(INITIAL_LOGS);

  const appendRadioLog = (callsign: string, message: string) => {
    const passTag = String(engineState.stepPassCount + 12).padStart(2, '0');
    const line = '[00:01.' + passTag + '] ' + callsign + ': ' + message;
    setRadioLogs((prev) => [line, ...prev.slice(0, 5)]);
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCorridor = e.target.value as CorridorId;
    const fresh = createInitialEngineState(nextCorridor);
    setEngineState(fresh);
    const corridorObj = SYNTHETIC_FP8_CORRIDORS[nextCorridor];
    appendRadioLog(
      '🟢 CREW CHIEF',
      'Corridor switched to ' +
        corridorObj.id +
        ' · Target ' +
        corridorObj.targetGbps.toLocaleString() +
        ' GB/s'
    );
  };

  const handleInjectBurst = () => {
    const nextState = stepCalibrationPass(engineState, 1.5);
    setEngineState(nextState);
    appendRadioLog(
      '⚡ PIT WALL',
      'Trigger FP8 Quantization Burst executed · Throughput ' +
        nextState.throughputGbps.toLocaleString() +
        ' GB/s · Tokens ' +
        nextState.processedTokens.toLocaleString() +
        ' Units'
    );
  };

  const handleToggleOutlierSaturation = () => {
    const nextState = toggleOutlierSaturationState(engineState);
    setEngineState(nextState);
    if (nextState.outlierSaturationActive) {
      appendRadioLog(
        '🔴 TELEMETRY',
        'Inject Outlier Saturation Spike · High-magnitude channel clipping fault on S1, S3, S6 · Force Scale Recalibration'
      );
    } else {
      appendRadioLog(
        '🟢 CREW CHIEF',
        'Outlier-aware per-token clipping restored · 8/8 scales locked at 99.9% accuracy'
      );
    }
  };

  const handleStepCalibrationPass = () => {
    const nextState = stepCalibrationPass(engineState, 1.0);
    setEngineState(nextState);
    appendRadioLog(
      '🟢 TELEMETRY',
      'Step FP8 Pipeline Pass #' +
        String(nextState.stepPassCount) +
        ' complete · Global Scale ' +
        nextState.globalScaleFactor.toFixed(2) +
        ' · Latency ' +
        nextState.calibrationLatencyUs.toFixed(2) +
        ' µs'
    );
  };

  const handleFlushBuffers = () => {
    const resetState = createInitialEngineState(engineState.corridorId);
    setEngineState(resetState);
    setSelectedScaleIdx(3);
    setRadioLogs(INITIAL_LOGS);
  };

  const selectedScale: ScaleChannelNode =
    engineState.scales[selectedScaleIdx] || engineState.scales[3];

  const saturationPct = Math.min(
    100,
    Math.round((engineState.throughputGbps / 18200) * 100)
  );

  const vecString =
    '[' +
    engineState.meshVector.map((v) => v.toFixed(2)).join(', ') +
    ']';

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP HEADER ROW 1 */}
      <div className="flex items-center justify-between gap-1 w-full shrink-0">
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <h1 className="text-sm font-mono font-bold tracking-tight text-white">
            GF-T3-254
          </h1>
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/15 text-[#00F0FF] border border-cyan-500/40 rounded">
            FLAGSHIP
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <select
            aria-label="Select FP8 Corridor"
            value={engineState.corridorId}
            onChange={handleCorridorChange}
            className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-cyan-400"
          >
            {Object.values(SYNTHETIC_FP8_CORRIDORS).map((corridor) => (
              <option key={corridor.id} value={corridor.id}>
                {corridor.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setActiveTab('FP8');
              handleInjectBurst();
            }}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-950/80 hover:bg-cyan-900 text-[#00F0FF] border border-cyan-500/40 rounded cursor-pointer"
          >
            [FP8]
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('Scal');
              handleToggleOutlierSaturation();
            }}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-amber-950/80 hover:bg-amber-900 text-[#FF9F0A] border border-amber-500/40 rounded cursor-pointer"
          >
            [Scale]
          </button>

          <button
            type="button"
            onClick={handleStepCalibrationPass}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900 text-[#10B981] border border-emerald-500/40 rounded cursor-pointer"
          >
            [Run]
          </button>
        </div>
      </div>

      {/* TOP HEADER ROW 2 */}
      <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap shrink-0">
        FP8 Quantization · Dynamic Scaling Factor Calibration · Zero Loss
      </div>

      {/* 4-CARD ARCADE HUD RIBBON (2x2 Grid Above the Fold) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 w-full shrink-0">
        {/* Card 1: FP8 NITRO */}
        <div className="py-1 px-2 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 leading-none">
            <span className="font-bold text-cyan-400">FP8 NITRO</span>
            <span>{String(saturationPct) + '% BUS'}</span>
          </div>
          <div className="font-mono text-lg font-bold text-[#00F0FF] leading-tight">
            {engineState.throughputGbps.toLocaleString() + ' GB/s'}
          </div>
          <div className="w-full h-1 bg-slate-800 rounded overflow-hidden my-0.5">
            <div
              className="h-full bg-[#00F0FF] transition-opacity duration-150"
              style={{ width: String(saturationPct) + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-none">
            FP8 Throughput Saturation
          </div>
        </div>

        {/* Card 2: SCALE STREAK */}
        <div className="py-1 px-2 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 leading-none">
            <span className="font-bold text-amber-400">SCALE STREAK</span>
            <span className="text-amber-300 font-bold">
              {'🔥 ' + engineState.streakMultiplier.toFixed(2) + 'x'}
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-[#FF9F0A] leading-tight">
            {engineState.calibrationLatencyUs.toFixed(2) + ' µs'}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-none">
            Scaling Factor Calibration Latency
          </div>
        </div>

        {/* Card 3: ACTIVE SCALES */}
        <div className="py-1 px-2 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 leading-none">
            <span className="font-bold text-emerald-400">ACTIVE SCALES</span>
            <span className="text-cyan-300 font-bold">[S0..S7]</span>
          </div>
          <div className="font-mono text-lg font-bold text-[#10B981] leading-tight">
            {'SCALES: ' +
              String(engineState.activeScalesCount) +
              '/' +
              String(engineState.totalScalesCount)}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-none">
            {'Active Scales: ' + String(engineState.activeScalesCount) + ' Scales · Quantized Active'}
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="py-1 px-2 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 leading-none">
            <span className="font-bold text-cyan-300">TOKEN SCORE</span>
            <span className="text-emerald-400 font-bold">
              {'+' + engineState.engineXpK.toFixed(1) + 'k ENGINE XP'}
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-tight">
            {engineState.processedTokens.toLocaleString() + ' UNITS'}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-none">
            {'FP8 State: ' + engineState.fp8StateLabel}
          </div>
        </div>
      </div>

      {/* 5 HORIZONTAL TABS */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'APA') {
                  appendRadioLog(
                    '🟢 CREW CHIEF',
                    'ACQUIRE TITLE (APA) · INQUIRE VAULT BUYOUT ready for institutional transfer'
                  );
                }
              }}
              className={
                'py-0.5 text-[11px] font-mono font-bold rounded transition-colors cursor-pointer ' +
                (isActive
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50'
                  : 'text-slate-400 hover:text-slate-200')
              }
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* STREAMLINED MESH INFO SUBHEADER */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 shrink-0">
        {'VIEW: MESH · PTR: ' +
          engineState.meshPointerHex +
          ' · MODE: ' +
          engineState.meshMode +
          ' · SCALE: ' +
          engineState.globalScaleFactor.toFixed(2) +
          ' · VEC: ' +
          vecString}
      </div>

      {/* INTERACTIVE FP8 SCALE MATRIX BAY (S0–S7) - STRICT 4x2 GRID */}
      <div className="grid grid-cols-4 gap-1 w-full shrink-0">
        {engineState.scales.map((scaleNode) => {
          const isSelected = scaleNode.index === selectedScaleIdx;
          return (
            <div
              key={scaleNode.scaleId}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedScaleIdx(scaleNode.index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedScaleIdx(scaleNode.index);
                }
              }}
              className={
                'py-0.5 px-1.5 rounded border border-slate-800 bg-slate-900/60 text-left cursor-pointer ' +
                (isSelected ? 'ring-1 ring-[#00F0FF]' : '')
              }
            >
              <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center leading-tight">
                <span>{scaleNode.label}</span>
                <span>{scaleNode.pointerHex}</span>
              </div>
              <div className="text-[12px] font-mono text-cyan-300 font-bold leading-tight">
                {'SCALE: ' +
                  scaleNode.scaleFactor.toFixed(2) +
                  ' · BITS: ' +
                  scaleNode.bitsFormat}
              </div>
              <div className="text-[12px] font-mono text-amber-300 font-bold leading-tight">
                {'OUTLIER: ' +
                  scaleNode.outlierPct.toFixed(2) +
                  '% · LAT: ' +
                  scaleNode.latencyMs.toFixed(2) +
                  'ms'}
              </div>
              <div
                className={
                  'text-[10px] font-mono font-semibold leading-tight ' +
                  (scaleNode.locked ? 'text-emerald-400' : 'text-[#EF4444]')
                }
              >
                {scaleNode.locked
                  ? 'STATE: QUANTIZED · LOCKED'
                  : 'STATE: FAULT · UNLOCKED'}
              </div>
            </div>
          );
        })}
      </div>

      {/* COMPACT FP8 TELEMETRY INSPECTOR STRIP */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {selectedScale.scaleId +
          ' · SCALE: ' +
          selectedScale.scaleFactor.toFixed(2) +
          ' · BITS: ' +
          selectedScale.bitsFormat +
          ' · OUTLIER: ' +
          selectedScale.outlierPct.toFixed(2) +
          '% · PTR ' +
          selectedScale.pointerHex +
          ' · ACCURACY: ' +
          selectedScale.accuracyPct.toFixed(1) +
          '% · ' +
          (selectedScale.locked ? 'LOCKED' : 'FAULT')}
      </div>

      {/* TACTICAL LAUNCH CONTROL BUTTONS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1">
        <button
          type="button"
          onClick={handleInjectBurst}
          className="border border-[#FF9F0A] bg-amber-950/40 hover:bg-amber-900/50 text-[#FF9F0A] rounded text-xs font-mono font-bold py-2 text-center cursor-pointer transition-colors"
        >
          💥 INJECT FP8 QUANTIZATION BURST
        </button>

        <button
          type="button"
          onClick={handleToggleOutlierSaturation}
          className="border border-[#00F0FF] bg-cyan-950/40 hover:bg-cyan-900/50 text-[#00F0FF] rounded text-xs font-mono font-bold py-2 text-center cursor-pointer transition-colors"
        >
          ⚡ TOGGLE OUTLIER SATURATION
        </button>

        <button
          type="button"
          onClick={handleStepCalibrationPass}
          className="border border-[#10B981] bg-emerald-950/40 hover:bg-emerald-900/50 text-[#10B981] rounded text-xs font-mono font-bold py-2 text-center cursor-pointer transition-colors"
        >
          🚀 STEP FP8 CALIBRATION PASS
        </button>

        <button
          type="button"
          onClick={handleFlushBuffers}
          className="border border-[#EF4444] bg-rose-950/40 hover:bg-rose-900/50 text-[#EF4444] rounded text-xs font-mono font-bold py-2 text-center cursor-pointer transition-colors"
        >
          🔄 FLUSH QUANTIZATION BUFFERS
        </button>
      </div>

      {/* PIT-WALL RADIO COMMS LOG */}
      <div className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center">
        {radioLogs.slice(0, 2).map((logLine, idx) => (
          <div key={idx} className="truncate">
            {logLine}
          </div>
        ))}
      </div>
    </div>
  );
}
