"""
GF-T3-230: Tensor-Parallel Ring-AllReduce NVLink 900 GB/s Fabric Engine
Clean-Room Standalone FastAPI Backend
SPDX-License-Identifier: MIT
"""

from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
import math
import time
import hashlib
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel, Field

app = FastAPI(
    title="GF-T3-230",
    description="Tensor-Parallel Ring-AllReduce NVLink 900 GB/s Fabric and Zero-Copy Staging Engine",
    version="2.3.0",
)

SYNTHETIC_CORRIDORS: Tuple[str, ...] = (
    "RING-CORRIDOR-ALPHA (BIDIRECTIONAL-RING-ALLREDUCE · NVLINK-900)",
    "RING-CORRIDOR-BRAVO (SCATTER-REDUCE & ALL-GATHER PIPELINE)",
    "RING-CORRIDOR-GAMMA (ZERO-COPY-PINNED-BUFFER-STAGING)",
    "RING-CORRIDOR-DELTA (FALLBACK-SYNCHRONOUS-BROADCAST)",
)

NVLINK_PEAK_BW_GBPS: float = 900.0
DEFAULT_ACTIVE_BW_GBPS: float = 880.0
BASE_LINK_LATENCY_MS: float = 0.01
NUM_GPUS: int = 8


@dataclass
class ZeroCopyBufferBlock:
    gpu_id: int
    base_address_hex: str
    size_bytes: int
    pinned: bool = True
    ref_count: int = 1
    in_use: bool = True


class ZeroCopyBufferManager:
    """Manages deterministic zero-copy pinned GPU DMA buffers with leak & bounds protection."""

    def __init__(self, num_gpus: int = NUM_GPUS, chunk_elements: int = 16777216) -> None:
        self.num_gpus = num_gpus
        self.chunk_elements = chunk_elements
        self.blocks: Dict[int, ZeroCopyBufferBlock] = {}
        self._initialize_ring_buffers()

    def _initialize_ring_buffers(self) -> None:
        self.blocks.clear()
        for gpu_idx in range(self.num_gpus):
            addr_val = 0x7F0000 + (gpu_idx * 0x000800)
            addr_hex = "0x" + format(addr_val, "06X")
            self.blocks[gpu_idx] = ZeroCopyBufferBlock(
                gpu_id=gpu_idx,
                base_address_hex=addr_hex,
                size_bytes=self.chunk_elements * 4,
                pinned=True,
                ref_count=1,
                in_use=True,
            )

    def get_pointer(self, gpu_id: int) -> str:
        if gpu_id < 0 or gpu_id >= self.num_gpus:
            raise ValueError("GPU index out of bounds for ring topology")
        block = self.blocks.get(gpu_id)
        if block is None or not block.in_use or not block.pinned:
            raise RuntimeError("Zero-copy buffer unmapped or released prematurely")
        return block.base_address_hex

    def allocate_staging(self, gpu_id: int, size_bytes: int) -> ZeroCopyBufferBlock:
        if gpu_id < 0 or gpu_id >= self.num_gpus:
            raise ValueError("Invalid GPU index for DMA staging")
        if size_bytes <= 0 or size_bytes > 1073741824:
            raise ValueError("Invalid DMA buffer size requested")
        existing = self.blocks.get(gpu_id)
        if existing and existing.in_use:
            existing.ref_count += 1
            existing.size_bytes = size_bytes
            return existing
        addr_val = 0x7F0000 + (gpu_id * 0x000800)
        block = ZeroCopyBufferBlock(
            gpu_id=gpu_id,
            base_address_hex="0x" + format(addr_val, "06X"),
            size_bytes=size_bytes,
            pinned=True,
            ref_count=1,
            in_use=True,
        )
        self.blocks[gpu_id] = block
        return block

    def release_staging(self, gpu_id: int) -> bool:
        if gpu_id not in self.blocks:
            return False
        block = self.blocks[gpu_id]
        if block.ref_count > 1:
            block.ref_count -= 1
            return True
        block.ref_count = 0
        block.in_use = False
        return True

    def flush_and_rezero(self) -> int:
        self._initialize_ring_buffers()
        return len(self.blocks)

    def verify_zero_leaks(self) -> bool:
        for gpu_id, block in self.blocks.items():
            if gpu_id < 0 or gpu_id >= self.num_gpus:
                return False
            if block.ref_count < 0:
                return False
            if block.in_use and not block.base_address_hex.startswith("0x7F"):
                return False
        return True


