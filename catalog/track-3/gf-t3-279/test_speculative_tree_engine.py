"""
Pytest verification suite for GF-T3-279 Speculative Tree Engine.
Verifies:
1. Batched tree speculative verification and parallel draft branch expansion correctness.
2. Candidate scoring efficiency and speedup multipliers under heavy inference loads.
3. Hardware tensor core acceleration and throughput saturation.
"""

import pytest
from fastapi.testclient import TestClient
from engine import (
    app,
    CORRIDOR_PROFILES,
    CandidateTreeRequest,
    compute_batched_tree_verification,
    expand_non_blocking_draft_branches,
    validate_hardware_throughput_saturation,
)

client = TestClient(app)


def test_batched_tree_verification_nominal() -> None:
    branch_matrix = [
        [-0.08, -0.09, -0.07, -0.10, -0.06, -0.08, -0.09, -0.07],
        [-0.04, -0.05, -0.03, -0.04, -0.05, -0.04, -0.03, -0.04],
        [-0.12, -0.11, -0.15, -0.14, -0.13, -0.12, -0.11, -0.10],
        [-0.09, -0.08, -0.07, -0.09, -0.08, -0.07, -0.08, -0.09],
    ]
    result = compute_batched_tree_verification(branch_matrix, divergence_threshold=-1.0)
    assert result["winning_branch_index"] == 1
    assert result["v_tree_max_score"] == pytest.approx(-0.32, rel=1e-3)
    assert result["verified_flags"] == [True, True, True, True]
    assert result["total_accepted_tokens"] == 32
    assert result["speedup_multiplier"] == 4.0


def test_batched_tree_divergence_pruning() -> None:
    branch_matrix = [
        [-0.05, -0.06, -3.80, -0.05],
        [-0.04, -0.05, -0.04, -0.06],
    ]
    result = compute_batched_tree_verification(branch_matrix, divergence_threshold=-2.0)
    assert result["winning_branch_index"] == 1
    assert result["accepted_depths"] == [2, 4]
    assert result["verified_flags"] == [False, True]


def test_batched_tree_invalid_inputs() -> None:
    with pytest.raises(ValueError):
        compute_batched_tree_verification([])
    with pytest.raises(ValueError):
        compute_batched_tree_verification([[]])
    with pytest.raises(ValueError):
        compute_batched_tree_verification([[0.25, -0.1]])


def test_non_blocking_draft_branch_expansion() -> None:
    shards_nominal = expand_non_blocking_draft_branches(
        num_branches=8, base_depth=8, divergence_spike_active=False, step_counter=0
    )
    assert len(shards_nominal) == 8
    assert shards_nominal[0].branch_id == "T0"
    assert shards_nominal[0].hex_ptr == "0xD000"
    assert shards_nominal[3].hex_ptr == "0xD030"
    assert all(s.verified for s in shards_nominal)
    assert all(s.depth == 8 for s in shards_nominal)

    shards_fault = expand_non_blocking_draft_branches(
        num_branches=8, base_depth=8, divergence_spike_active=True, step_counter=2
    )
    assert shards_fault[2].verified is False
    assert shards_fault[5].verified is False
    assert shards_fault[2].status_label == "FAULT · PRUNED"
    assert shards_fault[0].verified is True


def test_non_blocking_expansion_bounds() -> None:
    with pytest.raises(ValueError):
        expand_non_blocking_draft_branches(num_branches=0)
    with pytest.raises(ValueError):
        expand_non_blocking_draft_branches(num_branches=8, base_depth=0)


def test_hardware_throughput_saturation() -> None:
    alpha_corridor = (
        "TREE-CORRIDOR-ALPHA (DYNAMIC-SPECULATIVE-DRAFT-TREE-SHARDING-FABRIC · 37600-GB/S)"
    )
    metrics = validate_hardware_throughput_saturation(
        corridor=alpha_corridor, active_branches=8, stream_multiprocessors=132, burst_multiplier=1.0
    )
    assert metrics["throughput_gbs"] == 37600.0
    assert metrics["verification_latency_us"] == 0.01
    assert metrics["saturation_pct"] > 95.0

    with pytest.raises(ValueError):
        validate_hardware_throughput_saturation("INVALID-CORRIDOR", 8)
    with pytest.raises(ValueError):
        validate_hardware_throughput_saturation(alpha_corridor, 12)


def test_gridsync_zero_trust_sanitization() -> None:
    with pytest.raises(ValueError):
        CandidateTreeRequest(
            corridor="TREE-CORRIDOR-ALPHA; DROP TABLE tree_shards--",
            branch_log_probs=[[-0.1, -0.2]],
        )


def test_fastapi_endpoints() -> None:
    health_res = client.get("/health")
    assert health_res.status_code == 200
    assert health_res.json()["engine"] == "GF-T3-279"
    assert health_res.json()["throughput_gbs"] == 37600

    shards_res = client.get("/api/v1/tree/shards?divergence_spike=false&step=1")
    assert shards_res.status_code == 200
    assert len(shards_res.json()["branches"]) == 8

    verify_res = client.post(
        "/api/v1/tree/verify",
        json={
            "corridor": "TREE-CORRIDOR-ALPHA (DYNAMIC-SPECULATIVE-DRAFT-TREE-SHARDING-FABRIC · 37600-GB/S)",
            "branch_log_probs": [
                [-0.05, -0.04, -0.06, -0.05],
                [-0.12, -0.14, -0.11, -0.15],
            ],
            "divergence_threshold": -1.5,
            "stream_multiprocessors": 132,
        },
    )
    assert verify_res.status_code == 200
    body = verify_res.json()
    assert body["verification"]["winning_branch_index"] == 0
    assert body["hardware_telemetry"]["throughput_gbs"] > 0
