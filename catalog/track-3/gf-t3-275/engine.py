"""
GF-T3-275 Ultra-Wide Dynamic Batching & Continuous In-Flight Request Scheduler Engine
Clean-Room MIT-Licensed Standalone FastAPI Backend
"""

from typing import Dict, List, Optional
from dataclasses import dataclass, field
import math
import re

try:
    from fastapi import FastAPI, HTTPException
    from pydantic import BaseModel, Field, field_validator
except ImportError:
    FastAPI = None
    HTTPException = Exception
    BaseModel = object

    def Field(*args, **kwargs):
        return None

    def field_validator(*args, **kwargs):
        def decorator(fn):
            return fn
        return decorator


SYNTHETIC_BATCH_CORRIDORS: Dict[str, Dict[str, object]] = {
    "BATCH-CORRIDOR-ALPHA (CONTINUOUS-IN-FLIGHT-REQUEST-SCHEDULER-FABRIC · 34400-GB/S)": {
        "corridor_id": "BATCH-CORRIDOR-ALPHA",
        "mode": "CONTINUOUS_BATCH",
        "peak_bandwidth_gbps": 34400.0,
        "base_scheduling_latency_us": 0.01,
        "tensor_allocation_efficiency": 1.00,
        "non_blocking_join": True,
    },
    "BATCH-CORRIDOR-BRAVO (DYNAMIC-ITERATION-STEP-REALLOCATION-ENGINE)": {
        "corridor_id": "BATCH-CORRIDOR-BRAVO",
        "mode": "DYNAMIC_STEP_REALLOC",
        "peak_bandwidth_gbps": 31200.0,
        "base_scheduling_latency_us": 0.02,
        "tensor_allocation_efficiency": 0.96,
        "non_blocking_join": True,
    },
    "BATCH-CORRIDOR-GAMMA (NON-BLOCKING-REQUEST-JOINING-ROUTER)": {
        "corridor_id": "BATCH-CORRIDOR-GAMMA",
        "mode": "NON_BLOCKING_JOIN",
        "peak_bandwidth_gbps": 28800.0,
        "base_scheduling_latency_us": 0.03,
        "tensor_allocation_efficiency": 0.92,
        "non_blocking_join": True,
    },
    "BATCH-CORRIDOR-DELTA (FALLBACK-STATIC-BATCH-PASS)": {
        "corridor_id": "BATCH-CORRIDOR-DELTA",
        "mode": "STATIC_FALLBACK_PASS",
        "peak_bandwidth_gbps": 17200.0,
        "base_scheduling_latency_us": 0.09,
        "tensor_allocation_efficiency": 0.68,
        "non_blocking_join": False,
    },
}

SQL_INJECTION_PATTERNS = [
    "DROP TABLE",
    "UNION SELECT",
    "INSERT INTO",
    "DELETE FROM",
    "--",
    ";",
    "<script",
    "javascript:",
]


def sanitize_ingress_string(raw_value: str) -> str:
    """GridSync zero-trust sanitizer scrubbing SQLi, XSS, and forbidden currency symbols."""
    if not isinstance(raw_value, str):
        raise ValueError("Ingress field must be a string")
    cleaned = raw_value.strip()
    if not cleaned:
        raise ValueError("Ingress field cannot be empty")
    if chr(36) in cleaned:
        raise ValueError("Forbidden currency character detected in payload")
    upper_val = cleaned.upper()
    for pattern in SQL_INJECTION_PATTERNS:
        if pattern.upper() in upper_val:
            raise ValueError("GridSync security gate blocked suspicious pattern: " + pattern)
    return cleaned


@dataclass
class BatchSlotUnit:
    slot_index: int
    slot_id: str
    hex_ptr: str
    active_tokens_k: int
    pending_queue_req: int
    latency_ms: float
    tensor_rate_pct: int
    status_label: str
    locked: bool
    iteration_step: int = 1


@dataclass
class ContinuousBatchEngineState:
    corridor: str = "BATCH-CORRIDOR-ALPHA (CONTINUOUS-IN-FLIGHT-REQUEST-SCHEDULER-FABRIC · 34400-GB/S)"
    mesh_ptr: str = "0x8F8DC0"
    mode_tag: str = "CONTINUOUS_BATCH"
    active_batches_count: int = 8
    total_batches_capacity: int = 8
    batch_throughput_gbps: float = 34400.0
    scheduling_latency_us: float = 0.01
    processed_tokens_units: int = 6656000
    engine_xp_k: float = 75.0
    batch_state_label: str = "Continuous Active"
    concurrency_spike_active: bool = False
    burst_cycle_count: int = 0
    step_pass_count: int = 0
    vector_telemetry: List[float] = field(default_factory=lambda: [3.71, 3.75, 3.72, 3.74])
    slots: List[BatchSlotUnit] = field(default_factory=list)


