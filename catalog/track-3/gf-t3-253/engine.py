"""
GF-T3-253 Standalone Backend Engine
Continuous In-Flight Batching and PagedAttention Dynamic Memory Fabric
Clean-Room MIT Implementation - Zero Proprietary Marks - Zero Dollar Gate Enforced
"""

from typing import Dict, List, Optional
from dataclasses import dataclass, field
import math
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator


SYNTHETIC_CORRIDORS: Dict[str, Dict[str, object]] = {
    "PAGED-CORRIDOR-ALPHA (CONTINUOUS-IN-FLIGHT-BATCHING-FABRIC · 15200-GB/S)": {
        "corridor_id": "PAGED-CORRIDOR-ALPHA",
        "label": "PAGED-CORRIDOR-ALPHA (CONTINUOUS-IN-FLIGHT-BATCHING-FABRIC · 15200-GB/S)",
        "base_throughput_gbs": 15200.0,
        "cache_latency_us": 0.01,
        "base_frag_pct": 0.0,
        "block_capacity_tokens": 16,
        "paged_enabled": True,
    },
    "PAGED-CORRIDOR-BRAVO (PAGED-ATTENTION-VIRTUAL-MEMORY-MAP)": {
        "corridor_id": "PAGED-CORRIDOR-BRAVO",
        "label": "PAGED-CORRIDOR-BRAVO (PAGED-ATTENTION-VIRTUAL-MEMORY-MAP)",
        "base_throughput_gbs": 14850.0,
        "cache_latency_us": 0.01,
        "base_frag_pct": 0.0,
        "block_capacity_tokens": 16,
        "paged_enabled": True,
    },
    "PAGED-CORRIDOR-GAMMA (ZERO-WASTE-BLOCK-ALLOCATION-ENGINE)": {
        "corridor_id": "PAGED-CORRIDOR-GAMMA",
        "label": "PAGED-CORRIDOR-GAMMA (ZERO-WASTE-BLOCK-ALLOCATION-ENGINE)",
        "base_throughput_gbs": 15640.0,
        "cache_latency_us": 0.01,
        "base_frag_pct": 0.0,
        "block_capacity_tokens": 16,
        "paged_enabled": True,
    },
    "PAGED-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-KV-CACHE)": {
        "corridor_id": "PAGED-CORRIDOR-DELTA",
        "label": "PAGED-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-KV-CACHE)",
        "base_throughput_gbs": 6400.0,
        "cache_latency_us": 0.42,
        "base_frag_pct": 38.5,
        "block_capacity_tokens": 16,
        "paged_enabled": False,
    },
}


FORBIDDEN_PROPRIETARY_TOKENS = (
    "vllm",
    "sglang",
    "radixattention",
    "tensorrt_llm_proprietary",
)


def scrub_zero_trust_input(raw_value: str) -> str:
    """GridSync zero-trust ingress sanitizer against SQLi, XSS, and forbidden glyphs."""
    if not isinstance(raw_value, str):
        raise ValueError("Ingress payload must be a valid string")
    if chr(36) in raw_value:
        raise ValueError("Zero-currency gate violation: forbidden currency glyph detected")
    lowered = raw_value.lower()
    for pattern in ("<script", "drop table", "--", ";--", "union select"):
        if pattern in lowered:
            raise ValueError("GridSync security gate rejected potentially malicious payload")
    for mark in FORBIDDEN_PROPRIETARY_TOKENS:
        if mark in lowered:
            raise ValueError("Clean-room IP gate rejected proprietary mark")
    return raw_value.strip()


@dataclass
class PhysicalKVBlock:
    block_index: int
    block_id: str
    hex_ptr: str
    capacity_tokens: int = 16
    allocated_tokens: int = 16
    ref_count: int = 4
    fragmentation_pct: float = 0.0
    latency_ms: float = 0.08
    state: str = "ALLOCATED"
    locked: bool = True
    virtual_pages: List[str] = field(default_factory=list)

    def compute_internal_fragmentation(self, spike_active: bool, monolithic_fallback: bool) -> float:
        if self.state == "FREE":
            return 0.0
        if spike_active:
            return round(14.5 + (self.block_index % 3) * 4.25, 2)
        if monolithic_fallback:
            unused = max(0, self.capacity_tokens - self.allocated_tokens)
            base_waste = (unused / float(self.capacity_tokens)) * 100.0
            return round(max(24.0, base_waste + 24.0), 2)
        # PagedAttention eliminates external fragmentation and bounds internal waste to 0.0% on full blocks
        unused = max(0, self.capacity_tokens - self.allocated_tokens)
        return round((unused / float(self.capacity_tokens)) * 100.0, 2)


