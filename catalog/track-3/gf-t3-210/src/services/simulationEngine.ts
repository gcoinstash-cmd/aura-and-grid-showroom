import {
  AuditBlock,
  DepthLevel,
  ExecutionFill,
  HawkesState,
  MicrostructureMetrics,
  OrderSide,
  SyntheticAssetPair,
  UserChildOrder
} from '../types/microstructure';
import { createBlock, verifyAuditChain } from '../utils/cryptoLedger';

interface InternalOrder {
  orderId: string;
  side: OrderSide;
  pricePts: number;
  quantityUnits: number;
  remainingUnits: number;
  isUserChildOrder: boolean;
  timestamp: number;
}

export class MicrostructureEngine {
  public assetPair: SyntheticAssetPair;
  private bids: Map<number, InternalOrder[]> = new Map();
  private asks: Map<number, InternalOrder[]> = new Map();
  private tradeHistory: ExecutionFill[] = [];
  private priceDeltas: { deltaP: number; volume: number }[] = [];
  
  // Hawkes point process parameters
  private hawkesMu = 1.5;
  private hawkesAlpha = 0.75;
  private hawkesBeta = 1.20;
  private hawkesEvents: number[] = [];
  private hawkesIntensityHistory: { timestamp: number; intensity: number }[] = [];

  // Cryptographic audit ledger
  private auditChain: AuditBlock[] = [];
  private isLedgerReady = false;

  // Active user child order
  public userOrder: UserChildOrder | null = null;
  public latencyJitterMs = 0;

  // Listeners
  private listeners: (() => void)[] = [];

  constructor(pair: SyntheticAssetPair = 'SYNTH-LOB-01 (CORE-LIQ / BASE-UNIT)') {
    this.assetPair = pair;
    this.initLedger();
    this.seedBook();
  }

  private async initLedger() {
    const genesis = await createBlock(
      0,
      'GENESIS_LOB_STATE',
      { assetPair: this.assetPair, tickSizePts: 0.05 },
      '0000000000000000000000000000000000000000000000000000000000000000'
    );
    this.auditChain = [genesis];
    this.isLedgerReady = true;
  }

  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  public setAssetPair(pair: SyntheticAssetPair) {
    this.assetPair = pair;
    this.bids.clear();
    this.asks.clear();
    this.tradeHistory = [];
    this.priceDeltas = [];
    this.hawkesEvents = [];
    this.hawkesIntensityHistory = [];
    this.userOrder = null;
    this.seedBook();
    this.recordLedgerEvent('ASSET_PAIR_SWITCHED', { assetPair: pair });
    this.notify();
  }

  private seedBook() {
    let basePrice = 100.00;
    let tickSize = 0.05;

    if (this.assetPair === 'FAST-BOOK-ALPHA (HIGH-FREQ-INDEX / BENCH)') {
      basePrice = 250.00;
      tickSize = 0.10;
    } else if (this.assetPair === 'CROSS-VENUE-DELTA (INSTITUTIONAL-SPREAD)') {
      basePrice = 42.50;
      tickSize = 0.02;
    }

    const now = Date.now();
    for (let i = 1; i <= 15; i++) {
      const bidPrice = Number((basePrice - i * tickSize).toFixed(2));
      const bidUnits = Math.floor(2000 + Math.random() * 8000);
      const ordersCount = Math.floor(2 + Math.random() * 4);
      const orders: InternalOrder[] = [];
      const perOrder = Math.floor(bidUnits / ordersCount);

      for (let o = 0; o < ordersCount; o++) {
        orders.push({
          orderId: 'SEED-B-' + i + '-' + o,
          side: 'BUY',
          pricePts: bidPrice,
          quantityUnits: perOrder,
          remainingUnits: perOrder,
          isUserChildOrder: false,
          timestamp: now - (ordersCount - o) * 100
        });
      }
      this.bids.set(bidPrice, orders);

      const askPrice = Number((basePrice + i * tickSize).toFixed(2));
      const askUnits = Math.floor(2000 + Math.random() * 8000);
      const askOrdersCount = Math.floor(2 + Math.random() * 4);
      const askOrders: InternalOrder[] = [];
      const askPerOrder = Math.floor(askUnits / askOrdersCount);

      for (let o = 0; o < askOrdersCount; o++) {
        askOrders.push({
          orderId: 'SEED-A-' + i + '-' + o,
          side: 'SELL',
          pricePts: askPrice,
          quantityUnits: askPerOrder,
          remainingUnits: askPerOrder,
          isUserChildOrder: false,
          timestamp: now - (askOrdersCount - o) * 100
        });
      }
      this.asks.set(askPrice, askOrders);
    }
  }

