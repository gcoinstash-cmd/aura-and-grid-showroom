import React, { useState, useEffect } from 'react';

const ENDPOINTS = [
  { path: '/v1/telemetry/stream', method: 'GET', avgLatency: '2.4ms', p99: '6.1ms', rps: '1,840 req/s', errorRate: '0.01%' },
  { path: '/v1/auth/tokens/verify', method: 'POST', avgLatency: '8.2ms', p99: '18.4ms', rps: '480 req/s', errorRate: '0.12%' },
  { path: '/v1/vault/keys/active', method: 'GET', avgLatency: '3.6ms', p99: '8.9ms', rps: '320 req/s', errorRate: '0.00%' },
  { path: '/v1/pipeline/ingest', method: 'POST', avgLatency: '5.1ms', p99: '12.8ms', rps: '640 req/s', errorRate: '0.05%' },
  { path: '/v1/chrono/dispatch', method: 'POST', avgLatency: '4.7ms', p99: '11.2ms', rps: '140 req/s', errorRate: '0.02%' }
];

export default function SynapseAuditCockpit() {
  const [filterType, setFilterType] = useState('ALL');
  const [reqPerSec, setReqPerSec] = useState(3420);
  const [p99Latency, setP99Latency] = useState(14.8);
  const [requestLogs, setRequestLogs] = useState([]);
  const [statusRatio, setStatusRatio] = useState({ ok: 98.4, clientErr: 1.2, srvErr: 0.4 });

  useEffect(() => {
    const interval = setInterval(() => {
      // Fluctuations
      setReqPerSec(prev => prev + Math.floor((Math.random() - 0.5) * 120));
      setP99Latency(Number((12.5 + Math.random() * 4.2).toFixed(1)));

      // Request stream generator
      const methods = ['GET', 'POST', 'GET', 'POST', 'GET'];
      const paths = ['/v1/telemetry/stream', '/v1/auth/tokens/verify', '/v1/vault/keys/active', '/v1/pipeline/ingest', '/v1/chrono/dispatch'];
      const statuses = [
        { code: 200, label: '200 OK', type: 'OK' },
        { code: 200, label: '200 OK', type: 'OK' },
        { code: 201, label: '201 CREATED', type: 'OK' },
        { code: 401, label: '401 UNAUTHORIZED', type: 'ERR' },
        { code: 429, label: '429 TOO MANY REQS', type: 'ERR' }
      ];

      const idx = Math.floor(Math.random() * paths.length);
      const method = methods[idx];
      const path = paths[idx];
      const statusObj = statuses[Math.floor(Math.random() * statuses.length)];
      const latency = (1.4 + Math.random() * 14.5).toFixed(1);
      const bytes = Math.floor(180 + Math.random() * 1420);
      const clientIp = `10.42.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

      const newLog = {
        id: Math.random().toString(36).substring(2, 9).toUpperCase(),
        time: new Date().toISOString().split('T')[1].slice(0, 12),
        method,
        path,
        statusCode: statusObj.code,
        statusLabel: statusObj.label,
        type: statusObj.type,
        latency: `${latency}ms`,
        bytes: `${bytes} B`,
        clientIp
      };

      setRequestLogs(prev => [newLog, ...prev.slice(0, 7)]);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const filteredLogs = requestLogs.filter(log => {
    if (filterType === 'ALL') return true;
    if (filterType === 'GET') return log.method === 'GET';
    if (filterType === 'POST') return log.method === 'POST';
    if (filterType === 'ERRORS') return log.type === 'ERR';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#05070B] text-slate-200 font-sans p-4 md:p-8 select-none">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* TOP STATUS BAR */}
        <header className="flex flex-wrap items-center justify-between border-b border-[#1F2937] pb-4 gap-4 bg-[#0D1117] p-4 rounded-xl border border-[#1F2937]">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#00F0FF] animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-widest text-[#00F0FF] uppercase">TRACK 2 // HYPERCAR FLAGSHIP</span>
                <span className="text-[10px] bg-[#1F2937] text-slate-300 px-2 py-0.5 rounded font-mono">GF-T2-SYNAPSE-05</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white font-mono flex items-center gap-2">
                SYNAPSE-AUDIT <span className="text-xs text-[#FF9F0A] font-normal">// API REQUEST INSPECTOR & PROFILER COCKPIT</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="bg-[#05070B] border border-[#1F2937] px-3 py-1.5 rounded-lg flex items-center gap-2">
              <span className="text-slate-400">STATUS QUOTA:</span>
              <span className="text-green-400 font-bold">{statusRatio.ok}% 2xx</span>
            </div>
            <div className="bg-[#05070B] border border-[#1F2937] px-3 py-1.5 rounded-lg flex items-center gap-2">
              <span className="text-slate-400">INGRESS GATEWAY:</span>
              <span className="text-[#00F0FF] font-bold">WIRED</span>
            </div>
          </div>
        </header>

        {/* MAIN TELEMETRY LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT 2 COLUMNS: GAUGES & ENDPOINTS & REQUEST INSPECTOR */}
          <div className="lg:col-span-2 space-y-6">

            {/* DUAL METRIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#0D1117] border border-[#1F2937] p-5 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#00F0FF]" />
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">TOTAL INGRESS RATE</span>
                  <span className="text-xs font-mono text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded">+2.4% LIVE</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl md:text-5xl font-black font-mono text-white tracking-tight">{reqPerSec.toLocaleString()}</span>
                  <span className="text-sm font-mono text-[#00F0FF]">req/s</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>CAPACITY: 10,000 req/s</span>
                  <span className="text-green-400">NOMINAL LOAD</span>
                </div>
              </div>

              <div className="bg-[#0D1117] border border-[#1F2937] p-5 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#FF9F0A]" />
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">AGGREGATE P99 LATENCY</span>
                  <span className="text-xs font-mono text-[#FF9F0A] bg-[#FF9F0A]/10 px-2 py-0.5 rounded">SLA &lt; 25ms</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl md:text-5xl font-black font-mono text-white tracking-tight">{p99Latency}</span>
                  <span className="text-sm font-mono text-[#FF9F0A]">ms</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>HEADROOM: {(25 - p99Latency).toFixed(1)}ms</span>
                  <span className="text-green-400 font-bold">100% PASS</span>
                </div>
              </div>
            </div>

            {/* HTTP STATUS CODE RATIO BAR */}
            <div className="bg-[#0D1117] border border-[#1F2937] p-6 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  RESPONSE STATUS DISTRIBUTION
                </span>
                <span className="text-slate-400">2xx: {statusRatio.ok}% | 4xx: {statusRatio.clientErr}% | 5xx: {statusRatio.srvErr}%</span>
              </div>
              <div className="w-full h-3 bg-[#05070B] rounded-full overflow-hidden flex border border-[#1F2937]">
                <div style={{ width: `${statusRatio.ok}%` }} className="bg-green-400 h-full" />
                <div style={{ width: `${statusRatio.clientErr}%` }} className="bg-[#FF9F0A] h-full" />
                <div style={{ width: `${statusRatio.srvErr}%` }} className="bg-red-500 h-full" />
              </div>
            </div>

            {/* ROUTE LATENCY & PROFILE MATRIX */}
            <div className="bg-[#0D1117] border border-[#1F2937] p-6 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00F0FF]" />
                  TOP INGRESS ROUTE PROFILES
                </h3>
                <span className="text-xs font-mono text-slate-500">EDGE GATEWAY</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#1F2937] text-slate-400">
                      <th className="py-2 px-3">METHOD</th>
                      <th className="py-2 px-3">PATH</th>
                      <th className="py-2 px-3">AVG LATENCY</th>
                      <th className="py-2 px-3">P99</th>
                      <th className="py-2 px-3">THROUGHPUT</th>
                      <th className="py-2 px-3 text-right">ERROR RATE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F2937]/50">
                    {ENDPOINTS.map((ep, idx) => (
                      <tr key={idx} className="hover:bg-[#1F2937]/30 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ep.method === 'GET' ? 'bg-[#00F0FF]/10 text-[#00F0FF]' : 'bg-[#FF9F0A]/10 text-[#FF9F0A]'
                          }`}>
                            {ep.method}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-white font-bold">{ep.path}</td>
                        <td className="py-2.5 px-3 text-slate-300">{ep.avgLatency}</td>
                        <td className="py-2.5 px-3 text-[#FF9F0A]">{ep.p99}</td>
                        <td className="py-2.5 px-3 text-slate-400">{ep.rps}</td>
                        <td className="py-2.5 px-3 text-right text-green-400">{ep.errorRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: MONRONEY DEALERSHIP STICKER & LIVE REQUEST INSPECTOR */}
          <div className="space-y-6">

            {/* DEALERSHIP MONRONEY SPECIFICATION STICKER */}
            <div className="bg-[#0D1117] border border-[#1F2937] p-6 rounded-xl space-y-4">
              <div className="border-b border-[#1F2937] pb-3">
                <span className="text-[10px] font-mono text-[#00F0FF] font-bold tracking-widest uppercase">SPECIFICATION MONRONEY</span>
                <h2 className="text-lg font-black text-white font-mono mt-1">GF-T2-SYNAPSE-05</h2>
                <p className="text-xs text-slate-400 font-sans">Track 2 Hypercar Flagship API Cockpit</p>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-[#1F2937]/50">
                  <span className="text-slate-400">MODEL</span>
                  <span className="text-white font-bold">SYNAPSE-AUDIT</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1F2937]/50">
                  <span className="text-slate-400">COMMERCIAL TAG</span>
                  <span className="text-[#00F0FF] font-bold">100% PURE APA TITLE</span>
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
                  <span className="text-slate-400">LICENSE RIGHTS</span>
                  <span className="text-white">OUTRIGHT OWNERSHIP</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1F2937]/50">
                  <span className="text-slate-400">SEAT TIERS</span>
                  <span className="text-slate-400">ZERO (APA CLEAN TITLE)</span>
                </div>
              </div>

              {/* COMMERCIAL ACTION TARGETS (VERTICAL CONTAINER) */}
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

            {/* LIVE API REQUEST INSPECTOR */}
            <div className="bg-[#0D1117] border border-[#1F2937] p-5 rounded-xl space-y-3">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-ping" />
                  REQUEST INSPECTOR
                </h4>
                <div className="flex gap-1">
                  {['ALL', 'GET', 'POST', 'ERRORS'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-colors ${
                        filterType === type
                          ? 'bg-[#00F0FF] text-black'
                          : 'bg-[#1F2937] text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {filteredLogs.map((req) => (
                  <div key={req.id} className="p-2.5 rounded bg-[#05070B] border border-[#1F2937] text-[11px] font-mono space-y-1">
                    <div className="flex justify-between items-center text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          req.method === 'GET' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'bg-[#FF9F0A]/20 text-[#FF9F0A]'
                        }`}>
                          {req.method}
                        </span>
                        <span className="text-white font-bold truncate max-w-[140px]">{req.path}</span>
                      </div>
                      <span className="text-slate-500">{req.time}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span className={`text-[10px] font-bold ${req.type === 'OK' ? 'text-green-400' : 'text-[#FF9F0A]'}`}>
                        {req.statusLabel}
                      </span>
                      <span className="text-slate-400">{req.latency}</span>
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