"""
Ghost FactoryOS Track 3 F1 Skunkworks Engine — GF-T3-163 (Kinetic Terrain Swarm)
Automated Proof Suite: Split-Brain Isolation, Quorum Consensus & Byzantine Rejection
Test Framework: Standard library unittest / pytest compatible
Target Coverage: >= 80%
"""

import unittest
import time
import sys
import os

# Include project root in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.swarm import (
    SwarmCluster,
    SwarmNode,
    NodeRole,
    VehicleRole,
    TerrainMode,
    LogEntry,
    HeartbeatPayload,
)


class TestSwarmConsensusAndKineticMesh(unittest.TestCase):
    def setUp(self):
        """Initializes a fresh 12-node Lexus GX 550 Overtrail+ Swarm Cluster"""
        self.cluster = SwarmCluster(node_count=12)

    def test_initial_cluster_topology_and_quorum(self):
        """Verifies cluster initialization, quorum formula Q = floor(N/2) + 1 = 7"""
        self.assertEqual(len(self.cluster.nodes), 12)
        self.assertEqual(self.cluster.quorum_threshold(), 7)
        self.assertIsNotNone(self.cluster.active_leader)
        leader = self.cluster.nodes[self.cluster.active_leader]
        self.assertEqual(leader.role, NodeRole.LEADER)
        self.assertGreater(leader.current_term, 0)

    def test_deterministic_election_timeout_dispersion(self):
        """Validates pseudo-random election timeouts are deterministic and jittered across nodes"""
        timeouts = [node.election_timeout_ms for node in self.cluster.nodes.values()]
        # All timeouts must fall strictly within [150ms, 300ms]
        for t in timeouts:
            self.assertGreaterEqual(t, 150.0)
            self.assertLessEqual(t, 300.0)
        # Unique dispersion ensures no deadlocks
        unique_timeouts = set(timeouts)
        self.assertGreater(len(unique_timeouts), 8, "Expected wide timeout dispersion across 12 nodes")

    def test_vector_clock_causality_and_lattice_join(self):
        """Validates vector clock monotonicity V_i = max(V_i, V_j) + e_i"""
        node_a = self.cluster.nodes["OVT-01"]
        node_b = self.cluster.nodes["OVT-02"]

        # Mutate local clock on A
        initial_val_a = node_a.vector_clock.get("OVT-01", 0)
        node_a.increment_local_clock()
        self.assertEqual(node_a.vector_clock["OVT-01"], initial_val_a + 1)

        # Merge clock into B
        node_b.merge_vector_clock(node_a.vector_clock)
        self.assertGreaterEqual(node_b.vector_clock["OVT-01"], node_a.vector_clock["OVT-01"])
        self.assertIn("OVT-02", node_b.vector_clock)

    def test_command_replication_across_majority_quorum(self):
        """Tests command submission to leader replicates to >= 7 nodes and applies kinetic action"""
        leader = self.cluster.nodes[self.cluster.active_leader]
        entry = leader.append_command(
            command="MTS_MODE_CHANGE",
            payload={"mode": "ROCK"}
        )
        self.assertIsNotNone(entry)
        self.assertEqual(entry.command, "MTS_MODE_CHANGE")
        self.assertEqual(leader.commit_index, entry.index)

        # Check follower has applied the terrain mode
        follower = self.cluster.nodes["OVT-02"]
        self.assertEqual(follower.telemetry.terrain_mode, TerrainMode.ROCK)

    def test_split_brain_partition_isolation(self):
        """
        Critical Test: Injects network partition (Group A = 7 nodes, Group B = 5 nodes).
        Verifies:
          - Group A maintains quorum (7 >= 7) and can commit new logs.
          - Group B has no quorum (5 < 7) and rejects / freezes all state transitions.
        """
        group_a = {f"OVT-{i:02d}" for i in range(1, 8)}   # 7 nodes (Majority)
        group_b = {f"OVT-{i:02d}" for i in range(8, 13)}  # 5 nodes (Minority)

        self.cluster.inject_partition(group_a, group_b)
        self.assertEqual(len(self.cluster.partitions), 2)

        # Group A leader should still be able to commit
        leader_a = self.cluster.nodes["OVT-01"]
        self.assertEqual(leader_a.role, NodeRole.LEADER)
        entry_a = leader_a.append_command("EKDSS_ARTICULATION_OVERRIDE", {"decoupled": True})
        self.assertIsNotNone(entry_a)

        # Node in Group B should be isolated and CANNOT elect a leader
        node_b_candidate = self.cluster.nodes["OVT-08"]
        election_success = node_b_candidate.start_election()
        self.assertFalse(election_success, "Minority partition must not successfully elect a leader")
        self.assertNotEqual(node_b_candidate.role, NodeRole.LEADER)

    def test_partition_healing_and_monotonic_log_sync(self):
        """Verifies that after network healing, cluster restores single unified leader"""
        group_a = {f"OVT-{i:02d}" for i in range(1, 8)}
        group_b = {f"OVT-{i:02d}" for i in range(8, 13)}
        self.cluster.inject_partition(group_a, group_b)

        # Heal network partition
        self.cluster.heal_partition()
        self.assertEqual(len(self.cluster.partitions), 1)

        # Quorum active leader confirmed
        leader = self.cluster.nodes[self.cluster.active_leader]
        self.assertEqual(leader.role, NodeRole.LEADER)

    def test_byzantine_fault_isolation_via_chi_square_gating(self):
        """
        Tests that an edge node reporting erratic IMU/sensor residuals
        exceeding Chi-square threshold gamma=7.815 is quarantined after 3 violations.
        """
        bad_node = self.cluster.nodes["OVT-05"]
        self.assertFalse(bad_node.is_byzantine_quarantined)

        # Violation 1
        ok1 = bad_node.check_byzantine_telemetry(raw_residual=12.4)
        self.assertTrue(ok1, "First violation warning")
        self.assertEqual(bad_node.consecutive_residual_violations, 1)

        # Violation 2
        ok2 = bad_node.check_byzantine_telemetry(raw_residual=15.1)
        self.assertTrue(ok2, "Second violation warning")

        # Violation 3 -> Quarantined
        ok3 = bad_node.check_byzantine_telemetry(raw_residual=18.9)
        self.assertFalse(ok3, "Third violation triggers quarantine")
        self.assertTrue(bad_node.is_byzantine_quarantined)
        self.assertEqual(bad_node.role, NodeRole.ISOLATED)

        # Quarantined node cannot start election
        self.assertFalse(bad_node.start_election())

    def test_lexus_gx550_ekdss_and_crawl_control_actuation(self):
        """Verifies Lexus GX 550 Overtrail+ specific actuation triggers across swarm"""
        leader = self.cluster.nodes[self.cluster.active_leader]

        # Set Crawl Control Speed to 2.5 km/h for steep rock descent
        leader.append_command("CRAWL_SPEED_SET", {"speed_kmh": 2.5})
        for node in self.cluster.nodes.values():
            self.assertEqual(node.telemetry.crawl_speed_kmh, 2.5)

        # Lock Torsen center differential
        leader.append_command("TORSEN_DIFF_LOCK", {"locked": True})
        for node in self.cluster.nodes.values():
            self.assertTrue(node.telemetry.torsen_center_diff_locked)


if __name__ == "__main__":
    unittest.main()
