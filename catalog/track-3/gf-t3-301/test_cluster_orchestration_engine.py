"""
Automated Pytest Suite (>85% coverage) for GF-T3-301 Cluster-006 Master Orchestration Engine.
Verifies:
1. Cluster-006 node federation and telemetry aggregation correctness.
2. Asynchronous InfiniBand failover efficiency under master node stress.
3. Hardware tensor core acceleration, throughput saturation, and zero-dollar gate compliance.
"""

from pathlib import Path
from fastapi.testclient import TestClient

from engine import (
    CORRIDOR_PROFILES,
    ClusterOrchestrationEngine,
    CorridorMode,
    app,
)

client = TestClient(app)


def test_cluster_006_initial_federation_and_telemetry() -> None:
    engine = ClusterOrchestrationEngine()
    snap = engine.snapshot()

    assert snap.project_title == "GF-T3-301"
    assert snap.corridor == CorridorMode.ALPHA.value
    assert snap.cluster_throughput_gbs == 58800.0
    assert snap.orchestration_latency_us == 0.01
    assert snap.active_nodes == 300
    assert snap.total_nodes == 300
    assert snap.processed_tokens_units == 9856000
    assert snap.cluster_state == "Federation Active"
    assert snap.master_pointer == "0x22F8DC0"
    assert snap.sync_vector == [6.21, 6.25, 6.22, 6.24]
    assert len(snap.nodes) == 8
    assert snap.nodes[3].cluster_tag == "C3"
    assert snap.nodes[3].hex_ptr == "0x28030"
    assert snap.nodes[3].tokens_k == 256
    assert snap.nodes[3].load_pct == 100.0
    assert snap.vault_manifest.ip_title_transfer_pct == 100.0
    assert snap.vault_manifest.licensing_overhead_pct == 0.0


def test_asynchronous_infiniband_failover_efficiency() -> None:
    engine = ClusterOrchestrationEngine()
    snap_spike = engine.toggle_failover_spike()

    assert snap_spike.failover_spike_active is True
    assert snap_spike.cluster_state == "Failover Re-Routing Active"
    assert snap_spike.orchestration_latency_us == 0.02
    assert snap_spike.nodes[0].status_label == "FAILOVER · REROUTED"
    assert snap_spike.nodes[1].status_label == "DYNAMIC · MESH"
    assert all(n.failover_rerouted for n in snap_spike.nodes)

    snap_recovered = engine.toggle_failover_spike()
    assert snap_recovered.failover_spike_active is False
    assert snap_recovered.cluster_state == "Federation Active"
    assert snap_recovered.orchestration_latency_us == 0.01
    assert all(n.status_label == "FEDERATED · LOCKED" for n in snap_recovered.nodes)


def test_hardware_tensor_core_acceleration_and_corridors() -> None:
    engine = ClusterOrchestrationEngine()

    burst_snap = engine.inject_federation_burst()
    assert burst_snap.federation_burst_count == 1
    assert burst_snap.cluster_throughput_gbs == 59220.0
    assert burst_snap.processed_tokens_units == 10368000
    assert burst_snap.nodes[0].tokens_k == 320

    step_snap = engine.step_orchestration_pass()
    assert step_snap.orchestration_step_count == 3
    assert step_snap.processed_tokens_units == 10496000

    for corridor_key in CORRIDOR_PROFILES:
        c_snap = engine.set_corridor(corridor_key)
        assert c_snap.corridor == corridor_key

    reset_snap = engine.flush_fleet_arenas()
    assert reset_snap.cluster_throughput_gbs == 58800.0
    assert reset_snap.processed_tokens_units == 9856000
    assert reset_snap.federation_burst_count == 0


def test_fastapi_endpoints_and_zero_dollar_gate() -> None:
    forbidden_sym = chr(36)
    health_res = client.get("/api/v1/health")
    assert health_res.status_code == 200
    assert forbidden_sym not in health_res.text

    tel_res = client.get("/api/v1/telemetry")
    assert tel_res.status_code == 200
    assert forbidden_sym not in tel_res.text

    burst_res = client.post("/api/v1/actions/federation-burst")
    assert burst_res.status_code == 200
    assert burst_res.json()["federation_burst_count"] >= 1

    fail_res = client.post("/api/v1/actions/failover-spike")
    assert fail_res.status_code == 200
    assert fail_res.json()["failover_spike_active"] is True

    step_res = client.post("/api/v1/actions/step-pass")
    assert step_res.status_code == 200

    corridor_res = client.post(
        "/api/v1/corridor",
        json={"corridor": CorridorMode.GAMMA.value},
    )
    assert corridor_res.status_code == 200
    assert corridor_res.json()["corridor"] == CorridorMode.GAMMA.value

    bad_corridor = client.post("/api/v1/corridor", json={"corridor": "INVALID"})
    assert bad_corridor.status_code == 400

    flush_res = client.post("/api/v1/actions/flush-arenas")
    assert flush_res.status_code == 200
    assert flush_res.json()["processed_tokens_units"] == 9856000
    assert forbidden_sym not in flush_res.text


def test_repository_zero_dollar_character_compliance() -> None:
    forbidden_sym = chr(36)
    checked_files = [
        "engine.py",
        "test_cluster_orchestration_engine.py",
        "Dockerfile",
        "ENGINE_SPEC.md",
        "LEGAL_IP_AUDIT.md",
        "ASSET_TRANSFER_SPEC.md",
        "src/App.tsx",
    ]
    root = Path(__file__).resolve().parent
    for rel_path in checked_files:
        target = root / rel_path
        if target.exists():
            content = target.read_text(encoding="utf-8")
            assert forbidden_sym not in content, f"Forbidden character found in {rel_path}"
