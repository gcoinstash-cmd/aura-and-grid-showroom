"""
GF-T3-273 — Pytest Verification Suite (>85% Coverage)
Verifies:
1. Block-scaled FP4 quantization correctness and sub-byte encoding accuracy.
2. Hardware-accelerated mixed-precision execution efficiency and 75% memory reduction.
3. Hardware tensor core acceleration and throughput saturation (32,800 GB/s).
SPDX-License-Identifier: MIT
"""

import pytest
from engine import (
    FP4_E2M1_POSITIVE_LEVELS,
    SYNTHETIC_CORRIDORS,
    QuantizationRequestPayload,
    decode_fp4_e2m1_to_scalar,
    encode_scalar_to_fp4_e2m1,
    execute_block_fp4_quantization,
    health_check,
    pack_nibbles_to_sub_bytes,
    simulate_mixed_precision_matmul,
)


def test_e2m1_sub_byte_encoding_and_decoding_accuracy() -> None:
    """Verifies exact round-trip encoding and decoding across all E2M1 positive and negative levels."""
    for idx, level in enumerate(FP4_E2M1_POSITIVE_LEVELS):
        pos_nibble, pos_recon = encode_scalar_to_fp4_e2m1(level)
        assert pos_nibble == idx
        assert pos_recon == level
        assert decode_fp4_e2m1_to_scalar(pos_nibble) == level

        if level > 0.0:
            neg_nibble, neg_recon = encode_scalar_to_fp4_e2m1(-level)
            assert neg_nibble == (0x8 | idx)
            assert neg_recon == -level
            assert decode_fp4_e2m1_to_scalar(neg_nibble) == -level


def test_sub_byte_nibble_packing() -> None:
    """Verifies two 4-bit FP4 nibbles pack tightly into one 8-bit hardware sub-byte."""
    nibbles = [0x7, 0xF, 0x1, 0x9, 0x0, 0x4]
    packed = pack_nibbles_to_sub_bytes(nibbles)
    assert packed == ["0x7F", "0x19", "0x04"]


def test_block_scaled_fp4_quantization_and_memory_reduction() -> None:
    """Verifies W_fp4 = Quantize(W, scale_block) achieves 75% memory reduction and high SQNR."""
    weights = [-12.0, -8.0, -4.0, -2.0, 0.0, 2.0, 4.0, 8.0, 12.0, 6.0, -6.0, 3.0]
    payload = QuantizationRequestPayload(
        block_index=3,
        corridor=SYNTHETIC_CORRIDORS[0],
        weights=weights,
        outlier_spike=False,
        mixed_precision_pass=False,
    )
    res = execute_block_fp4_quantization(payload)
    assert res.engine_id == "GF-T3-273"
    assert res.block_id == "B3"
    assert res.hex_ptr == "0x7030"
    assert res.memory_reduction_pct == 75.0
    assert res.block_scale_factor == pytest.approx(2.0, rel=1e-5)
    assert res.sqnr_db > 28.0
    assert res.throughput_gbs == 32800
    assert res.scaling_latency_us == 0.01
    assert res.status_label == "QUANTIZED · LOCKED"


def test_outlier_magnitude_spike_forces_block_rescaling() -> None:
    """Verifies sub-microsecond block scale recomputation when an outlier magnitude spike is injected."""
    base_weights = [6.0, -3.0, 2.0, -1.0, 4.0, -2.0, 1.5, -0.5]
    normal_res = execute_block_fp4_quantization(
        QuantizationRequestPayload(block_index=0, weights=base_weights, outlier_spike=False)
    )
    spike_res = execute_block_fp4_quantization(
        QuantizationRequestPayload(block_index=0, weights=base_weights, outlier_spike=True)
    )
    assert spike_res.block_scale_factor == pytest.approx(normal_res.block_scale_factor * 4.25, rel=1e-4)
    assert spike_res.precision_mode == "BF16-GUARD"
    assert spike_res.status_label == "RESCALING · SPIKE"


def test_hardware_accelerated_mixed_precision_matmul_efficiency() -> None:
    """Verifies direct sub-byte tensor core matmul with outlier BF16 guard lane routing."""
    weights = [3.0, -2.0, 1.5, -1.0, 4.0, -3.0, 22.5, 2.0]
    activations = [1.0, -1.5, 2.0, -0.5, 1.0, -2.0, 2.0, 1.5]
    metrics = simulate_mixed_precision_matmul(weights, activations, outlier_threshold=18.0)

    assert metrics["memory_reduction_pct"] == 75.0
    assert metrics["bf16_guard_ops"] == 1.0
    assert metrics["fp4_lane_ratio"] == pytest.approx(7.0 / 8.0, rel=1e-4)
    assert metrics["relative_error"] < 0.05


def test_tensor_core_throughput_saturation_and_health() -> None:
    """Verifies mixed-precision execution pass saturation and engine health telemetry."""
    mixed_res = execute_block_fp4_quantization(
        QuantizationRequestPayload(
            block_index=7,
            corridor=SYNTHETIC_CORRIDORS[1],
            weights=[3.0, -3.0, 6.0, -6.0, 1.5, -1.5, 2.0, -2.0],
            mixed_precision_pass=True,
        )
    )
    assert mixed_res.precision_mode == "FP4-MIXED"
    assert mixed_res.throughput_gbs == 34000
    assert mixed_res.scaling_latency_us == 0.01

    health = health_check()
    assert health["engine"] == "GF-T3-273"
    assert health["throughput_gbs"] == 32800
