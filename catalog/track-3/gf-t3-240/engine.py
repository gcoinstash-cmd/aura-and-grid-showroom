"""
GF-T3-240: Zero-Copy NCCL Point-to-Point Ring Stream & GPUDirect P2P Engine
Clean-Room FastAPI Backend Engine
SPDX-License-Identifier: MIT
"""

from enum import Enum
from typing import Dict, List, Optional
import math
import re
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator


class CorridorProfile(str, Enum):
    ALPHA = "NCCL-CORRIDOR-ALPHA (ZERO-COPY-GPUDIRECT-RING · 5600-GB/S)"
    BRAVO = "NCCL-CORRIDOR-BRAVO (ASYNC-CUDA-EVENT-STREAM-SYNC)"
    GAMMA = "NCCL-CORRIDOR-GAMMA (PEER-TO-PEER-MEMORY-STAGING)"
    DELTA = "NCCL-CORRIDOR-DELTA (FALLBACK-HOST-BUFFER-COPY)"


CORRIDOR_PARAMETERS: Dict[str, Dict[str, float]] = {
    CorridorProfile.ALPHA.value: {
        "peak_bandwidth_gbs": 5600.0,
        "base_latency_us": 0.03,
        "protocol_overhead": 0.0,
        "cpu_staging_factor": 0.0,
    },
    CorridorProfile.BRAVO.value: {
        "peak_bandwidth_gbs": 5320.0,
        "base_latency_us": 0.04,
        "protocol_overhead": 0.02,
        "cpu_staging_factor": 0.0,
    },
    CorridorProfile.GAMMA.value: {
        "peak_bandwidth_gbs": 4800.0,
        "base_latency_us": 0.08,
        "protocol_overhead": 0.05,
        "cpu_staging_factor": 0.05,
    },
    CorridorProfile.DELTA.value: {
        "peak_bandwidth_gbs": 1420.0,
        "base_latency_us": 1.85,
        "protocol_overhead": 0.28,
        "cpu_staging_factor": 1.0,
    },
}


class StreamNodeState(BaseModel):
    stream_id: int = Field(..., ge=0, le=7)
    stream_code: str
    source_gpu: str
    peer_gpu: str
    buffer_size_mb: int = Field(default=64, ge=16, le=512)
    ring_pointer_hex: str
    event_marker: str
    sync_status: str
    transfer_rate_gbs: float
    event_latency_us: float
    zero_copy_locked: bool
    completed_passes: int


class IngressActionPayload(BaseModel):
    corridor: str = Field(default=CorridorProfile.ALPHA.value)
    action: str = Field(..., min_length=2, max_length=64)
    stream_id: Optional[int] = Field(default=3, ge=0, le=7)
    burst_multiplier: float = Field(default=1.0, ge=0.5, le=2.0)

    @field_validator("action")
    @classmethod
    def sanitize_action(cls, value: str) -> str:
        forbidden_pattern = re.compile(r"(;|--|\bDROP\b|\bDELETE\b|\bINSERT\b|<script)", re.IGNORECASE)
        if forbidden_pattern.search(value):
            raise ValueError("GridSync Zero-Trust Gate: Disallowed token in action payload")
        return value.strip()


def compute_zero_copy_bandwidth(
    corridor: str,
    active_streams: int,
    buffer_size_mb: int,
    link_stall_active: bool,
    burst_mode: bool,
) -> float:
    """
    Calculates aggregate GPUDirect P2P Ring Bandwidth in GB/s using deterministic
    ring topology saturation physics:
      BW_eff = BW_peak * (active_streams / 8) * (1 - overhead) * stall_factor * burst_gain
    """
    if active_streams <= 0 or buffer_size_mb <= 0:
        return 0.0

    params = CORRIDOR_PARAMETERS.get(
        corridor, CORRIDOR_PARAMETERS[CorridorProfile.ALPHA.value]
    )
    peak = params["peak_bandwidth_gbs"]
    overhead = params["protocol_overhead"]

    stream_ratio = min(max(active_streams, 0), 8) / 8.0
    buffer_efficiency = min(1.0, math.log2(max(buffer_size_mb, 2)) / 6.0)
    efficiency = (1.0 - overhead) * buffer_efficiency

    stall_factor = 0.38 if link_stall_active else 1.0
    burst_gain = 1.125 if (burst_mode and not link_stall_active) else 1.0

    raw_bw = peak * stream_ratio * efficiency * stall_factor * burst_gain
    return round(raw_bw, 2)


