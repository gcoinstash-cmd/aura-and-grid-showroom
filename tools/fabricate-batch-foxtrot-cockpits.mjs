/**
 * GhostFactoryOS — Track 2 Batch Foxtrot Fabrication Engine
 * Stamping 20 Standalone Flagship Cockpits into cockpits/batch-foxtrot/
 * and wiring them into cockpits/index.html Master Inspection Deck.
 */

import fs from 'node:fs';
import path from 'node:path';
import { AI_ML_COCKPITS } from './batch-foxtrot-cockpits-1.mjs';
import { DISTRIBUTED_STREAMING_COCKPITS } from './batch-foxtrot-cockpits-2.mjs';
import { EDGE_INGESTION_COCKPITS } from './batch-foxtrot-cockpits-3.mjs';
import { SECURITY_CRYPTO_COCKPITS } from './batch-foxtrot-cockpits-4.mjs';

const ALL_COCKPITS = [
  ...AI_ML_COCKPITS,
  ...DISTRIBUTED_STREAMING_COCKPITS,
  ...EDGE_INGESTION_COCKPITS,
  ...SECURITY_CRYPTO_COCKPITS
];

const ROOT_DIR = process.cwd();
const TARGET_DIR = path.join(ROOT_DIR, 'cockpits', 'batch-foxtrot');

console.log(`⚡ [GhostFactoryOS] Scaffolding ${ALL_COCKPITS.length} Track 2 Flagship Cockpits into ${TARGET_DIR}...`);

