"""
Ghost FactoryOS Track 3 F1 Skunkworks Engine — GF-T3-162 (Sovereign Ledger)
Core Continuous Double Auction (CDA) Deterministic Limit Order Book (LOB)

Architecture:
- Fixed-point integer decimal representation (Scale Factor 10^8)
- Zero floating-point arithmetic in state transition loops
- Doubly-linked list for FIFO price-time priority within price levels
- Hash table order index for O(1) order cancellation and lookups
- B-Tree sorted price levels (bisect-indexed sorted array for zero external deps)
- Real-time nanosecond sequencing
- Strict MIT / Apache-2.0 clean-room implementation
"""

from __future__ import annotations
import time
import uuid
import bisect
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Tuple

PRICE_SCALE = 100_000_000  # 10^8 fixed-point scaling factor
QTY_SCALE = 100_000_000    # 10^8 fixed-point scaling factor


class OrderSide(str, Enum):
    BUY = "BUY"
    SELL = "SELL"


class OrderType(str, Enum):
    LIMIT = "LIMIT"
    MARKET = "MARKET"
    IOC = "IOC"
    POST_ONLY = "POST_ONLY"


class OrderStatus(str, Enum):
    ACCEPTED = "ACCEPTED"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"


@dataclass
class Order:
    order_id: str
    client_order_id: str
    side: OrderSide
    price_fixed: int       # Scaled by PRICE_SCALE (e.g. 100.50 -> 10050000000)
    qty_fixed: int         # Scaled by QTY_SCALE (e.g. 1.25 -> 125000000)
    filled_qty_fixed: int = 0
    status: OrderStatus = OrderStatus.ACCEPTED
    timestamp_ns: int = field(default_factory=time.time_ns)
    
    # Doubly-linked list pointers for O(1) queue splicing
    prev: Optional[Order] = None
    next: Optional[Order] = None

    @property
    def remaining_qty_fixed(self) -> int:
        return self.qty_fixed - self.filled_qty_fixed

    @property
    def price_float(self) -> float:
        return self.price_fixed / PRICE_SCALE

    @property
    def qty_float(self) -> float:
        return self.qty_fixed / QTY_SCALE

    @property
    def filled_qty_float(self) -> float:
        return self.filled_qty_fixed / QTY_SCALE


@dataclass
class Trade:
    trade_id: str
    seq_num: int
    taker_order_id: str
    maker_order_id: str
    price_fixed: int
    qty_fixed: int
    taker_side: OrderSide
    timestamp_ns: int = field(default_factory=time.time_ns)

    @property
    def price_float(self) -> float:
        return self.price_fixed / PRICE_SCALE

    @property
    def qty_float(self) -> float:
        return self.qty_fixed / QTY_SCALE


class PriceLevel:
    """
    Doubly-linked FIFO queue for a single price level.
    Guarantees strict FIFO time priority and O(1) enqueue/dequeue/cancellation.
    """
    def __init__(self, price_fixed: int):
        self.price_fixed: int = price_fixed
        self.total_volume_fixed: int = 0
        self.head: Optional[Order] = None
        self.tail: Optional[Order] = None
        self.order_count: int = 0

    def append(self, order: Order) -> None:
        order.prev = self.tail
        order.next = None
        if self.tail:
            self.tail.next = order
        else:
            self.head = order
        self.tail = order
        self.total_volume_fixed += order.remaining_qty_fixed
        self.order_count += 1

    def remove(self, order: Order) -> None:
        if order.prev:
            order.prev.next = order.next
        else:
            self.head = order.next

        if order.next:
            order.next.prev = order.prev
        else:
            self.tail = order.prev

        self.total_volume_fixed -= order.remaining_qty_fixed
        self.order_count -= 1
        order.prev = None
        order.next = None

    def is_empty(self) -> bool:
        return self.head is None or self.total_volume_fixed <= 0


