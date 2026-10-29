"""
Pytest Verification Suite for GF-T3-251 Capacity Factor & Zero-Token-Dropping Engine
SPDX-License-Identifier: MIT
"""

import pytest
from engine import (
    ExpertAllocationInput,
    calculate_expert_token_limit,
    compute_auxiliary_imbalance_loss,
    execute_capacity_balancer_pass,
    health_check,
)


def test_capacity_factor_thresholding_formula():
    # Capacity = ceil(1.25 * (2560 / 8)) = 400
    limit = calculate_expert_token_limit(total_tokens=2560, num_experts=8, capacity_factor=1.25)
    assert limit == 400

    # Non-integer division rounds up cleanly to prevent buffer truncation
    limit_odd = calculate_expert_token_limit(total_tokens=1000, num_experts=8, capacity_factor=1.25)
    assert limit_odd == 157


def test_capacity_factor_boundary_validation():
    with pytest.raises(ValueError):
        calculate_expert_token_limit(total_tokens=2560, num_experts=0, capacity_factor=1.25)
    with pytest.raises(ValueError):
        calculate_expert_token_limit(total_tokens=-10, num_experts=8, capacity_factor=1.25)
    with pytest.raises(ValueError):
        calculate_expert_token_limit(total_tokens=2560, num_experts=8, capacity_factor=0.85)


def test_baseline_balanced_dispatch_zero_drops():
    payload = ExpertAllocationInput(
        total_tokens=2560,
        num_experts=8,
        capacity_factor=1.25,
        expert_demand_weights=[0.96, 0.96, 0.96, 0.975, 0.96, 0.96, 0.96, 0.96],
    )
    res = execute_capacity_balancer_pass(payload)
    assert res.engine_id == "GF-T3-251"
    assert res.token_limit_per_expert == 400
    assert res.total_dropped_tokens == 0
    assert res.total_redispatched_tokens == 0
    assert res.experts[0].routed_tokens == 384
    assert res.experts[3].routed_tokens == 390
    assert res.moe_state == "Capacity Balanced"


def test_zero_token_dropping_redirection_under_imbalance_spike():
    # Expert 0 and Expert 3 receive massive spikes (> 1.25x capacity) while others have slack
    payload = ExpertAllocationInput(
        total_tokens=2560,
        num_experts=8,
        capacity_factor=1.25,
        corridor="CAPACITY-CORRIDOR-BRAVO (ZERO-TOKEN-DROPPING-REDISPATCH)",
        expert_demand_weights=[1.85, 0.65, 0.70, 1.90, 0.60, 0.75, 0.80, 0.75],
    )
    res = execute_capacity_balancer_pass(payload)
    assert res.total_dropped_tokens == 0
    assert res.total_redispatched_tokens > 0
    assert res.moe_state == "Zero-Drop Redispatch Active"
    # Verify total routed equals sum of incoming demands (100% conservation of tokens)
    total_demand = sum(e.incoming_demand for e in res.experts)
    assert res.total_tokens_processed == total_demand


def test_severe_capacity_burst_dynamic_expansion():
    # All 8 experts exceed baseline 1.25 factor simultaneously
    payload = ExpertAllocationInput(
        total_tokens=2560,
        num_experts=8,
        capacity_factor=1.25,
        expert_demand_weights=[1.6, 1.5, 1.7, 1.6, 1.5, 1.6, 1.5, 1.6],
    )
    res = execute_capacity_balancer_pass(payload)
    assert res.total_dropped_tokens == 0
    assert res.total_redispatched_tokens > 0
    assert res.token_limit_per_expert >= 400


def test_auxiliary_imbalance_loss_and_health():
    # Perfectly uniform distribution yields auxiliary loss == 1.000000
    uniform_loss = compute_auxiliary_imbalance_loss(
        [384] * 8, [384] * 8, 8
    )
    assert abs(uniform_loss - 1.0) < 1e-5

    # Skewed distribution yields auxiliary loss > 1.0
    skewed_loss = compute_auxiliary_imbalance_loss(
        [900, 100, 100, 100, 100, 100, 100, 100],
        [400, 200, 200, 200, 150, 150, 150, 150],
        8,
    )
    assert skewed_loss > 1.0

    hc = health_check()
    assert hc["engine"] == "GF-T3-251"
    assert hc["zero_token_drop_gate"] == "VERIFIED"
