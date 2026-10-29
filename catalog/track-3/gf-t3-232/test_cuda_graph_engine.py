"""
GF-T3-232: Pytest Verification Suite (>80% Coverage)
Verifies numerical equivalence, CPU dispatch overhead reduction ratio,
and DAG node dependency & zero-copy memory alias safety.
SPDX-License-Identifier: MIT
"""

import pytest
from fastapi.testclient import TestClient
from engine import (
    app,
    CudaGraphAccelerationEngine,
    CaptureBurstRequest,
    GraphCorridor,
    GraphNodeSpec,
    KernelType,
    StreamCaptureState,
)


client = TestClient(app)


def test_numerical_equivalence_standard_stream_vs_captured_graph() -> None:
    """
    1. Verifies exact numerical equivalence between standard eager stream execution
    and captured CUDA graph replay across diverse input vectors.
    """
    eng = CudaGraphAccelerationEngine()
    vectors = [
        [1.0, 2.0, 3.0, 4.0],
        [-0.5, 0.25, 1.75, -2.1],
        [10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0, 80.0],
    ]
    for vec in vectors:
        eager = eng.compute_eager_stream_output(vec)
        replay = eng.compute_captured_graph_replay_output(vec)
        assert len(eager) == len(replay)
        for val_e, val_r in zip(eager, replay):
            assert abs(val_e - val_r) < 1e-9


def test_cpu_overhead_reduction_ratio_under_high_frequency_dispatches() -> None:
    """
    2. Verifies CPU launch overhead compression from 5.0 us per kernel down to
    0.35 us aggregate graph replay latency and 4.85x speedup gain.
    """
    eng = CudaGraphAccelerationEngine()
    dispatch_us, eager_cpu_us, speedup_x = eng.calculate_latency_and_speedup()

    # Standard 8-stage stream incurs 40.0 us of CPU driver submission overhead (5.0 us * 8)
    assert eager_cpu_us == 40.0
    # Captured graph replay compresses dispatch latency to 0.35 us
    assert dispatch_us == 0.35
    assert speedup_x == 4.85
    assert (eager_cpu_us / dispatch_us) > 100.0


def test_node_dependency_integrity_and_memory_alias_safety() -> None:
    """
    3. Verifies DAG topological integrity and detects unsafe concurrent memory alias collisions
    or circular dependencies.
    """
    eng = CudaGraphAccelerationEngine()
    valid, topo_order = eng.validate_dag_and_aliases()
    assert valid is True
    assert topo_order == [0, 1, 2, 3, 4, 5, 6, 7]

    # Inject duplicate memory alias pointer on concurrent sibling nodes N1 and N2
    corrupted_nodes = [n.model_copy(deep=True) for n in eng.nodes]
    corrupted_nodes[2].memory_alias_ptr = corrupted_nodes[1].memory_alias_ptr
    with pytest.raises(ValueError, match="collision"):
        eng.validate_dag_and_aliases(corrupted_nodes)

    # Inject cyclic dependency between N0 and N7
    cyclic_nodes = [n.model_copy(deep=True) for n in eng.nodes]
    cyclic_nodes[0].parent_ids = [7]
    cyclic_nodes[7].child_ids = [0]
    with pytest.raises(ValueError, match="Cycle detected"):
        eng.validate_dag_and_aliases(cyclic_nodes)


def test_stall_conflict_and_flush_recovery_lifecycle() -> None:
    """
    Verifies stream stall conflict injection invalidates zero-overhead replay
    and flush restores nominal 128-node captured state.
    """
    eng = CudaGraphAccelerationEngine()
    snap_conflict = eng.toggle_stall_conflict()
    assert snap_conflict.stall_conflict_active is True
    assert snap_conflict.stream_state == StreamCaptureState.STALL_CONFLICT
    assert snap_conflict.graph_speedup_x == 1.00

    with pytest.raises(RuntimeError):
        eng.compute_captured_graph_replay_output([1.0, 2.0])

    snap_recovered = eng.flush_captured_nodes()
    assert snap_recovered.stall_conflict_active is False
    assert snap_recovered.stream_state == StreamCaptureState.CAPTURED
    assert snap_recovered.captured_nodes_count == 128
    assert snap_recovered.dispatch_latency_us == 0.35


def test_fastapi_endpoints_and_corridor_switching() -> None:
    """
    Verifies REST API endpoints for telemetry, burst capture, replay stepping, and equivalence check.
    """
    res = client.get("/api/v1/telemetry")
    assert res.status_code == 200
    payload = res.json()
    assert payload["project_id"] == "GF-T3-232"
    assert payload["captured_nodes_count"] == 128

    burst_res = client.post(
        "/api/v1/capture-burst",
        json={
            "corridor": GraphCorridor.BRAVO.value,
            "sub_graph_clusters": 16,
            "tokens_per_pass": 64000,
        },
    )
    assert burst_res.status_code == 200
    assert burst_res.json()["processed_tokens_units"] == 832000

    step_res = client.post("/api/v1/step-replay")
    assert step_res.status_code == 200
    assert step_res.json()["stream_state"] == "CAPTURED"

    eq_res = client.post(
        "/api/v1/verify-equivalence",
        json={"input_vector": [2.0, 4.0, 6.0, 8.0], "iterations": 4},
    )
    assert eq_res.status_code == 200
    assert eq_res.json()["equivalent"] is True
