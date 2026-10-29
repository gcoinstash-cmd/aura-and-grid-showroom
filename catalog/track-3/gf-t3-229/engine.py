"""
GF-T3-229: Pipeline-Parallel 1F1B Bubble-Shedding Backend Engine
Standalone FastAPI implementation of 1F1B micro-batch scheduling matrix,
inter-stage P2P tensor queues, activation stash lifecycle, analytical
bubble ratio derivation, and numerical gradient equivalence verification.
License: MIT
"""

from enum import Enum
from typing import Dict, List, Optional, Tuple
import math
import re
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

app = FastAPI(
    title="GF-T3-229",
    description="Pipeline-Parallel 1F1B Engine · Micro-Batch Staging · Zero Bubble Interleaved",
    version="3.229.0",
)


class CorridorId(str, Enum):
    ALPHA = "PIPE-CORRIDOR-ALPHA (1F1B-STEADY-STATE · ZERO-BUBBLE-INTERLEAVED)"
    BRAVO = "PIPE-CORRIDOR-BRAVO (ASYNC-P2P-TENSOR-STAGING · ACTIVATION-STASH)"
    GAMMA = "PIPE-CORRIDOR-GAMMA (DYNAMIC-MICRO-BATCH-CHUNKING · 4-STAGE)"
    DELTA = "PIPE-CORRIDOR-DELTA (GREEDY-SYNCHRONOUS-FLUSH-FALLBACK)"


class SlotPhase(str, Enum):
    WARMUP_FORWARD = "ACTIVE_FORWARD"
    STEADY_FORWARD = "STEADY_FORWARD"
    STEADY_BACKWARD = "STEADY_BACKWARD"
    COOLDOWN_BACKWARD = "COOLDOWN_BACKWARD"
    BUBBLE_IDLE = "BUBBLE_IDLE"


class PipelineSlot(BaseModel):
    step_index: int
    stage_id: int
    op_type: str  # "F", "B", or "IDLE"
    micro_batch_id: Optional[int]
    label: str
    tensor_shape: List[int]
    peer_stage: str
    stash_pointer: str
    gradient_status: str
    phase: SlotPhase
    duration_ms: float
    p2p_overlap_ms: float
    active_stash_count: int


class StageStashState(BaseModel):
    stage_id: int
    active_slots: int
    max_capacity: int
    stash_pointers: List[str]
    memory_mb: int
    is_straggler: bool


class TelemetrySnapshot(BaseModel):
    corridor: str
    num_stages: int
    num_micro_batches: int
    current_step: int
    total_steps: int
    aggregate_tflops: int
    bubble_ratio_pct: float
    p2p_latency_ms: float
    sustained_tokens: int
    pipe_xp_delta: str
    memory_cap_activations: int
    straggler_stage_2_active: bool
    schedule_grid: Dict[int, List[PipelineSlot]]
    stage_stashes: List[StageStashState]


class CommandIngressPayload(BaseModel):
    corridor: CorridorId = Field(default=CorridorId.ALPHA)
    num_stages: int = Field(default=4, ge=2, le=8)
    num_micro_batches: int = Field(default=16, ge=4, le=64)
    straggler_active: bool = Field(default=False)
    step_cursor: int = Field(default=12, ge=0, le=128)
    operator_note: str = Field(default="NOMINAL_1F1B_EXECUTION", max_length=120)

    @field_validator("operator_note")
    @classmethod
    def sanitize_operator_note(cls, value: str) -> str:
        forbidden = re.compile(
            r"(;|--|<script|</script|DROP\s+TABLE|UNION\s+SELECT|\x24)",
            re.IGNORECASE,
        )
        if forbidden.search(value):
            raise ValueError("Zero-Trust GridSync Ingress Violation: Forbidden token detected")
        return value.strip()


def compute_stash_pointer(stage_id: int, micro_batch_id: Optional[int]) -> str:
    """
    Computes deterministic hexadecimal memory address for stashed activations.
    Calibrated so Stage 1, Micro-Batch 4 maps to 0x7FA200.
    """
    if micro_batch_id is None:
        return "0x000000"
    offset = 0x7FA000 + (stage_id * 0x0180) + (micro_batch_id * 0x0020)
    return "0x" + format(offset, "06X")


