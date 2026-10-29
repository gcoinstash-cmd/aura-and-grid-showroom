"""
GF-T3-224: Tensor-Parallel Ring All-Reduce & Comm-Comp Stream Overlap Engine
Clean-Room Distributed Tensor Fabric Implementation
SPDX-License-Identifier: MIT
"""

from __future__ import annotations

import hashlib
import math
from dataclasses import dataclass, field
from typing import Dict, List, Literal, Optional, Tuple
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator


CORRIDOR_PROFILES: Dict[str, Dict[str, object]] = {
    "TP-CORRIDOR-ALPHA": {
        "label": "TP-CORRIDOR-ALPHA (4-GPU · NVLINK-RING-FABRIC)",
        "world_size": 4,
        "peak_bandwidth_gbps": 840.0,
        "base_latency_ms": 0.08,
        "overlap_factor": 0.88,
        "buckets": 4,
    },
    "TP-CORRIDOR-BRAVO": {
        "label": "TP-CORRIDOR-BRAVO (8-GPU · HYBRID-TORUS-MESH)",
        "world_size": 8,
        "peak_bandwidth_gbps": 1120.0,
        "base_latency_ms": 0.14,
        "overlap_factor": 0.91,
        "buckets": 8,
    },
    "TP-CORRIDOR-GAMMA": {
        "label": "TP-CORRIDOR-GAMMA (COMM-COMP-STREAM-OVERLAP)",
        "world_size": 4,
        "peak_bandwidth_gbps": 960.0,
        "base_latency_ms": 0.06,
        "overlap_factor": 0.962,
        "buckets": 4,
    },
    "TP-CORRIDOR-DELTA": {
        "label": "TP-CORRIDOR-DELTA (BUCKETED-ALL-REDUCE-FALLBACK)",
        "world_size": 4,
        "peak_bandwidth_gbps": 620.0,
        "base_latency_ms": 0.19,
        "overlap_factor": 0.74,
        "buckets": 4,
    },
}


@dataclass
class RankState:
    rank_id: int
    memory_address: str
    local_activations: List[float]
    chunks: List[List[float]]
    reduced_chunk_index: int
    accumulated_passes: int = 0
    packet_drop_detected: bool = False
    parity_hash: str = ""


@dataclass
class StreamBucketSchedule:
    bucket_id: int
    compute_start_ms: float
    compute_end_ms: float
    comm_start_ms: float
    comm_end_ms: float
    overlapped_ms: float


class RingStepRequest(BaseModel):
    corridor_id: str = Field(default="TP-CORRIDOR-ALPHA", pattern="^[A-Z0-9-]+")
    world_size: int = Field(default=4, ge=2, le=16)
    tensor_units: int = Field(default=128000, ge=64, le=1024000)
    bus_throttle_ratio: float = Field(default=1.0, ge=0.1, le=1.0)
    comm_overlap_enabled: bool = Field(default=True)
    inject_packet_drop_rank: Optional[int] = Field(default=None)

    @field_validator("corridor_id")
    @classmethod
    def validate_corridor(cls, value: str) -> str:
        if value not in CORRIDOR_PROFILES:
            raise ValueError("Unsupported synthetic corridor identifier")
        return value


def compute_parity_checksum(values: List[float]) -> str:
    quantized = ",".join(f"{round(v, 6):.6f}" for v in values)
    digest = hashlib.sha256(quantized.encode("utf-8")).hexdigest()[:12].upper()
    return f"CRC-{digest}"


def single_node_reference_matmul_reduce(
    rank_matrices: List[List[float]],
) -> List[float]:
    """
    Computes the exact single-node reference sum across all rank outputs.
    In column-then-row sharded Tensor Parallelism:
    Y = sum_{r=0}^{N-1} (X_r @ W_r)
    """
    if not rank_matrices:
        return []
    length = len(rank_matrices[0])
    result = [0.0] * length
    for rank_vec in rank_matrices:
        if len(rank_vec) != length:
            raise ValueError("Rank vector dimension mismatch")
        for idx, val in enumerate(rank_vec):
            result[idx] = round(result[idx] + val, 8)
    return result


def partition_tensor_into_buckets(
    vector: List[float], num_buckets: int
) -> List[List[float]]:
    if len(vector) % num_buckets != 0:
        raise ValueError("Vector length must be divisible by num_buckets")
    chunk_size = len(vector) // num_buckets
    return [
        list(vector[i * chunk_size : (i + 1) * chunk_size])
        for i in range(num_buckets)
    ]


