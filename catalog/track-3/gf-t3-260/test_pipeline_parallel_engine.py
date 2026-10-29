"""
Pytest verification suite for GF-T3-260 Non-Uniform 1F1B Pipeline Parallelism Engine.
Verifies:
1. Non-uniform 1F1B micro-batch scheduling correctness and zero pipeline bubble enforcement.
2. Interleaved stage memory balancing and peer-to-peer activation transfer without latency stalls.
3. Hardware interconnect acceleration and throughput saturation across synthetic corridors.
"""

import pytest
from engine import (
    CORRIDOR_PROFILES,
    FaultInjectionRequest,
    PipelineConfigRequest,
    api_evaluate_pipeline,
    api_inject_fault,
    build_non_uniform_1f1b_schedule,
    compute_stage_memory_footprint_mb,
    compute_theoretical_bubble_ratio,
    evaluate_pipeline_state,
    health_check,
)


def test_health_check_contract():
    res = health_check()
    assert res["engine"] == "GF-T3-260"
    assert res["status"] == "LOCKED"
    assert res["pipeline_state"] == "1F1B Active"


def test_zero_bubble_1f1b_scheduling_correctness():
    bubble_zero = compute_theoretical_bubble_ratio(
        num_stages=8,
        num_microbatches=32,
        interleaving_degree=2,
        zero_bubble_enabled=True,
        imbalance_factor=0.0,
    )
    assert bubble_zero == 0.0

    # Verify non-zero bubble when zero-bubble splitting is disabled
    standard_1f1b_bubble = compute_theoretical_bubble_ratio(
        num_stages=8,
        num_microbatches=32,
        interleaving_degree=1,
        zero_bubble_enabled=False,
        imbalance_factor=0.0,
    )
    expected_bound = round(((8 - 1) / (8 * 32 * 1)) * 100.0, 2)
    assert standard_1f1b_bubble == expected_bound
    assert standard_1f1b_bubble > 0.0


def test_non_uniform_schedule_phases_and_warmup_invariants():
    schedule = build_non_uniform_1f1b_schedule(
        num_stages=8,
        num_microbatches=16,
        interleaving_degree=2,
        zero_bubble_enabled=True,
    )
    assert len(schedule) > 80
    stage_0_slots = [s for s in schedule if s.stage_id == 0]
    stage_7_slots = [s for s in schedule if s.stage_id == 7]

    # Stage 0 must start with 7 warm-up forward passes (p - 0 - 1 = 7)
    warmup_f_stage_0 = [s for s in stage_0_slots[:7] if s.phase == "F"]
    assert len(warmup_f_stage_0) == 7

    # Last stage P7 has 0 warmup forward-only passes and enters 1F1B steady state immediately
    assert stage_7_slots[0].phase == "1F1B"

    # Verify B_W weight gradient split phases are scheduled under zero-bubble mode
    bw_slots = [s for s in schedule if s.phase == "B_W"]
    assert len(bw_slots) > 0


def test_interleaved_stage_memory_balancing_and_p2p_transfer():
    # Stage 0 holds 8 in-flight microbatches, Stage 7 holds 1 in-flight microbatch
    mem_p0 = compute_stage_memory_footprint_mb(
        stage_id=0,
        num_stages=8,
        interleaving_degree=2,
        hidden_dim=8192,
        seq_length=4096,
    )
    mem_p7 = compute_stage_memory_footprint_mb(
        stage_id=7,
        num_stages=8,
        interleaving_degree=2,
        hidden_dim=8192,
        seq_length=4096,
    )
    assert mem_p0 > mem_p7
    assert round(mem_p0 / mem_p7, 2) == 8.0

    # Verify P2P activation transfer latency remains sub-millisecond across all 8 stages
    req = PipelineConfigRequest()
    state = evaluate_pipeline_state(req)
    stages = state["stages"]
    assert len(stages) == 8
    for idx, stage in enumerate(stages):
        assert stage["stage_id"] == idx
        assert stage["transfer_ms"] <= 0.05
        assert stage["state_label"] == "BALANCED · LOCKED"
        assert stage["bubble_pct"] == 0.0


def test_hardware_interconnect_saturation_across_all_corridors():
    for corridor_key in CORRIDOR_PROFILES:
        req = PipelineConfigRequest(
            corridor=corridor_key,
            num_stages=8,
            num_microbatches=32,
            zero_bubble_enabled=True,
            imbalance_injected=False,
        )
        result = api_evaluate_pipeline(req)
        assert result["engine_id"] == "GF-T3-260"
        assert result["throughput_gbs"] >= 16800.0
        assert result["bubble_latency_us"] == 0.01
        assert result["bubble_pct"] == 0.0


def test_imbalance_injection_and_auto_rebalance_recovery():
    fault_warn = api_inject_fault(
        FaultInjectionRequest(stage_id=3, imbalance_factor=0.22, auto_rebalance=False)
    )
    assert fault_warn["status"] == "REBALANCE · WARN"
    assert fault_warn["resulting_bubble_pct"] > 0.0

    fault_recovered = api_inject_fault(
        FaultInjectionRequest(stage_id=3, imbalance_factor=0.22, auto_rebalance=True)
    )
    assert fault_recovered["status"] == "BALANCED · LOCKED"
    assert fault_recovered["resulting_bubble_pct"] == 0.0


def test_invalid_corridor_rejected():
    with pytest.raises(ValueError):
        PipelineConfigRequest(corridor="INVALID-CORRIDOR")
