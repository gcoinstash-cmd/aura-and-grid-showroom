"""
GF-T3-229: Pytest Verification Suite (>80% coverage)
Verifies:
1. Exact 1F1B schedule execution order (warmup -> 1F1B steady state -> cooldown).
2. Activation memory bound strictly never exceeds stage count p.
3. Numerical equivalence of accumulated gradients relative to serial monolithic backward pass.
4. Zero-Trust GridSync ingress validation and FastAPI endpoints.
License: MIT
"""

import pytest
from engine import (
    CommandIngressPayload,
    CorridorId,
    SlotPhase,
    build_1f1b_schedule,
    compute_schedule_endpoint,
    compute_stash_pointer,
    generate_stage_1f1b_sequence,
    health_check,
    verify_gradient_equivalence_1f1b_vs_serial,
    verify_gradients_endpoint,
)


def test_1f1b_schedule_execution_order_warmup_steady_cooldown() -> None:
    """
    1. Verifies exact 1F1B schedule execution order:
       Warmup Forward passes -> Steady-State alternating 1F-1B cycles -> Cooldown Backward passes.
    """
    num_stages = 4
    num_micro_batches = 16

    for stage_id in range(num_stages):
        seq = generate_stage_1f1b_sequence(stage_id, num_stages, num_micro_batches)
        expected_warmup = num_stages - stage_id - 1

        # Total operations per stage must be 2 * m = 32 (16 F + 16 B)
        assert len(seq) == 2 * num_micro_batches

        # 1. Warmup Phase: strictly `expected_warmup` Forward passes (F0 .. F_{w-1})
        warmup_ops = seq[:expected_warmup]
        for idx, (op_type, mb_id, phase, _stashed) in enumerate(warmup_ops):
            assert op_type == "F"
            assert mb_id == idx
            assert phase == SlotPhase.WARMUP_FORWARD

        # 2. Steady-State 1F1B Phase: alternating [F, B, F, B, ...]
        steady_pairs_count = num_micro_batches - expected_warmup
        steady_ops = seq[expected_warmup : expected_warmup + (2 * steady_pairs_count)]
        for pair_idx in range(steady_pairs_count):
            f_op, f_mb, f_phase, _ = steady_ops[2 * pair_idx]
            b_op, b_mb, b_phase, _ = steady_ops[2 * pair_idx + 1]
            assert f_op == "F"
            assert f_mb == expected_warmup + pair_idx
            assert f_phase == SlotPhase.STEADY_FORWARD
            assert b_op == "B"
            assert b_mb == pair_idx
            assert b_phase == SlotPhase.STEADY_BACKWARD

        # 3. Cooldown Phase: strictly `expected_warmup` Backward passes draining remaining stash
        cooldown_ops = seq[expected_warmup + (2 * steady_pairs_count) :]
        assert len(cooldown_ops) == expected_warmup
        for idx, (op_type, mb_id, phase, _stashed) in enumerate(cooldown_ops):
            assert op_type == "B"
            assert mb_id == steady_pairs_count + idx
            assert phase == SlotPhase.COOLDOWN_BACKWARD


def test_activation_memory_bound_never_exceeds_stage_count_p() -> None:
    """
    2. Verifies activation memory bound strictly never exceeds stage count p (p=4)
       even when micro-batch count m=16 or m=32.
    """
    num_stages = 4
    for num_micro_batches in (16, 32):
        snapshot = build_1f1b_schedule(
            num_stages=num_stages,
            num_micro_batches=num_micro_batches,
            corridor=CorridorId.ALPHA,
            straggler_active=False,
        )
        assert snapshot.memory_cap_activations == num_stages

        for stage_id, slots in snapshot.schedule_grid.items():
            max_stage_stash = max(slot.active_stash_count for slot in slots)
            assert max_stage_stash <= num_stages
            assert max_stage_stash == (num_stages - stage_id)

        for stash_state in snapshot.stage_stashes:
            assert stash_state.active_slots <= num_stages
            assert stash_state.max_capacity == num_stages


def test_numerical_equivalence_of_accumulated_gradients_vs_serial() -> None:
    """
    3. Verifies numerical equivalence of accumulated gradients in 1F1B pipeline execution
       relative to a serial monolithic backward pass across all 4 stages and 16 micro-batches.
    """
    result = verify_gradient_equivalence_1f1b_vs_serial(
        num_stages=4,
        num_micro_batches=16,
    )
    assert result["numerically_equivalent"] is True
    assert result["max_abs_diff"] < 1e-12
    assert result["max_observed_stash"] == 4

    serial_w = result["serial_grad_w"]
    pipe_w = result["pipe_grad_w"]
    serial_b = result["serial_grad_b"]
    pipe_b = result["pipe_grad_b"]

    for s in range(4):
        assert pytest.approx(serial_w[s], abs=1e-12) == pipe_w[s]
        assert pytest.approx(serial_b[s], abs=1e-12) == pipe_b[s]


def test_corridors_straggler_and_stash_pointer_addressing() -> None:
    """
    Verifies Stage 1 F4 stash pointer (0x7FA200), corridor telemetry calculation,
    and Zero-Trust payload validation.
    """
    assert compute_stash_pointer(1, 4) == "0x7FA200"
    assert compute_stash_pointer(0, None) == "0x000000"

    alpha = build_1f1b_schedule(4, 16, CorridorId.ALPHA, False)
    assert alpha.aggregate_tflops == 1420
    assert alpha.bubble_ratio_pct == 8.4
    assert alpha.p2p_latency_ms == 0.22
    assert alpha.sustained_tokens == 448000

    straggler = build_1f1b_schedule(4, 16, CorridorId.ALPHA, True)
    assert straggler.p2p_latency_ms == 0.44
    assert straggler.bubble_ratio_pct > alpha.bubble_ratio_pct
    assert straggler.stage_stashes[2].is_straggler is True

    for corridor in (CorridorId.BRAVO, CorridorId.GAMMA, CorridorId.DELTA):
        snap = build_1f1b_schedule(4, 16, corridor, False)
        assert snap.num_stages == 4
        assert snap.num_micro_batches == 16

    assert health_check()["engine_id"] == "GF-T3-229"
    assert verify_gradients_endpoint()["numerically_equivalent"] is True

    valid_payload = CommandIngressPayload(
        corridor=CorridorId.ALPHA,
        num_stages=4,
        num_micro_batches=16,
        straggler_active=False,
        step_cursor=12,
        operator_note="STEADY_1F1B_LOCKED",
    )
    endpoint_res = compute_schedule_endpoint(valid_payload)
    assert endpoint_res.aggregate_tflops == 1420

    with pytest.raises(ValueError):
        CommandIngressPayload(operator_note="DROP TABLE gf_t3_229_corridors;--")
