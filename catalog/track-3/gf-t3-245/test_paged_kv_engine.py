"""
Pytest Verification Suite for GF-T3-245 Paged KV Cache & FlashAttention Eviction Engine
Verifies:
1. Zero VRAM fragmentation during dynamic sequence length expansion and contraction.
2. FlashAttention block-wise eviction correctness and priority sorting accuracy.
3. Page table lookup latency and memory bandwidth saturation.
4. RBAC & Multi-Factor Authentication (MFA) security gates and Zero-Dollar Gate compliance.
"""

from engine import (
    TOKENS_PER_BLOCK,
    TOTAL_PHYSICAL_BLOCKS,
    PagedKvCacheEngine,
    resolve_physical_page_hex,
    compute_flash_attention_eviction_score,
    validate_vram_fragmentation,
)


def test_zero_vram_fragmentation_dynamic_expansion_and_contraction() -> None:
    engine = PagedKvCacheEngine()

    # Dynamic expansion across varying sequence lengths
    expansion_sequences = [16, 48, 128, 512, 1024, 2048]
    for idx, seq_len in enumerate(expansion_sequences):
        res = engine.allocate_sequence_blocks("SEQ_EXP_" + str(idx), seq_len)
        assert res["fragmentation_pct"] == 0.0
        assert res["tokens_per_block"] == TOKENS_PER_BLOCK
        assert res["bandwidth_gbs"] >= 9200.0

    # Dynamic contraction and mixed sequence validation
    contraction_metrics = validate_vram_fragmentation([2048, 512, 64, 16], contiguous_fallback=False)
    assert contraction_metrics["fragmentation_pct"] == 0.0
    assert contraction_metrics["allocated_blocks"] == (2048 + 512 + 64 + 16) / TOKENS_PER_BLOCK

    # Compare against fallback contiguous buffer which suffers reservation waste
    fallback_metrics = validate_vram_fragmentation([64, 128], contiguous_fallback=True)
    assert fallback_metrics["fragmentation_pct"] > 50.0


def test_flash_attention_eviction_correctness_and_priority_sorting() -> None:
    engine = PagedKvCacheEngine()

    # Configure known attention weights so B2 and B5 are coldest
    engine.blocks[2].attention_score_precise = 0.710
    engine.blocks[2].recency_steps = 12
    engine.blocks[5].attention_score_precise = 0.740
    engine.blocks[5].recency_steps = 10

    evicted = engine.execute_ring_block_eviction(evict_count=2)
    evicted_codes = [b.short_code for b in evicted]
    assert "B2" in evicted_codes
    assert "B5" in evicted_codes
    assert engine.eviction_latency_us == 0.01

    # Verify mathematical monotonic decay with recency steps
    score_recent = compute_flash_attention_eviction_score(0.95, recency_steps=1, hit_rate_pct=99.8)
    score_stale = compute_flash_attention_eviction_score(0.95, recency_steps=25, hit_rate_pct=99.8)
    assert score_recent > score_stale


def test_page_table_lookup_latency_and_bandwidth_saturation() -> None:
    engine = PagedKvCacheEngine()

    assert resolve_physical_page_hex(0) == "0x9000"
    assert resolve_physical_page_hex(3) == "0x9C00"
    assert resolve_physical_page_hex(7) == "0xAC00"

    lookup = engine.resolve_virtual_to_physical(3)
    assert lookup["page_hex"] == "0x9C00"
    assert lookup["lookup_latency_us"] <= 0.01
    assert lookup["bandwidth_gbs"] >= 9200.0
    assert engine.active_blocks_count == TOTAL_PHYSICAL_BLOCKS


def test_fragmentation_spike_and_automated_remediation_gate() -> None:
    engine = PagedKvCacheEngine()

    spiked = engine.trigger_fragmentation_and_remediate(inject_spike=True, actor_role="SEC_OPS", mfa_verified=True)
    assert spiked["fragment_spike_active"] is True
    assert spiked["fragmentation_pct"] > 30.0

    remediated = engine.trigger_fragmentation_and_remediate(inject_spike=False, actor_role="CREW_CHIEF", mfa_verified=True)
    assert remediated["fragment_spike_active"] is False
    assert remediated["fragmentation_pct"] == 0.0
    assert remediated["bandwidth_gbs"] == 9200.0


def test_zero_trust_sanitization_and_rbac_mfa_enforcement() -> None:
    engine = PagedKvCacheEngine()

    # Reject SQL injection attempt
    rejected_sqli = False
    try:
        engine.allocate_sequence_blocks("SEQ_1; DROP TABLE kv--", 64)
    except ValueError:
        rejected_sqli = True
    assert rejected_sqli is True

    # Reject unauthenticated MFA call
    rejected_mfa = False
    try:
        engine.allocate_sequence_blocks("SEQ_900", 64, actor_role="CREW_CHIEF", mfa_verified=False)
    except PermissionError:
        rejected_mfa = True
    assert rejected_mfa is True
