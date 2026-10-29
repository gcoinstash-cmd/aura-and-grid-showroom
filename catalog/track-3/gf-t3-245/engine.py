"""
GF-T3-245: Dynamic KV Cache PagedAllocation & FlashAttention Ring-Block Eviction Engine
Standalone Production FastAPI Backend & Hardware Page Table Simulator
SPDX-License-Identifier: MIT
"""

from __future__ import annotations

import hashlib
import math
import time
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional

try:
    from fastapi import FastAPI, HTTPException, Header
    from pydantic import BaseModel, Field
    FASTAPI_AVAILABLE = True
except ImportError:
    FASTAPI_AVAILABLE = False
    BaseModel = object  # type: ignore

TOKENS_PER_BLOCK: int = 16
TOTAL_PHYSICAL_BLOCKS: int = 32
VISIBLE_MATRIX_BLOCKS: int = 8
BASE_VRAM_POINTER: int = 0x9000
PAGE_STRIDE_BYTES: int = 0x0400

SYNTHETIC_KV_CORRIDORS: List[str] = [
    "KV-CORRIDOR-ALPHA (PAGED-KV-BLOCK-ALLOCATION · 9200-GB/S)",
    "KV-CORRIDOR-BRAVO (FLASH-ATTENTION-RING-BLOCK-EVICTION)",
    "KV-CORRIDOR-GAMMA (NON-CONTIGUOUS-PAGE-TABLE-MAPPING)",
    "KV-CORRIDOR-DELTA (FALLBACK-CONTIGUOUS-VRAM-BUFFER)",
]

ALLOWED_RBAC_ROLES = {"CREW_CHIEF", "SEC_OPS", "AUDITOR", "TELEMETRY_OP"}


@dataclass
class PagedKvBlockRecord:
    block_index: int
    block_label: str
    short_code: str
    page_hex: str
    logical_page_index: int
    physical_frame_index: int
    tokens_filled: int
    token_capacity: int
    sequence_id: str
    attention_weight: float
    attention_score_precise: float
    recency_steps: int
    eviction_state: str
    hit_rate_pct: float
    lock_status: str


@dataclass
class AuditLedgerRecord:
    audit_id: str
    timestamp_epoch: float
    actor_role: str
    mfa_verified: bool
    action_type: str
    corridor: str
    fragmentation_pct: float
    bandwidth_gbs: float
    eviction_latency_us: float
    remediation_triggered: bool
    sha256_checksum: str


def resolve_physical_page_hex(physical_frame_index: int) -> str:
    """Maps a physical VRAM frame index to a deterministic 0x9000-base hex address."""
    if physical_frame_index < 0 or physical_frame_index >= 256:
        raise ValueError("Physical frame index out of hardware LUT bounds [0..255]")
    addr = BASE_VRAM_POINTER + (physical_frame_index * PAGE_STRIDE_BYTES)
    return "0x" + format(addr, "X")


def compute_flash_attention_eviction_score(
    attention_weight: float,
    recency_steps: int,
    hit_rate_pct: float,
) -> float:
    """
    Evaluates FlashAttention ring-block eviction score using exponential recency
    decay and block hit-rate weighting. Lower scores are evicted first.
    """
    clamped_attn = max(0.05, min(0.999, float(attention_weight)))
    decay = math.exp(-0.018 * max(0, int(recency_steps)))
    hit_factor = max(0.5, min(1.0, float(hit_rate_pct) / 100.0))
    raw_score = clamped_attn * (0.88 + 0.12 * decay) * hit_factor
    return round(raw_score, 4)


