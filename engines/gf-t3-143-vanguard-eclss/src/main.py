"""
Ghost FactoryOS — Engine GF-T3-143: Vanguard-ECLSS Life Support Engine
FastAPI ASGI Service Layer conforming to OpenAPI 3.1.0 specification.
License: Apache-2.0 / MIT Dual Permissive
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from src.engine import VanguardECLSSEngine
from src.models import (
    AtmosphericBalanceRequest,
    AtmosphericBalanceResponse,
    WaterRecoveryRequest,
    WaterRecoveryResponse,
    FDIRTriageRequest,
    FDIRTriageResponse,
    TelemetryStreamPayload,
    EngineHealthResponse,
    AuditComplianceResponse,
)

app = FastAPI(
    title="Vanguard-ECLSS Autonomous Life Support REST & Telemetry API",
    description=(
        "Ghost FactoryOS Fleet Track 3 F1 Skunkworks Engine (Asset GF-T3-143). "
        "Deterministic, real-time closed-loop API for deep-space habitat atmospheric gas-balancing, "
        "water processor distillation loop recovery, and FDIR automated fault triage."
    ),
    version="1.0.0-PROD",
    openapi_version="3.1.0",
)

# Permissive CORS for habitat telemetry consoles and mission control dashboards
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = VanguardECLSSEngine()


@app.get("/healthz", tags=["Infrastructure"], summary="Cloud Run Liveness Probe")
async def health_check():
    """Standard HTTP 200 health check for Cloud Run container routing."""
    return {"status": "HEALTHY", "engine": "GF-T3-143", "version": "1.0.0-PROD"}


@app.post(
    "/eclss/atmosphere/balance",
    response_model=AtmosphericBalanceResponse,
    status_code=status.HTTP_200_OK,
    tags=["Atmospheric Control"],
    summary="Solve Real-Time Closed-Loop Atmospheric Gas Balance",
    operation_id="solveAtmosphericBalance",
)
async def balance_atmosphere(req: AtmosphericBalanceRequest) -> AtmosphericBalanceResponse:
    """
    Ingests current barometric and gas partial pressure telemetry, calculates metabolic burn
    from crew profile, and computes optimal MIMO-MPC actuator rates within <6.5ms compute threshold.
    """
    try:
        return engine.solve_atmospheric_balance(req)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Atmospheric balance optimization failed: {str(exc)}",
        ) from exc


@app.post(
    "/eclss/water/recovery",
    response_model=WaterRecoveryResponse,
    status_code=status.HTTP_200_OK,
    tags=["Hydrologic Subsystem"],
    summary="Process Hydrologic Inflow & Calculate Recovery Yield",
    operation_id="calculateWaterRecovery",
)
async def recover_water(req: WaterRecoveryRequest) -> WaterRecoveryResponse:
    """
    Calculates distillate yield, catalytic oxidizer purity, and filter life index
    from urine distillation assembly and greywater stream inflows.
    """
    try:
        return engine.calculate_water_recovery(req)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Water recovery calculation failed: {str(exc)}",
        ) from exc


@app.post(
    "/eclss/fdir/triage",
    response_model=FDIRTriageResponse,
    status_code=status.HTTP_200_OK,
    tags=["FDIR Safety Architecture"],
    summary="Execute Automated Fault Detection & Emergency Isolation",
    operation_id="executeFDIRTriage",
)
async def triage_fdir(req: FDIRTriageRequest) -> FDIRTriageResponse:
    """
    Takes in an anomaly telemetry vector, evaluates probabilistic root-cause hypotheses,
    and generates real-time valve isolation sequences.
    """
    try:
        return engine.execute_fdir_triage(req)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"FDIR triage failed: {str(exc)}",
        ) from exc


@app.get(
    "/telemetry/stream",
    response_model=TelemetryStreamPayload,
    tags=["Telemetry"],
    summary="Habitat Life Support Telemetry Metrics",
    operation_id="getTelemetryStream",
)
async def get_telemetry_stream() -> TelemetryStreamPayload:
    """Returns real-time habitat life support telemetry metrics, margin days, and compute latency."""
    return engine.get_telemetry_stream()


@app.get(
    "/v1/health",
    response_model=EngineHealthResponse,
    tags=["Infrastructure"],
    summary="Detailed Engine Health Diagnostics",
)
async def get_health_diagnostics() -> EngineHealthResponse:
    """Returns detailed operational health, compute threshold, and clean-room compliance status."""
    return engine.get_health()


@app.get(
    "/audit/compliance",
    response_model=AuditComplianceResponse,
    tags=["Compliance"],
    summary="NIST SP 800-218 and Clean-Room IP Compliance Audit",
)
async def get_audit_compliance() -> AuditComplianceResponse:
    """Returns formal clean-room IP verification and mathematical proof manifest."""
    return engine.get_compliance()