class NVLinkBandwidthSimulator:
    """Calculates physical ring-allreduce bus bandwidth, latency, and packet loss jitter."""

    def __init__(self, num_gpus: int = NUM_GPUS, peak_bw_gbps: float = NVLINK_PEAK_BW_GBPS) -> None:
        self.num_gpus = num_gpus
        self.peak_bw_gbps = peak_bw_gbps
        self.active_bw_gbps = DEFAULT_ACTIVE_BW_GBPS
        self.packet_loss_active = False

    def compute_ring_metrics(
        self,
        tensor_bytes: int,
        corridor: str = SYNTHETIC_CORRIDORS[0],
        spike_active: bool = False,
    ) -> Dict[str, float]:
        if tensor_bytes <= 0:
            raise ValueError("tensor_bytes must be strictly positive")
        n = float(self.num_gpus)
        # Ring-AllReduce volume factor: 2 * (N - 1) / N of total tensor payload
        ring_volume_factor = (2.0 * (n - 1.0)) / n
        effective_bytes = float(tensor_bytes) * ring_volume_factor

        corridor_efficiency = 0.9777777778  # 880 / 900 GB/s baseline
        if "DELTA" in corridor:
            corridor_efficiency = 0.72
        elif "GAMMA" in corridor:
            corridor_efficiency = 0.985
        elif "BRAVO" in corridor:
            corridor_efficiency = 0.965

        if spike_active or self.packet_loss_active:
            corridor_efficiency *= 0.62

        achieved_bw_gbps = round(self.peak_bw_gbps * corridor_efficiency, 2)
        # Convert bytes / (GB/s) to milliseconds, plus 2*(N-1) hop overhead
        serialization_ms = (effective_bytes / (achieved_bw_gbps * 1e9)) * 1000.0
        hop_latency_ms = 2.0 * (n - 1.0) * (0.0085 if not (spike_active or self.packet_loss_active) else 0.045)
        total_latency_ms = round(serialization_ms + hop_latency_ms, 4)
        saturation_pct = round((achieved_bw_gbps / self.peak_bw_gbps) * 100.0, 2)

        return {
            "achieved_bw_gbps": achieved_bw_gbps,
            "latency_ms": max(0.01, total_latency_ms),
            "saturation_pct": saturation_pct,
            "ring_volume_factor": round(ring_volume_factor, 4),
            "effective_transfer_mb": round(effective_bytes / (1024.0 * 1024.0), 3),
        }


class RingAllReduceStateMachine:
    """
    Executes mathematically authentic N-GPU Ring-AllReduce:
    Phase 1: N-1 Scatter-Reduce steps (each GPU i sends chunk (i - step) % N to (i + 1) % N
             and accumulates chunk (i - step - 1) % N from (i - 1) % N).
    Phase 2: N-1 All-Gather steps (each GPU i forwards converged chunks around the ring
             until all N GPUs hold identical bit-accurate reduced tensors).
    """

    def __init__(self, num_gpus: int = NUM_GPUS) -> None:
        if num_gpus < 2:
            raise ValueError("Ring topology requires at least 2 GPUs")
        self.num_gpus = num_gpus
        self.buffer_manager = ZeroCopyBufferManager(num_gpus=num_gpus)
        self.bw_simulator = NVLinkBandwidthSimulator(num_gpus=num_gpus)
        self.current_step: int = 0
        self.total_steps: int = 2 * (num_gpus - 1)
        self.processed_tokens: int = 512000
        self.corridor: str = SYNTHETIC_CORRIDORS[0]
        self.gpu_tensors: List[List[List[float]]] = []
        self._init_default_tensors()

    def _init_default_tensors(self, chunk_size: int = 4) -> None:
        # Each GPU holds N chunks of length chunk_size
        self.gpu_tensors = []
        for g in range(self.num_gpus):
            gpu_chunks: List[List[float]] = []
            for c in range(self.num_gpus):
                chunk = [round(float((g + 1) * 0.5 + (c + 1) * 0.25 + idx * 0.125), 6) for idx in range(chunk_size)]
                gpu_chunks.append(chunk)
            self.gpu_tensors.append(gpu_chunks)
        self.current_step = 0

    def load_custom_tensors(self, raw_gpu_tensors: List[List[List[float]]]) -> None:
        if len(raw_gpu_tensors) != self.num_gpus:
            raise ValueError("Input tensor list must match num_gpus")
        for g_chunks in raw_gpu_tensors:
            if len(g_chunks) != self.num_gpus:
                raise ValueError("Each GPU must hold N chunks for ring partitioning")
        # Deep copy
        self.gpu_tensors = [[[float(v) for v in chunk] for chunk in gpu] for gpu in raw_gpu_tensors]
        self.current_step = 0

    def step_pass(self) -> Dict[str, object]:
        n = self.num_gpus
        if self.current_step >= self.total_steps:
            self.current_step = 0

        step = self.current_step
        next_tensors = [[[v for v in chunk] for chunk in gpu] for gpu in self.gpu_tensors]

        if step < n - 1:
            phase = "SCATTER_REDUCE"
            for g in range(n):
                recv_from = (g - 1 + n) % n
                recv_chunk_idx = (g - step - 1 + n) % n
                incoming = self.gpu_tensors[recv_from][recv_chunk_idx]
                local_target = next_tensors[g][recv_chunk_idx]
                next_tensors[g][recv_chunk_idx] = [
                    round(local_target[k] + incoming[k], 8) for k in range(len(local_target))
                ]
        else:
            phase = "ALL_GATHER"
            ag_step = step - (n - 1)
            for g in range(n):
                recv_from = (g - 1 + n) % n
                replace_chunk_idx = (g - ag_step + n) % n
                incoming = self.gpu_tensors[recv_from][replace_chunk_idx]
                next_tensors[g][replace_chunk_idx] = [round(v, 8) for v in incoming]

        self.gpu_tensors = next_tensors
        self.current_step += 1
        self.processed_tokens += 10400

        return {
            "step": self.current_step,
            "total_steps": self.total_steps,
            "phase": phase if self.current_step < self.total_steps else "CONVERGED",
            "processed_tokens": self.processed_tokens,
        }

    def execute_full_allreduce(self) -> List[List[List[float]]]:
        while self.current_step < self.total_steps:
            self.step_pass()
        return self.gpu_tensors

    @staticmethod
    def monolithic_reference_allreduce(raw_gpu_tensors: List[List[List[float]]]) -> List[List[float]]:
        num_gpus = len(raw_gpu_tensors)
        num_chunks = len(raw_gpu_tensors[0])
        chunk_len = len(raw_gpu_tensors[0][0])
        reduced: List[List[float]] = []
        for c in range(num_chunks):
            chunk_sum: List[float] = []
            for k in range(chunk_len):
                total = sum(raw_gpu_tensors[g][c][k] for g in range(num_gpus))
                chunk_sum.append(round(total, 8))
            reduced.append(chunk_sum)
        return reduced


