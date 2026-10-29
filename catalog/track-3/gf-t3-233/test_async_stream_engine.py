"""
Pytest Verification Suite for GF-T3-233 Asynchronous Kernel Stream Concurrency
& Priority Scheduler Engine (>80% coverage across priority preemption,
non-blocking event synchronization, barrier safety, and GridSync sanitization).
"""

import pytest
from pydantic import ValidationError
from engine import (
    AsyncStreamSchedulerEngine,
    BarrierState,
    CorridorSwitchRequest,
    KernelDispatchRequest,
    PriorityLevel,
    STREAM_CORRIDORS,
    compute_deterministic_event_hex,
)


def test_initial_state_invariants() -> None:
    engine = AsyncStreamSchedulerEngine()
    snap = engine.snapshot()
    assert snap["project_title"] == "GF-T3-233"
    assert snap["active_streams_count"] == 16
    assert snap["scheduler_latency_us"] == 0.18
    assert snap["processed_tokens"] == 896000
    assert snap["queue_state_label"] == "Non-Blocking"
    assert (
        snap["inspector_strip_s3"]
        == "S3 · HIGH · ATTN_DECODE · EVT: 0x7F91_E200 · ACTIVE"
    )


def test_priority_scheduling_under_multi_tenant_concurrency() -> None:
    engine = AsyncStreamSchedulerEngine()
    # Stream 7 starts as LOW priority; dispatch a HIGH priority workload to verify preemption
    assert engine.streams[7].priority == PriorityLevel.LOW
    initial_preemptions = engine.streams[7].preemption_count

    req = KernelDispatchRequest(
        stream_id=7,
        priority=PriorityLevel.HIGH,
        kernel_name="ATTN_DECODE",
        token_units=16384,
        kv_block_index=210,
        tenant_id="TENANT-HYPER-01",
    )
    engine.dispatch_kernel(req)

    assert engine.streams[7].priority == PriorityLevel.HIGH
    assert engine.streams[7].active_kernel == "ATTN_DECODE"
    assert engine.streams[7].preemption_count == initial_preemptions + 1


def test_non_blocking_event_flag_synchronization_and_barrier_safety() -> None:
    engine = AsyncStreamSchedulerEngine()
    flag_a = compute_deterministic_event_hex(3, 1, 0)
    flag_b = compute_deterministic_event_hex(3, 1, 0)
    assert flag_a == "0x7F91_E200"
    assert flag_a == flag_b

    # Dispatch two workloads targeting the exact same KV cache block to trigger barrier lock
    req_s0 = KernelDispatchRequest(
        stream_id=0,
        priority=PriorityLevel.HIGH,
        kernel_name="KV_FLASH_SYNC",
        token_units=4096,
        kv_block_index=333,
        tenant_id="TENANT-A",
    )
    req_s1 = KernelDispatchRequest(
        stream_id=1,
        priority=PriorityLevel.HIGH,
        kernel_name="KV_FLASH_SYNC",
        token_units=4096,
        kv_block_index=333,
        tenant_id="TENANT-B",
    )
    engine.dispatch_kernel(req_s0)
    prev_collisions = engine.barrier_collisions_prevented
    engine.dispatch_kernel(req_s1)

    assert engine.streams[1].barrier_state == BarrierState.LOCKED
    assert engine.barrier_collisions_prevented == prev_collisions + 1


def test_preemption_latency_bounds_and_queue_drain_efficiency() -> None:
    engine = AsyncStreamSchedulerEngine()
    snap_burst = engine.inject_burst()
    assert snap_burst["processed_tokens"] > 896000
    assert 0.11 <= float(snap_burst["scheduler_latency_us"]) <= 0.50

    snap_conflict = engine.toggle_preemption_conflict()
    assert snap_conflict["preemption_enabled"] is False
    assert engine.streams[2].barrier_state == BarrierState.FAULT
    assert float(snap_conflict["scheduler_latency_us"]) > float(
        snap_burst["scheduler_latency_us"]
    )

    snap_resolved = engine.toggle_preemption_conflict()
    assert snap_resolved["preemption_enabled"] is True
    assert engine.streams[2].barrier_state == BarrierState.LOCKED

    for _ in range(4):
        stepped = engine.step_cycle()
        assert 0.11 <= float(stepped["scheduler_latency_us"]) <= 2.45

    engine.reset_to_baseline()
    assert engine.scheduler_latency_us == 0.18
    assert engine.processed_tokens == 896000


def test_gridsync_zero_trust_sanitization_gate() -> None:
    with pytest.raises(ValidationError):
        KernelDispatchRequest(
            stream_id=3,
            priority=PriorityLevel.HIGH,
            kernel_name="ATTN; DROP TABLE lanes;--",
            token_units=4096,
            kv_block_index=10,
            tenant_id="TENANT-01",
        )

    with pytest.raises(ValidationError):
        CorridorSwitchRequest(corridor="UNVERIFIED-PROPRIETARY-CORRIDOR")

    valid_corridor = CorridorSwitchRequest(corridor=STREAM_CORRIDORS[2])
    assert valid_corridor.corridor == STREAM_CORRIDORS[2]
