"""
Ghost FactoryOS Track 3 F1 Skunkworks Engine — GF-T3-163 (Kinetic Terrain Swarm)
Core Module: Distributed Raft/Gossip Consensus, Vector Clock Lattice & Byzantine Isolation
Vertical: Edge AI Swarms & Rugged Mesh Autonomy (Apex Executive Spec)
License: Apache-2.0 / MIT Clean-Room Permissive
"""

from __future__ import annotations
import asyncio
import enum
import hashlib
import json
import math
import random
import time
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional, Set, Tuple, Any


class NodeRole(str, enum.Enum):
    LEADER = "LEADER"
    FOLLOWER = "FOLLOWER"
    CANDIDATE = "CANDIDATE"
    ISOLATED = "ISOLATED"


class VehicleRole(str, enum.Enum):
    LEAD_RECON = "LEAD_RECON"
    DYNAMIC_ANCHOR = "DYNAMIC_ANCHOR"
    GUARDIAN_FLANK = "GUARDIAN_FLANK"
    TAIL_SENTINEL = "TAIL_SENTINEL"


class TerrainMode(str, enum.Enum):
    AUTO = "AUTO"
    DIRT = "DIRT"
    SAND = "SAND"
    MUD = "MUD"
    DEEP_SNOW = "DEEP_SNOW"
    ROCK = "ROCK"


@dataclass
class EKDSSArticulation:
    """Electronic-Kinetic Dynamic Suspension System (Apex Executive Spec)"""
    fl_stroke_mm: float = 320.0  # 0 to 640mm total travel
    fr_stroke_mm: float = 315.0
    rl_stroke_mm: float = 330.0
    rr_stroke_mm: float = 325.0
    front_pressure_bar: float = 48.5
    rear_pressure_bar: float = 52.0
    solenoid_decoupled: bool = True  # True when off-road rock crawl mode unlocks sway bar


@dataclass
class NodeTelemetry:
    node_id: str
    vin: str
    vehicle_role: VehicleRole
    terrain_mode: TerrainMode
    ekdss: EKDSSArticulation = field(default_factory=EKDSSArticulation)
    torsen_center_diff_locked: bool = False
    crawl_speed_kmh: float = 3.5  # 1.0 to 12.0 km/h Crawl Control
    pitch_deg: float = 4.2
    roll_deg: float = 2.1
    wheel_slip_ratio: float = 0.04  # Nominal < 0.15
    mahalanobis_residual: float = 0.85
    is_byzantine: bool = False
    timestamp: float = field(default_factory=time.time)


@dataclass
class LogEntry:
    index: int
    term: int
    command: str
    payload: Dict[str, Any]
    timestamp: float = field(default_factory=time.time)


@dataclass
class HeartbeatPayload:
    node_id: str
    term: int
    leader_id: str
    commit_index: int
    vector_clock: Dict[str, int]
    timestamp: float = field(default_factory=time.time)


@dataclass
class SyncPayload:
    node_id: str
    term: int
    prev_log_index: int
    prev_log_term: int
    entries: List[LogEntry]
    leader_commit: int
    vector_clock: Dict[str, int]


