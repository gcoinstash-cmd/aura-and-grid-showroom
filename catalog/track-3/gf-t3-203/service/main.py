"""
APEX-203 Production FastAPI Turnkey Service
Ghost FactoryOS Track 3 Quantitative Engine — Monopoly Gate Architecture
Clean-Room MIT Architecture — Zero Copyleft Dependencies
"""

import asyncio
import os
import random
import time
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from service.kalman import KalmanFilter
from service.ornstein_uhlenbeck import OrnsteinUhlenbeckEstimator
from service.signal_chain import SignalAuditChain, SignalEmitter
from service.welford import WelfordRollingStats

app = FastAPI(
    title="APEX-203 Multi-Asset Kalman Filter Arbitrage Engine",
    version="1.0.0",
    description="Production-grade real-time Kalman Filter & Statistical Arbitrage Signal Generator with Welford Z-Score, Ornstein-Uhlenbeck half-life, and SHA-256 audit chaining.",
    openapi_version="3.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Engine Singletons
kalman = KalmanFilter(initial_beta=18.82, initial_alpha=50.0, r_variance=1e-3, q_variance=1e-5)
welford = WelfordRollingStats(window_size=50)
ou_estimator = OrnsteinUhlenbeckEstimator(window_size=60)
signal_emitter = SignalEmitter(entry_threshold=2.0, exit_threshold=0.5, stop_threshold=3.5)
audit_chain = SignalAuditChain()

# Mock Stream State
class StreamState:
    running: bool = True
    pair: str = "SYNTH_ALPHA_BETA"
    price_x: float = 3410.0
    price_y: float = 64200.0
    true_beta: float = 18.82
    true_alpha: float = 50.0
    spread_noise: float = 0.0
    burst_ticks: int = 0
    burst_multiplier: float = 1.0
    forced_reversion_ticks: int = 0
    tick_count: int = 0

state = StreamState()


class TickInput(BaseModel):
    price_y: float = Field(..., description="Observed price of Asset Y")
    price_x: float = Field(..., description="Observed price of Asset X")
    timestamp: Optional[int] = Field(None, description="Tick timestamp in milliseconds")


class ControlAction(BaseModel):
    action: str = Field(..., description="Control directive name")
    parameters: Optional[Dict[str, Any]] = None


@app.post("/api/v1/tick", summary="Ingest live price tick and execute Kalman recursion")
def ingest_tick(tick: TickInput):
    ts = tick.timestamp if tick.timestamp is not None else int(time.time() * 1000)
    k_state = kalman.update(tick.price_y, tick.price_x)
    w_stats = welford.update(k_state.spread)
    ou_stats = ou_estimator.update(k_state.spread)

    sig, reason = signal_emitter.evaluate(
        tick.price_y, tick.price_x, k_state.beta, k_state.spread, w_stats.z_score
    )

    if sig != "NONE":
        audit_chain.append_signal(
            signal=sig,
            price_y=tick.price_y,
            price_x=tick.price_x,
            beta=k_state.beta,
            spread=k_state.spread,
            z_score=w_stats.z_score,
            half_life=ou_stats.half_life,
            timestamp=ts,
        )

    return {
        "timestamp": ts,
        "price_y": tick.price_y,
        "price_x": tick.price_x,
        "beta": k_state.beta,
        "alpha": k_state.alpha,
        "fair_value_y": k_state.fair_value_y,
        "spread": k_state.spread,
        "innovation_variance": k_state.innovation_variance,
        "z_score": w_stats.z_score,
        "welford_mean": w_stats.mean,
        "welford_stdev": w_stats.stdev,
        "ou_theta": ou_stats.theta,
        "ou_half_life": ou_stats.half_life,
        "is_mean_reverting": ou_stats.is_mean_reverting,
        "signal": sig,
        "signal_reason": reason,
        "position_side": signal_emitter.position_side,
    }


@app.get("/api/v1/state", summary="Retrieve current state vector and parameters")
def get_current_state():
    return {
        "pair": state.pair,
        "price_y": state.price_y,
        "price_x": state.price_x,
        "beta": kalman.beta,
        "alpha": kalman.alpha,
        "p_matrix": [[kalman.p00, kalman.p01], [kalman.p10, kalman.p11]],
        "welford_mean": welford.mean,
        "position_side": signal_emitter.position_side,
        "audit_chain_length": len(audit_chain.chain),
    }


@app.get("/api/v1/signals", summary="Retrieve SHA-256 chained signal audit log")
def get_signals():
    is_valid, broken_idx = audit_chain.verify_integrity()
    return {
        "total_blocks": len(audit_chain.chain),
        "chain_valid": is_valid,
        "broken_at_index": broken_idx,
        "blocks": [
            {
                "index": b.index,
                "timestamp": b.timestamp,
                "previous_hash": b.previous_hash,
                "hash": b.hash,
                "signal": b.signal,
                "price_y": b.price_y,
                "price_x": b.price_x,
                "beta": b.beta,
                "spread": b.spread,
                "z_score": b.z_score,
                "half_life": b.half_life,
                "verified": b.verified,
            }
            for b in audit_chain.chain
        ],
    }


@app.post("/api/v1/control/burst", summary="Trigger volatility burst stress test")
def trigger_burst():
    state.burst_ticks = 20
    state.burst_multiplier = 4.5
    return {"status": "ACK", "message": "Burst volatility triggered (20 ticks @ 4.5x multiplier)"}


@app.post("/api/v1/control/reversion", summary="Force rapid Ornstein-Uhlenbeck mean reversion")
def trigger_reversion():
    state.forced_reversion_ticks = 15
    state.burst_ticks = 0
    return {"status": "ACK", "message": "Forced mean reversion triggered"}


@app.post("/api/v1/control/regime_shift", summary="Simulate structural cointegration breakdown")
def trigger_regime_shift():
    state.true_beta *= 1.35
    state.true_alpha += (random.random() - 0.5) * 1000.0
    state.spread_noise += (random.random() - 0.5) * 1500.0
    return {"status": "ACK", "message": f"Regime shift injected: new true beta={state.true_beta:.2f}"}


@app.get("/health", summary="Service healthcheck endpoint")
def healthcheck():
    return {"status": "HEALTHY", "engine": "APEX-203", "timestamp": int(time.time() * 1000)}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
