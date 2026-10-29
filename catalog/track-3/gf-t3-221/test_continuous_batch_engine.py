"""
Test Suite: Continuous Batching Iteration-Level Engine
Artifact: GF-T3-221 (Track 3 Production Reference Core)
SPDX-License-Identifier: MIT

Verifies:
1. Zero-delay iteration injection (new requests join next forward pass without pipeline stalls).
2. Slot reclamation (finished requests immediately free batch capacity).
3. Starvation prevention (aging requests preempt lower-priority requests under saturation).
"""

import pytest
import time
from engine import (
    ContinuousBatchEngine,
    SequenceRequest,
    RequestPriority,
    SlotStatus,
    BatchCorridor,
)


def test_zero_delay_iteration_injection():
    """
    Test 1: Zero-delay iteration injection.
    Verify that when free slots exist, new requests join the very next forward pass
    without waiting for any running sequences to finish.
    """
    engine = ContinuousBatchEngine(slot_capacity=32)
    # Start with empty slots
    assert all(s.status == SlotStatus.IDLE for s in engine.slots)

    # Inject 4 requests
    req_ids = engine.inject_batch(4, priority=RequestPriority.STANDARD)
    assert len(engine.pending_queue) == 4

    # Execute 1 step
    step_result = engine.step_forward_pass()
    assert step_result.step_number == 1
    assert step_result.active_slots_count == 4
    assert len(step_result.injected_slots) == 4
    assert len(engine.pending_queue) == 0

    # Inject another 6 requests while the first 4 are running
    new_req_ids = engine.inject_batch(6, priority=RequestPriority.HIGH)
    assert len(engine.pending_queue) == 6

    # Execute next step - new requests must be injected immediately
    step_result_2 = engine.step_forward_pass()
    assert step_result_2.step_number == 2
    assert step_result_2.active_slots_count == 10
    assert len(step_result_2.injected_slots) == 6
    assert len(engine.pending_queue) == 0


def test_slot_reclamation_immediate():
    """
    Test 2: Slot reclamation.
    Verify that finished requests release execution slots immediately, allowing
    new pending requests to take the freed slots on the exact same iteration.
    """
    engine = ContinuousBatchEngine(slot_capacity=4)

    # Inject short request (target 2 tokens) and long request (target 20 tokens)
    req_short = SequenceRequest(
        request_id="req-short-1",
        prompt_tokens=10,
        target_tokens=2,
        base_priority=RequestPriority.STANDARD,
    )
    req_long = SequenceRequest(
        request_id="req-long-1",
        prompt_tokens=10,
        target_tokens=20,
        base_priority=RequestPriority.STANDARD,
    )
    engine.inject_request(req_short)
    engine.inject_request(req_long)

    # Step 1: Both active
    res1 = engine.step_forward_pass()
    assert res1.active_slots_count == 2
    assert req_short.generated_tokens == 1

    # Inject pending request in queue waiting for a slot
    req_pending = SequenceRequest(
        request_id="req-pending-1",
        prompt_tokens=10,
        target_tokens=15,
        base_priority=RequestPriority.HIGH,
    )
    engine.inject_request(req_pending)
    assert len(engine.pending_queue) == 1

    # Step 2: req_short generates its 2nd token and finishes.
    # The freed slot must be reclaimed and given to req_pending immediately!
    res2 = engine.step_forward_pass()
    assert req_short.is_finished is True
    assert req_short.request_id in [r.request_id for r in engine.completed_requests]
    assert len(res2.retired_slots) == 1
    assert "req-pending-1" in [tup[1] for tup in res2.injected_slots]
    assert len(engine.pending_queue) == 0
    assert engine.active_requests.get("req-pending-1") is not None


def test_starvation_prevention_aging_preemption():
    """
    Test 3: Starvation prevention & aging invariant.
    Under heavy slot saturation (32/32 slots full), aging critical requests
    must preempt the lowest dynamic-priority active request.
    """
    engine = ContinuousBatchEngine(slot_capacity=32)

    # Fill all 32 slots with standard priority long requests
    for i in range(32):
        r = SequenceRequest(
            request_id=f"req-fill-{i}",
            prompt_tokens=10,
            target_tokens=500,
            base_priority=RequestPriority.STANDARD,
        )
        engine.inject_request(r)

    engine.step_forward_pass()
    assert sum(1 for s in engine.slots if s.status == SlotStatus.ACTIVE) == 32
    assert len(engine.pending_queue) == 0

    # Inject a CRITICAL priority request with old arrival timestamp to simulate aging starvation
    crit_req = SequenceRequest(
        request_id="req-critical-vip",
        prompt_tokens=10,
        target_tokens=50,
        base_priority=RequestPriority.CRITICAL,
        arrival_timestamp=time.time() - 100.0,  # 100 seconds aging latency
    )
    engine.inject_request(crit_req)
    assert len(engine.pending_queue) == 1

    # Forward pass: aging priority invariant forces preemption of lowest active stream
    res = engine.step_forward_pass()
    assert len(res.preempted_slots) >= 1
    assert "req-critical-vip" in [tup[1] for tup in res.injected_slots]
    assert engine.active_requests.get("req-critical-vip") is not None
    # Preempted request returned safely to pending queue
    assert any("req-fill-" in r.request_id for r in engine.pending_queue)


def test_gpu_bubble_telemetry_reduction():
    """
    Verify that continuous batching exhibits minimal bubble ratio compared to
    static batching baseline.
    """
    engine = ContinuousBatchEngine(slot_capacity=32)
    engine.inject_batch(32, priority=RequestPriority.STANDARD)

    # Run 10 steps
    for _ in range(10):
        res = engine.step_forward_pass()

    assert res.gpu_bubble_ratio_percent < 10.0
    assert res.static_batch_bubble_percent > 30.0
    assert res.scheduler_latency_ms < 5.0
