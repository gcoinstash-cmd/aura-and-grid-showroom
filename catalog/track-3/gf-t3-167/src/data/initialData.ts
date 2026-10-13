import { OrderBookEntry, TradeTick, AuditLogEntry, SystemNotification } from '../types/engine';

export const INITIAL_BIDS: OrderBookEntry[] = [
  { price: 104520.00, quantity: 18, ordersCount: 4, cumulativeQty: 18, depthPercent: 22 },
  { price: 104515.00, quantity: 34, ordersCount: 7, cumulativeQty: 52, depthPercent: 44 },
  { price: 104510.00, quantity: 45, ordersCount: 9, cumulativeQty: 97, depthPercent: 65 },
  { price: 104505.00, quantity: 28, ordersCount: 5, cumulativeQty: 125, depthPercent: 78 },
  { price: 104500.00, quantity: 60, ordersCount: 12, cumulativeQty: 185, depthPercent: 92 },
  { price: 104495.00, quantity: 40, ordersCount: 8, cumulativeQty: 225, depthPercent: 100 },
];

export const INITIAL_ASKS: OrderBookEntry[] = [
  { price: 104530.00, quantity: 15, ordersCount: 3, cumulativeQty: 15, depthPercent: 20 },
  { price: 104535.00, quantity: 28, ordersCount: 6, cumulativeQty: 43, depthPercent: 38 },
  { price: 104540.00, quantity: 50, ordersCount: 11, cumulativeQty: 93, depthPercent: 62 },
  { price: 104545.00, quantity: 32, ordersCount: 5, cumulativeQty: 125, depthPercent: 76 },
  { price: 104550.00, quantity: 65, ordersCount: 14, cumulativeQty: 190, depthPercent: 94 },
  { price: 104555.00, quantity: 42, ordersCount: 8, cumulativeQty: 232, depthPercent: 100 },
];