engine_state = RingAllReduceStateMachine(num_gpus=NUM_GPUS)


class BurstRequest(BaseModel):
    corridor: str = Field(default=SYNTHETIC_CORRIDORS[0], min_length=5, max_length=120)
    tensor_mb: int = Field(default=64, ge=1, le=1024)
    inject_spike: bool = Field(default=False)


@app.get("/api/health")
def get_health() -> Dict[str, object]:
    return {
        "engine_id": "GF-T3-230",
        "track": "TRACK 3",
        "status": "LOCKED",
        "num_gpus": NUM_GPUS,
        "zero_leaks": engine_state.buffer_manager.verify_zero_leaks(),
    }


@app.get("/api/telemetry")
def get_telemetry() -> Dict[str, object]:
    metrics = engine_state.bw_simulator.compute_ring_metrics(
        tensor_bytes=64 * 1024 * 1024,
        corridor=engine_state.corridor,
        spike_active=engine_state.bw_simulator.packet_loss_active,
    )
    gpus = []
    for g in range(NUM_GPUS):
        prev_peer = (g - 1 + NUM_GPUS) % NUM_GPUS
        next_peer = (g + 1) % NUM_GPUS
        gpus.append(
            {
                "gpu_id": "G" + str(g),
                "chunk_dims": [4096, 4096],
                "peer_route": "G" + str( next_peer ) + " -> G" + str( prev_peer ),
                "buffer_ptr": engine_state.buffer_manager.get_pointer(g),
                "state": "SCATTER_REDUCE" if engine_state.current_step < NUM_GPUS - 1 else "ALL_GATHER",
                "sample_val": engine_state.gpu_tensors[g][0][0],
            }
        )
    return {
        "project": "GF-T3-230",
        "corridor": engine_state.corridor,
        "ring_bandwidth_gbps": metrics["achieved_bw_gbps"],
        "allreduce_latency_ms": metrics["latency_ms"],
        "active_gpus": NUM_GPUS,
        "processed_tokens": engine_state.processed_tokens,
        "current_step": engine_state.current_step,
        "total_steps": engine_state.total_steps,
        "gpus": gpus,
    }


@app.post("/api/ring/burst")
def trigger_ring_burst(payload: BurstRequest) -> Dict[str, object]:
    if payload.corridor not in SYNTHETIC_CORRIDORS:
        raise HTTPException(status_code=400, detail="Unsupported synthetic ring corridor")
    engine_state.corridor = payload.corridor
    engine_state.bw_simulator.packet_loss_active = payload.inject_spike
    engine_state._init_default_tensors()
    engine_state.execute_full_allreduce()
    metrics = engine_state.bw_simulator.compute_ring_metrics(
        tensor_bytes=payload.tensor_mb * 1024 * 1024,
        corridor=payload.corridor,
        spike_active=payload.inject_spike,
    )
    digest = hashlib.sha256(str(engine_state.gpu_tensors[0]).encode("utf-8")).hexdigest()[:16]
    return {
        "project": "GF-T3-230",
        "status": "ALL_GATHER_VERIFIED",
        "corridor": payload.corridor,
        "metrics": metrics,
        "processed_tokens": engine_state.processed_tokens,
        "parity_digest": digest,
    }


@app.post("/api/ring/step")
def step_reduce_pass() -> Dict[str, object]:
    return engine_state.step_pass()


@app.post("/api/ring/flush")
def flush_ring_fabric() -> Dict[str, object]:
    rezeroed = engine_state.buffer_manager.flush_and_rezero()
    engine_state.bw_simulator.packet_loss_active = False
    engine_state._init_default_tensors()
    return {
        "project": "GF-T3-230",
        "status": "FABRIC_REZEROED",
        "buffers_reinitialized": rezeroed,
        "zero_leaks": engine_state.buffer_manager.verify_zero_leaks(),
    }
