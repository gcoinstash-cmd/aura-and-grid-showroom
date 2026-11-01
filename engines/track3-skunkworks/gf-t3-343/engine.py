"""
GF-T3-343
Standalone FastAPI Engine for Asynchronous Multi-Node Tensor Parallelism
and Pipeline Parallelism Hybrid Interlock.
License: MIT
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional
import math
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(
    title="GF-T3-343",
    description="Asynchronous Multi-Node Tensor Parallelism and Pipeline Parallelism Hybrid Interlock Engine",
    version="3.4.3",
)

CORRIDORS: Dict[str, Dict[str, float | str]] = {
    "HYBRID-CORRIDOR-ALPHA (DYNAMIC-3D-PARALLEL-FABRIC · 134800-GB/S)": {
        "base_throughput_gbs": 134800.0,
        "base_latency_us": 0.01,
        "tp_degree": 4,
        "pp_degree": 2,
        "nvlink_overlap_factor": 0.995,
    },
    "HYBRID-CORRIDOR-BRAVO (TENSOR-PIPELINE-MESH-ENGINE)": {
        "base_throughput_gbs": 118400.0,
        "base_latency_us": 0.02,
        "tp_degree": 2,
        "pp_degree": 4,
        "nvlink_overlap_factor": 0.965,
    },
    "HYBRID-CORRIDOR-GAMMA (NON-BLOCKING-NVLINK-RDMA-ROUTER)": {
        "base_throughput_gbs": 96200.0,
        "base_latency_us": 0.03,
        "tp_degree": 4,
        "pp_degree": 2,
        "nvlink_overlap_factor": 0.940,
    },
    "HYBRID-CORRIDOR-DELTA (FALLBACK-SINGLE-NODE-PASS)": {
        "base_throughput_gbs": 42500.0,
        "base_latency_us": 0.09,
        "tp_degree": 1,
        "pp_degree": 8,
        "nvlink_overlap_factor": 0.780,
    },
}


class NodeTelemetry(BaseModel):
    node_id: int
    label: str
    hex_ptr: str
    tokens_k: int
    mesh_load_pct: int
    sync_pct: int
    latency_ms: float
    status: str
    tp_rank: int
    pp_stage: int


class HybridPartitionRequest(BaseModel):
    corridor: str = Field(
        default="HYBRID-CORRIDOR-ALPHA (DYNAMIC-3D-PARALLEL-FABRIC · 134800-GB/S)"
    )
    pipeline_stages: int = Field(default=2, ge=1, le=8)
    tensor_shards: int = Field(default=4, ge=1, le=8)
    micro_batches: int = Field(default=16, ge=1, le=512)
    layer_weight_norm: float = Field(default=1.0, gt=0.0, le=10.0)
    micro_batch_activation_norm: float = Field(default=1.0, gt=0.0, le=10.0)
    nvlink_ib_transfer_tau: float = Field(default=0.995, gt=0.0, le=1.0)
    bubble_spike_active: bool = Field(default=False)
    burst_multiplier: float = Field(default=1.0, ge=0.5, le=2.5)


class HybridTelemetryResponse(BaseModel):
    project_id: str
    corridor: str
    hybrid_interlock_metric: float
    throughput_gbs: float
    pipeline_latency_us: float
    active_nodes: int
    total_nodes: int
    processed_tokens_units: int
    engine_xp_k: float
    mesh_state: str
    bubble_fraction: float
    vector_signature: List[float]
    nodes: List[NodeTelemetry]


def compute_operator_partition(
    w_layer: float,
    x_micro_batch: float,
    tau_nvlink_ib: float,
    stage_idx: int,
    shard_idx: int,
) -> float:
    """
    Deterministic clean-room operator P(W_layer, X_micro_batch, tau_nvlink_ib)
    for stage p and tensor shard t.
    """
    if w_layer <= 0.0 or x_micro_batch <= 0.0 or tau_nvlink_ib <= 0.0:
        raise ValueError("Inputs to partition operator must be strictly positive.")
    harmonic_balance = 1.0 + 0.0025 * math.cos(float(stage_idx * 3 + shard_idx))
    overlap_gain = tau_nvlink_ib / (1.0 + (1.0 - tau_nvlink_ib) * 0.25)
    return round(w_layer * x_micro_batch * overlap_gain * harmonic_balance, 6)


def compute_hybrid_interlock_metric(
    pipeline_stages: int,
    tensor_shards: int,
    w_layer: float,
    x_micro_batch: float,
    tau_nvlink_ib: float,
) -> float:
    """
    Computes M_hybrid = sum_{p=0}^{P-1} sum_{t=0}^{T-1} P(W_layer, X_micro_batch, tau_nvlink_ib).
    """
    if pipeline_stages < 1 or tensor_shards < 1:
        raise ValueError("Pipeline stages and tensor shards must be at least 1.")
    total = 0.0
    for p_idx in range(pipeline_stages):
        for t_idx in range(tensor_shards):
            total += compute_operator_partition(
                w_layer=w_layer,
                x_micro_batch=x_micro_batch,
                tau_nvlink_ib=tau_nvlink_ib,
                stage_idx=p_idx,
                shard_idx=t_idx,
            )
    return round(total, 6)


def compute_pipeline_bubble_fraction(
    pipeline_stages: int,
    micro_batches: int,
    bubble_spike_active: bool = False,
    dynamic_reschedule: bool = True,
) -> float:
    """
    Computes pipeline bubble overhead fraction:
    Standard 1F1B schedule bubble is (P - 1) / (M + P - 1).
    With asynchronous NVLink-RDMA overlap and dynamic micro-batch rescheduling,
    stalls are suppressed toward zero.
    """
    if pipeline_stages <= 1:
        return 0.0
    if micro_batches < 1:
        raise ValueError("micro_batches must be at least 1.")
    raw_bubble = float(pipeline_stages - 1) / float(micro_batches + pipeline_stages - 1)
    if bubble_spike_active:
        if dynamic_reschedule:
            return round(raw_bubble * 0.18, 6)
        return round(min(0.65, raw_bubble * 1.45), 6)
    return round(raw_bubble * 0.015, 6)


@dataclass
class MeshSimulatorState:
    corridor: str = "HYBRID-CORRIDOR-ALPHA (DYNAMIC-3D-PARALLEL-FABRIC · 134800-GB/S)"
    burst_active: bool = False
    bubble_spike: bool = False
    step_count: int = 0
    processed_tokens: int = 29400000
    engine_xp_k: float = 75.0
    selected_node: int = 3

    def build_nodes(self) -> List[NodeTelemetry]:
        spec = CORRIDORS.get(
            self.corridor,
            CORRIDORS["HYBRID-CORRIDOR-ALPHA (DYNAMIC-3D-PARALLEL-FABRIC · 134800-GB/S)"],
        )
        tp_deg = int(spec["tp_degree"])
        nodes: List[NodeTelemetry] = []
        for idx in range(8):
            hex_addr = "0x520" + str(idx) + "0"
            if idx == 0:
                hex_addr = "0x52000"
            base_tok = 256 + (self.step_count * 8) + (64 if self.burst_active else 0)
            mesh_pct = 100 if not self.bubble_spike else (86 if idx % 2 == 1 else 94)
            sync_pct = 100 if not self.bubble_spike else 92
            lat_ms = 0.02 if not self.bubble_spike else (0.06 if idx % 2 == 1 else 0.03)
            if self.burst_active and not self.bubble_spike:
                lat_ms = 0.01
            status_str = (
                "PIPELINED · LOCKED"
                if not self.bubble_spike
                else ("RESCHEDULING · SYNC" if idx % 2 == 1 else "PIPELINED · LOCKED")
            )
            nodes.append(
                NodeTelemetry(
                    node_id=idx,
                    label="Node " + str(idx) + " (N" + str(idx) + ")",
                    hex_ptr=hex_addr,
                    tokens_k=base_tok,
                    mesh_load_pct=mesh_pct,
                    sync_pct=sync_pct,
                    latency_ms=lat_ms,
                    status=status_str,
                    tp_rank=idx % tp_deg,
                    pp_stage=idx // tp_deg,
                )
            )
        return nodes

    def snapshot(self) -> HybridTelemetryResponse:
        spec = CORRIDORS.get(
            self.corridor,
            CORRIDORS["HYBRID-CORRIDOR-ALPHA (DYNAMIC-3D-PARALLEL-FABRIC · 134800-GB/S)"],
        )
        tp_deg = int(spec["tp_degree"])
        pp_deg = int(spec["pp_degree"])
        tau = float(spec["nvlink_overlap_factor"])
        base_tp = float(spec["base_throughput_gbs"])
        base_lat = float(spec["base_latency_us"])

        m_hybrid = compute_hybrid_interlock_metric(
            pipeline_stages=pp_deg,
            tensor_shards=tp_deg,
            w_layer=1.02 if self.burst_active else 1.0,
            x_micro_batch=1.05 if self.burst_active else 1.0,
            tau_nvlink_ib=tau,
        )
        bubble = compute_pipeline_bubble_fraction(
            pipeline_stages=pp_deg,
            micro_batches=16 + self.step_count * 2,
            bubble_spike_active=self.bubble_spike,
            dynamic_reschedule=True,
        )
        burst_factor = 1.12 if self.burst_active else 1.0
        penalty_factor = (1.0 - bubble * 0.45) if self.bubble_spike else 1.0
        throughput = round(base_tp * burst_factor * penalty_factor, 1)
        latency = round(
            max(0.01, base_lat * (2.5 if self.bubble_spike else 1.0) / burst_factor),
            2,
        )
        vec_sig = [
            1.00,
            round(1.01 + (0.02 if self.burst_active else 0.0), 2),
            round(1.00 - (0.04 if self.bubble_spike else 0.0), 2),
            1.01,
        ]
        return HybridTelemetryResponse(
            project_id="GF-T3-343",
            corridor=self.corridor,
            hybrid_interlock_metric=m_hybrid,
            throughput_gbs=throughput,
            pipeline_latency_us=latency,
            active_nodes=8,
            total_nodes=8,
            processed_tokens_units=self.processed_tokens,
            engine_xp_k=round(self.engine_xp_k, 1),
            mesh_state="Active" if not self.bubble_spike else "Dynamic Re-Scheduling",
            bubble_fraction=bubble,
            vector_signature=vec_sig,
            nodes=self.build_nodes(),
        )


SIMULATOR = MeshSimulatorState()


@app.get("/health")
def health_check() -> Dict[str, str]:
    return {"status": "OK", "engine": "GF-T3-343", "mesh_state": "Active"}


@app.get("/api/v1/telemetry", response_model=HybridTelemetryResponse)
def get_telemetry() -> HybridTelemetryResponse:
    return SIMULATOR.snapshot()


@app.post("/api/v1/evaluate", response_model=HybridTelemetryResponse)
def evaluate_partition(payload: HybridPartitionRequest) -> HybridTelemetryResponse:
    if payload.corridor not in CORRIDORS:
        raise HTTPException(status_code=400, detail="Unsupported synthetic hybrid corridor.")
    m_hybrid = compute_hybrid_interlock_metric(
        pipeline_stages=payload.pipeline_stages,
        tensor_shards=payload.tensor_shards,
        w_layer=payload.layer_weight_norm,
        x_micro_batch=payload.micro_batch_activation_norm,
        tau_nvlink_ib=payload.nvlink_ib_transfer_tau,
    )
    bubble = compute_pipeline_bubble_fraction(
        pipeline_stages=payload.pipeline_stages,
        micro_batches=payload.micro_batches,
        bubble_spike_active=payload.bubble_spike_active,
        dynamic_reschedule=True,
    )
    spec = CORRIDORS[payload.corridor]
    base_tp = float(spec["base_throughput_gbs"])
    base_lat = float(spec["base_latency_us"])
    effective_tp = round(base_tp * payload.burst_multiplier * (1.0 - bubble * 0.4), 1)
    effective_lat = round(
        max(0.01, base_lat * (1.0 + bubble * 4.0) / payload.burst_multiplier), 2
    )
    SIMULATOR.corridor = payload.corridor
    SIMULATOR.bubble_spike = payload.bubble_spike_active
    SIMULATOR.burst_active = payload.burst_multiplier > 1.0
    snap = SIMULATOR.snapshot()
    snap.hybrid_interlock_metric = m_hybrid
    snap.throughput_gbs = effective_tp
    snap.pipeline_latency_us = effective_lat
    snap.bubble_fraction = bubble
    return snap


@app.post("/api/v1/actions/burst", response_model=HybridTelemetryResponse)
def trigger_hybrid_burst() -> HybridTelemetryResponse:
    SIMULATOR.burst_active = not SIMULATOR.burst_active
    SIMULATOR.processed_tokens += 1200000
    SIMULATOR.engine_xp_k += 4.5
    return SIMULATOR.snapshot()


@app.post("/api/v1/actions/bubble-spike", response_model=HybridTelemetryResponse)
def toggle_bubble_spike() -> HybridTelemetryResponse:
    SIMULATOR.bubble_spike = not SIMULATOR.bubble_spike
    SIMULATOR.engine_xp_k += 2.0
    return SIMULATOR.snapshot()


@app.post("/api/v1/actions/step", response_model=HybridTelemetryResponse)
def step_mesh_pass() -> HybridTelemetryResponse:
    SIMULATOR.step_count += 1
    SIMULATOR.processed_tokens += 650000
    SIMULATOR.engine_xp_k += 2.5
    return SIMULATOR.snapshot()


@app.post("/api/v1/actions/flush", response_model=HybridTelemetryResponse)
def flush_hybrid_arenas() -> HybridTelemetryResponse:
    SIMULATOR.burst_active = False
    SIMULATOR.bubble_spike = False
    SIMULATOR.step_count = 0
    SIMULATOR.processed_tokens = 29400000
    SIMULATOR.engine_xp_k = 75.0
    return SIMULATOR.snapshot()
