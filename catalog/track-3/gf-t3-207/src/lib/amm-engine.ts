/**
 * GF-T3-207: Client-Side APEX-207 AMM Dynamic Liquidity & Impermanent Loss Engine
 * Production Reference Core - Clean-Room Invariant Implementation
 * Zero Third-Party Financial Marks | Zero Currency Symbols
 */

import { PoolConfig, LedgerBlock, SwapExecution, TelemetryState } from '../types/amm';
import { sha256 } from './sha256';

export const PRESET_POOLS: Record<string, PoolConfig> = {
  'SYNTH-POOL-01': {
    poolId: 'SYNTH-POOL-01',
    reserveAName: 'RESERVE-A',
    reserveBName: 'RESERVE-B',
    activePrice: 2.5000,
    priceLower: 1.8000,
    priceUpper: 3.5000,
    liquidityL: 10_000_000,
    feeBaseBps: 30.0,
    volatilityAlpha: 1.50,
    baselineSigma: 0.0120,
  },
  'STABLE-CORE': {
    poolId: 'STABLE-CORE',
    reserveAName: 'STABLE-CORE',
    reserveBName: 'PEGGED-UNIT',
    activePrice: 1.0000,
    priceLower: 0.9850,
    priceUpper: 1.0150,
    liquidityL: 50_000_000,
    feeBaseBps: 5.0,
    volatilityAlpha: 2.00,
    baselineSigma: 0.0020,
  },
  'HIGH-VOL-ASSET': {
    poolId: 'HIGH-VOL-ASSET',
    reserveAName: 'HIGH-VOL-ASSET',
    reserveBName: 'LIQ-PROXY',
    activePrice: 14.8500,
    priceLower: 9.0000,
    priceUpper: 24.0000,
    liquidityL: 5_000_000,
    feeBaseBps: 60.0,
    volatilityAlpha: 1.80,
    baselineSigma: 0.0350,
  },
};

export class AmmSimulator {
  config: PoolConfig;
  activePrice: number;
  entryPrice: number;
  priceLower: number;
  priceUpper: number;
  liquidityL: number;
  rollingSigma: number;
  totalFeeAccrualA: number = 0;
  totalFeeAccrualB: number = 0;
  totalVolumeUnits: number = 0;
  swapCount: number = 0;
  priceHistory: number[] = [];
  ledger: LedgerBlock[] = [];

  constructor(presetKey: string = 'SYNTH-POOL-01') {
    const preset = PRESET_POOLS[presetKey] || PRESET_POOLS['SYNTH-POOL-01'];
    this.config = { ...preset };
    this.activePrice = preset.activePrice;
    this.entryPrice = preset.activePrice;
    this.priceLower = preset.priceLower;
    this.priceUpper = preset.priceUpper;
    this.liquidityL = preset.liquidityL;
    this.rollingSigma = preset.baselineSigma;
    this.priceHistory = [preset.activePrice];
    this.initGenesisBlock();
  }

  // -----------------------------------------------------------------------
  // Mathematical Invariant Equations
  // -----------------------------------------------------------------------
  calculateVirtualReserves(price: number, L: number): [number, number] {
    const sqrtP = Math.sqrt(price);
    const xVirt = L / sqrtP;
    const yVirt = L * sqrtP;
    return [xVirt, yVirt];
  }

  calculateRealReserves(price: number, L: number, pA: number, pB: number): [number, number] {
    const sqrtPa = Math.sqrt(pA);
    const sqrtPb = Math.sqrt(pB);

    if (price <= pA) {
      const xReal = L * (1.0 / sqrtPa - 1.0 / sqrtPb);
      return [Math.max(0, xReal), 0];
    } else if (price >= pB) {
      const yReal = L * (sqrtPb - sqrtPa);
      return [0, Math.max(0, yReal)];
    } else {
      const sqrtP = Math.sqrt(price);
      const xReal = L * (1.0 / sqrtP - 1.0 / sqrtPb);
      const yReal = L * (sqrtP - sqrtPa);
      return [Math.max(0, xReal), Math.max(0, yReal)];
    }
  }

  static calculateAnalyticalImpermanentLoss(k: number): number {
    if (k <= 0) return -1.0;
    return (2.0 * Math.sqrt(k) / (1.0 + k)) - 1.0;
  }

  getCurrentImpermanentLoss(): number {
    if (this.entryPrice <= 0) return 0;
    const k = this.activePrice / this.entryPrice;
    return AmmSimulator.calculateAnalyticalImpermanentLoss(k);
  }

