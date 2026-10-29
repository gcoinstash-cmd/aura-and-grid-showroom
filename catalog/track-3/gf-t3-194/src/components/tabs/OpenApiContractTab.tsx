import React, { useState } from 'react';
import { FileCode, Send, Copy, Check, Radio, Terminal, Wifi, CheckCircle2 } from 'lucide-react';
import { HydraulicState } from '../../types/telemetry';

interface OpenApiContractTabProps {
  hydraulicState: HydraulicState;
}

const OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "Apex Executive Ultra-Heavy Telemetry Core High-G Dynamic Telemetry (GF-T3-194) AHC & MTS Telemetry API",
    version: "1.0.0-PROD",
    description: "Production REST & WebSocket API specification for 4-wheel Active Height Control and Multi-Terrain Select hydraulic telemetry.",
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT"
    }
  },
  servers: [
    {
      url: "https://ahc-core-lx600.run.app",
      description: "Google Cloud Run Production Cluster"
    }
  ],
  paths: {
    "/api/v1/ahc/height/step": {
      post: {
        summary: "Command Ride Height Target Step",
        description: "Executes electro-hydraulic accumulator charge/discharge to adjust 4 corners.",
        operationId: "setRideHeight",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["target_mode"],
                properties: {
                  target_mode: {
                    type: "string",
                    enum: ["LOW", "NORMAL", "HIGH_1", "HIGH_2", "EXTRA_HIGH"],
                    example: "HIGH_1"
                  },
                  speed_kmh: {
                    type: "number",
                    description: "Current vehicle road speed for safety interlock validation",
                    example: 45.0
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Height transition command accepted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "TRANSITIONING" },
                    target_mode: { type: "string", example: "HIGH_1" },
                    target_offset_mm: { type: "number", example: 35.0 },
                    estimated_transit_sec: { type: "number", example: 2.4 },
                    safety_interlock_cleared: { type: "boolean", example: true }
                  }
                }
              }
            }
          },
          "422": {
            description: "Aero speed interlock violation (>100 km/h prohibits High mode)"
          }
        }
      }
    },
    "/api/v1/ahc/telemetry/corners": {
      get: {
        summary: "Retrieve 4-Corner Electro-Hydraulic Telemetry",
        operationId: "getCornerTelemetry",
        responses: {
          "200": {
            description: "Current corner sensor matrix with adiabatic nitrogen pressure",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    timestamp: { type: "string", format: "date-time" },
                    nonce: { type: "integer", example: 1048592 },
                    height_mode: { type: "string", example: "NORMAL" },
                    mts_mode: { type: "string", example: "AUTO" },
                    corners: {
                      type: "object",
                      properties: {
                        FL: { $ref: "#/components/schemas/CornerMetrics" },
                        FR: { $ref: "#/components/schemas/CornerMetrics" },
                        RL: { $ref: "#/components/schemas/CornerMetrics" },
                        RR: { $ref: "#/components/schemas/CornerMetrics" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/mts/mode": {
      post: {
        summary: "Select Multi-Terrain Surface Damping Profile",
        operationId: "setMtsProfile",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["mts_mode"],
                properties: {
                  mts_mode: {
                    type: "string",
                    enum: ["AUTO", "DIRT", "SAND", "MUD", "DEEP_SNOW", "ROCK"],
                    example: "ROCK"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "MTS profile applied to hydraulic valve orifices",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "MTS_ACTIVE" },
                    mode: { type: "string", example: "ROCK" },
                    damping_multiplier: { type: "number", example: 1.6 },
                    accumulator_ratio: { type: "number", example: 1.45 }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      CornerMetrics: {
        type: "object",
        properties: {
          pressure_bar: { type: "number", example: 184.2 },
          height_mm: { type: "number", example: 0.0 },
          gas_chamber_bar: { type: "number", example: 140.0 },
          spring_rate_n_mm: { type: "number", example: 48.0 },
          valve_state: { type: "string", example: "IDLE" }
        }
      }
    }
  }
};

export const OpenApiContractTab: React.FC<OpenApiContractTabProps> = ({
  hydraulicState,
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<'POST_HEIGHT' | 'GET_CORNERS' | 'POST_MTS' | 'WS_STREAM'>('GET_CORNERS');
  const [reqHeight, setReqHeight] = useState<'LOW' | 'NORMAL' | 'HIGH_1' | 'HIGH_2'>('HIGH_1');
  const [reqMts, setReqMts] = useState<'AUTO' | 'DIRT' | 'SAND' | 'MUD' | 'DEEP_SNOW' | 'ROCK'>('ROCK');
  const [mockResponse, setMockResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleCopySpec = () => {
    navigator.clipboard.writeText(JSON.stringify(OPENAPI_SPEC, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteMock = () => {
    setIsExecuting(true);
    setTimeout(() => {
      let respObj: Record<string, unknown> = {};

      if (selectedEndpoint === 'GET_CORNERS') {
        respObj = {
          status: 200,
          latency_ms: 1.4,
          timestamp: new Date().toISOString(),
          nonce: 1048596,
          height_mode: hydraulicState.heightLevel,
          mts_mode: hydraulicState.mtsMode,
          line_pressure_bar: hydraulicState.linePressureBar,
          corners: {
            FL: {
              pressure_bar: Number(hydraulicState.corners.FL.pressureBar.toFixed(1)),
              height_mm: Number(hydraulicState.corners.FL.heightMm.toFixed(1)),
              gas_chamber_bar: Number(hydraulicState.corners.FL.gasChamberBar.toFixed(1)),
              spring_rate_n_mm: Number(hydraulicState.corners.FL.springRateNmm.toFixed(1)),
              valve_state: "IDLE"
            },
            FR: {
              pressure_bar: Number(hydraulicState.corners.FR.pressureBar.toFixed(1)),
              height_mm: Number(hydraulicState.corners.FR.heightMm.toFixed(1)),
              gas_chamber_bar: Number(hydraulicState.corners.FR.gasChamberBar.toFixed(1)),
              spring_rate_n_mm: Number(hydraulicState.corners.FR.springRateNmm.toFixed(1)),
              valve_state: "IDLE"
            },
            RL: {
              pressure_bar: Number(hydraulicState.corners.RL.pressureBar.toFixed(1)),
              height_mm: Number(hydraulicState.corners.RL.heightMm.toFixed(1)),
              gas_chamber_bar: Number(hydraulicState.corners.RL.gasChamberBar.toFixed(1)),
              spring_rate_n_mm: Number(hydraulicState.corners.RL.springRateNmm.toFixed(1)),
              valve_state: "IDLE"
            },
            RR: {
              pressure_bar: Number(hydraulicState.corners.RR.pressureBar.toFixed(1)),
              height_mm: Number(hydraulicState.corners.RR.heightMm.toFixed(1)),
              gas_chamber_bar: Number(hydraulicState.corners.RR.gasChamberBar.toFixed(1)),
              spring_rate_n_mm: Number(hydraulicState.corners.RR.springRateNmm.toFixed(1)),
              valve_state: "IDLE"
            }
          }
        };
      } else if (selectedEndpoint === 'POST_HEIGHT') {
        const isSpeedBlocked = hydraulicState.speedKmh >= 100 && (reqHeight === 'HIGH_1' || reqHeight === 'HIGH_2');
        if (isSpeedBlocked) {
          respObj = {
            status: 422,
            error: "UNPROCESSABLE_ENTITY",
            message: "Aero speed interlock active: road speed 100+ km/h prohibits High ride height modes.",
            current_speed_kmh: hydraulicState.speedKmh,
            mandatory_mode: "LOW"
          };
        } else {
          respObj = {
            status: 200,
            command: "SET_RIDE_HEIGHT",
            target_mode: reqHeight,
            estimated_transit_sec: 2.1,
            safety_interlock_cleared: true,
            accumulator_pressure_head_bar: 220.0
          };
        }
      } else if (selectedEndpoint === 'POST_MTS') {
        respObj = {
          status: 200,
          command: "SET_MTS_PROFILE",
          mode: reqMts,
          orifice_damping_adjusted: true,
          throttle_mapping_engaged: true,
          ack_timestamp: new Date().toISOString()
        };
      } else if (selectedEndpoint === 'WS_STREAM') {
        respObj = {
          event: "TELEMETRY_FRAME_BROADCAST",
          frequency_hz: 50,
          downsampled_from_hz: 2200,
          socket_channel: "lx600.telemetry.ahc.raw",
          payload: {
            nonce: 1048601,
            fl_bar: Number(hydraulicState.corners.FL.pressureBar.toFixed(1)),
            fr_bar: Number(hydraulicState.corners.FR.pressureBar.toFixed(1)),
            rl_bar: Number(hydraulicState.corners.RL.pressureBar.toFixed(1)),
            rr_bar: Number(hydraulicState.corners.RR.pressureBar.toFixed(1)),
            hmac_signature: "7f8b92c431e549da8b61e860959828d1fa71cf19385bf55b11c03478a287236b"
          }
        };
      }

      setMockResponse(JSON.stringify(respObj, null, 2));
      setIsExecuting(false);
    }, 250);
  };

  return (
    <div className="space-y-6">
      {/* Title Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <FileCode className="w-7 h-7 text-cyan-400" />
              OpenAPI 3.1 Telemetry Contract & WebSocket Stream
            </h2>
            <p className="text-slate-400 text-base mt-1">
              Strictly typed REST endpoints and high-throughput 2,200 Hz downsampled WebSocket channel for corner pressure feedback, height commands, and terrain switching.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySpec}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-base px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied OpenAPI Spec!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy OpenAPI 3.1 JSON</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Interactive Endpoint Sandbox */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Endpoint Selector Navigation */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-slate-300 font-bold text-base block mb-2">
              Available Endpoints:
            </span>

            <button
              onClick={() => { setSelectedEndpoint('GET_CORNERS'); setMockResponse(null); }}
              className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                selectedEndpoint === 'GET_CORNERS'
                  ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-400 font-mono font-bold text-base px-2 py-0.5 rounded">
                  GET
                </span>
                <span className="font-mono text-base font-bold truncate">
                  /api/v1/ahc/telemetry/corners
                </span>
              </div>
              <p className="text-slate-400 text-base mt-1 line-clamp-1">
                4-corner pressure sensor matrix
              </p>
            </button>

            <button
              onClick={() => { setSelectedEndpoint('POST_HEIGHT'); setMockResponse(null); }}
              className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                selectedEndpoint === 'POST_HEIGHT'
                  ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/20 text-amber-400 font-mono font-bold text-base px-2 py-0.5 rounded">
                  POST
                </span>
                <span className="font-mono text-base font-bold truncate">
                  /api/v1/ahc/height/step
                </span>
              </div>
              <p className="text-slate-400 text-base mt-1 line-clamp-1">
                Ride height adjustment command
              </p>
            </button>

            <button
              onClick={() => { setSelectedEndpoint('POST_MTS'); setMockResponse(null); }}
              className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                selectedEndpoint === 'POST_MTS'
                  ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/20 text-amber-400 font-mono font-bold text-base px-2 py-0.5 rounded">
                  POST
                </span>
                <span className="font-mono text-base font-bold truncate">
                  /api/v1/mts/mode
                </span>
              </div>
              <p className="text-slate-400 text-base mt-1 line-clamp-1">
                Multi-Terrain damping selection
              </p>
            </button>

            <button
              onClick={() => { setSelectedEndpoint('WS_STREAM'); setMockResponse(null); }}
              className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                selectedEndpoint === 'WS_STREAM'
                  ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="bg-indigo-500/20 text-indigo-400 font-mono font-bold text-base px-2 py-0.5 rounded flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5" />
                  WSS
                </span>
                <span className="font-mono text-base font-bold truncate">
                  /ws/v1/telemetry/stream
                </span>
              </div>
              <p className="text-slate-400 text-base mt-1 line-clamp-1">
                Real-time WebSocket telemetry frame
              </p>
            </button>
          </div>

          {/* Request Payload & Interactive Trigger */}
          <div className="lg:col-span-8 bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="font-mono text-base font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Mock API Tester Console
                </div>
                <button
                  onClick={handleExecuteMock}
                  disabled={isExecuting}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-base px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Request</span>
                </button>
              </div>

              {/* Param Form Inputs depending on endpoint */}
              {selectedEndpoint === 'POST_HEIGHT' && (
                <div className="space-y-3 mb-4">
                  <label className="text-slate-300 font-semibold text-base block">
                    Target Ride Height (target_mode):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['LOW', 'NORMAL', 'HIGH_1', 'HIGH_2'] as const).map((h) => (
                      <button
                        key={h}
                        onClick={() => setReqHeight(h)}
                        className={`px-3 py-1.5 rounded font-mono font-bold text-base transition-all cursor-pointer ${
                          reqHeight === h
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                  <div className="text-slate-400 text-base">
                    Current simulated vehicle speed: <strong className="text-cyan-400 font-mono">{hydraulicState.speedKmh} km/h</strong> (Aero limit: 100 km/h)
                  </div>
                </div>
              )}

              {selectedEndpoint === 'POST_MTS' && (
                <div className="space-y-3 mb-4">
                  <label className="text-slate-300 font-semibold text-base block">
                    Target Terrain Profile (mts_mode):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['AUTO', 'DIRT', 'SAND', 'MUD', 'DEEP_SNOW', 'ROCK'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setReqMts(m)}
                        className={`px-3 py-1.5 rounded font-mono font-bold text-base transition-all cursor-pointer ${
                          reqMts === m
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedEndpoint === 'GET_CORNERS' && (
                <div className="text-slate-400 text-base mb-4">
                  Querying live transducer status from 4 corners: FL, FR, RL, RR with nitrogen pressure head and hydraulic line bar.
                </div>
              )}

              {selectedEndpoint === 'WS_STREAM' && (
                <div className="text-slate-400 text-base mb-4">
                  WebSocket connection established at <span className="font-mono text-cyan-400">wss://ahc-core-lx600.run.app/ws/v1/telemetry/stream</span> with 50 Hz frame frequency downsampled from 2,200 Hz loop clock.
                </div>
              )}

              {/* Response Block */}
              <div className="mt-2">
                <span className="text-slate-400 font-mono text-base block mb-1">
                  Response Output (200 OK):
                </span>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 max-h-[220px] overflow-y-auto">
                  <pre className="font-mono text-base text-emerald-400 leading-relaxed">
                    <code>
                      {mockResponse ||
                        `// Click "Send Request" to invoke ${selectedEndpoint} mock endpoint.`}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OpenAPI Specification Viewer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-cyan-400" />
          OpenAPI 3.1 Complete Schema Contract (openapi.json)
        </h3>
        <p className="text-slate-400 text-base mb-4">
          Machine-readable specification conforming to OpenAPI 3.1.0 standard.
        </p>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-x-auto max-h-[360px]">
          <pre className="font-mono text-base text-slate-300 leading-relaxed">
            <code>{JSON.stringify(OPENAPI_SPEC, null, 2)}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
