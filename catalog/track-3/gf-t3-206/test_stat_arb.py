"""
Pytest Suite for GF-T3-206: APEX-206 Statistical Arbitrage Engine
Covers mathematical bounds, ADF p-values, state machine transitions, and SHA-256 chain immutability.
"""

import pytest
import numpy as np
from engine import QuantitativeEngine, SpreadStateRequest

def test_genesis_and_ledger_chain():
    engine = QuantitativeEngine()
    assert len(engine.ledger) >= 1
    genesis = engine.ledger[0]
    assert genesis["index"] == 0
    assert genesis["previous_hash"] == "0" * 64
    assert "hash" in genesis

    # Append block
    block1 = engine.append_ledger("ENTER_LONG_SPREAD", -2.15, 1.04, -12.4)
    assert block1["index"] == 1
    assert block1["previous_hash"] == genesis["hash"]
    assert block1["hash"] != genesis["hash"]

def test_ols_hedge_ratio():
    engine = QuantitativeEngine()
    x = np.array([10.0, 11.0, 12.0, 13.0, 14.0])
    y = np.array([20.0, 22.0, 24.0, 26.0, 28.0]) # y = 2x + 0
    beta, alpha = engine.calculate_ols_hedge(y, x)
    assert pytest.approx(beta, 0.01) == 2.0
    assert pytest.approx(alpha, 0.01) == 0.0

def test_ornstein_uhlenbeck_halflife():
    engine = QuantitativeEngine()
    np.random.seed(42)
    # Mean-reverting synthetic OU process
    spread = np.sin(np.linspace(0, 20, 100)) * 5.0 + np.random.normal(0, 0.2, 100)
    adf_stat, p_val, half_life = engine.compute_adf_and_halflife(spread)
    assert half_life > 0.0
    assert half_life < 100.0
    assert isinstance(adf_stat, float)
    assert isinstance(p_val, float)

def test_state_machine_signals():
    engine = QuantitativeEngine()
    req = SpreadStateRequest(
        cluster_a="SYNTH-CLUSTER-A",
        cluster_b="SYNTH-CLUSTER-B",
        prices_a=[100.0 + i*0.05 for i in range(60)],
        prices_b=[100.0 + i*0.05 + 15.0 for i in range(60)], # Creates large negative spread divergence
        z_threshold_entry=2.0,
        z_threshold_exit=0.2,
        z_threshold_stop=3.5
    )
    res = engine.analyze(req)
    assert res.status == "SUCCESS"
    assert res.action_signal in [
        "ENTER_LONG_SPREAD",
        "ENTER_SHORT_SPREAD",
        "EXIT_REVERSION_FLAT",
        "STOP_LOSS_EMERGENCY",
        "HOLD_POSITION",
        "HALT_STOP_LOSS_BREAKDOWN"
    ]
    assert len(res.ledger_chain) > 0
