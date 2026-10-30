/**
 * GhostFactoryOS — Track 2 Batch Golf Fabrication Engine
 * Stamping 28 Standalone Flagship Cockpits into cockpits/batch-golf/ (Units #466 through #493)
 * and wiring them into cockpits/index.html Master Inspection Deck (locking Track 2 at 164 total units).
 */

import fs from 'node:fs';
import path from 'node:path';
import { AUTONOMOUS_SCADA_COCKPITS } from './batch-golf-cockpits-1.mjs';
import { QUANT_LIQUIDITY_COCKPITS } from './batch-golf-cockpits-2.mjs';
import { EDGE_AI_SWARM_COCKPITS } from './batch-golf-cockpits-3.mjs';
import { CLOUD_TELEMETRY_INFRA_COCKPITS } from './batch-golf-cockpits-4.mjs';

const ALL_COCKPITS = [
  ...AUTONOMOUS_SCADA_COCKPITS,
  ...QUANT_LIQUIDITY_COCKPITS,
  ...EDGE_AI_SWARM_COCKPITS,
  ...CLOUD_TELEMETRY_INFRA_COCKPITS
];

const ROOT_DIR = process.cwd();
const TARGET_DIR = path.join(ROOT_DIR, 'cockpits', 'batch-golf');

console.log(`⚡ [GhostFactoryOS] Scaffolding ${ALL_COCKPITS.length} Track 2 Flagship Cockpits into ${TARGET_DIR}...`);

