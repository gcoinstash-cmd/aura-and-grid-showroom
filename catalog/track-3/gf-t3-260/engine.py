"""
GF-T3-260: Non-Uniform 1F1B Micro-Batch Pipeline Parallelism & Interleaved Stage Memory Engine
SPDX-License-Identifier: MIT
Clean-Room Sovereign Implementation - Zero Copyleft Dependencies
"""

from dataclasses import dataclass, asdict
from typing import Dict, List, Literal, Optional
import math
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

CorridorId = Literal[
    "PIPE-CORRIDOR-ALPHA (1F1B-MICRO-BATCH-SCHEDULING-FABRIC · 22600-GB/S)",
    "PIPE-CORRIDOR-BRAVO (INTERLEAVED-STAGE-MEMORY-BALANCER)",
    "PIPE-CORRIDOR-GAMMA (NVLINK-P2P-TENSOR-TRANSFER-ENGINE)",
    "PIPE-CORRIDOR-DELTA (FALLBACK-SYNCHRONOUS-PASS)",
]

CORRIDOR_PROFILES: Dict[str, Dict[str, float | int | str]] = {
    "PIPE-CORRIDOR-ALPHA (1F1B-MICRO-BATCH-SCHEDULING-FABRIC · 22600-GB/S)": {
        "base_throughput_gbs": 22600.0,
        "interconnect_bandwidth_gbs": 900.0,
        "interleaving_degree": 2,
        "base_transfer_ms": 0.02,
        "zero_bubble_split_b_w": 1,
        "mode_tag": "PIPELINE_PARALLEL",
    },
    "PIPE-CORRIDOR-BRAVO (INTERLEAVED-STAGE-MEMORY-BALANCER)": {
        "base_throughput_gbs": 24100.0,
        "interconnect_bandwidth_gbs": 960.0,
        "interleaving_degree": 4,
        "base_transfer_ms": 0.015,
        "zero_bubble_split_b_w": 1,
        "mode_tag": "INTERLEAVED_1F1B",
    },
    "PIPE-CORRIDOR-GAMMA (NVLINK-P2P-TENSOR-TRANSFER-ENGINE)": {
        "base_throughput_gbs": 25400.0,
        "interconnect_bandwidth_gbs": 1120.0,
        "interleaving_degree": 2,
        "base_transfer_ms": 0.01,
        "zero_bubble_split_b_w": 1,
        "mode_tag": "P2P_DIRECT_FABRIC",
    },
    "PIPE-CORRIDOR-DELTA (FALLBACK-SYNCHRONOUS-PASS)": {
        "base_throughput_gbs": 16800.0,
        "interconnect_bandwidth_gbs": 640.0,
        "interleaving_degree": 1,
        "base_transfer_ms": 0.05,
        "zero_bubble_split_b_w": 0,
        "mode_tag": "SYNC_1F1B_GUARD",
    },
}


@dataclass
class StageNodeState:
    stage_id: int
    label: str
    hex_ptr: str
    batch_mode: str
    bubble_pct: float
    transfer_ms: float
    state_label: str
    forward_passes: int
    backward_input_passes: int
    backward_weight_passes: int
    inflight_microbatches: int
    virtual_chunks: int
    activation_memory_mb: float
    duty_cycle_pct: float


@dataclass
class ScheduleSlot:
    step_idx: int
    stage_id: int
    microbatch_id: int
    phase: Literal["F", "B_I", "B_W", "1F1B"]
    virtual_stage: int
    duration_us: float


class PipelineConfigRequest(BaseModel):
    corridor: str = Field(
        default="PIPE-CORRIDOR-ALPHA (1F1B-MICRO-BATCH-SCHEDULING-FABRIC · 22600-GB/S)"
    )
    num_stages: int = Field(default=8, ge=2, le=64)
    num_microbatches: int = Field(default=32, ge=4, le=512)
    interleaving_degree: int = Field(default=2, ge=1, le=8)
    hidden_dim: int = Field(default=8192, ge=512, le=32768)
    seq_length: int = Field(default=4096, ge=128, le=131072)
    zero_bubble_enabled: bool = Field(default=True)
    imbalance_injected: bool = Field(default=False)
    step_counter: int = Field(default=1, ge=0, le=100000)

    @field_validator("corridor")
    @classmethod
    def validate_corridor(cls, value: str) -> str:
        if value not in CORRIDOR_PROFILES:
            raise ValueError("Unsupported synthetic pipeline corridor identifier")
        return value


class FaultInjectionRequest(BaseModel):
    stage_id: int = Field(default=3, ge=0, le=7)
    imbalance_factor: float = Field(default=0.18, ge=0.0, le=0.95)
    auto_rebalance: bool = Field(default=False)


