import React, { useState, useEffect } from 'react';
import { Send, Copy, Check, Radio, FileCode, CheckCircle2, RefreshCw } from 'lucide-react';
import { OPENAPI_SPEC_YAML, OPENAPI_SPEC_JSON } from '../../data/openApiSpec';

export const OpenApiTab: React.FC = () => {
  const [format, setFormat] = useState<'YAML' | 'JSON'>('YAML');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<'IMU_FEED' | 'CRAWL_CONTROL' | 'WS_STREAM'>('IMU_FEED');
  
  // Interactive test states
  const [imuPayload, setImuPayload] = useState<string>(
    JSON.stringify(
      {
        sequence_id: 1000426,
        timestamp: new Date().toISOString(),
        pitch_deg: 16.4,
        roll_deg: -11.2,
        yaw_rate_deg_s: 0.85,
        strokes: { fl: 11.2, fr: -7.5, rl: 12.0, rr: -8.8 },
      },
      null,
      2
    )
  );

  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  // WebSocket simulator state
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [wsPacketCount, setWsPacketCount] = useState<number>(0);
  const [latestWsPacket, setLatestWsPacket] = useState<string>('{"status": "DISCONNECTED"}');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (wsConnected) {
      interval = setInterval(() => {
        setWsPacketCount((prev) => prev + 1);
        const pitch = +(10 + Math.random() * 8).toFixed(2);
        const roll = +(-6 + Math.random() * 6).toFixed(2);
        const mockFrame = {
          topic: "telemetry/100hz",
          seq: 1000426 + wsPacketCount,
          pitch_deg: pitch,
          roll_deg: roll,
          ekdss_front_decoupled: true,
          ekdss_rear_decoupled: true,
          effective_stiffness_nm_rad: 12600.0,
          hmac_sha256: "0x8f2ac94b" + Math.random().toString(16).substring(2, 10),
        };
        setLatestWsPacket(JSON.stringify(mockFrame, null, 2));
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [wsConnected, wsPacketCount]);

  const handleSendTestRequest = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      if (selectedEndpoint === 'IMU_FEED') {
        setTestResponse(
          JSON.stringify(
            {
              status: "201 Created",
              ledger_block_height: 1000426,
              current_block_hash: "0x3f98ba71e0419cde458890ab2230114f56a89c0d1e2f3a4b5c6d7e8f9a0b1c2d",
              hmac_sha256: "0x7890abcdef0123456789abcdef0123456789abcdef0123456789abcdef012345",
              ekdss_front_decoupled: true,
              ekdss_rear_decoupled: true,
              effective_roll_stiffness_nm_rad: 12600.0,
              valve_slew_latency_ms: 3.8,
              quarantined: false,
            },
            null,
            2
          )
        );
      } else if (selectedEndpoint === 'CRAWL_CONTROL') {
        setTestResponse(
          JSON.stringify(
            {
              status: "200 OK",
              crawl_speed_mph: 2.5,
              brake_hydraulic_pressure_psi: 1840,
              abs_slip_regulation: "NOMINAL",
              torsen_center_ratio: "50:50",
              rear_electronic_locker: "ENGAGED_100%",
            },
            null,
            2
          )
        );
      }
    }, 250);
  };

  const handleCopySpec = async () => {
    try {
      await navigator.clipboard.writeText(format === 'YAML' ? OPENAPI_SPEC_YAML : OPENAPI_SPEC_JSON);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative w-full space-y-8 p-6 md:p-8 bg-neutral-950 text-neutral-100">
      
      {/* Intro Header */}
      <div className="border-b border-neutral-800 pb-5">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          OpenAPI 3.1 & WebSocket Streaming Contract
        </h2>
        <p className="mt-2 text-[16px] text-neutral-400 max-w-4xl leading-relaxed">
          Zero-copy REST schemas for 6-axis IMU pitch/roll ingestion, Crawl Control speed setpoints, and 100 Hz binary/JSON WebSocket telemetry broadcast. Cleanly documented for Antigravity automated code generation.
        </p>
      </div>

      {/* Interactive API Client Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Endpoint Selector & Request Builder */}
        <div className="lg:col-span-6 bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h3 className="text-xl font-bold text-white">Endpoint Test Console</h3>
            <span className="text-base font-mono text-amber-400 font-semibold">HTTP/2 & WSS</span>
          </div>

          {/* Endpoint Selector Tabs */}
          <div className="flex flex-col gap-2.5">
            {[
              { id: 'IMU_FEED', method: 'POST', path: '/api/v1/telemetry/imu-feed', desc: 'Ingest 6-Axis IMU & Articulation' },
              { id: 'CRAWL_CONTROL', method: 'POST', path: '/api/v1/crawl-control/setpoint', desc: 'Set Crawl Speed Regulation' },
              { id: 'WS_STREAM', method: 'WSS', path: '/ws/v1/telemetry/stream', desc: '100 Hz Real-Time Broadcast' },
            ].map((ep) => (
              <button
                key={ep.id}
                onClick={() => {
                  setSelectedEndpoint(ep.id as any);
                  setTestResponse(null);
                }}
                className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedEndpoint === ep.id
                    ? 'bg-neutral-800 border-amber-500 shadow-md'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-0.5 rounded text-base font-mono font-bold ${
                      ep.method === 'POST' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-purple-500/20 text-purple-300'
                    }`}>
                      {ep.method}
                    </span>
                    <span className="font-mono text-base text-white font-bold">{ep.path}</span>
                  </div>
                  <div className="text-base text-neutral-300 mt-1">{ep.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Request Payload / Actions */}
          {selectedEndpoint !== 'WS_STREAM' ? (
            <div className="space-y-3 pt-2">
              <label className="text-base text-neutral-200 font-semibold block">
                Request Payload (JSON):
              </label>
              <textarea
                rows={6}
                value={imuPayload}
                onChange={(e) => setImuPayload(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 font-mono text-base text-neutral-200 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleSendTestRequest}
                disabled={isSending}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-base rounded-xl transition-colors cursor-pointer shadow-lg shadow-amber-500/10"
              >
                {isSending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                <span>{isSending ? 'Transmitting Ingestion Vector...' : 'Execute Test Invocation'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-base">
                  <span className="text-neutral-400 font-medium">Channel Status:</span>
                  <span className={`font-mono font-bold ${wsConnected ? 'text-emerald-400' : 'text-neutral-400'}`}>
                    {wsConnected ? 'OPEN (100 Hz Stream)' : 'DISCONNECTED'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-base">
                  <span className="text-neutral-400 font-medium">Total Packets Received:</span>
                  <span className="font-mono font-bold text-sky-400 num-tabular">#{wsPacketCount}</span>
                </div>
              </div>

              <button
                onClick={() => setWsConnected(!wsConnected)}
                className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-6 font-bold text-base rounded-xl transition-colors cursor-pointer ${
                  wsConnected
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <Radio className="w-5 h-5" />
                <span>{wsConnected ? 'Stop WebSocket Feed' : 'Connect 100 Hz WebSocket'}</span>
              </button>
            </div>
          )}

        </div>

        {/* Live Response Panel */}
        <div className="lg:col-span-6 bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h3 className="text-xl font-bold text-white">Live Endpoint Response</h3>
            <span className="text-base font-mono text-neutral-400 font-medium">
              {selectedEndpoint === 'WS_STREAM' ? 'Live Telemetry Frames' : '200 / 201 Response'}
            </span>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 font-mono text-base text-neutral-200 min-h-[300px] max-h-[380px] overflow-y-auto leading-relaxed">
            {selectedEndpoint === 'WS_STREAM' ? (
              <pre className="text-emerald-400"><code>{latestWsPacket}</code></pre>
            ) : testResponse ? (
              <pre className="text-sky-300"><code>{testResponse}</code></pre>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-400 text-base">
                Click "Execute Test Invocation" to simulate real-time ingestion.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* OpenAPI 3.1 Specification Contract File */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between p-4 bg-neutral-950 border-b border-neutral-800 gap-3">
          <div className="flex items-center gap-3">
            <FileCode className="w-5 h-5 text-amber-400" />
            <span className="text-[15px] font-mono font-bold text-white">
              openapi_terrain_spec.3.1.{format.toLowerCase()}
            </span>
            <div className="flex items-center bg-neutral-800 rounded p-0.5 border border-neutral-700">
              <button
                onClick={() => setFormat('YAML')}
                className={`px-2.5 py-0.5 text-[15px] font-semibold rounded cursor-pointer ${
                  format === 'YAML' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400'
                }`}
              >
                YAML
              </button>
              <button
                onClick={() => setFormat('JSON')}
                className={`px-2.5 py-0.5 text-[15px] font-semibold rounded cursor-pointer ${
                  format === 'JSON' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400'
                }`}
              >
                JSON
              </button>
            </div>
          </div>

          <button
            onClick={handleCopySpec}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[15px] font-medium transition-colors cursor-pointer"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-neutral-400" />}
            <span>{isCopied ? 'Copied Contract' : 'Copy OpenAPI 3.1'}</span>
          </button>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto bg-neutral-950 text-neutral-300 font-mono text-[15px] leading-relaxed">
          <pre><code>{format === 'YAML' ? OPENAPI_SPEC_YAML : OPENAPI_SPEC_JSON}</code></pre>
        </div>
      </div>

    </div>
  );
};
