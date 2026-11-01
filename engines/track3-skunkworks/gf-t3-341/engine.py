"""
GF-T3-341: Ultra-Wide Dynamic Asynchronous Context Parallelism & Ring-Attention Interlock Engine
SPDX-License-Identifier: MIT
Clean-Room Standalone Implementation — Zero Copyleft, Zero Proprietary Engine Marks
"""

from __future__ import annotations

import math
from enum import Enum
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field

app = FastAPI(
    title="GF-T3-341",
    description="Ultra-Wide Dynamic Asynchronous Context Parallelism and Ring-Attention Interlock Engine",
    version="3.4.1",
)


class ContextCorridor(str, Enum):
    ALPHA = "CONTEXT-CORRIDOR-ALPHA (DYNAMIC-RING-ATTENTION-FABRIC · 130200-GB/S)"
    BRAVO = "CONTEXT-CORRIDOR-BRAVO (SEQUENCE-SHARDING-ENGINE)"
    GAMMA = "CONTEXT-CORRIDOR-GAMMA (NON-BLOCKING-P2P-KV-ROUTER)"
    DELTA = "CONTEXT-CORRIDOR-DELTA (FALLBACK-SINGLE-DEVICE-PASS)"


class SegmentTelemetry(BaseModel):
    segment_id: int = Field(..., ge=0, le=7)
    label: str
    hex_ptr: str
    tokens_k: int = Field(..., ge=1)
    ring_load_pct: float = Field(..., ge=0.0, le=100.0)
    sync_pct: float = Field(..., ge=0.0, le=100.0)
    latency_ms: float = Field(..., ge=0.0)
    status: str
    peer_next: int
    peer_prev: int
    local_attention_score: float


class RingStateSnapshot(BaseModel):
    chassis_id: str = "GF-T3-341"
    corridor: ContextCorridor
    sequence_throughput_gbs: float
    ring_step_latency_us: float
    active_segments_count: int
    total_segments_count: int
    processed_tokens_units: int
    engine_xp_k: float
    context_state: str
    ring_step_index: int
    overlap_efficiency_pct: float
    latency_spike_injected: bool
    burst_active: bool
    vector_probe: List[float]
    segments: List[SegmentTelemetry]


class RingMutationRequest(BaseModel):
    corridor: Optional[ContextCorridor] = None
    selected_segment: Optional[int] = Field(default=3, ge=0, le=7)