@dataclass
class InFlightSequence:
    sequence_id: str
    prompt_tokens: int
    generated_tokens: int
    max_tokens: int
    virtual_block_ids: List[int]
    physical_block_table: List[int]
    status: str = "IN_FLIGHT"


class PagedAttentionFabricEngine:
    """
    Deterministic PagedAttention Virtual Memory Mapper and Continuous In-Flight Batching Scheduler.
    """

    def __init__(self) -> None:
        self.active_corridor: str = (
            "PAGED-CORRIDOR-ALPHA (CONTINUOUS-IN-FLIGHT-BATCHING-FABRIC · 15200-GB/S)"
        )
        self.block_capacity: int = 16
        self.num_blocks: int = 8
        self.fragmentation_spike: bool = False
        self.processed_tokens: int = 3456000
        self.engine_xp: int = 75000
        self.iteration_step: int = 1
        self.blocks: List[PhysicalKVBlock] = []
        self.sequences: List[InFlightSequence] = []
        self._init_blocks_and_sequences()

    def _init_blocks_and_sequences(self) -> None:
        self.blocks = []
        for idx in range(self.num_blocks):
            ptr_val = 0x2000 + (idx * 0x0100)
            hex_ptr = f"0x{ptr_val:04X}"
            v_pages = [f"VP-{idx * 2:02d}", f"VP-{idx * 2 + 1:02d}"]
            self.blocks.append(
                PhysicalKVBlock(
                    block_index=idx,
                    block_id=f"B{idx}",
                    hex_ptr=hex_ptr,
                    capacity_tokens=16,
                    allocated_tokens=16,
                    ref_count=4,
                    fragmentation_pct=0.0,
                    latency_ms=0.08,
                    state="ALLOCATED",
                    locked=True,
                    virtual_pages=v_pages,
                )
            )
        self.sequences = [
            InFlightSequence(
                sequence_id="SEQ-ALPHA-101",
                prompt_tokens=32,
                generated_tokens=16,
                max_tokens=64,
                virtual_block_ids=[0, 1, 2],
                physical_block_table=[0, 1, 2],
                status="IN_FLIGHT",
            ),
            InFlightSequence(
                sequence_id="SEQ-BRAVO-102",
                prompt_tokens=32,
                generated_tokens=16,
                max_tokens=64,
                virtual_block_ids=[0, 1, 2],
                physical_block_table=[3, 4, 5],
                status="IN_FLIGHT",
            ),
            InFlightSequence(
                sequence_id="SEQ-GAMMA-103",
                prompt_tokens=16,
                generated_tokens=16,
                max_tokens=48,
                virtual_block_ids=[0, 1],
                physical_block_table=[6, 7],
                status="IN_FLIGHT",
            ),
        ]

    def set_corridor(self, corridor_name: str) -> Dict[str, object]:
        clean_name = scrub_zero_trust_input(corridor_name)
        if clean_name not in SYNTHETIC_CORRIDORS:
            raise ValueError(f"Unknown synthetic corridor: {clean_name}")
        self.active_corridor = clean_name
        spec = SYNTHETIC_CORRIDORS[clean_name]
        is_monolithic = not bool(spec["paged_enabled"])
        for blk in self.blocks:
            if blk.state == "ALLOCATED":
                blk.fragmentation_pct = blk.compute_internal_fragmentation(
                    self.fragmentation_spike, is_monolithic
                )
                blk.latency_ms = 0.42 if is_monolithic else (0.24 if self.fragmentation_spike else 0.08)
        return self.get_telemetry_snapshot()

    def translate_virtual_to_physical(self, sequence_id: str, virtual_block_idx: int) -> Dict[str, object]:
        clean_seq = scrub_zero_trust_input(sequence_id)
        if virtual_block_idx < 0:
            raise ValueError("Virtual block index must be non-negative")
        for seq in self.sequences:
            if seq.sequence_id == clean_seq:
                if virtual_block_idx >= len(seq.physical_block_table):
                    raise ValueError("Virtual block index out of range for sequence")
                phys_idx = seq.physical_block_table[virtual_block_idx]
                phys_block = self.blocks[phys_idx]
                return {
                    "sequence_id": seq.sequence_id,
                    "virtual_block_idx": virtual_block_idx,
                    "physical_block_id": phys_block.block_id,
                    "physical_block_index": phys_idx,
                    "hex_ptr": phys_block.hex_ptr,
                    "ref_count": phys_block.ref_count,
                    "allocated_tokens": phys_block.allocated_tokens,
                }
        raise ValueError(f"Sequence not found: {clean_seq}")

    def trigger_paged_batch_burst(self, new_requests: int = 4) -> Dict[str, object]:
        if new_requests < 1 or new_requests > 64:
            raise ValueError("new_requests must be between 1 and 64")
        self.iteration_step += 1
        for blk in self.blocks:
            blk.state = "ALLOCATED"
            blk.locked = True
            blk.allocated_tokens = 16
            blk.ref_count = min(16, blk.ref_count + 1)
            blk.fragmentation_pct = 0.0 if not self.fragmentation_spike else blk.fragmentation_pct
        added_tokens = new_requests * 16 * self.num_blocks * 125
        self.processed_tokens += added_tokens
        self.engine_xp += new_requests * 2500
        new_seq_id = f"SEQ-BURST-{100 + self.iteration_step}"
        self.sequences.append(
            InFlightSequence(
                sequence_id=new_seq_id,
                prompt_tokens=32,
                generated_tokens=16,
                max_tokens=64,
                virtual_block_ids=[0, 1],
                physical_block_table=[
                    self.iteration_step % self.num_blocks,
                    (self.iteration_step + 1) % self.num_blocks,
                ],
                status="IN_FLIGHT",
            )
        )
        return self.get_telemetry_snapshot()

    def toggle_fragmentation_spike(self) -> Dict[str, object]:
        self.fragmentation_spike = not self.fragmentation_spike
        for blk in self.blocks:
            if self.fragmentation_spike:
                blk.fragmentation_pct = round(14.5 + (blk.block_index % 3) * 4.25, 2)
                blk.latency_ms = 0.29
                blk.state = "FRAGMENTED" if blk.block_index % 2 == 1 else "ALLOCATED"
                blk.locked = blk.block_index % 2 == 0
            else:
                blk.fragmentation_pct = 0.0
                blk.latency_ms = 0.08
                blk.state = "ALLOCATED"
                blk.locked = True
                blk.allocated_tokens = 16
        return self.get_telemetry_snapshot()

    def step_paged_attention_pass(self) -> Dict[str, object]:
        """
        Executes a single continuous in-flight decoding iteration:
        - Advances token generation across active sequences
        - Retires completed sequences immediately without waiting for batch completion
        - Inserts ready sequences into freed physicalKV blocks
        - Defragments any spiked blocks via block table remapping
        """
        self.iteration_step += 1
        self.fragmentation_spike = False
        retired_count = 0
        active_Load: List[InFlightSequence] = []
        for seq in self.sequences:
            seq.generated_tokens += 16
            if seq.prompt_tokens + seq.generated_tokens >= seq.max_tokens:
                seq.status = "RETIRED"
                retired_count += 1
            else:
                active_Load.append(seq)

        # Immediately insert replacement in-flight sequence so GPU batch slots stay 100% saturated
        while len(active_Load) < 3:
            replacement_idx = self.iteration_step + len(active_Load)
            active_Load.append(
                InFlightSequence(
                    sequence_id=f"SEQ-INFLIGHT-{replacement_idx:03d}",
                    prompt_tokens=16,
                    generated_tokens=16,
                    max_tokens=64,
                    virtual_block_ids=[0, 1],
                    physical_block_table=[
                        replacement_idx % self.num_blocks,
                        (replacement_idx + 1) % self.num_blocks,
                    ],
                    status="IN_FLIGHT",
                )
            )
        self.sequences = active_Load

        for blk in self.blocks:
            blk.state = "ALLOCATED"
            blk.locked = True
            blk.allocated_tokens = 16
            blk.fragmentation_pct = 0.0
            blk.latency_ms = 0.08

        self.processed_tokens += 64000
        self.engine_xp += 5000
        snapshot = self.get_telemetry_snapshot()
        snapshot["retired_sequences_in_step"] = retired_count
        return snapshot

    def flush_kv_cache_buffers(self) -> Dict[str, object]:
        """Re-zeros physical block tables and restores clean baseline state."""
        self.fragmentation_spike = False
        self.iteration_step = 1
        self.processed_tokens = 3456000
        self.engine_xp = 75000
        self._init_blocks_and_sequences()
        return self.get_telemetry_snapshot()

    def compute_attention_vector(self) -> List[float]:
        base = [1.51, 1.55, 1.52, 1.54]
        if self.fragmentation_spike:
            return [1.18, 1.24, 1.15, 1.21]
        offset = ((self.iteration_step - 1) % 4) * 0.01
        return [round(val + offset, 2) for val in base]

    def get_telemetry_snapshot(self) -> Dict[str, object]:
        spec = SYNTHETIC_CORRIDORS[self.active_corridor]
        base_tp = float(spec["base_throughput_gbs"])
        avg_frag = sum(b.fragmentation_pct for b in self.blocks) / float(len(self.blocks))
        effective_tp = round(base_tp * (1.0 - (avg_frag / 200.0)), 1)
        allocated_blocks = sum(1 for b in self.blocks if b.state == "ALLOCATED")
        cache_lat_us = 0.19 if self.fragmentation_spike else float(spec["cache_latency_us"])
        batch_state = "FragAlert" if self.fragmentation_spike else "PagedActive"

        return {
            "project_id": "GF-T3-253",
            "corridor": self.active_corridor,
            "batch_throughput_gbs": effective_tp,
            "cache_latency_us": cache_lat_us,
            "fragmentation_pct": round(avg_frag, 2),
            "active_blocks": allocated_blocks,
            "total_blocks": self.num_blocks,
            "processed_tokens": self.processed_tokens,
            "engine_xp": self.engine_xp,
            "batch_state": batch_state,
            "iteration_step": self.iteration_step,
            "attention_vector": self.compute_attention_vector(),
            "blocks": [
                {
                    "block_index": b.block_index,
                    "block_id": b.block_id,
                    "hex_ptr": b.hex_ptr,
                    "allocated_tokens": b.allocated_tokens,
                    "capacity_tokens": b.capacity_tokens,
                    "ref_count": b.ref_count,
                    "fragmentation_pct": b.fragmentation_pct,
                    "latency_ms": b.latency_ms,
                    "state": b.state,
                    "locked": b.locked,
                    "virtual_pages": b.virtual_pages,
                }
                for b in self.blocks
            ],
            "in_flight_sequences": [
                {
                    "sequence_id": s.sequence_id,
                    "prompt_tokens": s.prompt_tokens,
                    "generated_tokens": s.generated_tokens,
                    "max_tokens": s.max_tokens,
                    "virtual_block_ids": s.virtual_block_ids,
                    "physical_block_table": s.physical_block_table,
                    "status": s.status,
                }
                for s in self.sequences
            ],
        }


