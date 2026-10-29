/**
 * APEX-208 Real-Time Options Surface & Volatility Calibration Engine
 * Type definitions - Track 3 Production Reference Core
 * Absolute Zero-Dollar compliance verified: All values are in pts, bps, or %.
 */

export interface SyntheticAsset {
  id: string;
  name: string;
  tickerDescriptor: string;
  spot: number; // in pts
  baseSpreadBps: number;
  initialAlpha: number;
  beta: number; // fixed at 0.70
  initialRho: number;
  initialNu: number;
}

export interface SABRParameters {
  alpha: number; // Volatility level (> 0)
  beta: number;  // Elasticity / CEV backbone (fixed at 0.70)
  rho: number;    // Correlation between asset and vol (-1 < rho < 1)
  nu: number;     // Volatility of volatility (nu > 0)
}

export interface Greeks {
  delta: number;
  gamma: number;
  vega: number;   // pts / 1% vol
  theta: number;  // pts / day
  rho: number;    // pts / 1% rate
}

export interface OptionQuote {
  strike: number;            // pts
  moneyness: number;         // K / F ratio
  maturity: number;          // in years
  marketMidPrice: number;    // pts
  bidPrice: number;          // pts
  askPrice: number;          // pts
  solvedIV: number;          // from Newton-Raphson (decimal)
  sabrIV: number;            // from SABR formula (decimal)
  residualBps: number;       // (sabrIV - solvedIV) * 10000 bps
  greeks: Greeks;
}

export interface SurfacePoint {
  strike: number;
  maturity: number;
  impliedVol: number;
  callPrice: number;
  greeks: Greeks;
}

export interface CalendarArbitrageReport {
  isArbitrageFree: boolean;
  violationCount: number;
  varianceMatrix: { strike: number; variances: { maturity: number; totalVariance: number }[] }[];
  violations: {
    strike: number;
    maturity1: number;
    maturity2: number;
    spreadPts: number;
  }[];
}

export interface ButterflyArbitrageReport {
  isArbitrageFree: boolean;
  violationCount: number;
  densityCurve: { strike: number; density: number; d2c: number }[];
  violations: {
    strike: number;
    density: number;
    butterflyCostPts: number;
  }[];
}

export interface AuditLedgerBlockData {
  index: number;
  timestampUtc: string;
  prevHash: string;
  blockHash: string;
  underlying: string;
  spot: number;
  sabrParams: SABRParameters;
  rmse: number;
  arbitrageStatus: 'ARBITRAGE_FREE' | 'ARBITRAGE_VIOLATION' | 'GENESIS_INITIALIZED';
}
