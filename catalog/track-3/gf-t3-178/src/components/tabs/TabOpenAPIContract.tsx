import React, { useState } from 'react';
import { Network, Copy, Check, Send, Radio, FileCode2 } from 'lucide-react';
import { OPENAPI_YAML_SPEC } from '../../data/openApiSpec';

export const TabOpenAPIContract: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<'ingest' | 'actuator' | 'boost' | 'ws'>('ingest');
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(OPENAPI_YAML_SPEC);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecute = () => {
    setExecuting(true);
    setApiResponse(null);
    setTimeout(() => {
      setExecuting(false);
      if (selectedEndpoint === 'ingest') {
        setApiResponse(
          JSON.stringify(
            {
              status: "CONVERGED",
              anti_phase_duty_cycle: 0.884,
              attenuation_achieved_db: -18.42,
              residual_cabin_db: 49.98,
              dac_response_latency_us: 185,
              hmac_signature: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            },
            null,
            2
          )
        );
      } else if (selectedEndpoint === 'actuator') {
        setApiResponse(
          JSON.stringify(
            {
              acknowledged: true,
              channel_mask: 15,
              target_gain_db: -18.4,
              phase_inversion_degrees: 180.0,
              dac_status: "ARMED_SYNCED",
              latency_us: 172,
            },
            null,
            2
          )
        );
      } else if (selectedEndpoint === 'boost') {
        setApiResponse(
          JSON.stringify(
            {
              engine_rpm: 2400,
              target_boost_psi: 17.20,
              actual_boost_psi: 16.95,
              wastegate_solenoid_pwm: 44.8,
              overshoot_quarantine: false,
              manifold_temp_celsius: 38.4,
            },
            null,
            2
          )
        );
      } else {
        setApiResponse(
          JSON.stringify(
            {
              websocket_status: "101 Switching Protocols",
              protocol: "RFC-6455 Binary Stream",
              streaming_frequency_hz: 2000,
              connected_clients: 1,
              frame_payload_bytes: 64,
            },
            null,
            2
          )
        );
      }
    }, 280);
  };

  return (
    <div className="space-y-8">
      {/* OpenAPI Overview & Endpoints */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Network className="w-8 h-8 text-amber-400" />
              OpenAPI 3.1 & WebSocket Flagship Contract
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Contract specifications for cabin interior microphone stream ingestion, active speaker anti-phase duty cycle commands, and engine load broadcast.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyYaml}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-semibold text-sm transition-colors cursor-pointer shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
            <span>{copied ? 'Copied YAML' : 'Copy OpenAPI 3.1 YAML'}</span>
          </button>
        </div>

        {/* Endpoint Selector Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { setSelectedEndpoint('ingest'); setApiResponse(null); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              selectedEndpoint === 'ingest'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <span className="font-mono text-emerald-400 mr-2">POST</span>
            /v1/telemetry/microphone-stream
          </button>

          <button
            type="button"
            onClick={() => { setSelectedEndpoint('actuator'); setApiResponse(null); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              selectedEndpoint === 'actuator'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <span className="font-mono text-emerald-400 mr-2">POST</span>
            /v1/actuators/anti-phase-command
          </button>

          <button
            type="button"
            onClick={() => { setSelectedEndpoint('boost'); setApiResponse(null); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              selectedEndpoint === 'boost'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <span className="font-mono text-cyan-400 mr-2">GET</span>
            /v1/engine/boost-telemetry
          </button>

          <button
            type="button"
            onClick={() => { setSelectedEndpoint('ws'); setApiResponse(null); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              selectedEndpoint === 'ws'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <span className="font-mono text-purple-400 mr-2">WS</span>
            /v1/stream/cabin-acoustic
          </button>
        </div>

        {/* Interactive Endpoint Playground */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Payload */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-sm font-mono text-slate-300">
                <span>REQUEST PAYLOAD</span>
                <span className="text-amber-400">Content-Type: application/json</span>
              </div>
              <pre className="mt-3 text-sm font-mono text-slate-200 overflow-x-auto leading-relaxed">
                {selectedEndpoint === 'ingest' &&
`{
  "timestamp_ns": 1776037800000000000,
  "sequence_id": 1048580,
  "engine_rpm": 2400,
  "mic_channels_db": [68.4, 67.9, 69.1, 68.8],
  "current_boost_psi": 16.92
}`}
                {selectedEndpoint === 'actuator' &&
`{
  "channel_mask": 15,
  "target_gain_db": -18.4,
  "phase_inversion_degrees": 180.0
}`}
                {selectedEndpoint === 'boost' &&
`// GET /v1/engine/boost-telemetry
// Headers:
// Authorization: Bearer <HMAC_AUTH_TOKEN>
// X-Vehicle-VIN: JTHB15FF1M0017800`}
                {selectedEndpoint === 'ws' &&
`// UPGRADE GET /v1/stream/cabin-acoustic
// Connection: Upgrade
// Upgrade: websocket
// Sec-WebSocket-Protocol: gf-t3-audio-v1`}
              </pre>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleExecute}
                disabled={executing}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-colors cursor-pointer"
              >
                {selectedEndpoint === 'ws' ? <Radio className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                <span>
                  {executing
                    ? 'Transmitting Frame...'
                    : selectedEndpoint === 'ws'
                    ? 'Connect WebSocket Handshake'
                    : 'Dispatch API Request'}
                </span>
              </button>
            </div>
          </div>

          {/* Response Payload */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-sm font-mono text-slate-300">
                <span>SIMULATED RESPONSE</span>
                <span className="text-emerald-400">Status: 200 OK</span>
              </div>
              {apiResponse ? (
                <pre className="mt-3 text-sm font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                  <code>{apiResponse}</code>
                </pre>
              ) : (
                <div className="py-12 text-center text-sm text-slate-400 font-mono">
                  Click &ldquo;Dispatch API Request&rdquo; to execute request against the Cloud Run harness contract.
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between text-sm text-slate-400 font-mono">
              <span>Latency: 185 µs</span>
              <span>HMAC: Validated</span>
            </div>
          </div>
        </div>

        {/* Full YAML Specification Viewer */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <FileCode2 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xl font-bold text-white">Full OpenAPI 3.1.0 Contract Source</h3>
          </div>
          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 overflow-x-auto max-h-[360px] leading-relaxed">
            <code>{OPENAPI_YAML_SPEC}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
