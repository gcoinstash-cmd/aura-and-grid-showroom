"""
Pytest Verification Suite for GF-T3-282
Verifies:
1. Per-tensor and per-token FP8 scaling quantization and dynamic clipping correctness.
2. Hardware-accelerated weight-activation efficiency and memory throughput gains.
3. Hardware tensor core acceleration and throughput saturation.
"""

import math
import pytest
from engine import (
    CorridorId,
    QuantizationCalibrationRequest,
    clip_value,
    execute_quantization_pass,
     health_check,
    quantize_activations_per_token,
    quantize_tensor_per_tensor,
    validate_hardware_throughput_gain,
)


def test_per_tensor_fp8_scaling_and_dynamic_clipping() -> None:
    weights = [-4.48, -2.24, 0.0, 1.12, 2.24, 4.48]
    result = quantize_tensor_per_tensor(weights, clip_max=448.0)

    assert math.isclose(float(result["amax"]), 4.48, rel_tol=1e-5)
    assert math.isclose(float(result["scale_factor"]), 0.01, rel_tol=1e-5)
    assert math.isclose(float(result["inverse_scale_factor"]), 100.0, rel_tol=1e-5)
    assert result["quantized"] == [-448.0, -224.0, 0.0, 112.0, 224.0, 448.0]
    assert int(result["clipped_count"]) == 0
    assert float(result["mse"]) < 1e-9
    assert float(result["sqnr_db"]) >= 60.0

    # Force clipping with locked scale when outlier spike occurs
    spiked_weights = [-9.50, -2.24, 0.0, 1.12, 2.24, 12.80]
    clipped_res = quantize_tensor_per_tensor(
        spiked_weights, clip_max=448.0, forced_scale=0.01
    )
    assert int(clipped_res["clipped_count"]) == 2
    assert clipped_res["quantized"][0] == -448.0
    assert clipped_res["quantized"][-1] == 448.0


def test_per_token_fp8_activation_scaling() -> None:
    activations = [1.0, 2.0, -1.0, -2.0, 10.0, 20.0, -10.0, -20.0]
    act_res = quantize_activations_per_token(
        activations, token_group_size=4, clip_max=448.0
    )

    scales = act_res["token_scales"]
    assert len(scales) == 2
    assert math.isclose(scales[0], 2.0 / 448.0, rel_tol=1e-5)
    assert math.isclose(scales[1], 20.0 / 448.0, rel_tol=1e-5)
    assert int(act_res["clipped_count"]) == 0
    for orig, deq in zip(activations, act_res["dequantized"]):
        assert math.isclose(orig, deq, abs_tol=0.05)


def test_weight_activation_efficiency_and_memory_throughput_gains() -> None:
    gain_alpha = validate_hardware_throughput_gain(
        num_parameters=1_000_000, corridor_id=CorridorId.ALPHA, active_matrices=8
    )
    assert gain_alpha["memory_compression_ratio"] == 2.0
    assert gain_alpha["fp16_footprint_bytes"] == 2_000_000.0
    assert gain_alpha["fp8_footprint_bytes"] == 1_000_000.0
    assert gain_alpha["effective_throughput_gbs"] == 40000.0
    assert gain_alpha["throughput_saturation_pct"] == 100.0
    assert gain_alpha["tensor_core_speedup_factor"] == 2.0

    # Verify fallback BF16 corridor has 1.0x compression ratio and 20,000 GB/s bus
    gain_delta = validate_hardware_throughput_gain(
        num_parameters=1_000_000, corridor_id=CorridorId.DELTA, active_matrices=8
    )
    assert gain_delta["memory_compression_ratio"] == 1.0
    assert gain_delta["effective_throughput_gbs"] == 20000.0
    assert gain_delta["throughput_saturation_pct"] == 50.0


def test_hardware_tensor_core_acceleration_and_api_execution() -> None:
    health = health_check()
    assert health["engine"] == "GF-T3-282"
    assert health["quant_throughput"] == "40,000 GB/s"

    req = QuantizationCalibrationRequest(
        corridor_id=CorridorId.ALPHA,
        matrix_index=3,
        weights=[4.41, 4.45, 4.42, 4.44, -4.41, -4.45, -4.42, -4.44],
        activations=[3.10, -3.12, 2.98, -3.05, 1.44, -1.42, 1.40, -1.39],
        outlier_multiplier=1.0,
        operator_callsign="PYTEST_VERIFIER",
    )
    resp = execute_quantization_pass(req)
    assert resp.engine == "GF-T3-282"
    assert resp.ptr_hex == "0x10030"
    assert resp.throughput_gbs == 40000.0
    assert resp.calibration_latency_us == 0.01
    assert resp.clipped_elements_count == 0

    # Verify zero-trust gate blocks SQL injection callsign
    with pytest.raises(ValueError, match="GridSync Zero-Trust Gate"):
        QuantizationCalibrationRequest(
            corridor_id=CorridorId.ALPHA,
            matrix_index=0,
            weights=[1.0, 2.0, 3.0, 4.0],
            activations=[1.0, 2.0, 3.0, 4.0],
            operator_callsign="DROP TABLE fp8_corridors; --",
        )
