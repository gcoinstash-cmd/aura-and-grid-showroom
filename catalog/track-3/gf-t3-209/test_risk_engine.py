"""
GF-T3-209: APEX-209 Multi-Regime Risk Engine Test Suite
Pytest & Unittest compliant validation suite.
Enforces:
1. Coherence constraint: ES >= VaR across 95%, 99%, 99.5% confidence levels
2. GPD tail parameter bounds: xi > 0, beta > 0
3. Cornish-Fisher convergence to Gaussian VaR when skewness = 0 and excess kurtosis = 0
4. Cryptographic SHA-256 chain immutability and tamper rejection
5. Kupiec and Christoffersen backtest statistical validity
"""

import unittest
import math
import random
from engine import (
    cornish_fisher_quantile,
    cornish_fisher_risk,
    standard_normal_quantile,
    hull_white_historical_risk,
    evt_peaks_over_threshold_risk,
    fit_gpd_moments,
    generate_monte_carlo_portfolio_losses,
    kupiec_pof_test,
    christoffersen_independence_test,
    CryptographicAuditLedger,
    AuditBlock,
    BASKET_CORE_EQUITY,
    BASKET_QUANT_FACTOR,
    BASKET_CREDIT_SPREAD
)

class TestApex209RiskEngine(unittest.TestCase):
    def setUp(self):
        random.seed(42)
        # Generate synthetic return series with heavy negative tails (Student-t / jump mixture)
        self.notional = 10000000.0  # 10,000,000 Units
        self.returns = []
        for _ in range(500):
            r = random.gauss(0.0002, 0.012)
            # Add occasional tail shock
            if random.random() < 0.05:
                r -= random.expovariate(1.0 / 0.035)
            self.returns.append(r)
        self.losses = [-r * self.notional for r in self.returns]

    def test_coherence_constraint_es_ge_var(self):
        """
        Theorem: For any coherent risk measure rho, Expected Shortfall (CVaR)
        must satisfy subadditivity and monotonicity, guaranteeing ES >= VaR.
        Test across alpha in {0.95, 0.99, 0.995}.
        """
        confidence_levels = [0.95, 0.99, 0.995]
        for alpha in confidence_levels:
            # 1. Cornish-Fisher
            cf_res = cornish_fisher_risk(self.returns, alpha=alpha, notional=self.notional)
            self.assertGreaterEqual(
                cf_res["es_units"],
                cf_res["var_units"],
                f"Cornish-Fisher violated ES >= VaR at alpha={alpha}"
            )
            self.assertGreaterEqual(
                cf_res["es_pct"],
                cf_res["var_pct"],
                f"Cornish-Fisher violated ES% >= VaR% at alpha={alpha}"
            )

            # 2. Hull-White Historical Simulation
            hw_res = hull_white_historical_risk(self.returns, alpha=alpha, notional=self.notional)
            self.assertGreaterEqual(
                hw_res["es_units"],
                hw_res["var_units"],
                f"Hull-White violated ES >= VaR at alpha={alpha}"
            )

            # 3. Extreme Value Theory POT GPD
            evt_res = evt_peaks_over_threshold_risk(self.losses, alpha=alpha, notional=self.notional)
            self.assertGreaterEqual(
                evt_res["es_units"],
                evt_res["var_units"],
                f"EVT POT violated ES >= VaR at alpha={alpha}"
            )

    def test_gpd_tail_parameter_bounds(self):
        """
        Verify Peaks-Over-Threshold Generalized Pareto Distribution parameters:
        Tail index xi > 0 (heavy-tailed Fréchet domain)
        Scale parameter beta > 0
        """
        evt_res = evt_peaks_over_threshold_risk(self.losses, alpha=0.99, notional=self.notional)
        xi = evt_res["tail_index_xi"]
        beta = evt_res["scale_beta_units"]
        
        self.assertGreater(xi, 0.0, f"GPD Tail index xi must be strictly positive, got {xi}")
        self.assertLess(xi, 1.0, f"GPD Tail index xi must be less than 1 for finite mean, got {xi}")
        self.assertGreater(beta, 0.0, f"GPD Scale parameter beta must be strictly positive, got {beta}")

    def test_cornish_fisher_gaussian_convergence(self):
        """
        Mathematical proof validation:
        When Skewness = 0 and Excess Kurtosis = 0,
        Cornish-Fisher quantile z_cf must identically equal the standard Gaussian quantile z_alpha.
        """
        test_alphas = [0.90, 0.95, 0.975, 0.99, 0.995, 0.999]
        for alpha in test_alphas:
            z_gauss = standard_normal_quantile(alpha)
            z_cf = cornish_fisher_quantile(alpha, skewness=0.0, excess_kurt=0.0)
            self.assertAlmostEqual(
                z_gauss,
                z_cf,
                places=9,
                msg=f"Cornish-Fisher failed Gaussian convergence at alpha={alpha}"
            )

    def test_cryptographic_ledger_immutability_and_tamper_rejection(self):
        """
        Validate SHA-256 chain immutability:
        1. Clean append-only ledger verifies successfully
        2. Modifying payload in an earlier block is detected and rejected
        3. Altering block hash link breaks chain verification
        """
        ledger = CryptographicAuditLedger()
        
        # Record sequential events
        b1 = ledger.record_event("FACTOR_COVARIANCE_UPDATE", {
            "basket": BASKET_CORE_EQUITY,
            "eigenvalue_ratio": 4.18,
            "condition_number": 12.3
        })
        b2 = ledger.record_event("MODEL_BACKTEST_RUN", {
            "kupiec_lr": 0.84,
            "christoffersen_lr": 0.42,
            "status": "PASS"
        })
        b3 = ledger.record_event("RISK_VECTOR_SNAPSHOT", {
            "var_99_units": 245000.0,
            "es_99_units": 312500.0
        })

        # Verify initial clean state
        is_valid, err = ledger.verify_integrity()
        self.assertTrue(is_valid, f"Clean ledger failed verification: {err}")
        self.assertEqual(len(ledger.chain), 4)  # Genesis + 3 blocks

        # Tamper test 1: Modify historical payload content in block 1
        original_payload = dict(ledger.chain[1].payload)
        ledger.chain[1].payload["eigenvalue_ratio"] = 999.99
        is_valid_tampered, err_tampered = ledger.verify_integrity()
        self.assertFalse(is_valid_tampered, "Ledger failed to detect payload tampering!")
        self.assertIn("payload_hash mismatch", err_tampered)

        # Restore payload
        ledger.chain[1].payload = original_payload
        is_valid_restored, _ = ledger.verify_integrity()
        self.assertTrue(is_valid_restored)

        # Tamper test 2: Alter previous hash linkage in block 2
        original_prev_hash = ledger.chain[2].prev_hash
        ledger.chain[2].prev_hash = "deadbeef" * 8
        is_valid_link_tamper, err_link_tamper = ledger.verify_integrity()
        self.assertFalse(is_valid_link_tamper, "Ledger failed to detect hash linkage tampering!")
        self.assertIn("prev_hash mismatch", err_link_tamper)

    def test_kupiec_and_christoffersen_backtest_properties(self):
        """
        Verify statistical mechanics of Kupiec POF and Christoffersen independence tests.
        """
        # Exactly expected failures: 250 observations at 99% confidence -> expected failures = 2.5
        kupiec_nominal = kupiec_pof_test(failures=2, total_obs=250, alpha=0.99)
        self.assertTrue(kupiec_nominal["is_accepted"])
        self.assertEqual(kupiec_nominal["basel_zone"], "GREEN")
        self.assertGreater(kupiec_nominal["p_value"], 0.05)

        # Extreme failure breach: 15 failures in 250 observations
        kupiec_breached = kupiec_pof_test(failures=15, total_obs=250, alpha=0.99)
        self.assertFalse(kupiec_breached["is_accepted"])
        self.assertEqual(kupiec_breached["basel_zone"], "RED")
        self.assertLess(kupiec_breached["p_value"], 0.001)

        # Independent breach series vs clustered breach series
        independent_series = [0]*30 + [1] + [0]*40 + [1] + [0]*50
        ind_res = christoffersen_independence_test(independent_series)
        self.assertTrue(ind_res["is_independent"])

        clustered_series = [0]*50 + [1, 1, 1, 1, 1] + [0]*50
        clustered_res = christoffersen_independence_test(clustered_series)
        self.assertFalse(clustered_res["is_independent"])

    def test_monte_carlo_correlated_paths(self):
        """
        Verify 10,000-path correlated asset simulation returns distribution.
        """
        weights = [0.5, 0.3, 0.2]
        cov_matrix = [
            [0.000400, 0.000120, 0.000080],
            [0.000120, 0.000625, 0.000150],
            [0.000080, 0.000150, 0.000225]
        ]
        losses = generate_monte_carlo_portfolio_losses(
            weights=weights,
            cov_matrix=cov_matrix,
            n_paths=10000,
            notional=self.notional,
            seed=123
        )
        self.assertEqual(len(losses), 10000)
        losses.sort()
        var_99 = losses[int(0.99 * 10000)]
        self.assertGreater(var_99, 0.0)

if __name__ == "__main__":
    unittest.main()
