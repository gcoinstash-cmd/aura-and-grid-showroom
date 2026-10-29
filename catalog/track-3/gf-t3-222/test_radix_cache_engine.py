"""
Pytest Verification Suite for GF-T3-222 Radix KV-Cache Engine
Verifies:
1. Exact token prefix matching and dynamic sub-tree splitting.
2. Zero-leak reference counting during concurrent sequence completion.
3. Strict LRU eviction order when node capacity is saturated.
"""

import time
import pytest
from fastapi.testclient import TestClient
from engine import RadixCacheEngine, app


def test_exact_prefix_matching_and_subtree_splitting() -> None:
    cache = RadixCacheEngine(max_cached_tokens=4096)

    # Insert shared root system prompt + Turn 1A
    seq_a = [101, 102, 103, 104, 201, 202]
    res_a = cache.insert_sequence("seq-alpha", seq_a, corridor="RADIX-CORRIDOR-ALPHA")
    assert res_a.matched_length == 0
    assert cache.total_cached_tokens == 6

    # Insert branching multi-turn sequence sharing [101, 102, 103, 104]
    seq_b = [101, 102, 103, 104, 301, 302, 303]
    res_b = cache.insert_sequence("seq-bravo", seq_b, corridor="RADIX-CORRIDOR-BRAVO")

    # Verify exact prefix match of 4 tokens and edge split
    assert res_b.matched_length == 4
    assert res_b.matched_tokens == [101, 102, 103, 104]
    assert res_b.unmatched_tokens == [301, 302, 303]
    # Total unique cached tokens: 4 (shared prefix) + 2 (branch A) + 3 (branch B) = 9
    assert cache.total_cached_tokens == 9
    # Root + shared upper node + leaf A + leaf B = 4 nodes
    assert len(cache.nodes_by_id) == 4


def test_zero_leak_reference_counting_concurrent_completion() -> None:
    cache = RadixCacheEngine(max_cached_tokens=4096)

    root_prompt = [10, 20, 30, 40]
    branch_1 = root_prompt + [51, 52]
    branch_2 = root_prompt + [61, 62]
    branch_3 = root_prompt + [61, 77]

    cache.insert_sequence("seq-1", branch_1)
    cache.insert_sequence("seq-2", branch_2)
    cache.insert_sequence("seq-3", branch_3)

    # Identify shared root child node starting with token 10
    shared_node = cache.root.children[10]
    assert shared_node.ref_count == 3

    # Release all active sequences and verify zero reference leaks
    cache.release_sequence("seq-1")
    assert shared_node.ref_count == 2

    cache.release_sequence("seq-2")
    assert shared_node.ref_count == 1

    cache.release_sequence("seq-3")
    assert shared_node.ref_count == 0

    for node in cache.nodes_by_id.values():
        if node.node_id != cache.root.node_id:
            assert node.ref_count == 0


def test_strict_lru_eviction_order_under_saturation() -> None:
    cache = RadixCacheEngine(max_cached_tokens=10)

    # Insert three unreferenced sequences with deterministic access timestamps
    cache.insert_sequence("s1", [1, 2, 3], retain_reference=True)
    cache.release_sequence("s1")
    node_1 = cache.root.children[1]
    node_1.last_access_ns = 1000

    cache.insert_sequence("s2", [4, 5, 6], retain_reference=True)
    cache.release_sequence("s2")
    node_2 = cache.root.children[4]
    node_2.last_access_ns = 2000

    # Keep s3 referenced so it cannot be evicted even if older
    cache.insert_sequence("s3", [7, 8, 9], retain_reference=True)
    node_3 = cache.root.children[7]
    node_3.last_access_ns = 500

    assert cache.total_cached_tokens == 9

    # Insert s4 of length 4 -> requires freeing 3 tokens (9 + 4 = 13 > 10)
    # s3 has ref_count=1 (protected), s1 has oldest timestamp (1000) among unreferenced leaves
    cache.insert_sequence("s4", [11, 12, 13, 14], retain_reference=False)

    assert 1 not in cache.root.children
    assert 4 in cache.root.children
    assert 7 in cache.root.children
    assert cache.total_cached_tokens == 10


def test_fastapi_endpoints() -> None:
    client = TestClient(app)
    health_resp = client.get("/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["engine"] == "GF-T3-222"

    ins_resp = client.post(
        "/v1/radix/insert",
        json={
            "sequence_id": "api-seq-01",
            "tokens": [501, 502, 503, 504],
            "corridor": "RADIX-CORRIDOR-ALPHA",
            "retain_reference": True,
        },
    )
    assert ins_resp.status_code == 200
    rel_resp = client.post("/v1/radix/release", json={"sequence_id": "api-seq-01"})
    assert rel_resp.status_code == 200

    evict_resp = client.post("/v1/radix/evict", json={"target_tokens_to_free": 4})
    assert evict_resp.status_code == 200
    assert evict_resp.json()["freed_token_units"] >= 4
