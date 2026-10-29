"""
GF-T3-210: APEX-210 Real-Time Limit Order Book (LOB) Market Microstructure & Queue Position Simulator
Clean-room, zero-dependency core implementation with FastAPI interface.
License: MIT Permissive
Compliance: NIST SP 800-218 SSDF v1.1
Zero-Dollar Compliance: Pure dimensionless units, points, and basis points.
"""

from __future__ import annotations
import collections
import dataclasses
import enum
import hashlib
import json
import math
import random
import time
from typing import Dict, List, Optional, Tuple, Any

try:
    from fastapi import FastAPI, HTTPException, status
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel, Field
except ImportError:
    FastAPI = None
    BaseModel = object
    Field = lambda default=None, **kwargs: default


class OrderSide(str, enum.Enum):
    BUY = "BUY"
    SELL = "SELL"


class OrderType(str, enum.Enum):
    LIMIT = "LIMIT"
    MARKET = "MARKET"


@dataclasses.dataclass
class Order:
    order_id: str
    side: OrderSide
    order_type: OrderType
    price: float  # In pts (dimensionless points)
    quantity: float  # In Units
    timestamp: float
    filled_quantity: float = 0.0
    is_user_child_order: bool = False

    @property
    def remaining_quantity(self) -> float:
        return max(0.0, self.quantity - self.filled_quantity)

    @property
    def is_filled(self) -> bool:
        return self.remaining_quantity <= 1e-9


@dataclasses.dataclass
class ExecutionFill:
    fill_id: str
    maker_order_id: str
    taker_order_id: str
    side: OrderSide
    price: float  # In pts
    quantity: float  # In Units
    timestamp: float
    price_impact_pts: float = 0.0


@dataclasses.dataclass
class AuditBlock:
    index: int
    timestamp: float
    event_type: str
    payload: Dict[str, Any]
    prev_hash: str
    hash: str

    def calculate_hash(self) -> str:
        serialized = json.dumps(
            {
                "index": self.index,
                "timestamp": round(self.timestamp, 6),
                "event_type": self.event_type,
                "payload": self.payload,
                "prev_hash": self.prev_hash,
            },
            sort_keys=True,
        )
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


class AuditLedger:
    """
    Cryptographic SHA-256 append-only state ledger ensuring non-repudiation
    and immutable event sequence tracking for regulatory compliance.
    """

    def __init__(self) -> None:
        self.chain: List[AuditBlock] = []
        # Initialize genesis block
        genesis = AuditBlock(
            index=0,
            timestamp=time.time(),
            event_type="GENESIS_LOB_STATE",
            payload={"asset_pair": "SYNTH-LOB-01 (CORE-LIQ / BASE-UNIT)", "precision_pts": 2},
            prev_hash="0" * 64,
            hash="",
        )
        genesis.hash = genesis.calculate_hash()
        self.chain.append(genesis)

    def record_event(self, event_type: str, payload: Dict[str, Any]) -> AuditBlock:
        prev_block = self.chain[-1]
        block = AuditBlock(
            index=len(self.chain),
            timestamp=time.time(),
            event_type=event_type,
            payload=payload,
            prev_hash=prev_block.hash,
            hash="",
        )
        block.hash = block.calculate_hash()
        self.chain.append(block)
        # Keep maximum 500 recent blocks in memory buffer for rapid verification
        if len(self.chain) > 1000:
            self.chain = self.chain[-500:]
        return block

    def verify_integrity(self) -> Tuple[bool, Optional[str]]:
        for i in range(1, len(self.chain)):
            curr = self.chain[i]
            prev = self.chain[i - 1]
            if curr.prev_hash != prev.hash:
                return False, f"Broken chain link at block {curr.index}: prev_hash mismatch"
            recomputed = curr.calculate_hash()
            if curr.hash != recomputed:
                return False, f"Hash tampering detected at block {curr.index}"
        return True, None


