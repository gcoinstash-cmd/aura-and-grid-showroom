"""
GF-T3-349: Asynchronous FP8 Mixed-Precision Tensor Core & Scaled Dot-Product Interlock Engine
Clean-Room MIT Permissive Implementation — Zero Copyleft
"""

from __future__ import annotations

import math
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


class CorridorProfile(str, Enum):
    ALPHA = "FP8-CORRIDOR-ALPHA (DYNAMIC-SCALED-FABRIC · 146800-GB/S)"
    BRAVO = "FP8-CORRIDOR-BRAVO (MIXED-PRECISION-TENSOR-ENGINE)"
    GAMMA = "FP8-CORRIDOR-GAMMA (NON-BLOCKING-SCALING-FACTOR-ROUTER)"
    DELTA = "FP8-CORRIDOR-DELTA (FALLBACK-FP16-UNSCALED-PASS)"


FP8_E4M3_MAX: float = 448.0
FP8_E5M2_MAX: float = 57344.0
BASELINE_THROUGHPUT_GBPS: int = 146800
BASELINE_LATENCY_US: float = 0.01
BASELINE_TOKENS: int = 34200000


@dataclass
class MatrixArenaState:
    matrix_id: int
    label: str
    hex_ptr: str
    tokens_k: int
    fp8_saturation_pct: int
    sync_pct: int
    latency_ms: float
    omega_scale: float
    amax_history: List[float] = field(default_factory=lambda: [1.06, 1.07, 1.06, 1.07])
    status: str = "SCALED · LOCKED"
    precision: str = "FP8"
    outlier_spike_active: bool = False


class StepSimulationRequest(BaseModel):
    corridor: CorridorProfile = Field(default=CorridorProfile.ALPHA)
    inject_burst: bool = Field(default=False)
    outlier_spike: bool = Field(default=False)
    q_vector: List[float] = Field(default_factory=lambda: [1.06, 1.07, 1.06, 1.07])
    k_vector: List[float] = Field(default_factory=lambda: [1.04, 1.05, 1.06, 1.05])
    v_vector: List[float] = Field(default_factory=lambda: [0.98, 1.02, 1.01, 0.99])


class MatrixTelemetryDTO(BaseModel):
    matrix_id: int
    label: str
    hex_ptr: str
    tokens_k: int
    fp8_saturation_pct: int
    sync_pct: int
    latency_ms: float
    omega_scale: float
    status: str
    precision: str
    outlier_spike_active: bool


class TelemetrySnapshotDTO(BaseModel):
    chassis_id: str
    corridor: str
    fp8_throughput_gbps: int
    scaling_latency_us: float
    active_matrices_count: int
    total_matrices_count: int
    processed_tokens_units: int
    engine_xp_k: float
    fp8_state: str
    mesh_ptr: str
    mode: str
    scale_vector: List[float]
    fp8_accumulator_output: float
    perplexity_drift: float
    matrices: List[MatrixTelemetryDTO]


