"""
APEX-204 Execution Engine Models
Permissive Clean-Room MIT Architecture
Compatible with both Pydantic v2 (FastAPI runtime) and standard library dataclasses.
"""

from enum import Enum
from typing import List, Optional, Any, Dict

try:
    from pydantic import BaseModel, Field

    class PlanOrderRequest(BaseModel):
        symbol: str = Field(default="SYNTH-ALPHA", description="Synthetic asset identifier")
        notional: float = Field(default=1_000_000.0, description="Parent order notional in dimensionless units")
        arrival_price: float = Field(default=125.50, description="Midpoint arrival price in benchmark points")
        side: "OrderSide" = Field(default="BUY", description="BUY or SELL")
        strategy: "ExecutionStrategy" = Field(
            default="ALMGREN_CHRISS", description="Execution strategy"
        )
        slices: int = Field(default=20, ge=4, le=100, description="Number of child slices")
        risk_aversion_lambda: float = Field(
            default=1e-6, description="Almgren-Chriss risk aversion parameter lambda"
        )
        volatility_sigma: float = Field(
            default=0.02, description="Volatility parameter sigma"
        )
        temporary_impact_eta: float = Field(
            default=2.5e-7, description="Temporary market impact parameter eta"
        )
        permanent_impact_gamma: float = Field(
            default=1.0e-7, description="Permanent market impact parameter gamma"
        )
        twap_jitter_pct: float = Field(
            default=0.15, ge=0.0, le=0.5, description="Randomized TWAP size jitter"
        )

    class ChildSlice(BaseModel):
        slice_id: str
        slice_index: int
        parent_id: str
        target_shares: float
        filled_shares: float = 0.0
        scheduled_time_pct: float
        execution_time_sec: float
        venue: "ExecutionVenue"
        limit_price: float
        fill_price: Optional[float] = None
        slippage_bps: float = 0.0
        status: "SliceStatus" = "PENDING"
        audit_hash: str = ""
        timestamp: str = ""

    class ParentOrder(BaseModel):
        order_id: str
        symbol: str
        side: "OrderSide"
        strategy: "ExecutionStrategy"
        notional: float
        arrival_price: float
        total_shares: float
        executed_shares: float = 0.0
        remaining_shares: float
        average_exec_price: float = 0.0
        implementation_shortfall_usd: float = 0.0
        slippage_bps: float = 0.0
        status: "ParentOrderStatus" = "PENDING"
        slices: List[ChildSlice] = []
        created_at: str = ""
        completed_at: Optional[str] = None
        genesis_hash: str = ""
        latest_audit_hash: str = ""

    class ExecutionStateResponse(BaseModel):
        order: ParentOrder
        intraday_volume_profile: List[float]
        trajectory_target: List[float]
        trajectory_actual: List[float]
        market_spread_bps: float
        volume_shock_active: bool

except ImportError:
    from dataclasses import dataclass, field

    @dataclass
    class PlanOrderRequest:
        symbol: str = "SYNTH-ALPHA"
        notional: float = 1_000_000.0
        arrival_price: float = 125.50
        side: Any = "BUY"
        strategy: Any = "ALMGREN_CHRISS"
        slices: int = 20
        risk_aversion_lambda: float = 1e-6
        volatility_sigma: float = 0.02
        temporary_impact_eta: float = 2.5e-7
        permanent_impact_gamma: float = 1.0e-7
        twap_jitter_pct: float = 0.15

        def model_dump(self) -> Dict[str, Any]:
            return self.__dict__

    @dataclass
    class ChildSlice:
        slice_id: str
        slice_index: int
        parent_id: str
        target_shares: float
        scheduled_time_pct: float
        execution_time_sec: float
        venue: Any
        limit_price: float
        filled_shares: float = 0.0
        fill_price: Optional[float] = None
        slippage_bps: float = 0.0
        status: Any = "PENDING"
        audit_hash: str = ""
        timestamp: str = ""

        def model_dump(self) -> Dict[str, Any]:
            res = dict(self.__dict__)
            if hasattr(res["venue"], "value"):
                res["venue"] = res["venue"].value
            if hasattr(res["status"], "value"):
                res["status"] = res["status"].value
            return res

    @dataclass
    class ParentOrder:
        order_id: str
        symbol: str
        side: Any
        strategy: Any
        notional: float
        arrival_price: float
        total_shares: float
        remaining_shares: float
        executed_shares: float = 0.0
        average_exec_price: float = 0.0
        implementation_shortfall_usd: float = 0.0
        slippage_bps: float = 0.0
        status: Any = "PENDING"
        slices: List[ChildSlice] = field(default_factory=list)
        created_at: str = ""
        completed_at: Optional[str] = None
        genesis_hash: str = ""
        latest_audit_hash: str = ""

        def model_dump(self) -> Dict[str, Any]:
            res = dict(self.__dict__)
            res["slices"] = [s.model_dump() for s in self.slices]
            return res

    @dataclass
    class ExecutionStateResponse:
        order: ParentOrder
        intraday_volume_profile: List[float]
        trajectory_target: List[float]
        trajectory_actual: List[float]
        market_spread_bps: float
        volume_shock_active: bool

        def model_dump(self) -> Dict[str, Any]:
            res = dict(self.__dict__)
            res["order"] = self.order.model_dump()
            return res


class OrderSide(str, Enum):
    BUY = "BUY"
    SELL = "SELL"


class ExecutionStrategy(str, Enum):
    ALMGREN_CHRISS = "ALMGREN_CHRISS"
    VWAP = "VWAP"
    TWAP = "TWAP"


class ExecutionVenue(str, Enum):
    DARK_POOL_ATS = "DARK_POOL_ATS"
    PRIMARY_EXCHANGE_LIT = "PRIMARY_EXCHANGE_LIT"
    SECONDARY_ECN = "SECONDARY_ECN"


class SliceStatus(str, Enum):
    PENDING = "PENDING"
    ROUTED = "ROUTED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"


class ParentOrderStatus(str, Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
