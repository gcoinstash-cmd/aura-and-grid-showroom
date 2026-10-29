"""
GF-T3-207: APEX-207 Automated Market Maker (AMM) Dynamic Liquidity & Impermanent Loss Engine
Production Reference Core - Clean-Room Standalone Backend
Standard Commercial Asset Transfer Specification Compliant
Zero Third-Party Financial Marks | Zero Currency Symbols
"""

import math
import hashlib
import json
import time
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, asdict

# -------------------------------------------------------------------------
# Mathematical Constants and Domain Limits
# -------------------------------------------------------------------------
MIN_TICK_PRICE = 0.0001
MAX_TICK_PRICE = 1000000.0
DEFAULT_FEE_BASE_BPS = 30.0       # 30 basis points (0.30%)
MIN_FEE_BPS = 5.0                 # 5 basis points floor (0.05%)
MAX_FEE_BPS = 250.0               # 250 basis points cap (2.50%)
DEFAULT_VOLATILITY_ALPHA = 1.50   # Volatility sensitivity factor
BASELINE_SIGMA = 0.0120           # Baseline log-return standard deviation


@dataclass
class PoolConfig:
    pool_id: str
    reserve_a_name: str
    reserve_b_name: str
    active_price: float           # Current price (Reserve B per Reserve A, in pts)
    price_lower: float            # Lower tick boundary p_a
    price_upper: float            # Upper tick boundary p_b
    liquidity_L: float            # Concentrated virtual liquidity scalar
    fee_base_bps: float = DEFAULT_FEE_BASE_BPS
    volatility_alpha: float = DEFAULT_VOLATILITY_ALPHA
    baseline_sigma: float = BASELINE_SIGMA


@dataclass
class LedgerBlock:
    index: int
    timestamp_ns: int
    action_type: str
    payload: Dict[str, Any]
    state_hash: str
    prev_hash: str
    block_hash: str


