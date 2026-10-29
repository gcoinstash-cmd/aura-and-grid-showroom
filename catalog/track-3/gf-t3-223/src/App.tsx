import React, { useState, useMemo } from 'react';

type TabKey = 'Mesh' | 'Speculation' | 'Verify' | 'Sampling' | 'Transfer';

type StressRegime = 'NOMINAL' | 'HIGH_ENTROPY_DIVERGENCE' | 'FASTPATH_100';

interface CorridorSpec {
  id: string;
  shortCode: string;
  fullName: string;
  defaultK: number;
  draftStepMs: number;
  targetBatchMs: number;
  baselineAlpha: number;
}

interface TokenVerificationNode {
  step: number;
  tokenText: string;
  pDraft: number;
  pTarget: number;
  status: 'ACCEPTED' | 'REJECTED';
  reason: string;
}

interface RadioLogEntry {
  timestamp: string;
  badge: string;
  callsign: string;
  tone: 'emerald' | 'rose' | 'cyan' | 'amber';
  message: string;
}

const CORRIDORS: CorridorSpec[] = [
  {
    id: 'SPEC-CORRIDOR-ALPHA (DRAFT-K4 · HIGH-ENTROPY-VERIFIER)',
    shortCode: 'ALPHA',
    fullName: 'SPEC-CORRIDOR-ALPHA (DRAFT-K4 · HIGH-ENTROPY-VERIFIER)',
    defaultK: 4,
    draftStepMs: 0.85,
    targetBatchMs: 11.4,
    baselineAlpha: 0.72,
  },
  {
    id: 'SPEC-CORRIDOR-BRAVO (DRAFT-K6 · CODE-COMPLETION-FASTPATH)',
    shortCode: 'BRAVO',
    fullName: 'SPEC-CORRIDOR-BRAVO (DRAFT-K6 · CODE-COMPLETION-FASTPATH)',
    defaultK: 6,
    draftStepMs: 0.78,
    targetBatchMs: 12.1,
    baselineAlpha: 0.86,
  },
  {
    id: 'SPEC-CORRIDOR-GAMMA (ADAPTIVE-HORIZON-BALANCER)',
    shortCode: 'GAMMA',
    fullName: 'SPEC-CORRIDOR-GAMMA (ADAPTIVE-HORIZON-BALANCER)',
    defaultK: 6,
    draftStepMs: 0.84,
    targetBatchMs: 12.1,
    baselineAlpha: 0.784,
  },
  {
    id: 'SPEC-CORRIDOR-DELTA (REJECTION-SAMPLING-FALLBACK)',
    shortCode: 'DELTA',
    fullName: 'SPEC-CORRIDOR-DELTA (REJECTION-SAMPLING-FALLBACK)',
    defaultK: 3,
    draftStepMs: 0.92,
    targetBatchMs: 11.8,
    baselineAlpha: 0.54,
  },
];

const SHORT_TOKEN_LABELS: string[] = ['alpha', 'beta', 'gamma', 'delta', 'sync'];

const INITIAL_RADIO_LOGS: RadioLogEntry[] = [
  {
    timestamp: '[00:01.42]',
    badge: '🟢',
    callsign: 'CREW CHIEF:',
    tone: 'emerald',
    message: 'Nitro fastpath locked · K=6 boost engaged',
  },
  {
    timestamp: '[00:01.18]',
    badge: '🔴',
    callsign: 'TELEMETRY:',
    tone: 'rose',
    message: 'Slip detected at Step K=5 · Instant correction applied',
  },
  {
    timestamp: '[00:01.12]',
    badge: '⚡',
    callsign: 'PIT WALL:',
    tone: 'cyan',
    message: '4/5 tokens cleared · Sector 2 green',
  },
];

function playArcadeTone(freq: number, durationMs: number) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch {
    // Audio context optional in headless preview
  }
}

function formatIntWithCommas(val: number): string {
  return val.toLocaleString('en-US');
}

