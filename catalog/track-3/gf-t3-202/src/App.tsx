/**
 * APEX-202 (FinTech/Quant Series) - High-Frequency Limit Order Book & Liquidity Matching Engine
 * Institutional Quantitative Terminal & Turnkey Engine Gateway
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ApexOrderBook } from './engine/apexOrderBook';
import {
  Side,
  OrderType,
  TimeInForce,
  Order,
  TradeSettlementEvent,
  L2Snapshot,
  formatCurrency,
  formatUnits,
} from './types/apex';
import { Header } from './components/Header';
import { OrderBookLadder } from './components/OrderBookLadder';
import { OrderEntryConsole } from './components/OrderEntryConsole';
import { TradeTape } from './components/TradeTape';
import { SpecViewer } from './components/SpecViewer';
import { OpenApiViewer } from './components/OpenApiViewer';
import { TestSuiteViewer } from './components/TestSuiteViewer';
import { SourceCodeViewer } from './components/SourceCodeViewer';

export default function App() {
  const [activeTab, setActiveTab] = useState<'terminal' | 'spec' | 'openapi' | 'tests' | 'source'>('terminal');
  const [symbol] = useState<string>('SYNTH-ALPHA / CORE-PT');
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [lastExecutionNotice, setLastExecutionNotice] = useState<string | null>(null);
  const [snapshotState, setSnapshotState] = useState<string | null>(null);

  // Initialize matching engine
  const engine = useMemo(() => new ApexOrderBook('SYNTH-ALPHA / CORE-PT'), []);

  // UI Reactive States
  const [l2Snapshot, setL2Snapshot] = useState<L2Snapshot>({
    symbol: 'SYNTH-ALPHA / CORE-PT',
    timestampNs: Date.now() * 1_000_000,
    sequenceNumber: 0,
    bestBidMicros: null,
    bestAskMicros: null,
    spreadMicros: null,
    bids: [],
    asks: [],
  });

  const [trades, setTrades] = useState<TradeSettlementEvent[]>([]);
  const [openOrders, setOpenOrders] = useState<Order[]>([]);

  // Refresh reactive view
  const syncEngineState = useCallback(() => {
    const snap = engine.getL2Snapshot(15);
    setL2Snapshot(snap);
    setTrades([...engine.tradeHistory].reverse());

    const activeList = Array.from(engine.ordersById.values()).filter(
      (o) => (o.status === 'NEW' || o.status === 'PARTIALLY_FILLED') && o.remainingQtyMicros > 0
    );
    // Sort recent active orders first
    activeList.sort((a, b) => b.createdAtNs - a.createdAtNs);
    setOpenOrders(activeList);
  }, [engine]);

  // Initial liquidity seed
  useEffect(() => {
    async function init() {
      await engine.seedInitialLiquidity(65000);
      syncEngineState();
    }
    init();
  }, [engine, syncEngineState]);

  // Reset book handler
  const handleResetBook = useCallback(async () => {
    await engine.seedInitialLiquidity(65000);
    setLastExecutionNotice('Book reset: 20 liquidity levels seeded across bids & asks.');
    syncEngineState();
  }, [engine, syncEngineState]);

  // Submit Order Handler
  const handleSubmitOrder = async (
    side: Side,
    orderType: OrderType,
    quantityMicros: number,
    priceMicros: number,
    timeInForce: TimeInForce
  ) => {
    const t0 = performance.now();
    const { order, fills } = await engine.submitOrder(
      side,
      orderType,
      quantityMicros,
      priceMicros,
      timeInForce
    );
    const durationUs = Math.round((performance.now() - t0) * 1000);

    syncEngineState();

    if (fills.length > 0) {
      const totalSettlement = fills.reduce((acc, f) => acc + f.settlementMicros, 0);
      setLastExecutionNotice(
        `Executed ${fills.length} fill(s) · Status: ${order.status} · Settlement: ${formatUnits(totalSettlement)} (${durationUs}µs)`
      );
    } else {
      setLastExecutionNotice(
        `Order ${order.orderId} placed on book · Status: ${order.status} · Seq #${engine.sequenceNumber} (${durationUs}µs)`
      );
    }
  };

  // Cancel Order Handler
  const handleCancelOrder = (orderId: string) => {
    const res = engine.cancelOrder(orderId);
    if (res.success) {
      setLastExecutionNotice(`Order ${orderId} cancelled in O(1) · Seq #${res.sequence}`);
    } else {
      setLastExecutionNotice(`Unable to cancel order ${orderId} (already filled or not found)`);
    }
    syncEngineState();
  };

  // HFT Stress: Burst 10 orders
  const handleTriggerBurst = async () => {
    setLastExecutionNotice('Running HFT Burst test (10 rapid limit quotes)...');
    const base = engine.peekBestBid() || 65000 * 1_000_000;
    const basePoints = base / 1_000_000;

    for (let i = 0; i < 10; i++) {
      const isBuy = i % 2 === 0;
      const offset = (Math.floor(Math.random() * 20) - 10) * 5;
      const price = Math.round((basePoints + offset) * 1_000_000);
      const qty = Math.round((0.1 + Math.random() * 0.4) * 1_000_000);
      await engine.submitOrder(isBuy ? 'BUY' : 'SELL', 'LIMIT', qty, price, 'GTC');
    }
    syncEngineState();
  };

  // HFT Stress: Market Sweep
  const handleTriggerSweep = async () => {
    setLastExecutionNotice('Executing aggressive Market Sweep taker order...');
    const sweepSide: Side = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const sweepQty = Math.round((1.5 + Math.random() * 1.5) * 1_000_000);
    const { order, fills } = await engine.submitOrder(sweepSide, 'MARKET', sweepQty, 0, 'IOC');

    syncEngineState();
    setLastExecutionNotice(
      `Market Sweep executed: ${fills.length} contra level(s) consumed · Taker filled: ${(order.filledQtyMicros / 1_000_000).toFixed(4)} units`
    );
  };

  // Snapshot & Restore
  const handleCreateSnapshot = () => {
    const snapStr = engine.createSnapshot();
    setSnapshotState(snapStr);
    setLastExecutionNotice(`State snapshot saved · Sequence #${engine.sequenceNumber} checkpointed.`);
  };

  const handleRestoreState = () => {
    if (!snapshotState) return;
    engine.restoreSnapshot(snapshotState);
    syncEngineState();
    setLastExecutionNotice(`State restored to Sequence #${engine.sequenceNumber} checkpoint.`);
  };

  // Export audit log
  const handleExportAuditLog = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(engine.tradeHistory, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `apex_trade_audit_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Bar Contract Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetBook={handleResetBook}
        symbol={symbol}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto">
        {activeTab === 'terminal' && (
          <div className="space-y-4">
            {/* KPI Telemetry Strip (Tabular Figures) */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="text-[11px] text-slate-400 font-medium">Monotonic Sequence</div>
                <div className="text-lg font-bold text-slate-100 font-mono tabular-nums mt-0.5">
                  #{l2Snapshot.sequenceNumber}
                </div>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="text-[11px] text-slate-400 font-medium">Best Bid</div>
                <div className="text-lg font-bold text-emerald-400 font-mono tabular-nums mt-0.5">
                  {l2Snapshot.bestBidMicros ? formatCurrency(l2Snapshot.bestBidMicros) : '—'}
                </div>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="text-[11px] text-slate-400 font-medium">Best Ask</div>
                <div className="text-lg font-bold text-rose-400 font-mono tabular-nums mt-0.5">
                  {l2Snapshot.bestAskMicros ? formatCurrency(l2Snapshot.bestAskMicros) : '—'}
                </div>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="text-[11px] text-slate-400 font-medium">Market Spread</div>
                <div className="text-lg font-bold text-slate-200 font-mono tabular-nums mt-0.5">
                  {l2Snapshot.spreadMicros !== null ? formatCurrency(l2Snapshot.spreadMicros) : '—'}
                </div>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="text-[11px] text-slate-400 font-medium">Settled Trades</div>
                <div className="text-lg font-bold text-white font-mono tabular-nums mt-0.5">
                  {trades.length}
                </div>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="text-[11px] text-slate-400 font-medium">Audit Integrity</div>
                <div className="text-sm font-semibold text-emerald-400 font-mono mt-1">
                  SHA-256 Chained
                </div>
              </div>
            </div>

            {/* Main Trading Floor Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-210px)] min-h-[640px]">
              {/* Left Column: L2 Depth Ladder */}
              <div className="lg:col-span-4 h-full">
                <OrderBookLadder
                  snapshot={l2Snapshot}
                  onSelectPrice={(p) => setSelectedPrice(p)}
                />
              </div>

              {/* Center Column: Order Placement Gateway & Open Orders */}
              <div className="lg:col-span-4 h-full">
                <OrderEntryConsole
                  symbol={symbol}
                  bestBid={l2Snapshot.bestBidMicros}
                  bestAsk={l2Snapshot.bestAskMicros}
                  selectedPrice={selectedPrice}
                  onSubmitOrder={handleSubmitOrder}
                  openOrders={openOrders}
                  onCancelOrder={handleCancelOrder}
                  lastExecutionNotice={lastExecutionNotice}
                />
              </div>

              {/* Right Column: Trade Settlement Stream & HFT Tools */}
              <div className="lg:col-span-4 h-full">
                <TradeTape
                  trades={trades}
                  onTriggerBurst={handleTriggerBurst}
                  onTriggerSweep={handleTriggerSweep}
                  onExportAuditLog={handleExportAuditLog}
                  onSnapshot={handleCreateSnapshot}
                  onRestore={handleRestoreState}
                  hasSnapshot={snapshotState !== null}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'spec' && <SpecViewer />}
        {activeTab === 'openapi' && <OpenApiViewer />}
        {activeTab === 'tests' && <TestSuiteViewer />}
        {activeTab === 'source' && <SourceCodeViewer />}
      </main>
    </div>
  );
}
