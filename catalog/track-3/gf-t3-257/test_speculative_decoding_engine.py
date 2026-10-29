"""
GF-T3-257: Executable Pytest Verification Suite
Tests:
1. Target-draft probability threshold validation and rejection sampling correctness.
2. Multi-token acceptance pipeline and latency reduction during autoregressive rollout.
3. Hardware tensor core acceleration and throughput saturation.
"""

import pytest
from fastapi.testclient import TestClient
from engine import (
    app,
    SYNTHETIC_CORRIDORS,
    TokenDistributionPair,
    compute_acceptance_probability,
    compute_residual_distribution,
    compute_expected_tokens_per_pass,
    compute_theoretical_speedup,
    evaluate_draft_sequence,
)

client = TestClient(app)


def test_acceptance_probability_bounds() -> None:
    # When target probability >= draft probability, acceptance is capped at 1.0
    assert compute_acceptance_probability(0.85, 0.70) == 1.0
    assert compute_acceptance_probability(0.50, 0.50) == 1.0

    # When target probability < draft probability, acceptance equals ratio p/q
    ratio = compute_acceptance_probability(0.44, 0.88)
    assert abs(ratio - 0.50) < 1e-6


def test_acceptance_probability_invalid_inputs() -> None:
    with pytest.raises(ValueError):
        compute_acceptance_probability(0.5, 0.0)
    with pytest.raises(ValueError):
        compute_acceptance_probability(-0.1, 0.5)


def test_residual_distribution_normalization() -> None:
    target = [0.60, 0.25, 0.15]
    draft = [0.30, 0.40, 0.30]
    residual = compute_residual_distribution(target, draft)
    assert len(residual) == 3
    assert abs(sum(residual) - 1.0) < 1e-6
    # Only index 0 has positive (p_target - q_draft)
    assert residual[0] == pytest.approx(1.0)
    assert residual[1] == pytest.approx(0.0)
    assert residual[2] == pytest.approx(0.0)


def test_residual_distribution_degenerate_fallback() -> None:
    # Identical distributions yield zero positive mass -> uniform fallback
    ident = [0.5, 0.5]
    residual = compute_residual_distribution(ident, ident)
    assert residual == [0.5, 0.5]

    with pytest.raises(ValueError):
        compute_residual_distribution([0.5], [0.2, 0.8])


def test_expected_tokens_and_speedup_math() -> None:
    # Full acceptance (alpha = 1.0) with k = 4 yields k + 1 = 5 tokens per target pass
    expected_full = compute_expected_tokens_per_pass(1.0, 4)
    assert expected_full == pytest.approx(5.0)

    # Zero acceptance (alpha = 0.0) yields 1 token per pass (the target fallback token)
    expected_zero = compute_expected_tokens_per_pass(0.0, 4)
    assert expected_zero == pytest.approx(1.0)

    # At alpha = 0.88, k = 4, c = 0.14 -> speedup ~ 2.52x
    speedup = compute_theoretical_speedup(0.88, 4, 0.14)
    assert 2.45 <= speedup <= 2.55


def test_multi_token_acceptance_pipeline_nominal_and_fallback() -> None:
    pairs = [
        TokenDistributionPair(token_id=101, target_prob=0.90, draft_prob=0.92, threshold_u=0.40),
        TokenDistributionPair(token_id=102, target_prob=0.88, draft_prob=0.91, threshold_u=0.45),
        TokenDistributionPair(token_id=103, target_prob=0.91, draft_prob=0.93, threshold_u=0.35),
        TokenDistributionPair(token_id=104, target_prob=0.87, draft_prob=0.90, threshold_u=0.50),
    ]
    nominal = evaluate_draft_sequence(pairs, cost_coefficient_c=0.14, discrepancy_spike=False)
    assert nominal["accepted_tokens"] == 4
    assert nominal["emitted_tokens_total"] == 5
    assert nominal["state"] == "VERIFIED"
    assert nominal["locked"] is True
    assert nominal["throughput_gbs"] >= 18000.0
    assert nominal["verification_latency_us"] <= 0.02

    # Inject draft discrepancy spike -> forces rejection fallback
    fallback = evaluate_draft_sequence(pairs, cost_coefficient_c=0.14, discrepancy_spike=True)
    assert fallback["accepted_tokens"] < 4
    assert fallback["state"] == "REJECT_FALLBACK"
    assert fallback["locked"] is False


def test_fastapi_endpoints_and_corridor_validation() -> None:
    health_res = client.get("/api/health")
    assert health_res.status_code == 200
    health_data = health_res.json()
    assert health_data["engine"] == "GF-T3-257"
    assert health_data["throughput_gbs"] == 19500
    assert health_data["active_drafts"] == 8

    telemetry_res = client.get("/api/telemetry")
    assert telemetry_res.status_code == 200
    assert len(telemetry_res.json()["drafts"]) == 8

    verify_payload = {
        "corridor": SYNTHETIC_CORRIDORS[1],
        "draft_depth_k": 4,
        "cost_coefficient_c": 0.08,
        "discrepancy_spike": False,
        "sequence": [
            {"token_id": 11, "target_prob": 0.91, "draft_prob": 0.92, "threshold_u": 0.2},
            {"token_id": 12, "target_prob": 0.89, "draft_prob": 0.91, "threshold_u": 0.3},
            {"token_id": 13, "target_prob": 0.90, "draft_prob": 0.92, "threshold_u": 0.25},
            {"token_id": 14, "target_prob": 0.88, "draft_prob": 0.90, "threshold_u": 0.35},
        ],
    }
    verify_res = client.post("/api/verify", json=verify_payload)
    assert verify_res.status_code == 200
    assert verify_res.json()["corridor"] == SYNTHETIC_CORRIDORS[1]

    # Invalid corridor should trigger 422 validation failure
    bad_payload = dict(verify_payload)
    bad_payload["corridor"] = "INVALID_CORRIDOR"
    bad_res = client.post("/api/verify", json=bad_payload)
    assert bad_res.status_code == 422

    flush_res = client.post("/api/flush")
    assert flush_res.status_code == 200
    assert flush_res.json()["status"] == "BUFFERS_FLUSHED_WEIGHTS_REZEROED"
