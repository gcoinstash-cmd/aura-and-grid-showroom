"""
GF-T3-225 — Standalone FP8 Mixed-Precision GEMM & Dynamic Microscaling Engine
Clean-Room MIT Licensed Implementation (Zero Proprietary Dependencies)
"""

import math
import time
from enum import Enum
from typing import Dict, List, Optional, Tuple
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

app = FastAPI(
    title="GF-T3-225",
    description="FP8 Mixed-Precision GEMM, Dynamic Microscaling, E4M3/E5M2 Core, FP32 Accumulation",
    version="3.225.0",
)

# Constants for Clean-Room Synthetic Precision Corridors
CORRIDOR_ALPHA = "FP8-CORRIDOR-ALPHA (E4M3-WEIGHTS · E4M3-ACTIVATIONS · DYNAMIC-BLOCK)"
CORRIDOR_BRAVO = "FP8-CORRIDOR-BRAVO (E5M2-EXPONENT-WIDE · OUTLIER-DAMPENED)"
CORRIDOR_GAMMA = "FP8-CORRIDOR-GAMMA (DUAL-FORMAT-HYBRID · FP32-ACCUMULATION)"
CORRIDOR_DELTA = "FP8-CORRIDOR-DELTA (PER-TOKEN-MICRONORM-FALLBACK)"

VALID_CORRIDORS = [
    CORRIDOR_ALPHA,
    CORRIDOR_BRAVO,
    CORRIDOR_GAMMA,
    CORRIDOR_DELTA,
]

# IEEE-like FP8 Format Specification Constants
# E4M3: 1 sign bit, 4 exponent bits (bias = 7), 3 mantissa bits, max normal = 448.0
E4M3_MAX_VAL = 448.0
E4M3_BIAS = 7
E4M3_MANTISSA_BITS = 3

# E5M2: 1 sign bit, 5 exponent bits (bias = 15), 2 mantissa bits, max normal = 57344.0
E5M2_MAX_VAL = 57344.0
E5M2_BIAS = 15
E5M2_MANTISSA_BITS = 2


class PrecisionFormat(str, Enum):
    E4M3 = "E4M3"
    E5M2 = "E5M2"


class ScalingMode(str, Enum):
    DYNAMIC_BLOCK = "DYNAMIC_BLOCK"
    STATIC_TENSOR = "STATIC_TENSOR"


class FP8BitCell(BaseModel):
    row: int
    col: int
    raw_fp32: float
    clipped_fp32: float
    scale_factor: float
    quantized_fp8_val: float
    dequantized_fp32: float
    sign_bit: int
    exponent_bits: str
    mantissa_bits: str
    bit_string: str
    format_used: PrecisionFormat


class GemmRequestPayload(BaseModel):
    corridor: str = Field(default=CORRIDOR_ALPHA)
    format_a: PrecisionFormat = Field(default=PrecisionFormat.E4M3)
    format_b: PrecisionFormat = Field(default=PrecisionFormat.E4M3)
    scaling_mode: ScalingMode = Field(default=ScalingMode.DYNAMIC_BLOCK)
    outlier_clip_threshold: Optional[float] = Field(default=None, gt=0.0)
    matrix_a: List[List[float]]
    matrix_b: List[List[float]]

    @field_validator("corridor")
    @classmethod
    def validate_corridor(cls, v: str) -> str:
        if v not in VALID_CORRIDORS:
            raise ValueError("Invalid synthetic FP8 corridor identifier.")
        return v

    @field_validator("matrix_a", "matrix_b")
    @classmethod
    def validate_matrix_dimensions(cls, m: List[List[float]]) -> List[List[float]]:
        if not m or not m[0]:
            raise ValueError("Matrix must be non-empty 2D tensor.")
        cols = len(m[0])
        for row in m:
            if len(row) != cols:
                raise ValueError("Ragged matrix rows are prohibited by GridSync zero-trust gate.")
            for val in row:
                if math.isnan(val) or math.isinf(val):
                    raise ValueError("NaN or Inf tensor elements rejected by zero-trust gate.")
        return m


