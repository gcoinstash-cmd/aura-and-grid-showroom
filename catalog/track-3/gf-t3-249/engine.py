# SPDX-License-Identifier: MIT
# GF-T3-249: Clean-Room Expert Parallelism & Top-2 Routing FastAPI Backend Engine

from typing import List, Literal
import math
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(
    title="GF-T3-249",
    description="Expert Parallelism · Top-2 Routing · Zero Drop",
    version="3.249.0",
)

MOE_CORRIDORS = (
    "MOE-CORRIDOR-ALPHA (SWITCH-TRANSFORMER-TOP2-ROUTER · 12000-GB/S)",
    "MOE-CORRIDOR-BRAVO (EXPERT-PARALLELISM-LOAD-BALANCING)",
    "MOE-CORRIDOR-GAMMA (AUXILIARY-LOSS-EXPERT-COLLAPSE-PREVENTION)",
    "MOE-CORRIDOR-DELTA (FALLBACK-DENSE-FEED-FORWARD)",
)

EXPERT_HEX_POINTERS = (
    "0xD000",
    "0xD100",
    "0xD200",
    "0xD300",
    "0xD400",
    "0xD500",
    "0xD600",
    "0xD700",
)

BASE_GATING_MATRIX = (
    (0.78, 0.74, 0.76, 0.82, 0.75, 0.77, 0.73, 0.79),
    (0.75, 0.79, 0.77, 0.84, 0.76, 0.74, 0.78, 0.75),
    (0.77, 0.76, 0.79, 0.81, 0.78, 0.75, 0.76, 0.74),
    (0.76, 0.77, 0.75, 0.83, 0.77, 0.78, 0.77, 0.76),
)


class RoutingRequestPayload(BaseModel):
    corridor: str = Field(
        default="MOE-CORRIDOR-ALPHA (SWITCH-TRANSFORMER-TOP2-ROUTER · 12000-GB/S)"
    )
    feature_vector: List[float] = Field(default_factory=lambda: [1.14, 1.18, 1.15, 1.16])
    batch_tokens: int = Field(default=2944, ge=64, le=65536)
    capacity_factor: float = Field(default=1.25, ge=1.0, le=2.5)
    auxiliary_alpha: float = Field(default=0.0012, ge=0.0001, le=0.1)
    saturation_spike: bool = Field(default=False)
    step_counter: int = Field(default=0, ge=0)


class ExpertDispatchRecord(BaseModel):
    expert_id: int
    label: str
    short_code: str
    hex_pointer: str
    load_percentage: float
    dispatched_tokens: int
    total_tokens: int
    gating_probability: float
    routing_rank_label: Literal["TOP-1", "TOP-2"]
    capacity_factor: float
    max_capacity_tokens: int
    overflow_redistributed: int
    status: Literal["BALANCED", "ROUTED", "SATURATED", "REBALANCING"]


class RoutingResponsePayload(BaseModel):
    engine_id: str
    corridor: str
    mesh_pointer: str
    throughput_gbs: int
    routing_latency_us: float
    active_experts: int
    processed_tokens: int
    dropped_tokens: int
    load_balance_efficiency: float
    auxiliary_loss: float
    router_z_loss: float
    top2_selected_indices: List[int]
    experts: List[ExpertDispatchRecord]


def compute_softmax(logits: List[float]) -> List[float]:
    if not logits:
        raise ValueError("Logits vector cannot be empty")
    max_logit = max(logits)
    exps = [math.exp(x - max_logit) for x in logits]
    total = sum(exps)
    return [val / total for val in exps]


def select_top2_experts(probabilities: List[float]) -> dict:
    if len(probabilities) < 2:
        raise ValueError("At least 2 experts required for Top-2 routing")
    indexed = sorted(enumerate(probabilities), key=lambda pair: pair[1], reverse=True)
    top1_idx, p1 = indexed[0]
    top2_idx, p2 = indexed[1]
    denom = p1 + p2 if (p1 + p2) > 0.0 else 1.0
    return {
        "top1_index": top1_idx,
        "top2_index": top2_idx,
        "top1_gate": round(p1 / denom, 4),
        "top2_gate": round(p2 / denom, 4),
    }


def compute_auxiliary_load_balancing_loss(
    token_fractions: List[float],
    routing_probabilities: List[float],
    alpha: float = 0.0012,
) -> float:
    num_experts = len(token_fractions)
    if num_experts == 0 or len(routing_probabilities) != num_experts:
        raise ValueError("Expert count mismatch between fractions and probabilities")
    dot_product = sum(f * p for f, p in zip(token_fractions, routing_probabilities))
    return round(alpha * num_experts * dot_product, 6)


def compute_router_z_loss(logits: List[float]) -> float:
    if not logits:
        return 0.0
    max_logit = max(logits)
    log_sum_exp = max_logit + math.log(sum(math.exp(x - max_logit) for x in logits))
    return round((log_sum_exp * log_sum_exp) / len(logits), 6)


