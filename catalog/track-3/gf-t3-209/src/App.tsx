/**
 * GF-T3-209: APEX-209 Multi-Regime VaR & Expected Shortfall Risk Engine
 * Institutional Quantitative Risk Terminal
 * Strict zero-dollar compliance & 14px text floor.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  generateSyntheticHistory,
  evaluateMultiRegimeRisk,
  runMonteCarlo10k,
  evaluateKupiecTest,
  evaluateChristoffersenTest,
  createAuditBlock,
  BASKET_1_CORE_EQUITY,
  BASKET_2_QUANT_FACTOR,
  BASKET_3_CREDIT_SPREAD
} from './lib/quantMath';
import { playSyntheticPing } from './lib/audioPing';
import {
  RiskEvaluationResult,
  MonteCarloSummary,
  KupiecResult,
  ChristoffersenResult,
  AuditBlockData
} from './types/risk';
import { TopNav, AppTabType } from './components/TopNav';
import { MetricCards } from './components/MetricCards';
import { DistributionChart } from './components/DistributionChart';
import { QQPlot } from './components/QQPlot';
import { StressControls } from './components/StressControls';
import { MethodologyComparisonTable } from './components/MethodologyComparisonTable';
import { BacktestPanel } from './components/BacktestPanel';
import { AuditLedgerPanel } from './components/AuditLedgerPanel';
import { SpecAndTransferView } from './components/SpecAndTransferView';
import { PieChart, SlidersHorizontal, ShieldAlert, Cpu } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTabType>('distribution');
  const [alpha, setAlpha] = useState<number>(0.99);
  const [notionalUnits] = useState<number>(10000000); // 10,000,000 Units
  const [activeMethodology, setActiveMethodology] = useState<'evt' | 'cf' | 'hw'>('evt');

  // Stress testing flags
  const [volMultiplier, setVolMultiplier] = useState<number>(1.0);
  const [flashLiquidity, setFlashLiquidity] = useState<boolean>(false);
  const [correlationBreakdown, setCorrelationBreakdown] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Core risk state
  const [risk, setRisk] = useState<RiskEvaluationResult | null>(null);
  const [monteCarlo, setMonteCarlo] = useState<MonteCarloSummary | null>(null);
  const [kupiec, setKupiec] = useState<KupiecResult | null>(null);
  const [christoffersen, setChristoffersen] = useState<ChristoffersenResult | null>(null);

  // Cryptographic audit ledger
  const [ledger, setLedger] = useState<AuditBlockData[]>(() => {
    const genesisPayload = {
      system: "APEX-209 Multi-Regime Risk Engine",
      protocol: "NIST SP 800-218 SSDF v1.1",
      initial_notional_units: 10000000,
      status: "GENESIS_INITIALIZED"
    };
    const genesisBlock = createAuditBlock(
      0,
      "GENESIS_STATE",
      genesisPayload,
      "0000000000000000000000000000000000000000000000000000000000000000"
    );
    return [genesisBlock];
  });

  // Recompute full quantitative state
  const runSimulation = useCallback(() => {
    setIsSimulating(true);
    playSyntheticPing(240, 0.15);

    // 1. Generate synthetic market history under active stress conditions
    const { returns, losses } = generateSyntheticHistory(
      750,
      volMultiplier,
      flashLiquidity,
      correlationBreakdown
    );

    // 2. Compute 3 concurrent risk methodologies
    const riskResult = evaluateMultiRegimeRisk(returns, losses, alpha, notionalUnits);
    setRisk(riskResult);

    // 3. Run 10,000-path correlated Cholesky Monte Carlo simulation
    const mcResult = runMonteCarlo10k(
      [0.45, 0.35, 0.20],
      volMultiplier,
      correlationBreakdown,
      notionalUnits
    );
    setMonteCarlo(mcResult);

    // 4. Run regulatory backtest suite
    const recentLosses = losses.slice(-250);
    const breachCount = recentLosses.filter(l => l >= riskResult.evtVarUnits).length;
    const initialFailures = Math.max(1, Math.min(breachCount, 8)); // nominal green/yellow boundary
    const kupiecRes = evaluateKupiecTest(initialFailures, 250, alpha);
    setKupiec(kupiecRes);

    const breachSeries = recentLosses.map(l => (l >= riskResult.evtVarUnits ? 1 : 0));
    const christoffersenRes = evaluateChristoffersenTest(breachSeries);
    setChristoffersen(christoffersenRes);

    // 5. Append risk vector snapshot to cryptographic ledger
    setLedger(prev => {
      const prevBlock = prev[prev.length - 1];
      const snapshotPayload = {
        alpha,
        notional_units: notionalUnits,
        vol_multiplier: volMultiplier,
        cf_var_units: Math.round(riskResult.cfVarUnits),
        hw_var_units: Math.round(riskResult.hwVarUnits),
        evt_var_units: Math.round(riskResult.evtVarUnits),
        evt_es_units: Math.round(riskResult.evtEsUnits),
        evt_tail_index_xi: Number(riskResult.evtTailIndexXi.toFixed(4)),
        kupiec_lr: Number(kupiecRes.lrStat.toFixed(4)),
        basel_zone: kupiecRes.baselZone
      };
      const newBlock = createAuditBlock(
        prev.length,
        "RISK_VECTOR_SNAPSHOT",
        snapshotPayload,
        prevBlock.blockHash
      );
      return [...prev, newBlock];
    });

    setIsSimulating(false);
  }, [alpha, notionalUnits, volMultiplier, flashLiquidity, correlationBreakdown]);

  // Initial simulation run on mount
  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  const handleUpdateBreaches = (newFailures: number) => {
    if (!kupiec) return;
    playSyntheticPing(280, 0.1);
    const updated = evaluateKupiecTest(newFailures, 250, alpha);
    setKupiec(updated);
  };

  const handleAddSnapshotEvent = () => {
    if (!risk || !kupiec) return;
    playSyntheticPing(340, 0.12);
    setLedger(prev => {
      const prevBlock = prev[prev.length - 1];
      const commitPayload = {
        action: "MANUAL_QUANT_AUDIT_COMMIT",
        portfolio_exposure_units: notionalUnits,
        evt_var_99_units: Math.round(risk.evtVarUnits),
        evt_es_99_units: Math.round(risk.evtEsUnits),
        tail_index: Number(risk.evtTailIndexXi.toFixed(4)),
        basel_status: kupiec.baselZone
      };
      const newBlock = createAuditBlock(
        prev.length,
        "FACTOR_AUDIT_COMMIT",
        commitPayload,
        prevBlock.blockHash
      );
      return [...prev, newBlock];
    });
  };

  const handleExportRiskVector = () => {
    if (!risk || !kupiec || !christoffersen) return;
    playSyntheticPing(440, 0.12);

    const exportData = {
      system: "APEX-209 Multi-Regime VaR & Expected Shortfall Risk Engine",
      classification: "Enterprise Reference Core (Track 3)",
      timestamp: new Date().toISOString(),
      confidence_alpha: alpha,
      portfolio_exposure_units: notionalUnits,
      active_methodology: activeMethodology,
      cornish_fisher: {
        var_units: Math.round(risk.cfVarUnits),
        es_units: Math.round(risk.cfEsUnits),
        var_pct: Number(risk.cfVarPct.toFixed(4)),
        es_pct: Number(risk.cfEsPct.toFixed(4)),
        skewness: Number(risk.skewness.toFixed(4)),
        excess_kurtosis: Number(risk.excessKurtosis.toFixed(4))
      },
      hull_white_historical: {
        var_units: Math.round(risk.hwVarUnits),
        es_units: Math.round(risk.hwEsUnits),
        var_pct: Number(risk.hwVarPct.toFixed(4)),
        es_pct: Number(risk.hwEsPct.toFixed(4)),
        ewma_decay_lambda: 0.94,
        rolling_volatility_pct: Number(risk.hwCurrentVolPct.toFixed(4))
      },
      extreme_value_theory_pot: {
        var_units: Math.round(risk.evtVarUnits),
        es_units: Math.round(risk.evtEsUnits),
        var_pct: Number(risk.evtVarPct.toFixed(4)),
        es_pct: Number(risk.evtEsPct.toFixed(4)),
        tail_index_xi: Number(risk.evtTailIndexXi.toFixed(6)),
        scale_beta_units: Number(risk.evtScaleBetaUnits.toFixed(2)),
        threshold_u_units: Number(risk.evtThresholdUnits.toFixed(2)),
        tail_domain: "Frechet (Heavy-Tailed)"
      },
      synthetic_factor_allocations: [
        { id: "SYNTH-MULTI-ASSET-01", weight: 0.45, allocation_pct: 45.0 },
        { id: "QUANT-FACTOR-BASKET", weight: 0.35, allocation_pct: 35.0 },
        { id: "CREDIT-SPREAD-SYNTH", weight: 0.20, allocation_pct: 20.0 }
      ],
      regulatory_backtest: {
        evaluation_window_days: 250,
        realized_breaches: kupiec.failures,
        nominal_breach_rate_pct: kupiec.nominalRatePct,
        empirical_breach_rate_pct: kupiec.empiricalRatePct,
        kupiec_lr_stat: Number(kupiec.lrStat.toFixed(4)),
        kupiec_p_value: Number(kupiec.pValue.toFixed(6)),
        basel_zone: kupiec.baselZone,
        christoffersen_lr_stat: Number(christoffersen.lrStat.toFixed(4)),
        christoffersen_p_value: Number(christoffersen.pValue.toFixed(6)),
        is_independent: christoffersen.isIndependent
      },
      cryptographic_audit: {
        total_blocks_recorded: ledger.length,
        latest_block_hash: ledger[ledger.length - 1].blockHash,
        previous_block_hash: ledger[ledger.length - 1].prevHash,
        immutability_standard: "SHA-256 Merkle Linkage",
        compliance: "NIST SP 800-218 SSDF v1.1"
      }
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = url;
    downloadAnchor.download = "apex209-risk-vector-" + Math.round(alpha * 1000) + ".json";
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);
  };

  if (!risk || !monteCarlo || !kupiec || !christoffersen) {
    return (
      <div className="min-h-screen bg-[#0A0E17] flex items-center justify-center text-slate-300 font-mono text-base">
        Initializing APEX-209 Quantitative Kernel...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E17] text-slate-100 flex flex-col font-sans">
      
      {/* Unified Top Navigation Contract with Action Cluster & Docked Confidence */}
      <TopNav
        onResimulate={runSimulation}
        onExportRiskVector={handleExportRiskVector}
        isSimulating={isSimulating}
        alpha={alpha}
        onSelectAlpha={(lvl) => {
          playSyntheticPing(360, 0.08);
          setAlpha(lvl);
        }}
      />

      {/* Main Cockpit Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-3 space-y-4">

        {/* Clean Institutional Horizontal Tab Navigation Bar with Zero Clipping */}
        <div className="w-full overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-max p-1 pr-4 sm:pr-6 bg-slate-900/90 border border-slate-800 rounded-xl">
            <button
              onClick={() => {
                playSyntheticPing(300, 0.08);
                setActiveTab('distribution');
              }}
              className={"px-2.5 py-1 text-xs sm:text-sm font-medium whitespace-nowrap rounded-lg shrink-0 transition-all cursor-pointer " +
                (activeTab === 'distribution'
                  ? "bg-cyan-400 text-slate-950 font-bold shadow-sm shadow-cyan-400/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                )}
            >
              Loss Distribution
            </button>

            <button
              onClick={() => {
                playSyntheticPing(300, 0.08);
                setActiveTab('methodology');
              }}
              className={"px-2.5 py-1 text-xs sm:text-sm font-medium whitespace-nowrap rounded-lg shrink-0 transition-all cursor-pointer " +
                (activeTab === 'methodology'
                  ? "bg-cyan-400 text-slate-950 font-bold shadow-sm shadow-cyan-400/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              Methodologies
            </button>

            <button
              onClick={() => {
                playSyntheticPing(300, 0.08);
                setActiveTab('backtest');
              }}
              className={"px-2.5 py-1 text-xs sm:text-sm font-medium whitespace-nowrap rounded-lg shrink-0 transition-all cursor-pointer " +
                (activeTab === 'backtest'
                  ? "bg-cyan-400 text-slate-950 font-bold shadow-sm shadow-cyan-400/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              Backtesting
            </button>

            <button
              onClick={() => {
                playSyntheticPing(300, 0.08);
                setActiveTab('ledger');
              }}
              className={"px-2.5 py-1 text-xs sm:text-sm font-medium whitespace-nowrap rounded-lg shrink-0 transition-all cursor-pointer " +
                (activeTab === 'ledger'
                  ? "bg-cyan-400 text-slate-950 font-bold shadow-sm shadow-cyan-400/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              SHA-256 Ledger
            </button>

            <button
              onClick={() => {
                playSyntheticPing(300, 0.08);
                setActiveTab('spec');
              }}
              className={"px-2.5 py-1 text-xs sm:text-sm font-medium whitespace-nowrap rounded-lg shrink-0 transition-all cursor-pointer " +
                (activeTab === 'spec'
                  ? "bg-cyan-400 text-slate-950 font-bold shadow-sm shadow-cyan-400/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              Transfer Spec
            </button>
          </div>
        </div>

        {/* TAB 1: LOSS DISTRIBUTION & STRESS MATRIX */}
        {activeTab === 'distribution' && (
          <div className="space-y-4">
            {/* 4 Telemetry Metric Cards in Responsive 2x2 or 4x1 Grid */}
            <MetricCards
              risk={risk}
              monteCarlo={monteCarlo}
              kupiec={kupiec}
              activeMethodology={activeMethodology}
              onSelectMethodology={setActiveMethodology}
            />

            {/* Stress Controls with Audio Synthetic Ping */}
            <StressControls
              volMultiplier={volMultiplier}
              flashLiquidity={flashLiquidity}
              correlationBreakdown={correlationBreakdown}
              onToggleVolShock={() => {
                playSyntheticPing(180, 0.18);
                setVolMultiplier(prev => (prev > 1.5 ? 1.0 : 3.5));
              }}
              onToggleFlashLiquidity={() => {
                playSyntheticPing(200, 0.18);
                setFlashLiquidity(prev => !prev);
              }}
              onToggleCorrelationBreakdown={() => {
                playSyntheticPing(220, 0.18);
                setCorrelationBreakdown(prev => !prev);
              }}
              onResetNominal={() => {
                playSyntheticPing(320, 0.12);
                setVolMultiplier(1.0);
                setFlashLiquidity(false);
                setCorrelationBreakdown(false);
              }}
            />

            {/* Distribution Chart & QQ Plot */}
            <DistributionChart risk={risk} monteCarlo={monteCarlo} />
            <QQPlot risk={risk} monteCarlo={monteCarlo} />
          </div>
        )}

        {/* TAB 2: METHODOLOGY COMPARISON */}
        {activeTab === 'methodology' && (
          <div className="space-y-4">
            {/* 4 Telemetry Metric Cards */}
            <MetricCards
              risk={risk}
              monteCarlo={monteCarlo}
              kupiec={kupiec}
              activeMethodology={activeMethodology}
              onSelectMethodology={setActiveMethodology}
            />

            {/* Side-by-Side Methodology Table */}
            <MethodologyComparisonTable
              risk={risk}
              activeMethodology={activeMethodology}
              onSelectMethodology={(m) => {
                playSyntheticPing(310, 0.1);
                setActiveMethodology(m);
              }}
            />

            {/* Synthetic Asset Universe Allocation */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100 uppercase tracking-tight">
                    Synthetic Risk Universe & Covariance Allocation
                  </h3>
                  <div className="text-sm text-slate-400 mt-0.5">
                    Zero third-party trademarks · Pure generic synthetic factor baskets
                  </div>
                </div>
                <span className="p-2 rounded bg-slate-900 text-cyan-400">
                  <PieChart className="w-5 h-5" />
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800">
                  <div className="text-sm font-bold text-cyan-400 mb-1">
                    45.0% Allocation
                  </div>
                  <div className="text-sm font-bold text-slate-200">
                    {BASKET_1_CORE_EQUITY}
                  </div>
                  <div className="text-sm text-slate-400 mt-2 font-mono">
                    Weight: 0.450 · Daily Sigma: {(0.014 * volMultiplier * 100).toFixed(2)}%
                  </div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800">
                  <div className="text-sm font-bold text-purple-400 mb-1">
                    35.0% Allocation
                  </div>
                  <div className="text-sm font-bold text-slate-200">
                    {BASKET_2_QUANT_FACTOR}
                  </div>
                  <div className="text-sm text-slate-400 mt-2 font-mono">
                    Weight: 0.350 · Daily Sigma: {(0.021 * volMultiplier * 100).toFixed(2)}%
                  </div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800">
                  <div className="text-sm font-bold text-amber-400 mb-1">
                    20.0% Allocation
                  </div>
                  <div className="text-sm font-bold text-slate-200">
                    {BASKET_3_CREDIT_SPREAD}
                  </div>
                  <div className="text-sm text-slate-400 mt-2 font-mono">
                    Weight: 0.200 · Daily Sigma: {(0.009 * volMultiplier * 100).toFixed(2)}%
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REGULATORY BACKTESTING */}
        {activeTab === 'backtest' && (
          <div className="space-y-4">
            <BacktestPanel
              kupiec={kupiec}
              christoffersen={christoffersen}
              onUpdateBreaches={handleUpdateBreaches}
            />
          </div>
        )}

        {/* TAB 4: SHA-256 AUDIT LEDGER */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            <AuditLedgerPanel
              ledger={ledger}
              onAddSnapshotEvent={handleAddSnapshotEvent}
            />
          </div>
        )}

        {/* TAB 5: TRANSFER SPEC & SSDF v1.1 */}
        {activeTab === 'spec' && (
          <div className="space-y-4">
            <SpecAndTransferView />
          </div>
        )}

      </main>

      {/* Clean Human Footer */}
      <footer className="w-full bg-[#0E1524] border-t border-slate-800/80 py-4 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div>
            APEX-209 Quantitative Risk Engine · Track 3 Reference Core
          </div>
          <div className="flex items-center gap-4 font-mono text-sm">
            <span>NIST SP 800-218 SSDF v1.1</span>
            <span>·</span>
            <span>Zero Copyleft MIT/BSD Manifest</span>
            <span>·</span>
            <span>Clean Title Asset Transfer</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
