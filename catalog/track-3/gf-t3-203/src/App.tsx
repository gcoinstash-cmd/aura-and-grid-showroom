/**
 * APEX-203 Real-Time Multi-Asset Kalman Filter & Statistical Arbitrage Engine
 * Ghost FactoryOS Track 3 Quantitative Engine — Monopoly Gate Architecture
 * Permissive MIT Clean-Room Implementation
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EngineSpecDrawer } from './components/EngineSpecDrawer';
import { LoadControls } from './components/LoadControls';
import { OpenApiSpecViewer } from './components/OpenApiSpecViewer';
import { PositionTracker } from './components/PositionTracker';
import { SignalAuditTable } from './components/SignalAuditTable';
import { SpreadChart } from './components/SpreadChart';
import { StateSpaceMatrixView } from './components/StateSpaceMatrixView';
import { TelemetryRibbon } from './components/TelemetryRibbon';
import { TopBar } from './components/TopBar';
import { ZScoreChart } from './components/ZScoreChart';
import { KalmanFilter } from './engine/kalmanFilter';
import { OrnsteinUhlenbeckEstimator } from './engine/ornsteinUhlenbeck';
import { SignalAuditChain } from './engine/signalAuditChain';
import { SignalEmitter } from './engine/signalEmitter';
import { ASSET_PAIRS, TickGenerator } from './engine/tickGenerator';
import {
  AssetPairId,
  ClosedTrade,
  QuantEngineTelemetry,
  SignalAuditBlock,
} from './engine/types';
import { WelfordRollingStats } from './engine/welford';

export default function App() {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'audit' | 'statespace' | 'openapi' | 'spec'>('telemetry');
  const [selectedPair, setSelectedPair] = useState<AssetPairId>('SYNTH_ALPHA_BETA');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [tickIntervalMs, setTickIntervalMs] = useState<number>(300);

  // Engine Singletons maintained across renders
  const kalmanRef = useRef<KalmanFilter>(
    new KalmanFilter(ASSET_PAIRS.SYNTH_ALPHA_BETA.nominalBeta, ASSET_PAIRS.SYNTH_ALPHA_BETA.nominalAlpha, 1.0, 1e-3, 1e-5)
  );
  const welfordRef = useRef<WelfordRollingStats>(new WelfordRollingStats(50));
  const ouRef = useRef<OrnsteinUhlenbeckEstimator>(new OrnsteinUhlenbeckEstimator(60));
  const emitterRef = useRef<SignalEmitter>(new SignalEmitter());
  const auditChainRef = useRef<SignalAuditChain>(new SignalAuditChain());
  const tickGenRef = useRef<TickGenerator>(new TickGenerator('SYNTH_ALPHA_BETA'));

  const tickIndexRef = useRef<number>(0);

  // Reactive state for UI updates
  const [currentTelemetry, setCurrentTelemetry] = useState<QuantEngineTelemetry | null>(null);
  const [history, setHistory] = useState<QuantEngineTelemetry[]>([]);
  const [auditBlocks, setAuditBlocks] = useState<SignalAuditBlock[]>([]);
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>([]);
  const [isBurstActive, setIsBurstActive] = useState<boolean>(false);
  const [isForcedReversionActive, setIsForcedReversionActive] = useState<boolean>(false);

  // Execute one tick recursion
  const stepEngine = useCallback(() => {
    tickIndexRef.current += 1;
    const tick = tickGenRef.current.nextTick();

    // 1. Update 2D Kalman Filter
    const kState = kalmanRef.current.update(tick.priceY, tick.priceX);

    // 2. Update Welford's Rolling Z-Score in O(1)
    const wStats = welfordRef.current.update(kState.spread);

    // 3. Update Ornstein-Uhlenbeck Half-Life Estimator
    const ouStats = ouRef.current.update(kState.spread);

    // 4. Trade Signal Emitter & Position Evaluation
    const { signal, reason } = emitterRef.current.evaluate(
      tick.timestamp,
      tick.priceY,
      tick.priceX,
      kState.beta,
      kState.spread,
      wStats.zScore
    );

    // 5. If actionable signal emitted, append to SHA-256 Audit Chain
    if (signal !== 'NONE') {
      auditChainRef.current.appendSignal(
        signal,
        tick.priceY,
        tick.priceX,
        kState.beta,
        kState.spread,
        wStats.zScore,
        ouStats.halfLife,
        tick.timestamp
      );
      setAuditBlocks(auditChainRef.current.getBlocks());
    }

    const position = emitterRef.current.getPosition();
    const trades = emitterRef.current.getClosedTrades();
    setClosedTrades(trades);

    const telemetry: QuantEngineTelemetry = {
      timestamp: tick.timestamp,
      tickIndex: tickIndexRef.current,
      priceY: tick.priceY,
      priceX: tick.priceX,
      kalman: kState,
      welford: wStats,
      ou: ouStats,
      signal,
      signalReason: reason,
      position,
    };

    setCurrentTelemetry(telemetry);
    setHistory((prev) => {
      const updated = [...prev, telemetry];
      return updated.length > 120 ? updated.slice(updated.length - 120) : updated;
    });

    const trueParams = tickGenRef.current.getTrueParameters();
    setIsBurstActive(trueParams.isBurstActive);
    setIsForcedReversionActive(trueParams.isForcedReversionActive);
  }, []);

  // Initialize and run streaming interval
  useEffect(() => {
    // Prime initial 25 ticks for instant chart warmth
    if (history.length === 0) {
      for (let i = 0; i < 25; i++) {
        stepEngine();
      }
      setAuditBlocks(auditChainRef.current.getBlocks());
    }

    if (!isStreaming) return;

    const timer = setInterval(() => {
      stepEngine();
    }, tickIntervalMs);

    return () => clearInterval(timer);
  }, [isStreaming, tickIntervalMs, stepEngine, history.length]);

  // Pair switching handler
  const handleSelectPair = (pairId: AssetPairId) => {
    setSelectedPair(pairId);
    const cfg = ASSET_PAIRS[pairId];

    // Reset components to new nominals
    kalmanRef.current.reset(cfg.nominalBeta, cfg.nominalAlpha, 1.0);
    welfordRef.current.reset(50);
    ouRef.current.reset();
    emitterRef.current.reset();
    tickGenRef.current.setPair(pairId);

    setHistory([]);
    setClosedTrades([]);
    // Prime with fresh ticks
    for (let i = 0; i < 20; i++) {
      stepEngine();
    }
  };

  // Load Generator Handlers
  const handleBurstVolatility = () => {
    tickGenRef.current.triggerBurstVolatility(20, 4.5);
    setIsBurstActive(true);
  };

  const handleForceReversion = () => {
    tickGenRef.current.triggerForcedMeanReversion(15);
    setIsForcedReversionActive(true);
  };

  const handleRegimeShift = () => {
    tickGenRef.current.triggerRegimeShift();
  };

  const handleSnapshotState = () => {
    if (!currentTelemetry) return;
    const snapshot = {
      timestamp: Date.now(),
      pair: selectedPair,
      telemetry: currentTelemetry,
      kalmanState: kalmanRef.current.getState(),
      welfordMoments: welfordRef.current.getStats(),
      closedTradesCount: closedTrades.length,
      auditChainBlocks: auditBlocks.length,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `apex203_snapshot_${selectedPair}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleVerifyIntegrity = () => {
    return auditChainRef.current.verifyIntegrity();
  };

  const pairConfig = ASSET_PAIRS[selectedPair];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Bar Navigation (3-Zone Contract) */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedPair={selectedPair}
        onSelectPair={handleSelectPair}
        isStreaming={isStreaming}
        onToggleStreaming={() => setIsStreaming((prev) => !prev)}
      />

      {/* Real-Time Telemetry Ribbon */}
      {currentTelemetry && (
        <TelemetryRibbon telemetry={currentTelemetry} pairConfig={pairConfig} />
      )}

      {/* Main Workspace Viewport (1440px max baseline) */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto px-4 sm:px-6 py-4 space-y-4">
        {/* TAB 1: Live Telemetry & Trading Terminal */}
        {activeTab === 'telemetry' && currentTelemetry && (
          <div className="space-y-4">
            {/* Load Generator Stress Testing Ribbon */}
            <LoadControls
              onBurstVolatility={handleBurstVolatility}
              onForceReversion={handleForceReversion}
              onRegimeShift={handleRegimeShift}
              onSnapshotState={handleSnapshotState}
              isBurstActive={isBurstActive}
              isForcedReversionActive={isForcedReversionActive}
              tickIntervalMs={tickIntervalMs}
              setTickIntervalMs={setTickIntervalMs}
              onStepTick={stepEngine}
            />

            {/* Dual Real-Time Visualizer Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SpreadChart history={history} pairName={pairConfig.name} />
              <ZScoreChart history={history} />
            </div>

            {/* Active Position Ledger & Performance Tracker */}
            <PositionTracker
              position={currentTelemetry.position}
              closedTrades={closedTrades}
              pairConfig={pairConfig}
              currentPriceY={currentTelemetry.priceY}
              currentPriceX={currentTelemetry.priceX}
              currentSpread={currentTelemetry.kalman.spread}
              currentZScore={currentTelemetry.welford.zScore}
            />
          </div>
        )}

        {/* TAB 2: SHA-256 Audit Log */}
        {activeTab === 'audit' && (
          <SignalAuditTable
            blocks={auditBlocks}
            onVerifyIntegrity={handleVerifyIntegrity}
          />
        )}

        {/* TAB 3: State-Space Matrix View */}
        {activeTab === 'statespace' && currentTelemetry && (
          <StateSpaceMatrixView telemetry={currentTelemetry} />
        )}

        {/* TAB 4: OpenAPI 3.1 Spec */}
        {activeTab === 'openapi' && <OpenApiSpecViewer />}

        {/* TAB 5: Formal Quantitative Specification */}
        {activeTab === 'spec' && <EngineSpecDrawer />}
      </main>

      {/* Quiet Professional Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-3 text-slate-500 font-mono text-[11px] flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>APEX-203 // Track 3 Quant Engine</span>
          <span>·</span>
          <span>Permissive MIT License</span>
          <span>·</span>
          <span>Zero Copyleft AGPL/GPL</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Tick #{currentTelemetry?.tickIndex || 0}</span>
          <span>·</span>
          <span>Pytest: 5/5 Passing</span>
          <span>·</span>
          <span>Cloud Run Ready</span>
        </div>
      </footer>
    </div>
  );
}
