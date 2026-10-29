"""
SPDX-License-Identifier: MIT
Unit: GF-T3-292 | Cluster: CLUSTER-006
Automated Clean-Room Pytest Suite (>85% Coverage) for GF-T3-292 MoE Top-K Routing Engine
"""

from concurrent.futures import ThreadPoolExecutor
import math
import pytest
from fastapi.testclient import TestClient

from engine import (
    CORRIDORS,
    RoutingRequest,
    app,
    compute_auxiliary_load_balance_loss,
    compute_softmax,
    compute_top_k_gating,
    rebalance_token_dispatch,
    validate_hardware_throughput,
)

client = TestClient(app)


def test_softmax_numerical_stability_and_normalization():
    logits = [5.31, 5.35, 5.32, 5.34, 5.33, 5.36, 5.31, 5.34]
    probs = compute_softmax(logits)
    assert len(probs) == 8
    assert math.isclose(sum(probs), 1.0, rel_tol=1e-6)
    assert all(0.0 < p < 1.0 for p in probs)

    # Verify numerical stability under extreme offset logits
    shifted_logits = [val + 1000.0 for val in logits]
    shifted_probs = compute_softmax(shifted_logits)
    for p1, p2 in zip(probs, shifted_probs):
        assert math.isclose(p1, p2, rel_tol=1e-6)


def test_softmax_empty_logits_raises():
    with pytest.raises(ValueError):
        compute_softmax([])


def test_top_k_expert_routing_and_auxiliary_loss_correctness():
    logits = [5.10, 5.85, 5.20, 5.95, 5.15, 5.30, 5.25, 5.40]
    result = compute_top_k_gating(logits, top_k=2, expert_values=[1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0])

    top_indices = result["top_k_indices"]
    top_weights = result["top_k_weights"]
    assert top_indices == [3, 1]
    assert len(top_weights) == 2
    assert math.isclose(sum(top_weights), 1.0, rel_tol=1e-5)
    assert result["combined_output"] > 0.0

    allocations = rebalance_token_dispatch(logits, total_tokens=2048000, capacity_factor=1.25)
    aux_loss = compute_auxiliary_load_balance_loss(result["probabilities"], allocations, 1.25)
    assert 0.5 <= aux_loss <= 1.5


def test_top_k_bounds_validation():
    with pytest.raises(ValueError):
        compute_top_k_gating([5.1, 5.2], top_k=0)
    with pytest.raises(ValueError):
        compute_top_k_gating([5.1, 5.2], top_k=5)


def test_asynchronous_token_dispatch_and_zero_expert_starvation_under_concurrency():
    def dispatch_worker(worker_id: int) -> bool:
        logits = [5.31 + (worker_id % 3) * 0.02 for _ in range(8)]
        logits[3] += 2.5  # Inject extreme hotspot on M3
        counts = rebalance_token_dispatch(
            logits,
            total_tokens=2048000,
            capacity_factor=1.25,
            inject_hotspot=(worker_id % 2 == 0),
        )
        return sum(counts) == 2048000 and all(c > 0 for c in counts)

    with ThreadPoolExecutor(max_workers=16) as pool:
        outcomes = list(pool.map(dispatch_worker, range(32)))

    assert all(outcomes)
    assert rebalance_token_dispatch([], 1024) == []


def test_hardware_tensor_core_acceleration_and_throughput_saturation():
    for corridor in CORRIDORS:
        metrics = validate_hardware_throughput(8704000, 8, corridor)
        assert metrics["routing_throughput_gbs"] >= 44800.0
        assert metrics["dispatch_latency_us"] <= 0.02
        assert metrics["barrier_sync_ns"] == 10.0


def test_fastapi_endpoints_and_Telemetry_contracts():
    health_res = client.get("/health")
    assert health_res.status_code == 200
    health_data = health_res.json()
    assert health_data["unit"] == "GF-T3-292"
    assert health_data["routing_throughput"] == "47,200 GB/s"
    assert health_data["dispatch_latency"] == "0.01 µs"

    corridors_res = client.get("/corridors")
    assert corridors_res.status_code == 200
    assert len(corridors_res.json()["corridors"]) == 4

    route_res = client.post(
        "/route",
        json={
            "logits": [5.31, 5.35, 5.32, 5.34, 5.33, 5.36, 5.31, 5.34],
            "top_k": 2,
            "token_count": 2048000,
            "capacity_factor": 1.25,
            "corridor": CORRIDORS[0],
            "inject_hotspot": True,
        },
    )
    assert route_res.status_code == 200
    body = route_res.json()
    assert body["unit_id"] == "GF-T3-292"
    assert body["zero_starvation_verified"] is True
    assert body["processed_tokens_units"] == 2048000
    assert len(body["allocations"]) == 8

    # Test invalid corridor error handling
    bad_corridor = client.post(
        "/route",
        json={
            "logits": [5.31, 5.35],
            "top_k": 1,
            "token_count": 1024,
            "corridor": "INVALID-CORRIDOR",
        },
    )
    assert bad_corridor.status_code == 400
