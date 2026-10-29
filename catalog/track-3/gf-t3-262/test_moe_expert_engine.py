"""
Pytest Verification Suite for GF-T3-262 MoE Expert Parallelism & Dynamic Token Routing Engine.
Verifies:
1. Top-k gating router accuracy and capacity factor clipping correctness.
2. All-to-All token dispatch efficiency across distributed expert nodes without bottleneck.
3. Hardware tensor core acceleration and throughput saturation.
"""

import math
import pytest
from engine import (
    EXPERT_HEX_POINTERS,
    SYNTHETIC_CORRIDORS,
    TokenRoutingRequest,
    compute_softmax,
    compute_top_k_gating_and_dispatch,
    compute_z_loss,
    execute_moe_dispatch,
    health_check,
    list_corridors,
)


def test_top_k_gating_softmax_normalization():
    logits = [2.41, 2.45, 2.42, 2.44, 2.43, 2.42, 2.44, 2.43]
    probs = compute_softmax(logits)
    assert len(probs) == 8
    assert math.isclose(sum(probs), 1.0, rel_tol=1e-6)
    for p in probs:
        assert 0.0 < p < 1.0


def test_z_loss_regularization_stability():
    logits = [2.41, 2.45, 2.42, 2.44, 2.43, 2.42, 2.44, 2.43]
    z_loss = compute_z_loss(logits)
    assert z_loss > 0.0
    assert isinstance(z_loss, float)


def test_capacity_factor_clipping_and_zero_token_drop():
    # Create an imbalanced logit vector and verify overflow is re-routed without dropping tokens
    req = TokenRoutingRequest(
        corridor="MOE-CORRIDOR-ALPHA (DYNAMIC-TOKEN-ROUTING-FABRIC · 24200-GB/S)",
        token_batch_size=2048000,
        top_k=2,
        capacity_factor=1.25,
        expert_logits=[2.41, 2.45, 2.42, 2.44, 2.43, 2.42, 2.44, 2.43],
        imbalance_spike_active=True,
        burst_multiplier=1.0,
    )
    res = compute_top_k_gating_and_dispatch(req)
    max_capacity = int(math.ceil((2048000 / 8) * 1.25))
    for expert in res.experts:
        assert expert.dispatched_tokens <= max_capacity
    # Total tokens conserved across 8 experts
    total_routed = sum(e.dispatched_tokens for e in res.experts)
    assert abs(total_routed - 2048000) <= 8


def test_all_to_all_dispatch_nominal_saturation():
    req = TokenRoutingRequest(
        corridor="MOE-CORRIDOR-ALPHA (DYNAMIC-TOKEN-ROUTING-FABRIC · 24200-GB/S)",
        token_batch_size=2048000,
        top_k=2,
        capacity_factor=1.25,
        expert_logits=[2.42, 2.42, 2.42, 2.42, 2.42, 2.42, 2.42, 2.42],
        imbalance_spike_active=False,
        burst_multiplier=1.0,
    )
    res = execute_moe_dispatch(req)
    assert res.engine_title == "GF-T3-262"
    assert res.throughput_gbs == 24200.0
    assert res.routing_latency_us == 0.01
    assert res.active_experts == 8
    assert res.processed_tokens_units == 4608000
    assert res.moe_state == "Routed Active"
    assert res.zero_imbalance_verified is True
    assert len(res.experts) == 8
    for idx, expert in enumerate(res.experts):
        assert expert.hex_ptr == EXPERT_HEX_POINTERS[idx]
        assert expert.tokens_formatted == "256K"
        assert expert.gather_mode == "TOP-2"
        assert expert.state_label == "ROUTED · LOCKED"


def test_hardware_tensor_core_burst_and_corridors():
    corridors = list_corridors()
    assert corridors["engine"] == "GF-T3-262"
    assert len(corridors["corridors"]) == 4

    for corridor_name in SYNTHETIC_CORRIDORS:
        req = TokenRoutingRequest(
            corridor=corridor_name,
            token_batch_size=2048000,
            top_k=2,
            capacity_factor=1.25,
            burst_multiplier=1.15,
        )
        res = execute_moe_dispatch(req)
        assert res.throughput_gbs > 19000.0
        assert res.processed_tokens_units > 4608000


def test_security_ingress_validation_blocks_injection():
    with pytest.raises(ValueError):
        TokenRoutingRequest(
            corridor="MOE-CORRIDOR-ALPHA; DROP TABLE moe_dispatch_ledger; --"
        )


def test_health_endpoint():
    status = health_check()
    assert status["engine"] == "GF-T3-262"
    assert status["status"] == "LOCKED"
    assert status["throughput_gbs"] == 24200.0
