"""
GF-T3-277 Standalone FastAPI Backend Engine
Ultra-Wide Multi-GPU Pipeline Partitioning & Layer-Wise Tensor Sharding Engine
License: MIT
"""

from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
import math
import time
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

app = FastAPI(
    title="GF-T3-277",
    description="Ultra-Wide Multi-GPU Pipeline Partitioning and Layer-Wise Tensor Sharding Engine",
    version="3.277.0",
)

SYNTHETIC_CORRIDORS: Dict[str, Dict[str, float | str | int]] = {
    "PIPE-CORRIDOR-ALPHA (MULTI-GPU-PIPELINE-PARTITIONING-FABRIC · 36000-GB/S)": {
        "corridor_id": "PIPE-CORRIDOR-ALPHA",
        "nvlink_bandwidth_gbs": 36000.0,
        "base_staging_latency_us": 0.01,
        "active_stages": 8,
        "micro_batches": 32,
        "mode": "PIPELINE_SHARD",
    },
    "PIPE-CORRIDOR-BRAVO (LAYER-WISE-TENSOR-SHARDING-ENGINE)": {
        "corridor_id": "PIPE-CORRIDOR-BRAVO",
        "nvlink_bandwidth_gbs": 32400.0,
        "base_staging_latency_us": 0.02,
        "active_stages": 8,
        "micro_batches": 24,
        "mode": "TENSOR_SHARD",
    },
    "PIPE-CORRIDOR-GAMMA (NON-BLOCKING-PEER-TO-PEER-TENSOR-FORWARDER)": {
        "corridor_id": "PIPE-CORRIDOR-GAMMA",
        "nvlink_bandwidth_gbs": 34800.0,
        "base_staging_latency_us": 0.01,
        "active_stages": 8,
        "micro_batches": 28,
        "mode": "P2P_FORWARD",
    },
    "PIPE-CORRIDOR-DELTA (FALLBACK-SINGLE-GPU-MONOLITHIC-PASS)": {
        "corridor_id": "PIPE-CORRIDOR-DELTA",
        "nvlink_bandwidth_gbs": 9600.0,
        "base_staging_latency_us": 0.08,
        "active_stages": 8,
        "micro_batches": 8,
        "mode": "MONOLITHIC_FALLBACK",
    },
}


class LayerFlopsConfig(BaseModel):
    layer_index: int = Field(..., ge=0, le=127)
    hidden_dim: int = Field(default=8192, ge=512, le=65536)
    seq_length: int = Field(default=4096, ge=64, le=131072)
    micro_batch_size: int = Field(default=4, ge=1, le=128)


class PipelinePartitionRequest(BaseModel):
    corridor_label: str = Field(
        default="PIPE-CORRIDOR-ALPHA (MULTI-GPU-PIPELINE-PARTITIONING-FABRIC · 36000-GB/S)"
    )
    total_layers: int = Field(default=32, ge=8, le=128)
    num_stages: int = Field(default=8, ge=1, le=16)
    micro_batches: int = Field(default=32, ge=1, le=256)
    hidden_dim: int = Field(default=8192, ge=512, le=65536)
    seq_length: int = Field(default=4096, ge=64, le=131072)
    inject_imbalance_stage: Optional[int] = Field(default=None, ge=0, le=15)
    imbalance_multiplier: float = Field(default=1.0, ge=1.0, le=5.0)

    @field_validator("corridor_label")
    @classmethod
    def validate_corridor_clean(cls, value: str) -> str:
        forbidden = ["DROP ", "SELECT ", "<script", "--", ";"]
        upper_val = value.upper()
        for token in forbidden:
            if token in upper_val:
                raise ValueError("Untrusted input pattern blocked by GridSync sanitizer")
        if value not in SYNTHETIC_CORRIDORS:
            raise ValueError("Unknown synthetic pipeline corridor")
        return value


@dataclass
class StageTelemetry:
    stage_id: int
    stage_code: str
    hex_ptr: str
    layer_start: int
    layer_end: int
    layer_label: str
    tokens_processed_k: int
    stage_partition_load: float
    p2p_forward_bandwidth_gbs: float
    latency_ms: float
    sync_efficiency_pct: float
    bubble_ratio_pct: float
    status_label: str
    is_balanced: bool


def compute_layer_flops(hidden_dim: int, seq_length: int, micro_batch_size: int = 4) -> float:
    """
    Computes transformer layer FLOPs (forward + backward pass):
    FLOPs(l) = 24 * B * S * H^2 + 4 * B * S^2 * H
    """
    attention_proj = 24.0 * micro_batch_size * seq_length * (hidden_dim ** 2)
    attention_scores = 4.0 * micro_batch_size * (seq_length ** 2) * hidden_dim
    return attention_proj + attention_scores


def compute_stage_partition_cost(
    layer_indices: List[int],
    hidden_dim: int,
    seq_length: int,
    nvlink_bandwidth_gbs: float,
    load_multiplier: float = 1.0,
) -> float:
    """
    Implements the core Track 3 stage balance equation:
    P_stage = sum_{l=1}^{L_stage} (FLOPs(l) / Bandwidth_nvlink)
    Normalized to GFLOPs per GB/s for deterministic stage load scoring.
    """
    if nvlink_bandwidth_gbs <= 0:
        raise ValueError("NVLink bandwidth must be strictly positive")
    total_flops = 0.0
    for _ in layer_indices:
        total_flops += compute_layer_flops(hidden_dim, seq_length) * load_multiplier
    total_tflops = total_flops / 1e12
    return round((total_tflops / nvlink_bandwidth_gbs) * 1e4, 4)


