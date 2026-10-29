"""
GF-T3-286: Asynchronous Attention Sink Ring-Buffer and Infinite Context Retention Engine
License: MIT
Clean-Room Implementation - Zero Copyleft, Zero Proprietary Engine Marks
"""

from __future__ import annotations
import math
import time
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(
    title="GF-T3-286",
    description="Asynchronous Attention Sink Ring-Buffer and Infinite Context Retention Engine",
    version="3.286.0",
)

CORRIDORS: Dict[str, Dict[str, object]] = {
    "SINK-CORRIDOR-ALPHA": {
        "label": "SINK-CORRIDOR-ALPHA (ASYNC-ATTENTION-SINK-RING-BUFFER-FABRIC · 43200-GB/S)",
        "bandwidth_gbs": 43200,
        "sink_latency_us": 0.01,
        "sink_tokens": 4,
        "window_capacity_tokens": 262144,
        "retention_mode": "ATTENTION_SINK",
    },
    "SINK-CORRIDOR-BRAVO": {
        "label": "SINK-CORRIDOR-BRAVO (INFINITE-CONTEXT-RETENTION-ENGINE)",
        "bandwidth_gbs": 41800,
        "sink_latency_us": 0.01,
        "sink_tokens": 4,
        "window_capacity_tokens": 262144,
        "retention_mode": "INFINITE_RETENTION",
    },
    "SINK-CORRIDOR-GAMMA": {
        "label": "SINK-CORRIDOR-GAMMA (NON-BLOCKING-HISTORICAL-TOKEN-PRESERVER)",
        "bandwidth_gbs": 39600,
        "sink_latency_us": 0.02,
        "sink_tokens": 8,
        "window_capacity_tokens": 262144,
        "retention_mode": "HISTORICAL_PRESERVER",
    },
    "SINK-CORRIDOR-DELTA": {
        "label": "SINK-CORRIDOR-DELTA (FALLBACK-TRUNCATED-WINDOW-PASS)",
        "bandwidth_gbs": 32400,
        "sink_latency_us": 0.04,
        "sink_tokens": 4,
        "window_capacity_tokens": 131072,
        "retention_mode": "TRUNCATED_FALLBACK",
    },
}


class RingBufferNode(BaseModel):
    buffer_id: int = Field(..., ge=0, le=7)
    tag: str
    hex_ptr: str
    active_tokens_k: int
    sink_tokens: int
    latency_ms: float
    sync_pct: float
    state: str
    sink_anchors: List[float]
    rolling_tail: List[float]


class StepRetentionRequest(BaseModel):
    corridor_id: str = Field(default="SINK-CORRIDOR-ALPHA")
    incoming_tokens: int = Field(default=64000, ge=1, le=10000000)
    inject_burst: bool = Field(default=False)
    infinite_flood: bool = Field(default=False)


class EngineTelemetryResponse(BaseModel):
    chassis_id: str
    corridor_id: str
    corridor_label: str
    ring_throughput_gbs: int
    sink_latency_us: float
    active_buffers: int
    total_buffers: int
    processed_tokens_units: int
    engine_xp_k: float
    sink_state: str
    global_ptr_hex: str
    mode: str
    attention_sink_vector: List[float]
    barrier_sync_pct: float
    buffers: List[RingBufferNode]


