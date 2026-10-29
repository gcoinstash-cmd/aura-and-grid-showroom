"""
Test Suite for GF-T3-210: APEX-210 Real-Time LOB Market Microstructure Engine
Coverage Target: >80%
Test Vectors:
1. Strict FIFO queue priority conservation and fill accuracy.
2. Zero-crossing and non-negativity of bid-ask spread (Ask >= Bid).
3. Hawkes process stationarity condition (branching ratio alpha / beta < 1.0).
4. Cryptographic SHA-256 chain immutability and tamper detection.
"""

import time
import unittest
from engine import (
    LimitOrderBook,
    Order,
    OrderSide,
    OrderType,
    HawkesProcess,
    AuditLedger,
    AuditBlock,
)


class TestLimitOrderBookMicrostructure(unittest.TestCase):
    def setUp(self):
        # Create a fresh book without initial seed state for deterministic testing
        self.lob = LimitOrderBook(asset_pair="SYNTH-LOB-01 (CORE-LIQ / BASE-UNIT)")
        self.lob.bids.clear()
        self.lob.asks.clear()
        self.lob.order_map.clear()
        self.lob.trade_tape.clear()
        self.lob.audit_ledger = AuditLedger()

    def test_strict_fifo_queue_priority_and_fill_accuracy(self):
        """
        Verify that limit orders placed at the identical price level are executed
        in exact Price-Time Priority FIFO order. Maker 1 must be filled completely
        before Maker 2 receives any fills.
        """
        now = time.time()
        # Insert 3 maker limit orders at price 100.00 pts
        o1 = Order("MAKER-1", OrderSide.BUY, OrderType.LIMIT, 100.00, 500.0, now)
        o2 = Order("MAKER-2", OrderSide.BUY, OrderType.LIMIT, 100.00, 1000.0, now + 0.01)
        o3 = Order("MAKER-3", OrderSide.BUY, OrderType.LIMIT, 100.00, 750.0, now + 0.02)

        self.lob.submit_order(o1)
        self.lob.submit_order(o2)
        self.lob.submit_order(o3)

        # Verify queue positions
        q1 = self.lob.get_queue_position("MAKER-1")
        q2 = self.lob.get_queue_position("MAKER-2")
        q3 = self.lob.get_queue_position("MAKER-3")

        self.assertIsNotNone(q1)
        self.assertIsNotNone(q2)
        self.assertIsNotNone(q3)
        self.assertEqual(q1["queue_index"], 1)
        self.assertEqual(q1["units_ahead"], 0.0)

        self.assertEqual(q2["queue_index"], 2)
        self.assertEqual(q2["units_ahead"], 500.0)

        self.assertEqual(q3["queue_index"], 3)
        self.assertEqual(q3["units_ahead"], 1500.0)

        # Incoming aggressive market order to sell 800 units
        # Must fill MAKER-1 (500 units completely) and MAKER-2 (300 units partially)
        taker = Order("TAKER-SWEEP-1", OrderSide.SELL, OrderType.MARKET, 0.0, 800.0, now + 0.05)
        fills = self.lob.submit_order(taker)

        self.assertEqual(len(fills), 2)
        # Fill 1: MAKER-1 for 500 units
        self.assertEqual(fills[0].maker_order_id, "MAKER-1")
        self.assertEqual(fills[0].quantity, 500.0)
        # Fill 2: MAKER-2 for 300 units
        self.assertEqual(fills[1].maker_order_id, "MAKER-2")
        self.assertEqual(fills[1].quantity, 300.0)

        # MAKER-1 is fully filled and evicted from order map
        self.assertNotIn("MAKER-1", self.lob.order_map)

        # MAKER-2 is now front of queue with 700 remaining
        q2_after = self.lob.get_queue_position("MAKER-2")
        self.assertIsNotNone(q2_after)
        self.assertEqual(q2_after["queue_index"], 1)
        self.assertEqual(q2_after["units_ahead"], 0.0)
        self.assertEqual(q2_after["remaining_units"], 700.0)

        # MAKER-3 is now second in queue with 700 units ahead
        q3_after = self.lob.get_queue_position("MAKER-3")
        self.assertIsNotNone(q3_after)
        self.assertEqual(q3_after["queue_index"], 2)
        self.assertEqual(q3_after["units_ahead"], 700.0)

    def test_zero_crossing_and_non_negativity_of_spread(self):
        """
        Verify that the resting limit order book strictly prevents negative spreads
        (Ask < Bid). Any crossing order must match immediately and preserve non-negativity:
        Ask >= Bid at all resting times.
        """
        now = time.time()
        # Seed resting bids and asks
        self.lob.submit_order(Order("RESTING-BID-1", OrderSide.BUY, OrderType.LIMIT, 102.50, 1000.0, now))
        self.lob.submit_order(Order("RESTING-ASK-1", OrderSide.SELL, OrderType.LIMIT, 102.60, 1000.0, now))

        self.assertGreaterEqual(self.lob.spread_pts, 0.0)
        self.assertGreaterEqual(self.lob.best_ask, self.lob.best_bid)
        self.assertAlmostEqual(self.lob.spread_pts, 0.10, places=4)

        # Submit crossing Buy limit order at 102.70 pts (higher than best ask 102.60)
        crossing_buy = Order("CROSSING-BUY", OrderSide.BUY, OrderType.LIMIT, 102.70, 1000.0, now + 0.1)
        fills = self.lob.submit_order(crossing_buy)

        self.assertEqual(len(fills), 1)
        self.assertEqual(fills[0].price, 102.60)  # Executed at maker's ask price
        self.assertEqual(fills[0].quantity, 1000.0)

        # After match, RESTING-ASK-1 is fully consumed.
        # Check resting spread invariant
        if self.lob.best_bid is not None and self.lob.best_ask is not None:
            self.assertGreaterEqual(self.lob.best_ask, self.lob.best_bid)
            self.assertGreaterEqual(self.lob.spread_pts, 0.0)

    def test_hawkes_process_stationarity_condition(self):
        """
        Verify Hawkes self-exciting point process:
        Stationarity condition: eta = alpha / beta < 1.0.
        When eta < 1.0, the process is stable and sub-critical.
        When alpha is stimulated, intensity spikes and decays exponentially.
        """
        hp = HawkesProcess(mu=1.0, alpha=0.6, beta=1.2)
        self.assertLess(hp.branching_ratio, 1.0)
        self.assertAlmostEqual(hp.branching_ratio, 0.5, places=3)

        base_t = 1000.0
        init_intensity = hp.intensity(base_t)
        self.assertEqual(init_intensity, 1.0)

        # Record a burst of 5 events within 0.1s
        for offset in [0.01, 0.03, 0.05, 0.07, 0.09]:
            hp.record_event(base_t + offset)

        # Immediate intensity must spike significantly above base mu
        spike_intensity = hp.intensity(base_t + 0.10)
        self.assertGreater(spike_intensity, 2.0)

        # As time elapses (e.g. 10 decay periods = 10 / 1.2 ≈ 8.3s), intensity decays back toward mu
        decayed_intensity = hp.intensity(base_t + 10.0)
        self.assertAlmostEqual(decayed_intensity, 1.0, delta=0.05)

        # Super-critical condition detection
        unstable_hp = HawkesProcess(mu=1.0, alpha=1.5, beta=1.0)
        self.assertGreaterEqual(unstable_hp.branching_ratio, 1.0)

    def test_cryptographic_sha256_audit_immutability(self):
        """
        Verify the append-only SHA-256 state ledger:
        1. All valid blocks maintain cryptographic continuity (curr.prev_hash == prev.hash).
        2. Any unauthorized payload or timestamp mutation is immediately caught by verify_integrity().
        """
        ledger = AuditLedger()
        b1 = ledger.record_event("ORDER_SUBMISSION", {"order_id": "ORD-001", "units": 5000})
        b2 = ledger.record_event("TRADE_EXECUTION", {"fill_id": "FILL-001", "units": 5000})
        b3 = ledger.record_event("LOB_DEPTH_SNAPSHOT", {"mid_pts": 105.50})

        valid, err = ledger.verify_integrity()
        self.assertTrue(valid)
        self.assertIsNone(err)

        # Tampering Test 1: Mutate payload in an existing block
        b2.payload["units"] = 999999  # Malicious manipulation
        valid_tampered, err_tampered = ledger.verify_integrity()
        self.assertFalse(valid_tampered)
        self.assertIn("Hash tampering detected", err_tampered)

        # Restore payload
        b2.payload["units"] = 5000
        valid_restored, _ = ledger.verify_integrity()
        self.assertTrue(valid_restored)

        # Tampering Test 2: Alter previous hash to break chain link
        b3.prev_hash = "deadbeef" * 8
        valid_broken_chain, err_broken = ledger.verify_integrity()
        self.assertFalse(valid_broken_chain)
        self.assertIn("Broken chain link", err_broken)

    def test_microstructure_analytics_calculations(self):
        """
        Verify Kyle's Lambda, Order Book Imbalance, and Amihud Illiquidity formulas.
        """
        self.lob.initial_seed_state()
        
        # Test Order Book Imbalance
        obi = self.lob.get_order_book_imbalance()
        self.assertTrue(-1.0 <= obi <= 1.0)

        # Test Amihud Illiquidity
        amihud = self.lob.get_amihud_illiquidity()
        self.assertGreater(amihud, 0.0)

        # Test Kyle's Lambda
        kyle = self.lob.get_kyles_lambda()
        self.assertGreater(kyle, 0.0)

        # Test Cancel Wave injection
        cancelled = self.lob.inject_cancel_wave(0.5)
        self.assertGreater(cancelled, 0)


# Pytest compatibility entry points
def test_fifo_pytest():
    suite = TestLimitOrderBookMicrostructure()
    suite.setUp()
    suite.test_strict_fifo_queue_priority_and_fill_accuracy()


def test_spread_pytest():
    suite = TestLimitOrderBookMicrostructure()
    suite.setUp()
    suite.test_zero_crossing_and_non_negativity_of_spread()


def test_hawkes_pytest():
    suite = TestLimitOrderBookMicrostructure()
    suite.setUp()
    suite.test_hawkes_process_stationarity_condition()


def test_sha256_audit_pytest():
    suite = TestLimitOrderBookMicrostructure()
    suite.setUp()
    suite.test_cryptographic_sha256_audit_immutability()


if __name__ == "__main__":
    unittest.main(verbosity=2)
