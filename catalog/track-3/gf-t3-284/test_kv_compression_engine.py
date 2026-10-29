"""
Pytest Verification Suite for GF-T3-284
Verifies Gate 01 through Gate 04:
1. Quantized KV-cache block merging and SVD compression error bounds correctness.
2. Asynchronous block compaction efficiency and massive context scaling under load.
3. Hardware tensor core acceleration and throughput saturation.
SPDX-License-Identifier: MIT
"""

import pytest
from fastapi.testclient import TestClient
from engine import (
    app,
    CORRIDORS,
    SVDReductionEngine,
    CompressionStepRequest,
)

client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["engine"] == "GF-T3-284"
    assert payload["status"] == "ACTIVE_ACTIVE"
    assert payload["mode"] == "KV_COMPRESSION"


def test_svd_compression_error_bounds_correctness() -> None:
    bound_4x = SVDReductionEngine.compute_svd_error_bound(rank_factor=0.25, quant_bits=4)
    assert 0.0 < bound_4x <= 0.005

    bound_uncompressed = SVDReductionEngine.compute_svd_error_bound(rank_factor=1.0, quant_bits=16)
    assert bound_uncompressed == 0.0

    with pytest.raises(ValueError):
        SVDReductionEngine.compute_svd_error_bound(rank_factor=0.0, quant_bits=4)

    with pytest.raises(ValueError):
        SVDReductionEngine.compute_svd_error_bound(rank_factor=0.25, quant_bits=1)


def test_quantized_kv_block_merging_quadruples_capacity() -> None:
    blocks = SVDReductionEngine.merge_kv_blocks(
        raw_tokens_k=64,
        compression_ratio=4.0,
        block_count=8,
        overload_spike=False,
    )
    assert len(blocks) == 8
    assert blocks[0].code == "C0"
    assert blocks[0].hex_ptr == "0x12000"
    assert blocks[3].code == "C3"
    assert blocks[3].hex_ptr == "0x12030"
    for blk in blocks:
        assert blk.tokens_k == 256
        assert blk.compression_ratio == 4.0
        assert blk.latency_ms == 0.02
        assert blk.state_label == "COMPRESSED · LOCKED"
        assert blk.svd_error_bound < 0.005


def test_asynchronous_block_compaction_and_context_overload_scaling() -> None:
    overload_blocks = SVDReductionEngine.merge_kv_blocks(
        raw_tokens_k=64,
        compression_ratio=4.0,
        block_count=8,
        overload_spike=True,
    )
    assert len(overload_blocks) == 8
    assert overload_blocks[0].tokens_k == 320
    assert overload_blocks[0].compression_ratio == 5.0
    assert overload_blocks[1].state_label == "COMPACTING · SYNC"

    compaction = SVDReductionEngine.compact_memory_arenas(
        fragmented_arenas_mb=[512.0, 1024.0, 256.0, 256.0],
        streaming_multiprocessors=132,
    )
    assert compaction["total_input_mb"] == 2048.0
    assert compaction["reclaimed_mb"] == 1536.0
    assert compaction["compacted_footprint_mb"] == 512.0
    assert compaction["compaction_efficiency_pct"] == 75.0
    assert compaction["ring_sync_latency_us"] <= 0.01
    assert compaction["host_cpu_stalls"] == 0.0


def test_hardware_tensor_core_throughput_and_api_corridors() -> None:
    res_alpha = client.get("/api/v1/telemetry?corridor=COMP-CORRIDOR-ALPHA")
    assert res_alpha.status_code == 200
    data_alpha = res_alpha.json()
    assert data_alpha["engine_id"] == "GF-T3-284"
    assert data_alpha["compression_throughput_gbs"] == 41600.0
    assert data_alpha["compaction_latency_us"] == 0.01
    assert data_alpha["active_blocks"] == 8
    assert data_alpha["compression_state"] == "Active Active"
    assert len(data_alpha["blocks"]) == 8

    for corridor_key in CORRIDORS:
        step_res = client.post(
            "/api/v1/compress",
            json={
                "corridor": corridor_key,
                "raw_tokens_per_block_k": 64,
                "quantization_bits": 4,
                "overload_spike": False,
            },
        )
        assert step_res.status_code == 200
        step_json = step_res.json()
        assert step_json["engine_id"] == "GF-T3-284"

    compact_res = client.post("/api/v1/compact", json=[256.0, 256.0, 512.0])
    assert compact_res.status_code == 200
    assert compact_res.json()["host_cpu_stalls"] == 0.0

    flush_res = client.post("/api/v1/flush")
    assert flush_res.status_code == 200
    assert flush_res.json()["processed_tokens_units"] == 7808000
