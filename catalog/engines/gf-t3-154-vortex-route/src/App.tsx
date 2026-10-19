/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Radar, 
  Layers, 
  FileText, 
  Landmark, 
  Cpu, 
  Terminal, 
  ShieldCheck, 
  Activity,
  Zap
} from 'lucide-react';
import { Header } from './components/Header';
import { ExecutionRadarTab } from './components/ExecutionRadarTab';
import { LiquidityDepthTab } from './components/LiquidityDepthTab';
import { EngineSpecTab } from './components/EngineSpecTab';
import { MonopolyVaultTab } from './components/MonopolyVaultTab';
import { PythonCoreTab } from './components/PythonCoreTab';
import { 
  INITIAL_VENUES, 
  computeOptimalRoute 
} from './simulation/routerSimulator';
import { VenueId, VenueInfo, OrderSide, RoutingDecisionOutput, ExecutionLogItem } from './types/router';

export default function App() {
  const [activeTab, setActiveTab] = useState<'RADAR' | 'DEPTH' | 'SPEC' | 'VAULT' | 'PYTHON'>('RADAR');
  const [venues, setVenues] = useState<Record<VenueId, VenueInfo>>(INITIAL_VENUES);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [currentLatencyUs, setCurrentLatencyUs] = useState<number>(16.4);

  // Initial Routing Decision
  const [routingResult, setRoutingResult] = useState<RoutingDecisionOutput>(() =>
    computeOptimalRoute('BTC/USD', 'BUY', 25.0, 15, 1.0, true, INITIAL_VENUES)
  );

  // Audit Logs
  const [logs, setLogs] = useState<ExecutionLogItem[]>([
    {
      id: 'log-0',
      timestamp: '21:05:38.102',
      type: 'INFO',
      message: 'VortexRoute Engine GF-T3-154 Core initialized on bare-metal co-location mesh.',
    },
    {
      id: 'log-1',
      timestamp: '21:05:38.104',
      type: 'INFO',
      message: 'Clean-room fixed-point integer state machine active (10^8 tick precision).',
    },
    {
      id: 'log-2',
      timestamp: '21:05:38.105',
      type: 'ROUTING',
      message: 'L2 book channels subscribed across 5 venues: BINANCE, COINBASE, KRAKEN, OKX, BYBIT.',
    },
    {
      id: 'log-3',
      timestamp: '21:05:38.112',
      type: 'FILL',
      message: 'Initial convex route solved in 16.4 µs. 25.0 BTC distributed across 5 venues. Zero loss.',
    },
  ]);

  // Tick generator: simulates real microsecond order book fluctuations
  const injectTick = useCallback(() => {
    setVenues((prev) => {
      const updated = { ...prev };
      const venueKeys = Object.keys(updated) as VenueId[];
      // Randomly update 2-3 venues
      const targetVenues = venueKeys.sort(() => 0.5 - Math.random()).slice(0, 2);

      targetVenues.forEach((vKey) => {
        const v = updated[vKey];
        const deltaPrice = (Math.random() - 0.49) * 0.40; // slight random drift
        const deltaQty = (Math.random() - 0.5) * 1.5;

        const newBids = v.bids.map((b, idx) => ({
          price: Math.round((b.price + (idx === 0 ? deltaPrice : 0)) * 100) / 100,
          qty: Math.max(2.0, Math.round((b.qty + (idx === 0 ? deltaQty : 0)) * 100) / 100),
        }));

        const newAsks = v.asks.map((a, idx) => ({
          price: Math.round((a.price + (idx === 0 ? deltaPrice : 0)) * 100) / 100,
          qty: Math.max(2.0, Math.round((a.qty + (idx === 0 ? -deltaQty : 0)) * 100) / 100),
        }));

        updated[vKey] = {
          ...v,
          bids: newBids,
          asks: newAsks,
        };
      });

      return updated;
    });

    // Update latency jitter slightly
    setCurrentLatencyUs((prev) => Math.max(12.8, Math.min(19.2, prev + (Math.random() - 0.5) * 0.6)));
  }, []);

  // Tick streaming loop
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(injectTick, 1800);
    return () => clearInterval(interval);
  }, [isStreaming, injectTick]);

  // Handle Parent Order Dispatch
  const handleDispatchOrder = (params: {
    symbol: string;
    side: OrderSide;
    size: number;
    maxSlippageBps: number;
    urgencyAlpha: number;
    pacingEnabled: boolean;
  }) => {
    const result = computeOptimalRoute(
      params.symbol,
      params.side,
      params.size,
      params.maxSlippageBps,
      params.urgencyAlpha,
      params.pacingEnabled,
      venues
    );
    setRoutingResult(result);
    setCurrentLatencyUs(result.computationTimeUs);

    const now = new Date();
    const timeStr = `${now.toTimeString().split(' ')[0]}.${now.getMilliseconds().toString().padStart(3, '0')}`;

    const newLogs: ExecutionLogItem[] = [
      {
        id: `log-${Date.now()}-1`,
        timestamp: timeStr,
        type: 'ROUTING',
        message: `KKT optimization solved in ${result.computationTimeUs}µs for parent ${result.parentId} (${params.size} ${params.symbol} ${params.side}).`,
      },
      {
        id: `log-${Date.now()}-2`,
        timestamp: timeStr,
        type: 'DISPATCH',
        message: `Dispatched ${result.childOrders.length} child slices: ${result.childOrders
          .map((c) => `${c.venueId}: ${c.qty} (${c.percentage}%)`)
          .join(', ')}.`,
      },
      {
        id: `log-${Date.now()}-3`,
        timestamp: timeStr,
        type: 'FILL',
        message: `All child slices filled at VWAP $${result.effectiveVwap.toFixed(2)}. Alpha savings: +$${result.slippageSavedUsd.toFixed(2)} (+${result.slippageSavedBps} bps).`,
      },
    ];

    setLogs((prev) => [...newLogs, ...prev.slice(0, 20)]);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-[#f1f5f9] flex flex-col font-medium">
      {/* Top Header & Telemetry Badges */}
      <Header currentLatencyUs={currentLatencyUs} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Navigation Tabs (5 Tabs with Big Bold Typography) */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          {[
            { id: 'RADAR', label: '1. Live SOR Execution Radar', icon: Radar },
            { id: 'DEPTH', label: '2. Cross-Venue Liquidity Depth', icon: Layers },
            { id: 'SPEC', label: '3. ENGINE_SPEC.md', icon: FileText },
            { id: 'VAULT', label: '4. Monopoly Vault & APA Agreement', icon: Landmark },
            { id: 'PYTHON', label: '5. Production Python Core & Docker', icon: Cpu },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-3.5 sm:px-4.5 rounded-xl text-sm sm:text-base font-black uppercase tracking-tight font-mono flex items-center gap-2 sm:gap-2.5 transition-all shrink-0 ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-xl shadow-violet-600/35 border border-violet-400'
                    : 'bg-[#0d121f] text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Viewport Content */}
        {activeTab === 'RADAR' && (
          <ExecutionRadarTab
            venues={venues}
            routingResult={routingResult}
            onDispatchOrder={handleDispatchOrder}
            logs={logs}
          />
        )}

        {activeTab === 'DEPTH' && (
          <LiquidityDepthTab
            venues={venues}
            isStreaming={isStreaming}
            onToggleStreaming={() => setIsStreaming(!isStreaming)}
            onManualTick={injectTick}
          />
        )}

        {activeTab === 'SPEC' && <EngineSpecTab />}

        {activeTab === 'VAULT' && <MonopolyVaultTab />}

        {activeTab === 'PYTHON' && <PythonCoreTab />}
      </main>

      {/* Institutional Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0b0f19] py-6 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-mono text-slate-300">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-black text-white">
              GHOST FACTORYOS // GF-T3-154 (VORTEXROUTE ENGINE)
            </span>
            <span className="text-slate-600">|</span>
            <span className="font-semibold text-slate-400">TRACK 3 ARCHITECTURAL DELIVERABLE</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <span>ANCHOR SPECIFICATION: <strong className="text-amber-400 font-black text-base">20 kHz (0.48ms)</strong></span>
            <span>JURISDICTION: <strong className="text-slate-200 font-bold">Commercial Software Asset Standard</strong></span>
            <span>CLEAN-ROOM IP: <strong className="text-emerald-400 font-bold">100% PERMISSIVE</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
