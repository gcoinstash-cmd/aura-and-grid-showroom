/**
 * APEX-202 (FinTech/Quant Series) TypeScript Definitions & Fixed-Point Constants
 * Zero Floating-Point Drift: 64-bit Integer Microunits (Scale = 1,000,000)
 * Track 3 Zero-Dollar & Clean-Room Architecture: Strictly Unit/Points Based
 */

export const PRICE_SCALE = 1_000_000;
export const QTY_SCALE = 1_000_000;

export type Side = 'BUY' | 'SELL';
export type OrderType = 'LIMIT' | 'MARKET';
export type TimeInForce = 'GTC' | 'IOC' | 'FOK';
export type OrderStatus = 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED';

export interface Order {
  orderId: string;
  symbol: string;
  side: Side;
  orderType: OrderType;
  priceMicros: number; // in integer microunits (1.000000 point = 1,000,000 micros)
  initialQtyMicros: number; // in integer microunits (1.000000 unit = 1,000,000 micros)
  remainingQtyMicros: number;
  filledQtyMicros: number;
  timeInForce: TimeInForce;
  clientOrderId?: string;
  createdAtNs: number;
  status: OrderStatus;
}

export interface ExecutionFill {
  fillId: string;
  symbol: string;
  priceMicros: number;
  quantityMicros: number;
  settlementMicros: number;
  makerOrderId: string;
  takerOrderId: string;
  makerSide: Side;
  takerSide: Side;
  timestampNs: number;
  sequenceNumber: number;
}

export interface TradeSettlementEvent {
  sequenceNumber: number;
  fillId: string;
  symbol: string;
  priceMicros: number;
  quantityMicros: number;
  settlementMicros: number;
  makerOrderId: string;
  takerOrderId: string;
  makerSide: Side;
  takerSide: Side;
  timestampNs: number;
  checksumSha256: string;
}

export interface L2Level {
  priceMicros: number;
  totalVolumeMicros: number;
  orderCount: number;
  cumulativeVolumeMicros?: number;
}

export interface L2Snapshot {
  symbol: string;
  timestampNs: number;
  sequenceNumber: number;
  bestBidMicros: number | null;
  bestAskMicros: number | null;
  spreadMicros: number | null;
  bids: L2Level[];
  asks: L2Level[];
}

export interface EngineStats {
  totalOrders: number;
  totalTrades: number;
  sequenceNumber: number;
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
  totalBidLiquidity: number;
  totalAskLiquidity: number;
}

// Fixed-Point Converter Utilities
export const toMicros = (val: number, scale: number = PRICE_SCALE): number => {
  return Math.round(val * scale);
};

export const fromMicros = (micros: number, scale: number = PRICE_SCALE): number => {
  return micros / scale;
};

// Points/Units Formatters (Strictly Zero-Dollar Protocol)
export const formatPoints = (micros: number): string => {
  return `${(micros / PRICE_SCALE).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })} pts`;
};

export const formatUnits = (micros: number): string => {
  return `${(micros / PRICE_SCALE).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })} Units`;
};

// Backward-compatible alias for formatPoints
export const formatCurrency = formatPoints;

export const formatQty = (micros: number): string => {
  return (micros / QTY_SCALE).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
};
