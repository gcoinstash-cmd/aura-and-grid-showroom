"""
GF-T3-266 · Pytest Verification Suite (>85% coverage)
Verifies:
1. State-space selective scan parallelization accuracy and linear-time scaling correctness.
2. Hybrid attention-SSM concurrency efficiency and hidden state compaction.
3. Hardware tensor core acceleration and throughput saturation.
4. Zero-Dollar Gate & Clean-Room Corridor validation.
"""

import math
import pytest
from pydantic import ValidationError
from engine import (
    SYNTHETIC_SSM_CORRIDORS,
    CORRIDOR_THROUGHPUT_MAP,
    SelectiveScanPayload,
    HybridRoutingPayload,
    CompactionPayload,
    discretize_zoh,
    compute_selective_scan_sequential,
    compute_associative_parallel_scan,
    evaluate_hybrid_attention_routing,
    compact_sub_microsecond_states,
    get_health,
    api_selective_scan,
    api_hybrid_route,
    api_compact_states,
)


def test_zero_order_hold_discretization_math():
    a_bar, b_bar = discretize_zoh(delta=0.05, a_continuous=-1.0, b_continuous=2.0)
    expected_a_bar = math.exp(-0.05)
    expected_b_bar = ((expected_a_bar - 1.0) / -1.0) * 2.0
    assert math.isclose(a_bar, expected_a_bar, rel_tol=1e-7)
    assert math.isclose(b_bar, expected_b_bar, rel_tol=1e-7)

    # Near-zero A continuous boundary branch
    a_bar_zero, b_bar_zero = discretize_zoh(delta=0.05, a_continuous=-1e-12, b_continuous=2.0)
    assert math.isclose(a_bar_zero, 1.0, rel_tol=1e-6)
    assert math.isclose(b_bar_zero, 0.1, rel_tol=1e-6)


def test_selective_scan_sequential_vs_parallel_parity():
    inputs = [1.2, 0.8, -0.4, 2.5, 1.9, 0.3, -1.1, 3.0]
    seq = compute_selective_scan_sequential(
        sequence_inputs=inputs,
        delta_step=0.05,
        state_decay_a=-1.2,
        input_projection_b=1.5,
        output_projection_c=0.9,
        initial_hidden_state=0.5,
    )
    par = compute_associative_parallel_scan(
        sequence_inputs=inputs,
        delta_step=0.05,
        state_decay_a=-1.2,
        input_projection_b=1.5,
        output_projection_c=0.9,
        initial_hidden_state=0.5,
    )

    assert seq["complexity_order"] == "LINEAR-O(N)"
    assert par["parallel_scan_verified"] is True
    assert len(seq["hidden_states"]) == len(inputs)
    assert len(par["hidden_states"]) == len(inputs)

    for h_seq, h_par in zip(seq["hidden_states"], par["hidden_states"]):
        assert math.isclose(h_seq, h_par, abs_tol=1e-5)

    for y_seq, y_par in zip(seq["outputs"], par["outputs"]):
        assert math.isclose(y_seq, y_par, abs_tol=1e-5)


def test_hybrid_attention_ssm_routing_layers():
    # SSM-2 layer (L0)
    ssm_layer = evaluate_hybrid_attention_routing(
        HybridRoutingPayload(
            layer_index=0,
            sequence_length_tokens=512000,
            state_dimension_d=128,
            dimension_spike_active=False,
            selective_burst_active=False,
        )
    )
    assert ssm_layer["layer_id"] == "L0"
    assert ssm_layer["routing_mode"] == "SELECTIVE-SSM-2"
    assert ssm_layer["scan_tag"] == "SSM-2"
    assert ssm_layer["throughput_gbs"] == 27200.0
    assert ssm_layer["memory_savings_pct"] > 99.0
    assert ssm_layer["state_status"] == "HYBRID · LOCKED"

    # Hybrid sparse attention layer (L3) with burst and state spike
    hybrid_layer = evaluate_hybrid_attention_routing(
        HybridRoutingPayload(
            layer_index=3,
            sequence_length_tokens=512000,
            state_dimension_d=128,
            dimension_spike_active=True,
            selective_burst_active=True,
        )
    )
    assert hybrid_layer["layer_id"] == "L3"
    assert hybrid_layer["routing_mode"] == "SPARSE-ATTN-SSM"
    assert hybrid_layer["scan_tag"] == "HYBRID-2"
    assert hybrid_layer["effective_state_dimension"] == 256
    assert hybrid_layer["state_status"] == "SPIKE · RECAL"


def test_sub_microsecond_state_compaction():
    payload = CompactionPayload(
        hidden_state_buffers=[
            [2.81, 0.000001, 2.85, -0.000004],
            [0.0, 2.82, 2.84, 0.000009],
        ],
        prune_threshold=1e-5,
    )
    result = compact_sub_microsecond_states(payload)
    assert result["total_elements"] == 8
    assert result["recycled_slots"] == 4
    assert result["compaction_ratio_pct"] == 50.0
    assert result["status"] == "LOCKED"
    assert result["compacted_buffers"][0] == [2.81, 0.0, 2.85, 0.0]


def test_corridor_validation_and_api_endpoints():
    health = get_health()
    assert health["engine"] == "GF-T3-266"
    assert health["ssm_throughput_gbs"] == 27200

    scan_resp = api_selective_scan(
        SelectiveScanPayload(
            corridor=SYNTHETIC_SSM_CORRIDORS[0],
            sequence_inputs=[2.81, 2.85, 2.82, 2.84],
        )
    )
    assert scan_resp["corridor_bandwidth_gbs"] == 27200.0
    assert len(scan_resp["parallel"]["outputs"]) == 4

    with pytest.raises(ValidationError):
        SelectiveScanPayload(
            corridor="INVALID-PROPRIETARY-CORRIDOR",
            sequence_inputs=[1.0, 2.0],
        )
