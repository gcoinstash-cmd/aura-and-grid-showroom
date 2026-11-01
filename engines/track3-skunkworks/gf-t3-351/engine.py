"""
GF-T3-351: Dynamic Asynchronous Zero-Copy Unified Memory & Host-Device Zero-Stall Interlock Engine
SPDX-License-Identifier: MIT
Clean-Room Implementation — Zero External Copyleft Dependencies
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional
import math
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(
    title="GF-T3-351",
    description="Dynamic Asynchronous Zero-Copy Unified Memory & Host-Device Zero-Stall Interlock Engine",
    version="3.5.1",
)

CORRIDOR_PROFILES: Dict[str, Dict[str, float | str]] = {
    "UNIFIED-CORRIDOR-ALPHA (DYNAMIC-ZERO-COPY-FABRIC · 150400-GB/S)": {
        "id": "UNIFIED-CORRIDOR-ALPHA",
        "label": "UNIFIED-CORRIDOR-ALPHA (DYNAMIC-ZERO-COPY-FABRIC · 150400-GB/S)",
        "base_throughput_gbs": 150400.0,
        "base_fault_latency_us": 0.01,
        "pcie_tau_factor": 1.0,
        "dma_efficiency": 1.0,
        "mode": "UNIFIED_MEMORY",
    },
    "UNIFIED-CORRIDOR-BRAVO (HOST-DEVICE-PAGING-ENGINE)": {
        "id": "UNIFIED-CORRIDOR-BRAVO",
        "label": "UNIFIED-CORRIDOR-BRAVO (HOST-DEVICE-PAGING-ENGINE)",
        "base_throughput_gbs": 142800.0,
        "base_fault_latency_us": 0.02,
        "pcie_tau_factor": 0.95,
        "dma_efficiency": 0.98,
        "mode": "HOST_DEVICE_PAGING",
    },
    "UNIFIED-CORRIDOR-GAMMA (NON-BLOCKING-DMA-MIGRATION-ROUTER)": {
        "id": "UNIFIED-CORRIDOR-GAMMA",
        "label": "UNIFIED-CORRIDOR-GAMMA (NON-BLOCKING-DMA-MIGRATION-ROUTER)",
        "base_throughput_gbs": 148200.0,
        "base_fault_latency_us": 0.01,
        "pcie_tau_factor": 0.985,
        "dma_efficiency": 0.995,
        "mode": "NON_BLOCKING_DMA",
    },
    "UNIFIED-CORRIDOR-DELTA (FALLBACK-EXPLICIT-COPY-PASS)": {
        "id": "UNIFIED-CORRIDOR-DELTA",
        "label": "UNIFIED-CORRIDOR-DELTA (FALLBACK-EXPLICIT-COPY-PASS)",
        "base_throughput_gbs": 96400.0,
        "base_fault_latency_us": 0.08,
        "pcie_tau_factor": 0.64,
        "dma_efficiency": 0.85,
        "mode": "EXPLICIT_COPY_PASS",
    },
}


@dataclass
class UnifiedPageSlot:
    page_index: int
    page_id: str
    hex_ptr: str
    tokens_k: int
    unif_pct: int
    sync_pct: int
    latency_ms: float
    status: str
    dma_state: str
    host_tensor_norm: float
    device_tensor_norm: float
    pcie_tau: float


@dataclass
class UnifiedMemoryEngineState:
    corridor: str = "UNIFIED-CORRIDOR-ALPHA (DYNAMIC-ZERO-COPY-FABRIC · 150400-GB/S)"
    migration_throughput_gbs: float = 150400.0
    page_fault_latency_us: float = 0.01
    active_pages: int = 8
    total_pages: int = 8
    processed_tokens: int = 35800000
    engine_xp_k: float = 75.0
    memory_state: str = "Active"
    selected_page_index: int = 3
    pcie_spike_active: bool = False
    burst_count: int = 0
    step_count: int = 0
    vector_telemetry: List[float] = field(default_factory=lambda: [1.08, 1.09, 1.08, 1.09])
    pages: List[UnifiedPageSlot] = field(default_factory=list)
    radio_logs: List[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        if not self.pages:
            self.pages = self._build_initial_pages()
        if not self.radio_logs:
            self.radio_logs = [
                "[00:01.04] 🟢 CREW CHIEF: Asynchronous zero-copy unified memory and host-device paging engine initialized · 8 pages linked",
                "[00:01.08] 🟢 TELEMETRY: PCIe Gen5 DMA page migration verified at 150,400 GB/s with zero pipeline stalls",
            ]

    def _build_initial_pages(self) -> List[UnifiedPageSlot]:
        initial: List[UnifiedPageSlot] = []
        for idx in range(8):
            hex_addr = "0x5A0" + str(idx) + "0"
            initial.append(
                UnifiedPageSlot(
                    page_index=idx,
                    page_id="U" + str(idx),
                    hex_ptr=hex_addr,
                    tokens_k=256,
                    unif_pct=100,
                    sync_pct=100,
                    latency_ms=0.02,
                    status="MIGRATED · LOCKED",
                    dma_state="OK",
                    host_tensor_norm=1.08,
                    device_tensor_norm=1.09,
                    pcie_tau=1.0,
                )
            )
        return initial


def compute_unified_memory_operator(
    host_tensors: List[float],
    device_tensors: List[float],
    tau_pcie_gen5: float,
) -> float:
    """
    Deterministic operator:
    U_memory = sum_{u=0}^{U-1} U(Tensor_host[u], Tensor_device[u], tau_pcie_gen5)
    where U(h, d, tau) = ((h + d) * 0.5) * tau * (1.0 / (1.0 + abs(h - d)))
    """
    if len(host_tensors) != len(device_tensors) or len(host_tensors) == 0:
        raise ValueError("host_tensors and device_tensors must have equal non-zero length")
    if tau_pcie_gen5 <= 0.0:
        raise ValueError("tau_pcie_gen5 must be positive")

    total = 0.0
    for h_val, d_val in zip(host_tensors, device_tensors):
        coherence = 1.0 / (1.0 + abs(h_val - d_val))
        total += ((h_val + d_val) * 0.5) * tau_pcie_gen5 * coherence
    return round(total, 6)


def compute_non_blocking_dma_prefault(
    active_pages: int,
    corridor_base_gbs: float,
    pcie_spike_active: bool,
    burst_count: int,
) -> Dict[str, float | int | str]:
    """
    Computes deterministic Non-Blocking DMA Page Prefaulting throughput and fault latency.
    """
    if active_pages <= 0 or active_pages > 8:
        raise ValueError("active_pages must be in range 1..8")

    page_ratio = active_pages / 8.0
    burst_boost = min(burst_count * 1250.0, 12500.0)
    spike_tuning_factor = 0.94 if pcie_spike_active else 1.0

    throughput = round((corridor_base_gbs * page_ratio + burst_boost) * spike_tuning_factor, 2)
    fault_latency = round(0.01 if not pcie_spike_active else 0.02, 4)
    barrier_sync_us = round(0.08 * (1.0 / page_ratio), 4)

    return {
        "migration_throughput_gbs": throughput,
        "page_fault_latency_us": fault_latency,
        "barrier_sync_us": barrier_sync_us,
        "memory_state": "Pre-Fault Tuned" if pcie_spike_active else "Active",
    }


ENGINE_STATE = UnifiedMemoryEngineState()


class CorridorSelectRequest(BaseModel):
    corridor: str = Field(..., min_length=3)


class PageSelectRequest(BaseModel):
    page_index: int = Field(..., ge=0, le=7)


@app.get("/api/health")
def get_health() -> Dict[str, str | int | float]:
    return {
        "title": "GF-T3-351",
        "status": "ONLINE",
        "migration_throughput_gbs": ENGINE_STATE.migration_throughput_gbs,
        "page_fault_latency_us": ENGINE_STATE.page_fault_latency_us,
        "active_pages": ENGINE_STATE.active_pages,
        "processed_tokens": ENGINE_STATE.processed_tokens,
        "memory_state": ENGINE_STATE.memory_state,
    }


@app.get("/api/telemetry")
def get_telemetry() -> Dict[str, object]:
    host_norms = [p.host_tensor_norm for p in ENGINE_STATE.pages]
    device_norms = [p.device_tensor_norm for p in ENGINE_STATE.pages]
    profile = CORRIDOR_PROFILES[ENGINE_STATE.corridor]
    u_memory_val = compute_unified_memory_operator(
        host_norms,
        device_norms,
        float(profile["pcie_tau_factor"]),
    )
    return {
        "title": "GF-T3-351",
        "corridor": ENGINE_STATE.corridor,
        "mode": profile["mode"],
        "migration_throughput_gbs": ENGINE_STATE.migration_throughput_gbs,
        "page_fault_latency_us": ENGINE_STATE.page_fault_latency_us,
        "active_pages": ENGINE_STATE.active_pages,
        "total_pages": ENGINE_STATE.total_pages,
        "processed_tokens": ENGINE_STATE.processed_tokens,
        "engine_xp_k": ENGINE_STATE.engine_xp_k,
        "memory_state": ENGINE_STATE.memory_state,
        "selected_page_index": ENGINE_STATE.selected_page_index,
        "pcie_spike_active": ENGINE_STATE.pcie_spike_active,
        "u_memory_integral": u_memory_val,
        "vector_telemetry": ENGINE_STATE.vector_telemetry,
        "pages": [p.__dict__ for p in ENGINE_STATE.pages],
        "radio_logs": ENGINE_STATE.radio_logs[-4:],
    }


@app.post("/api/corridor")
def set_corridor(payload: CorridorSelectRequest) -> Dict[str, object]:
    if payload.corridor not in CORRIDOR_PROFILES:
        raise HTTPException(status_code=400, detail="Unsupported synthetic unified memory corridor")
    ENGINE_STATE.corridor = payload.corridor
    profile = CORRIDOR_PROFILES[payload.corridor]
    metrics = compute_non_blocking_dma_prefault(
        ENGINE_STATE.active_pages,
        float(profile["base_throughput_gbs"]),
        ENGINE_STATE.pcie_spike_active,
        ENGINE_STATE.burst_count,
    )
    ENGINE_STATE.migration_throughput_gbs = float(metrics["migration_throughput_gbs"])
    ENGINE_STATE.page_fault_latency_us = float(profile["base_fault_latency_us"])
    ENGINE_STATE.radio_logs.append(
        "[00:02.10] 🟢 CORRIDOR: Switched active fabric to " + str(profile["id"])
    )
    return get_telemetry()


@app.post("/api/stress/burst")
def trigger_unified_memory_burst() -> Dict[str, object]:
    ENGINE_STATE.burst_count += 1
    ENGINE_STATE.processed_tokens += 1250000
    ENGINE_STATE.engine_xp_k = round(ENGINE_STATE.engine_xp_k + 4.5, 1)
    profile = CORRIDOR_PROFILES[ENGINE_STATE.corridor]
    metrics = compute_non_blocking_dma_prefault(
        ENGINE_STATE.active_pages,
        float(profile["base_throughput_gbs"]),
        ENGINE_STATE.pcie_spike_active,
        ENGINE_STATE.burst_count,
    )
    ENGINE_STATE.migration_throughput_gbs = float(metrics["migration_throughput_gbs"])
    for idx, page in enumerate(ENGINE_STATE.pages):
        page.tokens_k = min(512, page.tokens_k + 32)
        page.status = "BURST · ZERO-COPY" if idx % 2 == 0 else "MIGRATED · LOCKED"
    ENGINE_STATE.radio_logs.append(
        "[00:03.14] 🟠 CREW CHIEF: Unified Memory Burst injected · Non-blocking DMA prefault locked across 8 pages"
    )
    return get_telemetry()


@app.post("/api/stress/pcie-spike")
def toggle_pcie_bandwidth_spike() -> Dict[str, object]:
    ENGINE_STATE.pcie_spike_active = not ENGINE_STATE.pcie_spike_active
    profile = CORRIDOR_PROFILES[ENGINE_STATE.corridor]
    metrics = compute_non_blocking_dma_prefault(
        ENGINE_STATE.active_pages,
        float(profile["base_throughput_gbs"]),
        ENGINE_STATE.pcie_spike_active,
        ENGINE_STATE.burst_count,
    )
    ENGINE_STATE.migration_throughput_gbs = float(metrics["migration_throughput_gbs"])
    ENGINE_STATE.page_fault_latency_us = float(metrics["page_fault_latency_us"])
    ENGINE_STATE.memory_state = str(metrics["memory_state"])
    for page in ENGINE_STATE.pages:
        if ENGINE_STATE.pcie_spike_active:
            page.latency_ms = 0.03
            page.status = "PRE-FAULT · TUNED"
            page.dma_state = "TUNED"
        else:
            page.latency_ms = 0.02
            page.status = "MIGRATED · LOCKED"
            page.dma_state = "OK"
    ENGINE_STATE.radio_logs.append(
        "[00:04.22] 🔵 TELEMETRY: PCIe bandwidth saturation spike toggled · Dynamic page pre-fault tuning engaged"
    )
    return get_telemetry()


@app.post("/api/stress/step-migration")
def step_asynchronous_migration_pass() -> Dict[str, object]:
    ENGINE_STATE.step_count += 1
    ENGINE_STATE.processed_tokens += 640000
    ENGINE_STATE.engine_xp_k = round(ENGINE_STATE.engine_xp_k + 2.5, 1)
    ENGINE_STATE.selected_page_index = (ENGINE_STATE.selected_page_index + 1) % 8
    delta = round(0.01 * ((ENGINE_STATE.step_count % 3) - 1), 2)
    ENGINE_STATE.vector_telemetry = [
        round(1.08 + delta, 2),
        round(1.09 - delta, 2),
        round(1.08 + delta, 2),
        round(1.09 - delta, 2),
    ]
    for idx, page in enumerate(ENGINE_STATE.pages):
        page.host_tensor_norm = round(1.08 + (idx * 0.002), 3)
        page.device_tensor_norm = round(1.09 + (idx * 0.002), 3)
        page.status = "MIGRATED · LOCKED"
    ENGINE_STATE.radio_logs.append(
        "[00:05.09] 🟢 TELEMETRY: Stepped asynchronous migration pass · Sub-microsecond barrier synchronized"
    )
    return get_telemetry()


@app.post("/api/stress/flush")
def flush_unified_arenas() -> Dict[str, object]:
    global ENGINE_STATE
    ENGINE_STATE = UnifiedMemoryEngineState()
    ENGINE_STATE.radio_logs.append(
        "[00:06.00] 🟢 CREW CHIEF: Unified memory arenas flushed and page tables re-zeroed to baseline 150,400 GB/s"
    )
    return get_telemetry()
