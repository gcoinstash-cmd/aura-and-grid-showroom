"""
Ghost FactoryOS — Engine GF-T3-146: Hyperion-Flux Neuromorphic Event-Vision
Production FastAPI ASGI Application & Edge Stream Gateway.
Clean-Room Certified: Apache-2.0 / MIT Dual Permissive.
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from src.models import (
    EventIngestBatchRequest,
    EventIngestResponse,
    FlowCalculateRequest,
    FlowCalculateResponse,
    SpikingTrackRequest,
    SpikingTrackResponse,
    SensorCalibrationRequest,
    SensorCalibrationResponse,
    TelemetryAuditResponse,
    EngineHealthResponse,
    AuditComplianceResponse,
)
from src.engine import HyperionFluxEngine

app = FastAPI(
    title="Hyperion-Flux Neuromorphic Event-Vision & Microsecond Optical Flow Engine API",
    version="1.0.0",
    description="Ghost FactoryOS Fleet Track 3 (F1 Skunkworks) production REST and streaming binary protocol specification for asset GF-T3-146.",
)

# CORS middleware for telemetry dashboards and edge consoles
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = HyperionFluxEngine(sensor_width=256, sensor_height=256)


@app.get("/healthz", tags=["Health"])
def healthz():
    """Liveness probe for Cloud Run / Kubernetes."""
    return {"status": "healthy", "service": "gf-t3-146-hyperion-flux", "version": "1.0.0-PROD"}


@app.get("/v1/health", response_model=EngineHealthResponse, tags=["Health"])
def engine_health():
    """Engine operational telemetry & health check."""
    return engine.get_health()


@app.get("/audit/compliance", response_model=AuditComplianceResponse, tags=["Compliance"])
def audit_compliance():
    """Clean-Room and NIST SP 800-218 compliance manifest."""
    return engine.get_compliance()


@app.post(
    "/api/v1/event/stream/ingest",
    response_model=EventIngestResponse,
    tags=["Event Ingestion"],
    summary="Ingest Raw Asynchronous DVS Event Stream Buffer",
)
def ingest_event_stream(request: EventIngestBatchRequest):
    """
    Direct lock-free ingestion endpoint accepting structured batch JSON payloads into ring buffer.
    """
    try:
        return engine.ingest_events(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Event stream ingestion failed: {str(e)}",
        )


@app.post(
    "/api/v1/flow/calculate",
    response_model=FlowCalculateResponse,
    tags=["Optical Flow"],
    summary="Calculate Microsecond Surface-of-Active-Events Lucas-Kanade Optical Flow",
)
def calculate_optical_flow(request: FlowCalculateRequest):
    """
    Computes instantaneous closed-form 2D velocity vector over local spatial-temporal event manifolds, enforcing kappa <= 12.5.
    """
    try:
        return engine.calculate_flow(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Optical flow calculation failed: {str(e)}",
        )


@app.post(
    "/api/v1/spiking/track",
    response_model=SpikingTrackResponse,
    tags=["Spiking Estimator"],
    summary="Execute Leaky Integrate-and-Fire (LIF) Spike Clustering & Time-To-Collision Tracking",
)
def track_spiking_centroid(request: SpikingTrackRequest):
    """
    Evaluates membrane potential dynamics, detects threshold crossing spikes, and computes microsecond obstacle collision forecasts.
    """
    try:
        return engine.track_spikes(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Spike tracking failed: {str(e)}",
        )


@app.put(
    "/api/v1/sensor/dvs/calibrate",
    response_model=SensorCalibrationResponse,
    tags=["Hardware Calibration"],
    summary="Update Dynamic Vision Sensor Refractory & Contrast Threshold Parameters",
)
def calibrate_dvs_sensor(request: SensorCalibrationRequest):
    """
    Dynamically tunes active refractory period, ON/OFF log-contrast thresholds, and spatial-temporal parameters.
    """
    try:
        return engine.calibrate_sensor(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Calibration write failed: {str(e)}",
        )


@app.get(
    "/api/v1/telemetry/p99-audit",
    response_model=TelemetryAuditResponse,
    tags=["Telemetry & Health"],
    summary="Retrieve Real-Time P99 Latency & Compute Threshold Telemetry",
)
def get_telemetry_audit():
    """
    Audits compute threshold consumption ensuring event processing latency remains strictly under 750 microseconds.
    """
    return engine.get_telemetry_audit()