def compute_1f1b_bubble_fraction(num_stages: int, micro_batches: int) -> float:
    """
    Computes the 1F1B (One-Forward-One-Backward) pipeline bubble fraction:
    Bubble_Ratio = (P - 1) / (M + P - 1)
    """
    if num_stages <= 1:
        return 0.0
    if micro_batches <= 0:
        raise ValueError("Micro-batches must be positive")
    return round((num_stages - 1.0) / (micro_batches + num_stages - 1.0), 6)


def compute_p2p_tensor_forwarding_latency_us(
    hidden_dim: int,
    seq_length: int,
    nvlink_bandwidth_gbs: float,
    zero_copy_enabled: bool = True,
) -> float:
    """
    Non-Blocking Peer-to-Peer Tensor Forwarding latency across NVLink interconnects.
    Activation bytes = 2 (FP16/BF16) * seq_length * hidden_dim
    Overlap factor hides 99.85% of wire transfer behind SM compute kernels.
    """
    activation_bytes = 2.0 * seq_length * hidden_dim
    wire_time_us = (activation_bytes / (nvlink_bandwidth_gbs * 1e9)) * 1e6
    overlap_efficiency = 0.005 if zero_copy_enabled else 1.0
    effective_us = max(0.01, round(wire_time_us * overlap_efficiency, 3))
    return effective_us


def execute_pipeline_partition_simulation(req: PipelinePartitionRequest) -> Dict:
    corridor = SYNTHETIC_CORRIDORS[req.corridor_label]
    bandwidth_gbs = float(corridor["nvlink_bandwidth_gbs"])
    layers_per_stage = req.total_layers // req.num_stages
    bubble_fraction = compute_1f1b_bubble_fraction(req.num_stages, req.micro_batches)

    stages: List[StageTelemetry] = []
    stage_loads: List[float] = []

    for stage_idx in range(req.num_stages):
        l_start = stage_idx * layers_per_stage
        l_end = l_start + layers_per_stage if stage_idx < req.num_stages - 1 else req.total_layers
        layer_indices = list(range(l_start, l_end))

        is_spiked = (
            req.inject_imbalance_stage is not None
            and req.inject_imbalance_stage == stage_idx
            and req.imbalance_multiplier > 1.0
        )
        multiplier = req.imbalance_multiplier if is_spiked else 1.0

        p_stage = compute_stage_partition_cost(
            layer_indices=layer_indices,
            hidden_dim=req.hidden_dim,
            seq_length=req.seq_length,
            nvlink_bandwidth_gbs=bandwidth_gbs,
            load_multiplier=multiplier,
        )
        stage_loads.append(p_stage)

        base_lat_ms = 0.02 if bandwidth_gbs >= 30000 else 0.05
        stage_lat_ms = round(base_lat_ms * multiplier, 3)
        sync_pct = round(100.0 if not is_spiked else max(68.0, 100.0 / multiplier), 1)
        p2p_bw = round(bandwidth_gbs / (1.0 if not is_spiked else multiplier * 0.65), 1)
        tokens_k = 256 if not is_spiked else int(256 * multiplier)

        hex_val = 0xB000 + (stage_idx * 0x0010)
        hex_ptr = "0x" + format(hex_val, "04X")

        stages.append(
            StageTelemetry(
                stage_id=stage_idx,
                stage_code="P" + str(stage_idx),
                hex_ptr=hex_ptr,
                layer_start=l_start,
                layer_end=l_end,
                layer_label="L" + str(l_start) + "-L" + str(l_end),
                tokens_processed_k=tokens_k,
                stage_partition_load=p_stage,
                p2p_forward_bandwidth_gbs=p2p_bw,
                latency_ms=stage_lat_ms,
                sync_efficiency_pct=sync_pct,
                bubble_ratio_pct=round(bubble_fraction * 100.0, 2),
                status_label="IMBALANCE · FAULT" if is_spiked else "BALANCED · LOCKED",
                is_balanced=not is_spiked,
            )
        )

    mean_load = sum(stage_loads) / len(stage_loads)
    variance = sum((ld - mean_load) ** 2 for ld in stage_loads) / len(stage_loads)
    balance_parity_pct = round(max(0.0, 100.0 - math.sqrt(variance) * 10.0), 2)
    staging_latency_us = compute_p2p_tensor_forwarding_latency_us(
        req.hidden_dim, req.seq_length, bandwidth_gbs, zero_copy_enabled=True
    )

    return {
        "engine_id": "GF-T3-277",
        "corridor_label": req.corridor_label,
        "partition_throughput_gbs": int(bandwidth_gbs),
        "staging_latency_us": staging_latency_us,
        "active_stages_count": req.num_stages,
        "processed_tokens_units": 6912000,
        "pipeline_state": "Stage Imbalance Detected" if req.inject_imbalance_stage is not None else "Partition Active",
        "bubble_fraction": bubble_fraction,
        "balance_parity_pct": balance_parity_pct,
        "vector_signature": [3.91, 3.95, 3.92, 3.94],
        "stages": [asdict(s) for s in stages],
        "timestamp_ns": time.time_ns(),
    }


@app.get("/health")
def health_check() -> Dict[str, str | int]:
    return {
        "engine": "GF-T3-277",
        "status": "OPERATIONAL",
        "active_stages": 8,
        "partition_throughput_gbs": 36000,
    }


@app.post("/api/v1/pipeline/partition")
def run_partition_pass(req: PipelinePartitionRequest) -> Dict:
    try:
        return execute_pipeline_partition_simulation(req)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
