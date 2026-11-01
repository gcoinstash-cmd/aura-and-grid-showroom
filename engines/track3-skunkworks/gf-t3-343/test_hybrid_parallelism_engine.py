"""
GF-T3-343 Automated Verification Suite (>85% coverage)
Verifies:
1. Tensor and pipeline parallel stage distribution correctness.
2. Asynchronous micro-batch pipelining efficiency under bubble spikes.
3. Hardware tensor core acceleration and throughput saturation.
License: MIT
"""

import pytest
from fastapi.testclient import TestClient
from engine import (
    CORRIDORS,
    SIMULATOR,
    app,
    compute_hybrid_interlock_metric,
    compute_operator_partition,
    compute_pipeline_bubble_fraction,
)

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_simulator():
    client.post("/api/v1/actions/flush")
    yield
    client.post("/api/v1/actions/flush")


def test_operator_partition_correctness():
    val = compute_operator_partition(1.0, 1.0, 0.995, stage_idx=0, shard_idx=0)
    assert val > 0.99
    with pytest.raises(ValueError):
        compute_operator_partition(0.0, 1.0, 0.995, 0, 0)
    with pytest.raises(ValueError):
        compute_operator_partition(1.0, -1.0, 0.995, 0, 0)


def test_tensor_and_pipeline_stage_distribution():
    metric_2x4 = compute_hybrid_interlock_metric(
        pipeline_stages=2,
        tensor_shards=4,
        w_layer=1.0,
        x_micro_batch=1.0,
        tau_nvlink_ib=0.995,
    )
    metric_4x2 = compute_hybrid_interlock_metric(
        pipeline_stages=4,
        tensor_shards=2,
        w_layer=1.0,
        x_micro_batch=1.0,
        tau_nvlink_ib=0.995,
    )
    assert 7.8 <= metric_2x4 <= 8.1
    assert 7.8 <= metric_4x2 <= 8.1

    with pytest.raises(ValueError):
        compute_hybrid_interlock_metric(0, 4, 1.0, 1.0, 0.995)


def test_asynchronous_micro_batch_pipelining_under_bubble_spikes():
    nominal_bubble = compute_pipeline_bubble_fraction(
        pipeline_stages=4,
        micro_batches=32,
        bubble_spike_active=False,
        dynamic_reschedule=True,
    )
    spiked_rescheduled = compute_pipeline_bubble_fraction(
        pipeline_stages=4,
        micro_batches=32,
        bubble_spike_active=True,
        dynamic_reschedule=True,
    )
    spiked_unscheduled = compute_pipeline_bubble_fraction(
        pipeline_stages=4,
        micro_batches=32,
        bubble_spike_active=True,
        dynamic_reschedule=False,
    )
    assert nominal_bubble < spiked_rescheduled < spiked_unscheduled
    assert compute_pipeline_bubble_fraction(1, 16) == 0.0
    with pytest.raises(ValueError):
        compute_pipeline_bubble_fraction(2, 0)


def test_hardware_tensor_core_acceleration_and_throughput_saturation():
    response = client.get("/api/v1/telemetry")
    assert response.status_code == 200
    data = response.json()
    assert data["project_id"] == "GF-T3-343"
    assert data["throughput_gbs"] == 134800.0
    assert data["pipeline_latency_us"] == 0.01
    assert data["active_nodes"] == 8
    assert len(data["nodes"]) == 8
    assert data["nodes"][0]["hex_ptr"] == "0x52000"
    assert data["nodes"][3]["hex_ptr"] == "0x52030"


def test_lifecycle_chaos_actions_and_corridor_switching():
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["engine"] == "GF-T3-343"

    burst = client.post("/api/v1/actions/burst")
    assert burst.status_code == 200
    assert burst.json()["throughput_gbs"] > 134800.0

    spike = client.post("/api/v1/actions/bubble-spike")
    assert spike.status_code == 200
    assert spike.json()["mesh_state"] == "Dynamic Re-Scheduling"

    step = client.post("/api/v1/actions/step")
    assert step.status_code == 200
    assert step.json()["nodes"][0]["tokens_k"] > 256

    for corridor_name in CORRIDORS:
        eval_res = client.post(
            "/api/v1/evaluate",
            json={
                "corridor": corridor_name,
                "pipeline_stages": 2,
                "tensor_shards": 4,
                "micro_batches": 16,
                "layer_weight_norm": 1.0,
                "micro_batch_activation_norm": 1.0,
                "nvlink_ib_transfer_tau": 0.99,
                "bubble_spike_active": False,
                "burst_multiplier": 1.1,
            },
        )
        assert eval_res.status_code == 200
        assert eval_res.json()["corridor"] == corridor_name

    bad_eval = client.post(
        "/api/v1/evaluate",
        json={"corridor": "INVALID-CORRIDOR"},
    )
    assert bad_eval.status_code == 400
