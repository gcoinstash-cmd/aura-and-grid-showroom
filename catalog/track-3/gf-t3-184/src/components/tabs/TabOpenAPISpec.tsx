import React, { useState } from 'react';
import { Network, Copy, Check, Radio, Code2, Play, Send } from 'lucide-react';
import { TelemetryState } from '../../types/telemetry';

interface TabOpenAPISpecProps {
  telemetry: TelemetryState;
}

export const TabOpenAPISpec: React.FC<TabOpenAPISpecProps> = ({ telemetry }) => {
  const [copiedYaml, setCopiedYaml] = useState(false);
  const [activeEndpoint, setActiveEndpoint] = useState<'live' | 'rev' | 'ws'>('live');

  const openApiYaml = `openapi: 3.1.0
info:
  title: GF-T3-184 Lexus LFA Apex Telemetry Service
  version: 1.0.0-PROD
  description: High-fidelity optical telemetry ingest & WebSocket stream for 1LR-GUE V10 powertrain.
paths:
  /api/v1/telemetry/live:
    get:
      summary: Get real-time engine acoustics & ASG state
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TelemetrySnapshot'
  /api/v1/telemetry/simulate-rev:
    post:
      summary: Command optical tachometer sweep (0.60s idle-to-redline)
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                target_rpm: { type: integer, default: 9000 }
                sweep_duration_ms: { type: integer, default: 600 }
      responses:
        '200':
          description: Sweep initiated successfully
  /ws/v1/telemetry/stream:
    get:
      summary: High-frequency WebSocket stream (100Hz binary/JSON frame)
      description: Broadcasts optical tachometer pulses (10 pulses/rev), shift fork position feedback, throttle blade angle, and exhaust decibel stream.`;

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(openApiYaml);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5">
          <div className="flex items-center gap-2 mb-2">
            <Radio className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Optical Tachometer Pulses</h3>
          </div>
          <p className="text-base text-slate-400 leading-relaxed">
            10 optical pulses per crankshaft revolution. At 9,000 RPM, the sensor generates 1,500 Hz pulse trains ingested with microsecond timestamp fidelity.
          </p>
          <div className="mt-3.5 flex items-center justify-between text-base font-mono">
            <span className="text-slate-400">Pulse Resolution:</span>
            <span className="text-amber-400 font-bold">10 pulses / rev (1.5 kHz)</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5">
          <div className="flex items-center gap-2 mb-2">
            <Network className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Shift Fork Position Feedback</h3>
          </div>
          <p className="text-base text-slate-400 leading-relaxed">
            LVDT linear sensor reporting 0.00 to 18.50 mm dog-ring travel during the 60 ms fork traversal phase of the 150 ms ASG shift cycle.
          </p>
          <div className="mt-3.5 flex items-center justify-between text-base font-mono">
            <span className="text-slate-400">Fork Travel:</span>
            <span className="text-cyan-400 font-bold">{telemetry.shiftForkPositionMm.toFixed(2)} mm</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5">
          <div className="flex items-center gap-2 mb-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Exhaust Decibel Stream</h3>
          </div>
          <p className="text-base text-slate-400 leading-relaxed">
            Calibrated acoustic sensor in the central triple-exhaust outlet feeding real-time decibel measurements across all 10 cylinders.
          </p>
          <div className="mt-3.5 flex items-center justify-between text-base font-mono">
            <span className="text-slate-400">Current SPL:</span>
            <span className="text-emerald-400 font-bold">{telemetry.surgeTankDecibels.toFixed(1)} dB</span>
          </div>
        </div>
      </div>

      {/* Interactive API Explorer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-row flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">Interactive Endpoint Contract Inspector</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveEndpoint('live')}
              className={`cursor-pointer px-3.5 py-1.5 rounded-lg text-sm font-mono font-semibold border transition-all ${
                activeEndpoint === 'live'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              GET /api/v1/telemetry/live
            </button>
            <button
              type="button"
              onClick={() => setActiveEndpoint('rev')}
              className={`cursor-pointer px-3.5 py-1.5 rounded-lg text-sm font-mono font-semibold border transition-all ${
                activeEndpoint === 'rev'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              POST /simulate-rev
            </button>
            <button
              type="button"
              onClick={() => setActiveEndpoint('ws')}
              className={`cursor-pointer px-3.5 py-1.5 rounded-lg text-sm font-mono font-semibold border transition-all ${
                activeEndpoint === 'ws'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              WS /ws/telemetry/stream
            </button>
          </div>
        </div>

        {/* Live Payload Preview */}
        <div className="bg-slate-950 rounded-xl p-4.5 border border-slate-800 font-mono text-sm overflow-x-auto leading-relaxed">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-semibold">
            HTTP 200 OK | Content-Type: application/json | Monotonic Nonce #{telemetry.telemetryNonce}
          </div>
          <pre className="text-emerald-400">
{JSON.stringify(
  activeEndpoint === 'live'
    ? {
        nonce: telemetry.telemetryNonce,
        timestamp_ns: Date.now() * 1000000,
        rpm: Number(telemetry.rpm.toFixed(1)),
        gear: telemetry.gear,
        throttle_blade_angle_deg: Number(((telemetry.throttlePct / 100) * 88).toFixed(1)),
        optical_pulses_per_sec: Math.round((telemetry.rpm / 60) * 10),
        yamaha_intake_harmonics: {
          fundamental_f0_hz: Number(telemetry.intakeHarmonicHz.toFixed(2)),
          secondary_f1_hz: Number((telemetry.intakeHarmonicHz * 2).toFixed(2)),
          valvetrain_hz: Number(telemetry.titaniumValveHz.toFixed(2)),
          exhaust_sound_pressure_db: Number(telemetry.surgeTankDecibels.toFixed(1)),
        },
        asg_transmission: {
          shift_state: telemetry.isShifting ? 'FORK_TRAVERSAL' : 'ENGAGED',
          actuation_latency_ms: telemetry.asgShiftDurationMs,
          shift_fork_position_mm: Number(telemetry.shiftForkPositionMm.toFixed(2)),
          hydraulic_line_pressure_psi: Number(telemetry.asgHydraulicPressurePsi.toFixed(1)),
        },
        dry_sump_oil: {
          scavenge_pressure_bar: Number(telemetry.scavengePressureBar.toFixed(2)),
          temperature_c: telemetry.oilTempC,
          quarantine_flag: false,
        },
        hmac_signature: telemetry.hmacSignature,
      }
    : activeEndpoint === 'rev'
    ? {
        status: 'ACCEPTED',
        command: 'OPTICAL_TACHOMETER_SWEEP',
        parameters: {
          start_rpm: 950,
          redline_rpm: 9000,
          target_duration_ms: 600,
          acoustic_profile: 'YAMAHA_SURGE_TUNED',
        },
        hmac_digest: '2f891a0b7c4d8120e3a419c8f00124b892a01948271038472910481726481920',
      }
    : {
        stream_protocol: 'WEBSOCKET_FRAME_V1',
        frequency_hz: 100,
        binary_payload_format: 'LFA_RAW_PACKET_64B',
        fields: [
          'uint64 timestamp_ns',
          'uint32 optical_tach_pulses',
          'float32 throttle_angle',
          'float32 shift_fork_mm',
          'float32 exhaust_db',
          'uint8 gear',
          'uint8 hmac_sig[32]',
        ],
      },
  null,
  2
)}
          </pre>
        </div>
      </div>

      {/* OpenAPI Spec Code Block */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            <span className="font-mono text-base font-semibold text-slate-200">
              contracts/openapi_v3_1.yaml (OpenAPI 3.1 Contract Specification)
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyYaml}
            className="cursor-pointer text-sm font-mono text-slate-300 hover:text-white px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            {copiedYaml ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copiedYaml ? 'Copied YAML' : 'Copy OpenAPI Contract'}
          </button>
        </div>
        <div className="p-4 bg-slate-950/90 overflow-x-auto max-h-[420px] font-mono text-base text-slate-200 leading-relaxed">
          <pre>{openApiYaml}</pre>
        </div>
      </div>
    </div>
  );
};