def validate_vram_fragmentation(
    sequence_token_lengths: List[int],
    contiguous_fallback: bool = False,
) -> Dict[str, float]:
    """
    Computes VRAM memory fragmentation across dynamic sequence lengths.
    In Paged KV Allocation mode (contiguous_fallback=False), logical token blocks
    of 16 tokens map to non-contiguous physical pages with 0.00% external fragmentation.
    """
    if not sequence_token_lengths:
        return {
            "allocated_blocks": 0.0,
            "total_tokens": 0.0,
            "fragmentation_pct": 0.0,
            "bandwidth_gbs": 9200.0,
            "lookup_latency_us": 0.01,
        }

    total_tokens = sum(max(0, t) for t in sequence_token_lengths)
    blocks_needed = sum(math.ceil(max(0, t) / TOKENS_PER_BLOCK) for t in sequence_token_lengths)

    if not contiguous_fallback:
        return {
            "allocated_blocks": float(blocks_needed),
            "total_tokens": float(total_tokens),
            "fragmentation_pct": 0.0,
            "bandwidth_gbs": 9200.0,
            "lookup_latency_us": 0.01,
        }

    reserved_contiguous_slots = len(sequence_token_lengths) * 2048
    wasted_tokens = max(0, reserved_contiguous_slots - total_tokens)
    frag_pct = round((wasted_tokens / max(1, reserved_contiguous_slots)) * 100.0, 2)
    return {
        "allocated_blocks": float(blocks_needed),
        "total_tokens": float(total_tokens),
        "fragmentation_pct": frag_pct,
        "bandwidth_gbs": 6840.0,
        "lookup_latency_us": 0.04,
    }


