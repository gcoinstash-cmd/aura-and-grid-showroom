#!/usr/bin/env python3
"""
APEX-211 Cross-Asset Cointegration & Copula Stat-Arb Engine
Production Reference Core - Track 3 Quantitative Architecture
Zero-Dollar Compliance: Strictly dimensionless units, basis points, and sigma scores. No currency symbols.
"""

import numpy as np
import scipy.stats as stats
import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Any, Optional

class KalmanHedgeFilter:
    """
    Dynamic Kalman Filter State Space model for time-varying hedge ratio beta_t and intercept alpha_t.
    State vector x_t = [beta_t, alpha_t]^T.
    Observation equation: Y_t = beta_t * X_t + alpha_t + v_t, v_t ~ N(0, R)
    State transition equation: x_t = x_{t-1} + w_t, w_t ~ N(0, W)
    """
    def __init__(self, delta: float = 1e-5, r: float = 1e-3):
        self.delta = delta
        self.r = r
        self.R = r
        # State covariance matrix P initialized with large uncertainty
        self.P = np.eye(2) * 1.0
        # State vector [beta, alpha] initialized to zero or unit beta
        self.x = np.array([1.0, 0.0])
        self.W = np.eye(2) * delta

    def update(self, y: float, x_val: float) -> Tuple[float, float, float, float]:
        """
        Updates Kalman filter state given new observation (y, x_val).
        Returns: (beta, alpha, spread, forecast_error_variance)
        """
        # Predict step
        # x_{t|t-1} = x_{t-1|t-1}
        # P_{t|t-1} = P_{t-1|t-1} + W
        self.P = self.P + self.W

        # Observation matrix H = [x_val, 1.0]
        H = np.array([x_val, 1.0])

        # Measurement residual (innovation)
        y_pred = np.dot(H, self.x)
        e = y - y_pred

        # Innovation covariance S = H P H^T + R
        S = np.dot(H, np.dot(self.P, H.T)) + self.R

        # Kalman gain K = P H^T S^{-1}
        K = np.dot(self.P, H.T) / S

        # Update state estimate
        self.x = self.x + K * e

        # Update covariance matrix P = (I - K H) P
        I = np.eye(2)
        self.P = np.dot(I - np.outer(K, H), self.P)

        beta, alpha = self.x[0], self.x[1]
        spread = y - (beta * x_val + alpha)
        return float(beta), float(alpha), float(spread), float(S)


class OrnsteinUhlenbeckEstimator:
    """
    Ornstein-Uhlenbeck Mean Reversion Parameter Estimation:
    dX_t = theta * (mu - X_t) * dt + sigma * dW_t
    Analytical half-life: t_{1/2} = ln(2) / theta
    """
    @staticmethod
    def fit_ou(spread_series: np.ndarray, dt: float = 1.0) -> Dict[str, float]:
        n = len(spread_series)
        if n < 5:
            return {"theta": 0.0, "mu": 0.0, "sigma": 1.0, "half_life": 999.0}
        
        x_prev = spread_series[:-1]
        x_curr = spread_series[1:]
        
        # Linear regression: X_{t} = a + b * X_{t-1} + eps
        sum_x = np.sum(x_prev)
        sum_y = np.sum(x_curr)
        sum_xx = np.sum(x_prev ** 2)
        sum_xy = np.sum(x_prev * x_curr)
        sum_yy = np.sum(x_curr ** 2)
        
        denom = (n - 1) * sum_xx - sum_x ** 2
        if abs(denom) < 1e-12:
            return {"theta": 0.0, "mu": 0.0, "sigma": 1.0, "half_life": 999.0}
            
        b = ((n - 1) * sum_xy - sum_x * sum_y) / denom
        a = (sum_y - b * sum_x) / (n - 1)
        
        residuals = x_curr - (a + b * x_prev)
        sigma_eps = np.std(residuals)
        
        # theta = -ln(b) / dt
        if b <= 0 or b >= 1.0:
            theta = 0.01
        else:
            theta = -np.log(b) / dt
            
        mu = a / (1.0 - b) if abs(1.0 - b) > 1e-6 else a
        half_life = np.log(2.0) / theta if theta > 1e-6 else 999.0
        
        return {
            "theta": float(theta),
            "mu": float(mu),
            "sigma": float(sigma_eps),
            "half_life": float(half_life)
        }


