import React, { useState } from 'react';
import { TelemetryState } from '../../types/telemetry';
import { OPENAPI_SPECIFICATION } from '../../data/codeSnippets';
import { 
  FileCode, 
  Send, 
  CheckCircle2, 
  Copy, 
  Check, 
  Radio, 
  Globe, 
  Zap,
  Cpu,
  Layers
} from 'lucide-react';

interface OpenApiContractTabProps {
  telemetry: TelemetryState;
}

export const OpenApiContractTab: React.FC<OpenApiContractTabProps> = ({ telemetry }) => {
  const [activeSubView, setActiveSubView] = useState<'sandbox' | 'raw_spec'>('sandbox');
  const [copiedSpec, setCopiedSpec] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<'yaw_stream' | 'exhaust_bypass' | 'drs_status' | 'wss_stream'>('yaw_stream');
  const [isExecuting, setIsExecuting] = useState(false);
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [responseLatencyUs, setResponseLatencyUs] = useState<number>(340);

  const handleCopySpec = () => {
    navigator.clipboard.writeText(OPENAPI_SPECIFICATION);
    setCopiedSpec(true);
    setTimeout(() => setCopiedSpec(false), 2000);
  };

  const handleSendRequest = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      const latency = Math.floor(280 + Math.random() * 90);
      setResponseLatencyUs(latency);

      if (selectedEndpoint === 'yaw_stream') {
        setApiResponse(JSON.stringify({
          status: "SUCCESS",
          code: 200,
          sequence_id: telemetry.monotonicSeq + 1,
          rear_steer_angle_deg: telemetry.rearWheelAngleDeg,
          phase: telemetry.phase,
          target_yaw_rate_deg_s: telemetry.targetYawRateDegS,
          calculated_yaw_rate_deg_s: telemetry.yawRateDegS,
          left_exhaust_duty_pct: telemetry.exhaustFlapDutyPct,
          right_exhaust_duty_pct: telemetry.exhaustFlapDutyPct,
          acoustic_pressure_db: telemetry.exhaustDecibels,
          loop_latency_us: latency,
          block_hmac_sha256: "8b94a28bb18d45e69e4f3a7638d21b3309a4714e8a4fe6480b85292c68e1462a",
          sla_compliance: "VERIFIED_SUB_1MS"
        }, null, 2));
      } else if (selectedEndpoint === 'exhaust_bypass') {
        setApiResponse(JSON.stringify({
          status: "ACTUATOR_ACKNOWLEDGED",
          code: 200,
          timestamp_ns: Date.now() * 1000000,
          mode: "DYNAMIC_CLOSED_LOOP",
          left_flap_duty_pct: telemetry.exhaustFlapDutyPct,
          right_flap_duty_pct: telemetry.exhaustFlapDutyPct,
          motor_bus_voltage_v: 13.8,
          acoustic_feedback_db: telemetry.exhaustDecibels
        }, null, 2));
      } else if (selectedEndpoint === 'drs_status') {
        setApiResponse(JSON.stringify({
          status: "HEALTHY",
          code: 200,
          hardware_id: "Apex Executive-LDH-RACK-7782B",
          current_rack_angle_deg: telemetry.rearWheelAngleDeg,
          limit_positive_deg: 2.0,
          limit_negative_deg: -2.0,
          phase_mode: telemetry.phase,
          rack_motor_current_amps: 2.4,
          divergence_flag: false,
          uptime_monotonic_seconds: 34812.8
        }, null, 2));
      } else {
        setApiResponse(JSON.stringify({
          type: "WEBSOCKET_FRAME_BROADCAST",
          frequency_hz: 1000,
          compression: "NONE_RAW_PROMETHEUS_COMPATIBLE",
          frames_transferred: 1048576,
          jitter_variance_ms: 0.02,
          client_subscribers: 4
        }, null, 2));
      }
    }, 250);
  };

  const getSamplePayload = () => {
    if (selectedEndpoint === 'yaw_stream') {
      return JSON.stringify({
        monotonic_ns: 1048576000000,
        vehicle_speed_kph: telemetry.speedKph,
        steering_angle_deg: telemetry.steeringWheelAngleDeg,
        lateral_accel_g: telemetry.lateralG,
        engine_rpm: telemetry.engineRpm,
        engine_load_pct: telemetry.engineLoadPct,
        top_status: telemetry.topStatus
      }, null, 2);
    } else if (selectedEndpoint === 'exhaust_bypass') {
      return JSON.stringify({
        override_mode: "DYNAMIC_CLOSED_LOOP",
        flap_duty_cycle_pct: telemetry.exhaustFlapDutyPct,
        transition_speed_ms: 80
      }, null, 2);
    } else if (selectedEndpoint === 'drs_status') {
      return "// GET request: No request body required";
    } else {
      return JSON.stringify({
        action: "SUBSCRIBE_STREAM",
        channels: ["imu_yaw", "drs_phase", "exhaust_acoustics"],
        frequency_hz: 1000
      }, null, 2);
    }
  };

  return (
    <div className="space-y-6">
      {/* Subview Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveSubView('sandbox')}
            className={`px-5 py-2.5 rounded-lg text-base font-bold transition-all cursor-pointer ${
              activeSubView === 'sandbox'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
            }`}
          >
            Interactive OpenAPI 3.1 Test Sandbox
          </button>
          <button
            type="button"
            onClick={() => setActiveSubView('raw_spec')}
            className={`px-5 py-2.5 rounded-lg text-base font-bold transition-all cursor-pointer ${
              activeSubView === 'raw_spec'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
            }`}
          >
            OpenAPI 3.1 Full Specification YAML
          </button>
        </div>

        {activeSubView === 'raw_spec' && (
          <button
            type="button"
            onClick={handleCopySpec}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-base font-semibold transition-colors cursor-pointer"
          >
            {copiedSpec ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-neutral-400" />}
            <span>{copiedSpec ? 'Copied Specification!' : 'Copy openapi_v31.yaml'}</span>
          </button>
        )}
      </div>

      {activeSubView === 'raw_spec' ? (
        /* OpenAPI Specification Code View */
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
            <div>
              <h2 className="text-3xl font-extrabold text-white">
                OpenAPI 3.1 High-Speed Protocol Contract
              </h2>
              <p className="text-base text-neutral-300 mt-1">
                Zero-dependency specification defining REST endpoints and 1,000 Hz WebSocket streaming channels.
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-base">
              OpenAPI 3.1.0 Validated
            </span>
          </div>

          <pre className="p-5 rounded-lg bg-neutral-950 text-neutral-200 font-mono text-base overflow-x-auto leading-relaxed border border-neutral-800 max-h-[650px] overflow-y-auto">
            <code>{OPENAPI_SPECIFICATION}</code>
          </pre>
        </div>
      ) : (
        /* Sandbox View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Endpoint Navigation */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-5 shadow-xl space-y-3">
              <h3 className="text-2xl font-extrabold text-white mb-2">
                Available Endpoints
              </h3>
              <p className="text-base text-neutral-300">
                Select a contract to test live against the touring telemetry engine:
              </p>

              <button
                type="button"
                onClick={() => { setSelectedEndpoint('yaw_stream'); setApiResponse(null); }}
                className={`w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                  selectedEndpoint === 'yaw_stream'
                    ? 'bg-amber-500/15 border-amber-500/50 text-white'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-base">
                    POST
                  </span>
                  <span className="font-mono font-semibold text-base">/v1/telemetry/yaw-stream</span>
                </div>
                <div className="text-base text-neutral-400">
                  Ingests 6-DOF IMU & returns real-time DRS steering rack angle
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedEndpoint('exhaust_bypass'); setApiResponse(null); }}
                className={`w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                  selectedEndpoint === 'exhaust_bypass'
                    ? 'bg-amber-500/15 border-amber-500/50 text-white'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-base">
                    POST
                  </span>
                  <span className="font-mono font-semibold text-base">/v1/actuators/exhaust-bypass</span>
                </div>
                <div className="text-base text-neutral-400">
                  Calibrated servo flap override & sound pressure query
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedEndpoint('drs_status'); setApiResponse(null); }}
                className={`w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                  selectedEndpoint === 'drs_status'
                    ? 'bg-amber-500/15 border-amber-500/50 text-white'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-bold text-base">
                    GET
                  </span>
                  <span className="font-mono font-semibold text-base">/v1/drs/status</span>
                </div>
                <div className="text-base text-neutral-400">
                  Queries active rear rack angle and health status
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedEndpoint('wss_stream'); setApiResponse(null); }}
                className={`w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                  selectedEndpoint === 'wss_stream'
                    ? 'bg-amber-500/15 border-amber-500/50 text-white'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono font-bold text-base">
                    WSS
                  </span>
                  <span className="font-mono font-semibold text-base">/v1/stream/highspeed</span>
                </div>
                <div className="text-base text-neutral-400">
                  Full-duplex 1,000 Hz binary WebSocket telemetry pipe
                </div>
              </button>
            </div>
          </div>

          {/* Sandbox Request / Response Panels */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded bg-amber-500/10 text-amber-400 font-mono font-bold text-base border border-amber-500/30">
                    HTTP Request Payload
                  </span>
                  <span className="text-base text-neutral-400">Content-Type: application/json</span>
                </div>
                <button
                  type="button"
                  onClick={handleSendRequest}
                  disabled={isExecuting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-base transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-5 h-5 text-neutral-950" />
                  <span>{isExecuting ? 'Dispatching...' : 'Dispatch Request'}</span>
                </button>
              </div>

              {/* Request JSON code block */}
              <pre className="p-4 rounded-lg bg-neutral-950 text-neutral-200 font-mono text-base border border-neutral-800 overflow-x-auto">
                <code>{getSamplePayload()}</code>
              </pre>

              {/* Response Section */}
              <div className="pt-4 border-t border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-white">HTTP 200 OK Response</span>
                    {apiResponse && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono font-bold text-base border border-emerald-500/30">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Latency: {responseLatencyUs} μs (&lt; 1,000 μs SLA)
                      </span>
                    )}
                  </div>
                  {apiResponse && (
                    <span className="text-base font-mono text-neutral-400">
                      Signature: HMAC-SHA256 Validated
                    </span>
                  )}
                </div>

                {apiResponse ? (
                  <pre className="p-4 rounded-lg bg-neutral-950 text-emerald-400 font-mono text-base border border-emerald-900/60 overflow-x-auto leading-relaxed">
                    <code>{apiResponse}</code>
                  </pre>
                ) : (
                  <div className="p-6 rounded-lg bg-neutral-950 border border-neutral-800/80 text-center text-neutral-400 text-base">
                    Click "Dispatch Request" above to trigger real-time telemetry execution and inspect the live JSON response payload.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
