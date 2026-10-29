export type OrderSide = 'BUY' | 'SELL';

export type ExecutionStrategy = 'ALMGREN_CHRISS' | 'VWAP' | 'TWAP';

export type ExecutionVenue = 'DARK_POOL_ATS' | 'PRIMARY_EXCHANGE_LIT' | 'SECONDARY_ECN';

export type SliceStatus = 'PENDING' | 'ROUTED' | 'ACKNOWLEDGED' | 'FILLED' | 'CANCELLED';

export type ParentOrderStatus = 'PENDING' | 'ACTIVE' | 'PARTIALLY_FILLED' | 'COMPLETED' | 'CANCELLED';

export interface ChildSlice {
  slice_id: string;
  slice_index: number;
  parent_id: string;
  target_shares: number;
  filled_shares: number;
  scheduled_time_pct: number;
  execution_time_sec: number;
  venue: ExecutionVenue;
  limit_price: number;
  fill_price: number | null;
  slippage_bps: number;
  status: SliceStatus;
  audit_hash: string;
  timestamp: string;
}

export interface ParentOrder {
  order_id: string;
  symbol: string;
  side: OrderSide;
  strategy: ExecutionStrategy;
  notional: number;
  arrival_price: number;
  total_shares: number;
  executed_shares: number;
  remaining_shares: number;
  average_exec_price: number;
  implementation_shortfall_usd: number;
  slippage_bps: number;
  status: ParentOrderStatus;
  slices: ChildSlice[];
  created_at: string;
  completed_at: string | null;
  genesis_hash: string;
  latest_audit_hash: string;
}

export interface SimulationParams {
  symbol: string;
  notional: number;
  arrival_price: number;
  side: OrderSide;
  strategy: ExecutionStrategy;
  slices: number;
  risk_aversion_lambda: number;
  volatility_sigma: number;
  temporary_impact_eta: number;
  permanent_impact_gamma: number;
  twap_jitter_pct: number;
}

export interface IntradayVolumeBin {
  bin_index: number;
  time_label: string;
  expected_weight: number;
  realized_weight: number;
  volume_shares: number;
  is_active: boolean;
}

export interface AuditBlock {
  step: number;
  type: string;
  slice_id?: string;
  prev_hash: string;
  hash: string;
  payload: string;
  timestamp: string;
  is_valid: boolean;
}

export interface MarketCondition {
  spread_bps: number;
  volume_shock: boolean;
  spread_widened: boolean;
  venue_liquidity: {
    dark_pool: number;
    primary_lit: number;
    secondary_ecn: number;
  };
}

export type AlertSeverity = 'critical' | 'warning' | 'success' | 'info';

export type AlertTriggerType =
  | 'SLIPPAGE_BREACH'
  | 'ORDER_COMPLETE'
  | 'VOLUME_SHOCK'
  | 'SPREAD_WIDENING'
  | 'DARK_POOL_CROSS';

export interface ToastAlert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  triggerType: AlertTriggerType;
  metricValue?: string;
  autoCloseMs?: number;
}

export interface NotificationSettings {
  soundEnabled: boolean;
  slippageThresholdBps: number;
  notifyOnSlippageBreach: boolean;
  notifyOnOrderComplete: boolean;
  notifyOnVolumeShock: boolean;
  notifyOnSpreadWidening: boolean;
}
