#!/usr/bin/env python3
"""
APEX-205 Liquidity Sweep & Smart Order Routing (SOR) Engine
Backend FastAPI Service implementing KKT Optimization, Nonlinear Market Impact,
Latency-Adjusted Fill Probabilities, and Immutable SHA-256 Execution Ledgers.
ABSOLUTE ZERO-DOLLAR GATE: All values expressed in Units, Basis Points (bps), and Points.
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import numpy as np
import hashlib
import json
import time
import uuid
import datetime

app = FastAPI(
    title="GF-T3-205 APEX-205 SOR Engine",
    version="2.0.5",
    description="Institutional Smart Order Routing and Liquidity Sweep Engine with KKT optimization."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Venue State Database
venues_db: Dict[str, Dict[str, Any]] = {
    "VENUE-ALPHA": {
        "id": "VENUE-ALPHA",
        "name": "VENUE-ALPHA (L1 Deep Pool)",
        "type": "L1 Lit Pool",
        "base_price": 125.50,
        "depth_units": 5000000.0,
        "latency_ms": 1.2,
        "fee_bps": -0.2, # Rebate
        "status": "ACTIVE",
        "reliability": 0.9998
    },
    "VENUE-BETA": {
        "id": "VENUE-BETA",
        "name": "VENUE-BETA (Dark Liquidity)",
        "type": "Dark Pool",
        "base_price": 125.48,
        "depth_units": 3500000.0,
        "latency_ms": 4.5,
        "fee_bps": 0.5, # Take fee
        "status": "ACTIVE",
        "reliability": 0.9985
    },
    "VENUE-GAMMA": {
        "id": "VENUE-GAMMA",
        "name": "VENUE-GAMMA (Retail ECN)",
        "type": "ECN",
        "base_price": 125.52,
        "depth_units": 2000000.0,
        "latency_ms": 0.8,
        "fee_bps": 1.0,
        "status": "ACTIVE",
        "reliability": 0.9995
    },
    "VENUE-DELTA": {
        "id": "VENUE-DELTA",
        "name": "VENUE-DELTA (Institutional Cross)",
        "type": "Block Cross",
        "base_price": 125.45,
        "depth_units": 8000000.0,
        "latency_ms": 12.0,
        "fee_bps": -0.5, # Deep Rebate
        "status": "ACTIVE",
        "reliability": 0.9990
    }
}

# Immutable SHA-256 Ledger Chain
execution_ledger: List[Dict[str, Any]] = []

def get_latest_ledger_hash() -> str:
    if not execution_ledger:
        return "0" * 64
    return execution_ledger[-1]["hash"]

def append_to_ledger(record: Dict[str, Any]) -> Dict[str, Any]:
    prev_hash = get_latest_ledger_hash()
    record["prev_hash"] = prev_hash
    record["timestamp"] = datetime.datetime.utcnow().isoformat() + "Z"
    
    # Deterministic canonical serialization for hashing
    canonical = json.dumps(record, sort_keys=True)
    h = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    record["hash"] = h
    execution_ledger.append(record)
    return record

# Seed initial genesis ledger record
append_to_ledger({
    "event": "GENESIS",
    "sequence": 0,
    "description": "APEX-205 Ledger Chain Initialization",
    "operator": "ROOT-SYSTEM"
})

class OrderRequest(BaseModel):
    symbol: str = Field(..., example="SYNTH-PRIME / CORE-PT")
    total_units: float = Field(..., gt=0, example=1500000.0)
    side: str = Field(..., example="BUY") # BUY or SELL
    gamma_impact: float = Field(0.15, example=0.15)
    lambda_latency: float = Field(0.05, example=0.05)
    urgency_mode: str = Field("OPTIMAL", example="OPTIMAL") # OPTIONAL, PASSIVE, SWEEP

class ChildAllocation(BaseModel):
    venue_id: str
    venue_name: str
    allocated_units: float
    target_price: float
    effective_fee_bps: float
    estimated_latency_ms: float
    fill_probability: float
    marginal_cost: float
    market_impact_pts: float

class RoutingResponse(BaseModel):
    execution_id: str
    symbol: str
    total_units: float
    side: str
    allocations: List[ChildAllocation]
    blended_execution_price: float
    total_fee_units: float
    total_market_impact_pts: float
    execution_latency_ms: float
    sha256_proof: str
    status: str

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    return {
        "status": "HEALTHY",
        "engine": "APEX-205 SOR",
        "active_venues": sum(1 for v in venues_db.values() if v["status"] == "ACTIVE"),
        "ledger_height": len(execution_ledger),
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    }

@app.get("/api/venues", status_code=status.HTTP_200_OK)
def list_venues():
    return list(venues_db.values())

@app.post("/api/venues/{venue_id}/toggle", status_code=status.HTTP_200_OK)
def toggle_venue(venue_id: str):
    if venue_id not in venues_db:
        raise HTTPException(status_code=404, detail="Venue not found")
    current = venues_db[venue_id]["status"]
    venues_db[venue_id]["status"] = "MAINTENANCE" if current == "ACTIVE" else "ACTIVE"
    
    # Record venue state change in ledger
    append_to_ledger({
        "event": "VENUE_STATE_CHANGE",
        "venue_id": venue_id,
        "new_status": venues_db[venue_id]["status"]
    })
    return venues_db[venue_id]

@app.get("/api/ledger", status_code=status.HTTP_200_OK)
def get_ledger(limit: int = 50):
    return execution_ledger[-limit:]

@app.post("/api/optimize-route", response_model=RoutingResponse, status_code=status.HTTP_200_OK)
def optimize_route(order: OrderRequest):
    active_venues = [v for v in venues_db.values() if v["status"] == "ACTIVE"]
    if not active_venues:
        raise HTTPException(status_code=400, detail="No active liquidity venues available for routing.")

    total_units = order.total_units
    n_venues = len(active_venues)
    
    # KKT & Nonlinear Impact Optimization Model
    # Cost per venue i: C_i(x_i) = x_i * P_i + Impact_i(x_i) + Fees_i(x_i)
    # Impact_i(x_i) = gamma * P_i * (x_i / Depth_i)^1.5
    
    # Initial naive equal distribution for seed
    allocations_raw = np.array([total_units / n_venues] * n_venues, dtype=float)
    
    # Iterative projected gradient descent / KKT solver for convex cost minimization
    learning_rate = 0.1
    for _ in range(50):
        grads = np.zeros(n_venues)
        for i, v in enumerate(active_venues):
            x_i = max(0.01, allocations_raw[i])
            depth = max(1.0, v["depth_units"])
            base_p = v["base_price"]
            gamma = order.gamma_impact
            
            # Marginal impact derivative: d/dx [ gamma * base_p * (x / depth)^1.5 ] = 1.5 * gamma * base_p * (x^0.5) / (depth^1.5)
            marginal_impact = 1.5 * gamma * base_p * (np.sqrt(x_i) / (depth ** 1.5))
            fee_factor = v["fee_bps"] / 10000.0 * base_p
            
            grads[i] = base_p + marginal_impact + fee_factor
            
        # Adjust allocation to minimize gradient discrepancy while summing to total_units
        mean_grad = np.mean(grads)
        allocations_raw -= learning_rate * (grads - mean_grad)
        
        # Enforce box constraints: 0 <= x_i <= depth_units
        for i, v in enumerate(active_venues):
            allocations_raw[i] = np.clip(allocations_raw[i], 0.0, v["depth_units"])
            
        # Rescale sum to total_units
        current_sum = np.sum(allocations_raw)
        if current_sum > 0:
            allocations_raw = allocations_raw * (total_units / current_sum)
        else:
            allocations_raw = np.array([total_units / n_venues] * n_venues, dtype=float)

    # Compute final metrics per venue
    child_allocations: List[ChildAllocation] = []
    total_notional_cost = 0.0
    total_fees = 0.0
    total_impact = 0.0
    max_latency = 0.0
    
    for i, v in enumerate(active_venues):
        x_i = float(allocations_raw[i])
        if x_i < 0.001:
            continue
            
        base_p = v["base_price"]
        depth = v["depth_units"]
        gamma = order.gamma_impact
        
        impact_pts = gamma * base_p * ((x_i / depth) ** 1.5)
        exec_price = base_p + impact_pts
        
        fee_units = x_i * exec_price * (v["fee_bps"] / 10000.0)
        total_fees += fee_units
        total_impact += impact_pts * x_i
        
        lat = v["latency_ms"]
        max_latency = max(max_latency, lat)
        
        # Fill probability: P = exp(-lambda * latency) * reliability
        fill_prob = float(np.exp(-order.lambda_latency * (lat / 10.0)) * v["reliability"])
        
        notional_cost = x_i * exec_price
        total_notional_cost += notional_cost
        
        child_allocations.append(ChildAllocation(
            venue_id=v["id"],
            venue_name=v["name"],
            allocated_units=round(x_i, 2),
            target_price=round(exec_price, 4),
            effective_fee_bps=v["fee_bps"],
            estimated_latency_ms=lat,
            fill_probability=round(fill_prob, 4),
            marginal_cost=round(exec_price, 4),
            market_impact_pts=round(impact_pts, 4)
        ))

    blended_price = total_notional_cost / total_units if total_units > 0 else 0.0
    execution_id = f"EXEC-{uuid.uuid4().hex[:8].upper()}"
    
    ledger_record = {
        "event": "SWEEP_ROUTED",
        "execution_id": execution_id,
        "symbol": order.symbol,
        "total_units": total_units,
        "side": order.side,
        "blended_price": round(blended_price, 4),
        "total_fees": round(total_fees, 2),
        "venue_count": len(child_allocations)
    }
    
    signed_record = append_to_ledger(ledger_record)
    
    return RoutingResponse(
        execution_id=execution_id,
        symbol=order.symbol,
        total_units=total_units,
        side=order.side,
        allocations=child_allocations,
        blended_execution_price=round(blended_price, 4),
        total_fee_units=round(total_fees, 2),
        total_market_impact_pts=round(total_impact / total_units, 4) if total_units > 0 else 0.0,
        execution_latency_ms=round(max_latency, 2),
        sha256_proof=signed_record["hash"],
        status="COMPLETED"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
