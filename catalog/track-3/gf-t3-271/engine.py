"""
GF-T3-271: Track 3 Asynchronous Expert-Parallelism & Load-Balanced Dynamic Token Routing Engine
SPDX-License-Identifier: MIT
Clean-Room Implementation - Zero Proprietary Marks - Zero Dollar Gate Enforced
"""

import math
from typing import Dict, List, Literal, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

app = FastAPI(
    title="GF-T3-271",
    description="Asynchronous Expert-Parallelism & Load-Balanced Dynamic Token Routing Engine",
    version="3.271.0",
)

CORRIDOR_PROFILES: Dict[str, Dict[str, float]] = {
    "EXPERT-CORRIDOR-ALPHA (ASYNC-EXPERT-PARALLELISM-ROUTING-FABRIC · 31200-GB/S)": {
        "base_bandwidth_gbps": 31200.0,
        "base_latency_us": 0.01,
        "capacity_factor": 1.25,
        "aux_loss_coeff": 0.01,
        "overlap_ratio": 0.96,
    },
    "EXPERT-CORRIDOR-BRAVO (DYNAMIC-LOAD-BALANCING-DISPATCH-ENGINE)": {
        "base_bandwidth_gbps": 29800.0,
        "base_latency_us": 0.012,
        "capacity_factor": 1.15,
        "aux_loss_coeff": 0.02,
        "overlap_ratio": 0.94,
    },
    "EXPERT-CORRIDOR-GAMMA (NON-BLOCKING-ALL-TO-ALL-TOKEN-EXCHANGER)": {
        "base_bandwidth_gbps": 30600.0,
        "base_latency_us": 0.011,
        "capacity_factor": 1.20,
        "aux_loss_coeff": 0.015,
        "overlap_ratio": 0.98,
    },
    "EXPERT-CORRIDOR-DELTA (FALLBACK-DENSE-FEEDFORWARD-PASS)": {
        "base_bandwidth_gbps": 24000.0,
        "base_latency_us": 0.025,
        "capacity_factor": 1.00,
        "aux_loss_coeff": 0.005,
        "overlap_ratio": 0.85,
    },
}


class ExpertNodeState(BaseModel):
    expert_id: int = Field(..., ge=0, le=7)
    label: str
    ptr_hex: str
    routed_tokens: int = Field(..., ge=0)
    load_percentage: float = Field(..., ge=0.0, le=100.0)
    latency_ms: float = Field(..., ge=0.0)
    affinity_weight: float = Field(..., ge=0.0)
    sync_percentage: float = Field(..., ge=0.0, le=100.0)
    status: Literal["BALANCED · LOCKED", "REBALANCING · ACTIVE", "CONGESTION · FAULT"]


class DispatchRequest(BaseModel):
    corridor: str = Field(
        default="EXPERT-CORRIDOR-ALPHA (ASYNC-EXPERT-PARALLELISM-ROUTING-FABRIC · 31200-GB/S)"
    )
    total_tokens: int = Field(default=2048000, ge=1024, le=64000000)
    num_experts: int = Field(default=8, ge=2, le=64)
    top_k: int = Field(default=2, ge=1, le=8)
    capacity_factor: float = Field(default=1.25, ge=1.0, le=2.5)
    raw_logits: List[float] = Field(
        default_factory=lambda: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
    )
    congestion_spike: bool = Field(default=False)
    burst_active: bool = Field(default=False)
    step_index: int = Field(default=1, ge=0)

    @field_validator("corridor")
    @classmethod
    def validate_corridor(cls, value: str) -> str:
        if chr(36) in value:
            raise ValueError("Zero-Dollar Gate violation detected in corridor identifier")
        if value not in CORRIDOR_PROFILES:
            raise ValueError("Unknown synthetic expert corridor identifier")
        return value


class DispatchTelemetryResponse(BaseModel):
    project_title: str = "GF-T3-271"
    corridor: str
    routing_throughput_gbps: float
    dispatch_latency_us: float
    active_experts: int
    total_experts: int
    processed_tokens: int
    dropped_tokens: int
    auxiliary_loss: float
    load_variance: float
    all_to_all_efficiency_pct: float
    moe_state: str
    affinity_vector: List[float]
    experts: List[ExpertNodeState]


