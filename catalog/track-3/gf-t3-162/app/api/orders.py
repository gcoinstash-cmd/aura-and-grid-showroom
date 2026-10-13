"""
Ghost FactoryOS Track 3 F1 Skunkworks Engine — GF-T3-162 (Sovereign Ledger)
FastAPI Production Execution Engine & OpenAPI 3.1 Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field, ConfigDict

from app.core.orderbook import LimitOrderBook, OrderSide, OrderType, OrderStatus

router = APIRouter(prefix="/api/v1", tags=["Order Book"])
engine = LimitOrderBook(instrument_id="GF-T3-162")


# ------------------ Pydantic v2 Request/Response Schemas ------------------ #

class LimitOrderRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    client_order_id: str = Field(..., description="Unique client identifier for idempotency", min_length=1, max_length=64)
    side: OrderSide = Field(..., description="BUY or SELL")
    price: float = Field(..., description="Limit price (fixed-point precision up to 8 decimals)", gt=0)
    qty: float = Field(..., description="Order quantity", gt=0)
    order_type: OrderType = Field(default=OrderType.LIMIT, description="Order execution qualification")


class TradeResponse(BaseModel):
    trade_id: str
    seq_num: int
    taker_order_id: str
    maker_order_id: str
    price: float
    qty: float
    taker_side: str
    timestamp_ns: int


class OrderResponse(BaseModel):
    order_id: str
    client_order_id: str
    side: str
    price: float
    qty: float
    filled_qty: float
    remaining_qty: float
    status: str
    timestamp_ns: int


class ExecutionResult(BaseModel):
    order: OrderResponse
    trades: List[TradeResponse]
    latency_microseconds: float


class DepthLevel(BaseModel):
    price: float
    volume: float
    cumulative: float
    orders_count: int


class L2DepthSnapshotResponse(BaseModel):
    instrument_id: str
    seq_num: int
    timestamp_ns: int
    best_bid: Optional[float]
    best_ask: Optional[float]
    spread: Optional[float]
    spread_bps: Optional[float]
    bids: List[DepthLevel]
    asks: List[DepthLevel]


class CancelResponse(BaseModel):
    cancelled: bool
    order_id: str
    message: str


# ------------------ API Endpoints ------------------ #

@router.post(
    "/orders/limit",
    response_model=ExecutionResult,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Limit Order",
    description="Submits a limit order into the continuous double auction matching engine.",
)
async def submit_limit_order(payload: LimitOrderRequest):
    import time
    start_t = time.perf_counter_ns()

    try:
        order, trades = engine.place_limit_order(
            client_order_id=payload.client_order_id,
            side=payload.side,
            price=payload.price,
            qty=payload.qty,
            order_type=payload.order_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    latency_us = (time.perf_counter_ns() - start_t) / 1000.0

    return ExecutionResult(
        order=OrderResponse(
            order_id=order.order_id,
            client_order_id=order.client_order_id,
            side=order.side.value,
            price=order.price_float,
            qty=order.qty_float,
            filled_qty=order.filled_qty_float,
            remaining_qty=order.remaining_qty_fixed / 100_000_000,
            status=order.status.value,
            timestamp_ns=order.timestamp_ns,
        ),
        trades=[
            TradeResponse(
                trade_id=t.trade_id,
                seq_num=t.seq_num,
                taker_order_id=t.taker_order_id,
                maker_order_id=t.maker_order_id,
                price=t.price_float,
                qty=t.qty_float,
                taker_side=t.taker_side.value,
                timestamp_ns=t.timestamp_ns,
            )
            for t in trades
        ],
        latency_microseconds=latency_us,
    )


@router.delete(
    "/orders/{order_id}",
    response_model=CancelResponse,
    summary="Cancel Order by ID",
    description="Cancels an active resting limit order in O(1) time.",
)
async def cancel_order(order_id: str):
    cancelled_order = engine.cancel_order(order_id)
    if not cancelled_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found or already filled/cancelled.",
        )
    return CancelResponse(
        cancelled=True,
        order_id=order_id,
        message="Order successfully cancelled and removed from order book memory.",
    )


@router.get(
    "/book/depth",
    response_model=L2DepthSnapshotResponse,
    summary="L2 Order Book Depth Snapshot",
    description="Retrieves top N price levels for bids and asks with cumulative liquidity.",
)
async def get_book_depth(depth: int = Query(default=100, ge=1, le=500)):
    snapshot = engine.get_l2_depth(depth=depth)
    return snapshot
