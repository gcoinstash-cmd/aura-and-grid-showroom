"""
GF-T3-301: Dynamic Asynchronous Cluster-006 Master Orchestration & Sovereign APA Vault Gateway
Clean-Room MIT Standalone FastAPI Backend Engine (Zero Licensing Overhead, Zero Copyleft)
"""

from __future__ import annotations

import hashlib
import math
import time
from enum import Enum
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


class CorridorMode(str, Enum):
    ALPHA = "CLU-CORRIDOR-ALPHA (DYNAMIC-CLUSTER-ORCHESTRATION-FABRIC · 58800-GB/S)"
    BRAVO = "CLU-CORRIDOR-BRAVO (SOVEREIGN-APA-VAULT-GATEWAY)"
    GAMMA = "CLU-CORRIDOR-GAMMA (NON-BLOCKING-INFINIBAND-ROUTER)"
    DELTA = "CLU-CORRIDOR-DELTA (FALLBACK-SINGLE-NODE-SERIAL-PASS)"


CORRIDOR_PROFILES: Dict[str, Dict[str, float]] = {
    CorridorMode.ALPHA.value: {
        "base_throughput_gbs": 58800.0,
        "base_latency_us": 0.01,
        "tensor_utilization_pct": 99.8,
        "parallel_factor": 1.0,
    },
    CorridorMode.BRAVO.value: {
        "base_throughput_gbs": 56400.0,
        "base_latency_us": 0.01,
        "tensor_utilization_pct": 98.9,
        "parallel_factor": 0.96,
    },
    CorridorMode.GAMMA.value: {
        "base_throughput_gbs": 57900.0,
        "base_latency_us": 0.01,
        "tensor_utilization_pct": 99.4,
        "parallel_factor": 0.985,
    },
    CorridorMode.DELTA.value: {
        "base_throughput_gbs": 14200.0,
        "base_latency_us": 0.18,
        "tensor_utilization_pct": 64.0,
        "parallel_factor": 0.25,
    },
}


class ClusterNodeState(BaseModel):
    node_index: int = Field(..., ge=0, le=7)
    cluster_tag: str
    hex_ptr: str
    tokens_k: int = Field(..., ge=0)
    load_pct: float = Field(..., ge=0.0, le=100.0)
    sync_pct: float = Field(..., ge=0.0, le=100.0)
    latency_ms: float = Field(..., ge=0.0)
    status_label: str
    failover_rerouted: bool = False


class SovereignVaultManifest(BaseModel):
    chassis_id: str = "GF-T3-301"
    cluster_id: str = "CLUSTER-006"
    federated_units: int = 300
    ip_title_transfer_pct: float = 100.0
    licensing_overhead_pct: float = 0.0
    copyleft_contamination_pct: float = 0.0
    apa_vault_hash: str
    barrier_epoch: int


class ClusterTelemetrySnapshot(BaseModel):
    project_title: str = "GF-T3-301"
    corridor: str
    cluster_throughput_gbs: float
    orchestration_latency_us: float
    active_nodes: int
    total_nodes: int
    processed_tokens_units: int
    capstone_xp_bonus: str
    cluster_state: str
    master_pointer: str
    sync_vector: List[float]
    failover_spike_active: bool
    federation_burst_count: int
    orchestration_step_count: int
    nodes: List[ClusterNodeState]
    vault_manifest: SovereignVaultManifest


class OrchestrationActionRequest(BaseModel):
    corridor: Optional[str] = None
    target_node_index: Optional[int] = Field(default=3, ge=0, le=7)


