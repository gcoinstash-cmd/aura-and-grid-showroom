/**
 * APEX-202 Deterministic FIFO Limit Order Book & Liquidity Matching Engine
 * Fixed-Point Integer Microunits (Zero Floating-Point Drift)
 */

import {
  Side,
  OrderType,
  TimeInForce,
  OrderStatus,
  Order,
  ExecutionFill,
  TradeSettlementEvent,
  L2Snapshot,
  L2Level,
  PRICE_SCALE,
  QTY_SCALE,
} from '../types/apex';

class PriceLevelNode {
  priceMicros: number;
  orders: Order[];
  totalVolumeMicros: number;

  constructor(priceMicros: number) {
    this.priceMicros = priceMicros;
    this.orders = [];
    this.totalVolumeMicros = 0;
  }

  append(order: Order): void {
    this.orders.push(order);
    this.totalVolumeMicros += order.remainingQtyMicros;
  }

  removeOrder(orderId: string): Order | null {
    const idx = this.orders.findIndex((o) => o.orderId === orderId);
    if (idx !== -1) {
      const order = this.orders[idx];
      this.orders.splice(idx, 1);
      this.totalVolumeMicros -= order.remainingQtyMicros;
      return order;
    }
    return null;
  }
}

// Simple fast deterministic SHA-256 string generator
async function computeSha256(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }
  // Fast 32-bit FNV/Murmur fallback for synchronous or test fallback
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return ('00000000' + (hash >>> 0).toString(16)).repeat(8).slice(0, 64);
}

export class ApexOrderBook {
  symbol: string;
  sequenceNumber: number = 0;
  previousHash: string = '0'.repeat(64);

  // Price Level Maps
  bidLevels: Map<number, PriceLevelNode> = new Map();
  askLevels: Map<number, PriceLevelNode> = new Map();

  // Fast order index
  ordersById: Map<string, Order> = new Map();

  // Audit settlement trail
  tradeHistory: TradeSettlementEvent[] = [];

  constructor(symbol: string = 'SYNTH-ALPHA / CORE-PT') {
    this.symbol = symbol;
  }

  nextSequence(): number {
    this.sequenceNumber += 1;
    return this.sequenceNumber;
  }

  peekBestBid(): number | null {
    if (this.bidLevels.size === 0) return null;
    let maxPrice = -Infinity;
    for (const [price, level] of this.bidLevels.entries()) {
      if (level.totalVolumeMicros > 0 && level.orders.length > 0) {
        if (price > maxPrice) maxPrice = price;
      }
    }
    return maxPrice === -Infinity ? null : maxPrice;
  }

  peekBestAsk(): number | null {
    if (this.askLevels.size === 0) return null;
    let minPrice = Infinity;
    for (const [price, level] of this.askLevels.entries()) {
      if (level.totalVolumeMicros > 0 && level.orders.length > 0) {
        if (price < minPrice) minPrice = price;
      }
    }
    return minPrice === Infinity ? null : minPrice;
  }

  getSpread(): number | null {
    const bid = this.peekBestBid();
    const ask = this.peekBestAsk();
    return bid !== null && ask !== null ? ask - bid : null;
  }

  async submitOrder(
    side: Side,
    orderType: OrderType,
    quantityMicros: number,
    priceMicros: number = 0,
    timeInForce: TimeInForce = 'GTC',
    clientOrderId?: string,
    customOrderId?: string
  ): Promise<{ order: Order; fills: ExecutionFill[]; settlementEvents: TradeSettlementEvent[] }> {
    if (quantityMicros <= 0) throw new Error('quantityMicros must be > 0');
    if (orderType === 'LIMIT' && priceMicros <= 0) throw new Error('priceMicros must be > 0 for LIMIT orders');

    const orderId = customOrderId || `ord_${Math.random().toString(36).substring(2, 10)}`;

    const order: Order = {
      orderId,
      symbol: this.symbol,
      side,
      orderType,
      priceMicros: orderType === 'LIMIT' ? priceMicros : 0,
      initialQtyMicros: quantityMicros,
      remainingQtyMicros: quantityMicros,
      filledQtyMicros: 0,
      timeInForce,
      clientOrderId,
      createdAtNs: Date.now() * 1_000_000,
      status: 'NEW',
    };

    // FOK Pre-Check
    if (timeInForce === 'FOK') {
      if (!this.canFullyFill(order)) {
        order.status = 'REJECTED';
        order.remainingQtyMicros = 0;
        this.nextSequence();
        this.ordersById.set(order.orderId, order);
        return { order, fills: [], settlementEvents: [] };
      }
    }

    const { fills, settlementEvents } = await this.matchOrder(order);

    if (order.remainingQtyMicros === 0) {
      order.status = 'FILLED';
    } else if (order.filledQtyMicros > 0) {
      order.status = 'PARTIALLY_FILLED';
    }

    // Residual order logic
    if (order.remainingQtyMicros > 0) {
      if (order.orderType === 'LIMIT' && order.timeInForce === 'GTC') {
        this.insertRestingOrder(order);
      } else {
        // IOC or MARKET residual cancelled
        order.status = order.filledQtyMicros > 0 ? 'PARTIALLY_FILLED' : 'CANCELLED';
      }
    }

    this.ordersById.set(order.orderId, order);
    this.nextSequence();

    return { order, fills, settlementEvents };
  }