def softmax_probabilities(logits: List[float], temperature: float = 1.0) -> List[float]:
    if not logits:
        raise ValueError("Logits array must not be empty")
    scaled = [x / max(temperature, 1e-6) for x in logits]
    max_val = max(scaled)
    exps = [math.exp(x - max_val) for x in scaled]
    total = sum(exps)
    return [e / total for e in exps]


def compute_auxiliary_load_balance_loss(
    routing_fractions: List[float], mean_probabilities: List[float]
) -> float:
    """
    Computes switch auxiliary load-balancing loss:
    L_aux = E * sum_{k=1}^{E} (f_k * P_k)
    where f_k = (1/T) * sum_{i=1}^{T} I(routed_i == expert_k)
    Strictly equals 1.0 when perfectly uniform (f_k = 1/E and P_k = 1/E).
    """
    num_experts = len(routing_fractions)
    if num_experts == 0 or len(mean_probabilities) != num_experts:
        raise ValueError("Routing fractions and probabilities must have matching non-zero length")
    dot_product = sum(f * p for f, p in zip(routing_fractions, mean_probabilities))
    return round(num_experts * dot_product, 6)


def rebalance_logits_with_auxiliary_gradient(
    raw_logits: List[float],
    aux_loss_coeff: float,
    damping_passes: int = 6,
) -> List[float]:
    """
    Iteratively updates expert routing logits using negative gradient of auxiliary load loss
    to eliminate hot spots and enforce capacity-factor bounds in sub-microsecond SM registers.
    """
    adjusted = list(raw_logits)
    num_experts = len(adjusted)
    target_share = 1.0 / float(num_experts)

    for _ in range(max(1, damping_passes)):
        probs = softmax_probabilities(adjusted)
        next_logits: List[float] = []
        for idx, logit in enumerate(adjusted):
            imbalance = probs[idx] - target_share
            correction = imbalance * (1.85 + aux_loss_coeff * 12.0)
            next_logits.append(logit - correction)
        adjusted = next_logits

    return adjusted


