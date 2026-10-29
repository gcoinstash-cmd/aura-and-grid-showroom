"""
GF-T3-250 Standalone Backend Engine
Clean-Room Chunked Prefill & Asynchronous Generation Overlap Simulator
License: MIT
"""

from typing import List, Dict, Optional
import math
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

app = FastAPI(
    title="GF-T3-250",
    description="Chunked Prefill · Async Generation Overlap · Zero Stall",
    version="3.250.0",
)

SYNTHETIC_CORRIDORS: List[str] = [
    "PREFILL-CORRIDOR-ALPHA (CHUNKED-PREFILL-DECODE-SPLIT · 13000-GB/S)",
    "PREFILL-CORRIDOR-BRAVO (ASYNCHRONOUS-GENERATION-OVERLAP-PIPELINE)",
    "PREFILL-CORRIDOR-GAMMA (INTERFERENCE-MITIGATION-SCHEDULER)",
    "PREFILL-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-PREFILL)",
]


class ChunkDescriptor(BaseModel):
    chunk_id: int = Field(..., ge=0, le=63)
    label: str
    hex_ptr: str
    token_count: int = Field(..., ge=1, le=65536)
    size_mb: float = Field(..., ge=0.0)
    overlap_pct: float = Field(..., ge=0.0, le=100.0)
    latency_ms: float = Field(..., ge=0.0)
    compute_quanta_share: float = Field(..., ge=0.0, le=1.0)
    decode_interference_us: float = Field(..., ge=0.0)
    pipeline_stage: str
    state: str
    decode_sync: str


class PrefillWorkloadRequest(BaseModel):
    prompt_tokens: int = Field(default=4096, ge=64, le=131072)
    chunk_bound_tokens: int = Field(default=512, ge=64, le=4096)
    active_decode_requests: int = Field(default=64, ge=1, le=1024)
    corridor: str = Field(
        default="PREFILL-CORRIDOR-ALPHA (CHUNKED-PREFILL-DECODE-SPLIT · 13000-GB/S)"
    )
    saturation_fault: bool = Field(default=False)

    @field_validator("corridor")
    @classmethod
    def validate_corridor(cls, value: str) -> str:
        cleaned = value.strip()
        if any(bad in cleaned.lower() for bad in ["drop table", "<script>", "--", ";"]):
            raise ValueError("Invalid characters in corridor identifier")
        if cleaned not in SYNTHETIC_CORRIDORS:
            raise ValueError("Unsupported synthetic prefill corridor")
        return cleaned


class PrefillSimulationResult(BaseModel):
    engine_id: str
    corridor: str
    prefill_throughput_gbs: int
    overlap_latency_us: float
    active_chunks: int
    max_chunks: int
    processed_tokens: int
    prefill_state: str
    overlap_efficiency_pct: float
    zero_stall_verified: bool
    feature_vector: List[float]
    chunks: List[ChunkDescriptor]


def split_prompt_into_bounded_chunks(
    prompt_tokens: int,
    chunk_bound_tokens: int = 512,
    max_chunks: int = 8,
) -> List[int]:
    """
    Splits incoming context prompt tokens into bounded compute chunks to prevent
    decoding generation latency spikes.
    Formula:
      N_chunks = min(max_chunks, ceil(prompt_tokens / chunk_bound_tokens))
      Each chunk receives bounded token allocation C_i <= chunk_bound_tokens
      unless prompt exceeds max_chunks * chunk_bound_tokens (saturation mode).
    """
    if prompt_tokens <= 0:
        raise ValueError("prompt_tokens must be positive")
    if chunk_bound_tokens <= 0:
        raise ValueError("chunk_bound_tokens must be positive")

    required_chunks = math.ceil(prompt_tokens / chunk_bound_tokens)
    num_chunks = min(max_chunks, max(1, required_chunks))

    allocations: List[int] = []
    remaining = prompt_tokens
    for idx in range(num_chunks):
        slots_left = num_chunks - idx
        if remaining <= chunk_bound_tokens * slots_left:
            chunk_tokens = min(chunk_bound_tokens, max(1, remaining))
        else:
            chunk_tokens = math.ceil(remaining / slots_left)
        allocations.append(int(chunk_tokens))
        remaining = max(0, remaining - chunk_tokens)

    return allocations


