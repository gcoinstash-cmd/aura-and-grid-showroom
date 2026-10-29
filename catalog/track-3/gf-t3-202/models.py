"""
APEX-202 (FinTech/Quant Series) - High-Frequency Limit Order Book & Liquidity Matching Engine
models.py: Domain Models, Enums, and Fixed-Point Microunit Schemas
License: Permissive Clean-Room MIT Architecture (Zero Copyleft)
"""

from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional, Tuple, Dict, Any
import time

try:
    from pydantic import BaseModel, Field, field_validator
    PYDANTIC_AVAILABLE = True
except ImportError:
    PYDANTIC_AVAILABLE = False

    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)

        def model_dump(self):
            return self.__dict__

    def Field(*args, **kwargs):
        return None

    def field_validator(*args, **kwargs):
        def decorator(f):
            return f
        return decorator


# Scale factor: 10^6 (microunits) -> 1.000000 base point / unit
PRICE_SCALE = 1_000_000
QTY_SCALE = 1_000_000


class Side(str, Enum):
    BUY = "BUY"
    SELL = "SELL"

    @property
    def opposite(self) -> Side:
        return Side.SELL if self == Side.BUY else Side.BUY


class OrderType(str, Enum):
    LIMIT = "LIMIT"
    MARKET = "MARKET"


class TimeInForce(str, Enum):
    GTC = "GTC"  # Good 'Til Cancelled
    IOC = "IOC"  # Immediate or Cancel
    FOK = "FOK"  # Fill or Kill


class OrderStatus(str, Enum):
    NEW = "NEW"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"


class Role(str, Enum):
    ADMIN = "ADMIN"
    TRADER = "TRADER"
    AUDITOR = "AUDITOR"
    READONLY = "READONLY"


# ---------------------------------------------------------------------------
# Core In-Memory Domain Models (Ultra-low overhead dataclasses)
# ---------------------------------------------------------------------------

@dataclass
class Order:
    order_id: str
    symbol: str
    side: Side
    order_type: OrderType
    price_micros: int  # 0 for pure market orders until matched
    initial_qty_micros: int
    remaining_qty_micros: int
    filled_qty_micros: int = 0
    time_in_force: TimeInForce = TimeInForce.GTC
    client_order_id: Optional[str] = None
    created_at_ns: int = field(default_factory=time.time_ns)
    status: OrderStatus = OrderStatus.NEW

    @property
    def is_active(self) -> bool:
        return self.remaining_qty_micros > 0 and self.status in (OrderStatus.NEW, OrderStatus.PARTIALLY_FILLED)


@dataclass
class ExecutionFill:
    fill_id: str
    symbol: str
    price_micros: int
    quantity_micros: int
    settlement_micros: int
    maker_order_id: str
    taker_order_id: str
    maker_side: Side
    taker_side: Side
    timestamp_ns: int
    sequence_number: int


@dataclass
class TradeSettlementEvent:
    sequence_number: int
    fill_id: str
    symbol: str
    price_micros: int
    quantity_micros: int
    settlement_micros: int
    maker_order_id: str
    taker_order_id: str
    maker_side: str
    taker_side: str
    timestamp_ns: int
    checksum_sha256: str


# ---------------------------------------------------------------------------
# API Request & Response Schemas (Pydantic V2)
# ---------------------------------------------------------------------------

class OrderSubmissionRequest(BaseModel):
    symbol: str = Field(..., description="Trading pair symbol, e.g. SYNTH-ALPHA / CORE-PT")
    side: Side = Field(..., description="Order side: BUY or SELL")
    order_type: OrderType = Field(..., description="LIMIT or MARKET")
    price_micros: Optional[int] = Field(None, description="Price in microunits (1 point = 1,000,000 micros). Required for LIMIT.")
    quantity_micros: int = Field(..., gt=0, description="Quantity in microunits (1 unit = 1,000,000 micros).")
    client_order_id: Optional[str] = Field(None, description="Client-provided correlation identifier")
    time_in_force: TimeInForce = Field(default=TimeInForce.GTC, description="GTC, IOC, or FOK")

    @field_validator("price_micros")
    @classmethod
    def validate_price(cls, v: Optional[int], info) -> Optional[int]:
        # Limit orders must have positive price
        order_type = info.data.get("order_type")
        if order_type == OrderType.LIMIT:
            if v is None or v <= 0:
                raise ValueError("price_micros must be > 0 for LIMIT orders")
        return v


class OrderExecutionResponse(BaseModel):
    order_id: str
    symbol: str
    side: Side
    order_type: OrderType
    price_micros: int
    initial_qty_micros: int
    remaining_qty_micros: int
    filled_qty_micros: int
    status: OrderStatus
    fills: List[Dict[str, Any]]
    settlement_events: List[Dict[str, Any]]
    sequence_number: int


class OrderCancellationResponse(BaseModel):
    order_id: str
    symbol: str
    status: OrderStatus
    cancelled_qty_micros: int
    sequence_number: int


class L2SnapshotResponse(BaseModel):
    symbol: str
    timestamp_ns: int
    sequence_number: int
    best_bid_micros: Optional[int] = None
    best_ask_micros: Optional[int] = None
    spread_micros: Optional[int] = None
    # [ [price_micros, aggregated_qty_micros, order_count], ... ]
    bids: List[Tuple[int, int, int]]
    asks: List[Tuple[int, int, int]]


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    engine_time_ns: int
    active_symbols: List[str]
    total_orders_matched: int
    total_fills_generated: int
    current_sequence: int
