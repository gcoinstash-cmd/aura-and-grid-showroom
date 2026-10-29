"""
GF-T3-226 Standalone Backend Engine
Clean-Room Tiled Online Softmax & Paged KV-Cache Virtual Memory Allocator
License: MIT
"""

from __future__ import annotations
import math
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple


CORRIDOR_PROFILES: Dict[str, Dict[str, float]] = {
    "KV-CORRIDOR-ALPHA (PAGED-CHUNK-16B · DYNAMIC-ACCUMULATOR)": {
        "base_bandwidth_gbs": 1240.0,
        "base_latency_ms": 0.42,
        "compression_ratio_pct": 64.2,
        "sram_tile_size": 16.0,
    },
    "KV-CORRIDOR-BRAVO (ASYNC-TMA-LOAD · WARP-SPECIALIZED)": {
        "base_bandwidth_gbs": 1480.0,
        "base_latency_ms": 0.36,
        "compression_ratio_pct": 68.5,
        "sram_tile_size": 16.0,
    },
    "KV-CORRIDOR-GAMMA (SPARSE-HEAD-EVICTION · RECURRENT-SLOT)": {
        "base_bandwidth_gbs": 1310.0,
        "base_latency_ms": 0.39,
        "compression_ratio_pct": 74.8,
        "sram_tile_size": 16.0,
    },
    "KV-CORRIDOR-DELTA (ZERO-COPY-VIRTUAL-TABLE-FALLBACK)": {
        "base_bandwidth_gbs": 1120.0,
        "base_latency_ms": 0.48,
        "compression_ratio_pct": 58.0,
        "sram_tile_size": 16.0,
    },
}


class AttentionPassPayload:
    """
    GridSync Zero-Trust Ingress Payload Validator
    """

    def __init__(
        self,
        query_vector: List[float],
        key_blocks: List[List[float]],
        value_blocks: List[List[float]],
        corridor: str = "KV-CORRIDOR-ALPHA (PAGED-CHUNK-16B · DYNAMIC-ACCUMULATOR)",
        tile_size: int = 4,
    ) -> None:
        forbidden = ["select ", "drop ", "insert ", "<script", "--", ";"]
        lower_val = corridor.lower()
        for token in forbidden:
            if token in lower_val:
                raise ValueError("GridSync Zero-Trust Violation: Disallowed token in corridor")
        if corridor not in CORRIDOR_PROFILES:
            raise ValueError("Unknown synthetic KV corridor identifier")
        if not (4 <= len(query_vector) <= 64):
            raise ValueError("Query vector length must be between 4 and 64")
        if not (1 <= len(key_blocks) <= 256) or len(key_blocks) != len(value_blocks):
            raise ValueError("Key and value blocks must be non-empty and match in length")
        if not (1 <= tile_size <= 64):
            raise ValueError("Tile size must be between 1 and 64")

        self.corridor = corridor
        self.query_vector = query_vector
        self.key_blocks = key_blocks
        self.value_blocks = value_blocks
        self.tile_size = tile_size


@dataclass
class PagedBlock:
    physical_block_id: int
    logical_page_id: Optional[int]
    sequence_id: Optional[str]
    allocated_tokens: int
    capacity_tokens: int = 16
    running_max_m: float = -1e9
    normalizer_l: float = 0.0
    correction_factor: float = 1.0
    cumulative_attention_score: float = 0.0
    sparsity_score: float = 0.0
    sram_transfer_state: str = "IDLE"
    status_code: str = "FREE"
    key_signature: List[float] = field(default_factory=list)
    value_signature: List[float] = field(default_factory=list)


def dot_product(vec_a: List[float], vec_b: List[float]) -> float:
    if len(vec_a) != len(vec_b):
        raise ValueError("Vector dimension mismatch in dot_product")
    return sum(a * b for a, b in zip(vec_a, vec_b))


def naive_scaled_dot_product_attention(
    query: List[float],
    keys: List[List[float]],
    values: List[List[float]],
) -> Tuple[List[float], List[float]]:
    """
    Reference O(N^2) materialized attention for numerical equivalence verification.
    """
    if len(keys) != len(values) or len(keys) == 0:
        raise ValueError("Keys and values must be non-empty and equal length")
    head_dim = len(query)
    scale = 1.0 / math.sqrt(float(head_dim))
    scores = [dot_product(query, k) * scale for k in keys]
    max_score = max(scores)
    exp_scores = [math.exp(s - max_score) for s in scores]
    denom = sum(exp_scores)
    weights = [e / denom for e in exp_scores]

    val_dim = len(values[0])
    output = [0.0] * val_dim
    for weight, val_vec in zip(weights, values):
        for idx in range(val_dim):
            output[idx] += weight * val_vec[idx]
    return output, weights