def encode_fp8_scalar(value: float, fmt: PrecisionFormat) -> Tuple[float, int, str, str, str]:
    """
    Bit-exact clean-room quantization of a scaled float into E4M3 or E5M2 representation.
    Returns (quantized_float_value, sign_bit, exp_bits_str, mantissa_bits_str, full_8bit_str).
    """
    max_val = E4M3_MAX_VAL if fmt == PrecisionFormat.E4M3 else E5M2_MAX_VAL
    bias = E4M3_BIAS if fmt == PrecisionFormat.E4M3 else E5M2_BIAS
    m_bits = E4M3_MANTISSA_BITS if fmt == PrecisionFormat.E4M3 else E5M2_MANTISSA_BITS
    e_bits = 4 if fmt == PrecisionFormat.E4M3 else 5
    max_exp_unbiased = (1 << e_bits) - 2 - bias if fmt == PrecisionFormat.E5M2 else (1 << e_bits) - 1 - bias

    if value == 0.0:
        exp_str = "0" * e_bits
        man_str = "0" * m_bits
        return 0.0, 0, exp_str, man_str, "0" + exp_str + man_str

    sign_bit = 1 if value < 0.0 else 0
    abs_val = min(abs(value), max_val)

    min_normal = math.ldexp(1.0, 1 - bias)
    if abs_val < min_normal:
        # Subnormal representation: exponent field = 0
        sub_step = math.ldexp(1.0, 1 - bias - m_bits)
        mantissa_int = int(round(abs_val / sub_step))
        max_mantissa = (1 << m_bits) - 1
        if mantissa_int > max_mantissa:
            # Rounds up to smallest normal
            exp_field = 1
            mantissa_int = 0
            reconstructed = min_normal
        else:
            exp_field = 0
            reconstructed = mantissa_int * sub_step
        exp_str = format(exp_field, "0" + str(e_bits) + "b")
        man_str = format(mantissa_int, "0" + str(m_bits) + "b")
        signed_val = -reconstructed if sign_bit == 1 else reconstructed
        return signed_val, sign_bit, exp_str, man_str, str(sign_bit) + exp_str + man_str

    # Normal number decomposition
    unbiased_exp = int(math.floor(math.log2(abs_val)))
    if unbiased_exp > max_exp_unbiased:
        unbiased_exp = max_exp_unbiased
    significand = abs_val / math.ldexp(1.0, unbiased_exp) - 1.0
    mantissa_scale = 1 << m_bits
    mantissa_int = int(round(significand * mantissa_scale))

    if mantissa_int >= mantissa_scale:
        mantissa_int = 0
        unbiased_exp += 1
        if unbiased_exp > max_exp_unbiased:
            unbiased_exp = max_exp_unbiased
            mantissa_int = (1 << m_bits) - 2 if fmt == PrecisionFormat.E4M3 else (1 << m_bits) - 1

    # E4M3 max normal is 448.0 (exp_field=15, mantissa=6 -> (1 + 6/8)*2^8 = 448)
    if fmt == PrecisionFormat.E4M3 and unbiased_exp == 8 and mantissa_int > 6:
        mantissa_int = 6

    exp_field = unbiased_exp + bias
    reconstructed = (1.0 + (mantissa_int / float(mantissa_scale))) * math.ldexp(1.0, unbiased_exp)
    reconstructed = min(reconstructed, max_val)
    signed_val = -reconstructed if sign_bit == 1 else reconstructed

    exp_str = format(exp_field, "0" + str(e_bits) + "b")
    man_str = format(mantissa_int, "0" + str(m_bits) + "b")
    bit_str = str(sign_bit) + exp_str + man_str
    return signed_val, sign_bit, exp_str, man_str, bit_str


def clip_outliers_matrix(
    matrix: List[List[float]], clip_threshold: Optional[float]
) -> Tuple[List[List[float]], int]:
    """
    Clips heavy-tailed activation spikes to [-clip_threshold, +clip_threshold]
    to prevent single-element dynamic scale collapse.
    """
    if clip_threshold is None or clip_threshold <= 0.0:
        return [row[:] for row in matrix], 0

    clipped_count = 0
    out: List[List[float]] = []
    for row in matrix:
        new_row: List[float] = []
        for val in row:
            if abs(val) > clip_threshold:
                clipped_count += 1
                new_row.append(math.copysign(clip_threshold, val))
            else:
                new_row.append(val)
        out.append(new_row)
    return out, clipped_count