class SwarmNode:
    """
    Raft-inspired state machine node with Gossip vector clock state synchronization
    and chi-square innovation residual filtering for Byzantine fault isolation.
    """
    def __init__(
        self,
        node_id: str,
        vehicle_role: VehicleRole,
        vin: str,
        mac_addr: str,
        ipv4_mesh: str,
        cluster: "SwarmCluster",
    ):
        self.node_id = node_id
        self.vehicle_role = vehicle_role
        self.vin = vin
        self.mac_addr = mac_addr
        self.ipv4_mesh = ipv4_mesh
        self.cluster = cluster

        # Consensus State
        self.current_term: int = 0
        self.role: NodeRole = NodeRole.FOLLOWER
        self.voted_for: Optional[str] = None
        self.log: List[LogEntry] = []
        self.commit_index: int = 0
        self.last_applied: int = 0

        # Vector Clock Lattice
        self.vector_clock: Dict[str, int] = {}

        # Timing (ms)
        self.heartbeat_interval_ms: float = 50.0
        self.min_election_timeout_ms: float = 150.0
        self.max_election_timeout_ms: float = 300.0
        self.election_timeout_ms: float = self._compute_deterministic_timeout()
        self.last_heartbeat_time: float = time.time()

        # Byzantine Fault Tracking
        self.is_byzantine_quarantined: bool = False
        self.consecutive_residual_violations: int = 0
        self.chi_square_gate_threshold: float = 7.815  # Chi-Square alpha=0.001, 3 DoF

        # Telemetry State
        self.telemetry = NodeTelemetry(
            node_id=self.node_id,
            vin=self.vin,
            vehicle_role=self.vehicle_role,
            terrain_mode=TerrainMode.ROCK,
        )

    def _compute_deterministic_timeout(self) -> float:
        """
        Deterministic pseudo-random jitter seeded by MAC and current term to
        prevent split-vote livelocks in edge clusters without centralized NTP.
        """
        seed_str = f"{self.mac_addr}:{self.current_term}:{self.node_id}"
        hash_val = int(hashlib.sha256(seed_str.encode()).hexdigest()[:8], 16)
        jitter = hash_val % int(self.max_election_timeout_ms - self.min_election_timeout_ms)
        return self.min_election_timeout_ms + float(jitter)

    def increment_local_clock(self):
        self.vector_clock[self.node_id] = self.vector_clock.get(self.node_id, 0) + 1

    def merge_vector_clock(self, incoming_clock: Dict[str, int]):
        """Vector clock lattice join operator: V_i = max(V_i, V_j) + e_i"""
        for peer_id, count in incoming_clock.items():
            self.vector_clock[peer_id] = max(self.vector_clock.get(peer_id, 0), count)
        self.increment_local_clock()

    def check_byzantine_telemetry(self, raw_residual: float) -> bool:
        """
        Gating incoming telemetry using Kalman innovation Chi-square test.
        Threshold gamma = 7.815 (df=3, p=0.001).
        """
        if raw_residual > self.chi_square_gate_threshold:
            self.consecutive_residual_violations += 1
            if self.consecutive_residual_violations >= 3:
                self.is_byzantine_quarantined = True
                self.role = NodeRole.ISOLATED
                return False
        else:
            self.consecutive_residual_violations = 0
            self.is_byzantine_quarantined = False
        return True

    def start_election(self) -> bool:
        """
        Transitions to CANDIDATE, increments term, votes for self, and requests votes.
        Requires strict majority quorum: Q = floor(N / 2) + 1.
        """
        if self.is_byzantine_quarantined or self.role == NodeRole.ISOLATED:
            return False

        self.role = NodeRole.CANDIDATE
        self.current_term += 1
        self.voted_for = self.node_id
        self.increment_local_clock()
        self.last_heartbeat_time = time.time()
        self.election_timeout_ms = self._compute_deterministic_timeout()

        votes = 1  # Self vote
        eligible_peers = self.cluster.get_routable_peers(self.node_id)
        majority_needed = self.cluster.quorum_threshold()

        for peer in eligible_peers:
            if peer.node_id == self.node_id:
                continue
            if peer.handle_vote_request(self.node_id, self.current_term, len(self.log), self.log[-1].term if self.log else 0):
                votes += 1

        if votes >= majority_needed:
            self.role = NodeRole.LEADER
            self.cluster.active_leader = self.node_id
            # Append leader election log entry
            entry = LogEntry(
                index=len(self.log) + 1,
                term=self.current_term,
                command="LEADER_ELECTED",
                payload={"leader": self.node_id, "votes": votes, "term": self.current_term},
            )
            self.log.append(entry)
            self.commit_index = len(self.log)
            self.cluster.broadcast_heartbeat(self.node_id)
            return True
        else:
            self.role = NodeRole.FOLLOWER
            self.voted_for = None
            return False

    def handle_vote_request(self, candidate_id: str, term: int, last_log_index: int, last_log_term: int) -> bool:
        if self.is_byzantine_quarantined or self.role == NodeRole.ISOLATED:
            return False

        if term < self.current_term:
            return False

        if term > self.current_term:
            self.current_term = term
            self.role = NodeRole.FOLLOWER
            self.voted_for = None

        my_last_term = self.log[-1].term if self.log else 0
        my_last_index = len(self.log)

        # Log up-to-date check
        log_ok = (last_log_term > my_last_term) or (
            last_log_term == my_last_term and last_log_index >= my_last_index
        )

        if (self.voted_for is None or self.voted_for == candidate_id) and log_ok:
            self.voted_for = candidate_id
            self.last_heartbeat_time = time.time()
            return True
        return False

    def handle_heartbeat(self, payload: HeartbeatPayload) -> Dict[str, Any]:
        """Processes incoming heartbeat from leader"""
        if self.is_byzantine_quarantined or self.role == NodeRole.ISOLATED:
            return {"success": False, "reason": "Node quarantined or isolated"}

        if payload.term < self.current_term:
            return {"success": False, "term": self.current_term, "reason": "Term outdated"}

        if payload.term > self.current_term:
            self.current_term = payload.term
            self.role = NodeRole.FOLLOWER
            self.voted_for = payload.leader_id

        self.last_heartbeat_time = time.time()
        self.role = NodeRole.FOLLOWER
        self.merge_vector_clock(payload.vector_clock)
        self.commit_index = min(payload.commit_index, len(self.log))

        return {
            "success": True,
            "term": self.current_term,
            "node_id": self.node_id,
            "commit_index": self.commit_index,
        }

    def append_command(self, command: str, payload: Dict[str, Any]) -> Optional[LogEntry]:
        """Appends command to leader's log and triggers replication"""
        if self.role != NodeRole.LEADER:
            return None

        self.increment_local_clock()
        entry = LogEntry(
            index=len(self.log) + 1,
            term=self.current_term,
            command=command,
            payload=payload,
        )
        self.log.append(entry)

        # Replicate to routable peers
        routable_peers = self.cluster.get_routable_peers(self.node_id)
        ack_count = 1  # Self
        majority_needed = self.cluster.quorum_threshold()

        for peer in routable_peers:
            if peer.node_id == self.node_id:
                continue
            if peer.replicate_entry(entry, self.vector_clock):
                ack_count += 1

        if ack_count >= majority_needed:
            self.commit_index = entry.index
            self.last_applied = entry.index
            # Apply side effects (e.g. Dynamic Kinetic Suspension Telemetry suspension or MTS mode change)
            self._apply_command(entry)
            return entry
        return None

    def replicate_entry(self, entry: LogEntry, leader_vector_clock: Dict[str, int]) -> bool:
        if self.is_byzantine_quarantined or self.role == NodeRole.ISOLATED:
            return False

        self.log.append(entry)
        self.commit_index = entry.index
        self.last_applied = entry.index
        self.merge_vector_clock(leader_vector_clock)
        self._apply_command(entry)
        return True

    def _apply_command(self, entry: LogEntry):
        """Applies committed command to Apex Executive vehicle actuators"""
        if entry.command == "MTS_MODE_CHANGE":
            mode_str = entry.payload.get("mode", "ROCK")
            try:
                self.telemetry.terrain_mode = TerrainMode(mode_str)
            except ValueError:
                self.telemetry.terrain_mode = TerrainMode.ROCK
        elif entry.command == "EKDSS_ARTICULATION_OVERRIDE":
            decoupled = entry.payload.get("decoupled", True)
            self.telemetry.ekdss.solenoid_decoupled = decoupled
        elif entry.command == "CRAWL_SPEED_SET":
            self.telemetry.crawl_speed_kmh = float(entry.payload.get("speed_kmh", 3.5))
        elif entry.command == "TORSEN_DIFF_LOCK":
            self.telemetry.torsen_center_diff_locked = bool(entry.payload.get("locked", True))