function buildVerificationPass(
  kWindow: number,
  regime: StressRegime,
  corridor: CorridorSpec
): {
  nodes: TokenVerificationNode[];
  acceptedCount: number;
  committedCount: number;
  bonusOrResidualToken: string;
  klDivergenceNats: number;
} {
  const nodes: TokenVerificationNode[] = [];
  let acceptedCount = 0;
  let bonusToken = 'omega';

  for (let i = 0; i < 5; i++) {
    const stepNum = i + 1;
    const tokStr = SHORT_TOKEN_LABELS[i % SHORT_TOKEN_LABELS.length];

    let pDraft = 0.56;
    let pTarget = 0.62;

    if (regime === 'FASTPATH_100') {
      pDraft = Number((0.56 + i * 0.03).toFixed(2));
      pTarget = Number((pDraft + 0.08).toFixed(2));
    } else if (regime === 'HIGH_ENTROPY_DIVERGENCE') {
      if (i === 0) {
        pDraft = 0.56;
        pTarget = 0.62;
      } else {
        pDraft = 0.64;
        pTarget = 0.27;
      }
    } else {
      const rejectAtStep = Math.max(2, Math.min(5, Math.round(5 * corridor.baselineAlpha)));
      if (stepNum <= rejectAtStep) {
        pDraft = Number((0.56 + i * 0.02).toFixed(2));
        pTarget = Number((pDraft + 0.06).toFixed(2));
      } else {
        pDraft = 0.64;
        pTarget = 0.27;
      }
    }

    const isAccepted = pTarget >= pDraft && stepNum <= kWindow;
    if (isAccepted) {
      acceptedCount += 1;
      nodes.push({
        step: stepNum,
        tokenText: tokStr,
        pDraft,
        pTarget,
        status: 'ACCEPTED',
        reason: 'Direct Accept (Locked)',
      });
    } else {
      bonusToken = 'res_tok';
      nodes.push({
        step: stepNum,
        tokenText: tokStr,
        pDraft,
        pTarget,
        status: 'REJECTED',
        reason: 'Resampled (P_t - P_d)+',
      });
    }
  }

  const klDivergenceNats =
    regime === 'FASTPATH_100' ? 0.012 : regime === 'HIGH_ENTROPY_DIVERGENCE' ? 0.384 : 0.068;

  return {
    nodes,
    acceptedCount,
    committedCount: acceptedCount + 1,
    bonusOrResidualToken: bonusToken,
    klDivergenceNats,
  };
}

