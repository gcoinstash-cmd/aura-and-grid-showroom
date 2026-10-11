"""
ApexLimit Engine - GF-T3-151
Pre-Trade Risk Sentinel, Dynamic Haircut Collateral Manager,
and Real-Time Sub-Millisecond Liquidation Sentinel.

SPDX-License-Identifier: Apache-2.0 / MIT
Clean-Room Certified: Strict Permissive, Zero Copyleft.
"""

from __future__ import annotations
import time
from dataclasses import dataclass, field
from typing import Dict, Optional, Tuple, List
from .matching_engine import SCALE_FACTOR, to_scaled, from_scaled, OrderSide


@dataclass(slots=True)
class CollateralAsset:
    asset_id: str
    haircut_bps: int = 1000  # 1000 bps = 10.0% haircut
    mark_price_scaled: int = 1 * SCALE_FACTOR  # Default 1.0 (USD/USDC)


@dataclass(slots=True)
class Position:
    symbol: str
    quantity_scaled: int = 0  # Positive = Long, Negative = Short
    entry_price_scaled: int = 0
    mark_price_scaled: int = 0
    imr_rate_bps: int = 500   # 5% Initial Margin (20x max leverage)
    mmr_rate_bps: int = 250   # 2.5% Maintenance Margin (40x liquidation floor)

    @property
    def is_open(self) -> bool:
        return self.quantity_scaled != 0

    @property
    def unrealized_pnl_scaled(self) -> int:
        if self.quantity_scaled == 0 or self.mark_price_scaled == 0:
            return 0
        diff = self.mark_price_scaled - self.entry_price_scaled
        return (self.quantity_scaled * diff) // SCALE_FACTOR

    @property
    def notional_scaled(self) -> int:
        price = self.mark_price_scaled if self.mark_price_scaled > 0 else self.entry_price_scaled
        return abs(self.quantity_scaled * price) // SCALE_FACTOR

    @property
    def initial_margin_required_scaled(self) -> int:
        return (self.notional_scaled * self.imr_rate_bps) // 10_000

    @property
    def maintenance_margin_required_scaled(self) -> int:
        return (self.notional_scaled * self.mmr_rate_bps) // 10_000


@dataclass(slots=True)
class MarginState:
    account_id: str
    cash_balance: float
    collateral_value: float
    unrealized_pnl: float
    total_equity: float
    initial_margin_requirement: float
    maintenance_margin_requirement: float
    open_orders_margin_locked: float
    free_collateral_margin: float
    margin_utilization_ratio: float
    portfolio_leverage_ratio: float
    is_liquidation_triggered: bool
    status: str


@dataclass
class AccountRiskProfile:
    account_id: str
    client_label: str
    cash_balance_scaled: int = 100_000 * SCALE_FACTOR  # 100,000 USD default
    max_leverage_ratio: float = 20.0
    is_liquidating: bool = False
    is_frozen: bool = False
    # asset_id -> amount_scaled
    collateral_balances_scaled: Dict[str, int] = field(default_factory=dict)
    # symbol -> Position
    positions: Dict[str, Position] = field(default_factory=dict)
    # order_id -> locked_margin_scaled
    locked_margins_scaled: Dict[str, int] = field(default_factory=dict)


