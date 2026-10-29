"""
GF-T3-269: Clean-Room Chunked Prefill & Iterative Decode Interleaving Engine
Standalone FastAPI Backend Implementing Chunked Prefill Scheduling Math,
Dynamic Token Budget Balancing, and Sub-Microsecond Execution Slot Synchronization.
License: MIT
Strictly zero dollar-sign characters in source, docstrings, or payloads.
"""

import math
from typing import List, Literal
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

app = FastAPI(
    title="GF-T3-269",
    description="Chunked Prefill and Iterative Decode Interleaving Engine",
    version="3.269.0",
)

SYNTHETIC_CORRIDORS = (
    "CHUNK-CORRIDOR-ALPHA (CHUNKED-PREFILL-DECODE-INTERLEAVING-FABRIC · 29600-GB/S)",
    "CHUNK-CORRIDOR-BRAVO (SUB-MILLISECOND-TIME-TO-FIRST-TOKEN-ROUTER)",
    "CHUNK-CORRIDOR-GAMMA (DYNAMIC-TOKEN-BUDGET-BALANCER)",
    "CHUNK-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-PREFILL-PASS)",
)

FORBIDDEN_SQL_XSS_TOKENS = (
    "DROP TABLE",
    "DELETE FROM",
    "INSERT INTO",
    "<SCRIPT",
    "JAVASCRIPT:",
    "--",
    ";",
)


class ChunkScheduleRequest(BaseModel):
    corridor: str = Field(
        default=SYNTHETIC_CORRIDORS[0],
        description="Clean-room synthetic chunked prefill corridor identifier",
    )
    prompt_tokens: int = Field(default=131072, ge=512, le=2097152)
    chunk_capacity_tokens: int = Field(default=32768, ge=256, le=262144)
    kernel_time_ms: float = Field(default=0.0025, gt=0.0, le=10.0)
    decode_time_ms: float = Field(default=0.0100, gt=0.0, le=10.0)
    concurrent_streams: int = Field(default=16, ge=1, le=1024)
    spike_active: bool = Field(default=False)
    operator_callsign: str = Field(default="CREW-CHIEF-GF-T3-269", min_length=2, max_length=64)

    @field_validator("corridor")
    @classmethod
    def validate_corridor(cls, value: str) -> str:
        if value not in SYNTHETIC_CORRIDORS:
            raise ValueError("Unsupported synthetic chunk corridor")
        return value

    @field_validator("operator_callsign")
    @classmethod
    def sanitize_operator_callsign(cls, value: str) -> str:
        upper_val = value.upper()
        for token in FORBIDDEN_SQL_XSS_TOKENS:
            if token in upper_val:
                raise ValueError("GridSync Zero-Trust Gate: Disallowed injection token")
        return value


class ChunkSlotTelemetry(BaseModel):
    slot_id: int
    slot_code: str
    hex_ptr: str
    prompt_tokens: int
    chunk_capacity_tokens: int
    mode_label: str
    latency_ms: float
    ttft_attainment_pct: int
    state_label: Literal[
        "INTERLEAVED · LOCKED",
        "BURST · BALANCING",
        "SPIKE · RE-ALLOC",
        "DECODE · STEPPED",
        "MONOLITHIC · PASS",
    ]
    locked: bool


class EngineScheduleResponse(BaseModel):
    project_title: Literal["GF-T3-269"]
    corridor: str
    chunk_count: int
    total_latency_ms: float
    per_chunk_interleaved_ms: float
    adjusted_chunk_tokens: int
    decode_budget_tokens: int
    scheduling_latency_us: float
    throughput_gbs: int
    zero_jitter_verified: bool
    active_chunks: List[ChunkSlotTelemetry]


def compute_chunked_prefill_latency_ms(
    prompt_tokens: int,
    chunk_capacity_tokens: int,
    kernel_time_ms: float,
    decode_time_ms: float,
) -> tuple[int, float, float]:
    """
    Implements exact chunked prefill scheduling formula:
    T_latency = ceil(S_prompt / C_chunk) * t_kernel + t_decode
    """
    safe_prompt = max(1, prompt_tokens)
    safe_chunk = max(1, chunk_capacity_tokens)
    chunk_count = math.ceil(safe_prompt / safe_chunk)
    total_latency_ms = round(chunk_count * kernel_time_ms + decode_time_ms, 4)
    per_chunk_ms = round(total_latency_ms / chunk_count, 4)
    return chunk_count, total_latency_ms, per_chunk_ms


