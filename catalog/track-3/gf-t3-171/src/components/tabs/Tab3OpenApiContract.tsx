import React, { useState } from 'react';
import { Network, Send, Copy, Check, Terminal, FileCode, CheckCircle2 } from 'lucide-react';

export const Tab3OpenApiContract: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<'claim' | 'commit' | 'stream'>('claim');

  // Interactive Test Runner State
  const [rpm, setRpm] = useState<number>(7100);
  const [throttle, setThrottle] = useState<number>(100.0);
  const [vvtAdvance, setVvtAdvance] = useState<number>(31.5);
  const [batchSize, setBatchSize] = useState<number>(1);
  const [lastResponse, setLastResponse] = useState<{
    status: number;
    latencyNs: number;
    claimedSeq: number;
    moduloSlot: number;
    hexPayload: string;
    timestamp: string;
  } | null>({
    status: 200,
    latencyNs: 184,
    claimedSeq: 1000042,
    moduloSlot: 42,
    hexPayload: '00 00 01 92 78 a4 b1 c0 00 00 00 00 00 0f 42 6a 00 00 1b bc 42 c8 00 00 41 fc 00 00 42 cd 00 00',
    timestamp: '2026-10-11T21:14:02.128Z',
  });

  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecuteRequest = () => {
    setIsExecuting(true);
    setTimeout(() => {
      const seq = 1000043 + Math.floor(Math.random() * 50);
      const slot = seq & 0x000fffff;
      const latency = Math.floor(140 + Math.random() * 70);
      setLastResponse({
        status: selectedEndpoint === 'commit' ? 202 : 200,
        latencyNs: latency,
        claimedSeq: seq,
        moduloSlot: slot % 64,
        hexPayload: `00 00 01 92 ${Math.floor(Math.random() * 99).toString(16).padStart(2, '0')} a4 b1 c0 00 00 00 00 ${(seq % 256).toString(16).padStart(2, '0')} ${rpm.toString(16).padStart(4, '0')} 42 c8 00 00`,
        timestamp: new Date().toISOString(),
      });
      setIsExecuting(false);
    }, 150);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openApiYaml = `openapi: 3.1.0
info:
  title: GF-T3-171 Disruptor Direct Execution Engine
  version: 1.0.0-PROD
  description: >
    Ultra-low latency telemetry ingest and sequence barrier execution contract
    calibrated for the Heavy Overland Dynamics Platform IS 500 High-G Dynamic Telemetry 2UR-GSE Quad-Cam V8 powertrain.
servers:
  - url: https://gf-t3-171-engine-kimc6fcbv3veokcj6v4jer-uc.a.run.app
    description: Google Cloud Run Managed Microservice
paths:
  /api/v1/telemetry/disruptor/claim:
    post:
      summary: Claim atomic sequence slot in Disruptor Ring Buffer
      operationId: claimSequence
      description: Single CAS barrier sequence claim without OS locks.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [batch_size]
              properties:
                batch_size:
                  type: integer
                  minimum: 1
                  maximum: 4096
                  default: 1
                  example: 1
      responses:
        '200':
          description: Sequence successfully claimed
          content:
            application/json:
              schema:
                type: object
                properties:
                  claimed_sequence:
                    type: integer
                    format: int64
                    example: 1000042
                  modulo_slot_index:
                    type: integer
                    example: 42
                  barrier_state:
                    type: string
                    example: NOMINAL
                  latency_ns:
                    type: integer
                    example: 184

  /api/v1/telemetry/disruptor/commit:
    post:
      summary: Commit 64-byte binary telemetry tick into ring buffer slot
      operationId: commitTick
      description: High-frequency zero-allocation write into pre-allocated memory slot.
      requestBody:
        required: true
        content:
          application/octet-stream:
            schema:
              type: string
              format: binary
              description: Exactly 64 bytes binary struct (Heavy Overland Dynamics Platform V8 Telemetry Frame)
      responses:
        '202':
          description: Telemetry tick committed and queued for Postgres WAL spillover
          content:
            application/json:
              schema:
                type: object
                properties:
                  sequence_id:
                    type: integer
                    format: int64
                  status:
                    type: string
                    example: COMMITTED_TO_RING_BUFFER

  /api/v1/ledger/partitions:
    get:
      summary: List active PostgreSQL 16 range partitions and BRIN index health
      operationId: getLedgerPartitions
      responses:
        '200':
          description: Partition status and HMAC chain verification report

  /ws/v1/disruptor/stream:
    get:
      summary: WebSocket real-time binary stream of Heavy Overland Dynamics Platform V8 engine telemetry
      description: Zero-copy WebSocket framing with sub-microsecond broadcast.`;

  return (
    <div className="space-y-8">
      {/* Tab Header */}
      <div className="space-y-2">
        <div className="text-sm font-semibold uppercase tracking-wider text-cyan-400 font-mono">
          03. OpenAPI 3.1 Direct Execution Contract
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Ultra-Low Overhead REST &amp; Raw Binary Wire Protocol
        </h2>
        <p className="text-base text-slate-300 max-w-4xl">
          Designed for programmatic execution with zero JSON parsing overhead on the ingestion critical path. Supports raw 64-byte binary octet-streams and WebSocket sequence claims with deterministic latency.
        </p>
      </div>

      {/* Wire Protocol: 64-Byte Binary Frame Layout (strict 14px floor) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyan-400" />
              64-Byte Binary Frame Wire Protocol Specification
            </h3>
            <p className="text-sm text-slate-400">
              Zero-copy memory map: The incoming network packet is cast directly to the C-struct in CPU L1 cache.
            </p>
          </div>
          <span className="text-sm font-mono text-emerald-400 font-semibold px-3 py-1 bg-emerald-950/60 border border-emerald-500/30 rounded-lg self-start sm:self-auto">
            Total Size: 64 Bytes (512 Bits)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2 text-sm font-mono">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-cyan-400 font-bold block">Bytes 00-07</span>
            <span className="text-white font-semibold">timestamp_ns</span>
            <span className="text-slate-400 text-sm block">uint64 (8 Bytes)</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-cyan-400 font-bold block">Bytes 08-15</span>
            <span className="text-white font-semibold">sequence_id</span>
            <span className="text-slate-400 text-sm block">uint64 (8 Bytes)</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-emerald-400 font-bold block">Bytes 16-19</span>
            <span className="text-white font-semibold">engine_rpm</span>
            <span className="text-slate-400 text-sm block">uint32 (4 Bytes)</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-emerald-400 font-bold block">Bytes 20-23</span>
            <span className="text-white font-semibold">throttle_pct</span>
            <span className="text-slate-400 text-sm block">float32 (4 Bytes)</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-emerald-400 font-bold block">Bytes 24-27</span>
            <span className="text-white font-semibold">vvt_cam_deg</span>
            <span className="text-slate-400 text-sm block">float32 (4 Bytes)</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-amber-400 font-bold block">Bytes 28-39</span>
            <span className="text-white font-semibold">MAP, Fuel, Oil</span>
            <span className="text-slate-400 text-sm block">3x float32 (12 Bytes)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-mono">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-amber-400 font-bold block">Bytes 40-51 (12 Bytes)</span>
            <span className="text-white font-semibold">egt_c (4B float) + crc64_checksum (8B uint64)</span>
            <span className="text-slate-400 text-sm block">Hardware polynomial integrity guard</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-indigo-400 font-bold block">Bytes 52-63 (12 Bytes)</span>
            <span className="text-white font-semibold">hmac_signature / Cacheline Padding</span>
            <span className="text-slate-400 text-sm block">Cryptographic provenance authentication</span>
          </div>
        </div>
      </div>

      {/* Interactive Direct Execution Request Runner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Input Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-cyan-400" />
              Direct API Request Runner
            </h3>
            <span className="text-sm font-mono text-cyan-400">REST &amp; Binary Testbench</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-300 block mb-2">
                Target Endpoint &amp; Operation
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedEndpoint('claim')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                    selectedEndpoint === 'claim'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  POST /claim
                </button>
                <button
                  onClick={() => setSelectedEndpoint('commit')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                    selectedEndpoint === 'commit'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  POST /commit
                </button>
                <button
                  onClick={() => setSelectedEndpoint('stream')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                    selectedEndpoint === 'stream'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  WS /stream
                </button>
              </div>
            </div>

            {selectedEndpoint === 'claim' ? (
              <div>
                <label className="text-sm font-semibold text-slate-300 block mb-1">
                  Batch Claim Size (slots)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1024"
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-semibold text-slate-300 block mb-1">
                    V8 RPM
                  </label>
                  <input
                    type="number"
                    value={rpm}
                    onChange={(e) => setRpm(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-300 block mb-1">
                    Throttle %
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={throttle}
                    onChange={(e) => setThrottle(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-300 block mb-1">
                    VVT Deg
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={vvtAdvance}
                    onChange={(e) => setVvtAdvance(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleExecuteRequest}
              disabled={isExecuting}
              className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
            >
              {isExecuting ? (
                <>
                  <Send className="w-4 h-4 animate-spin" />
                  Executing Direct Atomic CAS...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Execute Direct Contract Call
                </>
              )}
            </button>
          </div>
        </div>

        {/* Response & Telemetry Output Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Contract Response &amp; Latency Profile
            </h3>
            {lastResponse && (
              <span className="text-sm font-mono text-emerald-400 font-bold">
                HTTP {lastResponse.status} OK
              </span>
            )}
          </div>

          {lastResponse ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm font-mono">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Roundtrip Execution</span>
                  <span className="text-xl font-bold text-cyan-300">
                    {lastResponse.latencyNs} ns
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Claimed Monotonic Sequence</span>
                  <span className="text-xl font-bold text-white">
                    #{lastResponse.claimedSeq.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-sm space-y-1">
                <span className="text-slate-400 block">Raw Binary Hex Payload (L1 Ingest Buffer):</span>
                <div className="text-emerald-300 break-all leading-relaxed">
                  {lastResponse.hexPayload}
                </div>
              </div>

              <div className="flex justify-between items-center text-sm font-mono text-slate-400 pt-1">
                <span>Modulo Slot: [{lastResponse.moduloSlot}]</span>
                <span>Timestamp: {lastResponse.timestamp.slice(11, 23)} UTC</span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-slate-400">
              Click &quot;Execute Direct Contract Call&quot; to test.
            </div>
          )}
        </div>
      </div>

      {/* OpenAPI 3.1 YAML Document Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold text-white">
              Full OpenAPI 3.1.0 Contract Specification (openapi.yaml)
            </span>
          </div>

          <button
            onClick={() => handleCopy(openApiYaml)}
            className="flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            {copied ? 'Copied to Clipboard' : 'Copy OpenAPI Spec'}
          </button>
        </div>

        <div className="p-6 bg-slate-950 font-mono text-sm overflow-x-auto text-slate-200 leading-relaxed max-h-[500px]">
          <pre>{openApiYaml}</pre>
        </div>
      </div>
    </div>
  );
};
