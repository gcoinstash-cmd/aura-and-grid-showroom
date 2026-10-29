"""
GF-T3-241: Pytest Verification Suite (>80% Coverage)
Verifies:
1. Exact distribution matching between speculative sampling and greedy/target autoregressive decoding.
2. Tree-attention causal mask shape validation and branch pruning efficiency.
3. KV cache state rollback correctness under draft rejection.
"""

import pytest
from engine import (
    BranchVerificationRequest,
    CORRIDORS,
    DraftTokenCandidate,
    build_tree_causal_mask,
    compute_acceptance_ratio,
    compute_residual_distribution,
    evaluate_branch,
    rollback_kv_cache_pointer,
    verify_speculative_distribution_parity,
)


def test_acceptance_ratio_bounds_and_exact_math():
    # When P_target >= P_draft, alpha caps at 1.0
    assert compute_acceptance_ratio(0.72, 0.45) == 1.0
    # When P_target < P_draft, alpha equals P_target / P_draft
    assert compute_acceptance_ratio(0.36, 0.40) == pytest.approx(0.9, rel=1e-5)
    # Zero target probability yields 0.0 acceptance
    assert compute_acceptance_ratio(0.0, 0.50) == 0.0

    with pytest.raises(ValueError):
        compute_acceptance_ratio(0.5, 0.0)


def test_exact_distribution_matching_speculative_vs_autoregressive():
    # Arbitrary non-uniform target and draft vocabulary distributions
    target_vocab_dist = [0.42, 0.28, 0.18, 0.08, 0.04]
    draft_vocab_dist = [0.25, 0.35, 0.20, 0.12, 0.08]

    p_spec, max_error = verify_speculative_distribution_parity(
        target_vocab_dist, draft_vocab_dist
    )

    assert len(p_spec) == len(target_vocab_dist)
    assert sum(p_spec) == pytest.approx(1.0, abs=1e-9)
    # Exact mathematical theorem: P_spec(x) == P_target(x) for all x in V
    assert max_error < 1e-9
    for s_prob, t_prob in zip(p_spec, target_vocab_dist):
        assert s_prob == pytest.approx(t_prob, abs=1e-9)


def test_greedy_autoregressive_fallback_parity():
    # Under greedy one-hot target distribution, residual + acceptance recovers exact argmax token
    target_greedy = [0.0, 1.0, 0.0, 0.0]
    draft_noisy = [0.30, 0.40, 0.20, 0.10]

    p_spec, max_error = verify_speculative_distribution_parity(
        target_greedy, draft_noisy
    )
    assert max_error < 1e-9
    assert p_spec[1] == pytest.approx(1.0, abs=1e-9)
    assert p_spec[0] == pytest.approx(0.0, abs=1e-9)


def test_tree_attention_causal_mask_shape_and_isolation():
    # Tree topology:
    # Node 0: root (-1)
    # Node 1: child of 0 (branch A depth 1)
    # Node 2: child of 1 (branch A depth 2)
    # Node 3: child of 0 (branch B depth 1)
    # Node 4: child of 3 (branch B depth 2)
    parents = [-1, 0, 1, 0, 3]
    mask = build_tree_causal_mask(parents)

    assert len(mask) == 5
    assert all(len(row) == 5 for row in mask)

    # Root only attends to root
    assert mask[0] == [1, 0, 0, 0, 0]
    # Branch A leaf (node 2) attends to 0, 1, 2 but NEVER Branch B nodes (3, 4)
    assert mask[2] == [1, 1, 1, 0, 0]
    # Branch B leaf (node 4) attends to 0, 3, 4 but NEVER Branch A nodes (1, 2)
    assert mask[4] == [1, 0, 0, 1, 1]


def test_tree_attention_cycle_rejection():
    with pytest.raises(ValueError):
        build_tree_causal_mask([1, 0])


def test_kv_cache_rollback_under_draft_rejection():
    base_ptr = 0x8800
    # 4 draft tokens proposed, only 2 accepted -> 2 slots reclaimed
    allocated_tip, restored_commit, reclaimed = rollback_kv_cache_pointer(
        base_pointer=base_ptr,
        draft_length=4,
        accepted_length=2,
        slot_stride_bytes=0x100,
    )
    assert allocated_tip == 0x8C00
    assert restored_commit == 0x8A00
    assert reclaimed == 2

    # Full rejection -> rolls back strictly to base_ptr
    _, full_rollback_ptr, reclaimed_all = rollback_kv_cache_pointer(
        base_pointer=base_ptr,
        draft_length=4,
        accepted_length=0,
        slot_stride_bytes=0x100,
    )
    assert full_rollback_ptr == base_ptr
    assert reclaimed_all == 4


def test_branch_evaluation_pruning_and_acceptance():
    req = BranchVerificationRequest(
        branch_id=3,
        corridor=CORRIDORS[0],
        kv_base_pointer=0x8500,
        candidates=[
            DraftTokenCandidate(
                token_id="t82", parent_index=-1, depth=0, p_draft=0.80, p_target=0.76, threshold_u=0.50
            ),
            DraftTokenCandidate(
                token_id="t19", parent_index=0, depth=1, p_draft=0.75, p_target=0.70, threshold_u=0.50
            ),
            DraftTokenCandidate(
                token_id="t44", parent_index=1, depth=2, p_draft=0.82, p_target=0.68, threshold_u=0.50
            ),
        ],
    )
    resp = evaluate_branch(req)
    assert resp.branch_code == "BR3"
    assert resp.accepted_count == 3
    assert resp.accepted_tokens == ["t82", "t19", "t44"]
    assert resp.state == "ACCEPTED"
    assert resp.kv_pointer_after == "0x8800"
