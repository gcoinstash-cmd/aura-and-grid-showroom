"""
GF-T3-227: Automated Pytest Verification Suite
Verifies:
1. Exact prefix matching correctness and LCP token reuse.
2. Tree attention mask numerical parity with linear sequential attention.
3. Eviction policy correctly prunes lowest-frequency leaf nodes under token constraints.
"""

from engine import (
    CORRIDOR_PROFILES,
    PrefixMatchRequest,
    RadixPrefixCache,
    compute_lcp_length,
    compute_tree_vs_linear_attention_parity,
    health_check,
    match_or_insert_prefix,
)


def test_exact_lcp_prefix_matching_and_edge_splitting() -> None:
    cache = RadixPrefixCache(max_cached_tokens=512)
    root_tokens = [101, 2054, 2003, 1996, 3928, 4007]

    # Insert Branch A sharing the root prefix
    branch_a_tokens = root_tokens + [5001, 5002, 5003, 5004]
    node_a, reused_a = cache.insert_sequence(branch_a_tokens, label="Turn 1 Query A", tier="BRANCH")
    assert reused_a == len(root_tokens)
    assert node_a.token_length() == 4

    # Query with a sequence that shares Root + first 2 tokens of Branch A, then diverges
    divergent_tokens = root_tokens + [5001, 5002, 9001, 9002]
    path_ids, matched_len, deepest = cache.match_prefix(divergent_tokens)
    assert matched_len == len(root_tokens) + 2
    assert path_ids[0] == "NODE-ROOT-00"
    assert deepest.node_id == node_a.node_id

    # Insert the divergent sequence and verify edge splitting occurred cleanly
    node_b, reused_b = cache.insert_sequence(divergent_tokens, label="Turn 1 Query B", tier="LEAF")
    assert reused_b == len(root_tokens) + 2
    assert node_b.tokens == [9001, 9002]
    assert compute_lcp_length([1, 2, 3, 4], [1, 2, 9, 10]) == 2


def test_tree_attention_mask_numerical_parity_with_sequential_attention() -> None:
    cache = RadixPrefixCache(max_cached_tokens=512)
    root_tokens = list(cache.root.tokens)

    # Create a multi-branch speculative tree:
    # Root (idx 0) -> Branch 1 (idx 1) -> Leaf 1A (idx 2)
    #                                  -> Leaf 1B (idx 3)
    b1, _ = cache.insert_sequence(root_tokens + [10, 11], label="Branch 1", tier="BRANCH")
    l1a, _ = cache.insert_sequence(root_tokens + [10, 11, 21], label="Leaf 1A", tier="LEAF")
    l1b, _ = cache.insert_sequence(root_tokens + [10, 11, 22], label="Leaf 1B", tier="LEAF")

    ordered_ids = [cache.root.node_id, b1.node_id, l1a.node_id, l1b.node_id]
    _, mask = cache.build_tree_attention_mask(ordered_ids)

    # Leaf 1A (index 2) must attend to Root (0), Branch 1 (1), and Leaf 1A (2), NOT Leaf 1B (3)
    assert mask[2] == [1, 1, 1, 0]
    # Leaf 1B (index 3) must attend to Root (0), Branch 1 (1), and Leaf 1B (3), NOT Leaf 1A (2)
    assert mask[3] == [1, 1, 0, 1]

    q_vecs = [
        [0.4, -0.2, 0.7, 0.1],
        [0.3, 0.5, -0.1, 0.8],
        [-0.5, 0.9, 0.2, 0.6],
        [0.8, -0.4, 0.3, -0.7],
    ]
    k_vecs = [
        [0.5, 0.1, 0.6, -0.2],
        [-0.3, 0.7, 0.2, 0.4],
        [0.2, 0.8, -0.5, 0.3],
        [0.9, -0.9, 0.4, 0.1],
    ]
    v_vecs = [
        [1.0, 0.2, -0.4, 0.5],
        [0.3, -0.6, 0.8, 0.1],
        [-0.2, 0.9, 0.3, -0.7],
        [4.5, -3.2, 2.1, 8.0],
    ]

    # Check numerical parity for Path Root -> Branch 1 -> Leaf 1A (indices [0, 1, 2])
    tree_out_a, lin_out_a, max_diff_a = compute_tree_vs_linear_attention_parity(
        q_vecs, k_vecs, v_vecs, mask, [0, 1, 2]
    )
    assert max_diff_a < 1e-12
    assert len(tree_out_a) == len(lin_out_a) == 4

    # Check numerical parity for Path Root -> Branch 1 -> Leaf 1B (indices [0, 1, 3])
    _, _, max_diff_b = compute_tree_vs_linear_attention_parity(
        q_vecs, k_vecs, v_vecs, mask, [0, 1, 3]
    )
    assert max_diff_b < 1e-12


def test_lru_eviction_prunes_lowest_frequency_leaves_preserving_pinned_root() -> None:
    cache = RadixPrefixCache(max_cached_tokens=64)
    root_tokens = list(cache.root.tokens)

    # Insert 3 branches with different access frequencies
    hot_seq = root_tokens + [100, 101, 102, 103, 104]
    warm_seq = root_tokens + [200, 201, 202, 203, 204]
    cold_seq = root_tokens + [300, 301, 302, 303, 304]

    hot_node, _ = cache.insert_sequence(hot_seq, label="Hot Leaf", tier="LEAF")
    warm_node, _ = cache.insert_sequence(warm_seq, label="Warm Leaf", tier="LEAF")
    cold_node, _ = cache.insert_sequence(cold_seq, label="Cold Leaf", tier="LEAF")

    # Touch hot_node 5 times and warm_node 2 times; leave cold_node untouched
    for _ in range(5):
        cache.match_prefix(hot_seq)
    for _ in range(2):
        cache.match_prefix(warm_seq)

    # Evict down to 16 tokens (Root=6 + Hot=5 + Warm=5 = 16 tokens)
    evicted = cache.evict_lru(target_tokens=16)
    assert cold_node.node_id in evicted
    assert hot_node.node_id in cache.nodes
    assert warm_node.node_id in cache.nodes
    assert cache.root.node_id in cache.nodes


def test_fastapi_endpoints_and_corridors() -> None:
    status = health_check()
    assert status["engine"] == "GF-T3-227"
    assert len(CORRIDOR_PROFILES) == 4

    req = PrefixMatchRequest(
        corridor="TREE-CORRIDOR-ALPHA (RADIX-TREE-LCP · DYNAMIC-PRUNING)",
        prompt_tokens=[101, 2054, 2003, 1996, 3928, 4007, 777, 888],
        insert_on_miss=True,
        label="Endpoint Test Branch",
    )
    res = match_or_insert_prefix(req)
    assert res["engine"] == "GF-T3-227"
    assert int(res["lcp_matched_tokens"]) >= 6
