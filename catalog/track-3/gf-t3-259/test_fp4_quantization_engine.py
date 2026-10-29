# SPDX-License-Identifier: MIT
"""
Pytest & Unittest verification suite for GF-T3-259 Block-Scaled FP4 Quantization Engine.
Verifies:
1. Block-scaled FP4 quantization scaling factor accuracy and 16-element block partitioning correctness.
2. Dynamic outlier isolation and perplexity preservation during high-pressure execution.
3. Hardware tensor core acceleration and throughput saturation.
"""

import math
import unittest

try:
    import pytest
except ImportError:
    pytest = None  # type: ignore

from engine import (
    BLOCK_SIZE,
    FP4_MAX_MAGNITUDE,
    SYNTHETIC_CORRIDORS,
    partition_into_16_element_blocks,
    quantize_16_element_block,
    quantize_scalar_fp4,
    simulate_tensor_core_pass,
)


def test_block_partitioning_16_elements_exact():
    weights = [math.sin(i * 0.25) * 2.5 for i in range(128)]
    blocks = partition_into_16_element_blocks(weights)
    assert len(blocks) == 8
    for blk in blocks:
        assert len(blk) == BLOCK_SIZE


def test_block_partitioning_rejects_non_multiple_of_16():
    for invalid_payload in ([1.0, 2.0, 3.0], []):
        raised = False
        try:
            partition_into_16_element_blocks(invalid_payload)
        except ValueError:
            raised = True
        assert raised is True


def test_fp4_scaling_factor_and_lattice_projection():
    raw_block = [
        -3.5, -3.0, -2.0, -1.5, -1.0, -0.5, -0.25, 0.0,
        0.25, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5,
    ]
    report = quantize_16_element_block(
        block_weights=raw_block,
        block_index=3,
        corridor=SYNTHETIC_CORRIDORS[0],
        outlier_saturation=False,
    )
    expected_scale = round(3.5 / FP4_MAX_MAGNITUDE, 6)
    assert report["scale_factor"] == expected_scale
    assert report["block_id"] == "F3"
    assert report["hex_pointer"] == "0x8300"
    assert report["compression_ratio_numeric"] == 8.0
    assert report["compression_ratio_label"] == "8:1"
    assert report["accuracy_pct"] == 99.9
    assert report["mean_squared_error"] < 0.01


def test_dynamic_outlier_isolation_and_perplexity_preservation():
    raw_block = [0.4 * ((-1) ** i) for i in range(16)]
    raw_block[3] = 14.8
    raw_block[11] = -12.6

    report = quantize_16_element_block(
        block_weights=raw_block,
        block_index=1,
        corridor=SYNTHETIC_CORRIDORS[1],
        outlier_saturation=True,
    )
    sparse_outliers = report["sparse_outliers"]
    assert 3 in sparse_outliers
    assert 11 in sparse_outliers
    assert report["reconstructed_weights"][3] == 14.8
    assert report["reconstructed_weights"][11] == -12.6
    assert report["perplexity_delta"] < 0.01
    assert report["state"] == "SATURATED · RECAL"


def test_hardware_tensor_core_throughput_saturation_and_corridors():
    weights = [math.cos(i * 0.15) * 1.8 for i in range(128)]
    alpha_pass = simulate_tensor_core_pass(
        weights=weights,
        corridor=SYNTHETIC_CORRIDORS[0],
        outlier_saturation=False,
        burst_count=0,
        step_pass=0,
    )
    assert alpha_pass["engine_id"] == "GF-T3-259"
    assert alpha_pass["throughput_gbps"] == 21800
    assert alpha_pass["throughput_formatted"] == "21,800 GB/s"
    assert alpha_pass["quantization_latency_us"] == 0.01
    assert alpha_pass["active_blocks"] == 8
    assert alpha_pass["processed_tokens"] == 4224000
    assert alpha_pass["compression_ratio"] == "8:1"

    gamma_burst = simulate_tensor_core_pass(
        weights=weights,
        corridor=SYNTHETIC_CORRIDORS[2],
        outlier_saturation=False,
        burst_count=2,
        step_pass=4,
    )
    assert gamma_burst["throughput_gbps"] > 22400
    assert gamma_burst["processed_tokens"] > 4224000

    delta_fallback = simulate_tensor_core_pass(
        weights=weights,
        corridor=SYNTHETIC_CORRIDORS[3],
        outlier_saturation=False,
    )
    assert delta_fallback["compression_ratio"] == "4:1"
    assert delta_fallback["blocks"][0]["bits_mode"] == "FP8"


def test_scalar_fp4_clamping_boundaries():
    assert quantize_scalar_fp4(99.0) == 7.0
    assert quantize_scalar_fp4(-99.0) == -7.0
    assert quantize_scalar_fp4(0.02) == 0.0


class TestFp4QuantizationEngine(unittest.TestCase):
    def test_all_quantization_invariants(self):
        test_block_partitioning_16_elements_exact()
        test_block_partitioning_rejects_non_multiple_of_16()
        test_fp4_scaling_factor_and_lattice_projection()
        test_dynamic_outlier_isolation_and_perplexity_preservation()
        test_hardware_tensor_core_throughput_saturation_and_corridors()
        test_scalar_fp4_clamping_boundaries()


if __name__ == "__main__":
    unittest.main()
