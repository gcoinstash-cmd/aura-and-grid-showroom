"""
Ghost FactoryOS Track 3 F1 Skunkworks Engine — GF-T3-162 (Sovereign Ledger)
Comprehensive Test Suite: Verification of CDA Invariants & Matching Core
Compatible with both pytest and Python standard library unittest
"""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    import pytest
except ImportError:
    pytest = None

from app.core.orderbook import LimitOrderBook, OrderSide, OrderType, OrderStatus


def test_initial_book_state():
    book = LimitOrderBook(instrument_id="GF-T3-162")
    assert book.best_bid() is None
    assert book.best_ask() is None
    assert book.get_spread() is None
    depth = book.get_l2_depth()
    assert len(depth["bids"]) == 0
    assert len(depth["asks"]) == 0


def test_passive_limit_order_placement_and_spread():
    book = LimitOrderBook()
    # Place passive buy order at 100.00
    buy_order, trades = book.place_limit_order("client-1", OrderSide.BUY, price=100.0, qty=5.0)
    assert buy_order.status == OrderStatus.ACCEPTED
    assert len(trades) == 0
    assert book.best_bid() == book.to_fixed(100.0)

    # Place passive sell order at 102.50
    sell_order, trades = book.place_limit_order("client-2", OrderSide.SELL, price=102.5, qty=3.0)
    assert sell_order.status == OrderStatus.ACCEPTED
    assert len(trades) == 0
    assert book.best_ask() == book.to_fixed(102.5)

    # Verify spread invariant: max(bid) < min(ask)
    assert book.best_bid() < book.best_ask()
    spread_fixed, spread_bps = book.get_spread()
    assert spread_fixed == book.to_fixed(2.5)
    assert round(spread_bps, 2) == round((2.5 / 102.5) * 10000, 2)


def test_fifo_price_time_priority():
    """
    Validates that orders at the same price level are executed strictly in the order of arrival.
    """
    book = LimitOrderBook()
    # Maker 1 placed at time t1
    m1, _ = book.place_limit_order("maker-1", OrderSide.SELL, price=105.0, qty=2.0)
    # Maker 2 placed at time t2 > t1 at identical price
    m2, _ = book.place_limit_order("maker-2", OrderSide.SELL, price=105.0, qty=3.0)

    # Aggressive Buy takes 3.0 units at 105.0
    taker, trades = book.place_limit_order("taker-1", OrderSide.BUY, price=105.0, qty=3.0)

    assert len(trades) == 2
    # Trade 1 must exhaust maker-1 completely
    assert trades[0].maker_order_id == m1.order_id
    assert trades[0].qty_float == 2.0
    # Trade 2 must partially fill maker-2 with 1.0 unit
    assert trades[1].maker_order_id == m2.order_id
    assert trades[1].qty_float == 1.0

    # Maker 1 should be gone from book
    assert m1.order_id not in book.orders
    # Maker 2 must still rest with 2.0 remaining
    assert book.orders[m2.order_id].remaining_qty_fixed == book.to_fixed(2.0)


def test_crossed_order_resolution_and_liquidity_drain():
    """
    Multi-level liquidity sweep when an aggressive taker crosses multiple passive levels.
    """
    book = LimitOrderBook()
    # Build sell ladder
    book.place_limit_order("ask-1", OrderSide.SELL, price=101.0, qty=1.5)
    book.place_limit_order("ask-2", OrderSide.SELL, price=102.0, qty=2.0)
    book.place_limit_order("ask-3", OrderSide.SELL, price=103.0, qty=5.0)

    # Aggressive buy crossing through 101 and 102 into 103 with qty=4.0
    taker, trades = book.place_limit_order("sweep-buy", OrderSide.BUY, price=103.0, qty=4.0)

    assert taker.status == OrderStatus.FILLED
    assert len(trades) == 3
    assert trades[0].price_float == 101.0
    assert trades[0].qty_float == 1.5
    assert trades[1].price_float == 102.0
    assert trades[1].qty_float == 2.0
    assert trades[2].price_float == 103.0
    assert trades[2].qty_float == 0.5  # 4.0 - 1.5 - 2.0 = 0.5

    # Remaining ask at 103.0 should be 4.5
    assert book.best_ask() == book.to_fixed(103.0)
    depth = book.get_l2_depth()
    assert depth["asks"][0]["volume"] == 4.5


def test_order_cancellation_and_garbage_collection():
    """
    Validates O(1) order cancellation, pointer unlinking, and price level deletion.
    """
    book = LimitOrderBook()
    o1, _ = book.place_limit_order("c-1", OrderSide.BUY, price=99.0, qty=10.0)
    o2, _ = book.place_limit_order("c-2", OrderSide.BUY, price=99.0, qty=5.0)

    assert book.best_bid() == book.to_fixed(99.0)
    assert book.bids[book.to_fixed(99.0)].total_volume_fixed == book.to_fixed(15.0)

    # Cancel o1 (head of queue)
    cancelled = book.cancel_order(o1.order_id)
    assert cancelled is not None
    assert cancelled.status == OrderStatus.CANCELLED
    assert o1.order_id not in book.orders
    assert book.bids[book.to_fixed(99.0)].total_volume_fixed == book.to_fixed(5.0)

    # Cancel o2 (final remaining order at price level)
    cancelled2 = book.cancel_order(o2.order_id)
    assert cancelled2 is not None
    assert o2.order_id not in book.orders
    # Price level 99.0 must be pruned completely
    assert book.to_fixed(99.0) not in book.bids
    assert book.best_bid() is None


def test_ioc_order_execution():
    """
    Immediate-Or-Cancel: fills available liquidity immediately and cancels any unfulfilled portion.
    """
    book = LimitOrderBook()
    book.place_limit_order("sell-1", OrderSide.SELL, price=50.0, qty=3.0)

    # IOC Buy for 10 units at 50.0
    ioc_order, trades = book.place_limit_order(
        "ioc-buy", OrderSide.BUY, price=50.0, qty=10.0, order_type=OrderType.IOC
    )
    assert len(trades) == 1
    assert trades[0].qty_float == 3.0
    assert ioc_order.filled_qty_float == 3.0
    assert ioc_order.status == OrderStatus.CANCELLED  # remainder cancelled
    assert ioc_order.order_id not in book.orders
    assert book.best_bid() is None  # Does not rest in book


def test_fixed_point_precision_zero_float_drift():
    """
    Validates that high-precision fractional amounts (e.g., satoshis / micro-units)
    retain absolute mathematical precision without floating point inaccuracies.
    """
    book = LimitOrderBook()
    price = 64123.45678901
    qty = 0.12345678
    order, _ = book.place_limit_order("prec-1", OrderSide.BUY, price=price, qty=qty)

    assert order.price_fixed == 6412345678901
    assert order.qty_fixed == 12345678
    assert book.best_bid() == 6412345678901

    depth = book.get_l2_depth()
    assert abs(depth["bids"][0]["price"] - price) < 1e-8
    assert abs(depth["bids"][0]["volume"] - qty) < 1e-8


if __name__ == "__main__":
    tests = [
        test_initial_book_state,
        test_passive_limit_order_placement_and_spread,
        test_fifo_price_time_priority,
        test_crossed_order_resolution_and_liquidity_drain,
        test_order_cancellation_and_garbage_collection,
        test_ioc_order_execution,
        test_fixed_point_precision_zero_float_drift,
    ]
    passed = 0
    for t in tests:
        t()
        print(f"PASS: {t.__name__}")
        passed += 1
    print(f"\nAll {passed}/{len(tests)} test invariants passed cleanly.")
