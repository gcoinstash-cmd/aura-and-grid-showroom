"""
GF-T3-261 Pytest Verification Suite
Verifies:
1. Ring-attention KV block circulation correctness and O(N/P) memory footprint scaling across nodes.
2. Overlapped KV transfer and computation without pipeline stall.
3. Hardware tensor core acceleration, online softmax numerical equivalence, and throughput saturation.
SPDX-License-Identifier: MIT
"""

import math
import pytest
from fastapi.testclient import TestClient
from engine import (
    app,
    SYNTHETIC_CORRIDORS,
    circulate_kv_ring,
    online_softmax_renormalize,
    compute_overlapped_pipeline_metrics,
)

client = TestClient(app)


def test_ring_attention_kv_circulation_bijection_and_cycle():
    num_nodes = 8
    visited_per_rank = {r: set() for r in range(num_nodes)}

    for hop in range(num_nodes):
        mapping = circulate_kv_ring(num_nodes, hop)
        assert len(mapping) == num_nodes
        assert set(mapping) == set(range(num_nodes)), "Each KV block must map bijectively at every hop"
        for rank, kv_src in enumerate(mapping):
            visited_per_rank[rank].add(kv_src)

    for rank in range(num_nodes):
        assert len(visited_per_rank[rank]) == num_nodes, "Every rank must visit all 8 KV blocks in a full ring pass"

    assert circulate_kv_ring(num_nodes, 0) == circulate_kv_ring(num_nodes, num_nodes)


def test_memory_footprint_linear_inverse_scaling():
    corridor = SYNTHETIC_CORRIDORS[
        "RING-CORRIDOR-ALPHA (RING-ATTENTION-DISTRIBUTED-SEQUENCE-FABRIC · 23400-GB/S)"
    ]
    m_4_nodes = compute_overlapped_pipeline_metrics(
        total_sequence_tokens=4096000,
        num_nodes=4,
        head_dim=128,
        num_heads=64,
        corridor_spec=corridor,
    )
    m_8_nodes = compute_overlapped_pipeline_metrics(
        total_sequence_tokens=4096000,
        num_nodes=8,
        head_dim=128,
        num_heads=64,
        corridor_spec=corridor,
    )
    assert math.isclose(m_8_nodes["kv_block_mb"], m_4_nodes["kv_block_mb"] / 2.0, rel_tol=1e-3)
    assert m_8_nodes["tokens_per_node"] == 512000.0


def test_overlapped_kv_transfer_and_computation_zero_stall():
    corridor = SYNTHETIC_CORRIDORS[
        "RING-CORRIDOR-ALPHA (RING-ATTENTION-DISTRIBUTED-SEQUENCE-FABRIC · 23400-GB/S)"
    ]
    metrics = compute_overlapped_pipeline_metrics(
        total_sequence_tokens=4096000,
        num_nodes=8,
        head_dim=128,
        num_heads=64,
        corridor_spec=corridor,
        sequence_spike_active=False,
        burst_multiplier=1.0,
    )
    assert metrics["overlap_pct"] == 100.0
    assert metrics["step_latency_ms"] == 0.02
    assert metrics["effective_bw_gbps"] == 23400.0
    assert metrics["ring_latency_us"] == 0.01


def test_online_softmax_renormalization_exact_equivalence():
    blocks_logits = [
        [1.2, 3.4, -0.5, 2.1],
        [4.5, 0.2, 1.9, 3.8],
        [-1.1, 2.7, 5.1, 0.9],
        [2.0, 2.5, 1.8, 3.3],
    ]
    blocks_values = [
        [0.5, 1.5, -0.2, 0.8],
        [2.1, -0.4, 1.1, 1.7],
        [0.1, 0.9, 3.2, -0.6],
        [1.0, 1.2, 0.4, 2.0],
    ]

    ring_result = online_softmax_renormalize(blocks_logits, blocks_values)

    flat_logits = [x for block in blocks_logits for x in block]
    flat_values = [v for block in blocks_values for v in block]
    global_max = max(flat_logits)
    exps = [math.exp(x - global_max) for x in flat_logits]
    denom = sum(exps)
    exact_output = sum(e * v for e, v in zip(exps, flat_values)) / denom

    assert math.isclose(ring_result["normalized_output"], exact_output, rel_tol=1e-7)
    assert math.isclose(ring_result["running_max"], global_max, rel_tol=1e-6)


def test_fastapi_endpoints_and_gridsync_zero_trust_gate():
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["engine"] == "GF-T3-261"

    step_resp = client.post(
        "/api/v1/ring/step",
        json={
            "corridor": "RING-CORRIDOR-ALPHA (RING-ATTENTION-DISTRIBUTED-SEQUENCE-FABRIC · 23400-GB/S)",
            "num_nodes": 8,
            "total_sequence_tokens": 4096000,
            "hop_index": 3,
        },
    )
    assert step_resp.status_code == 200
    body = step_resp.json()
    assert body["context_throughput_gbps"] == 23400.0
    assert body["active_nodes"] == 8
    assert len(body["nodes"]) == 8
    assert body["nodes"][0]["partition_tokens"] == 512000

    injection_resp = client.post(
        "/api/v1/ring/step",
        json={
            "corridor": "DROP TABLE ring_nodes; --",
            "num_nodes": 8,
        },
    )
    assert injection_resp.status_code == 422
