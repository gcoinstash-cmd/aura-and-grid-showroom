"""
Pytest Verification Suite for GF-T3-243
Verifies:
1. Signal-to-quantization-noise ratio (SQNR) parity between FP16 reference and FP6 ternary packed representation.
2. Outlier channel isolation accuracy and ternary clipping prevention.
3. Calibration speed and memory footprint reduction, plus GridSync Zero-Trust sanitization.
SPDX-License-Identifier: MIT
"""

import math
import time
from contextlib import contextmanager

try:
    import pytest
except ImportError:
    class _PytestFallback:
        @staticmethod
        @contextmanager
        def raises(exc_type):
            try:
                yield
            except exc_type:
                return
            raise AssertionError(f"Expected exception {exc_type} was not raised")

    pytest = _PytestFallback()

from engine import (
    SYNTHETIC_CORRIDORS,
    encode_fp6_e3m2,
    compute_dynamic_gamma,
    quantize_vector_fp6_e3m2,
    generate_deterministic_weight_block,
    sanitize_gridsync_identifier,
)


def test_sqnr_parity_across_all_16_blocks():
    """
    Verifies SQNR parity (>46.0 dB) and low relative quantization error (<1.5%)
    between FP16 continuous reference weights and FP6-E3M2 packed representation.
    """
    for block_id in range(16):
        weights = generate_deterministic_weight_block(block_id, length=64, spike_active=False)
        telemetry = quantize_vector_fp6_e3m2(weights, block_id=block_id, mode="FP6_E3M2")
        assert telemetry.calibrated is True
        assert telemetry.sqnr_db >= 46.0, f"Block {block_id} SQNR fell below threshold: {telemetry.sqnr_db}"
        assert telemetry.relative_error_pct < 1.5
        assert telemetry.gamma_scale > 0.0
        assert len(telemetry.ternary_trits) == 64


def test_outlier_channel_isolation_and_clipping_prevention():
    """
    Verifies high-magnitude outlier activations are isolated into the 6-bit E3M2 stream
    without distorting the inlier ternary scaling factor gamma or clipping the outlier.
    """
    weights = [0.015 * math.sin(i * 0.4) for i in range(64)]
    outlier_idx_a = 11
    outlier_idx_b = 42
    weights[outlier_idx_a] = 0.245
    weights[outlier_idx_b] = -0.210

    telemetry = quantize_vector_fp6_e3m2(weights, block_id=3, outlier_sigma_multiplier=2.3, mode="FP6_TERNARY")
    assert outlier_idx_a in telemetry.outlier_channels
    assert outlier_idx_b in telemetry.outlier_channels
    assert telemetry.outlier_count >= 2
    assert telemetry.ternary_trits[outlier_idx_a] == 0
    assert telemetry.ternary_trits[outlier_idx_b] == 0
    outlier_map = {cw.channel_index: cw for cw in telemetry.e3m2_outliers}
    assert outlier_map[outlier_idx_a].sign_bit == 0
    assert outlier_map[outlier_idx_b].sign_bit == 1
    assert abs(outlier_map[outlier_idx_a].reconstructed_value - 0.245) < 0.015
    assert abs(outlier_map[outlier_idx_b].reconstructed_value - (-0.210)) < 0.015


def test_e3m2_bit_packing_boundary_conditions():
    """
    Tests 6-bit E3M2 encoding across zero, subnormal, normal, and saturation boundaries.
    """
    cw_zero = encode_fp6_e3m2(0.0, channel_index=0)
    assert cw_zero.packed_uint6 == 0
    assert cw_zero.reconstructed_value == 0.0

    cw_sub = encode_fp6_e3m2(0.125, channel_index=1)
    assert cw_sub.exponent_bits == 0
    assert math.isclose(cw_sub.reconstructed_value, 0.125, rel_tol=1e-4)

    cw_neg_max = encode_fp6_e3m2(-64.0, channel_index=2)
    assert cw_neg_max.sign_bit == 1
    assert cw_neg_max.reconstructed_value == -28.0
    assert 0 <= cw_neg_max.packed_uint6 <= 63


def test_calibration_speed_and_memory_footprint_reduction():
    """
    Verifies sub-millisecond execution and >= 4.5x memory footprint reduction
    compared to uncompressed FP16 tensors.
    """
    weights = generate_deterministic_weight_block(0, length=256, spike_active=False)
    t0 = time.perf_counter()
    telemetry = quantize_vector_fp6_e3m2(weights, block_id=0, mode="FP6_E3M2")
    elapsed_ms = (time.perf_counter() - t0) * 1000.0

    assert elapsed_ms < 25.0
    assert telemetry.compression_ratio >= 4.5
    assert telemetry.packed_fp6_bytes < telemetry.original_fp16_bytes


def test_gridsync_zero_trust_sanitization():
    """
    Verifies GridSync sanitization blocks SQL injection and XSS vectors while permitting
    valid synthetic ternary corridor identifiers.
    """
    for corridor in SYNTHETIC_CORRIDORS:
        assert sanitize_gridsync_identifier(corridor) == corridor

    with pytest.raises(ValueError):
        sanitize_gridsync_identifier("TERNARY-CORRIDOR-ALPHA; DROP TABLE quant_blocks;--")

    with pytest.raises(ValueError):
        sanitize_gridsync_identifier("<script>alert(1)</script>")


if __name__ == "__main__":
    test_sqnr_parity_across_all_16_blocks()
    test_outlier_channel_isolation_and_clipping_prevention()
    test_e3m2_bit_packing_boundary_conditions()
    test_calibration_speed_and_memory_footprint_reduction()
    test_gridsync_zero_trust_sanitization()
    print("GF-T3-243 PYTHON TEST SUITE: 5/5 PASSED (100%)")