  static calculateCapitalEfficiency(pA: number, pB: number): number {
    if (pA <= 0 || pB <= pA) return 1.0;
    const ratio = Math.sqrt(pA / pB);
    if (ratio >= 1.0) return 1.0;
    return 1.0 / (1.0 - ratio);
  }

  calculateDynamicFeeBps(): number {
    const ratio = this.rollingSigma / Math.max(0.0001, this.config.baselineSigma);
    const fee = this.config.feeBaseBps * (1.0 + this.config.volatilityAlpha * ratio);
    return Math.max(5.0, Math.min(250.0, fee));
  }

  updateVolatility(newPrice: number) {
    this.priceHistory.push(newPrice);
    if (this.priceHistory.length > 50) {
      this.priceHistory.shift();
    }
    if (this.priceHistory.length >= 2) {
      const logReturns: number[] = [];
      for (let i = 1; i < this.priceHistory.length; i++) {
        const prev = this.priceHistory[i - 1];
        const curr = this.priceHistory[i];
        if (prev > 0 && curr > 0) {
          logReturns.push(Math.log(curr / prev));
        }
      }
      if (logReturns.length >= 2) {
        const mean = logReturns.reduce((acc, v) => acc + v, 0) / logReturns.length;
        const variance = logReturns.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (logReturns.length - 1);
        this.rollingSigma = Math.sqrt(variance);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Swap Execution Pipeline
  // -----------------------------------------------------------------------
  swapExactAForB(amountAIn: number): SwapExecution {
    if (amountAIn <= 0) throw new Error('Swap input must be strictly positive');

    const feeBps = this.calculateDynamicFeeBps();
    const feeRate = feeBps / 10000.0;
    const feeA = amountAIn * feeRate;
    const netAIn = amountAIn - feeA;

    const [xVirt, yVirt] = this.calculateVirtualReserves(this.activePrice, this.liquidityL);
    const invariantK = this.liquidityL * this.liquidityL;

    const xVirtNext = xVirt + netAIn;
    const yVirtNext = invariantK / xVirtNext;
    let amountBOut = yVirt - yVirtNext;

    let newPrice = yVirtNext / xVirtNext;
    let clampedToTick = false;
    if (newPrice < this.priceLower) {
      newPrice = this.priceLower;
      clampedToTick = true;
      const [, realBMax] = this.calculateRealReserves(this.activePrice, this.liquidityL, this.priceLower, this.priceUpper);
      amountBOut = Math.min(amountBOut, realBMax);
    }

    const oldPrice = this.activePrice;
    this.activePrice = newPrice;
    this.totalFeeAccrualA += feeA;
    this.totalVolumeUnits += amountAIn;
    this.swapCount += 1;
    this.updateVolatility(newPrice);

    const priceImpactBps = Math.abs((newPrice - oldPrice) / oldPrice) * 10000.0;

    const execution: SwapExecution = {
      swapType: 'EXACT_A_FOR_B',
      amountIn: amountAIn,
      amountOut: Math.max(0, amountBOut),
      feeDeducted: feeA,
      feeBps: feeBps,
      priceBefore: oldPrice,
      priceAfter: newPrice,
      priceImpactBps: priceImpactBps,
      clampedToTick: clampedToTick,
    };

    this.recordStateTransition('SWAP_EXACT_A_FOR_B', execution as unknown as Record<string, unknown>);
    return execution;
  }

  swapExactBForA(amountBIn: number): SwapExecution {
    if (amountBIn <= 0) throw new Error('Swap input must be strictly positive');

    const feeBps = this.calculateDynamicFeeBps();
    const feeRate = feeBps / 10000.0;
    const feeB = amountBIn * feeRate;
    const netBIn = amountBIn - feeB;

    const [xVirt, yVirt] = this.calculateVirtualReserves(this.activePrice, this.liquidityL);
    const invariantK = this.liquidityL * this.liquidityL;

    const yVirtNext = yVirt + netBIn;
    const xVirtNext = invariantK / yVirtNext;
    let amountAOut = xVirt - xVirtNext;

    let newPrice = yVirtNext / xVirtNext;
    let clampedToTick = false;
    if (newPrice > this.priceUpper) {
      newPrice = this.priceUpper;
      clampedToTick = true;
      const [realAMax] = this.calculateRealReserves(this.activePrice, this.liquidityL, this.priceLower, this.priceUpper);
      amountAOut = Math.min(amountAOut, realAMax);
    }

    const oldPrice = this.activePrice;
    this.activePrice = newPrice;
    this.totalFeeAccrualB += feeB;
    this.totalVolumeUnits += amountBIn;
    this.swapCount += 1;
    this.updateVolatility(newPrice);

    const priceImpactBps = Math.abs((newPrice - oldPrice) / oldPrice) * 10000.0;

    const execution: SwapExecution = {
      swapType: 'EXACT_B_FOR_A',
      amountIn: amountBIn,
      amountOut: Math.max(0, amountAOut),
      feeDeducted: feeB,
      feeBps: feeBps,
      priceBefore: oldPrice,
      priceAfter: newPrice,
      priceImpactBps: priceImpactBps,
      clampedToTick: clampedToTick,
    };

    this.recordStateTransition('SWAP_EXACT_B_FOR_A', execution as unknown as Record<string, unknown>);
    return execution;
  }

  setTickBounds(pLower: number, pUpper: number) {
    if (pLower <= 0 || pUpper <= pLower) return;
    const oldBounds = [this.priceLower, this.priceUpper];
    this.priceLower = pLower;
    this.priceUpper = pUpper;

    this.recordStateTransition('RANGE_REBALANCE', {
      oldLower: oldBounds[0],
      oldUpper: oldBounds[1],
      newLower: pLower,
      newUpper: pUpper,
      capitalEfficiency: AmmSimulator.calculateCapitalEfficiency(pLower, pUpper),
    });
  }

  simulateVolatilitySpike(multiplier: number = 2.5) {
    const oldSigma = this.rollingSigma;
    this.rollingSigma = this.rollingSigma * multiplier;
    this.recordStateTransition('VOLATILITY_ADJUST', {
      oldSigma: oldSigma,
      newSigma: this.rollingSigma,
      multiplier: multiplier,
      dynamicFeeBps: this.calculateDynamicFeeBps(),
    });
  }

  simulatePriceShift(targetPrice: number) {
    if (targetPrice <= 0) return;
    const oldPrice = this.activePrice;
    this.activePrice = targetPrice;
    this.updateVolatility(targetPrice);

    this.recordStateTransition('PRICE_SHIFT_ORACLE', {
      oldPrice: oldPrice,
      newPrice: targetPrice,
      divergenceRatio: targetPrice / this.entryPrice,
      impermanentLoss: this.getCurrentImpermanentLoss(),
    });
  }

  resetPool(presetKey?: string) {
    const key = presetKey || this.config.poolId;
    const preset = PRESET_POOLS[key] || PRESET_POOLS['SYNTH-POOL-01'];
    this.config = { ...preset };
    this.activePrice = preset.activePrice;
    this.entryPrice = preset.activePrice;
    this.priceLower = preset.priceLower;
    this.priceUpper = preset.priceUpper;
    this.liquidityL = preset.liquidityL;
    this.rollingSigma = preset.baselineSigma;
    this.totalFeeAccrualA = 0;
    this.totalFeeAccrualB = 0;
    this.totalVolumeUnits = 0;
    this.swapCount = 0;
    this.priceHistory = [preset.activePrice];
    this.ledger = [];
    this.initGenesisBlock();
  }

  // -----------------------------------------------------------------------
  // Cryptographic SHA-256 Ledger State Machine
  // -----------------------------------------------------------------------
  private computeStateHash(): string {
    const stateStr =
      'price=' + this.activePrice.toFixed(8) +
      ':pa=' + this.priceLower.toFixed(8) +
      ':pb=' + this.priceUpper.toFixed(8) +
      ':L=' + this.liquidityL.toFixed(4) +
      ':fee_a=' + this.totalFeeAccrualA.toFixed(6) +
      ':fee_b=' + this.totalFeeAccrualB.toFixed(6);
    return sha256(stateStr);
  }

  private initGenesisBlock() {
    const genesisPayload = {
      poolId: this.config.poolId,
      activePrice: this.activePrice,
      priceLower: this.priceLower,
      priceUpper: this.priceUpper,
      liquidityL: this.liquidityL,
    };
    const stateHash = this.computeStateHash();
    const prevHash = '0'.repeat(64);
    const serialized = JSON.stringify(genesisPayload);
    const blockContent = '0:0:GENESIS:' + serialized + ':' + stateHash + ':' + prevHash;
    const blockHash = sha256(blockContent);

    this.ledger = [
      {
        index: 0,
        timestampNs: 0,
        timestampIso: new Date().toISOString(),
        actionType: 'GENESIS',
        payload: genesisPayload,
        stateHash: stateHash,
        prevHash: prevHash,
        blockHash: blockHash,
      },
    ];
  }

  private recordStateTransition(actionType: string, payload: Record<string, unknown>): LedgerBlock {
    const index = this.ledger.length;
    const now = Date.now();
    const timestampNs = now * 1_000_000;
    const stateHash = this.computeStateHash();
    const prevHash = this.ledger[this.ledger.length - 1].blockHash;
    const serialized = JSON.stringify(payload);
    const blockContent = index + ':' + timestampNs + ':' + actionType + ':' + serialized + ':' + stateHash + ':' + prevHash;
    const blockHash = sha256(blockContent);

    const block: LedgerBlock = {
      index: index,
      timestampNs: timestampNs,
      timestampIso: new Date(now).toISOString(),
      actionType: actionType,
      payload: payload,
      stateHash: stateHash,
      prevHash: prevHash,
      blockHash: blockHash,
    };
    this.ledger.push(block);
    return block;
  }

  verifyLedgerIntegrity(): [boolean, number | null] {
    for (let i = 0; i < this.ledger.length; i++) {
      const block = this.ledger[i];
      const serialized = JSON.stringify(block.payload);
      const expectedContent = block.index + ':' + block.timestampNs + ':' + block.actionType + ':' + serialized + ':' + block.stateHash + ':' + block.prevHash;
      const recalcHash = sha256(expectedContent);

      if (block.blockHash !== recalcHash) {
        return [false, i];
      }

      if (i > 0) {
        const parent = this.ledger[i - 1];
        if (block.prevHash !== parent.blockHash) {
          return [false, i];
        }
      } else {
        if (block.prevHash !== '0'.repeat(64)) {
          return [false, 0];
        }
      }
    }
    return [true, null];
  }

  injectTamper(blockIndex: number) {
    if (blockIndex >= 0 && blockIndex < this.ledger.length) {
      this.ledger[blockIndex].payload = {
        ...this.ledger[blockIndex].payload,
        tamperedField: 'UNAUTHORIZED_MUTATION_FLAG',
        arbitraryValue: 999999,
      };
    }
  }

  getTelemetryState(): TelemetryState {
    const [realA, realB] = this.calculateRealReserves(this.activePrice, this.liquidityL, this.priceLower, this.priceUpper);
    const [virtA, virtB] = this.calculateVirtualReserves(this.activePrice, this.liquidityL);
    const k = this.activePrice / Math.max(0.0001, this.entryPrice);
    const ilRatio = AmmSimulator.calculateAnalyticalImpermanentLoss(k);
    const capEff = AmmSimulator.calculateCapitalEfficiency(this.priceLower, this.priceUpper);
    const feeBps = this.calculateDynamicFeeBps();

    const flatA = this.liquidityL / Math.sqrt(this.activePrice);
    const flatB = this.liquidityL * Math.sqrt(this.activePrice);

    const [isVerified] = this.verifyLedgerIntegrity();

    return {
      poolId: this.config.poolId,
      reserveAName: this.config.reserveAName,
      reserveBName: this.config.reserveBName,
      activePrice: this.activePrice,
      entryPrice: this.entryPrice,
      priceLower: this.priceLower,
      priceUpper: this.priceUpper,
      tickInRange: this.activePrice >= this.priceLower && this.activePrice <= this.priceUpper,
      realReserveA: realA,
      realReserveB: realB,
      virtualReserveA: virtA,
      virtualReserveB: virtB,
      liquidityL: this.liquidityL,
      dynamicFeeBps: feeBps,
      rollingSigma: this.rollingSigma,
      impermanentLossRatio: ilRatio,
      impermanentLossPct: ilRatio * 100.0,
      capitalEfficiencyMultiplier: capEff,
      constantProductRequiredA: flatA,
      constantProductRequiredB: flatB,
      totalFeeAccrualA: this.totalFeeAccrualA,
      totalFeeAccrualB: this.totalFeeAccrualB,
      totalVolumeUnits: this.totalVolumeUnits,
      swapCount: this.swapCount,
      ledgerHeight: this.ledger.length,
      ledgerIntegrityVerified: isVerified,
      ledgerHeadHash: this.ledger.length > 0 ? this.ledger[this.ledger.length - 1].blockHash : '',
    };
  }
}
