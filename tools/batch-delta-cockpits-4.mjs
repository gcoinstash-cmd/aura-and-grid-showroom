/**
 * Batch Delta Cockpits — Part 4: Units #421 to #425 (App Performance)
 * React re-render profiler, Web Vitals scope, Memory leak tracer, Edge cold start, API payload waterfall
 */

export const PERF_COCKPITS = [
  // UNIT #421: React Component Re-Render Profiler
  {
    num: 421,
    folder: '16-react-rerender-profiler',
    id: 'GF-T2-REACT-16',
    name: 'REACT-RERENDER-PROFILER',
    subtitle: 'Virtual DOM Commit Flashes & Waste Heatmap',
    accent: '#00F0FF',
    componentName: 'ReactRerenderProfilerCockpit',
    metric1: { label: 'COMMIT PHASE DURATION', value: '1.4', unit: 'ms', sub: 'FRAME BUDGET: 16.6ms', color: '#00F0FF' },
    metric2: { label: 'WASTED RENDER PERCENT', value: '0.00', unit: '%', sub: 'MEMOIZED: 100%', color: '#FF9F0A' },
    svgType: 'vdom_flashes',
    items: [
      { id: 'COMP:TelemetryHUD', renders: 120, avgDuration: '0.4ms', wasted: '0%', reason: 'PROP_MUTATION', status: 'OPTIMAL' },
      { id: 'COMP:WaveformCanvas', renders: 60, avgDuration: '0.8ms', wasted: '0%', reason: 'ANIMATION_TICK', status: 'OPTIMAL' },
      { id: 'COMP:OrderbookDrawer', renders: 14, avgDuration: '0.2ms', wasted: '0%', reason: 'STATE_CHANGE', status: 'OPTIMAL' },
      { id: 'COMP:MetricCardRow', renders: 4, avgDuration: '0.1ms', wasted: '0%', reason: 'DATA_REFRESH', status: 'OPTIMAL' },
      { id: 'COMP:ActionBarCTA', renders: 1, avgDuration: '0.05ms', wasted: '0%', reason: 'INITIAL_MOUNT', status: 'OPTIMAL' }
    ]
  },

  // UNIT #422: Web Vitals Real-Time Scope
  {
    num: 422,
    folder: '17-web-vitals-scope',
    id: 'GF-T2-VITALS-17',
    name: 'WEB-VITALS-SCOPE',
    subtitle: 'Real-User Core Web Vitals (LCP, INP, CLS) Horizon',
    accent: '#FF9F0A',
    componentName: 'WebVitalsScopeCockpit',
    metric1: { label: 'LARGEST CONTENTFUL PAINT', value: '620', unit: 'ms', sub: 'TARGET: < 2,500ms', color: '#FF9F0A' },
    metric2: { label: 'INTERACTION TO NEXT PAINT', value: '18', unit: 'ms', sub: 'TARGET: < 200ms', color: '#00F0FF' },
    svgType: 'vitals_gauge',
    items: [
      { id: 'METRIC:LCP', name: 'Largest Contentful Paint', value: '620ms', rating: 'GOOD', target: '< 2.5s', score: 100 },
      { id: 'METRIC:INP', name: 'Interaction to Next Paint', value: '18ms', rating: 'GOOD', target: '< 200ms', score: 100 },
      { id: 'METRIC:CLS', name: 'Cumulative Layout Shift', value: '0.001', rating: 'GOOD', target: '< 0.10', score: 100 },
      { id: 'METRIC:FCP', name: 'First Contentful Paint', value: '280ms', rating: 'GOOD', target: '< 1.8s', score: 100 },
      { id: 'METRIC:TTFB', name: 'Time to First Byte', value: '42ms', rating: 'GOOD', target: '< 800ms', score: 100 }
    ]
  },

  // UNIT #423: Memory Leak Tracer
  {
    num: 423,
    folder: '18-memory-leak-tracer',
    id: 'GF-T2-LEAK-18',
    name: 'MEMORY-LEAK-TRACER',
    subtitle: 'V8 Heap Snapshot Allocations & Retained Objects',
    accent: '#00F0FF',
    componentName: 'MemoryLeakTracerCockpit',
    metric1: { label: 'V8 HEAP ALLOCATION', value: '48.2', unit: 'MB', sub: 'GC FREQUENCY: 450ms', color: '#00F0FF' },
    metric2: { label: 'DETACHED DOM NODES', value: '0', unit: 'RETAINED', sub: 'EVENT BUS DETACHED: 0', color: '#FF9F0A' },
    svgType: 'heap_profile',
    items: [
      { id: 'ALLOC:ArrayBuffers', count: '1,420', size: '24.1 MB', delta: '+0.0 KB', status: 'STABLE' },
      { id: 'ALLOC:Strings (v8)', count: '48,100', size: '12.4 MB', delta: '+1.2 KB', status: 'STABLE' },
      { id: 'ALLOC:Closures / Context', count: '9,800', size: '4.8 MB', delta: '-0.4 KB', status: 'CLEARED' },
      { id: 'ALLOC:React Fibers', count: '2,400', size: '3.9 MB', delta: '+0.0 KB', status: 'STABLE' },
      { id: 'ALLOC:Compiled Code', count: '450', size: '3.0 MB', delta: '+0.0 KB', status: 'STABLE' }
    ]
  },

  // UNIT #424: Edge Cold-Start Gauge
  {
    num: 424,
    folder: '19-edge-cold-start',
    id: 'GF-T2-EDGE-19',
    name: 'EDGE-COLD-START',
    subtitle: 'V8 Isolate Initialization & Worker Latency Scope',
    accent: '#FF9F0A',
    componentName: 'EdgeColdStartCockpit',
    metric1: { label: 'ISOLATE INITIALIZATION', value: '4.8', unit: 'ms', sub: 'SNAPSHOT BOOT: 0.8ms', color: '#FF9F0A' },
    metric2: { label: 'WARM RE-EXECUTION', value: '0.12', unit: 'ms', sub: 'GLOBAL POOL: 310 PoPs', color: '#00F0FF' },
    svgType: 'edge_isolate',
    items: [
      { id: 'POP-IAD (Ashburn)', isolateBoot: '4.2ms', warmRtt: '0.09ms', memRss: '18.4MB', status: 'WARMED' },
      { id: 'POP-LHR (London)', isolateBoot: '4.8ms', warmRtt: '0.11ms', memRss: '18.2MB', status: 'WARMED' },
      { id: 'POP-NRT (Tokyo)', isolateBoot: '5.1ms', warmRtt: '0.14ms', memRss: '18.5MB', status: 'WARMED' },
      { id: 'POP-FRA (Frankfurt)', isolateBoot: '4.6ms', warmRtt: '0.10ms', memRss: '18.1MB', status: 'WARMED' },
      { id: 'POP-SYD (Sydney)', isolateBoot: '5.4ms', warmRtt: '0.15ms', memRss: '18.6MB', status: 'WARMED' }
    ]
  },

  // UNIT #425: API Payload Waterfall
  {
    num: 425,
    folder: '20-api-payload-waterfall',
    id: 'GF-T2-WATERFALL-20',
    name: 'API-PAYLOAD-WATERFALL',
    subtitle: 'DNS / TCP / TLS Handshake & TTFB Response Waterfall',
    accent: '#00F0FF',
    componentName: 'ApiPayloadWaterfallCockpit',
    metric1: { label: 'MEAN TIME TO FIRST BYTE', value: '18.4', unit: 'ms', sub: 'HTTP/3 QUIC 0-RTT', color: '#00F0FF' },
    metric2: { label: 'END-TO-END TRANSIT', value: '34.2', unit: 'ms', sub: 'PAYLOAD: 4.2 KB (BR)', color: '#FF9F0A' },
    svgType: 'waterfall_bars',
    items: [
      { id: 'REQ-01', endpoint: 'GET /api/v1/telemetry/heartbeat', dns: '0.8ms', tcp: '1.2ms', tls: '1.4ms', ttfb: '12.4ms', total: '15.8ms' },
      { id: 'REQ-02', endpoint: 'POST /api/v1/auth/session/token', dns: '0.0ms', tcp: '0.0ms', tls: '0.0ms', ttfb: '14.2ms', total: '14.2ms' },
      { id: 'REQ-03', endpoint: 'GET /api/v1/fleet/catalog/clusters', dns: '0.0ms', tcp: '0.0ms', tls: '0.0ms', ttfb: '18.1ms', total: '18.1ms' },
      { id: 'REQ-04', endpoint: 'GET /api/v1/orderbook/depth/l2', dns: '0.0ms', tcp: '0.0ms', tls: '0.0ms', ttfb: '8.4ms', total: '8.4ms' },
      { id: 'REQ-05', endpoint: 'POST /api/v1/telemetry/packet/push', dns: '0.0ms', tcp: '0.0ms', tls: '0.0ms', ttfb: '9.8ms', total: '9.8ms' }
    ]
  }
];
