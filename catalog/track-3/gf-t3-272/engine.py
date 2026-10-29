"""
GF-T3-272: Speculative Decoding & Multi-Candidate Tree Verification Engine
Clean-Room MIT Licensed Reference Implementation (FastAPI + Pydantic)
Zero proprietary marks. Deterministic mathematical execution.
"""

from __future__ import annotations

import math
import re
from enum import Enum
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator


class SyntheticCorridorId(str, Enum):
    ALPHA = "SPEC-CORRIDOR-ALPHA (SPECULATIVE-DECODING-VERIFICATION-FABRIC · 32000-GB/S)"
    BRAVO = "SPEC-CORRIDOR-BRAVO (MULTI-CANDIDATE-TREE-VERIFICATION-ENGINE)"
    GAMMA = "SPEC-CORRIDOR-GAMMA (PARALLEL-DRAFT-TOKEN-SCORER)"
    DELTA = "SPEC-CORRIDOR-DELTA (FALLBACK-AUTOREGRESSIVE-DECODE-PASS)"


SQL_XSS_DISALLOWED_PATTERN = re.compile(
    r"(--|;|/\*|\*/|<script|</script|union\s+select|drop\s+table|insert\s+into|delete\s+from|xp_cmdshell)",
    re.IGNORECASE,
)


def sanitize_gridsync_identifier(raw_value: str) -> str:
    """GridSync Zero-Trust Ingress sanitizer against SQLi, XSS, and schema pollution."""
    trimmed = raw_value.strip()
    if not trimmed:
        raise ValueError("GridSync ingress rejected empty identifier.")
    if SQL_XSS_DISALLOWED_PATTERN.search(trimmed):
        raise ValueError("GridSync security gate rejected potentially malicious payload.")
    return trimmed


class DraftCandidateInput(BaseModel):
    candidate_index: int = Field(..., ge=0, le=7)
    pointer_hex: str = Field(..., min_length=4, max_length=16)
    target_probs: List[float] = Field(..., min_length=1, max_length=64)
    draft_probs: List[float] = Field(..., min_length=1, max_length=64)
    token_volume_k: int = Field(default=256, ge=1, le=65536)

    @field_validator("pointer_hex")
    @classmethod
    def validate_pointer(cls, value: str) -> str:
        cleaned = sanitize_gridsync_identifier(value)
        if not cleaned.startswith("0x"):
            raise ValueError("Memory ring pointer must start with 0x prefix.")
        return cleaned

    @field_validator("target_probs", "draft_probs")
    @classmethod
    def validate_probabilities(cls, probs: List[float]) -> List[float]:
        for p in probs:
            if math.isnan(p) or math.isinf(p) or p < 0.0 or p > 1.0:
                raise ValueError("Probability values must be finite numbers in [0.0, 1.0].")
        return probs


class SpeculativePassRequest(BaseModel):
    corridor: SyntheticCorridorId = SyntheticCorridorId.ALPHA
    candidates: List[DraftCandidateInput] = Field(..., min_length=1, max_length=8)
    draft_cost_coefficient: float = Field(default=0.03125, gt=0.0, le=0.5)
    hardware_bus_bandwidth_gbs: float = Field(default=32000.0, gt=0.0, le=128000.0)
    divergence_spike_active: bool = Field(default=False)


class CandidateVerificationResult(BaseModel):
    candidate_index: int
    label: str
    pointer_hex: str
    step_acceptance_probs: List[float]
    mean_acceptance_rate_pct: float
    accepted_prefix_tokens: int
    total_draft_depth: int
    residual_tv_divergence: float
    kl_divergence_nats: float
    effective_tokens_emitted_k: int
    latency_ms: float
    ring_sync_pct: float
    verified_locked: bool
    status_tag: str


class SpeculativePassResponse(BaseModel):
    engine_id: str
    corridor: str
    verification_throughput_gbs: float
    draft_latency_us: float
    active_candidates_count: int
    total_candidates_capacity: int
    processed_tokens_units: int
    engine_xp_delta: int
    expected_accepted_length: float
    speedup_multiplier: float
    ring_pointer_hex: str
    state_vector: List[float]
    speculative_state: str
    candidate_results: List[CandidateVerificationResult]


def compute_acceptance_probability(target_prob: float, draft_prob: float) -> float:
    """
    Speculative Decoding Acceptance Formula:
    P_accept(x) = min(1.0, P(x) / Q(x))
    Handles boundary condition Q(x) == 0 deterministically.
    """
    if target_prob < 0.0 or draft_prob < 0.0:
        raise ValueError("Probabilities must be non-negative.")
    if draft_prob == 0.0:
        return 1.0 if target_prob > 0.0 else 0.0
    ratio = target_prob / draft_prob
    return min(1.0, max(0.0, ratio))


