"""
Pytest Verification Suite for GF-T3-350 Activation Checkpointing & Multi-GPU Pipeline Parallelism Engine
SPDX-License-Identifier: MIT
Verifies:
1. Layer activation dropping and selective re-computation correctness.
2. Asynchronous execution efficiency under memory pressure spikes.
3. Hardware tensor core acceleration and throughput saturation.
"""

import pytest
from fastapi.testclient import TestClient
from engine import (
    ActivationCheckpointingEngine,
    CheckpointCorridor,
    app,
)

client = TestClient(app)


def test_initial_telemetry_baseline() -> None:
    eng = ActivationCheckpointingEngine()
    telemetry = eng.get_telemetry()
    assert telemetry.unit_id == "GF-T3-350"
    assert telemetry.checkpoint_throughput_gbs == 148600.0
    assert telemetry.offload_latency_us == 0.01
    assert telemetry.active_layers == 8
    assert telemetry.total_layers == 8
    assert telemetry.processed_tokens_units == 35_000_000
    assert telemetry.memory_saved_pct == 70.0
    assert telemetry.checkpoint_state == "Active"
    assert len(telemetry.layers) == 8
    assert telemetry.layers[0].hex_ptr == "0x59000"
    assert telemetry.layers[3].hex_ptr == "0x59030"


def test_layer_activation_dropping_and_formula_correctness() -> None:
    eng = ActivationCheckpointingEngine()
    result = eng.evaluate_checkpoint_sum(
        num_layers=8, x_norm=1.07, w_norm=1.08, theta_interval=2
    )
    assert result["evaluated_layers"] == 8.0
    assert result["memory_reduction_pct"] == 70.0
    assert result["a_checkpoint_total"] < result["a_uncheckpointed_baseline"]

    with pytest.raises(ValueError):
        eng.compute_activation_operator(1.0, 1.0, 0, 0)

    with pytest.raises(ValueError):
        eng.evaluate_checkpoint_sum(num_layers=0)

    with pytest.raises(ValueError):
        eng.evaluate_checkpoint_sum(num_layers=8, theta_interval=0)


def test_selective_recomputation_without_cpu_stalls() -> None:
    eng = ActivationCheckpointingEngine()
    for layer_idx in range(8):
        sim = eng.simulate_selective_recompute(layer_idx, pressure_spike=False)
        assert sim["layer_index"] == layer_idx
        assert sim["host_cpu_stalls"] == 0
        assert sim["barrier_sync_verified"] is True
        assert sim["recompute_latency_us"] == 0.01

    with pytest.raises(ValueError):
        eng.simulate_selective_recompute(99)


def test_asynchronous_execution_under_memory_pressure_spikes() -> None:
    eng = ActivationCheckpointingEngine()
    spike_state = eng.toggle_memory_pressure_spike(force_state=True)
    assert spike_state.memory_pressure_spike_active is True
    assert spike_state.memory_saved_pct >= 70.0
    assert all(l.status == "RECOMPUTE · LOCKED" for l in spike_state.layers)

    sim_under_spike = eng.simulate_selective_recompute(3, pressure_spike=True)
    assert sim_under_spike["host_cpu_stalls"] == 0
    assert sim_under_spike["sm_occupancy_pct"] > 99.0

    recovered_state = eng.toggle_memory_pressure_spike()
    assert recovered_state.memory_pressure_spike_active is False
    assert all(l.status == "CHECKPOINTED · LOCKED" for l in recovered_state.layers)


def test_hardware_tensor_core_saturation_and_corridors() -> None:
    eng = ActivationCheckpointingEngine()
    burst_telemetry = eng.trigger_checkpoint_burst()
    assert burst_telemetry.burst_count == 1
    assert burst_telemetry.checkpoint_throughput_gbs > 148600.0
    assert burst_telemetry.processed_tokens_units == 36_250_000

    step_telemetry = eng.step_asynchronous_pass()
    assert step_telemetry.step_count == 1
    assert step_telemetry.processed_tokens_units == 36_750_000

    for corridor in CheckpointCorridor:
        state = eng.set_corridor(corridor)
        assert state.corridor == corridor
        assert state.checkpoint_throughput_gbs > 130000.0

    flushed = eng.flush_checkpoint_arenas()
    assert flushed.burst_count == 0
    assert flushed.step_count == 0
    assert flushed.processed_tokens_units == 35_000_000
    assert flushed.checkpoint_throughput_gbs == 148600.0


def test_fastapi_endpoints() -> None:
    resp_health = client.get("/health")
    assert resp_health.status_code == 200
    assert resp_health.json()["unit"] == "GF-T3-350"

    resp_tel = client.get("/api/v1/telemetry")
    assert resp_tel.status_code == 200
    assert resp_tel.json()["checkpoint_throughput_gbs"] == 148600.0

    resp_eval = client.post(
        "/api/v1/checkpoint/evaluate",
        json={
            "num_layers": 8,
            "batch_tokens_k": 256,
            "hidden_dim": 4096,
            "checkpoint_interval": 2,
            "corridor": CheckpointCorridor.ALPHA.value,
            "memory_pressure_spike": False,
        },
    )
    assert resp_eval.status_code == 200
    assert resp_eval.json()["formula_metrics"]["memory_reduction_pct"] == 70.0

    resp_burst = client.post("/api/v1/checkpoint/burst")
    assert resp_burst.status_code == 200
    assert resp_burst.json()["burst_count"] >= 1

    resp_spike = client.post("/api/v1/checkpoint/pressure-spike")
    assert resp_spike.status_code == 200
    assert resp_spike.json()["memory_pressure_spike_active"] is True

    resp_step = client.post("/api/v1/checkpoint/step")
    assert resp_step.status_code == 200
    assert resp_step.json()["step_count"] >= 1

    resp_recomp = client.get("/api/v1/recompute/3")
    assert resp_recomp.status_code == 200
    assert resp_recomp.json()["hex_ptr"] == "0x59030"

    resp_recomp_err = client.get("/api/v1/recompute/99")
    assert resp_recomp_err.status_code == 400

    resp_flush = client.post("/api/v1/checkpoint/flush")
    assert resp_flush.status_code == 200
    assert resp_flush.json()["burst_count"] == 0
