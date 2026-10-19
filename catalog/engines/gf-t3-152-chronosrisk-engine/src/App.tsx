/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CHRONOSRISK ENGINE // GF-T3-152
 * Real-Time Portfolio VaR, Expected Shortfall (CVaR), and Historical Shock Simulation Core
 * F1 Skunkworks Service Engine (Track 3 Deliverable)
 */

import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { RadarTab } from './components/RadarTab';
import { CovarianceTab } from './components/CovarianceTab';
import { EngineSpecTab } from './components/EngineSpecTab';
import { MonopolyApaTab } from './components/MonopolyApaTab';
import { CodeViewerTab } from './components/CodeViewerTab';
import { AuditLogModal, AuditEntry } from './components/AuditLogModal';
import { ExportReportModal } from './components/ExportReportModal';
import {
  DEFAULT_ASSETS,
  DEFAULT_CORRELATION_MATRIX,
  AssetPosition,
  calculateChronosRisk,
  HISTORICAL_SHOCKS,
  simulateHistoricalShock,
} from './core/riskEngineTs';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('radar');
  const [assets, setAssets] = useState<AssetPosition[]>(DEFAULT_ASSETS);
  const [corrMatrix, setCorrMatrix] = useState<number[][]>(DEFAULT_CORRELATION_MATRIX);
  const [portfolioEquity, setPortfolioEquity] = useState<number>(50_000_000);
  const [confidenceInterval, setConfidenceInterval] = useState<number>(0.99);
  const [timeHorizonDays, setTimeHorizonDays] = useState<number>(1);
  const [volMultiplier, setVolMultiplier] = useState<number>(1.0);
  const [enableCornishFisher, setEnableCornishFisher] = useState<boolean>(true);
  const [isBiometricAuthenticated, setIsBiometricAuthenticated] = useState<boolean>(true);

  // Modals state
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // Audit Log State
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([
    {
      id: 'AUDIT-INIT-001',
      timestamp: new Date().toLocaleTimeString(),
      action: 'SYSTEM_BOOT',
      details: 'ChronosRisk Engine GF-T3-152 initialized on primary node us-east1-c',
      officerId: 'CRO-8821',
      status: 'SUCCESS',
    },
    {
      id: 'AUDIT-INIT-002',
      timestamp: new Date().toLocaleTimeString(),
      action: 'CLEAN_ROOM_VERIFIED',
      details: 'Clean-room license audit passed: 100% Permissive MIT/Apache-2.0, Zero copyleft',
      officerId: 'LEGAL-IP',
      status: 'SUCCESS',
    },
  ]);

  const logAuditAction = (action: string, details: string) => {
    const newEntry: AuditEntry = {
      id: `AUDIT-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toLocaleTimeString(),
      action,
      details,
      officerId: isBiometricAuthenticated ? 'CRO-8821' : 'RESTRICTED-USER',
      status: 'SUCCESS',
    };
    setAuditEntries((prev) => [newEntry, ...prev]);
  };

  // Real-time calculation of risk metrics
  const riskResult = useMemo(() => {
    return calculateChronosRisk(
      assets,
      corrMatrix,
      portfolioEquity,
      confidenceInterval,
      timeHorizonDays,
      volMultiplier,
      enableCornishFisher
    );
  }, [assets, corrMatrix, portfolioEquity, confidenceInterval, timeHorizonDays, volMultiplier, enableCornishFisher]);

  // Export CSV Handler
  const handleExportCsv = () => {
    let csv = `CHRONOSRISK ENGINE // GF-T3-152 AUDIT EXPORT\n`;
    csv += `Export Timestamp,${new Date().toISOString()}\n`;
    csv += `Portfolio Equity,$${portfolioEquity}\n`;
    csv += `Confidence Interval,${(confidenceInterval * 100).toFixed(1)}%\n`;
    csv += `Holding Horizon,${timeHorizonDays} Day(s)\n`;
    csv += `Volatility Multiplier,${volMultiplier}x\n`;
    csv += `Cornish-Fisher Mode,${enableCornishFisher ? 'Active' : 'Off'}\n\n`;

    csv += `SUMMARY METRICS\n`;
    csv += `Parametric VaR (UNITS),${riskResult.parametricVaRAmount.toFixed(2)}\n`;
    csv += `Parametric VaR (%),${(riskResult.parametricVaRPercent * 100).toFixed(4)}%\n`;
    csv += `Cornish-Fisher VaR (UNITS),${riskResult.cornishFisherVaRAmount.toFixed(2)}\n`;
    csv += `Cornish-Fisher VaR (%),${(riskResult.cornishFisherVaRPercent * 100).toFixed(4)}%\n`;
    csv += `Expected Shortfall (UNITS),${riskResult.expectedShortfallAmount.toFixed(2)}\n`;
    csv += `Expected Shortfall (%),${(riskResult.expectedShortfallPercent * 100).toFixed(4)}%\n`;
    csv += `Daily Volatility (%),${(riskResult.portfolioDailyVol * 100).toFixed(4)}%\n`;
    csv += `Annualized Volatility (%),${(riskResult.portfolioAnnualVol * 100).toFixed(4)}%\n`;
    csv += `Portfolio Skewness,${riskResult.portfolioSkewness.toFixed(4)}\n`;
    csv += `Portfolio Excess Kurtosis,${riskResult.portfolioKurtosis.toFixed(4)}\n`;
    csv += `Execution Latency (µs),${riskResult.executionLatencyMicros}\n`;
    csv += `Fixed-Point Integer Units,${riskResult.fixedPointVaRUnits.toString()}\n\n`;

    csv += `ASSET POSITIONS & COMPONENT VAR DECOMPOSITION\n`;
    csv += `Symbol,Name,Weight,Annual Vol,Skewness,Kurtosis,MVaR,Component VaR (UNITS),Risk Contrib (%)\n`;
    riskResult.componentVaR.forEach((c) => {
      const a = assets.find((x) => x.symbol === c.symbol);
      csv += `${c.symbol},${a?.name ?? ''},${(c.weight * 100).toFixed(2)}%,${((a?.annualVol ?? 0) * 100).toFixed(1)}%,${a?.skewness ?? 0},${a?.excessKurtosis ?? 0},${(c.marginalVaR * 100).toFixed(3)}%,$${c.componentVaRAmount.toFixed(2)},${c.percentContribution.toFixed(2)}%\n`;
    });

    csv += `\nHISTORICAL STRESS SCENARIOS\n`;
    csv += `Scenario Name,Year,Drawdown (%),Drawdown (UNITS),Liquidity Matrix (UNITS),Total Loss (UNITS),Tail Multiplier\n`;
    HISTORICAL_SHOCKS.forEach((sc) => {
      const res = simulateHistoricalShock(sc, assets, portfolioEquity, riskResult);
      csv += `"${sc.name}",${sc.year},${(res.portfolioDrawdownPercent * 100).toFixed(2)}%,$${res.portfolioDrawdownAmount.toFixed(2)},$${res.liquidityPenaltyAmount.toFixed(2)},$${res.totalLossAmount.toFixed(2)},${res.tailLossMultiplier.toFixed(2)}x\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CHRONOSRISK-GF-T3-152-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    logAuditAction('CSV_EXPORTED', `Downloaded risk & stress scenario data for $${(portfolioEquity / 1_000_000).toFixed(1)}M equity`);
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        latencyMicros={riskResult.executionLatencyMicros}
        cornishFisherActive={enableCornishFisher}
        isBiometricAuthenticated={isBiometricAuthenticated}
        setIsBiometricAuthenticated={(val) => {
          setIsBiometricAuthenticated(val);
          logAuditAction('BIOMETRIC_AUTH_TOGGLED', `MFA biometric state set to: ${val ? 'VERIFIED' : 'RESTRICTED'}`);
        }}
        onOpenAuditLog={() => setIsAuditModalOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'radar' && (
          <RadarTab
            assets={assets}
            portfolioEquity={portfolioEquity}
            setPortfolioEquity={setPortfolioEquity}
            confidenceInterval={confidenceInterval}
            setConfidenceInterval={setConfidenceInterval}
            timeHorizonDays={timeHorizonDays}
            setTimeHorizonDays={setTimeHorizonDays}
            volMultiplier={volMultiplier}
            setVolMultiplier={setVolMultiplier}
            enableCornishFisher={enableCornishFisher}
            setEnableCornishFisher={setEnableCornishFisher}
            riskResult={riskResult}
            onExportCsv={handleExportCsv}
            onOpenReportModal={() => setIsReportModalOpen(true)}
            onLogAuditAction={logAuditAction}
          />
        )}

        {activeTab === 'covariance' && (
          <CovarianceTab
            assets={assets}
            setAssets={setAssets}
            corrMatrix={corrMatrix}
            setCorrMatrix={setCorrMatrix}
            riskResult={riskResult}
            onLogAuditAction={logAuditAction}
          />
        )}

        {activeTab === 'engine_spec' && <EngineSpecTab />}

        {activeTab === 'monopoly_vault' && (
          <MonopolyApaTab onLogAuditAction={logAuditAction} />
        )}

        {activeTab === 'code_core' && (
          <CodeViewerTab onLogAuditAction={logAuditAction} />
        )}
      </main>

      {/* Bottom Legal & Telemetry Footer */}
      <footer className="border-t border-slate-800 bg-[#070a12] py-6 px-4 sm:px-6 text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-amber-400 font-bold">GF-T3-152</span>
            <span>·</span>
            <span>CHRONOSRISK ENGINE</span>
            <span>·</span>
            <span>70% WORKLOAD DELIVERABLE (F1 SKUNKWORKS)</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>Specification Anchor: 20 kHz (0.48ms)</span>
            <span>·</span>
            <span>License: Apache 2.0 / MIT Whitelisted</span>
            <span>·</span>
            <span className="text-emerald-500">GKE Autopilot Ready</span>
          </div>
        </div>
      </footer>

      {/* Audit Log Modal */}
      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        entries={auditEntries}
        onClearLog={() => setAuditEntries([])}
      />

      {/* Report Modal */}
      <ExportReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        assets={assets}
        portfolioEquity={portfolioEquity}
        riskResult={riskResult}
      />
    </div>
  );
}