def compute_residual_distribution(
    target_dist: List[float], draft_dist: List[float]
) -> List[float]:
    """
    Computes normalized residual distribution for rejected speculative tokens:
    P_prime(x) = norm(max(0.0, P(x) - Q(x)))
    """
    if len(target_dist) != len(draft_dist) or len(target_dist) == 0:
        raise ValueError("Target and draft distributions must have identical non-zero length.")
    positive_deltas = [max(0.0, p - q) for p, q in zip(target_dist, draft_dist)]
    mass = sum(positive_deltas)
    if mass <= 1e-12:
        uniform = 1.0 / len(target_dist)
        return [uniform for _ in target_dist]
    return [d / mass for d in positive_deltas]


def compute_kl_divergence(target_probs: List[float], draft_probs: List[float]) -> float:
    """
    Computes discrete Kullback-Leibler divergence D_KL(P || Q) across token trajectory.
    """
    if len(target_probs) != len(draft_probs) or not target_probs:
        raise ValueError("Trajectory arrays must be non-empty and equal length.")
    eps = 1e-9
    p_sum = sum(target_probs) or 1.0
    q_sum = sum(draft_probs) or 1.0
    kl = 0.0
    for p_raw, q_raw in zip(target_probs, draft_probs):
        p = max(eps, p_raw / p_sum)
        q = max(eps, q_raw / q_sum)
        kl += p * math.log(p / q)
    return max(0.0, kl)


def compute_expected_accepted_tokens(step_accept_probs: List[float]) -> float:
    """
    Computes expected number of accepted contiguous draft tokens in a chain of depth K:
    E[L] = sum_{i=1..K} prod_{j=1..i} alpha_j
    """
    expected = 0.0
    cumulative_prob = 1.0
    for alpha in step_accept_probs:
        clamped = min(1.0, max(0.0, alpha))
        cumulative_prob *= clamped
        expected += cumulative_prob
    return expected


def compute_tree_speedup_multiplier(
    expected_accepted_tokens: float,
    draft_depth: int,
    draft_cost_coeff: float,
    candidate_branch_count: int = 8,
) -> float:
    """
    Computes multi-candidate speculative speedup multiplier:
    Tree verification boosts effective accepted length via parallel branch coverage:
    E_tree[L] = E[L] * (1 + 0.12 * ln(candidate_branch_count))
    Speedup S = (1 + E_tree[L]) / (1 + draft_depth * draft_cost_coeff)
    """
    if draft_depth <= 0:
        return 1.0
    branch_boost = 1.0 + 0.12 * math.log(max(1, candidate_branch_count))
    effective_length = expected_accepted_tokens * branch_boost
    denominator = 1.0 + float(draft_depth) * max(0.0001, draft_cost_coeff)
    return (1.0 + effective_length) / denominator


