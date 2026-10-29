"""
GF-T3-250 Pytest Verification Suite
Verifies:
1. Chunked prefill token splitting correctness and bounded compute quanta adherence.
2. Asynchronous generation overlap concurrency between prefill and decoding steps.
3. Interference mitigation latency reduction and throughput saturation.
License: MIT
"""

import pytest
from fastapi.testclient import TestClient
from engine import (
    app,
    SYNTHETIC_CORRIDORS,
    PrefillWorkloadRequest,
    split_prompt_into_bounded_chunks,
    compute_async_overlap_metrics,
    evaluate_chunked_prefill_pipeline,
)

client = TestClient(app)


def test_chunked_prefill_token_splitting_exact_bounds():
    allocations = split_prompt_into_bounded_chunks(
        prompt_tokens=4096,
        chunk_bound_tokens=512,
        max_chunks=8,
    )
    assert len(allocations) == 8
    assert sum(allocations) == 4096
    for chunk_tokens in allocations:
        assert chunk_tokens == 512


def test_chunked_prefill_token_splitting_partial_prompt():
    allocations = split_prompt_into_bounded_chunks(
        prompt_tokens=1536,
        chunk_bound_tokens=512,
        max_chunks=8,
    )
    assert len(allocations) == 3
    assert sum(allocations) == 1536
    assert all(c <= 512 for c in allocations)


def test_chunked_prefill_invalid_bounds_rejected():
    with pytest.raises(ValueError):
        split_prompt_into_bounded_chunks(prompt_tokens=0, chunk_bound_tokens=512)
    with pytest.raises(ValueError):
        split_prompt_into_bounded_chunks(prompt_tokens=1024, chunk_bound_tokens=0)


def test_async_generation_overlap_concurrency_metrics():
    alpha_metrics = compute_async_overlap_metrics(
        chunk_tokens=512,
        chunk_bound_tokens=512,
        active_decode_requests=64,
        corridor=SYNTHETIC_CORRIDORS[0],
        saturation_fault=False,
    )
    assert alpha_metrics["overlap_pct"] == 99.8
    assert alpha_metrics["latency_ms"] == 0.12
    assert alpha_metrics["interference_us"] == 0.01
    assert 0.0 < alpha_metrics["quanta_share"] <= 1.0


def test_interference_mitigation_vs_monolithic_fallback():
    chunked_req = PrefillWorkloadRequest(
        prompt_tokens=4096,
        chunk_bound_tokens=512,
        active_decode_requests=64,
        corridor=SYNTHETIC_CORRIDORS[2],
        saturation_fault=False,
    )
    monolithic_req = PrefillWorkloadRequest(
        prompt_tokens=4096,
        chunk_bound_tokens=512,
        active_decode_requests=64,
        corridor=SYNTHETIC_CORRIDORS[3],
        saturation_fault=False,
    )

    chunked_res = evaluate_chunked_prefill_pipeline(chunked_req)
    mono_res = evaluate_chunked_prefill_pipeline(monolithic_req)

    assert chunked_res.prefill_throughput_gbs >= 13000
    assert chunked_res.overlap_latency_us == 0.01
    assert chunked_res.zero_stall_verified is True
    assert chunked_res.overlap_efficiency_pct > mono_res.overlap_efficiency_pct
    assert chunked_res.overlap_latency_us < mono_res.overlap_latency_us


def test_saturation_fault_triggers_chunk_resync():
    fault_req = PrefillWorkloadRequest(
        prompt_tokens=8192,
        chunk_bound_tokens=512,
        active_decode_requests=128,
        corridor=SYNTHETIC_CORRIDORS[0],
        saturation_fault=True,
    )
    res = evaluate_chunked_prefill_pipeline(fault_req)
    assert res.prefill_state == "Chunk Resync Active"
    assert res.zero_stall_verified is False
    assert any(c.decode_sync == "RESYNC" for c in res.chunks)


def test_fastapi_endpoints_and_zero_trust_sanitization():
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["engine"] == "GF-T3-250"

    sim = client.post(
        "/api/v1/prefill/simulate",
        json={
            "prompt_tokens": 4096,
            "chunk_bound_tokens": 512,
            "active_decode_requests": 64,
            "corridor": SYNTHETIC_CORRIDORS[0],
            "saturation_fault": False,
        },
    )
    assert sim.status_code == 200
    body = sim.json()
    assert body["engine_id"] == "GF-T3-250"
    assert body["prefill_throughput_gbs"] == 13000
    assert len(body["chunks"]) == 8

    bad_resp = client.post(
        "/api/v1/prefill/simulate",
        json={
            "prompt_tokens": 4096,
            "chunk_bound_tokens": 512,
            "active_decode_requests": 64,
            "corridor": "DROP TABLE prefill_chunks; --",
            "saturation_fault": False,
        },
    )
    assert bad_resp.status_code == 422