def compute_dynamic_scales(
    matrix: List[List[float]],
    fmt: PrecisionFormat,
    mode: ScalingMode,
    axis: str = "row",
) -> List[float]:
    """
    Computes exact dynamic microscaling factors S = FP8_MAX / max(|X|)
    either per-token/per-channel (DYNAMIC_BLOCK) or per-tensor (STATIC_TENSOR).
    """
    fp8_max = E4M3_MAX_VAL if fmt == PrecisionFormat.E4M3 else E5M2_MAX_VAL
    rows = len(matrix)
    cols = len(matrix[0])

    if mode == ScalingMode.STATIC_TENSOR:
        global_amax = 0.0
        for r in range(rows):
            for c in range(cols):
                if abs(matrix[r][c]) > global_amax:
                    global_amax = abs(matrix[r][c])
        scale = fp8_max / global_amax if global_amax > 1e-12 else 1.0
        count = rows if axis == "row" else cols
        return [scale for _ in range(count)]

    if axis == "row":
        scales: List[float] = []
        for r in range(rows):
            row_amax = max((abs(v) for v in matrix[r]), default=0.0)
            scale = fp8_max / row_amax if row_amax > 1e-12 else 1.0
            scales.append(scale)
        return scales
    else:
        scales = []
        for c in range(cols):
            col_amax = max((abs(matrix[r][c]) for r in range(rows)), default=0.0)
            scale = fp8_max / col_amax if col_amax > 1e-12 else 1.0
            scales.append(scale)
        return scales


def quantize_matrix_fp8(
    matrix: List[List[float]],
    scales: List[float],
    fmt: PrecisionFormat,
    axis: str = "row",
    raw_unclipped: Optional[List[List[float]]] = None,
) -> Tuple[List[List[float]], List[List[FP8BitCell]]]:
    """
    Quantizes a 2D tensor into FP8 using the provided scale factors along row or col axis.
    Returns both the numeric quantized matrix and rich bit-level telemetry cells.
    """
    rows = len(matrix)
    cols = len(matrix[0])
    q_matrix: List[List[float]] = []
    bit_grid: List[List[FP8BitCell]] = []

    for r in range(rows):
        q_row: List[float] = []
        b_row: List[FP8BitCell] = []
        for c in range(cols):
            s = scales[r] if axis == "row" else scales[c]
            clipped_val = matrix[r][c]
            raw_val = raw_unclipped[r][c] if raw_unclipped is not None else clipped_val
            scaled_input = clipped_val * s
            q_val, sign_b, exp_b, man_b, bit_s = encode_fp8_scalar(scaled_input, fmt)
            dequant_val = q_val / s if s > 0 else 0.0
            q_row.append(q_val)
            b_row.append(
                FP8BitCell(
                    row=r,
                    col=c,
                    raw_fp32=raw_val,
                    clipped_fp32=clipped_val,
                    scale_factor=s,
                    quantized_fp8_val=q_val,
                    dequantized_fp32=dequant_val,
                    sign_bit=sign_b,
                    exponent_bits=exp_b,
                    mantissa_bits=man_b,
                    bit_string=bit_s,
                    format_used=fmt,
                )
            )
        q_matrix.append(q_row)
        bit_grid.append(b_row)

    return q_matrix, bit_grid


def reference_fp32_gemm(a: List[List[float]], b: List[List[float]]) -> List[List[float]]:
    """
    Ground-truth FP32 matrix multiplication C_ref = A @ B.
    """
    m = len(a)
    k = len(a[0])
    n = len(b[0])
    out: List[List[float]] = []
    for i in range(m):
        row: List[float] = []
        for j in range(n):
            acc = 0.0
            for p in range(k):
                acc += float(a[i][p]) * float(b[p][j])
            row.append(acc)
        out.append(row)
    return out


