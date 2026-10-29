"""
GF-T3-290: Dynamic Asynchronous Tensor Parallelism & All-Reduce Ring-Topology Engine
Clean-Room Standalone FastAPI Backend (MIT Permissive License)
Zero-Copyleft Deterministic Multi-GPU Ring Reduction & Tensor Slicing Simulator
"""

from enum import Enum
from typing import Dict, List, Optional
import math
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(
    title="GF-T3-290",
    description="Dynamic Asynchronous Tensor Parallelism and All-Reduce Ring-Topology Engine",
    version="3.290.0",
)


class TensorCorridor(str, Enum):
    ALPHA = "TENSOR-CORRIDOR-ALPHA (DYNAMIC-TENSOR-PARALLELISM-FABRIC · 45600-GB/S)"
    BRAVO = "TENSOR-CORRIDOR-BRAVO (ALL-REDUCE-RING-TOPOLOGY-ENGINE)"
    GAMMA = "TENSOR-CORRIDOR-GAMMA (NON-BLOCKING-PEER-TO-PEER-TENSOR-SLICER)"
    DELTA = "TENSOR-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-TENSOR-PASS)"


class RankTelemetry(BaseModel):
    rank_id: int = Field(..., ge=0, le=7)
    rank_code: str
    hex_ptr: str
    tokens_k: int = Field(..., ge=0)
    ring_bandwidth_gbps: int = Field(..., ge=0)
    latency_ms: float = Field(..., ge=0.0)
    sync_pct: float = Field(..., ge=0.0, le=100.0)
    state_label: str
    slice_vector: List[float]


class TelemetrySnapshot(BaseModel):
    chassis_id: str
    corridor: TensorCorridor
    tensor_throughput_gbps: int
    ring_latency_us: float
    active_ranks: int
    total_ranks: int
    processed_tokens_units: int
    engine_xp_k: float
    tensor_state: str
    view_mode: str
    base_ptr: str
    execution_mode: str
    collective_vector: List[float]
    congestion_active: bool
    step_sequence: int
    ranks: List[RankTelemetry]
    radio_logs: List[str]


classBurstTriggerRequest(BaseModel):
    multiplier: float = Field(default=1.25, ge=1.0, le=4.0)
    corridor: Optional[TensorCorridor] = None


class RingReduceCalculationRequest(BaseModel):
    num_ranks: int = Field(default=8, ge=1, le=64)
    payload_bytes: int = Field(default=268435456, gt=0)
    link_bandwidth_gbps: float = Field(default=45600.0, gt=0.0)
    barrier_alpha_us: float = Field(default=0.01, ge=0.0)


class RingReduceCalculationResponse(BaseModel):
    num_ranks: int
    payload_bytes: int
    allreduce_time_us: float
    effective_throughput_gbps: float
    scaling_efficiency_pct: float
    tensor_state: str


def compute_ring_allreduce_latency_us(
    num_ranks: int,
    payload_bytes: int,
    link_bandwidth_gbps: float,
    barrier_alpha_us: float = 0.01,
) -> float:
    """
    Computes ring All-Reduce latency in microseconds using the deterministic formula:
    T_allreduce = 2 * ((N - 1) / N) * (M / Bandwidth_NVLink) + alpha
    """
    if num_ranks <= 1:
        return round(barrier_alpha_us, 4)
    ring_factor = 2.0 * float(num_ranks - 1) / float(num_ranks)
    bytes_per_us = (link_bandwidth_gbps * 1e9) / 1e6
    transfer_us = float(payload_bytes) / bytes_per_us
    total_us = (ring_factor * transfer_us) + barrier_alpha_us
    return round(total_us, 4)


def partition_attention_weights(
    matrix_dim: int,
    num_ranks: int,
    step_seed: int = 1,
) -> List[List[float]]:
    """
    Deterministically partitions column and row attention projection weights
    across N worker ranks without host CPU round-trips or unverified randoms.
    """
    if num_ranks < 1:
        raise ValueError("num_ranks must be >= 1")
    if matrix_dim < num_ranks or matrix_dim % num_ranks != 0:
        raise ValueError("matrix_dim must be a positive multiple of num_ranks")

    slices: List[List[float]] = []
    for r in range(num_ranks):
        vec = [
            round(5.10 + ((r * 3 + i * 2 + step_seed) % 9) * 0.01, 2)
            for i in range(4)
        ]
        slices.append(vec)
    return slices


def synchronize_ring_gradients(rank_slices: List[List[float]]) -> List[float]:
    """
    Performs deterministic ring reduction (mean-reduced accumulation) across all active rank slices.
    """
    if not rank_slices:
        return [0.0, 0.0, 0.0, 0.0]
    num_ranks = len(rank_slices)
    dim = len(rank_slices[0])
    reduced: List[float] = []
    for d in range(dim):
        total = sum(rank_slices[r][d] for r in range(num_ranks))
        reduced.append(round(total / float(num_ranks), 2))
    return reduced


