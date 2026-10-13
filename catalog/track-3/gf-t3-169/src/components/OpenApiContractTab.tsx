import React, { useState, useEffect } from 'react';
import { Network, Play, Pause, Copy, Check, Send, Radio } from 'lucide-react';
import { DriveMode } from '../types';

interface OpenApiContractTabProps {
  currentDriveMode: DriveMode;
  onDriveModeChange: (mode: DriveMode) => void;
}

export const OpenApiContractTab: React.FC<OpenApiContractTabProps> = ({
  currentDriveMode,
  onDriveModeChange,
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<
    'MPC_DISPATCH' | 'BMS_STREAM' | 'MODE_TRANSITION' | 'TORQUE_CALIBRATE'
  >('MPC_DISPATCH');

  // WebSocket Live Stream Simulation
  const [isStreamingWs, setIsStreamingWs] = useState(true);
  const [wsFrames, setWsFrames] = useState<Array<{ timestamp: string; payload: string }>>([
    {
      timestamp: '00:38:52.410',
      payload: '{"seq": 1000284, "freq_hz": 500, "t_front": 214.2, "t_rear": 98.4, "soc": 78.4, "t_pack_c": 32.8}',
    },
    {
      timestamp: '00:38:52.160',
      payload: '{"seq": 1000283, "freq_hz": 500, "t_front": 213.9, "t_rear": 98.1, "soc": 78.4, "t_pack_c": 32.8}',
    },
    {
      timestamp: '00:38:51.910',
      payload: '{"seq": 1000282, "freq_hz": 500, "t_front": 213.5, "t_rear": 97.8, "soc": 78.4, "t_pack_c": 32.8}',
    },
  ]);

  // Test Request Runner
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);

  useEffect(() => {
    if (!isStreamingWs) return;
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}`;
      const randomSeq = 1000285 + Math.floor(Math.random() * 50);
      const randomTf = (210 + Math.random() * 10).toFixed(1);
      const randomTr = (95 + Math.random() * 8).toFixed(1);
      const newFrame = {
        timestamp: timeStr,
        payload: `{"seq": ${randomSeq}, "freq_hz": 500, "t_front": ${randomTf}, "t_rear": ${randomTr}, "soc": 78.4, "t_pack_c": 32.8, "crc32": "0x${Math.floor(Math.random() * 0xffffff).toString(16)}"}`,
      };
      setWsFrames((prev) => [newFrame, ...prev.slice(0, 7)]);
    }, 400);

    return () => clearInterval(interval);
  }, [isStreamingWs]);

  const handleRunRequest = () => {
    if (selectedEndpoint === 'MPC_DISPATCH') {
      setTestResponse(
        JSON.stringify(
          {
            status: '200_OK',
            timestamp: new Date().toISOString(),
            solve_latency_ms: 0.418,
            actuator_vector: {
              t_ice_nm: 0.0,
              t_mg_front_nm: 214.2,
              t_mg_rear_nm: 98.4,
              delta_torque_rear_yaw: 18.5,
            },
            thermal_headroom_pct: 98.2,
            monotonic_seq: 1000285,
          },
          null,
          2
        )
      );
    } else if (selectedEndpoint === 'MODE_TRANSITION') {
      onDriveModeChange('SPORT_S_PLUS');
      setTestResponse(
        JSON.stringify(
          {
            status: '200_OK',
            previous_mode: currentDriveMode,
            target_mode: 'SPORT_S_PLUS',
            blend_duration_ms: 120,
            transition_profile: 'EXPONENTIAL_SLEW_LIMITED',
            rear_authority_gain: 1.6,
          },
          null,
          2
        )
      );
    } else if (selectedEndpoint === 'TORQUE_CALIBRATE') {
      setTestResponse(
        JSON.stringify(
          {
            status: '200_OK',
            track_profile: 'FUJI_SPEEDWAY_HYBRID_CURVE',
            calibration_id: 'CAL-GF169-PROD',
            e_four_rear_bias_max: 0.85,
            regenerative_drag_max_nm: 140.0,
          },
          null,
          2
        )
      );
    }
  };

  const ENDPOINT_CURLS: Record<string, string> = {
    MPC_DISPATCH: `curl -X POST "https://gf-t3-169-api.internal/v1/powertrain/mpc/dispatch" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer gf_vault_token_prod" \\
  -d '{
    "pedal_demand_pct": 72.0,
    "lateral_g": 0.42,
    "drive_mode": "${currentDriveMode}",
    "soc_pct": 78.4,
    "pack_temp_c": 32.8
  }'`,
    BMS_STREAM: `wscat -c "wss://gf-t3-169-api.internal/v1/telemetry/bms/stream?vin=JTJAA4FX0N2000169&freq=500hz"`,
    MODE_TRANSITION: `curl -X POST "https://gf-t3-169-api.internal/v1/drive-mode/transition" \\
  -H "Content-Type: application/json" \\
  -d '{"target_mode": "SPORT_S_PLUS", "slew_limit_ms": 120}'`,
    TORQUE_CALIBRATE: `curl -X POST "https://gf-t3-169-api.internal/v1/chassis/torque-vectoring/calibrate" \\
  -H "Content-Type: application/json" \\
  -d '{"track_id": "FUJI_SPEEDWAY", "rear_bias_weight": 1.6}'`,
  };

  const OPENAPI_SPEC = `openapi: 3.1.0
info:
  title: GF-T3-169 Lexus NX 450h+ Agile Powertrain Core API
  version: 1.0.0-PROD
  description: High-frequency deterministic 500Hz MPC torque vectoring and BMS contract.
servers:
  - url: https://gf-t3-169-api.internal/v1
paths:
  /powertrain/mpc/dispatch:
    post:
      summary: Dispatch 2.0ms MPC control optimization tick
      operationId: dispatchMpcTick
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/MpcDispatchRequest'
      responses:
        '200':
          description: Optimal actuator vector computed under 0.5ms deadline
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MpcDispatchResponse'

  /telemetry/bms/stream:
    get:
      summary: WebSocket streaming 500 Hz BMS telemetry frames
      description: Returns monotonic SHA-256 verified telemetry packets.

components:
  schemas:
    MpcDispatchRequest:
      type: object
      required: [pedal_demand_pct, lateral_g, drive_mode, soc_pct, pack_temp_c]
      properties:
        pedal_demand_pct:
          type: number
          minimum: 0.0
          maximum: 100.0
        lateral_g:
          type: number
          minimum: -1.0
          maximum: 1.0
        drive_mode:
          type: string
          enum: [EV, AUTO_EV_HEV, HYBRID_HEV, SPORT_S_PLUS]
        soc_pct:
          type: number
        pack_temp_c:
          type: number`;

  return (
    <div className="space-y-8">
      {/* Live WebSocket 500 Hz Telemetry Feed Simulation */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium text-sm">WebSocket Streaming Engine</span>
              <span className="px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-400 text-sm font-semibold">
                500 Hz Active
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-100">Live /v1/telemetry/bms/stream Packet Feed</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsStreamingWs(!isStreamingWs)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                isStreamingWs
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isStreamingWs ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isStreamingWs ? 'Pause Stream' : 'Resume Stream'}</span>
            </button>
          </div>
        </div>

        {/* WebSocket Stream Monitor */}
        <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 font-mono text-sm space-y-2 max-h-60 overflow-y-auto">
          {wsFrames.map((frame, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded bg-slate-900/60 border border-slate-800/80">
              <span className="text-slate-500 font-semibold">{frame.timestamp}</span>
              <span className="text-cyan-400 text-sm break-all">{frame.payload}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive REST Endpoint Explorer */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <span className="text-slate-400 font-medium text-sm">OpenAPI 3.1 Contract Explorer</span>
            <h3 className="text-2xl font-bold text-slate-100">Interactive REST Endpoints</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'MPC_DISPATCH', label: 'POST /mpc/dispatch' },
              { id: 'MODE_TRANSITION', label: 'POST /drive-mode/transition' },
              { id: 'TORQUE_CALIBRATE', label: 'POST /torque-vectoring/calibrate' },
            ].map((ep) => (
              <button
                key={ep.id}
                onClick={() => {
                  setSelectedEndpoint(ep.id as any);
                  setTestResponse(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  selectedEndpoint === ep.id
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {ep.label}
              </button>
            ))}
          </div>
        </div>

        {/* Curl Command & Runner */}
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-sm mb-2 pb-2 border-b border-slate-800">
              <span>cURL Invocation Generator:</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(ENDPOINT_CURLS[selectedEndpoint]);
                    setCopiedCurl(true);
                    setTimeout(() => setCopiedCurl(false), 2000);
                  }}
                  className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                >
                  {copiedCurl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCurl ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleRunRequest}
                  className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Execute Endpoint</span>
                </button>
              </div>
            </div>
            <pre className="font-mono text-sm text-slate-300 overflow-x-auto whitespace-pre-wrap">
              {ENDPOINT_CURLS[selectedEndpoint]}
            </pre>
          </div>

          {/* Test Response Window */}
          {testResponse && (
            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/70">
              <div className="text-emerald-400 font-semibold text-sm mb-2 flex items-center justify-between">
                <span>Response Payload (200 OK):</span>
                <span>Latency: 0.42 ms</span>
              </div>
              <pre className="font-mono text-sm text-emerald-300 overflow-x-auto">
                {testResponse}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Complete OpenAPI 3.1 YAML Inspector */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
          <div>
            <span className="text-slate-400 font-medium text-sm">Specification Manifest</span>
            <h3 className="text-2xl font-bold text-slate-100">openapi_v3_1.yaml</h3>
          </div>
        </div>

        <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 font-mono text-sm overflow-x-auto text-slate-300 leading-relaxed max-h-96">
          <pre>{OPENAPI_SPEC}</pre>
        </div>
      </div>
    </div>
  );
};