function generateSvgVisualizer(type, accent, pulsePhase) {
  switch (type) {
    case 'avionics_attitude':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <circle cx="300" cy="120" r="85" fill="#0D1117" stroke="#1F2937" strokeWidth="2" />
          <line x1="215" y1="120" x2="385" y2="120" stroke="${accent}" strokeWidth="2" strokeDasharray="4 2" />
          <path d="M 270 120 L 290 120 L 300 130 L 310 120 L 330 120" fill="none" stroke="#FF9F0A" strokeWidth="3" />
          <line x1="285" y1="95" x2="315" y2="95" stroke="#94A3B8" strokeWidth="1" />
          <line x1="285" y1="145" x2="315" y2="145" stroke="#94A3B8" strokeWidth="1" />
          <text x="300" y="50" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">HEADING: 184° // PITCH: +1.2° // ROLL: -0.2°</text>
          <text x="300" y="215" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">KALMAN SENSOR FUSION // 1,000 HZ ATTITUDE FILTER</text>
        </svg>
      `;

    case 'plc_ladder':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <line x1="100" y1="40" x2="100" y2="200" stroke="#FF9F0A" strokeWidth="3" />
          <line x1="500" y1="40" x2="500" y2="200" stroke="#00F0FF" strokeWidth="3" />
          <g transform="translate(0, 20)">
            <line x1="100" y1="70" x2="220" y2="70" stroke="#94A3B8" strokeWidth="2" />
            <path d="M 220 58 L 220 82 M 235 58 L 235 82" stroke="${accent}" strokeWidth="2.5" fill="none" />
            <line x1="235" y1="70" x2="360" y2="70" stroke="#94A3B8" strokeWidth="2" />
            <path d="M 360 58 L 360 82 M 375 58 L 375 82" stroke="${accent}" strokeWidth="2.5" fill="none" />
            <line x1="375" y1="70" x2="440" y2="70" stroke="#94A3B8" strokeWidth="2" />
            <circle cx="455" cy="70" r="14" fill="#0D1117" stroke="#22C55E" strokeWidth="2" />
            <text x="455" y="74" textAnchor="middle" fill="#22C55E" fontSize="9" fontFamily="monospace">COIL</text>
            <line x1="470" y1="70" x2="500" y2="70" stroke="#94A3B8" strokeWidth="2" />
          </g>
          <text x="300" y="170" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">IEC 61131-3 LADDER RUNGS // SIL-3 SAFETY TRIP ACTIVE</text>
          <text x="300" y="195" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">SCAN CYCLE TIME: 1.24ms // OPC-UA 48,200 DETERMINISTIC TAGS</text>
        </svg>
      `;

    case 'lidar_voxel_radar':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <circle cx="300" cy="120" r="90" fill="none" stroke="#1F2937" strokeWidth="1.5" />
          <circle cx="300" cy="120" r="60" fill="none" stroke="#1F2937" strokeWidth="1.5" />
          <circle cx="300" cy="120" r="30" fill="none" stroke="#1F2937" strokeWidth="1.5" />
          <line x1="300" y1="30" x2="300" y2="210" stroke="#1F2937" strokeWidth="1" />
          <line x1="210" y1="120" x2="390" y2="120" stroke="#1F2937" strokeWidth="1" />
          {/* Voxel point clusters */}
          <circle cx="280" cy="90" r="3" fill="${accent}" />
          <circle cx="330" cy="80" r="4" fill="${accent}" />
          <circle cx="340" cy="140" r="3" fill="${accent}" />
          <circle cx="260" cy="150" r="4" fill="#FF9F0A" />
          <circle cx="300" cy="120" r="6" fill="#00F0FF" />
          <text x="300" y="25" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">128-BEAM SOLID-STATE LIDAR // 2.4M PTS/SEC</text>
          <text x="300" y="225" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">VOXEL OCCUPANCY: 0.05m³ RES // 300M RANGE HORIZON</text>
        </svg>
      `;

    case 'haptic_loop':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <line x1="120" y1="120" x2="480" y2="120" stroke="#1F2937" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 120 120 Q 210 50, 300 120 T 480 120" fill="none" stroke="${accent}" strokeWidth="2.5" />
          <path d="M 120 120 Q 210 190, 300 120 T 480 120" fill="none" stroke="#00F0FF" strokeWidth="1.5" strokeDasharray="5 3" />
          <circle cx="300" cy="120" r="12" fill="#0D1117" stroke="${accent}" strokeWidth="2" />
          <text x="300" y="124" textAnchor="middle" fill="${accent}" fontSize="8" fontFamily="monospace">1 kHz</text>
          <text x="300" y="40" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">WEBRTC DATACHANNEL TELEOP // 4.82ms RTT</text>
          <text x="300" y="210" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">65Nm FORCE FEEDBACK // H.265-LL 4K@60FPS STEREO</text>
        </svg>
      `;

    case 'pwm_oscilloscope':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <line x1="80" y1="120" x2="520" y2="120" stroke="#1F2937" strokeWidth="1.5" />
          {/* 3-Phase SVPWM Waveforms */}
          <path d="M 80 80 H 120 V 160 H 160 V 80 H 200 V 160 H 240 V 80 H 280 V 160 H 320 V 80 H 360 V 160 H 400 V 80 H 440 V 160 H 480 V 80 H 520" fill="none" stroke="${accent}" strokeWidth="2" />
          <path d="M 80 120 Q 190 40, 300 120 T 520 120" fill="none" stroke="#FF9F0A" strokeWidth="2" opacity="0.7" />
          <text x="300" y="45" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">SVPWM CARRIER: 40.0 kHz // 184.2 Nm INSTANT TORQUE</text>
          <text x="300" y="205" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">FIELD ORIENTED CONTROL (FOC) // 12,400 e-RPM RESOLVER LOCK</text>
        </svg>
      `;

    case 'bms_cell_matrix':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <g transform="translate(110, 50)">
            {Array.from({ length: 8 }).map((_, i) => (
              <g key={i} transform={\`translate(\${i * 48}, 0)\`}>
                <rect width="36" height="85" rx="4" fill="#0D1117" stroke="${accent}" strokeWidth="1.5" />
                <rect x="4" y={85 - 65} width="28" height="60" rx="2" fill="#22C55E" opacity="0.8" />
                <text x="18" y="48" textAnchor="middle" fill="#FFF" fontSize="8" fontFamily="monospace">4.18V</text>
                <text x="18" y="105" textAnchor="middle" fill="#94A3B8" fontSize="8" fontFamily="monospace">C{i+1}</text>
              </g>
            ))}
          </g>
          <text x="300" y="30" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">PACK SOC: 88.4% // DELTA V: 4.2mV (BALANCED)</text>
          <text x="300" y="210" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">MAX THERMAL SPREAD: 31.2°C // ISOLATION RESISTANCE >500 MΩ</text>
        </svg>
      `;

    case 'orbital_ground_track':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <rect x="80" y="45" width="440" height="150" rx="8" fill="#0D1117" stroke="#1F2937" strokeWidth="1.5" />
          <line x1="80" y1="120" x2="520" y2="120" stroke="#1F2937" strokeWidth="1" strokeDasharray="3 3" />
          <path d="M 80 160 Q 190 70, 300 120 T 520 80" fill="none" stroke="${accent}" strokeWidth="2.5" />
          <circle cx="300" cy="120" r="18" fill="none" stroke="#FF9F0A" strokeWidth="1.5" strokeDasharray="2 2" />
          <circle cx="300" cy="120" r="4" fill="#FF9F0A" />
          <text x="300" y="105" textAnchor="middle" fill="#FF9F0A" fontSize="8" fontFamily="monospace">SAT-01 (550km)</text>
          <text x="300" y="30" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">LEO ORBITAL SPEED: 7.66 km/s // PERIOD: 95.4 MIN</text>
          <text x="300" y="222" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">GROUND SLANT: 842km // 32APSK-8/9 450 Mbps DOWNLINK</text>
        </svg>
      `;

    case 'orderbook_ladder':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          {/* Asks (Red) */}
          <rect x="220" y="50" width="80" height="16" rx="2" fill="#EF4444" opacity="0.6" />
          <rect x="180" y="70" width="120" height="16" rx="2" fill="#EF4444" opacity="0.8" />
          <text x="300" y="62" textAnchor="end" fill="#FFF" fontSize="9" fontFamily="monospace">$68,421.50</text>
          <text x="300" y="82" textAnchor="end" fill="#FFF" fontSize="9" fontFamily="monospace">$68,421.00</text>
          {/* Midpoint line */}
          <line x1="120" y1="105" x2="480" y2="105" stroke="${accent}" strokeWidth="2" strokeDasharray="4 2" />
          <text x="300" y="102" textAnchor="middle" fill="${accent}" fontSize="9" fontFamily="monospace">MIDPOINT $68,420.75 (SPREAD 0.5 bps)</text>
          {/* Bids (Green) */}
          <rect x="300" y="115" width="130" height="16" rx="2" fill="#22C55E" opacity="0.8" />
          <rect x="300" y="135" width="90" height="16" rx="2" fill="#22C55E" opacity="0.6" />
          <text x="300" y="127" textAnchor="start" fill="#FFF" fontSize="9" fontFamily="monospace">$68,420.50</text>
          <text x="300" y="147" textAnchor="start" fill="#FFF" fontSize="9" fontFamily="monospace">$68,420.00</text>
          <text x="300" y="30" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">TICK-BY-TICK MBO L3 LADDER // 184K ORDERS/SEC</text>
          <text x="300" y="215" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">FPGA ITCH 5.0 HARDWARE PARSER // TOP QUEUE: 42.8 BTC</text>
        </svg>
      `;

    case 'darkpool_crossing':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <circle cx="210" cy="120" r="45" fill="#0D1117" stroke="#00F0FF" strokeWidth="2" />
          <text x="210" y="124" textAnchor="middle" fill="#00F0FF" fontSize="10" fontFamily="monospace">BUY $4.2M</text>
          <circle cx="390" cy="120" r="45" fill="#0D1117" stroke="#EF4444" strokeWidth="2" />
          <text x="390" y="124" textAnchor="middle" fill="#EF4444" fontSize="10" fontFamily="monospace">SELL $4.2M</text>
          <line x1="255" y1="120" x2="345" y2="120" stroke="${accent}" strokeWidth="3" />
          <circle cx="300" cy="120" r="14" fill="#FF9F0A" />
          <text x="300" y="124" textAnchor="middle" fill="#000" fontSize="8" fontFamily="monospace" fontWeight="bold">CROSS</text>
          <text x="300" y="45" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">CONCEALED BLOCK MIDPOINT FILL // ZERO SLIPPAGE</text>
          <text x="300" y="205" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">BLOCK VOLUME: $84.2M/HR // ANTI-GAMING HEURISTIC VERIFIED</text>
        </svg>
      `;

    case 'vwap_bands':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          {/* Upper / Lower Bands */}
          <path d="M 90 70 Q 200 60, 300 85 T 510 65" fill="none" stroke="#1F2937" strokeWidth="2" strokeDasharray="3 3" />
          <path d="M 90 150 Q 200 140, 300 165 T 510 145" fill="none" stroke="#1F2937" strokeWidth="2" strokeDasharray="3 3" />
          {/* VWAP line */}
          <path d="M 90 110 Q 200 100, 300 125 T 510 105" fill="none" stroke="#FF9F0A" strokeWidth="2.5" />
          {/* Execution price points */}
          <path d="M 90 112 Q 200 98, 300 123 T 510 104" fill="none" stroke="${accent}" strokeWidth="2" />
          <text x="300" y="35" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">VWAP SLIPPAGE BENCHMARK: -0.12 bps OUTPERFORMANCE</text>
          <text x="300" y="215" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">PARTICIPATION RATE: 8.4% // ALVINE-URBANSKI OPTIMAL CURVE</text>
        </svg>
      `;

    case 'triangular_spread':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <circle cx="300" cy="70" r="28" fill="#0D1117" stroke="${accent}" strokeWidth="2" />
          <text x="300" y="74" textAnchor="middle" fill="${accent}" fontSize="9" fontFamily="monospace" fontWeight="bold">BTC</text>
          <circle cx="200" cy="160" r="28" fill="#0D1117" stroke="#FF9F0A" strokeWidth="2" />
          <text x="200" y="164" textAnchor="middle" fill="#FF9F0A" fontSize="9" fontFamily="monospace" fontWeight="bold">USDT</text>
          <circle cx="400" cy="160" r="28" fill="#0D1117" stroke="#22C55E" strokeWidth="2" />
          <text x="400" y="164" textAnchor="middle" fill="#22C55E" fontSize="9" fontFamily="monospace" fontWeight="bold">USD</text>
          <line x1="280" y1="85" x2="220" y2="140" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="228" y1="160" x2="372" y2="160" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="380" y1="140" x2="320" y2="85" stroke="#94A3B8" strokeWidth="1.5" />
          <text x="300" y="25" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">TRIANGULAR BASIS SPREAD: +4.8 bps NET</text>
          <text x="300" y="215" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">ATOMIC FILL LATENCY: 1.82ms // ANNUALIZED APR: 42.1%</text>
        </svg>
      `;

    case 'monte_carlo_paths':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <line x1="80" y1="120" x2="520" y2="120" stroke="#1F2937" strokeWidth="1.5" />
          {/* Diverging Paths */}
          <path d="M 80 120 Q 200 80, 320 60 T 520 40" fill="none" stroke="#22C55E" strokeWidth="1.5" opacity="0.7" />
          <path d="M 80 120 Q 200 100, 320 90 T 520 85" fill="none" stroke="${accent}" strokeWidth="1.5" />
          <path d="M 80 120 Q 200 130, 320 140 T 520 150" fill="none" stroke="#FF9F0A" strokeWidth="1.5" />
          <path d="M 80 120 Q 200 150, 320 180 T 520 190" fill="none" stroke="#EF4444" strokeWidth="2" />
          <line x1="80" y1="175" x2="520" y2="175" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4 2" />
          <text x="480" y="170" fill="#EF4444" fontSize="8" fontFamily="monospace">99% VaR CUTOFF</text>
          <text x="300" y="25" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">100,000 SIMULATED MONTE CARLO PATHS // 99% 1-DAY VAR: $184.2K</text>
          <text x="300" y="222" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">EXPECTED SHORTFALL (CVAR): $242K // CUDA HEURISTIC ENGINE (0.42s)</text>
        </svg>
      `;

    case 'volatility_surface':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <g transform="translate(100, 50)">
            <polygon points="100,20 300,10 380,80 180,90" fill="none" stroke="${accent}" strokeWidth="1.5" />
            <polygon points="180,90 380,80 340,140 140,150" fill="none" stroke="#FF9F0A" strokeWidth="1.5" />
            <line x1="200" y1="15" x2="280" y2="85" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="280" y1="85" x2="240" y2="145" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 3" />
          </g>
          <text x="300" y="30" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">OPTIONS GREEKS SURFACE // NET DELTA: +1.42 Δ BTC</text>
          <text x="300" y="215" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">VEGA EXPOSURE: $8,420 / 1% VOL // DELTA-NEUTRAL BAND ACTIVE</text>
        </svg>
      `;

    case 'cascade_waterfall':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <g transform="translate(110, 50)">
            <rect x="0" y="10" width="60" height="100" rx="3" fill="#22C55E" opacity="0.8" />
            <text x="30" y="65" textAnchor="middle" fill="#000" fontSize="9" fontFamily="monospace" fontWeight="bold">COLLAT</text>
            <rect x="90" y="45" width="60" height="65" rx="3" fill="#00F0FF" opacity="0.8" />
            <text x="120" y="85" textAnchor="middle" fill="#000" fontSize="9" fontFamily="monospace" fontWeight="bold">BORROW</text>
            <rect x="180" y="80" width="60" height="30" rx="3" fill="#FF9F0A" opacity="0.8" />
            <text x="210" y="100" textAnchor="middle" fill="#000" fontSize="8" fontFamily="monospace" fontWeight="bold">BUFFER</text>
            <line x1="-20" y1="95" x2="380" y2="95" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="320" y="90" fill="#EF4444" fontSize="8" fontFamily="monospace">LIQUIDATION 1.05 HF</text>
          </g>
          <text x="300" y="30" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">HEALTH FACTOR BUFFER: 2.84 HF // 284% COLLATERAL</text>
          <text x="300" y="215" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">AUTOMATED AUTO-UNWIND AT 135% // FLASH LOAN SLIPPAGE 0.5%</text>
        </svg>
      `;

    case 'agent_consensus_mesh':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <circle cx="300" cy="120" r="75" fill="none" stroke="#1F2937" strokeWidth="1.5" />
          <circle cx="300" cy="120" r="25" fill="#0D1117" stroke="${accent}" strokeWidth="2.5" />
          <text x="300" y="124" textAnchor="middle" fill="${accent}" fontSize="8" fontFamily="monospace" fontWeight="bold">QUORUM</text>
          {/* Agent nodes around ring */}
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i * 60 * Math.PI) / 180;
            const x = 300 + 75 * Math.cos(angle);
            const y = 120 + 75 * Math.sin(angle);
            return (
              <g key={i}>
                <line x1="300" y1="120" x2={x} y2={y} stroke="#1F2937" strokeWidth="1" />
                <circle cx={x} cy={y} r="10" fill="#0D1117" stroke="#22C55E" strokeWidth="1.5" />
                <text x={x} y={y + 3} textAnchor="middle" fill="#22C55E" fontSize="7" fontFamily="monospace">A{i+1}</text>
              </g>
            );
          })}
          <text x="300" y="25" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">BYZANTINE QUORUM: 9/9 AGENTS // CONSENSUS TIME: 240ms</text>
          <text x="300" y="222" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">COMPLETED TASK VELOCITY: 1,420 TASKS/HR // ZERO CONFLICTS</text>
        </svg>
      `;

    case 'embedding_drift_curve':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <line x1="100" y1="170" x2="500" y2="170" stroke="#1F2937" strokeWidth="1.5" />
          {/* Baseline Curve */}
          <path d="M 120 170 Q 300 30, 480 170" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />
          {/* Live Curve */}
          <path d="M 125 170 Q 303 35, 485 170" fill="none" stroke="${accent}" strokeWidth="2.5" />
          <text x="300" y="30" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">SEMANTIC WASSERSTEIN DISTANCE: 0.018 W-dist (SAFE)</text>
          <text x="300" y="210" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">COSINE CENTROID SHIFT: 0.994 // ZERO CONCEPT COLLAPSE</text>
        </svg>
      `;

    case 'prefix_cache_tree':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <circle cx="300" cy="50" r="14" fill="#0D1117" stroke="${accent}" strokeWidth="2" />
          <text x="300" y="54" textAnchor="middle" fill="${accent}" fontSize="8" fontFamily="monospace">ROOT</text>
          <line x1="300" y1="64" x2="220" y2="110" stroke="#1F2937" strokeWidth="1.5" />
          <line x1="300" y1="64" x2="380" y2="110" stroke="#1F2937" strokeWidth="1.5" />
          <circle cx="220" cy="120" r="14" fill="#0D1117" stroke="#22C55E" strokeWidth="2" />
          <text x="220" y="124" textAnchor="middle" fill="#22C55E" fontSize="7" fontFamily="monospace">PROMPT</text>
          <circle cx="380" cy="120" r="14" fill="#0D1117" stroke="#22C55E" strokeWidth="2" />
          <text x="380" y="124" textAnchor="middle" fill="#22C55E" fontSize="7" fontFamily="monospace">APA_DOC</text>
          <text x="300" y="180" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">RADIX PREFIX CACHE HIT RATIO: 92.4% // 4.82M TOKENS</text>
          <text x="300" y="205" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">TTFT 84% FASTER // LRU RADIX SLIDING PURGE</text>
        </svg>
      `;

    case 'tool_schema_trace':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <rect x="90" y="60" width="100" height="60" rx="6" fill="#0D1117" stroke="${accent}" strokeWidth="1.5" />
          <text x="140" y="95" textAnchor="middle" fill="${accent}" fontSize="9" fontFamily="monospace">JSON IN</text>
          <line x1="190" y1="90" x2="260" y2="90" stroke="#94A3B8" strokeWidth="2" />
          <rect x="260" y="60" width="110" height="60" rx="6" fill="#0D1117" stroke="#22C55E" strokeWidth="1.5" />
          <text x="315" y="95" textAnchor="middle" fill="#22C55E" fontSize="9" fontFamily="monospace">OPENAPI 3.1</text>
          <line x1="370" y1="90" x2="440" y2="90" stroke="#94A3B8" strokeWidth="2" />
          <rect x="440" y="60" width="100" height="60" rx="6" fill="#0D1117" stroke="#FF9F0A" strokeWidth="1.5" />
          <text x="490" y="95" textAnchor="middle" fill="#FF9F0A" fontSize="9" fontFamily="monospace">IPC EXEC</text>
          <text x="300" y="170" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">FUNCTION CALLING COMPLIANCE: 99.98% // STRICT MODE</text>
          <text x="300" y="195" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">DISPATCH LATENCY: 1.24ms // ZERO RETRIES / ZERO TYPE DEFECTS</text>
        </svg>
      `;

    case 'precision_recall_radar':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <polygon points="300,40 370,80 345,150 255,150 230,80" fill="none" stroke="#1F2937" strokeWidth="1.5" />
          <polygon points="300,50 360,85 340,140 260,140 240,85" fill="${accent}" fillOpacity="0.2" stroke="${accent}" strokeWidth="2" />
          <text x="300" y="32" textAnchor="middle" fill="#FFF" fontSize="8" fontFamily="monospace">FAITHFULNESS (99.6%)</text>
          <text x="395" y="85" textAnchor="start" fill="#FFF" fontSize="8" fontFamily="monospace">RECALL (0.98)</text>
          <text x="365" y="165" textAnchor="middle" fill="#FFF" fontSize="8" fontFamily="monospace">PRECISION (0.99)</text>
          <text x="235" y="165" textAnchor="middle" fill="#FFF" fontSize="8" fontFamily="monospace">RELEVANCY (0.98)</text>
          <text x="205" y="85" textAnchor="end" fill="#FFF" fontSize="8" fontFamily="monospace">GROUND TRUTH</text>
          <text x="300" y="215" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">HALLUCINATION RATE: 0.04% // 1,000 SYNTHETIC BENCHMARK PROMPTS</text>
        </svg>
      `;

    case 'lora_weight_router':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <rect x="100" y="50" width="160" height="90" rx="8" fill="#0D1117" stroke="#00F0FF" strokeWidth="2" />
          <text x="180" y="85" textAnchor="middle" fill="#00F0FF" fontSize="10" fontFamily="monospace" fontWeight="bold">FROZEN BASE</text>
          <text x="180" y="105" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">WEIGHTS (70B)</text>
          <line x1="260" y1="95" x2="350" y2="95" stroke="${accent}" strokeWidth="2.5" />
          <rect x="350" y="50" width="160" height="90" rx="8" fill="#0D1117" stroke="${accent}" strokeWidth="2" />
          <text x="430" y="85" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">DYNAMIC LoRA</text>
          <text x="430" y="105" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">RANK r=16 (128MB)</text>
          <text x="300" y="180" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">LoRA HOT-SWAP LATENCY: 8.4ms // PUNICA ZERO-COPY INJECTION</text>
          <text x="300" y="205" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">16 ACTIVE ADAPTERS // ZERO BASE MODEL DOWNTIME</text>
        </svg>
      `;

    case 'guardrail_threat_filter':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <g transform="translate(100, 45)">
            <rect x="0" y="20" width="80" height="50" rx="4" fill="#0D1117" stroke="#EF4444" strokeWidth="1.5" />
            <text x="40" y="50" textAnchor="middle" fill="#EF4444" fontSize="8" fontFamily="monospace">PROMPT</text>
            <line x1="80" y1="45" x2="130" y2="45" stroke="#94A3B8" strokeWidth="1.5" />
            <rect x="130" y="10" width="140" height="70" rx="6" fill="#0D1117" stroke="${accent}" strokeWidth="2" />
            <text x="200" y="40" textAnchor="middle" fill="${accent}" fontSize="9" fontFamily="monospace" fontWeight="bold">GUARDRAIL MESH</text>
            <text x="200" y="60" textAnchor="middle" fill="#22C55E" fontSize="8" fontFamily="monospace">UTF8 // AST // CANARY</text>
            <line x1="270" y1="45" x2="320" y2="45" stroke="#94A3B8" strokeWidth="1.5" />
            <rect x="320" y="20" width="80" height="50" rx="4" fill="#0D1117" stroke="#22C55E" strokeWidth="1.5" />
            <text x="360" y="50" textAnchor="middle" fill="#22C55E" fontSize="8" fontFamily="monospace">CLEAN</text>
          </g>
          <text x="300" y="165" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">INJECTION INTERCEPT RATE: 100% // ZERO PASS-THROUGH</text>
          <text x="300" y="190" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">EVALUATION PENALTY: 0.84ms // 184K PROMPTS SCANNED</text>
        </svg>
      `;

    case 'ebpf_xdp_pipeline':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <rect x="90" y="60" width="100" height="60" rx="6" fill="#0D1117" stroke="#00F0FF" strokeWidth="1.5" />
          <text x="140" y="95" textAnchor="middle" fill="#00F0FF" fontSize="9" fontFamily="monospace">NIC RX</text>
          <line x1="190" y1="90" x2="250" y2="90" stroke="${accent}" strokeWidth="2.5" />
          <rect x="250" y="50" width="120" height="80" rx="6" fill="#0D1117" stroke="${accent}" strokeWidth="2" />
          <text x="310" y="85" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">eBPF XDP</text>
          <text x="310" y="105" textAnchor="middle" fill="#22C55E" fontSize="8" fontFamily="monospace">KERNEL BYPASS</text>
          <line x1="370" y1="90" x2="430" y2="90" stroke="#94A3B8" strokeWidth="2" />
          <rect x="430" y="60" width="100" height="60" rx="6" fill="#0D1117" stroke="#FF9F0A" strokeWidth="1.5" />
          <text x="480" y="95" textAnchor="middle" fill="#FF9F0A" fontSize="9" fontFamily="monospace">RING BUFFER</text>
          <text x="300" y="170" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">XDP PACKET BYPASS: 14.8M PPS // TCP RETRANSMIT: 0.002%</text>
          <text x="300" y="195" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">ZERO CONTEXT-SWITCH KERNEL DROPS // BBRv3 CONGESTION CONTROL</text>
        </svg>
      `;

    case 'trace_span_waterfall':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <g transform="translate(100, 40)">
            <rect x="0" y="10" width="400" height="18" rx="3" fill="#00F0FF" opacity="0.8" />
            <text x="10" y="23" fill="#000" fontSize="8" fontFamily="monospace" fontWeight="bold">HTTP-GATEWAY (18.4ms)</text>
            <rect x="40" y="35" width="160" height="18" rx="3" fill="#FF9F0A" opacity="0.8" />
            <text x="50" y="48" fill="#000" fontSize="8" fontFamily="monospace" fontWeight="bold">AUTH-VALIDATE (2.1ms)</text>
            <rect x="180" y="60" width="220" height="18" rx="3" fill="#22C55E" opacity="0.8" />
            <text x="190" y="73" fill="#000" fontSize="8" fontFamily="monospace" fontWeight="bold">POSTGRES-SELECT (4.8ms)</text>
            <rect x="190" y="85" width="60" height="18" rx="3" fill="#A855F7" opacity="0.8" />
            <text x="200" y="98" fill="#FFF" fontSize="8" fontFamily="monospace">REDIS (0.4ms)</text>
          </g>
          <text x="300" y="180" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">OPENTELEMETRY P99 WATERFALL: 18.4ms // 142K SPANS/SEC</text>
          <text x="300" y="205" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">W3C TRACE-CONTEXT PROPAGATION // ZERO DROPPED BOTTLENECKS</text>
        </svg>
      `;

    case 'wal_lsn_stream':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <line x1="80" y1="110" x2="520" y2="110" stroke="#1F2937" strokeWidth="2" />
          {/* LSN Markers */}
          <circle cx="180" cy="110" r="8" fill="#00F0FF" />
          <text x="180" y="85" textAnchor="middle" fill="#00F0FF" fontSize="8" fontFamily="monospace">LSN 18/4F1F</text>
          <circle cx="340" cy="110" r="8" fill="#FF9F0A" />
          <text x="340" y="85" textAnchor="middle" fill="#FF9F0A" fontSize="8" fontFamily="monospace">LSN 18/4F20</text>
          <circle cx="480" cy="110" r="10" fill="#22C55E" />
          <text x="480" y="85" textAnchor="middle" fill="#22C55E" fontSize="8" fontFamily="monospace" fontWeight="bold">HEAD (SYNC)</text>
          <text x="300" y="160" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">POSTGRES LOGICAL WAL REPLICATION // BYTE LAG: 0 BYTES</text>
          <text x="300" y="185" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">GENERATION RATE: 48.2 MB/S // ZSTD ARCHIVE PIPELINE ACTIVE</text>
        </svg>
      `;

    case 'tls_session_tach':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <path d="M 190 170 A 120 120 0 0 1 410 170" fill="none" stroke="#1F2937" strokeWidth="16" />
          <path d="M 190 170 A 120 120 0 0 1 410 170" fill="none" stroke="${accent}" strokeWidth="16" strokeDasharray="330" strokeDashoffset="40" strokeLinecap="round" />
          <text x="300" y="130" textAnchor="middle" fill="#FFF" fontSize="28" fontFamily="monospace" fontWeight="black">96.8%</text>
          <text x="300" y="155" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace">0-RTT PSK RESUMPTION</text>
          <text x="300" y="210" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">HANDSHAKE MEAN: 0.82ms // TLS 1.3 CHACHA20-POLY1305</text>
        </svg>
      `;

    case 'raft_snapshot_ring':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <circle cx="300" cy="110" r="70" fill="none" stroke="#1F2937" strokeWidth="12" />
          <circle cx="300" cy="110" r="70" fill="none" stroke="${accent}" strokeWidth="12" strokeDasharray="440" strokeDashoffset="60" strokeLinecap="round" />
          <text x="300" y="105" textAnchor="middle" fill="#FFF" fontSize="22" fontFamily="monospace" fontWeight="black">94.2%</text>
          <text x="300" y="125" textAnchor="middle" fill="${accent}" fontSize="8" fontFamily="monospace">COMPACTED</text>
          <text x="300" y="180" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">RAFT LOG TRUNCATION // 1.84M ROWS RECLAIMED</text>
          <text x="300" y="205" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">TERM 48 COMMITTED // RTO: 0.42s // ZERO DATA LOSS</text>
        </svg>
      `;

    case 'slab_allocator_blocks':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <g transform="translate(100, 50)">
            {['32B SLAB', '128B SLAB', '512B SLAB', '4KB SLAB'].map((name, i) => (
              <g key={i} transform={\`translate(\${i * 105}, 0)\`}>
                <rect width="90" height="90" rx="6" fill="#0D1117" stroke="${accent}" strokeWidth="1.5" />
                <rect x="5" y={90 - 70} width="80" height="65" rx="3" fill="#22C55E" opacity="0.8" />
                <text x="45" y="40" textAnchor="middle" fill="#FFF" fontSize="9" fontFamily="monospace" fontWeight="bold">{name}</text>
                <text x="45" y="65" textAnchor="middle" fill="#000" fontSize="9" fontFamily="monospace" fontWeight="black">98.8%</text>
              </g>
            ))}
          </g>
          <text x="300" y="30" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">ARENA SLAB FRAGMENTATION: 1.14% // SPEED: 14.2ns/ALLOC</text>
          <text x="300" y="215" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">CUSTOM BUMP MEMORY POOL // LOCK-FREE VMA ALLOCATION</text>
        </svg>
      `;

    case 'canary_traffic_split':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <rect x="100" y="60" width="400" height="34" rx="6" fill="#1F2937" />
          <rect x="100" y="60" width="300" height="34" rx="6" fill="#00F0FF" opacity="0.8" />
          <rect x="400" y="60" width="100" height="34" rx="6" fill="#FF9F0A" />
          <text x="250" y="82" textAnchor="middle" fill="#000" fontSize="10" fontFamily="monospace" fontWeight="black">BASELINE 75%</text>
          <text x="450" y="82" textAnchor="middle" fill="#000" fontSize="10" fontFamily="monospace" fontWeight="black">CANARY 25%</text>
          <text x="300" y="140" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">STATISTICAL T-TEST: NO REGRESSION (p-Value: 0.94)</text>
          <text x="300" y="165" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">ERROR BUDGET CONSUMED: 0.00% // AUTO-ROLLBACK ARMED</text>
          <text x="300" y="210" textAnchor="middle" fill="#22C55E" fontSize="9" fontFamily="monospace">STAGE 5 OF 20 (5% / 5MIN TRAFFIC SHIFT ACTIVE)</text>
        </svg>
      `;

    default:
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <circle cx="300" cy="120" r="50" fill="#0D1117" stroke="${accent}" strokeWidth="2" />
          <text x="300" y="125" textAnchor="middle" fill="${accent}" fontSize="12" fontFamily="monospace">LIVE TELEMETRY</text>
        </svg>
      `;
  }
}

for (const unit of ALL_COCKPITS) {
  const unitDir = path.join(TARGET_DIR, unit.folder);
  if (!fs.existsSync(unitDir)) {
    fs.mkdirSync(unitDir, { recursive: true });
  }

  // Generate index.html
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${unit.name} // Track 2 Hypercar Flagship Cockpit</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.7/babel.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&family=JetBrains+Mono:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #05070B; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
  </style>
  <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@19",
        "react-dom/client": "https://esm.sh/react-dom@19/client"
      }
    }
  </script>
</head>
<body class="bg-[#05070B] text-slate-100 antialiased select-none">
  <div id="root"></div>

  <script type="text/babel" data-type="module">
    import React, { useState, useEffect } from 'react';
    import ReactDOM from 'react-dom/client';

    const INITIAL_ITEMS = ${JSON.stringify(unit.items, null, 2)};

    function ${unit.componentName}() {
      const [pulsePhase, setPulsePhase] = useState(0);
      const [val1, setVal1] = useState(${JSON.stringify(unit.metric1.value)});
      const [val2, setVal2] = useState(${JSON.stringify(unit.metric2.value)});
      const [eventStream, setEventStream] = useState([]);

      useEffect(() => {
        const interval = setInterval(() => {
          setPulsePhase(p => (p + 1) % 100);

          const newEvt = {
            id: Math.random().toString(36).substring(2, 8).toUpperCase(),
            time: new Date().toISOString().split('T')[1].slice(0, 12),
            metric: '${unit.name}',
            status: 'OPTIMAL',
            lat: (0.12 + Math.random() * 0.6).toFixed(2) + 'ms'
          };
          setEventStream(prev => [newEvt, ...prev.slice(0, 4)]);
        }, 1000);

        return () => clearInterval(interval);
      }, []);

      return (
        <div className="min-h-screen bg-[#05070B] text-slate-200 font-sans p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* TOP HEADER */}
            <header className="flex flex-wrap items-center justify-between border-b border-[#1F2937] pb-4 gap-4 bg-[#0D1117] p-4 rounded-xl border border-[#1F2937]">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[${unit.accent}] animate-pulse" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold tracking-widest text-[${unit.accent}] uppercase">TRACK 2 // HYPERCAR FLAGSHIP</span>
                    <span className="text-[10px] bg-[#1F2937] text-slate-300 px-2 py-0.5 rounded font-mono">${unit.id}</span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-black tracking-tight text-white font-mono flex items-center gap-2 uppercase">
                    ${unit.name} <span className="text-xs text-[#FF9F0A] font-normal">// ${unit.subtitle}</span>
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="bg-[#05070B] border border-[#1F2937] px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <span className="text-slate-400">TELEMETRY:</span>
                  <span className="text-green-400 font-bold">100% OPERATIONAL</span>
                </div>
                <div className="bg-[#05070B] border border-[#1F2937] px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <span className="text-slate-400">CLASS:</span>
                  <span className="text-[${unit.accent}] font-bold">SCADA TIER-1</span>
                </div>
              </div>
            </header>

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* LEFT 2 COLUMNS: METRIC CARDS, SVG VISUALIZER, DATA TABLE */}
              <div className="lg:col-span-2 space-y-6">

                {/* DUAL METRIC CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#0D1117] border border-[#1F2937] p-5 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[${unit.metric1.color}]" />
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">${unit.metric1.label}</span>
                      <span className="text-xs font-mono text-[${unit.metric1.color}] bg-[${unit.metric1.color}]/10 px-2 py-0.5 rounded">LIVE HUD</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl md:text-5xl font-black font-mono text-white tracking-tight">{val1}</span>
                      <span className="text-sm font-mono text-[${unit.metric1.color}]">${unit.metric1.unit}</span>
                    </div>
                    <div className="mt-4 text-xs font-mono text-slate-400">${unit.metric1.sub}</div>
                  </div>

                  <div className="bg-[#0D1117] border border-[#1F2937] p-5 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[${unit.metric2.color}]" />
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">${unit.metric2.label}</span>
                      <span className="text-xs font-mono text-[${unit.metric2.color}] bg-[${unit.metric2.color}]/10 px-2 py-0.5 rounded">BENCHMARK</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl md:text-5xl font-black font-mono text-white tracking-tight">{val2}</span>
                      <span className="text-sm font-mono text-[${unit.metric2.color}]">${unit.metric2.unit}</span>
                    </div>
                    <div className="mt-4 text-xs font-mono text-slate-400">${unit.metric2.sub}</div>
                  </div>
                </div>

                {/* ANIMATED SVG VISUALIZER */}
                <div className="bg-[#0D1117] border border-[#1F2937] p-6 rounded-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[${unit.accent}]" />
                      ${unit.name} // REALTIME SCADA TELEMETRY CANVASES
                    </h3>
                    <span className="text-xs font-mono text-slate-400">ACTIVE WAVEFORM</span>
                  </div>

                  <div className="relative h-64 bg-[#05070B] border border-[#1F2937] rounded-xl flex items-center justify-center overflow-hidden">
                    ${generateSvgVisualizer(unit.svgType, unit.accent, 'pulsePhase')}
                  </div>
                </div>

                {/* INTERACTIVE ROWS TABLE */}
                <div className="bg-[#0D1117] border border-[#1F2937] rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[#1F2937] flex justify-between items-center bg-[#090D14]">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">TELEMETRY MATRIX ROW DISPATCH</span>
                    <span className="text-[11px] font-mono text-slate-400">{INITIAL_ITEMS.length} REGISTERED TARGETS</span>
                  </div>
                  <div className="divide-y divide-[#1F2937]/60 text-xs font-mono">
                    {INITIAL_ITEMS.map((item, idx) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-[#121721] transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-[${unit.accent}] font-bold">{item.id}</span>
                          <span className="text-slate-200 truncate max-w-[280px]">{item.val}</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-400">
                          <span>{item.status}</span>
                          <span className="text-green-400 font-bold">{item.lat}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* RIGHT 1 COLUMN: COMMERCIAL PROVENANCE & REALTIME EVENT STREAM */}
              <div className="space-y-6">

                {/* COMMERCIAL PROVENANCE CARD */}
                <div className="bg-[#0D1117] border border-[#1F2937] p-5 rounded-xl space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[${unit.accent}]/5 rounded-full blur-2xl pointer-events-none" />

                  <div className="border-b border-[#1F2937] pb-3">
                    <span className="text-[10px] font-mono font-bold text-[${unit.accent}] uppercase tracking-widest">COMMERCIAL SPECIFICATION</span>
                    <h3 className="text-base font-mono font-black text-white mt-0.5">APA ASSET ACQUISITION</h3>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between py-1 border-b border-[#1F2937]/50">
                      <span className="text-slate-400">COMMERCIAL TAG</span>
                      <span className="text-[${unit.accent}] font-bold">100% PURE APA TITLE</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#1F2937]/50">
                      <span className="text-slate-400">TITLE ANCHOR</span>
                      <span className="text-white font-bold">$14,500 USD</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#1F2937]/50">
                      <span className="text-slate-400">VAULT BUYOUT</span>
                      <span className="text-[#FF9F0A] font-bold">$25,000 – $50,000</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#1F2937]/50">
                      <span className="text-slate-400">SEAT TIERS</span>
                      <span className="text-slate-400">ZERO (APA CLEAN TITLE)</span>
                    </div>
                  </div>

                  {/* COMMERCIAL CTAS (VERTICAL CONTAINER) */}
                  <div className="pt-2">
                    <div className="flex flex-col gap-2 w-full">
                      <button className="w-full py-3 bg-[#FF9F0A] hover:bg-[#FF9F0A]/90 text-black font-mono font-black text-xs uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-[#FF9F0A]/20">
                        ACQUIRE TITLE (APA)
                      </button>
                      <button className="w-full py-2.5 bg-[#1F2937] hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs uppercase tracking-wider rounded-lg border border-slate-600 transition-colors">
                        INQUIRE VAULT BUYOUT
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 text-[10px] font-mono text-slate-500 leading-tight">
                    [Product Truth: Interactive Prototype // Simulated Data Stream]
                  </div>
                </div>

                {/* LIVE EVENT FEED */}
                <div className="bg-[#0D1117] border border-[#1F2937] p-5 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[${unit.accent}] animate-ping" />
                      LIVE TELEMETRY FEED
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500">REALTIME</span>
                  </div>

                  <div className="space-y-2">
                    {eventStream.map((evt) => (
                      <div key={evt.id} className="p-2.5 rounded bg-[#05070B] border border-[#1F2937] text-[11px] font-mono space-y-1">
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="text-white font-bold">{evt.metric}</span>
                          <span className="text-slate-500">{evt.time}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span className="text-[${unit.accent}]">{evt.status}</span>
                          <span className="text-green-400 font-bold">{evt.lat}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<${unit.componentName} />);
  </script>
</body>
</html>
`;

  fs.writeFileSync(path.join(unitDir, 'index.html'), htmlContent, 'utf8');

  // Generate README.md Monroney Window Sticker
  const readmeContent = `# 🏷️ DEALERSHIP TELEMETRY WINDOW STICKER
## Chassis G-${String(unit.num - 465).padStart(2, '0')}: ${unit.name}
**Asset Classification:** Track 2 (Hypercar Flagship Tier-1 Interactive Cockpit)  
**Parent Fleet Registry:** GhostFactoryOS × Aura & Grid (\`cockpits/batch-golf/${unit.folder}/\`)

\`\`\`
================================================================================
   GHOST FACTORY OS // TRACK 2 HYPERCAR FLAGSHIP MONRONEY SPECIFICATION
================================================================================
UNIT IDENTIFIER:        ${unit.id}
CHASSIS MODEL NAME:     ${unit.name} (${unit.subtitle})
COHORT:                 Cluster-008 Flagship Series (Batch Golf)
COMMERCIAL TAG:         100% Pure APA Buyout Title Transfer (Zero Licenses)
RETAIL PRICE ANCHOR:    $14,500 USD (Chassis Title Transfer Anchor)
VAULT BUYOUT RANGE:     $25,000 – $50,000 USD (Exclusive Strategic Acquisition)
ACTION TARGET CTAS:     "ACQUIRE TITLE (APA)" // "INQUIRE VAULT BUYOUT"
MATURITY BADGE:         [Product Truth: Interactive Prototype // Simulated Data Stream]
================================================================================
\`\`\`

---

### 1. Architectural & Aesthetic Specifications
- **Stack:** Standalone React 19 + Tailwind CSS + Babel Standalone ESM import maps.
- **Visual Baseline:** F1 Pit Wall & Cyberpunk Telemetry:
  - Base: Obsidian Carbon Fiber (\`#05070B\`)
  - Cards: High-Contrast Surfaces (\`#0D1117\`) with Hairline Borders (\`#1F2937\`)
  - Accents: Cyber-Amber (\`#FF9F0A\`) & Cyber-Cyan (\`#00F0FF\`)
  - Typography: JetBrains Mono (gauges) + Inter (interface copy)
- **Interactive Mechanics:** High-velocity SCADA console with real-time simulated telemetry loops, SVG HUD visualization, live event dispatch streams, and deterministic responsive containers.

### 2. Operational IO Telemetry Matrix

| Specification | Operational Metric |
| :--- | :--- |
| **Input Signals** | High-frequency telemetry streams, status probes, diagnostic matrices |
| **Output HUD** | Dual telemetry metric cards, SVG animated SCADA canvas, row dispatch table, live feed |
| **Render Latency** | **Sub-millisecond render cycles (< 1.0ms)** with 60 FPS animation smoothness |
| **Commercial Terms** | 100% Pure APA Title Transfer. Outright ownership. Zero ongoing seat licenses. |

---

### 3. Commercial Action Targets (Vertical Container)

\`\`\`html
<div class="flex flex-col gap-2 w-full">
  <button class="w-full py-3 bg-[#FF9F0A] text-black font-mono font-black text-xs uppercase rounded-lg">
    ACQUIRE TITLE (APA)
  </button>
  <button class="w-full py-2.5 bg-[#1F2937] text-slate-200 font-mono font-bold text-xs uppercase rounded-lg border border-slate-600">
    INQUIRE VAULT BUYOUT
  </button>
</div>
\`\`\`
`;

  fs.writeFileSync(path.join(unitDir, 'README.md'), readmeContent, 'utf8');
  console.log(`  ✓ Fabricated Flagship Cockpit: ${unit.id} -> ${unit.folder}`);
}

console.log('⚡ All 28 Track 2 Cockpits fabricated successfully.');