  public getBestBid(): number | null {
    if (this.bids.size === 0) return null;
    return Math.max(...Array.from(this.bids.keys()));
  }

  public getBestAsk(): number | null {
    if (this.asks.size === 0) return null;
    return Math.min(...Array.from(this.asks.keys()));
  }

  public getMidPrice(): number {
    const bb = this.getBestBid();
    const ba = this.getBestAsk();
    if (bb === null && ba === null) return 100.0;
    if (bb === null) return ba!;
    if (ba === null) return bb;
    return Number(((bb + ba) / 2).toFixed(4));
  }

  public getSpreadPts(): number {
    const bb = this.getBestBid();
    const ba = this.getBestAsk();
    if (bb === null || ba === null) return 0.0;
    return Number(Math.max(0, ba - bb).toFixed(4));
  }

  public getSpreadBps(): number {
    const mid = this.getMidPrice();
    if (mid <= 0) return 0;
    return Number(((this.getSpreadPts() / mid) * 10000).toFixed(2));
  }

  public getDepthSnapshot(limit = 12): { bids: DepthLevel[]; asks: DepthLevel[] } {
    const sortedBidPrices = Array.from(this.bids.keys()).sort((a, b) => b - a).slice(0, limit);
    let cumBids = 0;
    const bids: DepthLevel[] = sortedBidPrices.map(price => {
      const orders = this.bids.get(price) || [];
      const totalUnits = orders.reduce((sum, o) => sum + o.remainingUnits, 0);
      cumBids += totalUnits;
      return {
        pricePts: price,
        units: totalUnits,
        cumulativeUnits: cumBids,
        orderCount: orders.length
      };
    });

    const sortedAskPrices = Array.from(this.asks.keys()).sort((a, b) => a - b).slice(0, limit);
    let cumAsks = 0;
    const asks: DepthLevel[] = sortedAskPrices.map(price => {
      const orders = this.asks.get(price) || [];
      const totalUnits = orders.reduce((sum, o) => sum + o.remainingUnits, 0);
      cumAsks += totalUnits;
      return {
        pricePts: price,
        units: totalUnits,
        cumulativeUnits: cumAsks,
        orderCount: orders.length
      };
    });

    return { bids, asks };
  }

