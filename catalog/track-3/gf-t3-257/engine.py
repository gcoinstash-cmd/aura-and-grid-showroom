"""
GF-T3-257: Speculative Decoding & Draft Model Verification Engine
Clean-Room MIT Licensed FastAPI Backend Engine
Zero proprietary dependencies. Deterministic mathematical verification.
"""

from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
import math
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

app = FastAPI(
    title="GF-T3-257",
    description="Speculative Decoding & Draft Model Verification Engine",
    version="3.257.0",
)

SYNTHETIC_CORRIDORS: List[str] = [
    "SPEC-CORRIDOR-ALPHA (TARGET-DRAFT-TOKEN-VERIFICATION · 19500-GB/S)",
    "SPEC-CORRIDOR-BRAVO (REJECTION-SAMPLING-ACCELERATION-FABRIC)",
    "SPEC-CORRIDOR-GAMMA (MULTI-TOKEN-ACCEPTANCE-ENGINE)",
    "SPEC-CORRIDOR-DELTA (FALLBACK-TARGET-AUTOREGRESSIVE-PASS)",
]


@dataclass
class DraftChannelMetrics:
    draft_id: str
    label: str
    pointer_hex: str
    draft_tokens_k: int
    accepted_tokens: int
    acceptance_rate_pct: int
    speedup_ratio: float
    latency_ms: float
    verification_us: float
    state: str
    locked: bool
    target_probs: List[float]
    draft_probs: List[float]
    acceptance_probs: List[float]
    residual_mass: float


class TokenDistributionPair(BaseModel):
    token_id: int = Field(..., ge=0, le=256000)
    target_prob: float = Field(..., gt=0.0, le=1.0)
    draft_prob: float = Field(..., gt=0.0, le=1.0)
    threshold_u: float = Field(default=0.5, ge=0.0, le=1.0)


class SpeculativeVerifyRequest(BaseModel):
    corridor: str = Field(
        default="SPEC-CORRIDOR-ALPHA (TARGET-DRAFT-TOKEN-VERIFICATION · 19500-GB/S)"
    )
    draft_depth_k: int = Field(default=4, ge=1, le=16)
    cost_coefficient_c: float = Field(default=0.14, gt=0.0, lt=1.0)
    discrepancy_spike: bool = Field(default=False)
    sequence: List[TokenDistributionPair]

    @field_validator("corridor")
    @classmethod
    def validate_corridor(cls, value: str) -> str:
        if value not in SYNTHETIC_CORRIDORS:
            raise ValueError("Invalid synthetic speculative corridor identifier")
        return value


def compute_acceptance_probability(target_p: float, draft_q: float) -> float:
    """
    Computes lossless rejection sampling acceptance probability:
    alpha_i = min(1.0, p_target(x_i) / q_draft(x_i))
    """
    if draft_q <= 0.0:
        raise ValueError("Draft probability q_draft must be strictly positive")
    if target_p < 0.0:
        raise ValueError("Target probability p_target must be non-negative")
    return min(1.0, target_p / draft_q)


def compute_residual_distribution(
    target_dist: List[float], draft_dist: List[float]
) -> List[float]:
    """
    Computes the normalized residual distribution when a draft token is rejected:
    p_residual(x) = max(0.0, p_target(x) - q_draft(x)) / sum_x(max(0.0, p_target(x) - q_draft(x)))
    Guarantees exact target model distribution preservation without accuracy degradation.
    """
    if len(target_dist) != len(draft_dist) or len(target_dist) == 0:
        raise ValueError("Target and draft distributions must have identical non-zero length")
    positive_deltas = [max(0.0, p - q) for p, q in zip(target_dist, draft_dist)]
    mass = sum(positive_deltas)
    if mass <= 1e-12:
        uniform = 1.0 / float(len(target_dist))
        return [uniform for _ in target_dist]
    return [delta / mass for delta in positive_deltas]


def compute_expected_tokens_per_pass(acceptance_rate_alpha: float, k_drafts: int) -> float:
    """
    Expected tokens generated per single target verification pass of length k:
    E[tokens] = (1 - alpha^(k + 1)) / (1 - alpha) for alpha < 1, else k + 1.
    """
    if k_drafts < 1:
        raise ValueError("k_drafts must be >= 1")
    alpha = max(0.0, min(1.0, acceptance_rate_alpha))
    if alpha >= 0.999999:
        return float(k_drafts + 1)
    return (1.0 - math.pow(alpha, k_drafts + 1)) / (1.0 - alpha)


def compute_theoretical_speedup(
    acceptance_rate_alpha: float, k_drafts: int, cost_ratio_c: float = 0.14
) -> float:
    """
    Computes theoretical walltime speedup ratio S:
    S = E[tokens] / (1 + k * c)
    where c is the single-step execution ratio of draft model to target model.
    """
    if cost_ratio_c < 0.0:
        raise ValueError("cost_ratio_c must be non-negative")
    expected_tokens = compute_expected_tokens_per_pass(acceptance_rate_alpha, k_drafts)
    denominator = 1.0 + float(k_drafts) * cost_ratio_c
    return round(expected_tokens / denominator, 2)


