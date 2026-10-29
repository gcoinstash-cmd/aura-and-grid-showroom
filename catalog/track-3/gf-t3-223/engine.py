"""
GF-T3-223: Institutional Speculative Decoding & Lossless Rejection Sampling Engine.
Clean-Room Track 3 Production Reference Core (Zero Third-Party Marks).
License: MIT
"""

from __future__ import annotations

import math
import os
import random
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

SYNTHETIC_CORRIDORS: Dict[str, Dict[str, object]] = {
    "SPEC-CORRIDOR-ALPHA (DRAFT-K4 · HIGH-ENTROPY-VERIFIER)": {
        "corridor_id": "SPEC-CORRIDOR-ALPHA",
        "label": "SPEC-CORRIDOR-ALPHA (DRAFT-K4 · HIGH-ENTROPY-VERIFIER)",
        "default_k": 4,
        "draft_step_ms": 0.85,
        "target_batch_ms": 11.4,
        "entropy_regime": "HIGH_ENTROPY",
        "baseline_acceptance": 0.72,
    },
    "SPEC-CORRIDOR-BRAVO (DRAFT-K6 · CODE-COMPLETION-FASTPATH)": {
        "corridor_id": "SPEC-CORRIDOR-BRAVO",
        "label": "SPEC-CORRIDOR-BRAVO (DRAFT-K6 · CODE-COMPLETION-FASTPATH)",
        "default_k": 6,
        "draft_step_ms": 0.78,
        "target_batch_ms": 12.1,
        "entropy_regime": "LOW_ENTROPY_STRUCTURED",
        "baseline_acceptance": 0.86,
    },
    "SPEC-CORRIDOR-GAMMA (ADAPTIVE-HORIZON-BALANCER)": {
        "corridor_id": "SPEC-CORRIDOR-GAMMA",
        "label": "SPEC-CORRIDOR-GAMMA (ADAPTIVE-HORIZON-BALANCER)",
        "default_k": 5,
        "draft_step_ms": 0.84,
        "target_batch_ms": 12.1,
        "entropy_regime": "BALANCED_ADAPTIVE",
        "baseline_acceptance": 0.784,
    },
    "SPEC-CORRIDOR-DELTA (REJECTION-SAMPLING-FALLBACK)": {
        "corridor_id": "SPEC-CORRIDOR-DELTA",
        "label": "SPEC-CORRIDOR-DELTA (REJECTION-SAMPLING-FALLBACK)",
        "default_k": 3,
        "draft_step_ms": 0.92,
        "target_batch_ms": 11.8,
        "entropy_regime": "DIVERGENT_RESIDUAL",
        "baseline_acceptance": 0.54,
    },
}

VOCABULARY: List[str] = [
    "def",
    "verify_batch",
    "(logits_q,",
    "logits_p,",
    "horizon_k):",
    "ratio_alpha",
    "residual_norm",
    "commit_stream",
    "sync_barrier",
    "kv_cache_ptr",
    "tensor_stride",
    "eigen_proj",
    "return",
    "accepted_seq",
    "fallback_tok",
    "invariant_ok",
]


@dataclass
class CandidateTokenDecision:
    step_index: int
    token_id: int
    token_str: str
    p_draft: float
    p_target: float
    acceptance_threshold: float
    uniform_draw: float
    accepted: bool
    decision_reason: str
    resampled_token_id: Optional[int] = None
    resampled_token_str: Optional[str] = None
    residual_mass: float = 0.0


@dataclass
class VerificationPassResult:
    corridor: str
    k_window: int
    next_k_window: int
    decisions: List[CandidateTokenDecision]
    accepted_count: int
    committed_count: int
    bonus_or_residual_token: str
    bonus_or_residual_source: str
    draft_latency_ms: float
    target_verification_ms: float
    speculative_speedup: float
    rolling_acceptance_rate: float
    total_committed_tokens: int
    kl_divergence_nats: float


def normalize_distribution(weights: List[float]) -> List[float]:
    clipped = [max(0.0, float(w)) for w in weights]
    total = sum(clipped)
    if total <= 1e-12:
        n = len(clipped)
        return [1.0 / n for _ in range(n)]
    return [w / total for w in clipped]