export const INITIAL_TICKS: TradeTick[] = [
  {
    sequenceId: 1000188,
    timestamp: '2026-10-10T21:28:40.104Z',
    symbol: 'LC500-DYN',
    side: 'BUY',
    price: 104525.00,
    quantity: 12,
    makerOrderId: 'ord_c7a109bf-4819',
    takerOrderId: 'ord_f3d291e0-7782',
    prevHash: '8b7d91e64cf918b958c89bdf1103c2069c97b878201736b7582b17f5c351b894',
    hmacSignature: 'a718c0df1b9a2c3d4e5f60718293a4b5c6d7e8f901a2b3c4d5e6f7a8b9c0d1e2',
  },
  {
    sequenceId: 1000189,
    timestamp: '2026-10-10T21:28:45.312Z',
    symbol: 'LC500-DYN',
    side: 'SELL',
    price: 104525.00,
    quantity: 8,
    makerOrderId: 'ord_2910cbe4-8831',
    takerOrderId: 'ord_a89100fa-1209',
    prevHash: 'a718c0df1b9a2c3d4e5f60718293a4b5c6d7e8f901a2b3c4d5e6f7a8b9c0d1e2',
    hmacSignature: '3f92d4b5a6c7e8f0123456789abcdef0123456789abcdef0123456789abcdef0',
  },
  {
    sequenceId: 1000190,
    timestamp: '2026-10-10T21:29:12.780Z',
    symbol: 'LC500-DYN',
    side: 'BUY',
    price: 104530.00,
    quantity: 15,
    makerOrderId: 'ord_fe8391b0-9941',
    takerOrderId: 'ord_1903ba88-4421',
    prevHash: '3f92d4b5a6c7e8f0123456789abcdef0123456789abcdef0123456789abcdef0',
    hmacSignature: '7d8a9b0c1e2f3a4b5c6d7e8f901a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f90',
  },
  {
    sequenceId: 1000191,
    timestamp: '2026-10-10T21:29:44.205Z',
    symbol: 'LC500-DYN',
    side: 'BUY',
    price: 104530.00,
    quantity: 6,
    makerOrderId: 'ord_aa0198cd-1120',
    takerOrderId: 'ord_9104fa22-3819',
    prevHash: '7d8a9b0c1e2f3a4b5c6d7e8f901a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f90',
    hmacSignature: '5c6d7e8f901a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f901a2b3c4d5e6f7a8b',
  },
  {
    sequenceId: 1000192,
    timestamp: '2026-10-10T21:30:02.891Z',
    symbol: 'LC500-DYN',
    side: 'SELL',
    price: 104525.00,
    quantity: 20,
    makerOrderId: 'ord_5521ab89-4901',
    takerOrderId: 'ord_cc89104b-9901',
    prevHash: '5c6d7e8f901a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f901a2b3c4d5e6f7a8b',
    hmacSignature: '1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c',
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud_9104',
    timestamp: '2026-10-10T21:25:00.000Z',
    category: 'SECURITY',
    actor: 'GhostFactory-CleanRoom-Scanner',
    action: 'AST License Dependency Traversal',
    details: 'Scanned 48 transitive modules. 100% Permissive MIT/Apache-2.0. Zero GPL detected.',
    hash: '0x94fa10b9821...',
    status: 'VERIFIED',
  },
  {
    id: 'aud_9105',
    timestamp: '2026-10-10T21:26:14.000Z',
    category: 'HMAC_AUDIT',
    actor: 'HSM Vault Signer (FIPS 140-3)',
    action: 'Monotonic Chain Attestation',
    details: 'Sequence #1,000,000 to #1,000,192 verified with zero skips and valid hash linkage.',
    hash: '0x43bc88a109f...',
    status: 'VERIFIED',
  },
  {
    id: 'aud_9106',
    timestamp: '2026-10-10T21:28:02.000Z',
    category: 'APA_ESCROW',
    actor: 'Acquire.com Escrow Interface',
    action: 'Draft Asset Purchase Agreement Vaulted',
    details: 'Asset ID GF-T3-167 entered escrow stage. Buyout price: $45,000 USD. Awaiting Dual-Key.',
    hash: '0x77ee018cb34...',
    status: 'VERIFIED',
  },
  {
    id: 'aud_9107',
    timestamp: '2026-10-10T21:30:10.000Z',
    category: 'ORDER_FLOW',
    actor: 'L2 Core Engine (RingBuffer-0)',
    action: 'Benchmark Latency Measurement',
    details: 'p50 = 0.58ms, p99 = 1.04ms over 250,000 ops/sec lock-free sample window.',
    hash: '0x12bb67df001...',
    status: 'VERIFIED',
  }
];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif_1',
    timestamp: '2026-10-10T21:30:00Z',
    title: 'GF-T3-167 Ready for Buyout',
    message: 'Lexus LC 500 Dynamic Core v1.0.0-PROD verified on Acquire.com Micro-APA Escrow.',
    level: 'success',
    read: false,
  },
  {
    id: 'notif_2',
    timestamp: '2026-10-10T21:28:40Z',
    title: 'HMAC Chain Intact',
    message: 'Sequence #1,000,000+ non-repudiation triggers authenticated with 0 discrepancies.',
    level: 'info',
    read: false,
  },
  {
    id: 'notif_3',
    timestamp: '2026-10-10T21:25:12Z',
    title: 'Clean-Room Audit Passed',
    message: '100% Permissive MIT / BSD dependencies. 0% Copyleft liability.',
    level: 'info',
    read: true,
  }
];

export const PYTEST_SUITE = [
  { id: 'test_1', name: 'test_orderbook_fifo_priority', module: 'tests/test_engine.py', duration: '14ms', status: 'PASSED', coverage: '98%' },
  { id: 'test_2', name: 'test_cstruct_ring_buffer_zero_alloc', module: 'tests/test_memory.py', duration: '28ms', status: 'PASSED', coverage: '95%' },
  { id: 'test_3', name: 'test_monotonic_sequence_gap_detection', module: 'tests/test_ledger.py', duration: '19ms', status: 'PASSED', coverage: '100%' },
  { id: 'test_4', name: 'test_hmac_tamper_evident_rollback', module: 'tests/test_security.py', duration: '22ms', status: 'PASSED', coverage: '96%' },
  { id: 'test_5', name: 'test_p99_deterministic_latency_under_load', module: 'tests/test_bench.py', duration: '64ms', status: 'PASSED', coverage: '92%' },
  { id: 'test_6', name: 'test_openapi_order_submission_contracts', module: 'tests/test_api.py', duration: '31ms', status: 'PASSED', coverage: '89%' },
  { id: 'test_7', name: 'test_websocket_stream_backpressure', module: 'tests/test_ws.py', duration: '18ms', status: 'PASSED', coverage: '90%' },
];