def execute_fp8_gemm_pipeline(payload: GemmRequestPayload) -> Dict:
    """
    Executes the complete FP8 Mixed-Precision GEMM with Dynamic Microscaling,
    FP32 Accumulator registers, and High-Precision Dequantization Epilogue:
      C_dequant[i, j] = (sum_k Q_A[i, k] * Q_B[k, j]) / (S_A[i] * S_B[j])
    """
    t0 = time.perf_counter()

    m = len(payload.matrix_a)
    k_a = len(payload.matrix_a[0])
    k_b = len(payload.matrix_b)
    n = len(payload.matrix_b[0])

    if k_a != k_b:
        raise HTTPException(
            status_code=400,
            detail="Inner matrix dimensions must match for GEMM execution.",
        )

    # 1. Ground-truth FP32 GEMM on raw matrices (and clipped matrices for parity analysis)
    clipped_a, clipped_count_a = clip_outliers_matrix(
        payload.matrix_a, payload.outlier_clip_threshold
    )
    ref_fp32 = reference_fp32_gemm(clipped_a, payload.matrix_b)

    # 2. Dynamic Microscaling Factor extraction
    scales_a = compute_dynamic_scales(
        clipped_a, payload.format_a, payload.scaling_mode, axis="row"
    )
    scales_b = compute_dynamic_scales(
        payload.matrix_b, payload.format_b, payload.scaling_mode, axis="col"
    )

    # 3. Quantize Matrices A and B into 8-bit Floating Point
    q_a, cells_a = quantize_matrix_fp8(
        clipped_a, scales_a, payload.format_a, axis="row", raw_unclipped=payload.matrix_a
    )
    q_b, cells_b = quantize_matrix_fp8(
        payload.matrix_b, scales_b, payload.format_b, axis="col"
    )

    # 4. Dual-Tensor FP8 GEMM with FP32 Accumulator Registers + Dequantization Epilogue
    t_epilogue_start = time.perf_counter()
    fp32_accum_raw: List[List[float]] = []
    dequantized_out: List[List[float]] = []

    for i in range(m):
        accum_row: List[float] = []
        dequant_row: List[float] = []
        for j in range(n):
            acc_fp32 = 0.0
            for p in range(k_a):
                acc_fp32 += float(q_a[i][p]) * float(q_b[p][j])
            accum_row.append(acc_fp32)
            # High-Precision Dequantization Epilogue: divide by (S_A[i] * S_B[j])
            combined_scale = scales_a[i] * scales_b[j]
            dequant_val = acc_fp32 / combined_scale if combined_scale > 0.0 else 0.0
            dequant_row.append(dequant_val)
        fp32_accum_raw.append(accum_row)
        dequantized_out.append(dequant_row)

    t_end = time.perf_counter()

    # 5. Compute Signal-to-Noise Ratio (SNR) and Relative L2 Parity vs Reference FP32
    signal_power = 0.0
    noise_power = 0.0
    for i in range(m):
        for j in range(n):
            ref_v = ref_fp32[i][j]
            deq_v = dequantized_out[i][j]
            err = ref_v - deq_v
            signal_power += ref_v * ref_v
            noise_power += err * err

    if signal_power > 1e-15:
        rel_error = math.sqrt(noise_power / signal_power)
        snr_parity_pct = max(0.0, min(100.0, (1.0 - rel_error) * 100.0))
        snr_db = 10.0 * math.log10(signal_power / max(noise_power, 1e-18))
    else:
        rel_error = 0.0
        snr_parity_pct = 100.0
        snr_db = 99.9

    # 6. Memory Footprint Calculation (BF16 = 2 bytes/elem, FP8 = 1 byte/elem)
    total_input_elements = (m * k_a) + (k_b * n)
    bf16_bytes = total_input_elements * 2
    fp8_bytes = total_input_elements * 1
    memory_reduction_pct = ((bf16_bytes - fp8_bytes) / float(bf16_bytes)) * 100.0

    gemm_latency_ms = max(0.01, (t_end - t0) * 1000.0)
    dequant_overhead_ms = max(0.01, (t_end - t_epilogue_start) * 1000.0)

    return {
        "engine_id": "GF-T3-225",
        "corridor": payload.corridor,
        "scaling_mode": payload.scaling_mode,
        "format_a": payload.format_a,
        "format_b": payload.format_b,
        "dimensions": {"M": m, "K": k_a, "N": n},
        "scales_a": scales_a,
        "scales_b": scales_b,
        "quantized_a": q_a,
        "quantized_b": q_b,
        "fp32_accumulator": fp32_accum_raw,
        "dequantized_output": dequantized_out,
        "reference_fp32_output": ref_fp32,
        "cells_a": [[cell.model_dump() for cell in row] for row in cells_a],
        "cells_b": [[cell.model_dump() for cell in row] for row in cells_b],
        "telemetry": {
            "snr_parity_pct": round(snr_parity_pct, 4),
            "snr_db": round(snr_db, 2),
            "relative_l2_error": round(rel_error, 6),
            "clipped_outliers_count": clipped_count_a,
            "bf16_footprint_bytes": bf16_bytes,
            "fp8_footprint_bytes": fp8_bytes,
            "memory_reduction_pct": round(memory_reduction_pct, 2),
            "gemm_latency_ms": round(gemm_latency_ms, 4),
            "dequant_overhead_ms": round(dequant_overhead_ms, 4),
        },
    }


@app.get("/health")
def health_check() -> Dict[str, str]:
    return {
        "status": "LOCKED",
        "engine": "GF-T3-225",
        "architecture": "FP8 Mixed-Precision GEMM & Dynamic Microscaling",
    }


@app.post("/api/v1/gemm/execute")
def run_gemm_endpoint(payload: GemmRequestPayload) -> Dict:
    return execute_fp8_gemm_pipeline(payload)