class Apex207AmmEngine:
    """
    Deterministic concentrated liquidity AMM engine with analytical impermanent
    loss calculation, volatility-scaled dynamic fee engine, and cryptographic state ledger.
    """

    def __init__(self, config: Optional[PoolConfig] = None):
        if config is None:
            config = PoolConfig(
                pool_id="SYNTH-POOL-01",
                reserve_a_name="RESERVE-A",
                reserve_b_name="RESERVE-B",
                active_price=2.5000,
                price_lower=1.8000,
                price_upper=3.5000,
                liquidity_L=10_000_000.0,
                fee_base_bps=DEFAULT_FEE_BASE_BPS,
            )
        self.config = config
        self.active_price: float = float(config.active_price)
        self.entry_price: float = float(config.active_price)
        self.price_lower: float = float(config.price_lower)
        self.price_upper: float = float(config.price_upper)
        self.liquidity_L: float = float(config.liquidity_L)
        self.rolling_sigma: float = float(config.baseline_sigma)
        self.total_fee_accrual_a: float = 0.0
        self.total_fee_accrual_b: float = 0.0
        self.total_volume_units: float = 0.0
        self.swap_count: int = 0

        # Recent price history for rolling volatility calculation
        self.price_history: List[float] = [self.active_price]

        # Append-only SHA-256 cryptographic ledger
        self.ledger: List[LedgerBlock] = []
        self._initialize_genesis_block()

    # ---------------------------------------------------------------------
    # Concentrated Liquidity Mathematical Invariant
    # ---------------------------------------------------------------------
    def calculate_virtual_reserves(self, price: float, L: float, p_a: float, p_b: float) -> Tuple[float, float]:
        """
        Calculates virtual reserves x_virt and y_virt such that:
        (x_real + L / sqrt(p_b)) * (y_real + L * sqrt(p_a)) = L^2
        x_virt = L / sqrt(price)
        y_virt = L * sqrt(price)
        """
        sqrt_p = math.sqrt(price)
        x_virt = L / sqrt_p
        y_virt = L * sqrt_p
        return x_virt, y_virt

    def calculate_real_reserves(self, price: float, L: float, p_a: float, p_b: float) -> Tuple[float, float]:
        """
        Computes the actual physical tokens held in the pool across tick bounds:
        If price < p_a: 100% token A, 0 token B
        If price > p_b: 0 token A, 100% token B
        If p_a <= price <= p_b: real x and real y coexist
        """
        sqrt_pa = math.sqrt(p_a)
        sqrt_pb = math.sqrt(p_b)

        if price <= p_a:
            x_real = L * (1.0 / sqrt_pa - 1.0 / sqrt_pb)
            y_real = 0.0
        elif price >= p_b:
            x_real = 0.0
            y_real = L * (sqrt_pb - sqrt_pa)
        else:
            sqrt_p = math.sqrt(price)
            x_real = L * (1.0 / sqrt_p - 1.0 / sqrt_pb)
            y_real = L * (sqrt_p - sqrt_pa)

        return max(0.0, x_real), max(0.0, y_real)

    # ---------------------------------------------------------------------
    # Analytical Closed-Form Impermanent Loss Formula
    # ---------------------------------------------------------------------
    @staticmethod
    def calculate_analytical_impermanent_loss(k: float) -> float:
        """
        Analytical closed-form Impermanent Loss formula:
        IL(k) = (2 * sqrt(k) / (1 + k)) - 1
        Where k = P_current / P_entry
        Returns a dimensionless decimal ratio (e.g. -0.0572 for -5.72%).
        """
        if k <= 0:
            return -1.0
        return (2.0 * math.sqrt(k) / (1.0 + k)) - 1.0

    def get_current_impermanent_loss(self) -> float:
        """Computes current IL relative to entry price."""
        if self.entry_price <= 0:
            return 0.0
        k = self.active_price / self.entry_price
        return self.calculate_analytical_impermanent_loss(k)

    # ---------------------------------------------------------------------
    # Capital Efficiency Multiplier
    # ---------------------------------------------------------------------
    @staticmethod
    def calculate_capital_efficiency(price_lower: float, price_upper: float) -> float:
        """
        Computes the capital efficiency multiplier of concentrated liquidity
        relative to full-range constant product (x * y = k):
        CE = 1 / (1 - sqrt(p_a / p_b))
        """
        if price_lower <= 0 or price_upper <= price_lower:
            return 1.0
        ratio = math.sqrt(price_lower / price_upper)
        if ratio >= 1.0:
            return 1.0
        return 1.0 / (1.0 - ratio)

    # ---------------------------------------------------------------------
    # Volatility-Scaled Dynamic Fee Engine
    # ---------------------------------------------------------------------
    def calculate_dynamic_fee_bps(self) -> float:
        """
        Dynamic Volatility-Scaled Fee Engine:
        Fee(t) = Fee_base * (1 + alpha * (sigma_rolling / sigma_baseline))
        Clamped within [MIN_FEE_BPS, MAX_FEE_BPS]
        """
        ratio = self.rolling_sigma / max(0.0001, self.config.baseline_sigma)
        fee = self.config.fee_base_bps * (1.0 + self.config.volatility_alpha * ratio)
        return max(MIN_FEE_BPS, min(MAX_FEE_BPS, fee))

    def update_volatility(self, new_price: float):
        """Updates rolling standard deviation of log returns."""
        self.price_history.append(new_price)
        if len(self.price_history) > 50:
            self.price_history.pop(0)

        if len(self.price_history) >= 2:
            log_returns = []
            for i in range(1, len(self.price_history)):
                p_prev = self.price_history[i - 1]
                p_curr = self.price_history[i]
                if p_prev > 0 and p_curr > 0:
                    log_returns.append(math.log(p_curr / p_prev))
            if len(log_returns) >= 2:
                mean_r = sum(log_returns) / len(log_returns)
                var_r = sum((r - mean_r) ** 2 for r in log_returns) / (len(log_returns) - 1)
                self.rolling_sigma = math.sqrt(var_r)

    # ---------------------------------------------------------------------
    # Swap Execution Engine
    # ---------------------------------------------------------------------
    def swap_exact_a_for_b(self, amount_a_in: float) -> Dict[str, Any]:
        """
        Executes an exact input swap of Reserve A for Reserve B:
        1. Deducts volatility-scaled dynamic fee.
        2. Adjusts virtual reserves: x_new_virt = x_virt + amount_a_net.
        3. Preserves invariant: y_new_virt = L^2 / x_new_virt.
        4. Calculates amount_b_out = y_virt - y_new_virt.
        5. Computes new price = y_new_virt / x_new_virt.
        6. Records block to append-only cryptographic ledger.
        """
        if amount_a_in <= 0:
            raise ValueError("Swap input must be strictly positive")

        fee_bps = self.calculate_dynamic_fee_bps()
        fee_rate = fee_bps / 10000.0
        fee_a = amount_a_in * fee_rate
        net_a_in = amount_a_in - fee_a

        x_virt, y_virt = self.calculate_virtual_reserves(
            self.active_price, self.liquidity_L, self.price_lower, self.price_upper
        )
        invariant_k = self.liquidity_L * self.liquidity_L

        # Target virtual x after swap
        x_virt_next = x_virt + net_a_in
        y_virt_next = invariant_k / x_virt_next
        amount_b_out = y_virt - y_virt_next

        # Check tick boundary breach
        new_price = y_virt_next / x_virt_next
        clamped_to_tick = False
        if new_price < self.price_lower:
            new_price = self.price_lower
            clamped_to_tick = True
            # Recompute max real B available
            _, real_b_max = self.calculate_real_reserves(
                self.active_price, self.liquidity_L, self.price_lower, self.price_upper
            )
            amount_b_out = min(amount_b_out, real_b_max)

        # Update state
        old_price = self.active_price
        self.active_price = new_price
        self.total_fee_accrual_a += fee_a
        self.total_volume_units += amount_a_in
        self.swap_count += 1
        self.update_volatility(new_price)

        # Execution payload
        payload = {
            "swap_type": "EXACT_A_FOR_B",
            "amount_in": amount_a_in,
            "amount_out": amount_b_out,
            "fee_deducted": fee_a,
            "fee_bps": fee_bps,
            "price_before": old_price,
            "price_after": new_price,
            "price_impact_bps": abs((new_price - old_price) / old_price) * 10000.0,
            "clamped_to_tick": clamped_to_tick,
        }

        block = self._record_state_transition("SWAP_EXACT_A_FOR_B", payload)
        return {
            "execution": payload,
            "block_index": block.index,
            "block_hash": block.block_hash,
            "pool_state": self.get_telemetry_state(),
        }

    def swap_exact_b_for_a(self, amount_b_in: float) -> Dict[str, Any]:
        """
        Executes an exact input swap of Reserve B for Reserve A:
        1. Deducts dynamic fee.
        2. Adjusts virtual reserves: y_new_virt = y_virt + amount_b_net.
        3. Preserves invariant: x_new_virt = L^2 / y_new_virt.
        4. Calculates amount_a_out = x_virt - x_new_virt.
        5. Computes new price = y_new_virt / x_new_virt.
        6. Records block to append-only cryptographic ledger.
        """
        if amount_b_in <= 0:
            raise ValueError("Swap input must be strictly positive")

        fee_bps = self.calculate_dynamic_fee_bps()
        fee_rate = fee_bps / 10000.0
        fee_b = amount_b_in * fee_rate
        net_b_in = amount_b_in - fee_b

        x_virt, y_virt = self.calculate_virtual_reserves(
            self.active_price, self.liquidity_L, self.price_lower, self.price_upper
        )
        invariant_k = self.liquidity_L * self.liquidity_L

        # Target virtual y after swap
        y_virt_next = y_virt + net_b_in
        x_virt_next = invariant_k / y_virt_next
        amount_a_out = x_virt - x_virt_next

        # Check tick boundary breach
        new_price = y_virt_next / x_virt_next
        clamped_to_tick = False
        if new_price > self.price_upper:
            new_price = self.price_upper
            clamped_to_tick = True
            real_a_max, _ = self.calculate_real_reserves(
                self.active_price, self.liquidity_L, self.price_lower, self.price_upper
            )
            amount_a_out = min(amount_a_out, real_a_max)

        old_price = self.active_price
        self.active_price = new_price
        self.total_fee_accrual_b += fee_b
        self.total_volume_units += amount_b_in
        self.swap_count += 1
        self.update_volatility(new_price)

        payload = {
            "swap_type": "EXACT_B_FOR_A",
            "amount_in": amount_b_in,
            "amount_out": amount_a_out,
            "fee_deducted": fee_b,
            "fee_bps": fee_bps,
            "price_before": old_price,
            "price_after": new_price,
            "price_impact_bps": abs((new_price - old_price) / old_price) * 10000.0,
            "clamped_to_tick": clamped_to_tick,
        }

        block = self._record_state_transition("SWAP_EXACT_B_FOR_A", payload)
        return {
            "execution": payload,
            "block_index": block.index,
            "block_hash": block.block_hash,
            "pool_state": self.get_telemetry_state(),
        }

    # ---------------------------------------------------------------------
    # Administrative & Simulation Controls
    # ---------------------------------------------------------------------
    def set_tick_bounds(self, price_lower: float, price_upper: float) -> Dict[str, Any]:
        """Updates concentrated liquidity range [p_a, p_b]."""
        if price_lower <= 0 or price_upper <= price_lower:
            raise ValueError("Invalid tick bounds: must satisfy 0 < p_a < p_b")
        old_bounds = (self.price_lower, self.price_upper)
        self.price_lower = float(price_lower)
        self.price_upper = float(price_upper)

        payload = {
            "old_lower": old_bounds[0],
            "old_upper": old_bounds[1],
            "new_lower": self.price_lower,
            "new_upper": self.price_upper,
            "capital_efficiency": self.calculate_capital_efficiency(self.price_lower, self.price_upper),
        }
        block = self._record_state_transition("RANGE_REBALANCE", payload)
        return {
            "status": "BOUNDS_UPDATED",
            "block_index": block.index,
            "pool_state": self.get_telemetry_state(),
        }

    def simulate_volatility_spike(self, multiplier: float = 2.5) -> Dict[str, Any]:
        """Simulates rapid external volatility surge scaling dynamic fees."""
        old_sigma = self.rolling_sigma
        self.rolling_sigma = self.rolling_sigma * multiplier

        payload = {
            "old_sigma": old_sigma,
            "new_sigma": self.rolling_sigma,
            "multiplier": multiplier,
            "dynamic_fee_bps": self.calculate_dynamic_fee_bps(),
        }
        block = self._record_state_transition("VOLATILITY_ADJUST", payload)
        return {
            "status": "VOLATILITY_ADJUSTED",
            "block_index": block.index,
            "pool_state": self.get_telemetry_state(),
        }

    def simulate_price_shift(self, target_price: float) -> Dict[str, Any]:
        """Simulates external oracle price shift without pool swap friction."""
        if target_price <= 0:
            raise ValueError("Target price must be positive")
        old_price = self.active_price
        self.active_price = float(target_price)
        self.update_volatility(target_price)

        payload = {
            "old_price": old_price,
            "new_price": target_price,
            "divergence_k": target_price / self.entry_price,
            "impermanent_loss": self.get_current_impermanent_loss(),
        }
        block = self._record_state_transition("PRICE_SHIFT_ORACLE", payload)
        return {
            "status": "PRICE_SHIFTED",
            "block_index": block.index,
            "pool_state": self.get_telemetry_state(),
        }

    def reset_pool(self) -> Dict[str, Any]:
        """Resets pool to deterministic baseline state and appends reset event."""
        self.active_price = float(self.config.active_price)
        self.entry_price = float(self.config.active_price)
        self.price_lower = float(self.config.price_lower)
        self.price_upper = float(self.config.price_upper)
        self.liquidity_L = float(self.config.liquidity_L)
        self.rolling_sigma = float(self.config.baseline_sigma)
        self.total_fee_accrual_a = 0.0
        self.total_fee_accrual_b = 0.0
        self.total_volume_units = 0.0
        self.swap_count = 0
        self.price_history = [self.active_price]

        payload = {"reset_price": self.active_price, "L": self.liquidity_L}
        block = self._record_state_transition("POOL_RESET", payload)
        return {
            "status": "RESET_COMPLETE",
            "block_index": block.index,
            "pool_state": self.get_telemetry_state(),
        }

    # ---------------------------------------------------------------------
    # Cryptographic Append-Only Ledger
    # ---------------------------------------------------------------------
    def _initialize_genesis_block(self):
        """Creates deterministic genesis block."""
        genesis_payload = {
            "pool_id": self.config.pool_id,
            "active_price": self.active_price,
            "price_lower": self.price_lower,
            "price_upper": self.price_upper,
            "liquidity_L": self.liquidity_L,
        }
        state_hash = self._compute_state_hash()
        prev_hash = "0" * 64
        block_content = f"0:0:GENESIS:{json.dumps(genesis_payload, sort_keys=True)}:{state_hash}:{prev_hash}"
        block_hash = hashlib.sha256(block_content.encode("utf-8")).hexdigest()

        self.ledger.append(
            LedgerBlock(
                index=0,
                timestamp_ns=0,
                action_type="GENESIS",
                payload=genesis_payload,
                state_hash=state_hash,
                prev_hash=prev_hash,
                block_hash=block_hash,
            )
        )

    def _compute_state_hash(self) -> str:
        """Computes deterministic SHA-256 fingerprint of current state."""
        state_repr = (
            f"price={self.active_price:.8f}:"
            f"pa={self.price_lower:.8f}:"
            f"pb={self.price_upper:.8f}:"
            f"L={self.liquidity_L:.4f}:"
            f"fee_a={self.total_fee_accrual_a:.6f}:"
            f"fee_b={self.total_fee_accrual_b:.6f}"
        )
        return hashlib.sha256(state_repr.encode("utf-8")).hexdigest()

    def _record_state_transition(self, action_type: str, payload: Dict[str, Any]) -> LedgerBlock:
        """Appends verified cryptographic block to chain."""
        index = len(self.ledger)
        timestamp_ns = time.time_ns()
        state_hash = self._compute_state_hash()
        prev_hash = self.ledger[-1].block_hash

        serialized_payload = json.dumps(payload, sort_keys=True)
        block_content = f"{index}:{timestamp_ns}:{action_type}:{serialized_payload}:{state_hash}:{prev_hash}"
        block_hash = hashlib.sha256(block_content.encode("utf-8")).hexdigest()

        block = LedgerBlock(
            index=index,
            timestamp_ns=timestamp_ns,
            action_type=action_type,
            payload=payload,
            state_hash=state_hash,
            prev_hash=prev_hash,
            block_hash=block_hash,
        )
        self.ledger.append(block)
        return block

    def verify_ledger_integrity(self) -> Tuple[bool, Optional[int]]:
        """
        Validates entire blockchain cryptographically:
        1. Checks block hash computation against content.
        2. Validates block-to-block previous hash linkage.
        Returns (is_valid, failing_block_index).
        """
        for i in range(len(self.ledger)):
            block = self.ledger[i]

            # Recompute block hash
            serialized_payload = json.dumps(block.payload, sort_keys=True)
            expected_content = (
                f"{block.index}:{block.timestamp_ns}:{block.action_type}:"
                f"{serialized_payload}:{block.state_hash}:{block.prev_hash}"
            )
            recalculated_hash = hashlib.sha256(expected_content.encode("utf-8")).hexdigest()

            if block.block_hash != recalculated_hash:
                return False, i

            # Verify chain linkage
            if i > 0:
                parent_block = self.ledger[i - 1]
                if block.prev_hash != parent_block.block_hash:
                    return False, i
            else:
                if block.prev_hash != ("0" * 64):
                    return False, 0

        return True, None

    # ---------------------------------------------------------------------
    # Telemetry and Comparison Engine
    # ---------------------------------------------------------------------
    def get_telemetry_state(self) -> Dict[str, Any]:
        """Provides full real-time telemetry matrix."""
        real_a, real_b = self.calculate_real_reserves(
            self.active_price, self.liquidity_L, self.price_lower, self.price_upper
        )
        virt_a, virt_b = self.calculate_virtual_reserves(
            self.active_price, self.liquidity_L, self.price_lower, self.price_upper
        )
        k_ratio = self.active_price / max(0.0001, self.entry_price)
        il_ratio = self.calculate_analytical_impermanent_loss(k_ratio)
        cap_eff = self.calculate_capital_efficiency(self.price_lower, self.price_upper)
        fee_bps = self.calculate_dynamic_fee_bps()

        # Flat constant product equivalent capital
        flat_real_a = self.liquidity_L / math.sqrt(self.active_price)
        flat_real_b = self.liquidity_L * math.sqrt(self.active_price)

        is_ledger_valid, failing_idx = self.verify_ledger_integrity()

        return {
            "pool_id": self.config.pool_id,
            "active_price_pts": self.active_price,
            "entry_price_pts": self.entry_price,
            "price_lower_pts": self.price_lower,
            "price_upper_pts": self.price_upper,
            "tick_in_range": self.price_lower <= self.active_price <= self.price_upper,
            "real_reserve_a_units": real_a,
            "real_reserve_b_units": real_b,
            "virtual_reserve_a_units": virt_a,
            "virtual_reserve_b_units": virt_b,
            "liquidity_scalar_L": self.liquidity_L,
            "dynamic_fee_bps": fee_bps,
            "rolling_sigma": self.rolling_sigma,
            "impermanent_loss_ratio": il_ratio,
            "impermanent_loss_pct": il_ratio * 100.0,
            "capital_efficiency_multiplier": cap_eff,
            "constant_product_capital_required_a": flat_real_a,
            "constant_product_capital_required_b": flat_real_b,
            "total_fee_accrual_a_units": self.total_fee_accrual_a,
            "total_fee_accrual_b_units": self.total_fee_accrual_b,
            "total_volume_units": self.total_volume_units,
            "swap_execution_count": self.swap_count,
            "ledger_height": len(self.ledger),
            "ledger_integrity_verified": is_ledger_valid,
            "ledger_head_hash": self.ledger[-1].block_hash if self.ledger else "",
        }


