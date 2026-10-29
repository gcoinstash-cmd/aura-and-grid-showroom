"""
GF-T3-255: Grouped-Query Attention (GQA) & KV Cache Compression Tensor Fabric Engine
Clean-Room MIT Permissive Implementation
Zero-Dollar Gate Enforced: Strictly dimensionless units, GB/s, microseconds, percentages, heads, and tokens.
"""

from __future__ import annotations

import math
import time
from typing import Dict, List, Literal, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

app = FastAPI(
    title="GF-T3-255",
    description="Grouped-Query Attention & KV Cache Compression Tensor Fabric Engine",
    version="3.255.0",
    license_info={"name": "MIT", "url": "https://opensource.org/licenses/MIT"},
)

CORRIDORS: Dict[str, Dict[str, object]] = {
    "ALPHA": {
        "id": "GQA-CORRIDOR-ALPHA (KV-CACHE-COMPRESSION-FABRIC · 17400-GB/S)",
        "base_throughput_gbs": 17400.0,
        "target_compaction_ratio": 4.0,
        "gqa_query_to_kv_ratio": 8,
        "eviction_threshold_pct": 0.01,
        "mode": "GQA_COMPRESSION",
    },
    "BRAVO": {
        "id": "GQA-CORRIDOR-BRAVO (GROUPED-QUERY-ATTENTION-HEAD-SHARING)",
        "base_throughput_gbs": 18250.0,
        "target_compaction_ratio": 4.5,
        "gqa_query_to_kv_ratio": 8,
        "eviction_threshold_pct": 0.01,
        "mode": "GQA_HEAD_SHARING",
    },
    "GAMMA": {
        "id": "GQA-CORRIDOR-GAMMA (TEMPORAL-EVICTION-POOLING-ENGINE)",
        "base_throughput_gbs": 19100.0,
        "target_compaction_ratio": 6.0,
        "gqa_query_to_kv_ratio": 8,
        "eviction_threshold_pct": 0.02,
        "mode": "TEMPORAL_EVICTION",
    },
    "DELTA": {
        "id": "GQA-CORRIDOR-DELTA (FALLBACK-FULL-ATTENTION-MATRIX)",
        "base_throughput_gbs": 9600.0,
        "target_compaction_ratio": 1.0,
        "gqa_query_to_kv_ratio": 1,
        "eviction_threshold_pct": 0.00,
        "mode": "FULL_ATTENTION_FALLBACK",
    },
}


class GQAConfigPayload(BaseModel):
    corridor_key: Literal["ALPHA", "BRAVO", "GAMMA", "DELTA"] = "ALPHA"
    query_heads: int = Field(default=64, ge=8, le=128)
    kv_heads: int = Field(default=8, ge=1, le=64)
    sequence_length: int = Field(default=32768, ge=512, le=131072)
    head_dim: int = Field(default=128, ge=64, le=256)
    temporal_decay_lambda: float = Field(default=0.045, gt=0.0, le=1.0)
    redundancy_cosine_gate: float = Field(default=0.92, ge=0.5, le=0.999)

    @field_validator("query_heads")
    @classmethod
    def validate_divisibility(cls, v: int, info) -> int:
        if v % 8 != 0:
            raise ValueError("query_heads must be a multiple of 8 for hardware tensor alignment")
        return v


class HeadTelemetry(BaseModel):
    head_index: int
    head_label: str
    hex_pointer: str
    compaction_ratio: float
    gqa_sharing_str: str
    eviction_rate_pct: float
    latency_ms: float
    accuracy_pct: float
    state_label: str
    locked: bool
    shared_query_group: List[int]
    retained_tokens: int
    evicted_tokens: int
    attention_entropy: float


class EngineTelemetrySnapshot(BaseModel):
    engine_id: str
    corridor: str
    mode: str
    pointer_hex: str
    compression_throughput_gbs: float
    attention_latency_us: float
    compaction_ratio: float
    active_heads: int
    total_heads: int
    processed_tokens: int
    engine_xp: int
    gqa_state: str
    eviction_spike_active: bool
    feature_vector: List[float]
    heads: List[HeadTelemetry]
    perplexity_delta: float
    kv_memory_saved_pct: float


