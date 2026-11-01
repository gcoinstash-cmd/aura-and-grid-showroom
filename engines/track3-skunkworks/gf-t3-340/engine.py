"""
GF-T3-340: Ultra-Wide Dynamic Asynchronous Flash-Decoding & Multi-Block Attention Partitioning Engine
Clean-Room Standalone FastAPI Backend (MIT Permissive License)
Zero-Dollar Gate Enforced: All telemetry rendered in GB/s, us, percentages, blocks, or token units.
"""

from __future__ import annotations

import math
import time
from enum import Enum
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator


class DecodeCorridor(str, Enum):
    ALPHA = "DECODE-CORRIDOR-ALPHA (DYNAMIC-MULTI-BLOCK-FABRIC · 128400-GB/S)"
    BRAVO = "DECODE-CORRIDOR-BRAVO (FLASH-DECODING-ENGINE)"
    GAMMA = "DECODE-CORRIDOR-GAMMA (NON-BLOCKING-REDUCTION-ROUTER)"
    DELTA = "DECODE-CORRIDOR-DELTA (FALLBACK-SEQUENTIAL-DECODE-PASS)"


class BlockStatus(str, Enum):
    REDUCED_LOCKED = "REDUCED · LOCKED"
    PARTITIONING = "PARTITIONING · SYNC"
    REDUCING = "REDUCING · ACTIVE"
    FLUSHED = "ARENA · ZEROED"


class BlockTelemetryDTO(BaseModel):
    block_id: int = Field(..., ge=0, le=63, description="Streaming multiprocessor partition block index")
    label: str = Field(..., description="Block identifier tag")
    hex_ptr: str = Field(..., description="Base memory pointer in hexadecimal")
    tokens_k: int = Field(..., ge=0, description="Assigned KV sequence tokens in thousands")
    decode_load_pct: float = Field(..., ge=0.0, le=100.0, description="Block decode saturation percentage")
    sync_pct: float = Field(..., ge=0.0, le=100.0, description="Barrier synchronization completion percentage")
    latency_ms: float = Field(..., ge=0.0, description="Sub-block reduction pass latency in milliseconds")
    partial_logsumexp: float = Field(..., description="Partial log-sum-exp accumulator value")
    partial_max_logit: float = Field(..., description="Block local maximum attention logit")
    partial_output_norm: float = Field(..., description="L2 norm of partial attention output vector")
    status: str = Field(..., description="Current hardware block synchronization state")


class FlashDecodeRequestDTO(BaseModel):
    corridor: DecodeCorridor = Field(
        default=DecodeCorridor.ALPHA,
        description="Synthetic clean-room decode corridor selection",
    )
    sequence_length_tokens: int = Field(
        default=2048000,
        ge=1024,
        le=16384000,
        description="Total KV cache sequence length in tokens across all active blocks",
    )
    num_blocks: int = Field(
        default=8,
        ge=1,
        le=64,
        description="Number of parallel multi-block attention partitions (B)",
    )
    head_dim: int = Field(
        default=128,
        ge=32,
        le=256,
        description="Attention head dimension (d_k)",
    )
    reduction_weight: float = Field(
        default=1.0,
        gt=0.0,
        le=10.0,
        description="Reduction kernel scaling factor (omega_reduce)",
    )
    query_vector: List[float] = Field(
        default_factory=lambda: [0.42, -0.18, 0.77, 0.31, -0.54, 0.63, 0.29, -0.11],
        min_length=4,
        max_length=128,
        description="Active token query representation Q_token",
    )
    long_context_spike: bool = Field(
        default=False,
        description="When enabled, injects high-density long-context KV cache spike",
    )

    @field_validator("query_vector")
    @classmethod
    def validate_query_vector(cls, v: List[float]) -> List[float]:
        for val in v:
            if math.isnan(val) or math.isinf(val):
                raise ValueError("Query vector components must be finite real numbers")
        return v


class FlashDecodeResponseDTO(BaseModel):
    chassis_id: str = "GF-T3-340"
    corridor: DecodeCorridor
    decoding_throughput_gbs: float
    reduction_latency_us: float
    active_blocks: int
    total_blocks: int
    processed_tokens_units: int
    engine_xp_delta_k: float
    decode_state: str
    mesh_ptr: str
    mode: str
    reduced_vector_preview: List[float]
    global_logsumexp: float
    speedup_multiplier: float
    blocks: List[BlockTelemetryDTO]
    inspector_summary: str
    radio_log: List[str]


