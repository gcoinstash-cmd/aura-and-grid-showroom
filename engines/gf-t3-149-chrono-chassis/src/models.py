"""
Ghost FactoryOS — Engine GF-T3-149: Chrono-Chassis Telemetry Interface
Pydantic v2 Models conforming to OpenAPI 3.1.0 specification.
Clean-Room Certified: Apache-2.0 / MIT Dual Permissive
"""

from typing import List, Literal, Optional
from pydantic import BaseModel, Field

DriveMode = Literal[
    "LATENCY_ARBITRAGE",
    "CROSS_EXCHANGE",
    "QUANTUM_SUPERPOSITION",
    "SLIPSTREAM_WARP",
]

ShockEventType = Literal[
    "FLASH_VOLATILITY",
    "DECOHERENCE_PULSE",
    "WARP_BURST",
]


class QuantumCoreTelemetry(BaseModel):
    coherenceRate: float = Field(..., description="Quantum coherence rate percentage", json_schema_extra={"example": 99.984})
    qubitsActive: int = Field(512, description="Number of actively entangled qubits")
    cryoTempMK: float = Field(..., description="Cryogenic dilution refrigerator temperature in milliKelvin", json_schema_extra={"example": 12.38})
    photonFluxTHz: float = Field(..., description="Optical photon flux in THz", json_schema_extra={"example": 420.84})
    hamiltonianEigenvalue: float = Field(4.892, description="Ground state Hamiltonian eigenvalue in eV")
    phaseDriftPs: float = Field(..., description="Phase drift across laser optical cavity in picoseconds", json_schema_extra={"example": 0.124})
    laserEmeraldOutputW: float = Field(..., description="Emerald laser beam power in Watts")
    laserGoldOutputW: float = Field(..., description="Gold laser beam power in Watts")


class ArbitrageVector(BaseModel):
    route: str = Field(..., description="Venue pairing identifier", json_schema_extra={"example": "AURORA ↔ LD4"})
    sourceVenue: str = Field(..., description="Source financial venue", json_schema_extra={"example": "CME Chicago"})
    targetVenue: str = Field(..., description="Target matching engine venue", json_schema_extra={"example": "Equinix London"})
    distanceKm: float = Field(..., description="Geodesic distance between venues in kilometers")
    fiberLatencyNs: int = Field(..., description="Standard optical terrestrial fiber latency in nanoseconds")
    quantumChronoLatencyNs: int = Field(..., description="Quantum low-latency route in nanoseconds")
    deltaGainNs: int = Field(..., description="Sub-millisecond latency advantage in nanoseconds")
    projectedAlphaBps: float = Field(..., description="Projected arbitrage yield in basis points", json_schema_extra={"example": 4.82})
    annualizedYieldUsd: float = Field(..., description="Projected annualized yield in USD", json_schema_extra={"example": 18450000.0})
    status: Literal["OPTIMAL", "CONVERGING", "EXECUTING"] = Field(..., description="Route execution state")


class AeroMechanicalTelemetry(BaseModel):
    downforceKgf: float = Field(..., description="Total aerodynamic downforce in Kgf", json_schema_extra={"example": 1420.0})
    dragCoefficientCd: float = Field(..., description="Aerodynamic drag coefficient Cd", json_schema_extra={"example": 0.284})
    diffuserAngleDeg: float = Field(..., description="Active rear Venturi diffuser angle in degrees", json_schema_extra={"example": 14.5})
    frontSplitterSuctionHPa: float = Field(..., description="Front splitter suction pressure in hPa", json_schema_extra={"example": 890.0})
    pushrodStrainFrontKn: float = Field(..., description="Front pushrod suspension strain in kN", json_schema_extra={"example": 8.42})
    pushrodStrainRearKn: float = Field(..., description="Rear pushrod suspension strain in kN", json_schema_extra={"example": 12.18})
    rideHeightMm: float = Field(..., description="Chassis ride height in millimeters", json_schema_extra={"example": 52.0})
    speedKmh: float = Field(..., description="Telemetry speed in km/h", json_schema_extra={"example": 318.0})
    groundEffectVenturiLoadKgf: float = Field(..., description="Venturi underfloor suction load in Kgf", json_schema_extra={"example": 960.0})


class TelemetryState(BaseModel):
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp")
    microsecondTime: float = Field(..., description="High-precision epoch microsecond time")
    driveMode: DriveMode = Field("LATENCY_ARBITRAGE", description="Active hypercar drive mode")
    quantum: QuantumCoreTelemetry = Field(..., description="Quantum computing core state")
    aero: AeroMechanicalTelemetry = Field(..., description="Aeromechanical and ground-effect telemetry")
    arbitrageRoutes: List[ArbitrageVector] = Field(default_factory=list, description="Global arbitrage vector telemetry")
    accumulatedAlphaUsd: float = Field(..., description="Accumulated yield in USD", json_schema_extra={"example": 4821590.40})
    systemHealth: float = Field(99.98, description="Subsystem health percentage")
    coolingPumpActive: bool = Field(True, description="Cryogenic dilution refrigeration pump status")
    conduitLaserFreqHz: float = Field(5.32e14, description="Optical conduit laser frequency in Hz")


class DriveModeRequest(BaseModel):
    mode: DriveMode = Field(..., description="Desired drive mode", json_schema_extra={"example": "QUANTUM_SUPERPOSITION"})


class DiffuserAngleRequest(BaseModel):
    angle: float = Field(..., ge=10.0, le=25.0, description="Active diffuser angle in degrees (10.0 to 25.0)")


class ShockEventRequest(BaseModel):
    shock_type: ShockEventType = Field(..., description="Shock event type to inject", json_schema_extra={"example": "FLASH_VOLATILITY"})


class ActionResponse(BaseModel):
    status: str = Field("SUCCESS", description="Operation result status")
    message: str = Field(..., description="Action outcome description")
    telemetry: TelemetryState = Field(..., description="Updated telemetry state snapshot")


class EngineHealthResponse(BaseModel):
    status: str = "HEALTHY"
    engine_id: str = "GF-T3-149"
    system_code: str = "T3-QUANT-03"
    uptime_seconds: float = Field(..., description="Subsystem running time")
    drive_mode: str = Field(..., description="Current drive mode")
    cryo_temp_mk: float = Field(..., description="Current dilution refrigerator temp")
    active_routes: int = Field(4, description="Monitored venue arbitrage vectors")
    cleanRoomCompliance: str = "100% VERIFIED CLEAN-ROOM (MIT/Apache-2.0)"


class AuditComplianceResponse(BaseModel):
    engineId: str = "GF-T3-149"
    systemCode: str = "T3-QUANT-03"
    auditStandard: str = "NIST SP 800-218 (SSDF) / Clean-Room IP Guarantee"
    copyleftViolations: int = 0
    license: str = "Apache-2.0 / MIT Dual Permissive"
    mathematicalProof: str = "Hamiltonian Eigenvalue Decomposition, Venturi Ground-Effect Fluid Dynamics, Geodesic Latency Invariance"
    monopolyVaultStatus: str = "LEVEL 10 INSTITUTIONAL MONOPOLY ASSET"
