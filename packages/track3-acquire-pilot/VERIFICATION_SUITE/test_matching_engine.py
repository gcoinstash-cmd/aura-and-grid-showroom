"""
ApexLimit Engine - GF-T3-151 Comprehensive Test Suite.
Verifies crossing spreads, price-time priority FIFO, partial fills,
zero-float precision, risk margin rejections, and liquidation sentinels.

Target Coverage: >85%
Standard library unittest + pytest compatible.
SPDX-License-Identifier: Apache-2.0 / MIT
"""

import unittest
import uuid
from src.core.matching_engine import (
    MatchingEngine,
    Order,
    OrderSide,
    OrderType,
    OrderStatus,
    SCALE_FACTOR,
    to_scaled,
    from_scaled,
)
from src.core.risk_manager import (
    RiskManager,
)


class TestApexLimitEngine(unittest.TestCase):
    def setUp(self):
        self.engine = MatchingEngine()
        self.risk_mgr = RiskManager()

    def test_zero_float_precision_invariants(self):
        """Verify that integer scaling preserves exact satoshi/pip precision with zero float drift."""
        p_float = 64123.45678901
        q_float = 0.12345678

        scaled_p = to_scaled(p_float)
        scaled_q = to_scaled(q_float)

        self.assertEqual(scaled_p, 6412345678901)
        self.assertEqual(scaled_q, 12345678)

        # Fixed-point notional formula: (P * Q) // SCALE_FACTOR
        notional_scaled = (scaled_p * scaled_q) // SCALE_FACTOR
        self.assertIsInstance(notional_scaled, int)
        self.assertEqual(notional_scaled, 791647549764)  # Exactly 7916.47549764 USD

        # Reconversion check
        self.assertEqual(from_scaled(scaled_p), p_float)

    def test_orderbook_insert_and_l2_snapshot(self):
        """Verify resting limit orders populate Level 2 depth correctly."""
        symbol = "BTC-USD"
        book = self.engine.get_or_create_book(symbol)

        order1 = Order(
            order_id="b1",
            client_order_id="c_b1",
            account_id="acc1",
            symbol=symbol,
            side=OrderSide.BUY,
            order_type=OrderType.LIMIT,
            price_scaled=to_scaled(60000.0),
            quantity_scaled=to_scaled(1.5),
        )
        order2 = Order(
            order_id="a1",
            client_order_id="c_a1",
            account_id="acc2",
            symbol=symbol,
            side=OrderSide.SELL,
            order_type=OrderType.LIMIT,
            price_scaled=to_scaled(61000.0),
            quantity_scaled=to_scaled(2.0),
        )

        trades1 = book.insert_order(order1)
        trades2 = book.insert_order(order2)

        self.assertEqual(len(trades1), 0)
        self.assertEqual(len(trades2), 0)
        self.assertEqual(order1.status, OrderStatus.NEW)
        self.assertEqual(order2.status, OrderStatus.NEW)

        snapshot = book.get_l2_snapshot(depth=5)
        self.assertEqual(snapshot["best_bid"], 60000.0)
        self.assertEqual(snapshot["best_ask"], 61000.0)
        self.assertEqual(snapshot["spread"], 1000.0)
        self.assertEqual(snapshot["bids"], [[60000.0, 1.5]])
        self.assertEqual(snapshot["asks"], [[61000.0, 2.0]])

    def test_crossing_spread_full_execution(self):
        """Verify incoming aggressive buy matching resting ask with maker price execution."""
        symbol = "BTC-USD"
        book = self.engine.get_or_create_book(symbol)

        # Resting Maker Ask @ 50,000 for 1.0 BTC
        ask_order = Order(
            order_id="ask_maker",
            client_order_id="c_ask",
            account_id="maker_acc",
            symbol=symbol,
            side=OrderSide.SELL,
            order_type=OrderType.LIMIT,
            price_scaled=to_scaled(50000.0),
            quantity_scaled=to_scaled(1.0),
        )
        book.insert_order(ask_order)

        # Aggressive Taker Buy @ 50,100 (crossing spread) for 1.0 BTC
        buy_order = Order(
            order_id="buy_taker",
            client_order_id="c_buy",
            account_id="taker_acc",
            symbol=symbol,
            side=OrderSide.BUY,
            order_type=OrderType.LIMIT,
            price_scaled=to_scaled(50100.0),
            quantity_scaled=to_scaled(1.0),
        )
        trades = book.insert_order(buy_order)

        self.assertEqual(len(trades), 1)
        trade = trades[0]
        # Trade must execute at maker's price (50,000)
        self.assertEqual(trade.price_scaled, to_scaled(50000.0))
        self.assertEqual(trade.quantity_scaled, to_scaled(1.0))
        self.assertEqual(trade.maker_account_id, "maker_acc")
        self.assertEqual(trade.taker_account_id, "taker_acc")

        # Both orders should be marked FILLED
        self.assertEqual(ask_order.status, OrderStatus.FILLED)
        self.assertEqual(buy_order.status, OrderStatus.FILLED)
        self.assertIsNone(book.best_ask_scaled)
        self.assertIsNone(book.best_bid_scaled)

    def test_price_time_priority_fifo_queue(self):
        """Verify FIFO ordering when multiple resting makers exist at identical price."""
        symbol = "ETH-USD"
        book = self.engine.get_or_create_book(symbol)

        # Maker 1 placed first @ 3,000 for 1.0 ETH
        maker1 = Order(
            order_id="m1",
            client_order_id="c_m1",
            account_id="acc_m1",
            symbol=symbol,
            side=OrderSide.SELL,
            order_type=OrderType.LIMIT,
            price_scaled=to_scaled(3000.0),
            quantity_scaled=to_scaled(1.0),
        )
        # Maker 2 placed second @ 3,000 for 2.0 ETH
        maker2 = Order(
            order_id="m2",
            client_order_id="c_m2",
            account_id="acc_m2",
            symbol=symbol,
            side=OrderSide.SELL,
            order_type=OrderType.LIMIT,
            price_scaled=to_scaled(3000.0),
            quantity_scaled=to_scaled(2.0),
        )
        book.insert_order(maker1)
        book.insert_order(maker2)

        # Taker buys 1.5 ETH @ 3,000. FIFO requires maker1 to fill completely, then maker2 takes 0.5 ETH
        taker = Order(
            order_id="t1",
            client_order_id="c_t1",
            account_id="acc_t1",
            symbol=symbol,
            side=OrderSide.BUY,
            order_type=OrderType.LIMIT,
            price_scaled=to_scaled(3000.0),
            quantity_scaled=to_scaled(1.5),
        )
        trades = book.insert_order(taker)

        self.assertEqual(len(trades), 2)
        # Trade 1: maker1 filled 1.0 ETH
        self.assertEqual(trades[0].maker_order_id, "m1")
        self.assertEqual(trades[0].quantity_scaled, to_scaled(1.0))
        self.assertEqual(maker1.status, OrderStatus.FILLED)

        # Trade 2: maker2 partially filled 0.5 ETH
        self.assertEqual(trades[1].maker_order_id, "m2")
        self.assertEqual(trades[1].quantity_scaled, to_scaled(0.5))
        self.assertEqual(maker2.status, OrderStatus.PARTIALLY_FILLED)
        self.assertEqual(maker2.remaining_quantity_scaled, to_scaled(1.5))

        self.assertEqual(taker.status, OrderStatus.FILLED)

    def test_order_cancellation_and_level_cleanup(self):
        """Verify order cancellation successfully purges order and empty price levels."""
        symbol = "BTC-USD"
        book = self.engine.get_or_create_book(symbol)

        order = Order(
            order_id="ord_cancel_1",
            client_order_id="c_can_1",
            account_id="acc_can",
            symbol=symbol,
            side=OrderSide.BUY,
            order_type=OrderType.LIMIT,
            price_scaled=to_scaled(55000.0),
            quantity_scaled=to_scaled(3.0),
        )
        book.insert_order(order)
        self.assertEqual(book.best_bid_scaled, to_scaled(55000.0))

        cancelled = book.cancel_order("ord_cancel_1")
        self.assertIsNotNone(cancelled)
        self.assertEqual(cancelled.status, OrderStatus.CANCELLED)
        self.assertIsNone(book.best_bid_scaled)
        self.assertNotIn(55000 * SCALE_FACTOR, book.bids)

    def test_stop_limit_order_triggering(self):
        """Verify stop-limit orders remain parked until last traded price breaches trigger."""
        symbol = "BTC-USD"
        book = self.engine.get_or_create_book(symbol)

        # Stop buy: trigger if price rises to 66,000, place limit buy at 66,100
        stop_order = Order(
            order_id="stop_1",
            client_order_id="c_stop_1",
            account_id="acc_stop",
            symbol=symbol,
            side=OrderSide.BUY,
            order_type=OrderType.STOP_LIMIT,
            price_scaled=to_scaled(66100.0),
            quantity_scaled=to_scaled(0.5),
            stop_price_scaled=to_scaled(66000.0),
        )
        book.insert_order(stop_order)
        self.assertEqual(len(book.stop_orders), 1)
        self.assertIsNone(book.best_bid_scaled)  # Not resting yet

        # Cause trade below 66,000 (e.g., 65,000)
        m = Order("m", "c_m", "a", symbol, OrderSide.SELL, OrderType.LIMIT, to_scaled(65000.0), to_scaled(1.0))
        t = Order("t", "c_t", "b", symbol, OrderSide.BUY, OrderType.LIMIT, to_scaled(65000.0), to_scaled(1.0))
        book.insert_order(m)
        book.insert_order(t)
        self.assertEqual(len(book.stop_orders), 1)  # Still parked

        # Cause trade at 66,000 (triggers stop)
        m2 = Order("m2", "c_m2", "a", symbol, OrderSide.SELL, OrderType.LIMIT, to_scaled(66000.0), to_scaled(1.0))
        t2 = Order("t2", "c_t2", "b", symbol, OrderSide.BUY, OrderType.LIMIT, to_scaled(66000.0), to_scaled(1.0))
        book.insert_order(m2)
        book.insert_order(t2)

        # Stop order should have triggered and rested at 66,100
        self.assertEqual(len(book.stop_orders), 0)
        self.assertEqual(book.best_bid_scaled, to_scaled(66100.0))

    def test_risk_margin_lock_and_rejection_on_insufficient_collateral(self):
        """Verify order rejected if initial margin exceeds free equity."""
        acc_id = str(uuid.uuid4())
        # Register account with $1,000 cash
        self.risk_mgr.register_account(acc_id, client_label="small_trader", initial_cash=1000.0)

        # 1 BTC @ 60,000 = $60,000 notional.
        # At 5% IMR (20x max leverage), required margin = $3,000.
        # Free cash is only $1,000 -> REJECT
        approved, err, locked = self.risk_mgr.validate_pre_trade_order(
            account_id=acc_id,
            order_id="ord_fail",
            symbol="BTC-USD",
            side=OrderSide.BUY,
            price_scaled=to_scaled(60000.0),
            quantity_scaled=to_scaled(1.0),
        )

        self.assertFalse(approved)
        self.assertIn("INSUFFICIENT_MARGIN", err)
        self.assertEqual(locked, 0)

    def test_risk_margin_approval_and_lock_release(self):
        """Verify margin is successfully locked and unlocked upon order cancellation."""
        acc_id = str(uuid.uuid4())
        # $10,000 cash
        self.risk_mgr.register_account(acc_id, client_label="fund_1", initial_cash=10000.0)

        # 1 BTC @ 60,000 -> $3,000 margin required. $10,000 > $3,000 -> APPROVED
        approved, err, locked = self.risk_mgr.validate_pre_trade_order(
            account_id=acc_id,
            order_id="ord_success",
            symbol="BTC-USD",
            side=OrderSide.BUY,
            price_scaled=to_scaled(60000.0),
            quantity_scaled=to_scaled(1.0),
        )

        self.assertTrue(approved)
        self.assertIsNone(err)
        self.assertEqual(locked, to_scaled(3000.0))

        margin_state = self.risk_mgr.evaluate_margin_state(acc_id)
        self.assertEqual(margin_state.open_orders_margin_locked, 3000.0)
        self.assertEqual(margin_state.free_collateral_margin, 7000.0)

        # Release margin
        self.risk_mgr.release_order_margin(acc_id, "ord_success")
        post_state = self.risk_mgr.evaluate_margin_state(acc_id)
        self.assertEqual(post_state.open_orders_margin_locked, 0.0)
        self.assertEqual(post_state.free_collateral_margin, 10000.0)

    def test_liquidation_sentinel_trigger_on_adverse_mark_move(self):
        """Verify liquidation sentinel triggers when equity falls below maintenance margin."""
        acc_id = str(uuid.uuid4())
        # Register with $5,000 cash
        self.risk_mgr.register_account(acc_id, client_label="long_speculator", initial_cash=5000.0)

        # Fill Long 1 BTC @ 65,000
        self.risk_mgr.record_fill(
            account_id=acc_id,
            symbol="BTC-USD",
            side=OrderSide.BUY,
            price_scaled=to_scaled(65000.0),
            quantity_scaled=to_scaled(1.0),
        )

        # Maintenance margin at 2.5% of 65,000 = $1,625
        initial_state = self.risk_mgr.evaluate_margin_state(acc_id)
        self.assertEqual(initial_state.maintenance_margin_requirement, 1625.0)
        self.assertFalse(initial_state.is_liquidation_triggered)
        self.assertEqual(initial_state.status, "HEALTHY")

        # Price drops to 61,000: Unrealized PnL = -$4,000. Equity = $5,000 - $4,000 = $1,000
        # MMR = 2.5% of 61,000 = $1,525.
        # Since Equity ($1,000) <= MMR ($1,525) -> SENTINEL TRIGGERED!
        self.risk_mgr.set_mark_price("BTC-USD", 61000.0)

        breached_state = self.risk_mgr.evaluate_margin_state(acc_id)
        self.assertTrue(breached_state.is_liquidation_triggered)
        self.assertEqual(breached_state.status, "LIQUIDATION_BREACHED")

        # Trigger liquidation cascade unwinding
        actions = self.risk_mgr.trigger_liquidation_cascade(acc_id)
        self.assertGreaterEqual(len(actions), 1)
        self.assertIn("LIQUIDATE_POSITION_BTC-USD", actions[0])

        post_liq = self.risk_mgr.evaluate_margin_state(acc_id)
        self.assertFalse(post_liq.is_liquidation_triggered)

    def test_market_order_execution_and_unfilled_cancellation(self):
        """Verify market order sweeps top book and cancels unfilled remainder."""
        symbol = "SOL-USD"
        book = self.engine.get_or_create_book(symbol)

        # Resting ask: 10 SOL @ 150
        ask = Order("a1", "c_a1", "acc_a", symbol, OrderSide.SELL, OrderType.LIMIT, to_scaled(150.0), to_scaled(10.0))
        book.insert_order(ask)

        # Incoming market buy for 15 SOL (5 SOL more than resting liquidity)
        mkt_buy = Order("m1", "c_m1", "acc_b", symbol, OrderSide.BUY, OrderType.MARKET, to_scaled(0.0), to_scaled(15.0))
        trades = book.insert_order(mkt_buy)

        self.assertEqual(len(trades), 1)
        self.assertEqual(trades[0].quantity_scaled, to_scaled(10.0))
        self.assertEqual(mkt_buy.filled_quantity_scaled, to_scaled(10.0))
        # Unfilled remainder is cancelled, not rested
        self.assertEqual(mkt_buy.status, OrderStatus.PARTIALLY_FILLED)
        self.assertIsNone(book.best_bid_scaled)

    def test_client_order_id_idempotency(self):
        """Verify duplicate client_order_id returns empty trades and is ignored."""
        symbol = "BTC-USD"
        book = self.engine.get_or_create_book(symbol)

        o1 = Order("id_1", "unique_client_key_101", "acc_1", symbol, OrderSide.BUY, OrderType.LIMIT, to_scaled(60000.0), to_scaled(1.0))
        o2 = Order("id_2", "unique_client_key_101", "acc_1", symbol, OrderSide.BUY, OrderType.LIMIT, to_scaled(60000.0), to_scaled(1.0))

        t1 = book.insert_order(o1)
        t2 = book.insert_order(o2)

        self.assertEqual(len(t1), 0)
        self.assertEqual(len(t2), 0)
        # Should only have 1 order registered
        self.assertEqual(book.bids[to_scaled(60000.0)].total_volume_scaled, to_scaled(1.0))

    def test_multi_collateral_haircut_equity(self):
        """Verify collateral haircuts applied accurately (USD 0%, BTC 15%, ETH 20%)."""
        acc_id = str(uuid.uuid4())
        acc = self.risk_mgr.register_account(acc_id, client_label="multi_asset_whale", initial_cash=0.0)

        # Deposit 1.0 BTC ($65,000) with 15% haircut -> value = $55,250
        acc.collateral_balances_scaled["BTC"] = to_scaled(1.0)
        # Deposit 10.0 ETH ($3,500 * 10 = $35,000) with 20% haircut -> value = $28,000
        acc.collateral_balances_scaled["ETH"] = to_scaled(10.0)

        # Expected Equity = $55,250 + $28,000 = $83,250
        equity_scaled = self.risk_mgr.calculate_equity_scaled(acc)
        self.assertEqual(from_scaled(equity_scaled), 83250.0)

    def test_telemetry_and_latency_reporting(self):
        """Verify engine telemetry metrics and healthy status."""
        telemetry = self.engine.get_telemetry()
        self.assertEqual(telemetry["status"], "HEALTHY")
        self.assertEqual(telemetry["memory_fence"], "VERIFIED_ISOLATED")
        self.assertGreaterEqual(telemetry["total_orders_processed"], 0)


if __name__ == "__main__":
    unittest.main()