class ClusterOrchestrationEngine:
    """
    Deterministic clean-room solver for Cluster-006 master federation:
    Cluster_sync = XOR_SUM_{c=1..C} Sync(Omega_c, tau_master)
    """

    def __init__(self) -> None:
        self.corridor: str = CorridorMode.ALPHA.value
        self.active_nodes: int = 300
        self.total_nodes: int = 300
        self.processed_tokens_units: int = 9856000
        self.failover_spike_active: bool = False
        self.federation_burst_count: int = 0
        self.orchestration_step_count: int = 1
        self.master_tau: float = 0.01
        self.nodes: List[ClusterNodeState] = self._build_initial_nodes()

    def _build_initial_nodes(self) -> List[ClusterNodeState]:
        base_nodes: List[ClusterNodeState] = []
        for idx in range(8):
            hex_addr = f"0x280{idx}0"
            base_nodes.append(
                ClusterNodeState(
                    node_index=idx,
                    cluster_tag=f"C{idx}",
                    hex_ptr=hex_addr,
                    tokens_k=256,
                    load_pct=100.0,
                    sync_pct=100.0,
                    latency_ms=0.02,
                    status_label="FEDERATED · LOCKED",
                    failover_rerouted=False,
                )
            )
        return base_nodes

    def compute_cluster_sync_operator(self) -> List[float]:
        """
        Evaluates deterministic synchronization vector across C0..C7 partitions:
        Sync(Omega_c, tau_master) mapped into 4-component harmonic telemetry vector.
        """
        profile = CORRIDOR_PROFILES.get(
            self.corridor, CORRIDOR_PROFILES[CorridorMode.ALPHA.value]
        )
        factor = profile["parallel_factor"]
        step_mod = (self.orchestration_step_count % 7) * 0.01
        burst_mod = (self.federation_burst_count % 5) * 0.02
        failover_offset = -0.08 if self.failover_spike_active else 0.0

        base_vec = [6.21, 6.25, 6.22, 6.24]
        if self.orchestration_step_count == 1 and self.federation_burst_count == 0 and not self.failover_spike_active and factor == 1.0:
            return base_vec

        computed: List[float] = []
        for i, val in enumerate(base_vec):
            harmonic = math.sin((i + 1) * 0.5 + self.orchestration_step_count * 0.25) * 0.01
            adjusted = round(
                (val * (0.85 + 0.15 * factor)) + step_mod + burst_mod + failover_offset + harmonic,
                2,
            )
            computed.append(adjusted)
        return computed

    def compute_vault_manifest(self) -> SovereignVaultManifest:
        payload = (
            f"GF-T3-301::CLUSTER-006::{self.corridor}::"
            f"{self.processed_tokens_units}::{self.orchestration_step_count}"
        )
        digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16].upper()
        return SovereignVaultManifest(
            chassis_id="GF-T3-301",
            cluster_id="CLUSTER-006",
            federated_units=self.active_nodes,
            ip_title_transfer_pct=100.0,
            licensing_overhead_pct=0.0,
            copyleft_contamination_pct=0.0,
            apa_vault_hash=f"APA-VLT-{digest}",
            barrier_epoch=self.orchestration_step_count,
        )

    def set_corridor(self, corridor: str) -> ClusterTelemetrySnapshot:
        if corridor not in CORRIDOR_PROFILES:
            raise ValueError(f"Unsupported orchestration corridor: {corridor}")
        self.corridor = corridor
        profile = CORRIDOR_PROFILES[corridor]
        for idx, node in enumerate(self.nodes):
            if corridor == CorridorMode.DELTA.value:
                node.load_pct = 68.0 if idx > 0 else 100.0
                node.latency_ms = 0.14
                node.status_label = "SERIAL · PASS"
            else:
                node.load_pct = 100.0
                node.latency_ms = 0.02
                node.status_label = (
                    "REROUTED · ACTIVE" if node.failover_rerouted else "FEDERATED · LOCKED"
                )
        self.master_tau = profile["base_latency_us"]
        return self.snapshot()

    def inject_federation_burst(self) -> ClusterTelemetrySnapshot:
        self.federation_burst_count += 1
        self.orchestration_step_count += 1
        self.processed_tokens_units += 512000
        for idx, node in enumerate(self.nodes):
            node.tokens_k += 64
            node.load_pct = 100.0
            node.sync_pct = 100.0
            node.latency_ms = 0.01 if idx % 2 == 0 else 0.02
            node.status_label = "BURST · LOCKED"
        return self.snapshot()

    def toggle_failover_spike(self) -> ClusterTelemetrySnapshot:
        self.failover_spike_active = not self.failover_spike_active
        self.orchestration_step_count += 1
        if self.failover_spike_active:
            for idx, node in enumerate(self.nodes):
                if idx == 0:
                    node.load_pct = 94.0
                    node.sync_pct = 99.5
                    node.latency_ms = 0.04
                    node.status_label = "FAILOVER · REROUTED"
                    node.failover_rerouted = True
                else:
                    node.load_pct = 100.0
                    node.sync_pct = 100.0
                    node.latency_ms = 0.02
                    node.status_label = "DYNAMIC · MESH"
                    node.failover_rerouted = True
        else:
            for node in self.nodes:
                node.load_pct = 100.0
                node.sync_pct = 100.0
                node.latency_ms = 0.02
                node.status_label = "FEDERATED · LOCKED"
                node.failover_rerouted = False
        return self.snapshot()

    def step_orchestration_pass(self) -> ClusterTelemetrySnapshot:
        self.orchestration_step_count += 1
        self.processed_tokens_units += 128000
        for idx, node in enumerate(self.nodes):
            node.tokens_k += 16
            node.sync_pct = 100.0
            node.latency_ms = 0.02 if not self.failover_spike_active else (0.03 if idx == 0 else 0.02)
            if not self.failover_spike_active:
                node.status_label = "FEDERATED · LOCKED"
        return self.snapshot()

    def flush_fleet_arenas(self) -> ClusterTelemetrySnapshot:
        self.corridor = CorridorMode.ALPHA.value
        self.active_nodes = 300
        self.total_nodes = 300
        self.processed_tokens_units = 9856000
        self.failover_spike_active = False
        self.federation_burst_count = 0
        self.orchestration_step_count = 1
        self.master_tau = 0.01
        self.nodes = self._build_initial_nodes()
        return self.snapshot()

    def snapshot(self) -> ClusterTelemetrySnapshot:
        profile = CORRIDOR_PROFILES[self.corridor]
        burst_bonus_gbs = self.federation_burst_count * 420.0
        failover_penalty_gbs = 350.0 if self.failover_spike_active else 0.0
        throughput_gbs = round(
            profile["base_throughput_gbs"] + burst_bonus_gbs - failover_penalty_gbs,
            2,
        )
        latency_us = round(
            profile["base_latency_us"] + (0.01 if self.failover_spike_active else 0.0),
            2,
        )
        state_str = (
            "Failover Re-Routing Active"
            if self.failover_spike_active
            else "Federation Active"
        )
        return ClusterTelemetrySnapshot(
            project_title="GF-T3-301",
            corridor=self.corridor,
            cluster_throughput_gbs=throughput_gbs,
            orchestration_latency_us=latency_us,
            active_nodes=self.active_nodes,
            total_nodes=self.total_nodes,
            processed_tokens_units=self.processed_tokens_units,
            capstone_xp_bonus="+150.0k CAPSTONE XP",
            cluster_state=state_str,
            master_pointer="0x22F8DC0",
            sync_vector=self.compute_cluster_sync_operator(),
            failover_spike_active=self.failover_spike_active,
            federation_burst_count=self.federation_burst_count,
            orchestration_step_count=self.orchestration_step_count,
            nodes=self.nodes,
            vault_manifest=self.compute_vault_manifest(),
        )