class LimitOrderBook:
    """
    Nanosecond-grade Continuous Double Auction (CDA) Limit Order Book.
    Enforces deterministic price-time priority and exact fixed-point math.
    """
    def __init__(self, instrument_id: str = "GF-T3-162"):
        self.instrument_id = instrument_id
        self.seq_num: int = 0
        
        # Order Index for O(1) ID lookups & cancellation
        self.orders: Dict[str, Order] = {}
        
        # Price levels: price_fixed -> PriceLevel
        self.bids: Dict[int, PriceLevel] = {}
        self.asks: Dict[int, PriceLevel] = {}
        
        # Sorted price caches (sorted ascending)
        # Bids best price = bid_prices[-1] (highest)
        # Asks best price = ask_prices[0] (lowest)
        self.bid_prices: List[int] = []
        self.ask_prices: List[int] = []
        
        # Trade execution tape
        self.trades: List[Trade] = []

    @staticmethod
    def to_fixed(val: float) -> int:
        return int(round(val * PRICE_SCALE))

    @staticmethod
    def from_fixed(val: int) -> float:
        return val / PRICE_SCALE

    def best_bid(self) -> Optional[int]:
        return self.bid_prices[-1] if self.bid_prices else None

    def best_ask(self) -> Optional[int]:
        return self.ask_prices[0] if self.ask_prices else None

    def get_spread(self) -> Optional[Tuple[int, float]]:
        bb = self.best_bid()
        ba = self.best_ask()
        if bb is not None and ba is not None:
            spread_fixed = ba - bb
            spread_bps = (spread_fixed / ba) * 10_000.0
            return spread_fixed, spread_bps
        return None

    def _insert_price_level(self, price_fixed: int, side: OrderSide) -> PriceLevel:
        if side == OrderSide.BUY:
            if price_fixed not in self.bids:
                level = PriceLevel(price_fixed)
                self.bids[price_fixed] = level
                bisect.insort(self.bid_prices, price_fixed)
                return level
            return self.bids[price_fixed]
        else:
            if price_fixed not in self.asks:
                level = PriceLevel(price_fixed)
                self.asks[price_fixed] = level
                bisect.insort(self.ask_prices, price_fixed)
                return level
            return self.asks[price_fixed]

    def _remove_price_level_if_empty(self, price_fixed: int, side: OrderSide) -> None:
        if side == OrderSide.BUY:
            level = self.bids.get(price_fixed)
            if level and level.is_empty():
                del self.bids[price_fixed]
                idx = bisect.bisect_left(self.bid_prices, price_fixed)
                if idx < len(self.bid_prices) and self.bid_prices[idx] == price_fixed:
                    del self.bid_prices[idx]
        else:
            level = self.asks.get(price_fixed)
            if level and level.is_empty():
                del self.asks[price_fixed]
                idx = bisect.bisect_left(self.ask_prices, price_fixed)
                if idx < len(self.ask_prices) and self.ask_prices[idx] == price_fixed:
                    del self.ask_prices[idx]

    def place_limit_order(
        self,
        client_order_id: str,
        side: OrderSide,
        price: float,
        qty: float,
        order_type: OrderType = OrderType.LIMIT,
    ) -> Tuple[Order, List[Trade]]:
        """
        Executes or rests a limit order under strict deterministic CDA rules.
        """
        price_fixed = self.to_fixed(price)
        qty_fixed = self.to_fixed(qty)

        if price_fixed <= 0 or qty_fixed <= 0:
            raise ValueError("Price and quantity must be strictly positive.")

        order_id = f"ord-{uuid.uuid4().hex[:12]}"
        order = Order(
            order_id=order_id,
            client_order_id=client_order_id,
            side=side,
            price_fixed=price_fixed,
            qty_fixed=qty_fixed,
            status=OrderStatus.ACCEPTED,
        )

        generated_trades: List[Trade] = []

        # --- Continuous Double Auction Matching Loop ---
        if side == OrderSide.BUY:
            # Match against asks starting at the lowest ask
            while order.remaining_qty_fixed > 0 and self.ask_prices:
                best_ask = self.ask_prices[0]
                if best_ask > price_fixed:
                    # Crossed spread satisfied; cannot match higher asks
                    break

                ask_level = self.asks[best_ask]
                maker_order = ask_level.head

                while maker_order and order.remaining_qty_fixed > 0:
                    match_qty = min(order.remaining_qty_fixed, maker_order.remaining_qty_fixed)
                    
                    # Execute trade at resting maker's price
                    self.seq_num += 1
                    trade = Trade(
                        trade_id=f"trd-{uuid.uuid4().hex[:12]}",
                        seq_num=self.seq_num,
                        taker_order_id=order.order_id,
                        maker_order_id=maker_order.order_id,
                        price_fixed=maker_order.price_fixed,
                        qty_fixed=match_qty,
                        taker_side=OrderSide.BUY,
                    )
                    generated_trades.append(trade)
                    self.trades.append(trade)

                    # Update order states
                    order.filled_qty_fixed += match_qty
                    maker_order.filled_qty_fixed += match_qty
                    ask_level.total_volume_fixed -= match_qty

                    next_maker = maker_order.next
                    if maker_order.remaining_qty_fixed == 0:
                        maker_order.status = OrderStatus.FILLED
                        ask_level.remove(maker_order)
                        del self.orders[maker_order.order_id]
                    else:
                        maker_order.status = OrderStatus.PARTIALLY_FILLED

                    maker_order = next_maker

                if ask_level.is_empty():
                    self._remove_price_level_if_empty(best_ask, OrderSide.SELL)

        else:  # SELL
            # Match against bids starting at the highest bid
            while order.remaining_qty_fixed > 0 and self.bid_prices:
                best_bid = self.bid_prices[-1]
                if best_bid < price_fixed:
                    # Crossed spread satisfied; cannot match lower bids
                    break

                bid_level = self.bids[best_bid]
                maker_order = bid_level.head

                while maker_order and order.remaining_qty_fixed > 0:
                    match_qty = min(order.remaining_qty_fixed, maker_order.remaining_qty_fixed)

                    # Execute trade at resting maker's price
                    self.seq_num += 1
                    trade = Trade(
                        trade_id=f"trd-{uuid.uuid4().hex[:12]}",
                        seq_num=self.seq_num,
                        taker_order_id=order.order_id,
                        maker_order_id=maker_order.order_id,
                        price_fixed=maker_order.price_fixed,
                        qty_fixed=match_qty,
                        taker_side=OrderSide.SELL,
                    )
                    generated_trades.append(trade)
                    self.trades.append(trade)

                    # Update order states
                    order.filled_qty_fixed += match_qty
                    maker_order.filled_qty_fixed += match_qty
                    bid_level.total_volume_fixed -= match_qty

                    next_maker = maker_order.next
                    if maker_order.remaining_qty_fixed == 0:
                        maker_order.status = OrderStatus.FILLED
                        bid_level.remove(maker_order)
                        del self.orders[maker_order.order_id]
                    else:
                        maker_order.status = OrderStatus.PARTIALLY_FILLED

                    maker_order = next_maker

                if bid_level.is_empty():
                    self._remove_price_level_if_empty(best_bid, OrderSide.BUY)

        # Update taker status and rest remainder in book if not IOC
        if order.remaining_qty_fixed == 0:
            order.status = OrderStatus.FILLED
        else:
            if order.filled_qty_fixed > 0:
                order.status = OrderStatus.PARTIALLY_FILLED

            if order_type != OrderType.IOC:
                level = self._insert_price_level(order.price_fixed, order.side)
                level.append(order)
                self.orders[order.order_id] = order
            else:
                order.status = OrderStatus.CANCELLED

        return order, generated_trades

    def cancel_order(self, order_id: str) -> Optional[Order]:
        """
        O(1) cancellation of an active resting order with garbage collection.
        """
        order = self.orders.get(order_id)
        if not order:
            return None

        if order.side == OrderSide.BUY:
            level = self.bids.get(order.price_fixed)
            if level:
                level.remove(order)
                self._remove_price_level_if_empty(order.price_fixed, OrderSide.BUY)
        else:
            level = self.asks.get(order.price_fixed)
            if level:
                level.remove(order)
                self._remove_price_level_if_empty(order.price_fixed, OrderSide.SELL)

        del self.orders[order_id]
        order.status = OrderStatus.CANCELLED
        return order

    def get_l2_depth(self, depth: int = 100) -> Dict:
        """
        Returns L2 depth snapshot with cumulative volumes.
        Bids: descending from best bid.
        Asks: ascending from best ask.
        """
        bids_snapshot = []
        cumulative_bid_vol = 0
        # Iterate backwards through bid_prices for descending order
        for p in reversed(self.bid_prices[-depth:]):
            level = self.bids.get(p)
            if level and level.total_volume_fixed > 0:
                vol = level.total_volume_fixed / QTY_SCALE
                cumulative_bid_vol += vol
                bids_snapshot.append({
                    "price": p / PRICE_SCALE,
                    "volume": vol,
                    "cumulative": cumulative_bid_vol,
                    "orders_count": level.order_count,
                })

        asks_snapshot = []
        cumulative_ask_vol = 0
        for p in self.ask_prices[:depth]:
            level = self.asks.get(p)
            if level and level.total_volume_fixed > 0:
                vol = level.total_volume_fixed / QTY_SCALE
                cumulative_ask_vol += vol
                asks_snapshot.append({
                    "price": p / PRICE_SCALE,
                    "volume": vol,
                    "cumulative": cumulative_ask_vol,
                    "orders_count": level.order_count,
                })

        bb = self.best_bid()
        ba = self.best_ask()
        spread_info = self.get_spread()

        return {
            "instrument_id": self.instrument_id,
            "seq_num": self.seq_num,
            "timestamp_ns": time.time_ns(),
            "best_bid": bb / PRICE_SCALE if bb is not None else None,
            "best_ask": ba / PRICE_SCALE if ba is not None else None,
            "spread": spread_info[0] / PRICE_SCALE if spread_info else None,
            "spread_bps": spread_info[1] if spread_info else None,
            "bids": bids_snapshot,
            "asks": asks_snapshot,
        }