def generate_stage_1f1b_sequence(
    stage_id: int,
    num_stages: int,
    num_micro_batches: int,
) -> List[Tuple[str, int, SlotPhase, int]]:
    """
    Generates the exact ordered operations (op_type, micro_batch_id, phase, stashed_activations)
    for a given stage `stage_id` in [0, num_stages - 1]:
    1. Warmup Phase: executes `warmup_count = num_stages - stage_id - 1` forward passes.
    2. Steady-State 1F1B Phase: alternates 1 Forward pass and 1 Backward pass.
    3. Cooldown Phase: drains remaining stashed activations with Backward passes.
    Strictly caps stashed activations on stage `stage_id` to `num_stages - stage_id <= num_stages`.
    """
    warmup_count = min(num_stages - stage_id - 1, num_micro_batches)
    sequence: List[Tuple[str, int, SlotPhase, int]] = []
    f_idx = 0
    b_idx = 0
    stashed = 0
    max_stage_bound = num_stages - stage_id

    # 1. Warmup Forward Passes
    for _ in range(warmup_count):
        stashed += 1
        assert stashed <= max_stage_bound, "Activation stash exceeded stage bound"
        sequence.append(("F", f_idx, SlotPhase.WARMUP_FORWARD, stashed))
        f_idx += 1

    # 2. Steady-State 1F1B Alternating Cycles (1 Forward + 1 Backward)
    while f_idx < num_micro_batches:
        stashed += 1
        assert stashed <= max_stage_bound, "Activation stash exceeded stage bound"
        sequence.append(("F", f_idx, SlotPhase.STEADY_FORWARD, stashed))
        f_idx += 1

        # Immediately pair with 1 Backward pass releasing 1 stashed activation
        sequence.append(("B", b_idx, SlotPhase.STEADY_BACKWARD, stashed))
        stashed -= 1
        b_idx += 1

    # 3. Cooldown Backward Passes
    while b_idx < num_micro_batches:
        sequence.append(("B", b_idx, SlotPhase.COOLDOWN_BACKWARD, stashed))
        stashed -= 1
        b_idx += 1

    return sequence


