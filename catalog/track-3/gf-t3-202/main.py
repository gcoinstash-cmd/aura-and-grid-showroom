"""
APEX-202 (FinTech/Quant Series) - High-Frequency Limit Order Book & Liquidity Matching Engine
main.py: Enterprise FastAPI Microservice & RBAC Gateway
License: Permissive Clean-Room MIT Architecture (Zero Copyleft)
"""

from __future__ import annotations
import os
import time
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException, Header, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from models import (
    Side,
    OrderType,
    TimeInForce,
    OrderStatus,
    Role,
    OrderSubmissionRequest,
    OrderExecutionResponse,
    OrderCancellationResponse,
    L2SnapshotResponse,
    HealthResponse,
)
from order_book import OrderBook

# ---------------------------------------------------------------------------
# App Initialization & OpenAPI 3.1 Metadata
# ---------------------------------------------------------------------------

app = FastAPI(
    title="APEX-202 High-Frequency Limit Order Book & Matching Engine",
    description=(
        "Ghost FactoryOS Track 3 Quantitative Engine: Deterministic Price-Time Priority (FIFO) "
        "matching engine with 64-bit integer microunit fixed-point arithmetic (zero floating-point drift), "
        "O(1) best bid/ask access, and cryptographically chained trade settlement audit logs."
    ),
    version="1.0.0",
    license_info={
        "name": "MIT Clean-Room Architecture",
        "url": "https://opensource.org/licenses/MIT",
    },
)

# CORS setup for institutional quantitative terminal integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# In-Memory Multi-Symbol Order Book Registry
# ---------------------------------------------------------------------------

_BOOKS: Dict[str, OrderBook] = {}

def get_or_create_book(symbol: str) -> OrderBook:
    symbol_clean = symbol.upper().strip()
    if symbol_clean not in _BOOKS:
        _BOOKS[symbol_clean] = OrderBook(symbol_clean)
    return _BOOKS[symbol_clean]

# Pre-seed default quantitative synthetic pairs
for default_sym in ["SYNTH-ALPHA / CORE-PT", "SYNTH-BETA / CORE-PT", "PAIR-202-A"]:
    get_or_create_book(default_sym)

# ---------------------------------------------------------------------------
# RBAC & API Key Authentication Scaffold
# ---------------------------------------------------------------------------

VALID_API_KEYS: Dict[str, Role] = {
    "apex-admin-key-992": Role.ADMIN,
    "apex-trader-key-101": Role.TRADER,
    "apex-auditor-key-505": Role.AUDITOR,
    "apex-public-demo-key": Role.TRADER,  # Default demo key
}

def authenticate_user(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    x_role: Optional[str] = Header(None, alias="X-Role"),
) -> Role:
    """
    Validates API Key and resolves user RBAC role.
    Defaults to TRADER role for seamless developer integration if key is omitted or demo.
    """
    if not x_api_key:
        # Default development fallback to TRADER
        return Role.TRADER

    if x_api_key in VALID_API_KEYS:
        assigned_role = VALID_API_KEYS[x_api_key]
        if x_role and x_role.upper() in [r.value for r in Role]:
            requested_role = Role(x_role.upper())
            # Admin can assume any role
            if assigned_role == Role.ADMIN:
                return requested_role
        return assigned_role

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or unauthorized X-API-Key header",
    )


def require_role(min_role: Role):
    """Enforces role hierarchy: ADMIN > TRADER >= AUDITOR >= READONLY"""
    role_hierarchy = {
        Role.ADMIN: 4,
        Role.TRADER: 3,
        Role.AUDITOR: 2,
        Role.READONLY: 1,
    }

    def role_checker(current_role: Role = Depends(authenticate_user)):
        if role_hierarchy.get(current_role, 0) < role_hierarchy.get(min_role, 0):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires role {min_role.value}; current role is {current_role.value}",
            )
        return current_role

    return role_checker


