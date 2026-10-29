"""
GF-T3-281: Dynamic Speculative Draft-Target Verification & Multi-Token Parallel Acceptance
Clean-Room Standalone FastAPI Backend Engine
License: MIT
"""

from __future__ import annotations
import math
from typing import Dict, List, Literal
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

app = FastAPI(
    title="GF-T3-281",
    description="Dynamic Speculative Draft-Target Verification & Multi-Token Parallel Acceptance Engine",
    version="3.281.0",
)

CORRIDOR_REGISTRY: Dict[str, Dict[str, object]] = {
    "ACCEL-CORRIDOR-ALPHA": {
        "designation": "ACCEL-CORRIDOR-ALPHA (DYNAMIC-SPECULATIVE-DRAFT-TARGET-VERIFICATION-FABRIC · 39200-GB/S)",
        "base_bandwidth_gbs": 39200.0,
        "base_latency_us": 0.01,
        "draft_depth_k": 5,
        "parallel_multiplier": 5.0,
    },
    "ACCEL-CORRIDOR-BRAVO": {
        "designation": "ACCEL-CORRIDOR-BRAVO (MULTI-TOKEN-PARALLEL-ACCEPTANCE-ENGINE)",
        "base_bandwidth_gbs": 36400.0,
        "base_latency_us": 0.015,
        "draft_depth_k": 4,
        "parallel_multiplier": 4.2,
    },
    "ACCEL-CORRIDOR-GAMMA": {
        "designation": "ACCEL-CORRIDOR-GAMMA (BATCHED-VERIFICATION-TREE-ROUTER)",
        "base_bandwidth_gbs": 32800.0,
        "base_latency_us": 0.02,
        "draft_depth_k": 4,
        "parallel_multiplier": 3.8,
    },
    "ACCEL-CORRIDOR-DELTA": {
        "designation": "ACCEL-CORRIDOR-DELTA (FALLBACK-SINGLE-TOKEN-AUTOREGRESSIVE-PASS)",
        "base_bandwidth_gbs": 14200.0,
        "base_latency_us": 0.045,
        "draft_depth_k": 1,
        "parallel_multiplier": 1.0,
    },
}


class TokenCandidateDistribution(BaseModel):
    token_index: int = Field(..., ge=1, le=32)
    target_prob_p: float = Field(..., gt=0.0, le=1.0)
    draft_prob_q: float = Field(..., gt=0.0, le=1.0)


class ParallelAcceptanceRequest(BaseModel):
    corridor_code: Literal[
        "ACCEL-CORRIDOR-ALPHA",
        "ACCEL-CORRIDOR-BRAVO",
        "ACCEL-CORRIDOR-GAMMA",
        "ACCEL-CORRIDOR-DELTA",
    ] = "ACCEL-CORRIDOR-ALPHA"
    stream_index: int = Field(default=0, ge=0, le=7)
    candidates: List[TokenCandidateDistribution] = Field(..., min_length=1, max_length=16)
    ring_sync_active: bool = True

    @field_validator("candidates")
    @classmethod
    def validate_sequential_indices(cls, candidates: List[TokenCandidateDistribution]) -> List[TokenCandidateDistribution]:
        for idx, item in enumerate(candidates, start=1):
            if item.token_index != idx:
                raise ValueError("Candidate token_index must be strictly sequential starting at 1")
        return candidates


class ParallelAcceptanceResponse(BaseModel):
    project_id: str
    corridor_designation: str
    stream_label: str
    pointer_hex: str
    a_multi_score: float
    step_velocity_multiplier: float
    acceptance_rate_pct: float
    throughput_gbs: float
    verification_latency_us: float
    ring_sync_pct: float
    kl_divergence_nats: float
    acceptance_state: str


