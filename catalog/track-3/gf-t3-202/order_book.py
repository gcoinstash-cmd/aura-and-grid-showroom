"""
APEX-202 (FinTech/Quant Series) - High-Frequency Limit Order Book & Liquidity Matching Engine
order_book.py: Core Deterministic FIFO Matching Engine Implementation
License: Permissive Clean-Room MIT Architecture (Zero Copyleft)
"""

from __future__ import annotations
import heapq
import hashlib
import time
import uuid
from collections import deque
from typing import Dict, List, Optional, Tuple, Any

from models import (
    Side,
    OrderType,
    TimeInForce,
    OrderStatus,
    Order,
    ExecutionFill,
    TradeSettlementEvent,
    QTY_SCALE,
    PRICE_SCALE,
)


class PriceLevel:
    """
    Represents an aggregated price level containing a FIFO queue of orders.
    Enforces Time Priority: orders that arrive earlier are at the head of the deque.
    """
    __slots__ = ("price_micros", "orders", "total_volume_micros")

    def __init__(self, price_micros: int):
        self.price_micros: int = price_micros
        self.orders: deque[Order] = deque()
        self.total_volume_micros: int = 0

    @property
    def order_count(self) -> int:
        return len(self.orders)

    def append(self, order: Order) -> None:
        self.orders.append(order)
        self.total_volume_micros += order.remaining_qty_micros

    def remove_order(self, order_id: str) -> Optional[Order]:
        """
        Removes an order by ID if present and adjusts the volume.
        O(k) where k is orders at this level; typically small in HFT books.
        """
        for i, order in enumerate(self.orders):
            if order.order_id == order_id:
                del self.orders[i]
                self.total_volume_micros -= order.remaining_qty_micros
                return order
        return None

    def prune_head(self) -> Optional[Order]:
        """Pops the head order if completely filled or empty."""
        if self.orders and self.orders[0].remaining_qty_micros <= 0:
            return self.orders.popleft()
        return None


