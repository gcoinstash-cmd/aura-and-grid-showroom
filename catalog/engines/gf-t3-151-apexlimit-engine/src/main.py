"""
ApexLimit Engine - GF-T3-151
FastAPI High-Performance Async Gateway & Microsecond Execution Ingress.

SPDX-License-Identifier: Apache-2.0 / MIT
Clean-Room Certified: Strict Permissive, Zero Copyleft.
"""

from __future__ import annotations
import logging
import sys
import time
import uuid
from typing import Any, Dict, List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status, Query, Path, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from src.core.matching_engine import (
    MatchingEngine,
    Order,
    OrderSide,
    OrderType,
    OrderStatus,
    Trade,
    to_scaled,
    from_scaled,
)
from src.core.risk_manager import (
    RiskManager,
    MarginState,
)


# Structured JSON Logging Setup
logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","message":"%(message)s"}',
    stream=sys.stdout,
)
logger = logging.getLogger("apexlimit.gateway")

# Global Engine Singletons
engine = MatchingEngine()
risk_manager = RiskManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing ApexLimit Engine GF-T3-151 Core...")
    # Pre-seed initial default liquidity for demo symbols
    default_acc_maker = "00000000-0000-0000-0000-000000000001"
    risk_manager.register_account(default_acc_maker, client_label="institutional_mm_1", initial_cash=10_000_000.0)

    # Seed BTC-USD resting book
    seed_bids = [
        (64950.0, 1.5),
        (64900.0, 2.0),
        (64850.0, 3.2),
        (64800.0, 5.0),
        (64750.0, 8.5),
    ]
    seed_asks = [
        (65050.0, 1.2),
        (65100.0, 2.5),
        (65150.0, 3.0),
        (65200.0, 4.8),
        (65250.0, 7.0),
    ]

    for p, q in seed_bids:
        o = Order(
            order_id=str(uuid.uuid4()),
            client_order_id=f"seed_bid_{p}",
            account_id=default_acc_maker,
            symbol="BTC-USD",
            side=OrderSide.BUY,
            order_type=OrderType.LIMIT,
            price_scaled=to_scaled(p),
            quantity_scaled=to_scaled(q),
        )
        engine.submit_order(o)

    for p, q in seed_asks:
        o = Order(
            order_id=str(uuid.uuid4()),
            client_order_id=f"seed_ask_{p}",
            account_id=default_acc_maker,
            symbol="BTC-USD",
            side=OrderSide.SELL,
            order_type=OrderType.LIMIT,
            price_scaled=to_scaled(p),
            quantity_scaled=to_scaled(q),
        )
        engine.submit_order(o)

    logger.info("Pre-seeded initial institutional liquidity in BTC-USD orderbook")
    yield
    logger.info("ApexLimit Engine gracefully shutting down...")


app = FastAPI(
    title="ApexLimit HFT Matching & Risk Engine (GF-T3-151)",
    description="Microsecond-grade order matching and real-time risk liquidation engine. Clean-room certified, zero copyleft.",
    version="1.0.0-PROD",
    lifespan=lifespan,
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception at {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"error_code": "INTERNAL_ENGINE_ERROR", "message": str(exc)},
    )


# ---------------------------------------------------------
# Pydantic Request & Response Models (OpenAPI 3.1)
# ---------------------------------------------------------

class OrderSubmissionRequest(BaseModel):
    client_order_id: str = Field(..., description="Unique client-supplied idempotency key")
    account_id: str = Field(..., description="Trading account UUID")
    symbol: str = Field(default="BTC-USD", description="Market symbol, e.g. BTC-USD")
    side: OrderSide = Field(..., description="Order side: BUY or SELL")
    order_type: OrderType = Field(default=OrderType.LIMIT, description="LIMIT, MARKET, or STOP_LIMIT")
    price: float = Field(..., gt=0, description="Order price in quote currency (will be scaled to 10^8)")
    quantity: float = Field(..., gt=0, description="Base asset quantity (will be scaled to 10^8)")
    stop_price: Optional[float] = Field(None, gt=0, description="Stop trigger price for STOP_LIMIT")


class TradeExecutionDTO(BaseModel):
    trade_id: str
    symbol: str
    price: float
    quantity: float
    notional: float
    maker_order_id: str
    taker_order_id: str
    maker_account_id: str
    taker_account_id: str
    executed_at_ns: int


