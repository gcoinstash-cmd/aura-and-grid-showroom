"""
ChronosRisk Engine // GF-T3-152 API Service
FastAPI Microservice for High-Performance VaR & Stress Analysis
Port 8080 | Health Checks at /healthz
"""

import os
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

from src.core.risk_engine import (
    AssetPosition,
    ChronosRiskEngine,
    UNIT_SCALE,
)

app = FastAPI(
    title="ChronosRisk Engine // GF-T3-152",
    description="Real-Time Portfolio Index-at-Risk (VaR), Expected Shortfall (CVaR), and Historical Shock Simulation Core",
    version="1.0.0",
)


class AssetInput(BaseModel):
    symbol: str
    name: str
    weight: float = Field(..., ge=0.0, le=1.0)
    annual_vol: float = Field(..., gt=0.0)
    skewness: float
    excess_kurtosis: float
    price_cents: int = Field(default=10000)


class VaRRequest(BaseModel):
    portfolio_equity: float = Field(..., gt=0)
    confidence_interval: float = Field(default=0.99, gt=0.5, lt=1.0)
    time_horizon_days: int = Field(default=1, ge=1, le=252)
    vol_multiplier: float = Field(default=1.0, gt=0.1, le=10.0)
    enable_cornish_fisher: bool = Field(default=True)
    assets: List[AssetInput]
    correlation_matrix: List[List[float]]


class StressRequest(BaseModel):
    scenario_key: str
    portfolio_equity: float = Field(..., gt=0)
    assets: List[AssetInput]
    correlation_matrix: List[List[float]]


@app.get("/healthz", status_code=status.HTTP_200_OK)
def health_check() -> Dict[str, Any]:
    """Cloud Run liveness and readiness probe endpoint"""
    return {
        "status": "healthy",
        "service": "chronosrisk-engine",
        "asset_tag": "GF-T3-152",
        "uptime_state": "nominal",
    }


@app.post("/api/v1/risk/calculate")
def calculate_risk(req: VaRRequest) -> Dict[str, Any]:
    """
    Sub-50 microsecond analytical closed-form VaR & CVaR calculation endpoint
    """
    try:
        engine_assets = [
            AssetPosition(
                symbol=a.symbol,
                name=a.name,
                weight=a.weight,
                annual_vol=a.annual_vol,
                skewness=a.skewness,
                excess_kurtosis=a.excess_kurtosis,
                price_cents=a.price_cents,
            )
            for a in req.assets
        ]
        engine = ChronosRiskEngine(engine_assets, req.correlation_matrix)
        res = engine.calculate_var_metrics(
            portfolio_equity=req.portfolio_equity,
            confidence_interval=req.confidence_interval,
            time_horizon_days=req.time_horizon_days,
            vol_multiplier=req.vol_multiplier,
            enable_cornish_fisher=req.enable_cornish_fisher,
        )

        return {
            "asset_tag": "GF-T3-152",
            "portfolio_equity": res.portfolio_equity,
            "confidence_interval": res.confidence_interval,
            "time_horizon_days": res.time_horizon_days,
            "portfolio_daily_vol": res.portfolio_daily_vol,
            "portfolio_annual_vol": res.portfolio_annual_vol,
            "portfolio_skewness": res.portfolio_skewness,
            "portfolio_excess_kurtosis": res.portfolio_excess_kurtosis,
            "parametric_var_pct": res.parametric_var_pct,
            "parametric_var_amount": res.parametric_var_amount,
            "cornish_fisher_var_pct": res.cornish_fisher_var_pct,
            "cornish_fisher_var_amount": res.cornish_fisher_var_amount,
            "expected_shortfall_pct": res.expected_shortfall_pct,
            "expected_shortfall_amount": res.expected_shortfall_amount,
            "fixed_point_var_units": res.fixed_point_var_units,
            "execution_latency_micros": res.execution_latency_micros,
            "marginal_var_components": res.marginal_var_components,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/v1/risk/stress-test")
def stress_test(req: StressRequest) -> Dict[str, Any]:
    """
    Historical Macro Shock Stress-Testing Endpoint
    """
    try:
        engine_assets = [
            AssetPosition(
                symbol=a.symbol,
                name=a.name,
                weight=a.weight,
                annual_vol=a.annual_vol,
                skewness=a.skewness,
                excess_kurtosis=a.excess_kurtosis,
                price_cents=a.price_cents,
            )
            for a in req.assets
        ]
        engine = ChronosRiskEngine(engine_assets, req.correlation_matrix)
        result = engine.simulate_stress_scenario(req.scenario_key, req.portfolio_equity)
        return {
            "asset_tag": "GF-T3-152",
            "scenario": result,
        }
    except KeyError:
        raise HTTPException(status_code=404, detail="Scenario key not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
