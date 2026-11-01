"""
GF-T3-352: Asynchronous FP4 Quantization & 4-Bit Weight-Only Dequantization Interlock Engine
Clean-Room Standalone FastAPI Microservice (MIT License)
Zero-Dollar Telemetry Standard Compliant
"""

from __future__ import annotations

import math
from enum import Enum
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(
    title="GF-T3-352",
    description="Asynchronous FP4 Quantization & 4-Bit Weight-Only Dequantization Interlock Engine",
    version="3.5.2",
)


class CorridorId(str, Enum):
    ALPHA = "FP4-CORRIDOR-ALPHA (DYNAMIC-4BIT-PACKING-FABRIC · 152600-GB/S)"
    BRAVO = "FP4-CORRIDOR-BRAVO (WEIGHT-ONLY-DEQUANT-ENGINE)"
    GAMMA = "FP4-CORRIDOR-GAMMA (NON-BLOCKING-FP4-UNPACKING-ROUTER)"
    DELTA = "FP4-CORRIDOR-DELTA (FALLBACK-INT8-UNPACKED-PASS)"


# E2M1 4-Bit Floating Point Lookup Table (1 sign bit, 2 exponent bits, 1 mantissa bit)
FP4_E2M1_POSITIVE_LUT: List[float] = [
    0.0,
    0.5,
    1.0,
    1.5,
    2.0,
    3.0,
    4.0,
    6.0,
]


def encode_fp4_nibble(value: float, scale: float) -> int:
    """
    Quantizes a floating-point scalar into a 4-bit E2M1 nibble [0..15]
    using deterministic nearest-neighbor rounding after dividing by block scale.
    """
    if scale <= 0.0:
        raise ValueError("Scale factor must be strictly positive")
    normalized = value / scale
    sign_bit = 0x08 if normalized < 0.0 else 0x00
    magnitude = abs(normalized)

    best_idx = 0
    best_err = abs(magnitude - FP4_E2M1_POSITIVE_LUT[0])
    for idx in range(1, len(FP4_E2M1_POSITIVE_LUT)):
        err = abs(magnitude - FP4_E2M1_POSITIVE_LUT[idx])
        if err < best_err:
            best_err = err
            best_idx = idx

    return sign_bit | best_idx


def decode_fp4_nibble(nibble: int, scale: float) -> float:
    """
    Hardware-emulated on-the-fly 4-bit weight-only dequantization:
    D_fp4(W_fp4, scale) = (-1)^sign * LUT[nibble & 0x07] * scale
    """
    if not (0 <= nibble <= 15):
        raise ValueError("FP4 nibble must be within [0, 15]")
    sign = -1.0 if (nibble & 0x08) != 0 else 1.0
    mag_idx = nibble & 0x07
    return sign * FP4_E2M1_POSITIVE_LUT[mag_idx] * scale


def pack_fp4_pair(w_low: float, w_high: float, scale: float) -> int:
    """
    Packs two floating-point weights into a single 8-bit unsigned byte (2 x 4-bit nibbles).
    Achieves 4X memory footprint compression relative to FP16/BF16.
    """
    low_nibble = encode_fp4_nibble(w_low, scale) & 0x0F
    high_nibble = encode_fp4_nibble(w_high, scale) & 0x0F
    return (high_nibble << 4) | low_nibble


def unpack_fp4_pair(packed_byte: int, scale: float) -> tuple[float, float]:
    """
    Unpacks an 8-bit byte into two dequantized floating-point weights without host stalls.
    """
    if not (0 <= packed_byte <= 255):
        raise ValueError("Packed byte must be within [0, 255]")
    low_nibble = packed_byte & 0x0F
    high_nibble = (packed_byte >> 4) & 0x0F
    return (
        decode_fp4_nibble(low_nibble, scale),
        decode_fp4_nibble(high_nibble, scale),
    )


def compute_dynamic_block_scale(weights: List[float], outlier_clamp_ratio: float = 1.0) -> float:
    """
    Computes dynamic group scale factor Delta_scale for an FP4 weight block.
    Max representable E2M1 magnitude is 6.0.
    """
    if not weights:
        return 1.0
    max_abs = max(abs(w) for w in weights) * max(0.1, outlier_clamp_ratio)
    if max_abs < 1e-9:
        return 1e-4
    return max_abs / 6.0