app = FastAPI(
    title="GF-T3-253",
    description="Continuous In-Flight Batching and PagedAttention Dynamic Memory Fabric",
    version="3.253.0",
)

fabric_engine = PagedAttentionFabricEngine()


class CorridorSwitchPayload(BaseModel):
    corridor: str = Field(..., min_length=3, max_length=160)

    @field_validator("corridor")
    @classmethod
    def validate_clean_corridor(cls, v: str) -> str:
        return scrub_zero_trust_input(v)


class BatchBurstPayload(BaseModel):
    new_requests: int = Field(default=4, ge=1, le=64)


class BlockTranslationQuery(BaseModel):
    sequence_id: str
    virtual_block_idx: int = Field(ge=0, le=128)

    @field_validator("sequence_id")
    @classmethod
    def validate_sequence_id(cls, v: str) -> str:
        return scrub_zero_trust_input(v)


@app.get("/api/v1/telemetry")
def get_telemetry() -> Dict[str, object]:
    return fabric_engine.get_telemetry_snapshot()


@app.post("/api/v1/corridor")
def switch_corridor(payload: CorridorSwitchPayload) -> Dict[str, object]:
    try:
        return fabric_engine.set_corridor(payload.corridor)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/v1/burst")
def trigger_burst(payload: BatchBurstPayload) -> Dict[str, object]:
    try:
        return fabric_engine.trigger_paged_batch_burst(payload.new_requests)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/v1/fragmentation-spike")
def toggle_spike() -> Dict[str, object]:
    return fabric_engine.toggle_fragmentation_spike()


@app.post("/api/v1/step")
def step_pipeline() -> Dict[str, object]:
    return fabric_engine.step_paged_attention_pass()


@app.post("/api/v1/flush")
def flush_cache() -> Dict[str, object]:
    return fabric_engine.flush_kv_cache_buffers()


@app.post("/api/v1/translate")
def translate_block(query: BlockTranslationQuery) -> Dict[str, object]:
    try:
        return fabric_engine.translate_virtual_to_physical(
            query.sequence_id, query.virtual_block_idx
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
