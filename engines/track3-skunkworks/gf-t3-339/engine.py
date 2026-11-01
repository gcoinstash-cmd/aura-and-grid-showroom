"""
GF-T3-339: Ultra-Wide Dynamic Asynchronous Expert Parallelism & MoE Token Routing Engine
Clean-Room MIT Permissive Implementation — Zero Copyleft, Zero Proprietary Marks.
"""

from typing import Dict, List, Optional
import math
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(
    title="GF-T3-339",
    description="Ultra-Wide Dynamic Asynchronous Expert Parallelism & MoE Token Routing Interlock Engine",
    version="3.3.9",
)

SYNTHETIC_CORRIDORS: List[str] = [
    "MOE-CORRIDOR-ALPHA (DYNAMIC-EXPERT-DISPATCH-FABRIC · 126800-GB/S)",
    "MOE-CORRIDOR-BRAVO (EXPERT-PARALLELISM-ENGINE)",
    "MOE-CORRIDOR-GAMMA (NON-BLOCKING-ALL-TO-ALL-ROUTER)",
    "MOE-CORRIDOR-DELTA (FALLBACK-DENSE-FORWARD-PASS)",
]


class ExpertNodeState(BaseModel):
    expert_id: int = Field(..., ge=0, le=7)
    label: str
    hex_ptr: str
    tokens_k: int = Field(..., ge=0)
    load_pct: int = Field(..., ge=0, le=100)
    sync_pct: int = Field(..., ge=0, le=100)
    latency_ms: float = Field(..., ge=0.0)
    status: str
    gate_weight: float


class MoERoutingRequest(BaseModel):
    token_embeddings: List[List[float]] = Field(
        ..., min_length=1, description="Incoming batch of token activation vectors"
    )
    gate_matrix: List[List[float]] = Field(
        ..., min_length=1, description="Expert routing projection matrix [dim x num_experts]"
    )
    top_k: int = Field(default=2, ge=1, le=8)
    capacity_factor: float = Field(default=1.25, ge=0.5, le=4.0)
    corridor: str = Field(default=SYNTHETIC_CORRIDORS[0])
    overload_spike: bool = Field(default=False)


class MoERoutingResponse(BaseModel):
    project_id: str
    corridor: str
    routing_throughput_gbs: int
    dispatch_latency_us: float
    active_experts: int
    total_experts: int
    processed_tokens_units: int
    moe_state: str
    top_k: int
    barrier_sync_us: float
    load_balance_cv: float
    routed_expert_indices: List[List[int]]
    routed_expert_gates: List[List[float]]
    expert_bay: List[ExpertNodeState]
    vector_signature: List[float]


def softmax_stable(logits: List[float]) -> List[float]:
    if not logits:
        return []
    max_val = max(logits)
    exps = [math.exp(x - max_val) for x in logits]
    total = sum(exps)
    if total <= 0.0:
        return [1.0 / len(logits) for _ in logits]
    return [val / total for val in exps]


def compute_top_k_gating(
    token_vec: List[float],
    gate_matrix: List[List[float]],
    top_k: int,
) -> tuple[List[int], List[float], List[float]]:
    """
    Deterministic Top-K Mixture-of-Experts gating solver:
    M_moe = sum_{e=0}^{E-1} G(X_token, W_gate, sigma_top_k)
    """
    num_experts = len(gate_matrix[0]) if gate_matrix and gate_matrix[0] else 8
    dim = len(token_vec)
    logits: List[float] = []
    for e_idx in range(num_experts):
        acc = 0.0
        for d_idx in range(min(dim, len(gate_matrix))):
            acc += token_vec[d_idx] * gate_matrix[d_idx][e_idx]
        logits.append(acc)

    probs = softmax_stable(logits)
    indexed = sorted(enumerate(probs), key=lambda item: item[1], reverse=True)
    k_clamped = max(1, min(top_k, num_experts))
    selected = indexed[:k_clamped]
    norm_denom = sum(weight for _, weight in selected)
    if norm_denom <= 0.0:
        norm_weights = [1.0 / k_clamped for _ in selected]
    else:
        norm_weights = [round(weight / norm_denom, 6) for _, weight in selected]
    selected_indices = [idx for idx, _ in selected]

    dense_dispatch = [0.0 for _ in range(num_experts)]
    for idx, weight in zip(selected_indices, norm_weights):
        dense_dispatch[idx] = weight

    return selected_indices, norm_weights, dense_dispatch