  public getMetrics(): MicrostructureMetrics {
    const midPricePts = this.getMidPrice();
    const spreadPts = this.getSpreadPts();
    const spreadBps = this.getSpreadBps();
    const bestBidPts = this.getBestBid() ?? midPricePts - 0.025;
    const bestAskPts = this.getBestAsk() ?? midPricePts + 0.025;

    // Order Book Imbalance (OBI) across top 5 levels
    let bidVol = 0;
    let askVol = 0;
    const sortedBids = Array.from(this.bids.keys()).sort((a, b) => b - a).slice(0, 5);
    for (const p of sortedBids) {
      bidVol += (this.bids.get(p) || []).reduce((s, o) => s + o.remainingUnits, 0);
    }
    const sortedAsks = Array.from(this.asks.keys()).sort((a, b) => a - b).slice(0, 5);
    for (const p of sortedAsks) {
      askVol += (this.asks.get(p) || []).reduce((s, o) => s + o.remainingUnits, 0);
    }
    const denom = bidVol + askVol;
    const orderBookImbalance = denom > 0 ? Number(((bidVol - askVol) / denom).toFixed(4)) : 0;

    // Kyle's Lambda (pts / kUnits permanent impact)
    let kylesLambda = 0.00185;
    if (this.priceDeltas.length >= 5) {
      const n = this.priceDeltas.length;
      let sumQ = 0;
      let sumDP = 0;
      let sumQSq = 0;
      let sumQDP = 0;
      for (const item of this.priceDeltas) {
        const qK = item.volume / 1000;
        sumQ += qK;
        sumDP += item.deltaP;
        sumQSq += qK * qK;
        sumQDP += qK * item.deltaP;
      }
      const regDenom = n * sumQSq - sumQ * sumQ;
      if (Math.abs(regDenom) > 1e-6) {
        const slope = (n * sumQDP - sumQ * sumDP) / regDenom;
        kylesLambda = Number(Math.max(0.0001, Math.abs(slope)).toFixed(6));
      }
    }

    // Amihud Illiquidity Ratio
    let amihudRatio = 0.00012;
    if (this.priceDeltas.length > 0) {
      const sumDeltaP = this.priceDeltas.reduce((s, d) => s + Math.abs(d.deltaP), 0);
      const sumVol = this.priceDeltas.reduce((s, d) => s + d.volume, 0);
      if (sumVol > 0) {
        amihudRatio = Number(((sumDeltaP / sumVol) * 1000).toFixed(6));
      }
    }

    // VWAP
    let vwapPts = midPricePts;
    if (this.tradeHistory.length > 0) {
      let sumPV = 0;
      let sumV = 0;
      for (const t of this.tradeHistory.slice(0, 50)) {
        sumPV += t.pricePts * t.units;
        sumV += t.units;
      }
      if (sumV > 0) {
        vwapPts = Number((sumPV / sumV).toFixed(4));
      }
    }

    const totalTradedUnits = this.tradeHistory.reduce((s, t) => s + t.units, 0);

    return {
      midPricePts,
      spreadPts,
      spreadBps,
      bestBidPts,
      bestAskPts,
      orderBookImbalance,
      kylesLambda,
      amihudRatio,
      vwapPts,
      totalTradedUnits,
      executionCount: this.tradeHistory.length
    };
  }

  public getHawkesState(): HawkesState {
    const now = Date.now() / 1000;
    let intensity = this.hawkesMu;
    const cutoff = now - 8 / this.hawkesBeta;
    for (let i = this.hawkesEvents.length - 1; i >= 0; i--) {
      const et = this.hawkesEvents[i];
      if (et < cutoff) break;
      const dt = now - et;
      if (dt >= 0) {
        intensity += this.hawkesAlpha * Math.exp(-this.hawkesBeta * dt);
      }
    }

    return {
      mu: this.hawkesMu,
      alpha: this.hawkesAlpha,
      beta: this.hawkesBeta,
      currentIntensity: Number(intensity.toFixed(4)),
      branchingRatio: Number((this.hawkesAlpha / this.hawkesBeta).toFixed(4)),
      history: this.hawkesIntensityHistory.slice(-40)
    };
  }

  public getTradeTape(): ExecutionFill[] {
    return this.tradeHistory.slice(0, 30);
  }

  public getAuditChain(): AuditBlock[] {
    return this.auditChain.slice(-30);
  }

  public async verifyLedger(): Promise<{ valid: boolean; errorIndex?: number; reason?: string }> {
    return verifyAuditChain(this.auditChain);
  }

  public async tamperLedgerBlock(indexToTamper: number): Promise<void> {
    const block = this.auditChain.find(b => b.index === indexToTamper);
    if (block) {
      block.payload = { ...block.payload, TAMPERED_INJECTED_VALUE: 9999999 };
      this.notify();
    }
  }

  private async recordLedgerEvent(eventType: string, payload: Record<string, unknown>) {
    if (!this.isLedgerReady || this.auditChain.length === 0) return;
    const prevBlock = this.auditChain[this.auditChain.length - 1];
    const newBlock = await createBlock(
      this.auditChain.length,
      eventType,
      payload,
      prevBlock.hash
    );
    this.auditChain.push(newBlock);
    if (this.auditChain.length > 200) {
      this.auditChain.shift();
    }
  }

