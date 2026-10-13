import React, { useState } from 'react';
import { 
  Network, 
  Send, 
  Code, 
  Copy, 
  Check, 
  Radio, 
  CheckCircle, 
  Zap, 
  ArrowRight,
  ShieldCheck,
  Server
} from 'lucide-react';

interface TabOpenApiContractProps {
  currentGear: string;
  rpm: number;
  torqueNm: number;
  clutchPct: number;
}

export const TabOpenApiContract: React.FC<TabOpenApiContractProps> = ({
  currentGear,
  rpm,
  torqueNm,
  clutchPct,
}) => {
  const [activeEndpoint, setActiveEndpoint] = useState<
    'ssb-matrix' | 'clutch-telemetry' | 'shift-event' | 'torque-vectoring' | 'ws-stream'
  >('ssb-matrix');
  const [targetGearInput, setTargetGearInput] = useState<number>(4);
  const [clutchInput, setClutchInput] = useState<number>(0.42);
  const [autoBlipInput, setAutoBlipInput] = useState<boolean>(true);
  const [yawBiasInput, setYawBiasInput] = useState<'NEUTRAL' | 'REAR_BIAS_70' | 'FRONT_PULL'>('REAR_BIAS_70');

  const [simulatedResponse, setSimulatedResponse] = useState<string | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string> | null>(null);
  const [responseLatency, setResponseLatency] = useState<number | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [copiedSpec, setCopiedSpec] = useState<boolean>(false);

  const openApiSpecJson = JSON.stringify(
    {
      openapi: "3.1.0",
      info: {
        title: "GF-T3-190 Lexus Electrified Sport Powertrain & SSB API",
        version: "1.0.0-PROD",
        description:
          "Ultra-low latency microservices contract for Solid-State Battery management and clutch-by-wire synthetic torque dispatch.",
      },
      servers: [
        { url: "https://api.lexus-electrified.ghostfactory.io/v1", description: "Production Core Node" },
        { url: "wss://stream.lexus-electrified.ghostfactory.io/v1", description: "2800Hz Telemetry WebSocket" }
      ],
      paths: {
        "/telemetry/ssb-matrix": {
          get: {
            summary: "96-Cell Solid-State Battery Impedance Matrix",
            operationId: "getSSBMatrix",
            responses: {
              "200": {
                description: "Real-time cell impedance, temperatures, and dendrite margin",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        timestamp_ns: { type: "integer" },
                        pack_voltage_volts: { type: "number" },
                        mean_impedance_mohm: { type: "number" },
                        dendrite_safety_index: { type: "number" },
                        interlock_active: { type: "boolean" },
                        cells: { type: "array" }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/powertrain/clutch-telemetry": {
          get: {
            summary: "Clutch-By-Wire Haptic Telemetry & Bite Point State",
            operationId: "getClutchTelemetry",
            responses: { "200": { description: "Current clutch actuator position and slip coefficient" } }
          }
        },
        "/powertrain/shift-event": {
          post: {
            summary: "Simulated Gear Shift & Torque Cut Dispatch",
            operationId: "dispatchShiftEvent",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["target_gear", "clutch_pedal_pct"],
                    properties: {
                      target_gear: { type: "integer", enum: [-1, 0, 1, 2, 3, 4, 5, 6] },
                      clutch_pedal_pct: { type: "number", minimum: 0.0, maximum: 1.0 },
                      auto_rev_match: { type: "boolean" }
                    }
                  }
                }
              }
            },
            responses: { "200": { description: "Torque interruption parameters acknowledged" } }
          }
        },
        "/torque-vectoring/dispatch": {
          post: {
            summary: "Dual-Motor Front/Rear Sub-2-Second Vectoring Dispatch",
            operationId: "dispatchTorqueVectoring",
            responses: { "200": { description: "Front/Rear motor torque split applied in < 0.5ms" } }
          }
        }
      }
    },
    null,
    2
  );

  const handleExecuteCall = () => {
    setIsExecuting(true);
    setSimulatedResponse(null);

    setTimeout(() => {
      let resData: unknown = {};
      const fakeLatency = Math.round((0.7 + Math.random() * 0.6) * 10) / 10;
      const fakeSignature = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

      if (activeEndpoint === 'ssb-matrix') {
        resData = {
          status: "SUCCESS",
          timestamp_ns: Date.now() * 1000000,
          pack_voltage_volts: 784.2,
          mean_impedance_mohm: 0.842,
          max_cell_temp_celsius: 32.8,
          dendrite_safety_index: 0.998,
          quarantine_active: false,
          cells_evaluated: 96,
          cooling_chiller_flow_pct: 32.5,
          eis_sample_frequency_hz: 2800.0,
        };
      } else if (activeEndpoint === 'clutch-telemetry') {
        resData = {
          status: "SUCCESS",
          clutch_pedal_pct: clutchPct,
          pedal_displacement_mm: (clutchPct * 65.0).toFixed(1),
          bite_point_pct: 0.42,
          friction_transfer_ratio: clutchPct < 0.42 ? ((0.42 - clutchPct) / 0.42).toFixed(3) : 0.0,
          haptic_feedback_solenoid_vibe_hz: clutchPct > 0.35 && clutchPct < 0.5 ? 85.0 : 0.0,
          active_gear: currentGear,
          engine_rpm: Math.round(rpm),
        };
      } else if (activeEndpoint === 'shift-event') {
        resData = {
          status: "SHIFT_COMMITTED",
          target_gear: targetGearInput,
          torque_cut_duration_ms: 42,
          rev_blip_applied: autoBlipInput,
          target_engine_rpm: autoBlipInput ? 7450 : 5800,
          flywheel_inertia_recovered_j: 1420.5,
          acknowledged_by_ecu: true,
          next_state: "TORQUE_RESTORED",
        };
      } else if (activeEndpoint === 'torque-vectoring') {
        resData = {
          status: "VECTORING_DISPATCHED",
          yaw_mode: yawBiasInput,
          front_motor_kw: yawBiasInput === 'REAR_BIAS_70' ? 213.0 : 355.0,
          rear_motor_kw: yawBiasInput === 'REAR_BIAS_70' ? 497.0 : 355.0,
          total_combined_kw: 710.0,
          total_torque_nm: 1280.0,
          sub_2_sec_launch_readiness: 1.0,
          slip_angle_deg: 0.42,
        };
      } else if (activeEndpoint === 'ws-stream') {
        resData = {
          event: "STREAM_SUBSCRIBED",
          protocol: "binary-protobuf-2800hz",
          channel: "telemetry.ssb.powertrain.monotonic",
          compression: "lz4",
          nominal_bandwidth_kbps: 840,
          keepalive_ping_ms: 500,
          connection_id: "lexus-sport-ws-c841",
        };
      }

      setResponseHeaders({
        "Content-Type": "application/json; charset=utf-8",
        "X-GF-Protocol": "OpenAPI-3.1-Strict",
        "X-GF-Signature-SHA256": fakeSignature,
        "X-ECU-Latency-Ms": `${fakeLatency}ms`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      });
      setSimulatedResponse(JSON.stringify(resData, null, 2));
      setResponseLatency(fakeLatency);
      setIsExecuting(false);
    }, 350);
  };

  const copySpec = () => {
    navigator.clipboard.writeText(openApiSpecJson);
    setCopiedSpec(true);
    setTimeout(() => setCopiedSpec(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="cockpit-panel rounded-2xl p-6 border border-slate-800 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Network className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                OpenAPI 3.1 & 2,800 Hz WebSocket Telemetry Protocol
              </h2>
            </div>
            <p className="text-base text-slate-400 mt-1">
              Deterministic contracts for solid-state impedance ingestion, clutch-by-wire haptic feedback, and sub-2-second vectoring dispatch.
            </p>
          </div>

          <button
            type="button"
            onClick={copySpec}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            {copiedSpec ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied OpenAPI 3.1!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy OpenAPI 3.1 JSON</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* INTERACTIVE API EXPLORER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Endpoint Picker */}
        <div className="lg:col-span-4 cockpit-panel rounded-2xl p-5 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
            Contract Endpoints & Protocols
          </h3>

          <button
            type="button"
            onClick={() => setActiveEndpoint('ssb-matrix')}
            className={`w-full text-left p-3 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center justify-between ${
              activeEndpoint === 'ssb-matrix'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div>
              <span className="font-bold text-emerald-400 mr-2 font-mono">GET</span>
              <span className="text-slate-200 font-semibold">/telemetry/ssb-matrix</span>
              <p className="text-[11px] text-slate-500 mt-0.5">96-cell impedance & dendrite index</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </button>

          <button
            type="button"
            onClick={() => setActiveEndpoint('clutch-telemetry')}
            className={`w-full text-left p-3 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center justify-between ${
              activeEndpoint === 'clutch-telemetry'
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div>
              <span className="font-bold text-amber-400 mr-2 font-mono">GET</span>
              <span className="text-slate-200 font-semibold">/powertrain/clutch-telemetry</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Bite point & haptic solenoid status</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </button>

          <button
            type="button"
            onClick={() => setActiveEndpoint('shift-event')}
            className={`w-full text-left p-3 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center justify-between ${
              activeEndpoint === 'shift-event'
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div>
              <span className="font-bold text-cyan-400 mr-2 font-mono">POST</span>
              <span className="text-slate-200 font-semibold">/powertrain/shift-event</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Torque cut & rev blip execution</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </button>

          <button
            type="button"
            onClick={() => setActiveEndpoint('torque-vectoring')}
            className={`w-full text-left p-3 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center justify-between ${
              activeEndpoint === 'torque-vectoring'
                ? 'bg-purple-500/10 border-purple-500/40 text-purple-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div>
              <span className="font-bold text-purple-400 mr-2 font-mono">POST</span>
              <span className="text-slate-200 font-semibold">/torque-vectoring/dispatch</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Dual-motor front/rear yaw split</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </button>

          <button
            type="button"
            onClick={() => setActiveEndpoint('ws-stream')}
            className={`w-full text-left p-3 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center justify-between ${
              activeEndpoint === 'ws-stream'
                ? 'bg-red-500/10 border-red-500/40 text-red-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div>
              <span className="font-bold text-red-400 mr-2 font-mono">WS</span>
              <span className="text-slate-200 font-semibold">wss://stream.lexus...</span>
              <p className="text-[11px] text-slate-500 mt-0.5">2,800 Hz low-latency binary stream</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Right Column: Interactive Sandbox & Response Console */}
        <div className="lg:col-span-8 cockpit-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 font-mono text-sm">
                <span className="font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                  ENDPOINT TEST BENCH
                </span>
                <span className="text-slate-300">
                  {activeEndpoint === 'ssb-matrix' && 'GET /api/v1/telemetry/ssb-matrix'}
                  {activeEndpoint === 'clutch-telemetry' && 'GET /api/v1/powertrain/clutch-telemetry'}
                  {activeEndpoint === 'shift-event' && 'POST /api/v1/powertrain/shift-event'}
                  {activeEndpoint === 'torque-vectoring' && 'POST /api/v1/torque-vectoring/dispatch'}
                  {activeEndpoint === 'ws-stream' && 'CONNECT wss://stream.lexus-electrified.io/v1/telemetry-2800hz'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleExecuteCall}
                disabled={isExecuting}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs rounded-lg inline-flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isExecuting ? 'Dispatching...' : 'Execute Live API Call'}</span>
              </button>
            </div>

            {/* Configurable payload parameters if POST */}
            {activeEndpoint === 'shift-event' && (
              <div className="mb-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <label className="text-slate-400 block mb-1">Target Gear</label>
                  <select
                    value={targetGearInput}
                    onChange={(e) => setTargetGearInput(parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                  >
                    {[1, 2, 3, 4, 5, 6].map((g) => (
                      <option key={g} value={g}>Gear {g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Clutch Pedal Position</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={clutchInput}
                    onChange={(e) => setClutchInput(parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Auto-Blip Rev Match</label>
                  <button
                    type="button"
                    onClick={() => setAutoBlipInput(!autoBlipInput)}
                    className={`w-full py-1.5 rounded font-bold cursor-pointer ${
                      autoBlipInput ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {autoBlipInput ? 'ENABLED (Auto-Blip)' : 'DISABLED'}
                  </button>
                </div>
              </div>
            )}

            {activeEndpoint === 'torque-vectoring' && (
              <div className="mb-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-4 text-xs font-mono">
                <span className="text-slate-400">Yaw Torque Distribution:</span>
                {(['REAR_BIAS_70', 'NEUTRAL', 'FRONT_PULL'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setYawBiasInput(mode)}
                    className={`px-3 py-1 rounded font-bold cursor-pointer ${
                      yawBiasInput === mode ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}

            {/* Response Console */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 min-h-[220px]">
              {simulatedResponse ? (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-3 border-b border-slate-800/80 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        HTTP 200 OK
                      </span>
                      <span className="text-slate-400">
                        Bus Latency: <strong className="text-amber-400">{responseLatency}ms</strong>
                      </span>
                    </div>

                    <span className="text-emerald-400 text-[11px] truncate max-w-[280px]">
                      HMAC Sig: {responseHeaders?.['X-GF-Signature-SHA256']?.substring(0, 16)}...
                    </span>
                  </div>

                  <pre className="text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto max-h-60 overflow-y-auto">
                    {simulatedResponse}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-center font-mono text-xs">
                  <Server className="w-8 h-8 mb-2 opacity-40 text-amber-400" />
                  <span>Click "Execute Live API Call" to dispatch request to the simulated core.</span>
                  <span className="text-[11px] text-slate-600 mt-1">
                    Latency benchmark guaranteed &lt; 2.0ms under full bus load.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Protocol Compliance: RFC 9110 & OpenAPI 3.1.0 Standard</span>
            <span className="text-emerald-400 font-bold">HMAC Signature Header: Enforced</span>
          </div>
        </div>
      </div>
    </div>
  );
};
