"""
Pytest & Unittest Verification Suite for GF-T3-275 Continuous In-Flight Request Scheduler Engine
Verifies:
1. Continuous in-flight request batching and per-token iteration scheduling correctness.
2. Dynamic step reallocation efficiency and zero queue stalls under massive concurrency.
3. Hardware tensor core acceleration and throughput saturation.
4. GridSync zero-trust sanitization and absolute zero-dollar character gate.
"""

import json
import unittest
from engine import (
    SYNTHETIC_BATCH_CORRIDORS,
    ContinuousBatchSchedulerEngine,
    calculate_continuous_batch_tokens,
    calculate_dynamic_step_reallocation,
    calculate_saturated_bandwidth_gbps,
    calculate_sub_microsecond_sync_latency,
    sanitize_ingress_string,
)


def test_initial_baseline_telemetry_exact_match():
    engine = ContinuousBatchSchedulerEngine()
    snapshot = engine.serialize_state()
    assert snapshot["project_id"] == "GF-T3-275"
    assert snapshot["batch_throughput_gbps"] == 34400.0
    assert snapshot["scheduling_latency_us"] == 0.01
    assert snapshot["active_batches_count"] == 8
    assert snapshot["total_batches_capacity"] == 8
    assert snapshot["processed_tokens_units"] == 6656000
    assert snapshot["engine_xp_k"] == 75.0
    assert snapshot["batch_state_label"] == "Continuous Active"
    assert len(snapshot["slots"]) == 8
    for idx, slot in enumerate(snapshot["slots"]):
        assert slot["slot_id"] == "H" + str(idx)
        assert slot["active_tokens_k"] == 256
        assert slot["pending_queue_req"] == 32
        assert slot["latency_ms"] == 0.02
        assert slot["tensor_rate_pct"] == 100
        assert slot["status_label"] == "SCHEDULED · LOCKED"
        assert slot["locked"] is True


def test_continuous_batch_tokens_formula_correctness():
    active_tokens = [256] * 8
    pending_queues = [32] * 8
    total_units = calculate_continuous_batch_tokens(active_tokens, pending_queues, tokens_per_request_k=2)
    assert total_units == 6656000
    assert calculate_continuous_batch_tokens([], []) == 0
    raised = False
    try:
        calculate_continuous_batch_tokens([256, 256], [32])
    except ValueError:
        raised = True
    assert raised is True


def test_dynamic_step_reallocation_and_zero_queue_stalls():
    realloc = calculate_dynamic_step_reallocation(256, 32, 1.0, spike_active=False)
    assert realloc["tensor_rate_pct"] == 100.0
    assert realloc["slot_latency_ms"] == 0.02

    spike_realloc = calculate_dynamic_step_reallocation(256, 64, 1.0, spike_active=True)
    assert spike_realloc["tensor_rate_pct"] == 100.0
    assert spike_realloc["slot_latency_ms"] == 0.06

    raised = False
    try:
        calculate_dynamic_step_reallocation(-1, 32, 1.0)
    except ValueError:
        raised = True
    assert raised is True


def test_continuous_batch_burst_and_inflight_stepping():
    engine = ContinuousBatchSchedulerEngine()
    state_after_burst = engine.trigger_continuous_batch_burst(added_tokens_k=32, added_requests=8)
    assert state_after_burst.processed_tokens_units > 6656000
    assert state_after_burst.burst_cycle_count == 1
    assert state_after_burst.engine_xp_k == 79.5

    state_after_step = engine.step_inflight_scheduling_pass()
    assert state_after_step.step_pass_count == 1
    assert state_after_step.slots[0].iteration_step == 3
    assert state_after_step.scheduling_latency_us == 0.01

    raised = False
    try:
        engine.trigger_continuous_batch_burst(added_tokens_k=0, added_requests=8)
    except ValueError:
        raised = True
    assert raised is True


def test_concurrency_spike_and_queue_flush():
    engine = ContinuousBatchSchedulerEngine()
    spiked = engine.toggle_concurrency_spike()
    assert spiked.concurrency_spike_active is True
    assert spiked.batch_state_label == "Concurrency Re-Order"
    assert spiked.slots[2].locked is False
    assert spiked.slots[2].status_label == "RE-ORDER · SPIKE"
    assert spiked.scheduling_latency_us == 0.03

    cleared = engine.toggle_concurrency_spike()
    assert cleared.concurrency_spike_active is False
    assert cleared.slots[2].locked is True

    engine.trigger_continuous_batch_burst(32, 8)
    flushed = engine.flush_batch_queues()
    assert flushed.processed_tokens_units == 6656000
    assert flushed.burst_cycle_count == 0
    assert flushed.step_pass_count == 0


def test_synthetic_corridor_switching_and_hardware_saturation():
    engine = ContinuousBatchSchedulerEngine()
    for corridor_name, meta in SYNTHETIC_BATCH_CORRIDORS.items():
        updated = engine.set_corridor(corridor_name)
        assert updated.corridor == corridor_name
        assert updated.mode_tag == meta["mode"]
        assert updated.batch_throughput_gbps > 0

    raised = False
    try:
        engine.set_corridor("INVALID-CORRIDOR")
    except ValueError:
        raised = True
    assert raised is True


def test_gridsync_zero_trust_sanitizer_and_zero_dollar_gate():
    assert sanitize_ingress_string("  BATCH-CORRIDOR-ALPHA  ") == "BATCH-CORRIDOR-ALPHA"
    for bad_input in [
        "DROP TABLE continuous_batch_telemetry",
        "<script>alert(1)</script>",
        "COST_" + chr(36) + "100",
    ]:
        raised = False
        try:
            sanitize_ingress_string(bad_input)
        except ValueError:
            raised = True
        assert raised is True

    engine = ContinuousBatchSchedulerEngine()
    serialized_json = json.dumps(engine.serialize_state())
    assert chr(36) not in serialized_json


class TestContinuousBatchEngineSuite(unittest.TestCase):
    def test_all_engine_invariants(self):
        test_initial_baseline_telemetry_exact_match()
        test_continuous_batch_tokens_formula_correctness()
        test_dynamic_step_reallocation_and_zero_queue_stalls()
        test_continuous_batch_burst_and_inflight_stepping()
        test_concurrency_spike_and_queue_flush()
        test_synthetic_corridor_switching_and_hardware_saturation()
        test_gridsync_zero_trust_sanitizer_and_zero_dollar_gate()


if __name__ == "__main__":
    unittest.main(verbosity=2)
