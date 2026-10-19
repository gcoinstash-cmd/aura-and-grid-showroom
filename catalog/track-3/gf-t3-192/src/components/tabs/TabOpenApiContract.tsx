import React, { useState } from 'react';
import { Send, FileCode, Check, Copy, Radio, Activity, Terminal } from 'lucide-react';
import { ApiTestResult } from '../../types/telemetry';

const OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "Heavy Overland Dynamics Platform High-Output Multi-Node Core DUAL_VECTOR_TORQUE DRS Service Engine API",
    version: "1.0.0-PROD",
    description: "Real-time CAN-FD Dynamic Rear Steering arbitration and DUAL_VECTOR_TORQUE e-Axle torque distribution service",
    contact: {
      name: "Ghost FactoryOS deterministic production Systems",
      url: "https://acquire.com"
    },
    license: {
      name: "MIT Permissive",
      url: "https://opensource.org/licenses/MIT"
    }
  },
  servers: [
    {
      url: "https://drs-engine-prod.internal",
      description: "Automotive On-Vehicle Edge Container (Containerd)"
    },
    {
      url: "wss://drs-stream.internal/v1/telemetry/stream",
      description: "Low-Latency CAN-FD WebSocket Telemetry Stream"
    }
  ],
  paths: {
    "/api/v1/drs/telemetry/frame": {
      post: {
        summary: "Ingest CAN-FD Frame & Arbitrate Rear Toe",
        description: "Evaluates anti-phase (<80 km/h) or in-phase (>=80 km/h) rear toe deflection and commits HMAC ledger entry.",
        operationId: "ingestDrsFrame",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["speed_kmh", "steering_wheel_deg", "lateral_accel_g", "rack_feedback_mm"],
                properties: {
                  speed_kmh: { type: "number", minimum: 0, maximum: 250, description: "Vehicle ground speed in km/h" },
                  steering_wheel_deg: { type: "number", minimum: -540, maximum: 540, description: "Driver steering wheel angle" },
                  lateral_accel_g: { type: "number", minimum: -1.5, maximum: 1.5, description: "IMU lateral acceleration in G" },
                  yaw_rate_deg_s: { type: "number", description: "Z-axis rotational angular velocity" },
                  rack_feedback_mm: { type: "number", description: "Ballscrew linear position sensor (mm)" },
                  bldc_current_amps: { type: "number", description: "Dual-motor stator phase current (A)" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Arbitration executed within <0.5ms cycle limit",
            headers: {
              "X-DRS-Cycle-Time": { schema: { type: "string" }, description: "Execution duration in microseconds" },
              "X-HMAC-Digest": { schema: { type: "string" }, description: "Recursive SHA256 chain token" }
            },
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", enum: ["NOMINAL", "QUARANTINED"] },
                    front_wheel_angle_deg: { type: "number" },
                    target_rear_toe_deg: { type: "number" },
                    phase_mode: { type: "string" },
                    dual_vector_torque_front_pct: { type: "number" },
                    dual_vector_torque_rear_pct: { type: "number" },
                    turning_radius_m: { type: "number" },
                    quarantine_active: { type: "boolean" },
                    block_hmac: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/drs/status/actuator": {
      get: {
        summary: "Dual-Redundant BLDC Actuator Health",
        description: "Queries stator thermals, resolver winding offset, and ballscrew backlash calibration.",
        responses: {
          "200": {
            description: "Actuator hardware status OK"
          }
        }
      }
    },
    "/api/v1/ledger/audit/chain": {
      get: {
        summary: "Verify Ledger HMAC Continuity",
        description: "Recalculates cryptographic root hash across the active partition.",
        parameters: [
          { name: "start_nonce", in: "query", schema: { type: "integer" } },
          { name: "end_nonce", in: "query", schema: { type: "integer" } }
        ]
      }
    }
  }
};

export const TabOpenApiContract: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/v1/drs/telemetry/frame');
  const [method, setMethod] = useState<'POST' | 'GET'>('POST');
  const [reqPayload, setReqPayload] = useState<string>(
    JSON.stringify(
      {
        speed_kmh: 88.5,
        steering_wheel_deg: 45.0,
        lateral_accel_g: 0.38,
        yaw_rate_deg_s: 4.2,
        rack_feedback_mm: 2.82,
        bldc_current_amps: 14.6
      },
      null,
      2
    )
  );
  const [activeTab, setActiveTab] = useState<'tester' | 'raw'>('tester');
  const [testResult, setTestResult] = useState<ApiTestResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSelectEndpoint = (endpoint: string, meth: 'POST' | 'GET') => {
    setSelectedEndpoint(endpoint);
    setMethod(meth);
    if (endpoint === '/api/v1/drs/status/actuator') {
      setReqPayload('{}');
    } else if (endpoint === '/api/v1/ledger/audit/chain') {
      setReqPayload('{\n  "start_nonce": 1000000,\n  "end_nonce": 1000150\n}');
    } else {
      setReqPayload(
        JSON.stringify(
          {
            speed_kmh: 88.5,
            steering_wheel_deg: 45.0,
            lateral_accel_g: 0.38,
            yaw_rate_deg_s: 4.2,
            rack_feedback_mm: 2.82,
            bldc_current_amps: 14.6
          },
          null,
          2
        )
      );
    }
  };

  const handleRunRequest = () => {
    setIsExecuting(true);
    setTimeout(() => {
      let parsed = {};
      try {
        parsed = JSON.parse(reqPayload);
      } catch {
        parsed = {};
      }

      const isHighSpeed = (parsed as { speed_kmh?: number }).speed_kmh
        ? (parsed as { speed_kmh: number }).speed_kmh >= 80
        : true;

      const resBody =
        selectedEndpoint === '/api/v1/drs/status/actuator'
          ? {
              status: "OPERATIONAL",
              bldc_primary_winding_temp_c: 48.2,
              bldc_secondary_winding_temp_c: 47.9,
              resolver_offset_deg: 0.04,
              ballscrew_backlash_um: 12.4,
              bus_voltage_v: 13.82,
              can_fd_baud_mbps: 5.0,
              dual_ecu_sync: "LOCK"
            }
          : selectedEndpoint === '/api/v1/ledger/audit/chain'
          ? {
              chain_continuity: "VERIFIED_VALID",
              audited_nonce_range: [1000000, 1000150],
              tampering_detected: false,
              merkle_root_hmac: "e8b210f9a23c89d71c45d3e0b82f451084b23d91ae0b3c690248ad84a32cf109",
              execution_time_ms: 1.14
            }
          : {
              status: "NOMINAL",
              front_wheel_angle_deg: 3.04,
              target_rear_toe_deg: isHighSpeed ? 0.62 : -0.84,
              phase_mode: isHighSpeed ? "IN_PHASE_STABILIZATION" : "ANTI_PHASE_TURNING",
              dual_vector_torque_front_pct: 42.0,
              dual_vector_torque_rear_pct: 58.0,
              turning_radius_m: isHighSpeed ? 72.4 : 5.28,
              rack_linear_displacement_mm: isHighSpeed ? 2.635 : -3.57,
              divergence_error_mm: 0.012,
              quarantine_active: false,
              block_hmac: "7c390fa9831d45bc890f1246d89aef2981034bc892a0149df28a4901ba34ce90"
            };

      setTestResult({
        endpoint: selectedEndpoint,
        method,
        status: 200,
        statusText: "OK",
        latencyMs: 0.38,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-DRS-Cycle-Time": "382.4 µs",
          "X-HMAC-Digest": "7c390fa9831d45bc890f1246d89aef2981034bc892a0149df28a4901ba34ce90",
          "X-ECU-Redundancy": "DUAL_LOCK_PASS"
        },
        responseBody: resBody
      });
      setIsExecuting(false);
    }, 280);
  };

  const handleCopySpec = () => {
    navigator.clipboard.writeText(JSON.stringify(OPENAPI_SPEC, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Radio className="w-8 h-8 text-cyan-400" />
              OpenAPI 3.1 & Telemetry Protocol Specification
            </h2>
            <p className="text-slate-300 text-base leading-relaxed mt-1">
              Deterministic sub-millisecond REST endpoints & WebSocket CAN-FD event stream contracts for vehicle body electronics integration.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('tester')}
              className={`px-3.5 py-2 text-sm font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === 'tester'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white bg-slate-800'
              }`}
            >
              <Terminal className="w-4 h-4" />
              Interactive API Runner
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-3.5 py-2 text-sm font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === 'raw'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white bg-slate-800'
              }`}
            >
              <FileCode className="w-4 h-4" />
              OpenAPI 3.1 JSON
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'tester' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Endpoint List & Payload Editor (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-400" />
                Select DRS Service Endpoint
              </h3>

              <div className="space-y-2">
                <button
                  onClick={() => handleSelectEndpoint('/api/v1/drs/telemetry/frame', 'POST')}
                  className={`w-full text-left p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedEndpoint === '/api/v1/drs/telemetry/frame'
                      ? 'bg-amber-500/15 border-amber-500/60 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs px-2 py-0.5 rounded">
                      POST
                    </span>
                    <span className="font-mono text-sm font-bold text-white">/api/v1/drs/telemetry/frame</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Ingest high-speed CAN-FD telemetry frame and arbitrate dynamic rear toe angle.
                  </p>
                </button>

                <button
                  onClick={() => handleSelectEndpoint('/api/v1/drs/status/actuator', 'GET')}
                  className={`w-full text-left p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedEndpoint === '/api/v1/drs/status/actuator'
                      ? 'bg-amber-500/15 border-amber-500/60 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-500/20 text-blue-400 font-mono font-bold text-xs px-2 py-0.5 rounded">
                      GET
                    </span>
                    <span className="font-mono text-sm font-bold text-white">/api/v1/drs/status/actuator</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Query dual-redundant BLDC rear actuator thermals, windings, and resolver state.
                  </p>
                </button>

                <button
                  onClick={() => handleSelectEndpoint('/api/v1/ledger/audit/chain', 'GET')}
                  className={`w-full text-left p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedEndpoint === '/api/v1/ledger/audit/chain'
                      ? 'bg-amber-500/15 border-amber-500/60 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-500/20 text-blue-400 font-mono font-bold text-xs px-2 py-0.5 rounded">
                      GET
                    </span>
                    <span className="font-mono text-sm font-bold text-white">/api/v1/ledger/audit/chain</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Cryptographic audit validating zero tampering in recursive HMAC-SHA256 ledger chains.
                  </p>
                </button>
              </div>

              {/* Request Payload Editor */}
              <div>
                <label className="text-slate-300 font-semibold text-sm mb-1.5 block">
                  Request JSON Body:
                </label>
                <textarea
                  value={reqPayload}
                  onChange={(e) => setReqPayload(e.target.value)}
                  rows={7}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                onClick={handleRunRequest}
                disabled={isExecuting}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg"
              >
                {isExecuting ? (
                  <span>Dispatching CAN-FD Cycle...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 fill-current" />
                    <span>Dispatch API Test Request</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Live Response Inspector (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  Real-time Response Inspector
                </h3>
                {testResult && (
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold px-2 py-0.5 rounded">
                      {testResult.status} {testResult.statusText}
                    </span>
                    <span className="bg-slate-800 text-slate-300 text-xs font-mono px-2 py-0.5 rounded">
                      {testResult.latencyMs} ms
                    </span>
                  </div>
                )}
              </div>

              {testResult ? (
                <div className="space-y-3">
                  {/* Headers */}
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Response Headers
                    </span>
                    <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 font-mono text-xs text-slate-300 space-y-0.5">
                      {Object.entries(testResult.headers).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-amber-400 font-semibold">{k}:</span>
                          <span className="text-slate-300 truncate max-w-[280px]">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Body */}
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      JSON Response Payload
                    </span>
                    <pre className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 font-mono text-xs text-emerald-300 overflow-x-auto max-h-[300px]">
                      <code>{JSON.stringify(testResult.responseBody, null, 2)}</code>
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-8 text-center text-slate-500 flex flex-col items-center justify-center min-h-[300px]">
                  <Send className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-sm font-medium">Click "Dispatch API Test Request" to simulate real-time telemetry execution.</p>
                </div>
              )}
            </div>

            {/* WebSocket Stream Protocol Spec Note */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1">
                <Radio className="w-4 h-4" />
                WebSocket 2,500 Hz Broadcast Contract:
              </div>
              <p className="text-slate-400 leading-relaxed font-sans">
                Real-time CAN-FD frames are broadcast over <code className="text-white font-mono bg-slate-950 px-1 py-0.5 rounded">wss://drs-stream.internal/v1/telemetry/stream</code> using packed binary protobuf / JSON-LD schemas with zero GC overhead.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Raw OpenAPI 3.1 Spec Viewer */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-300 font-bold text-base flex items-center gap-2">
              <FileCode className="w-5 h-5 text-cyan-400" />
              OpenAPI 3.1 Specification Document
            </span>
            <button
              onClick={handleCopySpec}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold font-mono inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied Spec</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy OpenAPI JSON</span>
                </>
              )}
            </button>
          </div>

          <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-cyan-300 overflow-x-auto max-h-[460px] leading-relaxed">
            <code>{JSON.stringify(OPENAPI_SPEC, null, 2)}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
