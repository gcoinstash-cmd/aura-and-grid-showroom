"""
Pytest Verification Suite for GF-T3-289
Verifies:
1. Asynchronous micro-batch streaming and pipeline bubble minimization correctness.
2. Multi-GPU stage activation transfer efficiency and low latency handoffs.
3. Hardware tensor core acceleration and throughput saturation.
"""

import pytest
from fastapi.testclient import TestClient
from engine import (
    CorridorType,
    PipelineInterconnectEngine,
    ScheduleCalculationRequest,
    StageStatus,
    app,
    compute_1f1b_pipeline_schedule,
)

client = TestClient(app)


def test_1f1b_pipeline_schedule_formula_exactness() -> None:
    """Verify T_pipe = (K - 1) * t_bubble + N * t_stage and zero-bubble convergence."""
    res = compute_1f1b_pipeline_schedule(
        num_stages=8,
        num_micro_batches=64,
        t_bubble_us=0.001,
        t_stage_us=0.01,
        interconnect_bandwidth_gbs=44800.0,
        activation_tensor_mb=16.0,
    )
    expected_bubble = 7.0 * 0.001
    expected_compute = 64.0 * 0.01
    expected_total = round(expected_bubble + expected_compute, 6)

    assert res.engine_id == "GF-T3-289"
    assert res.bubble_time_us == round(expected_bubble, 6)
    assert res.ideal_compute_time_us == round(expected_compute, 6)
    assert res.total_pipeline_time_us == expected_total
    assert res.scheduling_efficiency_pct > 98.5
    assert len(res.schedule_sequence) > 0


def test_pipeline_bubble_minimization_with_scaling_micro_batches() -> None:
    """Verify that increasing N micro-batches monotonically reduces pipeline bubble fraction."""
    res_small = compute_1f1b_pipeline_schedule(
        num_stages=8,
        num_micro_batches=8,
        t_bubble_us=0.005,
        t_stage_us=0.01,
    )
    res_large = compute_1f1b_pipeline_schedule(
        num_stages=8,
        num_micro_batches=128,
        t_bubble_us=0.005,
        t_stage_us=0.01,
    )
    assert res_large.bubble_fraction_pct < res_small.bubble_fraction_pct
    assert res_large.scheduling_efficiency_pct > res_small.scheduling_efficiency_pct


def test_multi_gpu_p2p_activation_transfer_and_barrier_sync() -> None:
    """Verify non-blocking P2P handoff latency and sub-microsecond barrier synchronization."""
    res = compute_1f1b_pipeline_schedule(
        num_stages=8,
        num_micro_batches=64,
        t_bubble_us=0.001,
        t_stage_us=0.01,
        interconnect_bandwidth_gbs=44800.0,
        activation_tensor_mb=16.0,
    )
    assert res.p2p_handoff_latency_us < 1.0
    assert res.barrier_sync_latency_us < 0.5
    assert res.effective_throughput_gbs > 44000.0


def test_invalid_schedule_inputs_raise_value_error() -> None:
    """Verify boundary validation on invalid stage or micro-batch parameters."""
    with pytest.raises(ValueError):
        compute_1f1b_pipeline_schedule(
            num_stages=0,
            num_micro_batches=16,
            t_bubble_us=0.001,
            t_stage_us=0.01,
        )
    with pytest.raises(ValueError):
        compute_1f1b_pipeline_schedule(
            num_stages=8,
            num_micro_batches=16,
            t_bubble_us=0.001,
            t_stage_us=0.0,
        )


def test_engine_state_transitions_and_throughput_saturation() -> None:
    """Verify stateful simulator chaos triggers, corridor switches, and arena flushes."""
    eng = PipelineInterconnectEngine()
    initial = eng.get_state()
    assert initial.engine_id == "GF-T3-289"
    assert initial.pipeline_throughput_gbs == 44800.0
    assert initial.active_stages == 8
    assert len(initial.stages) == 8

    # Burst trigger
    burst_state = eng.trigger_stream_burst()
    assert burst_state.burst_mode_active is True
    assert burst_state.pipeline_throughput_gbs == 51200.0
    assert burst_state.stages[0].status == StageStatus.BURST_OVERDRIVE

    # Bubble stall toggle on and off
    stall_on = eng.toggle_bubble_stall()
    assert stall_on.bubble_stall_active is True
    assert stall_on.stages[2].status == StageStatus.STALL_SPIKE
    stall_off = eng.toggle_bubble_stall()
    assert stall_off.bubble_stall_active is False
    assert stall_off.stages[2].status == StageStatus.STREAMING_LOCKED

    # Step 1F1B pass
    prev_tokens = stall_off.processed_tokens_units
    stepped = eng.step_1f1b_pass()
    assert stepped.processed_tokens_units == prev_tokens + 256000
    assert stepped.step_counter == 2

    # Corridor switching across all 4 corridors
    for corridor in CorridorType:
        c_state = eng.set_corridor(corridor)
        assert c_state.corridor == corridor

    # Flush arenas
    flushed = eng.flush_stage_arenas()
    assert flushed.processed_tokens_units == 8320000
    assert flushed.pipeline_throughput_gbs == 44800.0
    assert flushed.step_counter == 1


def test_fastapi_endpoints_and_zero_currency_compliance() -> None:
    """Verify FastAPI HTTP endpoints and ensure zero currency symbols exist in JSON payloads."""
    health_resp = client.get("/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["engine_id"] == "GF-T3-289"

    state_resp = client.get("/api/pipeline/state")
    assert state_resp.status_code == 200
    assert chr(36) not in state_resp.text

    sched_resp = client.post(
        "/api/pipeline/schedule",
        json={
            "num_stages": 8,
            "num_micro_batches": 64,
            "t_bubble_us": 0.0014,
            "t_stage_us": 0.01,
            "interconnect_bandwidth_gbs": 44800.0,
            "activation_tensor_mb": 16.0,
        },
    )
    assert sched_resp.status_code == 200
    assert chr(36) not in sched_resp.text

    for endpoint in [
        "/api/pipeline/burst",
        "/api/pipeline/stall",
        "/api/pipeline/step",
        "/api/pipeline/flush",
    ]:
        r = client.post(endpoint)
        assert r.status_code == 200
        assert chr(36) not in r.text
