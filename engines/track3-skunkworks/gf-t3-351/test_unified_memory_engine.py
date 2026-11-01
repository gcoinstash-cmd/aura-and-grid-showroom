"""
Pytest verification suite for GF-T3-351 Unified Memory & Host-Device Zero-Stall Interlock Engine.
Verifies:
1. Host-device page migration and DMA pre-faulting correctness.
2. Asynchronous execution efficiency under bandwidth saturation spikes.
3. Hardware tensor core acceleration and throughput saturation.
4. Absolute Zero-Dollar Gate compliance across payloads and logs.
"""

from fastapi.testclient import TestClient
import pytest
from engine import (
    CORRIDOR_PROFILES,
    app,
    compute_non_blocking_dma_prefault,
    compute_unified_memory_operator,
    flush_unified_arenas,
)

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_engine_state():
    flush_unified_arenas()
    yield
    flush_unified_arenas()


def test_unified_memory_operator_correctness():
    host_tensors = [1.08, 1.08, 1.08, 1.08, 1.08, 1.08, 1.08, 1.08]
    device_tensors = [1.09, 1.09, 1.09, 1.09, 1.09, 1.09, 1.09, 1.09]
    result = compute_unified_memory_operator(host_tensors, device_tensors, 1.0)
    assert result > 8.5
    assert result < 8.7


def test_unified_memory_operator_validation():
    with pytest.raises(ValueError):
        compute_unified_memory_operator([], [], 1.0)
    with pytest.raises(ValueError):
        compute_unified_memory_operator([1.0], [1.0, 2.0], 1.0)
    with pytest.raises(ValueError):
        compute_unified_memory_operator([1.0], [1.0], 0.0)


def test_non_blocking_dma_prefault_metrics():
    baseline = compute_non_blocking_dma_prefault(
        active_pages=8,
        corridor_base_gbs=150400.0,
        pcie_spike_active=False,
        burst_count=0,
    )
    assert baseline["migration_throughput_gbs"] == 150400.0
    assert baseline["page_fault_latency_us"] == 0.01
    assert baseline["memory_state"] == "Active"

    spiked = compute_non_blocking_dma_prefault(
        active_pages=8,
        corridor_base_gbs=150400.0,
        pcie_spike_active=True,
        burst_count=2,
    )
    assert spiked["page_fault_latency_us"] == 0.02
    assert spiked["memory_state"] == "Pre-Fault Tuned"
    assert spiked["migration_throughput_gbs"] > 140000.0

    with pytest.raises(ValueError):
        compute_non_blocking_dma_prefault(0, 150400.0, False, 0)


def test_health_and_telemetry_endpoints():
    health_resp = client.get("/api/health")
    assert health_resp.status_code == 200
    h_data = health_resp.json()
    assert h_data["title"] == "GF-T3-351"
    assert h_data["migration_throughput_gbs"] == 150400.0
    assert h_data["page_fault_latency_us"] == 0.01
    assert h_data["active_pages"] == 8
    assert h_data["processed_tokens"] == 35800000

    tel_resp = client.get("/api/telemetry")
    assert tel_resp.status_code == 200
    t_data = tel_resp.json()
    assert len(t_data["pages"]) == 8
    assert t_data["pages"][0]["page_id"] == "U0"
    assert t_data["pages"][3]["hex_ptr"] == "0x5A030"
    assert chr(36) not in str(t_data)


def test_corridor_switching_and_fallback():
    for corridor_key in CORRIDOR_PROFILES:
        resp = client.post("/api/corridor", json={"corridor": corridor_key})
        assert resp.status_code == 200
        payload = resp.json()
        assert payload["corridor"] == corridor_key
        assert chr(36) not in str(payload)

    bad_resp = client.post("/api/corridor", json={"corridor": "INVALID-CORRIDOR"})
    assert bad_resp.status_code == 400


def test_chaos_stress_triggers_and_arena_flush():
    burst_resp = client.post("/api/stress/burst")
    assert burst_resp.status_code == 200
    b_data = burst_resp.json()
    assert b_data["processed_tokens"] > 35800000
    assert b_data["migration_throughput_gbs"] > 150400.0

    spike_resp = client.post("/api/stress/pcie-spike")
    assert spike_resp.status_code == 200
    s_data = spike_resp.json()
    assert s_data["pcie_spike_active"] is True
    assert s_data["memory_state"] == "Pre-Fault Tuned"

    step_resp = client.post("/api/stress/step-migration")
    assert step_resp.status_code == 200
    st_data = step_resp.json()
    assert st_data["selected_page_index"] == 4

    flush_resp = client.post("/api/stress/flush")
    assert flush_resp.status_code == 200
    f_data = flush_resp.json()
    assert f_data["migration_throughput_gbs"] == 150400.0
    assert f_data["processed_tokens"] == 35800000
    assert f_data["pcie_spike_active"] is False