class ChaosActionRequestDTO(BaseModel):
    action: str = Field(
        ...,
        description="One of: BURST, SPIKE, STEP_REDUCTION, FLUSH_ARENAS",
    )
    corridor: DecodeCorridor = Field(default=DecodeCorridor.ALPHA)
    selected_block: int = Field(default=3, ge=0, le=7)


def sanitize_identifier(raw: str) -> str:
    """Zero-Trust Ingress scrubber: strips unsafe characters and enforces clean ASCII tokens."""
    allowed = set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.:/ ()·")
    cleaned = "".join(ch for ch in raw if ch in allowed)
    return cleaned[:128]


def compute_multi_block_flash_decoding(
    query_vec: List[float],
    num_blocks: int,
    seq_len_tokens: int,
    head_dim: int,
    omega_reduce: float,
    corridor: DecodeCorridor,
    long_context_spike: bool = False,
    burst_mode: bool = False,
    flushed: bool = False,
) -> Dict[str, object]:
    """
    Deterministic clean-room solver for Asynchronous Flash-Decoding & Multi-Block Attention Partitioning:
        F_decode = sum_{b=0}^{B-1} F(Q_token, K_blocks[b], V_blocks[b], omega_reduce)

    Each partition block b in [0, B-1] computes:
      1. Local scaled dot-product logits s_{b,i} = (Q_token . K_{b,i}) / sqrt(d_k)
      2. Block-local maximum m_b = max_i(s_{b,i})
      3. Block-local exponential sum l_b = sum_i exp(s_{b,i} - m_b)
      4. Block-local unnormalized value accumulator O_b = sum_i exp(s_{b,i} - m_b) * V_{b,i}

    Non-blocking cross-block reduction combines (m_b, l_b, O_b) via log-sum-exp rescaling:
      m_global = max_b(m_b)
      l_global = sum_b(l_b * exp(m_b - m_global))
      F_decode = omega_reduce * sum_b(O_b * exp(m_b - m_global)) / l_global
    """
    if flushed:
        zero_blocks: List[BlockTelemetryDTO] = []
        for b in range(num_blocks):
            hex_addr = "0x4F0" + format(b * 16, "02X")
            zero_blocks.append(
                BlockTelemetryDTO(
                    block_id=b,
                    label="Block " + str(b) + " (B" + str(b) + ")",
                    hex_ptr=hex_addr,
                    tokens_k=0,
                    decode_load_pct=0.0,
                    sync_pct=100.0,
                    latency_ms=0.00,
                    partial_logsumexp=0.0,
                    partial_max_logit=0.0,
                    partial_output_norm=0.0,
                    status=BlockStatus.FLUSHED.value,
                )
            )
        return {
            "decoding_throughput_gbs": 0.0,
            "reduction_latency_us": 0.00,
            "active_blocks": 0,
            "total_blocks": num_blocks,
            "processed_tokens_units": 0,
            "engine_xp_delta_k": 0.0,
            "decode_state": "Flushed",
            "mesh_ptr": "0x49F8DC0",
            "mode": "ARENA_ZEROED",
            "reduced_vector_preview": [0.0, 0.0, 0.0, 0.0],
            "global_logsumexp": 0.0,
            "speedup_multiplier": 1.0,
            "blocks": zero_blocks,
        }

    vec_dim = max(4, len(query_vec))
    scale = 1.0 / math.sqrt(float(head_dim))
    effective_seq_len = seq_len_tokens * (2 if long_context_spike else 1)
    tokens_per_block = max(1, effective_seq_len // num_blocks)
    tokens_k_per_block = max(1, tokens_per_block // 1000)

    block_maxes: List[float] = []
    block_sums: List[float] = []
    block_outputs: List[List[float]] = []
    block_dtos: List[BlockTelemetryDTO] = []

    # Synthetic deterministic key/value tile evaluation per streaming multiprocessor block
    for b in range(num_blocks):
        sub_tiles = 8
        local_logits: List[float] = []
        local_values: List[List[float]] = []

        for t in range(sub_tiles):
            phase = (b * 0.37) + (t * 0.19) + (0.11 if long_context_spike else 0.0)
            dot = 0.0
            for d_idx, q_val in enumerate(query_vec):
                k_val = math.cos(phase + (d_idx * 0.23)) * 1.45
                dot += q_val * k_val
            logit = dot * scale
            local_logits.append(logit)

            v_tile: List[float] = []
            for d_idx in range(4):
                v_comp = 9.96 + 0.03 * math.sin(phase + d_idx * 0.41)
                v_tile.append(v_comp)
            local_values.append(v_tile)

        m_b = max(local_logits)
        exps = [math.exp(s - m_b) for s in local_logits]
        l_b = sum(exps)

        o_b = [0.0, 0.0, 0.0, 0.0]
        for ex_val, v_tile in zip(exps, local_values):
            for d_idx in range(4):
                o_b[d_idx] += ex_val * v_tile[d_idx]

        block_maxes.append(m_b)
        block_sums.append(l_b)
        block_outputs.append(o_b)

        lse_b = m_b + math.log(max(l_b, 1e-12))
        norm_b = math.sqrt(sum((c / max(l_b, 1e-12)) ** 2 for c in o_b))
        hex_addr = "0x4F0" + format(b * 16, "02X")

        load_pct = 100.0 if corridor != DecodeCorridor.DELTA else (100.0 if b == 0 else 12.5)
        lat_ms = 0.02 if not long_context_spike else 0.03
        if burst_mode:
            lat_ms = 0.01

        status_str = (
            BlockStatus.PARTITIONING.value
            if long_context_spike
            else BlockStatus.REDUCED_LOCKED.value
        )

        block_dtos.append(
            BlockTelemetryDTO(
                block_id=b,
                label="Block " + str(b) + " (B" + str(b) + ")",
                hex_ptr=hex_addr,
                tokens_k=tokens_k_per_block,
                decode_load_pct=round(load_pct, 1),
                sync_pct=100.0,
                latency_ms=round(lat_ms, 2),
                partial_logsumexp=round(lse_b, 4),
                partial_max_logit=round(m_b, 4),
                partial_output_norm=round(norm_b, 4),
                status=status_str,
            )
        )

    # Non-Blocking Multi-Block Softmax Reduction
    m_global = max(block_maxes)
    rescaled_factors = [math.exp(m_b - m_global) for m_b in block_maxes]
    l_global = sum(l_b * rf for l_b, rf in zip(block_sums, rescaled_factors))
    global_lse = m_global + math.log(max(l_global, 1e-12))

    final_vec = [0.0, 0.0, 0.0, 0.0]
    for o_b, rf in zip(block_outputs, rescaled_factors):
        for d_idx in range(4):
            final_vec[d_idx] += o_b[d_idx] * rf

    final_vec = [round((omega_reduce * val) / max(l_global, 1e-12), 2) for val in final_vec]

    # Corridor-specific hardware throughput and latency modeling
    corridor_multipliers = {
        DecodeCorridor.ALPHA: 1.0,
        DecodeCorridor.BRAVO: 0.94,
        DecodeCorridor.GAMMA: 0.89,
        DecodeCorridor.DELTA: 0.18,
    }
    mult = corridor_multipliers.get(corridor, 1.0)
    base_throughput = 128400.0 * mult
    if burst_mode:
        base_throughput = 142800.0 * mult
    elif long_context_spike:
        base_throughput = 136200.0 * mult

    reduction_latency_us = 0.01 if corridor != DecodeCorridor.DELTA else 0.14
    if long_context_spike and corridor != DecodeCorridor.DELTA:
        reduction_latency_us = 0.02

    sequential_baseline_gbs = 16050.0
    speedup = round(base_throughput / sequential_baseline_gbs, 2)

    processed_units = 27000000
    if burst_mode:
        processed_units = 34500000
    elif long_context_spike:
        processed_units = 31200000

    return {
        "decoding_throughput_gbs": round(base_throughput, 1),
        "reduction_latency_us": round(reduction_latency_us, 3),
        "active_blocks": num_blocks if corridor != DecodeCorridor.DELTA else 1,
        "total_blocks": num_blocks,
        "processed_tokens_units": processed_units,
        "engine_xp_delta_k": 75.0 if not burst_mode else 95.0,
        "decode_state": "Active",
        "mesh_ptr": "0x49F8DC0",
        "mode": "FLASH_DECODING" if corridor != DecodeCorridor.DELTA else "SEQUENTIAL_FALLBACK",
        "reduced_vector_preview": final_vec,
        "global_logsumexp": round(global_lse, 5),
        "speedup_multiplier": speedup,
        "blocks": block_dtos,
    }


app = FastAPI(
    title="GF-T3-340",
    description="Ultra-Wide Dynamic Asynchronous Flash-Decoding & Multi-Block Attention Partitioning Engine",
    version="3.4.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> Dict[str, object]:
    return {
        "chassis": "GF-T3-340",
        "status": "ACTIVE",
        "decode_throughput_gbs": 128400,
        "reduction_latency_us": 0.01,
        "active_blocks": 8,
        "timestamp_ns": int(time.time() * 1e9),
    }


@app.get("/api/v1/corridors")
def list_decode_corridors() -> Dict[str, object]:
    return {
        "chassis": "GF-T3-340",
        "corridors": [c.value for c in DecodeCorridor],
        "default_corridor": DecodeCorridor.ALPHA.value,
    }


@app.post("/api/v1/decode", response_model=FlashDecodeResponseDTO)
def execute_flash_decoding(payload: FlashDecodeRequestDTO) -> FlashDecodeResponseDTO:
    result = compute_multi_block_flash_decoding(
        query_vec=payload.query_vector,
        num_blocks=payload.num_blocks,
        seq_len_tokens=payload.sequence_length_tokens,
        head_dim=payload.head_dim,
        omega_reduce=payload.reduction_weight,
        corridor=payload.corridor,
        long_context_spike=payload.long_context_spike,
    )
    blocks: List[BlockTelemetryDTO] = result["blocks"]  # type: ignore[assignment]
    inspected = blocks[min(3, len(blocks) - 1)]
    inspector_str = (
        "B"
        + str(inspected.block_id)
        + " · TOK: "
        + str(inspected.tokens_k)
        + "K · DECODE: "
        + str(int(inspected.decode_load_pct))
        + "% · SYNC: "
        + str(int(inspected.sync_pct))
        + "% · PTR "
        + inspected.hex_ptr
        + " · REDN: OK · LOCKED · BLOCKS: "
        + str(result["total_blocks"])
        + " · MODE: FLASH"
    )
    radio_lines = [
        "[00:01.04] 🟢 CREW CHIEF: Asynchronous flash-decoding and multi-block attention partitioning engine initialized · "
        + str(result["total_blocks"])
        + " blocks linked",
        "[00:01.08] 🟢 TELEMETRY: Multi-block attention reduction verified at "
        + format(int(result["decoding_throughput_gbs"]), ",")  # type: ignore[arg-type]
        + " GB/s with zero generation latency",
    ]
    return FlashDecodeResponseDTO(
        chassis_id="GF-T3-340",
        corridor=payload.corridor,
        decoding_throughput_gbs=float(result["decoding_throughput_gbs"]),  # type: ignore[arg-type]
        reduction_latency_us=float(result["reduction_latency_us"]),  # type: ignore[arg-type]
        active_blocks=int(result["active_blocks"]),  # type: ignore[arg-type]
        total_blocks=int(result["total_blocks"]),  # type: ignore[arg-type]
        processed_tokens_units=int(result["processed_tokens_units"]),  # type: ignore[arg-type]
        engine_xp_delta_k=float(result["engine_xp_delta_k"]),  # type: ignore[arg-type]
        decode_state=str(result["decode_state"]),
        mesh_ptr=str(result["mesh_ptr"]),
        mode=str(result["mode"]),
        reduced_vector_preview=list(result["reduced_vector_preview"]),  # type: ignore[arg-type]
        global_logsumexp=float(result["global_logsumexp"]),  # type: ignore[arg-type]
        speedup_multiplier=float(result["speedup_multiplier"]),  # type: ignore[arg-type]
        blocks=blocks,
        inspector_summary=inspector_str,
        radio_log=radio_lines,
    )


@app.post("/api/v1/chaos", response_model=FlashDecodeResponseDTO)
def trigger_chaos_maneuver(payload: ChaosActionRequestDTO) -> FlashDecodeResponseDTO:
    clean_action = sanitize_identifier(payload.action).upper()
    if clean_action not in {"BURST", "SPIKE", "STEP_REDUCTION", "FLUSH_ARENAS"}:
        raise HTTPException(status_code=400, detail="Unsupported chaos decode maneuver: " + clean_action)

    burst = clean_action == "BURST"
    spike = clean_action == "SPIKE"
    flushed = clean_action == "FLUSH_ARENAS"

    result = compute_multi_block_flash_decoding(
        query_vec=[0.42, -0.18, 0.77, 0.31, -0.54, 0.63, 0.29, -0.11],
        num_blocks=8,
        seq_len_tokens=2048000,
        head_dim=128,
        omega_reduce=1.05 if clean_action == "STEP_REDUCTION" else 1.0,
        corridor=payload.corridor,
        long_context_spike=spike,
        burst_mode=burst,
        flushed=flushed,
    )

    blocks: List[BlockTelemetryDTO] = result["blocks"]  # type: ignore[assignment]
    sel = blocks[min(payload.selected_block, len(blocks) - 1)]
    inspector_str = (
        "B"
        + str(sel.block_id)
        + " · TOK: "
        + str(sel.tokens_k)
        + "K · DECODE: "
        + str(int(sel.decode_load_pct))
        + "% · SYNC: "
        + str(int(sel.sync_pct))
        + "% · PTR "
        + sel.hex_ptr
        + " · REDN: OK · LOCKED · BLOCKS: "
        + str(result["total_blocks"])
        + " · MODE: FLASH"
    )

    radio_lines = [
        "[00:01.04] 🟢 CREW CHIEF: Asynchronous flash-decoding and multi-block attention partitioning engine initialized · 8 blocks linked",
        "[00:01.08] 🟢 TELEMETRY: Multi-block attention reduction verified at "
        + format(int(result["decoding_throughput_gbs"]), ",")  # type: ignore[arg-type]
        + " GB/s with zero generation latency",
    ]
    return FlashDecodeResponseDTO(
        chassis_id="GF-T3-340",
        corridor=payload.corridor,
        decoding_throughput_gbs=float(result["decoding_throughput_gbs"]),  # type: ignore[arg-type]
        reduction_latency_us=float(result["reduction_latency_us"]),  # type: ignore[arg-type]
        active_blocks=int(result["active_blocks"]),  # type: ignore[arg-type]
        total_blocks=int(result["total_blocks"]),  # type: ignore[arg-type]
        processed_tokens_units=int(result["processed_tokens_units"]),  # type: ignore[arg-type]
        engine_xp_delta_k=float(result["engine_xp_delta_k"]),  # type: ignore[arg-type]
        decode_state=str(result["decode_state"]),
        mesh_ptr=str(result["mesh_ptr"]),
        mode=str(result["mode"]),
        reduced_vector_preview=list(result["reduced_vector_preview"]),  # type: ignore[arg-type]
        global_logsumexp=float(result["global_logsumexp"]),  # type: ignore[arg-type]
        speedup_multiplier=float(result["speedup_multiplier"]),  # type: ignore[arg-type]
        blocks=blocks,
        inspector_summary=inspector_str,
        radio_log=radio_lines,
    )


@app.get("/api/v1/telemetry/block/{block_id}", response_model=BlockTelemetryDTO)
def inspect_partition_block(
    block_id: int,
    corridor: DecodeCorridor = Query(default=DecodeCorridor.ALPHA),
) -> BlockTelemetryDTO:
    if block_id < 0 or block_id > 7:
        raise HTTPException(status_code=404, detail="Block index out of range [0..7]")
    result = compute_multi_block_flash_decoding(
        query_vec=[0.42, -0.18, 0.77, 0.31, -0.54, 0.63, 0.29, -0.11],
        num_blocks=8,
        seq_len_tokens=2048000,
        head_dim=128,
        omega_reduce=1.0,
        corridor=corridor,
    )
    blocks: List[BlockTelemetryDTO] = result["blocks"]  # type: ignore[assignment]
    return blocks[block_id]