class SwarmCluster:
    """
    12-Node Swarm Cluster coordinator representing an overland expedition convoy.
    Simulates partition isolation, mesh routing, packet loss, and Byzantine detection.
    """
    def __init__(self, node_count: int = 12):
        self.node_count = node_count
        self.nodes: Dict[str, SwarmNode] = {}
        self.active_leader: Optional[str] = None
        self.partitions: List[Set[str]] = []  # List of disjoint node-id sets
        self._initialize_12_node_convoy()

    def _initialize_12_node_convoy(self):
        """Constructs 12 rugged edge nodes tailored to Apex Executive spec"""
        roles_distribution = [
            (VehicleRole.LEAD_RECON, 2),       # OVT-01, OVT-02
            (VehicleRole.DYNAMIC_ANCHOR, 6),   # OVT-03 through OVT-08
            (VehicleRole.GUARDIAN_FLANK, 2),   # OVT-09, OVT-10
            (VehicleRole.TAIL_SENTINEL, 2),    # OVT-11, OVT-12
        ]

        node_idx = 1
        for role, count in roles_distribution:
            for _ in range(count):
                node_id = f"OVT-{node_idx:02d}"
                vin = f"JTJBM7CA{node_idx:02d}R00{1000 + node_idx}"
                mac_addr = f"00:1A:7D:F1:63:{node_idx:02X}"
                ipv4_mesh = f"10.163.0.{10 + node_idx}"
                node = SwarmNode(
                    node_id=node_id,
                    vehicle_role=role,
                    vin=vin,
                    mac_addr=mac_addr,
                    ipv4_mesh=ipv4_mesh,
                    cluster=self,
                )
                self.nodes[node_id] = node
                node_idx += 1

        # Initialize single partition with all nodes
        self.partitions = [set(self.nodes.keys())]

        # Elect initial leader (OVT-01)
        self.nodes["OVT-01"].start_election()

    def quorum_threshold(self) -> int:
        """Strict majority: floor(N/2) + 1"""
        return (len(self.nodes) // 2) + 1

    def get_routable_peers(self, from_node_id: str) -> List[SwarmNode]:
        """Returns all peers currently in the same network partition as from_node_id"""
        for part in self.partitions:
            if from_node_id in part:
                return [self.nodes[nid] for nid in part if nid in self.nodes]
        return [self.nodes[from_node_id]]

    def inject_partition(self, group_a: Set[str], group_b: Set[str]):
        """Splits the cluster into two isolated subnets (e.g. 7 vs 5 split-brain test)"""
        all_ids = set(self.nodes.keys())
        remaining = all_ids - (group_a | group_b)
        parts = [group_a, group_b]
        if remaining:
            parts.append(remaining)
        self.partitions = [p for p in parts if p]

        # Update node roles based on quorum presence
        majority_needed = self.quorum_threshold()
        for part in self.partitions:
            if len(part) < majority_needed:
                # Minority partition: downgrade any leader to ISOLATED/FOLLOWER
                for nid in part:
                    node = self.nodes[nid]
                    if node.role == NodeRole.LEADER:
                        node.role = NodeRole.ISOLATED

    def heal_partition(self):
        """Restores full 12-node connectivity and resolves split-brain vector clocks"""
        self.partitions = [set(self.nodes.keys())]
        for node in self.nodes.values():
            if not node.is_byzantine_quarantined and node.role == NodeRole.ISOLATED:
                node.role = NodeRole.FOLLOWER

        # Synchronize from highest-term leader
        leaders = [n for n in self.nodes.values() if n.role == NodeRole.LEADER]
        if leaders:
            highest_leader = max(leaders, key=lambda l: (l.current_term, len(l.log)))
            self.active_leader = highest_leader.node_id
            self.broadcast_heartbeat(highest_leader.node_id)
        else:
            # Re-elect leader
            self.nodes["OVT-01"].start_election()

    def broadcast_heartbeat(self, leader_id: str):
        leader = self.nodes.get(leader_id)
        if not leader or leader.role != NodeRole.LEADER:
            return

        leader.increment_local_clock()
        payload = HeartbeatPayload(
            node_id=leader.node_id,
            term=leader.current_term,
            leader_id=leader.node_id,
            commit_index=leader.commit_index,
            vector_clock=dict(leader.vector_clock),
        )

        routable_peers = self.get_routable_peers(leader_id)
        for peer in routable_peers:
            if peer.node_id != leader_id:
                peer.handle_heartbeat(payload)

    def trigger_heartbeat_tick(self):
        """Simulates periodic 20Hz heartbeat round"""
        if self.active_leader:
            leader = self.nodes.get(self.active_leader)
            if leader and leader.role == NodeRole.LEADER:
                self.broadcast_heartbeat(leader.node_id)
            else:
                # Trigger election if leader lost
                for node in self.nodes.values():
                    if node.role != NodeRole.ISOLATED and not node.is_byzantine_quarantined:
                        if node.start_election():
                            break

    def get_topology_snapshot(self) -> Dict[str, Any]:
        """Exports complete JSON serializable topology conforming to OpenAPI 3.1"""
        node_list = []
        for nid, node in sorted(self.nodes.items()):
            node_list.append({
                "node_id": node.node_id,
                "vin": node.vin,
                "vehicle_role": node.vehicle_role.value,
                "role": node.role.value,
                "term": node.current_term,
                "commit_index": node.commit_index,
                "log_length": len(node.log),
                "is_byzantine": node.is_byzantine_quarantined,
                "vector_clock": node.vector_clock,
                "telemetry": {
                    "terrain_mode": node.telemetry.terrain_mode.value,
                    "ekdss": asdict(node.telemetry.ekdss),
                    "torsen_locked": node.telemetry.torsen_center_diff_locked,
                    "crawl_speed_kmh": node.telemetry.crawl_speed_kmh,
                    "pitch_deg": node.telemetry.pitch_deg,
                    "roll_deg": node.telemetry.roll_deg,
                    "mahalanobis_residual": node.telemetry.mahalanobis_residual,
                }
            })

        return {
            "cluster_id": "GF-T3-163-OVERLAND-CONVOY",
            "current_term": max(n.current_term for n in self.nodes.values()),
            "active_leader": self.active_leader,
            "total_nodes": len(self.nodes),
            "quorum_size": self.quorum_threshold(),
            "partition_count": len(self.partitions),
            "partitions": [list(p) for p in self.partitions],
            "nodes": node_list,
        }
