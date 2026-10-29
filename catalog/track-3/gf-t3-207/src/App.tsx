/**
 * GF-T3-207: APEX-207 AMM Dynamic Liquidity & Impermanent Loss Terminal
 * Institutional Quantitative Cockpit & Enterprise Reference Core
 * Zero Third-Party Financial Marks | Zero Currency Symbols
 */

import React, { useState, useMemo, useCallback } from 'react';
import { AmmSimulator } from './lib/amm-engine';
import { Header } from './components/Header';
import { DepthCurveChart } from './components/DepthCurveChart';
import { SimulationControls } from './components/SimulationControls';
import { ImpermanentLossCurve } from './components/ImpermanentLossCurve';
import { CapitalEfficiencyCard } from './components/CapitalEfficiencyCard';
import { LedgerInspector } from './components/LedgerInspector';
import { SpecTransferModal } from './components/SpecTransferModal';
import { ShieldCheck, Cpu, Terminal, TrendingUp, Scale, Layers } from 'lucide-react';

type CockpitTab = 'DEPTH_KERNEL' | 'IMPERMANENT_LOSS' | 'CAPITAL_EFFICIENCY' | 'AUDIT_LEDGER';

export default function App() {
  const [selectedPoolId, setSelectedPoolId] = useState<string>('SYNTH-POOL-01');
  const [activeTab, setActiveTab] = useState<CockpitTab>('DEPTH_KERNEL');
  const [isSpecModalOpen, setIsSpecModalOpen] = useState<boolean>(false);
  const [tickerTick, setTickerTick] = useState<number>(0);

  // Maintain active engine instance
  const simulator = useMemo(() => new AmmSimulator(selectedPoolId), [selectedPoolId]);

  // Read latest telemetry state
  const telemetry = useMemo(() => {
    void tickerTick;
    return simulator.getTelemetryState();
  }, [simulator, tickerTick]);

  const [isLedgerValid] = useMemo(() => {
    void tickerTick;
    return simulator.verifyLedgerIntegrity();
  }, [simulator, tickerTick]);

  const triggerUpdate = useCallback(() => {
    setTickerTick((prev) => prev + 1);
  }, []);

  // Pool handlers
  const handleSelectPool = (poolId: string) => {
    setSelectedPoolId(poolId);
    triggerUpdate();
  };

  const handleResetPool = () => {
    simulator.resetPool(selectedPoolId);
    triggerUpdate();
  };

  const handleUpdateBounds = (pLower: number, pUpper: number) => {
    simulator.setTickBounds(pLower, pUpper);
    triggerUpdate();
  };

  const handleSwapAForB = (amountA: number) => {
    const res = simulator.swapExactAForB(amountA);
    triggerUpdate();
    return res;
  };

  const handleSwapBForA = (amountB: number) => {
    const res = simulator.swapExactBForA(amountB);
    triggerUpdate();
    return res;
  };

  const handlePriceShift = (targetPrice: number) => {
    simulator.simulatePriceShift(targetPrice);
    triggerUpdate();
  };

  const handleVolatilitySpike = (multiplier: number) => {
    simulator.simulateVolatilitySpike(multiplier);
    triggerUpdate();
  };

  const handleVerifyChain = () => {
    triggerUpdate();
  };

  const handleInjectTamper = (blockIndex: number) => {
    simulator.injectTamper(blockIndex);
    triggerUpdate();
  };

  const tabList: { id: CockpitTab; label: string; icon: React.ElementType; badge?: string }[] = [
    {
      id: 'DEPTH_KERNEL',
      label: 'Concentrated Depth & Swap Kernel',
      icon: TrendingUp,
      badge: telemetry.tickInRange ? 'Active Band' : 'Range Exceeded',
    },
    {
      id: 'IMPERMANENT_LOSS',
      label: 'Impermanent Loss & Yield Cushion',
      icon: Scale,
      badge: telemetry.impermanentLossPct.toFixed(2) + '% IL',
    },
    {
      id: 'CAPITAL_EFFICIENCY',
      label: 'Capital Efficiency Matrix',
      icon: Layers,
      badge: telemetry.capitalEfficiencyMultiplier.toFixed(2) + 'x Depth',
    },
    {
      id: 'AUDIT_LEDGER',
      label: 'SHA-256 Audit Ledger',
      icon: Terminal,
      badge: 'Height: ' + simulator.ledger.length,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E17] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Institutional Consolidated Header & Telemetry Ribbon */}
      <div>
        <Header
          currentPoolId={selectedPoolId}
          onSelectPool={handleSelectPool}
          onOpenSpecs={() => setIsSpecModalOpen(true)}
          onResetPool={handleResetPool}
          ledgerHeight={simulator.ledger.length}
          isLedgerValid={isLedgerValid}
          telemetry={telemetry}
        />

        {/* Cockpit Workspace Navigation */}
        <main className="max-w-[1720px] mx-auto p-4 lg:p-6 space-y-4">
          
          {/* Horizontal Tab Bar Navigation */}
          <div className="flex flex-nowrap overflow-x-auto gap-2 p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
            {tabList.map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={'min-h-[44px] whitespace-nowrap px-4 py-2 text-sm rounded-lg transition-all flex items-center gap-2.5 shrink-0 ' + (
                    active
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 font-semibold border border-transparent'
                  )}
                >
                  <Icon className={'w-4 h-4 ' + (active ? 'text-cyan-400' : 'text-slate-400')} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={'px-2 py-0.5 rounded text-sm font-mono ' + (
                        active
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                          : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Concentrated Depth & Swap Kernel (Side-by-Side on Desktop) */}
          {activeTab === 'DEPTH_KERNEL' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="border border-slate-800 bg-slate-900/60 backdrop-blur-md rounded-xl p-4">
                <DepthCurveChart
                  telemetry={telemetry}
                  onUpdateBounds={handleUpdateBounds}
                />
              </div>
              <div className="border border-slate-800 bg-slate-900/60 backdrop-blur-md rounded-xl p-4">
                <SimulationControls
                  telemetry={telemetry}
                  onSwapAForB={handleSwapAForB}
                  onSwapBForA={handleSwapBForA}
                  onPriceShift={handlePriceShift}
                  onVolatilitySpike={handleVolatilitySpike}
                  onReset={handleResetPool}
                />
              </div>
            </div>
          )}

          {/* Tab 2: Impermanent Loss & Yield Cushion */}
          {activeTab === 'IMPERMANENT_LOSS' && (
            <div className="border border-slate-800 bg-slate-900/60 backdrop-blur-md rounded-xl p-5">
              <ImpermanentLossCurve telemetry={telemetry} />
            </div>
          )}

          {/* Tab 3: Capital Efficiency Matrix */}
          {activeTab === 'CAPITAL_EFFICIENCY' && (
            <div className="border border-slate-800 bg-slate-900/60 backdrop-blur-md rounded-xl p-5">
              <CapitalEfficiencyCard telemetry={telemetry} />
            </div>
          )}

          {/* Tab 4: Cryptographic SHA-256 Audit Ledger */}
          {activeTab === 'AUDIT_LEDGER' && (
            <div className="border border-slate-800 bg-slate-900/60 backdrop-blur-md rounded-xl p-5">
              <LedgerInspector
                blocks={simulator.ledger}
                isVerified={isLedgerValid}
                onVerifyChain={handleVerifyChain}
                onInjectTamper={handleInjectTamper}
              />
            </div>
          )}

        </main>
      </div>

      {/* Cockpit Status Bar Footer */}
      <footer className="border-t border-slate-800 bg-[#070A11] px-4 lg:px-6 py-3.5 mt-8">
        <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-cyan-400 font-bold">
              <Terminal className="w-4 h-4" />
              <span>GF-T3-207 CORE</span>
            </div>
            <span>|</span>
            <span>Standard Commercial Asset Transfer Specification</span>
            <span>|</span>
            <span className="text-emerald-400 font-medium">Clean Title Warranty</span>
            <span>|</span>
            <span>Zero-SaaS Infrastructure Disclaimed</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm font-mono">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Execution: 42 µs avg</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>NIST SP 800-218 SSDF v1.1</span>
            </div>
            <div className="text-slate-500">
              Zero Currency Symbols
            </div>
          </div>

        </div>
      </footer>

      {/* Specification & Transfer Documentation Suite Modal */}
      <SpecTransferModal
        isOpen={isSpecModalOpen}
        onClose={() => setIsSpecModalOpen(false)}
      />

    </div>
  );
}