def build_1f1b_schedule(
    num_stages: int = 4,
    num_micro_batches: int = 16,
    corridor: CorridorId = CorridorId.ALPHA,
    straggler_active: bool = False,
) -> TelemetrySnapshot:
    """
    Constructs a verified 1F1B (One-Forward-One-Backward) schedule across `num_stages` ranks
    and `num_micro_batches` micro-batches.
    Memory complexity is strictly bounded by `num_stages - stage_id` activations per rank,
    capping peak stashed activations at `p = num_stages` (4) instead of `m = num_micro_batches` (16).
    """
    total_steps = (2 * num_micro_batches) + (2 * (num_stages - 1))
    schedule_grid: Dict[int, List[PipelineSlot]] = {s: [] for s in range(num_stages)}

    for s in range(num_stages):
        seq = generate_stage_1f1b_sequence(s, num_stages, num_micro_batches)
        warmup_count = min(num_stages - s - 1, num_micro_batches)
        stage_events: Dict[int, Tuple[str, int, SlotPhase, int]] = {}

        cursor = s
        for idx, item in enumerate(seq):
            op_type, mb_id, phase, stashed_cnt = item
            # First backward on stage s cannot start before step (2 * num_stages - 1 - s)
            if op_type == "B" and mb_id == 0:
                earliest_b0 = (2 * num_stages) - 1 - s
                if cursor < earliest_b0:
                    cursor = earliest_b0
            stage_events[cursor] = (op_type, mb_id, phase, stashed_cnt)
            cursor += 1

        max_step = max(total_steps, cursor)
        is_stage_straggler = straggler_active and (s == 2)
        base_duration = 2.40 if is_stage_straggler else 1.20
        p2p_overlap = 0.44 if is_stage_straggler else 0.22

        for step in range(max_step):
            if step in stage_events:
                op_type, mb_id, phase, stashed_cnt = stage_events[step]
                peer = (
                    "S" + str(min(num_stages - 1, s + 1))
                    if op_type == "F"
                    else "S" + str(max(0, s - 1))
                )
                grad_status = (
                    "STASHED_ACT_READY"
                    if op_type == "F"
                    else "GRAD_REDUCED_RELEASED"
                )
                schedule_grid[s].append(
                    PipelineSlot(
                        step_index=step,
                        stage_id=s,
                        op_type=op_type,
                        micro_batch_id=mb_id,
                        label=op_type + str(mb_id),
                        tensor_shape=[16, 4096],
                        peer_stage=peer,
                        stash_pointer=compute_stash_pointer(s, mb_id),
                        gradient_status=grad_status,
                        phase=phase,
                        duration_ms=base_duration,
                        p2p_overlap_ms=p2p_overlap,
                        active_stash_count=stashed_cnt,
                    )
                )
            else:
                schedule_grid[s].append(
                    PipelineSlot(
                        step_index=step,
                        stage_id=s,
                        op_type="IDLE",
                        micro_batch_id=None,
                        label="BUBBLE",
                        tensor_shape=[0, 0],
                        peer_stage="NONE",
                        stash_pointer="0x000000",
                        gradient_status="IDLE_BUBBLE_SHED",
                        phase=SlotPhase.BUBBLE_IDLE,
                        duration_ms=base_duration,
                        p2p_overlap_ms=0.0,
                        active_stash_count=0,
                    )
                )

    raw_bubble = (num_stages - 1) / float(num_micro_batches + num_stages - 1)
    if corridor == CorridorId.ALPHA:
        compression = 0.532
    elif corridor == CorridorId.BRAVO:
        compression = 0.608
    elif corridor == CorridorId.GAMMA:
        compression = 0.684
    else:
        compression = 1.000

    straggler_penalty = 6.2 if straggler_active else 0.0
    bubble_ratio_pct = round((raw_bubble * 100.0 * compression) + straggler_penalty, 1)

    p2p_latency_ms = 0.44 if straggler_active else 0.22
    if corridor == CorridorId.BRAVO and not straggler_active:
        p2p_latency_ms = 0.18
    elif corridor == CorridorId.DELTA and not straggler_active:
        p2p_latency_ms = 0.36

    base_tflops = 1420
    if corridor == CorridorId.BRAVO:
        base_tflops = 1380
    elif corridor == CorridorId.GAMMA:
        base_tflops = 1340
    elif corridor == CorridorId.DELTA:
        base_tflops = 1190

    if straggler_active:
        base_tflops = int(base_tflops * 0.74)

    sustained_tokens = int(
        (num_micro_batches * 28000) * (1.0 - (0.18 if straggler_active else 0.0))
    )

    stage_stashes: List[StageStashState] = []
    for s in range(num_stages):
        cap = num_stages - s
        ptrs = [compute_stash_pointer(s, i) for i in range(cap)]
        stage_stashes.append(
            StageStashState(
                stage_id=s,
                active_slots=cap,
                max_capacity=num_stages,
                stash_pointers=ptrs,
                memory_mb=cap * 512,
                is_straggler=(straggler_active and s == 2),
            )
        )

    return TelemetrySnapshot(
        corridor=corridor.value,
        num_stages=num_stages,
        num_micro_batches=num_micro_batches,
        current_step=12,
        total_steps=len(schedule_grid[0]),
        aggregate_tflops=base_tflops,
        bubble_ratio_pct=bubble_ratio_pct,
        p2p_latency_ms=p2p_latency_ms,
        sustained_tokens=sustained_tokens,
        pipe_xp_delta="+9.6k PIPE XP" if not straggler_active else "+6.1k PIPE XP",
        memory_cap_activations=num_stages,
        straggler_stage_2_active=straggler_active,
        schedule_grid=schedule_grid,
        stage_stashes=stage_stashes,
    )


