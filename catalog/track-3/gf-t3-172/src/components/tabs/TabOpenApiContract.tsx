/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Network, FileText, Copy, Check, Play, Send, Radio, Terminal } from 'lucide-react';
import { OPENAPI_YAML, API_ENDPOINTS, ApiEndpoint } from '../../data/openApiSpec';

export const TabOpenApiContract: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(API_ENDPOINTS[0]);
  const [copiedYaml, setCopiedYaml] = useState(false);
  const [mockResponse, setMockResponse] = useState<Record<string, unknown> | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [wsFrames, setWsFrames] = useState([
    { ts: '14:32:18.420', event: 'EPOCH_COMMITTED', epoch: 1048580, split: '70:30', latency: '0.48ms' },
    { ts: '14:32:18.410', event: 'PROPOSAL_BROADCAST', epoch: 1048580, proposer: 'node-0' },
    { ts: '14:32:17.410', event: 'EPOCH_COMMITTED', epoch: 1048579, split: '20:80', latency: '0.52ms' },
  ]);

  const copyYaml = () => {
    navigator.clipboard.writeText(OPENAPI_YAML);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2000);
  };

  const executeMockRequest = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      setMockResponse(selectedEndpoint.responseSample);
    }, 280);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Network className="w-6 h-6 text-cyan-400" />
              OpenAPI 3.1 & WebSocket Swarm Contract
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-4xl">
              Strict typed specifications for high-frequency CAN-FD chassis telemetry ingestion, peer-to-peer BFT vote consensus broadcasting, and real-time state streams.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-sm font-semibold">
              <Radio className="w-4 h-4 text-cyan-400" />
              WebSocket 100 Hz Live Framing
            </span>
          </div>
        </div>
      </div>

      {/* Endpoint Explorer & Live Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Endpoint List */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xl font-bold text-white">Swarm Endpoints</h3>
            <span className="text-sm font-mono text-slate-400">REST & WSS</span>
          </div>

          <div className="space-y-3 mt-4">
            {API_ENDPOINTS.map((endpoint) => {
              const isSelected = selectedEndpoint.path === endpoint.path;
              const isPost = endpoint.method === 'POST';
              const isGet = endpoint.method === 'GET';
              const isWss = endpoint.method === 'WSS';

              return (
                <div
                  key={endpoint.path}
                  onClick={() => {
                    setSelectedEndpoint(endpoint);
                    setMockResponse(null);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500 shadow-sm'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`font-mono text-sm font-bold px-2.5 py-0.5 rounded ${
                        isPost
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : isGet
                          ? 'bg-blue-950 text-blue-300 border border-blue-500/40'
                          : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {endpoint.method}
                    </span>
                    <span className="font-mono text-sm text-slate-200 truncate font-semibold">
                      {endpoint.path}
                    </span>
                  </div>
                  <div className="text-sm text-slate-300 mt-2 font-medium">
                    {endpoint.summary}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Endpoint Detail & Runner */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
                    {selectedEndpoint.method}
                  </span>
                  <span className="text-lg font-bold text-white font-mono">
                    {selectedEndpoint.path}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mt-1">
                  {selectedEndpoint.description}
                </p>
              </div>

              <button
                onClick={executeMockRequest}
                disabled={isExecuting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition shrink-0"
              >
                <Send className="w-4 h-4" />
                {isExecuting ? 'Sending...' : 'Test Request'}
              </button>
            </div>

            {/* Request Sample if applicable */}
            {selectedEndpoint.requestSample && (
              <div className="mt-4">
                <div className="text-sm font-mono text-slate-400 font-semibold mb-1">
                  REQUEST PAYLOAD JSON:
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto">
                  <pre className="font-mono text-sm text-cyan-300">
                    {JSON.stringify(selectedEndpoint.requestSample, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Response Output or Live WebSocket Stream */}
            <div className="mt-4">
              <div className="text-sm font-mono text-slate-400 font-semibold mb-1 flex items-center justify-between">
                <span>MOCK RESPONSE PAYLOAD (HTTP 200 OK):</span>
                <span className="text-emerald-400 font-bold">STATUS: 200 SUCCESS</span>
              </div>
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto max-h-[220px]">
                <pre className="font-mono text-sm text-emerald-300">
                  {JSON.stringify(mockResponse || selectedEndpoint.responseSample, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* WebSocket Framing Ticker */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="text-sm font-mono text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
              HIGH-SPEED WEBSOCKET BROADCAST LOG (100 Hz):
            </div>
            <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-sm font-mono">
              {wsFrames.map((f, i) => (
                <div key={i} className="text-slate-300 flex items-center justify-between">
                  <span>[{f.ts}] {f.event} #{f.epoch}</span>
                  <span className="text-cyan-400">{f.split || f.proposer}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* OpenAPI 3.1 YAML Full Specification Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-sm font-bold text-cyan-400">
              openapi_v3_1_swarm.yaml
            </span>
            <span className="text-slate-500 text-sm">• Complete OpenAPI 3.1 Protocol Contract</span>
          </div>
          <button
            onClick={copyYaml}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-mono transition"
          >
            {copiedYaml ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                Copied YAML
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy OpenAPI Contract
              </>
            )}
          </button>
        </div>

        <div className="p-4 bg-slate-950 overflow-x-auto max-h-[380px]">
          <pre className="font-mono text-sm text-slate-300 leading-relaxed">
            {OPENAPI_YAML}
          </pre>
        </div>
      </div>
    </div>
  );
};