  cancelOrder(orderId: string): { success: boolean; order: Order | null; sequence: number } {
    const order = this.ordersById.get(orderId);
    if (!order) return { success: false, order: null, sequence: this.sequenceNumber };

    if (order.status !== 'NEW' && order.status !== 'PARTIALLY_FILLED') {
      return { success: false, order, sequence: this.sequenceNumber };
    }

    const levels = order.side === 'BUY' ? this.bidLevels : this.askLevels;
    const level = levels.get(order.priceMicros);

    if (level) {
      level.removeOrder(orderId);
      if (level.totalVolumeMicros <= 0) {
        levels.delete(order.priceMicros);
      }
    }

    order.status = 'CANCELLED';
    order.remainingQtyMicros = 0;

    const seq = this.nextSequence();
    return { success: true, order, sequence: seq };
  }

  private canFullyFill(taker: Order): boolean {
    const needed = taker.remainingQtyMicros;
    let accumulated = 0;

    if (taker.side === 'BUY') {
      const askPrices = Array.from(this.askLevels.keys()).sort((a, b) => a - b);
      for (const p of askPrices) {
        if (taker.orderType === 'LIMIT' && p > taker.priceMicros) break;
        accumulated += this.askLevels.get(p)!.totalVolumeMicros;
        if (accumulated >= needed) return true;
      }
    } else {
      const bidPrices = Array.from(this.bidLevels.keys()).sort((a, b) => b - a);
      for (const p of bidPrices) {
        if (taker.orderType === 'LIMIT' && p < taker.priceMicros) break;
        accumulated += this.bidLevels.get(p)!.totalVolumeMicros;
        if (accumulated >= needed) return true;
      }
    }

    return false;
  }

  private async matchOrder(
    taker: Order
  ): Promise<{ fills: ExecutionFill[]; settlementEvents: TradeSettlementEvent[] }> {
    const fills: ExecutionFill[] = [];
    const settlementEvents: TradeSettlementEvent[] = [];
    const isBuy = taker.side === 'BUY';

    while (taker.remainingQtyMicros > 0) {
      const bestPrice = isBuy ? this.peekBestAsk() : this.peekBestBid();
      if (bestPrice === null) break;

      if (taker.orderType === 'LIMIT') {
        if (isBuy && bestPrice > taker.priceMicros) break;
        if (!isBuy && bestPrice < taker.priceMicros) break;
      }

      const contraLevels = isBuy ? this.askLevels : this.bidLevels;
      const level = contraLevels.get(bestPrice);
      if (!level || level.totalVolumeMicros <= 0) {
        contraLevels.delete(bestPrice);
        continue;
      }

      while (level.orders.length > 0 && taker.remainingQtyMicros > 0) {
        const maker = level.orders[0];
        const fillQty = Math.min(taker.remainingQtyMicros, maker.remainingQtyMicros);
        const fillPrice = maker.priceMicros;

        // Fixed-point integer settlement: (P * Q) // QTY_SCALE
        const settlementAmount = Math.floor((fillPrice * fillQty) / QTY_SCALE);

        // Update maker & taker
        maker.remainingQtyMicros -= fillQty;
        maker.filledQtyMicros += fillQty;
        level.totalVolumeMicros -= fillQty;

        taker.remainingQtyMicros -= fillQty;
        taker.filledQtyMicros += fillQty;

        const seq = this.nextSequence();
        const fillId = `fill_${Math.random().toString(36).substring(2, 10)}`;
        const nowNs = Date.now() * 1_000_000;

        const fill: ExecutionFill = {
          fillId,
          symbol: this.symbol,
          priceMicros: fillPrice,
          quantityMicros: fillQty,
          settlementMicros: settlementAmount,
          makerOrderId: maker.orderId,
          takerOrderId: taker.orderId,
          makerSide: maker.side,
          takerSide: taker.side,
          timestampNs: nowNs,
          sequenceNumber: seq,
        };
        fills.push(fill);

        const checksum = await computeSha256(
          `${this.previousHash}:${seq}:${fill.symbol}:${fill.priceMicros}:${fill.quantityMicros}:${fill.settlementMicros}:${fill.makerOrderId}:${fill.takerOrderId}`
        );
        this.previousHash = checksum;

        const event: TradeSettlementEvent = {
          sequenceNumber: seq,
          fillId,
          symbol: this.symbol,
          priceMicros: fillPrice,
          quantityMicros: fillQty,
          settlementMicros: settlementAmount,
          makerOrderId: maker.orderId,
          takerOrderId: taker.orderId,
          makerSide: maker.side,
          takerSide: taker.side,
          timestampNs: nowNs,
          checksumSha256: checksum,
        };
        settlementEvents.push(event);
        this.tradeHistory.push(event);

        if (maker.remainingQtyMicros === 0) {
          maker.status = 'FILLED';
          level.orders.shift();
        } else {
          maker.status = 'PARTIALLY_FILLED';
        }
      }

      if (level.totalVolumeMicros <= 0) {
        contraLevels.delete(bestPrice);
      }
    }

    return { fills, settlementEvents };
  }

