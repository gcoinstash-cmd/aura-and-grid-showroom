"""
GF-T3-276 · Ultra-High Bandwidth KV-Cache Direct Memory Access & PCIe Gen-6 Offloading Engine
Clean-Room Standalone FastAPI Backend · MIT License
Zero Proprietary Marks · Deterministic Mathematical Execution
"""

from dataclasses import dataclass, asdict
from typing import Dict, List, Optional
import hashlib
import re

try:
    from fastapi import FastAPI, HTTPException
    from pydantic import BaseModel, Field, field_validator
except ImportError:
    FastAPI = None
    HTTPException = Exception
    BaseModel = object

    def Field(*args, **kwargs):
        return None

    def field_validator(*args, **kwargs):
        def decorator(fn):
            return fn
        return decorator


SYNTHETIC_CORRIDORS: Dict[str, Dict[str, object]] = {
    "DMA-CORRIDOR-ALPHA": {
        "id": "DMA-CORRIDOR-ALPHA",
        "label": "DMA-CORRIDOR-ALPHA (KV-CACHE-DIRECT-MEMORY-ACCESS-FABRIC · 35200-GB/S)",
        "pcie_gen6_base_gbs": 24960.0,
        "block_size_gb": 12.8,
        "tau_transfer_s": 0.01,
        "latency_us": 0.01,
        "mode": "PCIE_DMA_OFFLOAD",
    },
    "DMA-CORRIDOR-BRAVO": {
        "id": "DMA-CORRIDOR-BRAVO",
        "label": "DMA-CORRIDOR-BRAVO (PCIE-GEN6-HOST-OFFLOADING-ENGINE)",
        "pcie_gen6_base_gbs": 21640.0,
        "block_size_gb": 12.8,
        "tau_transfer_s": 0.01,
        "latency_us": 0.014,
        "mode": "HOST_SWAP_STREAM",
    },
    "DMA-CORRIDOR-GAMMA": {
        "id": "DMA-CORRIDOR-GAMMA",
        "label": "DMA-CORRIDOR-GAMMA (ASYNC-BUFFER-RING-SCHEDULER)",
        "pcie_gen6_base_gbs": 23120.0,
        "block_size_gb": 12.8,
        "tau_transfer_s": 0.01,
        "latency_us": 0.012,
        "mode": "ASYNC_RING_BUFFER",
    },
    "DMA-CORRIDOR-DELTA": {
        "id": "DMA-CORRIDOR-DELTA",
        "label": "DMA-CORRIDOR-DELTA (FALLBACK-GPU-VRAM-MONOLITHIC-PASS)",
        "pcie_gen6_base_gbs": 14200.0,
        "block_size_gb": 12.8,
        "tau_transfer_s": 0.01,
        "latency_us": 0.028,
        "mode": "VRAM_MONOLITHIC",
    },
}

UNSAFE_PATTERN = re.compile(r"[;'\-\-/<>]|DROP\s+TABLE|SELECT\s+\*|UNION\s+SELECT|SCRIPT", re.IGNORECASE)


def sanitize_gridsync_input(value: str) -> str:
    """Zero-trust GridSync input scrubber against SQLi, XSS, and dollar-sign injection."""
    if not isinstance(value, str):
        raise ValueError("Input payload must be a string")
    cleaned = value.strip()
    if chr(36) in cleaned:
        raise ValueError("Zero-Dollar Gate violation detected in input payload")
    if UNSAFE_PATTERN.search(cleaned):
        raise ValueError("GridSync Security Gate blocked potentially malicious payload")
    return cleaned


@dataclass
class ChannelTelemetry:
    index: int
    tag: str
    title: str
    pointer_hex: str
    tokens_k: int
    bandwidth_gbs: float
    latency_ms: float
    sync_pct: float
    state_label: str
    dma_ok: bool


@dataclass
class EngineSnapshot:
    project_title: str
    corridor_id: str
    corridor_label: str
    mode: str
    mesh_ptr_hex: str
    dma_throughput_gbs: float
    offload_latency_us: float
    active_channels: int
    total_channels: int
    processed_tokens: int
    engine_xp_k: float
    dma_state: str
    buffer_parity_pct: float
    vector_signature: List[float]
    channels: List[ChannelTelemetry]
    inspector_channel: str
    manifest_digest: str


