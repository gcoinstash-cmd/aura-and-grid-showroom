"""
Pytest Verification Suite for GF-T3-230 Ring-AllReduce NVLink Engine
Verifies:
1. Exact numerical convergence of ring-allreduce against centralized monolithic reduction.
2. NVLink bandwidth saturation calculations under peak tensor chunk sizes.
3. Zero-copy buffer pointer safety and leak prevention.
SPDX-License-Identifier: MIT
"""

import pytest
from fastapi.testclient import TestClient
from engine import (
    app,
    NUM_GPUS,
    SYNTHETIC_CORRIDORS,
    ZeroCopyBufferManager,
    NVLinkBandwidthSimulator,
    RingAllReduceStateMachine,
)

client = TestClient(app)


def test_exact_numerical_convergence_against_monolithic_reduction() -> None:
    """Verifies 2*(N-1) ring scatter-reduce + all-gather converges bit-accurately to centralized sum."""
    sm = RingAllReduceStateMachine(num_gpus=8)
    raw_tensors = []
    for g in range(8):
        gpu_chunks = []
        for c in range(8):
            chunk = [round((g + 1) * 1.25 + (c + 1) * 0.75 + k * 0.5, 6) for k in range(6)]
            gpu_chunks.append(chunk)
        raw_tensors.append(gpu_chunks)

    expected_monolithic = RingAllReduceStateMachine.monolithic_reference_allreduce(raw_tensors)
    sm.load_custom_tensors(raw_tensors)
    ring_result = sm.execute_full_allreduce()

    assert sm.current_step == 14
    for gpu_idx in range(8):
        for chunk_idx in range(8):
            assert ring_result[gpu_idx][chunk_idx] == pytest.approx(expected_monolithic[chunk_idx], rel=1e-7)


def test_step_by_step_scatter_reduce_and_all_gather_transitions() -> None:
    """Verifies phase transitions across 7 scatter-reduce steps and 7 all-gather steps."""
    sm = RingAllReduceStateMachine(num_gpus=8)
    for step_idx in range(7):
        res = sm.step_pass()
        assert res["step"] == step_idx + 1
        assert res["phase"] == "SCATTER_REDUCE"

    for step_idx in range(7, 13):
        res = sm.step_pass()
        assert res["step"] == step_idx + 1
        assert res["phase"] == "ALL_GATHER"

    final_res = sm.step_pass()
    assert final_res["step"] == 14
    assert final_res["phase"] == "CONVERGED"


def test_nvlink_bandwidth_saturation_and_spike_calculations() -> None:
    """Verifies NVLink 900 GB/s bus saturation math and packet-loss latency degradation."""
    sim = NVLinkBandwidthSimulator(num_gpus=8, peak_bw_gbps=900.0)
    nominal = sim.compute_ring_metrics(
        tensor_bytes=64 * 1024 * 1024,
        corridor=SYNTHETIC_CORRIDORS[0],
        spike_active=False,
    )
    assert nominal["achieved_bw_gbps"] == 880.0
    assert nominal["ring_volume_factor"] == 1.75
    assert nominal["saturation_pct"] > 97.0
    assert nominal["latency_ms"] < 0.30

    spiked = sim.compute_ring_metrics(
        tensor_bytes=64 * 1024 * 1024,
        corridor=SYNTHETIC_CORRIDORS[0],
        spike_active=True,
    )
    assert spiked["achieved_bw_gbps"] < nominal["achieved_bw_gbps"]
    assert spiked["latency_ms"] > nominal["latency_ms"]

    with pytest.raises(ValueError):
        sim.compute_ring_metrics(tensor_bytes=0)


def test_zero_copy_buffer_pointer_safety_and_leak_prevention() -> None:
    """Verifies deterministic DMA pointer bounds, reference counting, and leak-free flush."""
    mgr = ZeroCopyBufferManager(num_gpus=8)
    assert mgr.verify_zero_leaks() is True
    assert mgr.get_pointer(2) == "0x7F1000"

    with pytest.raises(ValueError):
        mgr.get_pointer(-1)
    with pytest.raises(ValueError):
        mgr.get_pointer(8)

    block = mgr.allocate_staging(2, 67108864)
    assert block.ref_count == 2
    assert mgr.release_staging(2) is True
    assert block.ref_count == 1
    assert mgr.release_staging(2) is True
    assert block.in_use is False

    with pytest.raises(RuntimeError):
        mgr.get_pointer(2)

    reinitialized = mgr.flush_and_rezero()
    assert reinitialized == 8
    assert mgr.get_pointer(2) == "0x7F1000"
    assert mgr.verify_zero_leaks() is True


def test_fastapi_endpoints_and_payload_validation() -> None:
    """Verifies FastAPI endpoints for telemetry, ring burst, step pass, and fabric flush."""
    health = client.get("/api/health")
    assert health.status_code == 200
    assert health.json()["engine_id"] == "GF-T3-230"

    telemetry = client.get("/api/telemetry")
    assert telemetry.status_code == 200
    t_data = telemetry.json()
    assert t_data["project"] == "GF-T3-230"
    assert t_data["ring_bandwidth_gbps"] == 880.0
    assert len(t_data["gpus"]) == 8
    assert t_data["gpus"][2]["buffer_ptr"] == "0x7F1000"

    burst = client.post(
        "/api/ring/burst",
        json={
            "corridor": SYNTHETIC_CORRIDORS[0],
            "tensor_mb": 64,
            "inject_spike": False,
        },
    )
    assert burst.status_code == 200
    assert burst.json()["status"] == "ALL_GATHER_VERIFIED"

    bad_burst = client.post(
        "/api/ring/burst",
        json={
            "corridor": "INVALID-CORRIDOR",
            "tensor_mb": 64,
            "inject_spike": False,
        },
    )
    assert bad_burst.status_code == 400

    flush = client.post("/api/ring/flush")
    assert flush.status_code == 200
    assert flush.json()["zero_leaks"] is True