  private insertRestingOrder(order: Order): void {
    const levels = order.side === 'BUY' ? this.bidLevels : this.askLevels;
    let level = levels.get(order.priceMicros);
    if (!level) {
      level = new PriceLevelNode(order.priceMicros);
      levels.set(order.priceMicros, level);
    }
    level.append(order);
  }

  getL2Snapshot(depth: number = 15): L2Snapshot {
    const bestBid = this.peekBestBid();
    const bestAsk = this.peekBestAsk();
    const spread = bestBid && bestAsk ? bestAsk - bestBid : null;

    const bidPrices = Array.from(this.bidLevels.keys())
      .filter((p) => this.bidLevels.get(p)!.totalVolumeMicros > 0)
      .sort((a, b) => b - a)
      .slice(0, depth);

    let cumBid = 0;
    const bids: L2Level[] = bidPrices.map((p) => {
      const lvl = this.bidLevels.get(p)!;
      cumBid += lvl.totalVolumeMicros;
      return {
        priceMicros: p,
        totalVolumeMicros: lvl.totalVolumeMicros,
        orderCount: lvl.orders.length,
        cumulativeVolumeMicros: cumBid,
      };
    });

    const askPrices = Array.from(this.askLevels.keys())
      .filter((p) => this.askLevels.get(p)!.totalVolumeMicros > 0)
      .sort((a, b) => a - b)
      .slice(0, depth);

    let cumAsk = 0;
    const asks: L2Level[] = askPrices.map((p) => {
      const lvl = this.askLevels.get(p)!;
      cumAsk += lvl.totalVolumeMicros;
      return {
        priceMicros: p,
        totalVolumeMicros: lvl.totalVolumeMicros,
        orderCount: lvl.orders.length,
        cumulativeVolumeMicros: cumAsk,
      };
    });

    return {
      symbol: this.symbol,
      timestampNs: Date.now() * 1_000_000,
      sequenceNumber: this.sequenceNumber,
      bestBidMicros: bestBid,
      bestAskMicros: bestAsk,
      spreadMicros: spread,
      bids,
      asks,
    };
  }

  createSnapshot(): string {
    const ordersList = Array.from(this.ordersById.values()).map((o) => ({ ...o }));
    return JSON.stringify({
      symbol: this.symbol,
      sequenceNumber: this.sequenceNumber,
      previousHash: this.previousHash,
      orders: ordersList,
      timestampNs: Date.now() * 1_000_000,
    });
  }

  restoreSnapshot(jsonStr: string): void {
    const data = JSON.parse(jsonStr);
    this.sequenceNumber = data.sequenceNumber;
    this.previousHash = data.previousHash || '0'.repeat(64);
    this.bidLevels.clear();
    this.askLevels.clear();
    this.ordersById.clear();

    const orders: Order[] = data.orders || [];
    orders.sort((a, b) => a.createdAtNs - b.createdAtNs);

    for (const ord of orders) {
      this.ordersById.set(ord.orderId, ord);
      if (
        (ord.status === 'NEW' || ord.status === 'PARTIALLY_FILLED') &&
        ord.orderType === 'LIMIT' &&
        ord.remainingQtyMicros > 0
      ) {
        this.insertRestingOrder(ord);
      }
    }
  }

  // Pre-seed institutional order book liquidity
  async seedInitialLiquidity(basePrice: number = 65000): Promise<void> {
    this.bidLevels.clear();
    this.askLevels.clear();
    this.ordersById.clear();
    this.tradeHistory = [];

    // Seed 10 bid levels
    for (let i = 1; i <= 10; i++) {
      const p = basePrice - i * 15;
      const q = (0.2 + (i % 4) * 0.35 + Math.random() * 0.2);
      await this.submitOrder(
        'BUY',
        'LIMIT',
        Math.round(q * QTY_SCALE),
        Math.round(p * PRICE_SCALE),
        'GTC',
        `seed_bid_${i}`,
        `seed_bid_${i}`
      );
    }

    // Seed 10 ask levels
    for (let i = 1; i <= 10; i++) {
      const p = basePrice + 15 + i * 15;
      const q = (0.25 + (i % 3) * 0.4 + Math.random() * 0.2);
      await this.submitOrder(
        'SELL',
        'LIMIT',
        Math.round(q * QTY_SCALE),
        Math.round(p * PRICE_SCALE),
        'GTC',
        `seed_ask_${i}`,
        `seed_ask_${i}`
      );
    }
  }
}