def compute_gqa_head_sharing_ratio(query_heads: int, kv_heads: int) -> int:
    """
    Computes Grouped-Query Attention sharing ratio:
    h_kv = h_q / G  => G = h_q / h_kv
    """
    if kv_heads <= 0 or query_heads <= 0:
        raise ValueError("Head counts must be strictly positive integers")
    if query_heads < kv_heads or query_heads % kv_heads != 0:
        raise ValueError("query_heads must be evenly divisible by kv_heads")
    return query_heads // kv_heads


def compute_scaled_dot_product_attention_scores(
    query_vec: List[float],
    key_matrix: List[List[float]],
    head_dim: int,
) -> List[float]:
    """
    Computes exact scaled dot-product attention softmax distribution:
    Attention(Q, K) = softmax((Q * K^T) / sqrt(d_k))
    """
    if not query_vec or not key_matrix:
        raise ValueError("Query vector and key matrix cannot be empty")
    scale = 1.0 / math.sqrt(float(head_dim))
    raw_logits: List[float] = []
    for k_row in key_matrix:
        if len(k_row) != len(query_vec):
            raise ValueError("Dimension mismatch between query_vec and key_matrix row")
        dot_val = sum(q * k for q, k in zip(query_vec, k_row)) * scale
        raw_logits.append(dot_val)

    max_logit = max(raw_logits)
    exp_scores = [math.exp(logit - max_logit) for logit in raw_logits]
    denom = sum(exp_scores)
    return [s / denom for s in exp_scores]


def evaluate_temporal_eviction_pool(
    token_Importances: List[float],
    token_ages: List[int],
    decay_lambda: float,
    keep_ratio: float,
) -> Dict[str, object]:
    """
    Dynamically prunes redundant token slots in long-context attention windows
    using exponential temporal decay weighting:
    score_i = importance_i * exp(-lambda * age_i)
    Preserves top ceil(N * keep_ratio) institutional syntax slots.
    """
    if len(token_Importances) != len(token_ages):
        raise ValueError("token_Importances and token_ages must have identical length")
    total_slots = len(token_Importances)
    if total_slots == 0:
        return {
            "retained_indices": [],
            "evicted_count": 0,
            "retained_count": 0,
            "compaction_ratio": 1.0,
            "eviction_rate_pct": 0.0,
        }
    if not (0.05 <= keep_ratio <= 1.0):
        raise ValueError("keep_ratio must be within [0.05, 1.0]")

    scored_slots = []
    for idx, (imp, age) in enumerate(zip(token_Importances, token_ages)):
        temporal_weight = imp * math.exp(-decay_lambda * max(0, age))
        scored_slots.append((idx, temporal_weight))

    target_retained = max(1, int(math.ceil(total_slots * keep_ratio)))
    scored_slots.sort(key=lambda item: item[1], reverse=True)
    retained_indices = sorted([item[0] for item in scored_slots[:target_retained]])
    evicted_count = total_slots - len(retained_indices)
    compaction_ratio = round(float(total_slots) / float(len(retained_indices)), 4)
    eviction_rate_pct = round((float(evicted_count) / float(total_slots)) * 100.0, 4)

    return {
        "retained_indices": retained_indices,
        "evicted_count": evicted_count,
        "retained_count": len(retained_indices),
        "compaction_ratio": compaction_ratio,
        "eviction_rate_pct": eviction_rate_pct,
    }


def calculate_kv_cache_footprint_bytes(
    batch_size: int,
    sequence_length: int,
    num_layers: int,
    kv_heads: int,
    head_dim: int,
    bytes_per_element: int = 2,
    compaction_ratio: float = 4.0,
) -> Dict[str, float]:
    """
    Calculates uncompressed vs GQA + Temporal Eviction compressed KV cache footprint:
    Raw Bytes = 2 (K and V) * B * S * L * H_kv * D * bytes_per_element
    Compressed Bytes = Raw Bytes / compaction_ratio
    """
    if min(batch_size, sequence_length, num_layers, kv_heads, head_dim, bytes_per_element) <= 0:
        raise ValueError("All tensor dimensions must be positive")
    if compaction_ratio < 1.0:
        raise ValueError("compaction_ratio must be >= 1.0")

    raw_bytes = float(2 * batch_size * sequence_length * num_layers * kv_heads * head_dim * bytes_per_element)
    compressed_bytes = raw_bytes / compaction_ratio
    saved_pct = (1.0 - (compressed_bytes / raw_bytes)) * 100.0
    return {
        "raw_bytes": raw_bytes,
        "compressed_bytes": compressed_bytes,
        "saved_pct": round(saved_pct, 4),
    }


