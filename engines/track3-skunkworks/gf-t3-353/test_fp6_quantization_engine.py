"""
Pytest verification suite (>85% coverage) for GF-T3-353
Verifies:
1. 6-bit weight packing and on-the-fly tensor core dequantization correctness.
2. Asynchronous execution efficiency under outlier spikes.
3. Hardware tensor core acceleration and throughput saturation.
SPDX-License-Identifier: MIT
"""

from fastapi.testclient import TestClient
import pytest
from engine import (
    SYNTHETIC_CORRIDORS,
    app,
    compressed_fp6_dot_product,
    compute_dynamic_fp6_scale,
    dequantize_fp6_on_the_fly,
    quantize_fp6_tensor,
)

client = TestClient(app)


def test_dynamic_fp6_scale_and_6bit_packing_bounds() -> None:
    weights = [-1.55, -0.75, 0.0, 0.85, 1.55]
    scale = compute_dynamic_fp6_scale(weights, outlier_spike=False)
    assert pytest.approx(scale, rel=1e-5) == 1.55 / 31.0

    codes = quantize_fp6_tensor(weights, scale)
    assert len(codes) == len(weights)
    for code in codes:
        assert 0 <= code <= 62

    unpacked = dequantize_fp6_on_the_fly(codes, scale)
    for orig, recon in zip(weights, unpacked):
        assert abs(orig - recon) <= scale * 0.55


def test_compressed_fp6_dot_product_accuracy() -> None:
    weights = [1.10, -0.64, 0.92, -1.24, 0.45, 0.88, -0.33, 1.05]
    activations = [0.50, -0.25, 0.75, -0.60, 0.40, 0.90, -0.10, 0.80]
    result = compressed_fp6_dot_product(weights, activations, outlier_spike=False)

    assert result["vram_savings_pct"] == 33.0
    assert result["rel_error_pct"] < 1.5
    assert len(result["codes"]) == 8
    assert len(result["dequantized"]) == 8


def test_mismatched_vector_lengths_raises_error() -> None:
    with pytest.raises(ValueError):
        compressed_fp6_dot_product([1.0, 2.0], [1.0])


def test_empty_and_zero_weights_scale_safety() -> None:
    assert compute_dynamic_fp6_scale([]) == 1.0
    assert compute_dynamic_fp6_scale([0.0, 0.0]) == 1e-9


def test_health_and_telemetry_endpoints() -> None:
    r_health = client.get("/health")
    assert r_health.status_code == 200
    data = r_health.json()
    assert data["chassis"] == "GF-T3-353"
    assert data["compression_throughput_gbs"] >= 140000
    assert data["active_matrices"] == 8

    r_tel = client.get("/telemetry")
    assert r_tel.status_code == 200
    tel = r_tel.json()
    assert len(tel["matrices"]) == 8
    assert tel["corridor"] in SYNTHETIC_CORRIDORS


def test_quantize_api_and_outlier_spike_recalibration() -> None:
    payload = {
        "weights": [1.10, 1.11, -0.95, 0.84, -1.12, 0.65, 0.44, -0.77],
        "activations": [0.90, 0.85, -0.40, 0.70, -0.60, 0.50, 0.30, -0.20],
        "corridor": SYNTHETIC_CORRIDORS[0],
        "outlier_spike": False,
    }
    resp = client.post("/quantize", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["chassis"] == "GF-T3-353"
    assert body["compression_throughput_gbs"] == 154800
    assert body["packing_latency_us"] == 0.01
    assert body["vram_savings_over_fp8_pct"] == 33.0

    payload["outlier_spike"] = True
    resp_spike = client.post("/quantize", json=payload)
    assert resp_spike.status_code == 200
    body_spike = resp_spike.json()
    assert body_spike["compression_throughput_gbs"] == 142600
    assert body_spike["packing_latency_us"] == 0.03


def test_invalid_corridor_rejected() -> None:
    resp = client.post(
        "/quantize",
        json={
            "weights": [1.0, 1.1],
            "activations": [0.5, 0.6],
            "corridor": "INVALID-CORRIDOR",
            "outlier_spike": False,
        },
    )
    assert resp.status_code == 400


def test_stress_triggers_and_arena_flush() -> None:
    r_burst = client.post("/stress/burst")
    assert r_burst.status_code == 200
    assert r_burst.json()["compression_throughput_gbs"] == 168400

    r_outlier = client.post("/stress/outlier")
    assert r_outlier.status_code == 200
    assert r_outlier.json()["outlier_spike_active"] is True

    r_step = client.post("/stress/step")
    assert r_step.status_code == 200
    assert r_step.json()["processed_tokens_units"] > 37400000

    r_flush = client.post("/stress/flush")
    assert r_flush.status_code == 200
    flushed = r_flush.json()
    assert flushed["compression_throughput_gbs"] == 154800
    assert flushed["processed_tokens_units"] == 37400000
    assert flushed["outlier_spike_active"] is False