  // Submit User Child Limit Order
  public placeUserChildOrder(side: OrderSide, pricePts: number, quantityUnits: number): string {
    const orderId = 'CHILD-ORD-' + Date.now().toString().slice(-6);
    const normalizedPrice = Number(pricePts.toFixed(2));
    const now = Date.now();

    const order: InternalOrder = {
      orderId,
      side,
      pricePts: normalizedPrice,
      quantityUnits,
      remainingUnits: quantityUnits,
      isUserChildOrder: true,
      timestamp: now
    };

    const book = side === 'BUY' ? this.bids : this.asks;
    if (!book.has(normalizedPrice)) {
      book.set(normalizedPrice, []);
    }
    const levelOrders = book.get(normalizedPrice)!;

    // Calculate units ahead at this moment
    let unitsAhead = 0;
    for (const o of levelOrders) {
      unitsAhead += o.remainingUnits;
    }

    levelOrders.push(order);

    this.userOrder = {
      orderId,
      side,
      pricePts: normalizedPrice,
      quantityUnits,
      filledUnits: 0,
      remainingUnits: quantityUnits,
      status: 'RESTING',
      submittedAt: now,
      queueIndex: levelOrders.length,
      totalOrdersAtLevel: levelOrders.length,
      unitsAhead,
      initialUnitsAhead: unitsAhead,
      estimatedFillProbability: this.computeFillProbability(side, normalizedPrice, unitsAhead)
    };

    this.recordLedgerEvent('USER_CHILD_ORDER_SUBMITTED', {
      orderId,
      side,
      pricePts: normalizedPrice,
      quantityUnits,
      unitsAhead
    });

    this.notify();
    return orderId;
  }

  public cancelUserChildOrder(): boolean {
    if (!this.userOrder || this.userOrder.status !== 'RESTING') return false;
    const { orderId, side, pricePts } = this.userOrder;
    const book = side === 'BUY' ? this.bids : this.asks;
    if (book.has(pricePts)) {
      const orders = book.get(pricePts)!;
      const filtered = orders.filter(o => o.orderId !== orderId);
      if (filtered.length === 0) {
        book.delete(pricePts);
      } else {
        book.set(pricePts, filtered);
      }
    }

    this.userOrder.status = 'CANCELLED';
    this.recordLedgerEvent('USER_CHILD_ORDER_CANCELLED', { orderId, pricePts });
    this.notify();
    return true;
  }

  private computeFillProbability(side: OrderSide, price: number, unitsAhead: number): number {
    const touch = side === 'BUY' ? this.getBestBid() : this.getBestAsk();
    const tickDist = touch !== null ? Math.abs(price - touch) : 0;
    const distFactor = Math.exp(-0.25 * (tickDist / 0.05));
    const queueFactor = 1.0 / (1.0 + unitsAhead / 8000.0);
    return Number(Math.min(0.99, Math.max(0.02, distFactor * queueFactor)).toFixed(4));
  }

  // Simulation tick (called on an interval)
  public executeSimulationStep() {
    const nowSec = Date.now() / 1000;
    const oldMid = this.getMidPrice();

    // 1. Update Hawkes intensity record
    const hState = this.getHawkesState();
    this.hawkesIntensityHistory.push({
      timestamp: Date.now(),
      intensity: hState.currentIntensity
    });
    if (this.hawkesIntensityHistory.length > 50) {
      this.hawkesIntensityHistory.shift();
    }

    // 2. Probabilistic trade arrival driven by current Hawkes intensity
    // Probability of an event this tick: 1 - exp(-intensity * dt)
    const dt = 0.25; // 250ms
    const eventProb = 1 - Math.exp(-hState.currentIntensity * dt);

    if (Math.random() < eventProb) {
      this.hawkesEvents.push(nowSec);
      if (this.hawkesEvents.length > 100) this.hawkesEvents.shift();

      // Trigger a market execution
      const side: OrderSide = Math.random() > 0.48 ? 'BUY' : 'SELL';
      const volume = Math.floor(500 + Math.random() * 4500);
      this.executeMarketOrder(side, volume);
    }

    // 3. Maker replenish to maintain book liquidity
    this.replenishBook();

    // 4. Update user child order position
    this.updateUserOrderPosition();

    // 5. Track permanent price impact
    const newMid = this.getMidPrice();
    const deltaMid = newMid - oldMid;
    if (Math.abs(deltaMid) > 1e-6) {
      this.priceDeltas.push({ deltaP: deltaMid, volume: 2500 });
      if (this.priceDeltas.length > 80) this.priceDeltas.shift();
    }

    this.notify();
  }