class ContextParallelismSolver:
    """
    Deterministic clean-room solver for Asynchronous Context Parallelism & Ring-Attention Interlock.
    Implements C_context = sum_{k=0}^{K-1} R(Q_local, K_ring_peer, V_ring_peer, phi_p2p)
    where local blockwise softmax normalization merges iteratively across K ring steps
    while hiding peer-to-peer KV transfer latency behind local attention tile compute.
    """

    def __init__(self, num_segments: int = 8) -> None:
        self.num_segments: int = num_segments
        self.corridor: ContextCorridor = ContextCorridor.ALPHA
        self.ring_step_index: int = 0
        self.latency_spike_injected: bool = False
        self.burst_active: bool = False
        self.processed_tokens_units: int = 27_800_000
        self.engine_xp_k: float = 75.0

    @staticmethod
    def compute_ring_operator(
        q_norm: float,
        k_peer_norm: float,
        v_peer_norm: float,
        phi_p2p: float,
        d_head: int = 128,
    ) -> float:
        """
        Evaluates R(Q_local, K_ring_peer, V_ring_peer, phi_p2p) deterministically.
        Uses log-sum-exp online rescaling factor coupled with P2P phase overlap phi_p2p.
        """
        if d_head <= 0:
            raise ValueError("Head dimension d_head must be strictly positive")
        scale = 1.0 / math.sqrt(float(d_head))
        logit = q_norm * k_peer_norm * scale
        max_anchor = max(logit, 0.0)
        exp_term = math.exp(logit - max_anchor)
        online_normalizer = exp_term / (exp_term + math.exp(-max_anchor))
        p2p_coupling = max(0.05, min(1.0, phi_p2p))
        return round(online_normalizer * v_peer_norm * p2p_coupling, 6)

    def evaluate_context_interlock(
        self,
        q_local: List[float],
        k_peers: List[float],
        v_peers: List[float],
        phi_p2p: float,
    ) -> float:
        """
        Computes C_context = sum_{k=0}^{K-1} R(Q_local[k], K_ring_peer[k], V_ring_peer[k], phi_p2p)
        across K segments in the logical ring topology.
        """
        if not (len(q_local) == len(k_peers) == len(v_peers) == self.num_segments):
            raise ValueError("Input vectors must match num_segments length")
        total_context = 0.0
        for idx in range(self.num_segments):
            peer_idx = (idx + self.ring_step_index) % self.num_segments
            step_val = self.compute_ring_operator(
                q_local[idx],
                k_peers[peer_idx],
                v_peers[peer_idx],
                phi_p2p,
            )
            total_context += step_val
        return round(total_context, 6)

    @staticmethod
    def compute_overlap_efficiency(
        compute_time_us: float,
        p2p_transfer_time_us: float,
        non_blocking: bool = True,
    ) -> float:
        """
        Calculates asynchronous compute/communication overlap efficiency in percentage.
        When non_blocking is active, effective step duration is max(T_compute, T_p2p) + barrier_overhead.
        """
        if compute_time_us <= 0.0 or p2p_transfer_time_us < 0.0:
            raise ValueError("Invalid compute or transfer duration")
        serial_time = compute_time_us + p2p_transfer_time_us
        if not non_blocking:
            return round((compute_time_us / serial_time) * 100.0, 2)
        barrier_us = 0.01
        overlapped_time = max(compute_time_us, p2p_transfer_time_us) + barrier_us
        efficiency = (1.0 - (overlapped_time - compute_time_us) / serial_time) * 100.0
        return round(max(0.0, min(100.0, efficiency)), 2)

    def build_segments(self) -> List[SegmentTelemetry]:
        segments: List[SegmentTelemetry] = []
        base_tokens_k = 512 if self.burst_active else 256
        for idx in range(self.num_segments):
            shifted_peer = (idx + self.ring_step_index + 1) % self.num_segments
            prev_peer = (idx - 1 + self.num_segments) % self.num_segments
            hex_addr = "0x500" + str(idx) + "0"

            if self.latency_spike_injected and idx in (2, 5):
                ring_load = 94.0
                sync_pct = 98.5
                latency_ms = 0.04
                status_str = "REROUTED · LOCKED"
            elif self.corridor == ContextCorridor.DELTA:
                ring_load = 88.0
                sync_pct = 95.0
                latency_ms = 0.05
                status_str = "FALLBACK · LOCKED"
            else:
                ring_load = 100.0
                sync_pct = 100.0
                latency_ms = 0.01 if self.burst_active else 0.02
                status_str = "SHIFTED · LOCKED"

            score = self.compute_ring_operator(
                q_norm=1.25 + (idx * 0.02),
                k_peer_norm=1.20 + (shifted_peer * 0.015),
                v_peer_norm=9.98,
                phi_p2p=0.999 if not self.latency_spike_injected else 0.965,
            )

            segments.append(
                SegmentTelemetry(
                    segment_id=idx,
                    label="Segment " + str(idx) + " (S" + str(idx) + ")",
                    hex_ptr=hex_addr,
                    tokens_k=base_tokens_k,
                    ring_load_pct=ring_load,
                    sync_pct=sync_pct,
                    latency_ms=latency_ms,
                    status=status_str,
                    peer_next=shifted_peer,
                    peer_prev=prev_peer,
                    local_attention_score=score,
                )
            )
        return segments

    def get_snapshot(self) -> RingStateSnapshot:
        corridor_throughput: Dict[ContextCorridor, float] = {
            ContextCorridor.ALPHA: 130_200.0,
            ContextCorridor.BRAVO: 124_800.0,
            ContextCorridor.GAMMA: 128_400.0,
            ContextCorridor.DELTA: 64_500.0,
        }
        base_tp = corridor_throughput[self.corridor]
        if self.burst_active:
            base_tp = round(base_tp * 1.12, 1)
        if self.latency_spike_injected:
            base_tp = round(base_tp * 0.97, 1)

        step_latency_us = 0.01
        if self.latency_spike_injected:
            step_latency_us = 0.03
        elif self.corridor == ContextCorridor.DELTA:
            step_latency_us = 0.08

        overlap_eff = self.compute_overlap_efficiency(
            compute_time_us=12.5,
            p2p_transfer_time_us=11.8 if not self.latency_spike_injected else 13.1,
            non_blocking=(self.corridor != ContextCorridor.DELTA),
        )

        vec_probe = [9.98, 9.99, 9.98, 9.99]
        if self.burst_active:
            vec_probe = [9.99, 10.0, 9.99, 10.0]
        elif self.latency_spike_injected:
            vec_probe = [9.95, 9.97, 9.96, 9.98]

        return RingStateSnapshot(
            chassis_id="GF-T3-341",
            corridor=self.corridor,
            sequence_throughput_gbs=base_tp,
            ring_step_latency_us=step_latency_us,
            active_segments_count=self.num_segments,
            total_segments_count=self.num_segments,
            processed_tokens_units=self.processed_tokens_units,
            engine_xp_k=round(self.engine_xp_k, 1),
            context_state="Active",
            ring_step_index=self.ring_step_index,
            overlap_efficiency_pct=overlap_eff,
            latency_spike_injected=self.latency_spike_injected,
            burst_active=self.burst_active,
            vector_probe=vec_probe,
            segments=self.build_segments(),
        )

    def trigger_context_burst(self) -> RingStateSnapshot:
        self.burst_active = not self.burst_active
        if self.burst_active:
            self.processed_tokens_units += 4_200_000
            self.engine_xp_k += 12.5
        return self.get_snapshot()

    def toggle_latency_spike(self) -> RingStateSnapshot:
        self.latency_spike_injected = not self.latency_spike_injected
        return self.get_snapshot()

    def step_ring_pass(self) -> RingStateSnapshot:
        self.ring_step_index = (self.ring_step_index + 1) % self.num_segments
        self.processed_tokens_units += 1_024_000
        self.engine_xp_k += 2.5
        return self.get_snapshot()

    def flush_arenas(self) -> RingStateSnapshot:
        self.ring_step_index = 0
        self.latency_spike_injected = False
        self.burst_active = False
        self.corridor = ContextCorridor.ALPHA
        self.processed_tokens_units = 27_800_000
        self.engine_xp_k = 75.0
        return self.get_snapshot()

    def switch_corridor(self, corridor: ContextCorridor) -> RingStateSnapshot:
        self.corridor = corridor
        return self.get_snapshot()


