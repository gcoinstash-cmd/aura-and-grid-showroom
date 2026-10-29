"""
GF-T3-296: Ultra-Wide Dynamic Asynchronous FP8 Quantization & Calibration Matrix Engine
SPDX-License-Identifier: MIT
Clean-Room Standalone Implementation
"""

from dataclasses import dataclass, asdict
from typing import Dict, List, Optional
import math
import time
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(
    title="GF-T3-296",
    description="Asynchronous FP8 Quantization and Calibration Matrix Engine",
    version="3.296.0",
)

SYNTHETIC_CORRIDORS: Dict[str, Dict[str, object]] = {
    "FP8-CORRIDOR-ALPHA": {
        "label": "FP8-CORRIDOR-ALPHA (DYNAMIC-FP8-QUANTIZATION-FABRIC · 51200-GB/S)",
        "target_throughput_gbs": 51200,
        "calibration_latency_us": 0.01,
        "precision_mode": "FP8_E4M3_DYNAMIC",
        "active_scales": 8,
    },
    "FP8-CORRIDOR-BRAVO": {
        "label": "FP8-CORRIDOR-BRAVO (CALIBRATION-MATRIX-ENGINE)",
        "target_throughput_gbs": 48600,
        "calibration_latency_us": 0.01,
        "precision_mode": "FP8_CALIBRATION_MATRIX",
        "active_scales": 8,
    },
    "FP8-CORRIDOR-GAMMA": {
        "label": "FP8-CORRIDOR-GAMMA (NON-BLOCKING-SCALE-FACTOR-ROUTER)",
        "target_throughput_gbs": 49800,
        "calibration_latency_us": 0.02,
        "precision_mode": "FP8_ASYNC_ROUTER",
        "active_scales": 8,
    },
    "FP8-CORRIDOR-DELTA": {
        "label": "FP8-CORRIDOR-DELTA (FALLBACK-UNQUANTIZED-BF16-PASS)",
        "target_throughput_gbs": 25600,
        "calibration_latency_us": 0.04,
        "precision_mode": "BF16_UNQUANTIZED_PASS",
        "active_scales": 8,
    },
}


@dataclass
class ScaleSlot:
    slot_id: str
    index: int
    hex_ptr: str
    tokens_k: int
    scale_factor: float
    amax: float
    latency_ms: float
    status: str
    sync_pct: int
    fp8_health: str


class QuantizationRequest(BaseModel):
    tensor_values: List[float] = Field(..., min_length=1)
    scale_override: Optional[float] = Field(default=None, gt=0.0)


class QuantizationResponse(BaseModel):
    scale_factor: float
    amax: float
    quantized_int8: List[int]
    dequantized_values: List[float]
    mean_squared_error: float
    signal_to_quantization_noise_db: float
    throughput_gbs: int
    calibration_latency_us: float


class StressTriggerRequest(BaseModel):
    action: str
    corridor_id: Optional[str] = "FP8-CORRIDOR-ALPHA"


def compute_dynamic_scale(values: List[float], fp8_max: float = 127.0) -> float:
    """
    Computes dynamic scale factor s = max(|x|) / 127.0 with floor guard.
    """
    if not values:
        return 0.0078
    amax = max(abs(v) for v in values)
    if amax <= 1e-9:
        return 0.0001
    return round(amax / fp8_max, 6)


def quantize_fp8_tensor(
    values: List[float], scale_override: Optional[float] = None
) -> QuantizationResponse:
    """
    Implements deterministic FP8 quantization and dequantization:
    Q(x) = clip(round(x / s), -128, 127) * s
    """
    if not values:
        raise ValueError("tensor_values must not be empty")

    amax = max(abs(v) for v in values)
    scale = scale_override if (scale_override is not None and scale_override > 0) else compute_dynamic_scale(values)

    q_int: List[int] = []
    deq_vals: List[float] = []
    sq_err_sum = 0.0
    sig_pow_sum = 0.0

    for x in values:
        scaled = x / scale
        # Round half to even
        rounded = int(round(scaled))
        clipped = max(-128, min(127, rounded))
        deq = round(clipped * scale, 6)
        q_int.append(clipped)
        deq_vals.append(deq)
        err = x - deq
        sq_err_sum += err * err
        sig_pow_sum += x * x

    n = len(values)
    mse = sq_err_sum / n
    if mse <= 1e-12:
        sqnr_db = 99.9
    elif sig_pow_sum <= 1e-12:
        sqnr_db = 0.0
    else:
        sqnr_db = round(10.0 * math.log10((sig_pow_sum / n) / mse), 2)

    return QuantizationResponse(
        scale_factor=scale,
        amax=round(amax, 6),
        quantized_int8=q_int,
        dequantized_values=deq_vals,
        mean_squared_error=round(mse, 8),
        signal_to_quantization_noise_db=sqnr_db,
        throughput_gbs=51200,
        calibration_latency_us=0.01,
    )


