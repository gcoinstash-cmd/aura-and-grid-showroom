/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Database, 
  Globe, 
  Cloud, 
  FileText, 
  ShieldCheck, 
  Sparkles,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { 
  OrderBookEntry, 
  TradeTick, 
  TelemetryMetrics, 
  UserRole, 
  AuditLogEntry, 
  SystemNotification, 
  MultiSigState, 
  OrderSide, 
  OrderType,
  Order
} from './types/engine';
import { 
  INITIAL_BIDS, 
  INITIAL_ASKS, 
  INITIAL_TICKS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_NOTIFICATIONS 
} from './data/initialData';
import { computeHmacSha256, formatTickMessage } from './utils/crypto';
import { downloadSpecFile } from './utils/exportSpec';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryCards } from './components/TelemetryCards';
import { EngineCoreTab } from './components/tabs/EngineCoreTab';
import { SqlTickVaultTab } from './components/tabs/SqlTickVaultTab';
import { OpenApiContractTab } from './components/tabs/OpenApiContractTab';
import { CloudRunHarnessTab } from './components/tabs/CloudRunHarnessTab';
import { AcquireApaTab } from './components/tabs/AcquireApaTab';
import { HmacAuditModal } from './components/modals/HmacAuditModal';
import { MultiSigModal } from './components/modals/MultiSigModal';
import { AuditLogDrawer } from './components/modals/AuditLogDrawer';
import { NotificationDrawer } from './components/modals/NotificationDrawer';
import { SearchModal } from './components/modals/SearchModal';