def compute_residual_distribution(
    p_target_dist: List[float],
    p_draft_dist: List[float],
) -> Tuple[List[float], float]:
    """
    Computes the normalized positive residual distribution:
        P_res(x) = max(0, P_target(x) - P_draft(x)) / sum_x' max(0, P_target(x') - P_draft(x'))
    This guarantees that the marginal distribution of a step under speculative
    rejection sampling equals P_target(x) identically with zero quality loss.
    """
    if len(p_target_dist) != len(p_draft_dist) or len(p_target_dist) == 0:
        raise ValueError("Target and draft distributions must have identical non-zero length.")

    p_t = normalize_distribution(p_target_dist)
    p_d = normalize_distribution(p_draft_dist)

    pos_diff = [max(0.0, t - d) for t, d in zip(p_t, p_d)]
    residual_mass = sum(pos_diff)
    if residual_mass <= 1e-12:
        return p_t, 0.0
    normalized_residual = [val / residual_mass for val in pos_diff]
    return normalized_residual, residual_mass


def sample_categorical(probs: List[float], u: float) -> int:
    cumulative = 0.0
    clamped_u = max(0.0, min(0.999999999, u))
    for idx, prob in enumerate(probs):
        cumulative += prob
        if clamped_u <= cumulative:
            return idx
    return len(probs) - 1


def verify_single_token_exact(
    candidate_idx: int,
    p_target_dist: List[float],
    p_draft_dist: List[float],
    u_accept: float,
    u_resample: float,
) -> Tuple[bool, int, float, float]:
    """
    Executes exact lossless rejection sampling for a single candidate token x ~ P_draft:
    1. Accept x if P_target(x) >= P_draft(x), else accept with probability P_target(x) / P_draft(x).
    2. If rejected, sample replacement token x' from normalized (P_target - P_draft)+.
    Returns (accepted, final_token_idx, acceptance_prob, residual_mass).
    """
    p_t = normalize_distribution(p_target_dist)
    p_d = normalize_distribution(p_draft_dist)

    prob_t = p_t[candidate_idx]
    prob_d = max(1e-12, p_d[candidate_idx])

    if prob_t >= prob_d:
        acceptance_prob = 1.0
        accepted = True
    else:
        acceptance_prob = prob_t / prob_d
        accepted = u_accept < acceptance_prob

    if accepted:
        return True, candidate_idx, acceptance_prob, 0.0

    residual_dist, residual_mass = compute_residual_distribution(p_t, p_d)
    resampled_idx = sample_categorical(residual_dist, u_resample)
    return False, resampled_idx, acceptance_prob, residual_mass


def compute_dynamic_k_horizon(
    current_k: int,
    rolling_acceptance_alpha: float,
    min_k: int = 2,
    max_k: int = 8,
) -> int:
    """
    Dynamic Draft Window (K) Tuner:
    Automatically scales draft horizon K in [2, 8] based on rolling acceptance rate alpha
    to prevent target verification pipeline stalls under high entropy and maximize throughput
    under deterministic code-completion fastpaths.
    """
    clamped_k = max(min_k, min(max_k, int(current_k)))
    alpha = max(0.0, min(1.0, float(rolling_acceptance_alpha)))

    if alpha < 0.60:
        # Contract horizon immediately when acceptance rate drops below 60%
        contracted = max(min_k, clamped_k - 2 if alpha < 0.42 else clamped_k - 1)
        return contracted
    if alpha >= 0.82:
        return min(max_k, clamped_k + 1)
    return clamped_k


def compute_theoretical_speedup(
    k_window: int,
    acceptance_alpha: float,
    draft_step_ms: float,
    target_batch_ms: float,
) -> Tuple[float, float, float]:
    """
    Computes expected tokens generated per verification cycle:
        E[Tokens] = (1 - alpha^(K + 1)) / (1 - alpha)  for alpha < 1
        E[Tokens] = K + 1                              for alpha == 1
    And wall-clock speedup relative to autoregressive target decoding:
        Speedup = (E[Tokens] * target_batch_ms) / (K * draft_step_ms + target_batch_ms)
    """
    k = max(2, min(8, int(k_window)))
    alpha = max(0.0, min(1.0, float(acceptance_alpha)))
    if abs(1.0 - alpha) < 1e-6:
        expected_tokens = float(k + 1)
    else:
        expected_tokens = (1.0 - math.pow(alpha, k + 1)) / (1.0 - alpha)

    draft_total_ms = k * draft_step_ms
    cycle_ms = draft_total_ms + target_batch_ms
    autoregressive_equivalent_ms = expected_tokens * target_batch_ms
    speedup = autoregressive_equivalent_ms / max(1e-6, cycle_ms)
    return round(speedup, 2), round(draft_total_ms, 2), round(target_batch_ms, 2)