def calculate_continuous_batch_tokens(active_tokens_per_slot_k: List[int], pending_queue_per_slot: List[int], tokens_per_request_k: int = 2) -> int:
    """
    Continuous In-Flight Request Batching Formula:
    B_cont = sum_{j=1..M} Token_active(j) + Queue_pending
    Returns total processed token units across all active slots and joined in-flight requests.
    """
    if len(active_tokens_per_slot_k) != len(pending_queue_per_slot):
        raise ValueError("Slot token list and pending queue list must have identical length")
    if not active_tokens_per_slot_k:
        return 0
    active_sum_k = sum(max(0, t) for t in active_tokens_per_slot_k)
    pending_tokens_k = sum(max(0, q) * max(1, tokens_per_request_k) for q in pending_queue_per_slot)
    # Scale into full token precision with continuous pipeline multiplier (2.6x)
    total_k = (active_sum_k + pending_tokens_k) * 2.6
    return int(round(total_k * 1000))


def calculate_dynamic_step_reallocation(
    active_tokens_k: int,
    pending_queue_req: int,
    corridor_efficiency: float,
    spike_active: bool = False,
) -> Dict[str, float]:
    """
    Dynamic Iteration Step Reallocation:
    Adjusts tensor core allocation percentage and slot latency per generation step
    to eliminate idle GPU padding gaps and maintain peak hardware utilization.
    """
    if active_tokens_k < 0 or pending_queue_req < 0:
        raise ValueError("Tokens and queue counts must be non-negative")
    clamped_eff = max(0.1, min(1.0, corridor_efficiency))
    load_ratio = (active_tokens_k + pending_queue_req * 2.0) / 320.0
    utilization_pct = int(round(min(100.0, max(50.0, clamped_eff * 100.0 * min(1.0, load_ratio)))))
    base_ms = 0.02 / clamped_eff
    if spike_active:
        slot_latency_ms = round(base_ms + (pending_queue_req / 1600.0), 2)
    else:
        slot_latency_ms = round(base_ms, 2)
    return {
        "tensor_rate_pct": float(utilization_pct),
        "slot_latency_ms": float(slot_latency_ms),
    }


def calculate_sub_microsecond_sync_latency(
    corridor_base_us: float,
    active_slots: int,
    spike_active: bool = False,
    step_pass_count: int = 0,
) -> float:
    """
    Sub-Microsecond Queue Synchronization:
    Coordinates waiting requests across streaming multiprocessors with zero CPU polling overhead.
    """
    if active_slots <= 0:
        return 0.09
    sm_balance_factor = 8.0 / float(max(1, active_slots))
    step_damping = max(0.85, 1.0 - (step_pass_count * 0.01))
    spike_delta = 0.02 if spike_active else 0.0
    raw_us = (corridor_base_us * sm_balance_factor * step_damping) + spike_delta
    return round(max(0.01, raw_us), 2)


def calculate_saturated_bandwidth_gbps(
    corridor_peak_gbps: float,
    slots: List[BatchSlotUnit],
    spike_active: bool = False,
) -> float:
    """
    Computes saturated in-flight batching bus throughput in GB/s from active slot utilization.
    """
    if not slots:
        return 0.0
    avg_rate = sum(s.tensor_rate_pct for s in slots) / (100.0 * len(slots))
    locked_ratio = sum(1 for s in slots if s.locked) / float(len(slots))
    spike_penalty = 0.94 if spike_active else 1.0
    throughput = corridor_peak_gbps * avg_rate * (0.85 + 0.15 * locked_ratio) * spike_penalty
    return round(throughput, 1)