  private executeMarketOrder(side: OrderSide, totalVolume: number) {
    const oppositeBook = side === 'BUY' ? this.asks : this.bids;
    let remainingToFill = totalVolume;
    const sortedPrices = Array.from(oppositeBook.keys()).sort((a, b) => side === 'BUY' ? a - b : b - a);
    const fills: ExecutionFill[] = [];
    const now = Date.now();

    for (const p of sortedPrices) {
      if (remainingToFill <= 0) break;
      const levelOrders = oppositeBook.get(p)!;
      let orderIdx = 0;

      while (orderIdx < levelOrders.length && remainingToFill > 0) {
        const maker = levelOrders[orderIdx];
        const matchQty = Math.min(maker.remainingUnits, remainingToFill);
        maker.remainingUnits -= matchQty;
        remainingToFill -= matchQty;

        const fill: ExecutionFill = {
          fillId: 'FILL-' + now.toString().slice(-6) + '-' + Math.floor(Math.random() * 900 + 100),
          makerOrderId: maker.orderId,
          takerOrderId: 'TAKER-' + now.toString().slice(-4),
          side,
          pricePts: p,
          units: matchQty,
          timestamp: now,
          priceImpactPts: side === 'BUY' ? 0.05 : -0.05
        };
        fills.push(fill);
        this.tradeHistory.unshift(fill);

        // Check if user order was executed
        if (maker.isUserChildOrder && this.userOrder) {
          this.userOrder.filledUnits += matchQty;
          this.userOrder.remainingUnits = maker.remainingUnits;
          if (this.userOrder.remainingUnits <= 0) {
            this.userOrder.status = 'FILLED';
            this.recordLedgerEvent('USER_CHILD_ORDER_COMPLETELY_FILLED', {
              orderId: this.userOrder.orderId,
              filledUnits: this.userOrder.quantityUnits,
              pricePts: p
            });
          } else {
            this.userOrder.status = 'PARTIAL';
          }
        }

        if (maker.remainingUnits <= 0) {
          levelOrders.splice(orderIdx, 1);
        } else {
          orderIdx++;
        }
      }

      if (levelOrders.length === 0) {
        oppositeBook.delete(p);
      }
    }

    if (fills.length > 0) {
      this.recordLedgerEvent('MARKET_EXECUTION_MATCHED', {
        takerSide: side,
        totalUnits: totalVolume - remainingToFill,
        fillsCount: fills.length
      });
    }
  }

  private replenishBook() {
    const mid = this.getMidPrice();
    const tickSize = this.assetPair === 'FAST-BOOK-ALPHA (HIGH-FREQ-INDEX / BENCH)' ? 0.10 : 0.05;

    // Check if bids need replenishment
    if (this.bids.size < 12) {
      const lowestBid = Math.min(...Array.from(this.bids.keys()));
      const newPrice = Number((lowestBid - tickSize).toFixed(2));
      if (!this.bids.has(newPrice)) {
        const qty = Math.floor(1500 + Math.random() * 5000);
        this.bids.set(newPrice, [{
          orderId: 'REPL-B-' + Date.now().toString().slice(-4),
          side: 'BUY',
          pricePts: newPrice,
          quantityUnits: qty,
          remainingUnits: qty,
          isUserChildOrder: false,
          timestamp: Date.now()
        }]);
      }
    }

    // Check if asks need replenishment
    if (this.asks.size < 12) {
      const highestAsk = Math.max(...Array.from(this.asks.keys()));
      const newPrice = Number((highestAsk + tickSize).toFixed(2));
      if (!this.asks.has(newPrice)) {
        const qty = Math.floor(1500 + Math.random() * 5000);
        this.asks.set(newPrice, [{
          orderId: 'REPL-A-' + Date.now().toString().slice(-4),
          side: 'SELL',
          pricePts: newPrice,
          quantityUnits: qty,
          remainingUnits: qty,
          isUserChildOrder: false,
          timestamp: Date.now()
        }]);
      }
    }
  }