# ---------------------------------------------------------------------------
# REST Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/v1/health", response_model=HealthResponse, tags=["System"])
def get_health():
    """Engine operational status, active trading pairs, and sequence state."""
    total_orders = sum(len(b._orders_by_id) for b in _BOOKS.values())
    total_trades = sum(len(b.trade_history) for b in _BOOKS.values())
    max_seq = max((b.sequence_number for b in _BOOKS.values()), default=0)

    return HealthResponse(
        status="OPERATIONAL",
        service="APEX-202-LOB-MATCHING-ENGINE",
        version="1.0.0",
        engine_time_ns=time.time_ns(),
        active_symbols=list(_BOOKS.keys()),
        total_orders_matched=total_orders,
        total_fills_generated=total_trades,
        current_sequence=max_seq,
    )


@app.post("/api/v1/orders", response_model=OrderExecutionResponse, tags=["Order Management"])
def submit_order(
    req: OrderSubmissionRequest,
    current_role: Role = Depends(require_role(Role.TRADER)),
):
    """
    Submit a new LIMIT or MARKET order into the deterministic matching engine.
    Crosses the book if aggressive, or rests on the book with Price-Time FIFO priority.
    """
    book = get_or_create_book(req.symbol)

    try:
        order, fills, settlement_events = book.submit_order(
            side=req.side,
            order_type=req.order_type,
            quantity_micros=req.quantity_micros,
            price_micros=req.price_micros,
            time_in_force=req.time_in_force,
            client_order_id=req.client_order_id,
        )

        fills_dict = [
            {
                "fill_id": f.fill_id,
                "symbol": f.symbol,
                "price_micros": f.price_micros,
                "quantity_micros": f.quantity_micros,
                "settlement_micros": f.settlement_micros,
                "maker_order_id": f.maker_order_id,
                "taker_order_id": f.taker_order_id,
                "maker_side": f.maker_side.value,
                "taker_side": f.taker_side.value,
                "timestamp_ns": f.timestamp_ns,
                "sequence_number": f.sequence_number,
            }
            for f in fills
        ]

        settlement_dict = [
            {
                "sequence_number": e.sequence_number,
                "fill_id": e.fill_id,
                "symbol": e.symbol,
                "price_micros": e.price_micros,
                "quantity_micros": e.quantity_micros,
                "settlement_micros": e.settlement_micros,
                "maker_order_id": e.maker_order_id,
                "taker_order_id": e.taker_order_id,
                "maker_side": e.maker_side,
                "taker_side": e.taker_side,
                "timestamp_ns": e.timestamp_ns,
                "checksum_sha256": e.checksum_sha256,
            }
            for e in settlement_events
        ]

        return OrderExecutionResponse(
            order_id=order.order_id,
            symbol=order.symbol,
            side=order.side,
            order_type=order.order_type,
            price_micros=order.price_micros,
            initial_qty_micros=order.initial_qty_micros,
            remaining_qty_micros=order.remaining_qty_micros,
            filled_qty_micros=order.filled_qty_micros,
            status=order.status,
            fills=fills_dict,
            settlement_events=settlement_dict,
            sequence_number=book.sequence_number,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@app.delete("/api/v1/orders/{order_id}", response_model=OrderCancellationResponse, tags=["Order Management"])
def cancel_order(
    order_id: str,
    symbol: str = Query(..., description="Trading pair symbol"),
    current_role: Role = Depends(require_role(Role.TRADER)),
):
    """
    Cancel an active resting order from the book in O(1) / O(log P).
    """
    book = get_or_create_book(symbol)
    success, order, seq = book.cancel_order(order_id)

    if not success or order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_id}' not found or already in terminal state",
        )

    return OrderCancellationResponse(
        order_id=order.order_id,
        symbol=order.symbol,
        status=order.status,
        cancelled_qty_micros=order.initial_qty_micros - order.filled_qty_micros,
        sequence_number=seq,
    )


