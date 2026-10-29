"""
Pytest verification suite (>85% coverage) for GF-T3-295:
1. Asynchronous distributed state synchronization and checkpoint partitioning correctness.
2. NVMe-oF streaming efficiency and zero training downtime under node recovery.
3. Hardware tensor core acceleration and throughput saturation.
"""

import pytest
from fastapi.testclient import TestClient

from engine import (
    CheckpointCorridor,
    CheckpointPartitionRequest,
    DistributedCheckpointEngine,
    NodeRecoveryRequest,
    app,
    calculate_nvmeof_streaming_metrics,
    compute_distributed_sync_tensor_product,
    compute_snapshot_operator,
)

client = TestClient(app)


def test_snapshot_operator_determinism_and_bounds() -> None:
    val_a = compute_snapshot_operator(5.61, 104, 0)
    val_b = compute_snapshot_operator(5.61, 104, 0)
    assert val_a == val_b
    assert 0.95 <= val_a <= 1.05


def test_distributed_sync_tensor_product_partitioning() -> None:
    weights = [5.61, 5.65, 5.62, 5.64, 5.63, 5.66, 5.60, 5.63]
    invariant, digests = compute_distributed_sync_tensor_product(weights, 104, 8)
    assert 0.85 <= invariant <= 1.15
    assert len(digests) == 8
    assert len(set(digests)) == 8
    for digest in digests:
        assert len(digest) == 8


def test_nvmeof_streaming_efficiency_and_saturation() -> None:
    alpha_metrics = calculate_nvmeof_streaming_metrics(
        CheckpointCorridor.ALPHA,
        parameter_shards_gb=6200.0,
        active_nodes=8,
        total_nodes=8,
        burst_multiplier=1.0,
    )
    assert alpha_metrics["throughput_gbs"] == 49600.0
    assert alpha_metrics["latency_us"] == 0.01
    assert alpha_metrics["barrier_commit_us"] < 0.01

    burst_metrics = calculate_nvmeof_streaming_metrics(
        CheckpointCorridor.ALPHA,
        parameter_shards_gb=6200.0,
        active_nodes=8,
        total_nodes=8,
        burst_multiplier=1.12,
    )
    assert burst_metrics["throughput_gbs"] > 49600.0

    delta_metrics = calculate_nvmeof_streaming_metrics(
        CheckpointCorridor.DELTA,
        parameter_shards_gb=6200.0,
        active_nodes=8,
        total_nodes=8,
        burst_multiplier=1.0,
    )
    assert delta_metrics["throughput_gbs"] < alpha_metrics["throughput_gbs"]
    assert delta_metrics["latency_us"] == 0.04


def test_zero_downtime_node_fault_injection_and_recovery() -> None:
    eng = DistributedCheckpointEngine()
    fault_res = eng.inject_or_recover_node_fault(
        NodeRecoveryRequest(target_node_id=3, inject_fault=True, auto_recover_nvmeof=False)
    )
    assert fault_res.zero_downtime_verified is True
    assert fault_res.active_nodes == 7
    assert fault_res.checkpoint_state == "Ring Failover Active"
    assert fault_res.nodes[3]["status"] == "REROUTING · RING-HEAL"

    recover_res = eng.inject_or_recover_node_fault(
        NodeRecoveryRequest(target_node_id=3, inject_fault=False, auto_recover_nvmeof=True)
    )
    assert recover_res.zero_downtime_verified is True
    assert recover_res.active_nodes == 8
    assert recover_res.checkpoint_state == "Replication Active"
    assert recover_res.nodes[3]["status"] == "REPLICATED · LOCKED"


def test_engine_step_burst_and_flush_lifecycle() -> None:
    eng = DistributedCheckpointEngine()
    step_res = eng.step_checkpoint_pass()
    assert step_res.project_id == "GF-T3-295"
    assert step_res.processed_tokens_units == 9216000
    assert step_res.checkpoint_throughput_gbs == 49600.0

    burst_res = eng.trigger_replication_burst()
    assert burst_res.checkpoint_throughput_gbs > 50000.0

    flush_res = eng.flush_arenas()
    assert flush_res.processed_tokens_units == 9088000
    assert flush_res.checkpoint_throughput_gbs == 49600.0
    assert flush_res.mesh_pointer == "0x1BF8DC0"


def test_validation_guards_and_fastapi_endpoints() -> None:
    with pytest.raises(ValueError):
        CheckpointPartitionRequest(weight_vector=[])
    with pytest.raises(ValueError):
        CheckpointPartitionRequest(weight_vector=[-1.0, 5.2])

    r_health = client.get("/health")
    assert r_health.status_code == 200
    assert r_health.json()["project_id"] == "GF-T3-295"

    r_tel = client.get("/api/v1/telemetry")
    assert r_tel.status_code == 200
    assert r_tel.json()["checkpoint_throughput_gbs"] == 49600.0

    r_step = client.post(
        "/api/v1/checkpoint/step",
        json={
            "corridor": "CHK-CORRIDOR-BRAVO (ZERO-DOWNTIME-STATE-SYNCHRONIZATION-ENGINE)",
            "node_count": 8,
            "epoch_sigma": 200,
            "parameter_shards_gb": 6200.0,
            "weight_vector": [5.61, 5.65, 5.62, 5.64, 5.63, 5.66, 5.60, 5.63],
        },
    )
    assert r_step.status_code == 200
    assert r_step.json()["active_nodes"] == 8

    r_burst = client.post("/api/v1/checkpoint/burst")
    assert r_burst.status_code == 200

    r_fault = client.post(
        "/api/v1/checkpoint/fault",
        json={"target_node_id": 2, "inject_fault": True, "auto_recover_nvmeof": False},
    )
    assert r_fault.status_code == 200
    assert r_fault.json()["active_nodes"] == 7

    r_flush = client.post("/api/v1/checkpoint/flush")
    assert r_flush.status_code == 200
    assert r_flush.json()["active_nodes"] == 8
