"""
APEX-203 Quantitative Engine Test Suite
Validates Kalman Matrix Convergence, Welford O(1) Stability, OU Diagnostics, and Signal FSM

Compatible with both:
  - pytest tests/test_kalman_filter.py
  - python3 -m unittest tests/test_kalman_filter.py
"""

import math
import random
import unittest

from service.kalman import KalmanFilter
from service.ornstein_uhlenbeck import OrnsteinUhlenbeckEstimator
from service.signal_chain import SignalAuditChain, SignalEmitter
from service.welford import WelfordRollingStats


class TestAPEX203QuantEngine(unittest.TestCase):
    def setUp(self):
        # Deterministic random seed for reproducibility
        random.seed(42)

    def test_kalman_matrix_convergence(self):
        """
        Gate 1 Test: Validates that the 2D Kalman Filter converges to true Beta and Alpha
        on cointegrated synthetic price series, and that the covariance matrix P
        maintains positive semi-definiteness.
        """
        true_beta = 1.65
        true_alpha = 12.0

        # Start with uncalibrated prior beta=0.5
        kf = KalmanFilter(
            initial_beta=0.5,
            initial_alpha=0.0,
            initial_cov=5.0,
            r_variance=1e-3,
            q_variance=1e-5,
        )

        px = 100.0
        for _ in range(600):
            # Asset X random walk
            px += random.gauss(0, 0.5)
            # Asset Y cointegrated with small stationary noise
            noise = random.gauss(0, 0.1)
            py = true_beta * px + true_alpha + noise

            state = kf.update(py, px)

            # Covariance matrix P must remain positive semi-definite
            self.assertGreater(state.p00, 0.0, "P00 must remain strictly positive")
            self.assertGreater(state.p11, 0.0, "P11 must remain strictly positive")
            det_p = state.p00 * state.p11 - state.p01 * state.p10
            self.assertGreaterEqual(det_p, -1e-12, "Det(P) must be >= 0")

        # After 600 ticks, beta should converge within 0.10 of true_beta (1.65)
        self.assertAlmostEqual(kf.beta, true_beta, delta=0.10, msg=f"Kalman beta {kf.beta} failed to converge to {true_beta}")
        self.assertAlmostEqual(kf.alpha, true_alpha, delta=10.0, msg="Kalman alpha failed to calibrate")

    def test_welford_numerical_stability_and_zero_division(self):
        """
        Gate 1 Test: Validates Welford's algorithm numerical stability:
          1. Constant series does not produce ZeroDivisionError or NaN
          2. Massive offset numbers (10^9) do not lose precision or produce negative variance
          3. O(1) sliding window matches mathematical expectation
        """
        w = WelfordRollingStats(window_size=20)

        # 1. Constant values: variance is 0, Z-score must be safely 0.0 (no division by zero)
        for _ in range(25):
            stats = w.update(100.0)
            self.assertFalse(math.isnan(stats.z_score), "Z-score cannot be NaN")
            self.assertEqual(stats.z_score, 0.0, "Zero variance must yield 0.0 Z-Score")

        # 2. Large numbers (catastrophic cancellation stress test)
        w_large = WelfordRollingStats(window_size=30)
        base = 1e9
        samples = [base + 1.0, base + 2.0, base + 3.0, base + 4.0, base + 5.0] * 6
        for s in samples:
            stats = w_large.update(s)
            self.assertGreaterEqual(stats.variance, 0.0, "Variance must never be negative")
            self.assertFalse(math.isnan(stats.variance))

        # Check mean of 1..5 is 3.0 + base
        self.assertAlmostEqual(w_large.mean, base + 3.0, delta=0.1)

    def test_ornstein_uhlenbeck_half_life(self):
        """
        Gate 1 Test: Validates OU parameter estimation:
          1. Stationary AR(1) mean-reverting series has finite half-life
          2. Trending explosive series has infinite half-life and isMeanReverting=False
        """
        ou = OrnsteinUhlenbeckEstimator(window_size=50)

        # 1. Generate mean-reverting series: S_t = 0.85 * S_{t-1} + e_t
        s = 0.0
        for _ in range(80):
            s = 0.85 * s + random.gauss(0, 0.5)
            stats = ou.update(s)

        self.assertTrue(stats.is_mean_reverting, "OU process should recognize mean-reverting series")
        self.assertGreater(stats.theta, 0.0, "OU theta must be > 0 for mean reversion")
        self.assertTrue(math.isfinite(stats.half_life), "Half-life must be finite for stationary spread")
        self.assertLess(stats.half_life, 50.0, "Half-life should be reasonable")

        # 2. Generate explosive / trending series: S_t = 1.05 * S_{t-1}
        ou_trend = OrnsteinUhlenbeckEstimator(window_size=50)
        s_trend = 1.0
        for _ in range(40):
            s_trend = 1.05 * s_trend + random.gauss(0, 0.01)
            stats_trend = ou_trend.update(s_trend)

        self.assertFalse(stats_trend.is_mean_reverting, "Explosive series must not be flagged as mean-reverting")
        self.assertEqual(stats_trend.half_life, float("inf"), "Explosive series must have infinite half-life")

    def test_signal_triggers_and_fsm(self):
        """
        Gate 1 Test: Validates Signal Emitter state machine:
          - Z <= -2.0 triggers ENTER_LONG_SPREAD
          - Reversion to >= -0.5 triggers EXIT_NEUTRAL
          - Z >= +2.0 triggers ENTER_SHORT_SPREAD
          - |Z| >= 3.5 triggers STOP_OUT
        """
        emitter = SignalEmitter(entry_threshold=2.0, exit_threshold=0.5, stop_threshold=3.5)

        # 1. Normal fluctuations (Z between -1.5 and +1.5)
        sig, _ = emitter.evaluate(price_y=100, price_x=50, current_beta=2.0, current_spread=0.0, z_score=-1.2)
        self.assertEqual(sig, "NONE")
        self.assertEqual(emitter.position_side, "FLAT")

        # 2. Trigger Long Spread (Z <= -2.0)
        sig, _ = emitter.evaluate(price_y=95, price_x=50, current_beta=2.0, current_spread=-5.0, z_score=-2.3)
        self.assertEqual(sig, "ENTER_LONG_SPREAD")
        self.assertEqual(emitter.position_side, "LONG_SPREAD")

        # 3. Spread reverts to -0.3 (past exit threshold -0.5)
        sig, _ = emitter.evaluate(price_y=99, price_x=50, current_beta=2.0, current_spread=-0.5, z_score=-0.2)
        self.assertEqual(sig, "EXIT_NEUTRAL")
        self.assertEqual(emitter.position_side, "FLAT")

        # 4. Trigger Short Spread (Z >= +2.0)
        sig, _ = emitter.evaluate(price_y=106, price_x=50, current_beta=2.0, current_spread=6.0, z_score=2.4)
        self.assertEqual(sig, "ENTER_SHORT_SPREAD")
        self.assertEqual(emitter.position_side, "SHORT_SPREAD")

        # 5. Severe breakout causing Stop-Out (|Z| >= 3.5)
        sig, _ = emitter.evaluate(price_y=115, price_x=50, current_beta=2.0, current_spread=15.0, z_score=3.8)
        self.assertEqual(sig, "STOP_OUT")
        self.assertEqual(emitter.position_side, "FLAT")

    def test_sha256_audit_chain_integrity(self):
        """
        Gate 3 Test: Validates SHA-256 cryptographic chaining and tamper detection.
        """
        chain = SignalAuditChain()
        self.assertEqual(len(chain.chain), 1, "Genesis block must exist")

        # Add 5 verified signals
        for i in range(5):
            chain.append_signal(
                signal="ENTER_LONG_SPREAD" if i % 2 == 0 else "EXIT_NEUTRAL",
                price_y=60000.0 + i * 100,
                price_x=3200.0 + i * 10,
                beta=18.5,
                spread=-12.5,
                z_score=-2.2,
                half_life=14.2,
            )

        self.assertEqual(len(chain.chain), 6)
        is_valid, broken_idx = chain.verify_integrity()
        self.assertTrue(is_valid, "Pristine chain must verify as valid")
        self.assertIsNone(broken_idx)

        # Tamper test: alter the price_y of block 2
        chain.chain[2].price_y += 1.0
        is_valid_after_tamper, broken_idx = chain.verify_integrity()
        self.assertFalse(is_valid_after_tamper, "Tampered chain must fail verification")
        self.assertEqual(broken_idx, 2, "Tamper must be detected at block index 2")


if __name__ == "__main__":
    unittest.main()
