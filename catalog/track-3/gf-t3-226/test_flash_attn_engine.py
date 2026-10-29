"""
GF-T3-226 Pytest Verification Suite
Tests numerical equivalence of Tiled Online Softmax, Zero External Memory Fragmentation,
and Cumulative Attention Score KV Eviction.
"""

import math
from engine import (
    AttentionPassPayload,
    PagedKVCacheAllocator,
    naive_scaled_dot_product_attention,
    tiled_online_softmax_attention,
)


def test_tiled_online_softmax_numerical_equivalence() -> None:
    query = [0.42, -0.18, 0.73, 0.29, -0.55, 0.61, 0.14, -0.37]
    keys = [
        [0.10 + ((i * 3 + j) % 11) * 0.07 - 0.30 for j in range(8)]
        for i in range(32)
    ]
    values = [
        [0.05 + ((i * 5 + j) % 13) * 0.06 - 0.25 for j in range(8)]
        for i in range(32)
    ]

    naive_out, _ = naive_scaled_dot_product_attention(query, keys, values)
    tiled_res = tiled_online_softmax_attention(query, keys, values, tile_size=4)
    tiled_out = tiled_res["output"]

    assert isinstance(tiled_out, list)
    assert len(naive_out) == len(tiled_out)
    for n_val, t_val in zip(naive_out, tiled_out):
        assert math.isclose(n_val, t_val, rel_tol=1e-6, abs_tol=1e-7)


def test_zero_external_fragmentation_irregular_sequences() -> None:
    allocator = PagedKVCacheAllocator(total_blocks=16, page_size=16)

    res_a = allocator.allocate_sequence_tokens("SEQ-ALPHA", 23, [0.91, 0.84])
    res_b = allocator.allocate_sequence_tokens("SEQ-BRAVO", 37, [0.45, 0.62, 0.77])
    res_c = allocator.allocate_sequence_tokens("SEQ-CHARLIE", 19, [0.51, 0.88])

    assert res_a["external_fragmentation_pct"] == 0.0
    assert res_b["external_fragmentation_pct"] == 0.0
    assert res_c["external_fragmentation_pct"] == 0.0
    assert allocator.compute_external_fragmentation_pct() == 0.0

    # Allocate additional tokens to SEQ-ALPHA; should fill tail page before new page
    tail_before = allocator.page_table["SEQ-ALPHA"][-1]
    assert allocator.blocks[tail_before].allocated_tokens == 7
    allocator.allocate_sequence_tokens("SEQ-ALPHA", 5, [0.93])
    assert allocator.blocks[tail_before].allocated_tokens == 12


def test_kv_eviction_drops_lowest_magnitude_attention_blocks() -> None:
    allocator = PagedKVCacheAllocator(total_blocks=8, page_size=16)
    scores = [0.85, 0.12, 0.67, 0.09, 0.94, 0.41, 0.72, 0.33]
    allocator.allocate_sequence_tokens("SEQ-LONG", 8 * 16, scores)

    evicted = allocator.evict_lowest_attention_blocks(count=2)
    # Block 3 has score 0.09 and Block 1 has score 0.12
    assert evicted == [3, 1]
    assert allocator.blocks[3].status_code == "FREE"
    assert allocator.blocks[1].status_code == "FREE"


def test_gridsync_zero_trust_validation() -> None:
    valid = AttentionPassPayload(
        corridor="KV-CORRIDOR-ALPHA (PAGED-CHUNK-16B · DYNAMIC-ACCUMULATOR)",
        query_vector=[0.1, 0.2, 0.3, 0.4],
        key_blocks=[[0.1, 0.2, 0.3, 0.4]],
        value_blocks=[[0.5, 0.6, 0.7, 0.8]],
        tile_size=4,
    )
    assert valid.tile_size == 4

    caught = False
    try:
        AttentionPassPayload(
            corridor="KV-CORRIDOR-ALPHA; DROP TABLE kv_blocks;",
            query_vector=[0.1, 0.2, 0.3, 0.4],
            key_blocks=[[0.1, 0.2, 0.3, 0.4]],
            value_blocks=[[0.5, 0.6, 0.7, 0.8]],
        )
    except ValueError:
        caught = True
    assert caught is True
