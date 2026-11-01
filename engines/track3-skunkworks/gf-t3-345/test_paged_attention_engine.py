"""
GF-T3-345 Automated Verification Suite (>85% Coverage Gate 04)
Verifies:
1. Page table mapping and non-contiguous KV block allocation correctness.
2. Asynchronous memory pooling efficiency under fragmentation spikes.
3. Hardware tensor core acceleration and throughput saturation.
"""

import pytest
from fastapi.testclient import TestClient
from engine import (
    app,
    CorridorMode,
    PagedAttentionMemoryPoolEngine,
    compute_paged_attention_score,
)

client = TestClient(app)


def test_compute_paged_attention_score_deterministic() -> None:
    score_single = compute_paged_attention_score(8.16, 8.24, 1.0, num_layers=1)
    assert score_single == pytest.approx(1.0506, rel=1e-3)

    score_multi = compute_paged_attention_score(8.16, 8.24, 1.0, num_layers=8)
    assert score_multi > score_single
    assert score_multi == pytest.approx(7.9979, rel=1e-3)


def test_compute_paged_attention_invalid_layers() -> None:
    with pytest.raises(ValueError):
        compute_paged_attention_score(1.0, 1.0, 1.0, num_layers=0)


def test_initial_page_table_mapping_and_kv_allocation() -> None:
    eng = PagedAttentionMemoryPoolEngine()
    telemetry = eng.get_telemetry()
    assert telemetry.chassis_id == "GF-T3-345"
    assert telemetry.allocator_throughput_gbs == 138400
    assert telemetry.mapping_latency_us == 0.01
    assert telemetry.active_pages == 8
    assert telemetry.total_pages == 8
    assert telemetry.processed_tokens_units == 31000000
    assert telemetry.fragmentation_ratio == 0.0
    assert len(telemetry.pages) == 8
    assert telemetry.pages[0].hex_ptr == "0x54000"
    assert telemetry.pages[3].hex_ptr == "0x54030"
    assert telemetry.attention_vector == [1.05, 1.05, 1.05, 1.05]


def test_asynchronous_memory_pooling_under_fragmentation_spike() -> None:
    eng = PagedAttentionMemoryPoolEngine()
    spiked = eng.toggle_fragmentation_spike()
    assert spiked.allocator_state == "Compacting"
    assert spiked.fragmentation_ratio == 0.14
    assert spiked.pages[2].fragmented is True
    assert spiked.pages[5].fragmented is True
    assert spiked.pages[2].status == "COMPACT · REMAP"

    recovered = eng.toggle_fragmentation_spike()
    assert recovered.allocator_state == "Active"
    assert recovered.fragmentation_ratio == 0.0
    assert all(not p.fragmented for p in recovered.pages)


def test_hardware_tensor_core_acceleration_and_burst_saturation() -> None:
    eng = PagedAttentionMemoryPoolEngine()
    burst_state = eng.trigger_paged_attention_burst(intensity=1.5)
    assert burst_state.allocator_throughput_gbs == 140200
    assert burst_state.mapping_latency_us == 0.01
    assert burst_state.processed_tokens_units == 31768000
    assert all(p.tokens_k == 384 for p in burst_state.pages)

    with pytest.raises(ValueError):
        eng.trigger_paged_attention_burst(intensity=9.5)


def test_step_allocator_and_flush_arenas() -> None:
    eng = PagedAttentionMemoryPoolEngine()
    stepped = eng.step_async_allocator_pass()
    assert stepped.processed_tokens_units == 31256000
    assert stepped.base_ptr != "0x54F8DC0"

    eng.set_corridor(CorridorMode.BRAVO)
    assert eng.allocator_throughput_gbs == 142600
    eng.set_corridor(CorridorMode.GAMMA)
    assert eng.allocator_throughput_gbs == 136900
    eng.set_corridor(CorridorMode.DELTA)
    assert eng.allocator_throughput_gbs == 118200

    flushed = eng.flush_paged_arenas()
    assert flushed.processed_tokens_units == 31000000
    assert flushed.base_ptr == "0x54F8DC0"
    assert flushed.corridor == CorridorMode.ALPHA


def test_fastapi_endpoints_zero_trust() -> None:
    r_health = client.get("/health")
    assert r_health.status_code == 200
    assert r_health.json()["chassis"] == "GF-T3-345"

    r_tel = client.get("/api/v1/telemetry")
    assert r_tel.status_code == 200
    assert r_tel.json()["allocator_throughput_gbs"] == 138400

    r_burst = client.post("/api/v1/burst", json={"intensity": 1.25})
    assert r_burst.status_code == 200
    assert r_burst.json()["allocator_throughput_gbs"] == 139900

    r_frag = client.post("/api/v1/fragmentation/toggle")
    assert r_frag.status_code == 200
    assert r_frag.json()["fragmentation_ratio"] == 0.14

    r_step = client.post("/api/v1/allocator/step")
    assert r_step.status_code == 200
    assert r_step.json()["fragmentation_ratio"] == 0.0

    r_flush = client.post("/api/v1/allocator/flush")
    assert r_flush.status_code == 200
    assert r_flush.json()["processed_tokens_units"] == 31000000