def execute_asynchronous_expert_dispatch(req: DispatchRequest) -> DispatchTelemetryResponse:
    profile = CORRIDOR_PROFILES[req.corridor]
    num_experts = req.num_experts

    if len(req.raw_logits) != num_experts:
        raise HTTPException(
            status_code=422,
            detail="raw_logits length must match num_experts",
        )

    effective_tokens = req.total_tokens * (2 if req.burst_active else 1)

    if req.congestion_spike:
        # Unbalanced spike on E2 and E5 before dynamic damping
        working_logits = [
            req.raw_logits[i] + (1.65 if i in (2, 5) else -0.25)
            for i in range(num_experts)
        ]
        # Apply partial damping during spike to showcase active rebalancing vs raw congestion
        balanced_logits = rebalance_logits_with_auxiliary_gradient(
            working_logits, profile["aux_loss_coeff"], damping_passes=2
        )
    else:
        balanced_logits = rebalance_logits_with_auxiliary_gradient(
            req.raw_logits, profile["aux_loss_coeff"], damping_passes=12
        )

    probs = softmax_probabilities(balanced_logits)

    # Compute capacity ceiling per expert: C_k = ceil((T / E) * capacity_factor)
    ideal_per_expert = float(effective_tokens) / float(num_experts)
    capacity_ceiling = int(math.ceil(ideal_per_expert * req.capacity_factor))

    # Allocate tokens and reroute overflow via non-blocking All-to-All secondary expert pass
    raw_allocations = [int(round(p * effective_tokens)) for p in probs]
    allocation_diff = effective_tokens - sum(raw_allocations)
    if raw_allocations:
        raw_allocations[0] += allocation_diff

    final_allocations = [0] * num_experts
    overflow_pool = 0
    for i, count in enumerate(raw_allocations):
        if count > capacity_ceiling:
            final_allocations[i] = capacity_ceiling
            overflow_pool += count - capacity_ceiling
        else:
            final_allocations[i] = count

    # Distribute overflow_pool across under-capacity experts (zero token drop guarantee)
    if overflow_pool > 0:
        for i in range(num_experts):
            headroom = max(0, capacity_ceiling - final_allocations[i])
            if headroom > 0 and overflow_pool > 0:
                transfer = min(headroom, overflow_pool)
                final_allocations[i] += transfer
                overflow_pool -= transfer

    dropped_tokens = max(0, overflow_pool)
    routing_fractions = [
        float(c) / float(max(1, effective_tokens)) for c in final_allocations
    ]
    aux_loss = compute_auxiliary_load_balance_loss(routing_fractions, probs)

    target_pct = 100.0 / float(num_experts)
    load_percentages = [round(f * 100.0, 2) for f in routing_fractions]
    load_variance = round(
        sum((pct - target_pct) ** 2 for pct in load_percentages) / float(num_experts),
        5,
    )

    # Non-blocking All-to-All overlap efficiency calculation
    imbalance_penalty = min(0.18, load_variance * 0.008)
    overlap_efficiency = round((profile["overlap_ratio"] - imbalance_penalty) * 100.0, 2)

    burst_multiplier = 1.085 if req.burst_active else 1.0
    congestion_factor = 0.91 if req.congestion_spike else 1.0
    routing_throughput = round(
        profile["base_bandwidth_gbps"] * burst_multiplier * congestion_factor, 1
    )

    dispatch_latency_us = round(
        profile["base_latency_us"] * (1.4 if req.congestion_spike else 1.0),
        3,
    )

    experts: List[ExpertNodeState] = []
    for idx in range(num_experts):
        ptr_val = 0x5000 + (idx * 0x0010)
        pct = load_percentages[idx]
        deviation = abs(pct - target_pct)
        if req.congestion_spike and deviation > 2.2:
            status: Literal[
                "BALANCED · LOCKED", "REBALANCING · ACTIVE", "CONGESTION · FAULT"
            ] = "CONGESTION · FAULT"
            sync_pct = round(max(88.0, 100.0 - deviation * 1.4), 1)
        elif deviation > 0.6:
            status = "REBALANCING · ACTIVE"
            sync_pct = round(max(96.0, 100.0 - deviation * 0.5), 1)
        else:
            status = "BALANCED · LOCKED"
            sync_pct = 100.0

        expert_latency_ms = round(0.02 + (deviation * 0.003), 3)
        affinity_w = round(3.30 + probs[idx] * 0.32 + (idx % 3) * 0.01, 2)

        experts.append(
            ExpertNodeState(
                expert_id=idx,
                label="Expert " + str(idx) + " (E" + str(idx) + ")",
                ptr_hex="0x" + format(ptr_val, "04X"),
                routed_tokens=final_allocations[idx],
                load_percentage=pct,
                latency_ms=expert_latency_ms,
                affinity_weight=affinity_w,
                sync_percentage=sync_pct,
                status=status,
            )
        )

    affinity_vector = [e.affinity_weight for e in experts[:4]]
    moe_state = (
        "Congestion Re-Balancing"
        if req.congestion_spike
        else ("Hyper-Burst Saturated" if req.burst_active else "Balanced Active")
    )

    return DispatchTelemetryResponse(
        project_title="GF-T3-271",
        corridor=req.corridor,
        routing_throughput_gbps=routing_throughput,
        dispatch_latency_us=dispatch_latency_us,
        active_experts=num_experts,
        total_experts=num_experts,
        processed_tokens=effective_tokens * 3,
        dropped_tokens=dropped_tokens,
        auxiliary_loss=aux_loss,
        load_variance=load_variance,
        all_to_all_efficiency_pct=overlap_efficiency,
        moe_state=moe_state,
        affinity_vector=affinity_vector,
        experts=experts,
    )


@app.get("/health")
def health_check() -> Dict[str, str]:
    return {
        "project_title": "GF-T3-271",
        "status": "LOCKED",
        "engine_mode": "EXPERT_PARALLEL",
    }


@app.post("/api/v1/dispatch", response_model=DispatchTelemetryResponse)
def post_dispatch(request: DispatchRequest) -> DispatchTelemetryResponse:
    return execute_asynchronous_expert_dispatch(request)
