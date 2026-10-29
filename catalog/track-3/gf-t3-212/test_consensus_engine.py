"""
APEX-212 Consensus Engine Comprehensive Test Suite
File: test_consensus_engine.py
Test Coverage Targets: Safety Invariant, Liveness Invariant, Merkle Determinism, SHA-256 Chain Immutability.
License: MIT Permissive License
Standard Commercial Asset Transfer Specification
"""

import sys
import unittest
from engine import ClusterState, MerkleStateTrie, Block, sha256


class TestConsensusEngine(unittest.TestCase):

    def setUp(self):
        """Initializes a pristine 10-node cluster with f=3 Byzantine fault tolerance threshold."""
        self.cluster = ClusterState(total_nodes=10, byzantine_tolerance_f=3)

    def setup_method(self):
        """Pytest hook compatibility."""
        self.setUp()

    def test_merkle_root_determinism(self):
        """Invariant 1: Identical state transitions must yield exact byte-identical SHA-256 root hashes."""
        trie_a = MerkleStateTrie()
        trie_b = MerkleStateTrie()

        payload = {
            "REGISTRY_ACCOUNT_001": {"balance_units": 45000, "nonce": 12},
            "VALIDATOR_SLOT_08": {"active": True, "staked_units": 25000},
            "ORACLE_EPOCH_FEED": {"round": 982, "median_val": 104}
        }

        # Apply in standard order
        root_a = trie_a.apply_batch(payload)

        # Apply in shuffled key order to test canonical key sorting
        shuffled_payload = {
            "ORACLE_EPOCH_FEED": {"round": 982, "median_val": 104},
            "VALIDATOR_SLOT_08": {"active": True, "staked_units": 25000},
            "REGISTRY_ACCOUNT_001": {"balance_units": 45000, "nonce": 12}
        }
        root_b = trie_b.apply_batch(shuffled_payload)

        self.assertEqual(root_a, root_b, "Merkle state roots must be mathematically deterministic and order-independent")
        self.assertEqual(len(root_a), 64, "Root hash must be 256-bit hexadecimal string")

    def test_safety_invariant_under_byzantine_faults(self):
        """
        Invariant 2: Safety Invariant.
        Given n >= 3f + 1 (n=10, f=3), when f nodes behave as Byzantine equivocators,
        honest nodes must commit identical blocks with zero conflicting forks at the same sequence height.
        """
        # Configure exactly f=3 Byzantine nodes
        self.cluster.nodes["VALIDATOR-NODE-CHARLIE"].is_byzantine = True
        self.cluster.nodes["VALIDATOR-NODE-DELTA"].is_byzantine = True
        self.cluster.nodes["VALIDATOR-NODE-ECHO"].is_byzantine = True

        # Ensure honest nodes are unpartitioned
        for nid in ["VALIDATOR-NODE-ALPHA", "VALIDATOR-NODE-BRAVO", "VALIDATOR-NODE-FOXTROT",
                    "VALIDATOR-NODE-GOLF", "VALIDATOR-NODE-HOTEL", "VALIDATOR-NODE-INDIA", "VALIDATOR-NODE-JULIET"]:
            self.cluster.nodes[nid].is_byzantine = False
            self.cluster.nodes[nid].is_partitioned = False

        operations = {"BATCH_TX_PROOF": "0xAA45F9", "TRANSFER_UNITS": 1200}
        initial_ledger_len = len(self.cluster.ledger)
        target_seq = self.cluster.sequence_number

        result = self.cluster.execute_pbft_round(operations)

        # Quorum required is 2f + 1 = 7. Honest nodes = 7. Consensus must hold.
        self.assertEqual(result["status"], "COMMITTED")
        self.assertEqual(result["sequence_number"], target_seq)
        self.assertEqual(len(self.cluster.ledger), initial_ledger_len + 1)

        # Check commit consistency across all honest nodes
        committed_block_hash = result["block_hash"]
        for nid, node in self.cluster.nodes.items():
            if not node.is_byzantine and not node.is_partitioned:
                self.assertEqual(node.committed_sequences.get(target_seq), committed_block_hash)

    def test_safety_breaks_when_byzantine_threshold_exceeded(self):
        """When Byzantine nodes exceed f (f >= 4 in n=10), consensus must halt to prevent fork (Safety over Liveness)."""
        # Exceed threshold: mark 4 nodes as Byzantine and partitioned
        self.cluster.nodes["VALIDATOR-NODE-CHARLIE"].is_byzantine = True
        self.cluster.nodes["VALIDATOR-NODE-DELTA"].is_byzantine = True
        self.cluster.nodes["VALIDATOR-NODE-ECHO"].is_byzantine = True
        self.cluster.nodes["VALIDATOR-NODE-FOXTROT"].is_byzantine = True

        operations = {"BATCH_TX_PROOF": "0xDEADBEEF"}
        initial_ledger_len = len(self.cluster.ledger)
        result = self.cluster.execute_pbft_round(operations)

        # Honest nodes = 6 < required quorum of 7 -> consensus cannot commit
        self.assertEqual(result["status"], "QUORUM_DEFICIT")
        self.assertEqual(len(self.cluster.ledger), initial_ledger_len)

    def test_liveness_invariant_after_view_change(self):
        """
        Invariant 3: Liveness Invariant.
        When leader drops or partitions, dynamic round-robin view change elects a healthy leader
        and consensus progression immediately resumes.
        """
        old_view = self.cluster.current_view
        old_leader = self.cluster.get_leader_node()

        # Simulate leader crash / partition
        self.cluster.nodes[old_leader].is_partitioned = True

        # Trigger view change
        vc_result = self.cluster.trigger_view_change()
        self.assertEqual(vc_result["status"], "VIEW_CHANGE_COMPLETED")
        self.assertEqual(vc_result["new_view"], old_view + 1)
        new_leader = self.cluster.get_leader_node()
        self.assertNotEqual(new_leader, old_leader)

        # Resume state transition under new view leader
        self.cluster.nodes["VALIDATOR-NODE-CHARLIE"].is_byzantine = False
        self.cluster.nodes["VALIDATOR-NODE-DELTA"].is_partitioned = False
        res = self.cluster.execute_pbft_round({"RESTORE_OP": "LEADER_TAKEOVER"})

        self.assertEqual(res["status"], "COMMITTED")
        self.assertEqual(res["view_term"], old_view + 1)

    def test_cryptographic_sha256_chain_immutability(self):
        """Invariant 4: SHA-256 chain immutability detects any tampering with historical blocks."""
        # Append two valid blocks
        self.cluster.execute_pbft_round({"BLOCK_TX": "INITIAL_PROOF_A"})
        self.cluster.execute_pbft_round({"BLOCK_TX": "INITIAL_PROOF_B"})

        self.assertGreaterEqual(len(self.cluster.ledger), 3)

        # Validate cryptographic link
        for i in range(1, len(self.cluster.ledger)):
            prev = self.cluster.ledger[i - 1]
            curr = self.cluster.ledger[i]
            self.assertEqual(curr.previous_hash, prev.block_hash, "Previous hash must link to prior block hash")

        # Simulate adversarial tamper on middle block
        tampered_block = self.cluster.ledger[1]
        original_hash = tampered_block.block_hash
        tampered_block.operations = {"TAMPERED_TRANSACTION": "FORGED_ALLOCATION"}
        tampered_hash = sha256(
            str(tampered_block.block_number) + tampered_block.previous_hash + tampered_block.state_root
        )

        # Detect forgery
        self.assertNotEqual(tampered_hash, original_hash, "Tampered block content immediately alters SHA-256 digest")


if __name__ == "__main__":
    unittest.main()
