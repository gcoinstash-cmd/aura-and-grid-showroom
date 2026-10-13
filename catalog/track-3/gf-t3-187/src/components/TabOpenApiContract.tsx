import React, { useState } from 'react';
import { Play, Copy, Check, Radio, FileCode } from 'lucide-react';
import { OPENAPI_31_YAML } from '../data/specDocument';

interface TabOpenApiContractProps {
  currentNonce: number;
  currentHmac: string;
}

export const TabOpenApiContract: React.FC<TabOpenApiContractProps> = ({
  currentNonce,
  currentHmac,
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<'step' | 'regen' | 'ws'>('step');
  const [packChemistry, setPackChemistry] = useState<'NIMH_216V_SEALED' | 'LI_ION_259V_DIRECT'>('LI_ION_259V_DIRECT');
  const [copiedYaml, setCopiedYaml] = useState(false);
  const [dispatchCount, setDispatchCount] = useState(1);

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(OPENAPI_31_YAML);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2000);
  };

  const samplePayload =
    selectedEndpoint === 'step'
      ? {
          request: {
            method: 'POST',
            path: '/v1/telemetry/swing-valve/step',
            body: {
              corner_position: 'FL',
              lvdt_piston_velocity_ms: 0.00192,
              stroke_displacement_mm: 0.18,
              fluid_temp_celsius: 42.5,
              driver_brake_demand_nm: 460.0,
              vehicle_speed_ms: 22.4,
              hv_battery_soc: 0.68,
            },
          },
          response: {
            status: 200,
            latency_us: 214,
            body: {
              monotonic_nonce: currentNonce + dispatchCount,
              regime: 'MICRO_SWING_BYPASS',
              swing_aperture_ratio: 0.9384,
              damping_force_n: 1.584,
              chamber_delta_pressure_kpa: 2.46,
              atkinson_bte_pct: 41.0,
              mg2_regen_torque_nm: 404.8,
              friction_brake_torque_nm: 55.2,
              seal_divergence_pct: 0.284,
              hmac_sha256: currentHmac,
            },
          },
        }
      : selectedEndpoint === 'regen'
      ? {
          request: {
            method: 'POST',
            path: '/v1/arbitration/battery-regen',
            body: {
              pack_chemistry: packChemistry,
              pack_voltage_v: packChemistry === 'LI_ION_259V_DIRECT' ? 259.2 : 216.0,
              pack_temp_c: 29.4,
              requested_decel_ms2: -2.65,
              pitch_rate_rads: 0.031,
            },
          },
          response: {
            status: 200,
            latency_us: 178,
            body: {
              pack_chemistry: packChemistry,
              regen_power_kw: packChemistry === 'LI_ION_259V_DIRECT' ? 38.4 : 31.2,
              front_bypass_stiffness_bias: 0.79,
              rear_bypass_stiffness_bias: 0.65,
              thermal_efficiency_pct: 41.0,
              anti_dive_pitch_reduction_pct: 64.2,
            },
          },
        }
      : {
          request: {
            protocol: 'WSS (RFC 6455 Binary + JSON Multiplex)',
            url: 'wss://es300h-core-gf-t3-187.a.run.app/v1/stream/es300h',
            subscription_frame: {
              action: 'SUBSCRIBE_2500HZ_WINDOW',
              corners: ['FL', 'FR', 'RL', 'RR'],
              include_hv_battery_regen: true,
              pack_chemistry: packChemistry,
            },
          },
          response: {
            status: 101,
            latency_us: 142,
            body: {
              stream_frame_seq: dispatchCount,
              monotonic_nonce: currentNonce + dispatchCount,
              sample_rate_hz: 2500,
              fl_velocity_ms: 0.00195,
              fr_velocity_ms: 0.00201,
              swing_bypass_open_pct: 93.6,
              hv_pack_chemistry: packChemistry,
              hv_regen_current_a: packChemistry === 'LI_ION_259V_DIRECT' ? -148.2 : -144.4,
              hmac_sha256: currentHmac,
            },
          },
        };

  return (
    <div className="space-y-6">
      {/* Interactive OpenAPI 3.1 Contract Sandbox */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              OpenAPI 3.1 Telemetry &amp; Regen Contract
            </h2>
            <p className="text-slate-300 text-sm mt-1">
              REST &amp; WebSocket schemas for raw LVDT damper stroke velocity sensors, hydraulic bypass valve pressure dispatch, and high-voltage NiMH / Li-ion battery regenerative telemetry broadcast.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPackChemistry('LI_ION_259V_DIRECT')}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs cursor-pointer transition-colors ${
                packChemistry === 'LI_ION_259V_DIRECT'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold'
                  : 'bg-slate-950 border border-slate-800 text-slate-400'
              }`}
            >
              Li-ion 259V Pack
            </button>
            <button
              type="button"
              onClick={() => setPackChemistry('NIMH_216V_SEALED')}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs cursor-pointer transition-colors ${
                packChemistry === 'NIMH_216V_SEALED'
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold'
                  : 'bg-slate-950 border border-slate-800 text-slate-400'
              }`}
            >
              NiMH 216V Pack
            </button>
          </div>
        </div>

        {/* Endpoint Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedEndpoint('step')}
              className={`px-3.5 py-2 rounded-lg font-mono text-xs cursor-pointer transition-colors ${
                selectedEndpoint === 'step'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              POST /v1/telemetry/swing-valve/step
            </button>

            <button
              type="button"
              onClick={() => setSelectedEndpoint('regen')}
              className={`px-3.5 py-2 rounded-lg font-mono text-xs cursor-pointer transition-colors ${
                selectedEndpoint === 'regen'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              POST /v1/arbitration/battery-regen
            </button>

            <button
              type="button"
              onClick={() => setSelectedEndpoint('ws')}
              className={`px-3.5 py-2 rounded-lg font-mono text-xs cursor-pointer transition-colors inline-flex items-center gap-1.5 ${
                selectedEndpoint === 'ws'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>WSS /v1/stream/es300h</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setDispatchCount((c) => c + 1)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold px-4 py-2 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Dispatch Test Payload (#{dispatchCount})</span>
          </button>
        </div>

        {/* Request / Response Split Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <div className="text-xs font-mono font-bold text-amber-400 mb-2">
              REQUEST PAYLOAD SCHEMA
            </div>
            <pre className="text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
              <code>{JSON.stringify(samplePayload.request, null, 2)}</code>
            </pre>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-400 mb-2">
              <span>DETERMINISTIC RESPONSE PAYLOAD</span>
              <span>HTTP {samplePayload.response.status} · {samplePayload.response.latency_us} μs</span>
            </div>
            <pre className="text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
              <code>{JSON.stringify(samplePayload.response.body, null, 2)}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Full OpenAPI 3.1.0 YAML Spec */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <FileCode className="w-5 h-5 text-emerald-400" />
              <span>Complete OpenAPI 3.1.0 Contract (`openapi_gf_t3_187.yaml`)</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Strict JSON Schema Draft 2020-12 validation · Binary &amp; JSON WebSocket telemetry broadcast
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyYaml}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs px-3.5 py-2 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
          >
            {copiedYaml ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied OpenAPI 3.1 YAML</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy OpenAPI 3.1 Spec</span>
              </>
            )}
          </button>
        </div>

        <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed max-h-[520px]">
          <code>{OPENAPI_31_YAML}</code>
        </pre>
      </div>
    </div>
  );
};