def compute_theoretical_bubble_ratio(
    num_stages: int,
    num_microbatches: int,
    interleaving_degree: int = 1,
    zero_bubble_enabled: bool = True,
    imbalance_factor: float = 0.0,
) -> float:
    """
    Computes pipeline bubble fraction under 1F1B and Interleaved Zero-Bubble 1F1B:
    Standard 1F1B bound: T_bubble <= (p - 1) / (p * m * v)
    When B_I (backward input gradient) and B_W (backward weight gradient) are decoupled
    and scheduled into warmup/cooldown tails with non-uniform micro-batch sizing,
    the steady-state bubble approaches zero unless stage imbalance is injected.
    """
    if num_stages <= 1 or num_microbatches <= 0 or interleaving_degree <= 0:
        return 0.0

    raw_bound = (num_stages - 1.0) / float(
        num_stages * num_microbatches * interleaving_degree
    )

    if zero_bubble_enabled and imbalance_factor <= 0.0:
        return 0.0

    residual_factor = 0.04 if zero_bubble_enabled else 1.0
    imbalance_penalty = imbalance_factor * 0.42
    bubble_fraction = (raw_bound * residual_factor) + imbalance_penalty
    return round(min(max(bubble_fraction * 100.0, 0.0), 99.9), 2)


def compute_stage_memory_footprint_mb(
    stage_id: int,
    num_stages: int,
    interleaving_degree: int,
    hidden_dim: int,
    seq_length: int,
) -> float:
    """
    Computes peak activation memory in MB for stage s in [0, p-1].
    Under 1F1B warm-up, stage s holds (p - s) in-flight micro-batches.
    Interleaved virtual stages scale activation buffer balancing across v chunks.
    """
    inflight = max(1, num_stages - stage_id)
    bytes_per_token_activation = hidden_dim * 2  # FP16/BF16 2 bytes per element
    microbatch_activation_mb = (seq_length * bytes_per_token_activation) / (1024.0 * 1024.0)
    interleaved_overhead = 1.0 + ((interleaving_degree - 1) * 0.0625)
    return round(inflight * microbatch_activation_mb * interleaved_overhead, 2)


def build_non_uniform_1f1b_schedule(
    num_stages: int = 8,
    num_microbatches: int = 16,
    interleaving_degree: int = 2,
    zero_bubble_enabled: bool = True,
) -> List[ScheduleSlot]:
    """
    Constructs a verifiable non-uniform 1F1B schedule across pipeline stages:
    1. Warm-up phase: stage s executes (p - s - 1) forward passes.
    2. Steady-state 1F1B phase: alternates 1 Forward + 1 Backward (decoupled B_I and B_W).
    3. Cool-down phase: drains remaining in-flight backward passes.
    """
    schedule: List[ScheduleSlot] = []
    step_counter = 0

    for stage_id in range(num_stages):
        warmup_steps = max(0, num_stages - stage_id - 1)
        steady_steps = max(1, num_microbatches - warmup_steps)

        for mb in range(warmup_steps):
            v_stage = mb % interleaving_degree
            schedule.append(
                ScheduleSlot(
                    step_idx=step_counter,
                    stage_id=stage_id,
                    microbatch_id=mb,
                    phase="F",
                    virtual_stage=v_stage,
                    duration_us=round(12.5 / interleaving_degree, 3),
                )
            )
            step_counter += 1

        for s_idx in range(steady_steps):
            mb_id = warmup_steps + s_idx
            v_stage = mb_id % interleaving_degree
            schedule.append(
                ScheduleSlot(
                    step_idx=step_counter,
                    stage_id=stage_id,
                    microbatch_id=mb_id,
                    phase="1F1B",
                    virtual_stage=v_stage,
                    duration_us=round(24.0 / interleaving_degree, 3),
                )
            )
            step_counter += 1
            if zero_bubble_enabled:
                schedule.append(
                    ScheduleSlot(
                        step_idx=step_counter,
                        stage_id=stage_id,
                        microbatch_id=max(0, mb_id - warmup_steps),
                        phase="B_W",
                        virtual_stage=v_stage,
                        duration_us=round(6.2 / interleaving_degree, 3),
                    )
                )
                step_counter += 1

        for c_idx in range(warmup_steps):
            mb_id = steady_steps + c_idx
            v_stage = mb_id % interleaving_degree
            schedule.append(
                ScheduleSlot(
                    step_idx=step_counter,
                    stage_id=stage_id,
                    microbatch_id=mb_id,
                    phase="B_I",
                    virtual_stage=v_stage,
                    duration_us=round(11.8 / interleaving_degree, 3),
                )
            )
            step_counter += 1

    return schedule


