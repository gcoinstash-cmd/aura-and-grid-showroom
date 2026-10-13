export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'LIMIT' | 'MARKET' | 'IOC' | 'FOK';
export type OrderStatus = 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED';

export interface OrderBookEntry {
  price: number;
  quantity: number;
  ordersCount: number;
  cumulativeQty: number;
  depthPercent: number;
}

export interface Order {
  id: string;
  sequenceId: number;
  timestamp: string;
  side: OrderSide;
  type: OrderType;
  price: number;
  quantity: number;
  filledQuantity: number;
  status: OrderStatus;
  traderId: string;
  latencyUs: number;
  ringBufferIndex: number;
}

export interface TradeTick {
  sequenceId: number;
  timestamp: string;
  symbol: string;
  side: OrderSide;
  price: number;
  quantity: number;
  makerOrderId: string;
  takerOrderId: string;
  prevHash: string;
  hmacSignature: string;
  isTampered?: boolean;
}

export interface TelemetryMetrics {
  opsPerSec: number;
  peakOpsPerSec: number;
  monotonicSequence: number;
  p50LatencyMs: number;
  p99LatencyMs: number;
  p999LatencyMs: number;
  ringBufferOccupancy: number; // percentage
  ringBufferHead: number;
  ringBufferTail: number;
  totalMatches: number;
  activeOrders: number;
  cleanRoomScore: number;
  isSimulating: boolean;
}

export type UserRole = 'BUYER_ESCROW' | 'SELLER_ARCHITECT' | 'SEC_AUDITOR' | 'OBSERVER';

export interface UserRoleInfo {
  role: UserRole;
  title: string;
  actor: string;
  permissions: string[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  category: 'SECURITY' | 'ORDER_FLOW' | 'HMAC_AUDIT' | 'APA_ESCROW' | 'SYSTEM';
  actor: string;
  action: string;
  details: string;
  hash: string;
  status: 'VERIFIED' | 'WARNING' | 'CRITICAL';
}

export interface SystemNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
}

export interface MultiSigState {
  sellerSigned: boolean;
  sellerTimestamp: string | null;
  sellerKeyHash: string | null;
  buyerSigned: boolean;
  buyerTimestamp: string | null;
  buyerKeyHash: string | null;
  escrowStatus: 'DRAFT_PENDING' | 'SELLER_COMMITTED' | 'FULLY_EXECUTED_VAULTED';
  vaultEscrowId: string;
}