solver = ContextParallelismSolver(num_segments=8)


@app.get("/health")
def health_check() -> Dict[str, str]:
    return {
        "status": "OK",
        "chassis": "GF-T3-341",
        "context_state": "Active",
    }


@app.get("/api/v1/telemetry", response_model=RingStateSnapshot)
def get_telemetry() -> RingStateSnapshot:
    return solver.get_snapshot()


@app.post("/api/v1/corridor", response_model=RingStateSnapshot)
def set_corridor(payload: RingMutationRequest) -> RingStateSnapshot:
    if payload.corridor is None:
        raise HTTPException(status_code=400, detail="Corridor field is required")
    return solver.switch_corridor(payload.corridor)


@app.post("/api/v1/actions/burst", response_model=RingStateSnapshot)
def action_context_burst() -> RingStateSnapshot:
    return solver.trigger_context_burst()


@app.post("/api/v1/actions/spike", response_model=RingStateSnapshot)
def action_latency_spike() -> RingStateSnapshot:
    return solver.toggle_latency_spike()


@app.post("/api/v1/actions/step", response_model=RingStateSnapshot)
def action_step_ring() -> RingStateSnapshot:
    return solver.step_ring_pass()


@app.post("/api/v1/actions/flush", response_model=RingStateSnapshot)
def action_flush_arenas() -> RingStateSnapshot:
    return solver.flush_arenas()


@app.get("/api/v1/interlock/verify")
def verify_interlock(
    phi_p2p: float = Query(default=0.999, ge=0.05, le=1.0),
) -> Dict[str, object]:
    q_vec = [1.25 + 0.02 * i for i in range(solver.num_segments)]
    k_vec = [1.20 + 0.015 * i for i in range(solver.num_segments)]
    v_vec = [9.98 for _ in range(solver.num_segments)]
    c_context = solver.evaluate_context_interlock(q_vec, k_vec, v_vec, phi_p2p)
    return {
        "chassis": "GF-T3-341",
        "c_context_value": c_context,
        "phi_p2p": phi_p2p,
        "segments_verified": solver.num_segments,
        "status": "SHIFTED · LOCKED",
    }
