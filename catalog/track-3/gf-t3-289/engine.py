"""
GF-T3-289: Ultra-Wide Dynamic Asynchronous Pipeline Interconnect
and Layer-Partitioned Micro-Batch Streaming Backend Engine.

License: MIT (100% Clean-Room Implementation, Zero Copyleft)
"""

from enum import Enum
from typing import Dict, List, Optional
import math
import time
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator


class CorridorType(str, Enum):
    ALPHA = "PIPE-CORRIDOR-ALPHA (DYNAMIC-PIPELINE-INTERCONNECT-FABRIC · 44800-GB/S)"
    BRAVO = "PIPE-CORRIDOR-BRAVO (MICRO-BATCH-STREAMING-ENGINE)"
    GAMMA = "PIPE-CORRIDOR-GAMMA (ASYNC-STAGE-BUBBLE-MINIMIZER)"
    DELTA = "PIPE-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-FORWARD-PASS)"


class StageStatus(str, Enum):
    STREAMING_LOCKED = "STREAMING · LOCKED"
    STALL_SPIKE = "STALL · REBALANCING"
    BURST_OVERDRIVE = "BURST · OVERDRIVE"
    FLUSHED_ZERO = "ARENA · ZEROED"


class StageNode(BaseModel):
    stage_id: int = Field(..., ge=0, le=63, description="Zero-indexed stage identifier S0..S7")
    label: str = Field(..., min_length=2, max_length=32)
    hex_ptr: str = Field(..., min_length=4, max_length=16)
    tokens_k: int = Field(..., ge=0, description="Active processed tokens in thousands")
    micro_batch_tag: str = Field(..., min_length=2, max_length=16)
    latency_ms: float = Field(..., ge=0.0, le=100.0)
    sync_pct: float = Field(..., ge=0.0, le=100.0)
    status: StageStatus = Field(default=StageStatus.STREAMING_LOCKED)
    forward_passes: int = Field(default=8, ge=0)
    backward_passes: int = Field(default=8, ge=0)


