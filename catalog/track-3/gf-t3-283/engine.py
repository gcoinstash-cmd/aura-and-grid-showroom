"""
GF-T3-283: Ultra-Wide Dynamic Prefill-Decode Disaggregation & Distributed KV-Streaming Engine
Standalone FastAPI Backend Service (100% Clean-Room MIT License)
"""

from enum import Enum
from typing import Dict, List, Optional
import zlib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator


class CorridorId(str, Enum):
    ALPHA = "DISAGG-CORRIDOR-ALPHA"
    BRAVO = "DISAGG-CORRIDOR-BRAVO"
    GAMMA = "DISAGG-CORRIDOR-GAMMA"
    DELTA = "DISAGG-CORRIDOR-DELTA"


CORRIDOR_PROFILES: Dict[CorridorId, Dict[str, float | bool | str]] = {
    CorridorId.ALPHA: {
        "label": "DISAGG-CORRIDOR-ALPHA (PREFILL-DECODE-DISAGGREGATION-FABRIC · 40800-GB/S)",
        "rdma_bandwidth_gbps": 40800.0,
        "base_handoff_latency_us": 0.01,
        "prefill_tflops_per_node": 1979.0,
        "decode_hbm_bandwidth_gbps": 8000.0,
        "overlap_efficiency": 0.994,
        "collocated_fallback": False,
    },
    CorridorId.BRAVO: {
        "label": "DISAGG-CORRIDOR-BRAVO (DISTRIBUTED-KV-STREAMING-ENGINE)",
        "rdma_bandwidth_gbps": 36400.0,
        "base_handoff_latency_us": 0.02,
        "prefill_tflops_per_node": 1850.0,
        "decode_hbm_bandwidth_gbps": 7600.0,
        "overlap_efficiency": 0.982,
        "collocated_fallback": False,
    },
    CorridorId.GAMMA: {
        "label": "DISAGG-CORRIDOR-GAMMA (NON-BLOCKING-RDMA-KV-CHUNK-ROUTER)",
        "rdma_bandwidth_gbps": 38200.0,
        "base_handoff_latency_us": 0.015,
        "prefill_tflops_per_node": 1920.0,
        "decode_hbm_bandwidth_gbps": 7850.0,
        "overlap_efficiency": 0.989,
        "collocated_fallback": False,
    },
    CorridorId.DELTA: {
        "label": "DISAGG-CORRIDOR-DELTA (FALLBACK-COLLOCATED-PREFILL-DECODE-PASS)",
        "rdma_bandwidth_gbps": 18400.0,
        "base_handoff_latency_us": 0.14,
        "prefill_tflops_per_node": 1240.0,
        "decode_hbm_bandwidth_gbps": 4800.0,
        "overlap_efficiency": 0.72,
        "collocated_fallback": True,
    },
}

BANNED_PAYLOAD_TOKENS = (
    "DROP TABLE",
    "DELETE FROM",
    "INSERT INTO",
    "UNION SELECT",
    "<SCRIPT",
    "JAVASCRIPT:",
    "ONERROR=",
    ";--",
)


class DisaggSimulationRequest(BaseModel):
    corridor_id: CorridorId = Field(default=CorridorId.ALPHA)
    burst_multiplier: float = Field(default=1.0, ge=1.0, le=8.0)
    congestion_active: bool = Field(default=False)
    chunk_pass_count: int = Field(default=0, ge=0, le=10000)
    seq_length_tokens: int = Field(default=32768, ge=512, le=2097152)
    batch_size: int = Field(default=8, ge=1, le=512)
    num_layers: int = Field(default=80, ge=8, le=256)
    num_kv_heads: int = Field(default=8, ge=1, le=128)
    head_dim: int = Field(default=128, ge=32, le=512)
    operator_note: Optional[str] = Field(default=None, max_length=128)

    @field_validator("operator_note")
    @classmethod
    def sanitize_operator_note(cls, val: Optional[str]) -> Optional[str]:
        if val is None:
            return None
        upper_val = val.upper()
        for token in BANNED_PAYLOAD_TOKENS:
            if token in upper_val:
                raise ValueError("GridSync Zero-Trust Gate: Malicious SQL/XSS token rejected")
        return val


class NodeTelemetryUnit(BaseModel):
    node_index: int
    node_code: str
    title: str
    hex_ptr: str
    role: str
    is_prefill: bool
    tokens_k: int
    latency_ms: float
    sync_percent: int
    disagg_status: str
    state_label: str
    kv_chunk_transferred_gb: float
    crc32_hex: str


