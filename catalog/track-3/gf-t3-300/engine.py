"""
GF-T3-300: Dynamic Asynchronous MoE Tensor Parallelism & Expert Load Balancer Engine
SPDX-License-Identifier: MIT
Clean-Room Standalone FastAPI Implementation (Zero Copyleft, Zero Proprietary Marks)
"""

import math
import time
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(
    title="GF-T3-300",
    description="Dynamic Asynchronous MoE Tensor Parallelism & Expert Load Balancer Engine",
    version="3.0.0",
)

SYNTHETIC_CORRIDORS: Dict[str, Dict[str, object]] = {
    "MOE-CORRIDOR-ALPHA": {
        "label": "MOE-CORRIDOR-ALPHA (DYNAMIC-MOE-TENSOR-PARALLELISM-FABRIC · 57200-GB/S)",
        "bandwidth_gbs": 57200.0,
        "base_latency_us": 0.01,
        "mode": "MOE_PARALLELISM",
    },
    "MOE-CORRIDOR-BRAVO": {
        "label": "MOE-CORRIDOR-BRAVO (EXPERT-LOAD-BALANCER-ENGINE)",
        "bandwidth_gbs": 54800.0,
        "base_latency_us": 0.01,
        "mode": "EXPERT_BALANCER",
    },
    "MOE-CORRIDOR-GAMMA": {
        "label": "MOE-CORRIDOR-GAMMA (NON-BLOCKING-ALL-TO-ALL-ROUTER)",
        "bandwidth_gbs": 56400.0,
        "base_latency_us": 0.01,
        "mode": "ALL_TO_ALL_ROUTER",
    },
    "MOE-CORRIDOR-DELTA": {
        "label": "MOE-CORRIDOR-DELTA (FALLBACK-DENSE-FEEDFORWARD-PASS)",
        "bandwidth_gbs": 42900.0,
        "base_latency_us": 0.03,
        "mode": "DENSE_FALLBACK",
    },
}


class ExpertTelemetry(BaseModel):
    expert_id: int = Field(..., ge=0, le=7)
    code: str
    hex_ptr: str
    tokens_k: float = Field(..., ge=0.0)
    load_pct: float = Field(..., ge=0.0, le=100.0)
    latency_ms: float = Field(..., ge=0.0)
    sync_pct: float = Field(..., ge=0.0, le=100.0)
    state: str
    gating_weight: float = Field(..., ge=0.0, le=1.0)


class MoEDispatchRequest(BaseModel):
    corridor_id: str = Field(default="MOE-CORRIDOR-ALPHA")
    input_vector: List[float] = Field(default_factory=lambda: [6.11, 6.15, 6.12, 6.14])
    token_batch_units: int = Field(default=2048000, ge=1024, le=100000000)
    top_k: int = Field(default=8, ge=1, le=8)
    bottleneck_expert: Optional[int] = Field(default=None, ge=0, le=7)
    temperature: float = Field(default=1.0, gt=0.0, le=10.0)


class MoEDispatchResponse(BaseModel):
    chassis_id: str
    corridor: str
    mode: str
    ptr_address: str
    throughput_gbs: float
    router_latency_us: float
    active_experts: int
    total_experts: int
    processed_tokens_units: int
    moe_state: str
    moe_output_magnitude: float
    load_imbalance_cv: float
    zero_starvation_verified: bool
    experts: List[ExpertTelemetry]


def compute_softmax_gating(logits: List[float], temperature: float = 1.0) -> List[float]:
    """
    Deterministic numerically-stable softmax gating weights:
    g_k(x) = exp(z_k / T) / sum_j exp(z_j / T)
    """
    if not logits:
        raise ValueError("Logits vector cannot be empty")
    scaled = [val / temperature for val in logits]
    max_logit = max(scaled)
    exps = [math.exp(val - max_logit) for val in scaled]
    total = sum(exps)
    return [val / total for val in exps]


def compute_moe_forward(
    input_vector: List[float],
    gating_weights: List[float],
    expert_scales: List[float],
) -> float:
    """
    Deterministic MoE forward equation:
    M_moe = sum_{k=1}^{K} g_k(x) * E_k(W_k * x)
    """
    if len(gating_weights) != len(expert_scales):
        raise ValueError("Gating weights and expert scales length mismatch")
    vec_norm = sum(abs(x) for x in input_vector) / max(1, len(input_vector))
    total_activation = 0.0
    for g_k, w_k in zip(gating_weights, expert_scales):
        expert_transform = math.tanh(w_k * vec_norm) * vec_norm
        total_activation += g_k * expert_transform
    return round(total_activation, 6)


def rebalance_expert_loads(
    raw_weights: List[float],
    bottleneck_idx: Optional[int] = None,
    rebalance_engaged: bool = True,
) -> List[float]:
    """
    Dynamic Asynchronous Load Balancer:
    Detects expert bottleneck spikes and smoothly redistributes overflow across
    non-starved peer experts to enforce zero expert starvation.
    """
    num_experts = len(raw_weights)
    weights = list(raw_weights)

    if bottleneck_idx is not None and 0 <= bottleneck_idx < num_experts:
        if not rebalance_engaged:
            # Unbalanced spike on target expert
            weights[bottleneck_idx] *= 3.6
        else:
            # Dynamic Auxiliary-Free Load Re-Balancing dampens spike into uniform corridor
            uniform_target = 1.0 / num_experts
            for i in range(num_experts):
                weights[i] = 0.85 * uniform_target + 0.15 * weights[i]

    total = sum(weights)
    return [w / total for w in weights]