class ScheduleCalculationRequest(BaseModel):
    num_stages: int = Field(default=8, ge=1, le=64, description="K partitioned model stages")
    num_micro_batches: int = Field(default=64, ge=1, le=1024, description="N active micro-batches")
    t_bubble_us: float = Field(default=0.0014, ge=0.0, le=1000.0, description="Bubble overhead per stage in microseconds")
    t_stage_us: float = Field(default=0.0100, gt=0.0, le=1000.0, description="Stage compute time in microseconds")
    interconnect_bandwidth_gbs: float = Field(default=44800.0, gt=0.0, description="Aggregate P2P interconnect bandwidth in GB/s")
    activation_tensor_mb: float = Field(default=16.0, gt=0.0, description="Activation tensor payload per handoff in MB")

    @field_validator("num_stages", "num_micro_batches")
    @classmethod
    def validate_positive_counts(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("Count must be strictly positive")
        return value


class ScheduleCalculationResponse(BaseModel):
    engine_id: str
    corridor: str
    total_pipeline_time_us: float
    ideal_compute_time_us: float
    bubble_time_us: float
    bubble_fraction_pct: float
    scheduling_efficiency_pct: float
    p2p_handoff_latency_us: float
    barrier_sync_latency_us: float
    effective_throughput_gbs: float
    schedule_sequence: List[str]


class PipelineTelemetryState(BaseModel):
    engine_id: str
    corridor: CorridorType
    pipeline_throughput_gbs: float
    stage_latency_us: float
    active_stages: int
    total_stages: int
    processed_tokens_units: int
    engine_xp_k: float
    pipeline_state: str
    bubble_stall_active: bool
    burst_mode_active: bool
    step_counter: int
    mesh_pointer: str
    vector_signature: List[float]
    stages: List[StageNode]
    radio_logs: List[str]


def compute_1f1b_pipeline_schedule(
    num_stages: int,
    num_micro_batches: int,
    t_bubble_us: float,
    t_stage_us: float,
    interconnect_bandwidth_gbs: float = 44800.0,
    activation_tensor_mb: float = 16.0,
) -> ScheduleCalculationResponse:
    """
    Deterministic 1F1B Asynchronous Micro-Batch Pipeline Solver.
    Implements:
      T_pipe = (K - 1) * t_bubble + N * t_stage
    where K = num_stages, N = num_micro_batches.
    """
    if num_stages < 1 or num_micro_batches < 1:
        raise ValueError("num_stages and num_micro_batches must be >= 1")
    if t_stage_us <= 0.0:
        raise ValueError("t_stage_us must be > 0")
    if t_bubble_us < 0.0:
        raise ValueError("t_bubble_us must be >= 0")

    bubble_time_us = float(num_stages - 1) * t_bubble_us
    ideal_compute_time_us = float(num_micro_batches) * t_stage_us
    total_pipeline_time_us = bubble_time_us + ideal_compute_time_us

    bubble_fraction_pct = (
        (bubble_time_us / total_pipeline_time_us) * 100.0
        if total_pipeline_time_us > 0.0
        else 0.0
    )
    scheduling_efficiency_pct = max(0.0, min(100.0, 100.0 - bubble_fraction_pct))

    # Non-blocking P2P interconnect handoff latency (MB to GB conversion over GB/s -> microseconds)
    payload_gb = activation_tensor_mb / 1024.0
    p2p_handoff_latency_us = (payload_gb / interconnect_bandwidth_gbs) * 1_000_000.0
    barrier_sync_latency_us = round(min(0.45, p2p_handoff_latency_us * 0.12 + 0.008), 5)

    effective_throughput_gbs = round(
        interconnect_bandwidth_gbs * (scheduling_efficiency_pct / 100.0), 2
    )

    # Build deterministic 1F1B warmup + steady-state + cooldown sequence preview
    warmup_steps = min(num_stages - 1, num_micro_batches)
    steady_steps = max(0, num_micro_batches - warmup_steps)
    sequence: List[str] = []
    for w in range(warmup_steps):
        sequence.append("W-F" + str(w))
    for s in range(min(steady_steps, 8)):
        sequence.append("1F1B-F" + str(s + warmup_steps) + "-B" + str(s))
    for c in range(warmup_steps):
        sequence.append("C-B" + str(c + steady_steps))

    return ScheduleCalculationResponse(
        engine_id="GF-T3-289",
        corridor=CorridorType.ALPHA.value,
        total_pipeline_time_us=round(total_pipeline_time_us, 6),
        ideal_compute_time_us=round(ideal_compute_time_us, 6),
        bubble_time_us=round(bubble_time_us, 6),
        bubble_fraction_pct=round(bubble_fraction_pct, 4),
        scheduling_efficiency_pct=round(scheduling_efficiency_pct, 4),
        p2p_handoff_latency_us=round(p2p_handoff_latency_us, 6),
        barrier_sync_latency_us=barrier_sync_latency_us,
        effective_throughput_gbs=effective_throughput_gbs,
        schedule_sequence=sequence,
    )


class PipelineInterconnectEngine:
    """Stateful Clean-Room Simulator for GF-T3-289 8-Stage Pipeline Fabric."""

    def __init__(self) -> None:
        self.corridor: CorridorType = CorridorType.ALPHA
        self.pipeline_throughput_gbs: float = 44800.0
        self.stage_latency_us: float = 0.01
        self.active_stages: int = 8
        self.total_stages: int = 8
        self.processed_tokens_units: int = 8320000
        self.engine_xp_k: float = 75.0
        self.pipeline_state: str = "Streaming Active"
        self.bubble_stall_active: bool = False
        self.burst_mode_active: bool = False
        self.step_counter: int = 1
        self.mesh_pointer: str = "0x15F8DC0"
        self.vector_signature: List[float] = [5.01, 5.05, 5.02, 5.04]
        self.stages: List[StageNode] = self._build_initial_stages()
        self.radio_logs: List[str] = [
            "[00:01.04] 🟢 CREW CHIEF: Asynchronous pipeline interconnect and layer-partitioned micro-batch streaming engine initialized · 8 stages linked",
            "[00:01.08] 🟢 TELEMETRY: 1F1B micro-batch scheduling verified at 44,800 GB/s with zero bubble stall overhead",
        ]

    def _build_initial_stages(self) -> List[StageNode]:
        stages: List[StageNode] = []
        for idx in range(8):
            hex_addr = "0x160" + str(idx) + "0"
            stages.append(
                StageNode(
                    stage_id=idx,
                    label="Stage " + str(idx) + " (S" + str(idx) + ")",
                    hex_ptr=hex_addr,
                    tokens_k=256,
                    micro_batch_tag="8-UB",
                    latency_ms=0.02,
                    sync_pct=100.0,
                    status=StageStatus.STREAMING_LOCKED,
                    forward_passes=8 + idx,
                    backward_passes=8 + idx,
                )
            )
        return stages

    def get_state(self) -> PipelineTelemetryState:
        return PipelineTelemetryState(
            engine_id="GF-T3-289",
            corridor=self.corridor,
            pipeline_throughput_gbs=self.pipeline_throughput_gbs,
            stage_latency_us=self.stage_latency_us,
            active_stages=self.active_stages,
            total_stages=self.total_stages,
            processed_tokens_units=self.processed_tokens_units,
            engine_xp_k=self.engine_xp_k,
            pipeline_state=self.pipeline_state,
            bubble_stall_active=self.bubble_stall_active,
            burst_mode_active=self.burst_mode_active,
            step_counter=self.step_counter,
            mesh_pointer=self.mesh_pointer,
            vector_signature=self.vector_signature,
            stages=self.stages,
            radio_logs=self.radio_logs[-4:],
        )

    def set_corridor(self, corridor: CorridorType) -> PipelineTelemetryState:
        self.corridor = corridor
        if corridor == CorridorType.ALPHA:
            self.pipeline_throughput_gbs = 44800.0
            self.stage_latency_us = 0.01
            self.pipeline_state = "Streaming Active"
        elif corridor == CorridorType.BRAVO:
            self.pipeline_throughput_gbs = 46200.0
            self.stage_latency_us = 0.01
            self.pipeline_state = "Micro-Batch Lock"
        elif corridor == CorridorType.GAMMA:
            self.pipeline_throughput_gbs = 45120.0
            self.stage_latency_us = 0.01
            self.pipeline_state = "Zero-Bubble Sync"
        else:
            self.pipeline_throughput_gbs = 38400.0
            self.stage_latency_us = 0.03
            self.pipeline_state = "Fallback Forward"
        self.radio_logs.append(
            "[00:02.10] 🟢 CORRIDOR: Switched active fabric to " + corridor.value
        )
        return self.get_state()

    def trigger_stream_burst(self) -> PipelineTelemetryState:
        self.burst_mode_active = True
        self.bubble_stall_active = False
        self.pipeline_throughput_gbs = 51200.0
        self.stage_latency_us = 0.01
        self.processed_tokens_units += 640000
        self.engine_xp_k = round(self.engine_xp_k + 12.5, 1)
        self.pipeline_state = "Burst Overdrive"
        self.vector_signature = [5.42, 5.48, 5.45, 5.50]
        for s in self.stages:
            s.tokens_k += 64
            s.micro_batch_tag = "16-UB"
            s.latency_ms = 0.01
            s.sync_pct = 100.0
            s.status = StageStatus.BURST_OVERDRIVE
        self.radio_logs.append(
            "[00:02.45] 💥 BURST: Pipeline stream burst injected · 51,200 GB/s peer-to-peer saturation verified"
        )
        return self.get_state()

    def toggle_bubble_stall(self) -> PipelineTelemetryState:
        self.bubble_stall_active = not self.bubble_stall_active
        self.burst_mode_active = False
        if self.bubble_stall_active:
            self.pipeline_throughput_gbs = 39600.0
            self.stage_latency_us = 0.04
            self.pipeline_state = "Re-Balancing Stall"
            self.vector_signature = [4.82, 4.79, 4.91, 4.88]
            for idx, s in enumerate(self.stages):
                if idx in (2, 5):
                    s.latency_ms = 0.05
                    s.sync_pct = 96.5
                    s.status = StageStatus.STALL_SPIKE
                else:
                    s.latency_ms = 0.02
                    s.sync_pct = 99.2
                    s.status = StageStatus.STREAMING_LOCKED
            self.radio_logs.append(
                "[00:03.12] ⚡ STALL SPIKE: Bubble stall injected on S2/S5 · Autonomous 1F1B micro-batch re-balancer active"
            )
        else:
            self.pipeline_throughput_gbs = 44800.0
            self.stage_latency_us = 0.01
            self.pipeline_state = "Streaming Active"
            self.vector_signature = [5.01, 5.05, 5.02, 5.04]
            for s in self.stages:
                s.latency_ms = 0.02
                s.sync_pct = 100.0
                s.micro_batch_tag = "8-UB"
                s.status = StageStatus.STREAMING_LOCKED
            self.radio_logs.append(
                "[00:03.40] 🟢 RECOVERY: Bubble stall cleared · 1F1B steady-state restored across S0..S7"
            )
        return self.get_state()

    def step_1f1b_pass(self) -> PipelineTelemetryState:
        self.step_counter += 1
        self.processed_tokens_units += 256000
        self.engine_xp_k = round(self.engine_xp_k + 5.0, 1)
        self.pipeline_state = "Streaming Active"
        for s in self.stages:
            s.tokens_k += 32
            s.forward_passes += 1
            s.backward_passes += 1
            s.status = StageStatus.STREAMING_LOCKED
            s.sync_pct = 100.0
            s.latency_ms = 0.02
        self.radio_logs.append(
            "[00:04.05] 🚀 STEP 1F1B: Pass #"
            + str(self.step_counter)
            + " committed · Forward/Backward activations interleaved with zero CPU round-trip"
        )
        return self.get_state()

    def flush_stage_arenas(self) -> PipelineTelemetryState:
        self.burst_mode_active = False
        self.bubble_stall_active = False
        self.pipeline_throughput_gbs = 44800.0
        self.stage_latency_us = 0.01
        self.processed_tokens_units = 8320000
        self.engine_xp_k = 75.0
        self.pipeline_state = "Streaming Active"
        self.step_counter = 1
        self.vector_signature = [5.01, 5.05, 5.02, 5.04]
        self.stages = self._build_initial_stages()
        self.radio_logs.append(
            "[00:04.50] 🔄 FLUSH: Stage buffers flushed and activation arenas re-zeroed to baseline 44,800 GB/s"
        )
        return self.get_state()


app = FastAPI(
    title="GF-T3-289",
    description="Ultra-Wide Dynamic Asynchronous Pipeline Interconnect and Layer-Partitioned Micro-Batch Streaming Engine",
    version="3.289.0",
)

engine_instance = PipelineInterconnectEngine()


@app.get("/health")
def health_check() -> Dict[str, str]:
    return {
        "engine_id": "GF-T3-289",
        "status": "ONLINE",
        "pipeline_state": engine_instance.pipeline_state,
    }


@app.get("/api/pipeline/state", response_model=PipelineTelemetryState)
def get_pipeline_state() -> PipelineTelemetryState:
    return engine_instance.get_state()


@app.post("/api/pipeline/schedule", response_model=ScheduleCalculationResponse)
def calculate_pipeline_schedule(
    payload: ScheduleCalculationRequest,
) -> ScheduleCalculationResponse:
    try:
        return compute_1f1b_pipeline_schedule(
            num_stages=payload.num_stages,
            num_micro_batches=payload.num_micro_batches,
            t_bubble_us=payload.t_bubble_us,
            t_stage_us=payload.t_stage_us,
            interconnect_bandwidth_gbs=payload.interconnect_bandwidth_gbs,
            activation_tensor_mb=payload.activation_tensor_mb,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/pipeline/burst", response_model=PipelineTelemetryState)
def trigger_burst() -> PipelineTelemetryState:
    return engine_instance.trigger_stream_burst()


@app.post("/api/pipeline/stall", response_model=PipelineTelemetryState)
def toggle_stall() -> PipelineTelemetryState:
    return engine_instance.toggle_bubble_stall()


@app.post("/api/pipeline/step", response_model=PipelineTelemetryState)
def step_pass() -> PipelineTelemetryState:
    return engine_instance.step_1f1b_pass()


@app.post("/api/pipeline/flush", response_model=PipelineTelemetryState)
def flush_arenas() -> PipelineTelemetryState:
    return engine_instance.flush_stage_arenas()