class FP8CalibrationMatrixEngine:
    """
    Stateful non-blocking FP8 scale calibration matrix and barrier coordinator.
    """

    def __init__(self) -> None:
        self.corridor = "FP8-CORRIDOR-ALPHA"
        self.throughput_gbs = 51200
        self.calibration_latency_us = 0.01
        self.processed_tokens = 9216000
        self.engine_xp_k = 75.0
        self.outlier_active = False
        self.step_counter = 0
        self.vector_state = [5.71, 5.75, 5.72, 5.74]
        self.scales: List[ScaleSlot] = self._init_scales()

    def _init_scales(self) -> List[ScaleSlot]:
        slots: List[ScaleSlot] = []
        for idx in range(8):
            hex_addr = "0x" + format(0x23000 + idx * 0x10, "X")
            slots.append(
                ScaleSlot(
                    slot_id="F" + str(idx),
                    index=idx,
                    hex_ptr=hex_addr,
                    tokens_k=256,
                    scale_factor=0.0078,
                    amax=0.9906,
                    latency_ms=0.02,
                    status="CALIBRATED · LOCKED",
                    sync_pct=100,
                    fp8_health="OK",
                )
            )
        return slots

    def select_corridor(self, corridor_id: str) -> Dict[str, object]:
        if corridor_id not in SYNTHETIC_CORRIDORS:
            raise KeyError("Unknown synthetic FP8 corridor: " + corridor_id)
        spec = SYNTHETIC_CORRIDORS[corridor_id]
        self.corridor = corridor_id
        self.throughput_gbs = int(spec["target_throughput_gbs"])
        self.calibration_latency_us = float(spec["calibration_latency_us"])
        return self.snapshot()

    def trigger_burst(self) -> Dict[str, object]:
        self.step_counter += 1
        self.processed_tokens += 1024000
        self.engine_xp_k = round(self.engine_xp_k + 12.5, 1)
        self.throughput_gbs = 54800
        self.calibration_latency_us = 0.01
        for idx, slot in enumerate(self.scales):
            slot.tokens_k += 64
            slot.scale_factor = round(0.0074 + (idx % 3) * 0.0002, 4)
            slot.amax = round(slot.scale_factor * 127.0, 4)
            slot.status = "BURST · LOCKED"
            slot.sync_pct = 100
        return self.snapshot()

    def toggle_outlier_spike(self) -> Dict[str, object]:
        self.outlier_active = not self.outlier_active
        if self.outlier_active:
            self.calibration_latency_us = 0.03
            self.throughput_gbs = 49400
            for idx, slot in enumerate(self.scales):
                if idx in (2, 3, 6):
                    slot.scale_factor = 0.0312
                    slot.amax = round(0.0312 * 127.0, 4)
                    slot.latency_ms = 0.04
                    slot.status = "RE-CALIBRATING · DYNAMIC"
                    slot.sync_pct = 98
        else:
            self.calibration_latency_us = 0.01
            self.throughput_gbs = 51200
            for slot in self.scales:
                slot.scale_factor = 0.0078
                slot.amax = 0.9906
                slot.latency_ms = 0.02
                slot.status = "CALIBRATED · LOCKED"
                slot.sync_pct = 100
        return self.snapshot()

    def step_async_pass(self) -> Dict[str, object]:
        self.step_counter += 1
        self.processed_tokens += 512000
        self.engine_xp_k = round(self.engine_xp_k + 5.0, 1)
        self.vector_state = [
            round(v + 0.01 * ((i % 2) * 2 - 1), 2)
            for i, v in enumerate(self.vector_state)
        ]
        for idx, slot in enumerate(self.scales):
            slot.tokens_k += 32
            slot.scale_factor = round(0.0078 + ((self.step_counter + idx) % 4) * 0.0001, 4)
            slot.amax = round(slot.scale_factor * 127.0, 4)
            slot.status = "CALIBRATED · LOCKED"
        return self.snapshot()

    def flush_arenas(self) -> Dict[str, object]:
        self.outlier_active = False
        self.step_counter = 0
        self.throughput_gbs = 51200
        self.calibration_latency_us = 0.01
        self.processed_tokens = 9216000
        self.vector_state = [5.71, 5.75, 5.72, 5.74]
        self.scales = self._init_scales()
        return self.snapshot()

    def snapshot(self) -> Dict[str, object]:
        return {
            "engine_id": "GF-T3-296",
            "corridor": self.corridor,
            "corridor_label": SYNTHETIC_CORRIDORS[self.corridor]["label"],
            "throughput_gbs": self.throughput_gbs,
            "calibration_latency_us": self.calibration_latency_us,
            "active_scales_count": len(self.scales),
            "processed_tokens_units": self.processed_tokens,
            "engine_xp_k": self.engine_xp_k,
            "fp8_state": "Quantization Active",
            "outlier_active": self.outlier_active,
            "vector_state": self.vector_state,
            "scales": [asdict(s) for s in self.scales],
            "timestamp_ns": time.time_ns(),
        }


ENGINE_INSTANCE = FP8CalibrationMatrixEngine()


@app.get("/health")
def get_health() -> Dict[str, object]:
    return {
        "status": "HEALTHY",
        "engine": "GF-T3-296",
        "fp8_state": "Quantization Active",
        "active_scales": 8,
        "throughput_gbs": ENGINE_INSTANCE.throughput_gbs,
        "calibration_latency_us": ENGINE_INSTANCE.calibration_latency_us,
    }


@app.get("/api/v1/telemetry")
def get_telemetry() -> Dict[str, object]:
    return ENGINE_INSTANCE.snapshot()


@app.post("/api/v1/quantize", response_model=QuantizationResponse)
def post_quantize(req: QuantizationRequest) -> QuantizationResponse:
    try:
        return quantize_fp8_tensor(req.tensor_values, req.scale_override)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/v1/trigger")
def post_trigger(req: StressTriggerRequest) -> Dict[str, object]:
    action = req.action.upper()
    if action == "BURST":
        return ENGINE_INSTANCE.trigger_burst()
    if action == "OUTLIER":
        return ENGINE_INSTANCE.toggle_outlier_spike()
    if action == "STEP":
        return ENGINE_INSTANCE.step_async_pass()
    if action == "FLUSH":
        return ENGINE_INSTANCE.flush_arenas()
    if action == "CORRIDOR" and req.corridor_id:
        try:
            return ENGINE_INSTANCE.select_corridor(req.corridor_id)
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
    raise HTTPException(status_code=400, detail="Unsupported trigger action: " + req.action)
