"""
Pytest verification suite for GF-T3-255 Grouped-Query Attention & KV Cache Compression Engine.
Verifies:
1. Grouped-query attention key-value sharing ratio correctness and head allocation accuracy.
2. Temporal eviction pooling and memory footprint reduction during heavy context loads.
3. Hardware tensor core acceleration, scaled dot-product attention invariants, and throughput saturation.
4. Zero-Dollar Gate compliance across telemetry payloads.
"""

import json
import math
import pytest
from fastapi.testclient import TestClient

from engine import (
    CORRIDORS,
    GQACompressionFabricEngine,
    GQAConfigPayload,
    app,
    calculate_kv_cache_footprint_bytes,
    compute_gqa_head_sharing_ratio,
    compute_scaled_dot_product_attention_scores,
    evaluate_temporal_eviction_pool,
)

client = TestClient(app)


def test_gqa_head_sharing_ratio_and_allocation():
    ratio = compute_gqa_head_sharing_ratio(query_heads=64, kv_heads=8)
    assert ratio == 8

    ratio_fallback = compute_gqa_head_sharing_ratio(query_heads=64, kv_heads=64)
    assert ratio_fallback == 1

    with pytest.raises(ValueError):
        compute_gqa_head_sharing_ratio(query_heads=64, kv_heads=0)

    with pytest.raises(ValueError):
        compute_gqa_head_sharing_ratio(query_heads=60, kv_heads=8)

    engine = GQACompressionFabricEngine()
    snapshot = engine.build_snapshot()
    assert snapshot.engine_id == "GF-T3-255"
    assert len(snapshot.heads) == 8
    for idx, head in enumerate(snapshot.heads):
        assert head.head_index == idx
        assert head.gqa_sharing_str == "8:1"
        assert len(head.shared_query_group) == 8
        assert head.shared_query_group[0] == idx * 8
        assert head.shared_query_group[-1] == idx * 8 + 7


def test_temporal_eviction_pooling_and_footprint_reduction():
    importances = [0.95, 0.12, 0.88, 0.15, 0.91, 0.09, 0.84, 0.11]
    ages = [2, 50, 4, 45, 1, 60, 3, 55]
    result = evaluate_temporal_eviction_pool(
        token_Importances=importances,
        token_ages=ages,
        decay_lambda=0.05,
        keep_ratio=0.25,
    )
    assert result["retained_count"] == 2
    assert result["evicted_count"] == 6
    assert result["compaction_ratio"] == 4.0
    assert result["eviction_rate_pct"] == 75.0
    assert 0 in result["retained_indices"]
    assert 4 in result["retained_indices"]

    footprint = calculate_kv_cache_footprint_bytes(
        batch_size=2,
        sequence_length=32768,
        num_layers=32,
        kv_heads=8,
        head_dim=128,
        bytes_per_element=2,
        compaction_ratio=4.0,
    )
    assert footprint["raw_bytes"] == 4.0 * footprint["compressed_bytes"]
    assert footprint["saved_pct"] == 75.0


def test_scaled_dot_product_attention_and_throughput_saturation():
    query = [1.0, 0.5, -0.5, 0.25]
    keys = [
        [1.0, 0.5, -0.5, 0.25],
        [-1.0, -0.5, 0.5, -0.25],
        [0.1, 0.2, 0.1, 0.0],
    ]
    probs = compute_scaled_dot_product_attention_scores(query, keys, head_dim=64)
    assert len(probs) == 3
    assert math.isclose(sum(probs), 1.0, rel_tol=1e-6)
    assert probs[0] > probs[2] > probs[1]


def test_api_endpoints_and_zero_dollar_gate():
    res_init = client.get("/api/v1/telemetry")
    assert res_init.status_code == 200
    body_text = json.dumps(res_init.json())
    assert chr(36) not in body_text
    data = res_init.json()
    assert data["engine_id"] == "GF-T3-255"
    assert data["compression_throughput_gbs"] == 17400.0
    assert data["compaction_ratio"] == 4.0

    res_burst = client.post("/api/v1/actions/compression-burst")
    assert res_burst.status_code == 200
    burst_data = res_burst.json()
    assert burst_data["compression_throughput_gbs"] > 17400.0
    assert burst_data["processed_tokens"] == 3840000

    res_spike = client.post("/api/v1/actions/eviction-spike")
    assert res_spike.status_code == 200
    spike_data = res_spike.json()
    assert spike_data["eviction_spike_active"] is True
    assert spike_data["active_heads"] == 6

    res_step = client.post("/api/v1/actions/step-pass")
    assert res_step.status_code == 200

    res_corridor = client.post(
        "/api/v1/corridor",
        json={
            "corridor_key": "GAMMA",
            "query_heads": 64,
            "kv_heads": 8,
            "sequence_length": 32768,
            "head_dim": 128,
        },
    )
    assert res_corridor.status_code == 200
    assert "GQA-CORRIDOR-GAMMA" in res_corridor.json()["corridor"]

    res_flush = client.post("/api/v1/actions/flush-buffers")
    assert res_flush.status_code == 200
    flush_data = res_flush.json()
    assert flush_data["eviction_spike_active"] is False
    assert flush_data["processed_tokens"] == 3712000
    assert chr(36) not in json.dumps(flush_data)
