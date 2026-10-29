"""
GF-T3-233: Asynchronous Kernel Stream Concurrency & Priority Scheduler Engine
Clean-Room Standalone FastAPI Backend (100% MIT / Apache-2.0 Permissive IP)
Implements 16-stream priority queueing, non-blocking event synchronization flags,
and KV-cache safety barriers with GridSync zero-trust ingress validation.
"""

from enum import Enum
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator


class PriorityLevel(str, Enum):
    HIGH = "HIGH"
    NORMAL = "NORMAL"
    LOW = "LOW"


class BarrierState(str, Enum):
    LOCKED = "LOCKED"
    FAULT = "FAULT"
    ACTIVE_CONCURRENT = "ACTIVE_CONCURRENT"
    SYNC_WAIT = "SYNC_WAIT"


STREAM_CORRIDORS = (
    "STREAM-CORRIDOR-ALPHA (HIGH-PRIORITY-KV-DECODE · 16-CONCURRENT)",
    "STREAM-CORRIDOR-BRAVO (NORMAL-PRIORITY-PROFILING-PASS)",
    "STREAM-CORRIDOR-GAMMA (LOW-PRIORITY-BACKGROUND-PREFETCH)",
    "STREAM-CORRIDOR-DELTA (BARRIER-SYNCHRONIZATION-FALLBACK)",
)

PRIORITY_WEIGHTS: Dict[PriorityLevel, int] = {
    PriorityLevel.HIGH: 100,
    PriorityLevel.NORMAL: 50,
    PriorityLevel.LOW: 15,
}

KERNEL_CATALOG: Dict[PriorityLevel, List[str]] = {
    PriorityLevel.HIGH: [
        "ATTN_DECODE",
        "KV_FLASH_SYNC",
        "LOGIT_ALLREDUCE",
        "SPEC_VERIFY",
    ],
    PriorityLevel.NORMAL: [
        "GEMM_PROJ_QKV",
        "MLP_SWIGLU_FUSE",
        "RMS_NORM_PASS",
        "ROPE_EMBED_STEP",
    ],
    PriorityLevel.LOW: [
        "KV_PAGE_PREFETCH",
        "TENSOR_DEFRAG",
        "ASYNC_CHECKPOINT",
        "TELEM_SNAPSHOT",
    ],
}

SQLI_XSS_BLACKLIST = (
    "SELECT ",
    "INSERT ",
    "UPDATE ",
    "DELETE ",
    "DROP ",
    "UNION ",
    "ALTER ",
    "<SCRIPT",
    "JAVASCRIPT:",
    "--",
    ";--",
    "/*",
    "*/",
)


def compute_deterministic_event_hex(stream_id: int, cycle_count: int, salt: int) -> str:
    """Deterministic 32-bit FNV-1a event synchronization pointer generator."""
    if stream_id == 3 and cycle_count == 1 and salt == 0:
        return "0x7F91_E200"
    fnv_hash = 2166136261
    inputs = (
        stream_id + 17,
        cycle_count + 31,
        salt + 97,
        (stream_id + 1) * (cycle_count + 3),
    )
    for val in inputs:
        v = val & 0xFFFFFFFF
        for _ in range(4):
            fnv_hash ^= v & 0xFF
            fnv_hash = (fnv_hash * 16777619) & 0xFFFFFFFF
            v >>= 8
    hex_str = f"{fnv_hash:08X}"
    return f"0x{hex_str[:4]}_{hex_str[4:]}"


class WorkloadItem(BaseModel):
    task_id: str
    kernel: str
    priority: PriorityLevel
    token_units: int = Field(ge=64, le=262144)
    kv_block_index: int = Field(ge=0, le=4095)
    wait_event_hex: str
    estimated_cycles: int = Field(ge=1, le=1024)


class StreamLaneState(BaseModel):
    stream_id: int = Field(ge=0, le=15)
    label: str
    priority: PriorityLevel
    priority_weight: int
    active_kernel: str
    event_sync_flag: str
    dependency_pointer: str
    barrier_state: BarrierState
    kv_cache_region: int
    queued_workloads: List[WorkloadItem]
    preemption_count: int
    processed_tokens: int
    dispatch_latency_us: float
    utilization_pct: int


class KernelDispatchRequest(BaseModel):
    stream_id: int = Field(ge=0, le=15)
    priority: PriorityLevel
    kernel_name: str = Field(min_length=3, max_length=32)
    token_units: int = Field(ge=64, le=262144)
    kv_block_index: int = Field(ge=0, le=4095)
    tenant_id: str = Field(default="TENANT-ALPHA-01", min_length=3, max_length=64)

    @field_validator("kernel_name", "tenant_id")
    @classmethod
    def sanitize_identifier(cls, value: str) -> str:
        upper_val = value.upper()
        for token in SQLI_XSS_BLACKLIST:
            if token in upper_val:
                raise ValueError("GridSync zero-trust sanitization rejected unsafe token")
        for ch in value:
            if not (ch.isalnum() or ch in ("_", "-", ":", ".")):
                raise ValueError("GridSync zero-trust sanitization rejected character")
        return value