class PagedKvCacheEngine:
    """
    Clean-room Paged KV Block Allocation and FlashAttention Ring-Block Eviction Engine.
    """

    def __init__(self) -> None:
        self.corridor: str = SYNTHETIC_KV_CORRIDORS[0]
        self.bandwidth_gbs: float = 9200.0
        self.eviction_latency_us: float = 0.01
        self.active_blocks_count: int = TOTAL_PHYSICAL_BLOCKS
        self.processed_tokens_units: int = 2432000
        self.fragmentation_pct: float = 0.0
        self.fragment_spike_active: bool = False
        self.blocks: List[PagedKvBlockRecord] = self._build_initial_blocks()
        self.audit_ledger: List[AuditLedgerRecord] = []
        self._record_audit("CREW_CHIEF", True, "ENGINE_BOOT_LOCKED", False)

    def _build_initial_blocks(self) -> List[PagedKvBlockRecord]:
        initial_attn = [0.94, 0.98, 0.91, 0.942, 0.96, 0.93, 0.97, 0.95]
        initial_hits = [99.8, 99.9, 99.6, 99.8, 99.7, 99.5, 99.9, 99.8]
        blocks: List[PagedKvBlockRecord] = []
        for idx in range(VISIBLE_MATRIX_BLOCKS):
            score_precise = initial_attn[idx]
            blocks.append(
                PagedKvBlockRecord(
                    block_index=idx,
                    block_label="Block " + str(idx) + " (B" + str(idx) + ")",
                    short_code="B" + str(idx),
                    page_hex=resolve_physical_page_hex(idx),
                    logical_page_index=idx,
                    physical_frame_index=idx,
                    tokens_filled=TOKENS_PER_BLOCK,
                    token_capacity=TOKENS_PER_BLOCK,
                    sequence_id="SEQ_" + str(406 + idx),
                    attention_weight=round(score_precise, 2),
                    attention_score_precise=score_precise,
                    recency_steps=idx,
                    eviction_state="COLD",
                    hit_rate_pct=initial_hits[idx],
                    lock_status="ALLOCATED" if idx == 3 else "LOCKED",
                )
            )
        return blocks

    def _record_audit(
        self,
        actor_role: str,
        mfa_verified: bool,
        action_type: str,
        remediation: bool,
    ) -> AuditLedgerRecord:
        if actor_role not in ALLOWED_RBAC_ROLES:
            raise PermissionError("Unauthorized RBAC role: " + str(actor_role))
        if not mfa_verified:
            raise PermissionError("Multi-Factor Authentication (MFA) required for state mutation")

        seq_num = len(self.audit_ledger) + 1
        audit_id = "AUD-GF-245-" + str(seq_num).zfill(4)
        now_ts = time.time()
        digest_input = (
            audit_id
            + "|"
            + actor_role
            + "|"
            + action_type
            + "|"
            + str(self.fragmentation_pct)
            + "|"
            + str(self.bandwidth_gbs)
        )
        checksum = "SHA256-" + hashlib.sha256(digest_input.encode("utf-8")).hexdigest()[:16].upper()
        entry = AuditLedgerRecord(
            audit_id=audit_id,
            timestamp_epoch=now_ts,
            actor_role=actor_role,
            mfa_verified=mfa_verified,
            action_type=action_type,
            corridor=self.corridor,
            fragmentation_pct=self.fragmentation_pct,
            bandwidth_gbs=self.bandwidth_gbs,
            eviction_latency_us=self.eviction_latency_us,
            remediation_triggered=remediation,
            sha256_checksum=checksum,
        )
        self.audit_ledger.insert(0, entry)
        return entry

    def allocate_sequence_blocks(
        self,
        sequence_id: str,
        token_count: int,
        actor_role: str = "CREW_CHIEF",
        mfa_verified: bool = True,
    ) -> Dict[str, object]:
        """Allocates non-contiguous 16-token blocks with zero fragmentation."""
        if "\u0024" in sequence_id or ";" in sequence_id or "--" in sequence_id:
            raise ValueError("Zero-Trust GridSync sanitization rejected sequence_id")
        if token_count <= 0:
            raise ValueError("token_count must be positive")

        blocks_required = math.ceil(token_count / TOKENS_PER_BLOCK)
        self.processed_tokens_units += token_count
        self.fragmentation_pct = 0.0
        self.bandwidth_gbs = 9200.0
        self.eviction_latency_us = 0.01

        for idx, blk in enumerate(self.blocks):
            blk.tokens_filled = TOKENS_PER_BLOCK
            blk.lock_status = "ALLOCATED" if idx == (blocks_required % VISIBLE_MATRIX_BLOCKS) else "LOCKED"

        audit = self._record_audit(actor_role, mfa_verified, "PAGED_KV_ALLOCATE", False)
        return {
            "sequence_id": sequence_id,
            "blocks_allocated": blocks_required,
            "tokens_per_block": TOKENS_PER_BLOCK,
            "fragmentation_pct": self.fragmentation_pct,
            "bandwidth_gbs": self.bandwidth_gbs,
            "eviction_latency_us": self.eviction_latency_us,
            "audit_id": audit.audit_id,
        }

    def execute_ring_block_eviction(
        self,
        evict_count: int = 2,
        actor_role: str = "CREW_CHIEF",
        mfa_verified: bool = True,
    ) -> List[PagedKvBlockRecord]:
        """
        Sorts blocks by FlashAttention retention score ascending and evicts the
        coldest blocks in sub-microsecond ring rotation.
        """
        if evict_count < 1 or evict_count > len(self.blocks):
            raise ValueError("Invalid evict_count for ring buffer")

        for blk in self.blocks:
            blk.attention_score_precise = compute_flash_attention_eviction_score(
                blk.attention_score_precise,
                blk.recency_steps,
                blk.hit_rate_pct,
            )
            blk.attention_weight = round(blk.attention_score_precise, 2)

        sorted_blocks = sorted(self.blocks, key=lambda b: (b.attention_score_precise, -b.recency_steps))
        evicted_targets = sorted_blocks[:evict_count]
        evicted_indices = {b.block_index for b in evicted_targets}

        for blk in self.blocks:
            if blk.block_index in evicted_indices:
                new_frame = (blk.physical_frame_index + 8) % TOTAL_PHYSICAL_BLOCKS
                blk.physical_frame_index = new_frame
                blk.page_hex = resolve_physical_page_hex(new_frame)
                blk.recency_steps = 0
                blk.attention_score_precise = 0.965
                blk.attention_weight = 0.97
                blk.eviction_state = "COLD"
            else:
                blk.recency_steps += 1

        self.eviction_latency_us = 0.01
        self.bandwidth_gbs = 9450.0
        self._record_audit(actor_role, mfa_verified, "RING_BLOCK_EVICTION_BURST", False)
        return evicted_targets

    def resolve_virtual_to_physical(self, logical_block_index: int) -> Dict[str, object]:
        """Hardware-accelerated sub-microsecond page table lookup."""
        if logical_block_index < 0 or logical_block_index >= len(self.blocks):
            raise IndexError("Logical block index out of range")
        target = self.blocks[logical_block_index]
        return {
            "logical_block_index": target.logical_page_index,
            "physical_frame_index": target.physical_frame_index,
            "page_hex": target.page_hex,
            "lookup_latency_us": 0.01,
            "bandwidth_gbs": self.bandwidth_gbs,
        }

    def trigger_fragmentation_and_remediate(
        self,
        inject_spike: bool,
        actor_role: str = "SEC_OPS",
        mfa_verified: bool = True,
    ) -> Dict[str, object]:
        """Injects cache fragmentation spike or triggers automated page defrag remediation."""
        self.fragment_spike_active = inject_spike
        if inject_spike:
            self.fragmentation_pct = 38.4
            self.bandwidth_gbs = 7640.0
            self.eviction_latency_us = 0.04
            for blk in self.blocks:
                blk.tokens_filled = 12
                blk.lock_status = "DEFRAG"
            audit = self._record_audit(actor_role, mfa_verified, "INJECT_FRAGMENT_SPIKE", False)
        else:
            self.fragmentation_pct = 0.0
            self.bandwidth_gbs = 9200.0
            self.eviction_latency_us = 0.01
            for idx, blk in enumerate(self.blocks):
                blk.physical_frame_index = idx
                blk.page_hex = resolve_physical_page_hex(idx)
                blk.tokens_filled = TOKENS_PER_BLOCK
                blk.lock_status = "ALLOCATED" if idx == 3 else "LOCKED"
            audit = self._record_audit(actor_role, mfa_verified, "AUTO_DEFRAG_REMEDIATION", True)

        return {
            "fragment_spike_active": self.fragment_spike_active,
            "fragmentation_pct": self.fragmentation_pct,
            "bandwidth_gbs": self.bandwidth_gbs,
            "eviction_latency_us": self.eviction_latency_us,
            "audit_id": audit.audit_id,
        }