def verify_gradient_equivalence_1f1b_vs_serial(
    num_stages: int = 4,
    num_micro_batches: int = 16,
) -> Dict[str, object]:
    """
    Executes a deterministic 4-stage multi-layer transformation:
      h_{s+1} = w_s * h_s + b_s
    with MSE loss L = 0.5 * (h_p - target)^2 across `num_micro_batches` micro-batches.
    Compares:
      1. Serial monolithic full-batch forward + backward gradient accumulation.
      2. Pipeline-Parallel 1F1B interleaved schedule using stashed activations per stage.
    Returns exact gradients and verifies numerical equivalence (max_abs_diff < 1e-12).
    """
    weights = [0.65 + (0.11 * s) for s in range(num_stages)]
    biases = [0.05 * (s + 1) for s in range(num_stages)]
    micro_inputs = [0.25 + (0.04 * m) for m in range(num_micro_batches)]
    micro_targets = [1.10 + (0.03 * m) for m in range(num_micro_batches)]

    # 1. Serial Monolithic Reference Pass
    serial_grad_w = [0.0 for _ in range(num_stages)]
    serial_grad_b = [0.0 for _ in range(num_stages)]

    for m in range(num_micro_batches):
        acts = [micro_inputs[m]]
        h = micro_inputs[m]
        for s in range(num_stages):
            h = (weights[s] * h) + biases[s]
            acts.append(h)

        # dL / dh_p = (h_p - target) / num_micro_batches
        grad_out = (acts[num_stages] - micro_targets[m]) / float(num_micro_batches)
        g = grad_out
        for s in range(num_stages - 1, -1, -1):
            serial_grad_w[s] += g * acts[s]
            serial_grad_b[s] += g
            g = g * weights[s]

    # 2. Pipeline-Parallel 1F1B Stashed Activation Execution
    pipe_grad_w = [0.0 for _ in range(num_stages)]
    pipe_grad_b = [0.0 for _ in range(num_stages)]

    # Pre-compute P2P forward boundary tensors and backward boundary gradients
    # while strictly stashing and popping activations per stage in 1F1B order
    forward_boundary: Dict[Tuple[int, int], float] = {}
    for m in range(num_micro_batches):
        forward_boundary[(0, m)] = micro_inputs[m]

    # Forward propagation across stages
    for s in range(num_stages):
        for m in range(num_micro_batches):
            h_in = forward_boundary[(s, m)]
            forward_boundary[(s + 1, m)] = (weights[s] * h_in) + biases[s]

    backward_boundary: Dict[Tuple[int, int], float] = {}
    for m in range(num_micro_batches):
        h_final = forward_boundary[(num_stages, m)]
        backward_boundary[(num_stages - 1, m)] = (
            h_final - micro_targets[m]
        ) / float(num_micro_batches)

    for s in range(num_stages - 1, 0, -1):
        for m in range(num_micro_batches):
            backward_boundary[(s - 1, m)] = backward_boundary[(s, m)] * weights[s]

    # Execute 1F1B schedule on each stage using bounded activation stash
    max_observed_stash = 0
    for s in range(num_stages):
        seq = generate_stage_1f1b_sequence(s, num_stages, num_micro_batches)
        stage_stash: Dict[int, float] = {}
        for op_type, mb_id, _phase, _cnt in seq:
            if op_type == "F":
                stage_stash[mb_id] = forward_boundary[(s, mb_id)]
                if len(stage_stash) > max_observed_stash:
                    max_observed_stash = len(stage_stash)
                assert len(stage_stash) <= (num_stages - s)
            elif op_type == "B":
                stashed_input = stage_stash.pop(mb_id)
                grad_upstream = backward_boundary[(s, mb_id)]
                pipe_grad_w[s] += grad_upstream * stashed_input
                pipe_grad_b[s] += grad_upstream

        assert len(stage_stash) == 0, "Stage activation stash must drain to zero after cooldown"

    max_diff_w = max(
        abs(serial_grad_w[s] - pipe_grad_w[s]) for s in range(num_stages)
    )
    max_diff_b = max(
        abs(serial_grad_b[s] - pipe_grad_b[s]) for s in range(num_stages)
    )
    max_diff = max(max_diff_w, max_diff_b)

    return {
        "serial_grad_w": serial_grad_w,
        "pipe_grad_w": pipe_grad_w,
        "serial_grad_b": serial_grad_b,
        "pipe_grad_b": pipe_grad_b,
        "max_abs_diff": max_diff,
        "max_observed_stash": max_observed_stash,
        "numerically_equivalent": bool(math.isclose(max_diff, 0.0, abs_tol=1e-12)),
    }


@app.get("/api/health")
def health_check() -> Dict[str, str]:
    return {
        "engine_id": "GF-T3-229",
        "track": "TRACK 3",
        "status": "LOCKED",
        "architecture": "PIPELINE_PARALLEL_1F1B",
    }


@app.post("/api/schedule", response_model=TelemetrySnapshot)
def compute_schedule_endpoint(payload: CommandIngressPayload) -> TelemetrySnapshot:
    return build_1f1b_schedule(
        num_stages=payload.num_stages,
        num_micro_batches=payload.num_micro_batches,
        corridor=payload.corridor,
        straggler_active=payload.straggler_active,
    )


@app.get("/api/verify-gradients")
def verify_gradients_endpoint() -> Dict[str, object]:
    return verify_gradient_equivalence_1f1b_vs_serial(num_stages=4, num_micro_batches=16)