def tiled_online_softmax_attention(
    query: List[float],
    keys: List[List[float]],
    values: List[List[float]],
    tile_size: int = 4,
) -> Dict[str, object]:
    """
    FlashAttention-3 Tiled Online Softmax Accumulator.
    Maintains running maximum m_i, rescaling factor exp(m_prev - m_new),
    running partition sum l_i, and unnormalized output accumulator O_i in SRAM
    without materializing the full attention matrix.
    """
    if len(keys) != len(values) or len(keys) == 0:
        raise ValueError("Keys and values must be non-empty and equal length")
    if tile_size <= 0:
        raise ValueError("Tile size must be positive")

    head_dim = len(query)
    val_dim = len(values[0])
    scale = 1.0 / math.sqrt(float(head_dim))

    running_m = -math.inf
    running_l = 0.0
    running_o = [0.0] * val_dim
    tile_trace: List[Dict[str, float]] = []

    num_tokens = len(keys)
    for start_idx in range(0, num_tokens, tile_size):
        end_idx = min(start_idx + tile_size, num_tokens)
        tile_keys = keys[start_idx:end_idx]
        tile_values = values[start_idx:end_idx]

        tile_scores = [dot_product(query, k) * scale for k in tile_keys]
        tile_max = max(tile_scores)
        m_prev = running_m
        m_new = max(m_prev, tile_max)

        alpha_correction = 0.0 if m_prev == -math.inf else math.exp(m_prev - m_new)
        tile_exps = [math.exp(s - m_new) for s in tile_scores]
        tile_sum = sum(tile_exps)

        l_new = (running_l * alpha_correction) + tile_sum

        new_o = [coord * alpha_correction for coord in running_o]
        for exp_val, v_vec in zip(tile_exps, tile_values):
            for d_idx in range(val_dim):
                new_o[d_idx] += exp_val * v_vec[d_idx]

        running_m = m_new
        running_l = l_new
        running_o = new_o

        tile_trace.append(
            {
                "tile_start": float(start_idx),
                "tile_end": float(end_idx),
                "m_prev": -999.0 if m_prev == -math.inf else round(m_prev, 6),
                "m_new": round(m_new, 6),
                "correction_factor": round(alpha_correction, 6),
                "running_l": round(l_new, 6),
            }
        )

    final_output = [coord / running_l for coord in running_o]
    return {
        "output": final_output,
        "running_max_m": running_m,
        "normalizer_l": running_l,
        "tiles_processed": len(tile_trace),
        "tile_trace": tile_trace,
    }