class FP8TensorCoreInterlockEngine:
    """
    Deterministic clean-room solver for Asynchronous FP8 Mixed-Precision Tensor Core
    and Scaled Dot-Product Interlock:
    F_fp8 = sum_{f=0}^{F-1} M_fp8(Q_fp8, K_fp8, V_fp8, Omega_scale)
    """

    def __init__(self) -> None:
        self.corridor: CorridorProfile = CorridorProfile.ALPHA
        self.fp8_throughput_gbps: int = BASELINE_THROUGHPUT_GBPS
        self.scaling_latency_us: float = BASELINE_LATENCY_US
        self.processed_tokens_units: int = BASELINE_TOKENS
        self.engine_xp_k: float = 75.0
        self.outlier_spike_mode: bool = False
        self.burst_mode: bool = False
        self.pass_counter: int = 0
        self.matrices: List[MatrixArenaState] = self._init_matrices()

    def _init_matrices(self) -> List[MatrixArenaState]:
        arenas: List[MatrixArenaState] = []
        for idx in range(8):
            hex_addr = f"0x580{idx}0" if idx > 0 else "0x58000"
            arenas.append(
                MatrixArenaState(
                    matrix_id=idx,
                    label=f"Matrix {idx} (M{idx})",
                    hex_ptr=hex_addr,
                    tokens_k=256,
                    fp8_saturation_pct=100,
                    sync_pct=100,
                    latency_ms=0.02,
                    omega_scale=1.06 if idx % 2 == 0 else 1.07,
                )
            )
        return arenas

    @staticmethod
    def compute_dynamic_scaling_factor(tensor_values: List[float], fp8_max: float = FP8_E4M3_MAX) -> float:
        """
        Non-blocking block-scaled factor recalibration across streaming multiprocessors.
        Computes Omega_scale = fp8_max / max(|x|, epsilon) and normalizes into stable scale band.
        """
        if not tensor_values:
            return 1.0
        amax = max(abs(val) for val in tensor_values)
        if amax < 1e-9:
            return 1.0
        raw_scale = fp8_max / amax
        normalized_omega = 1.0 + (math.log1p(raw_scale) / 60.0)
        return round(normalized_omega, 4)

    @staticmethod
    def quantize_e4m3(values: List[float], omega_scale: float) -> List[float]:
        """
        Quantizes floating point activations into simulated FP8 E4M3 dynamic range [-448.0, 448.0].
        """
        quantized: List[float] = []
        for v in values:
            scaled = v * omega_scale
            clamped = max(-FP8_E4M3_MAX, min(FP8_E4M3_MAX, scaled))
            quantized.append(round(clamped, 6))
        return quantized

    def compute_scaled_dot_product_interlock(
        self,
        q_vec: List[float],
        k_vec: List[float],
        v_vec: List[float],
        omega_scale: float,
    ) -> float:
        """
        Evaluates F_fp8 = sum_{f=0}^{F-1} M_fp8(Q_fp8, K_fp8, V_fp8, Omega_scale).
        """
        if not (len(q_vec) == len(k_vec) == len(v_vec)) or len(q_vec) == 0:
            raise ValueError("Q, K, V vectors must have identical non-zero dimensions")

        q_fp8 = self.quantize_e4m3(q_vec, omega_scale)
        k_fp8 = self.quantize_e4m3(k_vec, omega_scale)
        v_fp8 = self.quantize_e4m3(v_vec, omega_scale)

        dim = len(q_fp8)
        inv_sqrt_d = 1.0 / math.sqrt(float(dim))
        inv_unscale = 1.0 / (omega_scale * omega_scale)

        logits: List[float] = [
            (q_fp8[i] * k_fp8[i]) * inv_sqrt_d * inv_unscale for i in range(dim)
        ]
        max_logit = max(logits)
        exp_scores = [math.exp(l - max_logit) for l in logits]
        denom = sum(exp_scores) or 1.0
        attn_weights = [s / denom for s in exp_scores]

        accum = sum(attn_weights[i] * (v_fp8[i] / omega_scale) for i in range(dim))
        return round(accum, 6)

    def trigger_tensor_core_burst(self) -> TelemetrySnapshotDTO:
        self.burst_mode = True
        self.pass_counter += 1
        self.fp8_throughput_gbps = 164200
        self.scaling_latency_us = 0.01
        self.processed_tokens_units += 1280000
        self.engine_xp_k = round(self.engine_xp_k + 4.5, 1)

        for m in self.matrices:
            m.tokens_k += 16
            m.fp8_saturation_pct = 100
            m.sync_pct = 100
            m.latency_ms = 0.01
            m.status = "BURST · LOCKED"
            m.precision = "FP8"
            m.outlier_spike_active = False

        return self.snapshot()

    def toggle_outlier_overflow_spike(self, force_state: Optional[bool] = None) -> TelemetrySnapshotDTO:
        if force_state is None:
            self.outlier_spike_mode = not self.outlier_spike_mode
        else:
            self.outlier_spike_mode = force_state

        if self.outlier_spike_mode:
            self.fp8_throughput_gbps = 138400
            self.scaling_latency_us = 0.02
            for idx, m in enumerate(self.matrices):
                if idx in (2, 5):
                    m.outlier_spike_active = True
                    m.fp8_saturation_pct = 96
                    m.sync_pct = 99
                    m.latency_ms = 0.03
                    m.omega_scale = self.compute_dynamic_scaling_factor([142.5, 88.4, 210.0, 64.0])
                    m.status = "RE-CAL · GUARD"
                else:
                    m.outlier_spike_active = False
                    m.status = "SCALED · LOCKED"
        else:
            self.fp8_throughput_gbps = BASELINE_THROUGHPUT_GBPS
            self.scaling_latency_us = BASELINE_LATENCY_US
            for idx, m in enumerate(self.matrices):
                m.outlier_spike_active = False
                m.fp8_saturation_pct = 100
                m.sync_pct = 100
                m.latency_ms = 0.02
                m.omega_scale = 1.06 if idx % 2 == 0 else 1.07
                m.status = "SCALED · LOCKED"

        return self.snapshot()

    def step_asynchronous_pass(self, req: Optional[StepSimulationRequest] = None) -> TelemetrySnapshotDTO:
        if req is not None:
            self.corridor = req.corridor
            if req.inject_burst:
                return self.trigger_tensor_core_burst()
            if req.outlier_spike != self.outlier_spike_mode:
                self.toggle_outlier_overflow_spike(req.outlier_spike)

        self.pass_counter += 1
        self.processed_tokens_units += 640000
        self.engine_xp_k = round(self.engine_xp_k + 2.5, 1)

        if self.corridor == CorridorProfile.DELTA:
            self.fp8_throughput_gbps = 73400
            self.scaling_latency_us = 0.04
            for m in self.matrices:
                m.precision = "FP16"
                m.fp8_saturation_pct = 50
                m.latency_ms = 0.04
                m.status = "FP16 · UNSCALED"
        else:
            self.fp8_throughput_gbps = BASELINE_THROUGHPUT_GBPS + (self.pass_counter % 5) * 450
            self.scaling_latency_us = BASELINE_LATENCY_US
            for idx, m in enumerate(self.matrices):
                m.tokens_k += 8
                m.precision = "FP8"
                m.fp8_saturation_pct = 100
                m.sync_pct = 100
                m.latency_ms = 0.02
                m.omega_scale = round(1.06 + ((idx + self.pass_counter) % 3) * 0.01, 2)
                m.status = "SCALED · LOCKED"

        return self.snapshot()

    def flush_arenas(self) -> TelemetrySnapshotDTO:
        self.corridor = CorridorProfile.ALPHA
        self.fp8_throughput_gbps = BASELINE_THROUGHPUT_GBPS
        self.scaling_latency_us = BASELINE_LATENCY_US
        self.processed_tokens_units = BASELINE_TOKENS
        self.engine_xp_k = 75.0
        self.outlier_spike_mode = False
        self.burst_mode = False
        self.pass_counter = 0
        self.matrices = self._init_matrices()
        return self.snapshot()

    def snapshot(self) -> TelemetrySnapshotDTO:
        scale_vec = [m.omega_scale for m in self.matrices[:4]]
        f_fp8 = self.compute_scaled_dot_product_interlock(
            [1.06, 1.07, 1.06, 1.07],
            [1.04, 1.05, 1.06, 1.05],
            [0.98, 1.02, 1.01, 0.99],
            scale_vec[0],
        )
        return TelemetrySnapshotDTO(
            chassis_id="GF-T3-349",
            corridor=self.corridor.value,
            fp8_throughput_gbps=self.fp8_throughput_gbps,
            scaling_latency_us=self.scaling_latency_us,
            active_matrices_count=len(self.matrices),
            total_matrices_count=8,
            processed_tokens_units=self.processed_tokens_units,
            engine_xp_k=self.engine_xp_k,
            fp8_state="Active" if not self.outlier_spike_mode else "Re-Calibrating",
            mesh_ptr="0x58F8DC0",
            mode="FP8_TENSOR_CORE" if self.corridor != CorridorProfile.DELTA else "FP16_FALLBACK",
            scale_vector=scale_vec,
            fp8_accumulator_output=f_fp8,
            perplexity_drift=0.0,
            matrices=[
                MatrixTelemetryDTO(
                    matrix_id=m.matrix_id,
                    label=m.label,
                    hex_ptr=m.hex_ptr,
                    tokens_k=m.tokens_k,
                    fp8_saturation_pct=m.fp8_saturation_pct,
                    sync_pct=m.sync_pct,
                    latency_ms=m.latency_ms,
                    omega_scale=m.omega_scale,
                    status=m.status,
                    precision=m.precision,
                    outlier_spike_active=m.outlier_spike_active,
                )
                for m in self.matrices
            ],
        )


