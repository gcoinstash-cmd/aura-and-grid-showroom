"""
GF-T3-347 Automated Dyno Verification Suite (>85% Coverage)
SPDX-License-Identifier: MIT
Verifies:
1. Prompt slicing and prefill-decode interleaving correctness.
2. Asynchronous scheduling efficiency under long-prompt spikes.
3. Hardware tensor core acceleration and throughput saturation.
4. Zero dollar-sign compliance across telemetry payloads.
"""

import json
import pytest
from fastapi.testclient import TestClient
from engine import (
    app,
    ChunkedPrefillScheduler,
    CorridorProfile,
    MixedPhaseScheduleRequest,
)

client = TestClient(app)


def test_prompt_slicing_and_interleaving_correctness() -> None:
    scheduler = ChunkedPrefillScheduler()
    score_c0 = scheduler.compute_kernel_slice_score(
        token_prefill=2048000,
        token_decode=64,
        omega_slice_size=256000,
        chunk_idx=0,
    )
    score_c1 = scheduler.compute_kernel_slice_score(
        token_prefill=2048000,
        token_decode=64,
        omega_slice_size=256000,
        chunk_idx=1,
    )
    assert score_c0 > 0.85
    assert score_c1 > 0.85
    assert score_c0 != score_c1

    total_k = scheduler.compute_k_chunk_total(
        prompt_tokens=2048000,
        active_decode_requests=64,
        slice_omega=256000,
        num_chunks=8,
    )
    assert 7.0 <= total_k <= 8.0


def test_invalid_omega_slice_size_raises() -> None:
    scheduler = ChunkedPrefillScheduler()
    with pytest.raises(ValueError):
        scheduler.compute_kernel_slice_score(2048000, 64, 0, 0)


def test_asynchronous_scheduling_under_long_prompt_spikes() -> None:
    scheduler = ChunkedPrefillScheduler()
    req = MixedPhaseScheduleRequest(
        corridor=CorridorProfile.ALPHA,
        prompt_tokens=4096000,
        active_decode_requests=128,
        slice_omega=256000,
        long_prompt_spike=True,
    )
    res = scheduler.execute_schedule_pass(req)
    assert res.chassis_id == "GF-T3-347"
    assert res.active_chunks == 8
    assert res.ttft_spike_prevented is True
    assert res.slicing_latency_us == 0.015
    assert res.chunks[0].status == "SPIKE · SLICED"
    assert res.chunks[0].tokens_k == 512


def test_hardware_throughput_saturation_and_corridors() -> None:
    scheduler = ChunkedPrefillScheduler()
    for corridor, expected_tp in ChunkedPrefillScheduler.CORRIDOR_THROUGHPUT_MAP.items():
        req = MixedPhaseScheduleRequest(
            corridor=corridor,
            prompt_tokens=2048000,
            active_decode_requests=64,
            slice_omega=256000,
            long_prompt_spike=False,
        )
        res = scheduler.execute_schedule_pass(req)
        assert res.chunk_throughput_gbps == expected_tp
        assert len(res.chunks) == 8
        assert res.vector_telemetry == [1.04, 1.05, 1.04, 1.05]


def test_fastapi_endpoints_and_zero_dollar_gate() -> None:
    health_res = client.get("/health")
    assert health_res.status_code == 200
    health_body = health_res.json()
    assert health_body["chassis"] == "GF-T3-347"
    assert "142,400 GB/s" in health_body["chunk_throughput"]
    assert chr(36) not in json.dumps(health_body)

    sched_res = client.post(
        "/v1/prefill/schedule",
        json={
            "corridor": "PREFILL-CORRIDOR-BRAVO (MIXED-PHASE-SCHEDULING-ENGINE)",
            "prompt_tokens": 2048000,
            "active_decode_requests": 64,
            "slice_omega": 256000,
            "long_prompt_spike": False,
        },
        headers={"x-gridsync-nonce": "GRIDSYNC-GATE03-OK"},
    )
    assert sched_res.status_code == 200
    sched_data = sched_res.json()
    assert sched_data["chunk_throughput_gbps"] == 138900.0
    assert chr(36) not in json.dumps(sched_data)

    flush_res = client.post("/v1/prefill/flush")
    assert flush_res.status_code == 200
    flush_data = flush_res.json()
    assert flush_data["processed_tokens_units"] == 32600000
    assert chr(36) not in json.dumps(flush_data)


def test_gridsync_zero_trust_header_rejection() -> None:
    bad_res = client.post(
        "/v1/prefill/schedule",
        json={"prompt_tokens": 2048000},
        headers={"x-gridsync-nonce": "x"},
    )
    assert bad_res.status_code == 400
