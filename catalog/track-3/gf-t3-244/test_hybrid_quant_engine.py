"""
Pytest verification suite for GF-T3-244 FP8 / INT8 Dual-Stream Hybrid Quantization Engine.
Verifies:
1. Signal-to-quantization-noise ratio (SQNR) parity between FP16 reference and FP8/INT8 hybrid representation.
2. Outlier gating isolation accuracy and dynamic 6-sigma thresholding.
3. Calibration speed, memory footprint reduction, and GridSync sanitization gates.
"""

import math
import pytest
from pydantic import ValidationError
from engine import (
    SYNTHETIC_CORRIDORS,
    HybridQuantRequest,
    compute_mean_std,
    execute_dual_stream_projection,
    health_check,
    isolate_outliers,
    quantize_fp8_e4m3,
    quantize_int8_symmetric,
)


def generate_synthetic_tensor(length: int = 128, inject_outlier: bool = False) -> list[float]:
    values = [math.sin(i * 0.17) * 1.25 + math.cos(i * 0.09) * 0.45 for i in range(length)]
    if inject_outlier and length >= 16:
        values[7] = 42.5
        values[length - 3] = -39.8
    return values


def test_sqnr_parity_fp16_vs_hybrid() -> None:
    activations = generate_synthetic_tensor(128, inject_outlier=True)
    weights = [math.cos(i * 0.11) * 0.85 for i in range(128)]
    req = HybridQuantRequest(
        block_id=3,
        corridor=SYNTHETIC_CORRIDORS[0],
        activations=activations,
        weights=weights,
        sigma_threshold=6.0,
        stream_mode="FP8_INT8_HYBRID",
    )
    metrics = execute_dual_stream_projection(req)
    assert metrics.sqnr_db >= 48.0
    assert metrics.relative_error_pct < 1.0
    assert abs(metrics.reference_dot - metrics.hybrid_dot) < abs(metrics.reference_dot) * 0.05
    assert metrics.status == "CALIBRATED"


def test_dynamic_outlier_gating_isolation() -> None:
    activations = generate_synthetic_tensor(256, inject_outlier=True)
    gating = isolate_outliers(activations, sigma_threshold=6.0)
    assert gating.outlier_count == 2
    assert 7 in gating.outlier_indices
    assert 253 in gating.outlier_indices
    assert gating.inlier_activations[7] == 0.0
    assert gating.outlier_activations[7] == 42.5
    assert gating.std_dev > 0.0


def test_calibration_speed_and_memory_footprint_reduction() -> None:
    activations = generate_synthetic_tensor(512, inject_outlier=False)
    weights = [math.sin(i * 0.05) * 1.1 for i in range(512)]
    req = HybridQuantRequest(
        block_id=0,
        corridor=SYNTHETIC_CORRIDORS[1],
        activations=activations,
        weights=weights,
        sigma_threshold=6.0,
    )
    metrics = execute_dual_stream_projection(req)
    assert metrics.calibration_latency_us <= 5.0
    assert metrics.compression_ratio >= 1.8
    assert metrics.memory_saving_pct >= 45.0


def test_fp8_and_int8_quantizer_bounds() -> None:
    sample = [-12.4, -0.5, 0.0, 0.75, 19.2]
    q_fp8, scale_a = quantize_fp8_e4m3(sample)
    q_int8, scale_w = quantize_int8_symmetric(sample)
    assert scale_a > 0.0
    assert scale_w > 0.0
    assert all(-448.0 <= x <= 448.0 for x in q_fp8)
    assert all(-127 <= x <= 127 for x in q_int8)


def test_zero_tensor_and_bypass_edge_cases() -> None:
    zeros = [0.0 for _ in range(16)]
    q_fp8, s_a = quantize_fp8_e4m3(zeros)
    q_int8, s_w = quantize_int8_symmetric(zeros)
    assert s_a == 1.0
    assert s_w == 1.0
    assert all(x == 0.0 for x in q_fp8)
    assert all(x == 0 for x in q_int8)
    mean_v, std_v = compute_mean_std([])
    assert mean_v == 0.0
    assert std_v == 0.0


def test_gridsync_zero_trust_validation() -> None:
    with pytest.raises(ValidationError):
        HybridQuantRequest(
            block_id=1,
            corridor="DROP TABLE blocks; --",
            activations=[1.0, 2.0, 3.0, 4.0],
            weights=[0.5, 0.5, 0.5, 0.5],
        )


def test_health_endpoint_metadata() -> None:
    info = health_check()
    assert info["engine"] == "GF-T3-244"
    assert info["bandwidth_gbs"] == 8600
    assert info["active_blocks"] == 16
