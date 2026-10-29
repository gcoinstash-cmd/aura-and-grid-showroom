"""
Pytest Verification Suite for GF-T3-252 Speculative Decoding & Draft-Target Verification Engine
SPDX-License-Identifier: MIT
"""

import pytest
from fastapi.testclient import TestClient
from engine import (
    app,
    SYNTHETIC_CORRIDORS,
    TokenCandidate,
    ParallelVerifyRequest,
    compute_acceptance_probability,
    compute_residual_distribution,
    sample_from_residual,
    compute_speculative_speedup,
    compute_dynamic_window_depth,
    verify_draft_sequence,
    sanitize_identifier,
)

client = TestClient(app)


def test_acceptance_probability_calculation():
    # When target_prob >= draft_prob, acceptance probability is capped at 1.0
    assert compute_acceptance_probability(0.85, 0.70) == 1.0
    # When target_prob < draft_prob, acceptance probability equals p(x) / q(x)
    assert compute_acceptance_probability(0.42, 0.84) == 0.5
    with pytest.raises(ValueError):
        compute_acceptance_probability(0.5, 0.0)
    with pytest.raises(ValueError):
        compute_acceptance_probability(-0.1, 0.5)


def test_parallel_verification_all_accepted():
    req = ParallelVerifyRequest(
        draft_slot="D3",
        corridor="SPECULATIVE-CORRIDOR-ALPHA (DRAFT-TARGET-VERIFICATION-PIPELINE · 14400-GB/S)",
        candidates=[
            TokenCandidate(token_id=101, draft_prob=0.80, target_prob=0.88, threshold_u=0.40),
            TokenCandidate(token_id=102, draft_prob=0.75, target_prob=0.79, threshold_u=0.40),
            TokenCandidate(token_id=103, draft_prob=0.90, target_prob=0.81, threshold_u=0.40),
            TokenCandidate(token_id=104, draft_prob=0.85, target_prob=0.85, threshold_u=0.40),
            TokenCandidate(token_id=105, draft_prob=0.70, target_prob=0.77, threshold_u=0.40),
        ],
    )
    result = verify_draft_sequence(req)
    assert result["project"] == "GF-T3-252"
    assert result["accepted_count"] == 5
    assert result["emitted_count"] == 6  # K accepted + 1 bonus token from target forward pass
    assert result["rejection_triggered"] is False
    assert result["speculative_state"] == "TARGET_VERIFIED"
    assert result["residual_recovery"] is None


def test_parallel_verification_rejection_and_residual_resampling():
    req = ParallelVerifyRequest(
        draft_slot="D1",
        corridor="SPECULATIVE-CORRIDOR-GAMMA (RESIDUAL-REJECTION-SAMPLING-ENGINE)",
        candidates=[
            TokenCandidate(token_id=201, draft_prob=0.80, target_prob=0.85, threshold_u=0.50),
            TokenCandidate(token_id=202, draft_prob=0.92, target_prob=0.18, threshold_u=0.65),
            TokenCandidate(token_id=203, draft_prob=0.80, target_prob=0.85, threshold_u=0.20),
        ],
        vocab_target_dist=[0.60, 0.25, 0.10, 0.05],
        vocab_draft_dist=[0.10, 0.55, 0.25, 0.10],
    )
    result = verify_draft_sequence(req)
    assert result["accepted_count"] == 1
    assert result["rejected_at_step"] == 1
    assert result["emitted_count"] == 2  # 1 accepted + 1 residual resampled token
    assert result["rejection_triggered"] is True
    assert result["speculative_state"] == "RESIDUAL_RESAMPLED"
    assert result["residual_recovery"] is not None
    assert result["residual_recovery"]["sampled_token_index"] == 0


def test_residual_rejection_sampling_distribution():
    target = [0.50, 0.30, 0.15, 0.05]
    draft = [0.10, 0.50, 0.25, 0.15]
    # Positive deltas: [0.40, 0.0, 0.0, 0.0] -> normalized: [1.0, 0.0, 0.0, 0.0]
    res = compute_residual_distribution(target, draft)
    assert res == [1.0, 0.0, 0.0, 0.0]
    sampled = sample_from_residual(target, draft, pivot=0.75)
    assert sampled["sampled_token_index"] == 0
    assert sampled["sampled_residual_prob"] == 1.0


def test_dynamic_window_scaling_adherence():
    # High acceptance rate should scale window K upward
    high_acc = compute_dynamic_window_depth(4, [0.91, 0.93, 0.90, 0.94], cost_ratio_c=0.04)
    assert high_acc["recommended_depth_k"] > 4
    assert high_acc["compute_bubble_eliminated"] is True

    # Low acceptance rate should scale window K downward to eliminate wasted draft compute
    low_acc = compute_dynamic_window_depth(8, [0.22, 0.18, 0.25, 0.20], cost_ratio_c=0.08)
    assert low_acc["recommended_depth_k"] < 8


def test_speculative_speedup_validation_and_bubble_elimination():
    # At K=5, alpha=0.824, c=0.042, speedup is > 2.5x
    speedup = compute_speculative_speedup(5, 0.824, 0.042)
    assert speedup >= 2.5
    # Perfect acceptance alpha=1.0 yields (K+1)/(1 + K*c)
    perfect = compute_speculative_speedup(5, 1.0, 0.04)
    assert perfect == round(6.0 / 1.2, 4)


def test_zero_trust_sanitizer_and_api_endpoints():
    with pytest.raises(ValueError):
        sanitize_identifier("D0; DROP TABLE drafts;--")
    with pytest.raises(ValueError):
        sanitize_identifier("Forbidden" + chr(36) + "Glyph")

    resp_health = client.get("/health")
    assert resp_health.status_code == 200
    assert resp_health.json()["project"] == "GF-T3-252"

    resp_corridors = client.get("/api/v1/corridors")
    assert resp_corridors.status_code == 200
    assert len(resp_corridors.json()["corridors"]) == len(SYNTHETIC_CORRIDORS)

    resp_scale = client.post(
        "/api/v1/window-scale",
        json={"current_depth_k": 5, "acceptance_history": [0.824, 0.84, 0.81], "cost_ratio_c": 0.042},
    )
    assert resp_scale.status_code == 200
    assert resp_scale.json()["compute_bubble_eliminated"] is True
