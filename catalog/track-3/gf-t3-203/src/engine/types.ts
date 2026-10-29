/**
 * APEX-203 Quant Kalman Filter & Statistical Arbitrage Engine
 * Clean-Room Permissive MIT IP Architecture
 */

export type AssetPairId =
  | 'SYNTH_ALPHA_BETA'
  | 'SYNTH_GAMMA_DELTA'
  | 'INDEX_PRIME_CORE'
  | 'TECH_SPREAD_VOL';

export interface AssetPairConfig {
  id: AssetPairId;
  name: string;
  assetY: string;
  assetX: string;
  basePriceY: number;
  basePriceX: number;
  nominalBeta: number;
  nominalAlpha: number;
  volatilityY: number;
  volatilityX: number;
  reversionSpeed: number; // OU theta
}

export type TradeSignalType =
  | 'NONE'
  | 'ENTER_LONG_SPREAD'
  | 'ENTER_SHORT_SPREAD'
  | 'EXIT_NEUTRAL'
  | 'STOP_OUT';

export interface TickData {
  timestamp: number;
  priceY: number;
  priceX: number;
}

export interface KalmanState {
  beta: number;          // Slope (hedge ratio)
  alpha: number;         // Intercept
  p00: number;           // Covariance matrix P[0][0]
  p01: number;           // Covariance matrix P[0][1]
  p10: number;           // Covariance matrix P[1][0]
  p11: number;           // Covariance matrix P[1][1]
  kalmanGainBeta: number;// K[0]
  kalmanGainAlpha: number;// K[1]
  fairValueY: number;    // beta * priceX + alpha
  spread: number;        // priceY - fairValueY (innovation e_t)
  innovationVariance: number; // F_t
}

export interface WelfordStats {
  count: number;
  mean: number;
  variance: number;
  stdev: number;
  zScore: number;
}

export interface OrnsteinUhlenbeckStats {
  theta: number;        // Reversion speed parameter
  halfLife: number;     // Half-life in ticks: ln(2) / theta
  isMeanReverting: boolean;
  residualVariance: number;
}

export interface PositionState {
  active: boolean;
  side: 'LONG_SPREAD' | 'SHORT_SPREAD' | 'FLAT';
  entryPriceY: number;
  entryPriceX: number;
  entryBeta: number;
  entrySpread: number;
  entryTimestamp: number;
  entryZScore: number;
  unrealizedPnL: number;
  unrealizedReturnPct: number;
}

export interface ClosedTrade {
  id: string;
  side: 'LONG_SPREAD' | 'SHORT_SPREAD';
  entryTime: number;
  exitTime: number;
  entryPriceY: number;
  entryPriceX: number;
  exitPriceY: number;
  exitPriceX: number;
  hedgeRatio: number;
  entrySpread: number;
  exitSpread: number;
  realizedPnL: number;
  returnPct: number;
  exitReason: TradeSignalType;
}

export interface SignalAuditBlock {
  index: number;
  timestamp: number;
  previousHash: string;
  hash: string;
  signal: TradeSignalType;
  priceY: number;
  priceX: number;
  beta: number;
  spread: number;
  zScore: number;
  halfLife: number;
  verified: boolean;
}

export interface QuantEngineTelemetry {
  timestamp: number;
  tickIndex: number;
  priceY: number;
  priceX: number;
  kalman: KalmanState;
  welford: WelfordStats;
  ou: OrnsteinUhlenbeckStats;
  signal: TradeSignalType;
  signalReason: string;
  position: PositionState;
}

export interface EngineHyperparameters {
  observationVarianceR: number; // R (measurement noise)
  processVarianceQ: number;     // Q (state drift noise diagonal)
  welfordWindowSize: number;    // Circular buffer depth (e.g. 50 ticks)
  zScoreEntryThreshold: number; // default 2.0
  zScoreExitThreshold: number;  // default 0.5
  zScoreStopThreshold: number;  // default 3.5
  ouWindowSize: number;         // OU linear regression window (e.g. 60 ticks)
}
