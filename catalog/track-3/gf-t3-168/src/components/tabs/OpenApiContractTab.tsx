import React, { useState } from 'react';
import { Copy, Check, Download, Send, Globe, Wifi, FileCode, CheckCircle2 } from 'lucide-react';
import { OPENAPI_SPEC_YAML } from '../../data/sourceCode';
import { EKFState, SensorInput } from '../../types/telemetry';

interface OpenApiContractTabProps {
  ekfState: EKFState;
  sensorInput: SensorInput;
}

export const OpenApiContractTab: React.FC<OpenApiContractTabProps> = ({
  ekfState,
  sensorInput,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'sandbox' | 'yaml'>('sandbox');
  const [selectedEndpoint, setSelectedEndpoint] = useState<
    'post_batch' | 'get_state' | 'post_calibration' | 'ws_stream'
  >('post_batch');
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastExecution, setLastExecution] = useState<{
    status: number;
    latencyMs: number;
    response: string;
    timestamp: string;
  } | null>(null);

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(OPENAPI_SPEC_YAML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadYaml = () => {
    const blob = new Blob([OPENAPI_SPEC_YAML], { type: 'text/yaml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'openapi_v3_1.yaml');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExecuteRequest = () => {
    setIsExecuting(true);
    setTimeout(() => {
      let respObj = {};
      let status = 200;
      const latency = Number((0.8 + Math.random() * 0.9).toFixed(2));

      if (selectedEndpoint === 'post_batch') {
        status = 202;
        respObj = {
          status: 'QUEUED',
          records_processed: 1000,
          current_block_height: 1042918,
          latest_block_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
          ekf_loop_latency_us: 118.4,
          timestamp: new Date().toISOString(),
        };
      } else if (selectedEndpoint === 'get_state') {
        respObj = {
          timestamp_utc: new Date().toISOString(),
          vehicle_vin: 'JTJBA31A5P0123456',
          state_vector: {
            position_ned_m: [ekfState.px, ekfState.py, ekfState.pz],
            velocity_ned_mps: [ekfState.vx, ekfState.vy, ekfState.vz],
            attitude_euler_rad: [ekfState.roll, ekfState.pitch, ekfState.yaw],
            accel_bias_mps2: [ekfState.b_ax, ekfState.b_ay, ekfState.b_az],
            gyro_bias_rads: [ekfState.b_gx, ekfState.b_gy, ekfState.b_gz],
          },
          metrics: {
            covariance_trace: Number(ekfState.traceP.toFixed(5)),
            condition_number: Number(ekfState.conditionNumber.toFixed(3)),
            fusion_rate_hz: 1000,
          },
        };
      } else if (selectedEndpoint === 'post_calibration') {
        respObj = {
          status: 'CALIBRATION_LOCKED',
          mode: 'ZERO_VELOCITY_UPDATE_ZUPT',
          biases_estimated: {
            b_ax: ekfState.b_ax,
            b_ay: ekfState.b_ay,
            b_az: ekfState.b_az,
            b_gx: ekfState.b_gx,
            b_gy: ekfState.b_gy,
            b_gz: ekfState.b_gz,
          },
          covariance_trace_post: 0.00192,
        };
      } else {
        respObj = {
          protocol: 'WSS (RFC 6455)',
          channel: 'telemetry.state_vector.1000hz',
          compression: 'zstd-stream',
          subscribers_active: 8,
          sample_rate: '1,000 packets/sec',
        };
      }

      setLastExecution({
        status,
        latencyMs: latency,
        response: JSON.stringify(respObj, null, 2),
        timestamp: new Date().toLocaleTimeString(),
      });
      setIsExecuting(false);
    }, 280);
  };

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">OpenAPI 3.1 Telemetry Contract & Protocols</h2>
          <p className="text-base text-slate-300 mt-1">
            REST & WebSocket schemas for 1,000 Hz batch ingestion, state broadcasting, and ZUPT bias calibration
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setViewMode('sandbox')}
              className={`px-3.5 py-2 text-sm font-semibold rounded-md transition-colors ${
                viewMode === 'sandbox'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Interactive Sandbox
            </button>
            <button
              onClick={() => setViewMode('yaml')}
              className={`px-3.5 py-2 text-sm font-semibold rounded-md transition-colors ${
                viewMode === 'yaml'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              OpenAPI 3.1 YAML
            </button>
          </div>

          <button
            onClick={handleCopyYaml}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownloadYaml}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download YAML</span>
          </button>
        </div>
      </div>

      {viewMode === 'sandbox' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Endpoint Selector & Request Builder */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
            <span className="text-sm font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Telemetry Endpoint Matrix</span>
            </span>

            <div className="space-y-3">
              <button
                onClick={() => setSelectedEndpoint('post_batch')}
                className={`w-full text-left p-3.5 rounded-lg border text-sm font-mono transition-colors ${
                  selectedEndpoint === 'post_batch'
                    ? 'bg-slate-800 border-cyan-500 text-white shadow-sm'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 text-base">POST</span>
                  <span className="text-sm text-slate-400 font-semibold">1,000 Hz Batch</span>
                </div>
                <div className="text-white font-semibold mt-1 truncate">/api/v1/telemetry/batch</div>
              </button>

              <button
                onClick={() => setSelectedEndpoint('get_state')}
                className={`w-full text-left p-3.5 rounded-lg border text-sm font-mono transition-colors ${
                  selectedEndpoint === 'get_state'
                    ? 'bg-slate-800 border-cyan-500 text-white shadow-sm'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-400 text-base">GET</span>
                  <span className="text-sm text-slate-400 font-semibold">State Vector x̂</span>
                </div>
                <div className="text-white font-semibold mt-1 truncate">/api/v1/telemetry/state</div>
              </button>

              <button
                onClick={() => setSelectedEndpoint('post_calibration')}
                className={`w-full text-left p-3.5 rounded-lg border text-sm font-mono transition-colors ${
                  selectedEndpoint === 'post_calibration'
                    ? 'bg-slate-800 border-cyan-500 text-white shadow-sm'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 text-base">POST</span>
                  <span className="text-sm text-slate-400 font-semibold">ZUPT Calibration</span>
                </div>
                <div className="text-white font-semibold mt-1 truncate">/api/v1/calibration/imu</div>
              </button>

              <button
                onClick={() => setSelectedEndpoint('ws_stream')}
                className={`w-full text-left p-3.5 rounded-lg border text-sm font-mono transition-colors ${
                  selectedEndpoint === 'ws_stream'
                    ? 'bg-slate-800 border-cyan-500 text-white shadow-sm'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-400 text-base">WSS</span>
                  <span className="text-sm text-slate-400 font-semibold">Binary WebSocket</span>
                </div>
                <div className="text-white font-semibold mt-1 truncate">/api/v1/stream/state-vector</div>
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={handleExecuteRequest}
                disabled={isExecuting}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isExecuting ? 'Transmitting Request...' : 'Execute Request in Sandbox'}</span>
              </button>
            </div>
          </div>

          {/* Response Payload Inspector */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-sm font-mono uppercase tracking-wider text-slate-300 font-bold">
                HTTP/2 Wire Inspector
              </span>
              {lastExecution && (
                <div className="flex items-center gap-3 text-sm font-mono">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>HTTP {lastExecution.status}</span>
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-cyan-400 font-bold">{lastExecution.latencyMs} ms</span>
                </div>
              )}
            </div>

            <div className="bg-slate-950 rounded-lg border border-slate-800 p-5 min-h-[340px] font-mono text-sm overflow-x-auto text-slate-200">
              {lastExecution ? (
                <pre className="leading-relaxed">{lastExecution.response}</pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 py-16 space-y-3">
                  <Wifi className="w-10 h-10 text-slate-600" />
                  <p className="text-base text-slate-300">Select an endpoint and click "Execute Request" to test live response</p>
                </div>
              )}
            </div>

            <div className="text-sm text-slate-400 flex items-center justify-between font-mono pt-1">
              <span>Encoding: application/json + protobuf</span>
              <span>TLS 1.3 / mTLS Ready</span>
            </div>
          </div>
        </div>
      ) : (
        /* YAML Viewer */
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800 text-sm text-slate-300 font-mono">
            <span className="flex items-center gap-2 font-semibold">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>openapi_v3_1.yaml — Complete REST & Streaming Specification</span>
            </span>
            <span className="text-emerald-400 font-semibold">Version: 1.0.0-PROD</span>
          </div>
          <pre className="p-5 text-sm font-mono text-slate-200 overflow-x-auto max-h-[600px] leading-relaxed">
            {OPENAPI_SPEC_YAML}
          </pre>
        </div>
      )}
    </div>
  );
};
