"""
Pytest Verification Suite for GF-T3-271
Verifies:
1. Dynamic capacity-factor token routing and auxiliary loss minimization correctness.
2. Non-blocking All-to-All dispatch efficiency and zero hot-spot imbalances under heavy load.
3. Hardware tensor core acceleration and throughput saturation.
4. Zero-Dollar Gate enforcement across telemetry payloads.
"""

import json
import pytest
from engine import (
    CORRIDOR_PROFILES,
    DispatchRequest,
    compute_auxiliary_load_balance_loss,
    execute_asynchronous_expert_dispatch,
    health_check,
    rebalance_logits_with_auxiliary_gradient,
    softmax_probabilities,
)


def test_health_endpoint_contract() -> None:
    res = health_check()
    assert res["project_title"] == "GF-T3-271"
    assert res["status"] == "LOCKED"
    assert chr(36) not in json.dumps(res)


def test_dynamic_capacity_factor_routing_and_auxiliary_loss_minimization() -> None:
    skewed_logits = [3.5, 0.2, 0.1, 2.8, 0.4, 0.3, 1.9, 0.1]
    raw_probs = softmax_probabilities(skewed_logits)
    raw_loss = compute_auxiliary_load_balance_loss(raw_probs, raw_probs)

    balanced_logits = rebalance_logits_with_auxiliary_gradient(
        skewed_logits, aux_loss_coeff=0.02, damping_passes=12
    )
    balanced_probs = softmax_probabilities(balanced_logits)
    balanced_loss = compute_auxiliary_load_balance_loss(balanced_probs, balanced_probs)

    assert balanced_loss < raw_loss
    assert abs(balanced_loss - 1.0) < 0.01
    for prob in balanced_probs:
        assert abs(prob - 0.125) < 0.015


def test_non_blocking_all_to_all_dispatch_zero_drops() -> None:
    req = DispatchRequest(
        corridor="EXPERT-CORRIDOR-ALPHA (ASYNC-EXPERT-PARALLELISM-ROUTING-FABRIC · 31200-GB/S)",
        total_tokens=2048000,
        num_experts=8,
        top_k=2,
        capacity_factor=1.25,
        raw_logits=[1.0] * 8,
        congestion_spike=False,
        burst_active=False,
    )
    telemetry = execute_asynchronous_expert_dispatch(req)
    assert telemetry.project_title == "GF-T3-271"
    assert telemetry.dropped_tokens == 0
    assert telemetry.active_experts == 8
    assert sum(e.routed_tokens for e in telemetry.experts) == 2048000
    assert telemetry.processed_tokens == 6144000
    for expert in telemetry.experts:
        assert expert.routed_tokens == 256000
        assert expert.load_percentage == 12.5
        assert expert.status == "BALANCED · LOCKED"


def test_congestion_spike_overflow_redistribution() -> None:
    req = DispatchRequest(
        corridor="EXPERT-CORRIDOR-BRAVO (DYNAMIC-LOAD-BALANCING-DISPATCH-ENGINE)",
        total_tokens=2048000,
        num_experts=8,
        capacity_factor=1.15,
        raw_logits=[1.0] * 8,
        congestion_spike=True,
        burst_active=False,
    )
    telemetry = execute_asynchronous_expert_dispatch(req)
    assert telemetry.dropped_tokens == 0
    assert sum(e.routed_tokens for e in telemetry.experts) == 2048000
    assert telemetry.moe_state == "Congestion Re-Balancing"


def test_hardware_tensor_core_throughput_saturation() -> None:
    for corridor_name, profile in CORRIDOR_PROFILES.items():
        req = DispatchRequest(
            corridor=corridor_name,
            total_tokens=4096000,
            burst_active=True,
        )
        telemetry = execute_asynchronous_expert_dispatch(req)
        assert telemetry.routing_throughput_gbps > profile["base_bandwidth_gbps"]
        assert telemetry.all_to_all_efficiency_pct >= 80.0
        payload_str = telemetry.model_dump_json()
        assert chr(36) not in payload_str


def test_zero_dollar_gate_validation_rejection() -> None:
    with pytest.raises(ValueError):
        DispatchRequest(corridor="INVALID-CORRIDOR-" + chr(36))
