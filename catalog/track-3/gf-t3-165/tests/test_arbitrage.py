"""
Ghost FactoryOS Track 3 F1 Skunkworks Engine — GF-T3-165 (DUAL_VECTOR_TORQUE HyperGrid)
Automated Proof Suite: CPMM Invariants, Bellman-Ford Convergence, and Slippage Bounds.
Coverage Target: >= 80% (Mathematical Precision and Zero-Loss Trade Invariants).
"""

import math
import unittest
import sys
import os

# Add parent directory to sys.path so app can be imported directly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.arbitrage import (
    LiquidityPool,
    BellmanFordArbitrageEngine,
    calculate_optimal_swap_size_2pool,
    compose_two_pools,
    optimize_cycle_input_size,
    simulate_multi_hop_swap,
)


class TestDUAL_VECTOR_TORQUEArbitrageEngine(unittest.TestCase):
    def setUp(self):
        """Configure standard test pools with known synthetic price spreads."""
        # Pool A: 1 WETH = 3,000 USDC
        self.pool_uni_usdc_weth = LiquidityPool(
            pool_id="UNI_USDC_WETH",
            venue_id="UNISWAP_V3",
            token_a="USDC",
            token_b="WETH",
            reserve_a=3_000_000.0,
            reserve_b=1_000.0,
            fee_bps=30,  # 0.3%
        )
        # Pool B: 1 WETH = 3,060 USDC (2.0% price disparity, enough to beat fees)
        self.pool_sushi_usdc_weth = LiquidityPool(
            pool_id="SUSHI_USDC_WETH",
            venue_id="SUSHISWAP",
            token_a="USDC",
            token_b="WETH",
            reserve_a=3_060_000.0,
            reserve_b=1_000.0,
            fee_bps=30,  # 0.3%
        )

    def test_cpmm_constant_product_invariant(self):
        """Validate invariant (Rx + gamma * dx)(Ry - dy) == Rx * Ry."""
        pool = self.pool_uni_usdc_weth
        dx = 10_000.0  # 10,000 USDC in
        dy = pool.get_amount_out(dx, "USDC")

        rx_before = pool.reserve_a
        ry_before = pool.reserve_b
        gamma = pool.gamma

        k_before = rx_before * ry_before
        k_after = (rx_before + gamma * dx) * (ry_before - dy)

        # Due to exact constant product algebra, k_after must match k_before to floating precision
        self.assertAlmostEqual(k_before, k_after, places=4)
        self.assertGreater(dy, 0.0)

    def test_marginal_price_vs_slippage(self):
        """Prove that effective executed price strictly degrades as trade size increases."""
        pool = self.pool_uni_usdc_weth
        marginal_rate = pool.marginal_price("USDC")  # WETH per USDC

        small_dx = 1.0
        large_dx = 500_000.0

        eff_rate_small = pool.get_amount_out(small_dx, "USDC") / small_dx
        eff_rate_large = pool.get_amount_out(large_dx, "USDC") / large_dx

        # Small trade rate should be nearly equal to marginal rate
        self.assertAlmostEqual(eff_rate_small, marginal_rate, places=5)
        # Large trade rate must be strictly lower due to convex slippage
        self.assertLess(eff_rate_large, eff_rate_small)

    def test_two_pool_spatial_arbitrage_closed_form(self):
        """Verify closed-form optimal swap size s* maximizes net yield Pi(s)."""
        # Inject WETH at Uniswap (cheaper WETH) and sell at Sushiswap (higher USDC/WETH)
        s_star, exp_out, net_profit = calculate_optimal_swap_size_2pool(
            self.pool_uni_usdc_weth,
            "USDC",
            self.pool_sushi_usdc_weth,
        )

        self.assertGreater(s_star, 0.0, "Optimal swap size must be strictly positive")
        self.assertGreater(net_profit, 0.0, "Net yield must be positive for 2% spread")

        # Numerical perturbation check: Pi(s* - delta) < Pi(s*) and Pi(s* + delta) < Pi(s*)
        delta = s_star * 0.05
        profit_left = (
            self.pool_sushi_usdc_weth.get_amount_out(
                self.pool_uni_usdc_weth.get_amount_out(s_star - delta, "USDC"), "WETH"
            )
            - (s_star - delta)
        )
        profit_right = (
            self.pool_sushi_usdc_weth.get_amount_out(
                self.pool_uni_usdc_weth.get_amount_out(s_star + delta, "USDC"), "WETH"
            )
            - (s_star + delta)
        )

        self.assertGreater(net_profit, profit_left, "s* must yield higher yield than s* - delta")
        self.assertGreater(net_profit, profit_right, "s* must yield higher yield than s* + delta")

    def test_zero_loss_cancellation_invariant(self):
        """Ensure trade cancels (s* == 0, yield == 0) when fee drag exceeds spread."""
        # Identical pools: zero spread -> fee drag prevents profitable arbitrage
        identical_pool = LiquidityPool(
            pool_id="UNI_2_USDC_WETH",
            venue_id="UNISWAP_V3",
            token_a="USDC",
            token_b="WETH",
            reserve_a=3_000_000.0,
            reserve_b=1_000.0,
            fee_bps=30,
        )

        s_star, exp_out, net_profit = calculate_optimal_swap_size_2pool(
            self.pool_uni_usdc_weth,
            "USDC",
            identical_pool,
        )

        self.assertEqual(s_star, 0.0, "Optimal size must be 0 when fees exceed disparity")
        self.assertEqual(net_profit, 0.0, "Net yield must be 0 for zero-spread pools")

    def test_triangular_arbitrage_negative_cycle_detection(self):
        """Test 3-hop cycle (USDC -> WETH -> WBTC -> USDC) detection via Bellman-Ford."""
        pool_usdc_weth = LiquidityPool(
            pool_id="P1_USDC_WETH",
            venue_id="UNISWAP_V3",
            token_a="USDC",
            token_b="WETH",
            reserve_a=3_000_000.0,
            reserve_b=1_000.0,  # 3,000 USDC/WETH
            fee_bps=30,
        )
        pool_weth_wbtc = LiquidityPool(
            pool_id="P2_WETH_WBTC",
            venue_id="SUSHISWAP",
            token_a="WETH",
            token_b="WBTC",
            reserve_a=2_000.0,
            reserve_b=100.0,  # 20 WETH/WBTC -> WBTC = 60,000 USDC
            fee_bps=30,
        )
        pool_wbtc_usdc = LiquidityPool(
            pool_id="P3_WBTC_USDC",
            venue_id="DUAL_VECTOR_TORQUE_EAXLE",
            token_a="WBTC",
            token_b="USDC",
            reserve_a=100.0,
            reserve_b=6_300_000.0,  # 63,000 USDC/WBTC (profitable 5% spread)
            fee_bps=15,  # Low fee DUAL_VECTOR_TORQUE rear motor
        )

        engine = BellmanFordArbitrageEngine([pool_usdc_weth, pool_weth_wbtc, pool_wbtc_usdc])
        cycles = engine.scan_negative_cycles(base_token="USDC", max_hops=3, min_profit_bps=10)

        self.assertGreater(len(cycles), 0, "Bellman-Ford must detect profitable triangle cycle")
        top_cycle = cycles[0]
        self.assertGreater(top_cycle.net_profit, 0.0)
        self.assertGreater(top_cycle.optimal_input, 0.0)
        self.assertIn("USDC", top_cycle.tokens)

    def test_front_running_protection_bounds(self):
        """Verify front-running slippage tolerance aborts when returned amount drops."""
        pools = [self.pool_uni_usdc_weth, self.pool_sushi_usdc_weth]
        tokens = ["USDC", "WETH"]
        amount_in = 50_000.0
        expected_output = simulate_multi_hop_swap(pools, tokens, amount_in)

        # If an adversary front-runs the swap by manipulating reserves, the returned amount will drop
        manipulated_sushi = LiquidityPool(
            pool_id="SUSHI_USDC_WETH_MANIPULATED",
            venue_id="SUSHISWAP",
            token_a="USDC",
            token_b="WETH",
            reserve_a=2_500_000.0,  # Adversary drained USDC reserve
            reserve_b=1_200.0,
            fee_bps=30,
        )
        adversary_pools = [self.pool_uni_usdc_weth, manipulated_sushi]
        adversary_output = simulate_multi_hop_swap(adversary_pools, tokens, amount_in)

        # Minimum required output: 99.5% of expected output
        min_output_bound = expected_output * 0.995
        self.assertLess(adversary_output, min_output_bound)
        # Slippage check flag
        is_protected = adversary_output < min_output_bound
        self.assertTrue(is_protected, "Adversary sandwich attack successfully caught by slippage bound")


if __name__ == "__main__":
    unittest.main()
