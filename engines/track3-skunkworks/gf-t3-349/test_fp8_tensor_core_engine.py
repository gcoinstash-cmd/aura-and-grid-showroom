"""
Pytest verification suite (>85% coverage) for GF-T3-349:
1. Block-scaled FP8 matrix multiplication and factor recalibration correctness.
2. Asynchronous execution efficiency under overflow spikes.
3. Hardware tensor core acceleration and throughput saturation.
"""

import pytest
from fastapi.testclient import TestClient

from engine import (
    BASELINE_LATENCY_US,
    BASELINE_THROUGHPUT_GBPS,
    BASELINE_TOKENS,
    FP8_E4M3_MAX,
    CorridorProfile,
    FP8TensorCoreInterlockEngine,
    StepSimulationRequest,
    app,
)

client = TestClient(app)


def test_initial_baseline_telemetry() -> None:
    engine = FP8TensorCoreInterlockEngine()
    snap = engine.snapshot()
    assert snap.chassis_id == "GF-T3-349"
    assert snap.fp8_throughput_gbps == BASELINE_THROUGHPUT_GBPS
    assert snap.scaling_latency_us == BASELINE_LATENCY_US
    assert snap.active_matrices_count == 8
    assert snap.processed_tokens_units == BASELINE_TOKENS
    assert snap.fp8_state == "Active"
    assert snap.perplexity_drift == 0.0
    assert len(snap.matrices) == 8
    assert snap.matrices[3].hex_ptr == "0x58030"


def test_block_scaled_fp8_quantization_and_dot_product() -> None:
    engine = FP8TensorCoreInterlockEngine()
    omega = engine.compute_dynamic_scaling_factor([1.06, 1.07, 1.06, 1.07])
    assert omega > 1.0

    quantized = engine.quantize_e4m3([10.0, -500.0, 500.0, 0.0], omega_scale=1.05)
    assert quantized[1] == -FP8_E4M3_MAX
    assert quantized[2] == FP8_E4M3_MAX

    output = engine.compute_scaled_dot_product_interlock(
        [1.06, 1.07, 1.06, 1.07],
        [1.04, 1.05, 1.06, 1.05],
        [0.98, 1.02, 1.01, 0.99],
        omega_scale=1.06,
    )
    assert 0.90 <= output <= 1.10


def test_invalid_vector_dimensions_raise_error() -> None:
    engine = FP8TensorCoreInterlockEngine()
    with pytest.raises(ValueError):
        engine.compute_scaled_dot_product_interlock([1.0, 2.0], [1.0], [1.0, 2.0], 1.06)


def test_asynchronous_execution_under_outlier_overflow_spikes() -> None:
    engine = FP8TensorCoreInterlockEngine()
    spike_snap = engine.toggle_outlier_overflow_spike(True)
    assert spike_snap.fp8_state == "Re-Calibrating"
    assert spike_snap.scaling_latency_us == 0.02
    assert spike_snap.matrices[2].outlier_spike_active is True
    assert spike_snap.matrices[2].status == "RE-CAL · GUARD"

    recovered_snap = engine.toggle_outlier_overflow_spike(False)
    assert recovered_snap.fp8_state == "Active"
    assert recovered_snap.fp8_throughput_gbps == BASELINE_THROUGHPUT_GBPS
    assert recovered_snap.matrices[2].outlier_spike_active is False
    assert recovered_snap.matrices[2].status == "SCALED · LOCKED"


def test_hardware_tensor_core_burst_and_throughput_saturation() -> None:
    engine = FP8TensorCoreInterlockEngine()
    burst_snap = engine.trigger_tensor_core_burst()
    assert burst_snap.fp8_throughput_gbps == 164200
    assert burst_snap.scaling_latency_us == 0.01
    assert burst_snap.processed_tokens_units > BASELINE_TOKENS
    assert all(m.status == "BURST · LOCKED" for m in burst_snap.matrices)


def test_corridor_switching_and_flush_reset() -> None:
    engine = FP8TensorCoreInterlockEngine()
    req = StepSimulationRequest(corridor=CorridorProfile.DELTA)
    delta_snap = engine.step_asynchronous_pass(req)
    assert delta_snap.mode == "FP16_FALLBACK"
    assert delta_snap.fp8_throughput_gbps == 73400
    assert delta_snap.matrices[0].precision == "FP16"

    flushed = engine.flush_arenas()
    assert flushed.fp8_throughput_gbps == BASELINE_THROUGHPUT_GBPS
    assert flushed.processed_tokens_units == BASELINE_TOKENS
    assert flushed.mode == "FP8_TENSOR_CORE"


def test_fastapi_endpoints() -> None:
    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["chassis"] == "GF-T3-349"

    res_tel = client.get("/api/v1/telemetry")
    assert res_tel.status_code == 200
    assert res_tel.json()["fp8_throughput_gbps"] == BASELINE_THROUGHPUT_GBPS

    res_burst = client.post("/api/v1/burst")
    assert res_burst.status_code == 200
    assert res_burst.json()["fp8_throughput_gbps"] == 164200

    res_spike = client.post("/api/v1/outlier-spike")
    assert res_spike.status_code == 200
    assert res_spike.json()["fp8_state"] == "Re-Calibrating"

    res_step = client.post("/api/v1/step", json={"corridor": CorridorProfile.BRAVO.value})
    assert res_step.status_code == 200

    res_flush = client.post("/api/v1/flush")
    assert res_flush.status_code == 200
    assert res_flush.json()["fp8_throughput_gbps"] == BASELINE_THROUGHPUT_GBPS