def simulate_all_to_all_dispatch(
    token_embeddings: List[List[float]],
    gate_matrix: List[List[float]],
    top_k: int = 2,
    capacity_factor: float = 1.25,
    corridor: str = SYNTHETIC_CORRIDORS[0],
    overload_spike: bool = False,
) -> MoERoutingResponse:
    if corridor not in SYNTHETIC_CORRIDORS:
        raise ValueError("Invalid synthetic MoE corridor identifier")

    num_experts = 8
    routed_indices: List[List[int]] = []
    routed_gates: List[List[float]] = []
    expert_counts = [0 for _ in range(num_experts)]
    expert_gate_sums = [0.0 for _ in range(num_experts)]

    for token_vec in token_embeddings:
        indices, weights, _ = compute_top_k_gating(token_vec, gate_matrix, top_k)
        routed_indices.append(indices)
        routed_gates.append(weights)
        for idx, weight in zip(indices, weights):
            if 0 <= idx < num_experts:
                expert_counts[idx] += 1
                expert_gate_sums[idx] += weight

    num_tokens = max(1, len(token_embeddings))
    max_capacity = max(1, math.ceil((num_tokens * top_k / num_experts) * capacity_factor))

    # Deterministic load balancing redistribution under capacity throttling
    if overload_spike:
        for e_idx in range(num_experts):
            if expert_counts[e_idx] > max_capacity:
                overflow = expert_counts[e_idx] - max_capacity
                expert_counts[e_idx] = max_capacity
                target_expert = (e_idx + 1) % num_experts
                expert_counts[target_expert] = min(
                    max_capacity, expert_counts[target_expert] + overflow
                )

    corridor_multipliers: Dict[str, tuple[int, float]] = {
        SYNTHETIC_CORRIDORS[0]: (126800, 0.01),
        SYNTHETIC_CORRIDORS[1]: (118400, 0.02),
        SYNTHETIC_CORRIDORS[2]: (122600, 0.01),
        SYNTHETIC_CORRIDORS[3]: (94200, 0.04),
    }
    base_tp, base_lat = corridor_multipliers[corridor]
    if overload_spike:
        throughput_gbs = int(base_tp * 0.94)
        dispatch_latency_us = round(base_lat + 0.01, 2)
        moe_state = "THROTTLED_BALANCED"
    else:
        throughput_gbs = base_tp
        dispatch_latency_us = base_lat
        moe_state = "Active"

    expert_bay: List[ExpertNodeState] = []
    for e_idx in range(num_experts):
        hex_ptr = f"0x4E0{e_idx}0"
        load_pct = 92 if (overload_spike and e_idx in (2, 5)) else 100
        sync_pct = 98 if overload_spike else 100
        lat_ms = 0.03 if overload_spike else 0.02
        status_str = "THROTTLED · BALANCED" if (overload_spike and e_idx in (2, 5)) else "ROUTED · LOCKED"
        tokens_k = 240 if (overload_spike and e_idx in (2, 5)) else 256
        avg_gate = round(expert_gate_sums[e_idx] / num_tokens, 4) if expert_counts[e_idx] > 0 else 0.25
        expert_bay.append(
            ExpertNodeState(
                expert_id=e_idx,
                label=f"Expert {e_idx} (E{e_idx})",
                hex_ptr=hex_ptr,
                tokens_k=tokens_k,
                load_pct=load_pct,
                sync_pct=sync_pct,
                latency_ms=lat_ms,
                status=status_str,
                gate_weight=avg_gate,
            )
        )

    mean_load = sum(e.load_pct for e in expert_bay) / num_experts
    variance = sum((e.load_pct - mean_load) ** 2 for e in expert_bay) / num_experts
    cv = round(math.sqrt(variance) / max(1.0, mean_load), 6)

    return MoERoutingResponse(
        project_id="GF-T3-339",
        corridor=corridor,
        routing_throughput_gbs=throughput_gbs,
        dispatch_latency_us=dispatch_latency_us,
        active_experts=num_experts,
        total_experts=num_experts,
        processed_tokens_units=26200000 + (num_tokens * 256000),
        moe_state=moe_state,
        top_k=top_k,
        barrier_sync_us=0.01 if not overload_spike else 0.02,
        load_balance_cv=cv,
        routed_expert_indices=routed_indices,
        routed_expert_gates=routed_gates,
        expert_bay=expert_bay,
        vector_signature=[9.95, 9.98, 9.96, 9.97],
    )


