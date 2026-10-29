import React, { useState, useEffect } from 'react';
import { Radio, Send, Play, Pause, Copy, Check, Code, Globe, Shield } from 'lucide-react';
import { TelemetryState } from '../../types/telemetry';

interface OpenApiContractTabProps {
  telemetry: TelemetryState;
}

export const OpenApiContractTab: React.FC<OpenApiContractTabProps> = ({ telemetry }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/v1/telemetry/latest');
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [isCallingApi, setIsCallingApi] = useState(false);
  const [isWsStreaming, setIsWsStreaming] = useState(false);
  const [wsFrames, setWsFrames] = useState<Array<{
    seq: number;
    timestamp: string;
    wheelSpeedsRpm: [number, number, number, number];
    eaxleVolts: number;
    drsToeDeg: number;
    yawRateDegS: number;
  }>>([]);
  const [copiedSpec, setCopiedSpec] = useState(false);

  // WebSocket streamer simulation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isWsStreaming) {
      interval = setInterval(() => {
        const now = new Date().toISOString();
        const baseRpm = Math.round(telemetry.speedMph * 14.2);
        setWsFrames((prev) => [
          {
            seq: (prev[0]?.seq || 104800) + 1,
            timestamp: now,
            wheelSpeedsRpm: [
              baseRpm + Math.round(Math.random() * 4 - 2),
              baseRpm + Math.round(Math.random() * 4 - 2),
              baseRpm + Math.round(Math.random() * 4 - 2),
              baseRpm + Math.round(Math.random() * 4 - 2),
            ],
            eaxleVolts: +(288.4 + Math.random() * 1.2).toFixed(1),
            drsToeDeg: +(telemetry.drsAngleDeg + (Math.random() * 0.04 - 0.02)).toFixed(2),
            yawRateDegS: +(telemetry.yawRateDegPerSec + (Math.random() * 0.2 - 0.1)).toFixed(2),
          },
          ...prev.slice(0, 5),
        ]);
      }, 250);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWsStreaming, telemetry]);

  const handleExecuteRequest = () => {
    setIsCallingApi(true);
    setApiResponse(null);

    setTimeout(() => {
      setIsCallingApi(false);
      if (selectedEndpoint === '/api/v1/telemetry/latest') {
        setApiResponse(JSON.stringify({
          status: 'success',
          timestamp: new Date().toISOString(),
          vehicle_id: 'GF-T3-199-TALH17',
          speed_mph: telemetry.speedMph,
          torque_split: {
            front_pct: telemetry.frontTorqueSplit,
            rear_pct: telemetry.rearTorqueSplit,
            mode: telemetry.frontTorqueSplit > 60 ? 'CRUISE_EFFICIENCY' : telemetry.frontTorqueSplit < 30 ? 'CATAPULT_EXIT' : 'DYNAMIC_BALANCED'
          },
          drs_telemetry: {
            commanded_toe_deg: telemetry.drsAngleDeg,
            actuator_feedback_deg: telemetry.drsAngleDeg,
            phase_regime: telemetry.speedMph < 31.0 ? 'COUNTER_PHASE_AGILE' : 'IN_PHASE_STABILITY',
            rack_stepper_current_amps: 4.82
          },
          powertrain_load: {
            gas_engine_kw: Math.round(telemetry.engineHp * 0.7457),
            front_motor_1nm_kw: telemetry.frontMotorKw,
            rear_eaxle_inverter_kw: telemetry.rearEaxleKw,
            combined_torque_nm: Math.round(telemetry.throttlePercent * 5.5)
          },
          cryptographic_nonce: telemetry.nonce,
          hmac_signature: telemetry.ledgerHmac
        }, null, 2));
      } else if (selectedEndpoint === '/api/v1/battery/bipolar-nimh/status') {
        setApiResponse(JSON.stringify({
          pack_architecture: 'BIPOLAR_NiMH_288V',
          state_of_charge_pct: 68.4,
          terminal_voltage_volts: 291.6,
          thermal_metrics: {
            mean_cell_temp_c: 34.2,
            peak_cell_temp_c: 36.1,
            gradient_delta_c: 1.9,
            quarantine_threshold_c: 8.5,
            safety_isolation_state: 'ARMED_NORMAL'
          },
          cooling_loop: {
            chilled_refrigerant_flow_lpm: 12.4,
            inlet_temp_c: 18.2
          }
        }, null, 2));
      } else if (selectedEndpoint === '/api/v1/dual_vector_torque/setpoint') {
        setApiResponse(JSON.stringify({
          status: 'ACCEPTED',
          message: 'DualVectorTorque dynamic torque arbitration override accepted by master inverter ECU.',
          applied_setpoint: {
            front_torque_ratio: 0.20,
            rear_torque_ratio: 0.80,
            ramp_rate_ms: 12,
            override_lease_seconds: 5.0
          },
          safety_governor: {
            esc_intervention: false,
            slip_ratio_rear: 0.04
          }
        }, null, 2));
      }
    }, 300);
  };

  const copySpec = () => {
    navigator.clipboard.writeText(openApiJsonSpec);
    setCopiedSpec(true);
    setTimeout(() => setCopiedSpec(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-white font-display mb-1 flex items-center gap-2">
              <Globe className="w-7 h-7 text-cyan-400" />
              OpenAPI 3.1 & Telemetry Gateway Contract
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Standardized REST & 2,500 Hz streaming WebSocket protocols exposing raw 4-wheel speeds, eAxle inverter phase currents, DRS resolver angles, and yaw rate telemetry.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-lg font-bold">
              OpenAPI 3.1.0 Strict
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Sandbox & WebSocket Streamer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: REST Sandbox (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Code className="w-5 h-5 text-amber-400" />
              REST API Explorer
            </span>
            <span className="text-xs font-mono text-slate-400">Base URL: /api/v1</span>
          </h3>

          <div className="space-y-2">
            <label className="text-slate-300 text-sm font-medium">Select Endpoint:</label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { method: 'GET', path: '/api/v1/telemetry/latest', desc: 'Fetch latest DUAL_VECTOR_TORQUE & DRS state' },
                { method: 'GET', path: '/api/v1/battery/bipolar-nimh/status', desc: 'Bipolar NiMH pack thermal telemetry' },
                { method: 'POST', path: '/api/v1/dual_vector_torque/setpoint', desc: 'Override torque vectoring setpoint' },
              ].map((ep) => (
                <button
                  key={ep.path}
                  onClick={() => {
                    setSelectedEndpoint(ep.path);
                    setApiResponse(null);
                  }}
                  className={`p-3 rounded-lg text-left border transition-all ${
                    selectedEndpoint === ep.path
                      ? 'bg-slate-850 border-amber-500/50'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-mono text-sm">
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded text-xs ${
                        ep.method === 'GET'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="text-white font-semibold">{ep.path}</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">{ep.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleExecuteRequest}
            disabled={isCallingApi}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-slate-950 font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {isCallingApi ? 'Dispatching HTTP Request...' : 'Send Test Request'}
          </button>

          <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs text-slate-300 border border-slate-800 min-h-[220px] max-h-[300px] overflow-auto">
            {isCallingApi ? (
              <div className="flex items-center gap-2 text-slate-400 py-8 justify-center">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Processing request...
              </div>
            ) : apiResponse ? (
              <pre>{apiResponse}</pre>
            ) : (
              <div className="text-slate-500 py-8 text-center">
                Click "Send Test Request" to invoke the endpoint and inspect payload response.
              </div>
            )}
          </div>
        </div>

        {/* Right: Live WebSocket 2,500 Hz Inverter Stream Simulator (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-cyan-400" />
              WebSocket Live Stream
            </h3>
            <button
              onClick={() => setIsWsStreaming(!isWsStreaming)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${
                isWsStreaming
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30'
              }`}
            >
              {isWsStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isWsStreaming ? 'Stop Stream' : 'Connect 2,500 Hz Stream'}
            </button>
          </div>

          <div className="text-slate-400 text-sm">
            Endpoint: <code className="text-cyan-400 font-mono">ws://localhost:8080/ws/v1/telemetry/stream</code>
          </div>

          <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs border border-slate-800 min-h-[320px] max-h-[360px] overflow-auto space-y-2">
            {wsFrames.length > 0 ? (
              wsFrames.map((f) => (
                <div key={f.seq} className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-300 space-y-1">
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span className="text-cyan-400 font-bold">FRAME #{f.seq}</span>
                    <span>{f.timestamp.split('T')[1]}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[12px] pt-1">
                    <div>
                      <span className="text-slate-500">4-Wheel RPM: </span>
                      <span className="text-white">[{f.wheelSpeedsRpm.join(', ')}]</span>
                    </div>
                    <div>
                      <span className="text-slate-500">eAxle DC Bus: </span>
                      <span className="text-emerald-400 font-bold">{f.eaxleVolts} V</span>
                    </div>
                    <div>
                      <span className="text-slate-500">DRS Resolver: </span>
                      <span className="text-cyan-400 font-bold">{f.drsToeDeg > 0 ? `+${f.drsToeDeg}` : f.drsToeDeg}°</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Yaw Rate: </span>
                      <span className="text-amber-400 font-bold">{f.yawRateDegS}°/s</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-500 py-12 text-center">
                WebSocket is idle. Click "Connect 2,500 Hz Stream" to observe live sensor packets.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full OpenAPI 3.1 Specification JSON */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between bg-slate-950 px-5 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-mono font-bold text-cyan-400">
              openapi_v3_1_strict.json
            </span>
          </div>
          <button
            onClick={copySpec}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-mono bg-slate-850 px-2.5 py-1 rounded border border-slate-700 transition-colors"
          >
            {copiedSpec ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedSpec ? 'Copied' : 'Copy Spec JSON'}
          </button>
        </div>
        <div className="p-5 font-mono text-xs leading-relaxed overflow-x-auto bg-slate-950/60 max-h-[380px] text-slate-300">
          <pre>{openApiJsonSpec}</pre>
        </div>
      </div>
    </div>
  );
};

const openApiJsonSpec = `{
  "openapi": "3.1.0",
  "info": {
    "title": "GF-T3-199 Apex Executive Dual-Vector Performance Core High-Frequency Telemetry Gateway",
    "version": "1.0.0-PROD",
    "description": "Standardized OpenAPI 3.1 contract exposing DUAL_VECTOR_TORQUE AWD torque split, Dynamic Rear Steering resolver telemetry, and Bipolar NiMH pack diagnostics.",
    "license": {
      "name": "MIT Permissive",
      "url": "https://opensource.org/licenses/MIT"
    }
  },
  "servers": [
    {
      "url": "https://telemetry-gateway.ghostfactoryos.internal",
      "description": "Production Vehicle CAN Gateway"
    }
  ],
  "paths": {
    "/api/v1/telemetry/latest": {
      "get": {
        "summary": "Get latest consolidated DUAL_VECTOR_TORQUE & DRS vehicle state",
        "operationId": "getLatestTelemetry",
        "responses": {
          "200": {
            "description": "Consolidated telemetry state payload",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/TelemetryResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/battery/bipolar-nimh/status": {
      "get": {
        "summary": "Bipolar NiMH 288V traction pack health & thermal gradient metrics",
        "operationId": "getBipolarBatteryStatus",
        "responses": {
          "200": {
            "description": "Pack telemetry and thermal isolation state",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/BatteryStatusResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/dual_vector_torque/setpoint": {
      "post": {
        "summary": "Inject dynamic AWD override vector",
        "operationId": "setDualVectorTorqueVector",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/DualVectorTorqueOverrideRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Vector setpoint applied to inverter loop"
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "TelemetryResponse": {
        "type": "object",
        "required": ["timestamp", "vehicle_id", "torque_split", "drs_telemetry", "cryptographic_nonce"],
        "properties": {
          "timestamp": { "type": "string", "format": "date-time" },
          "vehicle_id": { "type": "string" },
          "speed_mph": { "type": "number", "minimum": 0 },
          "torque_split": {
            "type": "object",
            "properties": {
              "front_pct": { "type": "integer", "minimum": 20, "maximum": 100 },
              "rear_pct": { "type": "integer", "minimum": 0, "maximum": 80 },
              "mode": { "type": "string" }
            }
          },
          "drs_telemetry": {
            "type": "object",
            "properties": {
              "commanded_toe_deg": { "type": "number", "minimum": -4.0, "maximum": 4.0 },
              "phase_regime": { "type": "string", "enum": ["COUNTER_PHASE_AGILE", "IN_PHASE_STABILITY"] }
            }
          },
          "cryptographic_nonce": { "type": "integer" },
          "hmac_signature": { "type": "string", "minLength": 64, "maxLength": 64 }
        }
      }
    }
  }
}`;