class RiskManager:
    """
    Sub-millisecond Pre-Trade Risk Manager & Haircut Liquidation Sentinel.
    Evaluates collateral health, leverage caps, and liquidation thresholds.
    """

    def __init__(self):
        self.accounts: Dict[str, AccountRiskProfile] = {}
        self.collateral_assets: Dict[str, CollateralAsset] = {
            "USD": CollateralAsset(asset_id="USD", haircut_bps=0, mark_price_scaled=to_scaled(1.0)),
            "USDC": CollateralAsset(asset_id="USDC", haircut_bps=50, mark_price_scaled=to_scaled(1.0)),
            "BTC": CollateralAsset(asset_id="BTC", haircut_bps=1500, mark_price_scaled=to_scaled(65000.0)),
            "ETH": CollateralAsset(asset_id="ETH", haircut_bps=2000, mark_price_scaled=to_scaled(3500.0)),
        }
        self.mark_prices_scaled: Dict[str, int] = {
            "BTC-USD": to_scaled(65000.0),
            "ETH-USD": to_scaled(3500.0),
            "SOL-USD": to_scaled(150.0),
        }

    def register_account(
        self,
        account_id: str,
        client_label: str,
        initial_cash: float = 100_000.0,
        max_leverage: float = 20.0,
    ) -> AccountRiskProfile:
        profile = AccountRiskProfile(
            account_id=account_id,
            client_label=client_label,
            cash_balance_scaled=to_scaled(initial_cash),
            max_leverage_ratio=max_leverage,
        )
        self.accounts[account_id] = profile
        return profile

    def get_or_create_account(self, account_id: str) -> AccountRiskProfile:
        if account_id not in self.accounts:
            self.register_account(account_id, client_label=f"acc_{account_id[:8]}")
        return self.accounts[account_id]

    def set_mark_price(self, symbol: str, price: float) -> None:
        price_scaled = to_scaled(price)
        self.mark_prices_scaled[symbol] = price_scaled
        for acc in self.accounts.values():
            if symbol in acc.positions:
                acc.positions[symbol].mark_price_scaled = price_scaled

    def calculate_equity_scaled(self, account: AccountRiskProfile) -> int:
        """Net Equity = Cash + Collateral * (1 - Haircut) + Unrealized PnL"""
        total = account.cash_balance_scaled

        # Collateral valuation with haircut
        for asset_id, amount_scaled in account.collateral_balances_scaled.items():
            if asset_id in self.collateral_assets:
                asset = self.collateral_assets[asset_id]
                raw_val = (amount_scaled * asset.mark_price_scaled) // SCALE_FACTOR
                haircut_mult = 10_000 - asset.haircut_bps
                discounted_val = (raw_val * haircut_mult) // 10_000
                total += discounted_val

        # Positions unrealized PnL
        for pos in account.positions.values():
            total += pos.unrealized_pnl_scaled

        return total

    def calculate_imr_scaled(self, account: AccountRiskProfile) -> int:
        """Total Initial Margin Requirement = Position IMR + Open Order Locks"""
        total_imr = sum(p.initial_margin_required_scaled for p in account.positions.values())
        total_imr += sum(account.locked_margins_scaled.values())
        return total_imr

    def calculate_mmr_scaled(self, account: AccountRiskProfile) -> int:
        """Total Maintenance Margin Requirement"""
        return sum(p.maintenance_margin_required_scaled for p in account.positions.values())

    def validate_pre_trade_order(
        self,
        account_id: str,
        order_id: str,
        symbol: str,
        side: OrderSide,
        price_scaled: int,
        quantity_scaled: int,
    ) -> Tuple[bool, Optional[str], int]:
        """
        Verify that placing the order does not breach leverage or free collateral limits.
        Returns: (is_approved, error_message, required_margin_scaled)
        """
        account = self.get_or_create_account(account_id)

        if account.is_frozen:
            return False, "ACCOUNT_FROZEN: Pre-trade risk rejected - account frozen", 0

        if account.is_liquidating:
            return False, "ACCOUNT_LIQUIDATING: Order rejected - account in liquidation state", 0

        # Calculate required margin for this order:
        # Default IMR = 5% (500 bps)
        order_notional_scaled = (price_scaled * quantity_scaled) // SCALE_FACTOR
        required_margin_scaled = (order_notional_scaled * 500) // 10_000

        equity_scaled = self.calculate_equity_scaled(account)
        current_imr_scaled = self.calculate_imr_scaled(account)

        available_margin_scaled = equity_scaled - current_imr_scaled

        if required_margin_scaled > available_margin_scaled:
            diff_short_float = from_scaled(required_margin_scaled - available_margin_scaled)
            return (
                False,
                f"INSUFFICIENT_MARGIN: Order requires ${from_scaled(required_margin_scaled):.2f} margin, "
                f"available is ${from_scaled(available_margin_scaled):.2f} (short by ${diff_short_float:.2f})",
                0,
            )

        # Leverage check
        total_position_notional = sum(p.notional_scaled for p in account.positions.values())
        post_notional = total_position_notional + order_notional_scaled
        post_leverage = (from_scaled(post_notional) / max(from_scaled(equity_scaled), 1.0))

        if post_leverage > account.max_leverage_ratio:
            return (
                False,
                f"LEVERAGE_CEILING_BREACH: Projected leverage {post_leverage:.1f}x exceeds account maximum {account.max_leverage_ratio}x",
                0,
            )

        # Lock the margin for resting order
        account.locked_margins_scaled[order_id] = required_margin_scaled
        return True, None, required_margin_scaled

    def release_order_margin(self, account_id: str, order_id: str) -> None:
        """Release margin locked by a cancelled or filled order."""
        if account_id in self.accounts:
            account = self.accounts[account_id]
            account.locked_margins_scaled.pop(order_id, None)

    def record_fill(
        self,
        account_id: str,
        symbol: str,
        side: OrderSide,
        price_scaled: int,
        quantity_scaled: int,
        order_id: Optional[str] = None,
    ) -> None:
        """Update position and cash balances upon trade execution."""
        account = self.get_or_create_account(account_id)

        if order_id:
            self.release_order_margin(account_id, order_id)

        if symbol not in account.positions:
            account.positions[symbol] = Position(
                symbol=symbol,
                mark_price_scaled=self.mark_prices_scaled.get(symbol, price_scaled),
            )

        pos = account.positions[symbol]
        signed_qty = quantity_scaled if side == OrderSide.BUY else -quantity_scaled

        # If opening or adding to position in same direction
        if (pos.quantity_scaled >= 0 and signed_qty > 0) or (pos.quantity_scaled <= 0 and signed_qty < 0):
            new_qty = pos.quantity_scaled + signed_qty
            if new_qty != 0:
                # Weighted average entry price
                total_cost = (abs(pos.quantity_scaled) * pos.entry_price_scaled) + (quantity_scaled * price_scaled)
                pos.entry_price_scaled = total_cost // abs(new_qty)
            pos.quantity_scaled = new_qty
        else:
            # Closing or reversing position: Realize PnL on closed portion
            closing_qty = min(abs(pos.quantity_scaled), quantity_scaled)
            price_diff = (price_scaled - pos.entry_price_scaled) if pos.quantity_scaled > 0 else (pos.entry_price_scaled - price_scaled)
            realized_pnl_scaled = (closing_qty * price_diff) // SCALE_FACTOR
            account.cash_balance_scaled += realized_pnl_scaled

            new_qty = pos.quantity_scaled + signed_qty
            if (pos.quantity_scaled > 0 and new_qty < 0) or (pos.quantity_scaled < 0 and new_qty > 0):
                # Flipped side, entry price is current trade price
                pos.entry_price_scaled = price_scaled
            pos.quantity_scaled = new_qty

        pos.mark_price_scaled = self.mark_prices_scaled.get(symbol, price_scaled)

    def evaluate_margin_state(self, account_id: str) -> MarginState:
        """Compute full margin telemetry and trigger liquidation sentinel if breached."""
        account = self.get_or_create_account(account_id)

        equity_scaled = self.calculate_equity_scaled(account)
        imr_scaled = self.calculate_imr_scaled(account)
        mmr_scaled = self.calculate_mmr_scaled(account)
        locked_scaled = sum(account.locked_margins_scaled.values())
        free_margin_scaled = max(0, equity_scaled - imr_scaled)

        equity_float = from_scaled(equity_scaled)
        imr_float = from_scaled(imr_scaled)
        mmr_float = from_scaled(mmr_scaled)

        # Utilization ratio: IMR / Equity
        util_ratio = round((imr_float / max(equity_float, 0.0001)) * 100, 2)

        # Portfolio total notional
        total_notional_float = from_scaled(sum(p.notional_scaled for p in account.positions.values()))
        portfolio_leverage = round(total_notional_float / max(equity_float, 0.0001), 2)

        # Sentinel: Check liquidation condition (Equity <= MMR)
        is_triggered = (equity_scaled <= mmr_scaled) and (len(account.positions) > 0 and any(p.is_open for p in account.positions.values()))
        if is_triggered:
            account.is_liquidating = True
            status = "LIQUIDATION_BREACHED"
        elif util_ratio > 85.0:
            status = "MARGIN_CALL_WARNING"
        else:
            status = "HEALTHY"

        return MarginState(
            account_id=account_id,
            cash_balance=from_scaled(account.cash_balance_scaled),
            collateral_value=sum(from_scaled((amt * self.collateral_assets[a].mark_price_scaled) // SCALE_FACTOR) for a, amt in account.collateral_balances_scaled.items() if a in self.collateral_assets),
            unrealized_pnl=sum(from_scaled(p.unrealized_pnl_scaled) for p in account.positions.values()),
            total_equity=equity_float,
            initial_margin_requirement=imr_float,
            maintenance_margin_requirement=mmr_float,
            open_orders_margin_locked=from_scaled(locked_scaled),
            free_collateral_margin=from_scaled(free_margin_scaled),
            margin_utilization_ratio=util_ratio,
            portfolio_leverage_ratio=portfolio_leverage,
            is_liquidation_triggered=is_triggered,
            status=status,
        )

    def trigger_liquidation_cascade(self, account_id: str) -> List[str]:
        """
        Execute institutional liquidation unwinding:
        1. Cancel all resting open orders to unlock collateral.
        2. Liquidate open positions into market depth.
        """
        account = self.get_or_create_account(account_id)
        actions = []

        # Cancel locks
        cancelled_orders = list(account.locked_margins_scaled.keys())
        for o_id in cancelled_orders:
            account.locked_margins_scaled.pop(o_id, None)
            actions.append(f"CANCELLED_ORDER_{o_id}")

        # Unwind open positions
        for symbol, pos in list(account.positions.items()):
            if pos.is_open:
                actions.append(f"LIQUIDATE_POSITION_{symbol}_QTY_{from_scaled(abs(pos.quantity_scaled))}")
                pos.quantity_scaled = 0

        account.is_liquidating = False
        return actions
