"""
Pytest Verification Suite for GF-T3-272
Tests:
1. Multi-candidate speculative acceptance probability and tree verification correctness.
2. Parallel draft token scoring efficiency and speedup multiplier under heavy loads.
3. Hardware tensor core acceleration, throughput saturation, and GridSync security gates.
"""

import pytest
from engine import (
    DraftCandidateInput,
    SpeculativePassRequest,
    SyntheticCorridorId,
    compute_acceptance_probability,
    compute_expected_accepted_tokens,
    compute_kl_divergence,
    compute_residual_distribution,
    compute_tree_speedup_multiplier,
    evaluate_speculative_verification_pass,
    health_check,
    sanitize_gridsync_identifier,
)


def build_default_candidates() -> list[DraftCandidateInput]:
    base_addrs = [
        "0x6000",
        "0x6010",
        "0x6020",
        "0x6030",
        "0x6040",
        "0x6050",
        "0x6060",
        "0x6070",
    ]
    candidates = []
    for idx, addr in enumerate(base_addrs):
        candidates.append(
            DraftCandidateInput(
                candidate_index=idx,
                pointer_hex=addr,
                target_probs=[0.92, 0.89, 0.91, 0.88, 0.90, 0.87],
                draft_probs=[0.94, 0.92, 0.95, 0.93, 0.94, 0.92],
                token_volume_k=256,
            )
        )
    return candidates


def test_acceptance_probability_exact_formula():
    # When P(x) >= Q(x), P_accept = min(1, P(x)/Q(x)) == 1.0
    assert compute_acceptance_probability(0.85, 0.70) == 1.0
    # When P(x) < Q(x), P_accept == P(x) / Q(x)
    assert pytest.approx(compute_acceptance_probability(0.45, 0.90), rel=1e-6) == 0.50
    # Boundary: Q(x) == 0
    assert compute_acceptance_probability(0.30, 0.0) == 1.0
    assert compute_acceptance_probability(0.0, 0.0) == 0.0


def test_acceptance_probability_rejects_negative():
    with pytest.raises(ValueError):
        compute_acceptance_probability(-0.1, 0.5)


def test_residual_distribution_normalization():
    target = [0.60, 0.30, 0.10]
    draft = [0.20, 0.50, 0.30]
    residual = compute_residual_distribution(target, draft)
    assert len(residual) == 3
    assert pytest.approx(sum(residual), rel=1e-6) == 1.0
    # Only index 0 has positive P(x) - Q(x) = 0.40
    assert pytest.approx(residual[0], rel=1e-6) == 1.0
    assert residual[1] == 0.0
    assert residual[2] == 0.0


def test_expected_accepted_tokens_and_speedup():
    alphas = [0.95, 0.94, 0.93, 0.92, 0.91, 0.90]
    expected_len = compute_expected_accepted_tokens(alphas)
    assert expected_len > 4.5
    speedup = compute_tree_speedup_multiplier(
        expected_accepted_tokens=expected_len,
        draft_depth=6,
        draft_cost_coeff=0.03125,
        candidate_branch_count=8,
    )
    assert speedup > 4.0


def test_kl_divergence_properties():
    identical = [0.25, 0.25, 0.25, 0.25]
    assert pytest.approx(compute_kl_divergence(identical, identical), abs=1e-7) == 0.0
    shifted = [0.70, 0.10, 0.10, 0.10]
    assert compute_kl_divergence(shifted, identical) > 0.1


def test_multi_candidate_tree_verification_saturation():
    req = SpeculativePassRequest(
        corridor=SyntheticCorridorId.ALPHA,
        candidates=build_default_candidates(),
        draft_cost_coefficient=0.03125,
        hardware_bus_bandwidth_gbs=32000.0,
        divergence_spike_active=False,
    )
    res = evaluate_speculative_verification_pass(req)
    assert res.engine_id == "GF-T3-272"
    assert res.verification_throughput_gbs == 32000.0
    assert res.draft_latency_us == 0.01
    assert res.active_candidates_count == 8
    assert res.processed_tokens_units >= 6272000
    assert res.speculative_state == "Verification Active"
    assert len(res.candidate_results) == 8
    assert res.candidate_results[3].pointer_hex == "0x6030"
    assert res.candidate_results[3].verified_locked is True


def test_divergence_spike_triggers_tree_repruning():
    req = SpeculativePassRequest(
        corridor=SyntheticCorridorId.BRAVO,
        candidates=build_default_candidates(),
        divergence_spike_active=True,
    )
    res = evaluate_speculative_verification_pass(req)
    assert res.active_candidates_count < 8
    assert res.speculative_state == "Tree Re-Pruning Active"
    faulted = [c for c in res.candidate_results if not c.verified_locked]
    assert len(faulted) >= 2


def test_gridsync_security_sanitizer():
    assert sanitize_gridsync_identifier("0x6030") == "0x6030"
    with pytest.raises(ValueError):
        sanitize_gridsync_identifier("0x6030; DROP TABLE speculative_runs;--")
    with pytest.raises(ValueError):
        sanitize_gridsync_identifier("<script>alert(1)</script>")


def test_health_endpoint_payload():
    status = health_check()
    assert status["engine_id"] == "GF-T3-272"
    assert status["verification_throughput"] == "32,000 GB/s"
    assert status["draft_latency"] == "0.01 µs"
    assert status["active_candidates"] == "8 Candidates"
    assert status["processed_tokens"] == "6,272,000 Units"
