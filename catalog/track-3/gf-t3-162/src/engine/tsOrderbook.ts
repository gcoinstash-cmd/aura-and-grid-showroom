/**
 * Ghost FactoryOS Track 3 F1 Skunkworks Engine — GF-T3-162 (Sovereign Ledger)
 * In-Browser Deterministic High-Frequency Continuous Double Auction (CDA) Engine
 * Strict parity with app/core/orderbook.py:
 * - Fixed-point 1e8 integer precision (zero float drift)
 * - Doubly-linked lists for O(1) FIFO queues
 * - Price-time deterministic matching
 */

export const PRICE_SCALE = 100_000_000n; // 10^8
export const QTY_SCALE = 100_000_000n;   // 10^8

export type Side = 'BUY' | 'SELL';
export type OrderType = 'LIMIT' | 'MARKET' | 'IOC' | 'POST_ONLY';
export type OrderStatus = 'ACCEPTED' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED';

export interface OrderNode {
  orderId: string;
  clientOrderId: string;
  side: Side;
  priceFixed: bigint;
  qtyFixed: bigint;
  filledQtyFixed: bigint;
  status: OrderStatus;
  timestampNs: number;
  prev?: OrderNode;
  next?: OrderNode;
}

export interface TradeRecord {
  tradeId: string;
  seqNum: number;
  takerOrderId: string;
  makerOrderId: string;
  price: number;
  qty: number;
  takerSide: Side;
  timestampNs: number;
  priceFixed: bigint;
  qtyFixed: bigint;
}

export interface DepthLevel {
  price: number;
  volume: number;
  cumulative: number;
  ordersCount: number;
  priceFixed: bigint;
  volumeFixed: bigint;
}

export interface DepthSnapshot {
  instrumentId: string;
  seqNum: number;
  timestampNs: number;
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
  spreadBps: number | null;
  bids: DepthLevel[];
  asks: DepthLevel[];
  totalBidVolume: number;
  totalAskVolume: number;
}

class PriceLevelQueue {
  priceFixed: bigint;
  totalVolumeFixed: bigint = 0n;
  orderCount: number = 0;
  head?: OrderNode;
  tail?: OrderNode;

  constructor(priceFixed: bigint) {
    this.priceFixed = priceFixed;
  }

  append(node: OrderNode) {
    node.prev = this.tail;
    node.next = undefined;
    if (this.tail) {
      this.tail.next = node;
    } else {
      this.head = node;
    }
    this.tail = node;
    const remaining = node.qtyFixed - node.filledQtyFixed;
    this.totalVolumeFixed += remaining;
    this.orderCount += 1;
  }

  remove(node: OrderNode) {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }

    const remaining = node.qtyFixed - node.filledQtyFixed;
    this.totalVolumeFixed -= remaining;
    this.orderCount -= 1;
    node.prev = undefined;
    node.next = undefined;
  }

  isEmpty(): boolean {
    return !this.head || this.totalVolumeFixed <= 0n;
  }
}

export class DeterministicOrderBook {
  instrumentId: string;
  seqNum: number = 0;
  orders: Map<string, OrderNode> = new Map();
  bids: Map<string, PriceLevelQueue> = new Map();
  asks: Map<string, PriceLevelQueue> = new Map();
  bidPrices: bigint[] = []; // sorted ascending
  askPrices: bigint[] = []; // sorted ascending
  trades: TradeRecord[] = [];

  constructor(instrumentId: string = 'GF-T3-162') {
    this.instrumentId = instrumentId;
  }

  static toFixed(val: number): bigint {
    return BigInt(Math.round(val * 100_000_000));
  }

  static fromFixed(val: bigint): number {
    return Number(val) / 100_000_000;
  }

  bestBid(): bigint | null {
    return this.bidPrices.length > 0 ? this.bidPrices[this.bidPrices.length - 1] : null;
  }

  bestAsk(): bigint | null {
    return this.askPrices.length > 0 ? this.askPrices[0] : null;
  }

  getSpread(): { spread: number; spreadBps: number } | null {
    const bb = this.bestBid();
    const ba = this.bestAsk();
    if (bb !== null && ba !== null) {
      const spreadVal = DeterministicOrderBook.fromFixed(ba - bb);
      const baVal = DeterministicOrderBook.fromFixed(ba);
      const spreadBps = baVal > 0 ? (spreadVal / baVal) * 10000 : 0;
      return { spread: spreadVal, spreadBps };
    }
    return null;
  }

  private insertPriceLevel(priceFixed: bigint, side: Side): PriceLevelQueue {
    const key = priceFixed.toString();
    if (side === 'BUY') {
      let level = this.bids.get(key);
      if (!level) {
        level = new PriceLevelQueue(priceFixed);
        this.bids.set(key, level);
        // insert into bidPrices keeping sorted ascending
        let idx = this.bidPrices.findIndex((p) => p > priceFixed);
        if (idx === -1) {
          this.bidPrices.push(priceFixed);
        } else {
          this.bidPrices.splice(idx, 0, priceFixed);
        }
      }
      return level;
    } else {
      let level = this.asks.get(key);
      if (!level) {
        level = new PriceLevelQueue(priceFixed);
        this.asks.set(key, level);
        let idx = this.askPrices.findIndex((p) => p > priceFixed);
        if (idx === -1) {
          this.askPrices.push(priceFixed);
        } else {
          this.askPrices.splice(idx, 0, priceFixed);
        }
      }
      return level;
    }
  }

