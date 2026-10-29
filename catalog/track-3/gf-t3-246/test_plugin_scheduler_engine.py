"""
GF-T3-246 · Automated Pytest Verification Suite (>80% Coverage Gate)
SPDX-License-Identifier: MIT
Verifies:
1. Continuous batching queue throughput and sequence slot re-indexing correctness.
2. Custom CUDA kernel launch latency under peak concurrent request load.
3. Memory bandwidth saturation and execution bubble elimination.
4. Strict Zero-Dollar Gate enforcement across all engine states and JSON payloads.
"""

import json
from dataclasses import asdict
from engine import (
    InFlightPluginSchedulerEngine,
    SYNTHETIC_CORRIDORS,
    compute_inflight_throughput_gbs,
    compute_kernel_launch_latency_us,
    compute_slot_reindexing_efficiency,
)


def test_initial_cockpit_canonical_telemetry() -> None:
    engine = InFlightPluginSchedulerEngine()
    telemetry = engine.get_telemetry()

    assert telemetry.workspace_title == "GF-T3-246"
    assert telemetry.scheduler_throughput_gbs == 9800.0
    assert telemetry.kernel_launch_latency_us == 0.01
    assert telemetry.active_slots_count == 32
    assert telemetry.total_slots_capacity == 32
    assert telemetry.processed_tokens_units == 2560000
    assert telemetry.plugin_xp_delta_k == 42.0
    assert telemetry.mesh_pointer_hex == "0x9F8DC0"
    assert telemetry.kernel_identifier == "FUSED_ATTN"
    assert telemetry.execution_latency_us == 0.82
    assert telemetry.attention_vector == [0.99, 0.97, 0.98, 0.96]
    assert len(telemetry.slots) == 8
    assert telemetry.slots[0].slot_code == "S0"
    assert telemetry.slots[0].hex_pointer == "0xA000"
    assert telemetry.slots[0].sequence_id == 512
    assert telemetry.slots[0].current_tokens == 128
    assert telemetry.slots[0].max_tokens == 2048
    assert telemetry.slots[0].efficiency_pct == 99.9
    assert telemetry.slots[0].lock_status == "LOCKED"


def test_inflight_continuous_batching_and_slot_reindexing() -> None:
    engine = InFlightPluginSchedulerEngine()
    # Force Slot 0 near completion so next burst reclaims and re-indexes the slot in-flight
    engine.slots[0].current_tokens = 2000
    before_tokens = engine.processed_tokens_units

    telemetry = engine.trigger_inflight_burst(new_sequences=8, burst_tokens=64000)

    assert telemetry.processed_tokens_units == before_tokens + 64000
    assert telemetry.slots[0].state == "REINDEXED"
    assert telemetry.slots[0].current_tokens == 128
    assert telemetry.slots[0].sequence_id > 512
    assert telemetry.active_slots_count == 32
    assert telemetry.bubble_elimination_ratio_pct == 99.9


def test_custom_cuda_kernel_launch_latency_under_peak_load() -> None:
    nominal_latency = compute_kernel_launch_latency_us(
        base_latency_us=0.01,
        active_slots=32,
        queue_depth=0,
        saturation_spike=False,
    )
    assert nominal_latency == 0.01

    saturated_latency = compute_kernel_launch_latency_us(
        base_latency_us=0.01,
        active_slots=32,
        queue_depth=14,
        saturation_spike=True,
    )
    assert saturated_latency > nominal_latency
    assert saturated_latency < 0.25  # Sub-microsecond bound preserved


def test_memory_bandwidth_saturation_and_bubble_elimination() -> None:
    engine = InFlightPluginSchedulerEngine()
    # Inject slot saturation spike
    saturated = engine.toggle_slot_saturation(force_state=True)
    assert saturated.saturation_fault_active is True
    assert saturated.queue_depth == 14
    assert saturated.scheduler_throughput_gbs < 9800.0
    assert saturated.slots[2].lock_status == "FAULT"
    assert saturated.slots[5].lock_status == "FAULT"

    # Step execution pass 4 times to drain queue_depth from 14 to 0
    for _ in range(4):
        stepped = engine.step_plugin_execution_pass()

    assert stepped.queue_depth == 0
    assert stepped.saturation_fault_active is False
    assert stepped.scheduler_throughput_gbs == 9800.0
    assert stepped.slots[2].lock_status == "LOCKED"


def test_corridor_switching_and_flush_recovery() -> None:
    engine = InFlightPluginSchedulerEngine()
    for corridor_key in SYNTHETIC_CORRIDORS:
        state = engine.set_corridor(corridor_key)
        assert state.corridor_name == corridor_key
        assert state.scheduler_throughput_gbs > 5000.0

    flushed = engine.flush_scheduler_queues()
    assert flushed.scheduler_throughput_gbs == 9800.0
    assert flushed.processed_tokens_units == 2560000
    assert flushed.queue_depth == 0
    assert flushed.saturation_fault_active is False


def test_edge_cases_and_zero_dollar_gate() -> None:
    assert compute_inflight_throughput_gbs(9800.0, 0, 32, 0) == 0.0
    assert compute_slot_reindexing_efficiency(128, 0, 0) == 0.0

    engine = InFlightPluginSchedulerEngine()
    payload_str = json.dumps(asdict(engine.get_telemetry()))
    # Verify ASCII 36 (dollar character) is 100% absent
    assert chr(36) not in payload_str