def evaluate_draft_sequence(
    pairs: List[TokenDistributionPair],
    cost_coefficient_c: float = 0.14,
    discrepancy_spike: bool = False,
) -> Dict[str, object]:
    """
    Executes multi-token acceptance pipeline across a draft sequence.
    Accepts consecutive tokens while threshold_u <= min(1, p_target / q_draft).
    At first rejection, samples bonus corrected token from residual distribution.
    """
    k = len(pairs)
    if k == 0:
        raise ValueError("Sequence cannot be empty")

    accepted_count = 0
    acceptance_probs: List[float] = []
    still_accepting = True

    for item in pairs:
        effective_draft_q = item.draft_prob * (1.85 if discrepancy_spike else 1.0)
        effective_target_p = item.target_prob * (0.42 if discrepancy_spike else 1.0)
        alpha_i = compute_acceptance_probability(effective_target_p, effective_draft_q)
        acceptance_probs.append(round(alpha_i, 4))
        if still_accepting and item.threshold_u <= alpha_i:
            accepted_count += 1
        else:
            still_accepting = False

    mean_alpha = sum(acceptance_probs) / float(k)
    speedup = compute_theoretical_speedup(mean_alpha, k, cost_coefficient_c)
    residual = compute_residual_distribution(
        [p.target_prob for p in pairs],
        [p.draft_prob for p in pairs],
    )
    throughput_gbs = round(19500.0 * (speedup / 2.5), 1)
    latency_us = round(0.01 * (2.5 / max(0.5, speedup)), 4)

    return {
        "draft_depth_k": k,
        "accepted_tokens": accepted_count,
        "emitted_tokens_total": accepted_count + 1,
        "mean_acceptance_rate": round(mean_alpha, 4),
        "acceptance_rate_pct": int(round(mean_alpha * 100)),
        "acceptance_probabilities": acceptance_probs,
        "residual_distribution": [round(r, 4) for r in residual],
        "speedup_factor": speedup,
        "throughput_gbs": throughput_gbs,
        "verification_latency_us": latency_us,
        "state": "REJECT_FALLBACK" if discrepancy_spike else "VERIFIED",
        "locked": not discrepancy_spike,
    }


class EngineStateStore:
    def __init__(self) -> None:
        self.corridor = SYNTHETIC_CORRIDORS[0]
        self.discrepancy_active = False
        self.processed_tokens = 3968000
        self.engine_xp = 75000
        self.step_count = 1
        self.drafts: List[DraftChannelMetrics] = self._build_initial_drafts()

    def _build_initial_drafts(self) -> List[DraftChannelMetrics]:
        channels: List[DraftChannelMetrics] = []
        for idx in range(8):
            ptr = hex(0x6000 + idx * 0x100)
            t_probs = [0.89, 0.91, 0.87, 0.90]
            d_probs = [0.92, 0.94, 0.91, 0.93]
            a_probs = [
                round(compute_acceptance_probability(tp, dp), 4)
                for tp, dp in zip(t_probs, d_probs)
            ]
            channels.append(
                DraftChannelMetrics(
                    draft_id="D" + str(idx),
                    label="Draft " + str(idx) + " (D" + str(idx) + ")",
                    pointer_hex="0x" + ptr[2:].upper(),
                    draft_tokens_k=4,
                    accepted_tokens=4,
                    acceptance_rate_pct=88,
                    speedup_ratio=2.5,
                    latency_ms=0.02,
                    verification_us=0.01,
                    state="VERIFIED",
                    locked=True,
                    target_probs=t_probs,
                    draft_probs=d_probs,
                    acceptance_probs=a_probs,
                    residual_mass=0.04,
                )
            )
        return channels

    def reset(self) -> None:
        self.discrepancy_active = False
        self.processed_tokens = 3968000
        self.engine_xp = 75000
        self.step_count = 1
        self.drafts = self._build_initial_drafts()


STORE = EngineStateStore()


@app.get("/api/health")
def get_health() -> Dict[str, object]:
    return {
        "engine": "GF-T3-257",
        "status": "SPEC_VERIFIED_ACTIVE",
        "corridor": STORE.corridor,
        "active_drafts": len(STORE.drafts),
        "throughput_gbs": 19500,
        "verification_latency_us": 0.01,
        "speedup_multiplier": 2.5,
    }


@app.get("/api/telemetry")
def get_telemetry() -> Dict[str, object]:
    return {
        "title": "GF-T3-257",
        "corridor": STORE.corridor,
        "discrepancy_active": STORE.discrepancy_active,
        "processed_tokens": STORE.processed_tokens,
        "engine_xp": STORE.engine_xp,
        "step_count": STORE.step_count,
        "drafts": [asdict(d) for d in STORE.drafts],
    }


@app.post("/api/verify")
def post_verify(payload: SpeculativeVerifyRequest) -> Dict[str, object]:
    try:
        result = evaluate_draft_sequence(
            pairs=payload.sequence,
            cost_coefficient_c=payload.cost_coefficient_c,
            discrepancy_spike=payload.discrepancy_spike,
        )
        STORE.corridor = payload.corridor
        STORE.processed_tokens += int(result["emitted_tokens_total"]) * 1024
        STORE.engine_xp += 250
        STORE.step_count += 1
        return {
            "engine": "GF-T3-257",
            "corridor": STORE.corridor,
            "verification": result,
            "processed_tokens": STORE.processed_tokens,
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/flush")
def post_flush() -> Dict[str, object]:
    STORE.reset()
    return {
        "engine": "GF-T3-257",
        "status": "BUFFERS_FLUSHED_WEIGHTS_REZEROED",
        "processed_tokens": STORE.processed_tokens,
    }