# -------------------------------------------------------------------------
# Standalone Web Service API Definition (FastAPI / Standard ASGI)
# -------------------------------------------------------------------------
try:
    from fastapi import FastAPI, HTTPException
    from pydantic import BaseModel

    app = FastAPI(
        title="GF-T3-207: APEX-207 AMM Dynamic Liquidity Engine",
        version="1.0.0",
        description="Institutional Automated Market Maker quantitative engine specification.",
    )
    engine_instance = Apex207AmmEngine()

    class SwapRequest(BaseModel):
        token_in: str
        amount_in: float

    class TickBoundsRequest(BaseModel):
        price_lower: float
        price_upper: float

    class VolatilitySpikeRequest(BaseModel):
        multiplier: float = 2.5

    class PriceShiftRequest(BaseModel):
        target_price: float

    @app.get("/api/v1/telemetry")
    def get_telemetry():
        return engine_instance.get_telemetry_state()

    @app.get("/api/v1/ledger")
    def get_ledger(limit: int = 50):
        blocks = engine_instance.ledger[-limit:]
        return [asdict(b) for b in blocks]

    @app.post("/api/v1/swap")
    def execute_swap(req: SwapRequest):
        if req.token_in == "RESERVE-A":
            return engine_instance.swap_exact_a_for_b(req.amount_in)
        elif req.token_in == "RESERVE-B":
            return engine_instance.swap_exact_b_for_a(req.amount_in)
        else:
            raise HTTPException(status_code=400, detail="Invalid token_in identifier")

    @app.post("/api/v1/bounds")
    def update_bounds(req: TickBoundsRequest):
        return engine_instance.set_tick_bounds(req.price_lower, req.price_upper)

    @app.post("/api/v1/volatility/spike")
    def trigger_volatility_spike(req: VolatilitySpikeRequest):
        return engine_instance.simulate_volatility_spike(req.multiplier)

    @app.post("/api/v1/oracle/shift")
    def shift_price(req: PriceShiftRequest):
        return engine_instance.simulate_price_shift(req.target_price)

    @app.post("/api/v1/reset")
    def reset_pool():
        return engine_instance.reset_pool()

    @app.get("/api/v1/ledger/verify")
    def verify_ledger():
        valid, idx = engine_instance.verify_ledger_integrity()
        return {"valid": valid, "failing_block_index": idx, "height": len(engine_instance.ledger)}

except ImportError:
    app = None


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 3000))
    print(f"APEX-207 AMM Engine initialized on port {port}. Ledger height: 1")
    test_engine = Apex207AmmEngine()
    print("Testing swap exact A for B 100,000 units:")
    res = test_engine.swap_exact_a_for_b(100_000.0)
    print(f"Executed swap: Out={res['execution']['amount_out']:.2f} units, New Price={res['execution']['price_after']:.4f} pts")
    print(f"Ledger verified: {test_engine.verify_ledger_integrity()[0]}")
