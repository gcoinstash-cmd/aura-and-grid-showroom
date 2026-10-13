import React, { useState } from 'react';
import { PowertrainState } from '../types/telemetry';
import { Network, Radio, Send, Play, Pause, Copy, Check } from 'lucide-react';

interface TabOpenApiContractProps {
  state: PowertrainState;
}

export const TabOpenApiContract: React.FC<TabOpenApiContractProps> = ({ state }) => {
  const [activeSchema, setActiveSchema] = useState<'wheel_speed' | 'torque_bias' | 'steer_resolver' | 'battery_delta'>('torque_bias');
  const [isStreaming, setIsStreaming] = useState(true);
  const [copiedContract, setCopiedContract] = useState(false);

  // Generate live wheel speeds from vehicle speed and steering angle
  const radPerSec = (state.speedKmh * 1000) / 3600 / 0.364;
  const steerCorrection = (state.roadWheelAngleDeg / 35) * 0.08;

  const sampleSchemas = {
    wheel_speed: {
      title: 'Raw Wheel Speed Sensors (4-Wheel Hall Array)',
      endpoint: 'GET /api/v1/sensors/wheel-speed',
      wsChannel: 'telemetry:sensors.wheel_speed',
      frequency: '1,000 Hz CAN-FD Bus',
      samplePayload: {
        timestamp_ns: Date.now() * 1000000,
        nonce: state.monotonicNonce,
        wheels: {
          front_left: {
            angular_velocity_rad_s: (radPerSec * (1 - steerCorrection)).toFixed(2),
            speed_kmh: (state.speedKmh * (1 - steerCorrection)).toFixed(1),
            pulse_count: 48,
            signal_quality_pct: 99.8,
          },
          front_right: {
            angular_velocity_rad_s: (radPerSec * (1 + steerCorrection)).toFixed(2),
            speed_kmh: (state.speedKmh * (1 + steerCorrection)).toFixed(1),
            pulse_count: 48,
            signal_quality_pct: 99.9,
          },
          rear_left: {
            angular_velocity_rad_s: (radPerSec * (1 - steerCorrection * 0.4)).toFixed(2),
            speed_kmh: (state.speedKmh * (1 - steerCorrection * 0.4)).toFixed(1),
            pulse_count: 48,
            signal_quality_pct: 100.0,
          },
          rear_right: {
            angular_velocity_rad_s: (radPerSec * (1 + steerCorrection * 0.4)).toFixed(2),
            speed_kmh: (state.speedKmh * (1 + steerCorrection * 0.4)).toFixed(1),
            pulse_count: 48,
            signal_quality_pct: 100.0,
          },
        },
      },
    },
    torque_bias: {
      title: 'Front/Rear Torque Bias Commands (Direct4 Allocation)',
      endpoint: 'POST /api/v1/powertrain/torque-bias',
      wsChannel: 'telemetry:powertrain.direct4',
      frequency: '500 Hz Real-Time Bus',
      samplePayload: {
        timestamp_ns: Date.now() * 1000000,
        nonce: state.monotonicNonce,
        command: {
          front_eaxle_nm: state.frontTorqueNm,
          rear_eaxle_nm: state.rearTorqueNm,
          front_percentage: state.direct4SplitFront,
          rear_percentage: state.direct4SplitRear,
          control_mode: state.throttleDemand < 0 ? 'REGEN_DECEL_BIAS' : 'DYNAMIC_DIRECT4_NOMINAL',
        },
        inverter_limits: {
          front_sic_max_amps: 260.0,
          rear_sic_max_amps: 180.0,
          flux_weakening_active: state.fluxWeakeningActive,
          id_demagnetizing_amps: state.idFluxA,
          iq_torque_amps: state.iqTorqueA,
        },
      },
    },
    steer_resolver: {
      title: 'Steering Angle Resolver Dual-Redundancy Feedback',
      endpoint: 'GET /api/v1/steer-by-wire/resolvers',
      wsChannel: 'telemetry:steering.resolvers',
      frequency: '2,500 Hz Redundant Loop',
      samplePayload: {
        timestamp_ns: Date.now() * 1000000,
        nonce: state.monotonicNonce,
        resolvers: {
          primary_resolver_deg: state.yokeAngleDeg.toFixed(3),
          secondary_resolver_deg: (state.yokeAngleDeg + 0.015).toFixed(3),
          resolver_cross_delta_deg: '0.015',
          redundancy_status: 'DUAL_HEALTHY_LOCKED',
        },
        rack_actuator: {
          road_wheel_angle_deg: state.roadWheelAngleDeg.toFixed(2),
          variable_ratio: state.steeringRatio.toFixed(2),
          rack_thrust_force_kn: (Math.abs(state.roadWheelAngleDeg) * 0.18 + 0.45).toFixed(2),
        },
      },
    },
    battery_delta: {
      title: 'High-Voltage Battery Cell Delta & DC Bus Broadcast',
      endpoint: 'GET /api/v1/battery/cell-delta',
      wsChannel: 'telemetry:battery.bms',
      frequency: '100 Hz BMS Stream',
      samplePayload: {
        timestamp_ns: Date.now() * 1000000,
        nonce: state.monotonicNonce,
        pack: {
          topology: '96S2P Lithium-Ion',
          dc_bus_voltage_v: state.dcBusVoltage,
          pack_current_a: state.packCurrentA,
          state_of_charge_pct: state.batterySoc,
          rated_capacity_kwh: 71.4,
        },
        cell_monitoring: {
          cell_voltage_min_v: 3.692,
          cell_voltage_max_v: (3.692 + state.batteryCellDeltaMv / 1000).toFixed(3),
          cell_delta_mv: state.batteryCellDeltaMv,
          cell_balancing_active: state.batteryCellDeltaMv > 25.0,
          coolant_inlet_temp_c: 24.5,
          coolant_outlet_temp_c: 27.2,
        },
      },
    },
  };

  const copyContract = () => {
    navigator.clipboard.writeText(JSON.stringify(sampleSchemas[activeSchema], null, 2));
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  const currentSchemaObj = sampleSchemas[activeSchema];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Network className="w-5 h-5 text-sky-400" />
              OpenAPI 3.1 & High-Frequency Telemetry Protocol Contract
            </h2>
            <p className="text-[15px] text-slate-400 mt-1">
              Strictly typed contracts for CAN-FD sensor arrays, dual SiC inverter commands, redundant Steer-by-Wire resolvers, and BMS cell metrics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                isStreaming
                  ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {isStreaming ? <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isStreaming ? 'WebSocket Stream Active' : 'Stream Paused'}</span>
            </button>

            <button
              onClick={copyContract}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {copiedContract ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedContract ? 'Copied' : 'Copy Schema'}</span>
            </button>
          </div>
        </div>

        {/* 4 Protocol Channels */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveSchema('torque_bias')}
            className={`p-3 rounded-lg text-left transition-colors cursor-pointer border ${
              activeSchema === 'torque_bias'
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="text-xs font-mono uppercase">Direct4 Control</div>
            <div className="text-[15px] font-bold text-white mt-1">Torque Bias Command</div>
            <div className="text-xs text-slate-400 mt-1">500 Hz Real-Time</div>
          </button>

          <button
            onClick={() => setActiveSchema('steer_resolver')}
            className={`p-3 rounded-lg text-left transition-colors cursor-pointer border ${
              activeSchema === 'steer_resolver'
                ? 'bg-sky-500/10 border-sky-500/40 text-sky-300'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="text-xs font-mono uppercase">Steer-by-Wire</div>
            <div className="text-[15px] font-bold text-white mt-1">Dual Resolvers</div>
            <div className="text-xs text-slate-400 mt-1">2,500 Hz Redundant</div>
          </button>

          <button
            onClick={() => setActiveSchema('wheel_speed')}
            className={`p-3 rounded-lg text-left transition-colors cursor-pointer border ${
              activeSchema === 'wheel_speed'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="text-xs font-mono uppercase">Wheel Sensors</div>
            <div className="text-[15px] font-bold text-white mt-1">4-Wheel Hall Array</div>
            <div className="text-xs text-slate-400 mt-1">1,000 Hz CAN-FD</div>
          </button>

          <button
            onClick={() => setActiveSchema('battery_delta')}
            className={`p-3 rounded-lg text-left transition-colors cursor-pointer border ${
              activeSchema === 'battery_delta'
                ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="text-xs font-mono uppercase">BMS Telemetry</div>
            <div className="text-[15px] font-bold text-white mt-1">HV Cell Delta</div>
            <div className="text-xs text-slate-400 mt-1">100 Hz Broadcast</div>
          </button>
        </div>
      </div>

      {/* Protocol Inspector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">{currentSchemaObj.title}</h3>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-1">
              <span className="text-emerald-400 font-semibold">{currentSchemaObj.endpoint}</span>
              <span className="text-slate-600">|</span>
              <span className="text-sky-400">{currentSchemaObj.wsChannel}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300">{currentSchemaObj.frequency}</span>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span>Nonce: #{state.monotonicNonce}</span>
            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              SCHEMA VALID
            </span>
          </div>
        </div>

        {/* Live JSON Payload Inspector */}
        <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto text-xs font-mono text-sky-300 border border-slate-800/80 leading-relaxed max-h-[380px]">
          <code>{JSON.stringify(currentSchemaObj.samplePayload, null, 2)}</code>
        </pre>
      </div>
    </div>
  );
};