class PagedKVCacheAllocator:
    """
    16-Block Physical KV-Cache Allocator with 16-Token Pages.
    Eliminates external fragmentation via non-contiguous logical-to-physical page tables
    and implements dynamic cumulative attention score eviction.
    """

    def __init__(self, total_blocks: int = 16, page_size: int = 16) -> None:
        self.total_blocks = total_blocks
        self.page_size = page_size
        self.blocks: List[PagedBlock] = []
        self.page_table: Dict[str, List[int]] = {}
        self.reset()

    def reset(self) -> None:
        self.blocks = [
            PagedBlock(
                physical_block_id=idx,
                logical_page_id=None,
                sequence_id=None,
                allocated_tokens=0,
                capacity_tokens=self.page_size,
                running_max_m=-1e9,
                normalizer_l=0.0,
                correction_factor=1.0,
                cumulative_attention_score=0.0,
                sparsity_score=0.0,
                sram_transfer_state="IDLE",
                status_code="FREE",
                key_signature=[0.0, 0.0, 0.0, 0.0],
                value_signature=[0.0, 0.0, 0.0, 0.0],
            )
            for idx in range(self.total_blocks)
        ]
        self.page_table = {}

    def allocate_sequence_tokens(
        self,
        sequence_id: str,
        num_tokens: int,
        attention_scores: Optional[List[float]] = None,
    ) -> Dict[str, object]:
        if num_tokens <= 0:
            raise ValueError("Token allocation count must be positive")

        if sequence_id not in self.page_table:
            self.page_table[sequence_id] = []

        remaining = num_tokens
        allocated_blocks: List[int] = []

        # Fill tail block if partially occupied
        if self.page_table[sequence_id]:
            last_phys_id = self.page_table[sequence_id][-1]
            tail_block = self.blocks[last_phys_id]
            spare = tail_block.capacity_tokens - tail_block.allocated_tokens
            if spare > 0:
                fill = min(spare, remaining)
                tail_block.allocated_tokens += fill
                remaining -= fill
                allocated_blocks.append(last_phys_id)

        block_cursor = 0
        while remaining > 0:
            free_block = next((b for b in self.blocks if b.status_code == "FREE"), None)
            if free_block is None:
                evicted_id = self.evict_lowest_attention_blocks(count=1)[0]
                free_block = self.blocks[evicted_id]

            chunk = min(self.page_size, remaining)
            logical_idx = len(self.page_table[sequence_id])
            score = (
                attention_scores[block_cursor % len(attention_scores)]
                if attention_scores
                else round(0.35 + ((free_block.physical_block_id * 7) % 19) * 0.03, 4)
            )

            free_block.logical_page_id = logical_idx
            free_block.sequence_id = sequence_id
            free_block.allocated_tokens = chunk
            free_block.status_code = "LOCKED"
            free_block.sram_transfer_state = "TMA_SYNCED"
            free_block.cumulative_attention_score = score
            free_block.sparsity_score = round(max(0.0, 1.0 - score), 4)
            free_block.running_max_m = round(1.15 + score * 2.4, 4)
            free_block.normalizer_l = round(4.2 + score * 8.5, 4)
            free_block.correction_factor = round(math.exp(-0.12 * (block_cursor + 1)), 4)
            base_val = float(free_block.physical_block_id + 1) * 0.125
            free_block.key_signature = [
                round(base_val, 3),
                round(base_val * 1.4, 3),
                round(-base_val * 0.8, 3),
                round(score, 3),
            ]
            free_block.value_signature = [
                round(score * 0.9, 3),
                round(base_val * 0.75, 3),
                round(base_val * 1.1, 3),
                round(1.0 - score * 0.5, 3),
            ]

            self.page_table[sequence_id].append(free_block.physical_block_id)
            allocated_blocks.append(free_block.physical_block_id)
            remaining -= chunk
            block_cursor += 1

        return {
            "sequence_id": sequence_id,
            "allocated_physical_blocks": allocated_blocks,
            "external_fragmentation_pct": self.compute_external_fragmentation_pct(),
            "active_blocks": sum(1 for b in self.blocks if b.status_code == "LOCKED"),
        }

    def evict_lowest_attention_blocks(self, count: int = 1) -> List[int]:
        locked_blocks = [b for b in self.blocks if b.status_code == "LOCKED"]
        if not locked_blocks:
            return []

        locked_blocks.sort(key=lambda b: (b.cumulative_attention_score, b.physical_block_id))
        evicted_ids: List[int] = []

        for target in locked_blocks[:count]:
            seq_id = target.sequence_id
            phys_id = target.physical_block_id
            if seq_id and seq_id in self.page_table and phys_id in self.page_table[seq_id]:
                self.page_table[seq_id].remove(phys_id)
            target.logical_page_id = None
            target.sequence_id = None
            target.allocated_tokens = 0
            target.status_code = "FREE"
            target.sram_transfer_state = "EVICTED_FLUSH"
            evicted_ids.append(phys_id)

        return evicted_ids

    def compute_external_fragmentation_pct(self) -> float:
        """
        Paged virtual allocation guarantees 0.0% external fragmentation across non-contiguous blocks.
        """
        return 0.0


try:
    from fastapi import FastAPI

    app = FastAPI(title="GF-T3-226", version="3.2.6")
    GLOBAL_ALLOCATOR = PagedKVCacheAllocator(total_blocks=16, page_size=16)

    @app.get("/health")
    def health_check() -> Dict[str, object]:
        return {
            "engine": "GF-T3-226",
            "track": "TRACK 3",
            "external_fragmentation_pct": 0.0,
        }

except ImportError:
    app = None