class RingAllReduceEngine:
    """
    Deterministic 2-Phase Ring All-Reduce Engine:
    - Phase 1 (Scatter-Reduce): N - 1 steps where rank r sends chunk (r - s) mod N
      clockwise to rank (r + 1) mod N and accumulates incoming chunk (r - s - 1) mod N.
    - Phase 2 (All-Gather): N - 1 steps where rank r circulates its fully reduced
      chunk clockwise around the ring until all N ranks hold the identical global tensor.
    """

    def __init__(self, world_size: int = 4, corridor_id: str = "TP-CORRIDOR-ALPHA"):
        if world_size < 2:
            raise ValueError("world_size must be at least 2")
        self.world_size = world_size
        self.corridor_id = (
            corridor_id if corridor_id in CORRIDOR_PROFILES else "TP-CORRIDOR-ALPHA"
        )
        self.current_step = 0
        self.total_steps = 2 * (world_size - 1)
        self.bus_throttle_ratio = 1.0
        self.comm_overlap_enabled = True
        self.ranks: List[RankState] = []
        self.accumulation_trace: List[Dict[str, object]] = []
        self._initialize_ranks()

    def _initialize_ranks(self) -> None:
        self.ranks = []
        self.accumulation_trace = []
        self.current_step = 0
        vec_len = self.world_size * 4
        for r in range(self.world_size):
            # Deterministic non-random harmonic shard weights per rank
            local_vec = [
                round(((r + 1) * 1.25) + ((idx + 1) * 0.5), 6)
                for idx in range(vec_len)
            ]
            chunks = partition_tensor_into_buckets(local_vec, self.world_size)
            mem_addr = f"0x7F0{r}A000:0x7F0{r}FFFF"
            self.ranks.append(
                RankState(
                    rank_id=r,
                    memory_address=mem_addr,
                    local_activations=local_vec,
                    chunks=chunks,
                    reduced_chunk_index=(r + 1) % self.world_size,
                    accumulated_passes=0,
                    packet_drop_detected=False,
                    parity_hash=compute_parity_checksum(local_vec),
                )
            )

    def step_scatter_reduce(self, step_idx: int) -> List[Dict[str, int]]:
        """
        Executes step_idx (0 <= step_idx < N-1) of Scatter-Reduce clockwise.
        At step s, rank r sends chunk_idx = (r - s) % N to rank (r + 1) % N,
        and receives chunk_idx = (r - s - 1) % N from rank (r - 1) % N.
        """
        n = self.world_size
        if not (0 <= step_idx < n - 1):
            raise ValueError("Invalid scatter-reduce step index")

        outbound_snapshots: Dict[int, List[float]] = {}
        step_events: List[Dict[str, int]] = []
        for r in range(n):
            send_chunk_idx = (r - step_idx) % n
            outbound_snapshots[r] = list(self.ranks[r].chunks[send_chunk_idx])

        for r in range(n):
            sender_rank = (r - 1) % n
            recv_chunk_idx = (r - step_idx - 1) % n
            incoming = outbound_snapshots[sender_rank]
            target_chunk = self.ranks[r].chunks[recv_chunk_idx]
            self.ranks[r].chunks[recv_chunk_idx] = [
                round(a + b, 8) for a, b in zip(target_chunk, incoming)
            ]
            self.ranks[r].accumulated_passes += 1
            flat = [val for chunk in self.ranks[r].chunks for val in chunk]
            self.ranks[r].parity_hash = compute_parity_checksum(flat)
            step_events.append(
                {
                    "phase": 1,
                    "step": step_idx,
                    "sender_rank": sender_rank,
                    "receiver_rank": r,
                    "chunk_index": recv_chunk_idx,
                }
            )

        self.accumulation_trace.extend(step_events)
        return step_events

    def step_all_gather(self, step_idx: int) -> List[Dict[str, int]]:
        """
        Executes step_idx (0 <= step_idx < N-1) of All-Gather clockwise.
        At step s, rank r sends chunk_idx = (r + 1 - s) % N to rank (r + 1) % N,
        and receives chunk_idx = (r - s) % N from rank (r - 1) % N, overwriting
        its unreduced partition with the fully reduced partition.
        """
        n = self.world_size
        if not (0 <= step_idx < n - 1):
            raise ValueError("Invalid all-gather step index")

        outbound_snapshots: Dict[int, List[float]] = {}
        step_events: List[Dict[str, int]] = []
        for r in range(n):
            send_chunk_idx = (r + 1 - step_idx) % n
            outbound_snapshots[r] = list(self.ranks[r].chunks[send_chunk_idx])

        for r in range(n):
            sender_rank = (r - 1) % n
            recv_chunk_idx = (r - step_idx) % n
            self.ranks[r].chunks[recv_chunk_idx] = list(outbound_snapshots[sender_rank])
            self.ranks[r].accumulated_passes += 1
            flat = [val for chunk in self.ranks[r].chunks for val in chunk]
            self.ranks[r].parity_hash = compute_parity_checksum(flat)
            step_events.append(
                {
                    "phase": 2,
                    "step": step_idx,
                    "sender_rank": sender_rank,
                    "receiver_rank": r,
                    "chunk_index": recv_chunk_idx,
                }
            )

        self.accumulation_trace.extend(step_events)
        return step_events

    def advance_single_step(self) -> Dict[str, object]:
        n = self.world_size
        if self.current_step < n - 1:
            events = self.step_scatter_reduce(self.current_step)
            phase_name = "SCATTER-REDUCE"
        elif self.current_step < 2 * (n - 1):
            events = self.step_all_gather(self.current_step - (n - 1))
            phase_name = "ALL-GATHER"
        else:
            self._initialize_ranks()
            events = self.step_scatter_reduce(0)
            phase_name = "SCATTER-REDUCE"

        self.current_step += 1
        return {
            "phase": phase_name,
            "current_step": self.current_step,
            "total_steps": self.total_steps,
            "events": events,
            "synchronized": self.verify_global_parity(),
        }

    def execute_full_all_reduce(self) -> List[List[float]]:
        self._initialize_ranks()
        n = self.world_size
        for s in range(n - 1):
            self.step_scatter_reduce(s)
            self.current_step += 1
        for s in range(n - 1):
            self.step_all_gather(s)
            self.current_step += 1
        return [
            [val for chunk in rank.chunks for val in chunk] for rank in self.ranks
        ]

    def inject_fault_and_recover(self, target_rank: int) -> Dict[str, object]:
        if not (0 <= target_rank < self.world_size):
            raise ValueError("Target rank out of bounds")
        # Corrupt target rank chunk to simulate ring desync packet drop
        self.ranks[target_rank].packet_drop_detected = True
        self.ranks[target_rank].chunks[0][0] = -9999.0
        corrupted_flat = [
            val for chunk in self.ranks[target_rank].chunks for val in chunk
        ]
        corrupted_hash = compute_parity_checksum(corrupted_flat)

        # Recover via Ring All-Reduce re-alignment from local_activations
        recovered_outputs = self.execute_full_all_reduce()
        reference = single_node_reference_matmul_reduce(
            [r.local_activations for r in self.ranks]
        )
        max_drift = max(
            abs(a - b) for a, b in zip(recovered_outputs[target_rank], reference)
        )
        return {
            "fault_rank": target_rank,
            "corrupted_parity_hash": corrupted_hash,
            "recovered_parity_hash": self.ranks[target_rank].parity_hash,
            "max_memory_drift": round(max_drift, 10),
            "ring_synchronized": self.verify_global_parity(),
        }

    def verify_global_parity(self) -> bool:
        hashes = {r.parity_hash for r in self.ranks}
        return len(hashes) == 1

    def compute_stream_overlap_schedule(
        self,
        tensor_units: int = 128000,
        bus_throttle_ratio: float = 1.0,
        comm_overlap_enabled: bool = True,
    ) -> Dict[str, object]:
        profile = CORRIDOR_PROFILES[self.corridor_id]
        n = self.world_size
        effective_bw_gbps = float(profile["peak_bandwidth_gbps"]) * max(
            0.1, min(1.0, bus_throttle_ratio)
        )
        base_lat = float(profile["base_latency_ms"])
        # Ring All-Reduce communication volume formula: 2 * (N - 1) / N * Bytes
        bytes_transferred = tensor_units * 4 * 2 * ((n - 1) / n)
        raw_comm_ms = base_lat + (bytes_transferred / (effective_bw_gbps * 1e5))
        compute_ms = 2.85

        buckets: List[StreamBucketSchedule] = []
        bucket_comp = compute_ms / n
        bucket_comm = raw_comm_ms / n
        total_overlapped_ms = 0.0

        for b in range(n):
            c_start = round(b * bucket_comp, 4)
            c_end = round((b + 1) * bucket_comp, 4)
            if comm_overlap_enabled:
                # Transfer stream starts immediately when bucket b compute finishes
                m_start = c_end
                m_end = round(m_start + bucket_comm, 4)
                # Overlapped with subsequent compute buckets
                next_compute_window = max(0.0, compute_ms - c_end)
                overlapped = min(bucket_comm, next_compute_window)
            else:
                m_start = round(compute_ms + (b * bucket_comm), 4)
                m_end = round(m_start + bucket_comm, 4)
                overlapped = 0.0
            total_overlapped_ms += overlapped
            buckets.append(
                StreamBucketSchedule(
                    bucket_id=b,
                    compute_start_ms=c_start,
                    compute_end_ms=c_end,
                    comm_start_ms=m_start,
                    comm_end_ms=m_end,
                    overlapped_ms=round(overlapped, 4),
                )
            )

        exposed_comm_ms = max(0.08, raw_comm_ms - total_overlapped_ms)
        total_step_ms = compute_ms + exposed_comm_ms
        ring_efficiency_pct = round(
            min(99.4, (compute_ms / total_step_ms) * 100.0 * (0.98 + 0.14 * float(profile["overlap_factor"]))),
            1,
        )

        return {
            "corridor_id": self.corridor_id,
            "effective_bandwidth_gbps": round(effective_bw_gbps, 1),
            "all_reduce_overhead_ms": round(exposed_comm_ms, 2),
            "ring_efficiency_pct": ring_efficiency_pct,
            "synchronized_tensors_units": tensor_units,
            "buckets": [b.__dict__ for b in buckets],
        }