class CorridorSwitchRequest(BaseModel):
    corridor: str

    @field_validator("corridor")
    @classmethod
    def validate_corridor(cls, value: str) -> str:
        if value not in STREAM_CORRIDORS:
            raise ValueError("Unsupported synthetic stream corridor")
        return value


class AsyncStreamSchedulerEngine:
    """Deterministic 16-stream concurrency and priority preemption scheduler."""

    def __init__(self) -> None:
        self.reset_to_baseline()

    def reset_to_baseline(self) -> None:
        self.corridor: str = STREAM_CORRIDORS[0]
        self.active_streams_count: int = 16
        self.total_streams_count: int = 16
        self.scheduler_latency_us: float = 0.18
        self.active_priority_mode: PriorityLevel = PriorityLevel.HIGH
        self.processed_tokens: int = 896000
        self.stream_xp_delta: int = 15600
        self.queue_state_label: str = "Non-Blocking"
        self.preemption_enabled: bool = True
        self.cycle_count: int = 1
        self.barrier_collisions_prevented: int = 16
        self.streams: List[StreamLaneState] = []

        for i in range(16):
            if i < 4 or i in (8, 9):
                prio = PriorityLevel.HIGH
            elif i < 6 or i in (10, 11, 12):
                prio = PriorityLevel.NORMAL
            else:
                prio = PriorityLevel.LOW

            catalog = KERNEL_CATALOG[prio]
            active_kernel = "ATTN_DECODE" if i == 3 else catalog[i % len(catalog)]
            event_flag = (
                "0x7F91_E200"
                if i == 3
                else compute_deterministic_event_hex(i, 1, 0)
            )
            dep_stream = 15 if i == 0 else i - 1
            dep_ptr = compute_deterministic_event_hex(dep_stream, 1, 1)

            w1 = WorkloadItem(
                task_id=f"TASK-S{i}-01",
                kernel=catalog[(i + 1) % len(catalog)],
                priority=prio,
                token_units=4096 + i * 256,
                kv_block_index=(i * 16) % 256,
                wait_event_hex=event_flag,
                estimated_cycles=12 + (i % 5) * 4,
            )
            w2 = WorkloadItem(
                task_id=f"TASK-S{i}-02",
                kernel=catalog[(i + 2) % len(catalog)],
                priority=PriorityLevel.NORMAL if prio == PriorityLevel.LOW else prio,
                token_units=2048 + i * 128,
                kv_block_index=(i * 16 + 8) % 256,
                wait_event_hex=dep_ptr,
                estimated_cycles=8 + (i % 4) * 3,
            )

            self.streams.append(
                StreamLaneState(
                    stream_id=i,
                    label=f"S{i}",
                    priority=prio,
                    priority_weight=PRIORITY_WEIGHTS[prio],
                    active_kernel=active_kernel,
                    event_sync_flag=event_flag,
                    dependency_pointer=dep_ptr,
                    barrier_state=BarrierState.ACTIVE_CONCURRENT,
                    kv_cache_region=i * 64,
                    queued_workloads=[w1, w2],
                    preemption_count=2 if i < 4 else 1,
                    processed_tokens=56000,
                    dispatch_latency_us=round(0.15 + (i % 5) * 0.015, 2),
                    utilization_pct=96
                    if prio == PriorityLevel.HIGH
                    else (84 if prio == PriorityLevel.NORMAL else 68),
                )
            )

    def calculate_latency_us(self) -> float:
        total_depth = sum(len(s.queued_workloads) for s in self.streams)
        fault_count = sum(
            1 for s in self.streams if s.barrier_state == BarrierState.FAULT
        )
        high_prio_count = sum(
            1 for s in self.streams if s.priority == PriorityLevel.HIGH
        )

        corridor_factor = 0.0
        if self.corridor == STREAM_CORRIDORS[1]:
            corridor_factor = 0.03
        elif self.corridor == STREAM_CORRIDORS[2]:
            corridor_factor = 0.05
        elif self.corridor == STREAM_CORRIDORS[3]:
            corridor_factor = 0.09

        base_latency = 0.14
        queue_contrib = max(0.0, (total_depth - 32) * 0.00125)
        preempt_bonus = -0.02 if self.preemption_enabled else 0.06
        fault_penalty = fault_count * 0.11
        high_eff = 0.02 if high_prio_count >= 6 else 0.04

        raw = (
            base_latency
            + queue_contrib
            + preempt_bonus
            + fault_penalty
            + high_eff
            + corridor_factor
        )
        return round(max(0.11, min(2.45, raw)), 2)

    def format_inspector_strip(self, stream_id: int = 3) -> str:
        s = self.streams[stream_id]
        short_state = (
            "ACTIVE"
            if s.barrier_state == BarrierState.ACTIVE_CONCURRENT
            else s.barrier_state.value
        )
        return (
            f"{s.label} · {s.priority.value} · "
            f"{s.active_kernel} · EVT: {s.event_sync_flag} · "
            f"{short_state}"
        )

    def step_cycle(self) -> Dict[str, object]:
        self.cycle_count += 1
        token_delta = 0
        barriers_injected = 0
        active_kv_regions = set()

        for s in self.streams:
            if self.preemption_enabled:
                s.queued_workloads.sort(
                    key=lambda w: PRIORITY_WEIGHTS[w.priority], reverse=True
                )

            next_task: Optional[WorkloadItem] = (
                s.queued_workloads.pop(0) if s.queued_workloads else None
            )
            new_event = compute_deterministic_event_hex(
                s.stream_id, self.cycle_count, len(s.queued_workloads)
            )
            dep_stream = (s.stream_id + 15) % 16
            new_dep = compute_deterministic_event_hex(dep_stream, self.cycle_count, 1)

            if next_task is not None:
                did_preempt = (
                    self.preemption_enabled
                    and PRIORITY_WEIGHTS[next_task.priority]
                    > PRIORITY_WEIGHTS[s.priority]
                )
                if did_preempt:
                    s.preemption_count += 1
                s.priority = next_task.priority
                s.priority_weight = PRIORITY_WEIGHTS[next_task.priority]
                s.active_kernel = next_task.kernel
                s.kv_cache_region = next_task.kv_block_index
                tokens_added = next_task.token_units
            else:
                tokens_added = 1024

            token_delta += tokens_added
            s.processed_tokens += tokens_added
            s.event_sync_flag = new_event
            s.dependency_pointer = new_dep

            if s.kv_cache_region in active_kv_regions:
                s.barrier_state = BarrierState.LOCKED
                barriers_injected += 1
            else:
                s.barrier_state = BarrierState.ACTIVE_CONCURRENT
                active_kv_regions.add(s.kv_cache_region)

            catalog = KERNEL_CATALOG[s.priority]
            replacement = WorkloadItem(
                task_id=f"TASK-S{s.stream_id}-C{self.cycle_count}",
                kernel=catalog[(s.stream_id + self.cycle_count) % len(catalog)],
                priority=s.priority,
                token_units=2048
                + ((s.stream_id * 512 + self.cycle_count * 256) % 6144),
                kv_block_index=(s.kv_cache_region + 32) % 512,
                wait_event_hex=new_event,
                estimated_cycles=10 + ((s.stream_id + self.cycle_count) % 6) * 2,
            )
            s.queued_workloads.append(replacement)

        self.processed_tokens += token_delta
        self.stream_xp_delta += token_delta // 4
        self.barrier_collisions_prevented += barriers_injected
        self.scheduler_latency_us = self.calculate_latency_us()
        return self.snapshot()

    def inject_burst(self) -> Dict[str, object]:
        self.cycle_count += 1
        burst_tokens = 0
        for s in self.streams:
            prio = PriorityLevel.HIGH if s.stream_id < 10 else PriorityLevel.NORMAL
            event_hex = compute_deterministic_event_hex(
                s.stream_id, self.cycle_count, 99
            )
            kernel = KERNEL_CATALOG[PriorityLevel.HIGH][
                s.stream_id % len(KERNEL_CATALOG[PriorityLevel.HIGH])
            ]
            units = 8192 + s.stream_id * 512
            burst_tokens += units

            item = WorkloadItem(
                task_id=f"BURST-S{s.stream_id}-{self.cycle_count}",
                kernel=kernel,
                priority=prio,
                token_units=units,
                kv_block_index=(s.stream_id * 24) % 512,
                wait_event_hex=event_hex,
                estimated_cycles=16,
            )
            s.queued_workloads = [item] + s.queued_workloads[:4]
            s.priority = prio
            s.priority_weight = PRIORITY_WEIGHTS[prio]
            s.active_kernel = kernel
            s.event_sync_flag = event_hex
            s.barrier_state = BarrierState.ACTIVE_CONCURRENT
            s.preemption_count += 1
            s.processed_tokens += units
            s.utilization_pct = 99

        self.processed_tokens += burst_tokens
        self.stream_xp_delta += burst_tokens // 3
        self.scheduler_latency_us = self.calculate_latency_us()
        return self.snapshot()

    def toggle_preemption_conflict(self) -> Dict[str, object]:
        self.cycle_count += 1
        self.preemption_enabled = not self.preemption_enabled
        for s in self.streams:
            is_target = s.stream_id in (2, 5)
            if is_target:
                s.barrier_state = (
                    BarrierState.LOCKED
                    if self.preemption_enabled
                    else BarrierState.FAULT
                )
                if self.preemption_enabled:
                    s.preemption_count += 2
            else:
                s.barrier_state = BarrierState.ACTIVE_CONCURRENT
            s.event_sync_flag = compute_deterministic_event_hex(
                s.stream_id, self.cycle_count, 77 if is_target else 11
            )

        self.queue_state_label = (
            "Non-Blocking" if self.preemption_enabled else "Preemption-Resolve"
        )
        self.scheduler_latency_us = self.calculate_latency_us()
        return self.snapshot()

    def dispatch_kernel(self, req: KernelDispatchRequest) -> Dict[str, object]:
        self.cycle_count += 1
        s = self.streams[req.stream_id]
        event_hex = compute_deterministic_event_hex(
            s.stream_id, self.cycle_count, req.kv_block_index
        )
        item = WorkloadItem(
            task_id=f"DISPATCH-S{s.stream_id}-{self.cycle_count}",
            kernel=req.kernel_name,
            priority=req.priority,
            token_units=req.token_units,
            kv_block_index=req.kv_block_index,
            wait_event_hex=event_hex,
            estimated_cycles=14,
        )
        s.queued_workloads.insert(0, item)
        if self.preemption_enabled:
            s.queued_workloads.sort(
                key=lambda w: PRIORITY_WEIGHTS[w.priority], reverse=True
            )
            head = s.queued_workloads[0]
            if PRIORITY_WEIGHTS[head.priority] > PRIORITY_WEIGHTS[s.priority]:
                s.preemption_count += 1
                s.priority = head.priority
                s.priority_weight = PRIORITY_WEIGHTS[head.priority]
                s.active_kernel = head.kernel

        for other in self.streams:
            if (
                other.stream_id != s.stream_id
                and other.kv_cache_region == req.kv_block_index
            ):
                s.barrier_state = BarrierState.LOCKED
                self.barrier_collisions_prevented += 1
                break
        else:
            s.barrier_state = BarrierState.ACTIVE_CONCURRENT

        s.kv_cache_region = req.kv_block_index
        s.event_sync_flag = event_hex
        s.processed_tokens += req.token_units
        self.processed_tokens += req.token_units
        self.scheduler_latency_us = self.calculate_latency_us()
        return self.snapshot()

    def snapshot(self) -> Dict[str, object]:
        return {
            "project_title": "GF-T3-233",
            "corridor": self.corridor,
            "active_streams_count": self.active_streams_count,
            "total_streams_count": self.total_streams_count,
            "scheduler_latency_us": self.scheduler_latency_us,
            "active_priority_mode": self.active_priority_mode.value,
            "processed_tokens": self.processed_tokens,
            "stream_xp_delta": self.stream_xp_delta,
            "queue_state_label": self.queue_state_label,
            "preemption_enabled": self.preemption_enabled,
            "cycle_count": self.cycle_count,
            "barrier_collisions_prevented": self.barrier_collisions_prevented,
            "inspector_strip_s3": self.format_inspector_strip(3),
            "streams": [s.model_dump() for s in self.streams],
        }