def compute_kl_divergence(p_dist: List[float], q_dist: List[float]) -> float:
    p = normalize_distribution(p_dist)
    q = normalize_distribution(q_dist)
    kl = 0.0
    for p_i, q_i in zip(p, q):
        if p_i > 1e-12:
            kl += p_i * math.log(p_i / max(1e-12, q_i))
    return round(max(0.0, kl), 5)


class SpeculativeDecodingEngine:
    """
    Stateful Clean-Room Speculative Decoding Coordinator & Batch Verifier.
    """

    def __init__(self) -> None:
        self.active_corridor: str = "SPEC-CORRIDOR-GAMMA (ADAPTIVE-HORIZON-BALANCER)"
        self.k_window: int = 5
        self.rolling_acceptance: float = 0.784
        self.total_committed_tokens: int = 94200
        self.pass_counter: int = 18420
        self.stress_mode: str = "NOMINAL"
        self.rng = random.Random(223003)

    def reset(self) -> None:
        self.active_corridor = "SPEC-CORRIDOR-GAMMA (ADAPTIVE-HORIZON-BALANCER)"
        self.k_window = 5
        self.rolling_acceptance = 0.784
        self.total_committed_tokens = 94200
        self.pass_counter = 18420
        self.stress_mode = "NOMINAL"
        self.rng = random.Random(223003)

    def _build_step_distributions(
        self,
        step_idx: int,
        mode: str,
    ) -> Tuple[int, List[float], List[float], float, float]:
        vocab_size = len(VOCABULARY)
        candidate_idx = (self.pass_counter + step_idx) % vocab_size

        base_draft = [0.02 for _ in range(vocab_size)]
        base_target = [0.02 for _ in range(vocab_size)]

        if mode == "FASTPATH_100":
            base_draft[candidate_idx] = 0.68
            base_target[candidate_idx] = 0.76
            u_accept = 0.12
            u_resample = 0.35
        elif mode == "HIGH_ENTROPY_DIVERGENCE":
            base_draft[candidate_idx] = 0.64
            alt_idx = (candidate_idx + 3) % vocab_size
            if step_idx >= 1:
                base_target[candidate_idx] = 0.14
                base_target[alt_idx] = 0.72
                u_accept = 0.89
            else:
                base_target[candidate_idx] = 0.66
                u_accept = 0.15
            u_resample = 0.25
        else:
            # Nominal regime determined by corridor
            corridor_cfg = SYNTHETIC_CORRIDORS.get(
                self.active_corridor,
                SYNTHETIC_CORRIDORS["SPEC-CORRIDOR-GAMMA (ADAPTIVE-HORIZON-BALANCER)"],
            )
            base_alpha = float(corridor_cfg["baseline_acceptance"])
            if step_idx < int(round(self.k_window * base_alpha)):
                base_draft[candidate_idx] = 0.58
                base_target[candidate_idx] = 0.64
                u_accept = 0.22
            else:
                base_draft[candidate_idx] = 0.61
                alt_idx = (candidate_idx + 2) % vocab_size
                base_target[candidate_idx] = 0.24
                base_target[alt_idx] = 0.59
                u_accept = 0.78
            u_resample = 0.30

        return (
            candidate_idx,
            normalize_distribution(base_target),
            normalize_distribution(base_draft),
            u_accept,
            u_resample,
        )

    def execute_verification_pass(
        self,
        override_k: Optional[int] = None,
        override_mode: Optional[str] = None,
        corridor: Optional[str] = None,
    ) -> VerificationPassResult:
        if corridor and corridor in SYNTHETIC_CORRIDORS:
            self.active_corridor = corridor

        if override_k is not None:
            self.k_window = max(2, min(8, int(override_k)))

        mode = override_mode if override_mode is not None else self.stress_mode
        self.pass_counter += 1

        corridor_cfg = SYNTHETIC_CORRIDORS[self.active_corridor]
        draft_step_ms = float(corridor_cfg["draft_step_ms"])
        # Single-forward-pass batch verification invariant: target latency is O(1) w.r.t K
        target_batch_ms = float(corridor_cfg["target_batch_ms"])

        decisions: List[CandidateTokenDecision] = []
        accepted_count = 0
        truncated = False
        bonus_token_str = VOCABULARY[(self.pass_counter + self.k_window) % len(VOCABULARY)]
        bonus_source = "TARGET_BONUS_HEAD"
        kl_accum = 0.0

        for idx in range(self.k_window):
            cand_id, p_target_dist, p_draft_dist, u_acc, u_res = self._build_step_distributions(
                idx, mode
            )
            kl_accum += compute_kl_divergence(p_target_dist, p_draft_dist)
            p_t_val = round(p_target_dist[cand_id], 4)
            p_d_val = round(p_draft_dist[cand_id], 4)

            if truncated:
                decisions.append(
                    CandidateTokenDecision(
                        step_index=idx + 1,
                        token_id=cand_id,
                        token_str=VOCABULARY[cand_id],
                        p_draft=p_d_val,
                        p_target=p_t_val,
                        acceptance_threshold=round(min(1.0, p_t_val / max(1e-9, p_d_val)), 4),
                        uniform_draw=round(u_acc, 4),
                        accepted=False,
                        decision_reason="TRUNCATED_AFTER_PRIOR_REJECTION",
                        resampled_token_id=None,
                        resampled_token_str=None,
                        residual_mass=0.0,
                    )
                )
                continue

            accepted, final_id, acc_prob, res_mass = verify_single_token_exact(
                cand_id, p_target_dist, p_draft_dist, u_acc, u_res
            )
            if accepted:
                accepted_count += 1
                reason = (
                    "DIRECT_ACCEPT (P_target >= P_draft)"
                    if p_t_val >= p_d_val
                    else "STOCHASTIC_ACCEPT (u < P_target / P_draft)"
                )
                decisions.append(
                    CandidateTokenDecision(
                        step_index=idx + 1,
                        token_id=cand_id,
                        token_str=VOCABULARY[cand_id],
                        p_draft=p_d_val,
                        p_target=p_t_val,
                        acceptance_threshold=round(acc_prob, 4),
                        uniform_draw=round(u_acc, 4),
                        accepted=True,
                        decision_reason=reason,
                        resampled_token_id=None,
                        resampled_token_str=None,
                        residual_mass=0.0,
                    )
                )
            else:
                truncated = True
                bonus_token_str = VOCABULARY[final_id]
                bonus_source = "RESIDUAL_DISTRIBUTION_(P_target - P_draft)+"
                decisions.append(
                    CandidateTokenDecision(
                        step_index=idx + 1,
                        token_id=cand_id,
                        token_str=VOCABULARY[cand_id],
                        p_draft=p_d_val,
                        p_target=p_t_val,
                        acceptance_threshold=round(acc_prob, 4),
                        uniform_draw=round(u_acc, 4),
                        accepted=False,
                        decision_reason="REJECTED_RESAMPLED_FROM_RESIDUAL",
                        resampled_token_id=final_id,
                        resampled_token_str=VOCABULARY[final_id],
                        residual_mass=round(res_mass, 4),
                    )
                )

        # Every speculative verification pass commits accepted_count + 1 valid target token
        committed_count = accepted_count + 1
        self.total_committed_tokens += committed_count

        pass_acceptance = accepted_count / float(self.k_window)
        self.rolling_acceptance = round(0.75 * self.rolling_acceptance + 0.25 * pass_acceptance, 4)

        next_k = compute_dynamic_k_horizon(self.k_window, self.rolling_acceptance)
        speedup, draft_ms, target_ms = compute_theoretical_speedup(
            self.k_window, self.rolling_acceptance, draft_step_ms, target_batch_ms
        )
        mean_kl = round(kl_accum / float(self.k_window), 4)

        result = VerificationPassResult(
            corridor=self.active_corridor,
            k_window=self.k_window,
            next_k_window=next_k,
            decisions=decisions,
            accepted_count=accepted_count,
            committed_count=committed_count,
            bonus_or_residual_token=bonus_token_str,
            bonus_or_residual_source=bonus_source,
            draft_latency_ms=draft_ms,
            target_verification_ms=target_ms,
            speculative_speedup=speedup,
            rolling_acceptance_rate=round(self.rolling_acceptance * 100.0, 1),
            total_committed_tokens=self.total_committed_tokens,
            kl_divergence_nats=mean_kl,
        )
        self.k_window = next_k
        return result


