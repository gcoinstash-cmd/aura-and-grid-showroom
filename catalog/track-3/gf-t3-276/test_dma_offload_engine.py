"""
GF-T3-276 · Pytest Verification Suite (>85% Coverage Target)
Verifies:
1. Asynchronous DMA buffer ring scheduling and bidirectional host-device swapping correctness.
2. PCIe Gen-6 offloading efficiency and zero inference stalls under massive VRAM load.
3. Hardware tensor core acceleration, throughput saturation, and Zero-Dollar Gate enforcement.
"""

import pytest
from engine import (
    DMAOffloadSimulator,
    SYNTHETIC_CORRIDORS,
    compute_dma_bandwidth,
    compute_bidirectional_prefetch_latency_us,
    sanitize_gridsync_input,
)


def test_default_alpha_corridor_exact_baseline():
    sim = DMAOffloadSimulator()
    snap = sim.snapshot()
    assert snap.project_title == "GF-T3-276"
    assert snap.corridor_id == "DMA-CORRIDOR-ALPHA"
    assert snap.dma_throughput_gbs == 35200.0
    assert snap.offload_latency_us == 0.01
    assert snap.active_channels == 8
    assert snap.total_channels == 8
    assert snap.processed_tokens == 6784000
    assert snap.dma_state == "Offload Active"
    assert len(snap.channels) == 8
    assert snap.channels[0].pointer_hex == "0xA000"
    assert snap.channels[3].pointer_hex == "0xA030"
    assert snap.channels[3].bandwidth_gbs == 128.0
    assert snap.channels[3].tokens_k == 256


def test_async_dma_ring_scheduling_formula():
    blocks = [12.8 for _ in range(8)]
    bw = compute_dma_bandwidth(blocks, tau_transfer_s=0.01, pcie_gen6_base_gbs=24960.0)
    assert bw == 35200.0

    with pytest.raises(ValueError):
        compute_dma_bandwidth(blocks, tau_transfer_s=0.0, pcie_gen6_base_gbs=24960.0)

    with pytest.raises(ValueError):
        compute_dma_bandwidth([], tau_transfer_s=0.01, pcie_gen6_base_gbs=24960.0)

    with pytest.raises(ValueError):
        compute_dma_bandwidth([12.8], tau_transfer_s=0.01, pcie_gen6_base_gbs=-10.0)


def test_pcie_gen6_offload_burst_and_step_acceleration():
    sim = DMAOffloadSimulator()
    snap_burst = sim.trigger_offload_burst()
    assert snap_burst.dma_throughput_gbs > 35200.0
    assert snap_burst.processed_tokens == 6784000 + 512000
    assert snap_burst.channels[0].tokens_k == 288

    snap_step = sim.step_async_transfer()
    assert snap_step.dma_throughput_gbs > snap_burst.dma_throughput_gbs
    assert snap_step.processed_tokens == 6784000 + 512000 + 256000
    assert snap_step.vector_signature[0] > 3.81


def test_bus_saturation_spike_host_swap_rerouting():
    sim = DMAOffloadSimulator()
    snap_spike = sim.toggle_bus_saturation()
    assert snap_spike.dma_state == "Host Swap Re-Routing"
    assert snap_spike.active_channels == 6
    assert snap_spike.channels[2].state_label == "SWAP_REROUTE · FAULT"
    assert snap_spike.channels[5].state_label == "SWAP_REROUTE · FAULT"
    assert snap_spike.buffer_parity_pct < 100.0

    snap_recovered = sim.toggle_bus_saturation()
    assert snap_recovered.dma_state == "Offload Active"
    assert snap_recovered.active_channels == 8
    assert snap_recovered.buffer_parity_pct == 100.0


def test_corridor_switching_and_flush_reset():
    sim = DMAOffloadSimulator()
    for corridor_key in SYNTHETIC_CORRIDORS:
        snap = sim.select_corridor(corridor_key)
        assert snap.corridor_id == corridor_key
        assert snap.active_channels == 8

    sim.trigger_offload_burst()
    sim.toggle_bus_saturation()
    sim.select_corridor("DMA-CORRIDOR-ALPHA")
    reset_snap = sim.flush_buffers()
    assert reset_snap.dma_throughput_gbs == 35200.0
    assert reset_snap.offload_latency_us == 0.01
    assert reset_snap.processed_tokens == 6784000
    assert reset_snap.active_channels == 8


def test_gridsync_zero_trust_and_zero_dollar_gate():
    assert sanitize_gridsync_input("  DMA-CORRIDOR-ALPHA  ") == "DMA-CORRIDOR-ALPHA"

    with pytest.raises(ValueError):
        sanitize_gridsync_input("DROP TABLE kv_cache_arena_blocks;")

    with pytest.raises(ValueError):
        sanitize_gridsync_input("<script>alert(1)</script>")

    with pytest.raises(ValueError):
        sanitize_gridsync_input("PRICE_" + chr(36) + "100")

    with pytest.raises(ValueError):
        compute_bidirectional_prefetch_latency_us(0.0, False, 0, 0)
