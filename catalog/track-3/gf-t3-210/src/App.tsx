import React, { useState, useEffect, useCallback } from 'react';
import { engineInstance } from './services/simulationEngine';
import {
  AuditBlock,
  DepthLevel,
  ExecutionFill,
  HawkesState,
  MicrostructureMetrics,
  OrderSide,
  SyntheticAssetPair,
  UserChildOrder,
} from './types/microstructure';
import { TopBar } from './components/TopBar';
import { MetricsRibbon } from './components/MetricsRibbon';
import { StressControls } from './components/StressControls';
import { DepthLadder } from './components/DepthLadder';
import { QueueTrackerCard } from './components/QueueTrackerCard';
import { HawkesIntensityChart } from './components/HawkesIntensityChart';
import { TradeTape } from './components/TradeTape';
import { AuditLedgerViewer } from './components/AuditLedgerViewer';
import { AssetSpecModal } from './components/AssetSpecModal';

export default function App() {
  const [currentPair, setCurrentPair] = useState<SyntheticAssetPair>(
    'SYNTH-LOB-01 (CORE-LIQ / BASE-UNIT)'
  );
  const [depth, setDepth] = useState<{ bids: DepthLevel[]; asks: DepthLevel[] }>(
    engineInstance.getDepthSnapshot(14)
  );
  const [metrics, setMetrics] = useState<MicrostructureMetrics>(engineInstance.getMetrics());
  const [hawkes, setHawkes] = useState<HawkesState>(engineInstance.getHawkesState());
  const [tape, setTape] = useState<ExecutionFill[]>(engineInstance.getTradeTape());
  const [ledgerBlocks, setLedgerBlocks] = useState<AuditBlock[]>(engineInstance.getAuditChain());
  const [userOrder, setUserOrder] = useState<UserChildOrder | null>(engineInstance.userOrder);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);

  // 4-Tab Workspace Navigation State
  const [activeTab, setActiveTab] = useState<string>('dom-queue');
  const [tickRateMs, setTickRateMs] = useState<number>(250);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [latencyJitterMs, setLatencyJitterMs] = useState<number>(0);
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);

  // Sync state from simulation engine
  const refreshState = useCallback(() => {
    setDepth(engineInstance.getDepthSnapshot(14));
    setMetrics(engineInstance.getMetrics());
    setHawkes(engineInstance.getHawkesState());
    setTape(engineInstance.getTradeTape());
    setLedgerBlocks(engineInstance.getAuditChain());
    setUserOrder(engineInstance.userOrder ? { ...engineInstance.userOrder } : null);
    setLatencyJitterMs(engineInstance.latencyJitterMs);
  }, []);

  useEffect(() => {
    const unsubscribe = engineInstance.subscribe(refreshState);
    return () => unsubscribe();
  }, [refreshState]);

  // Simulation timer loop
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      engineInstance.executeSimulationStep();
    }, tickRateMs);
    return () => clearInterval(interval);
  }, [isPaused, tickRateMs]);

  // Pair selection
  const handleSelectPair = (pair: SyntheticAssetPair) => {
    setCurrentPair(pair);
    engineInstance.setAssetPair(pair);
  };

  // Place limit order
  const handlePlaceOrder = (side: OrderSide, pricePts: number, quantityUnits: number) => {
    engineInstance.placeUserChildOrder(side, pricePts, quantityUnits);
  };

  // Cancel limit order
  const handleCancelOrder = () => {
    engineInstance.cancelUserChildOrder();
  };

  // Stress tests
  const handleCancelWave = () => {
    engineInstance.injectCancelWave(0.60);
  };

  const handleFlashSweep = () => {
    engineInstance.triggerFlashSweep('BUY', 50000);
  };

  const handleLatencySpike = () => {
    engineInstance.triggerLatencySpike(300);
  };

  const handleReset = () => {
    engineInstance.setAssetPair(currentPair);
  };

  // Cryptographic ledger actions
  const handleVerifyLedger = async () => {
    return engineInstance.verifyLedger();
  };

  const handleTamperLedger = async (index: number) => {
    await engineInstance.tamperLedgerBlock(index);
  };

  const getTabButtonClass = (tabName: string) => {
    const isSelected = activeTab === tabName;
    return 'px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-colors ' +
      (isSelected
        ? 'bg-cyan-500 text-slate-950 shadow-sm'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/60');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#070A11] text-slate-100 font-sans selection:bg-cyan-500/30">
      {/* 1. TOP BAR CONTRACT */}
      <TopBar
        currentPair={currentPair}
        onSelectPair={handleSelectPair}
        onOpenDossier={() => setIsDossierOpen(true)}
      />

      {/* 2. REAL-TIME MICROSTRUCTURE METRICS RIBBON */}
      <MetricsRibbon metrics={metrics} hawkes={hawkes} />

      {/* 3. 4-TAB WORKSPACE NAVIGATION BAR */}
      <div className="w-full overflow-x-auto no-scrollbar scroll-smooth px-4 pt-3">
        <div className="flex items-center gap-2 min-w-max p-1.5 bg-slate-900/80 border border-slate-800 rounded-xl my-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('dom-queue')}
            className={getTabButtonClass('dom-queue')}
          >
            L2 DOM & Queue
          </button>
          <button
            onClick={() => setActiveTab('tape-hawkes')}
            className={getTabButtonClass('tape-hawkes')}
          >
            Tape & Hawkes
          </button>
          <button
            onClick={() => setActiveTab('stress-matrix')}
            className={getTabButtonClass('stress-matrix')}
          >
            Stress Matrix
          </button>
          <button
            onClick={() => setActiveTab('audit-ledger')}
            className={getTabButtonClass('audit-ledger')}
          >
            SHA-256 Ledger
          </button>
        </div>
      </div>

      {/* 4. MAIN WORKSPACE VIEWPORT */}
      <main className="flex-1 p-4 overflow-x-hidden">
        {/* TAB 1: L2 DOM & Queue Tracker */}
        {activeTab === 'dom-queue' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-7xl mx-auto">
            <DepthLadder
              bids={depth.bids}
              asks={depth.asks}
              midPricePts={metrics.midPricePts}
              spreadPts={metrics.spreadPts}
              spreadBps={metrics.spreadBps}
              userOrder={userOrder}
              onSelectPrice={setSelectedPrice}
            />
            <QueueTrackerCard
              userOrder={userOrder}
              bestBidPts={metrics.bestBidPts}
              bestAskPts={metrics.bestAskPts}
              midPricePts={metrics.midPricePts}
              selectedPricePts={selectedPrice}
              onPlaceOrder={handlePlaceOrder}
              onCancelOrder={handleCancelOrder}
            />
          </div>
        )}

        {/* TAB 2: Trade Tape & Hawkes Process */}
        {activeTab === 'tape-hawkes' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-7xl mx-auto">
            <div className="h-[520px]">
              <TradeTape tape={tape} />
            </div>
            <div className="h-[520px]">
              <HawkesIntensityChart hawkes={hawkes} />
            </div>
          </div>
        )}

        {/* TAB 3: Microstructure Stress Matrix */}
        {activeTab === 'stress-matrix' && (
          <div className="max-w-4xl mx-auto space-y-6 py-4">
            <div className="p-6 bg-[#090D18] border border-slate-800 rounded-xl space-y-4">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                Microstructure Stress Matrix & Simulation Engine
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Test the resilience of the Limit Order Book matching engine under high-frequency stress scenarios, including institutional liquidity pullbacks, flash order book sweeps, and network latency jitter.
              </p>
              <div className="pt-2">
                <StressControls
                  onCancelWave={handleCancelWave}
                  onFlashSweep={handleFlashSweep}
                  onLatencySpike={handleLatencySpike}
                  latencyJitterMs={latencyJitterMs}
                  tickRateMs={tickRateMs}
                  isPaused={isPaused}
                  onChangeTickRate={setTickRateMs}
                  onTogglePause={() => setIsPaused((prev) => !prev)}
                  onReset={handleReset}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#090D18] border border-slate-800 rounded-lg space-y-2">
                <div className="text-xs font-mono text-slate-400 uppercase">Engine State</div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {isPaused ? 'PAUSED' : 'RUNNING (ACTIVE)'}
                </div>
                <div className="text-sm font-mono text-slate-400">
                  Tick Frequency: {tickRateMs}ms
                </div>
              </div>

              <div className="p-4 bg-[#090D18] border border-slate-800 rounded-lg space-y-2">
                <div className="text-xs font-mono text-slate-400 uppercase">Execution Latency Jitter</div>
                <div className="text-xl font-bold font-mono text-purple-300">
                  {latencyJitterMs} ms
                </div>
                <div className="text-sm font-mono text-slate-400">
                  Simulated transport overhead
                </div>
              </div>

              <div className="p-4 bg-[#090D18] border border-slate-800 rounded-lg space-y-2">
                <div className="text-xs font-mono text-slate-400 uppercase">Cryptographic Audit Blocks</div>
                <div className="text-xl font-bold font-mono text-cyan-400">
                  {ledgerBlocks.length} Blocks Sealed
                </div>
                <div className="text-sm font-mono text-slate-400">
                  SHA-256 chain verified
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SHA-256 Audit Ledger */}
        {activeTab === 'audit-ledger' && (
          <div className="max-w-5xl mx-auto h-[calc(100vh-260px)] min-h-[550px] py-2">
            <AuditLedgerViewer
              blocks={ledgerBlocks}
              onVerify={handleVerifyLedger}
              onTamper={handleTamperLedger}
              onResetChain={handleReset}
            />
          </div>
        )}
      </main>

      {/* 5. BUYOUT DOSSIER MODAL */}
      <AssetSpecModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
      />
    </div>
  );
}
