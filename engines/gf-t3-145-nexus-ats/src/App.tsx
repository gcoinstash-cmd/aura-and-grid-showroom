/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ghost FactoryOS GF-T3-145 (Nexus-ATS)
 * Lead Systems Architect Master Trading Terminal & Telemetry Dashboard
 */

import React, { useState, useEffect, useRef } from 'react';
import { NexusEngine } from './engine/NexusEngine';
import { OrderSide, Order } from './types/trading';
import { HeaderNav, ActiveTabType } from './components/HeaderNav';
import { OrderBookHUD } from './components/OrderBookHUD';
import { DarkPoolTape } from './components/DarkPoolTape';
import { ToxicityTelemetry } from './components/ToxicityTelemetry';
import { LatencyThroughput } from './components/LatencyThroughput';
import { OrderInjector } from './components/OrderInjector';
import { EngineTopologyModal } from './components/EngineTopologyModal';
import { SqlSchemaVaultModal } from './components/SqlSchemaVaultModal';
import { OpenApiModal } from './components/OpenApiModal';
import { LegalAuditModal } from './components/LegalAuditModal';
import { ApaAgreementModal } from './components/ApaAgreementModal';
import { FullSpecModal } from './components/FullSpecModal';
import { 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Activity, 
  Zap, 
  Sparkles, 
  Clock,
  ShieldAlert,
  Flame,
  Scale
} from 'lucide-react';

