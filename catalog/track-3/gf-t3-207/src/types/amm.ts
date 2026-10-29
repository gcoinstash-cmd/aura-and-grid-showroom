/**
 * GF-T3-207: APEX-207 AMM Dynamic Liquidity Engine Types
 * Clean-Room Institutional Quantitative Types
 * Zero Third-Party Financial Marks | Zero Currency Symbols
 */

export interface PoolConfig {
  poolId: string;
  reserveAName: string;
  reserveBName: string;
  activePrice: number;       // Price in pts (Reserve B per Reserve A)
  priceLower: number;        // Lower tick bound p_a
  priceUpper: number;        // Upper tick bound p_b
  liquidityL: number;        // Liquidity scalar L
  feeBaseBps: number;        // Base fee in basis points
  volatilityAlpha: number;   // Volatility sensitivity factor
  baselineSigma: number;     // Baseline return standard deviation
}

export interface LedgerBlock {
  index: number;
  timestampNs: number;
  timestampIso: string;
  actionType: string;
  payload: Record<string, unknown>;
  stateHash: string;
  prevHash: string;
  blockHash: string;
}

export interface SwapExecution {
  swapType: 'EXACT_A_FOR_B' | 'EXACT_B_FOR_A';
  amountIn: number;
  amountOut: number;
  feeDeducted: number;
  feeBps: number;
  priceBefore: number;
  priceAfter: number;
  priceImpactBps: number;
  clampedToTick: boolean;
}

export interface TelemetryState {
  poolId: string;
  reserveAName: string;
  reserveBName: string;
  activePrice: number;
  entryPrice: number;
  priceLower: number;
  priceUpper: number;
  tickInRange: boolean;
  realReserveA: number;
  realReserveB: number;
  virtualReserveA: number;
  virtualReserveB: number;
  liquidityL: number;
  dynamicFeeBps: number;
  rollingSigma: number;
  impermanentLossRatio: number;
  impermanentLossPct: number;
  capitalEfficiencyMultiplier: number;
  constantProductRequiredA: number;
  constantProductRequiredB: number;
  totalFeeAccrualA: number;
  totalFeeAccrualB: number;
  totalVolumeUnits: number;
  swapCount: number;
  ledgerHeight: number;
  ledgerIntegrityVerified: boolean;
  ledgerHeadHash: string;
}