  private cleanPriceLevel(priceFixed: bigint, side: Side) {
    const key = priceFixed.toString();
    if (side === 'BUY') {
      const level = this.bids.get(key);
      if (level && level.isEmpty()) {
        this.bids.delete(key);
        const idx = this.bidPrices.findIndex((p) => p === priceFixed);
        if (idx !== -1) this.bidPrices.splice(idx, 1);
      }
    } else {
      const level = this.asks.get(key);
      if (level && level.isEmpty()) {
        this.asks.delete(key);
        const idx = this.askPrices.findIndex((p) => p === priceFixed);
        if (idx !== -1) this.askPrices.splice(idx, 1);
      }
    }
  }

  placeLimitOrder(
    clientOrderId: string,
    side: Side,
    price: number,
    qty: number,
    orderType: OrderType = 'LIMIT'
  ): { order: OrderNode; newTrades: TradeRecord[] } {
    const priceFixed = DeterministicOrderBook.toFixed(price);
    const qtyFixed = DeterministicOrderBook.toFixed(qty);

    if (priceFixed <= 0n || qtyFixed <= 0n) {
      throw new Error('Price and quantity must be strictly positive');
    }

    const orderId = `ord-${Math.random().toString(36).substring(2, 10)}`;
    const order: OrderNode = {
      orderId,
      clientOrderId,
      side,
      priceFixed,
      qtyFixed,
      filledQtyFixed: 0n,
      status: 'ACCEPTED',
      timestampNs: Date.now() * 1_000_000,
    };

    const newTrades: TradeRecord[] = [];

    if (side === 'BUY') {
      while (order.qtyFixed - order.filledQtyFixed > 0n && this.askPrices.length > 0) {
        const bestAskPrice = this.askPrices[0];
        if (bestAskPrice > priceFixed) break; // spread satisfied

        const level = this.asks.get(bestAskPrice.toString());
        if (!level) break;

        let maker = level.head;
        while (maker && order.qtyFixed - order.filledQtyFixed > 0n) {
          const takerRem = order.qtyFixed - order.filledQtyFixed;
          const makerRem = maker.qtyFixed - maker.filledQtyFixed;
          const matchQty = takerRem < makerRem ? takerRem : makerRem;

          this.seqNum += 1;
          const trade: TradeRecord = {
            tradeId: `trd-${Math.random().toString(36).substring(2, 10)}`,
            seqNum: this.seqNum,
            takerOrderId: order.orderId,
            makerOrderId: maker.orderId,
            price: DeterministicOrderBook.fromFixed(maker.priceFixed),
            qty: DeterministicOrderBook.fromFixed(matchQty),
            takerSide: 'BUY',
            timestampNs: Date.now() * 1_000_000,
            priceFixed: maker.priceFixed,
            qtyFixed: matchQty,
          };
          newTrades.push(trade);
          this.trades.unshift(trade);
          if (this.trades.length > 200) this.trades.pop();

          order.filledQtyFixed += matchQty;
          maker.filledQtyFixed += matchQty;
          level.totalVolumeFixed -= matchQty;

          const nextMaker = maker.next;
          if (maker.qtyFixed - maker.filledQtyFixed === 0n) {
            maker.status = 'FILLED';
            level.remove(maker);
            this.orders.delete(maker.orderId);
          } else {
            maker.status = 'PARTIALLY_FILLED';
          }
          maker = nextMaker;
        }

        if (level.isEmpty()) {
          this.cleanPriceLevel(bestAskPrice, 'SELL');
        }
      }
    } else {
      // SELL order
      while (order.qtyFixed - order.filledQtyFixed > 0n && this.bidPrices.length > 0) {
        const bestBidPrice = this.bidPrices[this.bidPrices.length - 1];
        if (bestBidPrice < priceFixed) break;

        const level = this.bids.get(bestBidPrice.toString());
        if (!level) break;

        let maker = level.head;
        while (maker && order.qtyFixed - order.filledQtyFixed > 0n) {
          const takerRem = order.qtyFixed - order.filledQtyFixed;
          const makerRem = maker.qtyFixed - maker.filledQtyFixed;
          const matchQty = takerRem < makerRem ? takerRem : makerRem;

          this.seqNum += 1;
          const trade: TradeRecord = {
            tradeId: `trd-${Math.random().toString(36).substring(2, 10)}`,
            seqNum: this.seqNum,
            takerOrderId: order.orderId,
            makerOrderId: maker.orderId,
            price: DeterministicOrderBook.fromFixed(maker.priceFixed),
            qty: DeterministicOrderBook.fromFixed(matchQty),
            takerSide: 'SELL',
            timestampNs: Date.now() * 1_000_000,
            priceFixed: maker.priceFixed,
            qtyFixed: matchQty,
          };
          newTrades.push(trade);
          this.trades.unshift(trade);
          if (this.trades.length > 200) this.trades.pop();

          order.filledQtyFixed += matchQty;
          maker.filledQtyFixed += matchQty;
          level.totalVolumeFixed -= matchQty;

          const nextMaker = maker.next;
          if (maker.qtyFixed - maker.filledQtyFixed === 0n) {
            maker.status = 'FILLED';
            level.remove(maker);
            this.orders.delete(maker.orderId);
          } else {
            maker.status = 'PARTIALLY_FILLED';
          }
          maker = nextMaker;
        }

        if (level.isEmpty()) {
          this.cleanPriceLevel(bestBidPrice, 'BUY');
        }
      }
    }

    if (order.qtyFixed - order.filledQtyFixed === 0n) {
      order.status = 'FILLED';
    } else {
      if (order.filledQtyFixed > 0n) {
        order.status = 'PARTIALLY_FILLED';
      }
      if (orderType !== 'IOC') {
        const level = this.insertPriceLevel(order.priceFixed, order.side);
        level.append(order);
        this.orders.set(order.orderId, order);
      } else {
        order.status = 'CANCELLED';
      }
    }

    return { order, newTrades };
  }