class OrderBook:
    """
    High-Frequency Limit Order Book & Matching Engine for a single symbol.
    Guarantees:
      - Deterministic Price-Time Priority (FIFO)
      - Zero floating point drift (Fixed-point 64-bit integer microunit arithmetic)
      - Best-bid / Best-ask access in O(1) amortized
      - Order insertion and cancellation in O(log P)
      - Monotonic sequence numbering and hash-chained audit settlement stream
    """

    def __init__(self, symbol: str):
        self.symbol: str = symbol
        self.sequence_number: int = 0
        self.previous_hash: str = "0" * 64

        # Bids: Max-heap of prices (stored as negative values for min-heap implementation)
        self._bid_heap: List[int] = []  # stores -price_micros
        self._bid_levels: Dict[int, PriceLevel] = {}

        # Asks: Min-heap of prices
        self._ask_heap: List[int] = []  # stores +price_micros
        self._ask_levels: Dict[int, PriceLevel] = {}

        # Fast lookup by order_id: order_id -> Order
        self._orders_by_id: Dict[str, Order] = {}

        # Settlement and audit history
        self.trade_history: List[TradeSettlementEvent] = []

    # -----------------------------------------------------------------------
    # Monotonic Sequence & Checksum Helpers
    # -----------------------------------------------------------------------

    def _next_sequence(self) -> int:
        self.sequence_number += 1
        return self.sequence_number

    def _generate_checksum(self, seq: int, fill: ExecutionFill) -> str:
        """
        Deterministic cryptographic SHA-256 chaining.
        H_i = SHA256(H_{i-1} || Seq || Symbol || Price || Qty || Settlement || Maker || Taker)
        """
        payload = (
            f"{self.previous_hash}:{seq}:{fill.symbol}:{fill.price_micros}:"
            f"{fill.quantity_micros}:{fill.settlement_micros}:{fill.maker_order_id}:"
            f"{fill.taker_order_id}"
        )
        digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()
        self.previous_hash = digest
        return digest

    # -----------------------------------------------------------------------
    # Top of Book Access - O(1) Amortized
    # -----------------------------------------------------------------------

    def peek_best_bid(self) -> Optional[int]:
        """Returns highest bid price_micros or None if book is empty."""
        while self._bid_heap:
            best_neg_price = self._bid_heap[0]
            price = -best_neg_price
            level = self._bid_levels.get(price)
            if level is not None and level.total_volume_micros > 0 and len(level.orders) > 0:
                return price
            # Stale or depleted price level: lazy cleanup
            heapq.heappop(self._bid_heap)
            if price in self._bid_levels and self._bid_levels[price].total_volume_micros <= 0:
                del self._bid_levels[price]
        return None

    def peek_best_ask(self) -> Optional[int]:
        """Returns lowest ask price_micros or None if book is empty."""
        while self._ask_heap:
            price = self._ask_heap[0]
            level = self._ask_levels.get(price)
            if level is not None and level.total_volume_micros > 0 and len(level.orders) > 0:
                return price
            # Stale or depleted price level: lazy cleanup
            heapq.heappop(self._ask_heap)
            if price in self._ask_levels and self._ask_levels[price].total_volume_micros <= 0:
                del self._ask_levels[price]
        return None

    def get_spread(self) -> Optional[int]:
        """Returns (best_ask - best_bid) in microunits, or None if one side is empty."""
        best_bid = self.peek_best_bid()
        best_ask = self.peek_best_ask()
        if best_bid is not None and best_ask is not None:
            return best_ask - best_bid
        return None

    # -----------------------------------------------------------------------
    # Core Order Processing (LIMIT, MARKET, CANCEL)
    # -----------------------------------------------------------------------

    def submit_order(
        self,
        side: Side,
        order_type: OrderType,
        quantity_micros: int,
        price_micros: Optional[int] = None,
        time_in_force: TimeInForce = TimeInForce.GTC,
        client_order_id: Optional[str] = None,
        order_id: Optional[str] = None,
    ) -> Tuple[Order, List[ExecutionFill], List[TradeSettlementEvent]]:
        """
        Deterministic Order Submission & Matching Gateway.
        1. Validates inputs & constructs order.
        2. If order crosses the book (aggressive taker), matches against resting liquidity.
        3. If residual quantity remains:
           - LIMIT GTC -> rests on the book.
           - LIMIT IOC -> residual cancelled.
           - LIMIT FOK -> either filled entirely upfront or killed (checked before matching).
           - MARKET -> residual cancelled.
        """
        if quantity_micros <= 0:
            raise ValueError("quantity_micros must be > 0")

        if order_type == OrderType.LIMIT:
            if price_micros is None or price_micros <= 0:
                raise ValueError("price_micros must be > 0 for LIMIT orders")
        else:
            price_micros = 0  # Market order price is determined by book fills

        if order_id is None:
            order_id = f"ord_{uuid.uuid4().hex[:12]}"

        order = Order(
            order_id=order_id,
            symbol=self.symbol,
            side=side,
            order_type=order_type,
            price_micros=price_micros,
            initial_qty_micros=quantity_micros,
            remaining_qty_micros=quantity_micros,
            filled_qty_micros=0,
            time_in_force=time_in_force,
            client_order_id=client_order_id,
            created_at_ns=time.time_ns(),
            status=OrderStatus.NEW,
        )

        fills: List[ExecutionFill] = []
        settlement_events: List[TradeSettlementEvent] = []

        # Handle FOK (Fill or Kill) pre-check: verify full liquidity is available
        if time_in_force == TimeInForce.FOK:
            if not self._can_fully_fill(order):
                order.status = OrderStatus.REJECTED
                order.remaining_qty_micros = 0
                self._next_sequence()
                return order, fills, settlement_events

        # Match against resting book
        fills, settlement_events = self._match(order)

        # Post-matching state evaluation
        if order.remaining_qty_micros == 0:
            order.status = OrderStatus.FILLED
        elif order.filled_qty_micros > 0:
            order.status = OrderStatus.PARTIALLY_FILLED
        else:
            order.status = OrderStatus.NEW

        # Residual order handling
        if order.remaining_qty_micros > 0:
            if order.order_type == OrderType.LIMIT and order.time_in_force == TimeInForce.GTC:
                # Rest on the book
                self._insert_resting_order(order)
            else:
                # MARKET or IOC residual: cancel unfilled portion
                order.status = OrderStatus.CANCELLED if order.filled_qty_micros == 0 else OrderStatus.PARTIALLY_FILLED

        self._orders_by_id[order.order_id] = order
        self._next_sequence()

        return order, fills, settlement_events

    def cancel_order(self, order_id: str) -> Tuple[bool, Optional[Order], int]:
        """
        Cancels a resting order in O(1) / O(log P).
        Returns: (success, order_or_none, sequence_number)
        """
        order = self._orders_by_id.get(order_id)
        if order is None:
            return False, None, self.sequence_number

        if not order.is_active:
            # Order is already filled, cancelled, or rejected
            return False, order, self.sequence_number

        # Locate price level
        levels = self._bid_levels if order.side == Side.BUY else self._ask_levels
        level = levels.get(order.price_micros)

        cancelled_qty = order.remaining_qty_micros
        if level is not None:
            level.remove_order(order_id)
            if level.total_volume_micros <= 0:
                # Level exhausted
                del levels[order.price_micros]

        order.status = OrderStatus.CANCELLED
        order.remaining_qty_micros = 0

        seq = self._next_sequence()
        return True, order, seq

    # -----------------------------------------------------------------------
    # Internal Matching Logic (Price-Time FIFO Priority)
    # -----------------------------------------------------------------------

    def _can_fully_fill(self, taker_order: Order) -> bool:
        """Determines if a FOK order can be filled in its entirety at or better than limit price."""
        needed_qty = taker_order.remaining_qty_micros
        accumulated_qty = 0

        if taker_order.side == Side.BUY:
            # Match against asks in ascending price order
            sorted_ask_prices = sorted(self._ask_levels.keys())
            for ask_p in sorted_ask_prices:
                if taker_order.order_type == OrderType.LIMIT and ask_p > taker_order.price_micros:
                    break
                level = self._ask_levels[ask_p]
                accumulated_qty += level.total_volume_micros
                if accumulated_qty >= needed_qty:
                    return True
        else:
            # Match against bids in descending price order
            sorted_bid_prices = sorted(self._bid_levels.keys(), reverse=True)
            for bid_p in sorted_bid_prices:
                if taker_order.order_type == OrderType.LIMIT and bid_p < taker_order.price_micros:
                    break
                level = self._bid_levels[bid_p]
                accumulated_qty += level.total_volume_micros
                if accumulated_qty >= needed_qty:
                    return True

        return False

    def _match(self, taker_order: Order) -> Tuple[List[ExecutionFill], List[TradeSettlementEvent]]:
        """
        Sweeps the contra book following Price-Time Priority.
        Executes fills at the MAKER's resting price (Price Improvement for Taker).
        """
        fills: List[ExecutionFill] = []
        settlement_events: List[TradeSettlementEvent] = []

        is_buy = taker_order.side == Side.BUY

        while taker_order.remaining_qty_micros > 0:
            best_contra_price = self.peek_best_ask() if is_buy else self.peek_best_bid()
            if best_contra_price is None:
                # Contra book is empty; cannot match further
                break

            # Price crossing check for LIMIT orders
            if taker_order.order_type == OrderType.LIMIT:
                if is_buy and best_contra_price > taker_order.price_micros:
                    break  # Lowest ask is higher than taker's buy limit
                if not is_buy and best_contra_price < taker_order.price_micros:
                    break  # Highest bid is lower than taker's sell limit

            # Fetch the contra price level
            contra_levels = self._ask_levels if is_buy else self._bid_levels
            level = contra_levels.get(best_contra_price)
            if level is None or level.total_volume_micros <= 0:
                # Trigger heap pop
                if is_buy:
                    self.peek_best_ask()
                else:
                    self.peek_best_bid()
                continue

            # FIFO: Match against orders starting from queue head
            while level.orders and taker_order.remaining_qty_micros > 0:
                maker_order = level.orders[0]

                # Matchable volume is min(taker remaining, maker remaining)
                fill_qty = min(taker_order.remaining_qty_micros, maker_order.remaining_qty_micros)
                fill_price = maker_order.price_micros

                # Fixed-point settlement calculation: (Price * Qty) // QTY_SCALE
                settlement_amount = (fill_price * fill_qty) // QTY_SCALE

                # Update Maker
                maker_order.remaining_qty_micros -= fill_qty
                maker_order.filled_qty_micros += fill_qty
                level.total_volume_micros -= fill_qty

                # Update Taker
                taker_order.remaining_qty_micros -= fill_qty
                taker_order.filled_qty_micros += fill_qty

                # Generate execution fill
                seq = self._next_sequence()
                fill_id = f"fill_{uuid.uuid4().hex[:12]}"
                now_ns = time.time_ns()

                fill = ExecutionFill(
                    fill_id=fill_id,
                    symbol=self.symbol,
                    price_micros=fill_price,
                    quantity_micros=fill_qty,
                    settlement_micros=settlement_amount,
                    maker_order_id=maker_order.order_id,
                    taker_order_id=taker_order.order_id,
                    maker_side=maker_order.side,
                    taker_side=taker_order.side,
                    timestamp_ns=now_ns,
                    sequence_number=seq,
                )
                fills.append(fill)

                # Emit hash-chained Trade Settlement Event
                checksum = self._generate_checksum(seq, fill)
                event = TradeSettlementEvent(
                    sequence_number=seq,
                    fill_id=fill_id,
                    symbol=self.symbol,
                    price_micros=fill_price,
                    quantity_micros=fill_qty,
                    settlement_micros=settlement_amount,
                    maker_order_id=maker_order.order_id,
                    taker_order_id=taker_order.order_id,
                    maker_side=maker_order.side.value,
                    taker_side=taker_order.side.value,
                    timestamp_ns=now_ns,
                    checksum_sha256=checksum,
                )
                settlement_events.append(event)
                self.trade_history.append(event)

                # If maker is fully filled, pop from queue
                if maker_order.remaining_qty_micros == 0:
                    maker_order.status = OrderStatus.FILLED
                    level.orders.popleft()
                else:
                    maker_order.status = OrderStatus.PARTIALLY_FILLED

            # If the entire price level is now empty, remove it
            if level.total_volume_micros <= 0:
                del contra_levels[best_contra_price]

        return fills, settlement_events

    def _insert_resting_order(self, order: Order) -> None:
        """Inserts a resting order into the book at its limit price level."""
        price = order.price_micros
        is_buy = order.side == Side.BUY

        levels = self._bid_levels if is_buy else self._ask_levels
        heap = self._bid_heap if is_buy else self._ask_heap

        if price not in levels:
            level = PriceLevel(price)
            levels[price] = level
            # Bid prices are stored negative for max-heap behavior
            heap_val = -price if is_buy else price
            heapq.heappush(heap, heap_val)
        else:
            level = levels[price]

        level.append(order)

    # -----------------------------------------------------------------------
    # L2 Market Depth & State Queries
    # -----------------------------------------------------------------------

    def get_l2_snapshot(self, depth: int = 20) -> Dict[str, Any]:
        """
        Produces aggregated Level 2 market depth snapshot.
        Format:
          bids: [ [price_micros, aggregated_qty_micros, order_count], ... ] (sorted high to low)
          asks: [ [price_micros, aggregated_qty_micros, order_count], ... ] (sorted low to high)
        """
        best_bid = self.peek_best_bid()
        best_ask = self.peek_best_ask()
        spread = (best_ask - best_bid) if (best_bid and best_ask) else None

        sorted_bid_prices = sorted(self._bid_levels.keys(), reverse=True)[:depth]
        bids_l2 = [
            (p, self._bid_levels[p].total_volume_micros, self._bid_levels[p].order_count)
            for p in sorted_bid_prices
            if self._bid_levels[p].total_volume_micros > 0
        ]

        sorted_ask_prices = sorted(self._ask_levels.keys())[:depth]
        asks_l2 = [
            (p, self._ask_levels[p].total_volume_micros, self._ask_levels[p].order_count)
            for p in sorted_ask_prices
            if self._ask_levels[p].total_volume_micros > 0
        ]

        return {
            "symbol": self.symbol,
            "timestamp_ns": time.time_ns(),
            "sequence_number": self.sequence_number,
            "best_bid_micros": best_bid,
            "best_ask_micros": best_ask,
            "spread_micros": spread,
            "bids": bids_l2,
            "asks": asks_l2,
        }

    def get_order(self, order_id: str) -> Optional[Order]:
        return self._orders_by_id.get(order_id)

    # -----------------------------------------------------------------------
    # State Snapshotting & Deterministic Restoration
    # -----------------------------------------------------------------------

    def create_snapshot(self) -> Dict[str, Any]:
        """Serializes complete book state for checkpointing and zero-loss crash recovery."""
        orders_dump = []
        for o in self._orders_by_id.values():
            orders_dump.append({
                "order_id": o.order_id,
                "symbol": o.symbol,
                "side": o.side.value,
                "order_type": o.order_type.value,
                "price_micros": o.price_micros,
                "initial_qty_micros": o.initial_qty_micros,
                "remaining_qty_micros": o.remaining_qty_micros,
                "filled_qty_micros": o.filled_qty_micros,
                "time_in_force": o.time_in_force.value,
                "client_order_id": o.client_order_id,
                "created_at_ns": o.created_at_ns,
                "status": o.status.value,
            })

        return {
            "symbol": self.symbol,
            "sequence_number": self.sequence_number,
            "previous_hash": self.previous_hash,
            "orders": orders_dump,
            "timestamp_ns": time.time_ns(),
        }

    def restore_snapshot(self, snapshot: Dict[str, Any]) -> None:
        """
        Reconstructs the book state deterministically from snapshot data.
        Clears existing book and restores heaps and order queues in exact sequence.
        """
        self.sequence_number = snapshot["sequence_number"]
        self.previous_hash = snapshot.get("previous_hash", "0" * 64)

        self._bid_heap.clear()
        self._bid_levels.clear()
        self._ask_heap.clear()
        self._ask_levels.clear()
        self._orders_by_id.clear()

        # Re-insert orders preserving time order (FIFO)
        # Sort incoming orders by created_at_ns
        raw_orders = snapshot.get("orders", [])
        raw_orders.sort(key=lambda x: x["created_at_ns"])

        for d in raw_orders:
            order = Order(
                order_id=d["order_id"],
                symbol=d["symbol"],
                side=Side(d["side"]),
                order_type=OrderType(d["order_type"]),
                price_micros=d["price_micros"],
                initial_qty_micros=d["initial_qty_micros"],
                remaining_qty_micros=d["remaining_qty_micros"],
                filled_qty_micros=d["filled_qty_micros"],
                time_in_force=TimeInForce(d["time_in_force"]),
                client_order_id=d.get("client_order_id"),
                created_at_ns=d["created_at_ns"],
                status=OrderStatus(d["status"]),
            )
            self._orders_by_id[order.order_id] = order

            if order.is_active and order.order_type == OrderType.LIMIT:
                self._insert_resting_order(order)