export default function App() {
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>(
    'SPEC-CORRIDOR-GAMMA (ADAPTIVE-HORIZON-BALANCER)'
  );
  const [activeTab, setActiveTab] = useState<TabKey>('Verify');
  const [kWindow, setKWindow] = useState<number>(6);
  const [stressRegime, setStressRegime] = useState<StressRegime>('NOMINAL');
  const [rollingAcceptancePct, setRollingAcceptancePct] = useState<number>(98.6);
  const [speculativeSpeedup, setSpeculativeSpeedup] = useState<number>(3.42);
  const [committedTokens, setCommittedTokens] = useState<number>(94207);
  const [comboStreak, setComboStreak] = useState<number>(14);
  const [xpGain, setXpGain] = useState<number>(500);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const [pulsingStepIndex, setPulsingStepIndex] = useState<number | null>(null);
  const [radioLogs, setRadioLogs] = useState<RadioLogEntry[]>(INITIAL_RADIO_LOGS);
  const [tickCount, setTickCount] = useState<number>(48);

  const activeCorridor = useMemo(() => {
    return CORRIDORS.find((c) => c.id === selectedCorridorId) || CORRIDORS[2];
  }, [selectedCorridorId]);

  const currentPass = useMemo(() => {
    return buildVerificationPass(kWindow, stressRegime, activeCorridor);
  }, [kWindow, stressRegime, activeCorridor]);

  const draftLatencyMs = Number((kWindow * activeCorridor.draftStepMs).toFixed(1));
  const targetStepMs = Number(activeCorridor.targetBatchMs.toFixed(1));
  const nitroFillPct = Math.min(100, Math.max(18, Math.round((speculativeSpeedup / 4.0) * 100)));

  function pushRadioLog(
    badge: string,
    callsign: string,
    tone: 'emerald' | 'rose' | 'cyan' | 'amber',
    message: string
  ) {
    const nextTick = tickCount + 9;
    setTickCount(nextTick);
    const sec = Math.floor(nextTick / 100) + 1;
    const rem = nextTick % 100;
    const secStr = sec < 10 ? '0' + sec : String(sec);
    const remStr = rem < 10 ? '0' + rem : String(rem);
    const entry: RadioLogEntry = {
      timestamp: '[00:' + secStr + '.' + remStr + ']',
      badge,
      callsign,
      tone,
      message,
    };
    setRadioLogs((prev) => [entry, ...prev.slice(0, 2)]);
  }

  function handleCorridorChange(newCorridorId: string) {
    playArcadeTone(520, 70);
    const found = CORRIDORS.find((c) => c.id === newCorridorId) || CORRIDORS[2];
    setSelectedCorridorId(found.id);
    setKWindow(found.defaultK);
    const nextAlpha = Number((found.baselineAlpha * 100).toFixed(1));
    setRollingAcceptancePct(nextAlpha);
    const alpha = found.baselineAlpha;
    const expectedTokens =
      alpha >= 0.999 ? found.defaultK + 1 : (1 - Math.pow(alpha, found.defaultK + 1)) / (1 - alpha);
    const cycleMs = found.defaultK * found.draftStepMs + found.targetBatchMs;
    const calcSpeedup = Number(
      Math.max(1.15, (expectedTokens * found.targetBatchMs) / cycleMs).toFixed(2)
    );
    setSpeculativeSpeedup(found.shortCode === 'GAMMA' ? 3.42 : calcSpeedup);
    setStressRegime('NOMINAL');
    setSelectedStepIndex(0);
    pushRadioLog('⚡', 'PIT WALL:', 'cyan', 'Switched corridor to ' + found.shortCode + ' · Gear K=' + found.defaultK);
  }

  function handleDraftAction() {
    playArcadeTone(580, 60);
    setSelectedStepIndex(0);
    setXpGain(250);
    pushRadioLog('⚡', 'PIT WALL:', 'cyan', 'Drafted K=' + kWindow + ' candidate tokens in ' + draftLatencyMs.toFixed(1) + ' ms');
  }

  function handleVerifyAction() {
    playArcadeTone(740, 85);
    const nextCommitted = committedTokens + currentPass.committedCount * 120;
    setCommittedTokens(nextCommitted);
    setComboStreak((prev) => prev + 1);
    setXpGain(500);
    pushRadioLog(
      '🟢',
      'CREW CHIEF:',
      'emerald',
      currentPass.acceptedCount + '/5 tokens cleared · +' + currentPass.committedCount * 120 + ' PTS banked'
    );
  }

  function handleRunCycleAction() {
    playArcadeTone(880, 100);
    setStressRegime('NOMINAL');
    const nextCommitted = committedTokens + 500;
    setCommittedTokens(nextCommitted);
    setComboStreak((prev) => prev + 2);
    setXpGain(750);
    pushRadioLog('🟢', 'CREW CHIEF:', 'emerald', 'Full throttle lap · ' + speculativeSpeedup.toFixed(2) + 'x speedup sustained');
  }

  function triggerHighEntropyDivergence() {
    playArcadeTone(240, 120);
    setStressRegime('HIGH_ENTROPY_DIVERGENCE');
    const contractedK = Math.max(2, kWindow - 1);
    setRollingAcceptancePct(54.2);
    setSpeculativeSpeedup(1.68);
    setKWindow(contractedK);
    setComboStreak(1);
    setXpGain(150);
    setSelectedStepIndex(1);
    setPulsingStepIndex(1);
    pushRadioLog(
      '🔴',
      'TELEMETRY:',
      'rose',
      'Slip detected at Step K=2 · Instant residual resample applied · Downshifted K=' + contractedK
    );
  }

  function triggerDeterministicFastpath() {
    playArcadeTone(960, 110);
    setStressRegime('FASTPATH_100');
    const expandedK = Math.min(8, Math.max(6, kWindow + 1));
    setRollingAcceptancePct(98.6);
    setSpeculativeSpeedup(3.42);
    setKWindow(expandedK);
    setComboStreak((prev) => prev + 5);
    setXpGain(1000);
    setCommittedTokens((prev) => prev + 1000);
    setSelectedStepIndex(0);
    setPulsingStepIndex(0);
    pushRadioLog('🟢', 'CREW CHIEF:', 'emerald', 'Nitro fastpath locked · K=' + expandedK + ' boost engaged');
  }

  function triggerShiftGearStep() {
    playArcadeTone(780, 90);
    setStressRegime('NOMINAL');
    const nextGear = kWindow >= 8 ? 2 : kWindow + 1;
    setKWindow(nextGear);
    setRollingAcceptancePct(89.4);
    setSpeculativeSpeedup(Number((2.1 + nextGear * 0.22).toFixed(2)));
    setComboStreak((prev) => prev + 3);
    setXpGain(600);
    setCommittedTokens((prev) => prev + 600);
    setSelectedStepIndex(0);
    pushRadioLog('⚡', 'PIT WALL:', 'cyan', 'Upshifted Draft Gear to K=' + nextGear + ' · Sector 2 green');
  }

  function triggerFlushAndReset() {
    playArcadeTone(440, 80);
    setSelectedCorridorId('SPEC-CORRIDOR-GAMMA (ADAPTIVE-HORIZON-BALANCER)');
    setStressRegime('NOMINAL');
    setKWindow(6);
    setRollingAcceptancePct(98.6);
    setSpeculativeSpeedup(3.42);
    setCommittedTokens(94207);
    setComboStreak(14);
    setXpGain(500);
    setSelectedStepIndex(0);
    setPulsingStepIndex(null);
    setRadioLogs(INITIAL_RADIO_LOGS);
  }

  function handleSelectCandidateCard(idx: number) {
    playArcadeTone(660 + idx * 70, 65);
    setSelectedStepIndex(idx);
    setPulsingStepIndex(idx);
    const node = currentPass.nodes[idx];
    if (node) {
      pushRadioLog(
        node.status === 'ACCEPTED' ? '🟢' : '🔴',
        node.status === 'ACCEPTED' ? 'CREW CHIEF:' : 'TELEMETRY:',
        node.status === 'ACCEPTED' ? 'emerald' : 'rose',
        'Inspected Slot K=' + node.step + ' (' + node.tokenText + ') · ' + node.reason
      );
    }
  }

  const inspectedNode =
    currentPass.nodes[Math.min(selectedStepIndex, currentPass.nodes.length - 1)] ||
    currentPass.nodes[0];

  const tabs: TabKey[] = ['Mesh', 'Speculation', 'Verify', 'Sampling', 'Transfer'];
  const gears: number[] = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="p-2 bg-[#05070B] text-slate-100 flex flex-col justify-between h-screen overflow-hidden max-w-full mx-auto select-none">
      <div className="w-full max-w-[1440px] mx-auto flex flex-col justify-between h-full">
        {/* 1. HEADER */}
        <header className="w-full shrink-0">
          <div className="flex items-center justify-between w-full pb-1 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white font-mono">
                GF-T3-223
              </h1>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-mono shadow-[0_0_8px_rgba(34,211,238,0.25)]">
                TRACK 3
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0 text-[10px] font-mono">
              <select
                aria-label="Select Speculative Corridor"
                value={selectedCorridorId}
                onChange={(e) => handleCorridorChange(e.target.value)}
                className="max-w-[55px] truncate bg-slate-900 text-slate-200 border border-slate-700 rounded px-1 py-0.5 text-[10px] font-mono focus:outline-none focus:border-cyan-400"
                title={activeCorridor.fullName}
              >
                {CORRIDORS.map((corridor) => (
                  <option key={corridor.id} value={corridor.id}>
                    {corridor.fullName}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleDraftAction}
                className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded transition-colors cursor-pointer"
              >
                [Draft]
              </button>
              <button
                type="button"
                onClick={handleVerifyAction}
                className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 rounded transition-colors cursor-pointer"
              >
                [Verify]
              </button>
              <button
                type="button"
                onClick={handleRunCycleAction}
                className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-700/60 rounded transition-colors cursor-pointer"
              >
                [Run]
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 py-0.5">
            Speculative Decoding Harness · Draft Verification · Rejection Sampling
          </p>
        </header>

        {/* 2. ARCADE F1 HUD TELEMETRY & COMBO STREAKS */}
        <section
          aria-label="Arcade HUD Telemetry Gauges"
          className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 my-1 w-full shrink-0"
        >
          {/* Card 1: NITRO MULTIPLIER */}
          <div className="p-2 bg-slate-900/95 border border-cyan-500/40 rounded-lg flex flex-col justify-between shadow-[0_0_12px_rgba(6,182,212,0.12)]">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-mono font-bold text-cyan-300">NITRO MULTIPLIER</span>
              <span className="text-[11px] font-mono font-medium text-slate-300">
                {'Draft: ' + draftLatencyMs.toFixed(1) + 'ms'}
              </span>
            </div>
            <div className="text-base font-bold text-cyan-300 font-mono tracking-tight drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]">
              {speculativeSpeedup.toFixed(2) + 'x SPEEDUP'}
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-cyan-500/30 mt-1">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-200"
                style={{ width: nitroFillPct + '%' }}
              />
            </div>
          </div>

          {/* Card 2: COMBO STREAK */}
          <div className="p-2 bg-slate-900/95 border border-emerald-500/40 rounded-lg flex flex-col justify-between shadow-[0_0_12px_rgba(16,185,129,0.12)]">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-mono font-bold text-emerald-300">COMBO STREAK</span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-400/40">
                {'🔥 ' + comboStreak + ' STREAK'}
              </span>
            </div>
            <div className="text-base font-bold text-emerald-400 font-mono tracking-tight drop-shadow-[0_0_6px_rgba(52,211,153,0.45)]">
              {rollingAcceptancePct.toFixed(1) + '% HIT'}
            </div>
            <div className="text-[11px] font-mono font-medium text-slate-300">
              {currentPass.acceptedCount + '/5 Slots Locked'}
            </div>
          </div>

          {/* Card 3: DRAFT GEAR */}
          <div className="p-2 bg-slate-900/95 border border-emerald-500/40 rounded-lg flex flex-col justify-between shadow-[0_0_12px_rgba(16,185,129,0.12)]">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-mono font-bold text-emerald-300">DRAFT GEAR</span>
              <span className="text-[11px] font-mono font-medium text-slate-300">F1 SHIFT</span>
            </div>
            <div className="text-base font-bold text-emerald-400 font-mono tracking-tight">
              {'GEAR K=' + kWindow}
            </div>
            <div className="grid grid-cols-8 gap-0.5 mt-0.5">
              {gears.map((g) => {
                const isCurrentGear = g === kWindow;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      playArcadeTone(500 + g * 45, 50);
                      setKWindow(g);
                    }}
                    className={
                      'text-[11px] font-mono font-bold py-0.5 px-1.5 rounded text-center transition-colors cursor-pointer ' +
                      (isCurrentGear
                        ? 'bg-emerald-400 text-slate-950 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                        : 'bg-slate-950 text-slate-300 border border-slate-800 hover:text-white')
                    }
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 4: TOKEN SCORE */}
          <div className="p-2 bg-slate-900/95 border border-cyan-500/40 rounded-lg flex flex-col justify-between shadow-[0_0_12px_rgba(6,182,212,0.12)]">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-mono font-bold text-slate-300">TOKEN SCORE</span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                {'+' + xpGain + ' SPEED XP'}
              </span>
            </div>
            <div className="text-base font-bold text-white font-mono tracking-tight">
              {formatIntWithCommas(committedTokens) + ' PTS'}
            </div>
            <div className="text-[11px] font-mono font-medium text-slate-300">
              {'Step: ' + targetStepMs.toFixed(1) + ' ms'}
            </div>
          </div>
        </section>

        {/* 3. CLEAN 5-TAB NAVIGATION BAR */}
        <nav
          aria-label="Verification Cockpit Views"
          className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-0.5 w-full text-center shrink-0"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  playArcadeTone(600, 45);
                  setActiveTab(tab);
                }}
                className={
                  'text-xs font-mono font-semibold py-1.5 px-3 rounded text-center transition-colors cursor-pointer truncate ' +
                  (isActive
                    ? 'bg-cyan-950/60 border border-cyan-500 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent')
                }
              >
                {tab}
              </button>
            );
          })}
        </nav>

        {/* 4. INTERACTIVE PIT-LANE CANDIDATE STRIP & TACTICAL LAUNCH CONTROLS */}
        <main className="w-full flex-1 flex flex-col justify-between min-h-0">
          {/* K=1..5 Arcade Slot Candidate Cards */}
          <div className="grid grid-cols-5 gap-1 my-0.5 w-full text-center">
            {currentPass.nodes.map((node, idx) => {
              const isSelected = idx === selectedStepIndex;
              const isPulsing = idx === pulsingStepIndex;
              const isAccepted = node.status === 'ACCEPTED';
              return (
                <button
                  key={node.step}
                  type="button"
                  onClick={() => handleSelectCandidateCard(idx)}
                  className={
                    'p-1.5 rounded-lg flex flex-col items-center justify-between text-center transition-transform duration-150 cursor-pointer ' +
                    (isAccepted
                      ? 'bg-emerald-950/35 border border-emerald-400/70 shadow-[0_0_10px_rgba(16,185,129,0.2)] hover:scale-[1.02]'
                      : 'bg-rose-950/40 border border-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.25)] hover:scale-[1.02]') +
                    (isSelected ? ' ring-2 ring-cyan-400' : '') +
                    (isPulsing ? ' scale-[1.03]' : '')
                  }
                >
                  <div className="flex items-center justify-between w-full px-0.5 text-[10px] font-mono">
                    <span className="text-slate-300 font-bold">{'K=' + node.step}</span>
                    {isAccepted ? (
                      <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        ✓ LOCKED
                      </span>
                    ) : (
                      <span className="px-1 py-0.2 rounded bg-rose-500/25 text-rose-300 font-bold">
                        ⚡ RESAMPLED
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-bold text-white font-mono mt-0.5">
                    {node.tokenText}
                  </span>

                  <span className="text-[11px] font-mono font-bold text-cyan-300 mt-0.5">
                    {Math.round(node.pTarget * 100) + '% vs ' + Math.round(node.pDraft * 100) + '%'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Telemetry Inspector Bar */}
          <div className="p-1.5 bg-slate-900/90 border border-slate-800 rounded text-center text-xs font-mono text-slate-200 my-0.5 truncate">
            {activeTab === 'Verify' && (
              <span>
                {'SLOT K=' +
                  inspectedNode.step +
                  ' (' +
                  inspectedNode.tokenText +
                  '): ' +
                  inspectedNode.reason +
                  ' · P_t=' +
                  inspectedNode.pTarget.toFixed(2) +
                  ' vs P_d=' +
                  inspectedNode.pDraft.toFixed(2)}
              </span>
            )}
            {activeTab === 'Mesh' && (
              <span>
                {activeCorridor.fullName + ' · Active Gear K=' + kWindow}
              </span>
            )}
            {activeTab === 'Speculation' && (
              <span>
                {'Lap Cycle: ' + (draftLatencyMs + targetStepMs).toFixed(1) + ' ms · Auto-Downshift if Hit < 60%'}
              </span>
            )}
            {activeTab === 'Sampling' && (
              <span>
                {'Residual Recovery Token: ' +
                  currentPass.bonusOrResidualToken +
                  ' · KL Divergence: ' +
                  currentPass.klDivergenceNats.toFixed(3) +
                  ' nats'}
              </span>
            )}
            {activeTab === 'Transfer' && (
              <span>
                engine.py · test_speculative_engine.py · Dockerfile · ENGINE_SPEC.md · 100% MIT
              </span>
            )}
          </div>

          {/* 5. TACTICAL LAUNCH CONTROL CHAOS BUTTONS */}
          <div className="grid grid-cols-2 gap-1.5 my-0.5 w-full">
            <button
              type="button"
              onClick={triggerHighEntropyDivergence}
              className="text-xs font-bold py-1.5 px-2 text-center rounded-lg bg-rose-950/70 hover:bg-rose-900/80 border border-rose-500 text-rose-200 font-mono shadow-[0_0_10px_rgba(244,63,94,0.25)] transition-all cursor-pointer truncate"
            >
              💥 INJECT CHAOS (RESAMPLE)
            </button>

            <button
              type="button"
              onClick={triggerDeterministicFastpath}
              className="text-xs font-bold py-1.5 px-2 text-center rounded-lg bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-400 text-cyan-200 font-mono shadow-[0_0_10px_rgba(34,211,238,0.25)] transition-all cursor-pointer truncate"
            >
              ⚡ NITRO OVERDRIVE (100% HIT)
            </button>

            <button
              type="button"
              onClick={triggerShiftGearStep}
              className="text-xs font-bold py-1.5 px-2 text-center rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-400 text-emerald-200 font-mono shadow-[0_0_10px_rgba(16,185,129,0.25)] transition-all cursor-pointer truncate"
            >
              🚀 SHIFT GEAR (STEP K+1)
            </button>

            <button
              type="button"
              onClick={triggerFlushAndReset}
              className="text-xs font-bold py-1.5 px-2 text-center rounded-lg bg-amber-950/60 hover:bg-amber-900/70 border border-amber-500/80 text-amber-200 font-mono shadow-[0_0_10px_rgba(245,158,11,0.2)] transition-all cursor-pointer truncate"
            >
              🔄 PIT STOP (FLUSH &amp; RE-ZERO)
            </button>
          </div>

          {/* 6. DYNAMIC PIT-WALL RADIO TERMINAL */}
          <div
            aria-label="PIT-WALL COMMS // LIVE TELEMETRY STREAM"
            className="overflow-hidden text-[11px] font-mono leading-relaxed p-2 text-slate-200 bg-black/95 border border-slate-800 rounded-lg mt-0.5 shrink-0"
          >
            <div className="flex items-center justify-between text-[10px] font-bold tracking-wider text-cyan-400 border-b border-slate-800/80 pb-0.5 mb-0.5">
              <span>PIT-WALL COMMS // LIVE TELEMETRY STREAM</span>
              <span className="text-emerald-400">CH-01 ACTIVE</span>
            </div>
            <div>
              {radioLogs.slice(0, 3).map((entry, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-slate-400">{entry.timestamp}</span>{' '}
                  <span>{entry.badge}</span>{' '}
                  <span
                    className={
                      entry.tone === 'emerald'
                        ? 'text-emerald-400 font-bold'
                        : entry.tone === 'rose'
                        ? 'text-rose-400 font-bold'
                        : entry.tone === 'amber'
                        ? 'text-amber-300 font-bold'
                        : 'text-cyan-300 font-bold'
                    }
                  >
                    {entry.callsign}
                  </span>{' '}
                  <span className="text-slate-200">{entry.message}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