export default function App() {
  // Navigation State (5 Main Navigable Tabs)
  const [activeTab, setActiveTab] = useState<number>(0);

  // Modals & Drawers
  const [isHmacModalOpen, setIsHmacModalOpen] = useState(false);
  const [isMultiSigModalOpen, setIsMultiSigModalOpen] = useState(false);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Role Management
  const [currentRole, setCurrentRole] = useState<UserRole>('BUYER_ESCROW');

  // Offline Mode Cache
  const [isOffline, setIsOffline] = useState(false);

  // Live Simulation State
  const [isSimulating, setIsSimulating] = useState(false);

  // Market & Engine State
  const [bids, setBids] = useState<OrderBookEntry[]>(INITIAL_BIDS);
  const [asks, setAsks] = useState<OrderBookEntry[]>(INITIAL_ASKS);
  const [ticks, setTicks] = useState<TradeTick[]>(INITIAL_TICKS);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [notifications, setNotifications] = useState<SystemNotification[]>(INITIAL_NOTIFICATIONS);

  // Multi-Sig Escrow Covenant State
  const [multiSigState, setMultiSigState] = useState<MultiSigState>({
    sellerSigned: true,
    sellerTimestamp: '2026-10-10T20:45:00.000Z',
    sellerKeyHash: '0x99a14bc09912f8e1247da88c0119f8',
    buyerSigned: false,
    buyerTimestamp: null,
    buyerKeyHash: null,
    escrowStatus: 'SELLER_COMMITTED',
    vaultEscrowId: 'ACQ-VAULT-GF167-2026',
  });

  // Telemetry Metrics
  const [metrics, setMetrics] = useState<TelemetryMetrics>({
    opsPerSec: 250420,
    peakOpsPerSec: 284150,
    monotonicSequence: 1000192,
    p50LatencyMs: 0.58,
    p99LatencyMs: 0.84,
    p999LatencyMs: 1.12,
    ringBufferOccupancy: 38,
    ringBufferHead: 0x4A10,
    ringBufferTail: 0x4A36,
    totalMatches: 84210,
    activeOrders: 142,
    cleanRoomScore: 100,
    isSimulating: false,
  });

  // Simulation Interval Ref
  const simIntervalRef = useRef<number | null>(null);

  // Toggle Simulation
  const handleToggleSimulation = () => {
    setIsSimulating(prev => !prev);
  };

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Offline Caching Effect
  useEffect(() => {
    if (isOffline) {
      // Save snapshot into localStorage
      try {
        localStorage.setItem('GF_T3_167_CACHE', JSON.stringify({
          metrics,
          ticksCount: ticks.length,
          timestamp: new Date().toISOString(),
        }));
      } catch (err) {
        // quota ignore
      }
    }
  }, [isOffline, metrics, ticks]);

  // Real-Time Simulation Loop
  useEffect(() => {
    if (isSimulating) {
      simIntervalRef.current = window.setInterval(async () => {
        // Compute new monotonic tick
        const nextSeq = metrics.monotonicSequence + 1;
        const side: OrderSide = Math.random() > 0.5 ? 'BUY' : 'SELL';
        const priceVariation = (Math.floor(Math.random() * 5) - 2) * 5;
        const price = 104525.00 + priceVariation;
        const quantity = Math.floor(Math.random() * 25) + 5;
        const timestamp = new Date().toISOString();
        const prevHash = ticks[ticks.length - 1]?.hmacSignature || '00000000000000000000000000000000';

        const rawMsg = formatTickMessage({
          sequenceId: nextSeq,
          timestamp,
          symbol: 'High-Aero Grand Touring Telemetry Core-DYN',
          side,
          price,
          quantity,
          prevHash,
        });

        const hmacSignature = await computeHmacSha256(rawMsg);

        const newTick: TradeTick = {
          sequenceId: nextSeq,
          timestamp,
          symbol: 'High-Aero Grand Touring Telemetry Core-DYN',
          side,
          price,
          quantity,
          makerOrderId: 'ord_' + crypto.randomUUID().substring(0, 13),
          takerOrderId: 'ord_' + crypto.randomUUID().substring(0, 13),
          prevHash,
          hmacSignature,
        };

        // Update ticks (keep last 20 for memory efficiency)
        setTicks(prev => [...prev.slice(-19), newTick]);

        // Jitter metrics
        setMetrics(prev => ({
          ...prev,
          monotonicSequence: nextSeq,
          opsPerSec: Math.floor(250000 + (Math.random() * 8000 - 4000)),
          p50LatencyMs: +(0.55 + Math.random() * 0.08).toFixed(2),
          p99LatencyMs: +(0.80 + Math.random() * 0.12).toFixed(2),
          ringBufferOccupancy: Math.floor(35 + Math.random() * 10),
          ringBufferTail: prev.ringBufferTail + 1,
          totalMatches: prev.totalMatches + 1,
        }));
      }, 1800);
    } else {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    }

    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    };
  }, [isSimulating, metrics.monotonicSequence, ticks]);

  // Order Placement Handler
  const handlePlaceOrder = async (orderInput: {
    side: OrderSide;
    type: OrderType;
    price: number;
    quantity: number;
    traderId: string;
  }) => {
    const nextSeq = metrics.monotonicSequence + 1;
    const timestamp = new Date().toISOString();
    const orderId = 'ord_' + crypto.randomUUID().substring(0, 13);
    const prevHash = ticks[ticks.length - 1]?.hmacSignature || '00000000000000000000000000000000';

    // Create tick
    const rawMsg = formatTickMessage({
      sequenceId: nextSeq,
      timestamp,
      symbol: 'High-Aero Grand Touring Telemetry Core-DYN',
      side: orderInput.side,
      price: orderInput.price,
      quantity: orderInput.quantity,
      prevHash,
    });

    const hmacSignature = await computeHmacSha256(rawMsg);

    const newTick: TradeTick = {
      sequenceId: nextSeq,
      timestamp,
      symbol: 'High-Aero Grand Touring Telemetry Core-DYN',
      side: orderInput.side,
      price: orderInput.price,
      quantity: orderInput.quantity,
      makerOrderId: orderId,
      takerOrderId: 'ord_passive_liquidity',
      prevHash,
      hmacSignature,
    };

    setTicks(prev => [...prev.slice(-19), newTick]);

    // Update active orders
    const newOrder: Order = {
      id: orderId,
      sequenceId: nextSeq,
      timestamp,
      side: orderInput.side,
      type: orderInput.type,
      price: orderInput.price,
      quantity: orderInput.quantity,
      filledQuantity: orderInput.quantity,
      status: 'FILLED',
      traderId: orderInput.traderId,
      latencyUs: Math.floor(380 + Math.random() * 120),
      ringBufferIndex: metrics.ringBufferTail % 65536,
    };

    setActiveOrders(prev => [newOrder, ...prev.slice(0, 15)]);

    // Update metrics
    setMetrics(prev => ({
      ...prev,
      monotonicSequence: nextSeq,
      ringBufferTail: prev.ringBufferTail + 1,
      totalMatches: prev.totalMatches + 1,
      activeOrders: prev.activeOrders + 1,
    }));

    // Log to Audit Vault
    const newAuditLog: AuditLogEntry = {
      id: 'aud_' + Math.floor(Math.random() * 9000 + 1000),
      timestamp,
      category: 'ORDER_FLOW',
      actor: orderInput.traderId,
      action: `Executed ${orderInput.side} ${orderInput.quantity}x @ $${orderInput.price.toFixed(2)}`,
      details: `Monotonic Seq #${nextSeq}. Ring buffer slot #${metrics.ringBufferTail % 65536}. Latency: ${newOrder.latencyUs}µs.`,
      hash: '0x' + hmacSignature.substring(0, 14),
      status: 'VERIFIED',
    };
    setAuditLogs(prev => [newAuditLog, ...prev]);

    // Add Notification
    const newNotif: SystemNotification = {
      id: 'notif_' + Date.now(),
      timestamp,
      title: `Order Executed #${nextSeq}`,
      message: `${orderInput.side} ${orderInput.quantity}x High-Aero Grand Touring Telemetry Core-DYN @ $${orderInput.price.toFixed(2)} matched.`,
      level: 'success',
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Tamper with historical tick for security verification testing
  const handleTamperTick = (index: number) => {
    setTicks(prev => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = {
          ...copy[index],
          price: copy[index].price + 250.00,
          isTampered: true,
        };
      }
      return copy;
    });

    const newAudit: AuditLogEntry = {
      id: 'aud_alert_' + Date.now(),
      timestamp: new Date().toISOString(),
      category: 'SECURITY',
      actor: 'Simulated Intruder / Test Script',
      action: 'Malicious Price Mutation Attempted',
      details: 'Historical sequence price altered. PostgreSQL HMAC verification trigger halted transaction commit.',
      hash: '0xTAMPER_ALERT',
      status: 'CRITICAL',
    };
    setAuditLogs(prev => [newAudit, ...prev]);

    const notif: SystemNotification = {
      id: 'notif_tamper_' + Date.now(),
      timestamp: new Date().toISOString(),
      title: 'SECURITY TRIGGER ALARM',
      message: 'HMAC signature mismatch detected in tick ledger! Non-repudiation trigger active.',
      level: 'alert',
      read: false,
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const handleRestoreTicks = () => {
    setTicks(INITIAL_TICKS);
    const restoredAudit: AuditLogEntry = {
      id: 'aud_restore_' + Date.now(),
      timestamp: new Date().toISOString(),
      category: 'HMAC_AUDIT',
      actor: 'HSM Vault Administrator',
      action: 'Ledger Integrity Restored',
      details: 'Historical ticks re-synchronized with genesis hash chain.',
      hash: '0xRESTORED_OK',
      status: 'VERIFIED',
    };
    setAuditLogs(prev => [restoredAudit, ...prev]);
  };

  // Multi-Sig Signing Action
  const handleSignKey = (role: 'SELLER' | 'BUYER', keyHash: string) => {
    const timestamp = new Date().toISOString();

    setMultiSigState(prev => {
      const isSeller = role === 'SELLER';
      const isBuyer = role === 'BUYER';
      const newSellerSigned = isSeller ? true : prev.sellerSigned;
      const newBuyerSigned = isBuyer ? true : prev.buyerSigned;
      const isBoth = newSellerSigned && newBuyerSigned;

      return {
        ...prev,
        sellerSigned: newSellerSigned,
        sellerTimestamp: isSeller ? timestamp : prev.sellerTimestamp,
        sellerKeyHash: isSeller ? keyHash : prev.sellerKeyHash,
        buyerSigned: newBuyerSigned,
        buyerTimestamp: isBuyer ? timestamp : prev.buyerTimestamp,
        buyerKeyHash: isBuyer ? keyHash : prev.buyerKeyHash,
        escrowStatus: isBoth ? 'FULLY_EXECUTED_VAULTED' : 'SELLER_COMMITTED',
      };
    });

    // Add Audit Log
    const newAudit: AuditLogEntry = {
      id: 'aud_multisig_' + Date.now(),
      timestamp,
      category: 'APA_ESCROW',
      actor: `${role} Keyholder`,
      action: `Cryptographic Signature Applied: ${keyHash}`,
      details: `Dual-factor authorization signed for Production Service Engine Deployment.`,
      hash: keyHash,
      status: 'VERIFIED',
    };
    setAuditLogs(prev => [newAudit, ...prev]);

    // Notification
    const notif: SystemNotification = {
      id: 'notif_sig_' + Date.now(),
      timestamp,
      title: `Multi-Sig Key Stamped: ${role}`,
      message: `Dual-key authorization signed. Escrow milestones progressing.`,
      level: 'success',
      read: false,
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const tabs = [
    { id: 'tab_engine', label: '1. Engine Core', icon: Cpu, badge: 'Python 3.12 / C-Struct' },
    { id: 'tab_sql', label: '2. SQL Tick Vault', icon: Database, badge: 'PostgreSQL 16 HMAC' },
    { id: 'tab_openapi', label: '3. OpenAPI 3.1 Contract', icon: Globe, badge: 'REST / WebSocket' },
    { id: 'tab_cloudrun', label: '4. Turnkey Cloud Run Harness', icon: Cloud, badge: '94.2% PyTest' },
    { id: 'tab_apa', label: '5. Acquire.com APA Covenant', icon: FileText, badge: 'Clean-Room IP' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* 1. MONRONEY TOP BANNER */}
      <MonroneyBanner
        isSimulating={isSimulating}
        onToggleSimulation={handleToggleSimulation}
        onOpenHmacAudit={() => setIsHmacModalOpen(true)}
        onExportSpec={downloadSpecFile}
        onOpenMultiSig={() => setIsMultiSigModalOpen(true)}
        onOpenAuditLogs={() => setIsAuditDrawerOpen(true)}
        onOpenNotifications={() => setIsNotifDrawerOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        unreadCount={unreadCount}
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        multiSigState={multiSigState}
        isOffline={isOffline}
        onToggleOffline={() => setIsOffline(prev => !prev)}
      />

      {/* 2. LIVE TELEMETRY METRIC CARDS (High-Contrast Big Typography) */}
      <TelemetryCards
        metrics={metrics}
        onOpenHmacAudit={() => setIsHmacModalOpen(true)}
        onOpenCleanRoomDoc={() => setActiveTab(4)}
      />

      {/* 3. FIVE NAVIGABLE TABS NAVIGATION BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <nav aria-label="Engine Vault Navigation" className="border-b border-zinc-800 flex items-center gap-2 overflow-x-auto pb-px scrollbar-none">
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === idx;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(idx)}
                className={`py-2.5 px-4 font-mono text-base font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-2.5 rounded-t-lg ${
                  isActive
                    ? 'border-amber-400 text-white bg-zinc-900 shadow-sm'
                    : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50'
                }`}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`} />
                <span>{tab.label}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                }`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </nav>
      </section>

      {/* 4. MAIN CONTENT AREA (Full Technical Depth per Tab) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {activeTab === 0 && (
          <EngineCoreTab
            bids={bids}
            asks={asks}
            activeOrders={activeOrders}
            onPlaceOrder={handlePlaceOrder}
            ringBufferHead={metrics.ringBufferHead}
            ringBufferTail={metrics.ringBufferTail}
            ringBufferOccupancy={metrics.ringBufferOccupancy}
          />
        )}

        {activeTab === 1 && (
          <SqlTickVaultTab
            ticks={ticks}
            onTamperTick={handleTamperTick}
            onRestoreTicks={handleRestoreTicks}
            onOpenHmacModal={() => setIsHmacModalOpen(true)}
          />
        )}

        {activeTab === 2 && <OpenApiContractTab />}

        {activeTab === 3 && <CloudRunHarnessTab />}

        {activeTab === 4 && (
          <AcquireApaTab
            multiSigState={multiSigState}
            onOpenMultiSigModal={() => setIsMultiSigModalOpen(true)}
            onExportSpec={downloadSpecFile}
            currentRole={currentRole}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 font-mono text-base sm:text-lg text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-3 font-semibold text-zinc-300">
            <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
            <span>GF-T3-167 // Heavy Overland Dynamics Platform High-Aero Grand Touring Telemetry Core DYNAMIC CORE v1.0.0-PROD</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">ACQUIRE.COM MONOPOLY VAULT</span>
          </div>

          <div className="flex items-center gap-6 text-zinc-300 font-medium">
            <span>SLA: &lt;1.20ms p99</span>
            <span>Zero-Copy Ring-Buffer</span>
            <button
              onClick={downloadSpecFile}
              className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
            >
              Export GF_T3_167_SPEC.md
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS & DRAWERS */}
      <HmacAuditModal
        isOpen={isHmacModalOpen}
        onClose={() => setIsHmacModalOpen(false)}
        ticks={ticks}
      />

      <MultiSigModal
        isOpen={isMultiSigModalOpen}
        onClose={() => setIsMultiSigModalOpen(false)}
        multiSigState={multiSigState}
        onSignKey={handleSignKey}
        currentRole={currentRole}
      />

      <AuditLogDrawer
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
        logs={auditLogs}
      />

      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigateToTab={(idx) => setActiveTab(idx)}
      />
    </div>
  );
}