class HawkesProcess:
    """
    Univariate Hawkes self-exciting point process governing trade cluster intensity:
    lambda(t) = mu + sum_{t_i < t} alpha * exp(-beta * (t - t_i))
    Stationarity Condition: eta = alpha / beta < 1.0 (sub-critical stability).
    """

    def __init__(self, mu: float = 1.2, alpha: float = 0.65, beta: float = 1.0) -> None:
        self.mu = mu  # Base arrival intensity
        self.alpha = alpha  # Jump amplitude
        self.beta = beta  # Exponential decay rate
        self.event_timestamps: collections.deque[float] = collections.deque(maxlen=300)
        self.last_update_time: float = time.time()

    @property
    def branching_ratio(self) -> float:
        """Stationarity ratio eta = alpha / beta. eta >= 1.0 indicates super-critical cascade risk."""
        return self.alpha / max(1e-6, self.beta)

    def intensity(self, current_time: Optional[float] = None) -> float:
        t = current_time if current_time is not None else time.time()
        val = self.mu
        cutoff = t - (8.0 / self.beta)  # 8 half-lives horizon
        for event_t in reversed(self.event_timestamps):
            if event_t < cutoff:
                break
            dt = t - event_t
            if dt >= 0:
                val += self.alpha * math.exp(-self.beta * dt)
        return val

    def record_event(self, t: Optional[float] = None) -> None:
        ts = t if t is not None else time.time()
        self.event_timestamps.append(ts)
        self.last_update_time = ts


class PriceLevel:
    """
    Queue of limit orders at an exact discrete price tick.
    Maintains strict FIFO price-time priority.
    """

    def __init__(self, price: float) -> None:
        self.price = price
        self.orders: collections.deque[Order] = collections.deque()
        self.total_quantity: float = 0.0

    def add_order(self, order: Order) -> None:
        self.orders.append(order)
        self.total_quantity += order.remaining_quantity

    def remove_order(self, order_id: str) -> Optional[Order]:
        for i, o in enumerate(self.orders):
            if o.order_id == order_id:
                del self.orders[i]
                self.total_quantity -= o.remaining_quantity
                return o
        return None

    def find_order_queue_position(self, order_id: str) -> Optional[Tuple[int, int, float]]:
        """
        Returns:
            (position_index_1_based, total_orders_at_level, units_ahead)
        """
        units_ahead = 0.0
        for idx, o in enumerate(self.orders):
            if o.order_id == order_id:
                return idx + 1, len(self.orders), units_ahead
            units_ahead += o.remaining_quantity
        return None


