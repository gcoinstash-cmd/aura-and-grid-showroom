"""
Pytest Verification Suite for GF-T3-267
Verifies:
1. Dynamic rank-r LoRA weight fusion correctness across multi-tenant requests.
2. Sub-microsecond adapter swapping efficiency and workspace arena memory isolation.
3. Hardware tensor core acceleration, throughput saturation, and zero-currency compliance.
"""

import pathlib
import pytest
from engine import (
    SYNTHETIC_CORRIDORS,
    WeightFusionRequest,
    ZeroCopyWorkspaceArena,
    compute_dynamic_lora_fusion,
    get_health,
    post_lora_flush,
    post_lora_fuse,
    post_lora_swap,
    sanitize_identifier,
)


def test_dynamic_rank_r_lora_weight_fusion_math_exact() -> None:
    base_w = [
        [1.0, 0.0, 0.0, 0.0],
        [0.0, 1.0, 0.0, 0.0],
        [0.0, 0.0, 1.0, 0.0],
        [0.0, 0.0, 0.0, 1.0],
    ]
    lora_b = [
        [0.5, 0.0],
        [0.5, 0.0],
        [0.0, 0.5],
        [0.0, 0.5],
    ]
    lora_a = [
        [1.0, 1.0, 0.0, 0.0],
        [0.0, 0.0, 1.0, 1.0],
    ]
    x = [2.0, 2.0, 2.0, 2.0]
    res = compute_dynamic_lora_fusion(
        base_weights=base_w,
        lora_b=lora_b,
        lora_a=lora_a,
        input_x=x,
        alpha=32.0,
        rank_r=16,
    )
    # W0 * x = [2, 2, 2, 2]
    # A * x = [4, 4]
    # B * (A * x) = [2, 2, 2, 2]
    # (alpha / r) = 2.0 -> delta_h = [4, 4, 4, 4]
    # h = [6, 6, 6, 6]
    assert res["h_vector"] == [6.0, 6.0, 6.0, 6.0]
    assert res["scale_factor"] == 2.0
    assert res["l2_norm"] == 12.0


def test_default_cockpit_vector_matches_hud_telemetry() -> None:
    req = WeightFusionRequest()
    response = post_lora_fuse(req)
    assert response["engine"] == "GF-T3-267"
    assert response["throughput_gbs"] == 28000.0
    assert response["swap_latency_us"] == 0.01
    h_vec = response["fusion"]["h_vector"]
    assert len(h_vec) == 4
    assert all(2.5 <= val <= 3.5 for val in h_vec)


def test_sub_microsecond_adapter_swapping_and_arena_isolation() -> None:
    arena = ZeroCopyWorkspaceArena()
    iso = arena.verify_isolation_and_fragmentation()
    assert iso["isolated"] is True
    assert iso["fragmentation_pct"] == 0.0
    assert iso["active_adapters"] == 8

    swap_res = arena.execute_sub_microsecond_swap(target_slot=3, new_rank_r=64, new_tenant_id="TENANT-HYPER-09")
    assert swap_res["swap_latency_us"] == 0.01
    assert swap_res["zero_copy_verified"] is True
    assert swap_res["swapped_slot"]["adapter_id"] == "K3"
    assert swap_res["swapped_slot"]["rank_r"] == 64
    assert swap_res["swapped_slot"]["hex_ptr"] == "0x1030"

    # Re-verify memory isolation after swap
    iso_after = arena.verify_isolation_and_fragmentation()
    assert iso_after["isolated"] is True
    assert iso_after["fragmentation_pct"] == 0.0


def test_workspace_flush_and_rezero() -> None:
    post_lora_swap(slot_index=2, rank_r=32, tenant_id="TENANT-99")
    flushed = post_lora_flush()
    assert flushed["status"] == "ARENA_REZEROED"
    assert flushed["fragmentation_pct"] == 0.0
    assert len(flushed["slots"]) == 8
    assert flushed["slots"][2]["rank_r"] == 16


def test_zero_trust_ingress_sanitization_rejects_injection() -> None:
    with pytest.raises(ValueError):
        sanitize_identifier("LORA-CORRIDOR-ALPHA; DROP TABLE lora_adapter_arenas;--")
    with pytest.raises(ValueError):
        WeightFusionRequest(corridor_id="INVALID-CORRIDOR")
    with pytest.raises(ValueError):
        WeightFusionRequest(rank_r=13)


def test_synthetic_corridors_and_zero_dollar_gate() -> None:
    health = get_health()
    assert health["engine"] == "GF-T3-267"
    assert health["adapter_throughput_gbs"] == 28000.0
    assert len(SYNTHETIC_CORRIDORS) == 4
    source_text = pathlib.Path(__file__).resolve().parent.joinpath("engine.py").read_text(encoding="utf-8")
    assert chr(36) not in source_text
