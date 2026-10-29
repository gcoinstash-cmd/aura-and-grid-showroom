"""
Pytest Verification Suite for GF-T3-285:
Ultra-Wide Dynamic Ephemeral Speculative Tree Pruning & Hardware-Accelerated Branch Scoring Engine.

Covers:
1. Ephemeral speculative tree pruning and weighted branch scoring correctness.
2. Hardware-accelerated sub-tree pruning efficiency and verification speedup multipliers.
3. Hardware tensor core acceleration and throughput saturation.
4. Zero-currency symbol enforcement across all responses and telemetry payloads.
"""

import json
import math
import pytest
from fastapi.testclient import TestClient

from engine import (
    CORRIDOR_PROFILES,
    BranchCandidateInput,
    BranchEvaluationRequest,
    CorridorId,
    TokenStepInput,
    app,
    build_default_branches,
    compute_branch_score,
    evaluate_speculative_tree,
)

client = TestClient(app)


def test_weighted_branch_scoring_formula_exactness():
    """Gate 01: Verify S_branch = sum(w_t * log P(x_t | x_<t)) - lambda * Depth."""
    steps = [
        TokenStepInput(step_index=1, weight=1.0, conditional_prob=0.98),
        TokenStepInput(step_index=2, weight=0.95, conditional_prob=0.96),
        TokenStepInput(step_index=3, weight=0.90, conditional_prob=0.95),
        TokenStepInput(step_index=4, weight=0.85, conditional_prob=0.94),
    ]
    depth = 4
    lambda_penalty = 0.085

    expected_log_sum = (
        1.0 * math.log(0.98)
        + 0.95 * math.log(0.96)
        + 0.90 * math.log(0.95)
        + 0.85 * math.log(0.94)
    )
    expected_depth_pen = lambda_penalty * depth
    expected_score = expected_log_sum - expected_depth_pen

    w_log_sum, d_pen, s_branch, conf_pct = compute_branch_score(
        steps=steps,
        depth=depth,
        lambda_penalty=lambda_penalty,
    )

    assert math.isclose(w_log_sum, expected_log_sum, rel_tol=1e-5)
    assert math.isclose(d_pen, expected_depth_pen, rel_tol=1e-5)
    assert math.isclose(s_branch, expected_score, rel_tol=1e-5)
    assert 85.0 <= conf_pct <= 99.9


def test_branch_score_validation_errors():
    """Verify deterministic input validation guards."""
    step = TokenStepInput(step_index=1, weight=1.0, conditional_prob=0.95)
    with pytest.raises(ValueError, match="Depth must be >= 1"):
        compute_branch_score([step], depth=0, lambda_penalty=0.1)

    with pytest.raises(ValueError, match="Lambda penalty must be non-negative"):
        compute_branch_score([step], depth=2, lambda_penalty=-0.1)

    with pytest.raises(ValueError, match="Steps list cannot be empty"):
        compute_branch_score([], depth=2, lambda_penalty=0.1)


def test_ephemeral_subtree_pruning_and_tensor_reallocation():
    """Verify low-probability speculative branches are pruned and SM compute reallocates to 100%."""
    branches = build_default_branches(divergence_spike=True)
    req = BranchEvaluationRequest(
        corridor=CorridorId.ALPHA,
        lambda_penalty=0.085,
        prune_threshold=-1.35,
        divergence_spike_active=True,
        branches=branches,
    )
    result = evaluate_speculative_tree(req)

    assert result.unit_id == "GF-T3-285"
    assert result.total_branches_count == 8
    assert result.pruned_branches_count == 3
    assert result.active_branches_count == 5
    assert result.verification_speedup_x > CORRIDOR_PROFILES[CorridorId.ALPHA]["speedup_multiplier"]

    surviving_alloc_sum = sum(
        b.sm_tensor_allocation_pct for b in result.branch_results if not b.pruned
    )
    pruned_alloc_sum = sum(
        b.sm_tensor_allocation_pct for b in result.branch_results if b.pruned
    )
    assert math.isclose(surviving_alloc_sum, 100.0, abs_tol=0.1)
    assert pruned_alloc_sum == 0.0


def test_hardware_tensor_core_throughput_saturation():
    """Verify all 4 synthetic corridors meet latency, throughput, and SM efficiency invariants."""
    for corridor in CorridorId:
        res = client.get(
            "/api/v1/telemetry/snapshot",
            params={"corridor": corridor.value, "divergence_spike": False},
        )
        assert res.status_code == 200
        payload = res.json()
        assert payload["unit_id"] == "GF-T3-285"
        assert payload["throughput_gbps"] >= 18400.0
        assert payload["evaluation_latency_us"] <= 0.08
        assert payload["sm_compute_efficiency_pct"] >= 81.0
        assert payload["ring_barrier_sync_us"] <= 0.01
        assert payload["processed_tokens_units"] == 7936000


def test_fastapi_endpoints_and_zero_dollar_gate():
    """Ensure health, corridors, and evaluation endpoints return zero currency symbols."""
    health_res = client.get("/health")
    assert health_res.status_code == 200
    assert "GF-T3-285" in health_res.text

    corridors_res = client.get("/api/v1/corridors")
    assert corridors_res.status_code == 200
    assert len(corridors_res.json()["corridors"]) == 4

    eval_req = BranchEvaluationRequest(
        corridor=CorridorId.ALPHA,
        lambda_penalty=0.085,
        prune_threshold=-1.35,
        divergence_spike_active=False,
        branches=build_default_branches(divergence_spike=False),
    )
    post_res = client.post("/api/v1/prune/evaluate", json=eval_req.model_dump(mode="json"))
    assert post_res.status_code == 200
    serialized = json.dumps(post_res.json())
    assert chr(36) not in serialized
    assert post_res.json()["throughput_gbps"] == 42400.0
    assert post_res.json()["pruning_state"] == "Active Active"