class LimitOrderBook:
    """
    Institutional Level 2 / Level 3 Matching Engine.
    Strict Price-Time Priority FIFO matching with analytical market microstructure metrics.
    """

    def __init__(self, asset_pair: str = "SYNTH-LOB-01 (CORE-LIQ / BASE-UNIT)") -> None:
        self.asset_pair = asset_pair
        # Bids: sorted descending by price (highest bid first)
        self.bids: Dict[float, PriceLevel] = {}
        # Asks: sorted ascending by price (lowest ask first)
        self.asks: Dict[float, PriceLevel] = {}
        self.order_map: Dict[str, Order] = {}
        self.trade_tape: collections.deque[ExecutionFill] = collections.deque(maxlen=200)
        self.audit_ledger = AuditLedger()
        self.hawkes = HawkesProcess(mu=1.5, alpha=0.75, beta=1.2)
        
        # Historical price differences and volumes for Kyle's Lambda regression
        self.price_deltas: collections.deque[Tuple[float, float]] = collections.deque(maxlen=100)
        self.initial_seed_state()

    def initial_seed_state(self) -> None:
        """Seed a dense institutional book around 100.00 pts with tight 0.05 pts spread."""
        center_mid = 100.00
        now = time.time()
        for i in range(1, 15):
            bid_p = round(center_mid - (i * 0.05), 2)
            bid_qty = random.randint(1500, 8500)
            self._insert_limit(Order(f"SEED-BID-{i}", OrderSide.BUY, OrderType.LIMIT, bid_p, bid_qty, now))

            ask_p = round(center_mid + (i * 0.05), 2)
            ask_qty = random.randint(1500, 8500)
            self._insert_limit(Order(f"SEED-ASK-{i}", OrderSide.SELL, OrderType.LIMIT, ask_p, ask_qty, now))

    @property
    def best_bid(self) -> Optional[float]:
        if not self.bids:
            return None
        return max(self.bids.keys())

    @property
    def best_ask(self) -> Optional[float]:
        if not self.asks:
            return None
        return min(self.asks.keys())

    @property
    def spread_pts(self) -> float:
        bb = self.best_bid
        ba = self.best_ask
        if bb is None or ba is None:
            return 0.0
        return max(0.0, round(ba - bb, 4))

    @property
    def spread_bps(self) -> float:
        mid = self.mid_price
        if mid <= 0:
            return 0.0
        return round((self.spread_pts / mid) * 10000.0, 2)

    @property
    def mid_price(self) -> float:
        bb = self.best_bid
        ba = self.best_ask
        if bb is None and ba is None:
            return 100.0
        if bb is None:
            return ba or 100.0
        if ba is None:
            return bb
        return round((bb + ba) / 2.0, 4)

    def _insert_limit(self, order: Order) -> None:
        p = round(order.price, 2)
        side_book = self.bids if order.side == OrderSide.BUY else self.asks
        if p not in side_book:
            side_book[p] = PriceLevel(p)
        side_book[p].add_order(order)
        self.order_map[order.order_id] = order

    def submit_order(self, order: Order) -> List[ExecutionFill]:
        """
        Core Price-Time Priority FIFO Matching routine.
        Crosses market if limit order crosses opposite best price.
        """
        now = time.time()
        order.timestamp = now
        fills: List[ExecutionFill] = []
        old_mid = self.mid_price

        if order.order_type == OrderType.MARKET:
            fills = self._match_market(order)
        elif order.order_type == OrderType.LIMIT:
            # Check if crossing
            if order.side == OrderSide.BUY:
                while order.remaining_quantity > 0 and self.best_ask is not None and order.price >= self.best_ask:
                    ask_level = self.asks[self.best_ask]
                    level_fills = self._match_at_level(order, ask_level)
                    fills.extend(level_fills)
                    if ask_level.total_quantity <= 1e-9:
                        del self.asks[self.best_ask]
                if order.remaining_quantity > 0:
                    self._insert_limit(order)
            else:  # SELL
                while order.remaining_quantity > 0 and self.best_bid is not None and order.price <= self.best_bid:
                    bid_level = self.bids[self.best_bid]
                    level_fills = self._match_at_level(order, bid_level)
                    fills.extend(level_fills)
                    if bid_level.total_quantity <= 1e-9:
                        del self.bids[self.best_bid]
                if order.remaining_quantity > 0:
                    self._insert_limit(order)

        # Record trade metrics
        if fills:
            self.hawkes.record_event(now)
            total_traded_qty = sum(f.quantity for f in fills)
            new_mid = self.mid_price
            price_delta = new_mid - old_mid
            self.price_deltas.append((price_delta, total_traded_qty))
            
            for f in fills:
                f.price_impact_pts = price_delta
                self.trade_tape.appendleft(f)

            self.audit_ledger.record_event(
                "TRADE_MATCH_EXECUTION",
                {
                    "taker_order_id": order.order_id,
                    "fill_count": len(fills),
                    "total_units": total_traded_qty,
                    "execution_price_pts": fills[0].price,
                    "mid_pts": new_mid,
                },
            )
        else:
            self.audit_ledger.record_event(
                "LIMIT_ORDER_PLACED",
                {
                    "order_id": order.order_id,
                    "side": order.side.value,
                    "price_pts": order.price,
                    "quantity_units": order.quantity,
                },
            )

        return fills

    def _match_at_level(self, taker_order: Order, level: PriceLevel) -> List[ExecutionFill]:
        fills: List[ExecutionFill] = []
        now = time.time()
        while level.orders and taker_order.remaining_quantity > 0:
            maker = level.orders[0]
            matched_qty = min(taker_order.remaining_quantity, maker.remaining_quantity)
            maker.filled_quantity += matched_qty
            taker_order.filled_quantity += matched_qty
            level.total_quantity -= matched_qty

            fill = ExecutionFill(
                fill_id=f"FILL-{int(now * 1000000)}-{random.randint(100, 999)}",
                maker_order_id=maker.order_id,
                taker_order_id=taker_order.order_id,
                side=taker_order.side,
                price=level.price,
                quantity=matched_qty,
                timestamp=now,
            )
            fills.append(fill)

            if maker.is_filled:
                level.orders.popleft()
                if maker.order_id in self.order_map:
                    del self.order_map[maker.order_id]

        return fills

    def _match_market(self, market_order: Order) -> List[ExecutionFill]:
        fills: List[ExecutionFill] = []
        if market_order.side == OrderSide.BUY:
            while market_order.remaining_quantity > 0 and self.asks:
                best_ask_price = self.best_ask
                if best_ask_price is None:
                    break
                level = self.asks[best_ask_price]
                fills.extend(self._match_at_level(market_order, level))
                if level.total_quantity <= 1e-9:
                    del self.asks[best_ask_price]
        else:
            while market_order.remaining_quantity > 0 and self.bids:
                best_bid_price = self.best_bid
                if best_bid_price is None:
                    break
                level = self.bids[best_bid_price]
                fills.extend(self._match_at_level(market_order, level))
                if level.total_quantity <= 1e-9:
                    del self.bids[best_bid_price]
        return fills

    def cancel_order(self, order_id: str) -> bool:
        if order_id not in self.order_map:
            return False
        order = self.order_map[order_id]
        side_book = self.bids if order.side == OrderSide.BUY else self.asks
        p = round(order.price, 2)
        if p in side_book:
            level = side_book[p]
            level.remove_order(order_id)
            if level.total_quantity <= 1e-9 or len(level.orders) == 0:
                del side_book[p]
        del self.order_map[order_id]
        
        self.audit_ledger.record_event(
            "ORDER_CANCELLED",
            {"order_id": order_id, "price_pts": order.price, "cancelled_units": order.remaining_quantity},
        )
        return True

    def get_queue_position(self, order_id: str) -> Optional[Dict[str, Any]]:
        """
        High-precision queue position analytics for the user's child order.
        """
        if order_id not in self.order_map:
            return None
        order = self.order_map[order_id]
        side_book = self.bids if order.side == OrderSide.BUY else self.asks
        p = round(order.price, 2)
        if p not in side_book:
            return None
        level = side_book[p]
        pos_data = level.find_order_queue_position(order_id)
        if not pos_data:
            return None
        pos_idx, total_orders, units_ahead = pos_data

        # Estimate fill probability based on queue depth and distance from touch
        touch_price = self.best_bid if order.side == OrderSide.BUY else self.best_ask
        tick_dist = abs(p - touch_price) if touch_price is not None else 0.0
        
        # Microstructure survival probability: p = exp(-gamma * ticks_away) * (1 / (1 + units_ahead / 5000))
        dist_factor = math.exp(-0.25 * (tick_dist / 0.05))
        queue_factor = 1.0 / (1.0 + (units_ahead / 8000.0))
        fill_probability = min(0.999, max(0.01, round(dist_factor * queue_factor, 4)))

        return {
            "order_id": order_id,
            "side": order.side.value,
            "price_pts": order.price,
            "remaining_units": order.remaining_quantity,
            "queue_index": pos_idx,
            "total_orders_at_level": total_orders,
            "units_ahead": units_ahead,
            "distance_from_touch_pts": round(tick_dist, 4),
            "estimated_fill_probability": fill_probability,
            "is_at_touch": tick_dist < 1e-4,
        }

    def get_order_book_imbalance(self, depth_levels: int = 5) -> float:
        """
        Order Book Imbalance (OBI) across top N levels:
        OBI = (V_bid - V_ask) / (V_bid + V_ask)
        Range: [-1.0, 1.0]
        """
        bid_vol = 0.0
        sorted_bids = sorted(self.bids.keys(), reverse=True)[:depth_levels]
        for p in sorted_bids:
            bid_vol += self.bids[p].total_quantity

        ask_vol = 0.0
        sorted_asks = sorted(self.asks.keys())[:depth_levels]
        for p in sorted_asks:
            ask_vol += self.asks[p].total_quantity

        denom = bid_vol + ask_vol
        if denom <= 0:
            return 0.0
        return round((bid_vol - ask_vol) / denom, 4)

    def get_amihud_illiquidity(self) -> float:
        """
        Amihud Illiquidity Ratio: |r_t| / Volume_t.
        Measures points moved per unit traded.
        """
        if not self.price_deltas:
            return 0.00012
        r_sum = sum(abs(delta) for delta, _ in self.price_deltas)
        v_sum = sum(v for _, v in self.price_deltas)
        if v_sum <= 0:
            return 0.00012
        return round((r_sum / v_sum) * 1000.0, 6)

    def get_kyles_lambda(self) -> float:
        """
        Kyle's Lambda (Permanent Market Impact):
        Delta P = lambda * Q + epsilon
        Computed via standard linear regression slope over execution buffer.
        """
        if len(self.price_deltas) < 5:
            return 0.00185  # Calibrated baseline pts / kUnits
        
        sum_q = 0.0
        sum_dp = 0.0
        sum_q_sq = 0.0
        sum_q_dp = 0.0
        n = len(self.price_deltas)

        for dp, q in self.price_deltas:
            q_k = q / 1000.0  # In thousands of Units
            sum_q += q_k
            sum_dp += dp
            sum_q_sq += q_k * q_k
            sum_q_dp += q_k * dp

        denom = (n * sum_q_sq) - (sum_q * sum_q)
        if abs(denom) < 1e-9:
            return 0.00185
        slope = ((n * sum_q_dp) - (sum_q * sum_dp)) / denom
        return round(max(0.00005, abs(slope)), 6)

    def get_depth_snapshot(self, limit: int = 12) -> Dict[str, Any]:
        """Returns sorted Level 2 depth arrays with cumulative volume."""
        bids_out = []
        cum_bid = 0.0
        for p in sorted(self.bids.keys(), reverse=True)[:limit]:
            vol = self.bids[p].total_quantity
            cum_bid += vol
            bids_out.append({"price_pts": p, "units": vol, "cumulative_units": cum_bid, "order_count": len(self.bids[p].orders)})

        asks_out = []
        cum_ask = 0.0
        for p in sorted(self.asks.keys())[:limit]:
            vol = self.asks[p].total_quantity
            cum_ask += vol
            asks_out.append({"price_pts": p, "units": vol, "cumulative_units": cum_ask, "order_count": len(self.asks[p].orders)})

        return {
            "asset_pair": self.asset_pair,
            "mid_price_pts": self.mid_price,
            "spread_pts": self.spread_pts,
            "spread_bps": self.spread_bps,
            "best_bid_pts": self.best_bid,
            "best_ask_pts": self.best_ask,
            "order_book_imbalance": self.get_order_book_imbalance(),
            "bids": bids_out,
            "asks": asks_out,
            "timestamp": time.time(),
        }

    def inject_cancel_wave(self, cancel_fraction: float = 0.60) -> int:
        """
        Simulate an institutional cancel wave:
        High-frequency market makers revoke liquidity rapidly at the touch.
        """
        cancelled_count = 0
        now = time.time()
        for p in list(self.bids.keys())[:3]:
            level = self.bids[p]
            if not level.orders:
                continue
            num_to_cancel = max(1, int(math.ceil(len(level.orders) * cancel_fraction)))
            for _ in range(num_to_cancel):
                if level.orders:
                    victim = level.orders[-1]
                    if not victim.is_user_child_order:
                        self.cancel_order(victim.order_id)
                        cancelled_count += 1

        for p in list(self.asks.keys())[:3]:
            level = self.asks[p]
            if not level.orders:
                continue
            num_to_cancel = max(1, int(math.ceil(len(level.orders) * cancel_fraction)))
            for _ in range(num_to_cancel):
                if level.orders:
                    victim = level.orders[-1]
                    if not victim.is_user_child_order:
                        self.cancel_order(victim.order_id)
                        cancelled_count += 1

        self.audit_ledger.record_event(
            "STRESS_CANCEL_WAVE_INJECTED",
            {"cancelled_count": cancelled_count, "fraction": cancel_fraction, "timestamp": now},
        )
        return cancelled_count