class DisaggSimulationResponse(BaseModel):
    corridor_id: CorridorId
    streaming_throughput_gbps: float
    handoff_latency_us: float
    active_nodes_count: int
    total_nodes_count: int
    processed_tokens_units: int
    engine_xp_units: int
    disagg_state_label: str
    prefill_time_ms: float
    decode_time_ms: float
    kv_transfer_time_ms: float
    disagg_total_latency_ms: float
    collocated_total_latency_ms: float
    ttft_reduction_percent: float
    buffer_parity_percent: float
    kv_state_size_gb: float
    vector_signature: List[float]
    nodes: List[NodeTelemetryUnit]


def compute_kv_cache_state_gb(
    seq_length_tokens: int,
    batch_size: int,
    num_layers: int,
    num_kv_heads: int,
    head_dim: int,
) -> float:
    """
    Computes exact KV cache footprint in Gigabytes (GB) for 16-bit (2-byte) elements:
    KV_bytes = 2 (K and V) * num_layers * num_kv_heads * head_dim * 2 * seq_length_tokens * batch_size
    """
    bytes_per_element = 2
    total_bytes = (
        2
        * num_layers
        * num_kv_heads
        * head_dim
        * bytes_per_element
        * seq_length_tokens
        * batch_size
    )
    return round(total_bytes / 1e9, 4)


def compute_crc32_hex(payload: str) -> str:
    crc_val = zlib.crc32(payload.encode("utf-8")) & 0xFFFFFFFF
    return "0x" + format(crc_val, "08X")


