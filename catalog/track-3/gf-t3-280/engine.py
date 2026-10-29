"""
GF-T3-280: Track 3 Continuous Paged Attention & Hardware-Accelerated Block Allocation Engine
SPDX-License-Identifier: MIT
Copyright (c) 2026 Aura & Grid Foundry
"""

from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator
import re

app = FastAPI(
    title="GF-T3-280",
    description="Track 3 Continuous Paged Attention and Hardware-Accelerated Block Allocation Engine",
    version="2.8.0",
)

SYNTHETIC_CORRIDORS = [
    "PAGE-CORRIDOR-ALPHA (CONTINUOUS-PAGED-ATTENTION-FABRIC · 38400-GB/S)",
    "PAGE-CORRIDOR-BRAVO (HARDWARE-ACCELERATED-BLOCK-ALLOCATION-ENGINE)",
    "PAGE-CORRIDOR-GAMMA (VIRTUAL-TO-PHYSICAL-PAGE-TABLE-ROUTER)",
    "PAGE-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-KV-PASS)",
]

SANITIZE_PATTERN = re.compile(r"^[A-Za-z0-9_\-\.\s·\(\)/:]+")


class BlockTranslationRequest(BaseModel):
    corridor_id: str = Field(..., min_length=3, max_length=120)
    logical_block_index: int = Field(..., ge=0, le=7)
    page_offset: int = Field(..., ge=0, lt=16)
    block_size_tokens: int = Field(default=16, ge=16, le=256)
    active_sequence_tokens: int = Field(default=262144, ge=16, le=8388608)

    @field_validator("corridor_id")
    @classmethod
    def validate_corridor_clean(cls, value: str) -> str:
        forbidden = ["select ", "insert ", "drop ", "<script", "--", ";"]
        lowered = value.lower()
        for token in forbidden:
            if token in lowered:
                raise ValueError("GridSync Zero-Trust Gate blocked unsafe payload token")
        return value


class PageDescriptor(BaseModel):
    page_id: str
    gear_tag: str
    physical_frame_hex: str
    logical_block_index: int
    tokens_allocated: int
    block_size_tokens: int
    latency_ms: float
    sync_parity_pct: float
    fragmentation_pct: float
    state: str


class EngineTelemetrySnapshot(BaseModel):
    engine_id: str
    corridor: str
    page_throughput_gbs: int
    allocation_latency_us: float
    active_pages_count: int
    total_pages_capacity: int
    processed_tokens_units: int
    engine_xp_delta: int
    paged_state: str
    internal_fragmentation_pct: float
    attention_vector: List[float]
    pages: List[PageDescriptor]


