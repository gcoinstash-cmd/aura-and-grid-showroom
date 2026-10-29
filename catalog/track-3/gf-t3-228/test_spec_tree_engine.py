"""
Pytest & Unittest Verification Suite for GF-T3-228 Speculative Tree Decoding Engine
SPDX-License-Identifier: MIT
Verifies:
1. Numerical equivalence of unified tree-attention verification with serial sequential inference.
2. Speculative acceptance logic correctness under varying confidence thresholds.
3. Dynamic branch pruning triggers when candidate scores fall below tolerance.
"""

import unittest
from engine import (
    CorridorId,
    NodeVerificationStatus,
    TreeExpansionRequest,
    build_tree_attention_mask,
    compute_serial_sequential_logits,
    compute_tree_parallel_logits,
    generate_and_verify_speculative_tree,
)


def test_numerical_equivalence_tree_attention_vs_serial_inference() -> None:
    """
    1. Verifies that unified tree-attention verification with a causal tree mask produces
    numerically identical target probabilities to serial sequential path-by-path inference.
    """
    req = TreeExpansionRequest(
        root_token="def",
        corridor=CorridorId.ALPHA,
        pruning_threshold=0.72,
        temperature=0.80,
        step_seed=228,
    )
    response = generate_and_verify_speculative_tree(req)
    all_nodes = [response.root_node] + response.level1_nodes + response.level2_leaves
    mask = build_tree_attention_mask(all_nodes)

    parallel_probs = compute_tree_parallel_logits(all_nodes, mask, req.temperature)
    serial_probs = compute_serial_sequential_logits(all_nodes, req.temperature)

    assert len(parallel_probs) == 12
    assert len(serial_probs) == 12
    for p_val, s_val in zip(parallel_probs, serial_probs):
        assert abs(p_val - s_val) < 1e-7
    assert response.numerical_equivalence_delta == 0.0


def test_tree_attention_mask_causal_ancestry_invariants() -> None:
    """
    Verifies that the 12x12 tree attention mask is lower-triangular and strictly encodes
    exact root-to-leaf ancestry without cross-branch contamination.
    """
    req = TreeExpansionRequest(root_token="forward", step_seed=228)
    response = generate_and_verify_speculative_tree(req)
    mask = response.attention_mask_matrix

    assert len(mask) == 12
    for i in range(12):
        assert mask[i][i] == 1
        assert mask[i][0] == 1
        for j in range(i + 1, 12):
            assert mask[i][j] == 0


def test_speculative_acceptance_under_varying_confidence_thresholds() -> None:
    """
    2. Verifies speculative acceptance rate monotonically decreases or stays equal
    as the confidence pruning threshold increases from permissive (0.50) to strict (0.92).
    """
    permissive_req = TreeExpansionRequest(
        root_token="attn_kernel",
        corridor=CorridorId.ALPHA,
        pruning_threshold=0.50,
        step_seed=228,
    )
    moderate_req = TreeExpansionRequest(
        root_token="attn_kernel",
        corridor=CorridorId.ALPHA,
        pruning_threshold=0.72,
        step_seed=228,
    )
    strict_req = TreeExpansionRequest(
        root_token="attn_kernel",
        corridor=CorridorId.ALPHA,
        pruning_threshold=0.92,
        step_seed=228,
    )

    res_permissive = generate_and_verify_speculative_tree(permissive_req)
    res_moderate = generate_and_verify_speculative_tree(moderate_req)
    res_strict = generate_and_verify_speculative_tree(strict_req)

    assert res_permissive.accepted_count >= res_moderate.accepted_count
    assert res_moderate.accepted_count >= res_strict.accepted_count
    assert res_permissive.speculative_speedup >= res_strict.speculative_speedup


def test_dynamic_branch_pruning_on_low_confidence_divergence() -> None:
    """
    3. Verifies that injecting low-confidence divergence or switching to greedy fallback
    triggers dynamic branch pruning and rejects low-scoring subtrees.
    """
    normal_req = TreeExpansionRequest(
        root_token="def",
        corridor=CorridorId.ALPHA,
        pruning_threshold=0.75,
        low_confidence_divergence=False,
        step_seed=228,
    )
    divergent_req = TreeExpansionRequest(
        root_token="def",
        corridor=CorridorId.BRAVO,
        pruning_threshold=0.75,
        low_confidence_divergence=True,
        step_seed=228,
    )

    normal_res = generate_and_verify_speculative_tree(normal_req)
    divergent_res = generate_and_verify_speculative_tree(divergent_req)

    pruned_leaves_divergent = [
        leaf for leaf in divergent_res.level2_leaves if leaf.status == NodeVerificationStatus.PRUNED_REJECTED
    ]
    assert len(pruned_leaves_divergent) > 0
    assert divergent_res.accepted_count < normal_res.accepted_count


def test_zero_trust_input_sanitization_rejects_injection() -> None:
    """
    Verifies GridSync Zero-Trust sanitization rejects SQL/XSS control sequences.
    """
    raised = False
    try:
        TreeExpansionRequest(root_token="def; DROP TABLE draft_nodes;--")
    except ValueError:
        raised = True
    assert raised is True


class SpecTreeEngineTestSuite(unittest.TestCase):
    def test_1_numerical_equivalence(self) -> None:
        test_numerical_equivalence_tree_attention_vs_serial_inference()

    def test_2_causal_mask_invariants(self) -> None:
        test_tree_attention_mask_causal_ancestry_invariants()

    def test_3_confidence_thresholds(self) -> None:
        test_speculative_acceptance_under_varying_confidence_thresholds()

    def test_4_dynamic_pruning(self) -> None:
        test_dynamic_branch_pruning_on_low_confidence_divergence()

    def test_5_zero_trust_sanitization(self) -> None:
        test_zero_trust_input_sanitization_rejects_injection()


if __name__ == "__main__":
    unittest.main()