app = FastAPI(
    title="GF-T3-349",
    description="Asynchronous FP8 Mixed-Precision Tensor Core & Scaled Dot-Product Interlock Engine",
    version="3.4.9",
)

engine_instance = FP8TensorCoreInterlockEngine()


@app.get("/health")
def health_check() -> Dict[str, str]:
    return {
        "status": "HEALTHY",
        "chassis": "GF-T3-349",
        "fp8_state": "Active",
    }


@app.get("/api/v1/telemetry", response_model=TelemetrySnapshotDTO)
def get_telemetry() -> TelemetrySnapshotDTO:
    return engine_instance.snapshot()


@app.post("/api/v1/step", response_model=TelemetrySnapshotDTO)
def step_pass(req: StepSimulationRequest) -> TelemetrySnapshotDTO:
    try:
        return engine_instance.step_asynchronous_pass(req)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/v1/burst", response_model=TelemetrySnapshotDTO)
def inject_burst() -> TelemetrySnapshotDTO:
    return engine_instance.trigger_tensor_core_burst()


@app.post("/api/v1/outlier-spike", response_model=TelemetrySnapshotDTO)
def toggle_spike() -> TelemetrySnapshotDTO:
    return engine_instance.toggle_outlier_overflow_spike()


@app.post("/api/v1/flush", response_model=TelemetrySnapshotDTO)
def flush_engine() -> TelemetrySnapshotDTO:
    return engine_instance.flush_arenas()
