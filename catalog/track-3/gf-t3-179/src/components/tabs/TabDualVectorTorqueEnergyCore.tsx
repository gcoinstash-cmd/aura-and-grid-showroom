/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useId } from 'react';
import { Copy, Check, Play, RotateCcw, AlertTriangle, ShieldCheck, Flame, Cpu } from 'lucide-react';
import { PYTHON_ENGINE_CODE } from '../../data/specContent';

interface TabDualVectorTorqueEnergyCoreProps {
  onUpdateBias: (front: number, rear: number) => void;
  triggerSweepSignal?: number;
}

export const TabDualVectorTorqueEnergyCore: React.FC<TabDualVectorTorqueEnergyCoreProps> = ({
  onUpdateBias,
}) => {
  const throttleInputId = useId();
  const steeringInputId = useId();
  const speedInputId = useId();
  const frictionInputId = useId();
  const socInputId = useId();
  const tempInputId = useId();

  // Interactive Simulation State
  const [throttle, setThrottle] = useState<number>(75); // %
  const [steeringAngle, setSteeringAngle] = useState<number>(15); // degrees
  const [velocityMph, setVelocityMph] = useState<number>(45); // mph
  const [frictionMu, setFrictionMu] = useState<number>(0.95); // dry asphalt
  const [batterySoc, setBatterySoc] = useState<number>(82); // %
  const [batteryTempC, setBatteryTempC] = useState<number>(34); // °C
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isSimulatingSweep, setIsSimulatingSweep] = useState<boolean>(false);

  // Compute DUAL_VECTOR_TORQUE calculations matching the Python engine
  const velocityMps = velocityMph * 0.44704;
  const steeringRad = (steeringAngle * Math.PI) / 180;
  const throttleFrac = throttle / 100;

  // Thermal derating
  let derateFactor = 1.0;
  if (batterySoc <= 15) {
    derateFactor = Math.max(0.2, (batterySoc / 15) * 0.4);
  }
  if (batteryTempC >= 52) {
    const excess = batteryTempC - 52;
    derateFactor *= Math.max(0.15, 1.0 - excess * 0.12);
  } else if (batteryTempC >= 45) {
    derateFactor *= 1.0 - (batteryTempC - 45) * 0.03;
  }
  derateFactor = Math.min(1.0, Math.max(0.1, derateFactor));

  // Dynamic Torque Blending
  const totalSystemTorque = 550 * throttleFrac * derateFactor; // Max 550 Nm
  const speedFactor = Math.max(0.0, Math.min(1.0, (velocityMps - 2.2) / 11.2)); // low-speed launch transition
  const launchRearBias = (1.0 - speedFactor) * Math.pow(throttleFrac, 1.4) * 0.8;
  const cruiseFrontBias = speedFactor * (1.0 - throttleFrac * 0.5);

  let rawRearRatio = 0.3 + launchRearBias * 0.5 - cruiseFrontBias * 0.3;
  if (Math.abs(steeringRad) > 0.05) {
    const turnIntensity = Math.min(1.0, Math.abs(steeringRad) / 0.45);
    if (throttleFrac > 0.4) {
      rawRearRatio += 0.35 * turnIntensity;
    } else {
      rawRearRatio -= 0.2 * turnIntensity;
    }
  }

  // Low friction mu pulls toward 50:50
  const blendedRear = rawRearRatio * frictionMu + 0.5 * (1.0 - frictionMu);
  let finalRearRatio = 0.0;
  if (throttle < 8 && velocityMph > 40 && Math.abs(steeringAngle) < 3) {
    finalRearRatio = 0.0; // 100:0 Front Cruise
  } else {
    finalRearRatio = Math.max(0.2, Math.min(0.8, blendedRear));
  }
  const finalFrontRatio = 1.0 - finalRearRatio;

  const frontTorqueNm = totalSystemTorque * finalFrontRatio;
  let rearTorqueNm = totalSystemTorque * finalRearRatio;
  let isQuarantined = false;

  // Physical e-Axle cap is 169 Nm
  if (rearTorqueNm > 169.0) {
    rearTorqueNm = 169.0;
    isQuarantined = true;
  }

  const frontRatioPct = Math.round(finalFrontRatio * 100);
  const rearRatioPct = Math.round(finalRearRatio * 100);

  // Power split in kW
  const frontTotalKw = (frontTorqueNm * (velocityMps / 0.35)) / 1000;
  const frontMgKw = Math.min(frontTotalKw, (270 * (velocityMps / 0.35)) / 1000 * 0.5);
  const v6CombustionKw = Math.max(0, frontTotalKw - frontMgKw);
  const rearEaxleKw = (rearTorqueNm * (velocityMps / 0.35)) / 1000;

  // Yaw Moment Correction
  const targetYawRate = (velocityMps * steeringRad) / (2.95 + 0.0022 * velocityMps * velocityMps);
  const yawMomentNm = Math.round(1250 * targetYawRate);

  // Sync to parent header metric
  React.useEffect(() => {
    onUpdateBias(frontRatioPct, rearRatioPct);
  }, [frontRatioPct, rearRatioPct]);

  const handleApplyPreset = (preset: {
    t: number;
    s: number;
    v: number;
    mu: number;
    soc: number;
    temp: number;
  }) => {
    setThrottle(preset.t);
    setSteeringAngle(preset.s);
    setVelocityMph(preset.v);
    setFrictionMu(preset.mu);
    setBatterySoc(preset.soc);
    setBatteryTempC(preset.temp);
  };

  const handleSimulateSweep = () => {
    setIsSimulatingSweep(true);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step === 1) {
        handleApplyPreset({ t: 100, s: 0, v: 5, mu: 1.0, soc: 90, temp: 32 }); // Launch 20:80
      } else if (step === 2) {
        handleApplyPreset({ t: 65, s: 28, v: 40, mu: 0.95, soc: 85, temp: 35 }); // Corner Apex 40:60
      } else if (step === 3) {
        handleApplyPreset({ t: 40, s: 15, v: 30, mu: 0.25, soc: 80, temp: 30 }); // Snow 50:50
      } else if (step === 4) {
        handleApplyPreset({ t: 10, s: 0, v: 70, mu: 1.0, soc: 75, temp: 33 }); // Cruise 100:0
      } else {
        clearInterval(interval);
        setIsSimulatingSweep(false);
      }
    }, 1100);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PYTHON_ENGINE_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2200);
  };

  return (
    <div className="space-y-6">
      {/* Simulation Controls & Status */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-amber-400" />
              DUAL_VECTOR_TORQUE Dynamic e-Axle & PHEV Energy Arbitrator
            </h2>
            <p className="text-[15px] text-slate-400">
              Sub-millisecond 1,000 Hz vectoring loop arbitrating 3.5L V6, Front MG2, and dedicated Rear e-Axle.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateSweep}
              disabled={isSimulatingSweep}
              type="button"
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-[15px] px-3.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isSimulatingSweep ? 'Sweeping Loop...' : 'Auto-Sweep Cycle'}</span>
            </button>
            <button
              onClick={() => handleApplyPreset({ t: 75, s: 15, v: 45, mu: 0.95, soc: 82, temp: 34 })}
              type="button"
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[15px] px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Preset Selector Buttons */}
        <div className="mb-5">
          <label className="block text-[15px] font-medium text-slate-400 mb-2">
            Automotive Calibration Presets:
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleApplyPreset({ t: 100, s: 0, v: 4, mu: 1.0, soc: 92, temp: 30 })}
              className="bg-slate-800 hover:bg-slate-700 border border-amber-500/30 text-amber-300 text-[15px] font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-all"
            >
              Wide-Open Throttle Launch (20:80)
            </button>
            <button
              onClick={() => handleApplyPreset({ t: 70, s: 30, v: 38, mu: 0.95, soc: 80, temp: 36 })}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-[15px] font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-all"
            >
              High-G Corner Apex (40:60)
            </button>
            <button
              onClick={() => handleApplyPreset({ t: 45, s: 10, v: 25, mu: 0.22, soc: 75, temp: 28 })}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 text-[15px] font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-all"
            >
              Snow / Low-Mu Stability (50:50)
            </button>
            <button
              onClick={() => handleApplyPreset({ t: 5, s: 0, v: 72, mu: 1.0, soc: 68, temp: 33 })}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 text-[15px] font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-all"
            >
              Highway Efficiency Cruise (100:0)
            </button>
            <button
              onClick={() => handleApplyPreset({ t: 90, s: 0, v: 55, mu: 1.0, soc: 80, temp: 54.5 })}
              className="bg-slate-800 hover:bg-slate-700 border border-rose-500/40 text-rose-300 text-[15px] font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-all"
            >
              High-Temp Thermal Derate (54.5°C)
            </button>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Throttle Demand */}
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center mb-1 text-[15px]">
              <label htmlFor={throttleInputId} className="text-slate-300 font-medium">Throttle Demand</label>
              <span className="font-mono text-amber-400 font-bold">{throttle}%</span>
            </div>
            <input
              id={throttleInputId}
              type="range"
              min="0"
              max="100"
              value={throttle}
              onChange={(e) => setThrottle(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[15px] text-slate-500 mt-1">
              <span>0% (Idle)</span>
              <span>100% (WOT)</span>
            </div>
          </div>

          {/* Steering Angle */}
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center mb-1 text-[15px]">
              <label htmlFor={steeringInputId} className="text-slate-300 font-medium">Steering Angle</label>
              <span className="font-mono text-cyan-400 font-bold">{steeringAngle}°</span>
            </div>
            <input
              id={steeringInputId}
              type="range"
              min="-45"
              max="45"
              value={steeringAngle}
              onChange={(e) => setSteeringAngle(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[15px] text-slate-500 mt-1">
              <span>-45° Left</span>
              <span>Center</span>
              <span>+45° Right</span>
            </div>
          </div>

          {/* Vehicle Speed */}
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center mb-1 text-[15px]">
              <label htmlFor={speedInputId} className="text-slate-300 font-medium">Vehicle Speed</label>
              <span className="font-mono text-white font-bold">{velocityMph} mph</span>
            </div>
            <input
              id={speedInputId}
              type="range"
              min="0"
              max="125"
              value={velocityMph}
              onChange={(e) => setVelocityMph(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[15px] text-slate-500 mt-1">
              <span>0 mph</span>
              <span>{(velocityMps).toFixed(1)} m/s</span>
              <span>125 mph</span>
            </div>
          </div>

          {/* Road Surface Friction mu */}
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center mb-1 text-[15px]">
              <label htmlFor={frictionInputId} className="text-slate-300 font-medium">Friction Coeff (μ)</label>
              <span className="font-mono text-indigo-400 font-bold">{frictionMu.toFixed(2)}</span>
            </div>
            <input
              id={frictionInputId}
              type="range"
              min="0.10"
              max="1.00"
              step="0.05"
              value={frictionMu}
              onChange={(e) => setFrictionMu(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[15px] text-slate-500 mt-1">
              <span>0.1 (Ice)</span>
              <span>0.5 (Wet)</span>
              <span>1.0 (Dry Tarmac)</span>
            </div>
          </div>

          {/* Battery SOC */}
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center mb-1 text-[15px]">
              <label htmlFor={socInputId} className="text-slate-300 font-medium">18.1 kWh Battery SOC</label>
              <span className="font-mono text-emerald-400 font-bold">{batterySoc}%</span>
            </div>
            <input
              id={socInputId}
              type="range"
              min="10"
              max="100"
              value={batterySoc}
              onChange={(e) => setBatterySoc(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[15px] text-slate-500 mt-1">
              <span>15% Cutoff</span>
              <span>Nominal 355V</span>
              <span>100% Full</span>
            </div>
          </div>

          {/* Battery Pack Temp */}
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center mb-1 text-[15px]">
              <label htmlFor={tempInputId} className="text-slate-300 font-medium">Pack Cell Temperature</label>
              <span className={`font-mono font-bold ${batteryTempC >= 52 ? 'text-rose-400' : 'text-amber-400'}`}>
                {batteryTempC}°C
              </span>
            </div>
            <input
              id={tempInputId}
              type="range"
              min="15"
              max="58"
              value={batteryTempC}
              onChange={(e) => setBatteryTempC(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <div className="flex justify-between text-[15px] text-slate-500 mt-1">
              <span>15°C (Cool)</span>
              <span>45°C (Warm)</span>
              <span>&gt;52°C (Derate)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Dynamic Vectoring Output & Powertrain Telemetry HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Dynamic e-Axle Vector HUD */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <span className="text-[15px] font-bold text-white uppercase tracking-wider">
                DUAL_VECTOR_TORQUE Vector Split
              </span>
              <span className="text-[15px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                100:0 → 20:80 Range
              </span>
            </div>

            <div className="space-y-4">
              {/* Front Axle Torque */}
              <div>
                <div className="flex justify-between text-[15px] mb-1 font-mono">
                  <span className="text-cyan-400 font-semibold">Front Transaxle (V6 + MG2)</span>
                  <span className="text-white font-bold">{frontTorqueNm.toFixed(1)} Nm ({frontRatioPct}%)</span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full transition-all duration-200"
                    style={{ width: `${frontRatioPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[15px] text-slate-400 font-mono mt-1">
                  <span>3.5L V6: {v6CombustionKw.toFixed(1)} kW</span>
                  <span>MG2 Motor: {frontMgKw.toFixed(1)} kW</span>
                </div>
              </div>

              {/* Rear e-Axle Torque */}
              <div>
                <div className="flex justify-between text-[15px] mb-1 font-mono">
                  <span className="text-amber-400 font-semibold">Rear Dedicated e-Axle</span>
                  <span className="text-white font-bold">{rearTorqueNm.toFixed(1)} Nm ({rearRatioPct}%)</span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full transition-all duration-200"
                    style={{ width: `${rearRatioPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[15px] text-slate-400 font-mono mt-1">
                  <span>Output: {rearEaxleKw.toFixed(1)} kW</span>
                  <span>Hardware Cap: 169.0 Nm</span>
                </div>
              </div>

              {/* Yaw Moment & Stability Metrics */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex justify-between text-[15px] font-mono">
                  <span className="text-slate-400">Yaw Moment Correction:</span>
                  <span className="text-emerald-400 font-semibold">{yawMomentNm > 0 ? `+${yawMomentNm}` : yawMomentNm} N·m</span>
                </div>
                <div className="flex justify-between text-[15px] font-mono">
                  <span className="text-slate-400">Thermal Derate Factor:</span>
                  <span className={derateFactor < 1.0 ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                    {(derateFactor * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-[15px] font-mono">
                  <span className="text-slate-400">Combined System Torque:</span>
                  <span className="text-white font-bold">{(frontTorqueNm + rearTorqueNm).toFixed(1)} / 550 Nm</span>
                </div>
              </div>
            </div>
          </div>

          {isQuarantined && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[15px] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>e-Axle hardware saturation clamped at 169 Nm. Ledger trigger logged.</span>
            </div>
          )}
        </div>

        {/* Center: Powertrain Chassis Diagram */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
            <span className="text-[15px] font-bold text-white uppercase tracking-wider">
              Apex Executive High-Output Multi-Node Core DUAL_VECTOR_TORQUE Powertrain Architecture
            </span>
            <span className="text-[15px] font-mono text-slate-400">AWD Vectoring</span>
          </div>

          {/* Chassis Graphic */}
          <div className="relative w-full max-w-[280px] h-[310px] my-2 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-between p-4">
            {/* Front Axle */}
            <div className="w-full flex justify-between items-center">
              {/* Front Left Wheel */}
              <div className="flex flex-col items-center">
                <div
                  className="w-7 h-14 bg-slate-700 border-2 border-cyan-400 rounded-md transition-transform"
                  style={{ transform: `rotate(${steeringAngle * 0.4}deg)` }}
                />
                <span className="text-[15px] font-mono text-cyan-300 mt-1">FL</span>
              </div>
              {/* Front Transaxle & V6 3.5L Engine */}
              <div className="flex-1 px-2 text-center">
                <div className="bg-cyan-950/70 border border-cyan-500/50 rounded-lg p-1.5 shadow">
                  <div className="text-[15px] font-bold text-cyan-200">2GR-FXS V6 + MG2</div>
                  <div className="text-[15px] font-mono text-cyan-400">{(frontTorqueNm).toFixed(0)} Nm</div>
                </div>
              </div>
              {/* Front Right Wheel */}
              <div className="flex flex-col items-center">
                <div
                  className="w-7 h-14 bg-slate-700 border-2 border-cyan-400 rounded-md transition-transform"
                  style={{ transform: `rotate(${steeringAngle * 0.4}deg)` }}
                />
                <span className="text-[15px] font-mono text-cyan-300 mt-1">FR</span>
              </div>
            </div>

            {/* Center: 18.1 kWh Battery Pack */}
            <div className="w-4/5 bg-slate-900 border border-emerald-500/40 rounded-xl p-2.5 text-center shadow-lg">
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-[15px]">
                <Cpu className="w-4 h-4" />
                <span>18.1 kWh Li-Ion (355V)</span>
              </div>
              <div className="flex justify-between items-center text-[15px] font-mono text-slate-300 mt-1">
                <span>SOC: {batterySoc}%</span>
                <span className={batteryTempC >= 52 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                  {batteryTempC}°C
                </span>
              </div>
              {/* Liquid cooling flow indicator */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-emerald-400 h-full"
                  style={{ width: `${Math.min(100, (batteryTempC / 55) * 100)}%` }}
                />
              </div>
            </div>

            {/* Rear Axle: Dedicated e-Axle (No driveshaft) */}
            <div className="w-full flex justify-between items-center">
              {/* Rear Left Wheel */}
              <div className="flex flex-col items-center">
                <div className="w-7 h-14 bg-slate-700 border-2 border-amber-400 rounded-md" />
                <span className="text-[15px] font-mono text-amber-300 mt-1">RL</span>
              </div>
              {/* Dedicated e-Axle Motor */}
              <div className="flex-1 px-2 text-center">
                <div className="bg-amber-950/70 border border-amber-500/50 rounded-lg p-1.5 shadow">
                  <div className="text-[15px] font-bold text-amber-200">DUAL_VECTOR_TORQUE e-Axle</div>
                  <div className="text-[15px] font-mono text-amber-400">{(rearTorqueNm).toFixed(0)} Nm</div>
                </div>
              </div>
              {/* Rear Right Wheel */}
              <div className="flex flex-col items-center">
                <div className="w-7 h-14 bg-slate-700 border-2 border-amber-400 rounded-md" />
                <span className="text-[15px] font-mono text-amber-300 mt-1">RR</span>
              </div>
            </div>
          </div>

          <div className="text-[15px] text-slate-400 font-mono text-center">
            Independent electric rear e-Axle eliminates propeller shaft losses.
          </div>
        </div>

        {/* Right: Thermal & Battery Management */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <span className="text-[15px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-400" />
                18.1 kWh Cell Thermal Management
              </span>
              <span className="text-[15px] font-mono text-emerald-400">96-Cell Monitored</span>
            </div>

            {/* Thermal Cell Matrix (Visual representation of cell banks) */}
            <div className="mb-4">
              <div className="text-[15px] text-slate-400 mb-2 flex justify-between">
                <span>Pack Cell Gradient (12 Sub-Banks):</span>
                <span className="font-mono text-slate-300">{batteryTempC.toFixed(1)}°C Mean</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                {Array.from({ length: 12 }).map((_, idx) => {
                  const cellDelta = (idx % 3) * 0.8 - 0.8;
                  const cellTemp = batteryTempC + cellDelta;
                  const isHot = cellTemp >= 52;
                  return (
                    <div
                      key={idx}
                      className={`p-1.5 rounded text-center font-mono text-[15px] font-semibold transition-colors ${
                        isHot
                          ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                          : cellTemp >= 42
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                          : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      }`}
                    >
                      {cellTemp.toFixed(1)}°
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 font-mono text-[15px]">
              <div className="flex justify-between p-2 rounded bg-slate-950/50 border border-slate-800/60">
                <span className="text-slate-400">Cooling System:</span>
                <span className="text-cyan-400 font-semibold">Active Liquid Glycol Loop</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-950/50 border border-slate-800/60">
                <span className="text-slate-400">DC Bus Nominal Voltage:</span>
                <span className="text-slate-200">355V (Boosted to 650V)</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-950/50 border border-slate-800/60">
                <span className="text-slate-400">HV Reserve Cutoff:</span>
                <span className="text-amber-400 font-semibold">15.0% Safety Floor</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-950/50 border border-slate-800/60">
                <span className="text-slate-400">Thermal Throttling Threshold:</span>
                <span className="text-rose-400 font-semibold">&gt; 52.0°C Derate Trip</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[15px] text-slate-400">
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> Thermal Safety: OK
            </span>
            <span className="font-mono">PHEV Arbitrator v1.0</span>
          </div>
        </div>
      </div>

      {/* Pure Python 3.12 Engine Source Code Viewer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-mono font-bold text-[15px]">dual_vector_torque_energy_arbitrator.py</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 text-[15px]">Pure Python 3.12 (Zero Dependency, Clean-Room)</span>
          </div>
          <button
            onClick={handleCopyCode}
            type="button"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[15px] px-3.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? 'Copied Source!' : 'Copy Python 3.12 Engine'}</span>
          </button>
        </div>
        <div className="p-4 bg-slate-950 max-h-[480px] overflow-y-auto">
          <pre className="text-[15px] font-mono text-slate-300 leading-relaxed overflow-x-auto">
            <code>{PYTHON_ENGINE_CODE}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