app = FastAPI(
    title="GF-T3-223",
    description="Speculative Decoding Harness · Draft Verification · Rejection Sampling · Dynamic K Horizon",
    version="3.2.0",
)

ENGINE = SpeculativeDecodingEngine()


class VerifyStepRequest(BaseModel):
    corridor: Optional[str] = Field(
        default=None,
        description="Synthetic speculative corridor identifier",
    )
    k_window: Optional[int] = Field(
        default=None,
        ge=2,
        le=8,
        description="Candidate draft token horizon K in [2, 8]",
    )
    stress_mode: Optional[str] = Field(
        default=None,
        description="Execution regime: NOMINAL, HIGH_ENTROPY_DIVERGENCE, or FASTPATH_100",
    )


@app.get("/health")
def get_health() -> Dict[str, object]:
    return {
        "project_id": "GF-T3-223",
        "track": "TRACK 3",
        "status": "OPERATIONAL",
        "active_corridor": ENGINE.active_corridor,
        "k_window": ENGINE.k_window,
        "rolling_acceptance_pct": round(ENGINE.rolling_acceptance * 100.0, 1),
        "total_committed_tokens": ENGINE.total_committed_tokens,
    }


@app.get("/api/v1/corridors")
def list_corridors() -> Dict[str, object]:
    return {
        "project_id": "GF-T3-223",
        "corridors": list(SYNTHETIC_CORRIDORS.values()),
    }