class ContinuousBatchSchedulerEngine:
    """Deterministic clean-room Continuous In-Flight Request Scheduler Engine."""

    def __init__(self) -> None:
        self.state = self._create_initial_state()

    def _create_initial_state(self) -> ContinuousBatchEngineState:
        slots: List[BatchSlotUnit] = []
        for idx in range(8):
            hex_addr = "0x90" + str(idx) + "0"
            slots.append(
                BatchSlotUnit(
                    slot_index=idx,
                    slot_id="H" + str(idx),
                    hex_ptr=hex_addr,
                    active_tokens_k=256,
                    pending_queue_req=32,
                    latency_ms=0.02,
                    tensor_rate_pct=100,
                    status_label="SCHEDULED · LOCKED",
                    locked=True,
                    iteration_step=1,
                )
            )
        state = ContinuousBatchEngineState(slots=slots)
        self._recompute_aggregates(state)
        return state

    def _recompute_aggregates(self, state: ContinuousBatchEngineState) -> None:
        corridor_meta = SYNTHETIC_BATCH_CORRIDORS.get(
            state.corridor,
            SYNTHETIC_BATCH_CORRIDORS["BATCH-CORRIDOR-ALPHA (CONTINUOUS-IN-FLIGHT-REQUEST-SCHEDULER-FABRIC · 34400-GB/S)"],
        )
        eff = float(corridor_meta["tensor_allocation_efficiency"])
        peak_gbps = float(corridor_meta["peak_bandwidth_gbps"])
        base_us = float(corridor_meta["base_scheduling_latency_us"])
        state.mode_tag = str(corridor_meta["mode"])

        for slot in state.slots:
            realloc = calculate_dynamic_step_reallocation(
                slot.active_tokens_k,
                slot.pending_queue_req,
                eff,
                state.concurrency_spike_active,
            )
            slot.tensor_rate_pct = int(realloc["tensor_rate_pct"])
            slot.latency_ms = float(realloc["slot_latency_ms"])
            if state.concurrency_spike_active and slot.slot_index in (2, 5):
                slot.locked = False
                slot.status_label = "RE-ORDER · SPIKE"
            else:
                slot.locked = True
                slot.status_label = "SCHEDULED · LOCKED"

        tokens_list = [s.active_tokens_k for s in state.slots]
        queues_list = [s.pending_queue_req for s in state.slots]
        state.processed_tokens_units = calculate_continuous_batch_tokens(tokens_list, queues_list, 2)
        state.active_batches_count = sum(1 for s in state.slots if s.active_tokens_k > 0)
        state.scheduling_latency_us = calculate_sub_microsecond_sync_latency(
            base_us,
            state.active_batches_count,
            state.concurrency_spike_active,
            state.step_pass_count,
        )
        state.batch_throughput_gbps = calculate_saturated_bandwidth_gbps(
            peak_gbps,
            state.slots,
            state.concurrency_spike_active,
        )
        state.engine_xp_k = round(75.0 + (state.burst_cycle_count * 4.5) + (state.step_pass_count * 2.5), 1)
        state.batch_state_label = (
            "Concurrency Re-Order" if state.concurrency_spike_active else "Continuous Active"
        )
        base_vec = 3.71 + (state.step_pass_count * 0.01)
        state.vector_telemetry = [
            round(base_vec, 2),
            round(base_vec + 0.04, 2),
            round(base_vec + 0.01, 2),
            round(base_vec + 0.03, 2),
        ]

    def set_corridor(self, corridor_name: str) -> ContinuousBatchEngineState:
        cleaned = sanitize_ingress_string(corridor_name)
        if cleaned not in SYNTHETIC_BATCH_CORRIDORS:
            raise ValueError("Unsupported batch corridor: " + cleaned)
        self.state.corridor = cleaned
        self._recompute_aggregates(self.state)
        return self.state

    def trigger_continuous_batch_burst(self, added_tokens_k: int = 32, added_requests: int = 8) -> ContinuousBatchEngineState:
        """Dynamically joins incoming prompt requests into active generation slots without padding stalls."""
        if added_tokens_k <= 0 or added_requests <= 0:
            raise ValueError("Burst increments must be positive integers")
        self.state.burst_cycle_count += 1
        for idx, slot in enumerate(self.state.slots):
            step_offset = (idx % 2) * 4
            slot.active_tokens_k = min(512, slot.active_tokens_k + added_tokens_k + step_offset)
            slot.pending_queue_req = min(128, slot.pending_queue_req + added_requests)
            slot.iteration_step += 1
        self._recompute_aggregates(self.state)
        return self.state

    def toggle_concurrency_spike(self) -> ContinuousBatchEngineState:
        """Injects or clears a concurrency spike forcing sub-microsecond priority queue re-ordering."""
        self.state.concurrency_spike_active = not self.state.concurrency_spike_active
        for idx, slot in enumerate(self.state.slots):
            if self.state.concurrency_spike_active:
                slot.pending_queue_req = min(128, slot.pending_queue_req + (16 if idx in (2, 5) else 6))
            else:
                slot.pending_queue_req = max(32, slot.pending_queue_req - (16 if idx in (2, 5) else 6))
        self._recompute_aggregates(self.state)
        return self.state

    def step_inflight_scheduling_pass(self) -> ContinuousBatchEngineState:
        """Advances per-token iteration step, draining waiting queue requests into active token generation."""
        self.state.step_pass_count += 1
        for slot in self.state.slots:
            drained_req = min(slot.pending_queue_req, 8)
            slot.pending_queue_req = max(16, slot.pending_queue_req - drained_req + 4)
            slot.active_tokens_k = min(512, slot.active_tokens_k + (drained_req * 2))
            slot.iteration_step += 1
        self._recompute_aggregates(self.state)
        return self.state

    def flush_batch_queues(self) -> ContinuousBatchEngineState:
        """Flushes batch queues and re-zeros execution slots back to nominal locked baseline."""
        self.state = self._create_initial_state()
        return self.state

    def serialize_state(self) -> Dict[str, object]:
        return {
            "project_id": "GF-T3-275",
            "corridor": self.state.corridor,
            "mesh_ptr": self.state.mesh_ptr,
            "mode_tag": self.state.mode_tag,
            "active_batches_count": self.state.active_batches_count,
            "total_batches_capacity": self.state.total_batches_capacity,
            "batch_throughput_gbps": self.state.batch_throughput_gbps,
            "scheduling_latency_us": self.state.scheduling_latency_us,
            "processed_tokens_units": self.state.processed_tokens_units,
            "engine_xp_k": self.state.engine_xp_k,
            "batch_state_label": self.state.batch_state_label,
            "concurrency_spike_active": self.state.concurrency_spike_active,
            "burst_cycle_count": self.state.burst_cycle_count,
            "step_pass_count": self.state.step_pass_count,
            "vector_telemetry": list(self.state.vector_telemetry),
            "slots": [
                {
                    "slot_index": s.slot_index,
                    "slot_id": s.slot_id,
                    "hex_ptr": s.hex_ptr,
                    "active_tokens_k": s.active_tokens_k,
                    "pending_queue_req": s.pending_queue_req,
                    "latency_ms": s.latency_ms,
                    "tensor_rate_pct": s.tensor_rate_pct,
                    "status_label": s.status_label,
                    "locked": s.locked,
                    "iteration_step": s.iteration_step,
                }
                for s in self.state.slots
            ],
        }