def compute_async_event_latency(
    corridor: str,
    active_streams: int,
    link_stall_active: bool,
    burst_mode: bool,
) -> float:
    """
    Calculates non-blocking CUDA Event Stream Synchronization latency in microseconds (us).
    """
    params = CORRIDOR_PARAMETERS.get(
        corridor, CORRIDOR_PARAMETERS[CorridorProfile.ALPHA.value]
    )
    base_us = params["base_latency_us"]
    cpu_factor = params["cpu_staging_factor"]

    if active_streams <= 0:
        return 99.99

    ring_hop_penalty = (8 - min(active_streams, 8)) * 0.015
    stall_penalty = 0.82 if link_stall_active else 0.0
    burst_trim = -0.005 if (burst_mode and not link_stall_active and base_us >= 0.03) else 0.0
    staging_delay = cpu_factor * 0.45

    total_us = max(0.01, base_us + ring_hop_penalty + stall_penalty + staging_delay + burst_trim)
    return round(total_us, 3)


RING_BAR1_BASE_TABLE: List[int] = [
    0x7000,
    0x7200,
    0x7400,
    0x7800,
    0x7A00,
    0x7C00,
    0x7E00,
    0x8000,
]


def compute_ring_pointer(stream_id: int, step_count: int, buffer_size_mb: int) -> str:
    """
    Computes deterministic pre-allocated pinned GPU ring pointer address without runtime allocation.
    Uses BAR1 page-aligned base table + deterministic pass offset.
    """
    clamped_id = min(max(stream_id, 0), 7)
    base_addr = RING_BAR1_BASE_TABLE[clamped_id]
    offset = ((step_count * 16) % 0x0200) if step_count > 0 else 0
    ptr_val = base_addr + offset
    return "0x" + format(ptr_val, "04X")


