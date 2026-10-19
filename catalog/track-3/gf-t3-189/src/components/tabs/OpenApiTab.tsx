import React, { useState } from 'react';
import { Network, Send, Copy, Check, Terminal, Radio, PlayCircle } from 'lucide-react';

export const OpenApiTab: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<'ingest' | 'state' | 'tune' | 'ws'>('ingest');
  const [speedMph, setSpeedMph] = useState(85);
  const [roofState, setRoofState] = useState<'STOWED' | 'CLOSED'>('STOWED');
  const [cowlDeflectionUm, setCowlDeflectionUm] = useState(24.5);
  const [damperForcePct, setDamperForcePct] = useState(80);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSpec, setCopiedSpec] = useState(false);

  const openApiYaml = `openapi: 3.1.0
info:
  title: GF-T3-189 Heavy Overland Dynamics Platform High-Aero Grand Touring Telemetry Core Structural Aero Telemetry Service
  version: 1.0.0
  description: High-throughput chassis strain telemetry and active cowl damping dispatch engine.
  contact:
    name: Ghost FactoryOS Systems Architecture LLC
    email: systems@ghostfactoryos.internal
servers:
  - url: https://gf-t3-189-aero-core.aistudio.run.app
    description: Production Google Cloud Run Cluster

paths:
  /api/v1/telemetry/ingest:
    post:
      summary: Ingest Chassis Strain & Cabin Acoustics
      operationId: ingestTelemetry
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [speed_mph, roof_state, cowl_deflection_um, crosswind_kt]
              properties:
                speed_mph:
                  type: number
                  minimum: 0
                  maximum: 200
                  example: 85.0
                roof_state:
                  type: string
                  enum: [STOWED, CLOSED]
                  example: STOWED
                cowl_deflection_um:
                  type: number
                  example: 24.5
                crosswind_kt:
                  type: number
                  example: 12.0
      responses:
        '200':
          description: Telemetry Ingested & Damping Coefficients Dispatched
          content:
            application/json:
              schema:
                type: object
                properties:
                  status: { type: string, example: "INGEST_SUCCESS" }
                  nonce: { type: integer, example: 1000043 }
                  damper_force_n: { type: number, example: 4850.0 }
                  hydraulic_pressure_psi: { type: number, example: 1980 }
                  suppression_delta_db: { type: number, example: -14.2 }
                  hmac_sha256: { type: string, example: "a89c72e45bf09931d5cb098ef11293a4087b22a910dc84bf8e937213ac991a02" }
                  latency_ms: { type: number, example: 1.4 }

  /api/v1/cowl/state:
    get:
      summary: Retrieve Real-Time Cowl Damper Kinematics
      operationId: getCowlState
      responses:
        '200':
          description: Live Cowl Damping State
          content:
            application/json:
              schema:
                type: object
                properties:
                  vin: { type: string, example: "JTHHP5AY0M5000189" }
                  harmonic_freq_hz: { type: number, example: 21.15 }
                  damper_effective_ns_m: { type: number, example: 5850.0 }
                  acoustic_spl_db: { type: number, example: 74.8 }

  /api/v1/damper/tune:
    post:
      summary: Dispatch Dynamic Hydraulic Damper Override
      operationId: tuneDamper
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [damper_force_pct, mode]
              properties:
                damper_force_pct: { type: number, minimum: 0, maximum: 100 }
                mode: { type: string, enum: [AUTONOMOUS, TRACK, COMFORT] }

  /ws/v1/stream/resonance:
    get:
      summary: 2,400 Hz WebSocket Binary Telemetry Stream
      description: Real-time RFC-6455 binary WebSocket stream of fiber-optic Bragg strain grating data.
`;

  const handleSendRequest = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (selectedEndpoint === 'ingest') {
        setLastResponse({
          status: 'INGEST_SUCCESS',
          nonce: 1000043,
          timestamp: new Date().toISOString(),
          vehicle_vin: 'JTHHP5AY0M5000189',
          speed_mph: speedMph,
          roof_state: roofState,
          cowl_deflection_um: cowlDeflectionUm,
          computed_damping: {
            damper_force_n: 4850.0,
            hydraulic_pressure_psi: 1980,
            suppression_delta_db: roofState === 'STOWED' ? -14.2 : -5.4,
            chassis_torsion_gain_pct: 18.4,
          },
          hmac_sha256: 'a89c72e45bf09931d5cb098ef11293a4087b22a910dc84bf8e937213ac991a02',
          quarantine_flag: false,
          server_latency_ms: 1.28,
        });
      } else if (selectedEndpoint === 'state') {
        setLastResponse({
          vin: 'JTHHP5AY0M5000189',
          hardware_revision: 'URZ100-COWL-CORE-V1',
          harmonic_freq_hz: roofState === 'STOWED' ? 21.15 : 27.2,
          cowl_micro_deflection_um: cowlDeflectionUm,
          damper_actuator_status: 'ARMED_CLOSED_LOOP',
          hydraulic_rail_temp_c: 42.6,
          active_notch_filter: '24.5_HZ_URZ100_V8_ENGINE_MODE',
        });
      } else if (selectedEndpoint === 'tune') {
        setLastResponse({
          status: 'DAMPER_COEFFICIENT_UPDATED',
          applied_force_pct: damperForcePct,
          target_damping_ns_m: 6850.0,
          actuator_response_time_ms: 0.85,
          lockout_safety_engaged: false,
        });
      } else {
        setLastResponse({
          protocol: 'WEBSOCKET_RFC_6455',
          endpoint: 'wss://gf-t3-189-aero-core.aistudio.run.app/ws/v1/stream/resonance',
          stream_rate: '2,400 Hz (416.6 μs cycle)',
          active_subscribers: 1,
          sample_packet: {
            t_ns: 1728701100000000,
            strain_a_pillar_left_ue: -42.8,
            strain_a_pillar_right_ue: 44.1,
            cowl_delta_um: 24.3,
            acoustic_spl_db: 74.8,
          },
        });
      }
    }, 400);
  };

  const copySpec = () => {
    navigator.clipboard.writeText(openApiYaml);
    setCopiedSpec(true);
    setTimeout(() => setCopiedSpec(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Network className="w-8 h-8 text-cyan-400" />
              OpenAPI 3.1 & WebSocket Streaming Protocol
            </h2>
            <p className="text-base text-slate-300 mt-1">
              Low-latency JSON REST contracts and 2,400 Hz binary WebSocket telemetry streaming for Heavy Overland Dynamics Platform High-Aero Grand Touring Telemetry Core chassis strain gauges.
            </p>
          </div>

          <button
            onClick={copySpec}
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-base px-4 py-2 rounded-lg flex items-center gap-2 self-start lg:self-auto cursor-pointer"
          >
            {copiedSpec ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copiedSpec ? 'Copied' : 'Copy OpenAPI YAML'}
          </button>
        </div>

        {/* Interactive Endpoint Selector */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <button
            onClick={() => { setSelectedEndpoint('ingest'); setLastResponse(null); }}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedEndpoint === 'ingest'
                ? 'bg-cyan-950/50 border-cyan-500 shadow-md'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                POST
              </span>
              <span className="text-xs font-mono text-slate-400">REST</span>
            </div>
            <div className="text-base font-bold text-white font-mono mt-1">/telemetry/ingest</div>
            <div className="text-sm text-slate-400 mt-1">Ingest Strain & Acoustic SPL</div>
          </button>

          <button
            onClick={() => { setSelectedEndpoint('state'); setLastResponse(null); }}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedEndpoint === 'state'
                ? 'bg-cyan-950/50 border-cyan-500 shadow-md'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-mono font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/30">
                GET
              </span>
              <span className="text-xs font-mono text-slate-400">REST</span>
            </div>
            <div className="text-base font-bold text-white font-mono mt-1">/cowl/state</div>
            <div className="text-sm text-slate-400 mt-1">Current Bulkhead Kinematics</div>
          </button>

          <button
            onClick={() => { setSelectedEndpoint('tune'); setLastResponse(null); }}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedEndpoint === 'tune'
                ? 'bg-cyan-950/50 border-cyan-500 shadow-md'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                POST
              </span>
              <span className="text-xs font-mono text-slate-400">REST</span>
            </div>
            <div className="text-base font-bold text-white font-mono mt-1">/damper/tune</div>
            <div className="text-sm text-slate-400 mt-1">Dispatch Hydraulic Override</div>
          </button>

          <button
            onClick={() => { setSelectedEndpoint('ws'); setLastResponse(null); }}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedEndpoint === 'ws'
                ? 'bg-cyan-950/50 border-cyan-500 shadow-md'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                WSS
              </span>
              <span className="text-xs font-mono text-slate-400">2,400 Hz</span>
            </div>
            <div className="text-base font-bold text-white font-mono mt-1">/stream/resonance</div>
            <div className="text-sm text-slate-400 mt-1">Binary RFC-6455 Timeseries</div>
          </button>
        </div>

        {/* Sandbox Test Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
            <span className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-amber-400" />
              Interactive API Request Sandbox
            </span>
            <button
              onClick={handleSendRequest}
              disabled={isLoading}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-base px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Send className="w-4 h-4" />
              {isLoading ? 'Executing...' : 'Execute Request'}
            </button>
          </div>

          {/* Dynamic parameter controls for the test */}
          {selectedEndpoint === 'ingest' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1">
                  speed_mph
                </label>
                <input
                  type="number"
                  value={speedMph}
                  onChange={(e) => setSpeedMph(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 text-white px-3 py-1.5 rounded-lg w-full font-mono text-base"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1">
                  roof_state
                </label>
                <select
                  value={roofState}
                  onChange={(e) => setRoofState(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 text-white px-3 py-1.5 rounded-lg w-full font-mono text-base"
                >
                  <option value="STOWED">STOWED (Open-Top)</option>
                  <option value="CLOSED">CLOSED (Coupe)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1">
                  cowl_deflection_um
                </label>
                <input
                  type="number"
                  value={cowlDeflectionUm}
                  onChange={(e) => setCowlDeflectionUm(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 text-white px-3 py-1.5 rounded-lg w-full font-mono text-base"
                />
              </div>
            </div>
          )}

          {/* cURL Command Preview */}
          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 font-mono text-sm text-cyan-300 mb-4 overflow-x-auto">
            {selectedEndpoint === 'ingest' && (
              <code>
                curl -X POST https://gf-t3-189-aero-core.aistudio.run.app/api/v1/telemetry/ingest \<br />
                &nbsp;&nbsp;-H &quot;Content-Type: application/json&quot; \<br />
                &nbsp;&nbsp;-d &apos;{JSON.stringify({ speed_mph: speedMph, roof_state: roofState, cowl_deflection_um: cowlDeflectionUm, crosswind_kt: 12.0 })}&apos;
              </code>
            )}
            {selectedEndpoint === 'state' && (
              <code>curl -X GET https://gf-t3-189-aero-core.aistudio.run.app/api/v1/cowl/state</code>
            )}
            {selectedEndpoint === 'tune' && (
              <code>
                curl -X POST https://gf-t3-189-aero-core.aistudio.run.app/api/v1/damper/tune \<br />
                &nbsp;&nbsp;-H &quot;Content-Type: application/json&quot; \<br />
                &nbsp;&nbsp;-d &apos;{JSON.stringify({ damper_force_pct: damperForcePct, mode: "AUTONOMOUS" })}&apos;
              </code>
            )}
            {selectedEndpoint === 'ws' && (
              <code>wscat -c wss://gf-t3-189-aero-core.aistudio.run.app/ws/v1/stream/resonance</code>
            )}
          </div>

          {/* Response Output */}
          {lastResponse && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  Response: 200 OK (Processed in {lastResponse.server_latency_ms || '0.94'} ms)
                </span>
                <span className="text-xs font-mono text-slate-400">Content-Type: application/json</span>
              </div>
              <pre className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-emerald-300 font-mono text-base overflow-x-auto">
                {JSON.stringify(lastResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