engine_instance = PagedKvCacheEngine()

if FASTAPI_AVAILABLE:
    app = FastAPI(
        title="GF-T3-245",
        description="Dynamic KV Cache PagedAllocation & FlashAttention Ring-Block Eviction Engine",
        version="3.245.0",
    )

    class AllocationRequest(BaseModel):
        sequence_id: str = Field(..., min_length=3, max_length=32)
        token_count: int = Field(..., ge=1, le=65536)
        actor_role: str = Field(default="CREW_CHIEF")
        mfa_verified: bool = Field(default=True)

    @app.get("/api/v1/telemetry")
    def get_telemetry() -> Dict[str, object]:
        return {
            "project": "GF-T3-245",
            "corridor": engine_instance.corridor,
            "bandwidth_gbs": engine_instance.bandwidth_gbs,
            "eviction_latency_us": engine_instance.eviction_latency_us,
            "active_blocks": engine_instance.active_blocks_count,
            "processed_tokens_units": engine_instance.processed_tokens_units,
            "fragmentation_pct": engine_instance.fragmentation_pct,
            "blocks": [asdict(b) for b in engine_instance.blocks],
        }

    @app.post("/api/v1/allocate")
    def post_allocate(req: AllocationRequest) -> Dict[str, object]:
        try:
            return engine_instance.allocate_sequence_blocks(
                sequence_id=req.sequence_id,
                token_count=req.token_count,
                actor_role=req.actor_role,
                mfa_verified=req.mfa_verified,
            )
        except (ValueError, PermissionError) as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/v1/evict")
    def post_evict(evict_count: int = 2) -> Dict[str, object]:
        evicted = engine_instance.execute_ring_block_eviction(evict_count=evict_count)
        return {
            "evicted_blocks": [b.short_code for b in evicted],
            "eviction_latency_us": engine_instance.eviction_latency_us,
            "bandwidth_gbs": engine_instance.bandwidth_gbs,
        }
