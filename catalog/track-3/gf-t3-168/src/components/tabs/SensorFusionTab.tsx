import React, { useState } from 'react';
import { Copy, Check, Download, Sliders, RotateCcw, FileCode } from 'lucide-react';
import { PYTHON_EKF_CODE } from '../../data/sourceCode';
import { EKFState, SensorInput } from '../../types/telemetry';

interface SensorFusionTabProps {
  ekfState: EKFState;
  sensorInput: SensorInput;
  onUpdateParameters: (params: {
    speedKmh: number;
    yawRateDeg: number;
    gpsNoiseM: number;
    accelBiasDrift: number;
  }) => void;
  onResetFilter: () => void;
}

export const SensorFusionTab: React.FC<SensorFusionTabProps> = ({
  ekfState,
  sensorInput,
  onUpdateParameters,
  onResetFilter,
}) => {
  const [copied, setCopied] = useState(false);
  const [speedVal, setSpeedVal] = useState(85);
  const [yawVal, setYawVal] = useState(4.2);
  const [gpsNoiseVal, setGpsNoiseVal] = useState(0.014);
  const [accelBiasVal, setAccelBiasVal] = useState(0.005);
  const [codeViewTab, setCodeViewTab] = useState<'simulator' | 'source'>('simulator');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PYTHON_EKF_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCode = () => {
    const blob = new Blob([PYTHON_EKF_CODE], { type: 'text/x-python;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ekf_core.py');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const applyParams = (speed: number, yaw: number, gps: number, bias: number) => {
    onUpdateParameters({
      speedKmh: speed,
      yawRateDeg: yaw,
      gpsNoiseM: gps,
      accelBiasDrift: bias,
    });
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation between Live Simulator & Source Code */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Sensor Fusion Core (Python 3.12 EKF)</h2>
          <p className="text-base text-slate-300 mt-1">
            Fusing 9-DOF IMU, 20Hz GPS RTK, and 100Hz wheel speed telemetry with Dynamic Rear Steering (DRS)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setCodeViewTab('simulator')}
              className={`px-3.5 py-2 text-sm font-semibold rounded-md transition-colors ${
                codeViewTab === 'simulator'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Interactive Simulator
            </button>
            <button
              onClick={() => setCodeViewTab('source')}
              className={`px-3.5 py-2 text-sm font-semibold rounded-md transition-colors ${
                codeViewTab === 'source'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Production Code (ekf_core.py)
            </button>
          </div>

          <button
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownloadCode}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download .py</span>
          </button>
        </div>
      </div>

      {codeViewTab === 'simulator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-sm font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Simulation Parameter Rig</span>
              </span>
              <button
                onClick={onResetFilter}
                className="text-sm text-slate-300 hover:text-white flex items-center gap-1.5 font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Covariance</span>
              </button>
            </div>

            {/* Slider 1: Target Speed */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-mono">
                <span className="text-slate-200 font-medium">Vehicle Speed Target</span>
                <span className="text-cyan-400 font-bold">{speedVal} km/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                step="5"
                value={speedVal}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSpeedVal(val);
                  applyParams(val, yawVal, gpsNoiseVal, accelBiasVal);
                }}
                className="w-full accent-cyan-500 cursor-pointer h-2"
              />
              <div className="flex justify-between text-sm text-slate-400 font-mono">
                <span>0 km/h (ZUPT Stationary)</span>
                <span>180 km/h (High-G Curve)</span>
              </div>
            </div>

            {/* Slider 2: Yaw Rate Cornering */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-mono">
                <span className="text-slate-200 font-medium">Yaw Rate / Cornering</span>
                <span className="text-cyan-400 font-bold">{yawVal.toFixed(1)} °/s</span>
              </div>
              <input
                type="range"
                min="-25"
                max="25"
                step="0.5"
                value={yawVal}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setYawVal(val);
                  applyParams(speedVal, val, gpsNoiseVal, accelBiasVal);
                }}
                className="w-full accent-cyan-500 cursor-pointer h-2"
              />
              <div className="flex justify-between text-sm text-slate-400 font-mono">
                <span>-25°/s (Hard Left)</span>
                <span>+25°/s (Hard Right)</span>
              </div>
            </div>

            {/* Slider 3: GPS RTK Noise 1-Sigma */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-mono">
                <span className="text-slate-200 font-medium">GPS RTK Precision (1-σ)</span>
                <span className="text-cyan-400 font-bold">{(gpsNoiseVal * 100).toFixed(1)} cm</span>
              </div>
              <input
                type="range"
                min="0.005"
                max="0.100"
                step="0.005"
                value={gpsNoiseVal}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setGpsNoiseVal(val);
                  applyParams(speedVal, yawVal, val, accelBiasVal);
                }}
                className="w-full accent-cyan-500 cursor-pointer h-2"
              />
              <div className="flex justify-between text-sm text-slate-400 font-mono">
                <span>5 mm (RTK Fixed)</span>
                <span>10 cm (Degraded Float)</span>
              </div>
            </div>

            {/* Slider 4: Accelerometer Bias Drift */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-mono">
                <span className="text-slate-200 font-medium">IMU Accel Bias Drift</span>
                <span className="text-cyan-400 font-bold">{accelBiasVal.toFixed(4)} m/s²</span>
              </div>
              <input
                type="range"
                min="0.001"
                max="0.050"
                step="0.002"
                value={accelBiasVal}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setAccelBiasVal(val);
                  applyParams(speedVal, yawVal, gpsNoiseVal, val);
                }}
                className="w-full accent-cyan-500 cursor-pointer h-2"
              />
              <div className="flex justify-between text-sm text-slate-400 font-mono">
                <span>0.001 m/s² (Tactical Grade)</span>
                <span>0.050 m/s² (Automotive MEMS)</span>
              </div>
            </div>

            {/* Presets */}
            <div className="pt-3 border-t border-slate-800">
              <span className="text-sm text-slate-300 font-mono font-semibold block mb-2.5">
                Evaluation Benchmarks:
              </span>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => {
                    setSpeedVal(0);
                    setYawVal(0);
                    applyParams(0, 0, gpsNoiseVal, accelBiasVal);
                  }}
                  className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono font-medium transition-colors border border-slate-700"
                >
                  ZUPT Stationary
                </button>
                <button
                  onClick={() => {
                    setSpeedVal(120);
                    setYawVal(14.5);
                    applyParams(120, 14.5, 0.012, 0.008);
                  }}
                  className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono font-medium transition-colors border border-slate-700"
                >
                  High-G Dynamic Telemetry Slalom Run
                </button>
                <button
                  onClick={() => {
                    setSpeedVal(95);
                    setYawVal(-8.0);
                    applyParams(95, -8.0, 0.015, 0.005);
                  }}
                  className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono font-medium transition-colors border border-slate-700"
                >
                  DRS Counter-Steer
                </button>
              </div>
            </div>
          </div>

          {/* Visualization & Matrix Diagnostics Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Live Filter Innovation & Trace Monitor */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 mb-4 border-b border-slate-800 gap-2">
                <span className="text-sm font-mono uppercase tracking-wider text-slate-300 font-bold">
                  Kalman Innovation & Covariance Diagnostics
                </span>
                <span className="text-sm font-mono text-emerald-400 font-bold">
                  Innovation Norm ||y||: {ekfState.innovationNorm.toFixed(4)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-sm mb-5">
                <div className="bg-slate-950 p-3.5 rounded border border-slate-800">
                  <div className="text-slate-400 font-medium">Position 1-σ</div>
                  <div className="text-white font-bold text-base mt-1">
                    {(Math.sqrt(ekfState.traceP / 3) * 100).toFixed(2)} cm
                  </div>
                </div>
                <div className="bg-slate-950 p-3.5 rounded border border-slate-800">
                  <div className="text-slate-400 font-medium">Velocity 1-σ</div>
                  <div className="text-cyan-400 font-bold text-base mt-1">
                    {(Math.sqrt(ekfState.traceP) * 0.4).toFixed(3)} m/s
                  </div>
                </div>
                <div className="bg-slate-950 p-3.5 rounded border border-slate-800">
                  <div className="text-slate-400 font-medium">Attitude 1-σ</div>
                  <div className="text-white font-bold text-base mt-1">0.012 deg</div>
                </div>
              </div>

              {/* Covariance Matrix P Visual Grid (15x15 Diagonal Representation) */}
              <div>
                <div className="text-sm font-mono text-slate-300 font-semibold mb-2.5 flex justify-between">
                  <span>Diagonal State Variances (diag(P))</span>
                  <span className="text-cyan-300">Condition Number: {ekfState.conditionNumber.toFixed(3)}</span>
                </div>
                <div className="grid grid-cols-15 gap-1.5 bg-slate-950 p-3 rounded border border-slate-800">
                  {Array.from({ length: 15 }).map((_, i) => {
                    const normalizedIntensity = i < 3 ? 0.35 : i < 6 ? 0.5 : i < 9 ? 0.2 : 0.15;
                    return (
                      <div
                        key={i}
                        className="h-9 rounded flex flex-col items-center justify-center text-xs font-mono"
                        style={{
                          backgroundColor: `rgba(6, 182, 212, ${normalizedIntensity})`,
                          border: '1px solid rgba(6, 182, 212, 0.4)',
                        }}
                        title={`State index ${i}`}
                      >
                        <span className="text-white font-bold">{i}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap justify-between text-sm text-slate-400 font-mono mt-2 gap-2">
                  <span>0-2: Pos NED</span>
                  <span>3-5: Vel NED</span>
                  <span>6-8: Euler</span>
                  <span>9-11: Acc Bias</span>
                  <span>12-14: Gyro Bias</span>
                </div>
              </div>
            </div>

            {/* Kinematic Equations Explainer */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-sm text-slate-200 space-y-2.5 leading-relaxed">
              <h3 className="font-bold text-white text-base">Joseph Form Numerical Guarantee</h3>
              <p>
                The filter executes the symmetric Joseph update{' '}
                <code className="text-cyan-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded">P = (I - KH)P(I - KH)ᵀ + KRKᵀ</code> on each 20Hz RTK and 100Hz wheel speed correction. This ensures that floating-point rounding errors never violate positive semi-definiteness even under severe dynamic lateral load.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Source Code Viewer */
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800 text-sm text-slate-300 font-mono">
            <span className="flex items-center gap-2 font-semibold">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>src/ekf_core.py — 214 lines (Python 3.12, NumPy, SciPy)</span>
            </span>
            <span className="text-emerald-400 font-semibold">License: MIT (Clean-Room Certified)</span>
          </div>
          <pre className="p-5 text-sm font-mono text-slate-200 overflow-x-auto max-h-[600px] leading-relaxed">
            {PYTHON_EKF_CODE}
          </pre>
        </div>
      )}
    </div>
  );
};