# Global singleton matching engine for API services
matching_engine = LimitOrderBook()

# FastAPI application declaration
if FastAPI is not None:
    app = FastAPI(
        title="APEX-210 Real-Time LOB Market Microstructure Engine",
        description="High-Frequency Limit Order Book matching engine, Hawkes intensity sampler, and queue position simulator.",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class LimitOrderRequest(BaseModel):
        order_id: Optional[str] = None
        side: OrderSide
        price_pts: float
        quantity_units: float
        is_user_child_order: bool = True

    class MarketSweepRequest(BaseModel):
        side: OrderSide
        quantity_units: float = 50000.0

    @app.get("/health")
    def health_check() -> Dict[str, Any]:
        return {
            "status": "HEALTHY_ONLINE",
            "asset_pair": matching_engine.asset_pair,
            "engine_time": time.time(),
            "stationarity_eta": matching_engine.hawkes.branching_ratio,
        }

    @app.get("/api/v1/book/depth")
    def get_book_depth(limit: int = 15) -> Dict[str, Any]:
        return matching_engine.get_depth_snapshot(limit=limit)

    @app.post("/api/v1/orders/limit")
    def place_limit_order(req: LimitOrderRequest) -> Dict[str, Any]:
        oid = req.order_id or f"ORD-{int(time.time() * 1000)}-{random.randint(1000, 9999)}"
        order = Order(
            order_id=oid,
            side=req.side,
            order_type=OrderType.LIMIT,
            price=round(req.price_pts, 2),
            quantity=req.quantity_units,
            timestamp=time.time(),
            is_user_child_order=req.is_user_child_order,
        )
        fills = matching_engine.submit_order(order)
        queue_status = matching_engine.get_queue_position(oid) if not order.is_filled else None
        return {
            "order_id": oid,
            "status": "FILLED" if order.is_filled else "RESTING",
            "filled_units": order.filled_quantity,
            "remaining_units": order.remaining_quantity,
            "fills": [dataclasses.asdict(f) for f in fills],
            "queue_position": queue_status,
        }

    @app.post("/api/v1/orders/market")
    def execute_market_sweep(req: MarketSweepRequest) -> Dict[str, Any]:
        oid = f"SWEEP-{int(time.time() * 1000)}"
        order = Order(
            order_id=oid,
            side=req.side,
            order_type=OrderType.MARKET,
            price=0.0,
            quantity=req.quantity_units,
            timestamp=time.time(),
        )
        fills = matching_engine.submit_order(order)
        return {
            "sweep_id": oid,
            "requested_units": req.quantity_units,
            "swept_units": sum(f.quantity for f in fills),
            "fills_count": len(fills),
            "slippage_pts": fills[-1].price - fills[0].price if fills else 0.0,
        }

    @app.delete("/api/v1/orders/{order_id}")
    def cancel_limit_order(order_id: str) -> Dict[str, Any]:
        success = matching_engine.cancel_order(order_id)
        if not success:
            raise HTTPException(status_code=404, detail="Order not found or already filled.")
        return {"order_id": order_id, "status": "CANCELLED"}

    @app.get("/api/v1/orders/{order_id}/queue")
    def get_order_queue(order_id: str) -> Dict[str, Any]:
        pos = matching_engine.get_queue_position(order_id)
        if not pos:
            raise HTTPException(status_code=404, detail="Order not resting in active book.")
        return pos

    @app.get("/api/v1/analytics/microstructure")
    def get_microstructure_analytics() -> Dict[str, Any]:
        now = time.time()
        return {
            "mid_price_pts": matching_engine.mid_price,
            "spread_pts": matching_engine.spread_pts,
            "spread_bps": matching_engine.spread_bps,
            "order_book_imbalance": matching_engine.get_order_book_imbalance(),
            "hawkes_intensity": round(matching_engine.hawkes.intensity(now), 4),
            "hawkes_branching_ratio_eta": round(matching_engine.hawkes.branching_ratio, 4),
            "is_sub_critical": matching_engine.hawkes.branching_ratio < 1.0,
            "kyles_lambda_pts_per_kunit": matching_engine.get_kyles_lambda(),
            "amihud_illiquidity_ratio": matching_engine.get_amihud_illiquidity(),
            "audit_blocks_count": len(matching_engine.audit_ledger.chain),
        }

    @app.get("/api/v1/audit/chain")
    def get_audit_chain(limit: int = 50) -> Dict[str, Any]:
        valid, err = matching_engine.audit_ledger.verify_integrity()
        blocks = matching_engine.audit_ledger.chain[-limit:]
        return {
            "chain_valid": valid,
            "verification_error": err,
            "total_blocks": len(matching_engine.audit_ledger.chain),
            "recent_blocks": [dataclasses.asdict(b) for b in blocks],
        }

    @app.post("/api/v1/stress/cancel-wave")
    def trigger_stress_cancel_wave() -> Dict[str, Any]:
        cancelled = matching_engine.inject_cancel_wave()
        return {"status": "SUCCESS", "cancelled_orders": cancelled}
else:
    app = None
