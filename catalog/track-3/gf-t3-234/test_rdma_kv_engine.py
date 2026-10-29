"""
SPDX-License-Identifier: MIT
GF-T3-234: Pytest Verification Suite (>80% Coverage)
Verifies:
1. KV-cache block integrity and numerical fidelity across remote node transfers.
2. RDMA fabric bandwidth saturation limits under peak concurrent block migration.
3. Completion queue signaling efficiency and error recovery on packet drops.
4. Strict Zero-Dollar Gate compliance across all API payloads and logs.
"""

import json
import pytest
from engine import (
    RdmaCorridor,
    CompletionQueueState,
    RdmaTransferRequest,
    RdmaRoCEv2FabricEngine,
    calculate_fabric_bandwidth_gbs,
    calculate_completion_latency_us,
    compute_tensor_crc32_hex,
)


def test_kv_cache_block_integrity_and_numerical_fidelity() -> None:
    """1. Verifies KV-cache block CRC-32 parity and zero numerical drift across remote GPU nodes."""
    engine = RdmaRoCEv2FabricEngine()
    kv_block = [0.125, -0.875, 1.625, 3.141592, -2.718281, 0.00042, 7.89, 16.0]

    req = RdmaTransferRequest(
        source_node_id=2,
        target_node_id=5,
        transfer_size_mb=16,
        kv_tensor_elements=kv_block,
        corridor=RdmaCorridor.ALPHA,
        inject_packet_drop=False,
    )

    receipt = engine.execute_p2p_kv_write(req)
    assert receipt.engine_id == "GF-T3-234"
    assert receipt.numerical_fidelity_verified is True
    assert receipt.max_abs_delta == 0.0
    assert receipt.source_crc32_hex == receipt.target_crc32_hex
    assert engine.remote_kv_store[5] == kv_block
    assert "NODE: N2 · TARGET: N5 · SIZE: 16 MB · PTR: 0x7FA9_B200" in receipt.inspector_summary


def test_reject_self_loop_p2p_write() -> None:
    """Ensures Zero-Trust Pydantic validation blocks self-loop remote DMA writes."""
    with pytest.raises(ValueError):
        RdmaTransferRequest(
            source_node_id=3,
            target_node_id=3,
            transfer_size_mb=16,
            kv_tensor_elements=[1.0, 2.0, 3.0, 4.0],
        )


def test_rdma_fabric_bandwidth_saturation_limits() -> None:
    """2. Verifies RDMA RoCEv2 bandwidth saturation under concurrent streams and burst ceiling."""
    bw_nominal = calculate_fabric_bandwidth_gbs(
        RdmaCorridor.ALPHA, packet_drop=False, concurrent_streams=8, burst_active=False
    )
    assert bw_nominal == 200.0

    bw_burst = calculate_fabric_bandwidth_gbs(
        RdmaCorridor.ALPHA, packet_drop=False, concurrent_streams=16, burst_active=True
    )
    assert bw_burst >= 200.0
    assert bw_burst <= 240.0

    bw_fallback = calculate_fabric_bandwidth_gbs(
        RdmaCorridor.DELTA, packet_drop=False, concurrent_streams=8, burst_active=False
    )
    assert bw_fallback == 42.5


def test_completion_queue_signaling_and_packet_drop_recovery() -> None:
    """3. Verifies completion queue doorbell efficiency and Go-Back-N retransmit recovery."""
    engine = RdmaRoCEv2FabricEngine()
    kv_block = [4.2, 8.4, 12.6, 16.8, 21.0, 25.2, 29.4, 33.6]

    # Trigger transfer with simulated RoCEv2 packet drop
    drop_req = RdmaTransferRequest(
        source_node_id=0,
        target_node_id=4,
        transfer_size_mb=32,
        kv_tensor_elements=kv_block,
        corridor=RdmaCorridor.BRAVO,
        inject_packet_drop=True,
    )
    drop_receipt = engine.execute_p2p_kv_write(drop_req)
    assert drop_receipt.retransmit_attempts == 1
    assert drop_receipt.cq_state == CompletionQueueState.RETRANSMIT_RECOVERY
    assert drop_receipt.numerical_fidelity_verified is True
    assert drop_receipt.completion_latency_us > 0.12

    # Flush rings & verify full recovery to 0.12 us and 100% parity
    flushed = engine.reset_fabric(RdmaCorridor.ALPHA)
    assert flushed.buffer_parity_pct == 100.0
    assert flushed.rdma_bandwidth_label == "RDMA Bandwidth: 200 GB/s"
    assert flushed.transfer_latency_label == "Transfer Latency: 0.12 µs"
    assert flushed.active_nodes_label == "Active Nodes: 8 Nodes"
    assert flushed.processed_tokens_label == "Processed Tokens: 1,024,000 Units"


def test_ring_buffer_step_and_zero_dollar_gate() -> None:
    """4. Verifies ring-buffer migration step and strict Zero-Dollar Gate across JSON output."""
    engine = RdmaRoCEv2FabricEngine()
    snap = engine.step_ring_migration(burst=True)
    assert snap.ring_epoch == 2
    assert snap.processed_tokens_label == "Processed Tokens: 1,152,000 Units"

    serialized = json.dumps(snap.model_dump())
    prohibited_symbol = chr(36)
    assert prohibited_symbol not in serialized
    assert calculate_completion_latency_us(RdmaCorridor.GAMMA, 16, 8, False) > 0.08
    assert compute_tensor_crc32_hex([1.0, 2.0, 3.0, 4.0], 1).startswith("0x")
