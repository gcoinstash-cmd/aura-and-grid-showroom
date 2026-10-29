/**
 * APEX-210 Microstructure & LOB Types
 * Zero-Dollar Gate: All figures are dimensionless units, points, or basis points.
 */

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'LIMIT' | 'MARKET';

export interface DepthLevel {
  pricePts: number;
  units: number;
  cumulativeUnits: number;
  orderCount: number;
}

export interface ExecutionFill {
  fillId: string;
  makerOrderId: string;
  takerOrderId: string;
  side: OrderSide;
  pricePts: number;
  units: number;
  timestamp: number;
  priceImpactPts: number;
}

export interface UserChildOrder {
  orderId: string;
  side: OrderSide;
  pricePts: number;
  quantityUnits: number;
  filledUnits: number;
  remainingUnits: number;
  status: 'RESTING' | 'PARTIAL' | 'FILLED' | 'CANCELLED';
  submittedAt: number;
  queueIndex: number;
  totalOrdersAtLevel: number;
  unitsAhead: number;
  initialUnitsAhead: number;
  estimatedFillProbability: number;
}

export interface HawkesState {
  mu: number;      // Base Poisson arrival rate
  alpha: number;   // Self-excitation jump amplitude
  beta: number;    // Memory decay parameter
  currentIntensity: number;
  branchingRatio: number; // eta = alpha / beta
  history: { timestamp: number; intensity: number }[];
}

export interface MicrostructureMetrics {
  midPricePts: number;
  spreadPts: number;
  spreadBps: number;
  bestBidPts: number;
  bestAskPts: number;
  orderBookImbalance: number; // [-1.0, +1.0]
  kylesLambda: number;        // pts per thousand units
  amihudRatio: number;        // points moved per unit volume
  vwapPts: number;
  totalTradedUnits: number;
  executionCount: number;
}

export interface AuditBlock {
  index: number;
  timestamp: number;
  eventType: string;
  payload: Record<string, unknown>;
  prevHash: string;
  hash: string;
}

export type SyntheticAssetPair = 
  | 'SYNTH-LOB-01 (CORE-LIQ / BASE-UNIT)'
  | 'FAST-BOOK-ALPHA (HIGH-FREQ-INDEX / BENCH)'
  | 'CROSS-VENUE-DELTA (INSTITUTIONAL-SPREAD)';