engine_instance = ContinuousBatchSchedulerEngine()

if FastAPI is not None:
    app = FastAPI(
        title="GF-T3-275",
        version="3.275.0",
        description="Track 3 Ultra-Wide Dynamic Batching & Continuous In-Flight Request Scheduler Engine",
    )

    class CorridorUpdatePayload(BaseModel):
        corridor: str

    class BurstTriggerPayload(BaseModel):
        added_tokens_k: int = 32
        added_requests: int = 8

    @app.get("/api/v1/health")
    def get_health() -> Dict[str, object]:
        return {
            "project": "GF-T3-275",
            "status": "LOCKED",
            "batch_throughput_gbps": engine_instance.state.batch_throughput_gbps,
            "scheduling_latency_us": engine_instance.state.scheduling_latency_us,
        }

    @app.get("/api/v1/state")
    def get_engine_state() -> Dict[str, object]:
        return engine_instance.serialize_state()

    @app.post("/api/v1/corridor")
    def update_corridor(payload: CorridorUpdatePayload) -> Dict[str, object]:
        try:
            engine_instance.set_corridor(payload.corridor)
            return engine_instance.serialize_state()
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    @app.post("/api/v1/burst")
    def trigger_burst(payload: BurstTriggerPayload) -> Dict[str, object]:
        try:
            engine_instance.trigger_continuous_batch_burst(payload.added_tokens_k, payload.added_requests)
            return engine_instance.serialize_state()
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    @app.post("/api/v1/spike")
    def toggle_spike() -> Dict[str, object]:
        engine_instance.toggle_concurrency_spike()
        return engine_instance.serialize_state()

    @app.post("/api/v1/step")
    def step_scheduler() -> Dict[str, object]:
        engine_instance.step_inflight_scheduling_pass()
        return engine_instance.serialize_state()

    @app.post("/api/v1/flush")
    def flush_queues() -> Dict[str, object]:
        engine_instance.flush_batch_queues()
        return engine_instance.serialize_state()
