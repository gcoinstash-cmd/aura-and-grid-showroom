"""
Pytest verification suite for GF-T3-341 Asynchronous Context Parallelism & Ring-Attention Interlock Engine.
Verifies:
1. Sequence sharding and peer-to-peer ring KV transfer correctness.
2. Asynchronous attention overlap efficiency under deep context loads.
3. Hardware tensor core acceleration and throughput saturation.
4. Zero-dollar symbol compliance across API payloads.
"""

import json
import pytest
from fastapi.testclient import TestClient
from engine import (
    app,
    ContextCorridor,
    ContextParallelismSolver,
)

client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["chassis"] == "GF-T3-341"
    assert data["context_state"] == "Active"
    assert chr(36) not in json.dumps(data)


def test_initial_telemetry_snapshot() -> None:
    solver = ContextParallelismSolver(num_segments=8)
    snap = solver.get_snapshot()
    assert snap.chassis_id == "GF-T3-341"
    assert snap.sequence_throughput_gbs == 130_200.0
    assert snap.ring_step_latency_us == 0.01
    assert snap.active_segments_count == 8
    assert snap.total_segments_count == 8
    assert snap.processed_tokens_units == 27_800_000
    assert snap.engine_xp_k == 75.0
    assert snap.context_state == "Active"
    assert len(snap.segments) == 8
    for idx, seg in enumerate(snap.segments):
        assert seg.segment_id == idx
        assert seg.tokens_k == 256
        assert seg.ring_load_pct == 100.0
        assert seg.status == "SHIFTED · LOCKED"


def test_sequence_sharding_and_p2p_ring_kv_transfer_correctness() -> None:
    solver = ContextParallelismSolver(num_segments=8)
    q_local = [1.25 + 0.02 * i for i in range(8)]
    k_peers = [1.20 + 0.015 * i for i in range(8)]
    v_peers = [9.98 for _ in range(8)]

    c_step_0 = solver.evaluate_context_interlock(q_local, k_peers, v_peers, phi_p2p=1.0)
    assert c_step_0 > 40.0

    # Step ring pass and verify peer indices rotate around the 8-segment ring
    snap_step_1 = solver.step_ring_pass()
    assert snap_step_1.ring_step_index == 1
    assert snap_step_1.segments[0].peer_next == 2
    assert snap_step_1.processed_tokens_units == 28_824_000

    # Complete full 8-step ring cycle back to origin alignment
    for _ in range(7):
        solver.step_ring_pass()
    assert solver.ring_step_index == 0
    c_full_cycle = solver.evaluate_context_interlock(q_local, k_peers, v_peers, phi_p2p=1.0)
    assert c_full_cycle == c_step_0


def test_ring_operator_edge_cases() -> None:
    solver = ContextParallelismSolver(num_segments=8)
    with pytest.raises(ValueError):
        solver.compute_ring_operator(1.0, 1.0, 1.0, 0.99, d_head=0)
    with pytest.raises(ValueError):
        solver.evaluate_context_interlock([1.0], [1.0], [1.0], 0.99)


def test_asynchronous_attention_overlap_efficiency() -> None:
    solver = ContextParallelismSolver(num_segments=8)
    non_blocking_eff = solver.compute_overlap_efficiency(
        compute_time_us=12.5,
        p2p_transfer_time_us=11.8,
        non_blocking=True,
    )
    blocking_eff = solver.compute_overlap_efficiency(
        compute_time_us=12.5,
        p2p_transfer_time_us=11.8,
        non_blocking=False,
    )
    assert non_blocking_eff > 99.0
    assert blocking_eff < 55.0
    assert non_blocking_eff > blocking_eff

    with pytest.raises(ValueError):
        solver.compute_overlap_efficiency(0.0, 10.0)


def test_hardware_tensor_core_acceleration_and_chaos_triggers() -> None:
    # Reset first
    client.post("/api/v1/actions/flush")

    # 1. Context Parallelism Burst
    r_burst = client.post("/api/v1/actions/burst")
    assert r_burst.status_code == 200
    b_data = r_burst.json()
    assert b_data["burst_active"] is True
    assert b_data["sequence_throughput_gbs"] > 130_200.0
    assert b_data["segments"][0]["tokens_k"] == 512

    # 2. Inject Ring Latency Spike (Dynamic P2P Re-Routing)
    r_spike = client.post("/api/v1/actions/spike")
    assert r_spike.status_code == 200
    s_data = r_spike.json()
    assert s_data["latency_spike_injected"] is True
    assert s_data["segments"][2]["status"] == "REROUTED · LOCKED"
    assert s_data["segments"][5]["status"] == "REROUTED · LOCKED"

    # 3. Step Asynchronous Ring Pass
    r_step = client.post("/api/v1/actions/step")
    assert r_step.status_code == 200
    assert r_step.json()["ring_step_index"] == 1

    # 4. Corridor Switching
    for corridor in ContextCorridor:
        r_corr = client.post("/api/v1/corridor", json={"corridor": corridor.value})
        assert r_corr.status_code == 200
        assert r_corr.json()["corridor"] == corridor.value

    # 5. Flush Arenas & Re-Zero Ring Buffers
    r_flush = client.post("/api/v1/actions/flush")
    assert r_flush.status_code == 200
    f_data = r_flush.json()
    assert f_data["ring_step_index"] == 0
    assert f_data["burst_active"] is False
    assert f_data["latency_spike_injected"] is False
    assert f_data["sequence_throughput_gbs"] == 130_200.0


def test_interlock_verify_endpoint_and_zero_dollar_gate() -> None:
    r_verify = client.get("/api/v1/interlock/verify?phi_p2p=0.999")
    assert r_verify.status_code == 200
    payload_str = json.dumps(r_verify.json())
    assert chr(36) not in payload_str
    assert r_verify.json()["segments_verified"] == 8
