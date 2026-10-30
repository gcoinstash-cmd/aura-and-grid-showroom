/**
 * GhostFactoryOS — Track 2 Batch Delta Fabrication Engine
 * Stamping 20 Standalone Flagship Cockpits into cockpits/batch-delta/
 * and wiring them into cockpits/index.html Master Inspection Deck.
 */

import fs from 'node:fs';
import path from 'node:path';
import { SECURITY_COCKPITS } from './batch-delta-cockpits-1.mjs';
import { INFRA_COCKPITS } from './batch-delta-cockpits-2.mjs';
import { DATA_COCKPITS } from './batch-delta-cockpits-3.mjs';
import { PERF_COCKPITS } from './batch-delta-cockpits-4.mjs';

const ALL_COCKPITS = [
  ...SECURITY_COCKPITS,
  ...INFRA_COCKPITS,
  ...DATA_COCKPITS,
  ...PERF_COCKPITS
];

const ROOT_DIR = process.cwd();
const TARGET_DIR = path.join(ROOT_DIR, 'cockpits', 'batch-delta');

console.log(`⚡ [GhostFactoryOS] Scaffolding ${ALL_COCKPITS.length} Track 2 Flagship Cockpits into ${TARGET_DIR}...`);

function generateSvgVisualizer(type, accent, pulsePhase) {
  switch (type) {
    case 'waf_radar':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <circle cx="300" cy="120" r="100" fill="none" stroke="#1F2937" strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx="300" cy="120" r="70" fill="none" stroke="#1F2937" strokeWidth="1.5" />
          <circle cx="300" cy="120" r="35" fill="none" stroke="#1F2937" strokeWidth="1" />
          <line x1="200" y1="120" x2="400" y2="120" stroke="#1F2937" />
          <line x1="300" y1="20" x2="300" y2="220" stroke="#1F2937" />
          {/* Radar Sweep */}
          <line x1="300" y1="120" x2={300 + 100 * Math.cos((pulsePhase * 3.6 * Math.PI) / 180)} y2={120 + 100 * Math.sin((pulsePhase * 3.6 * Math.PI) / 180)} stroke="${accent}" strokeWidth="2" strokeOpacity="0.8" />
          {/* Threat Blips */}
          <circle cx="260" cy="90" r="5" fill="#FF9F0A" />
          <circle cx="340" cy="150" r="4" fill="#00F0FF" />
          <circle cx="280" cy="170" r="6" fill="#EF4444" />
          <text x="310" y="35" fill="${accent}" fontSize="9" fontFamily="monospace" fontWeight="bold">eBPF L7 FILTER: ARMED</text>
        </svg>
      `;

    case 'session_mesh':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <line x1="150" y1="60" x2="300" y2="120" stroke="#1F2937" strokeWidth="2" />
          <line x1="450" y1="60" x2="300" y2="120" stroke="#1F2937" strokeWidth="2" />
          <line x1="150" y1="180" x2="300" y2="120" stroke="${accent}" strokeWidth="2" strokeOpacity="0.7" />
          <line x1="450" y1="180" x2="300" y2="120" stroke="#1F2937" strokeWidth="2" />
          {/* Center Identity Hub */}
          <g transform="translate(300, 120)">
            <circle r="26" fill="#0D1117" stroke="${accent}" strokeWidth="2" />
            <text textAnchor="middle" dy="4" fill="${accent}" fontSize="9" fontFamily="monospace" fontWeight="bold">SPIFFE-CA</text>
          </g>
          {/* Edge Nodes */}
          <g transform="translate(150, 60)"><circle r="16" fill="#0D1117" stroke="#94A3B8" /><text textAnchor="middle" dy="3" fill="#FFF" fontSize="8" fontFamily="monospace">API-01</text></g>
          <g transform="translate(450, 60)"><circle r="16" fill="#0D1117" stroke="#94A3B8" /><text textAnchor="middle" dy="3" fill="#FFF" fontSize="8" fontFamily="monospace">PAY-02</text></g>
          <g transform="translate(150, 180)"><circle r="16" fill="#0D1117" stroke="${accent}" /><text textAnchor="middle" dy="3" fill="${accent}" fontSize="8" fontFamily="monospace">INGEST</text></g>
          <g transform="translate(450, 180)"><circle r="16" fill="#0D1117" stroke="#94A3B8" /><text textAnchor="middle" dy="3" fill="#FFF" fontSize="8" fontFamily="monospace">AUTH</text></g>
        </svg>
      `;

    case 'rotation_ring':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <circle cx="300" cy="120" r="75" fill="none" stroke="#1F2937" strokeWidth="8" />
          <circle cx="300" cy="120" r="75" fill="none" stroke="${accent}" strokeWidth="8" strokeDasharray="471" strokeDashoffset={471 - (471 * (pulsePhase % 100)) / 100} strokeLinecap="round" />
          <text x="300" y="115" textAnchor="middle" fill="#FFFFFF" fontSize="22" fontFamily="monospace" fontWeight="black">{100 - (pulsePhase % 100)}%</text>
          <text x="300" y="135" textAnchor="middle" fill="${accent}" fontSize="9" fontFamily="monospace">KEY ENVELOPE SYNC</text>
          <line x1="120" y1="120" x2="200" y2="120" stroke="#1F2937" strokeWidth="2" />
          <line x1="400" y1="120" x2="480" y2="120" stroke="#1F2937" strokeWidth="2" />
          <text x="110" y="123" textAnchor="end" fill="#94A3B8" fontSize="9" fontFamily="monospace">PRIMARY KEY (GCM)</text>
          <text x="490" y="123" textAnchor="start" fill="#22C55E" fontSize="9" fontFamily="monospace">STANDBY READY</text>
        </svg>
      `;

    case 'cert_radar':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <path d="M 180 160 A 140 140 0 0 1 420 160" fill="none" stroke="#1F2937" strokeWidth="12" />
          <path d="M 180 160 A 140 140 0 0 1 420 160" fill="none" stroke="${accent}" strokeWidth="12" strokeDasharray="377" strokeDashoffset="40" strokeLinecap="round" />
          <text x="300" y="130" textAnchor="middle" fill="#FFFFFF" fontSize="26" fontFamily="monospace" fontWeight="black">84 DAYS</text>
          <text x="300" y="150" textAnchor="middle" fill="${accent}" fontSize="9" fontFamily="monospace">AUTO-RENEW: ARMED</text>
          <text x="180" y="185" textAnchor="middle" fill="#94A3B8" fontSize="8" fontFamily="monospace">0d (EXPIRED)</text>
          <text x="420" y="185" textAnchor="middle" fill="#22C55E" fontSize="8" fontFamily="monospace">90d (ACME MAX)</text>
        </svg>
      `;

    case 'bot_entropy':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <line x1="50" y1="120" x2="550" y2="120" stroke="#1F2937" strokeDasharray="4 4" />
          {/* Live Entropy Waveform */}
          <path d="M 50 120 Q 150 40, 250 120 T 450 120 T 550 80" fill="none" stroke="${accent}" strokeWidth="3" />
          <path d="M 50 120 Q 150 160, 250 120 T 450 120 T 550 150" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="2 2" />
          <text x="70" y="50" fill="${accent}" fontSize="9" fontFamily="monospace">ENTROPY: HUMAN (98.6%)</text>
          <text x="400" y="200" fill="#EF4444" fontSize="9" fontFamily="monospace">AUTOMATED (TARPIT)</text>
        </svg>
      `;

    case 'flow_stream':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <line x1="50" y1="60" x2="550" y2="60" stroke="#1F2937" strokeWidth="2" />
          <line x1="50" y1="120" x2="550" y2="120" stroke="#1F2937" strokeWidth="2" />
          <line x1="50" y1="180" x2="550" y2="180" stroke="#1F2937" strokeWidth="2" />
          {/* Animated packets */}
          <circle cx={50 + ((pulsePhase * 5) % 500)} cy="60" r="5" fill="${accent}" />
          <circle cx={100 + ((pulsePhase * 7) % 450)} cy="120" r="4" fill="#FF9F0A" />
          <circle cx={70 + ((pulsePhase * 4) % 480)} cy="180" r="6" fill="#22C55E" />
          <text x="60" y="45" fill="#94A3B8" fontSize="8" fontFamily="monospace">SUBNET-A (10.0.1.0/24)</text>
          <text x="60" y="105" fill="#94A3B8" fontSize="8" fontFamily="monospace">SUBNET-B (10.0.2.0/24)</text>
          <text x="60" y="165" fill="#94A3B8" fontSize="8" fontFamily="monospace">EGRESS-GW (NAT)</text>
        </svg>
      `;

    case 'mesh_graph':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <line x1="120" y1="120" x2="260" y2="60" stroke="${accent}" strokeWidth="2" />
          <line x1="120" y1="120" x2="260" y2="180" stroke="${accent}" strokeWidth="2" />
          <line x1="260" y1="60" x2="440" y2="120" stroke="${accent}" strokeWidth="2" />
          <line x1="260" y1="180" x2="440" y2="120" stroke="#FF9F0A" strokeWidth="2" />
          <circle cx="120" cy="120" r="20" fill="#0D1117" stroke="${accent}" strokeWidth="2" />
          <text x="120" y="124" textAnchor="middle" fill="#FFF" fontSize="8" fontFamily="monospace">INGRESS</text>
          <circle cx="260" cy="60" r="18" fill="#0D1117" stroke="${accent}" strokeWidth="2" />
          <text x="260" y="64" textAnchor="middle" fill="#FFF" fontSize="8" fontFamily="monospace">AUTH</text>
          <circle cx="260" cy="180" r="18" fill="#0D1117" stroke="#FF9F0A" strokeWidth="2" />
          <text x="260" y="184" textAnchor="middle" fill="#FFF" fontSize="8" fontFamily="monospace">BILLING</text>
          <circle cx="440" cy="120" r="22" fill="#0D1117" stroke="#22C55E" strokeWidth="2" />
          <text x="440" y="124" textAnchor="middle" fill="#22C55E" fontSize="8" fontFamily="monospace">POSTGRES</text>
        </svg>
      `;

    case 'bgp_map':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <circle cx="300" cy="120" r="85" fill="none" stroke="#1F2937" strokeWidth="1.5" />
          <circle cx="300" cy="120" r="24" fill="#0D1117" stroke="${accent}" strokeWidth="2" />
          <text x="300" y="124" textAnchor="middle" fill="${accent}" fontSize="9" fontFamily="monospace" fontWeight="bold">LOCAL-ASN</text>
          {/* Peers */}
          <g transform="translate(300, 35)"><circle r="12" fill="#0D1117" stroke="#22C55E" strokeWidth="1.5" /><text textAnchor="middle" dy="3" fill="#FFF" fontSize="7" fontFamily="monospace">AS13335</text></g>
          <g transform="translate(385, 120)"><circle r="12" fill="#0D1117" stroke="#22C55E" strokeWidth="1.5" /><text textAnchor="middle" dy="3" fill="#FFF" fontSize="7" fontFamily="monospace">AS15169</text></g>
          <g transform="translate(300, 205)"><circle r="12" fill="#0D1117" stroke="#22C55E" strokeWidth="1.5" /><text textAnchor="middle" dy="3" fill="#FFF" fontSize="7" fontFamily="monospace">AS16509</text></g>
          <g transform="translate(215, 120)"><circle r="12" fill="#0D1117" stroke="#22C55E" strokeWidth="1.5" /><text textAnchor="middle" dy="3" fill="#FFF" fontSize="7" fontFamily="monospace">AS6939</text></g>
        </svg>
      `;

    case 'k8s_grid':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          {Array.from({ length: 32 }).map((_, i) => {
            const x = 70 + (i % 8) * 60;
            const y = 40 + Math.floor(i / 8) * 45;
            return (
              <g key={i} transform={\`translate(\${x}, \${y})\`}>
                <rect width="45" height="32" rx="4" fill="#0D1117" stroke="${accent}" strokeWidth="1.5" />
                <circle cx="10" cy="12" r="3" fill="#22C55E" />
                <text x="18" y="14" fill="#94A3B8" fontSize="7" fontFamily="monospace">P-\${i + 1}</text>
                <text x="6" y="26" fill="#FFF" fontSize="7" fontFamily="monospace">140m</text>
              </g>
            );
          })}
        </svg>
      `;

    case 'nat_waveform':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <line x1="50" y1="200" x2="550" y2="200" stroke="#1F2937" strokeWidth="1.5" />
          {/* Egress Waveform */}
          <path d="M 50 200 Q 120 80, 200 130 T 350 90 T 500 120 L 550 200 Z" fill="${accent}" fillOpacity="0.15" stroke="${accent}" strokeWidth="2.5" />
          <text x="70" y="70" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">38.4 Gbps // 64K PORTS OPEN</text>
        </svg>
      `;

    case 'lock_matrix':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <rect x="80" y="50" width="180" height="60" rx="8" fill="#0D1117" stroke="${accent}" strokeWidth="2" />
          <text x="170" y="75" textAnchor="middle" fill="#FFF" fontSize="10" fontFamily="monospace" fontWeight="bold">TX 48190 [EXCLUSIVE]</text>
          <text x="170" y="95" textAnchor="middle" fill="${accent}" fontSize="8" fontFamily="monospace">HOLDING: public.telemetry</text>

          <line x1="260" y1="80" x2="340" y2="80" stroke="#22C55E" strokeWidth="2" markerEnd="url(#arrow)" />

          <rect x="340" y="50" width="180" height="60" rx="8" fill="#0D1117" stroke="#22C55E" strokeWidth="2" />
          <text x="430" y="75" textAnchor="middle" fill="#FFF" fontSize="10" fontFamily="monospace" fontWeight="bold">TX 48192 [SHARE]</text>
          <text x="430" y="95" textAnchor="middle" fill="#22C55E" fontSize="8" fontFamily="monospace">STATUS: COMMITTED (0.8ms)</text>

          <text x="300" y="180" textAnchor="middle" fill="#94A3B8" fontSize="10" fontFamily="monospace">DEADLOCK DETECTION: RESOLVED (0 BLOCKS)</text>
        </svg>
      `;

    case 'redis_heatmap':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          {Array.from({ length: 40 }).map((_, i) => {
            const x = 50 + (i % 10) * 50;
            const y = 40 + Math.floor(i / 10) * 45;
            const fill = i % 7 === 0 ? '#FF9F0A' : i % 5 === 0 ? '#00F0FF' : '#1F2937';
            return (
              <rect key={i} x={x} y={y} width="40" height="35" rx="4" fill={fill} stroke="#05070B" strokeWidth="2" />
            );
          })}
          <text x="300" y="225" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">TTL EXPIRATION SWEEP // ACTIVE MEMORY EVACUATION</text>
        </svg>
      `;

    case 'storage_waveform':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <rect x="60" y="50" width="480" height="35" rx="6" fill="#1F2937" />
          <rect x="60" y="50" width="280" height="35" rx="6" fill="${accent}" />
          <rect x="340" y="50" width="120" height="35" rx="0" fill="#FF9F0A" />
          <text x="200" y="72" textAnchor="middle" fill="#000" fontSize="10" fontFamily="monospace" fontWeight="bold">STANDARD S3: 18.4 TB</text>
          <text x="400" y="72" textAnchor="middle" fill="#000" fontSize="10" fontFamily="monospace" fontWeight="bold">GLACIER: 12 TB</text>
          <text x="500" y="72" textAnchor="middle" fill="#FFF" fontSize="9" fontFamily="monospace">DEEP: 80 TB</text>

          <line x1="60" y1="140" x2="540" y2="140" stroke="#1F2937" strokeWidth="1.5" />
          <path d="M 60 140 Q 180 110, 300 130 T 540 120" fill="none" stroke="${accent}" strokeWidth="2.5" />
          <text x="300" y="180" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">LIFECYCLE POLICY SAVINGS: $2,420 / MO</text>
        </svg>
      `;

    case 'kafka_lag':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          {Array.from({ length: 8 }).map((_, i) => {
            const x = 70 + i * 60;
            const h = 40 + (i % 3) * 25;
            return (
              <g key={i} transform={\`translate(\${x}, 0)\`}>
                <rect x="0" y={180 - h} width="28" height={h} rx="3" fill="${accent}" />
                <rect x="0" y={180 - h - 15} width="28" height="8" rx="2" fill="#EF4444" fillOpacity="0.8" />
                <text x="14" y="200" textAnchor="middle" fill="#94A3B8" fontSize="8" fontFamily="monospace">P-\${i}</text>
              </g>
            );
          })}
          <text x="300" y="35" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">PARTITION LAG HORIZON: 14 MESSAGES (IN-SYNC)</text>
        </svg>
      `;

    case 'speedometer':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <path d="M 200 170 A 110 110 0 0 1 400 170" fill="none" stroke="#1F2937" strokeWidth="16" />
          <path d="M 200 170 A 110 110 0 0 1 400 170" fill="none" stroke="${accent}" strokeWidth="16" strokeDasharray="314" strokeDashoffset="60" strokeLinecap="round" />
          <text x="300" y="135" textAnchor="middle" fill="#FFFFFF" fontSize="28" fontFamily="monospace" fontWeight="black">2.4M</text>
          <text x="300" y="155" textAnchor="middle" fill="${accent}" fontSize="9" fontFamily="monospace">ROWS / SECOND</text>
        </svg>
      `;

    case 'vdom_flashes':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <line x1="60" y1="120" x2="540" y2="120" stroke="#1F2937" strokeWidth="2" />
          {Array.from({ length: 12 }).map((_, i) => (
            <g key={i} transform={\`translate(\${80 + i * 38}, 100)\`}>
              <circle r="6" fill={i % 4 === 0 ? '${accent}' : '#1F2937'} />
              <line x1="0" y1="6" x2="0" y2="20" stroke="#1F2937" />
            </g>
          ))}
          <text x="300" y="60" textAnchor="middle" fill="${accent}" fontSize="11" fontFamily="monospace" fontWeight="bold">VIRTUAL DOM COMMIT: 1.4ms (ZERO RE-RENDER LEAKS)</text>
          <text x="300" y="170" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">60 FPS SOLID FRAME PACE</text>
        </svg>
      `;

    case 'vitals_gauge':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <g transform="translate(150, 110)">
            <circle r="45" fill="none" stroke="#1F2937" strokeWidth="6" />
            <circle r="45" fill="none" stroke="#22C55E" strokeWidth="6" strokeDasharray="282" strokeDashoffset="40" />
            <text textAnchor="middle" dy="4" fill="#FFF" fontSize="14" fontFamily="monospace" fontWeight="bold">620ms</text>
            <text textAnchor="middle" dy="22" fill="#22C55E" fontSize="8" fontFamily="monospace">LCP (GOOD)</text>
          </g>
          <g transform="translate(300, 110)">
            <circle r="45" fill="none" stroke="#1F2937" strokeWidth="6" />
            <circle r="45" fill="none" stroke="#22C55E" strokeWidth="6" strokeDasharray="282" strokeDashoffset="30" />
            <text textAnchor="middle" dy="4" fill="#FFF" fontSize="14" fontFamily="monospace" fontWeight="bold">18ms</text>
            <text textAnchor="middle" dy="22" fill="#22C55E" fontSize="8" fontFamily="monospace">INP (GOOD)</text>
          </g>
          <g transform="translate(450, 110)">
            <circle r="45" fill="none" stroke="#1F2937" strokeWidth="6" />
            <circle r="45" fill="none" stroke="#22C55E" strokeWidth="6" strokeDasharray="282" strokeDashoffset="10" />
            <text textAnchor="middle" dy="4" fill="#FFF" fontSize="14" fontFamily="monospace" fontWeight="bold">0.001</text>
            <text textAnchor="middle" dy="22" fill="#22C55E" fontSize="8" fontFamily="monospace">CLS (GOOD)</text>
          </g>
        </svg>
      `;

    case 'heap_profile':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <rect x="80" y="60" width="440" height="30" rx="4" fill="#1F2937" />
          <rect x="80" y="60" width="180" height="30" rx="4" fill="${accent}" />
          <text x="170" y="80" textAnchor="middle" fill="#000" fontSize="9" fontFamily="monospace" fontWeight="bold">USED: 48.2 MB</text>
          <text x="350" y="80" textAnchor="middle" fill="#FFF" fontSize="9" fontFamily="monospace">TOTAL HEAP: 128 MB</text>

          <path d="M 80 150 Q 190 120, 300 145 T 520 135" fill="none" stroke="${accent}" strokeWidth="2" />
          <text x="300" y="190" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">V8 GC SWEEP: STABLE BASELINE (NO DETACHED NODES)</text>
        </svg>
      `;

    case 'edge_isolate':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <circle cx="300" cy="120" r="80" fill="none" stroke="#1F2937" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="300" cy="120" r="40" fill="none" stroke="#1F2937" strokeWidth="1" />
          <circle cx="300" cy="120" r="15" fill="#0D1117" stroke="${accent}" strokeWidth="2" />
          <text x="300" y="124" textAnchor="middle" fill="${accent}" fontSize="7" fontFamily="monospace">ISOLATE</text>

          {/* Global PoP Blips */}
          <circle cx="240" cy="80" r="5" fill="#22C55E" /><text x="240" y="70" textAnchor="middle" fill="#94A3B8" fontSize="7" fontFamily="monospace">IAD</text>
          <circle cx="360" cy="80" r="5" fill="#22C55E" /><text x="360" y="70" textAnchor="middle" fill="#94A3B8" fontSize="7" fontFamily="monospace">LHR</text>
          <circle cx="370" cy="150" r="5" fill="#22C55E" /><text x="370" y="165" textAnchor="middle" fill="#94A3B8" fontSize="7" fontFamily="monospace">NRT</text>
          <circle cx="230" cy="150" r="5" fill="#22C55E" /><text x="230" y="165" textAnchor="middle" fill="#94A3B8" fontSize="7" fontFamily="monospace">FRA</text>
        </svg>
      `;

    case 'waterfall_bars':
    default:
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          {/* Waterfall Stages */}
          <rect x="80" y="45" width="40" height="14" rx="2" fill="#00F0FF" /><text x="70" y="56" textAnchor="end" fill="#94A3B8" fontSize="8" fontFamily="monospace">DNS</text>
          <rect x="120" y="70" width="50" height="14" rx="2" fill="#FF9F0A" /><text x="70" y="81" textAnchor="end" fill="#94A3B8" fontSize="8" fontFamily="monospace">TCP</text>
          <rect x="170" y="95" width="60" height="14" rx="2" fill="#22C55E" /><text x="70" y="106" textAnchor="end" fill="#94A3B8" fontSize="8" fontFamily="monospace">TLS</text>
          <rect x="230" y="120" width="140" height="14" rx="2" fill="${accent}" /><text x="70" y="131" textAnchor="end" fill="#94A3B8" fontSize="8" fontFamily="monospace">TTFB</text>
          <rect x="370" y="145" width="90" height="14" rx="2" fill="#A855F7" /><text x="70" y="156" textAnchor="end" fill="#94A3B8" fontSize="8" fontFamily="monospace">TRANSIT</text>
          <text x="300" y="200" textAnchor="middle" fill="#FFF" fontSize="10" fontFamily="monospace" fontWeight="bold">TOTAL DURATION: 34.2ms // ZERO BLOCKING</text>
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
      const [filter, setFilter] = useState('ALL');
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
            status: 'HEALTHY',
            lat: (0.2 + Math.random() * 0.8).toFixed(2) + 'ms'
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
                          <span className="text-slate-200 truncate max-w-[280px]">{item.rule || item.principal || item.target || item.domain || item.userAgent || item.src || item.sidecar || item.asn || item.node || item.az || item.relation || item.type || item.tier || item.group || item.engine || item.reason || item.name || item.endpoint}</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-400">
                          <span>{item.action || item.status || item.state || item.rating || item.duration || item.total || item.egress || item.lag || item.ratio || item.score}</span>
                          <span className="text-green-400 font-bold">{item.latency || item.p99 || item.rtt || item.avgDuration || item.warmRtt || '0.4ms'}</span>
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

  // Generate README.md
  const readmeContent = `# 🏷️ DEALERSHIP TELEMETRY WINDOW STICKER
## Chassis D-${String(unit.num - 405).padStart(2, '0')}: ${unit.name}
**Asset Classification:** Track 2 (Hypercar Flagship Tier-1 Interactive Cockpit)  
**Parent Fleet Registry:** GhostFactoryOS × Aura & Grid (\`cockpits/batch-delta/${unit.folder}/\`)

\`\`\`
================================================================================
   GHOST FACTORY OS // TRACK 2 HYPERCAR FLAGSHIP MONRONEY SPECIFICATION
================================================================================
UNIT IDENTIFIER:        ${unit.id}
CHASSIS MODEL NAME:     ${unit.name} (${unit.subtitle})
COHORT:                 Cluster-008 Flagship Series (Batch Delta)
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

console.log('⚡ All 20 Track 2 Cockpits fabricated successfully.');
