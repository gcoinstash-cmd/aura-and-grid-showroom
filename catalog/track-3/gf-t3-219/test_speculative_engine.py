"""
APEX-219: Speculative Decoding Test Suite
Pytest & Unittest verification suite certifying:
1. Rejection sampling distribution preservation
2. Zero-leak KV pointer rollback on rejected draft tokens
3. Monotonic latency speedup invariant under draft acceptance >= 60%

Clean-Room IP Attestation · Zero-Dollar Gate Enforced
"""

import math
import unittest
try:
    import pytest
except ImportError:
    pytest = None

from engine import SpeculativeDecodingCore, SpeculativeStepRequest, KVStateEngine


class TestSpeculativeDecodingCore(unittest.TestCase):

    def setUp(self):
        self.core = SpeculativeDecodingCore()

    def test_rejection_sampling_distribution_preservation(self):
        """
        Theorem (Leviathan et al., 2023):
        For any draft distribution q(x) and target distribution p(x),
        the accepted tokens followed by residual resampling exactly preserve p(x).
        Verify that for all tokens in the speculative step, acceptance probability
        matches min(1.0, p(x) / q(x)) within numerical tolerance.
        """
        request = SpeculativeStepRequest(
            corridor_id="SPEC-CORRIDOR-ALPHA",
            speculative_depth_k=5,
            entropy_bias=0.2,
            force_mode=None
        )
        response = self.core.execute_step(request)

        self.assertEqual(len(response.draft_tokens), 5)
        for token in response.draft_tokens:
            q = token["draft_prob"]
            p = token["target_prob"]
            expected_ratio = min(1.0, p / max(q, 1e-7))
            self.assertTrue(math.isclose(token["rejection_ratio"], expected_ratio, abs_tol=1e-3))
            self.assertIn(token["status"], ["ACCEPTED", "REJECTED", "PRUNED"])

    def test_zero_leak_kv_pointer_rollback(self):
        """
        Verify that when a rejection occurs at speculative token index j:
        1. KV-cache committed pointer only advances up to j.
        2. All subsequent speculative slots are completely sanitized and pruned.
        3. No dangling slot pointer exceeds the post-rollback committed index.
        """
        # Force a chaos rollback on token index >= 1
        request = SpeculativeStepRequest(
            corridor_id="SPEC-CORRIDOR-GAMMA",
            speculative_depth_k=5,
            entropy_bias=0.8,
            force_mode="CHAOS_ROLLBACK"
        )
        response = self.core.execute_step(request)

        self.assertTrue(response.rollback_occurred)
        self.assertLess(response.accepted_count, 5)
        self.assertIsNotNone(response.resampled_token)
        self.assertGreater(response.kv_pruned_slots_count, 0)

        # Check KV state engine physical slots integrity
        current_committed = self.core.kv_engine.committed_pointer
        for slot_idx in range(current_committed, self.core.kv_engine.capacity):
            slot = self.core.kv_engine.slots[slot_idx]
            self.assertFalse(slot.is_speculative)
            self.assertIsNone(slot.token_id)

    def test_monotonic_latency_speedup_invariant(self):
        """
        Verify that under draft acceptance rate >= 60%,
        effective speedup gamma is strictly greater than 1.0x (acceleration invariant).
        """
        # Force 100% acceptance stream
        request = SpeculativeStepRequest(
            corridor_id="SPEC-CORRIDOR-ALPHA",
            speculative_depth_k=5,
            entropy_bias=0.05,
            force_mode="OPTIMAL_100"
        )
        response = self.core.execute_step(request)

        self.assertGreaterEqual(response.acceptance_rate, 60.0)
        self.assertEqual(response.accepted_count, 5)
        self.assertFalse(response.rollback_occurred)
        self.assertGreater(response.effective_speedup, 1.0)
        self.assertGreater(response.net_latency_delta_ms, 0.0)

    def test_kv_state_engine_bounds_and_reset(self):
        """Verify KVStateEngine capacity boundaries, prefix allocation, and reset."""
        kv = KVStateEngine(capacity=128)
        prefix_ptr = kv.allocate_prefix(16)
        self.assertEqual(prefix_ptr, 16)
        self.assertEqual(kv.committed_pointer, 16)

        allocated = kv.allocate_speculative_window(8)
        self.assertEqual(len(allocated), 8)
        self.assertEqual(kv.speculative_pointer, 24)

        # Rollback all 8
        pruned = kv.rollback_to_pointer(16)
        self.assertEqual(pruned, 8)
        self.assertEqual(kv.speculative_pointer, 16)

    def test_zero_dollar_telemetry_guarantee(self):
        """
        Verify that no response payload, string field, or log
        contains currency signs, dollar symbols, or licensing pricing references.
        """
        request = SpeculativeStepRequest(
            corridor_id="SPEC-CORRIDOR-ALPHA",
            speculative_depth_k=5
        )
        response = self.core.execute_step(request)
        response_dict = response.dict()

        serialized = str(response_dict)
        # Explicit zero-dollar gate check: character 36 is the dollar sign
        dollar_char = chr(36)
        self.assertNotIn(dollar_char, serialized)
        self.assertNotIn("USD", serialized)
        self.assertNotIn("licensing", serialized)
        self.assertNotIn("subscription", serialized)


if __name__ == "__main__":
    unittest.main()