class OrderResponseDTO(BaseModel):
    order_id: str
    client_order_id: str
    account_id: str
    symbol: str
    side: OrderSide
    order_type: OrderType
    price: float
    quantity: float
    filled_quantity: float
    remaining_quantity: float
    status: OrderStatus
    margin_locked: float
    trades: List[TradeExecutionDTO] = []
    created_at_ns: int
    updated_at_ns: int


class DepositRequest(BaseModel):
    account_id: str
    amount: float = Field(..., gt=0)
    asset_id: str = Field(default="USD")


class MarkPriceUpdate(BaseModel):
    symbol: str
    price: float = Field(..., gt=0)


# ---------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------

@app.get("/health", tags=["Telemetry"])
@app.get("/healthz", tags=["Telemetry"])
def get_health() -> Dict[str, Any]:
    """Engine telemetry, latency metrics, and memory fence state."""
    return engine.get_telemetry()


@app.post(
    "/v1/orders",
    response_model=OrderResponseDTO,
    status_code=status.HTTP_201_CREATED,
    tags=["Trading Operations"],
    summary="Submit Limit, Market, or Stop Order",
)
def submit_order(req: OrderSubmissionRequest) -> OrderResponseDTO:
    """
    Submit order to matching core.
    Executes synchronous Pre-Trade Risk checks before matching.
    """
    price_scaled = to_scaled(req.price)
    qty_scaled = to_scaled(req.quantity)
    stop_scaled = to_scaled(req.stop_price) if req.stop_price else None
    order_id = str(uuid.uuid4())

    # Step 1: Pre-Trade Risk Validation
    approved, err_msg, locked_margin_scaled = risk_manager.validate_pre_trade_order(
        account_id=req.account_id,
        order_id=order_id,
        symbol=req.symbol,
        side=req.side,
        price_scaled=price_scaled,
        quantity_scaled=qty_scaled,
    )

    if not approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": "PRE_TRADE_RISK_REJECTION", "message": err_msg},
        )

    # Step 2: Ingress to Deterministic Matching Engine
    order = Order(
        order_id=order_id,
        client_order_id=req.client_order_id,
        account_id=req.account_id,
        symbol=req.symbol,
        side=req.side,
        order_type=req.order_type,
        price_scaled=price_scaled,
        quantity_scaled=qty_scaled,
        stop_price_scaled=stop_scaled,
    )

    matched_order, trades = engine.submit_order(order)

    # Step 3: Settle Trades in Risk Engine
    trade_dtos: List[TradeExecutionDTO] = []
    for t in trades:
        # Maker settlement
        risk_manager.record_fill(
            account_id=t.maker_account_id,
            symbol=t.symbol,
            side=t.maker_side,
            price_scaled=t.price_scaled,
            quantity_scaled=t.quantity_scaled,
            order_id=t.maker_order_id,
        )
        # Taker settlement
        taker_side = OrderSide.SELL if t.maker_side == OrderSide.BUY else OrderSide.BUY
        risk_manager.record_fill(
            account_id=t.taker_account_id,
            symbol=t.symbol,
            side=taker_side,
            price_scaled=t.price_scaled,
            quantity_scaled=t.quantity_scaled,
            order_id=t.taker_order_id,
        )

        trade_dtos.append(
            TradeExecutionDTO(
                trade_id=t.trade_id,
                symbol=t.symbol,
                price=from_scaled(t.price_scaled),
                quantity=from_scaled(t.quantity_scaled),
                notional=from_scaled(t.notional_scaled),
                maker_order_id=t.maker_order_id,
                taker_order_id=t.taker_order_id,
                maker_account_id=t.maker_account_id,
                taker_account_id=t.taker_account_id,
                executed_at_ns=t.executed_at_ns,
            )
        )

    # If completely filled, release any residual margin lock on taker order
    if matched_order.status == OrderStatus.FILLED:
        risk_manager.release_order_margin(req.account_id, order_id)

    return OrderResponseDTO(
        order_id=matched_order.order_id,
        client_order_id=matched_order.client_order_id,
        account_id=matched_order.account_id,
        symbol=matched_order.symbol,
        side=matched_order.side,
        order_type=matched_order.order_type,
        price=from_scaled(matched_order.price_scaled),
        quantity=from_scaled(matched_order.quantity_scaled),
        filled_quantity=from_scaled(matched_order.filled_quantity_scaled),
        remaining_quantity=from_scaled(matched_order.remaining_quantity_scaled),
        status=matched_order.status,
        margin_locked=from_scaled(locked_margin_scaled),
        trades=trade_dtos,
        created_at_ns=matched_order.created_at_ns,
        updated_at_ns=matched_order.updated_at_ns,
    )