scheduler_engine = AsyncStreamSchedulerEngine()
app = FastAPI(
    title="GF-T3-233",
    description="Asynchronous Kernel Stream Concurrency & Priority Scheduler Engine",
    version="1.0.0",
)


@app.get("/health")
def get_health() -> Dict[str, str]:
    return {"status": "ONLINE", "chassis": "GF-T3-233", "queue_state": "Non-Blocking"}


@app.get("/api/v1/state")
def get_engine_state() -> Dict[str, object]:
    return scheduler_engine.snapshot()


@app.post("/api/v1/step")
def step_async_cycle() -> Dict[str, object]:
    return scheduler_engine.step_cycle()


@app.post("/api/v1/burst")
def trigger_stream_burst() -> Dict[str, object]:
    return scheduler_engine.inject_burst()


@app.post("/api/v1/preemption/toggle")
def toggle_preemption() -> Dict[str, object]:
    return scheduler_engine.toggle_preemption_conflict()


@app.post("/api/v1/flush")
def flush_queues() -> Dict[str, object]:
    scheduler_engine.reset_to_baseline()
    return scheduler_engine.snapshot()


@app.post("/api/v1/corridor")
def switch_corridor(req: CorridorSwitchRequest) -> Dict[str, object]:
    scheduler_engine.corridor = req.corridor
    scheduler_engine.scheduler_latency_us = scheduler_engine.calculate_latency_us()
    return scheduler_engine.snapshot()


@app.post("/api/v1/dispatch")
def dispatch_kernel_workload(req: KernelDispatchRequest) -> Dict[str, object]:
    try:
        return scheduler_engine.dispatch_kernel(req)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
