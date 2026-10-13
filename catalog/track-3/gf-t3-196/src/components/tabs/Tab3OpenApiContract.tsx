import React, { useState } from 'react';
import { FileCode, Globe, Radio, Play, Check, Copy } from 'lucide-react';

export const Tab3OpenApiContract: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<'tick' | 'state' | 'direct4' | 'audit'>('tick');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [copiedYaml, setCopiedYaml] = useState(false);

  const handleTestRequest = () => {
    setIsCalling(true);
    setTimeout(() => {
      setIsCalling(false);
      if (selectedEndpoint === 'tick') {
        setTestResponse(JSON.stringify({
          status: "SUCCESS",
          code: 200,
          latency_us: 248,
          timestamp_ns: Date.now() * 1000000,
          data: {
            nonce: 1000009,
            rack_angle_deg: 3.42,
            steering_ratio: 12.43,
            haptic_torque_nm: 1.82,
            direct4_split: { front_pct: 65.0, rear_pct: 35.0 },
            active_can_bus: "BUS_A",
            divergence_check: "PASS (<0.40 deg)",
            hmac_sha256: "9a7f311c8901df4b423188d01f8e91cb319d67710c55ea9120e74b330e71ba02"
          }
        }, null, 2));
      } else if (selectedEndpoint === 'state') {
        setTestResponse(JSON.stringify({
          status: "ONLINE",
          vin: "JTJAAABA4P00196RZ",
          actuator_cycle_hz: 4000,
          yoke_range_deg: [-150.0, 150.0],
          rack_limit_deg: [-25.0, 25.0],
          can_redundancy: { bus_a: "HEALTHY", bus_b: "HEALTHY", active: "BUS_A" }
        }, null, 2));
      } else if (selectedEndpoint === 'direct4') {
        setTestResponse(JSON.stringify({
          front_e_axle_kw: 150,
          rear_e_axle_kw: 80,
          front_torque_nm: 172.9,
          rear_torque_nm: 93.1,
          distribution_mode: "DYNAMIC_CORNER_VECTORING"
        }, null, 2));
      } else {
        setTestResponse(JSON.stringify({
          genesis_nonce: 1000000,
          head_nonce: 1000009,
          chain_length: 10,
          merkle_root: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          cryptographic_status: "PRISTINE_VALIDATED"
        }, null, 2));
      }
    }, 300);
  };

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(`openapi: 3.1.0
info:
  title: Lexus RZ 450e Steer-by-Wire & DIRECT4 Telemetry API
  version: 1.0.0-PROD
paths:
  /v1/telemetry/sbw/tick:
    post:
      summary: Ingest 4,000 Hz SBW Real-Time Actuator Tick
  /v1/telemetry/sbw/state:
    get:
      summary: Get Steer-by-Wire Subsystem Health
  /v1/direct4/torque-split:
    post:
      summary: Direct4 Dual e-Axle Dynamic Torque Allocation
  /v1/audit/hmac-chain/latest:
    get:
      summary: Audit HMAC-SHA256 Monotonic Ledger Integrity`);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <FileCode className="w-7 h-7 text-emerald-400" />
              OpenAPI 3.1 & Telemetry Protocols
            </h2>
            <p className="text-slate-300 text-base mt-1">
              Production contracts for 4,000 Hz actuator ingestion, haptic force-feedback, inverter phase current telemetry, and WebSocket streaming.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyYaml}
              type="button"
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-mono font-bold flex items-center gap-2 transition cursor-pointer"
            >
              {copiedYaml ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copiedYaml ? 'Copied' : 'Copy Spec YAML'}</span>
            </button>
          </div>
        </div>

        {/* Endpoint Selector Tabs */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800">
          <button
            onClick={() => { setSelectedEndpoint('tick'); setTestResponse(null); }}
            className={`px-4 py-2 rounded-lg text-base font-bold flex items-center gap-2 transition cursor-pointer ${
              selectedEndpoint === 'tick'
                ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-xs px-2 py-0.5 rounded font-mono font-extrabold bg-emerald-500 text-slate-950">POST</span>
            <span>/v1/telemetry/sbw/tick</span>
          </button>

          <button
            onClick={() => { setSelectedEndpoint('state'); setTestResponse(null); }}
            className={`px-4 py-2 rounded-lg text-base font-bold flex items-center gap-2 transition cursor-pointer ${
              selectedEndpoint === 'state'
                ? 'bg-blue-500/20 border border-blue-500 text-blue-300'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-xs px-2 py-0.5 rounded font-mono font-extrabold bg-blue-500 text-slate-950">GET</span>
            <span>/v1/telemetry/sbw/state</span>
          </button>

          <button
            onClick={() => { setSelectedEndpoint('direct4'); setTestResponse(null); }}
            className={`px-4 py-2 rounded-lg text-base font-bold flex items-center gap-2 transition cursor-pointer ${
              selectedEndpoint === 'direct4'
                ? 'bg-purple-500/20 border border-purple-500 text-purple-300'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-xs px-2 py-0.5 rounded font-mono font-extrabold bg-purple-500 text-slate-950">POST</span>
            <span>/v1/direct4/torque-split</span>
          </button>

          <button
            onClick={() => { setSelectedEndpoint('audit'); setTestResponse(null); }}
            className={`px-4 py-2 rounded-lg text-base font-bold flex items-center gap-2 transition cursor-pointer ${
              selectedEndpoint === 'audit'
                ? 'bg-amber-500/20 border border-amber-500 text-amber-300'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-xs px-2 py-0.5 rounded font-mono font-extrabold bg-amber-500 text-slate-950">GET</span>
            <span>/v1/audit/hmac-chain/latest</span>
          </button>
        </div>

        {/* Live Playground Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Schema & Contract */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-bold text-slate-300 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-400" />
                  Contract Schema Definition
                </span>
                <span className="text-xs font-mono text-slate-400">JSON-Schema 2020-12</span>
              </div>

              {selectedEndpoint === 'tick' && (
                <div className="text-base text-slate-300 space-y-3 font-mono text-sm leading-relaxed">
                  <p className="text-slate-400 font-sans">
                    Ingests high-rate dual CAN-FD sensor frames and computes synchronous feedback torque for the One-Motion Grip reaction motor.
                  </p>
                  <div className="p-3 bg-slate-900 rounded border border-slate-800 text-xs">
                    <div className="font-bold text-amber-400 mb-1">Request Payload:</div>
{`{
  "nonce": 1000009,
  "speed_kmh": 65.4,
  "yoke_angle_deg": 42.5,
  "friction_mu": 1.0,
  "lateral_g": 0.35,
  "can_source_bus": "BUS_A"
}`}
                  </div>
                </div>
              )}

              {selectedEndpoint === 'state' && (
                <div className="text-base text-slate-300 space-y-3 font-mono text-sm">
                  <p className="text-slate-400 font-sans">
                    Reads instantaneous ASIL-D health status, dual CAN-FD bus diagnostic flags, and current steer rack calibration.
                  </p>
                  <div className="p-3 bg-slate-900 rounded border border-slate-800 text-xs text-blue-300">
                    Query parameters: none (Authenticated bearer token required).
                  </div>
                </div>
              )}

              {selectedEndpoint === 'direct4' && (
                <div className="text-base text-slate-300 space-y-3 font-mono text-sm">
                  <p className="text-slate-400 font-sans">
                    Computes real-time dynamic front/rear e-Axle torque split based on yaw acceleration and steering velocity.
                  </p>
                  <div className="p-3 bg-slate-900 rounded border border-slate-800 text-xs text-purple-300">
                    Front: 150 kW / 266 Nm | Rear: 80 kW / 168 Nm
                  </div>
                </div>
              )}

              {selectedEndpoint === 'audit' && (
                <div className="text-base text-slate-300 space-y-3 font-mono text-sm">
                  <p className="text-slate-400 font-sans">
                    Returns the root cryptographic anchor and Merkle tree state for institutional proof of zero tampering.
                  </p>
                  <div className="p-3 bg-slate-900 rounded border border-slate-800 text-xs text-amber-300">
                    Outputs verifiable HMAC-SHA256 integrity certificate.
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between">
              <span className="text-slate-400 text-sm font-mono">Simulated Latency: ~0.25 ms</span>
              <button
                onClick={handleTestRequest}
                disabled={isCalling}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isCalling ? 'Sending...' : 'Test Request'}</span>
              </button>
            </div>
          </div>

          {/* Response Payload Inspector */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-bold text-slate-300">Live JSON Response</span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                200 OK
              </span>
            </div>

            <div className="flex-1 min-h-[220px] bg-slate-900 p-4 rounded-lg border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto">
              {testResponse ? (
                <pre>{testResponse}</pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                  <Radio className="w-8 h-8 text-slate-600 animate-pulse" />
                  <span>Click "Test Request" to inspect live response payload.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* WebSocket Protocol Contract */}
        <div className="mt-6 p-5 bg-slate-950 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xl font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-400" />
              Real-Time WebSocket Stream Protocol
            </h4>
            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              wss://api.ghostfactoryos.internal/v1/telemetry/stream
            </span>
          </div>
          <p className="text-slate-300 text-base mb-3">
            Binary and JSON-RPC framed telemetry broadcast pushing 4,000 Hz downsampled to 200 Hz for web clients and institutional dashboards.
          </p>
          <pre className="bg-slate-900 p-3 rounded border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
{`// Client Subscribe Handshake
{ "op": "subscribe", "channel": "sbw_actuator_telemetry", "vin": "JTJAAABA4P00196RZ", "token": "JWT_ASIL_D_TOKEN" }

// Broadcast Frame (5ms interval)
{ "t": 1791845940000, "nonce": 1000010, "yoke": 42.5, "rack": 3.42, "ratio": 12.43, "haptic_nm": 1.82, "d4_front": 65, "d4_rear": 35, "can_bus": "BUS_A", "hmac": "9a7f31..." }`}
          </pre>
        </div>
      </div>
    </div>
  );
};
