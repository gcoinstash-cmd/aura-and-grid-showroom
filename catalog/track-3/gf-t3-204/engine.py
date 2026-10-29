"""
APEX-204 Algorithmic Execution Engine
Clean-Room MIT Implementation
Algorithms: Almgren-Chriss Optimal Trajectory, VWAP Intraday Profiling, TWAP with Sizing Jitter
"""

import math
import random
import hashlib
import uuid
from datetime import datetime, timezone
from typing import List, Tuple, Dict, Any, Optional

from models import (
    OrderSide,
    ExecutionStrategy,
    ExecutionVenue,
    SliceStatus,
    ParentOrderStatus,
    PlanOrderRequest,
    ChildSlice,
    ParentOrder,
)


class QuantExecutionEngine:
    """
    Production-grade Quantitative Execution Engine implementing:
    - Almgren-Chriss (2000) calculus of variations optimal liquidation
    - VWAP U-curve volume profile tracking
    - TWAP linear schedule with randomized anti-gaming jitter
    - Smart Order Router (SOR) multi-venue dispatcher
    - SHA-256 immutable audit chain
    """

    def __init__(self, seed: Optional[int] = 42):
        if seed is not None:
            random.seed(seed)

    @staticmethod
    def compute_sha256(payload: str) -> str:
        """Compute SHA-256 hash string for tamper-evident ledger chaining."""
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    def generate_vwap_profile(self, n_slices: int) -> List[float]:
        """
        Generate institutional U-shaped (smile) intraday volume distribution curve.
        High volume at market open (09:30) and close (16:00), trough at midday.
        """
        weights = []
        for i in range(n_slices):
            # Normalized intraday timeline t in [0.0, 1.0]
            t = (i + 0.5) / n_slices
            
            # Base quadratic smile
            u_curve = 0.40 + 3.2 * ((t - 0.5) ** 2)
            
            # Opening auction/cross surge
            open_surge = 1.10 * math.exp(-((t - 0.05) ** 2) / 0.015)
            
            # Closing cross auction ramp
            close_surge = 1.35 * math.exp(-((t - 0.95) ** 2) / 0.015)
            
            w = u_curve + open_surge + close_surge
            weights.append(max(w, 0.05))

        total_weight = sum(weights)
        return [w / total_weight for w in weights]

    def compute_almgren_chriss_trajectory(
        self,
        total_shares: float,
        n_slices: int,
        risk_aversion: float,
        volatility: float,
        temporary_impact: float,
    ) -> Tuple[List[float], List[float]]:
        """
        Euler-Lagrange solution to Almgren-Chriss (2000) optimal liquidation problem.
        x(t) = X_0 * sinh(kappa * (T - t)) / sinh(kappa * T)
        kappa = sqrt(lambda * sigma^2 / eta)
        Returns:
            (remaining_inventory_trajectory, slice_sizes)
        """
        T = 1.0  # normalized horizon
        # Calculate kappa (liquidation urgency)
        variance = volatility ** 2
        # Avoid division by zero or negative radicand
        eta = max(temporary_impact, 1e-12)
        kappa_sq = (risk_aversion * variance) / eta
        kappa = math.sqrt(max(kappa_sq, 1e-10))

        # Clamp kappa * T to prevent float overflow in math.sinh
        effective_kappa = min(kappa, 50.0)

        trajectory: List[float] = [total_shares]
        slices: List[float] = []

        if effective_kappa < 1e-4:
            # Taylor limit: reduces to linear TWAP
            for k in range(1, n_slices + 1):
                t_k = k / n_slices
                x_k = total_shares * (1.0 - t_k)
                trajectory.append(max(x_k, 0.0))
        else:
            sinh_k_T = math.sinh(effective_kappa * T)
            for k in range(1, n_slices + 1):
                t_k = k / n_slices
                x_k = total_shares * (math.sinh(effective_kappa * (T - t_k)) / sinh_k_T)
                trajectory.append(max(x_k, 0.0))

        # Force terminal boundary condition x_N = 0
        trajectory[-1] = 0.0

        # Compute discrete slices n_k = x_{k-1} - x_k
        raw_slices = [trajectory[k - 1] - trajectory[k] for k in range(1, n_slices + 1)]

        # Guarantee exact total quantity preservation
        slice_sum = sum(raw_slices)
        if slice_sum > 0:
            scale = total_shares / slice_sum
            slices = [s * scale for s in raw_slices]
        else:
            slices = [total_shares / n_slices] * n_slices

        # Recalculate discrete trajectory backwards from exact slices
        recalced_traj = [total_shares]
        cur = total_shares
        for s in slices:
            cur -= s
            recalced_traj.append(max(cur, 0.0))
        recalced_traj[-1] = 0.0

        return recalced_traj, slices

    def compute_vwap_slices(
        self, total_shares: float, n_slices: int
    ) -> Tuple[List[float], List[float]]:
        """
        Slices sized proportionally to expected historical intraday volume curve.
        """
        profile = self.generate_vwap_profile(n_slices)
        slices = [total_shares * w for w in profile]

        # Enforce exact sum preservation
        diff = total_shares - sum(slices)
        slices[-1] += diff

        trajectory = [total_shares]
        rem = total_shares
        for s in slices:
            rem -= s
            trajectory.append(max(rem, 0.0))
        trajectory[-1] = 0.0

        return trajectory, slices

    def compute_twap_slices(
        self, total_shares: float, n_slices: int, jitter_pct: float
    ) -> Tuple[List[float], List[float]]:
        """
        Linear schedule with configurable randomized sizing jitter to prevent toxic detection.
        Preserves exact sum: sum(n_k) == total_shares.
        """
        base_slice = total_shares / n_slices
        jitter_pct = max(0.0, min(jitter_pct, 0.5))

        raw_slices = []
        for _ in range(n_slices):
            # Uniform jitter in [-jitter_pct, +jitter_pct]
            j = random.uniform(-jitter_pct, jitter_pct)
            raw_slices.append(base_slice * (1.0 + j))

        # Strictly normalize so sum equals total_shares exactly
        raw_sum = sum(raw_slices)
        scale = total_shares / raw_sum
        slices = [s * scale for s in raw_slices]

        # Fix minor floating point residuals on last slice
        slices[-1] += total_shares - sum(slices)

        trajectory = [total_shares]
        rem = total_shares
        for s in slices:
            rem -= s
            trajectory.append(max(rem, 0.0))
        trajectory[-1] = 0.0

        return trajectory, slices

    def route_slice_to_venue(
        self,
        slice_shares: float,
        spread_bps: float,
        slice_index: int,
        n_slices: int,
    ) -> ExecutionVenue:
        """
        Smart Order Router (SOR) multi-venue dispatch policy:
        - Midpoint Dark Pool ATS: prioritized for large block sizes or tight spreads
        - Primary Lit Exchange: used for open/close auctions or when depth is required
        - Secondary ECN: used for opportunistic rebate capture on smaller slices
        """
        # Primary auction priority on first and final slices
        if slice_index == 0 or slice_index == n_slices - 1:
            return ExecutionVenue.PRIMARY_EXCHANGE_LIT

        # Large relative slices routed to dark pool to avoid lit footprint
        if spread_bps < 4.0:
            return ExecutionVenue.DARK_POOL_ATS
        elif slice_shares > 500:
            return ExecutionVenue.DARK_POOL_ATS
        else:
            return ExecutionVenue.SECONDARY_ECN

    def simulate_slice_fill(
        self,
        slice_shares: float,
        arrival_price: float,
        side: OrderSide,
        venue: ExecutionVenue,
        temporary_impact: float,
        permanent_impact: float,
        spread_bps: float,
        market_shock: bool = False,
    ) -> Tuple[float, float]:
        """
        Simulate realistic institutional execution fill with:
        - Temporary impact: eta * (slice_shares / tau)
        - Half-spread crossing cost
        - Venue rebate / midpoint dark pool savings
        - Optional volume shock / adverse selection
        Returns: (fill_price, slippage_bps)
        """
        half_spread = arrival_price * (spread_bps / 10000.0) / 2.0
        
        # Temporary impact cost in USD
        temp_cost = temporary_impact * (slice_shares ** 1.05)
        
        # Dark pool midpoint improvement
        venue_discount = 0.0
        if venue == ExecutionVenue.DARK_POOL_ATS:
            venue_discount = half_spread * 0.7  # 70% midpoint price improvement
        elif venue == ExecutionVenue.SECONDARY_ECN:
            venue_discount = half_spread * 0.2

        shock_factor = 2.5 if market_shock else 1.0
        
        total_price_delta = (half_spread - venue_discount + temp_cost) * shock_factor
        
        # Microstructure jitter
        noise = random.gauss(0.0, 0.005 * arrival_price * (spread_bps / 10000.0))
        total_price_delta += noise

        if side == OrderSide.BUY:
            fill_price = arrival_price + max(0.001, total_price_delta)
            slippage_bps = ((fill_price - arrival_price) / arrival_price) * 10000.0
        else:
            fill_price = arrival_price - max(0.001, total_price_delta)
            slippage_bps = ((arrival_price - fill_price) / arrival_price) * 10000.0

        return round(fill_price, 4), round(slippage_bps, 2)

    def plan_order(self, req: PlanOrderRequest) -> ParentOrder:
        """
        Full orchestration of parent order slicing and schedule synthesis.
        """
        order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        total_shares = req.notional / req.arrival_price
        now_iso = datetime.now(timezone.utc).isoformat()

        if req.strategy == ExecutionStrategy.ALMGREN_CHRISS:
            traj, slices = self.compute_almgren_chriss_trajectory(
                total_shares=total_shares,
                n_slices=req.slices,
                risk_aversion=req.risk_aversion_lambda,
                volatility=req.volatility_sigma,
                temporary_impact=req.temporary_impact_eta,
            )
        elif req.strategy == ExecutionStrategy.VWAP:
            traj, slices = self.compute_vwap_slices(
                total_shares=total_shares, n_slices=req.slices
            )
        else:  # TWAP
            traj, slices = self.compute_twap_slices(
                total_shares=total_shares,
                n_slices=req.slices,
                jitter_pct=req.twap_jitter_pct,
            )

        genesis_payload = f"GENESIS|{order_id}|{req.symbol}|{req.notional}|{now_iso}"
        genesis_hash = self.compute_sha256(genesis_payload)
        latest_hash = genesis_hash

        child_slices: List[ChildSlice] = []
        for i, shares in enumerate(slices):
            slice_id = f"{order_id}-SL{i+1:02d}"
            venue = self.route_slice_to_venue(shares, spread_bps=2.5, slice_index=i, n_slices=req.slices)
            sched_time_pct = (i + 1) / req.slices
            
            # Hash chain block: H_k = SHA256(H_{k-1} + slice_id + shares + venue)
            block_data = f"{latest_hash}|{slice_id}|{shares:.4f}|{venue.value}|{sched_time_pct:.4f}"
            current_hash = self.compute_sha256(block_data)
            latest_hash = current_hash

            child_slices.append(
                ChildSlice(
                    slice_id=slice_id,
                    slice_index=i + 1,
                    parent_id=order_id,
                    target_shares=round(shares, 4),
                    filled_shares=0.0,
                    scheduled_time_pct=round(sched_time_pct, 4),
                    execution_time_sec=i * 30.0,
                    venue=venue,
                    limit_price=req.arrival_price,
                    status=SliceStatus.PENDING,
                    audit_hash=current_hash,
                    timestamp=now_iso,
                )
            )

        order = ParentOrder(
            order_id=order_id,
            symbol=req.symbol,
            side=req.side,
            strategy=req.strategy,
            notional=req.notional,
            arrival_price=req.arrival_price,
            total_shares=round(total_shares, 4),
            executed_shares=0.0,
            remaining_shares=round(total_shares, 4),
            average_exec_price=0.0,
            implementation_shortfall_usd=0.0,
            slippage_bps=0.0,
            status=ParentOrderStatus.ACTIVE,
            slices=child_slices,
            created_at=now_iso,
            genesis_hash=genesis_hash,
            latest_audit_hash=latest_hash,
        )
        return order


# Global engine singleton
engine_instance = QuantExecutionEngine()
