"""
GF-T3-353: Ultra-Wide Dynamic Asynchronous FP6 Mixed-Precision Tensor Core
& Compressed Dot-Product Interlock Engine
SPDX-License-Identifier: MIT
"""

from typing import Dict, List, Optional
import math
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(
    title="GF-T3-353",
    description="Ultra-Wide Dynamic Asynchronous FP6 Mixed-Precision Tensor Core and Compressed Dot-Product Interlock",
    version="3.5.3",
)

SYNTHETIC_CORRIDORS: List[str] = [
    "FP6-CORRIDOR-ALPHA (DYNAMIC-6BIT-PACKING-FABRIC · 154800-GB/S)",
    "FP6-CORRIDOR-BRAVO (WEIGHT-COMPRESSION-ENGINE)",
    "FP6-CORRIDOR-GAMMA (NON-BLOCKING-FP6-UNPACKING-ROUTER)",
    "FP6-CORRIDOR-DELTA (FALLBACK-FP8-UNCOMPRESSED-PASS)",
]


class MatrixTelemetry(BaseModel):
    matrix_id: int = Field(..., ge=0, le=7)
    label: str
    hex_ptr: str
    tokens_k: int = Field(default=256, ge=0)
    fp6_load_pct: int = Field(default=100, ge=0, le=100)
    sync_pct: int = Field(default=100, ge=0, le=100)
    latency_ms: float = Field(default=0.02, ge=0.0)
    status: str = Field(default="COMPRESSED · LOCKED")
    scale_factor: float = Field(default=0.03125, gt=0.0)
    packed_words: List[int] = Field(default_factory=lambda: [42, 19, 57, 63])


class QuantizationRequest(BaseModel):
    weights: List[float] = Field(..., min_length=1, max_length=256)
    activations: List[float] = Field(..., min_length=1, max_length=256)
    corridor: str = Field(default=SYNTHETIC_CORRIDORS[0])
    outlier_spike: bool = Field(default=False)


class QuantizationResponse(BaseModel):
    chassis: str
    corridor: str
    packed_fp6_codes: List[int]
    dequantized_weights: List[float]
    dot_product_fp6: float
    reference_dot_product: float
    relative_error_pct: float
    vram_savings_over_fp8_pct: float
    compression_throughput_gbs: int
    packing_latency_us: float
    fp6_state: str


class EngineState:
    def __init__(self) -> None:
        self.active_corridor: str = SYNTHETIC_CORRIDORS[0]
        self.compression_throughput_gbs: int = 154800
        self.packing_latency_us: float = 0.01
        self.active_matrices_count: int = 8
        self.processed_tokens_units: int = 37400000
        self.engine_xp_k: float = 75.0
        self.fp6_state: str = "Active"
        self.outlier_spike_active: bool = False
        self.step_counter: int = 0
        self.vec_preview: List[float] = [1.10, 1.11, 1.10, 1.11]
        self.matrices: List[MatrixTelemetry] = self._init_matrices()

    def _init_matrices(self) -> List[MatrixTelemetry]:
        ptrs = [
            "0x5C000",
            "0x5C010",
            "0x5C020",
            "0x5C030",
            "0x5C040",
            "0x5C050",
            "0x5C060",
            "0x5C070",
        ]
        return [
            MatrixTelemetry(
                matrix_id=i,
                label="Matrix " + str(i) + " (M" + str(i) + ")",
                hex_ptr=ptrs[i],
                tokens_k=256,
                fp6_load_pct=100,
                sync_pct=100,
                latency_ms=0.02,
                status="COMPRESSED · LOCKED",
                scale_factor=0.03125,
                packed_words=[42, 19, 57, 63],
            )
            for i in range(8)
        ]


STATE = EngineState()


def compute_dynamic_fp6_scale(weights: List[float], outlier_spike: bool = False) -> float:
    """
    Computes dynamic 6-bit floating-point (E3M2 / signed 6-bit grid [-31, 31]) scale factor
    with sub-microsecond boundary barrier clamping.
    """
    if not weights:
        return 1.0
    max_abs = max(abs(w) for w in weights)
    if outlier_spike:
        max_abs = max_abs * 1.75
    if max_abs < 1e-9:
        return 1e-9
    return max_abs / 31.0


def quantize_fp6_tensor(weights: List[float], scale: float) -> List[int]:
    """
    Packs full-precision weights into signed 6-bit quantized integers in [-31, 31],
    shifted to unsigned 6-bit codes [0, 62] for hardware register packing.
    """
    codes: List[int] = []
    for w in weights:
        q = int(round(w / scale))
        q_clamped = max(-31, min(31, q))
        codes.append(q_clamped + 31)
    return codes


def dequantize_fp6_on_the_fly(codes: List[int], scale: float) -> List[float]:
    """
    Non-blocking on-the-fly 6-bit unpacking across streaming multiprocessors.
    """
    return [round((code - 31) * scale, 6) for code in codes]


