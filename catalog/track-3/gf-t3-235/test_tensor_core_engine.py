"""
Pytest & Unittest verification suite for GF-T3-235 Tensor Core Asynchronous MMA Engine.
Verifies:
1. MMA mathematical precision and FP16-to-FP32 accumulation accuracy.
2. Shared memory bank conflict reduction under various address swizzle patterns.
3. Interleaved pipeline overlap efficiency and throughput saturation.
"""

import math
import unittest

try:
    import pytest  # type: ignore
except ImportError:
    pytest = None

from engine import (
    SYNTHETIC_CORRIDORS,
    calculate_interleaved_pipeline_telemetry,
    compute_shared_memory_bank,
    detect_warp_bank_conflicts,
    execute_warp_mma_16x16x16,
    generate_deterministic_matrix,
    quantize_fp16,
    quantize_fp32,
)


def test_fp16_and_fp32_quantization_precision() -> None:
    val = 1.337890625
    q16 = quantize_fp16(val)
    q32 = quantize_fp32(val)
    assert abs(q16 - val) < 1e-3
    assert abs(q32 - val) < 1e-6
    assert quantize_fp16(999999.0) == 65504.0
    assert quantize_fp16(-999999.0) == -65504.0


def test_mma_16x16x16_identity_and_accumulation_accuracy() -> None:
    identity = [[1.0 if r == c else 0.0 for c in range(16)] for r in range(16)]
    mat_a = generate_deterministic_matrix(seed_offset=3)
    acc_c = [[0.5 for _ in range(16)] for _ in range(16)]

    res = execute_warp_mma_16x16x16(mat_a, identity, acc_c)
    assert res["dimensions"] == [16, 16, 16]
    assert res["mac_operations"] == 8192
    assert float(res["max_fp16_accumulation_drift"]) < 1e-3

    out = res["output_matrix_fp32"]
    for r in range(16):
        for c in range(16):
            expected = quantize_fp32(quantize_fp16(mat_a[r][c]) + 0.5)
            assert math.isclose(out[r][c], expected, abs_tol=1e-4)


def test_mma_dimension_validation() -> None:
    invalid_a = [[1.0 for _ in range(8)] for _ in range(16)]
    valid_b = [[1.0 for _ in range(16)] for _ in range(16)]
    raised = False
    try:
        execute_warp_mma_16x16x16(invalid_a, valid_b)
    except ValueError:
        raised = True
    assert raised is True


def test_shared_memory_bank_conflict_reduction_under_swizzle() -> None:
    unswizzled = detect_warp_bank_conflicts(swizzle_mask=0x0, forced_stall_injection=False)
    assert int(unswizzled["bank_conflicts"]) > 0
    assert unswizzled["conflict_free"] is False
    assert unswizzled["max_conflict_way_degree"] == 8

    swizzled_alpha = detect_warp_bank_conflicts(swizzle_mask=0x4, forced_stall_injection=False)
    assert swizzled_alpha["bank_conflicts"] == 0
    assert swizzled_alpha["conflict_free"] is True
    assert swizzled_alpha["unique_banks_utilized"] == 32

    forced_stall = detect_warp_bank_conflicts(swizzle_mask=0x4, forced_stall_injection=True)
    assert int(forced_stall["bank_conflicts"]) > 0
    assert forced_stall["effective_swizzle_mask"] == "0x0"


def test_shared_memory_bank_coordinate_bounds() -> None:
    swizzled_col, bank = compute_shared_memory_bank(4, 6, swizzle_mask=0x4)
    assert 0 <= swizzled_col < 16
    assert 0 <= bank < 32
    raised = False
    try:
        compute_shared_memory_bank(16, 0, swizzle_mask=0x4)
    except ValueError:
        raised = True
    assert raised is True


def test_interleaved_pipeline_overlap_efficiency_and_saturation() -> None:
    alpha_key = "MMA-CORRIDOR-ALPHA (ASYNC-WARP-LEVEL-TILE-SWIZZLE · 1850-TFLOPS)"
    telemetry_nominal = calculate_interleaved_pipeline_telemetry(
        corridor_key=alpha_key,
        pass_index=0,
        burst_active=False,
        bank_stall_injected=False,
    )
    assert telemetry_nominal["engine_id"] == "GF-T3-235"
    assert telemetry_nominal["throughput_tflops"] == 1850.0
    assert telemetry_nominal["mma_latency_us"] == 0.08
    assert telemetry_nominal["processed_tokens_units"] == 1152000
    tiles = telemetry_nominal["tiles"]
    assert len(tiles) == 8
    assert tiles[3]["tile_id"] == "T3"
    assert tiles[3]["bank_conflicts"] == 0
    assert tiles[3]["state"] == "MMA_ACTIVE"

    telemetry_burst = calculate_interleaved_pipeline_telemetry(
        corridor_key=alpha_key,
        pass_index=2,
        burst_active=True,
        bank_stall_injected=False,
    )
    assert float(telemetry_burst["throughput_tflops"]) > float(
        telemetry_nominal["throughput_tflops"]
    )
    assert float(telemetry_burst["mma_latency_us"]) < float(
        telemetry_nominal["mma_latency_us"]
    )

    telemetry_stalled = calculate_interleaved_pipeline_telemetry(
        corridor_key=alpha_key,
        pass_index=2,
        burst_active=False,
        bank_stall_injected=True,
    )
    assert float(telemetry_stalled["throughput_tflops"]) < float(
        telemetry_nominal["throughput_tflops"]
    )
    assert float(telemetry_stalled["mma_latency_us"]) > float(
        telemetry_nominal["mma_latency_us"]
    )
    assert telemetry_stalled["tiles"][0]["state"] == "BANK_STALL_FAULT"


def test_all_synthetic_corridors_supported() -> None:
    for key in SYNTHETIC_CORRIDORS:
        report = calculate_interleaved_pipeline_telemetry(corridor_key=key, pass_index=1)
        assert report["corridor"] == key
        assert float(report["throughput_tflops"]) > 0


class TestTensorCoreEngineSuite(unittest.TestCase):
    def test_1_quantization(self) -> None:
        test_fp16_and_fp32_quantization_precision()

    def test_2_mma_accuracy(self) -> None:
        test_mma_16x16x16_identity_and_accumulation_accuracy()

    def test_3_mma_bounds(self) -> None:
        test_mma_dimension_validation()

    def test_4_bank_conflicts(self) -> None:
        test_shared_memory_bank_conflict_reduction_under_swizzle()

    def test_5_bank_coordinates(self) -> None:
        test_shared_memory_bank_coordinate_bounds()

    def test_6_interleaved_pipeline(self) -> None:
        test_interleaved_pipeline_overlap_efficiency_and_saturation()

    def test_7_corridors(self) -> None:
        test_all_synthetic_corridors_supported()


if __name__ == "__main__":
    unittest.main()
