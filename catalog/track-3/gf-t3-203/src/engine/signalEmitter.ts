/**
 * Trade Signal Emitter & Portfolio Position Tracker
 * Permissive MIT Clean-Room Implementation
 *
 * Implements finite state machine for statistical arbitrage:
 *   - ENTER_LONG_SPREAD  (Z <= -2.0, Asset Y undervalued)
 *   - ENTER_SHORT_SPREAD (Z >= +2.0, Asset Y overvalued)
 *   - EXIT_NEUTRAL       (Reversion to mean within +/- 0.5 Z)
 *   - STOP_OUT           (|Z| >= 3.5 structural divergence)
 */

import {
  ClosedTrade,
  EngineHyperparameters,
  PositionState,
  TradeSignalType,
} from './types';

export class SignalEmitter {
  private position: PositionState;
  private closedTrades: ClosedTrade[] = [];
  private params: EngineHyperparameters;

  constructor(params?: Partial<EngineHyperparameters>) {
    this.params = {
      observationVarianceR: 1e-3,
      processVarianceQ: 1e-5,
      welfordWindowSize: 50,
      zScoreEntryThreshold: 2.0,
      zScoreExitThreshold: 0.5,
      zScoreStopThreshold: 3.5,
      ouWindowSize: 60,
      ...params,
    };

    this.position = {
      active: false,
      side: 'FLAT',
      entryPriceY: 0,
      entryPriceX: 0,
      entryBeta: 1.0,
      entrySpread: 0,
      entryTimestamp: 0,
      entryZScore: 0,
      unrealizedPnL: 0,
      unrealizedReturnPct: 0,
    };
  }

  /**
   * Evaluates current Z-Score and spread to emit signals and update active portfolio.
   */
  public evaluate(
    timestamp: number,
    priceY: number,
    priceX: number,
    currentBeta: number,
    currentSpread: number,
    zScore: number
  ): { signal: TradeSignalType; reason: string; closedTrade?: ClosedTrade } {
    const { zScoreEntryThreshold, zScoreExitThreshold, zScoreStopThreshold } = this.params;

    let signal: TradeSignalType = 'NONE';
    let reason = 'Holding neutral monitoring state';
    let closedTrade: ClosedTrade | undefined;

    // 1. Evaluate Active Position Management
    if (this.position.active) {
      const entryBeta = this.position.entryBeta;
      // Mark-to-market spread based on entry beta
      const currentHedgedSpread = priceY - entryBeta * priceX;
      const spreadDelta = currentHedgedSpread - this.position.entrySpread;

      // Calculate PnL: Long spread gains when spread rises; Short spread gains when spread falls
      let rawPnL = 0;
      if (this.position.side === 'LONG_SPREAD') {
        rawPnL = spreadDelta;
      } else {
        rawPnL = -spreadDelta;
      }

      const notionalCapital = this.position.entryPriceY + Math.abs(entryBeta) * this.position.entryPriceX;
      const returnPct = notionalCapital > 0 ? (rawPnL / notionalCapital) * 100 : 0;

      this.position.unrealizedPnL = rawPnL;
      this.position.unrealizedReturnPct = returnPct;

      // Check Stop-Out Condition (|Z| >= stopThreshold)
      if (Math.abs(zScore) >= zScoreStopThreshold) {
        signal = 'STOP_OUT';
        reason = `Stop-Out triggered: |Z-Score| ${Math.abs(zScore).toFixed(2)} exceeded tolerance ${zScoreStopThreshold}`;
        closedTrade = this.closePosition(timestamp, priceY, priceX, currentSpread, signal);
      }
      // Check Exit Neutral Condition for Long Spread
      else if (this.position.side === 'LONG_SPREAD' && zScore >= -zScoreExitThreshold) {
        signal = 'EXIT_NEUTRAL';
        reason = `Mean reversion realized: Z-Score ${zScore.toFixed(2)} converged past -${zScoreExitThreshold}`;
        closedTrade = this.closePosition(timestamp, priceY, priceX, currentSpread, signal);
      }
      // Check Exit Neutral Condition for Short Spread
      else if (this.position.side === 'SHORT_SPREAD' && zScore <= zScoreExitThreshold) {
        signal = 'EXIT_NEUTRAL';
        reason = `Mean reversion realized: Z-Score ${zScore.toFixed(2)} converged past +${zScoreExitThreshold}`;
        closedTrade = this.closePosition(timestamp, priceY, priceX, currentSpread, signal);
      }
    } else {
      // 2. Position is Flat: Check Entry Conditions
      if (zScore <= -zScoreEntryThreshold) {
        signal = 'ENTER_LONG_SPREAD';
        reason = `Entry Signal: Z-Score ${zScore.toFixed(2)} <= -${zScoreEntryThreshold}. Asset Y is statistically undervalued.`;
        this.openPosition(timestamp, 'LONG_SPREAD', priceY, priceX, currentBeta, currentSpread, zScore);
      } else if (zScore >= zScoreEntryThreshold) {
        signal = 'ENTER_SHORT_SPREAD';
        reason = `Entry Signal: Z-Score ${zScore.toFixed(2)} >= +${zScoreEntryThreshold}. Asset Y is statistically overvalued.`;
        this.openPosition(timestamp, 'SHORT_SPREAD', priceY, priceX, currentBeta, currentSpread, zScore);
      }
    }

    return { signal, reason, closedTrade };
  }

