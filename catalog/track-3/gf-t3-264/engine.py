"""
GF-T3-264 Standalone FastAPI Backend Engine
Dual-Stream Async Disaggregated Prefill & Decode Execution Fabric
SPDX-License-Identifier: MIT
"""

from enum import Enum
from typing import Dict, List, Optional
import math
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

app = FastAPI(
    title="GF-T3-264",
    description="Dual-Stream Async Disaggregated Prefill and Decode Engine",
    version="3.264.0",
)


class CorridorId(str, Enum):
    ALPHA = "STREAM-CORRIDOR-ALPHA (DUAL-STREAM-ASYNC-DISAGGREGATION-FABRIC · 25600-GB/S)"
    BRAVO = "STREAM-CORRIDOR-BRAVO (NON-BLOCKING-EVENT-SYNCHRONIZER)"
    GAMMA = "STREAM-CORRIDOR-GAMMA (REMOTE-KV-CACHE-MIGRATION-ENGINE)"
    DELTA = "STREAM-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-STREAM-PASS)"


class StreamMode(str, Enum):
    PREFILL = "PREFILL"
    DECODE = "DECODE"
    DUAL_ASYNC = "DUAL-ASYNC"
    MONOLITHIC = "MONOLITHIC"


class StreamState(str, Enum):
    LOCKED = "ASYNC · LOCKED"
    DESYNC = "FAULT · DESYNC"
    MIGRATING = "KV · MIGRATING"
    IDLE = "RING · ZEROED"


class StreamDescriptor(BaseModel):
    stream_index: int = Field(..., ge=0, le=7)
    stream_code: str
    hex_ptr: str
    tokens_k: int = Field(..., ge=0)
    mode: StreamMode
    latency_ms: float = Field(..., ge=0.0)
    state: StreamState
    sync_parity_pct: float = Field(..., ge=0.0, le=100.0)
    prefill_bw_gbs: float = Field(..., ge=0.0)
    decode_bw_gbs: float = Field(..., ge=0.0)
    kv_transfer_us: float = Field(..., ge=0.0)
    event_Wait_cycles: int = Field(default=0, ge=0)


class TelemetrySnapshot(BaseModel):
    engine_id: str = "GF-T3-264"
    corridor: CorridorId
    throughput_gbs: float
    sync_latency_us: float
    active_streams: int
    total_streams: int
    processed_tokens: int
    engine_xp_k: float
    stream_state_label: str
    buffer_parity_pct: float
    vector_signature: List[float]
    streams: List[StreamDescriptor]


class ChaosTriggerPayload(BaseModel):
    action: str = Field(..., min_length=3, max_length=64)
    corridor: CorridorId = CorridorId.ALPHA
    intensity_factor: float = Field(default=1.0, ge=0.1, le=4.0)

    @field_validator("action")
    @classmethod
    def sanitize_action(cls, value: str) -> str:
        forbidden = [";", "--", "DROP", "SELECT", "<script>", "UNION"]
        upper_val = value.upper()
        for token in forbidden:
            if token in upper_val:
                raise ValueError("Invalid characters detected by GridSync ingress gate")
        return value.strip()


