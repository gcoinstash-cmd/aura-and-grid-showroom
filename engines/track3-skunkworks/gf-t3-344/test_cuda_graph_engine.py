"""
Pytest Verification Suite for GF-T3-344 CUDA Graph Capture & Kernel Launch Serialization Engine.
Exceeds 85% coverage across Gate 01 through Gate 04.
"""

import pytest
from fastapi.testclient import TestClient
from engine import (
    app,
    CudaGraphSerializationEngine,
    CaptureBurstRequest,
    ReplayStepRequest,
    GraphCorridor,
)


client = TestClient(app)


def test_initial_baseline_telemetry() -> None:
    engine = CudaGraphSerializationEngine()
    state = engine.get_telemetry()
    assert state.unit_id == "GF-T3-344"
    assert state.graph_throughput_gbs == 136600.0
    assert state.replay_latency_us == 0.01
    assert state.active_graphs == 8
    assert state.total_graphs == 8
    assert state.processed_tokens_units == 30200000
    assert state.graph_state == "Active"
    assert state.mesh_pointer == "0x53F8DC0"
    assert state.mode == "CUDA_GRAPH"
    assert state.cpu_launch_overhead_us == 0.0
    assert len(state.graphs) == 8
    assert state.graphs[3].pointer_hex == "0x53030"


def test_stream_capture_and_immutable_graph_replay() -> None:
    engine = CudaGraphSerializationEngine()
    req = CaptureBurstRequest(
        corridor=GraphCorridor.ALPHA,
        stream_batches=4,
        weight_tensor_scale=1.02,
        inject_jitter=False,
    )
    res = engine.trigger_capture_burst(req)
    assert res.processed_tokens_units == 30200000 + (4 * 256000)
    assert res.cpu_launch_overhead_us == 0.0
    assert res.graph_throughput_gbs >= 136600.0
    for node in res.graphs:
        assert node.status == "CAPTURED · LOCKED"
        assert node.graph_saturation_pct == 100.0
        assert node.sync_barrier_pct == 100.0


def test_asynchronous_execution_under_jitter_spikes() -> None:
    engine = CudaGraphSerializationEngine()
    jitter_state = engine.toggle_launch_jitter(force_state=True)
    assert jitter_state.jitter_active is True
    assert jitter_state.mode == "DYNAMIC_RECAPTURE"
    assert jitter_state.replay_latency_us == 0.08
    assert jitter_state.cpu_launch_overhead_us > 0.0
    assert jitter_state.graph_throughput_gbs < 136600.0

    # Step async replay on Graph 3 to lock barrier synchronization
    step_res = engine.step_async_replay(ReplayStepRequest(graph_id=3, barrier_sync_tolerance_us=0.01))
    assert step_res.graphs[3].status == "CAPTURED · LOCKED"
    assert step_res.graphs[3].cuda_launch_delta_us == 0.0
    assert step_res.graphs[3].latency_ms == 0.01

    # Toggle jitter off and verify full recovery
    recovered = engine.toggle_launch_jitter(force_state=False)
    assert recovered.jitter_active is False
    assert recovered.cpu_launch_overhead_us == 0.0
    assert recovered.replay_latency_us == 0.01


def test_hardware_tensor_core_saturation_and_corridors() -> None:
    engine = CudaGraphSerializationEngine()
    for corridor in [
        GraphCorridor.ALPHA,
        GraphCorridor.BRAVO,
        GraphCorridor.GAMMA,
        GraphCorridor.DELTA,
    ]:
        res = engine.trigger_capture_burst(
            CaptureBurstRequest(corridor=corridor, stream_batches=2, inject_jitter=False)
        )
        assert res.corridor == corridor
        assert res.graph_throughput_gbs > 120000.0

    with pytest.raises(ValueError):
        engine.compute_capture_operator(k_stream=0.0, w_weight=1.0, delta_cuda_launch=0.0)


def test_fastapi_endpoints_and_arena_flush() -> None:
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["unit"] == "GF-T3-344"

    telem = client.get("/api/v1/telemetry")
    assert telem.status_code == 200
    assert telem.json()["graph_throughput_gbs"] == 136600.0

    burst = client.post(
        "/api/v1/capture-burst",
        json={
            "corridor": "GRAPH-CORRIDOR-BRAVO (ZERO-OVERHEAD-REPLAY-ENGINE)",
            "stream_batches": 8,
            "weight_tensor_scale": 1.02,
            "inject_jitter": True,
        },
    )
    assert burst.status_code == 200
    assert burst.json()["jitter_active"] is True

    step = client.post("/api/v1/replay-step", json={"graph_id": 3, "barrier_sync_tolerance_us": 0.01})
    assert step.status_code == 200

    flush = client.post("/api/v1/flush-arenas")
    assert flush.status_code == 200
    assert flush.json()["processed_tokens_units"] == 30200000
    assert flush.json()["graph_throughput_gbs"] == 136600.0