def execute_fp4_gemm_interlock(
    weights: List[float],
    activations: List[float],
    outlier_spike_active: bool = False,
) -> Dict[str, float]:
    """
    Executes F_fp4 = sum_{j=0}^{J-1} D_fp4(W_fp4, X_activation, Delta_scale).
    Pairs weights into packed 8-bit bytes (2 FP4 weights per byte), then performs
    on-the-fly dequantization fused with activation dot-product accumulation.
    """
    if len(weights) != len(activations):
        raise ValueError("Weight and activation vectors must have identical length")
    if len(weights) == 0:
        raise ValueError("Vectors must not be empty")

    # Pad to even count if odd
    padded_w = list(weights)
    padded_x = list(activations)
    if len(padded_w) % 2 != 0:
        padded_w.append(0.0)
        padded_x.append(0.0)

    clamp_ratio = 1.35 if outlier_spike_active else 1.0
    scale = compute_dynamic_block_scale(padded_w, clamp_ratio)

    packed_bytes: List[int] = []
    for i in range(0, len(padded_w), 2):
        packed_bytes.append(pack_fp4_pair(padded_w[i], padded_w[i + 1], scale))

    accum_fp4 = 0.0
    accum_ref = 0.0
    sq_error = 0.0
    for idx, b in enumerate(packed_bytes):
        w0_dq, w1_dq = unpack_fp4_pair(b, scale)
        x0 = padded_x[2 * idx]
        x1 = padded_x[2 * idx + 1]
        accum_fp4 += (w0_dq * x0) + (w1_dq * x1)
        accum_ref += (padded_w[2 * idx] * x0) + (padded_w[2 * idx + 1] * x1)
        sq_error += (w0_dq - padded_w[2 * idx]) ** 2 + (w1_dq - padded_w[2 * idx + 1]) ** 2

    rmse = math.sqrt(sq_error / len(padded_w))
    compression_ratio = (len(padded_w) * 16.0) / (len(packed_bytes) * 8.0)

    return {
        "fp4_dot_product": round(accum_fp4, 6),
        "reference_dot_product": round(accum_ref, 6),
        "block_scale": round(scale, 6),
        "dequant_rmse": round(rmse, 6),
        "memory_compression_ratio": round(compression_ratio, 2),
        "packed_byte_count": float(len(packed_bytes)),
    }


class WeightSlotState(BaseModel):
    weight_id: str
    index: int
    hex_ptr: str
    tokens_k: int
    fp4_load_pct: int
    sync_pct: int
    latency_ms: float
    status: str
    scale_factor: float


class EngineTelemetryResponse(BaseModel):
    unit_id: str
    corridor: CorridorId
    dequantization_throughput_gbps: int
    unpacking_latency_us: float
    active_weights_count: int
    total_weights_count: int
    processed_tokens_units: int
    engine_xp_k: float
    fp4_state: str
    outlier_spike_active: bool
    mesh_ptr: str
    scale_vec: List[float]
    weights: List[WeightSlotState]


class QuantizationPassRequest(BaseModel):
    weights: List[float] = Field(..., min_length=2)
    activations: List[float] = Field(..., min_length=2)
    outlier_spike: bool = False