class PagedAttentionAllocator:
    """
    Deterministic Virtual-to-Physical Block Table & Continuous Paged Attention Simulator.
    Implements V_page = BlockTable[LogicalBlock] + PageOffset with zero internal fragmentation.
    """

    def __init__(self, total_pages: int = 8, block_size_tokens: int = 16) -> None:
        self.total_pages = total_pages
        self.block_size_tokens = block_size_tokens
        self.base_physical_addr = 0xE000
        self.frame_stride = 0x0010
        self.corridor = SYNTHETIC_CORRIDORS[0]
        self.fragmentation_spike = False
        self.step_counter = 0
        self.processed_tokens_units = 7296000
        self.block_table: Dict[int, int] = {
            idx: self.base_physical_addr + (idx * self.frame_stride)
            for idx in range(total_pages)
        }
        self.free_frames: List[int] = []
        self.pages: List[PageDescriptor] = self._build_initial_pages()

    def _build_initial_pages(self) -> List[PageDescriptor]:
        items: List[PageDescriptor] = []
        for idx in range(self.total_pages):
            phys_addr = self.block_table[idx]
            items.append(
                PageDescriptor(
                    page_id="Page " + str(idx) + " (G" + str(idx) + ")",
                    gear_tag="G" + str(idx),
                    physical_frame_hex="0x" + format(phys_addr, "04X"),
                    logical_block_index=idx,
                    tokens_allocated=256000,
                    block_size_tokens=self.block_size_tokens,
                    latency_ms=0.02,
                    sync_parity_pct=100.0,
                    fragmentation_pct=0.0,
                    state="PAGED · LOCKED",
                )
            )
        return items

    def translate_virtual_page(self, logical_block: int, page_offset: int) -> Dict[str, object]:
        if logical_block < 0 or logical_block >= self.total_pages:
            raise ValueError("Logical block index out of range")
        if page_offset < 0 or page_offset >= self.block_size_tokens:
            raise ValueError("Page offset exceeds physical block boundary")

        physical_base = self.block_table[logical_block]
        virtual_page_address = physical_base + page_offset
        return {
            "logical_block": logical_block,
            "page_offset": page_offset,
            "physical_base_hex": "0x" + format(physical_base, "04X"),
            "virtual_page_hex": "0x" + format(virtual_page_address, "04X"),
            "virtual_page_int": virtual_page_address,
            "internal_fragmentation_pct": 0.0,
            "formula": "V_page = BlockTable[LogicalBlock] + PageOffset",
        }

    def trigger_paged_burst(self) -> EngineTelemetrySnapshot:
        self.step_counter += 1
        self.processed_tokens_units += 512000
        for idx, page in enumerate(self.pages):
            page.tokens_allocated += 32000
            page.latency_ms = round(max(0.01, 0.02 - (0.001 * (idx % 2))), 3)
            page.sync_parity_pct = 100.0
            page.fragmentation_pct = 0.0
            page.state = "PAGED · LOCKED"
        self.fragmentation_spike = False
        return self.snapshot()

    def inject_fragmentation_spike(self) -> EngineTelemetrySnapshot:
        self.fragmentation_spike = not self.fragmentation_spike
        self.step_counter += 1
        for idx, page in enumerate(self.pages):
            if self.fragmentation_spike and idx in (2, 5):
                page.latency_ms = 0.09
                page.sync_parity_pct = 94.5
                page.fragmentation_pct = 4.2
                page.state = "RE-INDEX · FAULT"
            else:
                reindexed_addr = self.base_physical_addr + (idx * self.frame_stride)
                self.block_table[idx] = reindexed_addr
                page.physical_frame_hex = "0x" + format(reindexed_addr, "04X")
                page.latency_ms = 0.02
                page.sync_parity_pct = 100.0
                page.fragmentation_pct = 0.0
                page.state = "PAGED · LOCKED"
        return self.snapshot()

    def step_block_allocation_pass(self) -> EngineTelemetrySnapshot:
        self.step_counter += 1
        self.processed_tokens_units += 75000
        for idx, page in enumerate(self.pages):
            rotated_slot = (idx + self.step_counter) % self.total_pages
            phys_addr = self.base_physical_addr + (rotated_slot * self.frame_stride)
            self.block_table[idx] = phys_addr
            page.physical_frame_hex = "0x" + format(phys_addr, "04X")
            page.tokens_allocated += 16000
            page.latency_ms = 0.01 if idx % 2 == 0 else 0.02
            page.sync_parity_pct = 100.0
            page.fragmentation_pct = 0.0
            page.state = "PAGED · LOCKED"
        self.fragmentation_spike = False
        return self.snapshot()

    def recycle_sequence_blocks(self, sequence_blocks: List[int]) -> Dict[str, object]:
        recycled_count = 0
        for blk in sequence_blocks:
            if 0 <= blk < self.total_pages:
                phys_addr = self.block_table[blk]
                if phys_addr not in self.free_frames:
                    self.free_frames.append(phys_addr)
                recycled_count += 1
                self.pages[blk].state = "PAGED · LOCKED"
                self.pages[blk].fragmentation_pct = 0.0
        # Immediately re-bind recycled frames to maintain zero-CPU pool readiness
        self.free_frames.clear()
        return {
            "recycled_blocks": recycled_count,
            "cpu_intervention_ms": 0.0,
            "active_pool_pages": self.total_pages,
            "memory_waste_bytes": 0,
        }

    def flush_page_arenas(self) -> EngineTelemetrySnapshot:
        self.step_counter = 0
        self.fragmentation_spike = False
        self.processed_tokens_units = 7296000
        self.block_table = {
            idx: self.base_physical_addr + (idx * self.frame_stride)
            for idx in range(self.total_pages)
        }
        self.pages = self._build_initial_pages()
        return self.snapshot()

    def snapshot(self) -> EngineTelemetrySnapshot:
        active_locked = sum(1 for p in self.pages if "LOCKED" in p.state)
        throughput = 38400 if not self.fragmentation_spike else 31200
        alloc_latency = 0.01 if not self.fragmentation_spike else 0.04
        frag_pct = 0.0 if not self.fragmentation_spike else 1.05
        state_str = "Allocation Active" if not self.fragmentation_spike else "Re-Indexing Page Table"
        vec = [
            round(4.21 + (self.step_counter % 3) * 0.01, 2),
            round(4.25 + (self.step_counter % 2) * 0.01, 2),
            round(4.22 + (self.step_counter % 4) * 0.01, 2),
            round(4.24 + (self.step_counter % 3) * 0.01, 2),
        ]
        return EngineTelemetrySnapshot(
            engine_id="GF-T3-280",
            corridor=self.corridor,
            page_throughput_gbs=throughput,
            allocation_latency_us=alloc_latency,
            active_pages_count=active_locked,
            total_pages_capacity=self.total_pages,
            processed_tokens_units=self.processed_tokens_units,
            engine_xp_delta=75000,
            paged_state=state_str,
            internal_fragmentation_pct=frag_pct,
            attention_vector=vec,
            pages=self.pages,
        )


allocator = PagedAttentionAllocator()


@app.get("/api/v1/telemetry", response_model=EngineTelemetrySnapshot)
def get_telemetry() -> EngineTelemetrySnapshot:
    return allocator.snapshot()


@app.post("/api/v1/translate")
def translate_block(req: BlockTranslationRequest) -> Dict[str, object]:
    try:
        return allocator.translate_virtual_page(req.logical_block_index, req.page_offset)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/v1/actions/{action_name}", response_model=EngineTelemetrySnapshot)
def execute_engine_action(action_name: str) -> EngineTelemetrySnapshot:
    if action_name == "burst":
        return allocator.trigger_paged_burst()
    if action_name == "spike":
        return allocator.inject_fragmentation_spike()
    if action_name == "step":
        return allocator.step_block_allocation_pass()
    if action_name == "flush":
        return allocator.flush_page_arenas()
    raise HTTPException(status_code=404, detail="Unsupported action identifier")
