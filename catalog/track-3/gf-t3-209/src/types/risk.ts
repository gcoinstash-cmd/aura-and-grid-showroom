/**
 * GF-T3-209: APEX-209 Quantitative Risk Engine Types
 * Pure synthetic baskets, multi-regime risk vectors, and cryptographic ledger types
 * Zero-dollar compliance: All exposures in dimensionless units or percentages
 */

export interface SyntheticBasket {
  id: string;
  name: string;
  allocationPct: number;
  weight: number;
  dailyVolPct: number;
}

export interface RiskEvaluationResult {
  alpha: number;
  notionalUnits: number;
  meanPct: number;
  volatilityPct: number;
  skewness: number;
  excessKurtosis: number;
  
  // Parametric Cornish-Fisher
  cfVarUnits: number;
  cfVarPct: number;
  cfEsUnits: number;
  cfEsPct: number;
  cfZQuantile: number;

  // Historical Simulation with Hull-White Volatility Updating
  hwVarUnits: number;
  hwVarPct: number;
  hwEsUnits: number;
  hwEsPct: number;
  hwCurrentVolPct: number;

  // Extreme Value Theory (EVT) Peaks-Over-Threshold (POT)
  evtVarUnits: number;
  evtVarPct: number;
  evtEsUnits: number;
  evtEsPct: number;
  evtThresholdUnits: number;
  evtTailIndexXi: number;
  evtScaleBetaUnits: number;
  evtExceedanceCount: number;
}

export interface MonteCarloSummary {
  pathCount: number;
  worstLossUnits: number;
  var95Units: number;
  var99Units: number;
  var995Units: number;
  es99Units: number;
  simulatedLosses: number[];
}

export interface KupiecResult {
  failures: number;
  totalObs: number;
  nominalRatePct: number;
  empiricalRatePct: number;
  lrStat: number;
  pValue: number;
  isAccepted: boolean;
  baselZone: 'GREEN' | 'YELLOW' | 'RED';
}

export interface ChristoffersenResult {
  n00: number;
  n01: number;
  n10: number;
  n11: number;
  pi01: number;
  pi11: number;
  lrStat: number;
  pValue: number;
  isIndependent: boolean;
}

export interface AuditBlockData {
  index: number;
  timestamp: string;
  eventType: string;
  payloadHash: string;
  prevHash: string;
  blockHash: string;
  payload: Record<string, string | number | boolean>;
}