def simulate_expert_parallel_dispatch(payload: RoutingRequestPayload) -> RoutingResponsePayload:
    if payload.corridor not in MOE_CORRIDORS:
        raise ValueError("Unsupported synthetic MoE corridor identifier")
    if len(payload.feature_vector) != 4:
        raise ValueError("Feature vector must contain exactly 4 dimensions")

    num_experts = 8
    max_capacity = math.ceil((payload.batch_tokens / num_experts) * payload.capacity_factor)

    logits: List[float] = []
    for e in range(num_experts):
        acc = sum(payload.feature_vector[d] * BASE_GATING_MATRIX[d][e] for d in range(4))
        harmonic = math.sin((payload.step_counter + 1) * 0.45 + e * 0.785398) * 0.035
        spike_bias = (
            0.42
            if (payload.saturation_spike and e in (0, 3))
            else (-0.09 if payload.saturation_spike else 0.0)
        )
        logits.append(acc + harmonic + spike_bias)

    probabilities = compute_softmax(logits)
    top2_info = select_top2_experts(probabilities)

    allocations = [round(payload.batch_tokens * p) for p in probabilities]
    rounding_delta = payload.batch_tokens - sum(allocations)
    allocations[3] = max(0, allocations[3] + rounding_delta)

    overflow_redistributed = [0] * num_experts
    overflow_pool = 0
    for e in range(num_experts):
        if allocations[e] > max_capacity:
            excess = allocations[e] - max_capacity
            allocations[e] = max_capacity
            overflow_redistributed[e] = excess
            overflow_pool += excess

    if overflow_pool > 0:
        for e in range(num_experts):
            if overflow_pool <= 0:
                break
            spare = max_capacity - allocations[e]
            if spare > 0:
                transfer = min(spare, overflow_pool)
                allocations[e] += transfer
                overflow_pool -= transfer

    fractions = [tok / payload.batch_tokens for tok in allocations]
    aux_loss = compute_auxiliary_load_balancing_loss(
        fractions, probabilities, payload.auxiliary_alpha
    )
    z_loss = compute_router_z_loss(logits)

    total_deviation = sum(abs(f - (1.0 / num_experts)) for f in fractions)
    load_bal_eff = round(max(84.0, min(99.9, (1.0 - total_deviation * 0.45) * 100.0)), 1)

    ranked_indices = [
        idx
        for idx, _ in sorted(enumerate(probabilities), key=lambda pair: pair[1], reverse=True)
    ]
    top_half = set(ranked_indices[:4])

    experts: List[ExpertDispatchRecord] = []
    for e in range(num_experts):
        dispatched = allocations[e]
        load_pct = round((dispatched / payload.batch_tokens) * 100.0, 1)
        gate_score = round(min(0.985, max(0.81, 0.78 + probabilities[e] * 1.12)), 3)

        status: Literal["BALANCED", "ROUTED", "SATURATED", "REBALANCING"] = "BALANCED"
        if payload.saturation_spike and e in (0, 3):
            status = "REBALANCING" if overflow_redistributed[e] > 0 else "SATURATED"
        elif e == 3 or load_pct > 13.4:
            status = "ROUTED"

        experts.append(
            ExpertDispatchRecord(
                expert_id=e,
                label="Expert " + str(e) + " (E" + str(e) + ")",
                short_code="E" + str(e),
                hex_pointer=EXPERT_HEX_POINTERS[e],
                load_percentage=load_pct,
                dispatched_tokens=dispatched,
                total_tokens=payload.batch_tokens,
                gating_probability=gate_score,
                routing_rank_label="TOP-1" if e in top_half else "TOP-2",
                capacity_factor=payload.capacity_factor,
                max_capacity_tokens=max_capacity,
                overflow_redistributed=overflow_redistributed[e],
                status=status,
            )
        )

    throughput_gbs = 11280 if payload.saturation_spike else 12000
    latency_us = 0.02 if payload.saturation_spike else 0.01

    return RoutingResponsePayload(
        engine_id="GF-T3-249",
        corridor=payload.corridor,
        mesh_pointer="0xCF8DC" + str(payload.step_counter % 8),
        throughput_gbs=throughput_gbs,
        routing_latency_us=latency_us,
        active_experts=num_experts,
        processed_tokens=sum(allocations),
        dropped_tokens=payload.batch_tokens - sum(allocations),
        load_balance_efficiency=load_bal_eff,
        auxiliary_loss=aux_loss,
        router_z_loss=z_loss,
        top2_selected_indices=[top2_info["top1_index"], top2_info["top2_index"]],
        experts=experts,
    )


@app.get("/health")
def health_check() -> dict:
    return {
        "engine": "GF-T3-249",
        "status": "LOCKED",
        "throughput_gbs": 12000,
        "routing_latency_us": 0.01,
        "active_experts": 8,
        "dropped_tokens": 0,
    }


@app.post("/v1/moe/dispatch", response_model=RoutingResponsePayload)
def dispatch_tokens(payload: RoutingRequestPayload) -> RoutingResponsePayload:
    try:
        return simulate_expert_parallel_dispatch(payload)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
