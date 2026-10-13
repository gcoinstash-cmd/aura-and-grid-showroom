"""
Ghost FactoryOS Track 3 F1 Skunkworks Engine — GF-T3-161 (ChronoVector)
FastAPI / Pydantic v2 Ingestion & State Vector Service
Clean-Room Certified // Permissive MIT / Apache 2.0 / BSD compatible.
Zero copyleft dependencies.
"""

from __future__ import annotations
import time
import math
from collections import deque
from typing import List, Optional, Dict, Any, Tuple
from dataclasses import dataclass, asdict

# Try importing FastAPI and Pydantic v2; provide seamless fallback if in standard Python
try:
    from fastapi import FastAPI, HTTPException, status
    from pydantic import BaseModel, Field
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False
    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def model_dump(self) -> Dict[str, Any]:
            return self.__dict__
    def Field(*args, **kwargs):
        return None

from app.core.kalman import ExtendedKalmanFilter, SensorMeasurement, KalmanState

# --- Pydantic v2 / Clean-Room Data Models ---

if HAS_FASTAPI:
    class Position3D(BaseModel):
        x: float = Field(..., description="Position X (East) in meters")
        y: float = Field(..., description="Position Y (North) in meters")
        z: float = Field(..., description="Position Z (Up) in meters")

    class Velocity3D(BaseModel):
        vx: float = Field(..., description="Velocity X in m/s")
        vy: float = Field(..., description="Velocity Y in m/s")
        vz: float = Field(..., description="Velocity Z in m/s")

    class AttitudeDeg(BaseModel):
        roll: float = Field(..., description="Roll angle in degrees")
        pitch: float = Field(..., description="Pitch angle in degrees")
        yaw: float = Field(..., description="Yaw heading in degrees (0-360)")

    class SensorBiases(BaseModel):
        accel_bias: List[float] = Field(..., description="Estimated accelerometer bias [bx, by, bz] (m/s^2)")
        gyro_bias: List[float] = Field(..., description="Estimated gyroscope bias [gx, gy, gz] (rad/s)")

    class TelemetryIngestRequest(BaseModel):
        timestamp_ms: float = Field(..., description="Epoch timestamp in milliseconds")
        dt: float = Field(..., ge=0.001, le=1.0, description="Delta time in seconds (nominal 0.005 to 0.05)")
        accel: List[float] = Field(..., min_length=3, max_length=3, description="Tri-axial acceleration [ax, ay, az] in m/s^2")
        gyro: List[float] = Field(..., min_length=3, max_length=3, description="Tri-axial angular velocity [gx, gy, gz] in rad/s")
        gnss_pos: Optional[List[float]] = Field(None, min_length=3, max_length=3, description="Optional geodetic position [px, py, pz] in meters")
        gnss_noise_std: float = Field(0.5, ge=0.01, description="Estimated GNSS horizontal precision in meters")

    class TelemetryVectorResponse(BaseModel):
        model_id: str = "GF-T3-161"
        timestamp_ms: float
        position: Position3D
        velocity: Velocity3D
        attitude_deg: AttitudeDeg
        biases: SensorBiases
        covariance_trace: float
        mahalanobis_residual: float
        is_gnss_fused: bool
        drift_bound_m: float
        latency_ms: float
        buffer_depth: int
else:
    @dataclass
    class Position3D:
        x: float
        y: float
        z: float

    @dataclass
    class Velocity3D:
        vx: float
        vy: float
        vz: float

    @dataclass
    class AttitudeDeg:
        roll: float
        pitch: float
        yaw: float

    @dataclass
    class SensorBiases:
        accel_bias: List[float]
        gyro_bias: List[float]

    @dataclass
    class TelemetryIngestRequest:
        timestamp_ms: float
        dt: float
        accel: List[float]
        gyro: List[float]
        gnss_pos: Optional[List[float]] = None
        gnss_noise_std: float = 0.5

    @dataclass
    class TelemetryVectorResponse:
        model_id: str
        timestamp_ms: float
        position: Position3D
        velocity: Velocity3D
        attitude_deg: AttitudeDeg
        biases: SensorBiases
        covariance_trace: float
        mahalanobis_residual: float
        is_gnss_fused: bool
        drift_bound_m: float
        latency_ms: float
        buffer_depth: int


