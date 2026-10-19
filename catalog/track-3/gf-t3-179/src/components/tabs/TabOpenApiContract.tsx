/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Network, Copy, Check, Radio, Send, Play, Square, Code, ArrowUpRight } from 'lucide-react';
import { OPENAPI_SPECIFICATION } from '../../data/specContent';

export const TabOpenApiContract: React.FC = () => {
  const [copiedSpec, setCopiedSpec] = useState<boolean>(false);
  const [activeEndpoint, setActiveEndpoint] = useState<
    'WHEELSPEED' | 'TORQUE_DISPATCH' | 'BATTERY_SOC' | 'WEBSOCKET'
  >('TORQUE_DISPATCH');

  // Interactive Endpoint Tester State
  const [testThrottle, setTestThrottle] = useState<number>(0.85);
  const [testSteering, setTestSteering] = useState<number>(0.12);
  const [testFriction, setTestFriction] = useState<number>(0.95);
  const [responsePayload, setResponsePayload] = useState<string | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  // WebSocket Live Stream Simulation
  const [isStreamingWs, setIsStreamingWs] = useState<boolean>(false);
  const [wsMessages, setWsMessages] = useState<Array<{
    nonce: number;
    timestamp: number;
    fTorque: number;
    rTorque: number;
    bias: string;
    sig: string;
  }>>([]);

  useEffect(() => {
    let wsInterval: NodeJS.Timeout | null = null;
    if (isStreamingWs) {
      wsInterval = setInterval(() => {
        setWsMessages((prev) => {
          const nextNonce = (prev[0]?.nonce || 1048580) + 1;
          const newMsg = {
            nonce: nextNonce,
            timestamp: Date.now() * 1000,
            fTorque: +(180 + Math.random() * 40).toFixed(1),
            rTorque: +(120 + Math.random() * 45).toFixed(1),
            bias: `${Math.round(55 + Math.random() * 10)}:${Math.round(45 - Math.random() * 10)}`,
            sig: `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`,
          };
          return [newMsg, ...prev.slice(0, 7)];
        });
      }, 400);
    }
    return () => {
      if (wsInterval) clearInterval(wsInterval);
    };
  }, [isStreamingWs]);

  const handleDispatchTest = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setHttpStatus(200);

      if (activeEndpoint === 'TORQUE_DISPATCH') {
        const total = 550 * testThrottle;
        const rearRatio = 0.45;
        setResponsePayload(
          JSON.stringify(
            {
              cycle_id: 1048590,
              timestamp_ns: Date.now() * 1000000,
              front_torque_nm: +(total * (1 - rearRatio)).toFixed(2),
              rear_torque_nm: +(Math.min(169, total * rearRatio)).toFixed(2),
              front_ratio_pct: 55.0,
              rear_ratio_pct: 45.0,
              arbitration_latency_us: 118,
              hmac_sha256: '9a8b1c4e7d2f3a5e8c1b4d7f9a2e5c8b1a4d7f9a2e5c8b1a4d7f9a2e5c8b1a4d',
              ledger_status: 'COMMITTED_TO_POSTGRES_PARTITION',
            },
            null,
            2
          )
        );
      } else if (activeEndpoint === 'WHEELSPEED') {
        setResponsePayload(
          JSON.stringify(
            {
              status: 'ACKNOWLEDGED',
              arbitration_latency_us: 94,
              wheel_slip_detected: false,
              dual_vector_torque_mode: 'DYNAMIC_AWD_TRACTION',
              front_bias_pct: 62.5,
              rear_bias_pct: 37.5,
            },
            null,
            2
          )
        );
      } else if (activeEndpoint === 'BATTERY_SOC') {
        setResponsePayload(
          JSON.stringify(
            {
              pack_capacity_kwh: 18.1,
              state_of_charge_pct: 81.4,
              pack_temp_celsius: 33.8,
              dc_bus_voltage_v: 648.2,
              thermal_derate_factor: 1.0,
              liquid_coolant_flow_lpm: 15.6,
              cell_voltage_delta_mv: 12.0,
            },
            null,
            2
          )
        );
      }
    }, 280);
  };

  const handleCopySpec = () => {
    navigator.clipboard.writeText(OPENAPI_SPECIFICATION);
    setCopiedSpec(true);
    setTimeout(() => setCopiedSpec(false), 2200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Network className="w-5 h-5 text-cyan-400" />
              OpenAPI 3.1 & 1,000 Hz WebSocket Telemetry Contract
            </h2>
            <p className="text-[15px] text-slate-400">
              Low-latency JSON/binary protocols for raw 4-wheel speed ingestion, torque vector dispatch, and battery state streaming.
            </p>
          </div>
          <span className="text-[15px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-lg">
            OpenAPI 3.1.0 Validated
          </span>
        </div>

        {/* Endpoint Selector Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => {
              setActiveEndpoint('TORQUE_DISPATCH');
              setResponsePayload(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-[15px] font-mono font-semibold transition-all cursor-pointer ${
              activeEndpoint === 'TORQUE_DISPATCH'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            POST /torque/dispatch
          </button>
          <button
            onClick={() => {
              setActiveEndpoint('WHEELSPEED');
              setResponsePayload(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-[15px] font-mono font-semibold transition-all cursor-pointer ${
              activeEndpoint === 'WHEELSPEED'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            POST /telemetry/wheelspeed
          </button>
          <button
            onClick={() => {
              setActiveEndpoint('BATTERY_SOC');
              setResponsePayload(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-[15px] font-mono font-semibold transition-all cursor-pointer ${
              activeEndpoint === 'BATTERY_SOC'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            GET /phev/battery/soc
          </button>
          <button
            onClick={() => setActiveEndpoint('WEBSOCKET')}
            className={`px-3.5 py-1.5 rounded-lg text-[15px] font-mono font-semibold transition-all cursor-pointer ${
              activeEndpoint === 'WEBSOCKET'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            WSS /v1/stream (1 kHz)
          </button>
        </div>

        {/* Interactive Endpoint Sandbox */}
        {activeEndpoint !== 'WEBSOCKET' ? (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-[15px] font-mono">
                <span className="text-emerald-400 font-bold">HTTPS REST</span>
                <span className="text-slate-500">·</span>
                <span className="text-white">
                  {activeEndpoint === 'TORQUE_DISPATCH' && '/api/v1/torque/dispatch'}
                  {activeEndpoint === 'WHEELSPEED' && '/api/v1/telemetry/wheelspeed'}
                  {activeEndpoint === 'BATTERY_SOC' && '/api/v1/phev/battery/soc'}
                </span>
              </div>
              <button
                onClick={handleDispatchTest}
                disabled={isSending}
                type="button"
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-[15px] px-3.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? 'Dispatching...' : 'Execute Test Request'}</span>
              </button>
            </div>

            {/* Input Form for Torque Dispatch */}
            {activeEndpoint === 'TORQUE_DISPATCH' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-[15px] text-slate-400 mb-1">throttle_demand</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={testThrottle}
                    onChange={(e) => setTestThrottle(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono text-[15px]"
                  />
                </div>
                <div>
                  <label className="block text-[15px] text-slate-400 mb-1">steering_angle_rad</label>
                  <input
                    type="number"
                    step="0.02"
                    value={testSteering}
                    onChange={(e) => setTestSteering(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono text-[15px]"
                  />
                </div>
                <div>
                  <label className="block text-[15px] text-slate-400 mb-1">road_friction_mu</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="1"
                    value={testFriction}
                    onChange={(e) => setTestFriction(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono text-[15px]"
                  />
                </div>
              </div>
            )}

            {activeEndpoint === 'WHEELSPEED' && (
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 mb-4 text-[15px] font-mono text-slate-300">
                Payload: 4x Wheel Speed (FL: 84.2 rad/s, FR: 84.1 rad/s, RL: 84.3 rad/s, RR: 84.2 rad/s) + CRC32 checksum.
              </div>
            )}

            {/* Response Viewer */}
            {responsePayload && (
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[15px] font-bold text-slate-400 uppercase">Response JSON</span>
                  <span className="text-[15px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    HTTP {httpStatus} OK
                  </span>
                </div>
                <pre className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 text-[15px] font-mono text-emerald-300 overflow-x-auto">
                  {responsePayload}
                </pre>
              </div>
            )}
          </div>
        ) : (
          /* WebSocket Stream Sandbox */
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-indigo-400" />
                <span className="text-[15px] font-mono text-white font-semibold">
                  wss://telemetry.Heavy Overland Dynamics Platform-tx550h.dual_vector_torque/v1/stream
                </span>
              </div>
              <button
                onClick={() => setIsStreamingWs(!isStreamingWs)}
                type="button"
                className={`font-bold text-[15px] px-3.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isStreamingWs
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {isStreamingWs ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isStreamingWs ? 'Disconnect Stream' : 'Connect 1 kHz WebSocket'}</span>
              </button>
            </div>

            <div className="text-[15px] text-slate-400 mb-3 flex items-center justify-between font-mono">
              <span>Status: {isStreamingWs ? 'STREAMING ACTIVE (1,000 Hz Frames)' : 'IDLE (DISCONNECTED)'}</span>
              <span>Buffer: {wsMessages.length} frames</span>
            </div>

            <div className="bg-slate-900 rounded-lg border border-slate-800 p-3 min-h-[220px] max-h-[300px] overflow-y-auto space-y-2">
              {wsMessages.length === 0 ? (
                <div className="text-center text-slate-500 text-[15px] font-mono py-12">
                  Click &quot;Connect 1 kHz WebSocket&quot; to stream real-time telemetry frames.
                </div>
              ) : (
                wsMessages.map((msg) => (
                  <div
                    key={msg.nonce}
                    className="flex flex-wrap items-center justify-between p-2 rounded bg-slate-950 border border-slate-800/80 font-mono text-[15px] text-slate-300"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-bold">#{msg.nonce}</span>
                      <span className="text-slate-400">F: {msg.fTorque} Nm</span>
                      <span className="text-amber-400">R: {msg.rTorque} Nm</span>
                      <span className="text-cyan-400">Bias: {msg.bias}</span>
                    </div>
                    <div className="text-slate-500 text-xs">
                      SIG: {msg.sig}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* OpenAPI Specification YAML Viewer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 font-mono font-bold text-[15px]">openapi_v31_spec.yaml</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 text-[15px]">OpenAPI 3.1 & WebSocket Streaming Protocol</span>
          </div>
          <button
            onClick={handleCopySpec}
            type="button"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[15px] px-3.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedSpec ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSpec ? 'Copied YAML!' : 'Copy OpenAPI 3.1 YAML'}</span>
          </button>
        </div>
        <div className="p-4 bg-slate-950 max-h-[480px] overflow-y-auto">
          <pre className="text-[15px] font-mono text-slate-300 leading-relaxed overflow-x-auto">
            <code>{OPENAPI_SPECIFICATION}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
