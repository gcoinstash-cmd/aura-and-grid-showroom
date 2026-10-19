import React, { useState } from 'react';
import { Send, Check, Copy, Code, Globe, Radio, Play, ArrowRight, ShieldCheck } from 'lucide-react';

export const OpenApiTab: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<'INGEST' | 'MERKLE_ROOT' | 'HSM_ROTATE' | 'ECU_STATUS'>('INGEST');
  const [isSending, setIsSending] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [copiedContract, setCopiedContract] = useState(false);

  const endpoints = [
    {
      id: 'INGEST',
      method: 'POST',
      path: '/api/v1/telemetry/canfd/frames',
      title: 'Ingest CAN-FD Frames',
      desc: 'Ingests and verifies Ed25519-signed frame batches from vehicle gateway',
    },
    {
      id: 'MERKLE_ROOT',
      method: 'GET',
      path: '/api/v1/telemetry/merkle/root',
      title: 'Get Merkle Audit Root',
      desc: 'Returns latest cryptographic root hash and leaf audit proof',
    },
    {
      id: 'HSM_ROTATE',
      method: 'POST',
      path: '/api/v1/hsm/session/rotate',
      title: 'Rotate HSM Session Key',
      desc: 'Issues a dynamic hardware session nonce and curve point exchange',
    },
    {
      id: 'ECU_STATUS',
      method: 'GET',
      path: '/api/v1/ecu/quietude/status',
      title: 'Quietude Acoustic Status',
      desc: 'Health diagnostics for Heavy Overland Dynamics Platform ES 350h dual-microphones & inverter filters',
    },
  ];

  const handleSendRequest = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      if (selectedEndpoint === 'INGEST') {
        setApiResponse({
          status: 'SUCCESS_COMMITTED',
          statusCode: 200,
          latencyMs: 1.18,
          timestamp: new Date().toISOString(),
          processed_frames: 4,
          merkle_leaf_hash: '9a31f0882e7b165c928e09f4b59d8c36e4f3a778c18749a9b9a67442f4c93d2e',
          invariants: {
            ed25519_verified: true,
            sliding_window_accepted: true,
            monotonic_counter_delta: 1,
          },
        });
      } else if (selectedEndpoint === 'MERKLE_ROOT') {
        setApiResponse({
          statusCode: 200,
          root_hash: '7c8f94e2a1b5d63f089c2718e28193a4b6c890123456789abcdef0123456789a',
          leaf_count: 1048576,
          tree_depth: 21,
          checkpoint_epoch: '2026-10-11T08:00:00Z',
          cryptographic_seal: 'SEAL_ATECC608B_HARDWARE_ATTESTED_VALID',
        });
      } else if (selectedEndpoint === 'HSM_ROTATE') {
        setApiResponse({
          statusCode: 200,
          rotation_status: 'ROTATED',
          new_session_id: 'HSM-SESS-99482-Heavy Overland Dynamics Platform-ES350h',
          session_expires_in_sec: 3600,
          ephemeral_public_key: 'ed25519:pk:302a300506032b65700321008f12a34b56c...',
        });
      } else {
        setApiResponse({
          statusCode: 200,
          vehicle: 'Heavy Overland Dynamics Platform ES 350h Executive',
          chassis_status: 'NOMINAL',
          cabin_spl_db: 38.4,
          active_noise_cancellation: {
            harmonic_inversion_active: true,
            pwm_frequency_hz: 48000,
            acoustic_glass_damper_current_ma: 120,
          },
        });
      }
    }, 280);
  };

  const openApiYaml = `openapi: 3.1.0
info:
  title: GF-T3-170 Heavy Overland Dynamics Platform ES 350h Executive Quietude Core Gateway
  version: 1.0.0-PROD
  description: High-throughput zero-trust automotive CAN-FD telemetry & HSM gateway.
servers:
  - url: https://gf-t3-170-quietude-core-uc.a.run.app
    description: Production Google Cloud Run Fleet Gateway
paths:
  /api/v1/telemetry/canfd/frames:
    post:
      summary: Ingest and verify high-speed CAN-FD frame batch
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [frames]
              properties:
                frames:
                  type: array
                  items:
                    type: object
                    required: [arbitration_id, sequence_number, payload_hex, signature_hex]
                    properties:
                      arbitration_id: { type: string, example: "0x1A4" }
                      sequence_number: { type: integer, example: 1000042 }
                      payload_hex: { type: string, example: "04A1B2C300F291..." }
                      signature_hex: { type: string, example: "e29f8c41..." }
      responses:
        '200':
          description: Frame verified and committed to security ledger
        '403':
          description: Replay or signature forgery detected
  /api/v1/telemetry/merkle/root:
    get:
      summary: Retrieve authenticated Merkle root and tree proofs
      responses:
        '200':
          description: Live SHA-256 Merkle root
  /api/v1/hsm/session/rotate:
    post:
      summary: Trigger dynamic HSM session key rotation
      responses:
        '200':
          description: New hardware session established
  /api/v1/ecu/quietude/status:
    get:
      summary: Diagnostics for Heavy Overland Dynamics Platform ES 350h Executive Quietude acoustics
      responses:
        '200':
          description: Nominal chassis & cabin sound pressure levels
`;

  const copyContract = () => {
    navigator.clipboard.writeText(openApiYaml);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Overview */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-neutral-100 flex items-center gap-2">
              <Globe className="h-6 w-6 text-amber-400" />
              OpenAPI 3.1 &amp; WebSocket Gateway Contract
            </h2>
            <p className="text-base text-neutral-400 mt-1">
              Strict REST endpoints and high-speed bidirectional WebSocket stream (\`wss://.../ws/v1/telemetry/stream\`) for in-vehicle and fleet telemetry ingestion.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-neutral-800 px-3 py-1 font-mono text-sm text-emerald-400 border border-neutral-700">
              OpenAPI 3.1.0 Strict
            </span>
          </div>
        </div>

        {/* Interactive Endpoint Selector & Tester */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Endpoint List */}
          <div className="space-y-3">
            <span className="text-sm font-bold uppercase tracking-wider text-neutral-400">
              Select API Route
            </span>
            {endpoints.map((ep) => (
              <button
                key={ep.id}
                onClick={() => {
                  setSelectedEndpoint(ep.id as any);
                  setApiResponse(null);
                }}
                className={`w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                  selectedEndpoint === ep.id
                    ? 'border-amber-500 bg-neutral-900 shadow-sm'
                    : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1">
                  <span
                    className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                      ep.method === 'POST' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-sm font-semibold text-neutral-200 truncate">
                    {ep.path}
                  </span>
                </div>
                <div className="text-sm text-neutral-400">{ep.title}</div>
              </button>
            ))}

            {/* WebSocket Callout */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3.5 text-neutral-300">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-200 mb-1">
                <Radio className="h-4 w-4 text-emerald-400" />
                <span>WebSocket Stream:</span>
              </div>
              <p className="font-mono text-xs text-neutral-400 break-all">
                wss://.../ws/v1/telemetry/stream
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Sub-millisecond broadcast of Ed25519 verified frames to fleet telematics.
              </p>
            </div>
          </div>

          {/* Test Harness Panel */}
          <div className="lg:col-span-2 rounded-lg border border-neutral-800 bg-neutral-950 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-bold uppercase tracking-wider text-neutral-200">
                    Interactive Gateway Test Bench
                  </span>
                </div>
                <button
                  onClick={handleSendRequest}
                  disabled={isSending}
                  className="flex items-center gap-2 rounded-md bg-amber-500 px-4 py-1.5 text-sm font-bold text-neutral-950 hover:bg-amber-400 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className={`h-4 w-4 ${isSending ? 'animate-pulse' : ''}`} />
                  <span>{isSending ? 'Transmitting...' : 'Send Live Request'}</span>
                </button>
              </div>

              {/* Endpoint Details */}
              <div className="mb-4">
                <div className="text-sm text-neutral-400 mb-1">Description:</div>
                <div className="text-sm font-medium text-neutral-200">
                  {endpoints.find((e) => e.id === selectedEndpoint)?.desc}
                </div>
              </div>

              {/* Simulated Response Box */}
              <div>
                <div className="flex items-center justify-between text-sm text-neutral-400 mb-1.5">
                  <span>Server Response (HTTP / JSON):</span>
                  {apiResponse && (
                    <span className="font-mono text-emerald-400 font-semibold">
                      HTTP {apiResponse.statusCode} OK · Latency ~1.2ms
                    </span>
                  )}
                </div>
                <div className="rounded border border-neutral-800 bg-neutral-900/90 p-3.5 font-mono text-sm text-neutral-200 min-h-[160px] overflow-x-auto">
                  {apiResponse ? (
                    <pre>
                      <code>{JSON.stringify(apiResponse, null, 2)}</code>
                    </pre>
                  ) : (
                    <div className="text-neutral-500 italic flex items-center justify-center h-full pt-10">
                      Click "Send Live Request" to execute against the simulated Cloud Run gateway...
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-sm text-neutral-400">
              <span>Authentication: Hardware Mutual TLS / X.509 + Ed25519 Session Token</span>
              <span className="text-emerald-400 font-semibold">TLS 1.3 Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* OpenAPI Contract Viewer */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
              <Code className="h-5 w-5 text-amber-400" />
              OpenAPI 3.1.0 Contract Schema (YAML)
            </h3>
            <p className="text-sm text-neutral-400 mt-1">
              Complete specification for automated client SDK generation and gateway routing.
            </p>
          </div>
          <button
            onClick={copyContract}
            className="flex items-center gap-2 rounded-md bg-neutral-800 hover:bg-neutral-700 px-3.5 py-2 text-sm font-semibold text-neutral-200 border border-neutral-700 transition-colors cursor-pointer"
          >
            {copiedContract ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copiedContract ? 'Copied' : 'Copy OpenAPI YAML'}</span>
          </button>
        </div>

        <div className="relative rounded-lg border border-neutral-800 bg-neutral-950 p-4 overflow-x-auto">
          <pre className="text-sm font-mono text-neutral-300 leading-relaxed">
            <code>{openApiYaml}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
