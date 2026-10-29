import React, { useRef, useEffect, useState } from 'react';
import { HNSWNode, SearchResult, VectorIndexEngine } from '../engine/vectorEngine';
import { Network, Eye, Crosshair, ArrowRight, Activity, Play, Pause } from 'lucide-react';

interface HnswMeshTabProps {
  engine: VectorIndexEngine;
  searchResult: SearchResult | null;
  onSelectNode: (node: HNSWNode | null) => void;
  selectedNode: HNSWNode | null;
}

export const HnswMeshTab: React.FC<HnswMeshTabProps> = ({
  engine,
  searchResult,
  onSelectNode,
  selectedNode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<number | 'all'>('all');
  const [zoom, setZoom] = useState<number>(1.0);
  const [showSearchHops, setShowSearchHops] = useState<boolean>(true);

  // Step-by-step & Auto Play traversal simulation state
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isStepping, setIsStepping] = useState<boolean>(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  // Reset step index when search result changes
  useEffect(() => {
    setStepIndex(searchResult?.hops.length || 0);
    setIsStepping(false);
    setIsAutoPlaying(false);
  }, [searchResult]);

  // Auto-play interval effect
  useEffect(() => {
    if (!isAutoPlaying || !searchResult || searchResult.hops.length === 0) return;

    const timer = setInterval(() => {
      setStepIndex((prev) => {
        const maxHops = searchResult.hops.length;
        if (prev >= maxHops) {
          setIsAutoPlaying(false);
          return maxHops;
        }
        return prev + 1;
      });
    }, 150);

    return () => clearInterval(timer);
  }, [isAutoPlaying, searchResult]);

  const handleStepHop = () => {
    if (!searchResult || searchResult.hops.length === 0) return;
    setIsAutoPlaying(false);
    if (!isStepping) {
      setIsStepping(true);
      setStepIndex(1);
    } else {
      setStepIndex((prev) => {
        if (prev >= searchResult.hops.length) {
          return 1;
        }
        return prev + 1;
      });
    }
  };

  const handleToggleAutoPlay = () => {
    if (!searchResult || searchResult.hops.length === 0) return;
    if (!isAutoPlaying) {
      setIsStepping(true);
      if (stepIndex >= searchResult.hops.length) {
        setStepIndex(1);
      }
      setIsAutoPlaying(true);
    } else {
      setIsAutoPlaying(false);
    }
  };

  // Render multi-layer HNSW graph onto Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear background
    ctx.fillStyle = '#070A11';
    ctx.fillRect(0, 0, width, height);

    // Draw coordinate radar grid
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    for (let r = 80; r <= 320; r += 80) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r * zoom, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Grid crosshairs
    ctx.strokeStyle = '#141E33';
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    const nodesList = Array.from(engine.nodes.values());

    const getLayerColor = (layer: number, alpha: number = 0.7): string => {
      if (layer === 0) return 'rgba(148, 163, 184, ' + alpha + ')'; // Slate
      if (layer === 1) return 'rgba(245, 158, 11, ' + alpha + ')'; // Amber
      if (layer === 2) return 'rgba(139, 92, 246, ' + alpha + ')'; // Violet
      return 'rgba(6, 182, 212, ' + alpha + ')'; // Cyan expressway
    };

    // 1. Draw Edges
    nodesList.forEach((node) => {
      const [x1, y1] = [centerX + node.position2D[0] * zoom, centerY + node.position2D[1] * zoom];

      for (let l = 0; l <= node.level; l++) {
        if (selectedLayer !== 'all' && selectedLayer !== l) continue;

        const neighbors = node.neighbors[l] || [];
        ctx.strokeStyle = getLayerColor(l, l === 0 ? 0.2 : 0.45);
        ctx.lineWidth = l === 0 ? 1 : 1.75;

        for (const nId of neighbors) {
          const neighbor = engine.nodes.get(nId);
          if (neighbor && neighbor.id > node.id) {
            const [x2, y2] = [centerX + neighbor.position2D[0] * zoom, centerY + neighbor.position2D[1] * zoom];
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      }
    });

    // 2. Draw Active Search Traversal Hops (Bounded by stepIndex if stepping/autoplaying)
    if (showSearchHops && searchResult && searchResult.hops.length > 0) {
      ctx.lineWidth = 2.5;
      const effectiveHops = isStepping ? searchResult.hops.slice(0, stepIndex) : searchResult.hops;

      effectiveHops.forEach((hop) => {
        if (hop.fromNodeId === null) return;
        const fromNode = engine.nodes.get(hop.fromNodeId);
        const toNode = engine.nodes.get(hop.toNodeId);
        if (!fromNode || !toNode) return;

        const [fx, fy] = [centerX + fromNode.position2D[0] * zoom, centerY + fromNode.position2D[1] * zoom];
        const [tx, ty] = [centerX + toNode.position2D[0] * zoom, centerY + toNode.position2D[1] * zoom];

        ctx.strokeStyle = hop.isGreedyBetter ? '#06B6D4' : 'rgba(239, 68, 68, 0.5)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // 3. Draw Nodes
    nodesList.forEach((node) => {
      if (selectedLayer !== 'all' && node.level < selectedLayer) return;

      const [nx, ny] = [centerX + node.position2D[0] * zoom, centerY + node.position2D[1] * zoom];
      const isSelected = selectedNode?.id === node.id;
      const isEntryPoint = engine.entryPointId === node.id;
      const isTopHit = searchResult?.topK.some((k) => k.id === node.id);

      // Pulse active node if stepping or autoplaying
      let isStepActive = false;
      if (isStepping && searchResult && searchResult.hops.length > 0 && stepIndex > 0) {
        const currentHop = searchResult.hops[stepIndex - 1];
        if (currentHop && currentHop.toNodeId === node.id) {
          isStepActive = true;
        }
      }

      ctx.beginPath();
      const radius = isStepActive ? 10 : isSelected ? 8 : isEntryPoint ? 7 : isTopHit ? 6 : 4 + node.level * 1.5;
      ctx.arc(nx, ny, radius, 0, Math.PI * 2);

      if (isStepActive) {
        ctx.fillStyle = '#F59E0B';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.fill();
        ctx.stroke();
      } else if (isSelected) {
        ctx.fillStyle = '#06B6D4';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.fill();
        ctx.stroke();
      } else if (isEntryPoint) {
        ctx.fillStyle = '#F59E0B';
        ctx.strokeStyle = '#FDE68A';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
      } else if (isTopHit) {
        ctx.fillStyle = '#10B981';
        ctx.strokeStyle = '#A7F3D0';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = getLayerColor(node.level, 0.9);
        ctx.fill();
      }
    });

    // 4. Draw Query Virtual Center (if active)
    if (searchResult) {
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#06B6D4';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#06B6D4';
      ctx.font = '600 14px "JetBrains Mono"';
      ctx.fillText('QUERY VECTOR', centerX + 18, centerY + 5);
    }
  }, [engine, searchResult, selectedLayer, zoom, showSearchHops, selectedNode, stepIndex, isStepping]);

  // Click on canvas to select node
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left - rect.width / 2;
    const clickY = e.clientY - rect.top - rect.height / 2;

    let closestNode: HNSWNode | null = null;
    let minDist = 18;

    for (const node of engine.nodes.values()) {
      const nodeX = node.position2D[0] * zoom;
      const nodeY = node.position2D[1] * zoom;
      const dist = Math.hypot(clickX - nodeX, clickY - nodeY);
      if (dist < minDist) {
        minDist = dist;
        closestNode = node;
      }
    }
    onSelectNode(closestNode);
  };

  const displayedHopCount = isStepping ? stepIndex : (searchResult?.hops.length || 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      {/* Visual Canvas Area */}
      <div className="lg:col-span-2 flex flex-col rounded-lg border border-slate-800 bg-[#090D18] overflow-hidden">
        {/* Canvas Toolbar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-[#0B1120] px-4 py-3 gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Network className="h-4 w-4 text-cyan-400" />
              Hierarchical Skip-Graph Topology
            </span>
            <span className="text-sm text-slate-400">·</span>
            <span className="text-sm text-slate-400">
              {engine.nodes.size} Nodes · Entry Point: #{engine.entryPointId}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Step Hop Traversal Button */}
            <button
              onClick={handleStepHop}
              className="px-3 py-1 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="Step forward through HNSW greedy search hops"
            >
              <Play className="h-3 w-3 fill-white" />
              <span>[Step Hop] {isStepping ? '(' + stepIndex + '/' + (searchResult?.hops.length || 0) + ')' : ''}</span>
            </button>

            {/* Auto Play Toggle Button */}
            <button
              onClick={handleToggleAutoPlay}
              className={
                'px-3 py-1 text-xs font-bold rounded transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ' +
                (isAutoPlaying
                  ? 'bg-amber-600 border-amber-500 text-white'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800')
              }
              title="Automatically advance search hops at 150ms intervals"
            >
              {isAutoPlaying ? <Pause className="h-3 w-3 fill-white" /> : <Play className="h-3 w-3 fill-white" />}
              <span>{isAutoPlaying ? '[Pause]' : '[Auto Play]'}</span>
            </button>

            {/* Layer Filter */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md p-1">
              <button
                onClick={() => setSelectedLayer('all')}
                className={
                  'px-3 py-1 text-sm font-medium rounded transition-colors ' +
                  (selectedLayer === 'all' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200')
                }
              >
                All Layers
              </button>
              {[0, 1, 2, 3].map((l) => (
                <button
                  key={l}
                  onClick={() => setSelectedLayer(l)}
                  className={
                    'px-2.5 py-1 text-sm font-medium rounded transition-colors ' +
                    (selectedLayer === l ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200')
                  }
                >
                  L{l}
                </button>
              ))}
            </div>

            {/* Zoom Controls */}
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
              className="px-2.5 py-1 text-sm font-bold bg-slate-900 border border-slate-800 rounded text-slate-300 hover:text-white"
              title="Zoom out"
            >
              -
            </button>
            <span className="text-sm font-mono text-slate-400 px-1">{zoom.toFixed(1)}x</span>
            <button
              onClick={() => setZoom((z) => Math.min(2.2, z + 0.2))}
              className="px-2.5 py-1 text-sm font-bold bg-slate-900 border border-slate-800 rounded text-slate-300 hover:text-white"
              title="Zoom in"
            >
              +
            </button>

            {/* Toggle Traversal Hops */}
            <button
              onClick={() => setShowSearchHops(!showSearchHops)}
              className={
                'px-3 py-1 text-sm font-medium border rounded transition-colors ' +
                (showSearchHops
                  ? 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300'
                  : 'border-slate-800 bg-slate-900 text-slate-400')
              }
            >
              {showSearchHops ? 'Hops Visible' : 'Hops Hidden'}
            </button>
          </div>
        </div>

        {/* Canvas Display */}
        <div className="relative h-[560px] w-full bg-[#070A11] cursor-crosshair">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-full h-full block"
          />

          {/* Legend Overlay */}
          <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-3 text-sm flex flex-col gap-1.5 shadow-lg">
            <div className="font-semibold text-slate-200 mb-1">Graph Legend</div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span>
              <span>Entry Point Node (Max Layer)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
              <span>Top-K Nearest Neighbor Hits</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-[#06B6D4]"></span>
              <span>Selected Node / Query</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-[#8B5CF6]"></span>
              <span>Express Layer Highway (L1-L3)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Node Inspector & Traversal Statistics Column */}
      <div className="flex flex-col gap-6">
        {/* Node Inspector Card */}
        <div className="rounded-lg border border-slate-800 bg-[#090D18] p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-base">
              <Eye className="h-5 w-5 text-cyan-400" />
              <span>Node Inspector</span>
            </div>
            {selectedNode && (
              <span className="px-3 py-1 text-sm font-semibold rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                Node #{selectedNode.id}
              </span>
            )}
          </div>

          {selectedNode ? (
            <div className="flex flex-col gap-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
                  <span className="text-slate-400 block text-sm">Assigned Layer:</span>
                  <span className="text-lg font-bold text-amber-400 font-mono">
                    Layer {selectedNode.level}
                  </span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
                  <span className="text-slate-400 block text-sm">Base Layer Degree:</span>
                  <span className="text-lg font-bold text-slate-200 font-mono">
                    {selectedNode.neighbors[0]?.length || 0} / {engine.mMax0}
                  </span>
                </div>
              </div>

              {/* Quantized M-Byte Code */}
              <div>
                <span className="text-slate-400 block mb-1">
                  Product Quantization Code ({engine.partition.mSubvectors} Bytes):
                </span>
                <div className="p-2.5 bg-[#070A11] border border-slate-800 rounded font-mono text-sm text-cyan-300 break-all leading-relaxed">
                  [{Array.from(selectedNode.quantizedCode).join(', ')}]
                </div>
              </div>

              {/* Neighbor Connections per Layer */}
              <div>
                <span className="text-slate-400 block mb-1">Layer Adjacency Edges:</span>
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                  {selectedNode.neighbors.map((nList, lIdx) => (
                    <div key={lIdx} className="bg-slate-900/50 p-2 rounded text-sm flex items-start gap-2">
                      <span className="text-amber-400 font-mono font-bold shrink-0">L{lIdx}:</span>
                      <span className="text-slate-300 font-mono break-all">
                        {nList.length > 0 ? nList.join(', ') : 'None'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Synthetic Vector Coordinates Preview */}
              <div>
                <span className="text-slate-400 block mb-1">Vector Coordinates (First 8 / {selectedNode.vector.length}D):</span>
                <div className="p-2.5 bg-[#070A11] border border-slate-800 rounded font-mono text-sm text-slate-300">
                  {Array.from(selectedNode.vector.slice(0, 8))
                    .map((v) => v.toFixed(3))
                    .join(', ')}
                  ...
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">
              <Crosshair className="h-10 w-10 mx-auto text-slate-600 mb-2" />
              Click any node in the graph mesh to inspect vector signature, Voronoi centroid codes, and multi-layer skip connections.
            </div>
          )}
        </div>

        {/* Traversal Telemetry Card */}
        <div className="rounded-lg border border-slate-800 bg-[#090D18] p-5">
          <div className="flex items-center gap-2 text-slate-200 font-semibold text-base border-b border-slate-800 pb-3 mb-4">
            <Activity className="h-5 w-5 text-emerald-400" />
            <span>Search Traversal Telemetry</span>
          </div>

          {searchResult ? (
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Total Graph Hops:</span>
                <span className="text-cyan-400 font-mono font-bold">{displayedHopCount} / {searchResult.hops.length}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Evaluated Candidates:</span>
                <span className="text-slate-200 font-mono font-bold">{searchResult.evaluatedCandidates}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Search Width (ef):</span>
                <span className="text-slate-200 font-mono font-bold">{engine.efSearch}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Recall@10 Verification:</span>
                <span className="text-emerald-400 font-mono font-bold">{searchResult.recallAtK.toFixed(1)}%</span>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-sm text-center py-6">
              Execute a query via "Query Nearest Neighbors" to generate live traversal trajectory telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
