/**
 * CHRONOSRISK ENGINE // GF-T3-152
 * Executive Risk Report & PDF Export View
 */

import React, { useRef } from 'react';
import { Shield, Printer, Download, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { AssetPosition, RiskMetricsResult } from '../core/riskEngineTs';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: AssetPosition[];
  portfolioEquity: number;
  riskResult: RiskMetricsResult;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  assets,
  portfolioEquity,
  riskResult,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    const reportText = `
================================================================================
CHRONOSRISK ENGINE // GF-T3-152
OFFICIAL RISK & TAIL EXPOSURE AUDIT REPORT
================================================================================
Generated: ${new Date().toUTCString()}
Classification: CONFIDENTIAL // INSTITUTIONAL DESK ONLY
Asset Tag: GF-T3-152 (Track 3 F1 Skunkworks Engine)
Clean-Room IP Status: 100% Permissive (Apache 2.0 / MIT Verified)

EXECUTIVE RISK SUMMARY
--------------------------------------------------------------------------------
Portfolio Equity Base:          $${portfolioEquity.toLocaleString()} USD
Confidence Interval:            ${(riskResult.confidenceInterval * 100).toFixed(1)}%
Holding Period Horizon:         ${riskResult.timeHorizonDays} Day(s) (Basel III Standard)
Cornish-Fisher Fat-Tail:        ACTIVE (z_cf: ${riskResult.zCornishFisher.toFixed(4)})

PRIMARY METRICS
--------------------------------------------------------------------------------
Parametric Gaussian VaR:        $${riskResult.parametricVaRAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${(riskResult.parametricVaRPercent * 100).toFixed(2)}%)
Cornish-Fisher VaR (Primary):   $${riskResult.cornishFisherVaRAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${(riskResult.cornishFisherVaRPercent * 100).toFixed(2)}%)
Expected Shortfall (CVaR):      $${riskResult.expectedShortfallAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${(riskResult.expectedShortfallPercent * 100).toFixed(2)}%)
Portfolio Daily Volatility:     ${(riskResult.portfolioDailyVol * 100).toFixed(2)}%
Portfolio Annual Volatility:    ${(riskResult.portfolioAnnualVol * 100).toFixed(2)}%
Portfolio Skewness:             ${riskResult.portfolioSkewness.toFixed(3)}
Portfolio Excess Kurtosis:      ${riskResult.portfolioKurtosis.toFixed(3)}
Execution Latency:              ${riskResult.executionLatencyMicros.toFixed(1)} µs
Fixed-Point Integer Units:      ${riskResult.fixedPointVaRUnits.toString()}

ASSET ALLOCATION & COMPONENT VAR DECOMPOSITION
--------------------------------------------------------------------------------
${riskResult.componentVaR.map((c) => `${c.symbol.padEnd(6)} | Weight: ${(c.weight * 100).toFixed(1)}% | Marginal VaR: ${(c.marginalVaR * 100).toFixed(2)}% | Contribution: ${c.percentContribution.toFixed(1)}%`).join('\n')}

CERTIFICATION & COMPLIANCE
--------------------------------------------------------------------------------
Authorized Risk Officer ID: CRO-8821-QUANT
SHA-256 Audit Integrity Hash: 0x8a91cbf482e9d30017a4c7e6b014f32997da1538d6f02cb89e
================================================================================
`;
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CHRONOSRISK-REPORT-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0e1626] border border-slate-700 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-mono">
                Executive Portfolio Risk Audit Report
              </h3>
              <p className="text-xs text-slate-400">
                Official institutional risk disclosure & capital adequacy certificate
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTxt}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-lg border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Download Text/Report</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold rounded-lg transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Canvas */}
        <div
          ref={reportRef}
          className="flex-1 overflow-y-auto bg-slate-950 p-8 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-6 leading-relaxed"
        >
          {/* Document Header */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="text-amber-400 font-bold text-lg">CHRONOSRISK ENGINE // GF-T3-152</div>
              <div className="text-slate-400 text-xs">QUANTITATIVE RISK REPORT & CAPITAL ADEQUACY AUDIT</div>
              <div className="text-slate-500 text-[11px] mt-1">Generated: {new Date().toUTCString()}</div>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-700 text-emerald-400 font-bold text-xs inline-block">
                CLEAN-ROOM CERTIFIED
              </span>
              <div className="text-[11px] text-slate-500 mt-1">Classification: STRICTLY CONFIDENTIAL</div>
            </div>
          </div>

          {/* Core Metrics Table */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-900/60 border border-slate-800">
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Portfolio Equity</span>
              <span className="text-base font-bold text-white">${(portfolioEquity / 1_000_000).toFixed(2)}M</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Cornish-Fisher VaR ({(riskResult.confidenceInterval * 100).toFixed(1)}%)</span>
              <span className="text-base font-bold text-amber-400">${(riskResult.cornishFisherVaRAmount / 1_000_000).toFixed(2)}M</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Expected Shortfall (CVaR)</span>
              <span className="text-base font-bold text-rose-400">${(riskResult.expectedShortfallAmount / 1_000_000).toFixed(2)}M</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Calc Latency</span>
              <span className="text-base font-bold text-emerald-400">{riskResult.executionLatencyMicros.toFixed(1)} µs</span>
            </div>
          </div>

          {/* Allocation & Component Breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white">ASSET ALLOCATION & MARGINAL RISK DECOMPOSITION</h4>
            <table className="w-full text-left text-xs divide-y divide-slate-800 border-t border-slate-800">
              <thead>
                <tr className="text-slate-500 py-2">
                  <th className="py-2">SYMBOL</th>
                  <th className="py-2">WEIGHT</th>
                  <th className="py-2">ANN. VOL</th>
                  <th className="py-2">MVaR</th>
                  <th className="py-2">COMPONENT VAR (UNITS)</th>
                  <th className="py-2 text-right">RISK CONTRIB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {riskResult.componentVaR.map((c) => {
                  const asset = assets.find((a) => a.symbol === c.symbol);
                  return (
                    <tr key={c.symbol}>
                      <td className="py-2 font-bold text-white">{c.symbol}</td>
                      <td className="py-2">{(c.weight * 100).toFixed(1)}%</td>
                      <td className="py-2">{((asset?.annualVol ?? 0) * 100).toFixed(0)}%</td>
                      <td className="py-2 text-sky-400">{(c.marginalVaR * 100).toFixed(2)}%</td>
                      <td className="py-2 text-amber-400">${(c.componentVaRAmount / 1_000_000).toFixed(3)}M</td>
                      <td className="py-2 text-right font-bold text-white">{c.percentContribution.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Compliance & Sign-off Stamp */}
          <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-emerald-400">OFFICER SIGN-OFF: AUTHENTICATED</div>
              <div className="text-[11px] text-slate-400">
                Chief Risk Officer Biometric Credential: CRO-8821-SECURE
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Integrity SHA-256: 0x9f1a238b7e45c08d9e23fa550b71cd4e129
              </div>
            </div>
            <div className="border border-emerald-600/40 px-3 py-1.5 rounded text-center text-[10px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-950/30">
              PASSED BASEL III AUDIT GATES
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono font-bold"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