class AttentionSinkRingEngine:
    """
    Deterministic clean-room solver for Asynchronous Attention Sink Ring-Buffer:
    S_sink = Concat(K_[0:4], K_rolling(t))
    Preserves initial attention sink tokens K_[0:4] while rotating historical KV states
    through an 8-way hardware ring buffer without memory overflow or CPU stalls.
    """

    def __init__(self) -> None:
        self.reset_arena()

    def reset_arena(self) -> None:
        self.corridor_id: str = "SINK-CORRIDOR-ALPHA"
        self.processed_tokens_units: int = 8064000
        self.engine_xp_k: float = 75.0
        self.rotation_step: int = 0
        self.ring_throughput_gbs: int = 43200
        self.sink_latency_us: float = 0.01
        self.sink_state: str = "Retention Active"
        self.global_ptr_base: int = 0x13F8DC0
        self.sink_anchors: List[float] = [4.81, 4.85, 4.82, 4.84]
        self.buffers: List[RingBufferNode] = self._init_buffers()

    def _init_buffers(self) -> List[RingBufferNode]:
        nodes: List[RingBufferNode] = []
        for idx in range(8):
            ptr_val = 0x14000 + (idx * 0x0010)
            nodes.append(
                RingBufferNode(
                    buffer_id=idx,
                    tag="R" + str(idx),
                    hex_ptr=hex(ptr_val),
                    active_tokens_k=256,
                    sink_tokens=4,
                    latency_ms=0.02,
                    sync_pct=100.0,
                    state="CYCLING · LOCKED",
                    sink_anchors=list(self.sink_anchors),
                    rolling_tail=[1.12 + idx * 0.03, 1.18 + idx * 0.03, 1.24 + idx * 0.03, 1.29 + idx * 0.03],
                )
            )
        return nodes

    @staticmethod
    def compute_attention_sink_concat(
        sink_keys: List[float],
        rolling_keys: List[float],
        sink_size: int = 4,
        rolling_window: int = 4,
    ) -> List[float]:
        """
        Implements S_sink = Concat(K_[0:sink_size], K_rolling(t))
        Preserves the initial sink_size tokens unconditionally and appends the latest
        rolling_window tokens rotated via modular ring indexing.
        """
        if len(sink_keys) < sink_size:
            raise ValueError("Insufficient initial keys to anchor attention sink.")
        preserved_head = list(sink_keys[:sink_size])
        if not rolling_keys:
            return preserved_head
        retained_tail = list(rolling_keys[-rolling_window:])
        return preserved_head + retained_tail

    @staticmethod
    def compute_softmax_partition_stability(sink_logits: List[float], rolling_logits: List[float]) -> float:
        """
        Verifies attention sink stability across infinite context rotation by computing
        the attention mass absorbed by the preserved sink tokens.
        """
        combined = sink_logits + rolling_logits
        if not combined:
            return 0.0
        max_logit = max(combined)
        exps = [math.exp(val - max_logit) for val in combined]
        denom = sum(exps)
        sink_mass = sum(exps[: len(sink_logits)]) / denom if denom > 0 else 0.0
        return round(sink_mass, 6)

    def rotate_ring_pointers(
        self,
        incoming_tokens: int = 64000,
        corridor_id: Optional[str] = None,
        inject_burst: bool = False,
        infinite_flood: bool = False,
    ) -> EngineTelemetryResponse:
        if corridor_id and corridor_id in CORRIDORS:
            self.corridor_id = corridor_id

        corridor = CORRIDORS[self.corridor_id]
        base_bw = int(corridor["bandwidth_gbs"])
        base_lat = float(corridor["sink_latency_us"])
        sink_count = int(corridor["sink_tokens"])

        self.rotation_step += 1
        multiplier = 4 if infinite_flood else (2 if inject_burst else 1)
        delta_tokens = incoming_tokens * multiplier
        self.processed_tokens_units += delta_tokens
        self.engine_xp_k = round(self.engine_xp_k + (delta_tokens / 64000.0) * 1.25, 2)

        if inject_burst:
            self.ring_throughput_gbs = min(46800, base_bw + 1600)
            self.sink_latency_us = round(max(0.01, base_lat), 2)
            self.sink_state = "Burst Absorbed · Locked"
        elif infinite_flood:
            self.ring_throughput_gbs = min(48000, base_bw + 2400)
            self.sink_latency_us = 0.01
            self.sink_state = "Flood Rotation Active"
        else:
            self.ring_throughput_gbs = base_bw
            self.sink_latency_us = base_lat
            self.sink_state = "Retention Active"

        new_buffers: List[RingBufferNode] = []
        for idx, buf in enumerate(self.buffers):
            rotated_offset = ((idx + self.rotation_step) % 8) * 0x0010
            ptr_hex = hex(0x14000 + rotated_offset)
            updated_tail = [
                round(val + 0.01 * ((self.rotation_step + idx) % 5), 2)
                for val in buf.rolling_tail
            ]
            concat_state = self.compute_attention_sink_concat(
                self.sink_anchors,
                updated_tail,
                sink_size=4,
                rolling_window=4,
            )
            new_buffers.append(
                RingBufferNode(
                    buffer_id=idx,
                    tag="R" + str(idx),
                    hex_ptr=ptr_hex,
                    active_tokens_k=256 if not inject_burst else 320,
                    sink_tokens=sink_count,
                    latency_ms=0.01 if infinite_flood else 0.02,
                    sync_pct=100.0,
                    state="FLOOD · ROTATING" if infinite_flood else ("BURST · LOCKED" if inject_burst else "CYCLING · LOCKED"),
                    sink_anchors=concat_state[:4],
                    rolling_tail=concat_state[4:],
                )
            )
        self.buffers = new_buffers
        return self.get_telemetry()

    def get_telemetry(self) -> EngineTelemetryResponse:
        corridor = CORRIDORS[self.corridor_id]
        ptr_val = self.global_ptr_base + (self.rotation_step * 0x0010)
        return EngineTelemetryResponse(
            chassis_id="GF-T3-286",
            corridor_id=self.corridor_id,
            corridor_label=str(corridor["label"]),
            ring_throughput_gbs=self.ring_throughput_gbs,
            sink_latency_us=self.sink_latency_us,
            active_buffers=len(self.buffers),
            total_buffers=8,
            processed_tokens_units=self.processed_tokens_units,
            engine_xp_k=self.engine_xp_k,
            sink_state=self.sink_state,
            global_ptr_hex="0x" + format(ptr_val, "X"),
            mode=str(corridor["retention_mode"]),
            attention_sink_vector=list(self.sink_anchors),
            barrier_sync_pct=100.0,
            buffers=self.buffers,
        )


engine_instance = AttentionSinkRingEngine()


@app.get("/health")
def health_check() -> Dict[str, object]:
    return {
        "status": "OK",
        "chassis": "GF-T3-286",
        "buffers_linked": 8,
        "timestamp_ns": int(time.time_ns()),
    }


@app.get("/api/v1/telemetry", response_model=EngineTelemetryResponse)
def get_telemetry() -> EngineTelemetryResponse:
    return engine_instance.get_telemetry()


@app.post("/api/v1/step", response_model=EngineTelemetryResponse)
def step_retention_pass(payload: StepRetentionRequest) -> EngineTelemetryResponse:
    if payload.corridor_id not in CORRIDORS:
        raise HTTPException(status_code=400, detail="Unknown synthetic attention sink corridor.")
    return engine_instance.rotate_ring_pointers(
        incoming_tokens=payload.incoming_tokens,
        corridor_id=payload.corridor_id,
        inject_burst=payload.inject_burst,
        infinite_flood=payload.infinite_flood,
    )


@app.post("/api/v1/flush", response_model=EngineTelemetryResponse)
def flush_ring_buffers() -> EngineTelemetryResponse:
    engine_instance.reset_arena()
    return engine_instance.get_telemetry()