def compute_dma_bandwidth(block_sizes_gb: List[float], tau_transfer_s: float, pcie_gen6_base_gbs: float) -> float:
    """
    Core Asynchronous DMA Ring Scheduling Formula:
    BW_dma = (Sum(BlockSize) / tau_transfer) + PCIe_gen6
    """
    if tau_transfer_s <= 0:
        raise ValueError("tau_transfer_s must be strictly positive")
    if pcie_gen6_base_gbs < 0:
        raise ValueError("pcie_gen6_base_gbs must be non-negative")
    if not block_sizes_gb or any(b < 0 for b in block_sizes_gb):
        raise ValueError("block_sizes_gb must be a non-empty list of non-negative block sizes")

    total_block_gb = sum(block_sizes_gb)
    bw_dma = (total_block_gb / tau_transfer_s) + pcie_gen6_base_gbs
    return round(bw_dma, 2)


def compute_bidirectional_prefetch_latency_us(
    base_latency_us: float,
    bus_saturated: bool,
    burst_count: int,
    step_count: int,
) -> float:
    """
    Sub-microsecond bus arbitration latency solver across 8 streaming DMA channels.
    """
    if base_latency_us <= 0:
        raise ValueError("base_latency_us must be positive")
    saturation_penalty = 0.03 if bus_saturated else 0.0
    step_optimization = min(0.004, step_count * 0.0005)
    burst_delta = min(0.005, burst_count * 0.001)
    computed = max(0.01, base_latency_us + saturation_penalty + burst_delta - step_optimization)
    return round(computed, 4)


class DMAOffloadSimulator:
    """
    Deterministic KV-Cache Direct Memory Access and PCIe Gen-6 Offloading Simulator.
    """

    def __init__(self) -> None:
        self.corridor_id: str = "DMA-CORRIDOR-ALPHA"
        self.burst_count: int = 0
        self.bus_saturated: bool = False
        self.step_count: int = 0
        self.selected_channel: int = 3
        self.base_tokens: int = 6784000
        self.base_xp_k: float = 75.0

    def select_corridor(self, corridor_id: str) -> EngineSnapshot:
        cleaned = sanitize_gridsync_input(corridor_id)
        if cleaned not in SYNTHETIC_CORRIDORS:
            raise ValueError("Unknown synthetic DMA corridor: " + cleaned)
        self.corridor_id = cleaned
        return self.snapshot()

    def trigger_offload_burst(self) -> EngineSnapshot:
        self.burst_count += 1
        return self.snapshot()

    def toggle_bus_saturation(self) -> EngineSnapshot:
        self.bus_saturated = not self.bus_saturated
        return self.snapshot()

    def step_async_transfer(self) -> EngineSnapshot:
        self.step_count += 1
        return self.snapshot()

    def flush_buffers(self) -> EngineSnapshot:
        self.burst_count = 0
        self.bus_saturated = False
        self.step_count = 0
        return self.snapshot()

    def snapshot(self) -> EngineSnapshot:
        corridor = SYNTHETIC_CORRIDORS[self.corridor_id]
        base_block = float(corridor["block_size_gb"])
        tau_s = float(corridor["tau_transfer_s"])
        pcie_base = float(corridor["pcie_gen6_base_gbs"])
        base_lat = float(corridor["latency_us"])

        burst_multiplier = 1.0 + (self.burst_count * 0.0625)
        saturation_factor = 0.88 if self.bus_saturated else 1.0
        step_bonus = self.step_count * 160.0

        block_sizes: List[float] = []
        channels: List[ChannelTelemetry] = []

        for idx in range(8):
            ch_block = round(base_block * burst_multiplier * saturation_factor, 4)
            block_sizes.append(ch_block)
            ch_bw = round((ch_block / tau_s) / 10.0, 2)
            ch_tokens_k = int(256 + (self.burst_count * 32) + (self.step_count * 16))
            is_fault = self.bus_saturated and (idx in (2, 5))
            ch_lat_ms = round(0.02 + (0.04 if is_fault else 0.0) + (idx % 2) * 0.005, 2)
            ch_sync = 94.5 if is_fault else 100.0
            ch_state = "SWAP_REROUTE · FAULT" if is_fault else "STREAMING · LOCKED"
            ptr_hex = "0xA0" + str(idx) + "0"

            channels.append(
                ChannelTelemetry(
                    index=idx,
                    tag="D" + str(idx),
                    title="Channel " + str(idx) + " (D" + str(idx) + ")",
                    pointer_hex=ptr_hex,
                    tokens_k=ch_tokens_k,
                    bandwidth_gbs=ch_bw,
                    latency_ms=ch_lat_ms,
                    sync_pct=ch_sync,
                    state_label=ch_state,
                    dma_ok=not is_fault,
                )
            )

        dma_bw = compute_dma_bandwidth(block_sizes, tau_s, pcie_base + step_bonus)
        offload_lat_us = compute_bidirectional_prefetch_latency_us(
            base_lat, self.bus_saturated, self.burst_count, self.step_count
        )
        active_ch = sum(1 for c in channels if c.dma_ok)
        processed_tokens = self.base_tokens + (self.burst_count * 512000) + (self.step_count * 256000)
        xp_k = round(self.base_xp_k + (self.burst_count * 12.5) + (self.step_count * 8.4), 1)
        parity_pct = round(sum(c.sync_pct for c in channels) / 8.0, 2)
        dma_state = "Host Swap Re-Routing" if self.bus_saturated else "Offload Active"

        vec_base = 3.81 + (self.step_count * 0.01) + (self.burst_count * 0.02)
        vector_sig = [
            round(vec_base, 2),
            round(vec_base + 0.04, 2),
            round(vec_base + 0.01, 2),
            round(vec_base + 0.03, 2),
        ]

        digest_source = (
            "GF-T3-276:"
            + self.corridor_id
            + ":"
            + str(dma_bw)
            + ":"
            + str(offload_lat_us)
            + ":"
            + str(processed_tokens)
        )
        manifest_digest = hashlib.sha256(digest_source.encode("utf-8")).hexdigest()[:16].upper()

        return EngineSnapshot(
            project_title="GF-T3-276",
            corridor_id=self.corridor_id,
            corridor_label=str(corridor["label"]),
            mode=str(corridor["mode"]),
            mesh_ptr_hex="0x9F8DC0",
            dma_throughput_gbs=dma_bw,
            offload_latency_us=offload_lat_us,
            active_channels=active_ch,
            total_channels=8,
            processed_tokens=processed_tokens,
            engine_xp_k=xp_k,
            dma_state=dma_state,
            buffer_parity_pct=parity_pct,
            vector_signature=vector_sig,
            channels=channels,
            inspector_channel="D" + str(self.selected_channel),
            manifest_digest=manifest_digest,
        )