def evaluate_pipeline_state(req: PipelineConfigRequest) -> Dict[str, object]:
    profile = CORRIDOR_PROFILES[req.corridor]
    base_tp = float(profile["base_throughput_gbs"])
    base_transfer = float(profile["base_transfer_ms"])
    interleaving = max(req.interleaving_degree, int(profile["interleaving_degree"]))

    imbalance_factor = 0.16 if req.imbalance_injected else 0.0
    global_bubble_pct = compute_theoretical_bubble_ratio(
        num_stages=req.num_stages,
        num_microbatches=req.num_microbatches,
        interleaving_degree=interleaving,
        zero_bubble_enabled=req.zero_bubble_enabled,
        imbalance_factor=imbalance_factor,
    )

    step_boost = ((req.step_counter - 1) % 8) * 125.0
    effective_tp = round(
        base_tp * (1.0 - (global_bubble_pct / 180.0)) + step_boost, 1
    )
    bubble_latency_us = (
        0.01
        if global_bubble_pct == 0.0
        else round(0.01 + (global_bubble_pct * 0.14), 2)
    )

    stages: List[Dict[str, object]] = []
    vec_metrics: List[float] = []

    for idx in range(req.num_stages):
        hex_addr = "0x" + format(0x9000 + (idx * 0x0100), "04X")
        stage_imbalance = (
            round(global_bubble_pct * (1.0 + ((idx % 3) * 0.15)), 1)
            if req.imbalance_injected
            else 0.0
        )
        stage_transfer = (
            round(base_transfer + (0.03 if req.imbalance_injected and idx in (2, 5) else 0.0), 2)
        )
        state_str = (
            "REBALANCE · WARN"
            if req.imbalance_injected and idx in (2, 5)
            else "BALANCED · LOCKED"
        )
        batch_mode = (
            "1F1B-ZB" if req.zero_bubble_enabled and req.step_counter > 1 else "1F1B"
        )
        mem_mb = compute_stage_memory_footprint_mb(
            stage_id=idx,
            num_stages=req.num_stages,
            interleaving_degree=interleaving,
            hidden_dim=req.hidden_dim,
            seq_length=req.seq_length,
        )
        duty_cycle = round(100.0 - stage_imbalance, 1)

        node = StageNodeState(
            stage_id=idx,
            label="Stage " + str(idx) + " (P" + str(idx) + ")",
            hex_ptr=hex_addr,
            batch_mode=batch_mode,
            bubble_pct=stage_imbalance,
            transfer_ms=stage_transfer,
            state_label=state_str,
            forward_passes=req.num_microbatches + req.step_counter,
            backward_input_passes=req.num_microbatches + req.step_counter,
            backward_weight_passes=req.num_microbatches + req.step_counter,
            inflight_microbatches=max(1, req.num_stages - idx),
            virtual_chunks=interleaving,
            activation_memory_mb=mem_mb,
            duty_cycle_pct=duty_cycle,
        )
        stages.append(asdict(node))
        if idx < 4:
            vec_metrics.append(round(2.21 + (idx * 0.01) + ((req.step_counter % 3) * 0.01), 2))

    processed_tokens = 4352000 + ((req.step_counter - 1) * 136000)
    schedule_slots = [
        asdict(s)
        for s in build_non_uniform_1f1b_schedule(
            num_stages=req.num_stages,
            num_microbatches=min(req.num_microbatches, 16),
            interleaving_degree=interleaving,
            zero_bubble_enabled=req.zero_bubble_enabled,
        )
    ]

    return {
        "engine_id": "GF-T3-260",
        "corridor": req.corridor,
        "mode": profile["mode_tag"],
        "mesh_ptr": "0x8F8DC0",
        "throughput_gbs": effective_tp,
        "bubble_latency_us": bubble_latency_us,
        "bubble_pct": global_bubble_pct,
        "active_stages": req.num_stages,
        "total_stages": req.num_stages,
        "processed_tokens": processed_tokens,
        "pipeline_state": "IMBALANCE DETECTED" if req.imbalance_injected else "1F1B Active",
        "vector_signature": vec_metrics,
        "stages": stages,
        "schedule_sample": schedule_slots[:24],
        "schedule_total_ops": len(schedule_slots),
    }


app = FastAPI(
    title="GF-T3-260",
    description="Track 3 Flagship Non-Uniform 1F1B Micro-Batch Pipeline Parallelism Engine",
    version="3.260.0",
)


@app.get("/health")
def health_check() -> Dict[str, str]:
    return {
        "engine": "GF-T3-260",
        "status": "LOCKED",
        "pipeline_state": "1F1B Active",
    }


@app.post("/api/v1/pipeline/evaluate")
def api_evaluate_pipeline(payload: PipelineConfigRequest) -> Dict[str, object]:
    return evaluate_pipeline_state(payload)


@app.post("/api/v1/pipeline/fault-inject")
def api_inject_fault(payload: FaultInjectionRequest) -> Dict[str, object]:
    if payload.stage_id < 0 or payload.stage_id > 7:
        raise HTTPException(status_code=400, detail="Stage index out of bounds")

    effective_imbalance = 0.0 if payload.auto_rebalance else payload.imbalance_factor
    bubble_pct = compute_theoretical_bubble_ratio(
        num_stages=8,
        num_microbatches=32,
        interleaving_degree=2,
        zero_bubble_enabled=payload.auto_rebalance,
        imbalance_factor=effective_imbalance,
    )
    return {
        "engine_id": "GF-T3-260",
        "target_stage": "P" + str(payload.stage_id),
        "auto_rebalanced": payload.auto_rebalance,
        "resulting_bubble_pct": bubble_pct,
        "status": "BALANCED · LOCKED" if payload.auto_rebalance else "REBALANCE · WARN",
    }
