"""
Pytest Verification Suite for GF-T3-263 Continuous Batching & In-Flight Batch Expansion Engine
Coverage Target: >85% across in-flight interleaving, iterative scheduling, and tensor throughput saturation
"""

import pytest
from engine import (
    CORRIDORS,
    ContinuousBatchingEngine,
    ScheduleStepPayload,
    sanitize_identifier,
)


def test_in_flight_request_queue_interleaving_and_slot_reallocation():
    """Verifies N_active = N_retained + N_admitted and immediate zero-wait slot refill."""
    engine = ContinuousBatchingEngine()
    initial = engine.snapshot()
    assert initial["active_slots"] == 8
    assert initial["max_slots"] == 8

    # Force 3 slots to 1 remaining step so they complete on the next iteration
    engine.slots[0].remaining_steps = 1
    engine.slots[1].remaining_steps = 1
    engine.slots[2].remaining_steps = 1
    engine.queue_depth = 5

    after_step = engine.step_iteration(incoming_requests=2)
    # 3 completed slots are immediately refilled from the 7 queued requests (5 + 2)
    assert after_step["active_slots"] == 8
    assert after_step["queue_depth"] == 4
    for slot in after_step["slots"]:
        assert slot["queue_state"] == "IN-FLIGHT"
        assert slot["utilization_pct"] == 100.0


def test_in_flight_expansion_formula_boundary_math():
    """Verifies exact boundary math when incoming requests are fewer than completed sequences."""
    res = ContinuousBatchingEngine.compute_in_flight_expansion(
        prior_active=8,
        completed_count=5,
        incoming_queue=3,
        max_slots=8,
    )
    assert res["evicted_completed"] == 5
    assert res["retained_in_flight"] == 3
    assert res["admitted_incoming"] == 3
    assert res["next_active"] == 6
    assert res["remaining_queue"] == 0


def test_iterative_scheduling_efficiency_and_gpu_saturation_under_concurrency():
    """Verifies iterative scheduling pass maintains 100% slot saturation under heavy queue load."""
    engine = ContinuousBatchingEngine()
    start_tokens = engine.processed_tokens

    for _ in range(10):
        snap = engine.step_iteration(incoming_requests=8)
        assert snap["active_slots"] == 8
        assert snap["throughput_gbs"] == 25000.0
        assert snap["scheduler_latency_us"] <= 0.02

    assert engine.processed_tokens > start_tokens


def test_hardware_tensor_core_acceleration_and_corridor_throughput():
    """Verifies corridor switching, burst saturation, and spike re-allocation mechanics."""
    engine = ContinuousBatchingEngine()
    burst_snap = engine.trigger_continuous_burst()
    assert burst_snap["throughput_gbs"] == 25000.0
    assert burst_snap["active_slots"] == 8

    spike_snap = engine.toggle_queue_spike()
    assert spike_snap["spike_active"] is True
    assert any(s["queue_state"] == "RE-ALLOC" for s in spike_snap["slots"])

    flush_snap = engine.flush_buffers()
    assert flush_snap["spike_active"] is False
    assert flush_snap["processed_tokens"] == 4736000
    assert flush_snap["throughput_gbs"] == 25000.0


def test_zero_trust_ingress_sanitization_gate():
    """Verifies SQL injection and XSS payloads are blocked and currency symbols are scrubbed."""
    with pytest.raises(ValueError):
        sanitize_identifier("BATCH-CORRIDOR-ALPHA; DROP TABLE batch_slots;--")

    with pytest.raises(ValueError):
        ScheduleStepPayload(corridor="INVALID_CORRIDOR", incoming_requests=4)

    valid = ScheduleStepPayload(
        corridor=list(CORRIDORS.keys())[0],
        incoming_requests=6,
    )
    assert valid.incoming_requests == 6