class ZeroCopyNCCLEngine:
    def __init__(self) -> None:
        self.corridor: str = CorridorProfile.ALPHA.value
        self.link_stall_active: bool = False
        self.burst_mode: bool = False
        self.step_count: int = 0
        self.processed_tokens: int = 1792000
        self.nccl_xp: int = 30200
        self.selected_stream: int = 3
        self.streams: List[StreamNodeState] = self._build_streams()

    def _build_streams(self) -> List[StreamNodeState]:
        nodes: List[StreamNodeState] = []
        total_bw = compute_zero_copy_bandwidth(
            self.corridor,
            active_streams=8 if not self.link_stall_active else 6,
            buffer_size_mb=64,
            link_stall_active=self.link_stall_active,
            burst_mode=self.burst_mode,
        )
        per_stream_bw = round(total_bw / 8.0, 2)
        lat_us = compute_async_event_latency(
            self.corridor,
            active_streams=8 if not self.link_stall_active else 6,
            link_stall_active=self.link_stall_active,
            burst_mode=self.burst_mode,
        )

        for idx in range(8):
            peer_idx = (idx + 1) % 8
            is_stalled_node = self.link_stall_active and idx in (2, 5)
            ptr_hex = compute_ring_pointer(idx, self.step_count, 64)
            event_marker = (
                "STALL_RESYNC"
                if is_stalled_node
                else ("BURST_SYNC" if self.burst_mode else "EVENT_SYNC")
            )
            sync_status = "⚡ FAULT" if is_stalled_node else "✓ LOCKED"
            nodes.append(
                StreamNodeState(
                    stream_id=idx,
                    stream_code="ST" + str(idx),
                    source_gpu="GPU_" + str(idx),
                    peer_gpu="GPU_" + str(peer_idx),
                    buffer_size_mb=64,
                    ring_pointer_hex=ptr_hex,
                    event_marker=event_marker,
                    sync_status=sync_status,
                    transfer_rate_gbs=0.0 if is_stalled_node else per_stream_bw,
                    event_latency_us=round(lat_us * (4.5 if is_stalled_node else 1.0), 3),
                    zero_copy_locked=not is_stalled_node,
                    completed_passes=140 + self.step_count + idx,
                )
            )
        return nodes

    def apply_action(self, payload: IngressActionPayload) -> Dict[str, object]:
        if payload.corridor in CORRIDOR_PARAMETERS:
            self.corridor = payload.corridor
        if payload.stream_id is not None:
            self.selected_stream = payload.stream_id

        act = payload.action.upper()
        if act == "BURST":
            self.burst_mode = True
            self.link_stall_active = False
            self.step_count += 1
            self.processed_tokens += 256000
            self.nccl_xp += 4800
        elif act == "TOGGLE_STALL":
            self.link_stall_active = not self.link_stall_active
            if self.link_stall_active:
                self.burst_mode = False
        elif act == "STEP":
            self.step_count += 1
            self.processed_tokens += 128000
            self.nccl_xp += 2400
        elif act == "FLUSH":
            self.link_stall_active = False
            self.burst_mode = False
            self.step_count = 0
            self.processed_tokens = 1792000
            self.nccl_xp = 30200
        else:
            raise HTTPException(status_code=400, detail="Unsupported engine action")

        self.streams = self._build_streams()
        return self.snapshot()

    def snapshot(self) -> Dict[str, object]:
        active_cnt = sum(1 for s in self.streams if s.zero_copy_locked)
        bw = compute_zero_copy_bandwidth(
            self.corridor,
            active_streams=active_cnt,
            buffer_size_mb=64,
            link_stall_active=self.link_stall_active,
            burst_mode=self.burst_mode,
        )
        lat = compute_async_event_latency(
            self.corridor,
            active_streams=active_cnt,
            link_stall_active=self.link_stall_active,
            burst_mode=self.burst_mode,
        )
        sel = self.streams[self.selected_stream]
        inspector_line = (
            "STREAM: "
            + sel.stream_code
            + " · PEER: "
            + sel.peer_gpu
            + " · SIZE: "
            + str(sel.buffer_size_mb)
            + " MB · PTR: "
            + sel.ring_pointer_hex
            + " · "
            + ("ZERO_COPY_ACTIVE" if sel.zero_copy_locked else "NVLINK_RESYNC_REQUIRED")
        )
        return {
            "engine_id": "GF-T3-240",
            "track": "TRACK 3",
            "corridor": self.corridor,
            "bandwidth_gbs": bw,
            "latency_us": lat,
            "active_streams": active_cnt,
            "total_streams": 8,
            "processed_tokens": self.processed_tokens,
            "nccl_xp": self.nccl_xp,
            "nccl_state": "NVLink Stall Resync" if self.link_stall_active else "P2P Ring Active",
            "inspector_line": inspector_line,
            "streams": [s.model_dump() for s in self.streams],
        }


app = FastAPI(
    title="GF-T3-240",
    description="Zero-Copy NCCL Point-to-Point Ring Stream & GPUDirect P2P Engine",
    version="3.240.0",
)

engine_instance = ZeroCopyNCCLEngine()


@app.get("/api/v1/telemetry")
def get_telemetry() -> Dict[str, object]:
    return engine_instance.snapshot()


@app.post("/api/v1/action")
def execute_action(payload: IngressActionPayload) -> Dict[str, object]:
    return engine_instance.apply_action(payload)
