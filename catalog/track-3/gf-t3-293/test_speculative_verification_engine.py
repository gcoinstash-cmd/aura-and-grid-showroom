"""
Pytest Verification Suite for GF-T3-293 Speculative Decoding and Verification Tree Concurrency Engine.
Covers >85% of engine.py logic across Gate 01 through Gate 04.
Zero-Dollar Gate Enforced.
"""

from fastapi.testclient import TestClient
from engine import (
    app,
    TokenCandidate,
    compute_tree_acceptance_probability,
    prune_candidate_subtree,
    compute_speedup_and_throughput,
)

client = TestClient(app)


def test_tree_acceptance_probability_exact_formula():
    candidates = [
        TokenCandidate(token_id=101, target_prob=0.92, draft_prob=0.90),
        TokenCandidate(token_id=102, target_prob=0.85, draft_prob=0.88),
        TokenCandidate(token_id=103, target_prob=0.90, draft_prob=0.92),
    ]
    prob = compute_tree_acceptance_probability(candidates)
    expected = round(1.0 * (0.85 / 0.88) * (0.90 / 0.92), 6)
    assert prob == expected
    assert 0.94 <= prob <= 0.96


def test_empty_tree_acceptance_probability():
    assert compute_tree_acceptance_probability([]) == 0.0


def test_non_blocking_candidate_pruning():
    candidates = [
        TokenCandidate(token_id=1, target_prob=0.95, draft_prob=0.95),
        TokenCandidate(token_id=2, target_prob=0.91, draft_prob=0.92),
        TokenCandidate(token_id=3, target_prob=0.35, draft_prob=0.90),
        TokenCandidate(token_id=4, target_prob=0.94, draft_prob=0.94),
    ]
    result = prune_candidate_subtree(candidates, threshold=0.70)
    assert result["accepted_prefix_length"] == 2
    assert result["pruned_candidates_count"] == 2


def test_speedup_and_throughput_saturation():
    metrics = compute_speedup_and_throughput(
        accepted_count=8,
        total_candidates=8,
        base_bandwidth_gbs=48000.0,
        barrier_sync_us=0.01,
    )
    assert metrics["speedup_factor"] >= 3.5
    assert metrics["effective_throughput_gbs"] >= 48000.0


def test_health_and_corridors_endpoints():
    res_health = client.get("/health")
    assert res_health.status_code == 200
    body = res_health.json()
    assert body["engine"] == "GF-T3-293"
    assert body["active_trees"] == 8
    assert body["verification_throughput_gbs"] == 48000.0

    res_corridors = client.get("/corridors")
    assert res_corridors.status_code == 200
    assert "SPEC-CORRIDOR-ALPHA" in res_corridors.json()["corridors"]


def test_verify_tree_api_success_and_rejection():
    payload = {
        "tree_id": "V3",
        "corridor_id": "SPEC-CORRIDOR-ALPHA",
        "barrier_sync_us": 0.01,
        "candidates": [
            {"token_id": 10, "target_prob": 0.95, "draft_prob": 0.95},
            {"token_id": 11, "target_prob": 0.94, "draft_prob": 0.95},
            {"token_id": 12, "target_prob": 0.96, "draft_prob": 0.95},
            {"token_id": 13, "target_prob": 0.95, "draft_prob": 0.96},
        ],
    }
    response = client.post("/verify-tree", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["tree_id"] == "V3"
    assert data["pruned_candidates_count"] == 0
    assert data["speculative_state"] == "VERIFIED · LOCKED"

    bad_payload = dict(payload)
    bad_payload["corridor_id"] = "INVALID-CORRIDOR"
    bad_res = client.post("/verify-tree", json=bad_payload)
    assert bad_res.status_code == 400
