"""
GF-T3-207: Pytest Mathematical Verification Suite for APEX-207 AMM Engine
Production Reference Core - Quantitative & Cryptographic Assertion Suite
Standard Commercial Asset Transfer Specification Compliant
Zero Third-Party Financial Marks | Zero Currency Symbols
"""

try:
    import pytest
except ImportError:
    pytest = None

import unittest
import math
import json
import hashlib
from engine import Apex207AmmEngine, PoolConfig, LedgerBlock


class TestApex207AmmEngine(unittest.TestCase):
    """Rigorous test suite for APEX-207 AMM Engine."""

    def setUp(self):
        """Creates a deterministic engine fixture for tests."""
        config = PoolConfig(
            pool_id="SYNTH-POOL-01",
            reserve_a_name="RESERVE-A",
            reserve_b_name="RESERVE-B",
            active_price=2.5000,
            price_lower=1.8000,
            price_upper=3.5000,
            liquidity_L=10_000_000.0,
            fee_base_bps=30.0,
        )
        self.engine = Apex207AmmEngine(config)

    # ---------------------------------------------------------------------
    # 1. Exact Reserve Invariant Conservation Across Arbitrary Swap Sizes
    # ---------------------------------------------------------------------
    def test_virtual_reserve_invariant_conservation_swap_a(self, engine=None):
        """
        Confirms that x_virt * y_virt = L^2 holds exactly before and after
        an exact A-for-B swap (accounting for deducted dynamic fee).
        """
        engine = engine or self.engine
        L = engine.liquidity_L
        expected_L2 = L * L

        x_v1, y_v1 = engine.calculate_virtual_reserves(
            engine.active_price, L, engine.price_lower, engine.price_upper
        )
        assert math.isclose(x_v1 * y_v1, expected_L2, rel_tol=1e-9)

        # Execute 50,000 units swap
        amount_in = 50_000.0
        res = engine.swap_exact_a_for_b(amount_in)

        new_price = res["execution"]["price_after"]
        x_v2, y_v2 = engine.calculate_virtual_reserves(
            new_price, L, engine.price_lower, engine.price_upper
        )

        # Invariant L^2 must strictly be conserved across virtual coordinates
        assert math.isclose(x_v2 * y_v2, expected_L2, rel_tol=1e-9)
        assert res["execution"]["amount_out"] > 0
        assert new_price < 2.5000  # More A added -> price of A drops (P in pts = B/A)

    def test_virtual_reserve_invariant_conservation_swap_b(self, engine=None):
        """
        Confirms that x_virt * y_virt = L^2 holds exactly before and after
        an exact B-for-A swap.
        """
        engine = engine or self.engine
        L = engine.liquidity_L
        expected_L2 = L * L

        # Execute 125,000 units swap of token B
        amount_in = 125_000.0
        res = engine.swap_exact_b_for_a(amount_in)

        new_price = res["execution"]["price_after"]
        x_v2, y_v2 = engine.calculate_virtual_reserves(
            new_price, L, engine.price_lower, engine.price_upper
        )

        assert math.isclose(x_v2 * y_v2, expected_L2, rel_tol=1e-9)
        assert res["execution"]["amount_out"] > 0
        assert new_price > 2.5000  # More B added -> price of A rises

    def test_arbitrary_swap_sizes_monotonicity(self, engine=None):
        """
        Tests multi-scale swap sizes (100 units to 500,000 units) to verify
        slippage monotonicity and zero negative outputs.
        """
        engine = engine or self.engine
        swap_sizes = [100.0, 1_000.0, 10_000.0, 100_000.0]
        prev_price = engine.active_price

        for sz in swap_sizes:
            res = engine.swap_exact_a_for_b(sz)
            curr_price = res["execution"]["price_after"]
            assert curr_price < prev_price
            assert res["execution"]["amount_out"] > 0
            prev_price = curr_price

    # ---------------------------------------------------------------------
    # 2. Exact Mathematical Bounds of Impermanent Loss across Extreme k
    # ---------------------------------------------------------------------
    def test_impermanent_loss_identity_at_unity(self, engine=None):
        """At k = 1.0 (no price change), IL(k) must equal strictly 0.0000%."""
        engine = engine or self.engine
        il_unity = engine.calculate_analytical_impermanent_loss(1.0)
        assert il_unity == 0.0

    def test_impermanent_loss_closed_form_exact_points(self, engine=None):
        """
        Verifies analytical closed-form:
        IL(k) = (2 * sqrt(k) / (1 + k)) - 1
        Standard reference benchmarks:
        k = 1.25 (+25%): IL = -0.0062 (-0.62%)
        k = 1.50 (+50%): IL = -0.0202 (-2.02%)
        k = 2.00 (+100%): IL = -0.0572 (-5.72%)
        k = 5.00 (+400%): IL = -0.2546 (-25.46%)
        """
        engine = engine or self.engine
        test_cases = [
            (1.25, -0.006192),
            (1.50, -0.020204),
            (2.00, -0.057191),
            (3.00, -0.133975),
            (5.00, -0.254644),
        ]
        for k_val, expected_il in test_cases:
            calc = engine.calculate_analytical_impermanent_loss(k_val)
            assert math.isclose(calc, expected_il, abs_tol=1e-5)

    def test_impermanent_loss_extreme_divergence_bounds(self, engine=None):
        """
        Tests extreme range k from 0.1 to 10.0:
        1. IL(k) must always be <= 0.0 (concavity proof).
        2. IL(k) must strictly be bounded within [-1.0, 0.0].
        3. IL(1/k) == IL(k) symmetry in logarithmic space.
        """
        engine = engine or self.engine
        k_values = [0.1, 0.25, 0.5, 0.75, 1.0, 1.33, 2.0, 4.0, 8.0, 10.0]

        for k in k_values:
            il = engine.calculate_analytical_impermanent_loss(k)
            assert -1.0 <= il <= 0.0

            # Symmetry test in log space: IL(k) == IL(1/k)
            il_inverse = engine.calculate_analytical_impermanent_loss(1.0 / k)
            assert math.isclose(il, il_inverse, rel_tol=1e-9)

    # ---------------------------------------------------------------------
    # 3. Capital Efficiency Ratio Calculation Consistency
    # ---------------------------------------------------------------------
    def test_capital_efficiency_ratio_bounds(self, engine=None):
        """
        Tests CE = 1 / (1 - sqrt(p_a / p_b)):
        For symmetric range p_a = 1.8, p_b = 3.5 around 2.5:
        ratio = sqrt(1.8 / 3.5) = sqrt(0.51428) = 0.71713
        CE = 1 / (1 - 0.71713) = 3.535x
        """
        engine = engine or self.engine
        ce = engine.calculate_capital_efficiency(1.8000, 3.5000)
        expected_ce = 1.0 / (1.0 - math.sqrt(1.8000 / 3.5000))
        assert math.isclose(ce, expected_ce, rel_tol=1e-7)
        assert ce > 3.0

    def test_capital_efficiency_tight_range_scaling(self, engine=None):
        """
        Confirms capital efficiency expands as range narrows:
        A 2% band around 2.5 (2.45 to 2.55) gives ~100x capital efficiency.
        """
        engine = engine or self.engine
        ce_wide = engine.calculate_capital_efficiency(1.0, 5.0)
        ce_narrow = engine.calculate_capital_efficiency(2.45, 2.55)
        assert ce_narrow > ce_wide
        assert ce_narrow > 50.0

    # ---------------------------------------------------------------------
    # 4. Cryptographic SHA-256 Ledger Integrity & Tamper Rejection
    # ---------------------------------------------------------------------
    def test_ledger_genesis_and_chain_linkage(self, engine=None):
        """Confirms initial genesis block validity and valid SHA-256 formatting."""
        engine = engine or self.engine
        assert len(engine.ledger) == 1
        genesis = engine.ledger[0]
        assert genesis.index == 0
        assert genesis.prev_hash == "0" * 64
        assert len(genesis.block_hash) == 64

        valid, failing_idx = engine.verify_ledger_integrity()
        assert valid is True
        assert failing_idx is None

    def test_ledger_state_transition_chaining(self, engine=None):
        """Confirms sequential actions link hashes monotonically without break."""
        engine = engine or self.engine
        engine.swap_exact_a_for_b(10_000.0)
        engine.swap_exact_b_for_a(25_000.0)
        engine.simulate_volatility_spike(1.5)
        engine.set_tick_bounds(1.9000, 3.2000)

        assert len(engine.ledger) == 5

        for i in range(1, len(engine.ledger)):
            curr = engine.ledger[i]
            prev = engine.ledger[i - 1]
            assert curr.prev_hash == prev.block_hash
            assert curr.index == i

        valid, failing_idx = engine.verify_ledger_integrity()
        assert valid is True
        assert failing_idx is None

    def test_cryptographic_tamper_rejection(self, engine=None):
        """
        Injects deliberate bit-flip tamper into an intermediate block
        and verifies the engine strictly rejects the block.
        """
        engine = engine or self.engine
        engine.swap_exact_a_for_b(5_000.0)
        engine.swap_exact_a_for_b(15_000.0)
        engine.swap_exact_b_for_a(30_000.0)

        valid, _ = engine.verify_ledger_integrity()
        assert valid is True

        # Tamper with block index 2 payload
        tampered_block = engine.ledger[2]
        tampered_block.payload["amount_in"] = 999_999.0

        # Verification must now fail at block 2
        valid_after_tamper, failing_block = engine.verify_ledger_integrity()
        assert valid_after_tamper is False
        assert failing_block == 2


if __name__ == "__main__":
    unittest.main()

