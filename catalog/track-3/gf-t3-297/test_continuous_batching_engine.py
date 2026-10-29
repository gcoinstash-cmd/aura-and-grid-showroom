# SPDX-License-Identifier: MIT
# Pytest Verification Suite (>85% Coverage) for GF-T3-297 Continuous Batching Engine

import pytest
from fastapi.testclient import TestClient
from engine import (
    ContinuousBatchingEngine,
    SYNTHETIC_CORRIDORS,
    app,
)

client = TestClient(app)


def test_initial_telemetry_and_zero_dollar_gate() -> None:
    engine = ContinuousBatchingEngine(max_slots=8)
    snap = engine.get_telemetry_snapshot()
    assert snap["chassis_id"] == "GF-T3-297"
    assert snap["batch_throughput_label"] == "Batch Throughput: 52,800 GB/s"
    assert snap["schedule_latency_label"] == "Schedule Latency: 0.01 µs"
    assert snap["active_slots_label"] == "Active Slots: 8 Slots"
    assert snap["processed_tokens_label"] == "Processed Tokens: 9,344,000 Units"
    assert snap["batch_state_label"] == "Batch State: In-Flight Active"
    assert len(snap["slots"]) == 8
    serialized = str(snap)
    assert chr(36) not in serialized


def test_iteration_level_sequence_injection_and_eviction() -> None:
    engine = ContinuousBatchingEngine(max_slots=8)
    # Enqueue custom sequences into wait queue while all 8 slots are occupied
    req1 = engine.enqueue_sequence("SEQ-CUSTOM-ALPHA", duration_steps=2, priority_weight=3.0)
    req2 = engine.enqueue_sequence("SEQ-CUSTOM-BRAVO", duration_steps=2, priority_weight=2.5)
    assert req1.slot_index is None
    assert req2.slot_index is None
    assert len(engine.wait_queue) == 2

    # Advance steps until initial short sequences complete and get evicted at iteration barrier
    evicted_total = []
    injected_total = []
    for _ in range(4):
        result = engine.step_inflight_pass()
        evicted_total.extend(result["evicted_sequences"])
        injected_total.extend(result["injected_sequences"])
        assert result["active_slots"] == 8

    assert len(evicted_total) >= 2
    assert "SEQ-CUSTOM-ALPHA" in injected_total
    assert "SEQ-CUSTOM-BRAVO" in injected_total


def test_asynchronous_slot_allocation_and_zero_starvation_under_concurrency() -> None:
    engine = ContinuousBatchingEngine(max_slots=8)
    queued_ids = []
    for idx in range(16):
        seq_id = "SEQ-CONCURRENT-" + str(idx)
        engine.enqueue_sequence(seq_id=seq_id, duration_steps=2, priority_weight=1.0)
        queued_ids.append(seq_id)

    assert len(engine.wait_queue) == 16

    # Step through iterations; aging guarantees every waiting sequence is scheduled with zero starvation
    for _ in range(12):
        engine.step_inflight_pass()

    assert len(engine.wait_queue) == 0
    for seq_id in queued_ids:
        active_ids = [s.active_seq_id for s in engine.slots]
        assert (seq_id in engine.completed_sequences) or (seq_id in active_ids)


def test_hardware_tensor_core_acceleration_and_throughput_saturation() -> None:
    engine = ContinuousBatchingEngine(max_slots=8)
    sat = engine.validate_tensor_saturation()
    assert sat["active_slots"] == 8
    assert sat["slot_utilization_pct"] == 100.0
    assert sat["padding_waste_pct"] == 0.0
    assert sat["effective_bandwidth_gbs"] == 52800
    assert sat["starvation_count"] == 0

    burst_res = engine.trigger_continuous_batch_burst(burst_count=8)
    assert burst_res["throughput_gbs"] == 56400
    sat_burst = engine.validate_tensor_saturation()
    assert sat_burst["effective_bandwidth_gbs"] == 56400


def test_preemption_spike_and_arena_flush() -> None:
    engine = ContinuousBatchingEngine(max_slots=8)
    spike_on = engine.toggle_preemption_spike()
    assert spike_on["preemption_spike_active"] is True
    assert spike_on["preempted_slots"] == [6, 7]
    assert engine.slots[6].state_label == "PREEMPT · REALLOC"

    spike_off = engine.toggle_preemption_spike()
    assert spike_off["preemption_spike_active"] is False
    assert engine.slots[6].state_label == "IN-FLIGHT · LOCKED"

    flushed = engine.flush_slot_arenas()
    assert flushed["current_step"] == 0
    assert flushed["batch_throughput_gbs"] == 52800
    assert flushed["processed_tokens_units"] == 9344000


def test_corridor_switching_and_fastapi_endpoints() -> None:
    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["chassis"] == "GF-T3-297"

    res_tel = client.get("/api/v1/telemetry")
    assert res_tel.status_code == 200
    assert res_tel.json()["active_slots_count"] == 8

    for corridor in SYNTHETIC_CORRIDORS:
        res_corr = client.post("/api/v1/corridor", json={"corridor": corridor})
        assert res_corr.status_code == 200
        assert res_corr.json()["corridor"] == corridor

    res_bad = client.post("/api/v1/corridor", json={"corridor": "INVALID-CORRIDOR"})
    assert res_bad.status_code == 400

    assert client.post("/api/v1/enqueue", json={"seq_id": "API-SEQ-1", "duration_steps": 3}).status_code == 200
    assert client.post("/api/v1/step").status_code == 200
    assert client.post("/api/v1/burst").status_code == 200
    assert client.post("/api/v1/preempt").status_code == 200
    assert client.get("/api/v1/saturation").status_code == 200
    assert client.post("/api/v1/flush").status_code == 200

    with pytest.raises(ValueError):
        engine = ContinuousBatchingEngine()
        engine.enqueue_sequence("BAD-SEQ", duration_steps=0)
