"""
Pytest Verification Suite for GF-T3-264
Verifies:
1. Asynchronous stream execution concurrency and non-blocking event synchronization correctness.
2. Memory bandwidth separation between prefill and decode passes under heavy load.
3. Hardware tensor core acceleration and throughput saturation.
SPDX-License-Identifier: MIT
"""

import pytest
from fastapi.testclient import TestClient
from engine import (
    CorridorId,
    DualStreamAsyncEngine,
    StreamMode,
    StreamState,
    app,
)

client = TestClient(app)


def test_initial_dual_stream_concurrency_and_event_sync() -> None:
    engine = DualStreamAsyncEngine()
    snapshot = engine.recalculate_fabric()

    assert snapshot.engine_id == "GF-T3-264"
    assert snapshot.active_streams == 8
    assert snapshot.total_streams == 8
    assert snapshot.throughput_gbs == 25600.0
    assert snapshot.sync_latency_us == 0.01
    assert snapshot.buffer_parity_pct == 100.0

    for stream in snapshot.streams:
        assert stream.state == StreamState.LOCKED
        assert stream.event_Wait_cycles == 0
        assert stream.kv_transfer_us == 0.01
        assert stream.latency_ms == 0.02


def test_memory_bandwidth_separation_prefill_vs_decode() -> None:
    engine = DualStreamAsyncEngine()
    snapshot = engine.recalculate_fabric()

    prefill_streams = [s for s in snapshot.streams if s.mode == StreamMode.PREFILL]
    decode_streams = [s for s in snapshot.streams if s.mode == StreamMode.DECODE]
    dual_streams = [s for s in snapshot.streams if s.mode == StreamMode.DUAL_ASYNC]

    assert len(prefill_streams) >= 2
    assert len(decode_streams) >= 2
    assert len(dual_streams) == 2

    for p_stream in prefill_streams:
        assert p_stream.prefill_bw_gbs > p_stream.decode_bw_gbs

    for d_stream in decode_streams:
        assert d_stream.decode_bw_gbs > d_stream.prefill_bw_gbs


def test_hardware_tensor_core_burst_and_throughput_saturation() -> None:
    engine = DualStreamAsyncEngine()
    burst_snap = engine.trigger_burst(intensity=1.25)

    assert burst_snap.throughput_gbs >= 25600.0
    assert burst_snap.processed_tokens == 5376000
    assert burst_snap.engine_xp_k == 87.5
    assert all(s.state == StreamState.LOCKED for s in burst_snap.streams)


def test_stream_desync_spike_and_event_recalibration() -> None:
    engine = DualStreamAsyncEngine()
    fault_snap = engine.toggle_desync_spike()

    assert fault_snap.active_streams == 6
    assert fault_snap.sync_latency_us > 0.01
    assert fault_snap.buffer_parity_pct < 100.0
    desynced = [s for s in fault_snap.streams if s.state == StreamState.DESYNC]
    assert len(desynced) == 2

    recovered_snap = engine.step_interleave_pass()
    assert recovered_snap.active_streams == 8
    assert recovered_snap.sync_latency_us == 0.01
    assert recovered_snap.buffer_parity_pct == 100.0


def test_fastapi_endpoints_and_gridsync_sanitization() -> None:
    res_health = client.get("/api/health")
    assert res_health.status_code == 200
    assert res_health.json()["engine"] == "GF-T3-264"

    res_burst = client.post(
        "/api/action",
        json={
            "action": "BURST",
            "corridor": CorridorId.ALPHA.value,
            "intensity_factor": 1.2,
        },
    )
    assert res_burst.status_code == 200
    assert res_burst.json()["active_streams"] == 8

    res_malicious = client.post(
        "/api/action",
        json={
            "action": "BURST; DROP TABLE streams;",
            "corridor": CorridorId.ALPHA.value,
        },
    )
    assert res_malicious.status_code == 422

    res_flush = client.post(
        "/api/action",
        json={"action": "FLUSH", "corridor": CorridorId.ALPHA.value},
    )
    assert res_flush.status_code == 200
    assert res_flush.json()["processed_tokens"] == 4864000