class EngineRuntime:
    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        self.corridor: CorridorId = CorridorId.ALPHA
        self.dequantization_throughput_gbps: int = 152600
        self.unpacking_latency_us: float = 0.01
        self.processed_tokens_units: int = 36600000
        self.engine_xp_k: float = 75.0
        self.fp4_state: str = "Active"
        self.outlier_spike_active: bool = False
        self.mesh_ptr: str = "0x5BF8DC0"
        self.scale_vec: List[float] = [1.09, 1.10, 1.09, 1.10]
        self.weights: List[WeightSlotState] = [
            WeightSlotState(
                weight_id=f"W{i}",
                index=i,
                hex_ptr=f"0x5B0{i}0",
                tokens_k=256,
                fp4_load_pct=100,
                sync_pct=100,
                latency_ms=0.02,
                status="DEQUANTIZED · LOCKED",
                scale_factor=1.09 if i % 2 == 0 else 1.10,
            )
            for i in range(8)
        ]

    def trigger_burst(self) -> EngineTelemetryResponse:
        self.dequantization_throughput_gbps = 168400
        self.unpacking_latency_us = 0.01
        self.processed_tokens_units += 1250000
        self.engine_xp_k = round(self.engine_xp_k + 4.5, 1)
        for w in self.weights:
            w.tokens_k += 32
            w.fp4_load_pct = 100
            w.status = "BURST · LOCKED"
        return self.snapshot()

    def toggle_outlier_spike(self) -> EngineTelemetryResponse:
        self.outlier_spike_active = not self.outlier_spike_active
        if self.outlier_spike_active:
            self.dequantization_throughput_gbps = 141200
            self.unpacking_latency_us = 0.02
            self.scale_vec = [1.47, 1.49, 1.46, 1.48]
            self.fp4_state = "Re-Calibrating"
            for i, w in enumerate(self.weights):
                w.scale_factor = self.scale_vec[i % 4]
                w.latency_ms = 0.03
                w.status = "SCALE-RECAL · ACTIVE"
        else:
            self.dequantization_throughput_gbps = 152600
            self.unpacking_latency_us = 0.01
            self.scale_vec = [1.09, 1.10, 1.09, 1.10]
            self.fp4_state = "Active"
            for i, w in enumerate(self.weights):
                w.scale_factor = self.scale_vec[i % 4]
                w.latency_ms = 0.02
                w.status = "DEQUANTIZED · LOCKED"
        return self.snapshot()

    def step_dequant_pass(self) -> EngineTelemetryResponse:
        self.processed_tokens_units += 512000
        self.engine_xp_k = round(self.engine_xp_k + 2.0, 1)
        self.dequantization_throughput_gbps = 156800 if not self.outlier_spike_active else 144500
        for w in self.weights:
            w.tokens_k += 16
            w.sync_pct = 100
            w.status = "DEQUANTIZED · LOCKED"
        return self.snapshot()

    def snapshot(self) -> EngineTelemetryResponse:
        return EngineTelemetryResponse(
            unit_id="GF-T3-352",
            corridor=self.corridor,
            dequantization_throughput_gbps=self.dequantization_throughput_gbps,
            unpacking_latency_us=self.unpacking_latency_us,
            active_weights_count=len(self.weights),
            total_weights_count=len(self.weights),
            processed_tokens_units=self.processed_tokens_units,
            engine_xp_k=self.engine_xp_k,
            fp4_state=self.fp4_state,
            outlier_spike_active=self.outlier_spike_active,
            mesh_ptr=self.mesh_ptr,
            scale_vec=self.scale_vec,
            weights=self.weights,
        )


runtime = EngineRuntime()


@app.get("/api/v1/telemetry", response_model=EngineTelemetryResponse)
def get_telemetry() -> EngineTelemetryResponse:
    return runtime.snapshot()


@app.post("/api/v1/quantize-pass")
def run_quantize_pass(req: QuantizationPassRequest) -> Dict[str, float]:
    try:
        return execute_fp4_gemm_interlock(
            weights=req.weights,
            activations=req.activations,
            outlier_spike_active=req.outlier_spike,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/v1/actions/burst", response_model=EngineTelemetryResponse)
def action_burst() -> EngineTelemetryResponse:
    return runtime.trigger_burst()


@app.post("/api/v1/actions/outlier-spike", response_model=EngineTelemetryResponse)
def action_outlier_spike() -> EngineTelemetryResponse:
    return runtime.toggle_outlier_spike()


@app.post("/api/v1/actions/step-pass", response_model=EngineTelemetryResponse)
def action_step_pass() -> EngineTelemetryResponse:
    return runtime.step_dequant_pass()


@app.post("/api/v1/actions/flush", response_model=EngineTelemetryResponse)
def action_flush() -> EngineTelemetryResponse:
    runtime.reset()
    return runtime.snapshot()