def compute_multi_token_acceptance(
    target_probs: List[float],
    draft_probs: List[float],
) -> Dict[str, float]:
    """
    Computes Multi-Token Parallel Acceptance:
    A_multi = sum_{k=1}^{K} min(1.0, P(x_k | x_<k) / Q(x_k | x_<k))
    along with cumulative sequential survival probability and KL divergence.
    """
    if len(target_probs) != len(draft_probs) or len(target_probs) == 0:
        raise ValueError("Target and draft probability vectors must have equal non-zero length")

    step_acceptances: List[float] = []
    kl_sum = 0.0

    for p_val, q_val in zip(target_probs, draft_probs):
        if p_val <= 0.0 or q_val <= 0.0 or p_val > 1.0 or q_val > 1.0:
            raise ValueError("Probabilities P and Q must lie in (0.0, 1.0]")
        ratio = p_val / q_val
        alpha_k = min(1.0, ratio)
        step_acceptances.append(alpha_k)
        kl_sum += p_val * math.log(p_val / q_val)

    a_multi = sum(step_acceptances)
    k_len = len(step_acceptances)
    mean_acceptance_pct = round((a_multi / float(k_len)) * 100.0, 2)
    velocity_multiplier = round(1.0 + a_multi, 4)

    return {
        "a_multi": round(a_multi, 4),
        "mean_acceptance_pct": mean_acceptance_pct,
        "velocity_multiplier": min(5.0, velocity_multiplier),
        "kl_divergence_nats": round(abs(kl_sum), 5),
    }


def compute_ring_sync_telemetry(
    corridor_code: str,
    mean_acceptance_pct: float,
    ring_sync_active: bool,
) -> Dict[str, float]:
    """
    Calculates Asynchronous Verification Ring Synchronization & Sub-Microsecond Buffer Rotation
    metrics across 8 hardware streams (X0..X7).
    """
    if corridor_code not in CORRIDOR_REGISTRY:
        raise ValueError("Unknown synthetic corridor code")

    corridor = CORRIDOR_REGISTRY[corridor_code]
    base_bw = float(corridor["base_bandwidth_gbs"])
    base_lat = float(corridor["base_latency_us"])

    sync_efficiency = 1.0 if ring_sync_active else 0.72
    acceptance_factor = max(0.25, mean_acceptance_pct / 96.5)
    effective_bw = round(min(39200.0, base_bw * min(1.0, acceptance_factor) * sync_efficiency), 2)
    effective_lat = round(base_lat / (sync_efficiency * max(0.5, min(1.0, acceptance_factor))), 4)
    ring_sync_pct = 100.0 if ring_sync_active else 72.0

    return {
        "throughput_gbs": effective_bw,
        "verification_latency_us": effective_lat,
        "ring_sync_pct": ring_sync_pct,
    }


@app.get("/health")
def health_check() -> Dict[str, object]:
    return {
        "project": "GF-T3-281",
        "status": "VERIFICATION_ACTIVE",
        "active_streams": 8,
        "throughput_saturation_gbs": 39200.0,
        "verification_latency_us": 0.01,
    }


@app.post("/api/v1/verify-batch", response_model=ParallelAcceptanceResponse)
def verify_speculative_batch(payload: ParallelAcceptanceRequest) -> ParallelAcceptanceResponse:
    try:
        p_vec = [c.target_prob_p for c in payload.candidates]
        q_vec = [c.draft_prob_q for c in payload.candidates]
        acceptance_metrics = compute_multi_token_acceptance(p_vec, q_vec)
        ring_metrics = compute_ring_sync_telemetry(
            payload.corridor_code,
            acceptance_metrics["mean_acceptance_pct"],
            payload.ring_sync_active,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    corridor = CORRIDOR_REGISTRY[payload.corridor_code]
    pointer_val = 0xF000 + (payload.stream_index * 0x0010)
    pointer_hex = "0x" + format(pointer_val, "04X")
    state_str = (
        "VERIFIED · LOCKED"
        if acceptance_metrics["mean_acceptance_pct"] >= 80.0
        else "DIVERGENCE · RE-EVAL"
    )

    return ParallelAcceptanceResponse(
        project_id="GF-T3-281",
        corridor_designation=str(corridor["designation"]),
        stream_label="Stream " + str(payload.stream_index) + " (X" + str(payload.stream_index) + ")",
        pointer_hex=pointer_hex,
        a_multi_score=acceptance_metrics["a_multi"],
        step_velocity_multiplier=acceptance_metrics["velocity_multiplier"],
        acceptance_rate_pct=acceptance_metrics["mean_acceptance_pct"],
        throughput_gbs=ring_metrics["throughput_gbs"],
        verification_latency_us=ring_metrics["verification_latency_us"],
        ring_sync_pct=ring_metrics["ring_sync_pct"],
        kl_divergence_nats=acceptance_metrics["kl_divergence_nats"],
        acceptance_state=state_str,
    )