class DualStreamAsyncEngine:
    """
    Deterministic Dual-Stream Async Disaggregation & Non-Blocking Event Synchronizer.
    Decouples compute-bound prefill passes from memory-bandwidth-bound decode steps
    across 8 hardware execution streams (M0..M7).
    """

    BASE_HEX_ADDR = 0xD000
    STREAM_STRIDE = 0x0100
    MAX_FABRIC_BW_GBS = 25600.0

    def __init__(self) -> None:
        self.corridor: CorridorId = CorridorId.ALPHA
        self.step_counter: int = 0
        self.desync_active: bool = False
        self.burst_multiplier: float = 1.0
        self.processed_tokens: int = 4864000
        self.engine_xp_k: float = 75.0
        self.streams: List[StreamDescriptor] = self._initialize_streams()

    def _initialize_streams(self) -> List[StreamDescriptor]:
        items: List[StreamDescriptor] = []
        for idx in range(8):
            hex_addr = "0x" + format(self.BASE_HEX_ADDR + idx * self.STREAM_STRIDE, "04X")
            is_prefill = idx % 2 == 0
            mode = StreamMode.PREFILL if is_prefill else StreamMode.DECODE
            if idx in (3, 7):
                mode = StreamMode.DUAL_ASYNC
            prefill_bw = 1920.0 if mode in (StreamMode.PREFILL, StreamMode.DUAL_ASYNC) else 640.0
            decode_bw = 1280.0 if mode in (StreamMode.DECODE, StreamMode.DUAL_ASYNC) else 1920.0
            items.append(
                StreamDescriptor(
                    stream_index=idx,
                    stream_code="M" + str(idx),
                    hex_ptr=hex_addr,
                    tokens_k=256,
                    mode=mode,
                    latency_ms=0.02,
                    state=StreamState.LOCKED,
                    sync_parity_pct=100.0,
                    prefill_bw_gbs=prefill_bw,
                    decode_bw_gbs=decode_bw,
                    kv_transfer_us=0.01,
                    event_Wait_cycles=0,
                )
            )
        return items

    def compute_corridor_modifier(self, corridor: CorridorId) -> float:
        if corridor == CorridorId.ALPHA:
            return 1.00
        if corridor == CorridorId.BRAVO:
            return 0.96
        if corridor == CorridorId.GAMMA:
            return 0.94
        return 0.62

    def recalculate_fabric(self) -> TelemetrySnapshot:
        modifier = self.compute_corridor_modifier(self.corridor)
        total_bw = 0.0
        parity_sum = 0.0
        active_count = 0

        for s in self.streams:
            if self.corridor == CorridorId.DELTA:
                s.mode = StreamMode.MONOLITHIC
            elif s.stream_index in (3, 7):
                s.mode = StreamMode.DUAL_ASYNC
            elif s.stream_index % 2 == 0:
                s.mode = StreamMode.PREFILL
            else:
                s.mode = StreamMode.DECODE

            if self.desync_active and s.stream_index in (2, 5):
                s.state = StreamState.DESYNC
                s.sync_parity_pct = 74.5
                s.latency_ms = 0.19
                s.kv_transfer_us = 0.42
                s.event_Wait_cycles = 14
            else:
                s.state = StreamState.LOCKED
                s.sync_parity_pct = 100.0 if self.corridor != CorridorId.DELTA else 91.0
                base_lat = 0.02 if self.corridor != CorridorId.DELTA else 0.08
                s.latency_ms = round(base_lat / max(0.5, self.burst_multiplier), 3)
                s.kv_transfer_us = 0.01 if not self.desync_active else 0.05
                s.event_Wait_cycles = 0
                active_count += 1

            stream_bw = (s.prefill_bw_gbs + s.decode_bw_gbs) * modifier * self.burst_multiplier
            if s.state == StreamState.DESYNC:
                stream_bw *= 0.55
            total_bw += stream_bw
            parity_sum += s.sync_parity_pct

        clamped_bw = round(min(38400.0, total_bw), 1)
        avg_parity = round(parity_sum / len(self.streams), 2)
        sync_lat_us = 0.01 if not self.desync_active else 0.38
        if self.corridor == CorridorId.DELTA:
            sync_lat_us = 0.14

        vec = [
            round(2.61 * modifier * (0.9 if self.desync_active else 1.0), 2),
            round(2.65 * modifier * self.burst_multiplier, 2),
            round(2.62 * modifier, 2),
            round(2.64 * (avg_parity / 100.0), 2),
        ]

        state_label = "Dual-Async Active"
        if self.desync_active:
            state_label = "Event Recalibration Required"
        elif self.corridor == CorridorId.DELTA:
            state_label = "Fallback Monolithic Pass"

        return TelemetrySnapshot(
            corridor=self.corridor,
            throughput_gbs=clamped_bw,
            sync_latency_us=sync_lat_us,
            active_streams=active_count,
            total_streams=8,
            processed_tokens=self.processed_tokens,
            engine_xp_k=round(self.engine_xp_k, 1),
            stream_state_label=state_label,
            buffer_parity_pct=avg_parity,
            vector_signature=vec,
            streams=self.streams,
        )

    def trigger_burst(self, intensity: float = 1.25) -> TelemetrySnapshot:
        self.burst_multiplier = min(1.5, max(1.0, intensity))
        self.desync_active = False
        for idx, s in enumerate(self.streams):
            s.tokens_k = 256 + (idx + 1) * 32
            s.prefill_bw_gbs = 2048.0
            s.decode_bw_gbs = 1152.0
        self.processed_tokens += 512000
        self.engine_xp_k += 12.5
        self.step_counter += 1
        return self.recalculate_fabric()

    def toggle_desync_spike(self) -> TelemetrySnapshot:
        self.desync_active = not self.desync_active
        self.step_counter += 1
        return self.recalculate_fabric()

    def step_interleave_pass(self) -> TelemetrySnapshot:
        self.step_counter += 1
        self.desync_active = False
        self.burst_multiplier = 1.0
        for idx, s in enumerate(self.streams):
            rotated = (idx + self.step_counter) % 3
            if rotated == 0:
                s.mode = StreamMode.PREFILL
                s.prefill_bw_gbs = 1980.0
                s.decode_bw_gbs = 1220.0
            elif rotated == 1:
                s.mode = StreamMode.DECODE
                s.prefill_bw_gbs = 1220.0
                s.decode_bw_gbs = 1980.0
            else:
                s.mode = StreamMode.DUAL_ASYNC
                s.prefill_bw_gbs = 1600.0
                s.decode_bw_gbs = 1600.0
            s.tokens_k = 256 + (self.step_counter * 16)
        self.processed_tokens += 256000
        self.engine_xp_k += 6.4
        return self.recalculate_fabric()

    def flush_and_rezero(self) -> TelemetrySnapshot:
        self.step_counter = 0
        self.desync_active = False
        self.burst_multiplier = 1.0
        self.corridor = CorridorId.ALPHA
        self.processed_tokens = 4864000
        self.engine_xp_k = 75.0
        self.streams = self._initialize_streams()
        return self.recalculate_fabric()


engine_instance = DualStreamAsyncEngine()


@app.get("/api/health")
def get_health() -> Dict[str, str]:
    return {"status": "LOCKED", "engine": "GF-T3-264", "mode": "DUAL_STREAM_ASYNC"}


@app.get("/api/telemetry", response_model=TelemetrySnapshot)
def get_telemetry() -> TelemetrySnapshot:
    return engine_instance.recalculate_fabric()


@app.post("/api/action", response_model=TelemetrySnapshot)
def execute_action(payload: ChaosTriggerPayload) -> TelemetrySnapshot:
    engine_instance.corridor = payload.corridor
    act = payload.action.upper()
    if act == "BURST":
        return engine_instance.trigger_burst(payload.intensity_factor)
    if act == "DESYNC":
        return engine_instance.toggle_desync_spike()
    if act == "INTERLEAVE":
        return engine_instance.step_interleave_pass()
    if act == "FLUSH":
        return engine_instance.flush_and_rezero()
    if act == "CORRIDOR":
        return engine_instance.recalculate_fabric()
    raise HTTPException(status_code=400, detail="Unsupported stream engine directive")