def compute_async_overlap_metrics(
    chunk_tokens: int,
    chunk_bound_tokens: int,
    active_decode_requests: int,
    corridor: str,
    saturation_fault: bool = False,
) -> Dict[str, float]:
    """
    Computes asynchronous generation overlap percentage, sub-microsecond interference,
    and per-chunk execution latency.
    """
    is_monolithic = "FALLBACK-MONOLITHIC-PREFILL" in corridor
    load_ratio = chunk_tokens / float(max(1, chunk_bound_tokens))
    decode_pressure = min(1.0, active_decode_requests / 512.0)

    if is_monolithic:
        overlap_pct = max(42.0, round(68.5 - (load_ratio * 12.0), 2))
        latency_ms = round(0.85 * load_ratio + 0.35 * decode_pressure, 2)
        interference_us = round(14.2 * load_ratio, 3)
        quanta_share = round(min(0.95, 0.78 + 0.1 * load_ratio), 3)
    elif saturation_fault:
        overlap_pct = round(max(84.2, 92.4 - (load_ratio * 3.1)), 1)
        latency_ms = round(0.28 * load_ratio + 0.08 * decode_pressure, 2)
        interference_us = round(0.42 * load_ratio, 3)
        quanta_share = round(min(0.85, 0.62 + 0.05 * load_ratio), 3)
    else:
        base_overlap = 99.8
        if "INTERFERENCE-MITIGATION" in corridor:
            base_overlap = 99.9
        elif "ASYNCHRONOUS-GENERATION" in corridor:
            base_overlap = 99.85
        penalty = max(0.0, (load_ratio - 1.0) * 1.4)
        overlap_pct = round(max(95.0, base_overlap - penalty), 1)
        latency_ms = round(0.12 * load_ratio, 2)
        interference_us = round(0.01 * load_ratio, 3)
        quanta_share = round(0.50 / max(1.0, load_ratio * 0.5 + 0.5), 3)

    return {
        "overlap_pct": overlap_pct,
        "latency_ms": latency_ms,
        "interference_us": interference_us,
        "quanta_share": quanta_share,
    }


def evaluate_chunked_prefill_pipeline(
    request: PrefillWorkloadRequest,
    step_count: int = 0,
) -> PrefillSimulationResult:
    """
    Executes full chunked prefill splitting, async decode overlap calculation,
    and interference mitigation verification.
    """
    allocations = split_prompt_into_bounded_chunks(
        prompt_tokens=request.prompt_tokens,
        chunk_bound_tokens=request.chunk_bound_tokens,
        max_chunks=8,
    )

    chunks: List[ChunkDescriptor] = []
    for idx in range(8):
        tok = allocations[idx] if idx < len(allocations) else request.chunk_bound_tokens
        metrics = compute_async_overlap_metrics(
            chunk_tokens=tok,
            chunk_bound_tokens=request.chunk_bound_tokens,
            active_decode_requests=request.active_decode_requests,
            corridor=request.corridor,
            saturation_fault=request.saturation_fault,
        )
        size_mb = round((tok * 4096) / (1024 * 1024), 2)
        if size_mb.is_integer():
            size_mb = int(size_mb)

        hex_addr = "0xE" + str(idx) + "00"
        if request.saturation_fault and idx in (2, 5):
            state_str = "RESYNC · FAULT"
            decode_sync = "RESYNC"
            stage = "QUANTA_REBALANCE"
        else:
            state_str = "PIPELINED · LOCKED"
            decode_sync = "OK"
            stage = "TENSOR_OVERLAP_PASS_" + str((idx + step_count) % 4)

        chunks.append(
            ChunkDescriptor(
                chunk_id=idx,
                label="Chunk " + str(idx) + " (C" + str(idx) + ")",
                hex_ptr=hex_addr,
                token_count=tok,
                size_mb=float(size_mb),
                overlap_pct=metrics["overlap_pct"],
                latency_ms=metrics["latency_ms"],
                compute_quanta_share=metrics["quanta_share"],
                decode_interference_us=metrics["interference_us"],
                pipeline_stage=stage,
                state=state_str,
                decode_sync=decode_sync,
            )
        )

    avg_overlap = round(
        sum(c.overlap_pct for c in chunks) / float(len(chunks)), 1
    )
    is_monolithic = "FALLBACK-MONOLITHIC-PREFILL" in request.corridor

    if is_monolithic:
        throughput_gbs = 7400
        overlap_lat_us = 1.45
        prefill_state = "Monolithic Fallback"
        zero_stall = False
    elif request.saturation_fault:
        throughput_gbs = 10850
        overlap_lat_us = 0.09
        prefill_state = "Chunk Resync Active"
        zero_stall = False
    else:
        throughput_gbs = 13000 + (step_count * 120)
        overlap_lat_us = 0.01
        prefill_state = "Chunked Active"
        zero_stall = True

    processed_tokens = 3072000 + (step_count * 50000)
    vec = [
        round(1.22 + (step_count * 0.01), 2),
        round(1.25 + (step_count * 0.01), 2),
        round(1.21 + (step_count * 0.01), 2),
        round(1.23 + (step_count * 0.01), 2),
    ]

    return PrefillSimulationResult(
        engine_id="GF-T3-250",
        corridor=request.corridor,
        prefill_throughput_gbs=throughput_gbs,
        overlap_latency_us=overlap_lat_us,
        active_chunks=len(chunks),
        max_chunks=8,
        processed_tokens=processed_tokens,
        prefill_state=prefill_state,
        overlap_efficiency_pct=avg_overlap,
        zero_stall_verified=zero_stall,
        feature_vector=vec,
        chunks=chunks,
    )


@app.get("/health")
def health_check() -> Dict[str, str]:
    return {
        "engine": "GF-T3-250",
        "status": "LOCKED",
        "mode": "CHUNKED_PREFILL_ASYNC_OVERLAP",
    }


@app.post("/api/v1/prefill/simulate", response_model=PrefillSimulationResult)
def simulate_prefill(payload: PrefillWorkloadRequest) -> PrefillSimulationResult:
    try:
        return evaluate_chunked_prefill_pipeline(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
