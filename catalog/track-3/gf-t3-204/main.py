"""
APEX-204 FastAPI Turnkey Microservice
Permissive Clean-Room MIT Architecture
Institutional Algorithmic Execution Service
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List, Optional
import csv
import io
from fastapi.responses import PlainTextResponse

from models import (
    PlanOrderRequest,
    ParentOrder,
    ChildSlice,
    SliceStatus,
    ParentOrderStatus,
    ExecutionStateResponse,
    OrderSide,
    ExecutionStrategy,
)
from engine import engine_instance, QuantExecutionEngine

app = FastAPI(
    title="APEX-204 Institutional Execution API",
    description="Smart Order Router & Algorithmic Execution Engine for TWAP, VWAP, and Almgren-Chriss Liquidation",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

# Enable CORS for terminal UI integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory execution store for active state machine
orders_db: Dict[str, ParentOrder] = {}
market_state: Dict[str, Any] = {
    "spread_bps": 2.5,
    "volume_shock": False,
}


@app.get("/api/health")
async def health_check():
    return {
        "status": "HEALTHY",
        "service": "APEX-204 Algorithmic Execution Engine",
        "license": "Clean-Room MIT",
        "version": "1.0.0",
    }


@app.post("/api/orders/plan", response_model=ParentOrder)
async def plan_order(req: PlanOrderRequest):
    """
    Generate the optimal liquidation schedule (Almgren-Chriss, VWAP, or TWAP).
    Computes exact child slice sizes, timestamps, and cryptographic genesis hash.
    """
    order = engine_instance.plan_order(req)
    orders_db[order.order_id] = order
    return order


@app.post("/api/orders/execute", response_model=ExecutionStateResponse)
async def execute_order_full(req: PlanOrderRequest):
    """
    Plan and immediately simulate full execution of the parent order
    through all child slices with realistic market microstructure impact.
    """
    order = engine_instance.plan_order(req)
    
    total_cost = 0.0
    total_filled = 0.0
    latest_hash = order.genesis_hash
    trajectory_target = [order.total_shares]
    trajectory_actual = [order.total_shares]
    rem_actual = order.total_shares

    for i, s in enumerate(order.slices):
        fill_price, slippage_bps = engine_instance.simulate_slice_fill(
            slice_shares=s.target_shares,
            arrival_price=order.arrival_price,
            side=order.side,
            venue=s.venue,
            temporary_impact=req.temporary_impact_eta,
            permanent_impact=req.permanent_impact_gamma,
            spread_bps=market_state["spread_bps"],
            market_shock=market_state["volume_shock"],
        )
        s.status = SliceStatus.FILLED
        s.filled_shares = s.target_shares
        s.fill_price = fill_price
        s.slippage_bps = slippage_bps
        
        # Advance SHA-256 chain
        block_data = f"{latest_hash}|{s.slice_id}|{s.filled_shares:.4f}|{fill_price:.4f}|{s.venue.value}|{s.status.value}"
        latest_hash = engine_instance.compute_sha256(block_data)
        s.audit_hash = latest_hash

        total_cost += s.filled_shares * fill_price
        total_filled += s.filled_shares
        rem_actual -= s.filled_shares
        trajectory_actual.append(max(0.0, round(rem_actual, 4)))

    avg_price = total_cost / total_filled if total_filled > 0 else order.arrival_price
    if order.side == OrderSide.BUY:
        shortfall = (avg_price - order.arrival_price) * total_filled
        overall_slippage_bps = ((avg_price - order.arrival_price) / order.arrival_price) * 10000.0
    else:
        shortfall = (order.arrival_price - avg_price) * total_filled
        overall_slippage_bps = ((order.arrival_price - avg_price) / order.arrival_price) * 10000.0

    order.executed_shares = round(total_filled, 4)
    order.remaining_shares = 0.0
    order.average_exec_price = round(avg_price, 4)
    order.implementation_shortfall_usd = round(shortfall, 2)
    order.slippage_bps = round(overall_slippage_bps, 2)
    order.status = ParentOrderStatus.COMPLETED
    order.latest_audit_hash = latest_hash

    orders_db[order.order_id] = order

    vwap_profile = engine_instance.generate_vwap_profile(len(order.slices))
    
    # Calculate target trajectory points
    target_rem = order.total_shares
    for s in order.slices:
        target_rem -= s.target_shares
        trajectory_target.append(max(0.0, round(target_rem, 4)))

    return ExecutionStateResponse(
        order=order,
        intraday_volume_profile=vwap_profile,
        trajectory_target=trajectory_target,
        trajectory_actual=trajectory_actual,
        market_spread_bps=market_state["spread_bps"],
        volume_shock_active=market_state["volume_shock"],
    )


@app.post("/api/simulate/spike")
async def trigger_volume_spike():
    """Simulate an unexpected intraday liquidity surge or institutional volume shock."""
    market_state["volume_shock"] = not market_state["volume_shock"]
    return {
        "volume_shock_active": market_state["volume_shock"],
        "message": "Intraday volume shock toggled. Liquidity impact multiplier applied.",
    }


@app.post("/api/simulate/spread")
async def trigger_spread_widening():
    """Simulate bid-ask spread widening under market stress."""
    if market_state["spread_bps"] < 10.0:
        market_state["spread_bps"] = 15.0
    else:
        market_state["spread_bps"] = 2.5
    return {
        "spread_bps": market_state["spread_bps"],
        "message": f"Bid-ask spread set to {market_state['spread_bps']} bps.",
    }


@app.get("/api/orders/{order_id}/tape")
async def export_fill_tape(order_id: str, format: str = Query("json", enum=["json", "csv"])):
    """
    Export cryptographically chained execution fill tape for order audit.
    """
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="Order not found")

    order = orders_db[order_id]

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "slice_index",
            "slice_id",
            "venue",
            "status",
            "target_shares",
            "filled_shares",
            "limit_price",
            "fill_price",
            "slippage_bps",
            "audit_hash",
        ])
        for s in order.slices:
            writer.writerow([
                s.slice_index,
                s.slice_id,
                s.venue.value,
                s.status.value,
                s.target_shares,
                s.filled_shares,
                s.limit_price,
                s.fill_price or "",
                s.slippage_bps,
                s.audit_hash,
            ])
        return PlainTextResponse(output.getvalue(), media_type="text/csv")

    return {
        "order_id": order.order_id,
        "symbol": order.symbol,
        "genesis_hash": order.genesis_hash,
        "latest_audit_hash": order.latest_audit_hash,
        "total_shares": order.total_shares,
        "executed_shares": order.executed_shares,
        "average_price": order.average_exec_price,
        "slippage_bps": order.slippage_bps,
        "implementation_shortfall_usd": order.implementation_shortfall_usd,
        "slices": [s.model_dump() for s in order.slices],
    }


@app.get("/api/orders/{order_id}/audit")
async def get_audit_trail(order_id: str):
    """
    Verify tamper-evident SHA-256 chain continuity for an order.
    """
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="Order not found")

    order = orders_db[order_id]
    chain = []
    chain.append({
        "step": 0,
        "type": "GENESIS",
        "hash": order.genesis_hash,
        "valid": True,
    })

    prev_hash = order.genesis_hash
    for s in order.slices:
        block_data = f"{prev_hash}|{s.slice_id}|{s.filled_shares:.4f}|{s.fill_price or 0.0:.4f}|{s.venue.value}|{s.status.value}"
        expected_hash = engine_instance.compute_sha256(block_data)
        is_valid = (expected_hash == s.audit_hash)
        chain.append({
            "step": s.slice_index,
            "slice_id": s.slice_id,
            "hash": s.audit_hash,
            "computed_hash": expected_hash,
            "valid": is_valid,
        })
        prev_hash = s.audit_hash

    return {
        "order_id": order_id,
        "chain_length": len(chain),
        "chain_intact": all(c["valid"] for c in chain),
        "chain": chain,
    }