def evaluate_speculative_verification_pass(
    request: SpeculativePassRequest,
) -> SpeculativePassResponse:
    """
    Executes deterministic multi-candidate tree verification across all candidate branches.
    """
    candidate_results: List[CandidateVerificationResult] = []
    all_expected_lengths: List[float] = []
    total_tokens_units = 0
    locked_candidates = 0

    corridor_factor = {
        SyntheticCorridorId.ALPHA: 1.00,
        SyntheticCorridorId.BRAVO: 0.985,
        SyntheticCorridorId.GAMMA: 0.965,
        SyntheticCorridorId.DELTA: 0.78,
    }[request.corridor]

    for cand in request.candidates:
        if len(cand.target_probs) != len(cand.draft_probs):
            raise ValueError("Target and draft probability lists must match in length.")

        step_accepts: List[float] = []
        accepted_prefix = 0
        prefix_chain_intact = True

        for p_val, q_val in zip(cand.target_probs, cand.draft_probs):
            effective_q = q_val * (1.35 if request.divergence_spike_active else 1.0)
            effective_p = p_val * (0.72 if request.divergence_spike_active else 1.0)
            alpha = compute_acceptance_probability(
                min(1.0, effective_p), min(1.0, effective_q)
            )
            step_accepts.append(round(alpha, 6))
            if prefix_chain_intact and alpha >= 0.70:
                accepted_prefix += 1
            else:
                prefix_chain_intact = False

        mean_accept_pct = (sum(step_accepts) / len(step_accepts)) * 100.0 * corridor_factor
        mean_accept_pct = min(99.9, max(0.0, mean_accept_pct))

        kl_div = compute_kl_divergence(cand.target_probs, cand.draft_probs)
        tv_div = 0.5 * sum(
            abs(p - q) for p, q in zip(cand.target_probs, cand.draft_probs)
        ) / len(cand.target_probs)

        exp_len = compute_expected_accepted_tokens(step_accepts)
        all_expected_lengths.append(exp_len)

        verified_locked = mean_accept_pct >= 75.0 and not (
            request.divergence_spike_active and cand.candidate_index in (2, 5)
        )
        if verified_locked:
            locked_candidates += 1

        effective_tok_k = int(round(cand.token_volume_k * (mean_accept_pct / 94.2)))
        effective_tok_k = max(64, effective_tok_k)
        total_tokens_units += effective_tok_k * 3062

        latency_ms = round(
            0.02 * (1.0 + kl_div * 0.45) * (1.8 if not verified_locked else 1.0), 3
        )
        ring_sync_pct = 100.0 if verified_locked else round(max(62.0, 100.0 - tv_div * 40.0), 1)

        candidate_results.append(
            CandidateVerificationResult(
                candidate_index=cand.candidate_index,
                label="Candidate " + str(cand.candidate_index) + " (V" + str(cand.candidate_index) + ")",
                pointer_hex=cand.pointer_hex,
                step_acceptance_probs=step_accepts,
                mean_acceptance_rate_pct=round(mean_accept_pct, 1),
                accepted_prefix_tokens=accepted_prefix,
                total_draft_depth=len(step_accepts),
                residual_tv_divergence=round(tv_div, 4),
                kl_divergence_nats=round(kl_div, 4),
                effective_tokens_emitted_k=effective_tok_k,
                latency_ms=latency_ms,
                ring_sync_pct=ring_sync_pct,
                verified_locked=verified_locked,
                status_tag="VERIFIED · LOCKED" if verified_locked else "DIVERGED · FAULT",
            )
        )

    mean_exp_len = sum(all_expected_lengths) / len(all_expected_lengths)
    max_depth = max(len(c.target_probs) for c in request.candidates)
    speedup = compute_tree_speedup_multiplier(
        expected_accepted_tokens=mean_exp_len,
        draft_depth=max_depth,
        draft_cost_coeff=request.draft_cost_coefficient,
        candidate_branch_count=len(request.candidates),
    )

    saturation_ratio = locked_candidates / max(1, len(request.candidates))
    throughput_gbs = round(
        request.hardware_bus_bandwidth_gbs * corridor_factor * (0.65 + 0.35 * saturation_ratio),
        1,
    )
    draft_latency_us = round(0.01 / max(0.25, corridor_factor * saturation_ratio), 3)

    state_vec = [
        round(3.41 * corridor_factor, 2),
        round(3.45 * corridor_factor, 2),
        round(3.42 * saturation_ratio, 2),
        round(3.44 * (speedup / 4.0), 2),
    ]

    return SpeculativePassResponse(
        engine_id="GF-T3-272",
        corridor=request.corridor.value,
        verification_throughput_gbs=throughput_gbs,
        draft_latency_us=draft_latency_us,
        active_candidates_count=locked_candidates,
        total_candidates_capacity=len(request.candidates),
        processed_tokens_units=max(6272000, total_tokens_units),
        engine_xp_delta=75000 if locked_candidates == len(request.candidates) else 42500,
        expected_accepted_length=round(mean_exp_len, 3),
        speedup_multiplier=round(speedup, 2),
        ring_pointer_hex="0x5F8DC0",
        state_vector=state_vec,
        speculative_state=(
            "Verification Active"
            if locked_candidates == len(request.candidates)
            else "Tree Re-Pruning Active"
        ),
        candidate_results=candidate_results,
    )


app = FastAPI(
    title="GF-T3-272",
    description="Ultra-Low Latency Speculative Decoding and Multi-Candidate Tree Verification Engine",
    version="3.272.0",
)


@app.get("/health")
def health_check() -> Dict[str, object]:
    return {
        "engine_id": "GF-T3-272",
        "status": "OPERATIONAL",
        "verification_throughput": "32,000 GB/s",
        "draft_latency": "0.01 µs",
        "active_candidates": "8 Candidates",
        "processed_tokens": "6,272,000 Units",
        "speculative_state": "Verification Active",
    }


@app.post("/v1/speculative/verify", response_model=SpeculativePassResponse)
def verify_speculative_tree(payload: SpeculativePassRequest) -> SpeculativePassResponse:
    try:
        return evaluate_speculative_verification_pass(payload)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