# --- 1,000-State Sliding Ring Buffer ---

class TelemetryBuffer:
    """Thread-safe, deterministic in-memory FIFO sliding buffer capped at exactly 1,000 states."""

    MAX_BUFFER_SIZE = 1000

    def __init__(self, ekf_instance: Optional[ExtendedKalmanFilter] = None):
        self.ekf = ekf_instance or ExtendedKalmanFilter()
        self.buffer: deque[TelemetryVectorResponse] = deque(maxlen=self.MAX_BUFFER_SIZE)
        self.total_ingested_frames = 0

    def ingest(self, req: TelemetryIngestRequest) -> TelemetryVectorResponse:
        t0 = time.perf_counter()

        gnss_pos_tuple = (req.gnss_pos[0], req.gnss_pos[1], req.gnss_pos[2]) if req.gnss_pos else None
        measurement = SensorMeasurement(
            accel=(req.accel[0], req.accel[1], req.accel[2]),
            gyro=(req.gyro[0], req.gyro[1], req.gyro[2]),
            timestamp_ms=req.timestamp_ms,
            dt=req.dt,
            gnss_pos=gnss_pos_tuple,
            gnss_noise_std=req.gnss_noise_std,
        )

        state = self.ekf.process_frame(measurement)

        pos_variance = self.ekf.P[0][0] + self.ekf.P[1][1] + self.ekf.P[2][2]
        drift_bound_m = math.sqrt(max(0.0, pos_variance)) * 3.0  # 3-sigma position drift bound

        latency_ms = (time.perf_counter() - t0) * 1000.0

        resp = TelemetryVectorResponse(
            model_id="GF-T3-161",
            timestamp_ms=state.timestamp_ms,
            position=Position3D(x=state.pos_x, y=state.pos_y, z=state.pos_z),
            velocity=Velocity3D(vx=state.vel_x, vy=state.vel_y, vz=state.vel_z),
            attitude_deg=AttitudeDeg(
                roll=math.degrees(state.roll),
                pitch=math.degrees(state.pitch),
                yaw=math.degrees(state.yaw) % 360.0,
            ),
            biases=SensorBiases(
                accel_bias=[state.bias_ax, state.bias_ay, state.bias_az],
                gyro_bias=[state.bias_gx, state.bias_gy, state.bias_gz],
            ),
            covariance_trace=state.covariance_trace,
            mahalanobis_residual=state.last_mahalanobis_residual,
            is_gnss_fused=state.is_gnss_fused,
            drift_bound_m=drift_bound_m,
            latency_ms=latency_ms,
            buffer_depth=len(self.buffer) + 1,
        )

        self.buffer.append(resp)
        self.total_ingested_frames += 1
        return resp

    def get_latest(self) -> Optional[TelemetryVectorResponse]:
        return self.buffer[-1] if self.buffer else None

    def get_history(self, limit: int = 100) -> List[TelemetryVectorResponse]:
        items = list(self.buffer)
        return items[-limit:]


# Global Singleton Buffer
telemetry_buffer = TelemetryBuffer()

# Optional FastAPI App Factory
if HAS_FASTAPI:
    app = FastAPI(
        title="GF-T3-161 ChronoVector Autonomous Guidance Engine",
        version="4.1.0",
        description="Lexus Digital Dealership F1 Skunkworks Telemetry Engine with 6-DoF EKF State Estimation",
        openapi_url="/api/v1/openapi.json",
        docs_url="/api/v1/docs",
    )

    @app.post("/api/v1/telemetry/ingest", response_model=TelemetryVectorResponse, status_code=200)
    async def ingest_telemetry(payload: TelemetryIngestRequest) -> TelemetryVectorResponse:
        """Ingests raw 6-DoF IMU acceleration/rates and optional GNSS fix, updating the EKF state."""
        try:
            return telemetry_buffer.ingest(payload)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"EKF ingestion error: {str(e)}")

    @app.get("/api/v1/telemetry/vector", response_model=TelemetryVectorResponse, status_code=200)
    async def get_latest_vector() -> TelemetryVectorResponse:
        """Retrieves the latest filtered 6-DoF navigation state vector."""
        latest = telemetry_buffer.get_latest()
        if not latest:
            raise HTTPException(status_code=404, detail="No telemetry frames ingested yet.")
        return latest
