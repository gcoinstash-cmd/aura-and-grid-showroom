import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChildSlice,
  ExecutionStrategy,
  OrderSide,
  ParentOrder,
  SimulationParams,
  ToastAlert,
  NotificationSettings,
} from './types';
import {
  planParentOrder,
  simulateSliceFill,
  getIntradayVolumeBins,
  sha256Sync,
} from './lib/quant-engine';
import { playQuantAlert } from './lib/sound';
import { Header } from './components/Header';
import { SlippageGauge } from './components/SlippageGauge';
import { TrajectoryChart } from './components/TrajectoryChart';
import { IntradayVolumeProfile } from './components/IntradayVolumeProfile';
import { ChildSlicesTable } from './components/ChildSlicesTable';
import { SimulationControls } from './components/SimulationControls';
import { AuditLedgerModal } from './components/AuditLedgerModal';
import { OpenApiDocs } from './components/OpenApiDocs';
import { ToastContainer } from './components/ToastContainer';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';

const TICKER_PRICES: Record<string, number> = {
  'SYNTH-ALPHA': 125.50,
  'SYNTH-BETA': 228.00,
  'INDEX-CORE': 442.20,
  'ETF-BENCH': 585.10,
  'QUANT-PRIME': 260.40,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'cockpit' | 'trajectory' | 'audit' | 'openapi'>('cockpit');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedAuditSliceId, setSelectedAuditSliceId] = useState<string | undefined>(undefined);

  // Notification & Sound Settings State
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    soundEnabled: true,
    slippageThresholdBps: 10.0,
    notifyOnSlippageBreach: true,
    notifyOnOrderComplete: true,
    notifyOnVolumeShock: true,
    notifyOnSpreadWidening: true,
  });

  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [alertHistory, setAlertHistory] = useState<ToastAlert[]>([]);
  const slippageAlertTriggeredRef = useRef(false);

  // Helper to add toast alert
  const addToast = useCallback((alert: Omit<ToastAlert, 'id' | 'timestamp'>) => {
    const id = `ALERT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const newToast: ToastAlert = {
      ...alert,
      id,
      timestamp,
      autoCloseMs: alert.autoCloseMs ?? 6000,
    };

    setToasts((prev) => [newToast, ...prev].slice(0, 5));
    setAlertHistory((prev) => [newToast, ...prev].slice(0, 30));

    // Auto dismiss after autoCloseMs
    if (newToast.autoCloseMs && newToast.autoCloseMs > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, newToast.autoCloseMs);
    }
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  // Toggle Sound with confirmation ping
  const handleToggleSound = () => {
    setNotificationSettings((prev) => {
      const nextState = !prev.soundEnabled;
      if (nextState) {
        playQuantAlert('info_ping', true);
      }
      return { ...prev, soundEnabled: nextState };
    });
  };

  const handleTestSound = () => {
    playQuantAlert('order_complete', notificationSettings.soundEnabled);
  };

  // Simulation Parameters State
  const [params, setParams] = useState<SimulationParams>({
    symbol: 'SYNTH-ALPHA',
    notional: 1_000_000.0,
    arrival_price: 125.50,
    side: 'BUY',
    strategy: 'ALMGREN_CHRISS',
    slices: 20,
    risk_aversion_lambda: 1e-6,
    volatility_sigma: 0.02,
    temporary_impact_eta: 2.5e-7,
    permanent_impact_gamma: 1.0e-7,
    twap_jitter_pct: 0.15,
  });

  // Market Conditions State
  const [volumeShock, setVolumeShock] = useState(false);
  const [spreadWidened, setSpreadWidened] = useState(false);
  const [spreadBps, setSpreadBps] = useState(2.5);

  // Execution State
  const [parentOrder, setParentOrder] = useState<ParentOrder>(() => planParentOrder({
    symbol: 'SYNTH-ALPHA',
    notional: 1_000_000.0,
    arrival_price: 125.50,
    side: 'BUY',
    strategy: 'ALMGREN_CHRISS',
    slices: 20,
    risk_aversion_lambda: 1e-6,
    volatility_sigma: 0.02,
    temporary_impact_eta: 2.5e-7,
    permanent_impact_gamma: 1.0e-7,
    twap_jitter_pct: 0.15,
  }));

  const [isExecuting, setIsExecuting] = useState(false);
  const [currentSliceIndex, setCurrentSliceIndex] = useState(0);
  const [execSpeed, setExecSpeed] = useState<number>(2); // 1x, 2x, 5x, 10x, 999 (instant)

  // Keep arrival price synchronized when symbol changes
  useEffect(() => {
    const p = TICKER_PRICES[params.symbol] || 125.50;
    setParams((prev) => ({ ...prev, arrival_price: p }));
  }, [params.symbol]);

  // Re-plan order when parameters change (if not actively executing)
  const handleReplan = useCallback(() => {
    setIsExecuting(false);
    setCurrentSliceIndex(0);
    slippageAlertTriggeredRef.current = false;
    const newOrder = planParentOrder(params);
    setParentOrder(newOrder);
  }, [params]);

  useEffect(() => {
    handleReplan();
  }, [handleReplan]);

  // Step single slice execution
  const executeNextSlice = useCallback(() => {
    setParentOrder((prevOrder) => {
      const idx = prevOrder.slices.findIndex((s) => s.status === 'PENDING');
      if (idx === -1) {
        setIsExecuting(false);
        return { ...prevOrder, status: 'COMPLETED' };
      }

      const slice = prevOrder.slices[idx];
      const { fillPrice, slippageBps: sBps } = simulateSliceFill(
        slice.target_shares,
        prevOrder.arrival_price,
        prevOrder.side,
        slice.venue,
        params.temporary_impact_eta,
        spreadBps,
        volumeShock
      );

      // Advance SHA-256 chain
      const blockData = `${prevOrder.latest_audit_hash}|${slice.slice_id}|${slice.target_shares.toFixed(4)}|${fillPrice.toFixed(4)}|${slice.venue}|FILLED`;
      const nextHash = sha256Sync(blockData);

      const updatedSlices: ChildSlice[] = prevOrder.slices.map((s, i) => {
        if (i === idx) {
          return {
            ...s,
            status: 'FILLED' as const,
            filled_shares: s.target_shares,
            fill_price: fillPrice,
            slippage_bps: sBps,
            audit_hash: nextHash,
          };
        }
        return s;
      });

      // Recalculate parent order aggregates
      const filledSlices = updatedSlices.filter((s) => s.status === 'FILLED');
      const totalFilled = filledSlices.reduce((acc, s) => acc + s.filled_shares, 0);
      const totalCost = filledSlices.reduce((acc, s) => acc + s.filled_shares * (s.fill_price || prevOrder.arrival_price), 0);
      const avgPrice = totalFilled > 0 ? totalCost / totalFilled : prevOrder.arrival_price;

      let shortfall = 0;
      let orderSlippage = 0;
      if (prevOrder.side === 'BUY') {
        shortfall = (avgPrice - prevOrder.arrival_price) * totalFilled;
        orderSlippage = ((avgPrice - prevOrder.arrival_price) / prevOrder.arrival_price) * 10000;
      } else {
        shortfall = (prevOrder.arrival_price - avgPrice) * totalFilled;
        orderSlippage = ((prevOrder.arrival_price - avgPrice) / prevOrder.arrival_price) * 10000;
      }

      // THRESHOLD ALERT 1: Slippage Threshold Breach
      if (
        notificationSettings.notifyOnSlippageBreach &&
        !slippageAlertTriggeredRef.current &&
        (orderSlippage > notificationSettings.slippageThresholdBps || sBps > notificationSettings.slippageThresholdBps)
      ) {
        slippageAlertTriggeredRef.current = true;
        const currentBreachedBps = Math.max(orderSlippage, sBps);
        addToast({
          title: `Threshold Breach: Slippage > ${notificationSettings.slippageThresholdBps.toFixed(1)}bps`,
          message: `Execution slippage reached ${currentBreachedBps.toFixed(2)} bps on slice #${idx + 1} (${slice.venue}), exceeding the ${notificationSettings.slippageThresholdBps.toFixed(1)} bps tolerance limit.`,
          severity: 'critical',
          triggerType: 'SLIPPAGE_BREACH',
          metricValue: `${currentBreachedBps.toFixed(2)} bps`,
        });
        playQuantAlert('slippage_breach', notificationSettings.soundEnabled);
      }

      const allCompleted = idx === prevOrder.slices.length - 1;
      if (allCompleted) {
        setIsExecuting(false);
        // THRESHOLD ALERT 2: Parent Order Complete
        if (notificationSettings.notifyOnOrderComplete) {
          addToast({
            title: 'Parent Order Complete',
            message: `Parent order ${prevOrder.order_id} filled 100% across all ${updatedSlices.length} child slices. Final VWAP: ${avgPrice.toFixed(4)} pts.`,
            severity: 'success',
            triggerType: 'ORDER_COMPLETE',
            metricValue: `${totalFilled.toFixed(0)} Shares Filled`,
          });
          playQuantAlert('order_complete', notificationSettings.soundEnabled);
        }
      }
      setCurrentSliceIndex(idx + 1);

      return {
        ...prevOrder,
        executed_shares: Math.round(totalFilled * 10000) / 10000,
        remaining_shares: Math.max(0, Math.round((prevOrder.total_shares - totalFilled) * 10000) / 10000),
        average_exec_price: Math.round(avgPrice * 10000) / 10000,
        implementation_shortfall_usd: Math.round(shortfall * 100) / 100,
        slippage_bps: Math.round(orderSlippage * 100) / 100,
        status: allCompleted ? 'COMPLETED' : 'ACTIVE',
        slices: updatedSlices,
        latest_audit_hash: nextHash,
        completed_at: allCompleted ? new Date().toISOString() : null,
      };
    });
  }, [params.temporary_impact_eta, spreadBps, volumeShock, notificationSettings, addToast]);

  // Handle instant execution
  useEffect(() => {
    if (isExecuting && execSpeed === 999) {
      let activeOrder = { ...parentOrder };
      let curHash = activeOrder.latest_audit_hash;
      const updatedSlices: ChildSlice[] = activeOrder.slices.map((slice) => {
        if (slice.status === 'FILLED') return slice;
        const { fillPrice, slippageBps: sBps } = simulateSliceFill(
          slice.target_shares,
          activeOrder.arrival_price,
          activeOrder.side,
          slice.venue,
          params.temporary_impact_eta,
          spreadBps,
          volumeShock
        );
        const blockData = `${curHash}|${slice.slice_id}|${slice.target_shares.toFixed(4)}|${fillPrice.toFixed(4)}|${slice.venue}|FILLED`;
        curHash = sha256Sync(blockData);

        return {
          ...slice,
          status: 'FILLED' as const,
          filled_shares: slice.target_shares,
          fill_price: fillPrice,
          slippage_bps: sBps,
          audit_hash: curHash,
        };
      });

      const totalCost = updatedSlices.reduce((acc, s) => acc + s.filled_shares * (s.fill_price || activeOrder.arrival_price), 0);
      const avgPrice = totalCost / activeOrder.total_shares;
      const shortfall = (avgPrice - activeOrder.arrival_price) * activeOrder.total_shares;
      const orderSlippage = ((avgPrice - activeOrder.arrival_price) / activeOrder.arrival_price) * 10000;

      // Check slippage breach
      if (
        notificationSettings.notifyOnSlippageBreach &&
        !slippageAlertTriggeredRef.current &&
        orderSlippage > notificationSettings.slippageThresholdBps
      ) {
        slippageAlertTriggeredRef.current = true;
        addToast({
          title: `Threshold Breach: Slippage > ${notificationSettings.slippageThresholdBps.toFixed(1)}bps`,
          message: `Instant execution slippage concluded at ${orderSlippage.toFixed(2)} bps, exceeding tolerance limit of ${notificationSettings.slippageThresholdBps.toFixed(1)} bps.`,
          severity: 'critical',
          triggerType: 'SLIPPAGE_BREACH',
          metricValue: `${orderSlippage.toFixed(2)} bps`,
        });
        playQuantAlert('slippage_breach', notificationSettings.soundEnabled);
      }

      // Order complete alert
      if (notificationSettings.notifyOnOrderComplete) {
        addToast({
          title: 'Parent Order Complete',
          message: `Parent order ${activeOrder.order_id} instantly liquidated 100% across ${activeOrder.total_shares.toFixed(0)} shares.`,
          severity: 'success',
          triggerType: 'ORDER_COMPLETE',
          metricValue: `${activeOrder.total_shares.toFixed(0)} Shares`,
        });
        playQuantAlert('order_complete', notificationSettings.soundEnabled);
      }

      setParentOrder({
        ...activeOrder,
        executed_shares: activeOrder.total_shares,
        remaining_shares: 0,
        average_exec_price: Math.round(avgPrice * 10000) / 10000,
        implementation_shortfall_usd: Math.round(shortfall * 100) / 100,
        slippage_bps: Math.round(orderSlippage * 100) / 100,
        status: 'COMPLETED',
        slices: updatedSlices,
        latest_audit_hash: curHash,
        completed_at: new Date().toISOString(),
      });
      setCurrentSliceIndex(activeOrder.slices.length);
      setIsExecuting(false);
    }
  }, [isExecuting, execSpeed, parentOrder, params.temporary_impact_eta, spreadBps, volumeShock, notificationSettings, addToast]);

  // Automated execution timer
  useEffect(() => {
    if (!isExecuting || execSpeed === 999) return;
    const intervalMs = Math.max(80, 800 / execSpeed);
    const timer = setInterval(() => {
      executeNextSlice();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isExecuting, execSpeed, executeNextSlice]);

  // Gate 3 Control 1: Inject 1M Notional Parent Order
  const handleInjectMillionOrder = () => {
    setIsExecuting(false);
    slippageAlertTriggeredRef.current = false;
    const millionParams: SimulationParams = {
      ...params,
      notional: 1_000_000.0,
      strategy: 'ALMGREN_CHRISS',
    };
    setParams(millionParams);
    const newOrder = planParentOrder(millionParams);
    setParentOrder(newOrder);
    setCurrentSliceIndex(0);

    addToast({
      title: 'Parent Order Injected: 1,000,000 Notional',
      message: `Engaged Almgren-Chriss liquidation pipeline for ${millionParams.symbol} across ${millionParams.slices} discrete interval slices.`,
      severity: 'info',
      triggerType: 'DARK_POOL_CROSS',
      metricValue: '1,000,000 Units',
    });
    playQuantAlert('info_ping', notificationSettings.soundEnabled);

    setTimeout(() => setIsExecuting(true), 150);
  };

  // Gate 3 Control 2: Trigger Sudden Volume Spike
  const handleTriggerVolumeSpike = () => {
    setVolumeShock((prev) => {
      const next = !prev;
      if (next && notificationSettings.notifyOnVolumeShock) {
        addToast({
          title: 'Alert: Sudden Volume Shock Injected',
          message: 'Intraday volume surged 85% above baseline expectation. Execution slippage and temporary impact escalated.',
          severity: 'warning',
          triggerType: 'VOLUME_SHOCK',
          metricValue: '+85% Volume Spike',
        });
        playQuantAlert('market_shock', notificationSettings.soundEnabled);
      }
      return next;
    });
  };

  // Gate 3 Control 3: Simulate Spread Widening
  const handleSimulateSpreadWidening = () => {
    setSpreadWidened((prev) => {
      const next = !prev;
      const newSpread = next ? 15.0 : 2.5;
      setSpreadBps(newSpread);
      if (next && notificationSettings.notifyOnSpreadWidening) {
        addToast({
          title: `Alert: Spread Widened to ${newSpread.toFixed(1)} bps`,
          message: 'Orderbook depth thinning under market stress. Half-spread crossing penalty increased.',
          severity: 'warning',
          triggerType: 'SPREAD_WIDENING',
          metricValue: `${newSpread.toFixed(1)} bps`,
        });
        playQuantAlert('market_shock', notificationSettings.soundEnabled);
      }
      return next;
    });
  };

  // Gate 3 Control 4: Export Execution Fill Tape
  const handleExportFillTape = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      const headers = 'slice_index,slice_id,venue,status,target_shares,filled_shares,limit_price,fill_price,slippage_bps,audit_hash\n';
      const rows = parentOrder.slices
        .map(
          (s) =>
            `${s.slice_index},${s.slice_id},${s.venue},${s.status},${s.target_shares},${s.filled_shares},${s.limit_price},${s.fill_price || ''},${s.slippage_bps},${s.audit_hash}`
        )
        .join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `APEX204_FILL_TAPE_${parentOrder.order_id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const data = {
        parent_order: parentOrder,
        export_timestamp: new Date().toISOString(),
        audit_chain_verified: true,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `APEX204_EXECUTION_${parentOrder.order_id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Venue distribution breakdown
  const venueCounts = parentOrder.slices.reduce(
    (acc, s) => {
      acc[s.venue] = (acc[s.venue] || 0) + (s.status === 'FILLED' ? s.filled_shares : s.target_shares);
      return acc;
    },
    {} as Record<string, number>
  );
  const totalVolumeCalculated = Object.values(venueCounts).reduce((a, b) => a + b, 0) || 1;
  const darkPoolPct = Math.round(((venueCounts['DARK_POOL_ATS'] || 0) / totalVolumeCalculated) * 100);
  const primaryLitPct = Math.round(((venueCounts['PRIMARY_EXCHANGE_LIT'] || 0) / totalVolumeCalculated) * 100);
  const secondaryEcnPct = Math.max(0, 100 - darkPoolPct - primaryLitPct);

  // Intraday Volume Bins
  const volumeBins = getIntradayVolumeBins(params.slices, currentSliceIndex - 1, volumeShock);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* 3-Zone Institutional Header with Audio and Alerts Controls */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onInjectMillionOrder={handleInjectMillionOrder}
        isExecuting={isExecuting}
        soundEnabled={notificationSettings.soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenAlertSettings={() => setShowSettingsModal(true)}
        alertCount={toasts.length}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-5 sm:p-6 space-y-6">
        {/* Top Quantitative Telemetry Strip */}
        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {/* Order ID & Status */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-4">
            <span className="text-sm text-zinc-500 uppercase block font-mono font-medium">Parent Order</span>
            <div className="text-base font-bold text-zinc-100 font-mono mt-0.5 truncate">{parentOrder.order_id}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  parentOrder.status === 'COMPLETED'
                    ? 'bg-emerald-400'
                    : isExecuting
                    ? 'bg-cyan-400 animate-ping'
                    : 'bg-zinc-500'
                }`}
              ></span>
              <span className="text-sm font-mono text-zinc-300 font-semibold">{parentOrder.status}</span>
            </div>
          </div>

          {/* Notional Capital (Zero Dollar Gate Compliance) */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-4">
            <span className="text-sm text-zinc-500 uppercase block font-mono font-medium">Total Notional</span>
            <div className="text-2xl font-bold tracking-tight text-zinc-100 font-mono tabular-nums mt-0.5">
              {parentOrder.notional.toLocaleString()}
            </div>
            <div className="text-sm text-zinc-400 font-mono mt-1">
              {parentOrder.symbol} · {params.side} Units
            </div>
          </div>

          {/* Slicing Progress */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-4">
            <span className="text-sm text-zinc-500 uppercase block font-mono font-medium">Execution Progress</span>
            <div className="text-2xl font-bold tracking-tight text-cyan-400 font-mono tabular-nums mt-0.5">
              {((parentOrder.executed_shares / Math.max(1, parentOrder.total_shares)) * 100).toFixed(1)}%
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-cyan-400 h-full transition-all duration-300"
                style={{ width: `${(parentOrder.executed_shares / Math.max(1, parentOrder.total_shares)) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Realized Slippage */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-4">
            <span className="text-sm text-zinc-500 uppercase block font-mono font-medium">Realized Slippage</span>
            <div
              className={`text-2xl font-bold tracking-tight font-mono tabular-nums mt-0.5 ${
                parentOrder.slippage_bps < 0
                  ? 'text-emerald-400'
                  : parentOrder.slippage_bps <= 3.5
                  ? 'text-cyan-400'
                  : parentOrder.slippage_bps <= 8.0
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {parentOrder.slippage_bps > 0 ? `+${parentOrder.slippage_bps.toFixed(2)}` : parentOrder.slippage_bps.toFixed(2)} bps
            </div>
            <div className="text-sm text-zinc-400 font-mono mt-1">
              Shortfall: {Math.abs(parentOrder.implementation_shortfall_usd).toFixed(2)} pts
            </div>
          </div>

          {/* SOR Routing Split */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-4">
            <span className="text-sm text-zinc-500 uppercase block font-mono font-medium">SOR Allocation</span>
            <div className="text-2xl font-bold tracking-tight text-zinc-100 font-mono tabular-nums mt-0.5">
              {darkPoolPct}% Dark
            </div>
            <div className="text-sm text-zinc-400 font-mono mt-1">
              {primaryLitPct}% Lit · {secondaryEcnPct}% ECN
            </div>
          </div>

          {/* Market Microstructure Spread */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-4">
            <span className="text-sm text-zinc-500 uppercase block font-mono font-medium">Market Spread</span>
            <div className={`text-2xl font-bold tracking-tight font-mono tabular-nums mt-0.5 ${spreadWidened ? 'text-amber-400' : 'text-zinc-200'}`}>
              {spreadBps.toFixed(1)} bps
            </div>
            <div className="text-sm text-zinc-400 font-mono mt-1">
              {volumeShock ? '⚠️ Shock Active' : 'Nominal Book'}
            </div>
          </div>
        </section>

        {/* Tab 1: Execution Cockpit */}
        {activeTab === 'cockpit' && (
          <div className="space-y-6">
            {/* Gate 3 Simulation Controls Panel */}
            <SimulationControls
              params={params}
              setParams={setParams}
              isExecuting={isExecuting}
              onPlay={() => setIsExecuting(true)}
              onPause={() => setIsExecuting(false)}
              onStep={executeNextSlice}
              onReset={handleReplan}
              onInjectMillionOrder={handleInjectMillionOrder}
              onTriggerVolumeSpike={handleTriggerVolumeSpike}
              onSimulateSpreadWidening={handleSimulateSpreadWidening}
              onExportFillTape={handleExportFillTape}
              volumeShock={volumeShock}
              spreadWidened={spreadWidened}
              spreadBps={spreadBps}
              execSpeed={execSpeed}
              setExecSpeed={setExecSpeed}
            />

            {/* Middle Grid: Trajectory Chart (2 cols) & Slippage Gauge (1 col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TrajectoryChart
                  totalShares={parentOrder.total_shares}
                  slices={parentOrder.slices}
                  strategy={params.strategy}
                  riskAversion={params.risk_aversion_lambda}
                  volatility={params.volatility_sigma}
                  temporaryImpact={params.temporary_impact_eta}
                />
              </div>

              <div>
                <SlippageGauge
                  slippageBps={parentOrder.slippage_bps}
                  implementationShortfallUsd={parentOrder.implementation_shortfall_usd}
                  arrivalPrice={parentOrder.arrival_price}
                  averageExecPrice={parentOrder.average_exec_price}
                  side={parentOrder.side}
                  executedShares={parentOrder.executed_shares}
                  totalShares={parentOrder.total_shares}
                />
              </div>
            </div>

            {/* Intraday Volume Distribution Profile */}
            <IntradayVolumeProfile
              bins={volumeBins}
              volumeShock={volumeShock}
              activeSliceIndex={currentSliceIndex - 1}
            />

            {/* Live Child Slices Table */}
            <ChildSlicesTable
              slices={parentOrder.slices}
              onInspectAudit={(sliceId) => {
                setSelectedAuditSliceId(sliceId);
                setShowAuditModal(true);
              }}
            />
          </div>
        )}

        {/* Tab 2: Trajectory & Slicing Focus */}
        {activeTab === 'trajectory' && (
          <div className="space-y-6">
            <SimulationControls
              params={params}
              setParams={setParams}
              isExecuting={isExecuting}
              onPlay={() => setIsExecuting(true)}
              onPause={() => setIsExecuting(false)}
              onStep={executeNextSlice}
              onReset={handleReplan}
              onInjectMillionOrder={handleInjectMillionOrder}
              onTriggerVolumeSpike={handleTriggerVolumeSpike}
              onSimulateSpreadWidening={handleSimulateSpreadWidening}
              onExportFillTape={handleExportFillTape}
              volumeShock={volumeShock}
              spreadWidened={spreadWidened}
              spreadBps={spreadBps}
              execSpeed={execSpeed}
              setExecSpeed={setExecSpeed}
            />

            <TrajectoryChart
              totalShares={parentOrder.total_shares}
              slices={parentOrder.slices}
              strategy={params.strategy}
              riskAversion={params.risk_aversion_lambda}
              volatility={params.volatility_sigma}
              temporaryImpact={params.temporary_impact_eta}
            />

            <IntradayVolumeProfile
              bins={volumeBins}
              volumeShock={volumeShock}
              activeSliceIndex={currentSliceIndex - 1}
            />
          </div>
        )}

        {/* Tab 3: Cryptographic Audit Ledger */}
        {activeTab === 'audit' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between bg-zinc-900/70 border border-zinc-800 rounded-lg p-5">
              <div>
                <h3 className="text-base font-bold text-zinc-100 uppercase tracking-wide">
                  Chained Immutable Execution Audit Trail
                </h3>
                <p className="text-sm text-zinc-400 font-mono mt-1">
                  Parent Order: {parentOrder.order_id} · Genesis Hash: {parentOrder.genesis_hash.substring(0, 16)}...
                </p>
              </div>

              <button
                onClick={() => handleExportFillTape('csv')}
                className="min-h-[44px] px-5 py-2.5 text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-md cursor-pointer transition-colors"
              >
                Download Audit CSV
              </button>
            </div>

            <ChildSlicesTable
              slices={parentOrder.slices}
              onInspectAudit={(sliceId) => {
                setSelectedAuditSliceId(sliceId);
                setShowAuditModal(true);
              }}
            />
          </div>
        )}

        {/* Tab 4: OpenAPI Specification & Formulas */}
        {activeTab === 'openapi' && <OpenApiDocs />}
      </main>

      {/* Floating Toast Alert Notifications with Sound Toggle */}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        onClearAll={clearAllToasts}
        settings={notificationSettings}
        onToggleSound={handleToggleSound}
        onTestSound={handleTestSound}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Modal for Threshold Settings & Alert Log */}
      {showSettingsModal && (
        <NotificationSettingsModal
          settings={notificationSettings}
          setSettings={setNotificationSettings}
          onClose={() => setShowSettingsModal(false)}
          alertHistory={alertHistory}
          onClearHistory={() => setAlertHistory([])}
        />
      )}

      {/* Modal for SHA-256 Ledger Inspection */}
      {showAuditModal && (
        <AuditLedgerModal
          order={parentOrder}
          selectedSliceId={selectedAuditSliceId}
          onClose={() => {
            setShowAuditModal(false);
            setSelectedAuditSliceId(undefined);
          }}
        />
      )}
    </div>
  );
}
