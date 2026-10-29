"""
Pytest verification suite for GF-T3-296 Asynchronous FP8 Quantization & Calibration Matrix Engine.
Coverage Target: >85% across Gate 01 through Gate 04.
SPDX-License-Identifier: MIT
"""

from fastapi.testclient import TestClient
import pytest
from engine import (
    app,
    compute_dynamic_scale,
    quantize_fp8_tensor,
    FP8CalibrationMatrixEngine,
)

client = TestClient(app)


def test_dynamic_scale_calculation_and_rounding() -> None:
    sample_weights = [-0.9906, -0.45, 0.0, 0.45, 0.9906]
    scale = compute_dynamic_scale(sample_weights)
    assert abs(scale - 0.0078) < 1e-4

    result = quantize_fp8_tensor(sample_weights)
    assert result.quantized_int8[0] == -127
    assert result.quantized_int8[-1] == 127
    assert result.quantized_int8[2] == 0
    assert result.mean_squared_error < 1e-4
    assert result.signal_to_quantization_noise_db > 30.0


def test_clipping_bounds_on_scale_override() -> None:
    extreme_activations = [-10.0, -2.0, 0.0, 2.0, 10.0]
    res = quantize_fp8_tensor(extreme_activations, scale_override=0.01)
    assert min(res.quantized_int8) == -128
    assert max(res.quantized_int8) == 127
    assert res.throughput_gbs == 51200
    assert res.calibration_latency_us == 0.01


def test_zero_and_empty_tensor_guards() -> None:
    zero_scale = compute_dynamic_scale([0.0, 0.0, 0.0])
    assert zero_scale == 0.0001
    empty_scale = compute_dynamic_scale([])
    assert empty_scale == 0.0078

    with pytest.raises(ValueError):
        quantize_fp8_tensor([])


def test_asynchronous_calibration_efficiency_and_saturation() -> None:
    engine = FP8CalibrationMatrixEngine()
    snap0 = engine.snapshot()
    assert snap0["engine_id"] == "GF-T3-296"
    assert snap0["throughput_gbs"] == 51200
    assert snap0["active_scales_count"] == 8

    burst_snap = engine.trigger_burst()
    assert burst_snap["throughput_gbs"] == 54800
    assert burst_snap["processed_tokens_units"] == 10240000

    outlier_snap = engine.toggle_outlier_spike()
    assert outlier_snap["outlier_active"] is True
    assert outlier_snap["calibration_latency_us"] == 0.03

    recovered_snap = engine.toggle_outlier_spike()
    assert recovered_snap["outlier_active"] is False
    assert recovered_snap["throughput_gbs"] == 51200

    step_snap = engine.step_async_pass()
    assert step_snap["processed_tokens_units"] == 10752000

    flushed = engine.flush_arenas()
    assert flushed["processed_tokens_units"] == 9216000
    assert flushed["throughput_gbs"] == 51200


def test_fastapi_endpoints_and_corridor_switching() -> None:
    health_res = client.get("/health")
    assert health_res.status_code == 200
    assert health_res.json()["engine"] == "GF-T3-296"

    telem_res = client.get("/api/v1/telemetry")
    assert telem_res.status_code == 200
    assert telem_res.json()["active_scales_count"] == 8

    quant_res = client.post(
        "/api/v1/quantize",
        json={"tensor_values": [-0.5, -0.25, 0.0, 0.25, 0.5]},
    )
    assert quant_res.status_code == 200
    payload = quant_res.json()
    assert payload["quantized_int8"] == [-127, -64, 0, 64, 127]

    corridor_res = client.post(
        "/api/v1/trigger",
        json={"action": "CORRIDOR", "corridor_id": "FP8-CORRIDOR-BRAVO"},
    )
    assert corridor_res.status_code == 200
    assert corridor_res.json()["corridor"] == "FP8-CORRIDOR-BRAVO"

    flush_res = client.post("/api/v1/trigger", json={"action": "FLUSH"})
    assert flush_res.status_code == 200
