"""
Ghost FactoryOS Track 3 F1 Skunkworks Engine — GF-T3-163 (Kinetic Terrain Swarm)
API Module: REST & Telemetry Endpoints conforming to OpenAPI 3.1
Routes:
  - POST /api/v1/swarm/heartbeat
  - POST /api/v1/swarm/sync
  - GET  /api/v1/swarm/topology
  - POST /api/v1/swarm/command
  - POST /api/v1/swarm/partition
  - POST /api/v1/swarm/heal
"""

from __future__ import annotations
import time
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

# Import pure core engine
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from app.core.swarm import SwarmCluster, NodeRole, TerrainMode, HeartbeatPayload


# Global singleton cluster instance for demonstration and test harness
cluster_instance = SwarmCluster(node_count=12)


# ==========================================
# Pydantic v2 Request & Response Models
# ==========================================

class HeartbeatRequestModel(BaseModel):
    node_id: str = Field(..., description="Target node ID receiving the heartbeat")
    term: int = Field(..., ge=0, description="Current leader election term")
    leader_id: str = Field(..., description="ID of active leader asserting authority")
    commit_index: int = Field(0, ge=0, description="Highest committed Raft log index")
    vector_clock: Dict[str, int] = Field(default_factory=dict, description="Leader vector clock map")


class HeartbeatResponseModel(BaseModel):
    node_id: str
    term: int
    success: bool
    commit_index: int
    reason: Optional[str] = None


class LogEntryModel(BaseModel):
    index: int
    term: int
    command: str
    payload: Dict[str, Any] = Field(default_factory=dict)


class SyncRequestModel(BaseModel):
    node_id: str = Field(..., description="Target follower node ID")
    term: int = Field(..., ge=0)
    prev_log_index: int = Field(0, ge=0)
    prev_log_term: int = Field(0, ge=0)
    entries: List[LogEntryModel] = Field(default_factory=list)
    leader_commit: int = Field(0, ge=0)
    vector_clock: Dict[str, int] = Field(default_factory=dict)


class SyncResponseModel(BaseModel):
    node_id: str
    term: int
    success: bool
    match_index: int


class SwarmCommandRequestModel(BaseModel):
    command: str = Field(..., description="e.g. MTS_MODE_CHANGE, EKDSS_ARTICULATION_OVERRIDE")
    payload: Dict[str, Any] = Field(default_factory=dict)


class PartitionRequestModel(BaseModel):
    group_a: List[str] = Field(..., description="Node IDs in partition A (e.g. 7 nodes)")
    group_b: List[str] = Field(..., description="Node IDs in partition B (e.g. 5 nodes)")


# ==========================================
# Route Handlers
# ==========================================

def handle_post_heartbeat(request: HeartbeatRequestModel) -> HeartbeatResponseModel:
    """
    POST /api/v1/swarm/heartbeat
    Dispatches consensus heartbeat to node and synchronizes vector clock state.
    """
    node = cluster_instance.nodes.get(request.node_id)
    if not node:
        return HeartbeatResponseModel(
            node_id=request.node_id,
            term=request.term,
            success=False,
            commit_index=0,
            reason="Node not found in cluster registry"
        )

    payload = HeartbeatPayload(
        node_id=request.node_id,
        term=request.term,
        leader_id=request.leader_id,
        commit_index=request.commit_index,
        vector_clock=request.vector_clock,
    )
    res = node.handle_heartbeat(payload)
    return HeartbeatResponseModel(
        node_id=node.node_id,
        term=node.current_term,
        success=res.get("success", False),
        commit_index=node.commit_index,
        reason=res.get("reason"),
    )


def handle_post_sync(request: SyncRequestModel) -> SyncResponseModel:
    """
    POST /api/v1/swarm/sync
    Applies replicated log entries and updates vector clocks under 15ms.
    """
    node = cluster_instance.nodes.get(request.node_id)
    if not node or node.role == NodeRole.ISOLATED:
        return SyncResponseModel(
            node_id=request.node_id,
            term=request.term,
            success=False,
            match_index=0
        )

    node.merge_vector_clock(request.vector_clock)
    match_idx = node.commit_index
    for entry in request.entries:
        # Replicate
        from app.core.swarm import LogEntry
        core_entry = LogEntry(
            index=entry.index,
            term=entry.term,
            command=entry.command,
            payload=entry.payload
        )
        if node.replicate_entry(core_entry, request.vector_clock):
            match_idx = max(match_idx, core_entry.index)

    return SyncResponseModel(
        node_id=node.node_id,
        term=node.current_term,
        success=True,
        match_index=match_idx,
    )


def handle_get_topology() -> Dict[str, Any]:
    """
    GET /api/v1/swarm/topology
    Returns real-time mesh topology, vehicle Dynamic Kinetic Suspension Telemetry telemetry, and quorum health.
    """
    return cluster_instance.get_topology_snapshot()


def handle_post_command(request: SwarmCommandRequestModel) -> Dict[str, Any]:
    """
    POST /api/v1/swarm/command
    Submits kinetic state command to active leader. Replicates across cluster quorum.
    """
    if not cluster_instance.active_leader:
        return {"success": False, "error": "No active leader available"}

    leader = cluster_instance.nodes[cluster_instance.active_leader]
    entry = leader.append_command(request.command, request.payload)
    if entry:
        return {
            "success": True,
            "log_index": entry.index,
            "term": entry.term,
            "command": entry.command,
            "commit_index": leader.commit_index,
        }
    return {"success": False, "error": "Failed to achieve majority quorum replication"}


def handle_post_partition(request: PartitionRequestModel) -> Dict[str, Any]:
    """
    POST /api/v1/swarm/partition
    Simulates split-brain network partition across edge mesh.
    """
    cluster_instance.inject_partition(set(request.group_a), set(request.group_b))
    return {
        "success": True,
        "partitions": cluster_instance.partitions,
        "quorum_threshold": cluster_instance.quorum_threshold(),
    }


def handle_post_heal() -> Dict[str, Any]:
    """
    POST /api/v1/swarm/heal
    Heals all network partitions and triggers vector clock reconciliation.
    """
    cluster_instance.heal_partition()
    return {
        "success": True,
        "partitions": cluster_instance.partitions,
        "active_leader": cluster_instance.active_leader,
    }


# Optional FastAPI router integration when FastAPI is mounted
try:
    from fastapi import APIRouter
    router = APIRouter(prefix="/api/v1/swarm", tags=["Swarm Consensus"])

    @router.post("/heartbeat", response_model=HeartbeatResponseModel)
    async def api_post_heartbeat(req: HeartbeatRequestModel):
        return handle_post_heartbeat(req)

    @router.post("/sync", response_model=SyncResponseModel)
    async def api_post_sync(req: SyncRequestModel):
        return handle_post_sync(req)

    @router.get("/topology")
    async def api_get_topology():
        return handle_get_topology()

    @router.post("/command")
    async def api_post_command(req: SwarmCommandRequestModel):
        return handle_post_command(req)

    @router.post("/partition")
    async def api_post_partition(req: PartitionRequestModel):
        return handle_post_partition(req)

    @router.post("/heal")
    async def api_post_heal():
        return handle_post_heal()
except ImportError:
    router = None