app = FastAPI(
    title="GF-T3-224",
    description="Tensor-Parallel Fabric, Ring All-Reduce Topology, and Comm-Comp Stream Overlap Engine",
    version="3.2.4",
)

GLOBAL_ENGINE = RingAllReduceEngine(world_size=4, corridor_id="TP-CORRIDOR-ALPHA")


@app.get("/api/health")
def get_health() -> Dict[str, object]:
    return {
        "chassis": "GF-T3-224",
        "track": "TRACK 3",
        "status": "LOCKED",
        "world_size": GLOBAL_ENGINE.world_size,
        "parity_verified": GLOBAL_ENGINE.verify_global_parity(),
    }


@app.post("/api/ring/step")
def post_ring_step(payload: RingStepRequest) -> Dict[str, object]:
    if (
        GLOBAL_ENGINE.world_size != payload.world_size
        or GLOBAL_ENGINE.corridor_id != payload.corridor_id
    ):
        GLOBAL_ENGINE.world_size = payload.world_size
        GLOBAL_ENGINE.corridor_id = payload.corridor_id
        GLOBAL_ENGINE._initialize_ranks()

    if payload.inject_packet_drop_rank is not None:
        recovery = GLOBAL_ENGINE.inject_fault_and_recover(
            payload.inject_packet_drop_rank
        )
    else:
        recovery = None

    step_result = GLOBAL_ENGINE.advance_single_step()
    telemetry = GLOBAL_ENGINE.compute_stream_overlap_schedule(
        tensor_units=payload.tensor_units,
        bus_throttle_ratio=payload.bus_throttle_ratio,
        comm_overlap_enabled=payload.comm_overlap_enabled,
    )
    return {
        "chassis": "GF-T3-224",
        "step_result": step_result,
        "telemetry": telemetry,
        "recovery": recovery,
        "ranks": [
            {
                "rank_id": r.rank_id,
                "memory_address": r.memory_address,
                "chunks": r.chunks,
                "accumulated_passes": r.accumulated_passes,
                "parity_hash": r.parity_hash,
            }
            for r in GLOBAL_ENGINE.ranks
        ],
    }


@app.post("/api/ring/reduce-all")
def post_ring_reduce_all(payload: RingStepRequest) -> Dict[str, object]:
    engine = RingAllReduceEngine(
        world_size=payload.world_size, corridor_id=payload.corridor_id
    )
    reduced_tensors = engine.execute_full_all_reduce()
    reference = single_node_reference_matmul_reduce(
        [r.local_activations for r in engine.ranks]
    )
    max_drift = max(abs(a - b) for a, b in zip(reduced_tensors[0], reference))
    telemetry = engine.compute_stream_overlap_schedule(
        tensor_units=payload.tensor_units,
        bus_throttle_ratio=payload.bus_throttle_ratio,
        comm_overlap_enabled=payload.comm_overlap_enabled,
    )
    return {
        "chassis": "GF-T3-224",
        "synchronized": engine.verify_global_parity(),
        "max_memory_drift": round(max_drift, 10),
        "telemetry": telemetry,
        "parity_hash": engine.ranks[0].parity_hash,
    }
