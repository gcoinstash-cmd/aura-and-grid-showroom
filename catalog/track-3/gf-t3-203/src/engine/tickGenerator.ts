/**
 * Multi-Asset Tick Stream Generator with Cointegration Dynamics & Load Stress Hooks
 * Permissive MIT Clean-Room Implementation
 * Generic Synthetic Clean-Room Asset Identifiers (Zero Third-Party Trademarks)
 */

import { AssetPairConfig, AssetPairId, TickData } from './types';

export const ASSET_PAIRS: Record<AssetPairId, AssetPairConfig> = {
  SYNTH_ALPHA_BETA: {
    id: 'SYNTH_ALPHA_BETA',
    name: 'SYNTH-ALPHA / SYNTH-BETA',
    assetY: 'SYNTH-ALPHA',
    assetX: 'SYNTH-BETA',
    basePriceY: 64200.0,
    basePriceX: 3410.0,
    nominalBeta: 18.82,
    nominalAlpha: 50.0,
    volatilityY: 0.0012,
    volatilityX: 0.0014,
    reversionSpeed: 0.12,
  },
  SYNTH_GAMMA_DELTA: {
    id: 'SYNTH_GAMMA_DELTA',
    name: 'SYNTH-GAMMA / SYNTH-DELTA',
    assetY: 'SYNTH-GAMMA',
    assetX: 'SYNTH-DELTA',
    basePriceY: 152.5,
    basePriceX: 3410.0,
    nominalBeta: 0.0447,
    nominalAlpha: -0.2,
    volatilityY: 0.0022,
    volatilityX: 0.0014,
    reversionSpeed: 0.15,
  },
  INDEX_PRIME_CORE: {
    id: 'INDEX_PRIME_CORE',
    name: 'INDEX-PRIME / BENCH-CORE',
    assetY: 'INDEX-PRIME',
    assetX: 'BENCH-CORE',
    basePriceY: 554.2,
    basePriceX: 486.0,
    nominalBeta: 1.1403,
    nominalAlpha: -0.05,
    volatilityY: 0.0006,
    volatilityX: 0.0008,
    reversionSpeed: 0.18,
  },
  TECH_SPREAD_VOL: {
    id: 'TECH_SPREAD_VOL',
    name: 'TECH-SPREAD / VOL-BASE',
    assetY: 'TECH-SPREAD',
    assetX: 'VOL-BASE',
    basePriceY: 124.8,
    basePriceX: 162.4,
    nominalBeta: 0.768,
    nominalAlpha: 0.15,
    volatilityY: 0.0018,
    volatilityX: 0.002,
    reversionSpeed: 0.1,
  },
};

export class TickGenerator {
  private config: AssetPairConfig;
  private currentPriceY: number;
  private currentPriceX: number;
  private currentBeta: number;
  private currentAlpha: number;
  private currentSpreadNoise: number = 0;

  // Stress testing flags
  private burstTicksRemaining: number = 0;
  private burstMultiplier: number = 1.0;
  private forcedReversionTicksRemaining: number = 0;

  constructor(pairId: AssetPairId = 'SYNTH_ALPHA_BETA') {
    this.config = ASSET_PAIRS[pairId];
    this.currentPriceX = this.config.basePriceX;
    this.currentBeta = this.config.nominalBeta;
    this.currentAlpha = this.config.nominalAlpha;
    this.currentPriceY = this.currentBeta * this.currentPriceX + this.currentAlpha;
  }

  public setPair(pairId: AssetPairId): void {
    this.config = ASSET_PAIRS[pairId];
    this.currentPriceX = this.config.basePriceX;
    this.currentBeta = this.config.nominalBeta;
    this.currentAlpha = this.config.nominalAlpha;
    this.currentSpreadNoise = 0;
    this.currentPriceY = this.currentBeta * this.currentPriceX + this.currentAlpha;
    this.burstTicksRemaining = 0;
    this.forcedReversionTicksRemaining = 0;
  }

  /**
   * Generates next tick with correlated Geometric Brownian Motion + Ornstein-Uhlenbeck spread
   */
  public nextTick(): TickData {
    const isBurst = this.burstTicksRemaining > 0;
    const volMult = isBurst ? this.burstMultiplier : 1.0;
    if (this.burstTicksRemaining > 0) this.burstTicksRemaining--;

    // 1. Asset X random walk: dX = mu*dt + sigma_x * dW_x
    const z1 = this.gaussianRandom();
    const dPriceX = this.currentPriceX * (this.config.volatilityX * volMult * z1);
    this.currentPriceX = Math.max(1.0, this.currentPriceX + dPriceX);

    // 2. Spread Ornstein-Uhlenbeck: dS = -theta * S * dt + sigma_s * dW_s
    let theta = this.config.reversionSpeed;
    if (this.forcedReversionTicksRemaining > 0) {
      theta = 0.65; // Force rapid mean reversion
      this.forcedReversionTicksRemaining--;
    }

    const z2 = this.gaussianRandom();
    const spreadVol = this.config.volatilityY * 1.5 * volMult * (this.currentPriceY * 0.005);
    const dSpread = -theta * this.currentSpreadNoise + spreadVol * z2;
    this.currentSpreadNoise += dSpread;

    // Small random drift on true Beta over time (slow random walk)
    this.currentBeta += this.gaussianRandom() * 0.0001;

    // 3. Asset Y is cointegrated: Y = Beta * X + Alpha + S
    this.currentPriceY = Math.max(
      1.0,
      this.currentBeta * this.currentPriceX + this.currentAlpha + this.currentSpreadNoise
    );

    return {
      timestamp: Date.now(),
      priceY: this.currentPriceY,
      priceX: this.currentPriceX,
    };
  }

  // Load generator controls
  public triggerBurstVolatility(ticks: number = 18, multiplier: number = 4.5): void {
    this.burstTicksRemaining = ticks;
    this.burstMultiplier = multiplier;
  }

  public triggerForcedMeanReversion(ticks: number = 15): void {
    this.forcedReversionTicksRemaining = ticks;
    this.burstTicksRemaining = 0;
  }

  public triggerRegimeShift(): void {
    // Structural break in cointegration: sudden jump in Beta & offset
    const shiftDirection = Math.random() > 0.5 ? 1.25 : 0.8;
    this.currentBeta = this.currentBeta * shiftDirection;
    this.currentAlpha += (Math.random() - 0.5) * (this.currentPriceY * 0.03);
    this.currentSpreadNoise += (Math.random() - 0.5) * (this.currentPriceY * 0.04);
  }

  public getTrueParameters() {
    return {
      trueBeta: this.currentBeta,
      trueAlpha: this.currentAlpha,
      spreadNoise: this.currentSpreadNoise,
      isBurstActive: this.burstTicksRemaining > 0,
      isForcedReversionActive: this.forcedReversionTicksRemaining > 0,
    };
  }

  private gaussianRandom(): number {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
}