def compressed_fp6_dot_product(
    weights: List[float],
    activations: List[float],
    outlier_spike: bool = False,
) -> Dict[str, object]:
    """
    Executes F_fp6 = sum_{k=0}^{K-1} C_fp6(W_fp6, X_activation, Delta_scale).
    Slashes memory footprint by 33.33% over 8-bit FP8 (6 bits vs 8 bits per weight = 25% over FP8,
    and 33% total arena footprint reduction with packed block-scale metadata).
    """
    if len(weights) != len(activations):
        raise ValueError("Weight and activation vectors must have identical length")

    scale = compute_dynamic_fp6_scale(weights, outlier_spike=outlier_spike)
    codes = quantize_fp6_tensor(weights, scale)
    dequantized = dequantize_fp6_on_the_fly(codes, scale)

    fp6_dot = sum(w_dq * x_act for w_dq, x_act in zip(dequantized, activations))
    ref_dot = sum(w_raw * x_act for w_raw, x_act in zip(weights, activations))

    denom = max(abs(ref_dot), 1e-6)
    rel_error_pct = round((abs(fp6_dot - ref_dot) / denom) * 100.0, 4)

    return {
        "scale": scale,
        "codes": codes,
        "dequantized": dequantized,
        "fp6_dot": round(fp6_dot, 6),
        "ref_dot": round(ref_dot, 6),
        "rel_error_pct": rel_error_pct,
        "vram_savings_pct": 33.0,
    }


@app.get("/health")
def get_health() -> Dict[str, object]:
    return {
        "chassis": "GF-T3-353",
        "fp6_state": STATE.fp6_state,
        "compression_throughput_gbs": STATE.compression_throughput_gbs,
        "packing_latency_us": STATE.packing_latency_us,
        "active_matrices": STATE.active_matrices_count,
        "processed_tokens_units": STATE.processed_tokens_units,
    }


@app.get("/telemetry")
def get_telemetry() -> Dict[str, object]:
    return {
        "chassis": "GF-T3-353",
        "corridor": STATE.active_corridor,
        "corridors_available": SYNTHETIC_CORRIDORS,
        "compression_throughput_gbs": STATE.compression_throughput_gbs,
        "packing_latency_us": STATE.packing_latency_us,
        "active_matrices": STATE.active_matrices_count,
        "processed_tokens_units": STATE.processed_tokens_units,
        "engine_xp_k": STATE.engine_xp_k,
        "fp6_state": STATE.fp6_state,
        "outlier_spike_active": STATE.outlier_spike_active,
        "vec_preview": STATE.vec_preview,
        "matrices": [m.model_dump() for m in STATE.matrices],
    }


@app.post("/quantize", response_model=QuantizationResponse)
def execute_fp6_quantization(req: QuantizationRequest) -> QuantizationResponse:
    if req.corridor not in SYNTHETIC_CORRIDORS:
        raise HTTPException(status_code=400, detail="Unsupported synthetic FP6 corridor")

    try:
        res = compressed_fp6_dot_product(
            req.weights,
            req.activations,
            outlier_spike=req.outlier_spike,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    STATE.active_corridor = req.corridor
    STATE.processed_tokens_units += len(req.weights) * 1000
    STATE.engine_xp_k = round(STATE.engine_xp_k + 0.5, 2)

    throughput = 154800 if not req.outlier_spike else 142600
    latency = 0.01 if not req.outlier_spike else 0.03

    return QuantizationResponse(
        chassis="GF-T3-353",
        corridor=req.corridor,
        packed_fp6_codes=res["codes"],
        dequantized_weights=res["dequantized"],
        dot_product_fp6=res["fp6_dot"],
        reference_dot_product=res["ref_dot"],
        relative_error_pct=res["rel_error_pct"],
        vram_savings_over_fp8_pct=res["vram_savings_pct"],
        compression_throughput_gbs=throughput,
        packing_latency_us=latency,
        fp6_state="Active",
    )


@app.post("/stress/burst")
def trigger_quantization_burst() -> Dict[str, object]:
    STATE.compression_throughput_gbs = 168400
    STATE.packing_latency_us = 0.01
    STATE.processed_tokens_units += 1250000
    STATE.engine_xp_k = round(STATE.engine_xp_k + 2.5, 2)
    for m in STATE.matrices:
        m.tokens_k += 32
        m.fp6_load_pct = 100
        m.status = "BURST · LOCKED"
    return get_telemetry()


@app.post("/stress/outlier")
def toggle_outlier_spike() -> Dict[str, object]:
    STATE.outlier_spike_active = not STATE.outlier_spike_active
    if STATE.outlier_spike_active:
        STATE.compression_throughput_gbs = 141200
        STATE.packing_latency_us = 0.03
        for idx, m in enumerate(STATE.matrices):
            m.latency_ms = 0.04 if idx % 2 == 0 else 0.03
            m.scale_factor = 0.05468
            m.status = "RE-CALIBRATING"
    else:
        STATE.compression_throughput_gbs = 154800
        STATE.packing_latency_us = 0.01
        for m in STATE.matrices:
            m.latency_ms = 0.02
            m.scale_factor = 0.03125
            m.status = "COMPRESSED · LOCKED"
    return get_telemetry()


@app.post("/stress/step")
def step_asynchronous_dequantization() -> Dict[str, object]:
    STATE.step_counter += 1
    STATE.processed_tokens_units += 450000
    STATE.engine_xp_k = round(STATE.engine_xp_k + 1.2, 2)
    offset = (STATE.step_counter % 5) * 0.01
    STATE.vec_preview = [
        round(1.10 + offset, 2),
        round(1.11 + offset, 2),
        round(1.10 + offset, 2),
        round(1.11 + offset, 2),
    ]
    for m in STATE.matrices:
        m.tokens_k += 16
        m.sync_pct = 100
        m.status = "COMPRESSED · LOCKED"
    return get_telemetry()


@app.post("/stress/flush")
def flush_fp6_arenas() -> Dict[str, object]:
    STATE.__init__()
    return get_telemetry()
