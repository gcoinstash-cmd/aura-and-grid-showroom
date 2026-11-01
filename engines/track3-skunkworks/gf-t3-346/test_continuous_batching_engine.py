"""
Automated Verification Suite for GF-T3-346 Continuous Batching & In-Flight Scheduling Engine
Coverage Target: >85% across Gate 01 through Gate 04
"""

import pytest
from fastapi.testclient import TestClient
from engine import (
    app,
    BatchCorridor,
    ContinuousBatchingEngine,
    SequenceRequest,
    SurgeInjectionPayload,
)

client = TestClient(app)


def test_initial_engine_telemetry_baseline() -> None:
    engine = ContinuousBatchingEngine(num_slots=8)
    snap = engine.get_telemetry_snapshot()
    assert snap.chassis_id == "GF-T3-346"
    assert snap.batch_throughput_gbs == 140200.0
    assert snap.scheduling_latency_us == 0.01
    assert snap.active_slots_count == 8
    assert snap.total_slots_count == 8
    assert snap.processed_tokens_units == 31800000
    assert snap.batch_state == "Active"
    assert snap.gpu_idle_bubbles == 0.0
    assert len(snap.slots) == 8
    assert snap.slots[0].hex_ptr == "0x55000"
    assert snap.slots[3].hex_ptr == "0x55030"


def test_iteration_level_request_insertion_and_ejection() -> None:
    engine = ContinuousBatchingEngine(num_slots=8)
    req = SequenceRequest(
        request_id="REQ-CUSTOM-900",
        prompt_tokens=262144,
        max_new_tokens=2048,
        latency_sla_us=15.0,
    )
    res = engine.enqueue_request(req)
    assert res["queued"] is True
    assert res["queue_depth"] == 1

    # Advance slots until tokens_allocated reaches ejection threshold (524288)
    for slot in engine.slots:
        slot.tokens_allocated = 520192

    snap = engine.step_asynchronous_pass(steps=1)
    assert "REQ-INIT-000" in engine.completed_sequences
    assert snap.slots[0].active_request_id == "REQ-CUSTOM-900"
    assert snap.slots[0].status == "IN-FLIGHT · REINDEXED"
    assert snap.gpu_idle_bubbles == 0.0


def test_asynchronous_scheduling_under_request_surge_spikes() -> None:
    engine = ContinuousBatchingEngine(num_slots=8)
    payload = SurgeInjectionPayload(
        burst_requests=16,
        tokens_per_request=262144,
        latency_sla_us=8.0,
    )
    snap = engine.inject_request_surge_spike(payload)
    assert engine.surge_active is True
    assert snap.batch_throughput_gbs >= 140200.0
    assert snap.scheduling_latency_us == 0.01
    assert snap.gpu_idle_bubbles == 0.0
    assert len(engine.request_queue) == 16
    assert snap.slots[0].status == "SURGE · RE-INDEXED"


def test_hardware_tensor_core_acceleration_and_corridor_switching() -> None:
    engine = ContinuousBatchingEngine(num_slots=8)
    snap_alpha = engine.set_corridor(BatchCorridor.ALPHA)
    snap_delta = engine.set_corridor(BatchCorridor.DELTA)
    assert snap_alpha.batch_throughput_gbs > snap_delta.batch_throughput_gbs
    assert snap_alpha.scheduling_latency_us == 0.01
    assert snap_delta.scheduling_latency_us == 0.04


def test_continuous_batching_burst_and_arena_flush() -> None:
    engine = ContinuousBatchingEngine(num_slots=8)
    burst_snap = engine.trigger_continuous_batching_burst()
    assert burst_snap.batch_throughput_gbs == 148600.0
    assert burst_snap.slots[0].status == "BURST · INTERLEAVED"

    flushed_snap = engine.flush_batch_arenas()
    assert flushed_snap.batch_throughput_gbs == 140200.0
    assert flushed_snap.iteration_step == 1
    assert len(engine.request_queue) == 0
    assert flushed_snap.slots[0].status == "SCHEDULED · LOCKED"


def test_schedule_score_validation_gate() -> None:
    engine = ContinuousBatchingEngine(num_slots=8)
    with pytest.raises(ValueError):
        engine.compute_iteration_schedule_score(8, 1024, 0.0)
    with pytest.raises(ValueError):
        engine.step_asynchronous_pass(steps=0)


def test_fastapi_endpoints_contract() -> None:
    health_resp = client.get("/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["chassis"] == "GF-T3-346"

    telem_resp = client.get("/api/v1/telemetry")
    assert telem_resp.status_code == 200
    assert telem_resp.json()["chassis_id"] == "GF-T3-346"

    burst_resp = client.post("/api/v1/burst")
    assert burst_resp.status_code == 200
    assert burst_resp.json()["batch_throughput_gbs"] == 148600.0

    surge_resp = client.post("/api/v1/surge")
    assert surge_resp.status_code == 200

    step_resp = client.post("/api/v1/step?steps=2")
    assert step_resp.status_code == 200

    bad_step_resp = client.post("/api/v1/step?steps=0")
    assert bad_step_resp.status_code == 400

    flush_resp = client.post("/api/v1/flush")
    assert flush_resp.status_code == 200
    assert flush_resp.json()["batch_throughput_gbs"] == 140200.0