  private openPosition(
    timestamp: number,
    side: 'LONG_SPREAD' | 'SHORT_SPREAD',
    priceY: number,
    priceX: number,
    beta: number,
    spread: number,
    zScore: number
  ): void {
    this.position = {
      active: true,
      side,
      entryPriceY: priceY,
      entryPriceX: priceX,
      entryBeta: beta,
      entrySpread: spread,
      entryTimestamp: timestamp,
      entryZScore: zScore,
      unrealizedPnL: 0,
      unrealizedReturnPct: 0,
    };
  }

  private closePosition(
    timestamp: number,
    priceY: number,
    priceX: number,
    exitSpread: number,
    exitReason: TradeSignalType
  ): ClosedTrade {
    const trade: ClosedTrade = {
      id: `TRD-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase(),
      side: this.position.side as 'LONG_SPREAD' | 'SHORT_SPREAD',
      entryTime: this.position.entryTimestamp,
      exitTime: timestamp,
      entryPriceY: this.position.entryPriceY,
      entryPriceX: this.position.entryPriceX,
      exitPriceY: priceY,
      exitPriceX: priceX,
      hedgeRatio: this.position.entryBeta,
      entrySpread: this.position.entrySpread,
      exitSpread,
      realizedPnL: this.position.unrealizedPnL,
      returnPct: this.position.unrealizedReturnPct,
      exitReason,
    };

    this.closedTrades.unshift(trade);
    if (this.closedTrades.length > 50) {
      this.closedTrades.pop();
    }

    this.position = {
      active: false,
      side: 'FLAT',
      entryPriceY: 0,
      entryPriceX: 0,
      entryBeta: 1.0,
      entrySpread: 0,
      entryTimestamp: 0,
      entryZScore: 0,
      unrealizedPnL: 0,
      unrealizedReturnPct: 0,
    };

    return trade;
  }

  public getPosition(): PositionState {
    return { ...this.position };
  }

  public getClosedTrades(): ClosedTrade[] {
    return [...this.closedTrades];
  }

  public updateParameters(params: Partial<EngineHyperparameters>): void {
    this.params = { ...this.params, ...params };
  }

  public reset(): void {
    this.position = {
      active: false,
      side: 'FLAT',
      entryPriceY: 0,
      entryPriceX: 0,
      entryBeta: 1.0,
      entrySpread: 0,
      entryTimestamp: 0,
      entryZScore: 0,
      unrealizedPnL: 0,
      unrealizedReturnPct: 0,
    };
    this.closedTrades = [];
  }
}
