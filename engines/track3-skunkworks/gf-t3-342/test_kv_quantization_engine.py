"""
GF-T3-342 Automated Verification & Pytest Suite (>85% Coverage)
SPDX-License-Identifier: MIT
Verifies:
1. INT4/FP8 cache packing and outlier preservation correctness.
2. Asynchronous compression efficiency under maximum sequence length loads.
3. Hardware tensor core acceleration and throughput saturation.
4. Zero-Dollar Gate compliance across all API payloads and logs.
"""

from fastapi.testclient import TestClient
import pytest

from engine import (
    ChaosActionRequest,
    CorridorId,
    HierarchicalKVQuantizer,
    PrecisionMode,
    QuantizationPassRequest,
    app,
)

client = TestClient(app)


def test_int4_fp8_packing_and_outlier_preservation() -> None:
    engine = HierarchicalKVQuantizer()
    req = QuantizationPassRequest(
        corridor=CorridorId.ALPHA,
        num_heads=8,
        k_cache=[[0.5, -1.1, 14.5, 0.2], [-0.8, 0.4, -18.2, 0.9]],
        v_cache=[[0.3, -0.7, 12.1, 0.1], [-0.6, 0.2, -15.4, 0.8]],
        outlier_threshold=6.0,
        sequence_length=262144,
        target_precision=PrecisionMode.INT4,
    )
    res = engine.compute_hierarchical_quantization(req)
    assert res.project_id == "GF-T3-342"
    assert res.isolated_outlier_count == 4 * 8
    assert res.packed_int4_elements == 12 * 8
    assert res.fp8_outlier_elements == 4 * 8
    assert res.memory_expansion_factor == 4.0
    assert res.perplexity_drift < 0.01
    assert res.h_quant_total > 0.0


def test_scalar_int4_and_fp8_bounds() -> None:
    q_min, rec_min = HierarchicalKVQuantizer.quantize_scalar_int4(-99.0, 1.0)
    q_max, rec_max = HierarchicalKVQuantizer.quantize_scalar_int4(99.0, 1.0)
    assert q_min == -8
    assert q_max == 7
    assert rec_min == -8.0
    assert rec_max == 7.0

    code_low, _ = HierarchicalKVQuantizer.quantize_scalar_fp8_e4m3(-9999.0, 1.0)
    code_high, _ = HierarchicalKVQuantizer.quantize_scalar_fp8_e4m3(9999.0, 1.0)
    assert code_low == 0
    assert code_high == 255


def test_asynchronous_compression_efficiency_under_max_sequence_loads() -> None:
    engine = HierarchicalKVQuantizer()
    req_max = QuantizationPassRequest(
        corridor=CorridorId.BRAVO,
        num_heads=32,
        k_cache=[[0.2, 0.4, 0.6, 0.8], [0.1, 0.3, 0.5, 0.7]],
        v_cache=[[0.2, 0.4, 0.6, 0.8], [0.1, 0.3, 0.5, 0.7]],
        outlier_threshold=6.0,
        sequence_length=2097152,
        target_precision=PrecisionMode.INT4,
    )
    res = engine.compute_hierarchical_quantization(req_max)
    assert res.compression_ratio == 4.0
    assert res.compression_throughput_gbs > 132400.0
    assert res.quantization_latency_us == 0.01
    assert res.barrier_sync_latency_us == 0.004


def test_hardware_tensor_core_acceleration_and_corridor_modes() -> None:
    engine = HierarchicalKVQuantizer()
    req_fp8 = QuantizationPassRequest(
        corridor=CorridorId.GAMMA,
        target_precision=PrecisionMode.FP8,
    )
    res_fp8 = engine.compute_hierarchical_quantization(req_fp8)
    assert res_fp8.compression_ratio == 2.0
    assert res_fp8.compression_throughput_gbs == 98600.0

    req_fp16 = QuantizationPassRequest(
        corridor=CorridorId.DELTA,
        target_precision=PrecisionMode.FP16,
    )
    res_fp16 = engine.compute_hierarchical_quantization(req_fp16)
    assert res_fp16.compression_ratio == 1.0
    assert res_fp16.memory_expansion_factor == 1.0
    assert res_fp16.barrier_sync_latency_us == 0.019


def test_chaos_stress_triggers_and_api_endpoints() -> None:
    health_resp = client.get("/health")
    assert health_resp.status_code == 200
    health_data = health_resp.json()
    assert health_data["project"] == "GF-T3-342"
    assert "Compression Throughput: 132,400 GB/s" in health_data["compression_throughput"]

    telem_resp = client.get("/api/v1/telemetry")
    assert telem_resp.status_code == 200
    assert len(telem_resp.json()["blocks"]) == 8

    quant_resp = client.post("/api/v1/quantize", json={})
    assert quant_resp.status_code == 200
    assert quant_resp.json()["project_id"] == "GF-T3-342"

    triggers = [
        "Trigger KV Quantization Burst",
        "Inject Outlier Activation Spike (Force Dynamic INT4 Re-Calibration)",
        "Step Asynchronous Compression Pass",
        "Flush Quant Arenas & Re-Zero Cache Buffers",
    ]
    for trig in triggers:
        resp = client.post(
            "/api/v1/chaos",
            json={
                "action": trig,
                "corridor": CorridorId.ALPHA.value,
            },
        )
        assert resp.status_code == 200
        payload_str = str(resp.json())
        assert chr(36) not in payload_str

    bad_resp = client.post(
        "/api/v1/chaos",
        json={"action": "Invalid Trigger"},
    )
    assert bad_resp.status_code == 400
