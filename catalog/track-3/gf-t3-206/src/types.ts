/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RebalanceExecution {
  timestamp: number;
  spread: number;
  z_score: number;
  action: 'LONG_SPREAD' | 'SHORT_SPREAD' | 'EXIT_REVERSION' | 'STOP_BREAK';
  hedge_ratio: number;
  hash: string;
}

export interface LedgerBlock {
  index: number;
  timestamp: number;
  event_type: string;
  z_score: number;
  hedge_ratio: number;
  spread: number;
  previous_hash: string;
  hash: string;
}

export interface EngineResult {
  status: string;
  cluster_pair: string;
  current_spread: number;
  hedge_ratio_beta: number;
  intercept_alpha: number;
  z_score: number;
  adf_statistic: number;
  adf_p_value: number;
  half_life_periods: number;
  regime: string;
  action_signal: string;
  spread_history: number[];
  ledger_chain: LedgerBlock[];
}
