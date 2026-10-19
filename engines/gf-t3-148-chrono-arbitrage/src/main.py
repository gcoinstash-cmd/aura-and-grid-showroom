"""
Ghost FactoryOS — Engine GF-T3-148: Chrono-Arbitrage
Production FastAPI ASGI Application & Quant Order Gateway.
Clean-Room Certified: Apache-2.0 / MIT Dual Permissive.
"""

from typing import List
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from src.models import (
    TriangularRoutesResponse,
    ExecutionRequest,
    ExecutionResponse,
    VenueLatencyTelemetry,
    EngineHealthResponse,
    AuditComplianceResponse,
)
from src.engine import ChronoArbitrageEngine

app = FastAPI(
    title="Chrono-Arbitrage Sub-Millisecond Engine API",
    version="1.0.0-PROD",
    description="Production REST & WebSocket API specification for T3-QUANT-02 Chrono-Arbitrage.",
)

# Enable CORS for institutional trading terminals and HUDs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = ChronoArbitrageEngine()


@app.get("/healthz", tags=["Health"])
def healthz():
    """Liveness probe for Cloud Run / Kubernetes."""
    return {"status": "healthy", "service": "gf-t3-148-chrono-arbitrage", "version": "1.0.0-PROD"}


@app.get("/v1/health", response_model=EngineHealthResponse, tags=["Health"])
def engine_health():
    """Engine operational telemetry & health check."""
    return engine.get_health()


@app.get("/audit/compliance", response_model=AuditComplianceResponse, tags=["Compliance"])
def audit_compliance():
    """Clean-Room and NIST SP 800-218 compliance manifest."""
    return engine.get_compliance()


@app.get(
    "/api/v1/routes/triangular",
    response_model=TriangularRoutesResponse,
    tags=["Arbitrage Routes"],
    summary="Retrieve currently detected profitable triangular arbitrage cycles",
)
def get_triangular_routes(
    min_profit_bps: float = Query(default=5.0, ge=0.0, description="Minimum yield threshold in basis points"),
    max_hops: int = Query(default=4, ge=3, le=6, description="Maximum hops in cycle"),
):
    """
    Returns array of currently active negative-log cycles in the currency multigraph.
    """
    return engine.get_triangular_routes(min_profit_bps=min_profit_bps, max_hops=max_hops)


@app.post(
    "/api/v1/execute/arb",
    response_model=ExecutionResponse,
    tags=["Execution Dispatch"],
    summary="Execute atomic multi-hop arbitrage route",
)
def execute_arbitrage(request: ExecutionRequest):
    """
    Executes two-phase atomic multi-hop order dispatch across exchange venues with quadratic slippage protection.
    """
    try:
        return engine.execute_arbitrage(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Arbitrage execution failed: {str(e)}",
        )


@app.get(
    "/api/v1/latency/venues",
    response_model=List[VenueLatencyTelemetry],
    tags=["Venue Latency"],
    summary="High-frequency ping and execution latency telemetry across connected venues",
)
def get_venue_latencies():
    """
    Real-time ping latency, orderbook depth, and connection health per exchange venue.
    """
    return engine.get_venue_latencies()