@app.get("/api/v1/orders/{order_id}", tags=["Order Management"])
def get_order_status(
    order_id: str,
    symbol: Optional[str] = Query(None, description="Optional symbol to optimize search"),
):
    """Fetch order status by ID."""
    target_books = [get_or_create_book(symbol)] if symbol else list(_BOOKS.values())
    for b in target_books:
        order = b.get_order(order_id)
        if order:
            return {
                "order_id": order.order_id,
                "symbol": order.symbol,
                "side": order.side.value,
                "order_type": order.order_type.value,
                "price_micros": order.price_micros,
                "initial_qty_micros": order.initial_qty_micros,
                "remaining_qty_micros": order.remaining_qty_micros,
                "filled_qty_micros": order.filled_qty_micros,
                "status": order.status.value,
                "created_at_ns": order.created_at_ns,
                "time_in_force": order.time_in_force.value,
                "client_order_id": order.client_order_id,
            }

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order '{order_id}' not found")


@app.get("/api/v1/book/{symbol}/l2", response_model=L2SnapshotResponse, tags=["Market Data"])
def get_l2_snapshot(
    symbol: str,
    depth: int = Query(20, ge=1, le=100, description="Depth level limit"),
):
    """Aggregated Level 2 order book snapshot sorted by price priority."""
    book = get_or_create_book(symbol)
    return book.get_l2_snapshot(depth=depth)


@app.get("/api/v1/trades/{symbol}", tags=["Market Data"])
def get_trades(
    symbol: str,
    limit: int = Query(100, ge=1, le=1000, description="Max trade events to return"),
):
    """Cryptographically chained deterministic trade settlement audit log."""
    book = get_or_create_book(symbol)
    history = book.trade_history[-limit:]
    return [
        {
            "sequence_number": t.sequence_number,
            "fill_id": t.fill_id,
            "symbol": t.symbol,
            "price_micros": t.price_micros,
            "quantity_micros": t.quantity_micros,
            "settlement_micros": t.settlement_micros,
            "maker_order_id": t.maker_order_id,
            "taker_order_id": t.taker_order_id,
            "maker_side": t.maker_side,
            "taker_side": t.taker_side,
            "timestamp_ns": t.timestamp_ns,
            "checksum_sha256": t.checksum_sha256,
        }
        for t in reversed(history)
    ]


@app.post("/api/v1/book/{symbol}/snapshot", tags=["Audit & Persistence"])
def create_state_snapshot(
    symbol: str,
    current_role: Role = Depends(require_role(Role.ADMIN)),
):
    """Create a complete bit-exact JSON snapshot of engine state."""
    book = get_or_create_book(symbol)
    snapshot = book.create_snapshot()
    return {
        "status": "SNAPSHOT_CREATED",
        "symbol": symbol,
        "snapshot": snapshot,
    }


class RestoreSnapshotPayload(BaseModel):
    snapshot: Dict[str, Any]


@app.post("/api/v1/book/{symbol}/restore", tags=["Audit & Persistence"])
def restore_state_snapshot(
    symbol: str,
    payload: RestoreSnapshotPayload,
    current_role: Role = Depends(require_role(Role.ADMIN)),
):
    """Restore order book state from a serialized snapshot."""
    book = get_or_create_book(symbol)
    book.restore_snapshot(payload.snapshot)
    return {
        "status": "RESTORED",
        "symbol": symbol,
        "sequence_number": book.sequence_number,
    }


@app.post("/api/v1/book/{symbol}/reset", tags=["Audit & Persistence"])
def reset_book(
    symbol: str,
    current_role: Role = Depends(require_role(Role.ADMIN)),
):
    """Clears all orders and resets sequence numbers for testing and benchmarking."""
    clean_sym = symbol.upper().strip()
    _BOOKS[clean_sym] = OrderBook(clean_sym)
    return {"status": "BOOK_RESET", "symbol": clean_sym}
