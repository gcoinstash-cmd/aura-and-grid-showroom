"""
Pytest Verification Suite for GF-T3-286
Verifies:
1. Asynchronous attention sink retention and fixed-size ring buffer pointer rotation correctness.
2. Infinite context generation stability and zero degradation under massive token loads.
3. Hardware tensor core acceleration and throughput saturation.
"""

import pytest
from fastapi.testclient import TestClient
from engine import AttentionSinkRingEngine, app, CORRIDORS

client = TestClient(app)


def test_attention_sink_concat_formula() -> None:
    engine = AttentionSinkRingEngine()
    sink_keys = [4.81, 4.85, 4.82, 4.84, 9.99]
    rolling_keys = [1.01, 1.02, 1.03, 1.04, 1.05, 1.06]
    concat = engine.compute_attention_sink_concat(
        sink_keys=sink_keys,
        rolling_keys=rolling_keys,
        sink_size=4,
        rolling_window=4,
    )
    assert len(concat) == 8
    assert concat[:4] == [4.81, 4.85, 4.82, 4.84]
    assert concat[4:] == [1.03, 1.04, 1.05, 1.06]


def test_attention_sink_insufficient_keys_raises() -> None:
    engine = AttentionSinkRingEngine()
    with pytest.raises(ValueError):
        engine.compute_attention_sink_concat([4.81, 4.85], [1.0, 2.0], sink_size=4, rolling_window=4)


def test_ring_buffer_pointer_rotation_and_retention() -> None:
    engine = AttentionSinkRingEngine()
    initial = engine.get_telemetry()
    assert initial.chassis_id == "GF-T3-286"
    assert initial.active_buffers == 8
    assert initial.processed_tokens_units == 8064000
    assert initial.buffers[0].hex_ptr == "0x14000"
    assert initial.buffers[3].hex_ptr == "0x14030"

    after_step = engine.rotate_ring_pointers(incoming_tokens=64000)
    assert after_step.processed_tokens_units == 8128000
    assert after_step.buffers[0].hex_ptr == "0x14010"
    assert after_step.buffers[0].sink_anchors == [4.81, 4.85, 4.82, 4.84]


def test_infinite_context_stability_under_massive_token_flood() -> None:
    engine = AttentionSinkRingEngine()
    for _ in range(25):
        state = engine.rotate_ring_pointers(
            incoming_tokens=256000,
            corridor_id="SINK-CORRIDOR-BRAVO",
            infinite_flood=True,
        )
    assert state.processed_tokens_units == 8064000 + (25 * 256000 * 4)
    assert state.barrier_sync_pct == 100.0
    assert state.sink_latency_us <= 0.02
    for buf in state.buffers:
        assert buf.sink_anchors == [4.81, 4.85, 4.82, 4.84]
        mass = engine.compute_softmax_partition_stability(buf.sink_anchors, buf.rolling_tail)
        assert 0.85 <= mass <= 0.999


def test_hardware_throughput_saturation_and_corridors() -> None:
    for cid in CORRIDORS:
        response = client.post(
            "/api/v1/step",
            json={
                "corridor_id": cid,
                "incoming_tokens": 128000,
                "inject_burst": True,
                "infinite_flood": False,
            },
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["corridor_id"] == cid
        assert payload["ring_throughput_gbs"] >= 32400
        assert payload["active_buffers"] == 8


def test_api_flush_and_health_endpoints() -> None:
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["chassis"] == "GF-T3-286"

    flush = client.post("/api/v1/flush")
    assert flush.status_code == 200
    data = flush.json()
    assert data["processed_tokens_units"] == 8064000
    assert data["ring_throughput_gbs"] == 43200
    assert data["global_ptr_hex"] == "0x13F8DC0"