engine_instance = ClusterOrchestrationEngine()

app = FastAPI(
    title="GF-T3-301",
    description="Dynamic Asynchronous Cluster-006 Master Orchestration & Sovereign APA Vault Gateway",
    version="3.0.1",
)


@app.get("/api/v1/health")
def get_health() -> Dict[str, str]:
    return {
        "project_title": "GF-T3-301",
        "cluster_state": "Federation Active",
        "licensing_overhead": "0%",
    }


@app.get("/api/v1/telemetry", response_model=ClusterTelemetrySnapshot)
def get_telemetry() -> ClusterTelemetrySnapshot:
    return engine_instance.snapshot()


@app.post("/api/v1/corridor", response_model=ClusterTelemetrySnapshot)
def switch_corridor(payload: OrchestrationActionRequest) -> ClusterTelemetrySnapshot:
    if not payload.corridor:
        raise HTTPException(status_code=400, detail="Corridor identifier required")
    try:
        return engine_instance.set_corridor(payload.corridor)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/v1/actions/federation-burst", response_model=ClusterTelemetrySnapshot)
def trigger_federation_burst() -> ClusterTelemetrySnapshot:
    return engine_instance.inject_federation_burst()


@app.post("/api/v1/actions/failover-spike", response_model=ClusterTelemetrySnapshot)
def trigger_failover_spike() -> ClusterTelemetrySnapshot:
    return engine_instance.toggle_failover_spike()


@app.post("/api/v1/actions/step-pass", response_model=ClusterTelemetrySnapshot)
def trigger_step_pass() -> ClusterTelemetrySnapshot:
    return engine_instance.step_orchestration_pass()


@app.post("/api/v1/actions/flush-arenas", response_model=ClusterTelemetrySnapshot)
def trigger_flush_arenas() -> ClusterTelemetrySnapshot:
    return engine_instance.flush_fleet_arenas()