export default function App() {
  const engineRef = useRef<NexusEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new NexusEngine('GF-US-100');
  }
  const engine = engineRef.current;

  const [activeTab, setActiveTab] = useState<ActiveTabType>('FLOOR_HUD');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simTps, setSimTps] = useState<number>(10);

  // Selected price & side from order book click
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [selectedSide, setSelectedSide] = useState<OrderSide | null>(null);

  // Periodic UI State snapshot
  const [snapshot, setSnapshot] = useState(engine.getOrderBookSnapshot(10));
  const [trades, setTrades] = useState(engine.trades);
  const [vpin, setVpin] = useState(engine.getVpinMetrics());
  const [hawkes, setHawkes] = useState(engine.getHawkesMetrics());
  const [latency, setLatency] = useState(engine.getLatencyMetrics());
  const [stats, setStats] = useState(engine.getMarketStats());
  const [restingPegs, setRestingPegs] = useState(engine.darkPool.getRestingPegs());

  // Start simulation on mount
  useEffect(() => {
    engine.setAutoSimulation(isSimulating, simTps);
    return () => {
      engine.setAutoSimulation(false);
    };
  }, [isSimulating, simTps]);

  // High-frequency UI sync loop (20 FPS refresh for silky responsive numbers)
  useEffect(() => {
    const timer = setInterval(() => {
      setSnapshot(engine.getOrderBookSnapshot(10));
      setTrades([...engine.trades]);
      setVpin(engine.getVpinMetrics());
      setHawkes(engine.getHawkesMetrics());
      setLatency(engine.getLatencyMetrics());
      setStats(engine.getMarketStats());
      setRestingPegs(engine.darkPool.getRestingPegs());
    }, 50);

    return () => clearInterval(timer);
  }, [engine]);

  const handleManualTick = () => {
    engine.triggerSyntheticTick();
    setSnapshot(engine.getOrderBookSnapshot(10));
    setTrades([...engine.trades]);
    setVpin(engine.getVpinMetrics());
    setHawkes(engine.getHawkesMetrics());
    setLatency(engine.getLatencyMetrics());
    setStats(engine.getMarketStats());
    setRestingPegs(engine.darkPool.getRestingPegs());
  };

  const handleSelectPrice = (price: number, side: OrderSide) => {
    setSelectedPrice(price);
    setSelectedSide(side);
  };

  const handleSubmitOrder = (orderParams: Partial<Order>) => {
    const result = engine.submitOrder(orderParams);
    setSnapshot(engine.getOrderBookSnapshot(10));
    setTrades([...engine.trades]);
    setVpin(engine.getVpinMetrics());
    setHawkes(engine.getHawkesMetrics());
    setLatency(engine.getLatencyMetrics());
    setStats(engine.getMarketStats());
    setRestingPegs(engine.darkPool.getRestingPegs());
    return result;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Institutional Navigation & Status Bar */}
      <HeaderNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSimulating={isSimulating}
        setIsSimulating={setIsSimulating}
        simTps={simTps}
        setSimTps={setSimTps}
        onManualTick={handleManualTick}
        p99LatencyUs={latency.p99Us}
        isToxicAlert={vpin.isToxic}
        spoofingAlert={hawkes.spoofingAlert}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto px-4 py-4 space-y-4">
        
        {/* Market Summary Ticker Bar */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Last Price */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
            <div className="text-xs uppercase text-slate-400 font-bold">Last Traded Price</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-white font-mono-numbers">
                ${stats.lastPrice.toFixed(2)}
              </span>
              <span className={`text-sm font-extrabold flex items-center font-mono-numbers ${
                stats.priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {stats.priceChange >= 0 ? '+' : ''}{stats.priceChange.toFixed(2)} ({stats.priceChangePct >= 0 ? '+' : ''}{stats.priceChangePct}%)
              </span>
            </div>
          </div>

          {/* NBBO Spread */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
            <div className="text-xs uppercase text-slate-400 font-bold">NBBO Midpoint Spread</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-amber-300 font-mono-numbers">
                ${snapshot.midpoint.toFixed(4)}
              </span>
              <span className="text-sm font-bold text-slate-400 font-mono-numbers">
                ({snapshot.spreadBps} bps)
              </span>
            </div>
          </div>

          {/* Dark Share */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
            <div className="text-xs uppercase text-slate-400 font-bold">Dark Pool Volume Share</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-amber-400 font-mono-numbers">
                {stats.darkVolumeShare}%
              </span>
              <span className="text-xs text-slate-400">
                ({engine.totalDarkVolume.toLocaleString()} shs)
              </span>
            </div>
          </div>

          {/* Total Volume */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
            <div className="text-xs uppercase text-slate-400 font-bold">Total Session Volume</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-100 font-mono-numbers">
                {stats.volume24h.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">shares</span>
            </div>
          </div>

          {/* P99 Latency SLA */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
            <div className="text-xs uppercase text-slate-400 font-bold">P99 Deterministic Latency</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`text-2xl font-black font-mono-numbers ${latency.p99Us <= 850 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {latency.p99Us} µs
              </span>
              <span className="text-xs text-emerald-400 font-bold">Budget &lt;850µs</span>
            </div>
          </div>

          {/* Flow Toxicity Metric */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
            <div className="text-xs uppercase text-slate-400 font-bold">VPIN Toxicity Index</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`text-2xl font-black font-mono-numbers ${vpin.isToxic ? 'text-rose-400' : 'text-emerald-400'}`}>
                {vpin.currentVpin.toFixed(4)}
              </span>
              <span className="text-xs text-slate-400">
                {vpin.isToxic ? 'Toxic Flow' : 'Equilibrium'}
              </span>
            </div>
          </div>
        </section>

        {/* Tab-Driven Content Router */}
        {activeTab === 'FLOOR_HUD' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left 4 Cols: L2 Order Book & Midpoint HUD */}
            <div className="lg:col-span-4 h-[780px]">
              <OrderBookHUD
                snapshot={snapshot}
                instrument={engine.instrument}
                onSelectPrice={handleSelectPrice}
              />
            </div>

            {/* Middle 4 Cols: Institutional Order Injector + Live Telemetry */}
            <div className="lg:col-span-4 h-[780px] flex flex-col space-y-4">
              <div className="flex-1">
                <OrderInjector
                  currentNbbo={{ bid: snapshot.nbboBid, ask: snapshot.nbboAsk, midpoint: snapshot.midpoint }}
                  onSubmitOrder={handleSubmitOrder}
                  selectedPrice={selectedPrice}
                  selectedSide={selectedSide}
                />
              </div>
            </div>

            {/* Right 4 Cols: Dark Pool Crossing Tape & Resting Pegs */}
            <div className="lg:col-span-4 h-[780px]">
              <DarkPoolTape
                trades={trades}
                restingBuyPegs={restingPegs.buyPegs}
                restingSellPegs={restingPegs.sellPegs}
                totalDarkVolume={engine.totalDarkVolume}
              />
            </div>
          </div>
        )}

        {activeTab === 'LATENCY' && (
          <div className="min-h-[700px]">
            <LatencyThroughput metrics={latency} />
          </div>
        )}

        {activeTab === 'TOXICITY' && (
          <div className="min-h-[700px]">
            <ToxicityTelemetry vpin={vpin} hawkes={hawkes} />
          </div>
        )}

        {activeTab === 'TOPOLOGY' && (
          <div className="min-h-[700px]">
            <EngineTopologyModal />
          </div>
        )}

        {activeTab === 'ALLOYDB_SQL' && (
          <div className="min-h-[700px]">
            <SqlSchemaVaultModal />
          </div>
        )}

        {activeTab === 'OPENAPI_JSON' && (
          <div className="min-h-[700px]">
            <OpenApiModal />
          </div>
        )}

        {activeTab === 'LEGAL_IP' && (
          <div className="min-h-[700px]">
            <LegalAuditModal />
          </div>
        )}

        {activeTab === 'DELAWARE_APA' && (
          <div className="min-h-[700px]">
            <ApaAgreementModal />
          </div>
        )}

        {activeTab === 'ENGINE_SPEC' && (
          <div className="min-h-[700px]">
            <FullSpecModal />
          </div>
        )}

      </main>

      {/* Institutional Terminal Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-3 px-6 mt-auto">
        <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-4 text-base text-slate-400">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-slate-200">GHOST FACTORYOS</span>
            <span className="text-slate-600">•</span>
            <span>Fleet Track 3 (F1 Skunkworks Engine)</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-mono-numbers">Asset GF-T3-145</span>
          </div>

          <div className="flex items-center gap-4 text-sm font-mono-numbers">
            <span>Kernel Bypass: <strong className="text-slate-200">Solarflare EF_VI</strong></span>
            <span>Memory: <strong className="text-emerald-400">0 Heap Allocs</strong></span>
            <span>Audit: <strong className="text-teal-400">100% Clean Room Permissive</strong></span>
            <span>Engine: <strong className="text-teal-400 font-bold">PostgreSQL 16 + RLS</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
