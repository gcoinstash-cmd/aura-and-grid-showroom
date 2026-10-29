#!/usr/bin/env python3
"""
Pytest Suite for GF-T3-211 APEX-211 Stat-Arb Engine
Covers Kalman filter convergence, OU half-life non-negativity, Copula parameters, and SHA-256 audit immutability.
Zero-Dollar Compliance: No currency symbols or prices. Purely statistical units and basis points.
"""

import pytest
import numpy as np
from engine import KalmanHedgeFilter, OrnsteinUhlenbeckEstimator, CopulaAnalyzer, CryptographicAuditLedger, StatArbEngineCore

def test_kalman_filter_convergence():
    kf = KalmanHedgeFilter(delta=1e-5, r=1e-3)
    # Simulate cointegrated series: Y = 1.5 * X + 10.0 + noise
    np.random.seed(42)
    x_series = np.linspace(100, 110, 200) + np.random.normal(0, 0.5, 200)
    y_series = 1.5 * x_series + 10.0 + np.random.normal(0, 0.2, 200)
    
    betas = []
    alphas = []
    for x_val, y_val in zip(x_series, y_series):
        beta, alpha, spread, var = kf.update(y_val, x_val)
        betas.append(beta)
        alphas.append(alpha)
        
    # Final beta should converge close to 1.5
    final_beta = betas[-1]
    assert 1.4 <= final_beta <= 1.6, f"Kalman beta failed to converge: {final_beta}"


def test_ornstein_uhlenbeck_estimation():
    np.random.seed(123)
    # Generate mean-reverting OU process sample
    dt = 1.0
    theta_true = 0.15
    mu_true = 2.0
    sigma_true = 0.5
    
    n = 500
    spread = np.zeros(n)
    spread[0] = mu_true
    for i in range(1, n):
        ds = theta_true * (mu_true - spread[i-1]) * dt + sigma_true * np.random.normal(0, np.sqrt(dt))
        spread[i] = spread[i-1] + ds
        
    res = OrnsteinUhlenbeckEstimator.fit_ou(spread, dt)
    assert res["theta"] > 0.0, f"OU theta must be positive: {res['theta']}"
    assert res["half_life"] > 0.0, f"OU half-life must be positive: {res['half_life']}"
    assert res["half_life"] < 100.0, f"OU half-life unreasonably large: {res['half_life']}"


def test_copula_parameters():
    np.random.seed(99)
    # Generate dependent bivariate samples
    u = np.random.uniform(0, 1, 300)
    v = 0.7 * u + 0.3 * np.random.uniform(0, 1, 300)
    
    copula_metrics = CopulaAnalyzer.compute_copula_metrics(u, v)
    
    assert copula_metrics["clayton_theta"] > 0.0, f"Clayton theta must be > 0: {copula_metrics['clayton_theta']}"
    assert copula_metrics["lower_tail_dependence"] >= 0.0, "Lower tail dependence out of bounds"
    assert copula_metrics["gumbel_theta"] >= 1.0, f"Gumbel theta must be >= 1: {copula_metrics['gumbel_theta']}"
    assert copula_metrics["upper_tail_dependence"] >= 0.0, "Upper tail dependence out of bounds"
    assert -1.0 <= copula_metrics["gaussian_rho"] <= 1.0, "Gaussian rho out of bounds"


def test_cryptographic_audit_ledger():
    ledger = CryptographicAuditLedger()
    
    # Log test events
    ledger.log_event("SIGNAL_DISPATCH", {"z_score": 2.45, "action": "SHORT"})
    ledger.log_event("COPULA_RECAL", {"clayton_theta": 1.82})
    
    # Verify chain integrity
    assert ledger.verify_integrity() is True, "Audit ledger failed integrity check"
    
    # Tamper test
    ledger.chain[1]["payload"]["z_score"] = 9.99
    assert ledger.verify_integrity() is False, "Audit ledger failed to detect tamper attack"
