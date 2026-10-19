"""
Ghost FactoryOS — Engine GF-T3-144: Lattice-Mesh Post-Quantum KEM Engine
FastAPI ASGI Service Layer conforming to OpenAPI 3.1.0 specification.
License: Apache-2.0 / MIT Dual Permissive
"""

from typing import Optional
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from src.engine import LatticeMeshEngine
from src.models import (
    EncapsulateRequest,
    EncapsulateResponse,
    DecapsulateRequest,
    DecapsulateResponse,
    RatchetRequest,
    RatchetResponse,
    NodeListResponse,
    FleetTelemetryResponse,
    EngineHealthResponse,
    AuditComplianceResponse,
)

app = FastAPI(
    title="GF-T3-144 Lattice-Mesh Post-Quantum KEM & Ratchet Engine API",
    description=(
        "Production REST & Ephemeral Handshake Protocol Specification for Ghost FactoryOS Fleet Track 3. "
        "Implements NIST FIPS 203 (ML-KEM-1024) lattice encapsulation, decapsulation, "
        "WireGuard PSK epoch rotation, and zero-trust edge node lifecycle management."
    ),
    version="1.0.0-PROD",
    openapi_version="3.1.0",
)

# Permissive CORS for mesh network consoles and edge fleet orchestrators
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = LatticeMeshEngine()


@app.get("/healthz", tags=["Infrastructure"], summary="Cloud Run Liveness Probe")
async def health_check():
    """Standard HTTP 200 health check for Cloud Run container routing."""
    return {"status": "HEALTHY", "engine": "GF-T3-144", "version": "1.0.0-PROD"}


@app.post(
    "/pqc/kem/encapsulate",
    response_model=EncapsulateResponse,
    status_code=status.HTTP_200_OK,
    tags=["Key Encapsulation Mechanism (KEM)"],
    summary="Execute ML-KEM-1024 Ephemeral Encapsulation",
    operation_id="encapsulateKey",
)
async def encapsulate_key(req: EncapsulateRequest) -> EncapsulateResponse:
    """
    Generates a randomized ephemeral ciphertext (u, v) and establishes an unshared 256-bit
    entropy buffer against the target peer's ML-KEM-1024 public key vector.
    """
    try:
        return engine.encapsulate(req)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"KEM encapsulation failed: {str(exc)}",
        ) from exc


@app.post(
    "/pqc/kem/decapsulate",
    response_model=DecapsulateResponse,
    status_code=status.HTTP_200_OK,
    tags=["Key Encapsulation Mechanism (KEM)"],
    summary="Execute ML-KEM-1024 Secret Decapsulation",
    operation_id="decapsulateKey",
)
async def decapsulate_key(req: DecapsulateRequest) -> DecapsulateResponse:
    """
    Recovers message entropy from ciphertext vectors using local hardware secret key
    and performs Fujisaki-Okamoto implicit rejection validation.
    """
    try:
        return engine.decapsulate(req)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"KEM decapsulation failed: {str(exc)}",
        ) from exc


@app.post(
    "/pqc/mesh/ratchet",
    response_model=RatchetResponse,
    status_code=status.HTTP_200_OK,
    tags=["Mesh Ratchet"],
    summary="Advance Ephemeral WireGuard PSK Epoch",
    operation_id="advanceRatchetEpoch",
)
async def advance_ratchet(req: RatchetRequest) -> RatchetResponse:
    """
    Fuses classical Curve25519 ECDH and ML-KEM-1024 shared secrets via HKDF-SHA512
    to atomically inject next-epoch PSK into active kernel WireGuard tunnels.
    """
    try:
        return engine.advance_ratchet(req)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ratchet epoch advance failed: {str(exc)}",
        ) from exc


@app.get(
    "/pqc/mesh/nodes",
    response_model=NodeListResponse,
    tags=["Mesh Topology"],
    summary="Query Mesh Fleet Topology and Node Health",
    operation_id="listMeshNodes",
)
async def list_mesh_nodes(
    region: Optional[str] = Query(default=None, description="Optional region filter"),
    limit: int = Query(default=64, ge=1, le=256, description="Maximum node count"),
) -> NodeListResponse:
    """Retrieves real-time status, latency metrics, and quantum resistance scores across mesh nodes."""
    return engine.list_nodes(region=region, limit=limit)


@app.get(
    "/pqc/mesh/telemetry",
    response_model=FleetTelemetryResponse,
    tags=["Fleet Telemetry"],
    summary="Fetch Real-time Quantum Threat Assessment (QTA) & Latency Stats",
    operation_id="getFleetTelemetry",
)
async def get_fleet_telemetry() -> FleetTelemetryResponse:
    """Delivers global fleet P99 latency, Shor resistance margins, and Grover speedup indices."""
    return engine.get_fleet_telemetry()


@app.get(
    "/v1/health",
    response_model=EngineHealthResponse,
    tags=["Infrastructure"],
    summary="Detailed Engine Health Diagnostics",
)
async def get_health_diagnostics() -> EngineHealthResponse:
    """Returns operational health, compute threshold, and clean-room compliance status."""
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
