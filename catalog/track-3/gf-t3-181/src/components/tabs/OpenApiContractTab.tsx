import React, { useState } from 'react';
import { Network, Terminal, Copy, Send, Code, Radio } from 'lucide-react';
import { TelemetryState } from '../../types/telemetry';

interface OpenApiContractTabProps {
  telemetry: TelemetryState;
}

export const OpenApiContractTab: React.FC<OpenApiContractTabProps> = ({ telemetry }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<'ingress' | 'torsen' | 'ledger' | 'ws'>('ingress');
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [mockResponse, setMockResponse] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const endpoints = [
    { id: 'ingress', method: 'POST', path: '/v1/telemetry/ingress', label: 'Telemetry Ingress (1,600 Hz)' },
    { id: 'torsen', method: 'GET', path: '/v1/torsen/thermal-status', label: 'Torsen Thermal & TBR Status' },
    { id: 'ledger', method: 'GET', path: '/v1/telemetry/ledger/latest', label: 'Cryptographic Ledger Tail' },
    { id: 'ws', method: 'WS', path: '/v1/stream/f-sport-bus', label: 'CAN-Bus WebSocket Stream' },
  ];

  const getCurlSnippet = () => {
    switch (selectedEndpoint) {
      case 'ingress':
        return `curl -X POST https://api.lexus-fsport-core.internal/v1/telemetry/ingress \\
  -H "Content-Type: application/json" \\
  -H "X-Client-Id: CAN_BUS_GATEWAY_NODE_01" \\
  -d '{
    "nonce": ${telemetry.nonce},
    "pedal_pct": ${telemetry.pedalPct.toFixed(1)},
    "engine_rpm": ${telemetry.rpm},
    "drive_mode": "${telemetry.driveMode}",
    "timestamp_ns": ${Date.now() * 1000000}
  }'`;
      case 'torsen':
        return `curl -X GET https://api.lexus-fsport-core.internal/v1/torsen/thermal-status \\
  -H "Accept: application/json"`;
      case 'ledger':
        return `curl -X GET https://api.lexus-fsport-core.internal/v1/telemetry/ledger/latest \\
  -H "Accept: application/json"`;
      case 'ws':
        return `wscat -c wss://api.lexus-fsport-core.internal/v1/stream/f-sport-bus`;
    }
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(getCurlSnippet());
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleExecuteRequest = () => {
    setIsSending(true);
    setTimeout(() => {
      let resp: object;
      if (selectedEndpoint === 'ingress') {
        resp = {
          status: 'COMMITTED',
          code: 201,
          ledger_block_id: 1048220,
          nonce: telemetry.nonce,
          calculated_throttle_angle_pct: Number(telemetry.throttleValveAnglePct.toFixed(2)),
          actuation_latency_us: 184,
          power_output_hp: Number(telemetry.enginePowerHp.toFixed(1)),
          torque_output_lb_ft: Number(telemetry.engineTorqueLbFt.toFixed(1)),
          hmac_signature: telemetry.hash || '8f43a0d17e65b934...',
        };
      } else if (selectedEndpoint === 'torsen') {
        resp = {
          status: 'SUCCESS',
          code: 200,
          differential_unit: 'Toyota / JTEKT Torsen Type-B Limited Slip',
          oil_temperature_c: Number(telemetry.diffOilTempC.toFixed(1)),
          kinematic_viscosity_cst: Number(telemetry.kinematicViscosityCSt.toFixed(2)),
          torque_bias_ratio: '2.80:1',
          oil_specification: 'SAE 75W-85 Toyota Genuine LT',
          shear_breakdown_risk: telemetry.diffOilTempC >= 140 ? 'CRITICAL' : 'NOMINAL',
          wheel_speed_delta_rpm: Number(telemetry.wheelSlipDelta.toFixed(1)),
        };
      } else if (selectedEndpoint === 'ledger') {
        resp = {
          status: 'SUCCESS',
          code: 200,
          partition: 'telemetry_ledger_y2026m10',
          latest_block_nonce: telemetry.nonce,
          chain_length: 1048220,
          hash_algorithm: 'HMAC-SHA256',
          integrity_state: 'VERIFIED_IMMUTABLE',
        };
      } else {
        resp = {
          event: 'F_SPORT_BUS_STREAM',
          frequency_hz: 1600,
          payload_format: 'BINARY_PROTOBUF_V3',
          frames_transferred: 482100,
          compression: 'LZ4_FRAMED',
        };
      }
      setMockResponse(JSON.stringify(resp, null, 2));
      setIsSending(false);
    }, 300);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Network className="w-5 h-5 text-amber-400" />
              OpenAPI 3.1 Telemetry Contract & Dispatch Bus
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict schemas for 1,600 Hz pedal ingress, Torsen fluid viscosity monitoring, and binary streaming.
            </p>
          </div>
          <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded inline-flex self-start sm:self-auto">
            OpenAPI 3.1.0 Strict
          </span>
        </div>

        {/* Endpoint Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
          {endpoints.map((ep) => {
            const isSelected = selectedEndpoint === ep.id;
            return (
              <button
                key={ep.id}
                onClick={() => {
                  setSelectedEndpoint(ep.id as any);
                  setMockResponse(null);
                }}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 border-amber-500/50 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      ep.method === 'POST'
                        ? 'bg-amber-500/20 text-amber-400'
                        : ep.method === 'GET'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-indigo-500/20 text-indigo-400'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="text-xs font-mono text-slate-300 truncate">{ep.path}</span>
                </div>
                <div className="text-xs text-slate-400 font-medium">{ep.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Explorer / Playground Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Request & Contract Schema */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Code className="w-4 h-4 text-slate-400" />
              Request Specification & cURL
            </h3>
            <button
              onClick={handleCopyCurl}
              className="text-xs text-slate-300 hover:text-white bg-slate-800 px-2 py-1 rounded border border-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
            </button>
          </div>

          <pre className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-xs text-amber-300 overflow-x-auto leading-relaxed">
            <code>{getCurlSnippet()}</code>
          </pre>

          <div>
            <button
              onClick={handleExecuteRequest}
              disabled={isSending}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-9 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Dispatching to API Core...' : 'Execute Test Request (Live Dispatch)'}</span>
            </button>
          </div>
        </div>

        {/* Right: Mock / Live Response Viewer */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              HTTP / WS Response Envelope
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Latency: &lt; 0.5 ms
            </span>
          </div>

          <pre className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto min-h-[170px] leading-relaxed">
            <code>
              {mockResponse ||
`// Click "Execute Test Request" to simulate live sub-millisecond dispatch
// or read the telemetry ingress response above.`}
            </code>
          </pre>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Protocol: HTTP/2 + gRPC WebSocket Gateway</span>
            </span>
            <span className="font-mono text-slate-300">Rate: 1,600 msg/sec</span>
          </div>
        </div>
      </div>
    </div>
  );
};