DEFAULT_TOKENS: List[List[float]] = [
    [0.82, 0.14, 0.91, 0.45, 0.67, 0.23, 0.88, 0.51],
    [0.19, 0.95, 0.31, 0.78, 0.12, 0.84, 0.42, 0.69],
    [0.64, 0.37, 0.85, 0.22, 0.93, 0.58, 0.71, 0.16],
    [0.41, 0.73, 0.29, 0.96, 0.54, 0.81, 0.35, 0.92],
]

DEFAULT_GATE_MATRIX: List[List[float]] = [
    [0.9, 0.2, 0.4, 0.1, 0.7, 0.3, 0.8, 0.5],
    [0.3, 0.8, 0.2, 0.9, 0.4, 0.7, 0.1, 0.6],
    [0.7, 0.4, 0.9, 0.3, 0.8, 0.2, 0.6, 0.4],
    [0.2, 0.9, 0.3, 0.8, 0.5, 0.9, 0.4, 0.7],
    [0.8, 0.3, 0.7, 0.2, 0.9, 0.4, 0.7, 0.3],
    [0.4, 0.7, 0.2, 0.9, 0.3, 0.8, 0.5, 0.9],
    [0.9, 0.1, 0.8, 0.4, 0.6, 0.3, 0.9, 0.2],
    [0.5, 0.6, 0.4, 0.7, 0.2, 0.8, 0.3, 0.9],
]


@app.get("/health")
def health_check() -> Dict[str, str]:
    return {
        "project": "GF-T3-339",
        "status": "LOCKED",
        "moe_state": "Active",
        "routing_throughput": "126,800 GB/s",
        "dispatch_latency": "0.01 µs",
    }


@app.get("/api/v1/moe/telemetry", response_model=MoERoutingResponse)
def get_default_telemetry(
    corridor: Optional[str] = None,
    overload_spike: bool = False,
) -> MoERoutingResponse:
    selected_corridor = corridor if corridor in SYNTHETIC_CORRIDORS else SYNTHETIC_CORRIDORS[0]
    return simulate_all_to_all_dispatch(
        token_embeddings=DEFAULT_TOKENS,
        gate_matrix=DEFAULT_GATE_MATRIX,
        top_k=2,
        capacity_factor=1.25,
        corridor=selected_corridor,
        overload_spike=overload_spike,
    )


@app.post("/api/v1/moe/route", response_model=MoERoutingResponse)
def execute_moe_routing(payload: MoERoutingRequest) -> MoERoutingResponse:
    try:
        return simulate_all_to_all_dispatch(
            token_embeddings=payload.token_embeddings,
            gate_matrix=payload.gate_matrix,
            top_k=payload.top_k,
            capacity_factor=payload.capacity_factor,
            corridor=payload.corridor,
            overload_spike=payload.overload_spike,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