def evaluate_disagg_simulation(req: DisaggSimulationRequest) -> DisaggSimulationResponse:
    """
    Asymmetric Disaggregated Serving Architecture Formula:
    T_disagg = max(T_prefill, T_decode) + (KV_state / Bandwidth_RDMA) * (1 - overlap)
    """
    profile = CORRIDOR_PROFILES[req.corridor_id]
    kv_state_size_gb = compute_kv_cache_state_gb(
        req.seq_length_tokens,
        req.batch_size,
        req.num_layers,
        req.num_kv_heads,
        req.head_dim,
    )

    congestion_factor = 0.84 if req.congestion_active else 1.0
    chunk_boost = 1.0 + min(req.chunk_pass_count * 0.005, 0.12)
    base_bw = float(profile["rdma_bandwidth_gbps"])
    streaming_throughput_gbps = round(base_bw * congestion_factor * chunk_boost, 2)

    # Compute-bound prefill phase duration (ms)
    total_prefill_flops_giga = req.seq_length_tokens * req.batch_size * req.num_layers * 0.014
    cluster_prefill_tflops = float(profile["prefill_tflops_per_node"]) * 4.0
    prefill_time_ms = round(
        (total_prefill_flops_giga / cluster_prefill_tflops) * req.burst_multiplier, 4
    )

    # Memory-bandwidth-bound decode phase duration (ms)
    decode_bytes_moved_gb = kv_state_size_gb * 1.25
    cluster_decode_bw_gbps = float(profile["decode_hbm_bandwidth_gbps"]) * 4.0
    decode_time_ms = round(
        ((decode_bytes_moved_gb / cluster_decode_bw_gbps) * 1000.0) * req.burst_multiplier, 4
    )

    # Non-blocking RDMA KV transfer duration (ms)
    unmasked_transfer_ms = (kv_state_size_gb / streaming_throughput_gbps) * 1000.0
    overlap_eff = float(profile["overlap_efficiency"])
    kv_transfer_time_ms = round(unmasked_transfer_ms * (1.0 - overlap_eff), 5)

    # Asymmetric Disaggregated Latency vs Collocated Baseline
    disagg_total_latency_ms = round(
        max(prefill_time_ms, decode_time_ms) + kv_transfer_time_ms, 4
    )
    interference_penalty_ms = (prefill_time_ms + decode_time_ms) * 0.42
    collocated_total_latency_ms = round(
        prefill_time_ms + decode_time_ms + interference_penalty_ms, 4
    )

    ttft_reduction_percent = round(
        ((collocated_total_latency_ms - disagg_total_latency_ms) / max(collocated_total_latency_ms, 1e-6))
        * 100.0,
        2,
    )

    base_handoff_us = float(profile["base_handoff_latency_us"])
    handoff_latency_us = round(
        base_handoff_us
        * (2.0 if req.congestion_active else 1.0)
        * (1.15 if req.burst_multiplier > 1.0 else 1.0),
        3,
    )

    base_tokens_k = int(round((req.seq_length_tokens * req.batch_size * req.burst_multiplier) / 1024.0))
    processed_tokens_units = (
        7680000
        + req.chunk_pass_count * 512000
        + int(round((req.burst_multiplier - 1.0) * 1024000))
    )
    engine_xp_units = int(
        75000 + req.chunk_pass_count * 4200 + (req.burst_multiplier - 1.0) * 8500
    )

    node_roles = [
        "PREFILL-P0",
        "PREFILL-P1",
        "PREFILL-P2",
        "DECODE-D3",
        "PREFILL-P4",
        "DECODE-D5",
        "PREFILL-P6",
        "DECODE-D7",
    ]

    nodes: List[NodeTelemetryUnit] = []
    for idx, role in enumerate(node_roles):
        hex_ptr = "0x" + format(0x11000 + idx * 0x10, "X")
        is_prefill = role.startswith("PREFILL")
        is_congested = req.congestion_active and idx in (2, 5)
        node_latency_ms = round(
            0.02
            + (idx % 3) * 0.005
            + (0.04 if is_congested else 0.0)
            + (req.burst_multiplier - 1.0) * 0.008,
            2,
        )
        tokens_k = base_tokens_k + req.chunk_pass_count * 16
        sync_percent = 94 if is_congested else 100
        if is_congested:
            disagg_status = "REROUTE"
            state_label = "REROUTING · FAULT"
        else:
            disagg_status = (
                "PASS"
                if (req.chunk_pass_count > 0 and idx % 2 == req.chunk_pass_count % 2)
                else "OK"
            )
            state_label = "STREAMING · LOCKED"

        crc_hex = compute_crc32_hex(
            req.corridor_id.value + ":" + role + ":" + str(tokens_k) + ":" + str(req.chunk_pass_count)
        )

        nodes.append(
            NodeTelemetryUnit(
                node_index=idx,
                node_code="N" + str(idx),
                title="Node " + str(idx) + " (N" + str(idx) + ")",
                hex_ptr=hex_ptr,
                role=role,
                is_prefill=is_prefill,
                tokens_k=tokens_k,
                latency_ms=node_latency_ms,
                sync_percent=sync_percent,
                disagg_status=disagg_status,
                state_label=state_label,
                kv_chunk_transferred_gb=round(kv_state_size_gb / 8.0, 3),
                crc32_hex=crc_hex,
            )
        )

    active_nodes_count = sum(1 for n in nodes if n.state_label == "STREAMING · LOCKED")
    buffer_parity_percent = 98.4 if req.congestion_active else 99.98

    vector_signature = [
        round(4.51 + req.chunk_pass_count * 0.01, 2),
        round(4.55 + (req.burst_multiplier - 1.0) * 0.04, 2),
        round(4.52 + (-0.18 if req.congestion_active else 0.0), 2),
        round(4.54 + req.chunk_pass_count * 0.01, 2),
    ]

    if req.congestion_active:
        disagg_state_label = "RDMA Re-Routing Active"
    elif bool(profile["collocated_fallback"]):
        disagg_state_label = "Fallback Collocated Pass"
    else:
        disagg_state_label = "Streaming Active"

    return DisaggSimulationResponse(
        corridor_id=req.corridor_id,
        streaming_throughput_gbps=streaming_throughput_gbps,
        handoff_latency_us=handoff_latency_us,
        active_nodes_count=active_nodes_count,
        total_nodes_count=8,
        processed_tokens_units=processed_tokens_units,
        engine_xp_units=engine_xp_units,
        disagg_state_label=disagg_state_label,
        prefill_time_ms=prefill_time_ms,
        decode_time_ms=decode_time_ms,
        kv_transfer_time_ms=kv_transfer_time_ms,
        disagg_total_latency_ms=disagg_total_latency_ms,
        collocated_total_latency_ms=collocated_total_latency_ms,
        ttft_reduction_percent=ttft_reduction_percent,
        buffer_parity_percent=buffer_parity_percent,
        kv_state_size_gb=kv_state_size_gb,
        vector_signature=vector_signature,
        nodes=nodes,
    )


app = FastAPI(
    title="GF-T3-283",
    description="Ultra-Wide Dynamic Prefill-Decode Disaggregation & Distributed KV-Streaming Engine",
    version="3.0.0",
)


@app.get("/health")
def health_check() -> Dict[str, str | int]:
    return {
        "engine": "GF-T3-283",
        "status": "STREAMING_LOCKED",
        "active_nodes": 8,
    }


@app.get("/api/v1/corridors")
def list_corridors() -> Dict[str, Dict[str, float | bool | str]]:
    return {k.value: v for k, v in CORRIDOR_PROFILES.items()}


@app.post("/api/v1/disagg/evaluate", response_model=DisaggSimulationResponse)
def evaluate_endpoint(request: DisaggSimulationRequest) -> DisaggSimulationResponse:
    try:
        return evaluate_disagg_simulation(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