  private updateUserOrderPosition() {
    if (!this.userOrder || this.userOrder.status === 'FILLED' || this.userOrder.status === 'CANCELLED') {
      return;
    }

    const { orderId, side, pricePts } = this.userOrder;
    const book = side === 'BUY' ? this.bids : this.asks;

    if (!book.has(pricePts)) {
      // If price level no longer exists and order not filled, set filled if remaining is 0
      if (this.userOrder.remainingUnits <= 0) {
        this.userOrder.status = 'FILLED';
      }
      return;
    }

    const orders = book.get(pricePts)!;
    let unitsAhead = 0;
    let found = false;
    let index = 1;

    for (const o of orders) {
      if (o.orderId === orderId) {
        found = true;
        break;
      }
      unitsAhead += o.remainingUnits;
      index++;
    }

    if (found) {
      this.userOrder.queueIndex = index;
      this.userOrder.totalOrdersAtLevel = orders.length;
      this.userOrder.unitsAhead = unitsAhead;
      this.userOrder.estimatedFillProbability = this.computeFillProbability(side, pricePts, unitsAhead);
    }
  }

  // Interactive Stress Injector 1: Inject Cancel Wave
  public injectCancelWave(fraction = 0.60): number {
    let cancelled = 0;
    const sortedBids = Array.from(this.bids.keys()).sort((a, b) => b - a).slice(0, 3);
    for (const p of sortedBids) {
      const orders = this.bids.get(p)!;
      const victimCount = Math.max(1, Math.ceil(orders.length * fraction));
      for (let i = 0; i < victimCount && orders.length > 0; i++) {
        const victim = orders[orders.length - 1];
        if (!victim.isUserChildOrder) {
          orders.pop();
          cancelled++;
        }
      }
      if (orders.length === 0) this.bids.delete(p);
    }

    const sortedAsks = Array.from(this.asks.keys()).sort((a, b) => a - b).slice(0, 3);
    for (const p of sortedAsks) {
      const orders = this.asks.get(p)!;
      const victimCount = Math.max(1, Math.ceil(orders.length * fraction));
      for (let i = 0; i < victimCount && orders.length > 0; i++) {
        const victim = orders[orders.length - 1];
        if (!victim.isUserChildOrder) {
          orders.pop();
          cancelled++;
        }
      }
      if (orders.length === 0) this.asks.delete(p);
    }

    this.recordLedgerEvent('STRESS_CANCEL_WAVE_INJECTED', {
      cancelledOrders: cancelled,
      fraction,
      timestamp: Date.now()
    });
    this.notify();
    return cancelled;
  }

  // Interactive Stress Injector 2: Trigger Flash Sweep (50,000 Units)
  public triggerFlashSweep(side: OrderSide = 'BUY', units = 50000): void {
    this.hawkesEvents.push(Date.now() / 1000);
    this.hawkesEvents.push(Date.now() / 1000 + 0.05);
    this.hawkesEvents.push(Date.now() / 1000 + 0.10);
    this.executeMarketOrder(side, units);
    this.recordLedgerEvent('STRESS_FLASH_SWEEP_TRIGGERED', {
      side,
      units,
      timestamp: Date.now()
    });
    this.notify();
  }

  // Interactive Stress Injector 3: Simulate Latency Spike
  public triggerLatencySpike(jitterMs = 250): void {
    this.latencyJitterMs = jitterMs;
    setTimeout(() => {
      this.latencyJitterMs = 0;
      this.notify();
    }, 3000);
    this.notify();
  }
}

export const engineInstance = new MicrostructureEngine();