@app.delete(
    "/v1/orders/{order_id}",
    tags=["Trading Operations"],
    summary="Cancel open order and release margin locks",
)
def cancel_order(
    order_id: str = Path(..., description="Order UUID to cancel"),
    symbol: str = Query(default="BTC-USD", description="Market symbol"),
    account_id: Optional[str] = Query(None, description="Account UUID for margin unlock verification"),
) -> Dict[str, Any]:
    cancelled = engine.cancel_order(symbol=symbol, order_id=order_id)
    if not cancelled:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or already completely filled",
        )

    # Release margin locks
    target_acc = account_id or cancelled.account_id
    risk_manager.release_order_margin(target_acc, order_id)

    return {
        "status": "SUCCESS",
        "message": f"Order {order_id} successfully cancelled",
        "order_id": order_id,
        "symbol": symbol,
        "cancelled_status": cancelled.status,
    }


@app.get(
    "/v1/orderbook/{symbol}",
    tags=["Market Data"],
    summary="Level 2 Orderbook Snapshot",
)
def get_orderbook(
    symbol: str = Path(..., description="Symbol, e.g. BTC-USD"),
    depth: int = Query(default=20, ge=1, le=100, description="Depth levels to return"),
) -> Dict[str, Any]:
    return engine.get_l2_snapshot(symbol=symbol, depth=depth)


@app.get(
    "/v1/risk/margin/{account_id}",
    tags=["Risk Management"],
    summary="Real-time margin utilization, liquidation threshold, and leverage",
)
def get_margin_state(
    account_id: str = Path(..., description="Account UUID"),
) -> Dict[str, Any]:
    state: MarginState = risk_manager.evaluate_margin_state(account_id)
    return {
        "account_id": state.account_id,
        "cash_balance": state.cash_balance,
        "collateral_value": state.collateral_value,
        "unrealized_pnl": state.unrealized_pnl,
        "total_equity": state.total_equity,
        "initial_margin_requirement": state.initial_margin_requirement,
        "maintenance_margin_requirement": state.maintenance_margin_requirement,
        "open_orders_margin_locked": state.open_orders_margin_locked,
        "free_collateral_margin": state.free_collateral_margin,
        "margin_utilization_ratio_pct": state.margin_utilization_ratio,
        "portfolio_leverage_ratio": state.portfolio_leverage_ratio,
        "is_liquidation_triggered": state.is_liquidation_triggered,
        "health_status": state.status,
    }


@app.post("/v1/risk/deposit", tags=["Risk Management"], summary="Deposit cash or collateral")
def deposit_collateral(req: DepositRequest) -> Dict[str, Any]:
    acc = risk_manager.get_or_create_account(req.account_id)
    if req.asset_id == "USD":
        acc.cash_balance_scaled += to_scaled(req.amount)
    else:
        current = acc.collateral_balances_scaled.get(req.asset_id, 0)
        acc.collateral_balances_scaled[req.asset_id] = current + to_scaled(req.amount)

    return {
        "status": "SUCCESS",
        "account_id": req.account_id,
        "deposited": req.amount,
        "asset": req.asset_id,
        "new_balance": from_scaled(acc.cash_balance_scaled),
    }


@app.post("/v1/risk/mark-price", tags=["Risk Management"], summary="Update mark price for stress testing")
def update_mark_price(req: MarkPriceUpdate) -> Dict[str, Any]:
    risk_manager.set_mark_price(req.symbol, req.price)
    return {"status": "SUCCESS", "symbol": req.symbol, "new_mark_price": req.price}


@app.post("/v1/risk/liquidate/{account_id}", tags=["Risk Management"], summary="Trigger liquidation cascade")
def trigger_liquidation(account_id: str = Path(...)) -> Dict[str, Any]:
    actions = risk_manager.trigger_liquidation_cascade(account_id)
    return {
        "status": "EXECUTED",
        "account_id": account_id,
        "actions_taken": actions,
        "liquidation_cleared": True,
    }