class TensorParallelCockpitEngine:
    def __init__(self) -> None:
        self.reset_state()

    def reset_state(self) -> None:
        self.corridor: TensorCorridor = TensorCorridor.ALPHA
        self.tensor_throughput_gbps: int = 45600
        self.ring_latency_us: float = 0.01
        self.active_ranks: int = 8
        self.total_ranks: int = 8
        self.processed_tokens_units: int = 8448000
        self.engine_xp_k: float = 75.0
        self.tensor_state: str = "Parallel Active"
        self.congestion_active: bool = False
        self.step_sequence: int = 1
        self.ranks: List[RankTelemetry] = self._build_ranks(
            tokens_k=256,
            ring_gbps=100,
            latency_ms=0.02,
            sync_pct=100.0,
            state_label="REDUCED · LOCKED",
        )
        self.collective_vector: List[float] = [5.11, 5.15, 5.12, 5.14]
        self.radio_logs: List[str] = [
            "[00:01.04] 🟢 CREW CHIEF: Asynchronous tensor parallelism and all-reduce ring-topology engine initialized · 8 ranks linked",
            "[00:01.08] 🟢 TELEMETRY: Ring All-Reduce tensor slicing verified at 45,600 GB/s with zero communication stalls",
        ]

    def _build_ranks(
        self,
        tokens_k: int,
        ring_gbps: int,
        latency_ms: float,
        sync_pct: float,
        state_label: str,
    ) -> List[RankTelemetry]:
        slices = partition_attention_weights(64, 8, self.step_sequence)
        items: List[RankTelemetry] = []
        for idx in range(8):
            hex_addr = "0x" + format(0x17000 + (idx * 0x10), "05X")
            items.append(
                RankTelemetry(
                    rank_id=idx,
                    rank_code="K" + str(idx),
                    hex_ptr=hex_addr,
                    tokens_k=tokens_k,
                    ring_bandwidth_gbps=ring_gbps,
                    latency_ms=latency_ms,
                    sync_pct=sync_pct,
                    state_label=state_label,
                    slice_vector=slices[idx],
                )
            )
        return items

    def snapshot(self) -> TelemetrySnapshot:
        return TelemetrySnapshot(
            chassis_id="GF-T3-290",
            corridor=self.corridor,
            tensor_throughput_gbps=self.tensor_throughput_gbps,
            ring_latency_us=self.ring_latency_us,
            active_ranks=self.active_ranks,
            total_ranks=self.total_ranks,
            processed_tokens_units=self.processed_tokens_units,
            engine_xp_k=self.engine_xp_k,
            tensor_state=self.tensor_state,
            view_mode="MESH",
            base_ptr="0x16F8DC0",
            execution_mode="TENSOR_PARALLEL",
            collective_vector=self.collective_vector,
            congestion_active=self.congestion_active,
            step_sequence=self.step_sequence,
            ranks=self.ranks,
            radio_logs=self.radio_logs[-4:],
        )

    def trigger_tensor_burst(self, multiplier: float = 1.25) -> TelemetrySnapshot:
        self.step_sequence += 1
        self.tensor_throughput_gbps = int(round(45600 * multiplier))
        self.processed_tokens_units += 1056000
        self.engine_xp_k = round(self.engine_xp_k + 12.5, 1)
        self.ring_latency_us = 0.01
        self.tensor_state = "Parallel Burst Active"
        self.ranks = self._build_ranks(
            tokens_k=320,
            ring_gbps=125,
            latency_ms=0.01,
            sync_pct=100.0,
            state_label="BURST · LOCKED",
        )
        self.collective_vector = synchronize_ring_gradients(
            [r.slice_vector for r in self.ranks]
        )
        self.radio_logs.append(
            "[00:02.14] 🟠 BURST: Trigger Tensor Parallelism Burst engaged · Throughput scaled to "
            + format(self.tensor_throughput_gbps, ",")
            + " GB/s"
        )
        return self.snapshot()

    def toggle_ring_congestion(self) -> TelemetrySnapshot:
        self.step_sequence += 1
        self.congestion_active = not self.congestion_active
        if self.congestion_active:
            self.corridor = TensorCorridor.GAMMA
            self.tensor_throughput_gbps = 38400
            self.ring_latency_us = 0.04
            self.tensor_state = "Re-Routing Active"
            self.ranks = self._build_ranks(
                tokens_k=240,
                ring_gbps=88,
                latency_ms=0.05,
                sync_pct=98.5,
                state_label="REROUTED · SYNC",
            )
            self.radio_logs.append(
                "[00:03.02] ⚡ SPIKE: Inject Ring Congestion Spike detected · All-Reduce re-routing over non-blocking P2P fabric"
            )
        else:
            self.corridor = TensorCorridor.ALPHA
            self.tensor_throughput_gbps = 45600
            self.ring_latency_us = 0.01
            self.tensor_state = "Parallel Active"
            self.ranks = self._build_ranks(
                tokens_k=256,
                ring_gbps=100,
                latency_ms=0.02,
                sync_pct=100.0,
                state_label="REDUCED · LOCKED",
            )
            self.radio_logs.append(
                "[00:03.48] 🟢 CLEAR: Ring congestion spike resolved · Full 45,600 GB/s NVLink ring topology restored"
            )
        self.collective_vector = synchronize_ring_gradients(
            [r.slice_vector for r in self.ranks]
        )
        return self.snapshot()

    def step_ring_reduce_pass(self) -> TelemetrySnapshot:
        self.step_sequence += 1
        self.processed_tokens_units += 512000
        self.engine_xp_k = round(self.engine_xp_k + 8.0, 1)
        self.ring_latency_us = compute_ring_allreduce_latency_us(
            num_ranks=self.active_ranks,
            payload_bytes=65536,
            link_bandwidth_gbps=float(self.tensor_throughput_gbps),
            barrier_alpha_us=0.01,
        )
        self.ranks = self._build_ranks(
            tokens_k=256 + (self.step_sequence * 8),
            ring_gbps=100,
            latency_ms=0.02,
            sync_pct=100.0,
            state_label="REDUCED · LOCKED",
        )
        self.collective_vector = synchronize_ring_gradients(
            [r.slice_vector for r in self.ranks]
        )
        self.radio_logs.append(
            "[00:04.19] 🚀 PASS: Step Asynchronous Ring-Reduce Pass completed across 8 ranks · Barrier sync verified"
        )
        return self.snapshot()

    def flush_rank_arenas(self) -> TelemetrySnapshot:
        self.reset_state()
        self.radio_logs.append(
            "[00:05.00] 🔄 FLUSH: Flush Rank Buffers and Re-Zero Tensor Arenas completed · Baseline 45,600 GB/s locked"
        )
        return self.snapshot()