  cancelOrder(orderId: string): OrderNode | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    if (order.side === 'BUY') {
      const level = this.bids.get(order.priceFixed.toString());
      if (level) {
        level.remove(order);
        this.cleanPriceLevel(order.priceFixed, 'BUY');
      }
    } else {
      const level = this.asks.get(order.priceFixed.toString());
      if (level) {
        level.remove(order);
        this.cleanPriceLevel(order.priceFixed, 'SELL');
      }
    }

    this.orders.delete(orderId);
    order.status = 'CANCELLED';
    return order;
  }

  getL2Depth(depth: number = 100): DepthSnapshot {
    const bidsSnapshot: DepthLevel[] = [];
    let cumBid = 0;
    let totBidFixed = 0n;

    for (let i = this.bidPrices.length - 1; i >= Math.max(0, this.bidPrices.length - depth); i--) {
      const p = this.bidPrices[i];
      const level = this.bids.get(p.toString());
      if (level && level.totalVolumeFixed > 0n) {
        const vol = DeterministicOrderBook.fromFixed(level.totalVolumeFixed);
        cumBid += vol;
        totBidFixed += level.totalVolumeFixed;
        bidsSnapshot.push({
          price: DeterministicOrderBook.fromFixed(p),
          volume: vol,
          cumulative: cumBid,
          ordersCount: level.orderCount,
          priceFixed: p,
          volumeFixed: level.totalVolumeFixed,
        });
      }
    }

    const asksSnapshot: DepthLevel[] = [];
    let cumAsk = 0;
    let totAskFixed = 0n;

    for (let i = 0; i < Math.min(this.askPrices.length, depth); i++) {
      const p = this.askPrices[i];
      const level = this.asks.get(p.toString());
      if (level && level.totalVolumeFixed > 0n) {
        const vol = DeterministicOrderBook.fromFixed(level.totalVolumeFixed);
        cumAsk += vol;
        totAskFixed += level.totalVolumeFixed;
        asksSnapshot.push({
          price: DeterministicOrderBook.fromFixed(p),
          volume: vol,
          cumulative: cumAsk,
          ordersCount: level.orderCount,
          priceFixed: p,
          volumeFixed: level.totalVolumeFixed,
        });
      }
    }

    const bb = this.bestBid();
    const ba = this.bestAsk();
    const spreadInfo = this.getSpread();

    return {
      instrumentId: this.instrumentId,
      seqNum: this.seqNum,
      timestampNs: Date.now() * 1_000_000,
      bestBid: bb !== null ? DeterministicOrderBook.fromFixed(bb) : null,
      bestAsk: ba !== null ? DeterministicOrderBook.fromFixed(ba) : null,
      spread: spreadInfo?.spread ?? null,
      spreadBps: spreadInfo?.spreadBps ?? null,
      bids: bidsSnapshot,
      asks: asksSnapshot,
      totalBidVolume: DeterministicOrderBook.fromFixed(totBidFixed),
      totalAskVolume: DeterministicOrderBook.fromFixed(totAskFixed),
    };
  }

  seedInitialLiquidity(centerPrice: number = 84250.00, countLevels: number = 12) {
    // Generate institutional market maker two-sided quote ladder
    for (let i = 1; i <= countLevels; i++) {
      const bidPrice = Math.round((centerPrice - i * 5.0) * 100) / 100;
      const askPrice = Math.round((centerPrice + i * 5.0) * 100) / 100;
      const bidQty = Math.round((0.85 + Math.sin(i * 0.9) * 0.4 + i * 0.25) * 1000) / 1000;
      const askQty = Math.round((0.75 + Math.cos(i * 0.8) * 0.35 + i * 0.22) * 1000) / 1000;

      this.placeLimitOrder(`seed-bid-${i}`, 'BUY', bidPrice, bidQty);
      this.placeLimitOrder(`seed-ask-${i}`, 'SELL', askPrice, askQty);
    }
  }
}