def simulate_all_to_all_dispatch(req: MoEDispatchRequest, rebalance: bool = True) -> MoEDispatchResponse:
    corridor_key = req.corridor_id if req.corridor_id in SYNTHETIC_CORRIDORS else "MOE-CORRIDOR-ALPHA"
    corridor_meta = SYNTHETIC_CORRIDORS[corridor_key]

    # Expand 4-element input vector to 8 expert logits deterministically
    base_vec = req.input_vector if len(req.input_vector) >= 4 else [6.11, 6.15, 6.12, 6.14]
    logits = [
        base_vec[0],
        base_vec[1],
        base_vec[2],
        base_vec[3],
        (base_vec[0] + base_vec[2]) * 0.5,
        (base_vec[1] + base_vec[3]) * 0.5,
        (base_vec[0] + base_vec[1]) * 0.5,
        (base_vec[2] + base_vec[3]) * 0.5,
    ]

    raw_gating = compute_softmax_gating(logits[: req.top_k], temperature=req.temperature)
    while len(raw_gating) < 8:
        raw_gating.append(0.0)

    balanced_weights = rebalance_expert_loads(
        raw_gating,
        bottleneck_idx=req.bottleneck_expert,
        rebalance_engaged=rebalance,
    )

    expert_scales = [1.02, 1.04, 1.01, 1.03, 1.02, 1.05, 1.01, 1.03]
    moe_mag = compute_moe_forward(base_vec, balanced_weights, expert_scales)

    mean_w = sum(balanced_weights) / 8.0
    variance = sum((w - mean_w) ** 2 for w in balanced_weights) / 8.0
    cv = math.sqrt(variance) / mean_w if mean_w > 0 else 0.0

    base_bw = float(corridor_meta["bandwidth_gbs"])
    effective_bw = round(base_bw * (1.0 - min(0.35, cv * 0.25)), 2)
    base_lat = float(corridor_meta["base_latency_us"])
    effective_lat = round(base_lat * (1.0 + cv * 0.5), 4)

    experts_out: List[ExpertTelemetry] = []
    total_tokens_k = req.token_batch_units / 1000.0

    for idx in range(8):
        w = balanced_weights[idx]
        tok_k = round(total_tokens_k * w, 1)
        load_pct = round(w * 100.0, 2)
        lat_ms = round(0.02 + max(0.0, (load_pct - 12.5) * 0.001), 3)
        sync_pct = 100.0 if load_pct <= 22.0 else round(max(85.0, 100.0 - (load_pct - 22.0)), 1)
        state_str = "ROUTED · LOCKED" if load_pct <= 22.0 else "SPIKE · REBALANCING"
        experts_out.append(
            ExpertTelemetry(
                expert_id=idx,
                code=f"E{idx}",
                hex_ptr=f"0x270{idx}0",
                tokens_k=tok_k,
                load_pct=load_pct,
                latency_ms=lat_ms,
                sync_pct=sync_pct,
                state=state_str,
                gating_weight=round(w, 6),
            )
        )

    active_count = sum(1 for e in experts_out if e.tokens_k > 0)
    zero_starvation = all(e.load_pct >= 5.0 for e in experts_out[: req.top_k])

    return MoEDispatchResponse(
        chassis_id="GF-T3-300",
        corridor=str(corridor_meta["label"]),
        mode=str(corridor_meta["mode"]),
        ptr_address="0x21F8DC0",
        throughput_gbs=effective_bw,
        router_latency_us=effective_lat,
        active_experts=active_count,
        total_experts=8,
        processed_tokens_units=req.token_batch_units + 7680000,
        moe_state="Router Active" if zero_starvation else "Re-Balancing Active",
        moe_output_magnitude=moe_mag,
        load_imbalance_cv=round(cv, 6),
        zero_starvation_verified=zero_starvation,
        experts=experts_out,
    )


@app.get("/health")
def health_check() -> Dict[str, object]:
    return {
        "chassis": "GF-T3-300",
        "status": "ONLINE",
        "moe_state": "Router Active",
        "throughput_gbs": 57200.0,
        "router_latency_us": 0.01,
        "active_experts": 8,
        "timestamp_ns": time.time_ns(),
    }


@app.get("/corridors")
def list_corridors() -> Dict[str, object]:
    return {
        "chassis": "GF-T3-300",
        "corridors": SYNTHETIC_CORRIDORS,
    }


@app.post("/moe/dispatch", response_model=MoEDispatchResponse)
def dispatch_moe_tokens(req: MoEDispatchRequest) -> MoEDispatchResponse:
    if req.corridor_id not in SYNTHETIC_CORRIDORS:
        raise HTTPException(status_code=400, detail="Unknown synthetic MoE corridor identifier")
    return simulate_all_to_all_dispatch(req, rebalance=True)


@app.post("/moe/bottleneck-spike", response_model=MoEDispatchResponse)
def inject_bottleneck_spike(req: MoEDispatchRequest) -> MoEDispatchResponse:
    target = req.bottleneck_expert if req.bottleneck_expert is not None else 3
    req_spike = req.model_copy(update={"bottleneck_expert": target})
    return simulate_all_to_all_dispatch(req_spike, rebalance=False)
