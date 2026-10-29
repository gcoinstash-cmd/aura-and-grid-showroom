"""
GF-T3-293: Dynamic Speculative Decoding and Verification Tree Concurrency Engine
Clean-Room MIT Standalone FastAPI Backend
Zero-Dollar Gate Enforced: Pure dimensionless telemetry, GB/s, microseconds, trees, and tokens.
"""

from typing import List, Dict, Optional
import math
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(
    title="GF-T3-293",
    description="Dynamic Speculative Decoding and Verification Tree Concurrency Engine",
    version="3.293.0",
)

CORRIDORS: Dict[str, Dict[str, object]] = {
    "SPEC-CORRIDOR-ALPHA": {
        "label": "SPEC-CORRIDOR-ALPHA (DYNAMIC-SPECULATIVE-DECODING-FABRIC · 48000-GB/S)",
        "bandwidth_gbs": 48000.0,
        "draft_latency_us": 0.01,
        "base_acceptance": 0.948,
        "mode": "SPECULATIVE_TREE",
    },
    "SPEC-CORRIDOR-BRAVO": {
        "label": "SPEC-CORRIDOR-BRAVO (VERIFICATION-TREE-CONCURRENCY-ENGINE)",
        "bandwidth_gbs": 44200.0,
        "draft_latency_us": 0.02,
        "base_acceptance": 0.925,
        "mode": "CONCURRENT_BRANCH_VERIFY",
    },
    "SPEC-CORRIDOR-GAMMA": {
        "label": "SPEC-CORRIDOR-GAMMA (ASYNC-DRAFT-ACCEPTANCE-ROUTER)",
        "bandwidth_gbs": 39800.0,
        "draft_latency_us": 0.03,
        "base_acceptance": 0.894,
        "mode": "ASYNC_ROUTER",
    },
    "SPEC-CORRIDOR-DELTA": {
        "label": "SPEC-CORRIDOR-DELTA (FALLBACK-AUTOREGRESSIVE-SERIAL-PASS)",
        "bandwidth_gbs": 16000.0,
        "draft_latency_us": 0.08,
        "base_acceptance": 1.000,
        "mode": "SERIAL_FALLBACK",
    },
}


class TokenCandidate(BaseModel):
    token_id: int = Field(..., ge=0)
    target_prob: float = Field(..., gt=0.0, le=1.0)
    draft_prob: float = Field(..., gt=0.0, le=1.0)


class TreeVerificationRequest(BaseModel):
    tree_id: str = Field(..., min_length=2, max_length=16)
    corridor_id: str = Field(default="SPEC-CORRIDOR-ALPHA")
    candidates: List[TokenCandidate] = Field(..., min_length=1, max_length=64)
    barrier_sync_us: float = Field(default=0.01, gt=0.0, le=10.0)


class TreeVerificationResponse(BaseModel):
    tree_id: str
    corridor_id: str
    tree_acceptance_probability: float
    accepted_prefix_length: int
    pruned_candidates_count: int
    speedup_factor: float
    effective_throughput_gbs: float
    speculative_state: str


def compute_tree_acceptance_probability(candidates: List[TokenCandidate]) -> float:
    """
    Computes multi-token speculative tree acceptance probability:
    A_tree = prod_{i=1..k} min(1.0, P_target(x_i | x_<i) / P_draft(x_i | x_<i))
    """
    if not candidates:
        return 0.0
    product = 1.0
    for candidate in candidates:
        ratio = candidate.target_prob / candidate.draft_prob
        step_accept = min(1.0, ratio)
        product *= step_accept
    return round(max(0.0, min(1.0, product)), 6)


def prune_candidate_subtree(
    candidates: List[TokenCandidate], threshold: float = 0.70
) -> Dict[str, int]:
    """
    Deterministically trims rejected candidate sub-trees on the first step where
    min(1.0, P_target / P_draft) falls below threshold.
    """
    accepted = 0
    for candidate in candidates:
        step_accept = min(1.0, candidate.target_prob / candidate.draft_prob)
        if step_accept >= threshold:
            accepted += 1
        else:
            break
    pruned = len(candidates) - accepted
    return {"accepted_prefix_length": accepted, "pruned_candidates_count": pruned}


def compute_speedup_and_throughput(
    accepted_count: int,
    total_candidates: int,
    base_bandwidth_gbs: float,
    barrier_sync_us: float,
) -> Dict[str, float]:
    """
    Computes theoretical speculative speedup factor (1 + accepted_count * efficiency)
    bounded to realistic 1.0x - 4.2x single-pass concurrency envelope.
    """
    if total_candidates <= 0:
        return {"speedup_factor": 1.0, "effective_throughput_gbs": base_bandwidth_gbs}
    acceptance_ratio = accepted_count / float(total_candidates)
    sync_penalty = max(0.85, 1.0 - (barrier_sync_us * 0.02))
    raw_speedup = (1.0 + 3.0 * acceptance_ratio) * sync_penalty
    speedup = round(max(1.0, min(4.2, raw_speedup)), 3)
    effective_bw = round(base_bandwidth_gbs * (speedup / 3.844), 2)
    return {
        "speedup_factor": speedup,
        "effective_throughput_gbs": effective_bw,
    }


@app.get("/health")
def get_health() -> Dict[str, object]:
    return {
        "engine": "GF-T3-293",
        "speculative_state": "Verification Active",
        "active_trees": 8,
        "verification_throughput_gbs": 48000.0,
        "draft_latency_us": 0.01,
        "processed_tokens_units": 8832000,
    }


@app.get("/corridors")
def list_corridors() -> Dict[str, object]:
    return {"corridors": CORRIDORS}


@app.post("/verify-tree", response_model=TreeVerificationResponse)
def verify_tree_endpoint(payload: TreeVerificationRequest) -> TreeVerificationResponse:
    if payload.corridor_id not in CORRIDORS:
        raise HTTPException(status_code=400, detail="Unknown speculative corridor ID")

    corridor = CORRIDORS[payload.corridor_id]
    base_bw = float(corridor["bandwidth_gbs"])

    acceptance_prob = compute_tree_acceptance_probability(payload.candidates)
    prune_result = prune_candidate_subtree(payload.candidates, threshold=0.70)
    accepted_len = prune_result["accepted_prefix_length"]
    pruned_len = prune_result["pruned_candidates_count"]

    perf = compute_speedup_and_throughput(
        accepted_count=accepted_len,
        total_candidates=len(payload.candidates),
        base_bandwidth_gbs=base_bw,
        barrier_sync_us=payload.barrier_sync_us,
    )

    state = "VERIFIED · LOCKED" if pruned_len == 0 else "PRUNED · REBALANCED"

    return TreeVerificationResponse(
        tree_id=payload.tree_id,
        corridor_id=payload.corridor_id,
        tree_acceptance_probability=acceptance_prob,
        accepted_prefix_length=accepted_len,
        pruned_candidates_count=pruned_len,
        speedup_factor=perf["speedup_factor"],
        effective_throughput_gbs=perf["effective_throughput_gbs"],
        speculative_state=state,
    )
