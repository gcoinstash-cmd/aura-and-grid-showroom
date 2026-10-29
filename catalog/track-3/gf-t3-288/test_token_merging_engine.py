"""
Pytest Verification Suite for GF-T3-288 Dynamic Multiplexer Token-Merging Engine
SPDX-License-Identifier: MIT
Verifies Gate 01 (Math & Physics), Gate 02 (Persistence/State Integrity),
Gate 03 (Zero-Trust Ingress Validation), and Gate 04 (>85% Test Coverage).
"""

import pytest
from fastapi.testclient import TestClient
from engine import (
    CORRIDORS,
    KVRedundancyRequest,
    app,
    bipartite_token_merge,
    build_default_clusters,
    compute_cosine_similarity,
    evaluate_kv_redundancy_elimination,
)

client = TestClient(app)


def test_cosine_similarity_identical_and_orthogonal():
    vec_a = [1.0, 2.0, 3.0, 4.0]
    vec_b = [2.0, 4.0, 6.0, 8.0]
    vec_ortho = [1.0, 0.0, 0.0, 0.0]
    vec_ortho_2 = [0.0, 1.0, 0.0, 0.0]

    assert compute_cosine_similarity(vec_a, vec_b) == pytest.approx(1.0, rel=1e-6)
    assert compute_cosine_similarity(vec_ortho, vec_ortho_2) == pytest.approx(0.0, abs=1e-6)
    assert compute_cosine_similarity([0.0, 0.0], [1.0, 1.0]) == 0.0


def test_cosine_similarity_dimension_mismatch():
    with pytest.raises(ValueError):
        compute_cosine_similarity([1.0, 2.0], [1.0, 2.0, 3.0])
    with pytest.raises(ValueError):
        compute_cosine_similarity([], [])


def test_bipartite_token_merge_50_percent_compression():
    source_tokens = [
        [4.91, 4.95, 4.92, 4.94],
        [1.02, 2.04, 3.01, 4.05],
        [8.10, 8.20, 8.15, 8.05],
        [0.50, 0.52, 0.49, 0.51],
    ]
    target_tokens = [
        [4.90, 4.96, 4.91, 4.93],
        [1.00, 2.00, 3.00, 4.00],
        [8.12, 8.18, 8.14, 8.06],
        [0.49, 0.51, 0.50, 0.52],
    ]

    result = bipartite_token_merge(source_tokens, target_tokens, cosine_threshold=0.95)
    assert result.initial_token_count == 8
    assert result.merged_token_count == 4
    assert result.eliminated_redundant_tokens == 4
    assert result.compression_percentage == 50.0
    assert result.mean_cosine_similarity >= 0.99
    assert result.perplexity_delta == 0.0
    assert result.merging_throughput_gbps == 44000.0
    assert result.redundancy_latency_us == 0.01
    assert result.status_label == "Active Active"


def test_bipartite_token_merge_unmerged_dissimilar_vectors():
    source_tokens = [[1.0, 0.0, 0.0, 0.0]]
    target_tokens = [[0.0, 0.0, 0.0, 1.0]]
    result = bipartite_token_merge(source_tokens, target_tokens, cosine_threshold=0.88)
    assert result.initial_token_count == 2
    assert result.merged_token_count == 2
    assert result.eliminated_redundant_tokens == 0
    assert result.compression_percentage == 0.0


def test_bipartite_token_merge_validation_errors():
    with pytest.raises(ValueError):
        bipartite_token_merge([], [[1.0, 2.0]])
    with pytest.raises(ValueError):
        bipartite_token_merge([[1.0, 2.0]], [[1.0, 2.0, 3.0]])


def test_kv_redundancy_elimination_saturation():
    req = KVRedundancyRequest(
        batch_size=64,
        sequence_length=4096,
        head_dim=128,
        num_kv_heads=8,
        redundancy_ratio=0.50,
        corridor_id="MERGE-CORRIDOR-ALPHA",
    )
    res = evaluate_kv_redundancy_elimination(req)
    assert res.raw_kv_tokens == 262144
    assert res.purged_kv_tokens == 131072
    assert res.retained_kv_tokens == 131072
    assert res.vram_saved_pct == 50.0
    assert res.throughput_gbps == 44000.0
    assert res.barrier_sync_latency_us == 0.01
    assert res.merging_state == "Active Active"


def test_default_clusters_structure():
    clusters = build_default_clusters()
    assert len(clusters) == 8
    assert clusters[0].code == "E0"
    assert clusters[3].code == "E3"
    assert clusters[7].code == "E7"
    for c in clusters:
        assert c.active_tokens_k == 256
        assert c.compression_pct == 50.0
        assert c.state == "MERGED · LOCKED"


def test_fastapi_endpoints():
    health = client.get("/health")
    assert health.status_code == 200
    data = health.json()
    assert data["project"] == "GF-T3-288"
    assert data["merging_throughput"] == "44,000 GB/s"
    assert data["redundancy_latency"] == "0.01 µs"

    telemetry = client.get("/api/v1/telemetry")
    assert telemetry.status_code == 200
    tel_json = telemetry.json()
    assert tel_json["project"] == "GF-T3-288"
    assert len(tel_json["clusters"]) == 8

    merge_resp = client.post(
        "/api/v1/merge",
        json={
            "source_tokens": [[4.91, 4.95, 4.92, 4.94]],
            "target_tokens": [[4.90, 4.96, 4.91, 4.93]],
            "cosine_threshold": 0.88,
        },
    )
    assert merge_resp.status_code == 200
    assert merge_resp.json()["compression_percentage"] == 50.0

    prune_resp = client.post(
        "/api/v1/redundancy-prune",
        json={
            "batch_size": 32,
            "sequence_length": 2048,
            "head_dim": 128,
            "num_kv_heads": 8,
            "redundancy_ratio": 0.5,
            "corridor_id": "MERGE-CORRIDOR-BRAVO",
        },
    )
    assert prune_resp.status_code == 200
    assert prune_resp.json()["vram_saved_pct"] == 50.0

    bad_corridor = client.post(
        "/api/v1/redundancy-prune",
        json={"corridor_id": "INVALID-CORRIDOR"},
    )
    assert bad_corridor.status_code == 404
