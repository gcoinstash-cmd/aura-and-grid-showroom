# SPDX-License-Identifier: MIT
# GF-T3-249 Pytest Verification Suite (>80% coverage)

import math
import pytest
from engine import (
    MOE_CORRIDORS,
    RoutingRequestPayload,
    compute_auxiliary_load_balancing_loss,
    compute_router_z_loss,
    compute_softmax,
    health_check,
    select_top2_experts,
    simulate_expert_parallel_dispatch,
)


def test_top2_gating_probability_distribution():
    logits = [1.1, 1.4, 0.9, 1.85, 1.05, 1.2, 0.95, 1.15]
    probs = compute_softmax(logits)
    assert len(probs) == 8
    assert math.isclose(sum(probs), 1.0, rel_tol=1e-6)
    assert all(0.0 < p < 1.0 for p in probs)

    top2 = select_top2_experts(probs)
    assert top2["top1_index"] == 3
    assert top2["top2_index"] == 1
    assert math.isclose(top2["top1_gate"] + top2["top2_gate"], 1.0, rel_tol=1e-3)
    assert top2["top1_gate"] > top2["top2_gate"]


def test_auxiliary_load_balancing_loss_and_collapse_prevention():
    uniform_fractions = [0.125] * 8
    uniform_probs = [0.125] * 8
    uniform_loss = compute_auxiliary_load_balancing_loss(
        uniform_fractions, uniform_probs, alpha=0.0012
    )
    assert math.isclose(uniform_loss, 0.0012, rel_tol=1e-5)

    collapsed_fractions = [1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    collapsed_probs = [0.93, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01]
    collapsed_loss = compute_auxiliary_load_balancing_loss(
        collapsed_fractions, collapsed_probs, alpha=0.0012
    )
    assert collapsed_loss > uniform_loss * 7.0

    z_loss = compute_router_z_loss([1.14, 1.18, 1.15, 1.16, 1.12, 1.17, 1.15, 1.14])
    assert z_loss > 0.0


def test_expert_parallel_token_dispatch_zero_drop_and_bandwidth_saturation():
    payload = RoutingRequestPayload(
        corridor=MOE_CORRIDORS[0],
        feature_vector=[1.14, 1.18, 1.15, 1.16],
        batch_tokens=2944,
        capacity_factor=1.25,
        auxiliary_alpha=0.0012,
        saturation_spike=False,
        step_counter=0,
    )
    result = simulate_expert_parallel_dispatch(payload)
    assert result.engine_id == "GF-T3-249"
    assert result.throughput_gbs == 12000
    assert result.routing_latency_us == 0.01
    assert result.active_experts == 8
    assert result.processed_tokens == 2944
    assert result.dropped_tokens == 0
    assert sum(exp.dispatched_tokens for exp in result.experts) == 2944
    assert all(exp.dispatched_tokens <= exp.max_capacity_tokens for exp in result.experts)


def test_saturation_spike_overflow_redistribution():
    payload = RoutingRequestPayload(
        corridor=MOE_CORRIDORS[1],
        feature_vector=[1.14, 1.18, 1.15, 1.16],
        batch_tokens=2944,
        capacity_factor=1.15,
        auxiliary_alpha=0.0012,
        saturation_spike=True,
        step_counter=3,
    )
    result = simulate_expert_parallel_dispatch(payload)
    assert result.dropped_tokens == 0
    assert result.processed_tokens == 2944
    assert any(exp.status in ("SATURATED", "REBALANCING") for exp in result.experts)


def test_health_and_validation_boundaries():
    health = health_check()
    assert health["engine"] == "GF-T3-249"
    assert health["dropped_tokens"] == 0

    with pytest.raises(ValueError):
        compute_softmax([])

    with pytest.raises(ValueError):
        select_top2_experts([1.0])

    with pytest.raises(ValueError):
        compute_auxiliary_load_balancing_loss([0.5, 0.5], [0.5])