@app.post("/api/v1/speculate/verify")
def trigger_speculative_verification(req: VerifyStepRequest) -> Dict[str, object]:
    if req.corridor and req.corridor not in SYNTHETIC_CORRIDORS:
        raise HTTPException(status_code=400, detail="Unknown synthetic speculative corridor")

    res = ENGINE.execute_verification_pass(
        override_k=req.k_window,
        override_mode=req.stress_mode,
        corridor=req.corridor,
    )
    return {
        "project_id": "GF-T3-223",
        "corridor": res.corridor,
        "k_window": res.k_window,
        "next_k_window": res.next_k_window,
        "accepted_count": res.accepted_count,
        "committed_count": res.committed_count,
        "bonus_or_residual_token": res.bonus_or_residual_token,
        "bonus_or_residual_source": res.bonus_or_residual_source,
        "draft_latency_ms": res.draft_latency_ms,
        "target_verification_ms": res.target_verification_ms,
        "speculative_speedup": res.speculative_speedup,
        "rolling_acceptance_rate": res.rolling_acceptance_rate,
        "total_committed_tokens": res.total_committed_tokens,
        "kl_divergence_nats": res.kl_divergence_nats,
        "decisions": [
            {
                "step_index": d.step_index,
                "token_id": d.token_id,
                "token_str": d.token_str,
                "p_draft": d.p_draft,
                "p_target": d.p_target,
                "acceptance_threshold": d.acceptance_threshold,
                "uniform_draw": d.uniform_draw,
                "accepted": d.accepted,
                "decision_reason": d.decision_reason,
                "resampled_token_id": d.resampled_token_id,
                "resampled_token_str": d.resampled_token_str,
                "residual_mass": d.residual_mass,
            }
            for d in res.decisions
        ],
    }


@app.post("/api/v1/speculate/reset")
def reset_speculative_verifier() -> Dict[str, object]:
    ENGINE.reset()
    return {
        "project_id": "GF-T3-223",
        "status": "RESET_COMPLETE",
        "active_corridor": ENGINE.active_corridor,
        "k_window": ENGINE.k_window,
        "rolling_acceptance_pct": round(ENGINE.rolling_acceptance * 100.0, 1),
        "total_committed_tokens": ENGINE.total_committed_tokens,
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port)