simulator = DMAOffloadSimulator()

if FastAPI is not None:
    app = FastAPI(
        title="GF-T3-276",
        version="3.276.0",
        description="Track 3 Flagship KV-Cache Direct Memory Access and PCIe Gen-6 Offloading Backend Engine",
    )

    class ActionPayload(BaseModel):
        action: str = Field(..., min_length=2, max_length=64)
        corridor_id: Optional[str] = Field(default=None)

        @field_validator("action")
        @classmethod
        def validate_action(cls, v: str) -> str:
            return sanitize_gridsync_input(v)

    @app.get("/api/health")
    def get_health() -> Dict[str, object]:
        snap = simulator.snapshot()
        return {
            "title": "GF-T3-276",
            "status": "LOCKED",
            "dma_throughput": str(int(snap.dma_throughput_gbs)) + " GB/s",
            "offload_latency": str(snap.offload_latency_us) + " us",
            "active_channels": str(snap.active_channels) + " Channels",
        }

    @app.get("/api/telemetry")
    def get_telemetry() -> Dict[str, object]:
        return asdict(simulator.snapshot())

    @app.post("/api/command")
    def execute_command(payload: ActionPayload) -> Dict[str, object]:
        try:
            if payload.action == "BURST":
                snap = simulator.trigger_offload_burst()
            elif payload.action == "SPIKE":
                snap = simulator.toggle_bus_saturation()
            elif payload.action == "STEP":
                snap = simulator.step_async_transfer()
            elif payload.action == "FLUSH":
                snap = simulator.flush_buffers()
            elif payload.action == "CORRIDOR" and payload.corridor_id:
                snap = simulator.select_corridor(payload.corridor_id)
            else:
                raise ValueError("Unsupported command action: " + payload.action)
            return asdict(snap)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))