ENGINE = TensorParallelCockpitEngine()


@app.get("/health")
def health_check() -> Dict[str, str]:
    return {
        "status": "OK",
        "chassis": "GF-T3-290",
        "tensor_state": ENGINE.tensor_state,
    }


@app.get("/api/v1/telemetry", response_model=TelemetrySnapshot)
def get_telemetry() -> TelemetrySnapshot:
    return ENGINE.snapshot()


@app.post("/api/v1/compute/allreduce", response_model=RingReduceCalculationResponse)
def compute_allreduce(req: RingReduceCalculationRequest) -> RingReduceCalculationResponse:
    latency_us = compute_ring_allreduce_latency_us(
        num_ranks=req.num_ranks,
        payload_bytes=req.payload_bytes,
        link_bandwidth_gbps=req.link_bandwidth_gbps,
        barrier_alpha_us=req.barrier_alpha_us,
    )
    scaling_eff = 100.0 if req.num_ranks == 1 else round(
        (float(req.num_ranks - 1) / float(req.num_ranks)) * 100.0, 2
    )
    eff_gbps = round(req.link_bandwidth_gbps * (scaling_eff / 100.0), 2)
    return RingReduceCalculationResponse(
        num_ranks=req.num_ranks,
        payload_bytes=req.payload_bytes,
        allreduce_time_us=latency_us,
        effective_throughput_gbps=eff_gbps,
        scaling_efficiency_pct=scaling_eff,
        tensor_state="Parallel Active",
    )


@app.post("/api/v1/actions/burst", response_model=TelemetrySnapshot)
def action_burst(req: Optional[classBurstTriggerRequest] = None) -> TelemetrySnapshot:
    mult = req.multiplier if req else 1.25
    if req and req.corridor:
        ENGINE.corridor = req.corridor
    return ENGINE.trigger_tensor_burst(multiplier=mult)


@app.post("/api/v1/actions/congestion", response_model=TelemetrySnapshot)
def action_congestion() -> TelemetrySnapshot:
    return ENGINE.toggle_ring_congestion()


@app.post("/api/v1/actions/step-ring-reduce", response_model=TelemetrySnapshot)
def action_step_ring_reduce() -> TelemetrySnapshot:
    return ENGINE.step_ring_reduce_pass()


@app.post("/api/v1/actions/flush", response_model=TelemetrySnapshot)
def action_flush() -> TelemetrySnapshot:
    return ENGINE.flush_rank_arenas()