class CopulaAnalyzer:
    """
    Non-Linear Bivariate Copulas for Tail Dependence:
    - Clayton Copula (lower tail dependence)
    - Gumbel Copula (upper tail dependence)
    - Parametric Gaussian Copula
    """
    @staticmethod
    def compute_copula_metrics(u: np.ndarray, v: np.ndarray) -> Dict[str, Any]:
        # Convert series to pseudo-observations (empirical CDF)
        u_rank = stats.rankdata(u) / (len(u) + 1.0)
        v_rank = stats.rankdata(v) / (len(v) + 1.0)
        
        # Kendall's tau correlation
        tau, _ = stats.kendalltau(u_rank, v_rank)
        
        # Clayton parameter estimation from Kendall's tau: theta = 2 * tau / (1 - tau)
        clayton_theta = max(0.01, 2.0 * tau / (1.0 - tau)) if tau < 1.0 else 5.0
        lower_tail_dep = 2.0 ** (-1.0 / clayton_theta) if clayton_theta > 0 else 0.0
        
        # Gumbel parameter estimation from Kendall's tau: theta = 1 / (1 - tau)
        gumbel_theta = max(1.0, 1.0 / (1.0 - tau)) if tau < 1.0 else 10.0
        upper_tail_dep = 2.0 - 2.0 ** (1.0 / gumbel_theta) if gumbel_theta >= 1.0 else 0.0
        
        # Gaussian copula correlation rho = sin(pi * tau / 2)
        gaussian_rho = float(np.sin(np.pi * tau / 2.0))
        
        return {
            "kendall_tau": float(tau),
            "clayton_theta": float(clayton_theta),
            "lower_tail_dependence": float(lower_tail_dep),
            "gumbel_theta": float(gumbel_theta),
            "upper_tail_dependence": float(upper_tail_dep),
            "gaussian_rho": float(gaussian_rho)
        }


class CryptographicAuditLedger:
    """
    Append-only SHA-256 state ledger hashing every Kalman state update, copula calibration, and trade signal.
    """
    def __init__(self):
        self.chain: List[Dict[str, Any]] = []
        # Genesis block
        self._append_block({
            "event": "GENESIS",
            "system": "GF-T3-211 APEX-211 STAT-ARB ENGINE",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    def _append_block(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        index = len(self.chain)
        prev_hash = self.chain[-1]["hash"] if index > 0 else "0" * 64
        
        block = {
            "index": index,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": payload,
            "prev_hash": prev_hash
        }
        
        block_string = json.dumps(block, sort_keys=True)
        block_hash = hashlib.sha256(block_string.encode()).hexdigest()
        block["hash"] = block_hash
        
        self.chain.append(block)
        return block

    def log_event(self, event_type: str, details: Dict[str, Any]) -> Dict[str, Any]:
        return self._append_block({"event_type": event_type, "details": details})

    def verify_integrity(self) -> bool:
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            prev = self.chain[i-1]
            if current["prev_hash"] != prev["hash"]:
                return False
            # Recompute hash
            test_block = current.copy()
            test_hash = test_block.pop("hash")
            recomputed = hashlib.sha256(json.dumps(test_block, sort_keys=True).encode()).hexdigest()
            if recomputed != test_hash:
                return False
        return True


class StatArbEngineCore:
    def __init__(self):
        self.audit_ledger = CryptographicAuditLedger()
        self.kalman = KalmanHedgeFilter()

    def run_simulation_step(self, price_a: float, price_b: float) -> Dict[str, Any]:
        beta, alpha, spread, variance = self.kalman.update(price_a, price_b)
        z_score = spread / (np.sqrt(variance) + 1e-8)
        
        # Signal logic: Entry |z| >= 2.0, Exit |z| <= 0.5, Stop-Loss |z| >= 3.5
        signal = "NEUTRAL"
        if z_score >= 2.0:
            signal = "SHORT_SPREAD (SHORT A / LONG B)"
        elif z_score <= -2.0:
            signal = "LONG_SPREAD (LONG A / SHORT B)"
        elif abs(z_score) <= 0.5:
            signal = "FLAT / EXIT"
        elif abs(z_score) >= 3.5:
            signal = "STOP_LOSS / EMERGENCY UNWIND"

        event_payload = {
            "price_a": price_a,
            "price_b": price_b,
            "beta": beta,
            "alpha": alpha,
            "spread": spread,
            "z_score": z_score,
            "signal": signal
        }
        
        self.audit_ledger.log_event("KALMAN_STATE_UPDATE", event_payload)
        return event_payload
