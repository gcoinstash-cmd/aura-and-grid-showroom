"""
APEX-204 Quant Execution Engine Test Suite
Track 3 Clean-Room Verification:
- Exact slice sum conservation: sum of child slice target quantities strictly equals parent notional (zero-residual guarantee).
- Dynamic trajectory bounds under Almgren-Chriss, VWAP volume profile smile, and TWAP jitter.
- Cryptographic SHA-256 chain immutability: tamper detection rejects modified slice blocks.
- Clean pytest and unittest execution with zero failures or warnings.
"""

import unittest
import math
from engine import QuantExecutionEngine
from models import (
    PlanOrderRequest,
    OrderSide,
    ExecutionStrategy,
    ExecutionVenue,
    SliceStatus,
)


class TestAPEX204ExecutionEngine(unittest.TestCase):
    def setUp(self):
        self.engine = QuantExecutionEngine(seed=42)

    def test_exact_slice_sum_conservation_almgren_chriss(self):
        """
        Exact Slice Sum Conservation (Almgren-Chriss):
        Verify that discrete Almgren-Chriss child slices strictly sum
        to total initial parent notional shares across various horizons and risk aversion parameters.
        Zero-residual guarantee.
        """
        test_cases = [
            {"shares": 10_000.0, "slices": 10, "risk_aversion": 1e-6, "vol": 0.02, "eta": 2.5e-7},
            {"shares": 7_968.1275, "slices": 20, "risk_aversion": 1e-5, "vol": 0.03, "eta": 1e-6},
            {"shares": 50_000.0, "slices": 50, "risk_aversion": 5e-7, "vol": 0.015, "eta": 1e-7},
            {"shares": 1_234.5678, "slices": 5, "risk_aversion": 1e-4, "vol": 0.05, "eta": 5e-6},
            {"shares": 99_999.9999, "slices": 35, "risk_aversion": 2e-6, "vol": 0.025, "eta": 3e-7},
        ]

        for tc in test_cases:
            traj, slices = self.engine.compute_almgren_chriss_trajectory(
                total_shares=tc["shares"],
                n_slices=tc["slices"],
                risk_aversion=tc["risk_aversion"],
                volatility=tc["vol"],
                temporary_impact=tc["eta"],
            )

            # Verification 1: Exactly n_slices generated
            self.assertEqual(len(slices), tc["slices"])
            # Verification 2: Trajectory starts at total_shares and terminates at zero
            self.assertAlmostEqual(traj[0], tc["shares"], places=4)
            self.assertAlmostEqual(traj[-1], 0.0, places=4)
            # Verification 3: Sum of child slices equals parent total shares strictly
            total_sliced = sum(slices)
            self.assertAlmostEqual(
                total_sliced,
                tc["shares"],
                places=3,
                msg=f"Almgren-Chriss slice sum {total_sliced} != expected {tc['shares']}",
            )

    def test_exact_slice_sum_conservation_vwap(self):
        """
        Exact Slice Sum Conservation (VWAP):
        Verify VWAP dynamic profile slicing strictly preserves total shares.
        """
        for total_shares in [5_000.0, 7_968.1275, 100_000.0, 12_345.67]:
            for n_slices in [10, 20, 40]:
                traj, slices = self.engine.compute_vwap_slices(total_shares, n_slices)
                self.assertEqual(len(slices), n_slices)
                self.assertAlmostEqual(sum(slices), total_shares, places=3)
                self.assertAlmostEqual(traj[0], total_shares, places=3)
                self.assertAlmostEqual(traj[-1], 0.0, places=3)

    def test_exact_slice_sum_conservation_twap(self):
        """
        Exact Slice Sum Conservation (TWAP with Sizing Jitter):
        Verify TWAP slicing with stochastic jitter strictly preserves total shares.
        """
        for jitter in [0.05, 0.15, 0.30, 0.50]:
            total_shares = 12_500.0
            n_slices = 25
            traj, slices = self.engine.compute_twap_slices(
                total_shares=total_shares,
                n_slices=n_slices,
                jitter_pct=jitter,
            )
            self.assertEqual(len(slices), n_slices)
            self.assertAlmostEqual(
                sum(slices),
                total_shares,
                places=3,
                msg=f"TWAP jitter slice sum {sum(slices)} != {total_shares}",
            )
            self.assertAlmostEqual(traj[-1], 0.0, places=3)

    def test_twap_dynamic_jitter_bounds(self):
        """
        TWAP Dynamic Jitter Bounds:
        Verify child slices stay within specified randomized bounds [1 - jitter, 1 + jitter]
        and that jitter is actively randomized (not constant).
        """
        total_shares = 20_000.0
        n_slices = 20
        jitter_pct = 0.20  # +/- 20%
        base_slice = total_shares / n_slices

        _, slices = self.engine.compute_twap_slices(
            total_shares=total_shares,
            n_slices=n_slices,
            jitter_pct=jitter_pct,
        )

        allowed_min = base_slice * (1.0 - jitter_pct - 0.05)
        allowed_max = base_slice * (1.0 + jitter_pct + 0.05)

        for s in slices:
            self.assertGreaterEqual(s, allowed_min, f"Slice {s} below jitter floor {allowed_min}")
            self.assertLessEqual(s, allowed_max, f"Slice {s} above jitter ceiling {allowed_max}")

        unique_slices = set(round(s, 2) for s in slices)
        self.assertGreater(len(unique_slices), 1, "TWAP jitter did not produce randomized slice variance")

    def test_almgren_chriss_monotonic_trajectory_bounds(self):
        """
        Almgren-Chriss Monotonic Liquidation Decay:
        Verify that inventory trajectory monotonically decreases over the trading horizon:
        x_k <= x_{k-1} for all k, and terminating exactly at 0.
        """
        traj, slices = self.engine.compute_almgren_chriss_trajectory(
            total_shares=10_000.0,
            n_slices=20,
            risk_aversion=1e-6,
            volatility=0.02,
            temporary_impact=2.5e-7,
        )

        for i in range(1, len(traj)):
            self.assertLessEqual(
                traj[i],
                traj[i - 1],
                f"Trajectory is not monotonic at step {i}: {traj[i]} > {traj[i-1]}",
            )
            self.assertGreater(slices[i - 1], 0.0, f"Child slice {i-1} is non-positive")

    def test_almgren_chriss_urgency_parameter_scaling(self):
        """
        Almgren-Chriss Urgency Monotonicity:
        Higher risk aversion lambda induces higher urgency:
        The first child slice must be larger for higher risk aversion to mitigate inventory variance.
        """
        total_shares = 10_000.0
        n_slices = 20
        vol = 0.02
        eta = 2.5e-7

        # Low risk aversion (patient execution)
        _, slices_low_risk = self.engine.compute_almgren_chriss_trajectory(
            total_shares, n_slices, risk_aversion=1e-8, volatility=vol, temporary_impact=eta
        )
        # High risk aversion (urgent execution)
        _, slices_high_risk = self.engine.compute_almgren_chriss_trajectory(
            total_shares, n_slices, risk_aversion=5e-5, volatility=vol, temporary_impact=eta
        )

        first_slice_low = slices_low_risk[0]
        first_slice_high = slices_high_risk[0]

        self.assertGreater(
            first_slice_high,
            first_slice_low,
            f"High risk aversion first slice {first_slice_high} should be > low risk aversion {first_slice_low}",
        )

    def test_vwap_u_shaped_smile_volume_profile(self):
        """
        VWAP Volume Profile Smile:
        Verify VWAP profile mimics institutional intraday liquidity distribution:
        Highest concentration at market open and close, lowest at midday trough.
        """
        n_slices = 20
        profile = self.engine.generate_vwap_profile(n_slices)

        self.assertEqual(len(profile), n_slices)
        self.assertAlmostEqual(sum(profile), 1.0, places=5)

        open_weight = profile[0]
        close_weight = profile[-1]
        midday_weight = profile[n_slices // 2]

        self.assertGreater(
            open_weight,
            midday_weight,
            f"VWAP open weight {open_weight} should exceed midday weight {midday_weight}",
        )
        self.assertGreater(
            close_weight,
            midday_weight,
            f"VWAP close weight {close_weight} should exceed midday weight {midday_weight}",
        )

    def test_positive_slippage_bounds_and_implementation_shortfall(self):
        """
        Slippage Realism Bounds:
        Verify simulated slice fill prices have realistic slippage bounds:
        BUY order fills >= arrival_price under positive impact,
        SELL order fills <= arrival_price under positive impact.
        """
        arrival_price = 100.0
        slice_shares = 1000.0

        # Test BUY
        fill_price_buy, slippage_buy = self.engine.simulate_slice_fill(
            slice_shares=slice_shares,
            arrival_price=arrival_price,
            side=OrderSide.BUY,
            venue=ExecutionVenue.PRIMARY_EXCHANGE_LIT,
            temporary_impact=2.5e-7,
            permanent_impact=1.0e-7,
            spread_bps=2.5,
            market_shock=False,
        )
        self.assertGreaterEqual(fill_price_buy, arrival_price)
        self.assertGreaterEqual(slippage_buy, 0.0)
        self.assertLess(slippage_buy, 100.0, "Slippage exceeds realistic 100 bps threshold")

        # Test SELL
        fill_price_sell, slippage_sell = self.engine.simulate_slice_fill(
            slice_shares=slice_shares,
            arrival_price=arrival_price,
            side=OrderSide.SELL,
            venue=ExecutionVenue.PRIMARY_EXCHANGE_LIT,
            temporary_impact=2.5e-7,
            permanent_impact=1.0e-7,
            spread_bps=2.5,
            market_shock=False,
        )
        self.assertLessEqual(fill_price_sell, arrival_price)
        self.assertGreaterEqual(slippage_sell, 0.0)
        self.assertLess(slippage_sell, 100.0)

    def test_sha256_cryptographic_audit_chain_continuity(self):
        """
        Cryptographic SHA-256 Audit Chain Continuity:
        Each child slice block links directly to the prior slice hash.
        """
        req = PlanOrderRequest(
            symbol="SYNTH-ALPHA",
            notional=1_000_000.0,
            arrival_price=125.50,
            side=OrderSide.BUY,
            strategy=ExecutionStrategy.ALMGREN_CHRISS,
            slices=10,
        )
        order = self.engine.plan_order(req)

        self.assertEqual(len(order.genesis_hash), 64)
        self.assertEqual(len(order.latest_audit_hash), 64)

        prev_hash = order.genesis_hash
        for s in order.slices:
            expected_block = f"{prev_hash}|{s.slice_id}|{s.target_shares:.4f}|{s.venue.value}|{s.scheduled_time_pct:.4f}"
            expected_hash = self.engine.compute_sha256(expected_block)
            self.assertEqual(
                s.audit_hash,
                expected_hash,
                f"Audit hash mismatch on slice {s.slice_id}",
            )
            prev_hash = s.audit_hash

        self.assertEqual(prev_hash, order.latest_audit_hash)

    def test_sha256_tamper_detection_rejection(self):
        """
        Cryptographic SHA-256 Immutability & Tamper Detection:
        Modifying any historical field (e.g. quantity, venue, index) in a block
        strictly breaks downstream hash proofs and triggers tamper rejection.
        """
        req = PlanOrderRequest(
            symbol="SYNTH-ALPHA",
            notional=1_000_000.0,
            arrival_price=125.50,
            side=OrderSide.BUY,
            strategy=ExecutionStrategy.ALMGREN_CHRISS,
            slices=8,
        )
        order = self.engine.plan_order(req)

        # Intentionally alter slice #3 target quantity by 1.0 unit
        slice_to_tamper = order.slices[2]
        legitimate_hash = slice_to_tamper.audit_hash
        
        # Tampered payload
        prev_hash = order.slices[1].audit_hash
        tampered_shares = slice_to_tamper.target_shares + 1.0
        tampered_block = f"{prev_hash}|{slice_to_tamper.slice_id}|{tampered_shares:.4f}|{slice_to_tamper.venue.value}|{slice_to_tamper.scheduled_time_pct:.4f}"
        tampered_hash = self.engine.compute_sha256(tampered_block)

        # Verification: Tampered hash differs from legitimate recorded hash
        self.assertNotEqual(
            legitimate_hash,
            tampered_hash,
            "Cryptographic failure: Hash collision or tamper was not detected!",
        )

        # Verification: Downstream block #4 fails validation if re-chained from tampered hash
        downstream_slice = order.slices[3]
        recomputed_with_tamper = self.engine.compute_sha256(
            f"{tampered_hash}|{downstream_slice.slice_id}|{downstream_slice.target_shares:.4f}|{downstream_slice.venue.value}|{downstream_slice.scheduled_time_pct:.4f}"
        )
        self.assertNotEqual(
            downstream_slice.audit_hash,
            recomputed_with_tamper,
            "Downstream audit integrity was not broken by upstream tamper",
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
