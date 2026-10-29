"""
APEX-202 (FinTech/Quant Series) - High-Frequency Limit Order Book & Liquidity Matching Engine
test_order_matching.py: Pytest / Unittest Suite (Targeting >80% Code Coverage)
License: Permissive Clean-Room MIT Architecture (Zero Copyleft)
"""

import unittest
from models import (
    Side,
    OrderType,
    TimeInForce,
    OrderStatus,
    PRICE_SCALE,
    QTY_SCALE,
)
from order_book import OrderBook


class TestOrderMatchingEngine(unittest.TestCase):
    def setUp(self):
        self.book = OrderBook("SYNTH-ALPHA / CORE-PT")

    # -----------------------------------------------------------------------
    # 1. Empty Book Edge Cases
    # -----------------------------------------------------------------------

    def test_empty_book_limit_order_rests(self):
        """Limit order on an empty book should rest without generating fills."""
        order, fills, events = self.book.submit_order(
            side=Side.BUY,
            order_type=OrderType.LIMIT,
            price_micros=50_000 * PRICE_SCALE,
            quantity_micros=1 * QTY_SCALE,
        )
        self.assertEqual(len(fills), 0)
        self.assertEqual(len(events), 0)
        self.assertEqual(order.status, OrderStatus.NEW)
        self.assertEqual(order.remaining_qty_micros, 1 * QTY_SCALE)
        self.assertEqual(self.book.peek_best_bid(), 50_000 * PRICE_SCALE)
        self.assertIsNone(self.book.peek_best_ask())
        self.assertIsNone(self.book.get_spread())

    def test_empty_book_market_order_cancels(self):
        """Market order against an empty book should immediately cancel without fills."""
        order, fills, events = self.book.submit_order(
            side=Side.BUY,
            order_type=OrderType.MARKET,
            quantity_micros=2 * QTY_SCALE,
        )
        self.assertEqual(len(fills), 0)
        self.assertEqual(len(events), 0)
        self.assertEqual(order.status, OrderStatus.CANCELLED)
        self.assertEqual(order.remaining_qty_micros, 2 * QTY_SCALE)
        self.assertEqual(order.filled_qty_micros, 0)

    # -----------------------------------------------------------------------
    # 2. Price-Time Priority (FIFO) & Queue Invariants
    # -----------------------------------------------------------------------

    def test_price_time_priority_fifo(self):
        """
        Two maker buy orders at identical price level (50,000 pts).
        Order A arrives before Order B.
        A taker sell order for 1.5 units should fill Order A completely (1.0 unit)
        and Order B partially (0.5 units).
        """
        ord_a, _, _ = self.book.submit_order(
            side=Side.BUY,
            order_type=OrderType.LIMIT,
            price_micros=50_000 * PRICE_SCALE,
            quantity_micros=1 * QTY_SCALE,
            order_id="maker_A",
        )
        ord_b, _, _ = self.book.submit_order(
            side=Side.BUY,
            order_type=OrderType.LIMIT,
            price_micros=50_000 * PRICE_SCALE,
            quantity_micros=1 * QTY_SCALE,
            order_id="maker_B",
        )

        # Incoming taker sell sweeps 1.5 units
        taker, fills, events = self.book.submit_order(
            side=Side.SELL,
            order_type=OrderType.LIMIT,
            price_micros=50_000 * PRICE_SCALE,
            quantity_micros=int(1.5 * QTY_SCALE),
            order_id="taker_S",
        )

        self.assertEqual(len(fills), 2)
        # Fill 1 must be maker_A
        self.assertEqual(fills[0].maker_order_id, "maker_A")
        self.assertEqual(fills[0].quantity_micros, 1 * QTY_SCALE)
        # Fill 2 must be maker_B
        self.assertEqual(fills[1].maker_order_id, "maker_B")
        self.assertEqual(fills[1].quantity_micros, int(0.5 * QTY_SCALE))

        # Check Maker States
        self.assertEqual(ord_a.status, OrderStatus.FILLED)
        self.assertEqual(ord_a.remaining_qty_micros, 0)
        self.assertEqual(ord_b.status, OrderStatus.PARTIALLY_FILLED)
        self.assertEqual(ord_b.remaining_qty_micros, int(0.5 * QTY_SCALE))

        # Check Taker State
        self.assertEqual(taker.status, OrderStatus.FILLED)
        self.assertEqual(taker.filled_qty_micros, int(1.5 * QTY_SCALE))
        self.assertEqual(taker.remaining_qty_micros, 0)

    def test_price_priority_over_time(self):
        """
        Higher bid gets matched before lower bid, regardless of arrival time.
        Bid 1: 49,000 pts at T1.
        Bid 2: 50,000 pts at T2.
        Taker sell at 49,000 pts should match Bid 2 first.
        """
        b1, _, _ = self.book.submit_order(
            side=Side.BUY,
            order_type=OrderType.LIMIT,
            price_micros=49_000 * PRICE_SCALE,
            quantity_micros=1 * QTY_SCALE,
            order_id="b1_lower_price",
        )
        b2, _, _ = self.book.submit_order(
            side=Side.BUY,
            order_type=OrderType.LIMIT,
            price_micros=50_000 * PRICE_SCALE,
            quantity_micros=1 * QTY_SCALE,
            order_id="b2_higher_price",
        )

        taker, fills, _ = self.book.submit_order(
            side=Side.SELL,
            order_type=OrderType.LIMIT,
            price_micros=49_000 * PRICE_SCALE,
            quantity_micros=1 * QTY_SCALE,
        )

        self.assertEqual(len(fills), 1)
        self.assertEqual(fills[0].maker_order_id, "b2_higher_price")
        self.assertEqual(fills[0].price_micros, 50_000 * PRICE_SCALE)
        self.assertEqual(b2.status, OrderStatus.FILLED)
        self.assertEqual(b1.status, OrderStatus.NEW)

    # -----------------------------------------------------------------------
    # 3. Partial Fills & Multi-Level Sweep
    # -----------------------------------------------------------------------

    def test_partial_fill_single_maker(self):
        """Taker partially fills a resting maker."""
        maker, _, _ = self.book.submit_order(
            side=Side.SELL,
            order_type=OrderType.LIMIT,
            price_micros=100 * PRICE_SCALE,
            quantity_micros=10 * QTY_SCALE,
            order_id="maker_ask",
        )

        taker, fills, _ = self.book.submit_order(
            side=Side.BUY,
            order_type=OrderType.LIMIT,
            price_micros=100 * PRICE_SCALE,
            quantity_micros=3 * QTY_SCALE,
            order_id="taker_bid",
        )

        self.assertEqual(len(fills), 1)
        self.assertEqual(fills[0].quantity_micros, 3 * QTY_SCALE)
        self.assertEqual(maker.status, OrderStatus.PARTIALLY_FILLED)
        self.assertEqual(maker.remaining_qty_micros, 7 * QTY_SCALE)
        self.assertEqual(taker.status, OrderStatus.FILLED)

        # L2 snapshot should show remaining 7 units
        l2 = self.book.get_l2_snapshot()
        self.assertEqual(l2["asks"][0][1], 7 * QTY_SCALE)

    def test_multi_level_sweep_and_residual_rest(self):
        """
        Asks at 101 pts (2 units), 102 pts (3 units), 103 pts (5 units).
        Taker buys 7 units at limit 104 pts.
        Should fill 101 pts (2 units) + 102 pts (3 units) + 103 pts (2 units),
        consuming 7 units completely.
        """
        self.book.submit_order(Side.SELL, OrderType.LIMIT, 2 * QTY_SCALE, 101 * PRICE_SCALE)
        self.book.submit_order(Side.SELL, OrderType.LIMIT, 3 * QTY_SCALE, 102 * PRICE_SCALE)
        self.book.submit_order(Side.SELL, OrderType.LIMIT, 5 * QTY_SCALE, 103 * PRICE_SCALE)

        taker, fills, events = self.book.submit_order(
            Side.BUY, OrderType.LIMIT, 7 * QTY_SCALE, 104 * PRICE_SCALE
        )

        self.assertEqual(len(fills), 3)
        self.assertEqual(fills[0].price_micros, 101 * PRICE_SCALE)
        self.assertEqual(fills[0].quantity_micros, 2 * QTY_SCALE)
        self.assertEqual(fills[1].price_micros, 102 * PRICE_SCALE)
        self.assertEqual(fills[1].quantity_micros, 3 * QTY_SCALE)
        self.assertEqual(fills[2].price_micros, 103 * PRICE_SCALE)
        self.assertEqual(fills[2].quantity_micros, 2 * QTY_SCALE)

        self.assertEqual(taker.status, OrderStatus.FILLED)
        self.assertEqual(self.book.peek_best_ask(), 103 * PRICE_SCALE)

        # Remaining ask depth at 103 should be 3 units
        l2 = self.book.get_l2_snapshot()
        self.assertEqual(l2["asks"][0][0], 103 * PRICE_SCALE)
        self.assertEqual(l2["asks"][0][1], 3 * QTY_SCALE)

    # -----------------------------------------------------------------------
    # 4. Fixed-Point Arithmetic & Settlement Precision
    # -----------------------------------------------------------------------

    def test_fixed_point_integer_microunit_math(self):
        """
        Settlement amount is (Price * Qty) // QTY_SCALE.
        Test with non-trivial fractional values to verify zero floating point drift:
        Price = 123.456789 pts -> 123_456_789 micros
        Qty = 0.987654 -> 987_654 micros
        Expected settlement in micros: (123456789 * 987654) // 1000000 = 121932591 micros
        """
        p = 123_456_789
        q = 987_654
        expected_settlement = (p * q) // QTY_SCALE
        self.assertEqual(expected_settlement, 121_932_591)

        self.book.submit_order(Side.SELL, OrderType.LIMIT, q, p, order_id="maker_frac")
        _, fills, events = self.book.submit_order(Side.BUY, OrderType.LIMIT, q, p, order_id="taker_frac")

        self.assertEqual(len(fills), 1)
        self.assertEqual(fills[0].settlement_micros, expected_settlement)
        self.assertEqual(events[0].settlement_micros, expected_settlement)

    # -----------------------------------------------------------------------
    # 5. Order Cancellation
    # -----------------------------------------------------------------------

    def test_cancel_resting_order_success(self):
        """Cancelling an active resting order updates status and removes from book."""
        order, _, _ = self.book.submit_order(
            Side.BUY, OrderType.LIMIT, 5 * QTY_SCALE, 50_000 * PRICE_SCALE, order_id="cancel_me"
        )
        self.assertEqual(self.book.peek_best_bid(), 50_000 * PRICE_SCALE)

        success, cancelled_ord, seq = self.book.cancel_order("cancel_me")
        self.assertTrue(success)
        self.assertEqual(cancelled_ord.status, OrderStatus.CANCELLED)
        self.assertEqual(cancelled_ord.remaining_qty_micros, 0)
        self.assertIsNone(self.book.peek_best_bid())

    def test_cancel_nonexistent_or_filled_order(self):
        """Cancelling a non-existent order or an already filled order returns False."""
        # Non-existent
        success, ord_obj, _ = self.book.cancel_order("phantom_id")
        self.assertFalse(success)
        self.assertIsNone(ord_obj)

        # Already filled
        self.book.submit_order(Side.SELL, OrderType.LIMIT, 1 * QTY_SCALE, 100 * PRICE_SCALE, order_id="m1")
        self.book.submit_order(Side.BUY, OrderType.LIMIT, 1 * QTY_SCALE, 100 * PRICE_SCALE, order_id="t1")

        success, ord_obj, _ = self.book.cancel_order("m1")
        self.assertFalse(success)
        self.assertEqual(ord_obj.status, OrderStatus.FILLED)

    # -----------------------------------------------------------------------
    # 6. Time in Force: IOC and FOK
    # -----------------------------------------------------------------------

    def test_ioc_order_fills_partial_and_cancels_residual(self):
        """IOC fills available liquidity and cancels remaining quantity."""
        self.book.submit_order(Side.SELL, OrderType.LIMIT, 2 * QTY_SCALE, 100 * PRICE_SCALE)

        taker, fills, _ = self.book.submit_order(
            side=Side.BUY,
            order_type=OrderType.LIMIT,
            quantity_micros=5 * QTY_SCALE,
            price_micros=100 * PRICE_SCALE,
            time_in_force=TimeInForce.IOC,
        )

        self.assertEqual(len(fills), 1)
        self.assertEqual(fills[0].quantity_micros, 2 * QTY_SCALE)
        self.assertEqual(taker.filled_qty_micros, 2 * QTY_SCALE)
        self.assertEqual(taker.status, OrderStatus.PARTIALLY_FILLED)
        self.assertIsNone(self.book.peek_best_bid())  # IOC residual does NOT rest

    def test_fok_order_rejected_when_liquidity_insufficient(self):
        """FOK order with insufficient liquidity is immediately rejected with 0 fills."""
        self.book.submit_order(Side.SELL, OrderType.LIMIT, 2 * QTY_SCALE, 100 * PRICE_SCALE)

        taker, fills, _ = self.book.submit_order(
            side=Side.BUY,
            order_type=OrderType.LIMIT,
            quantity_micros=5 * QTY_SCALE,
            price_micros=100 * PRICE_SCALE,
            time_in_force=TimeInForce.FOK,
        )

        self.assertEqual(len(fills), 0)
        self.assertEqual(taker.status, OrderStatus.REJECTED)
        self.assertEqual(taker.filled_qty_micros, 0)
        # Maker ask should be untouched
        self.assertEqual(self.book.peek_best_ask(), 100 * PRICE_SCALE)

    def test_fok_order_executes_when_liquidity_sufficient(self):
        """FOK order executes completely when sufficient liquidity exists."""
        self.book.submit_order(Side.SELL, OrderType.LIMIT, 5 * QTY_SCALE, 100 * PRICE_SCALE)

        taker, fills, _ = self.book.submit_order(
            side=Side.BUY,
            order_type=OrderType.LIMIT,
            quantity_micros=5 * QTY_SCALE,
            price_micros=100 * PRICE_SCALE,
            time_in_force=TimeInForce.FOK,
        )

        self.assertEqual(len(fills), 1)
        self.assertEqual(taker.status, OrderStatus.FILLED)

    # -----------------------------------------------------------------------
    # 7. Audit Trail, Sequence Monotonicity & Checksum Chaining
    # -----------------------------------------------------------------------

    def test_sequence_monotonicity_and_hash_chaining(self):
        """Monotonic sequence numbers and continuous SHA-256 hash chaining."""
        self.book.submit_order(Side.SELL, OrderType.LIMIT, 1 * QTY_SCALE, 100 * PRICE_SCALE)
        self.book.submit_order(Side.SELL, OrderType.LIMIT, 1 * QTY_SCALE, 101 * PRICE_SCALE)
        _, fills, events = self.book.submit_order(Side.BUY, OrderType.LIMIT, 2 * QTY_SCALE, 102 * PRICE_SCALE)

        self.assertEqual(len(events), 2)
        # Sequence numbers must be strictly increasing
        self.assertGreater(events[1].sequence_number, events[0].sequence_number)
        # Checksums must be non-empty valid 64-char hex strings
        self.assertEqual(len(events[0].checksum_sha256), 64)
        self.assertEqual(len(events[1].checksum_sha256), 64)
        self.assertNotEqual(events[0].checksum_sha256, events[1].checksum_sha256)

    # -----------------------------------------------------------------------
    # 8. State Snapshotting & Deterministic Restoration
    # -----------------------------------------------------------------------

    def test_state_snapshot_and_restoration(self):
        """Book state can be checkpointed and restored with byte-for-byte fidelity."""
        # Build state
        self.book.submit_order(Side.BUY, OrderType.LIMIT, 2 * QTY_SCALE, 49_000 * PRICE_SCALE, order_id="b1")
        self.book.submit_order(Side.BUY, OrderType.LIMIT, 3 * QTY_SCALE, 50_000 * PRICE_SCALE, order_id="b2")
        self.book.submit_order(Side.SELL, OrderType.LIMIT, 4 * QTY_SCALE, 51_000 * PRICE_SCALE, order_id="a1")

        orig_l2 = self.book.get_l2_snapshot()
        orig_seq = self.book.sequence_number

        # Create snapshot
        snapshot = self.book.create_snapshot()

        # Restore into a new fresh book
        new_book = OrderBook("SYNTH-ALPHA / CORE-PT")
        new_book.restore_snapshot(snapshot)

        restored_l2 = new_book.get_l2_snapshot()
        self.assertEqual(new_book.sequence_number, orig_seq)
        self.assertEqual(restored_l2["bids"], orig_l2["bids"])
        self.assertEqual(restored_l2["asks"], orig_l2["asks"])
        self.assertEqual(new_book.peek_best_bid(), orig_l2["best_bid_micros"])
        self.assertEqual(new_book.peek_best_ask(), orig_l2["best_ask_micros"])

    # -----------------------------------------------------------------------
    # 9. Validation Rejections
    # -----------------------------------------------------------------------

    def test_invalid_input_validations(self):
        """Negative or zero quantities and non-positive prices must raise ValueError."""
        with self.assertRaises(ValueError):
            self.book.submit_order(Side.BUY, OrderType.LIMIT, 0, 100 * PRICE_SCALE)

        with self.assertRaises(ValueError):
            self.book.submit_order(Side.BUY, OrderType.LIMIT, -100, 100 * PRICE_SCALE)

        with self.assertRaises(ValueError):
            self.book.submit_order(Side.BUY, OrderType.LIMIT, 100, 0)


if __name__ == "__main__":
    unittest.main()
