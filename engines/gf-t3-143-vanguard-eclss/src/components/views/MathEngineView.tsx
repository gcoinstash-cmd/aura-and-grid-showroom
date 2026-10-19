/**
 * Vanguard-ECLSS: Proprietary Mathematical & Algorithmic Engine View
 * Interactive Equation Solvers, Psychrometric Thermodynamics, and State Space Formulations
 * Upgraded Font Floor & High-Legibility Typography
 */

import React, { useState } from 'react';
import { Flame, Droplets, Zap, Activity, Calculator, CheckCircle2, ChevronRight } from 'lucide-react';
import {
  calculateActualVaporPressure,
  calculateDewPoint,
  calculateEnthalpy,
  calculateHumidityRatio,
  calculateSaturationVaporPressure,
  solveElectrolyzerFaraday,
  solveSabatierKinetics,
} from '../../engine/physics';

export const MathEngineView: React.FC = () => {
  // Interactive Psychrometric Solver Inputs
  const [testTemp, setTestTemp] = useState(21.5);
  const [testRh, setTestRh] = useState(45.0);
  const [testTotalP, setTestTotalP] = useState(101.325);

  // Interactive Sabatier Inputs
  const [sabatierTemp, setSabatierTemp] = useState(400.0);
  const [sabatierCo2Feed, setSabatierCo2Feed] = useState(850.0);
  const [sabatierH2Feed, setSabatierH2Feed] = useState(3400.0);

  // Interactive Electrolyzer Inputs
  const [electrolyzerCurrent, setElectrolyzerCurrent] = useState(60.0);
  const [electrolyzerVoltage, setElectrolyzerVoltage] = useState(28.4);
  const [cellDegradation, setCellDegradation] = useState(4.0);

  // Calculate Dynamic Results
  const pSat = calculateSaturationVaporPressure(testTemp);
  const pVapor = calculateActualVaporPressure(testTemp, testRh);
  const dewPoint = calculateDewPoint(testTemp, testRh);
  const humidityRatio = calculateHumidityRatio(testTemp, testRh, testTotalP);
  const enthalpy = calculateEnthalpy(testTemp, testRh, testTotalP);

  const sabatierResult = solveSabatierKinetics(sabatierCo2Feed, sabatierH2Feed, sabatierTemp, 150.0);
  const electrolyzerResult = solveElectrolyzerFaraday(electrolyzerCurrent, electrolyzerVoltage, 24, cellDegradation);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white flex items-center gap-3">
          <Calculator className="w-8 h-8 text-cyan-400" />
          PROPRIETARY MATHEMATICAL & THERMODYNAMIC ENGINE
        </h2>
        <p className="text-base text-slate-300 font-medium mt-1">
          Zero-placeholder, analytical first-principles formulation: Sabatier Catalytic Kinetics, PEM Electrochemical Dissociation, Buck Psychrometrics, and MIMO Quadratic Matrix Minimization.
        </p>
      </div>

      {/* 1. Psychrometric & Thermodynamic Cabin Solver */}
      <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Droplets className="w-7 h-7 text-cyan-400" />
            <h3 className="text-xl sm:text-2xl font-bold font-mono text-white">
              1. BUCK / MAGNUS-TETENS PSYCHROMETRIC SOLVER
            </h3>
          </div>
          <span className="text-sm font-bold px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
            ASHRAE FUNDAMENTALS GRADE
          </span>
        </div>

        {/* Theoretical Formula Box */}
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-base space-y-3 text-slate-200">
          <div className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Governing Equations:</div>
          <p>
            Saturation Vapor Pressure: <code className="text-cyan-300 font-bold">p_sat(T) = 0.61121 · exp((18.678 - T/234.5) · (T / (257.14 + T))) [kPa]</code>
          </p>
          <p>
            Dew Point Temperature: <code className="text-cyan-300 font-bold">T_dp = (257.14 · α) / (18.678 - α) where α = ln(p_v / 0.61121) [°C]</code>
          </p>
          <p>
            Specific Cabin Enthalpy: <code className="text-cyan-300 font-bold">h = 1.006 · T + W · (2501 + 1.86 · T) [kJ / kg dry air]</code>
          </p>
        </div>

        {/* Interactive Parameter Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-xl bg-slate-950 border border-slate-800">
          <div className="space-y-3">
            <div className="flex justify-between text-base font-mono">
              <span className="text-slate-300 font-medium">Cabin Temp (T):</span>
              <span className="text-white font-bold text-lg">{testTemp.toFixed(1)} °C</span>
            </div>
            <input
              type="range"
              min="10.0"
              max="35.0"
              step="0.5"
              value={testTemp}
              onChange={(e) => setTestTemp(parseFloat(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-base font-mono">
              <span className="text-slate-300 font-medium">Relative Humidity (RH):</span>
              <span className="text-cyan-300 font-bold text-lg">{testRh.toFixed(1)} %</span>
            </div>
            <input
              type="range"
              min="10.0"
              max="90.0"
              step="1.0"
              value={testRh}
              onChange={(e) => setTestRh(parseFloat(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-base font-mono">
              <span className="text-slate-300 font-medium">Total Pressure (P_tot):</span>
              <span className="text-slate-100 font-bold text-lg">{testTotalP.toFixed(2)} kPa</span>
            </div>
            <input
              type="range"
              min="85.0"
              max="115.0"
              step="0.5"
              value={testTotalP}
              onChange={(e) => setTestTotalP(parseFloat(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Live Calculation Output Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 font-mono">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-sm font-semibold text-slate-400">p_sat(T)</div>
            <div className="text-xl font-bold text-white mt-1.5">{pSat.toFixed(4)} kPa</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-sm font-semibold text-slate-400">Actual p_v</div>
            <div className="text-xl font-bold text-cyan-300 mt-1.5">{pVapor.toFixed(4)} kPa</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-sm font-semibold text-slate-400">Dew Point (T_dp)</div>
            <div className="text-xl font-bold text-emerald-300 mt-1.5">{dewPoint.toFixed(2)} °C</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-sm font-semibold text-slate-400">Humidity Ratio W</div>
            <div className="text-xl font-bold text-amber-300 mt-1.5">{(humidityRatio * 1000).toFixed(2)} g/kg</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-sm font-semibold text-slate-400">Enthalpy h</div>
            <div className="text-xl font-bold text-purple-300 mt-1.5">{enthalpy.toFixed(2)} kJ/kg</div>
          </div>
        </div>
      </div>

      {/* 2. Sabatier Catalytic Reactor Kinetics */}
      <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Flame className="w-7 h-7 text-amber-400" />
            <h3 className="text-xl sm:text-2xl font-bold font-mono text-white">
              2. SABATIER HETEROGENEOUS CATALYTIC METHANATION
            </h3>
          </div>
          <span className="text-sm font-bold px-3 py-1.5 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 font-mono">
            Ru/Al2O3 THERMODYNAMIC MODEL
          </span>
        </div>

        {/* Reaction Equation Box */}
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-base space-y-3 text-slate-200">
          <div className="text-sm font-bold text-amber-400 uppercase tracking-wider">Reaction Stoichiometry & Enthalpy:</div>
          <p className="text-lg text-amber-200 font-extrabold">
            CO2 + 4 H2 ⟶ CH4 + 2 H2O  (ΔH°_298 = -165.0 kJ/mol Exothermic)
          </p>
          <p className="text-sm text-slate-300 font-sans">
            Exothermic catalytic conversion active between 350°C - 450°C. Peak selectivity achieved at 400°C over Ruthenium catalyst.
          </p>
        </div>

        {/* Sabatier Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-xl bg-slate-950 border border-slate-800">
          <div className="space-y-3">
            <div className="flex justify-between text-base font-mono">
              <span className="text-slate-300 font-medium">Reactor Temp:</span>
              <span className="text-amber-300 font-bold text-lg">{sabatierTemp.toFixed(1)} °C</span>
            </div>
            <input
              type="range"
              min="280.0"
              max="500.0"
              step="5.0"
              value={sabatierTemp}
              onChange={(e) => setSabatierTemp(parseFloat(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-base font-mono">
              <span className="text-slate-300 font-medium">CO2 Inflow Rate:</span>
              <span className="text-white font-bold text-lg">{sabatierCo2Feed.toFixed(0)} SCCM</span>
            </div>
            <input
              type="range"
              min="200.0"
              max="2000.0"
              step="50.0"
              value={sabatierCo2Feed}
              onChange={(e) => setSabatierCo2Feed(parseFloat(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-base font-mono">
              <span className="text-slate-300 font-medium">H2 Inflow Rate:</span>
              <span className="text-cyan-300 font-bold text-lg">{sabatierH2Feed.toFixed(0)} SCCM</span>
            </div>
            <input
              type="range"
              min="800.0"
              max="8000.0"
              step="100.0"
              value={sabatierH2Feed}
              onChange={(e) => setSabatierH2Feed(parseFloat(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Sabatier Yields */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 font-mono">
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-sm font-semibold text-slate-400">Conversion Efficiency</div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2">
              {sabatierResult.conversionEfficiencyPct.toFixed(1)}%
            </div>
          </div>
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-sm font-semibold text-slate-400">Water Yield (Liquid)</div>
            <div className="text-3xl font-extrabold text-cyan-300 mt-2">
              {sabatierResult.waterYieldLitersPerHour.toFixed(3)} <span className="text-base font-normal text-slate-400">L/hr</span>
            </div>
          </div>
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-sm font-semibold text-slate-400">Methane Vent Yield</div>
            <div className="text-3xl font-extrabold text-amber-300 mt-2">
              {sabatierResult.ch4YieldSccm.toFixed(1)} <span className="text-base font-normal text-slate-400">SCCM</span>
            </div>
          </div>
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-sm font-semibold text-slate-400">Reaction Heat Load</div>
            <div className="text-3xl font-extrabold text-purple-300 mt-2">
              {sabatierResult.heatGeneratedWatts.toFixed(1)} <span className="text-base font-normal text-slate-400">W</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PEM Water Electrolysis (Faraday Law) */}
      <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Zap className="w-7 h-7 text-emerald-400" />
            <h3 className="text-xl sm:text-2xl font-bold font-mono text-white">
              3. PEM WATER ELECTROLYSIS & FARADAY DISSOCIATION
            </h3>
          </div>
          <span className="text-sm font-bold px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
            FARADAY z=4 MODEL
          </span>
        </div>

        {/* Faraday Formula Box */}
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-base space-y-3 text-slate-200">
          <div className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Faraday Law of Electrolysis:</div>
          <p>
            O2 Molar Rate: <code className="text-emerald-300 font-bold">ṅ_O2 = (I · N_cells · η_F) / (4 · F) [mol / s]</code>
          </p>
          <p>
            Where Faraday Constant <code className="text-emerald-300 font-bold">F = 96485.33 C/mol</code>, <code className="text-emerald-300 font-bold">N_cells = 24</code>, <code className="text-emerald-300 font-bold">η_F = 99.2%</code>.
          </p>
        </div>

        {/* Electrolyzer Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-xl bg-slate-950 border border-slate-800">
          <div className="space-y-3">
            <div className="flex justify-between text-base font-mono">
              <span className="text-slate-300 font-medium">Stack Current:</span>
              <span className="text-emerald-300 font-bold text-lg">{electrolyzerCurrent.toFixed(1)} A</span>
            </div>
            <input
              type="range"
              min="20.0"
              max="100.0"
              step="1.0"
              value={electrolyzerCurrent}
              onChange={(e) => setElectrolyzerCurrent(parseFloat(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-base font-mono">
              <span className="text-slate-300 font-medium">Stack Voltage:</span>
              <span className="text-white font-bold text-lg">{electrolyzerVoltage.toFixed(1)} V</span>
            </div>
            <input
              type="range"
              min="24.0"
              max="36.0"
              step="0.2"
              value={electrolyzerVoltage}
              onChange={(e) => setElectrolyzerVoltage(parseFloat(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-base font-mono">
              <span className="text-slate-300 font-medium">Membrane Degradation:</span>
              <span className="text-amber-300 font-bold text-lg">{cellDegradation.toFixed(1)} %</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="35.0"
              step="0.5"
              value={cellDegradation}
              onChange={(e) => setCellDegradation(parseFloat(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>
        </div>

        {/* Electrolyzer Yield Outputs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 font-mono">
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-sm font-semibold text-slate-400">O2 Output Flow</div>
            <div className="text-3xl font-extrabold text-cyan-300 mt-2">
              {electrolyzerResult.o2ProducedSccm.toFixed(1)} <span className="text-base font-normal text-slate-400">SCCM</span>
            </div>
            <div className="text-sm text-slate-400 mt-1">{electrolyzerResult.o2ProducedKgPerHour.toFixed(3)} kg/hr</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-sm font-semibold text-slate-400">H2 to Sabatier</div>
            <div className="text-3xl font-extrabold text-amber-300 mt-2">
              {electrolyzerResult.h2ProducedSccm.toFixed(1)} <span className="text-base font-normal text-slate-400">SCCM</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-sm font-semibold text-slate-400">Water Consumption</div>
            <div className="text-3xl font-extrabold text-slate-100 mt-2">
              {electrolyzerResult.waterConsumedLph.toFixed(3)} <span className="text-base font-normal text-slate-400">L/hr</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-sm font-semibold text-slate-400">Stack Electrical Power</div>
            <div className="text-3xl font-extrabold text-purple-300 mt-2">
              {electrolyzerResult.stackPowerWatts.toFixed(0)} <span className="text-base font-normal text-slate-400">W</span>
            </div>
            <div className="text-sm text-slate-400 mt-1">Eff: {electrolyzerResult.cellEfficiencyPct.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};