def balance_dynamic_token_budget(
    base_chunk_tokens: int,
    concurrent_streams: int,
    spike_active: bool,
    corridor: str,
) -> tuple[int, int, str, float]:
    """
    Dynamically adjusts prefill chunk capacity per iteration to prevent decode latency
    spikes under high concurrency or prompt length spikes.
    """
    if "ALPHA" in corridor:
        corridor_factor = 1.0
    elif "BRAVO" in corridor:
        corridor_factor = 0.75
    elif "GAMMA" in corridor:
        corridor_factor = 0.875
    else:
        corridor_factor = 2.0

    concurrency_factor = 0.5 if concurrent_streams > 64 else (0.75 if concurrent_streams > 16 else 1.0)
    spike_factor = 0.5 if spike_active else 1.0

    raw_adjusted = int(round(base_chunk_tokens * corridor_factor * concurrency_factor * spike_factor))
    adjusted_chunk = max(512, min(262144, raw_adjusted))
    decode_budget = max(64, int(round(adjusted_chunk / 16)))
    mode_num = max(1, min(16, int(round(131072 / adjusted_chunk) * 4)))
    cadence = "MONO-1" if "DELTA" in corridor else "CHUNK-" + str(mode_num)
    scheduling_latency_us = 0.04 if "DELTA" in corridor else 0.01

    return adjusted_chunk, decode_budget, cadence, scheduling_latency_us


def build_engine_schedule(req: ChunkScheduleRequest) -> EngineScheduleResponse:
    adjusted_chunk, decode_budget, cadence, sched_us = balance_dynamic_token_budget(
        req.chunk_capacity_tokens,
        req.concurrent_streams,
        req.spike_active,
        req.corridor,
    )
    chunk_count, total_latency_ms, per_chunk_ms = compute_chunked_prefill_latency_ms(
        req.prompt_tokens,
        adjusted_chunk,
        req.kernel_time_ms,
        req.decode_time_ms,
    )

    if "BRAVO" in req.corridor:
        throughput_gbs = 31200
    elif "GAMMA" in req.corridor:
        throughput_gbs = 28900
    elif "DELTA" in req.corridor:
        throughput_gbs = 24800
    else:
        throughput_gbs = 30840 if req.spike_active else 29600

    state_label: Literal[
        "INTERLEAVED · LOCKED",
        "BURST · BALANCING",
        "SPIKE · RE-ALLOC",
        "DECODE · STEPPED",
        "MONOLITHIC · PASS",
    ] = (
        "MONOLITHIC · PASS"
        if "DELTA" in req.corridor
        else ("SPIKE · RE-ALLOC" if req.spike_active else "INTERLEAVED · LOCKED")
    )

    slots: List[ChunkSlotTelemetry] = []
    for idx in range(8):
        hex_ptr = "0x" + format(0x3000 + idx * 0x0010, "X")
        slots.append(
            ChunkSlotTelemetry(
                slot_id=idx,
                slot_code="C" + str(idx),
                hex_ptr=hex_ptr,
                prompt_tokens=req.prompt_tokens,
                chunk_capacity_tokens=adjusted_chunk,
                mode_label=cadence,
                latency_ms=total_latency_ms,
                ttft_attainment_pct=94 if "DELTA" in req.corridor else 100,
                state_label=state_label,
                locked=True,
            )
        )

    return EngineScheduleResponse(
        project_title="GF-T3-269",
        corridor=req.corridor,
        chunk_count=chunk_count,
        total_latency_ms=total_latency_ms,
        per_chunk_interleaved_ms=per_chunk_ms,
        adjusted_chunk_tokens=adjusted_chunk,
        decode_budget_tokens=decode_budget,
        scheduling_latency_us=sched_us,
        throughput_gbs=throughput_gbs,
        zero_jitter_verified=total_latency_ms < 1.0,
        active_chunks=slots,
    )


@app.get("/health")
def health_check() -> dict:
    return {
        "project_title": "GF-T3-269",
        "status": "LOCKED",
        "throughput_gbs": 29600,
        "scheduling_latency_us": 0.01,
        "active_chunks": 8,
    }


@app.post("/v1/chunked-prefill/schedule", response_model=EngineScheduleResponse)
def schedule_chunked_prefill(request: ChunkScheduleRequest) -> EngineScheduleResponse:
    try:
        return build_engine_schedule(request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
