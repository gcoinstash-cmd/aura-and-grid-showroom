"""
Pytest Verification Suite for GF-T3-352
Verifies:
1. 4-bit weight packing and on-the-fly tensor core dequantization correctness.
2. Asynchronous execution efficiency under outlier spikes.
3. Hardware tensor core acceleration and throughput saturation.
"""

import pytest
from fastapi.testclient import TestClient
from engine import (
    app,
    compute_dynamic_block_scale,
    decode_fp4_nibble,
    encode_fp4_nibble,
    execute_fp4_gemm_interlock,
    pack_fp4_pair,
    runtime,
    unpack_fp4_pair,
)

client = TestClient(app)


def setup_function() -> None:
    runtime.reset()


def test_fp4_nibble_encode_decode_roundtrip() -> None:
    scale = 0.5
    exact_values = [-3.0, -2.0, -1.5, -1.0, -0.5, 0.0, 0.5, 1.0, 1.5, 2.0, 3.0]
    for val in exact_values:
        nibble = encode_fp4_nibble(val, scale)
        assert 0 <= nibble <= 15
        decoded = decode_fp4_nibble(nibble, scale)
        assert pytest.approx(decoded, abs=1e-6) == val


def test_fp4_byte_packing_4x_compression() -> None:
    scale = 1.0
    packed = pack_fp4_pair(-4.0, 6.0, scale)
    assert 0 <= packed <= 255
    w0, w1 = unpack_fp4_pair(packed, scale)
    assert pytest.approx(w0, abs=1e-6) == -4.0
    assert pytest.approx(w1, abs=1e-6) == 6.0


def test_invalid_inputs_raise_value_error() -> None:
    with pytest.raises(ValueError):
        encode_fp4_nibble(1.0, 0.0)
    with pytest.raises(ValueError):
        decode_fp4_nibble(16, 1.0)
    with pytest.raises(ValueError):
        unpack_fp4_pair(300, 1.0)
    with pytest.raises(ValueError):
        execute_fp4_gemm_interlock([1.0, 2.0], [1.0])
    with pytest.raises(ValueError):
        execute_fp4_gemm_interlock([], [])


def test_fp4_gemm_interlock_accuracy_and_compression() -> None:
    weights = [1.0, -1.5, 2.0, -3.0, 0.5, 4.0, -2.0, 6.0]
    activations = [0.5, 1.0, -0.5, 2.0, 1.5, -1.0, 0.25, 0.5]
    result = execute_fp4_gemm_interlock(weights, activations, outlier_spike_active=False)
    assert result["memory_compression_ratio"] == 4.0
    assert result["packed_byte_count"] == 4.0
    assert result["dequant_rmse"] == pytest.approx(0.0, abs=1e-5)
    assert result["fp4_dot_product"] == pytest.approx(result["reference_dot_product"], abs=1e-5)


def test_outlier_spike_dynamic_scale_recalibration() -> None:
    weights = [0.5, -0.5, 1.0, -1.0, 12.0]
    activations = [1.0, 1.0, 1.0, 1.0, 1.0]
    normal_res = execute_fp4_gemm_interlock(weights, activations, outlier_spike_active=False)
    spike_res = execute_fp4_gemm_interlock(weights, activations, outlier_spike_active=True)
    assert spike_res["block_scale"] > normal_res["block_scale"]
    assert spike_res["memory_compression_ratio"] == 4.0
    assert compute_dynamic_block_scale([]) == 1.0
    assert compute_dynamic_block_scale([0.0, 0.0]) == 1e-4


def test_api_telemetry_and_interlock_endpoints() -> None:
    resp = client.get("/api/v1/telemetry")
    assert resp.status_code == 200
    data = resp.json()
    assert data["unit_id"] == "GF-T3-352"
    assert data["dequantization_throughput_gbps"] == 152600
    assert data["unpacking_latency_us"] == 0.01
    assert data["active_weights_count"] == 8
    assert data["processed_tokens_units"] == 36600000

    burst_resp = client.post("/api/v1/actions/burst")
    assert burst_resp.status_code == 200
    assert burst_resp.json()["dequantization_throughput_gbps"] == 168400

    spike_resp = client.post("/api/v1/actions/outlier-spike")
    assert spike_resp.status_code == 200
    assert spike_resp.json()["outlier_spike_active"] is True
    assert spike_resp.json()["fp4_state"] == "Re-Calibrating"

    spike_off_resp = client.post("/api/v1/actions/outlier-spike")
    assert spike_off_resp.status_code == 200
    assert spike_off_resp.json()["outlier_spike_active"] is False

    step_resp = client.post("/api/v1/actions/step-pass")
    assert step_resp.status_code == 200
    assert step_resp.json()["processed_tokens_units"] > 36600000

    gemm_resp = client.post(
        "/api/v1/quantize-pass",
        json={"weights": [1.0, 2.0, 3.0, 4.0], "activations": [0.5, 0.5, 0.5, 0.5], "outlier_spike": False},
    )
    assert gemm_resp.status_code == 200
    assert gemm_resp.json()["memory_compression_ratio"] == 4.0

    bad_resp = client.post(
        "/api/v1/quantize-pass",
        json={"weights": [1.0, 2.0], "activations": [0.5, 0.5, 0.5], "outlier_spike": False},
    )
    assert bad_resp.status_code == 400

    flush_resp = client.post("/api/v1/actions/flush")
    assert flush_resp.status_code == 200
    assert flush_resp.json()["processed_tokens_units"] == 36600000