class GQACompressionFabricEngine:
    def __init__(self) -> None:
        self.corridor_key: str = "ALPHA"
        self.query_heads: int = 64
        self.kv_heads: int = 8
        self.sequence_length: int = 32768
        self.head_dim: int = 128
        self.processed_tokens: int = 3712000
        self.engine_xp: int = 75000
        self.step_counter: int = 0
        self.eviction_spike_active: bool = False
        self.burst_multiplier: float = 1.0

    def build_snapshot(self) -> EngineTelemetrySnapshot:
        corridor = CORRIDORS[self.corridor_key]
        base_tp = float(corridor["base_throughput_gbs"])
        base_ratio = float(corridor["target_compaction_ratio"])
        gqa_group = compute_gqa_head_sharing_ratio(self.query_heads, self.kv_heads)

        if self.eviction_spike_active:
            effective_ratio = round(base_ratio * 1.25, 2)
            effective_tp = round(base_tp * 0.94, 1)
            attention_lat_us = 0.03
            gqa_state = "Eviction Spike Active"
        else:
            effective_ratio = round(base_ratio * self.burst_multiplier, 2)
            effective_tp = round(base_tp * self.burst_multiplier, 1)
            attention_lat_us = 0.01
            gqa_state = "Compressed Active"

        heads_list: List[HeadTelemetry] = []
        for h_idx in range(8):
            ptr_val = 0x4000 + (h_idx * 0x0100)
            q_start = h_idx * gqa_group
            q_group = list(range(q_start, q_start + gqa_group))

            q_vec = [
                math.sin(0.35 * (h_idx + 1) + 0.12 * i + 0.05 * self.step_counter)
                for i in range(8)
            ]
            k_mat = [
                [
                    math.cos(0.25 * (h_idx + 1) + 0.09 * (i + r) + 0.03 * self.step_counter)
                    for i in range(8)
                ]
                for r in range(4)
            ]
            attn_probs = compute_scaled_dot_product_attention_scores(q_vec, k_mat, self.head_dim)
            entropy = -sum(p * math.log(max(p, 1e-12)) for p in attn_probs)

            evict_pct = 0.08 if (self.eviction_spike_active and h_idx in (2, 5)) else float(corridor["eviction_threshold_pct"])
            lat_ms = 0.09 if (self.eviction_spike_active and h_idx in (2, 5)) else 0.04
            is_locked = not (self.eviction_spike_active and h_idx in (2, 5))
            state_str = "COMPRESSED · LOCKED" if is_locked else "EVICTING · SPIKE"
            accuracy = 99.9 if is_locked else 99.4

            retained = int(round(self.sequence_length / max(effective_ratio, 1.0)))
            evicted = max(0, self.sequence_length - retained)

            heads_list.append(
                HeadTelemetry(
                    head_index=h_idx,
                    head_label=f"Head {h_idx} (H{h_idx})",
                    hex_pointer=f"0x{ptr_val:04X}",
                    compaction_ratio=effective_ratio,
                    gqa_sharing_str=f"{gqa_group}:1",
                    eviction_rate_pct=evict_pct,
                    latency_ms=lat_ms,
                    accuracy_pct=accuracy,
                    state_label=state_str,
                    locked=is_locked,
                    shared_query_group=q_group,
                    retained_tokens=retained,
                    evicted_tokens=evicted,
                    attention_entropy=round(entropy, 4),
                )
            )

        vec = [
            round(1.71 + 0.01 * math.sin(self.step_counter), 2),
            round(1.75 + 0.01 * math.cos(self.step_counter), 2),
            round(1.72 + 0.01 * math.sin(self.step_counter + 1.0), 2),
            round(1.74 + 0.01 * math.cos(self.step_counter + 1.0), 2),
        ]

        footprint = calculate_kv_cache_footprint_bytes(
            batch_size=1,
            sequence_length=self.sequence_length,
            num_layers=32,
            kv_heads=self.kv_heads,
            head_dim=self.head_dim,
            bytes_per_element=2,
            compaction_ratio=max(1.0, effective_ratio),
        )

        return EngineTelemetrySnapshot(
            engine_id="GF-T3-255",
            corridor=str(corridor["id"]),
            mode=str(corridor["mode"]),
            pointer_hex="0x3F8DC0",
            compression_throughput_gbs=effective_tp,
            attention_latency_us=attention_lat_us,
            compaction_ratio=effective_ratio,
            active_heads=sum(1 for h in heads_list if h.locked),
            total_heads=8,
            processed_tokens=self.processed_tokens,
            engine_xp=self.engine_xp,
            gqa_state=gqa_state,
            eviction_spike_active=self.eviction_spike_active,
            feature_vector=vec,
            heads=heads_list,
            perplexity_delta=0.0001 if not self.eviction_spike_active else 0.0014,
            kv_memory_saved_pct=footprint["saved_pct"],
        )

    def trigger_compression_burst(self) -> EngineTelemetrySnapshot:
        self.step_counter += 1
        self.burst_multiplier = 1.15
        self.processed_tokens += 128000
        self.engine_xp += 2500
        return self.build_snapshot()

    def toggle_eviction_spike(self, force_state: Optional[bool] = None) -> EngineTelemetrySnapshot:
        self.step_counter += 1
        if force_state is None:
            self.eviction_spike_active = not self.eviction_spike_active
        else:
            self.eviction_spike_active = force_state
        self.processed_tokens += 64000
        return self.build_snapshot()

    def step_pipeline_pass(self) -> EngineTelemetrySnapshot:
        self.step_counter += 1
        self.burst_multiplier = 1.0
        self.processed_tokens += 96000
        self.engine_xp += 1500
        return self.build_snapshot()

    def flush_and_rezero(self) -> EngineTelemetrySnapshot:
        self.step_counter = 0
        self.burst_multiplier = 1.0
        self.eviction_spike_active = False
        self.processed_tokens = 3712000
        self.engine_xp = 75000
        return self.build_snapshot()


