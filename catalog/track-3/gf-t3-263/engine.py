"""
GF-T3-263 Flagship Continuous Batching & In-Flight Batch Expansion Engine
Clean-Room Track 3 Architecture · MIT License
Zero-Dollar Telemetry Invariant Enforced
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from typing import Dict, List, Literal, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

# Synthetic Continuous Batching Corridors (Clean-Room IP)
CORRIDORS: Dict[str, Dict[str, float | str]] = {
    "BATCH-CORRIDOR-ALPHA (IN-FLIGHT-BATCH-EXPANSION-FABRIC · 25000-GB/S)": {
        "code": "ALPHA",
        "peak_bandwidth_gbs": 25000.0,
        "base_latency_us": 0.01,
        "sm_efficiency": 1.0,
        "mode": "CONTINUOUS_BATCH",
    },
    "BATCH-CORRIDOR-BRAVO (ITERATIVE-TOKEN-SCHEDULING-ENGINE)": {
        "code": "BRAVO",
        "peak_bandwidth_gbs": 22400.0,
        "base_latency_us": 0.02,
        "sm_efficiency": 0.96,
        "mode": "ITERATIVE_SCHED",
    },
    "BATCH-CORRIDOR-GAMMA (DYNAMIC-SLOT-RE-ALLOCATION-PIPELINE)": {
        "code": "GAMMA",
        "peak_bandwidth_gbs": 19800.0,
        "base_latency_us": 0.03,
        "sm_efficiency": 0.92,
        "mode": "DYNAMIC_REALLOC",
    },
    "BATCH-CORRIDOR-DELTA (FALLBACK-STATIC-BATCH-PASS)": {
        "code": "DELTA",
        "peak_bandwidth_gbs": 12500.0,
        "base_latency_us": 0.08,
        "sm_efficiency": 0.68,
        "mode": "STATIC_FALLBACK",
    },
}

HEX_PTRS = [
    "0xC000",
    "0xC100",
    "0xC200",
    "0xC300",
    "0xC400",
    "0xC500",
    "0xC600",
    "0xC700",
]

FORBIDDEN_SQL_XSS_PATTERN = re.compile(r"(;|--|/\*|\*/|<script|DROP\s+TABLE|UNION\s+SELECT)", re.IGNORECASE)


def sanitize_identifier(raw_value: str) -> str:
    """GridSync Zero-Trust Ingress sanitizer against SQLi, XSS, and currency symbols."""
    if not isinstance(raw_value, str):
        raise ValueError("Identifier must be a string")
    cleaned = raw_value.replace(chr(36), "").strip()
    if FORBIDDEN_SQL_XSS_PATTERN.search(cleaned):
        raise ValueError("Zero-Trust Security Gate violation: forbidden payload token detected")
    if len(cleaned) == 0 or len(cleaned) > 160:
        raise ValueError("Identifier length out of bounds")
    return cleaned


@dataclass
class ExecutionSlot:
    slot_index: int
    slot_id: str
    pointer_hex: str
    tokens_k: int = 128
    remaining_steps: int = 4
    queue_state: Literal["IN-FLIGHT", "EXPANDING", "RE-ALLOC", "IDLE"] = "IN-FLIGHT"
    latency_ms: float = 0.02
    status_label: str = "SCHEDULED · LOCKED"
    utilization_pct: float = 100.0
    sequence_id: str = "SEQ-100"


@dataclass
class ContinuousBatchingEngine:
    corridor: str = "BATCH-CORRIDOR-ALPHA (IN-FLIGHT-BATCH-EXPANSION-FABRIC · 25000-GB/S)"
    max_slots: int = 8
    processed_tokens: int = 4736000
    engine_xp_k: float = 75.0
    iteration_count: int = 128
    queue_depth: int = 16
    spike_active: bool = False
    slots: List[ExecutionSlot] = field(default_factory=list)

    def __post_init__(self) -> None:
        if not self.slots:
            self.slots = [
                ExecutionSlot(
                    slot_index=i,
                    slot_id="S" + str(i),
                    pointer_hex=HEX_PTRS[i],
                    tokens_k=128,
                    remaining_steps=4 + (i % 4),
                    queue_state="IN-FLIGHT",
                    latency_ms=0.02,
                    status_label="SCHEDULED · LOCKED",
                    utilization_pct=100.0,
                    sequence_id="SEQ-" + str(100 + i),
                )
                for i in range(self.max_slots)
            ]

    @staticmethod
    def compute_in_flight_expansion(
        prior_active: int,
        completed_count: int,
        incoming_queue: int,
        max_slots: int = 8,
    ) -> Dict[str, int]:
        """
        Core In-Flight Batch Expansion Law:
        Evicts completed sequences at the token step boundary and immediately admits waiting
        sequences from the incoming queue without stalling active slots.
        When completed slots are refilled one-for-one from incoming requests,
        N_active = N_retained + N_admitted, and for full turnover N_active = N_completed + N_incoming.
        """
        if prior_active < 0 or completed_count < 0 or incoming_queue < 0 or max_slots <= 0:
            raise ValueError("Slot counts must be non-negative and max_slots positive")
        bounded_prior = min(prior_active, max_slots)
        evicted = min(bounded_prior, completed_count)
        retained = bounded_prior - evicted
        free_capacity = max_slots - retained
        admitted = min(free_capacity, incoming_queue)
        next_active = retained + admitted
        remaining_queue = max(0, incoming_queue - admitted)
        return {
            "prior_active": bounded_prior,
            "evicted_completed": evicted,
            "retained_in_flight": retained,
            "admitted_incoming": admitted,
            "next_active": next_active,
            "remaining_queue": remaining_queue,
        }

    def calculate_throughput_gbs(self) -> float:
        spec = CORRIDORS.get(self.corridor, list(CORRIDORS.values())[0])
        peak = float(spec["peak_bandwidth_gbs"])
        active_count = sum(1 for s in self.slots if s.queue_state != "IDLE")
        slot_ratio = active_count / float(self.max_slots)
        avg_util = sum(s.utilization_pct for s in self.slots) / (100.0 * self.max_slots)
        raw_tp = peak * slot_ratio * avg_util
        return round(raw_tp, 2)

    def calculate_scheduler_latency_us(self) -> float:
        spec = CORRIDORS.get(self.corridor, list(CORRIDORS.values())[0])
        base = float(spec["base_latency_us"])
        spike_penalty = 0.01 if self.spike_active else 0.0
        return round(base + spike_penalty, 3)

    def step_iteration(self, incoming_requests: int = 4) -> Dict[str, object]:
        """Executes a single token generation iteration with in-flight slot expansion."""
        self.iteration_count += 1
        self.queue_depth += max(0, incoming_requests)

        completed_indices: List[int] = []
        for slot in self.slots:
            if slot.queue_state != "IDLE":
                slot.remaining_steps -= 1
                if slot.remaining_steps <= 0:
                    completed_indices.append(slot.slot_index)

        expansion = self.compute_in_flight_expansion(
            prior_active=sum(1 for s in self.slots if s.queue_state != "IDLE"),
            completed_count=len(completed_indices),
            incoming_queue=self.queue_depth,
            max_slots=self.max_slots,
        )

        admitted_Left = expansion["admitted_incoming"]
        for idx in completed_indices:
            target = self.slots[idx]
            if admitted_Left > 0:
                admitted_Left -= 1
                target.tokens_k = 128 + ((self.iteration_count + idx) % 4) * 16
                target.remaining_steps = 3 + (idx % 3)
                target.queue_state = "IN-FLIGHT"
                target.latency_ms = 0.02
                target.status_label = "SCHEDULED · LOCKED"
                target.utilization_pct = 100.0
                target.sequence_id = "SEQ-" + str(self.iteration_count * 10 + idx)
            else:
                target.tokens_k = 0
                target.remaining_steps = 0
                target.queue_state = "IDLE"
                target.latency_ms = 0.00
                target.status_label = "STANDBY · ZEROED"
                target.utilization_pct = 0.0

        # Fill any previously idle slots if queue still has pending items
        for slot in self.slots:
            if slot.queue_state == "IDLE" and admitted_Left > 0:
                admitted_Left -= 1
                slot.tokens_k = 128
                slot.remaining_steps = 4
                slot.queue_state = "IN-FLIGHT"
                slot.latency_ms = 0.02
                slot.status_label = "SCHEDULED · LOCKED"
                slot.utilization_pct = 100.0
                slot.sequence_id = "SEQ-" + str(self.iteration_count * 10 + slot.slot_index)

        self.queue_depth = expansion["remaining_queue"]
        active_slots = sum(1 for s in self.slots if s.queue_state != "IDLE")
        tokens_delta = active_slots * 16000
        self.processed_tokens += tokens_delta
        self.engine_xp_k = round(self.engine_xp_k + (tokens_delta / 10000.0), 1)

        return self.snapshot()

    def trigger_continuous_burst(self) -> Dict[str, object]:
        """Saturates all 8 slots at 100% tensor core utilization in-flight."""
        self.iteration_count += 1
        self.spike_active = False
        for idx, slot in enumerate(self.slots):
            slot.tokens_k = 160 if idx % 2 == 0 else 128
            slot.remaining_steps = 5
            slot.queue_state = "IN-FLIGHT"
            slot.latency_ms = 0.01
            slot.status_label = "SCHEDULED · LOCKED"
            slot.utilization_pct = 100.0
        self.processed_tokens += 256000
        self.engine_xp_k = round(self.engine_xp_k + 12.5, 1)
        return self.snapshot()

    def toggle_queue_spike(self) -> Dict[str, object]:
        """Simulates an incoming request queue spike forcing dynamic slot re-allocation."""
        self.spike_active = not self.spike_active
        if self.spike_active:
            self.queue_depth += 32
            for idx, slot in enumerate(self.slots):
                slot.tokens_k = 192 if idx < 4 else 144
                slot.queue_state = "RE-ALLOC" if idx % 2 == 1 else "EXPANDING"
                slot.latency_ms = 0.03
                slot.status_label = "RE-ALLOC · LOCKED"
                slot.utilization_pct = 100.0
            self.processed_tokens += 192000
        else:
            for slot in self.slots:
                slot.tokens_k = 128
                slot.queue_state = "IN-FLIGHT"
                slot.latency_ms = 0.02
                slot.status_label = "SCHEDULED · LOCKED"
                slot.utilization_pct = 100.0
        return self.snapshot()

    def flush_buffers(self) -> Dict[str, object]:
        """Flushes KV cache batch buffers and re-initializes deterministic 8-slot lock."""
        self.spike_active = False
        self.queue_depth = 8
        self.processed_tokens = 4736000
        self.engine_xp_k = 75.0
        for idx, slot in enumerate(self.slots):
            slot.tokens_k = 128
            slot.remaining_steps = 4 + (idx % 4)
            slot.queue_state = "IN-FLIGHT"
            slot.latency_ms = 0.02
            slot.status_label = "SCHEDULED · LOCKED"
            slot.utilization_pct = 100.0
        return self.snapshot()

    def snapshot(self) -> Dict[str, object]:
        active_count = sum(1 for s in self.slots if s.queue_state != "IDLE")
        throughput = self.calculate_throughput_gbs()
        latency_us = self.calculate_scheduler_latency_us()
        vec = [
            round(2.50 + (i * 0.01) + (0.02 if self.spike_active else 0.01), 2)
            for i in range(4)
        ]
        return {
            "engine_id": "GF-T3-263",
            "corridor": self.corridor,
            "throughput_gbs": throughput,
            "scheduler_latency_us": latency_us,
            "active_slots": active_count,
            "max_slots": self.max_slots,
            "processed_tokens": self.processed_tokens,
            "engine_xp_k": self.engine_xp_k,
            "batch_state": "In-Flight Active" if active_count > 0 else "Standby Zeroed",
            "spike_active": self.spike_active,
            "queue_depth": self.queue_depth,
            "iteration_count": self.iteration_count,
            "vector_signature": vec,
            "slots": [
                {
                    "slot_index": s.slot_index,
                    "slot_id": s.slot_id,
                    "pointer_hex": s.pointer_hex,
                    "tokens_k": s.tokens_k,
                    "queue_state": s.queue_state,
                    "latency_ms": s.latency_ms,
                    "status_label": s.status_label,
                    "utilization_pct": s.utilization_pct,
                    "sequence_id": s.sequence_id,
                }
                for s in self.slots
            ],
        }


class ScheduleStepPayload(BaseModel):
    corridor: str = Field(
        default="BATCH-CORRIDOR-ALPHA (IN-FLIGHT-BATCH-EXPANSION-FABRIC · 25000-GB/S)"
    )
    incoming_requests: int = Field(default=4, ge=0, le=128)

    @field_validator("corridor")
    @classmethod
    def validate_corridor(cls, value: str) -> str:
        cleaned = sanitize_identifier(value)
        if cleaned not in CORRIDORS:
            raise ValueError("Unsupported continuous batching corridor")
        return cleaned


app = FastAPI(
    title="GF-T3-263 Continuous Batching Engine API",
    version="3.2.63",
    description="Track 3 In-Flight Batch Expansion and Iterative Token Scheduling Engine",
)

ENGINE_INSTANCE = ContinuousBatchingEngine()


@app.get("/api/v1/telemetry")
def get_telemetry() -> Dict[str, object]:
    return ENGINE_INSTANCE.snapshot()


@app.post("/api/v1/step")
def post_step(payload: ScheduleStepPayload) -> Dict[str, object]:
    ENGINE_INSTANCE.corridor = payload.corridor
    return ENGINE_INSTANCE.step_iteration(incoming_requests=payload.incoming_requests)


@app.post("/api/v1/burst")
def post_burst() -> Dict[str, object]:
    return ENGINE_INSTANCE.trigger_continuous_burst()


@app.post("/api/v1/spike")
def post_spike() -> Dict[str, object]:
    return ENGINE_INSTANCE.toggle_queue_spike()


@app.post("/api/v1/flush")
def post_flush() -> Dict[str, object]:
    return ENGINE_INSTANCE.flush_buffers()
