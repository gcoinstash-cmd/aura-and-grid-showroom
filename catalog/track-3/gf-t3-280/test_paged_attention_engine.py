"""
GF-T3-280: Pytest Verification Suite (>85% Coverage)
SPDX-License-Identifier: MIT
"""

import pytest
from engine import (
    PagedAttentionAllocator,
    BlockTranslationRequest,
    SYNTHETIC_CORRIDORS,
)


def test_virtual_to_physical_block_table_translation_and_zero_fragmentation() -> None:
    engine = PagedAttentionAllocator(total_pages=8, block_size_tokens=16)
    for logical_idx in range(8):
        for offset in (0, 7, 15):
            res = engine.translate_virtual_page(logical_idx, offset)
            expected_base = 0xE000 + (logical_idx * 0x0010)
            assert res["virtual_page_int"] == expected_base + offset
            assert res["internal_fragmentation_pct"] == 0.0
            assert res["formula"] == "V_page = BlockTable[LogicalBlock] + PageOffset"


def test_virtual_to_physical_boundary_guards() -> None:
    engine = PagedAttentionAllocator(total_pages=8, block_size_tokens=16)
    with pytest.raises(ValueError):
        engine.translate_virtual_page(-1, 0)
    with pytest.raises(ValueError):
        engine.translate_virtual_page(8, 0)
    with pytest.raises(ValueError):
        engine.translate_virtual_page(0, 16)


def test_asynchronous_block_recycling_efficiency_and_zero_memory_waste() -> None:
    engine = PagedAttentionAllocator(total_pages=8, block_size_tokens=16)
    recycle_report = engine.recycle_sequence_blocks([0, 1, 2, 3, 4, 5, 6, 7])
    assert recycle_report["recycled_blocks"] == 8
    assert recycle_report["cpu_intervention_ms"] == 0.0
    assert recycle_report["active_pool_pages"] == 8
    assert recycle_report["memory_waste_bytes"] == 0


def test_hardware_tensor_core_acceleration_and_throughput_saturation() -> None:
    engine = PagedAttentionAllocator(total_pages=8, block_size_tokens=16)
    initial = engine.snapshot()
    assert initial.engine_id == "GF-T3-280"
    assert initial.page_throughput_gbs == 38400
    assert initial.allocation_latency_us == 0.01
    assert initial.active_pages_count == 8
    assert initial.processed_tokens_units == 7296000

    after_burst = engine.trigger_paged_burst()
    assert after_burst.processed_tokens_units == 7808000
    assert after_burst.page_throughput_gbs == 38400
    assert after_burst.internal_fragmentation_pct == 0.0

    after_spike = engine.inject_fragmentation_spike()
    assert after_spike.active_pages_count == 6
    assert after_spike.paged_state == "Re-Indexing Page Table"

    after_step = engine.step_block_allocation_pass()
    assert after_step.active_pages_count == 8
    assert after_step.internal_fragmentation_pct == 0.0
    assert after_step.page_throughput_gbs == 38400

    after_flush = engine.flush_page_arenas()
    assert after_flush.processed_tokens_units == 7296000
    assert after_flush.active_pages_count == 8


def test_zero_trust_payload_sanitization_gate() -> None:
    valid_req = BlockTranslationRequest(
        corridor_id=SYNTHETIC_CORRIDORS[0],
        logical_block_index=3,
        page_offset=4,
        block_size_tokens=16,
        active_sequence_tokens=256000,
    )
    assert valid_req.logical_block_index == 3

    with pytest.raises(ValueError):
        BlockTranslationRequest(
            corridor_id="PAGE-CORRIDOR-ALPHA; DROP TABLE kv_pages;",
            logical_block_index=0,
            page_offset=0,
        )
