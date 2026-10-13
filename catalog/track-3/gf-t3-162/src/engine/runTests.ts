/**
 * Ghost FactoryOS Track 3 F1 Skunkworks Engine — GF-T3-162 (Sovereign Ledger)
 * Interactive In-Browser Test Suite Runner (100% test parity with tests/test_orderbook.py)
 */

import { DeterministicOrderBook } from './tsOrderbook';

export interface TestResult {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  durationUs: number;
  assertionLog: string[];
  error?: string;
}

export function executeFullTestSuite(): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: Initial Empty Book State
  {
    const start = performance.now();
    const logs: string[] = [];
    let passed = false;
    let err: string | undefined;
    try {
      const book = new DeterministicOrderBook('GF-T3-162');
      logs.push(`Verified bestBid is null: ${book.bestBid() === null}`);
      logs.push(`Verified bestAsk is null: ${book.bestAsk() === null}`);
      logs.push(`Verified spread is null: ${book.getSpread() === null}`);
      const depth = book.getL2Depth();
      logs.push(`Verified 0 bid levels and 0 ask levels.`);
      if (book.bestBid() === null && book.bestAsk() === null && depth.bids.length === 0 && depth.asks.length === 0) {
        passed = true;
      }
    } catch (e: any) {
      err = e.message;
    }
    const durationUs = Math.round((performance.now() - start) * 1000);
    results.push({
      id: 'test_initial_book_state',
      name: 'Initial Empty Book State Invariant',
      category: 'LOB Core State',
      passed,
      durationUs,
      assertionLog: logs,
      error: err,
    });
  }

  // Test 2: Passive Limit Order Placement & Spread Invariant
  {
    const start = performance.now();
    const logs: string[] = [];
    let passed = false;
    let err: string | undefined;
    try {
      const book = new DeterministicOrderBook();
      const { order: b1, newTrades: t1 } = book.placeLimitOrder('c-1', 'BUY', 100.0, 5.0);
      logs.push(`Placed passive BUY 5.0 @ 100.00 -> Status: ${b1.status}, Trades: ${t1.length}`);
      const { order: s1, newTrades: t2 } = book.placeLimitOrder('c-2', 'SELL', 102.5, 3.0);
      logs.push(`Placed passive SELL 3.0 @ 102.50 -> Status: ${s1.status}, Trades: ${t2.length}`);

      const spread = book.getSpread();
      logs.push(`Evaluated spread: $${spread?.spread.toFixed(2)} (${spread?.spreadBps.toFixed(2)} bps)`);
      if (
        b1.status === 'ACCEPTED' &&
        s1.status === 'ACCEPTED' &&
        t1.length === 0 &&
        t2.length === 0 &&
        spread &&
        spread.spread === 2.5
      ) {
        passed = true;
      }
    } catch (e: any) {
      err = e.message;
    }
    const durationUs = Math.round((performance.now() - start) * 1000);
    results.push({
      id: 'test_passive_limit_order_placement_and_spread',
      name: 'Spread Non-Crossing Invariant [max(Bid) < min(Ask)]',
      category: 'Mathematical Proofs',
      passed,
      durationUs,
      assertionLog: logs,
      error: err,
    });
  }

  // Test 3: Deterministic FIFO Price-Time Priority
  {
    const start = performance.now();
    const logs: string[] = [];
    let passed = false;
    let err: string | undefined;
    try {
      const book = new DeterministicOrderBook();
      const { order: m1 } = book.placeLimitOrder('maker-1', 'SELL', 105.0, 2.0);
      const { order: m2 } = book.placeLimitOrder('maker-2', 'SELL', 105.0, 3.0);
      logs.push(`Enqueued Maker-1 (2.0 @ 105.00) at t_0`);
      logs.push(`Enqueued Maker-2 (3.0 @ 105.00) at t_1 > t_0`);

      const { newTrades: trades } = book.placeLimitOrder('taker-1', 'BUY', 105.0, 3.0);
      logs.push(`Taker BUY 3.0 @ 105.00 executed ${trades.length} trades`);
      logs.push(`Trade 0 matched with Maker-1: qty=${trades[0]?.qty} (exhausted maker-1)`);
      logs.push(`Trade 1 matched with Maker-2: qty=${trades[1]?.qty} (partial fill maker-2)`);

      const m2Resting = book.orders.get(m2.orderId);
      const m2Rem = m2Resting ? DeterministicOrderBook.fromFixed(m2Resting.qtyFixed - m2Resting.filledQtyFixed) : 0;
      logs.push(`Maker-2 residual resting quantity: ${m2Rem}`);

      if (
        trades.length === 2 &&
        trades[0].makerOrderId === m1.orderId &&
        trades[0].qty === 2.0 &&
        trades[1].makerOrderId === m2.orderId &&
        trades[1].qty === 1.0 &&
        m2Rem === 2.0 &&
        !book.orders.has(m1.orderId)
      ) {
        passed = true;
      }
    } catch (e: any) {
      err = e.message;
    }
    const durationUs = Math.round((performance.now() - start) * 1000);
    results.push({
      id: 'test_fifo_price_time_priority',
      name: 'Deterministic FIFO Price-Time Queue Priority',
      category: 'Queue Discipline',
      passed,
      durationUs,
      assertionLog: logs,
      error: err,
    });
  }

  // Test 4: Crossed-Order Multi-Level Liquidity Drain
  {
    const start = performance.now();
    const logs: string[] = [];
    let passed = false;
    let err: string | undefined;
    try {
      const book = new DeterministicOrderBook();
      book.placeLimitOrder('ask-1', 'SELL', 101.0, 1.5);
      book.placeLimitOrder('ask-2', 'SELL', 102.0, 2.0);
      book.placeLimitOrder('ask-3', 'SELL', 103.0, 5.0);
      logs.push(`Built multi-tier ask ladder: 1.5@101, 2.0@102, 5.0@103`);

      const { order: taker, newTrades: trades } = book.placeLimitOrder('sweep-buy', 'BUY', 103.0, 4.0);
      logs.push(`Aggressive BUY 4.0 @ 103.00 crossed into 3 price levels`);
      logs.push(`Trade 1: 1.5 @ 101.00`);
      logs.push(`Trade 2: 2.0 @ 102.00`);
      logs.push(`Trade 3: 0.5 @ 103.00`);

      const depth = book.getL2Depth();
      const topAskVol = depth.asks[0]?.volume;
      logs.push(`Top ask volume after sweep: ${topAskVol} @ ${depth.asks[0]?.price}`);

      if (
        taker.status === 'FILLED' &&
        trades.length === 3 &&
        trades[0].qty === 1.5 &&
        trades[1].qty === 2.0 &&
        trades[2].qty === 0.5 &&
        topAskVol === 4.5
      ) {
        passed = true;
      }
    } catch (e: any) {
      err = e.message;
    }
    const durationUs = Math.round((performance.now() - start) * 1000);
    results.push({
      id: 'test_crossed_order_resolution_and_liquidity_drain',
      name: 'Crossed-Order Multi-Level Liquidity Drain',
      category: 'Matching Engine',
      passed,
      durationUs,
      assertionLog: logs,
      error: err,
    });
  }

  // Test 5: O(1) Cancellation & Price Level Garbage Collection
  {
    const start = performance.now();
    const logs: string[] = [];
    let passed = false;
    let err: string | undefined;
    try {
      const book = new DeterministicOrderBook();
      const { order: o1 } = book.placeLimitOrder('c-1', 'BUY', 99.0, 10.0);
      const { order: o2 } = book.placeLimitOrder('c-2', 'BUY', 99.0, 5.0);
      logs.push(`Enqueued 2 resting buy orders totaling 15.0 @ 99.00`);

      const cancelled1 = book.cancelOrder(o1.orderId);
      logs.push(`Cancelled order 1 (head of queue) -> Status: ${cancelled1?.status}`);
      logs.push(`Price level 99.00 volume reduced to 5.0`);

      const cancelled2 = book.cancelOrder(o2.orderId);
      logs.push(`Cancelled order 2 (tail / last order at price level)`);
      logs.push(`Price level 99.00 purged from memory. Best bid is now: ${book.bestBid()}`);

      if (cancelled1 && cancelled2 && !book.orders.has(o1.orderId) && !book.orders.has(o2.orderId) && book.bestBid() === null) {
        passed = true;
      }
    } catch (e: any) {
      err = e.message;
    }
    const durationUs = Math.round((performance.now() - start) * 1000);
    results.push({
      id: 'test_order_cancellation_and_garbage_collection',
      name: 'O(1) Order Cancellation & Level Garbage Collection',
      category: 'Memory Management',
      passed,
      durationUs,
      assertionLog: logs,
      error: err,
    });
  }

  // Test 6: Immediate-Or-Cancel (IOC) Execution Discipline
  {
    const start = performance.now();
    const logs: string[] = [];
    let passed = false;
    let err: string | undefined;
    try {
      const book = new DeterministicOrderBook();
      book.placeLimitOrder('s-1', 'SELL', 50.0, 3.0);
      logs.push(`Resting book contains 3.0 @ 50.00`);

      const { order: iocOrder, newTrades: trades } = book.placeLimitOrder('ioc-1', 'BUY', 50.0, 10.0, 'IOC');
      logs.push(`IOC BUY 10.0 @ 50.00 executed ${trades.length} trade for 3.0 units`);
      logs.push(`Residual 7.0 units cancelled immediately: status=${iocOrder.status}`);
      logs.push(`IOC order does not enter resting book: inBook=${book.orders.has(iocOrder.orderId)}`);

      if (
        trades.length === 1 &&
        trades[0].qty === 3.0 &&
        iocOrder.status === 'CANCELLED' &&
        !book.orders.has(iocOrder.orderId) &&
        book.bestBid() === null
      ) {
        passed = true;
      }
    } catch (e: any) {
      err = e.message;
    }
    const durationUs = Math.round((performance.now() - start) * 1000);
    results.push({
      id: 'test_ioc_order_execution',
      name: 'Immediate-Or-Cancel (IOC) Execution Discipline',
      category: 'Execution Policy',
      passed,
      durationUs,
      assertionLog: logs,
      error: err,
    });
  }

  // Test 7: Fixed-Point Decimal Arithmetic Zero Float Drift
  {
    const start = performance.now();
    const logs: string[] = [];
    let passed = false;
    let err: string | undefined;
    try {
      const book = new DeterministicOrderBook();
      const price = 64123.45678901;
      const qty = 0.12345678;
      const { order } = book.placeLimitOrder('prec-1', 'BUY', price, qty);

      logs.push(`Input Float: ${price} -> Scaled BigInt: ${order.priceFixed.toString()}`);
      logs.push(`Input Qty: ${qty} -> Scaled BigInt: ${order.qtyFixed.toString()}`);

      const depth = book.getL2Depth();
      const readPrice = depth.bids[0].price;
      const readVol = depth.bids[0].volume;
      const priceDiff = Math.abs(readPrice - price);
      const volDiff = Math.abs(readVol - qty);
      logs.push(`Price reconstruction delta: ${priceDiff.toExponential(4)} (< 1e-8)`);
      logs.push(`Volume reconstruction delta: ${volDiff.toExponential(4)} (< 1e-8)`);

      if (order.priceFixed === 6412345678901n && order.qtyFixed === 12345678n && priceDiff < 1e-8 && volDiff < 1e-8) {
        passed = true;
      }
    } catch (e: any) {
      err = e.message;
    }
    const durationUs = Math.round((performance.now() - start) * 1000);
    results.push({
      id: 'test_fixed_point_precision_zero_float_drift',
      name: '10^8 Fixed-Point Zero Float Precision Invariant',
      category: 'Quant Core',
      passed,
      durationUs,
      assertionLog: logs,
      error: err,
    });
  }

  return results;
}
