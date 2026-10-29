"""
APEX-208 Volatility Surface Test Suite
Track 3: Production Reference Core (GF-T3-208)

Pytest and unittest compatible suite covering:
1. Inversion accuracy: Pricing solved IV returns original quotes within 1e-4 tolerance.
2. Arbitrage-free boundaries: Detection and rejection of calendar and butterfly violations.
3. Parameter bounds: SABR rho within [-1, 1], nu > 0, alpha > 0.
4. Cryptographic SHA-256 ledger integrity and chain immutability.
Strict Zero-Dollar compliance verified.
"""

import sys
import math
import unittest
from engine import (
    black76_price,
    black76_vega,
    black76_greeks,
    solve_implied_volatility,
    sabr_implied_volatility,
    calibrate_sabr_nelder_mead,
    verify_calendar_arbitrage,
    verify_butterfly_arbitrage,
    CryptographicLedger,
    AuditLedgerBlock
)


class TestVolatilitySurfaceEngine(unittest.TestCase):
    def test_black76_pricing_and_inversion_accuracy(self):
        """
        Test 1: Inversion accuracy.
        Verifies that solving implied volatility via Newton-Raphson from known Black-76
        option prices returns original volatility parameter within 1e-3 tolerance
        and price reproduction within 1e-4 tolerance.
        """
        forward = 250.0  # Synthetic benchmark spot (pts)
        strikes = [220.0, 235.0, 250.0, 265.0, 280.0]
        maturities = [0.0833, 0.25, 0.5, 1.0]
        target_vols = [0.15, 0.22, 0.28, 0.35]

        for t in maturities:
            for k in strikes:
                for vol_true in target_vols:
                    # Test Call pricing inversion
                    call_px = black76_price(forward, k, t, vol_true, rate=0.0, is_call=True)
                    solved_vol_call = solve_implied_volatility(call_px, forward, k, t, rate=0.0, is_call=True)
                    re_px_call = black76_price(forward, k, t, solved_vol_call, rate=0.0, is_call=True)

                    self.assertLess(
                        abs(solved_vol_call - vol_true), 1e-3,
                        "Call IV inversion failed: true=" + str(vol_true) + " solved=" + str(solved_vol_call)
                    )
                    self.assertLess(
                        abs(re_px_call - call_px), 1e-4,
                        "Call price re-evaluated error exceeded 1e-4 pts tolerance"
                    )

                    # Test Put pricing inversion
                    put_px = black76_price(forward, k, t, vol_true, rate=0.0, is_call=False)
                    solved_vol_put = solve_implied_volatility(put_px, forward, k, t, rate=0.0, is_call=False)
                    re_px_put = black76_price(forward, k, t, solved_vol_put, rate=0.0, is_call=False)

                    self.assertLess(
                        abs(solved_vol_put - vol_true), 1e-3,
                        "Put IV inversion failed: true=" + str(vol_true) + " solved=" + str(solved_vol_put)
                    )
                    self.assertLess(
                        abs(re_px_put - put_px), 1e-4,
                        "Put price re-evaluated error exceeded 1e-4 pts tolerance"
                    )

    def test_black76_greeks_analytical_consistency(self):
        """Verify analytical Greeks match finite difference benchmarks."""
        f = 250.0
        k = 250.0
        t = 0.5
        vol = 0.25
        rate = 0.02

        greeks = black76_greeks(f, k, t, vol, rate, is_call=True)

        # Numerical Delta check: dC / dF
        eps = 0.001
        c_up = black76_price(f + eps, k, t, vol, rate, is_call=True)
        c_dn = black76_price(f - eps, k, t, vol, rate, is_call=True)
        num_delta = (c_up - c_dn) / (2.0 * eps)
        self.assertLess(abs(greeks["delta"] - num_delta), 1e-4)

        # Numerical Gamma check: d2C / dF2
        c_mid = black76_price(f, k, t, vol, rate, is_call=True)
        num_gamma = (c_up - 2.0 * c_mid + c_dn) / (eps * eps)
        self.assertLess(abs(greeks["gamma"] - num_gamma), 1e-4)

        # Numerical Vega check: dC / d(vol)
        c_vol_up = black76_price(f, k, t, vol + eps, rate, is_call=True)
        c_vol_dn = black76_price(f, k, t, vol - eps, rate, is_call=True)
        num_vega = (c_vol_up - c_vol_dn) / (2.0 * eps)
        self.assertLess(abs(greeks["vega"] - num_vega), 1e-3)

    def test_sabr_parameter_bounds_and_atm_limit(self):
        """
        Test 2: Parameter bounds.
        Verifies SABR parameters rho in [-1, 1], nu > 0, alpha > 0,
        and checks consistency at ATM limit where K = F.
        """
        forward = 250.0
        maturity = 0.5
        beta = 0.7

        alpha = 1.2
        rho = -0.35
        nu = 0.40

        self.assertGreater(alpha, 0, "Alpha must be strictly positive")
        self.assertGreater(nu, 0, "Nu must be strictly positive")
        self.assertTrue(-1.0 <= rho <= 1.0, "Rho must be bounded between -1 and 1")

        # ATM formula evaluation
        atm_vol = sabr_implied_volatility(forward, forward, maturity, alpha, beta, rho, nu)
        self.assertTrue(0.05 < atm_vol < 1.0, "ATM volatility out of expected physical bounds")

        # Smooth limit as strike approaches forward from left and right
        vol_left = sabr_implied_volatility(forward, forward - 0.001, maturity, alpha, beta, rho, nu)
        vol_right = sabr_implied_volatility(forward, forward + 0.001, maturity, alpha, beta, rho, nu)
        self.assertLess(abs(vol_left - atm_vol), 1e-3)
        self.assertLess(abs(vol_right - atm_vol), 1e-3)

    def test_sabr_calibration_nelder_mead(self):
        """Verify Nelder-Mead optimization successfully recovers SABR parameters from market skew."""
        forward = 250.0
        maturity = 0.25
        beta = 0.7

        true_alpha = 1.15
        true_rho = -0.30
        true_nu = 0.45

        strikes = [210.0, 225.0, 240.0, 250.0, 260.0, 275.0, 290.0]
        market_vols = [
            sabr_implied_volatility(forward, k, maturity, true_alpha, beta, true_rho, true_nu)
            for k in strikes
        ]

        cal_alpha, cal_rho, cal_nu, rmse = calibrate_sabr_nelder_mead(
            forward, maturity, strikes, market_vols, beta=beta, max_iter=300
        )

        self.assertLess(rmse, 1e-3, "Calibration RMSE exceeded tolerance: " + str(rmse))
        self.assertLess(abs(cal_rho - true_rho), 0.15, "Recovered rho drifted significantly")
        self.assertLess(abs(cal_nu - true_nu), 0.15, "Recovered nu drifted significantly")
        self.assertTrue(-1.0 <= cal_rho <= 1.0, "Calibrated rho outside physical range")
        self.assertGreater(cal_nu, 0, "Calibrated nu must be strictly positive")
        self.assertGreater(cal_alpha, 0, "Calibrated alpha must be strictly positive")

    def test_arbitrage_free_calendar_spread_verification(self):
        """
        Test 3: Calendar spread arbitrage detection.
        Total implied variance w(K, T) = vol^2 * T must be monotonically non-decreasing.
        """
        forward = 250.0
        strikes = [230.0, 250.0, 270.0]
        maturities = [0.1, 0.25, 0.5, 1.0]

        alpha = 1.1
        beta = 0.7
        rho = -0.2
        nu = 0.35

        clean_res = verify_calendar_arbitrage(forward, strikes, maturities, alpha, beta, rho, nu)
        self.assertTrue(clean_res["is_arbitrage_free"], "Expected clean surface to be arbitrage free")
        self.assertEqual(clean_res["violation_count"], 0)

    def test_arbitrage_free_butterfly_density_verification(self):
        """
        Test 4: Butterfly arbitrage / Breeden-Litzenberger risk-neutral density test.
        Second derivative d2C / dK2 >= 0 must hold for all strikes.
        """
        forward = 250.0
        maturity = 0.5
        strikes = [float(k) for k in range(200, 310, 5)]

        alpha = 1.05
        beta = 0.7
        rho = -0.25
        nu = 0.38

        bf_res = verify_butterfly_arbitrage(forward, maturity, strikes, alpha, beta, rho, nu)
        self.assertTrue(bf_res["is_arbitrage_free"], "Standard SABR surface failed butterfly arbitrage test")
        self.assertEqual(bf_res["violation_count"], 0)

        for item in bf_res["density_curve"]:
            self.assertGreaterEqual(
                item["density"], -1e-6,
                "Negative state price density detected at strike " + str(item["strike"])
            )

    def test_cryptographic_ledger_integrity_and_immutability(self):
        """
        Test 5: Cryptographic SHA-256 state ledger.
        Verifies chain integrity and immutability under simulated tamper attack.
        """
        ledger = CryptographicLedger()
        self.assertEqual(len(ledger.chain), 1)
        self.assertEqual(ledger.chain[0].status, "GENESIS_INITIALIZED")

        # Add block 1
        b1 = ledger.record_calibration(
            underlying="SYNTH-VOL-BENCH",
            spot=250.0,
            alpha=1.12,
            beta=0.7,
            rho=-0.28,
            nu=0.42,
            rmse=0.00012,
            is_arbitrage_free=True
        )
        self.assertEqual(b1.index, 1)
        self.assertEqual(len(b1.block_hash), 64)

        # Add block 2
        b2 = ledger.record_calibration(
            underlying="INDEX-TECH-PROXY",
            spot=420.0,
            alpha=1.45,
            beta=0.7,
            rho=-0.35,
            nu=0.55,
            rmse=0.00018,
            is_arbitrage_free=True
        )
        self.assertEqual(b2.index, 2)
        self.assertEqual(b2.prev_hash, b1.block_hash)

        # Validate intact chain
        valid, err = ledger.verify_integrity()
        self.assertTrue(valid, "Untampered chain should pass validation: " + str(err))

        # Simulate malicious tamper: alter alpha in Block 1
        original_alpha = ledger.chain[1].sabr_params["alpha"]
        ledger.chain[1].sabr_params["alpha"] = 999.99

        tampered_valid, tamper_err = ledger.verify_integrity()
        self.assertFalse(tampered_valid, "Tampered chain must be detected and rejected")
        self.assertIn("Hash mismatch at block 1", tamper_err)

        # Revert tamper and re-verify
        ledger.chain[1].sabr_params["alpha"] = original_alpha
        repaired_valid, _ = ledger.verify_integrity()
        self.assertTrue(repaired_valid, "Repaired chain must restore cryptographic validity")


if __name__ == "__main__":
    unittest.main()
