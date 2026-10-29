"""
Pytest Verification Suite for GF-T3-240 Zero-Copy NCCL P2P Ring Stream Engine
Verifies:
1. Zero-copy buffer staging correctness across GPU peers.
2. Asynchronous CUDA event synchronization and stream dependency ordering.
3. GPUDirect P2P bandwidth saturation under peak payload transfers.
4. GridSync Zero-Trust payload sanitization.
SPDX-License-Identifier: MIT
"""

import pytest
from pydantic import ValidationError
from engine import (
    CorridorProfile,
    IngressActionPayload,
    ZeroCopyNCCLEngine,
    compute_async_event_latency,
    compute_ring_pointer,
    compute_zero_copy_bandwidth,
)


def test_zero_copy_buffer_staging_and_ring_topology() -> None:
    engine = ZeroCopyNCCLEngine()
    snap = engine.snapshot()

    assert snap["engine_id"] == "GF-T3-240"
    assert snap["active_streams"] == 8
    assert snap["total_streams"] == 8

    streams = snap["streams"]
    assert len(streams) == 8

    # Verify full 8-GPU ring topology (GPU_i -> GPU_{(i+1)%8}) and initial deterministic pointers
    for idx, node in enumerate(streams):
        expected_peer = "GPU_" + str((idx + 1) % 8)
        assert node["source_gpu"] == "GPU_" + str(idx)
        assert node["peer_gpu"] == expected_peer
        assert node["buffer_size_mb"] == 64
        assert node["zero_copy_locked"] is True
        assert node["sync_status"] == "✓ LOCKED"

    # Stream 0 is 0x7000 and Stream 3 is 0x7800 at step 0
    assert compute_ring_pointer(0, 0, 64) == "0x7000"
    assert compute_ring_pointer(3, 0, 64) == "0x7800"
    assert snap["inspector_line"] == "STREAM: ST3 · PEER: GPU_4 · SIZE: 64 MB · PTR: 0x7800 · ZERO_COPY_ACTIVE"


def test_asynchronous_cuda_event_stream_synchronization() -> None:
    engine = ZeroCopyNCCLEngine()

    # Baseline sub-microsecond latency on ALPHA corridor
    lat_alpha = compute_async_event_latency(
        CorridorProfile.ALPHA.value,
        active_streams=8,
        link_stall_active=False,
        burst_mode=False,
    )
    assert lat_alpha == 0.03

    # Step zero-copy transfer pass advances ring pointers and pass counters deterministically
    res_step = engine.apply_action(
        IngressActionPayload(action="STEP", corridor=CorridorProfile.ALPHA.value, stream_id=3)
    )
    assert res_step["processed_tokens"] == 1792000 + 128000
    assert res_step["streams"][0]["ring_pointer_hex"] == "0x7010"
    assert res_step["streams"][3]["completed_passes"] == 144

    # Inject NVLink stall forces stream resync on affected ring hops
    res_stall = engine.apply_action(
        IngressActionPayload(action="TOGGLE_STALL", corridor=CorridorProfile.ALPHA.value, stream_id=2)
    )
    assert res_stall["active_streams"] == 6
    assert res_stall["nccl_state"] == "NVLink Stall Resync"
    assert res_stall["streams"][2]["event_marker"] == "STALL_RESYNC"
    assert res_stall["streams"][2]["sync_status"] == "⚡ FAULT"
    assert res_stall["latency_us"] > 0.5


def test_gpudirect_p2p_bandwidth_saturation() -> None:
    # Full 8-stream ALPHA saturation equals 5600.0 GB/s
    bw_nominal = compute_zero_copy_bandwidth(
        CorridorProfile.ALPHA.value,
        active_streams=8,
        buffer_size_mb=64,
        link_stall_active=False,
        burst_mode=False,
    )
    assert bw_nominal == 5600.0

    # P2P Ring Stream Burst boosts saturation
    bw_burst = compute_zero_copy_bandwidth(
        CorridorProfile.ALPHA.value,
        active_streams=8,
        buffer_size_mb=64,
        link_stall_active=False,
        burst_mode=True,
    )
    assert bw_burst == 6300.0

    # Host fallback corridor (DELTA) degrades throughput significantly due to CPU staging
    bw_fallback = compute_zero_copy_bandwidth(
        CorridorProfile.DELTA.value,
        active_streams=8,
        buffer_size_mb=64,
        link_stall_active=False,
        burst_mode=False,
    )
    assert bw_fallback < 1500.0

    # Zero active streams yields 0.0 GB/s
    assert compute_zero_copy_bandwidth(CorridorProfile.ALPHA.value, 0, 64, False, False) == 0.0


def test_gridsync_zero_trust_sanitization_and_queue_flush() -> None:
    engine = ZeroCopyNCCLEngine()
    engine.apply_action(IngressActionPayload(action="BURST"))
    assert engine.burst_mode is True

    # Flush resets queues and re-zeros CUDA events
    flushed = engine.apply_action(IngressActionPayload(action="FLUSH"))
    assert flushed["bandwidth_gbs"] == 5600.0
    assert flushed["latency_us"] == 0.03
    assert flushed["processed_tokens"] == 1792000

    # Malicious SQL/XSS payload is rejected by GridSync validator
    with pytest.raises(ValidationError):
        IngressActionPayload(action="STEP; DROP TABLE streams;--")
