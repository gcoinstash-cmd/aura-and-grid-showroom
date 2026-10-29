"""
GF-T3-237: Pytest Verification Suite (>80% Coverage)
Verifies:
1. Numerical fidelity and SQNR under E4M3 vs E5M2.
2. Outlier channel isolation accuracy and clipping prevention.
3. Calibration speed and memory throughput saturation.
"""

import math
from engine import (
    E4M3_MAX_NORMAL,
    E5M2_MAX_NORMAL,
    SYNTHETIC_CORRIDORS,
    TensorBlockPayload,
    calibrate_block_endpoint,
    compute_dynamic_block_calibration,
    generate_deterministic_block_tensor,
    get_matrix_bay,
    health_check,
    isolate_outlier_channels,
    quantize_fp8_scalar,
)


def test_e4m3_vs_e5m2_sqnr_numerical_fidelity() -> None:
    """
    E4M3 has 3 mantissa bits vs 2 mantissa bits for E5M2, so on smooth bounded
    activations E4M3 must achieve higher SQNR (dB) and lower quantization error margin.
    """
    smooth_tensor = [math.sin(i * 0.25) * 12.0 for i in range(128)]

    e4m3_metrics = compute_dynamic_block_calibration(
        block_id=0,
        values=smooth_tensor,
        fmt="E4M3",
        sigma_threshold=3.5,
        isolate_outliers=False,
    )
    e5m2_metrics = compute_dynamic_block_calibration(
        block_id=0,
        values=smooth_tensor,
        fmt="E5M2",
        sigma_threshold=3.5,
        isolate_outliers=False,
    )

    assert e4m3_metrics.sqnr_db > e5m2_metrics.sqnr_db
    assert e4m3_metrics.quant_error_margin < e5m2_metrics.quant_error_margin
    assert e4m3_metrics.sqnr_db > 22.0
    assert e4m3_metrics.clip_error_ratio == 0.0


def test_outlier_channel_isolation_and_clipping_prevention() -> None:
    """
    Verifies that extreme high-magnitude outlier spikes are accurately isolated
    and that isolating them prevents dynamic range collapse across normal channels.
    """
    tensor = [math.cos(i * 0.3) * 4.0 for i in range(64)]
    tensor[11] = 380.0
    tensor[47] = -410.0

    filtered, isolated_idx, amax_raw, amax_filtered = isolate_outlier_channels(
        tensor, sigma_threshold=2.5
    )

    assert 11 in isolated_idx
    assert 47 in isolated_idx
    assert amax_raw == 410.0
    assert amax_filtered <= 4.0

    isolated_metrics = compute_dynamic_block_calibration(
        block_id=3,
        values=tensor,
        fmt="E4M3",
        sigma_threshold=2.5,
        isolate_outliers=True,
    )
    unisolated_metrics = compute_dynamic_block_calibration(
        block_id=3,
        values=tensor,
        fmt="E4M3",
        sigma_threshold=2.5,
        isolate_outliers=False,
    )

    assert isolated_metrics.outlier_count == 2
    assert isolated_metrics.state == "ISOLATED"
    assert isolated_metrics.quant_error_margin < unisolated_metrics.quant_error_margin
    assert isolated_metrics.sqnr_db > unisolated_metrics.sqnr_db + 10.0


def test_fp8_scalar_saturation_boundaries() -> None:
    """
    Verifies saturation bounds at E4M3_MAX_NORMAL (448.0) and E5M2_MAX_NORMAL (57344.0)
    as well as zero preservation.
    """
    assert quantize_fp8_scalar(0.0, "E4M3") == 0.0
    assert quantize_fp8_scalar(999.0, "E4M3") == E4M3_MAX_NORMAL
    assert quantize_fp8_scalar(-999.0, "E4M3") == -E4M3_MAX_NORMAL
    assert quantize_fp8_scalar(99999.0, "E5M2") == E5M2_MAX_NORMAL
    assert quantize_fp8_scalar(-99999.0, "E5M2") == -E5M2_MAX_NORMAL


def test_calibration_speed_and_throughput_saturation() -> None:
    """
    Verifies matrix bay generation, telemetry health check, and calibration latency target.
    """
    health = health_check()
    assert health["engine"] == "GF-T3-237"
    assert health["quant_bandwidth_gbs"] == 3400
    assert health["active_blocks"] == 16

    bay = get_matrix_bay(format_mode="E4M3", outlier_spike=False)
    assert len(bay) == 8
    for block in bay:
        assert block.calibration_latency_us <= 0.5
        assert block.bandwidth_gbs >= 2780.0
        assert len(block.scale_vector) == 4


def test_payload_validation_and_endpoint() -> None:
    tensor = generate_deterministic_block_tensor(2, length=32, inject_outlier_spike=True)
    payload = TensorBlockPayload(
        block_id=2,
        format_mode="E4M3",
        corridor=SYNTHETIC_CORRIDORS[0],
        outlier_sigma_threshold=2.5,
        values=tensor,
    )
    res = calibrate_block_endpoint(payload)
    assert res.block_id == 2
    assert res.block_label == "B2"
    assert res.scaling_factor > 0.0
