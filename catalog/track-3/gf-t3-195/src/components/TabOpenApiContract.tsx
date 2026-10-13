/**
 * TabOpenApiContract.tsx
 * Tab 3: OpenAPI 3.1 & WebSocket Telemetry Protocol Specification
 */

import React, { useState } from 'react';
import { FileText, Copy, Check, Radio, Terminal, Send } from 'lucide-react';

export const TabOpenApiContract: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<'LIVE' | 'TRIM' | 'AUDIT' | 'WS_STREAM'>('LIVE');
  const [simTrimAoa, setSimTrimAoa] = useState(12.0);
  const [trimFeedback, setTrimFeedback] = useState<string | null>(null);

  const handleSendTrim = () => {
    setTrimFeedback(`HTTP 200 OK — Wing AoA Trim updated to ${simTrimAoa.toFixed(1)}°. Re-calibrated balance at nonce #1,000,195.`);
    setTimeout(() => setTrimFeedback(null), 4000);
  };

  const openApiYaml = `openapi: 3.1.0
info:
  title: GF-T3-195 Lexus LC 500 Carbon Aero Telemetry Core
  version: 1.0.0-PROD
  description: High-frequency pitot differential pressure, carbon strain, and downforce ledger API.
paths:
  /api/v1/aero/telemetry/live:
    get:
      summary: Fetch real-time aerodynamic state frame
      operationId: getLiveAeroState
      responses:
        '200':
          description: Latest aerodynamic telemetry frame
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AeroFrame'

  /api/v1/aero/surfaces/trim:
    post:
      summary: Calibrate carbon wing AoA trim and diffuser ride height
      operationId: updateAeroTrim
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [wingAoaDeg, groundClearanceMm]
              properties:
                wingAoaDeg:
                  type: number
                  minimum: 8.0
                  maximum: 16.0
                  example: 11.5
                groundClearanceMm:
                  type: number
                  minimum: 105.0
                  maximum: 135.0
                  example: 120.0
      responses:
        '200':
          description: Trim calibrated and written to HMAC ledger

  /api/v1/aero/ledger/audit:
    get:
      summary: Verify cryptographic ledger chain integrity
      operationId: auditLedgerChain
      parameters:
        - name: startNonce
          in: query
          schema:
            type: integer
          required: true
        - name: endNonce
          in: query
          schema:
            type: integer
          required: true
      responses:
        '200':
          description: Audit verification result
          content:
            application/json:
              schema:
                type: object
                properties:
                  isValid:
                    type: boolean
                  checkedFrames:
                    type: integer
                  rootHash:
                    type: string

components:
  schemas:
    AeroFrame:
      type: object
      required:
        - nonce
        - timestampMs
        - airspeedKmh
        - dynamicPressurePa
        - downforceNetKg
        - downforceFrontKg
        - downforceRearKg
        - balanceRearPct
        - venturiDeltaPPa
        - vortexDampingNm
        - wingStrainUe
        - boundaryLayerState
        - hmacSha256Hash
      properties:
        nonce:
          type: integer
        timestampMs:
          type: integer
        airspeedKmh:
          type: number
        dynamicPressurePa:
          type: number
        downforceNetKg:
          type: number
        downforceFrontKg:
          type: number
        downforceRearKg:
          type: number
        balanceRearPct:
          type: number
        venturiDeltaPPa:
          type: number
        vortexDampingNm:
          type: number
        wingStrainUe:
          type: number
        boundaryLayerState:
          type: string
          enum: [LAMINAR_ATTACHED, TURBULENT_STABLE, VORTEX_SHEDDING, STALL_RISK]
        hmacSha256Hash:
          type: string`;

  const webSocketProtocolSpec = `// =============================================================================
// GF-T3-195: WebSocket Real-Time Telemetry Stream Protocol (RFC 6455)
// Endpoint: ws://0.0.0.0:8080/v1/aero/telemetry/stream
// Broadcast Frequency: 100 Hz (sampled from 2,600 Hz sensor ring-buffer)
// Wire Serialization: Strict JSON or Protobuf v3
// =============================================================================

{
  "protocol": "GFT3_AERO_WS_V1",
  "frame_type": "TELEMETRY_BROADCAST",
  "sequence_nonce": 1000195,
  "timestamp_epoch_ms": 1791834720100,
  "telemetry": {
    "pitot_sensors": {
      "port_diff_pa": 2640.2,
      "stbd_diff_pa": 2638.9,
      "centerline_airspeed_kmh": 240.2
    },
    "forces": {
      "downforce_net_kg": 185.4,
      "downforce_front_kg": 89.0,
      "downforce_rear_kg": 96.4,
      "balance_rear_ratio": 0.520,
      "drag_net_kg": 98.2,
      "venturi_suction_delta_pa": 2480.5
    },
    "vortex_telemetry": {
      "crosswind_slip_deg": 0.45,
      "restoring_moment_nm": 14.2,
      "strouhal_shedding_hz": 62.1,
      "wing_strain_microstrain": 573.4
    },
    "boundary_classification": "TURBULENT_STABLE",
    "quarantine_flag": false
  },
  "crypto": {
    "root_chain_hash": "3df49c12b708e1a6c4293f0b2da85bc9412a...",
    "hmac_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedEndpoint === 'WS_STREAM' ? webSocketProtocolSpec : openApiYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-amber-400" />
          <h3 className="text-2xl font-black text-white tracking-tight">
            OpenAPI 3.1 & WebSocket Telemetry Contract
          </h3>
        </div>
        <p className="text-[16px] text-slate-300 leading-relaxed">
          GF-T3-195 provides strict REST contracts and a bidirectional high-frequency WebSocket stream (`ws://.../v1/aero/telemetry/stream`). The service ingests 8-channel differential pitot air velocity sensors, 4-channel swan-neck carbon wing strain telemetry, and broadcasts front/rear downforce balance with sub-15ms round-trip latency.
        </p>

        {/* Protocol Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setSelectedEndpoint('LIVE')}
            className={`text-[16px] font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              selectedEndpoint === 'LIVE'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            GET /api/v1/aero/telemetry/live
          </button>
          <button
            type="button"
            onClick={() => setSelectedEndpoint('TRIM')}
            className={`text-[16px] font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              selectedEndpoint === 'TRIM'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            POST /api/v1/aero/surfaces/trim
          </button>
          <button
            type="button"
            onClick={() => setSelectedEndpoint('AUDIT')}
            className={`text-[16px] font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              selectedEndpoint === 'AUDIT'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            GET /api/v1/aero/ledger/audit
          </button>
          <button
            type="button"
            onClick={() => setSelectedEndpoint('WS_STREAM')}
            className={`text-[16px] font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedEndpoint === 'WS_STREAM'
                ? 'bg-purple-500 text-slate-950 border-purple-400 font-bold'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Radio className="w-4 h-4 text-purple-400" />
            <span>WebSocket Stream (100 Hz)</span>
          </button>
        </div>
      </div>

      {/* Interactive API Endpoint Tester */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            <h4 className="text-xl font-black text-white">
              Interactive Trim Calibration Dispatcher
            </h4>
          </div>
          <span className="text-[16px] font-mono text-cyan-400 font-bold">
            REST Mock Interface
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="text-[16px] font-semibold text-slate-300 block mb-1">
              Target Wing AoA Trim (deg)
            </label>
            <input
              type="number"
              step="0.1"
              min="8.0"
              max="16.0"
              value={simTrimAoa}
              onChange={(e) => setSimTrimAoa(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-[16px] font-mono text-white"
            />
          </div>

          <div>
            <label className="text-[16px] font-semibold text-slate-300 block mb-1">
              Payload Authorization
            </label>
            <input
              type="text"
              readOnly
              value="Bearer gft3_master_dev_token_2026"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-[14px] font-mono text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={handleSendTrim}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[16px] py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>POST /api/v1/aero/surfaces/trim</span>
            </button>
          </div>
        </div>

        {trimFeedback && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-[16px] font-mono text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            {trimFeedback}
          </div>
        )}
      </div>

      {/* Code / Protocol Contract Viewer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            <span className="text-[16px] font-mono font-bold text-slate-200">
              {selectedEndpoint === 'WS_STREAM'
                ? 'websocket_stream_contract.json (100 Hz Broadcast Payload)'
                : 'openapi_3_1_specification.yaml'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="text-[16px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy Contract'}</span>
          </button>
        </div>

        <pre className="p-5 font-mono text-[14px] text-slate-300 overflow-x-auto leading-relaxed bg-slate-950/80 max-h-[500px]">
          <code>{selectedEndpoint === 'WS_STREAM' ? webSocketProtocolSpec : openApiYaml}</code>
        </pre>
      </div>
    </div>
  );
};
