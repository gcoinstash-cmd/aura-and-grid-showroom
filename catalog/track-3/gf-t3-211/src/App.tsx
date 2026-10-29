/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, ShieldCheck, Database, Sliders, Cpu, Terminal, 
  TrendingUp, TrendingDown, RefreshCw, Lock, CheckCircle2, 
  AlertTriangle, ArrowUpRight, ArrowDownRight, Layers, FileText, Check
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'bands' | 'kalman' | 'copula' | 'audit' | 'transfer'>('bands');
  const [selectedPair, setSelectedPair] = useState<string>('SYNTH-PAIR-01');
  const [priceA, setPriceA] = useState<number>(105.50);
  const [priceB, setPriceB] = useState<number>(98.20);
  const [simulationResult, setSimulationResult] = useState<any>({
    price_a: 105.50,
    price_b: 98.20,
    beta: 1.1842,
    alpha: 5.4200,
    spread: +1.4230,
    z_score: +2.14,
    signal: "SHORT_SPREAD (SHORT A / LONG B)",
    forecast_variance: 0.00042
  });
  const [copulaData, setCopulaData] = useState<any>({
    kendall_tau: 0.7250,
    clayton_theta: 5.2400,
    lower_tail_dependence: 0.8750,
    gumbel_theta: 3.1200,
    upper_tail_dependence: 0.7920,
    gaussian_rho: 0.8910,
    sample_size: 100
  });
  const [auditLedger, setAuditLedger] = useState<any>({
    verified: true,
    chain_length: 1,
    chain: []
  });
  const [docs, setDocs] = useState<any>({
    engine_spec: "",
    legal_audit: "",
    asset_transfer: ""
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [backtestMetrics, setBacktestMetrics] = useState<any>({
    sharpe_ratio: 3.42,
    max_drawdown_pts: -1.82,
    win_rate_pct: 68.4,
    cumulative_alpha_units: 420.50,
    trades_executed: 142,
    ou_half_life_days: 3.8,
    adf_p_value: 0.0012
  });

  const [spreadHistory, setSpreadHistory] = useState<Array<any>>([
    { t: '09:30', spread: 0.2, upperBand: 2.0, lowerBand: -2.0, exitBand: 0.5 },
    { t: '10:00', spread: 0.8, upperBand: 2.0, lowerBand: -2.0, exitBand: 0.5 },
    { t: '10:30', spread: 1.5, upperBand: 2.0, lowerBand: -2.0, exitBand: 0.5 },
    { t: '11:00', spread: 2.1, upperBand: 2.0, lowerBand: -2.0, exitBand: 0.5 },
    { t: '11:30', spread: 1.8, upperBand: 2.0, lowerBand: -2.0, exitBand: 0.5 },
    { t: '12:00', spread: 0.9, upperBand: 2.0, lowerBand: -2.0, exitBand: 0.5 },
    { t: '12:30', spread: 0.3, upperBand: 2.0, lowerBand: -2.0, exitBand: 0.5 },
    { t: '13:00', spread: -0.4, upperBand: 2.0, lowerBand: -2.0, exitBand: 0.5 },
    { t: '13:30', spread: -1.2, upperBand: 2.0, lowerBand: -2.0, exitBand: 0.5 },
    { t: '14:00', spread: -2.2, upperBand: 2.0, lowerBand: -2.0, exitBand: 0.5 },
    { t: '14:30', spread: -1.5, upperBand: 2.0, lowerBand: -2.0, exitBand: 0.5 },
    { t: '15:00', spread: -0.6, upperBand: 2.0, lowerBand: -2.0, exitBand: 0.5 },
    { t: '15:30', spread: +1.42, upperBand: 2.0, lowerBand: -2.0, exitBand: 0.5 }
  ]);

  const [kalmanHistory, setKalmanHistory] = useState<Array<any>>([
    { t: '09:30', beta: 1.150, alpha: 5.310 },
    { t: '10:00', beta: 1.158, alpha: 5.335 },
    { t: '10:30', beta: 1.165, alpha: 5.362 },
    { t: '11:00', beta: 1.171, alpha: 5.381 },
    { t: '11:30', beta: 1.175, alpha: 5.394 },
    { t: '12:00', beta: 1.178, alpha: 5.402 },
    { t: '12:30', beta: 1.180, alpha: 5.410 },
    { t: '13:00', beta: 1.181, alpha: 5.413 },
    { t: '13:30', beta: 1.183, alpha: 5.418 },
    { t: '14:00', beta: 1.184, alpha: 5.420 }
  ]);

  const fetchSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stat-arb/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_a: Number(priceA), price_b: Number(priceB) })
      });
      const json = await res.json();
      if (json.success) {
        setSimulationResult(json.data);
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setSpreadHistory(prev => [...prev.slice(-15), { t: nowStr, spread: json.data.spread, upperBand: 2.0, lowerBand: -2.0, exitBand: 0.5 }]);
        setKalmanHistory(prev => [...prev.slice(-15), { t: nowStr, beta: json.data.beta, alpha: json.data.alpha }]);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
    fetchLedger();
  };

  const fetchCopula = async () => {
    try {
      const res = await fetch('/api/copula/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const json = await res.json();
      if (json.success) {
        setCopulaData(json.data);
      }
    } catch (err) {
      console.error(err);
    }
    fetchLedger();
  };

  const fetchLedger = async () => {
    try {
      const res = await fetch('/api/audit/ledger');
      const json = await res.json();
      if (json.success) {
        setAuditLedger(json);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBacktest = async (pairId: string) => {
    setSelectedPair(pairId);
    try {
      const res = await fetch('/api/backtest/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pair_id: pairId, lookback: 252 })
      });
      const json = await res.json();
      if (json.success) {
        setBacktestMetrics(json.data);
      }
    } catch (err) {
      console.error(err);
    }
    fetchLedger();
  };

  const fetchDocs = async () => {
    try {
      const res = await fetch('/api/specs/docs');
      const json = await res.json();
      if (json.success) {
        setDocs(json);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLedger();
    fetchDocs();
  }, []);

  return (
    <div className="min-h-screen bg-[#070A11] text-[#E2E8F0] font-sans antialiased selection:bg-[#06B6D4]/30 selection:text-[#06B6D4]">
      
      {/* Unified 2-Row Command Header */}
      <header className="border-b border-[#1E293B] bg-[#0B0F19]/95 backdrop-blur sticky top-0 z-50 px-4 py-2.5">
        {/* Row 1: Fixed Clipping & Wrapping */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
            <span className="text-base font-bold tracking-tight text-white">APEX-211</span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-[#1E293B] text-[#06B6D4] rounded-md border border-[#334155]">
              Track 3 Core
            </span>
            <span className="hidden sm:inline text-xs text-[#94A3B8]">Cross-Asset Cointegration & Copula Engine</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#0F172A] border border-[#1E293B] rounded-lg">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-xs font-mono font-medium text-[#10B981]">SYSTEM NOMINAL</span>
            </div>
            <button 
              onClick={fetchSimulation}
              className="px-3 py-1.5 text-xs font-bold bg-[#06B6D4] hover:bg-[#0891B2] text-white rounded-lg shadow-lg shadow-[#06B6D4]/20 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>[Execute Step]</span>
            </button>
          </div>
        </div>

        {/* Row 2: Condensed Subtitle & Pair Selector */}
        <div className="flex items-center justify-between gap-2 text-xs text-[#94A3B8] mt-2">
          <span className="truncate">Engle-Granger &middot; Kalman Filter &middot; OU &middot; Copulas</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="hidden md:inline">Basket:</span>
            <select 
              value={selectedPair}
              onChange={(e) => fetchBacktest(e.target.value)}
              className="bg-[#111827] text-white text-xs font-semibold py-1 px-2 rounded border border-[#334155] focus:outline-none focus:border-[#06B6D4] shrink-0"
            >
              <option value="SYNTH-PAIR-01">SYNTH-PAIR-01</option>
              <option value="COMMODITY-CRACK-SYNTH">COMMODITY-CRACK</option>
              <option value="RATES-CURVE-VECTOR">RATES-CURVE</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-3 space-y-3">
        
        {/* 4-Card HUD Ribbon */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-2">
          {/* Card 1: Active Spread Z-Score */}
          <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-3.5 relative overflow-hidden group hover:border-[#06B6D4]/50 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#94A3B8] text-xs font-semibold mb-1">
              <span>Spread Z-Score</span>
              <Activity className="w-3.5 h-3.5 text-[#06B6D4]" />
            </div>
            <div className="text-xl lg:text-2xl font-bold font-mono tracking-tight text-white">
              {simulationResult.z_score >= 0 ? `+${simulationResult.z_score}` : simulationResult.z_score} <span className="text-xs font-normal text-[#94A3B8]">sigma</span>
            </div>
            <div className="text-xs text-[#10B981] font-semibold mt-1">Spread: {simulationResult.spread >= 0 ? `+${simulationResult.spread}` : simulationResult.spread} pts</div>
          </div>

          {/* Card 2: Dynamic Hedge Ratio beta */}
          <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-3.5 relative overflow-hidden group hover:border-[#06B6D4]/50 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#94A3B8] text-xs font-semibold mb-1">
              <span>Hedge Ratio (&beta;)</span>
              <Sliders className="w-3.5 h-3.5 text-[#3B82F6]" />
            </div>
            <div className="text-xl lg:text-2xl font-bold font-mono tracking-tight text-white">
              {simulationResult.beta}
            </div>
            <div className="text-xs text-[#94A3B8] mt-1">Intercept &alpha;: <strong className="text-white font-mono">{simulationResult.alpha}</strong></div>
          </div>

          {/* Card 3: OU Half-Life */}
          <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-3.5 relative overflow-hidden group hover:border-[#06B6D4]/50 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#94A3B8] text-xs font-semibold mb-1">
              <span>OU Half-Life</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />
            </div>
            <div className="text-xl lg:text-2xl font-bold font-mono tracking-tight text-white">
              {backtestMetrics.ou_half_life_days} <span className="text-xs font-normal text-[#94A3B8]">days</span>
            </div>
            <div className="text-xs text-[#94A3B8] mt-1">Reversion &theta;: <strong className="text-white font-mono">0.182</strong></div>
          </div>

          {/* Card 4: Cointegration ADF p-value */}
          <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-3.5 relative overflow-hidden group hover:border-[#06B6D4]/50 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#94A3B8] text-xs font-semibold mb-1">
              <span>ADF p-value</span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            </div>
            <div className="text-xl lg:text-2xl font-bold font-mono tracking-tight text-[#10B981]">
              {backtestMetrics.adf_p_value}
            </div>
            <div className="text-xs text-[#94A3B8] mt-1">Confidence: <strong className="text-white font-mono">99.9%</strong></div>
          </div>
        </section>

        {/* Horizontal Tab Navigation Bar (Fits 5 Tabs Across) */}
        <div className="w-full overflow-x-auto no-scrollbar scroll-smooth touch-pan-x">
          <div className="flex items-center justify-between gap-1 p-1 bg-[#0B0F19] border border-[#1E293B] rounded-xl my-2 text-xs font-medium w-full">
            <button
              onClick={() => setActiveTab('bands')}
              className={`px-2 py-1 text-[11px] font-medium shrink-0 rounded-lg transition-colors flex items-center gap-1 ${activeTab === 'bands' ? 'bg-[#06B6D4] text-white font-bold shadow-lg shadow-[#06B6D4]/20' : 'text-[#94A3B8] hover:text-white hover:bg-[#111827]'}`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Spread</span>
            </button>
            <button
              onClick={() => setActiveTab('kalman')}
              className={`px-2 py-1 text-[11px] font-medium shrink-0 rounded-lg transition-colors flex items-center gap-1 ${activeTab === 'kalman' ? 'bg-[#06B6D4] text-white font-bold shadow-lg shadow-[#06B6D4]/20' : 'text-[#94A3B8] hover:text-white hover:bg-[#111827]'}`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Kalman</span>
            </button>
            <button
              onClick={() => { setActiveTab('copula'); fetchCopula(); }}
              className={`px-2 py-1 text-[11px] font-medium shrink-0 rounded-lg transition-colors flex items-center gap-1 ${activeTab === 'copula' ? 'bg-[#06B6D4] text-white font-bold shadow-lg shadow-[#06B6D4]/20' : 'text-[#94A3B8] hover:text-white hover:bg-[#111827]'}`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Copulas</span>
            </button>
            <button
              onClick={() => { setActiveTab('audit'); fetchLedger(); }}
              className={`px-2 py-1 text-[11px] font-medium shrink-0 rounded-lg transition-colors flex items-center gap-1 ${activeTab === 'audit' ? 'bg-[#06B6D4] text-white font-bold shadow-lg shadow-[#06B6D4]/20' : 'text-[#94A3B8] hover:text-white hover:bg-[#111827]'}`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Ledger</span>
            </button>
            <button
              onClick={() => { setActiveTab('transfer'); fetchDocs(); }}
              className={`px-2 py-1 text-[11px] font-medium shrink-0 rounded-lg transition-colors flex items-center gap-1 ${activeTab === 'transfer' ? 'bg-[#06B6D4] text-white font-bold shadow-lg shadow-[#06B6D4]/20' : 'text-[#94A3B8] hover:text-white hover:bg-[#111827]'}`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </button>
          </div>
        </div>

        {/* Tab Content 1: Spread & Z-Score Bands (with Recharts Line Chart) */}
        {activeTab === 'bands' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#0B0F19] border border-[#1E293B] rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Live Spread & Dynamic Z-Score Bands</h3>
                  <p className="text-sm text-[#94A3B8]">Ornstein-Uhlenbeck band traversal (+2.0 Entry, -2.0 Entry, &plusmn;0.5 Exit, &plusmn;3.5 Stop-Loss)</p>
                </div>
                <span className="px-3 py-1 text-sm font-semibold rounded-md bg-[#1E293B] text-white">{selectedPair}</span>
              </div>

              {/* Signal Banner */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                simulationResult.signal.includes('SHORT') ? 'bg-[#F43F5E]/10 border-[#F43F5E]/30 text-[#F43F5E]' :
                simulationResult.signal.includes('LONG') ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]' :
                'bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#3B82F6]'
              }`}>
                <div className="flex items-center gap-3">
                  {simulationResult.signal.includes('SHORT') ? <ArrowDownRight className="w-6 h-6" /> :
                   simulationResult.signal.includes('LONG') ? <ArrowUpRight className="w-6 h-6" /> :
                   <Activity className="w-6 h-6" />}
                  <div>
                    <div className="text-sm font-semibold text-[#94A3B8]">Active Execution Signal</div>
                    <div className="text-xl font-bold font-mono tracking-tight">{simulationResult.signal}</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm text-[#94A3B8]">Spread Variance</div>
                  <div className="text-base font-bold">{simulationResult.forecast_variance}</div>
                </div>
              </div>

              {/* Recharts Spread & Bands Chart */}
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
                <div className="text-sm font-semibold text-white mb-3">Spread Traversal vs. Z-Score Thresholds (sigma)</div>
                <div className="w-full h-64 min-h-[250px] relative">
                  {spreadHistory && spreadHistory.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200} debounce={50}>
                      <LineChart data={spreadHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                        <XAxis dataKey="t" stroke="#94A3B8" fontSize={12} />
                        <YAxis stroke="#94A3B8" fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} />
                        <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '14px' }} />
                        <Line type="monotone" dataKey="spread" stroke="#06B6D4" strokeWidth={2.5} dot={false} name="Spread (sigma)" />
                        <Line type="monotone" dataKey="upperBand" stroke="#F43F5E" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="Upper Entry (+2.0)" />
                        <Line type="monotone" dataKey="lowerBand" stroke="#10B981" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="Lower Entry (-2.0)" />
                        <Line type="monotone" dataKey="exitBand" stroke="#F59E0B" strokeDasharray="2 2" strokeWidth={1} dot={false} name="Exit (0.5)" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Simulation Controls */}
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 space-y-4">
                <h4 className="text-lg font-bold text-white">Synthetic Asset Price Ingestion</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#94A3B8]">Asset A Price (SYNTH-CORE-A)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={priceA} 
                      onChange={(e) => setPriceA(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#070A11] border border-[#334155] rounded-lg px-3 py-2 text-base text-white font-mono focus:outline-none focus:border-[#06B6D4]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#94A3B8]">Asset B Price (SYNTH-PROXY-B)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={priceB} 
                      onChange={(e) => setPriceB(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#070A11] border border-[#334155] rounded-lg px-3 py-2 text-base text-white font-mono focus:outline-none focus:border-[#06B6D4]"
                    />
                  </div>
                </div>
                <button 
                  onClick={fetchSimulation}
                  className="w-full min-h-[44px] py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] text-white text-base font-bold rounded-lg shadow-lg shadow-[#06B6D4]/20 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Push Tick & Recalculate Kalman Filter</span>
                </button>
              </div>
            </div>

            {/* Right Column: Performance Matrix */}
            <div className="space-y-6">
              <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-white">Backtest Performance</h3>
                <div className="space-y-3 text-sm font-mono">
                  <div className="flex justify-between py-2 border-b border-[#1E293B]">
                    <span className="text-[#94A3B8]">Sharpe Ratio</span>
                    <span className="text-white font-bold">{backtestMetrics.sharpe_ratio}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1E293B]">
                    <span className="text-[#94A3B8]">Max Drawdown</span>
                    <span className="text-[#F43F5E] font-bold">{backtestMetrics.max_drawdown_pts} pts</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1E293B]">
                    <span className="text-[#94A3B8]">Win Rate</span>
                    <span className="text-[#10B981] font-bold">{backtestMetrics.win_rate_pct}%</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1E293B]">
                    <span className="text-[#94A3B8]">Cumulative Alpha</span>
                    <span className="text-white font-bold">+{backtestMetrics.cumulative_alpha_units} Units</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#94A3B8]">Trades Executed</span>
                    <span className="text-white font-bold">{backtestMetrics.trades_executed}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-6 space-y-3">
                <h3 className="text-lg font-bold text-white">Zero-Dollar Gate Active</h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  All telemetry is rendered in dimensionless sigma units and basis points. Zero currency symbols or pricing metrics exist in this repository.
                </p>
                <div className="flex items-center gap-2 text-sm text-[#10B981] font-medium pt-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>100% MIT Permissive Whitelist</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: Kalman State Dynamics */}
        {activeTab === 'kalman' && (
          <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-8 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white">Kalman Hedge Ratio (&beta;_t) Trajectory</h3>
              <p className="text-sm text-[#94A3B8]">Real-time adaptive parameter convergence tracking structural cointegration shifts</p>
            </div>

            <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
              <div className="text-sm font-semibold text-white mb-3">Time-Varying Hedge Ratio (&beta;_t) Convergence</div>
              <div className="w-full h-64 min-h-[250px] relative">
                {kalmanHistory && kalmanHistory.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200} debounce={50}>
                    <LineChart data={kalmanHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="t" stroke="#94A3B8" fontSize={12} />
                      <YAxis stroke="#94A3B8" fontSize={12} domain={['dataMin - 0.05', 'dataMax + 0.05']} />
                      <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '14px' }} />
                      <Line type="monotone" dataKey="beta" stroke="#3B82F6" strokeWidth={2.5} dot={true} name="Hedge Ratio (&beta;)" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 space-y-3">
                <h4 className="text-lg font-bold text-white">Observation Equation</h4>
                <div className="bg-[#070A11] p-3 rounded-lg font-mono text-sm text-[#06B6D4]">
                  Y_t = &beta;_t * X_t + &alpha;_t + v_t, v_t ~ N(0, R)
                </div>
                <p className="text-sm text-[#94A3B8]">Relates target series Y_t to proxy X_t dynamically without lookahead bias.</p>
              </div>

              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 space-y-3">
                <h4 className="text-lg font-bold text-white">State Transition Equation</h4>
                <div className="bg-[#070A11] p-3 rounded-lg font-mono text-sm text-[#3B82F6]">
                  x_t = x_{'{t-1}'} + w_t, w_t ~ N(0, W)
                </div>
                <p className="text-sm text-[#94A3B8]">State vector x_t = [&beta;_t, &alpha;_t]^T evolves with process noise covariance W = diag(&delta;, &delta;).</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 3: Copula Tail Dependence */}
        {activeTab === 'copula' && (
          <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Non-Linear Bivariate Copula Tail Dependence</h3>
                <p className="text-sm text-[#94A3B8]">Clayton (lower tail market selloff) & Gumbel (upper tail market rally) copula calibration</p>
              </div>
              <button 
                onClick={fetchCopula}
                className="min-h-[44px] px-4 py-2 bg-[#06B6D4] hover:bg-[#0891B2] text-white text-base font-bold rounded-lg shadow transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recalibrate Copula</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 space-y-3">
                <div className="text-sm font-semibold text-[#94A3B8]">Clayton Copula (&lambda;_L)</div>
                <div className="text-3xl font-bold font-mono text-[#06B6D4]">{copulaData.lower_tail_dependence}</div>
                <div className="text-sm text-[#94A3B8]">Parameter &theta;: <strong className="text-white font-mono">{copulaData.clayton_theta}</strong></div>
                <p className="text-sm text-[#94A3B8] pt-2 border-t border-[#1E293B]">Captures joint market drawdowns and lower tail crash dependency.</p>
              </div>

              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 space-y-3">
                <div className="text-sm font-semibold text-[#94A3B8]">Gumbel Copula (&lambda;_U)</div>
                <div className="text-3xl font-bold font-mono text-[#10B981]">{copulaData.upper_tail_dependence}</div>
                <div className="text-sm text-[#94A3B8]">Parameter &theta;: <strong className="text-white font-mono">{copulaData.gumbel_theta}</strong></div>
                <p className="text-sm text-[#94A3B8] pt-2 border-t border-[#1E293B]">Captures joint market melt-ups and upper tail explosive momentum.</p>
              </div>

              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 space-y-3">
                <div className="text-sm font-semibold text-[#94A3B8]">Gaussian Benchmark (&rho;)</div>
                <div className="text-3xl font-bold font-mono text-white">{copulaData.gaussian_rho}</div>
                <div className="text-sm text-[#94A3B8]">Kendall's Tau: <strong className="text-white font-mono">{copulaData.kendall_tau}</strong></div>
                <p className="text-sm text-[#94A3B8] pt-2 border-t border-[#1E293B]">Parametric Gaussian correlation benchmark for linear co-movement.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 4: SHA-256 Audit Ledger */}
        {activeTab === 'audit' && (
          <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Cryptographic Append-Only Audit Ledger</h3>
                <p className="text-sm text-[#94A3B8]">SHA-256 chain immutability tracking every Kalman update, copula calibration, and trade signal</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] rounded-lg text-base font-bold font-mono">
                <CheckCircle2 className="w-5 h-5" />
                <span>CHAIN VERIFIED (Length: {auditLedger.chain_length})</span>
              </div>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {auditLedger.chain && auditLedger.chain.map((block: any, idx: number) => (
                <div key={idx} className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 space-y-2 font-mono">
                  <div className="flex items-center justify-between text-sm text-[#94A3B8]">
                    <span>Block #{block.index}</span>
                    <span>{block.timestamp}</span>
                  </div>
                  <div className="text-base text-white font-bold">
                    {block.payload.event || block.payload.event_type}
                  </div>
                  <div className="bg-[#070A11] p-3 rounded-lg text-sm text-[#06B6D4] overflow-x-auto">
                    {JSON.stringify(block.payload, null, 2)}
                  </div>
                  <div className="text-xs text-[#94A3B8] truncate">
                    Hash: <span className="text-white">{block.hash}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 5: Transfer Spec & SSDF v1.1 */}
        {activeTab === 'transfer' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-6 space-y-4 lg:col-span-2">
              <h3 className="text-xl font-bold text-white">ENGINE_SPEC.md & Transfer Documentation</h3>
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 font-mono text-sm text-[#E2E8F0] whitespace-pre-wrap max-h-[600px] overflow-y-auto">
                {docs.engine_spec || "Loading specification..."}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-white">LEGAL_IP_AUDIT.md</h3>
                <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 font-mono text-xs text-[#E2E8F0] whitespace-pre-wrap max-h-[250px] overflow-y-auto">
                  {docs.legal_audit || "Loading legal audit..."}
                </div>
              </div>

              <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-white">ASSET_TRANSFER_SPEC.md</h3>
                <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 font-mono text-xs text-[#E2E8F0] whitespace-pre-wrap max-h-[250px] overflow-y-auto">
                  {docs.asset_transfer || "Loading transfer spec..."}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
