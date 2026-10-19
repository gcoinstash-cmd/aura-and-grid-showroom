import React, { useRef, useEffect, useState } from 'react';
import { Network, Cpu } from 'lucide-react';
import { SwarmSimulation } from '../engine/swarmSimulation';
import { TelemetryState } from '../types/swarm';

interface MeshTopologyViewProps {
  sim: SwarmSimulation;
  telemetry: TelemetryState;
}

export const MeshTopologyView: React.FC<MeshTopologyViewProps> = ({ sim, telemetry }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, width, height);

      // Graph center layout ring
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.38;
      const n = sim.nodes.length;

      // Draw circular mesh nodes positions
      const nodePos: { x: number; y: number; id: number }[] = [];
      for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2;
        nodePos.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          id: sim.nodes[i].id,
        });
      }

      // Draw edges between connected neighbors
      ctx.lineWidth = 1;
      for (let i = 0; i < n; i++) {
        const node = sim.nodes[i];
        const p1 = nodePos[i];
        for (const neighborId of node.neighbors) {
          if (neighborId > node.id && neighborId < n) {
            const p2 = nodePos[neighborId];
            const isHovered = selectedNode === node.id || selectedNode === neighborId;

            ctx.strokeStyle = isHovered
              ? 'rgba(6, 182, 212, 0.95)'
              : 'rgba(16, 185, 129, 0.22)';
            ctx.lineWidth = isHovered ? 2.5 : 1.2;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (let i = 0; i < n; i++) {
        const node = sim.nodes[i];
        const p = nodePos[i];
        const isSelected = selectedNode === node.id;

        ctx.beginPath();
        ctx.arc(p.x, p.y, isSelected ? 13 : 9, 0, Math.PI * 2);

        if (node.isByzantine) {
          ctx.fillStyle = '#f43f5e';
          ctx.strokeStyle = '#ffffff';
        } else if (node.cbfActive) {
          ctx.fillStyle = '#f59e0b';
          ctx.strokeStyle = '#ef4444';
        } else if (isSelected) {
          ctx.fillStyle = '#38bdf8';
          ctx.strokeStyle = '#ffffff';
        } else {
          ctx.fillStyle = '#10b981';
          ctx.strokeStyle = '#064e3b';
        }
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.fill();
        ctx.stroke();

        // Label node ID
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = isSelected ? '#38bdf8' : '#94a3b8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labelRadius = radius + 24;
        const angle = (i / n) * Math.PI * 2;
        ctx.fillText(
          `#${node.id.toString().padStart(2, '0')}`,
          centerX + Math.cos(angle) * labelRadius,
          centerY + Math.sin(angle) * labelRadius
        );
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [sim, selectedNode]);

  const toggleByzantine = (id: number) => {
    const node = sim.nodes.find((n) => n.id === id);
    if (node) {
      node.isByzantine = !node.isByzantine;
    }
  };

  return (
    <div className="space-y-6">
      {/* Topology Header Card */}
      <div className="bg-[#0b101d] border border-slate-800 rounded-xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-sm sm:text-base font-mono font-bold text-cyan-400 uppercase tracking-wider">
              <Network className="w-5 h-5 text-cyan-400" />
              DYNAMIC AD-HOC MESH GRAPH &amp; SPECTRAL CONNECTIVITY
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Decentralized Peer-to-Peer Consensus &amp; Fiedler Laplacian
            </h2>
            <p className="text-base sm:text-lg text-slate-300 font-medium mt-1 leading-relaxed">
              Graph Laplacian L = D - A tracks real-time algebraic connectivity (λ₂). Byzantine nodes are isolated
              via fault-tolerant trimmed-mean averaging.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#11192e] border border-cyan-500/40 px-5 py-3 rounded-xl text-right">
              <div className="text-xs sm:text-sm font-mono uppercase text-slate-400 font-bold">Algebraic Connectivity λ₂</div>
              <div className="text-2xl sm:text-3xl font-mono font-black text-cyan-300">
                {telemetry.algebraicConnectivity.toFixed(3)}{' '}
                <span className="text-sm font-normal text-slate-400">
                  {telemetry.algebraicConnectivity > 0 ? '(CONNECTED)' : '(PARTITIONED)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Spectral & Consensus Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          <div className="bg-[#0e1628] border border-slate-800 p-4 rounded-xl">
            <div className="text-sm sm:text-base font-mono text-slate-400 uppercase font-bold">Broadcast Complexity</div>
            <div className="text-xl sm:text-2xl font-mono font-black text-emerald-400 mt-1">O(log N) Gossip</div>
            <div className="text-xs sm:text-sm text-slate-400 mt-0.5">Scale-free edge dissemination</div>
          </div>
          <div className="bg-[#0e1628] border border-slate-800 p-4 rounded-xl">
            <div className="text-sm sm:text-base font-mono text-slate-400 uppercase font-bold">Byzantine Faults</div>
            <div className="text-xl sm:text-2xl font-mono font-black text-rose-400 mt-1">
              {telemetry.byzantineActiveCount} / {sim.nodes.length} Nodes
            </div>
            <div className="text-xs sm:text-sm text-slate-400 mt-0.5">Trimmed outlier filter active</div>
          </div>
          <div className="bg-[#0e1628] border border-slate-800 p-4 rounded-xl">
            <div className="text-sm sm:text-base font-mono text-slate-400 uppercase font-bold">Comm Radius</div>
            <div className="text-xl sm:text-2xl font-mono font-black text-cyan-300 mt-1">
              {sim.config.commRadius}m RF
            </div>
            <div className="text-xs sm:text-sm text-slate-400 mt-0.5">Sub-GHz / 5.8 GHz link threshold</div>
          </div>
          <div className="bg-[#0e1628] border border-slate-800 p-4 rounded-xl">
            <div className="text-sm sm:text-base font-mono text-slate-400 uppercase font-bold">Graph Diameter</div>
            <div className="text-xl sm:text-2xl font-mono font-black text-amber-300 mt-1">~3 Hops</div>
            <div className="text-xs sm:text-sm text-slate-400 mt-0.5">Max shortest path between peers</div>
          </div>
        </div>
      </div>

      {/* Main Viewport & Interactive Matrix */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-[#080c14] border-2 border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3 text-sm sm:text-base font-mono">
            <span className="text-slate-300 font-bold uppercase">CIRCULAR TOPOLOGY MESH PROJECTION</span>
            <span className="text-cyan-400 font-bold">Click node in table or canvas to isolate</span>
          </div>
          <canvas
            ref={canvasRef}
            width={720}
            height={520}
            className="w-full h-auto block rounded-lg"
          />
        </div>

        {/* Node Peer Table & Byzantine Injection */}
        <div className="bg-[#0b101d] border border-slate-800 rounded-xl p-5 flex flex-col shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h3 className="text-lg sm:text-xl font-mono font-black text-white uppercase flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              Node Matrix &amp; Fault Injector
            </h3>
            <span className="text-sm font-mono text-slate-400 font-bold">
              {sim.nodes.length} Nodes
            </span>
          </div>

          <div className="overflow-y-auto max-h-[460px] space-y-2.5 pr-1.5">
            {sim.nodes.map((n) => (
              <div
                key={n.id}
                onClick={() => setSelectedNode(n.id)}
                className={`p-3 rounded-xl border text-sm font-mono transition-all cursor-pointer ${
                  selectedNode === n.id
                    ? 'bg-[#142340] border-cyan-500 text-white'
                    : 'bg-[#0e1628] border-slate-800/80 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        n.isByzantine ? 'bg-rose-500' : 'bg-emerald-400'
                      }`}
                    ></span>
                    <span className="font-bold text-white text-base">NODE #{n.id.toString().padStart(2, '0')}</span>
                  </div>
                  <span className="text-slate-400 font-mono">
                    Links: <strong className="text-cyan-300 font-bold">{n.neighbors.length}</strong>
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/60">
                  <div className="text-xs sm:text-sm text-slate-400">
                    Consensus: <span className="text-amber-300 font-bold">{n.consensusVal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleByzantine(n.id);
                    }}
                    className={`px-2.5 py-1 rounded text-xs sm:text-sm font-bold uppercase transition-colors ${
                      n.isByzantine
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-rose-300'
                    }`}
                  >
                    {n.isByzantine ? 'FAULT ACTIVE' : '+ INJECT FAULT'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