function generateSvgVisualizer(type, accent, pulsePhase) {
  switch (type) {
    case 'inference_wave':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <line x1="60" y1="120" x2="540" y2="120" stroke="#1F2937" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 60 120 Q 140 30, 220 120 T 380 120 T 540 120" fill="none" stroke="${accent}" strokeWidth="3" />
          <circle cx={60 + ((pulsePhase * 4.8) % 480)} cy={120 - 45 * Math.sin((pulsePhase * 3.6 * Math.PI) / 180)} r="6" fill="#FF9F0A" />
          <text x="300" y="45" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">TIME-TO-FIRST-TOKEN: 18.4ms // SPECULATIVE DECODE: 88%</text>
          <text x="300" y="195" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">INTER-TOKEN LATENCY: 4.2ms/token (238 tps/stream)</text>
        </svg>
      `;

    case 'vector_space':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <circle cx="300" cy="120" r="90" fill="none" stroke="#1F2937" strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx="300" cy="120" r="50" fill="none" stroke="#1F2937" strokeWidth="1.5" />
          <circle cx="300" cy="120" r="15" fill="#0D1117" stroke="${accent}" strokeWidth="2" />
          <text x="300" y="124" textAnchor="middle" fill="${accent}" fontSize="7" fontFamily="monospace">QUERY</text>
          {/* Nearest Neighbor nodes */}
          <circle cx="270" cy="90" r="5" fill="#22C55E" /><text x="270" y="80" textAnchor="middle" fill="#FFF" fontSize="7" fontFamily="monospace">k=1 (0.94)</text>
          <circle cx="340" cy="100" r="5" fill="#22C55E" /><text x="340" y="90" textAnchor="middle" fill="#FFF" fontSize="7" fontFamily="monospace">k=2 (0.91)</text>
          <circle cx="310" cy="160" r="5" fill="#22C55E" /><text x="310" y="175" textAnchor="middle" fill="#FFF" fontSize="7" fontFamily="monospace">k=3 (0.89)</text>
          <text x="300" y="215" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">HNSW ANN RADAR // 1536-DIM COSINE RECALL: 99.4%</text>
        </svg>
      `;

    case 'context_gauge':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <rect x="80" y="70" width="440" height="34" rx="6" fill="#1F2937" />
          <rect x="80" y="70" width="168" height="34" rx="6" fill="${accent}" />
          <text x="164" y="92" textAnchor="middle" fill="#000" fontSize="10" fontFamily="monospace" fontWeight="bold">384K TOKENS (38.4%)</text>
          <text x="380" y="92" textAnchor="middle" fill="#FFF" fontSize="10" fontFamily="monospace">1M CONTEXT WINDOW</text>

          {/* Paged Attention KV Cache Blocks */}
          {Array.from({ length: 16 }).map((_, i) => (
            <rect key={i} x={80 + i * 27.5} y="130" width="22" height="18" rx="2" fill={i < 7 ? '#FF9F0A' : '#1F2937'} />
          ))}
          <text x="300" y="175" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">PAGED ATTENTION KV-CACHE: 14.8 GB // FRAGMENTATION: 1.2%</text>
        </svg>
      `;

    case 'throughput_tachometer':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <path d="M 180 180 A 130 130 0 0 1 420 180" fill="none" stroke="#1F2937" strokeWidth="16" />
          <path d="M 180 180 A 130 130 0 0 1 420 180" fill="none" stroke="${accent}" strokeWidth="16" strokeDasharray="360" strokeDashoffset="70" strokeLinecap="round" />
          <text x="300" y="140" textAnchor="middle" fill="#FFFFFF" fontSize="30" fontFamily="monospace" fontWeight="black">4,820</text>
          <text x="300" y="165" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace">TOKENS / SEC (CONTINUOUS BATCH)</text>
        </svg>
      `;

    case 'gpu_thermal_grid':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          {['GPU-H100 #1', 'GPU-H100 #2', 'GPU-H100 #3', 'GPU-H100 #4'].map((g, i) => (
            <g key={i} transform={\`translate(\${90 + i * 110}, 60)\`}>
              <rect width="95" height="100" rx="8" fill="#0D1117" stroke="${accent}" strokeWidth="1.5" />
              <text x="47" y="25" textAnchor="middle" fill="#FFF" fontSize="9" fontFamily="monospace" fontWeight="bold">{g}</text>
              <text x="47" y="50" textAnchor="middle" fill="${accent}" fontSize="16" fontFamily="monospace" fontWeight="black">94%</text>
              <text x="47" y="70" textAnchor="middle" fill="#22C55E" fontSize="9" fontFamily="monospace">58°C</text>
              <text x="47" y="88" textAnchor="middle" fill="#94A3B8" fontSize="8" fontFamily="monospace">76/80GB</text>
            </g>
          ))}
          <text x="300" y="200" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">TENSOR CORE FP8 ACCELERATION // 480W TGP STABLE</text>
        </svg>
      `;

    case 'raft_consensus':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <circle cx="300" cy="120" r="85" fill="none" stroke="#1F2937" strokeWidth="1.5" />
          <circle cx="300" cy="120" r="26" fill="#0D1117" stroke="${accent}" strokeWidth="2.5" />
          <text x="300" y="124" textAnchor="middle" fill="${accent}" fontSize="8" fontFamily="monospace" fontWeight="bold">LEADER</text>
          {/* Raft Followers */}
          <g transform="translate(300, 35)"><circle r="14" fill="#0D1117" stroke="#22C55E" /><text textAnchor="middle" dy="3" fill="#FFF" fontSize="7" fontFamily="monospace">NODE-2</text></g>
          <g transform="translate(385, 120)"><circle r="14" fill="#0D1117" stroke="#22C55E" /><text textAnchor="middle" dy="3" fill="#FFF" fontSize="7" fontFamily="monospace">NODE-3</text></g>
          <g transform="translate(300, 205)"><circle r="14" fill="#0D1117" stroke="#22C55E" /><text textAnchor="middle" dy="3" fill="#FFF" fontSize="7" fontFamily="monospace">NODE-4</text></g>
          <g transform="translate(215, 120)"><circle r="14" fill="#0D1117" stroke="#22C55E" /><text textAnchor="middle" dy="3" fill="#FFF" fontSize="7" fontFamily="monospace">NODE-5</text></g>
          <text x="300" y="15" textAnchor="middle" fill="#FFF" fontSize="9" fontFamily="monospace">RAFT CONSENSUS QUORUM: 5/5 NODES IN-SYNC</text>
        </svg>
      `;

    case 'webhook_backoff':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <line x1="80" y1="180" x2="520" y2="180" stroke="#1F2937" strokeWidth="1.5" />
          <line x1="80" y1="60" x2="80" y2="180" stroke="#1F2937" strokeWidth="1.5" />
          <path d="M 80 180 Q 200 170, 320 120 T 520 60" fill="none" stroke="${accent}" strokeWidth="3" />
          <circle cx="160" cy="175" r="4" fill="#22C55E" />
          <circle cx="280" cy="140" r="4" fill="#FF9F0A" />
          <circle cx="440" cy="85" r="4" fill="#00F0FF" />
          <text x="300" y="45" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">EXPONENTIAL BACKOFF + FULL JITTER // 0 DLQ ORPHANS</text>
          <text x="300" y="210" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">DELIVERY SUCCESS RATE: 99.98% // MEAN RETRIES: 1.02</text>
        </svg>
      `;

    case 'graphql_tree':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <circle cx="300" cy="50" r="18" fill="#0D1117" stroke="${accent}" strokeWidth="2" />
          <text x="300" y="54" textAnchor="middle" fill="#FFF" fontSize="8" fontFamily="monospace">QUERY</text>
          <line x1="300" y1="68" x2="200" y2="120" stroke="#1F2937" strokeWidth="2" />
          <line x1="300" y1="68" x2="300" y2="120" stroke="#1F2937" strokeWidth="2" />
          <line x1="300" y1="68" x2="400" y2="120" stroke="#1F2937" strokeWidth="2" />
          <circle cx="200" cy="120" r="14" fill="#0D1117" stroke="#22C55E" /><text x="200" y="123" textAnchor="middle" fill="#FFF" fontSize="7" fontFamily="monospace">telemetry</text>
          <circle cx="300" cy="120" r="14" fill="#0D1117" stroke="#22C55E" /><text x="300" y="123" textAnchor="middle" fill="#FFF" fontSize="7" fontFamily="monospace">orderbook</text>
          <circle cx="400" cy="120" r="14" fill="#0D1117" stroke="#22C55E" /><text x="400" y="123" textAnchor="middle" fill="#FFF" fontSize="7" fontFamily="monospace">auditTrail</text>
          <text x="300" y="180" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">DATALOADER BATCHED RESOLVERS // P99 LATENCY: 0.84ms</text>
        </svg>
      `;

    case 'grpc_framing':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <line x1="80" y1="120" x2="520" y2="120" stroke="#1F2937" strokeWidth="2" />
          {Array.from({ length: 6 }).map((_, i) => (
            <g key={i} transform={\`translate(\${100 + i * 70}, 95)\`}>
              <rect width="55" height="50" rx="4" fill="#0D1117" stroke={i % 2 === 0 ? '${accent}' : '#FF9F0A'} strokeWidth="1.5" />
              <text x="27" y="20" textAnchor="middle" fill="#FFF" fontSize="7" fontFamily="monospace">PROTOBUF</text>
              <text x="27" y="38" textAnchor="middle" fill="${accent}" fontSize="9" fontFamily="monospace">F-\${i + 1}</text>
            </g>
          ))}
          <text x="300" y="45" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">HTTP/2 MULTIPLEXED BIDI STREAMING // 64 ACTIVE RPCs</text>
        </svg>
      `;

    case 'saga_flow':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <line x1="80" y1="120" x2="520" y2="120" stroke="#22C55E" strokeWidth="2.5" />
          {['AUTH', 'PAYMENT', 'PROVISION', 'TITLE', 'COMMIT'].map((s, i) => (
            <g key={i} transform={\`translate(\${80 + i * 110}, 120)\`}>
              <circle r="18" fill="#0D1117" stroke="#22C55E" strokeWidth="2" />
              <text textAnchor="middle" dy="4" fill="#FFF" fontSize="7" fontFamily="monospace" fontWeight="bold">{s}</text>
            </g>
          ))}
          <text x="300" y="60" textAnchor="middle" fill="${accent}" fontSize="11" fontFamily="monospace" fontWeight="bold">DISTRIBUTED SAGA TRANSACTION: 100% ATOMIC</text>
          <text x="300" y="180" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">AUTOMATED COMPENSATION ROLLBACK ARMED (18ms LAG)</text>
        </svg>
      `;

    case 'timeseries_compression':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <line x1="60" y1="180" x2="540" y2="180" stroke="#1F2937" strokeWidth="1.5" />
          <path d="M 60 180 Q 180 80, 300 140 T 540 100" fill="none" stroke="${accent}" strokeWidth="2.5" />
          <text x="300" y="55" textAnchor="middle" fill="${accent}" fontSize="18" fontFamily="monospace" fontWeight="black">11.8x COMPRESSION RATIO</text>
          <text x="300" y="80" textAnchor="middle" fill="#FFF" fontSize="9" fontFamily="monospace">GORILLA XOR FLOAT64 DELTA-OF-DELTA ENCODING</text>
          <text x="300" y="210" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">4.82M SAMPLES/SEC INGESTION VELOCITY</text>
        </svg>
      `;

    case 'edge_kv_mesh':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <circle cx="300" cy="120" r="85" fill="none" stroke="#1F2937" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="300" cy="120" r="18" fill="#0D1117" stroke="${accent}" strokeWidth="2" />
          <text x="300" y="124" textAnchor="middle" fill="${accent}" fontSize="8" fontFamily="monospace">KV-ROOT</text>
          <circle cx="230" cy="80" r="6" fill="#22C55E" /><text x="230" y="70" textAnchor="middle" fill="#FFF" fontSize="7" fontFamily="monospace">0.4ms</text>
          <circle cx="370" cy="80" r="6" fill="#22C55E" /><text x="370" y="70" textAnchor="middle" fill="#FFF" fontSize="7" fontFamily="monospace">0.4ms</text>
          <circle cx="380" cy="160" r="6" fill="#22C55E" /><text x="380" y="175" textAnchor="middle" fill="#FFF" fontSize="7" fontFamily="monospace">0.4ms</text>
          <circle cx="220" cy="160" r="6" fill="#22C55E" /><text x="220" y="175" textAnchor="middle" fill="#FFF" fontSize="7" fontFamily="monospace">0.4ms</text>
          <text x="300" y="25" textAnchor="middle" fill="#FFF" fontSize="10" fontFamily="monospace">WORLDWIDE 310 POP INVALIDATION: 120ms</text>
        </svg>
      `;

    case 'mqtt_fanout':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <circle cx="200" cy="120" r="28" fill="#0D1117" stroke="${accent}" strokeWidth="2" />
          <text x="200" y="124" textAnchor="middle" fill="${accent}" fontSize="9" fontFamily="monospace" fontWeight="bold">MQTT-HUB</text>
          <line x1="228" y1="120" x2="380" y2="70" stroke="#22C55E" strokeWidth="2" />
          <line x1="228" y1="120" x2="380" y2="120" stroke="#22C55E" strokeWidth="2" />
          <line x1="228" y1="120" x2="380" y2="170" stroke="#22C55E" strokeWidth="2" />
          <circle cx="380" cy="70" r="14" fill="#0D1117" stroke="#22C55E" /><text x="380" y="73" textAnchor="middle" fill="#FFF" fontSize="7" fontFamily="monospace">420k</text>
          <circle cx="380" cy="120" r="14" fill="#0D1117" stroke="#22C55E" /><text x="380" y="123" textAnchor="middle" fill="#FFF" fontSize="7" fontFamily="monospace">280k</text>
          <circle cx="380" cy="170" r="14" fill="#0D1117" stroke="#22C55E" /><text x="380" y="173" textAnchor="middle" fill="#FFF" fontSize="7" fontFamily="monospace">540k</text>
          <text x="300" y="30" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">1.24M SENSORS CONNECTED // 2.84M MSG/SEC</text>
        </svg>
      `;

    case 'event_replay':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <line x1="80" y1="120" x2="520" y2="120" stroke="#1F2937" strokeWidth="3" />
          <circle cx="140" cy="120" r="10" fill="#22C55E" /><text x="140" y="100" textAnchor="middle" fill="#FFF" fontSize="8" fontFamily="monospace">T-0</text>
          <circle cx="280" cy="120" r="10" fill="#FF9F0A" /><text x="280" y="100" textAnchor="middle" fill="#FFF" fontSize="8" fontFamily="monospace">SNAPSHOT</text>
          <circle cx="440" cy="120" r="12" fill="${accent}" /><text x="440" y="100" textAnchor="middle" fill="${accent}" fontSize="8" fontFamily="monospace">NOW</text>
          <text x="300" y="175" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">EVENT SOURCING HISTORICAL REPLAY: 12.4M EVENTS/SEC</text>
        </svg>
      `;

    case 'lb_radar':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <circle cx="300" cy="120" r="85" fill="none" stroke="#1F2937" strokeWidth="1.5" />
          <circle cx="300" cy="120" r="24" fill="#0D1117" stroke="${accent}" strokeWidth="2" />
          <text x="300" y="124" textAnchor="middle" fill="${accent}" fontSize="8" fontFamily="monospace">WEIGHTED</text>
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i * 60 * Math.PI) / 180;
            const x = 300 + 85 * Math.cos(angle);
            const y = 120 + 85 * Math.sin(angle);
            return (
              <g key={i}>
                <line x1="300" y1="120" x2={x} y2={y} stroke="#22C55E" strokeWidth="1.5" />
                <circle cx={x} cy={y} r="10" fill="#0D1117" stroke="#22C55E" />
                <text x={x} y={y + 3} textAnchor="middle" fill="#FFF" fontSize="7" fontFamily="monospace">T-\${i + 1}</text>
              </g>
            );
          })}
          <text x="300" y="225" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">LEAST-CONN LOAD BALANCER: ALL 64 POOLS HEALTHY (100%)</text>
        </svg>
      `;

    case 'merkle_tree':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <circle cx="300" cy="40" r="16" fill="#0D1117" stroke="${accent}" strokeWidth="2" /><text x="300" y="44" textAnchor="middle" fill="#FFF" fontSize="7" fontFamily="monospace">ROOT</text>
          <line x1="300" y1="56" x2="200" y2="100" stroke="#1F2937" strokeWidth="1.5" />
          <line x1="300" y1="56" x2="400" y2="100" stroke="#1F2937" strokeWidth="1.5" />
          <circle cx="200" cy="100" r="14" fill="#0D1117" stroke="#22C55E" /><text x="200" y="103" textAnchor="middle" fill="#FFF" fontSize="7" fontFamily="monospace">H-0</text>
          <circle cx="400" cy="100" r="14" fill="#0D1117" stroke="#22C55E" /><text x="400" y="103" textAnchor="middle" fill="#FFF" fontSize="7" fontFamily="monospace">H-1</text>
          <line x1="200" y1="114" x2="150" y2="160" stroke="#22C55E" strokeWidth="1.5" />
          <line x1="200" y1="114" x2="250" y2="160" stroke="#22C55E" strokeWidth="1.5" />
          <circle cx="150" cy="160" r="10" fill="#0D1117" stroke="#FF9F0A" /><text x="150" y="163" textAnchor="middle" fill="#FFF" fontSize="6" fontFamily="monospace">APA-308</text>
          <circle cx="250" cy="160" r="10" fill="#0D1117" stroke="#FF9F0A" /><text x="250" y="163" textAnchor="middle" fill="#FFF" fontSize="6" fontFamily="monospace">APA-364</text>
          <text x="300" y="210" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">CRYPTOGRAPHIC MERKLE PROOF: 0.04ms INCLUSION VERIFIED</text>
        </svg>
      `;

    case 'blockchain_chain':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          {Array.from({ length: 4 }).map((_, i) => (
            <g key={i} transform={\`translate(\${80 + i * 115}, 80)\`}>
              <rect width="90" height="60" rx="6" fill="#0D1117" stroke="${accent}" strokeWidth="2" />
              <text x="45" y="25" textAnchor="middle" fill="#FFF" fontSize="8" fontFamily="monospace" fontWeight="bold">BLOCK #\${941800 + i}</text>
              <text x="45" y="45" textAnchor="middle" fill="#22C55E" fontSize="8" fontFamily="monospace">SEALED (100%)</text>
              {i < 3 && <line x1="90" y1="30" x2="115" y2="30" stroke="${accent}" strokeWidth="2" />}
            </g>
          ))}
          <text x="300" y="180" textAnchor="middle" fill="#FFF" fontSize="10" fontFamily="monospace" fontWeight="bold">IMMUTABLE FORENSIC LEDGER: 94.1M EVENTS (ZERO BREAKS)</text>
        </svg>
      `;

    case 'rbac_graph':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <circle cx="150" cy="120" r="28" fill="#0D1117" stroke="${accent}" strokeWidth="2" /><text x="150" y="124" textAnchor="middle" fill="${accent}" fontSize="9" fontFamily="monospace">IDENTITY</text>
          <line x1="178" y1="120" x2="300" y2="70" stroke="#FF9F0A" strokeWidth="2" />
          <line x1="178" y1="120" x2="300" y2="170" stroke="#22C55E" strokeWidth="2" />
          <rect x="300" y="50" width="160" height="40" rx="6" fill="#0D1117" stroke="#FF9F0A" strokeWidth="1.5" />
          <text x="380" y="74" textAnchor="middle" fill="#FFF" fontSize="8" fontFamily="monospace">ROLE: DealershipPrincipal</text>
          <rect x="300" y="150" width="160" height="40" rx="6" fill="#0D1117" stroke="#22C55E" strokeWidth="1.5" />
          <text x="380" y="174" textAnchor="middle" fill="#FFF" fontSize="8" fontFamily="monospace">ROLE: PortfolioAuditor</text>
          <text x="300" y="25" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">ABAC & RBAC PERMISSION GRAPH: 0.18ms ACCESS DECISIONS</text>
        </svg>
      `;

    case 'bubble_limiter':
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <rect x="80" y="80" width="440" height="30" rx="6" fill="#1F2937" />
          <rect x="80" y="80" width="220" height="30" rx="6" fill="${accent}" />
          <text x="190" y="100" textAnchor="middle" fill="#000" fontSize="9" fontFamily="monospace" fontWeight="bold">CONSUMED: 50%</text>
          <text x="410" y="100" textAnchor="middle" fill="#FFF" fontSize="9" fontFamily="monospace">BURST CAPACITY: 500 RPS</text>
          <text x="300" y="160" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">REDIS SLIDING LOG RATE LIMITER: 99.99% ACCURACY</text>
        </svg>
      `;

    case 'sanitizer_filter':
    default:
      return `
        <svg className="w-full h-full" viewBox="0 0 600 240">
          <rect x="100" y="60" width="400" height="30" rx="4" fill="#0D1117" stroke="#EF4444" strokeWidth="1.5" />
          <text x="300" y="80" textAnchor="middle" fill="#EF4444" fontSize="9" fontFamily="monospace">INPUT: 4111-2222-3333-4444 // USER_SECRET_TOKEN</text>
          <line x1="300" y1="90" x2="300" y2="130" stroke="${accent}" strokeWidth="3" markerEnd="url(#arrow)" />
          <rect x="100" y="130" width="400" height="30" rx="4" fill="#0D1117" stroke="#22C55E" strokeWidth="1.5" />
          <text x="300" y="150" textAnchor="middle" fill="#22C55E" fontSize="9" fontFamily="monospace">SANITIZED: ****-****-****-4444 // [REDACTED_SECRET]</text>
          <text x="300" y="200" textAnchor="middle" fill="${accent}" fontSize="10" fontFamily="monospace" fontWeight="bold">SIMD PARALLEL SCRUBBER: 184 MB/S // ZERO PII LEAKS</text>
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
                          <span className="text-slate-200 truncate max-w-[280px]">{item.ttft || item.dim || item.promptLen || item.tps || item.util || item.holder || item.endpoint || item.clients || item.client || item.steps || item.rawPoints || item.reads || item.throughput || item.healthy || item.leafHash || item.prevHash || item.permissions || item.limit || item.pattern}</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-400">
                          <span>{item.status || item.action || item.state || item.rollback || item.ratio || item.scope || item.remaining || item.replacement}</span>
                          <span className="text-green-400 font-bold">{item.itl || item.searchLat || item.kvCacheMb || item.batchSize || item.temp || item.delay || item.latency || item.rtt || item.compressedBytes || item.duration || item.fee || item.costTotal || '0.15ms'}</span>
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
## Chassis F-${String(unit.num - 445).padStart(2, '0')}: ${unit.name}
**Asset Classification:** Track 2 (Hypercar Flagship Tier-1 Interactive Cockpit)  
**Parent Fleet Registry:** GhostFactoryOS × Aura & Grid (\`cockpits/batch-foxtrot/${unit.folder}/\`)

\`\`\`
================================================================================
   GHOST FACTORY OS // TRACK 2 HYPERCAR FLAGSHIP MONRONEY SPECIFICATION
================================================================================
UNIT IDENTIFIER:        ${unit.id}
CHASSIS MODEL NAME:     ${unit.name} (${unit.subtitle})
COHORT:                 Cluster-008 Flagship Series (Batch Foxtrot)
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