FABRIC_ENGINE = GQACompressionFabricEngine()


@app.get("/api/v1/telemetry", response_model=EngineTelemetrySnapshot)
def get_telemetry() -> EngineTelemetrySnapshot:
    return FABRIC_ENGINE.build_snapshot()


@app.post("/api/v1/corridor", response_model=EngineTelemetrySnapshot)
def switch_corridor(payload: GQAConfigPayload) -> EngineTelemetrySnapshot:
    FABRIC_ENGINE.corridor_key = payload.corridor_key
    FABRIC_ENGINE.query_heads = payload.query_heads
    FABRIC_ENGINE.kv_heads = payload.kv_heads
    FABRIC_ENGINE.sequence_length = payload.sequence_length
    FABRIC_ENGINE.head_dim = payload.head_dim
    return FABRIC_ENGINE.build_snapshot()


@app.post("/api/v1/actions/compression-burst", response_model=EngineTelemetrySnapshot)
def action_compression_burst() -> EngineTelemetrySnapshot:
    return FABRIC_ENGINE.trigger_compression_burst()


@app.post("/api/v1/actions/eviction-spike", response_model=EngineTelemetrySnapshot)
def action_eviction_spike() -> EngineTelemetrySnapshot:
    return FABRIC_ENGINE.toggle_eviction_spike()


@app.post("/api/v1/actions/step-pass", response_model=EngineTelemetrySnapshot)
def action_step_pass() -> EngineTelemetrySnapshot:
    return FABRIC_ENGINE.step_pipeline_pass()


@app.post("/api/v1/actions/flush-buffers", response_model=EngineTelemetrySnapshot)
def action_flush_buffers() -> EngineTelemetrySnapshot:
    return FABRIC_ENGINE.flush_and_rezero()
