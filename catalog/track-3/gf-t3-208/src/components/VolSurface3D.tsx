/**
 * APEX-208 3D Implied Volatility Surface Visualizer
 * High-performance Three.js WebGL surface mesh rendering sigma(K, T).
 * Absolute Zero-Dollar compliance verified.
 * Minimum 14px typography floor maintained across HUD badges and controls.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SABRParameters } from '../quant/types.ts';
import { sabrImpliedVol } from '../quant/math.ts';
import { Eye, RotateCw, Layers, ShieldCheck, AlertTriangle } from 'lucide-react';

interface VolSurface3DProps {
  spot: number;
  strikes: number[];
  maturities: number[];
  params: SABRParameters;
  isArbitrageFree: boolean;
}

export type RenderMode = 'terrain' | 'wireframe' | 'points';

export const VolSurface3D: React.FC<VolSurface3DProps> = ({
  spot,
  strikes,
  maturities,
  params,
  isArbitrageFree
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const surfaceMeshRef = useRef<THREE.Mesh | null>(null);
  const wireframeMeshRef = useRef<THREE.LineSegments | null>(null);
  const pointsMeshRef = useRef<THREE.Points | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Interaction state
  const [renderMode, setRenderMode] = useState<RenderMode>('terrain');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090D16);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(16, 12, 16);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // OrbitControls setup with auto-rotate
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2.0;
    controls.maxPolarAngle = Math.PI * 0.48; // keep above floor
    controls.minDistance = 6;
    controls.maxDistance = 45;
    controlsRef.current = controls;

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0x334155, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x06B6D4, 2.0);
    dirLight1.position.set(15, 25, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x8B5CF6, 1.8);
    dirLight2.position.set(-15, 20, -15);
    scene.add(dirLight2);

    // Coordinate Grid Foundation
    const gridHelper = new THREE.GridHelper(18, 18, 0x1E293B, 0x0F172A);
    gridHelper.position.y = -4;
    scene.add(gridHelper);

    // Animation Render Loop with explicit controls.update()
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Update controls.autoRotate whenever user toggles button
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 2.0;
    }
  }, [autoRotate]);

  // Update Surface Geometry whenever SABR parameters or strikes change
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (surfaceMeshRef.current) scene.remove(surfaceMeshRef.current);
    if (wireframeMeshRef.current) scene.remove(wireframeMeshRef.current);
    if (pointsMeshRef.current) scene.remove(pointsMeshRef.current);

    const xSegments = 24;
    const zSegments = 20;

    const minStrike = strikes[0];
    const maxStrike = strikes[strikes.length - 1];
    const minMat = maturities[0];
    const maxMat = maturities[maturities.length - 1];

    const geom = new THREE.PlaneGeometry(14, 12, xSegments, zSegments);
    geom.rotateX(-Math.PI / 2);

    const positions = geom.attributes.position;
    const colors: number[] = [];

    // Color gradient mapping: Neon cyan (0x06B6D4) -> Violet (0x8B5CF6) -> Amber (0xF59E0B)
    const colorLow = new THREE.Color(0x06B6D4);
    const colorMid = new THREE.Color(0x8B5CF6);
    const colorHigh = new THREE.Color(0xF59E0B);

    for (let i = 0; i < positions.count; i++) {
      const u = (positions.getX(i) + 7) / 14;
      const v = (positions.getZ(i) + 6) / 12;

      const strikeVal = minStrike + u * (maxStrike - minStrike);
      const matVal = minMat + v * (maxMat - minMat);

      const vol = sabrImpliedVol(spot, strikeVal, matVal, params);
      const yVal = (vol - 0.25) * 12.0;
      positions.setY(i, yVal);

      // Color interpolation
      const normVol = Math.max(0, Math.min(1, (vol - 0.15) / 0.40));
      const vertexColor = new THREE.Color();
      if (normVol < 0.5) {
        vertexColor.lerpColors(colorLow, colorMid, normVol * 2.0);
      } else {
        vertexColor.lerpColors(colorMid, colorHigh, (normVol - 0.5) * 2.0);
      }

      colors.push(vertexColor.r, vertexColor.g, vertexColor.b);
    }

    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.computeVertexNormals();

    if (renderMode === 'terrain') {
      // Solid Mesh with gradient vertex colors
      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        roughness: 0.25,
        metalness: 0.15,
        wireframe: false
      });

      const surfaceMesh = new THREE.Mesh(geom, material);
      scene.add(surfaceMesh);
      surfaceMeshRef.current = surfaceMesh;

      // Subtle contour wireframe overlay
      const wireframeGeom = new THREE.WireframeGeometry(geom);
      const wireframeMat = new THREE.LineBasicMaterial({
        color: 0x38BDF8,
        transparent: true,
        opacity: 0.30
      });
      const wireframeLines = new THREE.LineSegments(wireframeGeom, wireframeMat);
      scene.add(wireframeLines);
      wireframeMeshRef.current = wireframeLines;
    } else if (renderMode === 'wireframe') {
      // Pure Wireframe Mode
      const wireframeGeom = new THREE.WireframeGeometry(geom);
      const wireframeMat = new THREE.LineBasicMaterial({
        color: 0x06B6D4,
        transparent: true,
        opacity: 0.90
      });
      const wireframeLines = new THREE.LineSegments(wireframeGeom, wireframeMat);
      scene.add(wireframeLines);
      wireframeMeshRef.current = wireframeLines;
    } else if (renderMode === 'points') {
      // Point Cloud Mode
      const pointsMat = new THREE.PointsMaterial({
        size: 0.28,
        vertexColors: true,
        transparent: true,
        opacity: 0.95
      });
      const pointsMesh = new THREE.Points(geom, pointsMat);
      scene.add(pointsMesh);
      pointsMeshRef.current = pointsMesh;
    }
  }, [spot, strikes, maturities, params, renderMode]);

  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(16, 12, 16);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.reset();
    }
  };

  const cycleRenderMode = () => {
    if (renderMode === 'terrain') setRenderMode('wireframe');
    else if (renderMode === 'wireframe') setRenderMode('points');
    else setRenderMode('terrain');
  };

  const renderModeLabel =
    renderMode === 'terrain'
      ? 'Mode: Gradient Terrain'
      : renderMode === 'wireframe'
      ? 'Mode: Wireframe Grid'
      : 'Mode: Point Cloud';

  return (
    <div className="relative w-full h-[520px] bg-[#090D16] border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* Top Overlay Bar over 3D Canvas: Clean Flex Container with Left and Right Docking */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between w-full px-4 pt-3 pointer-events-none">
        {/* Far Left: Title & Arbitrage-Free Status Badge */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="px-3 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-md backdrop-blur-sm shadow-md">
            <span className="text-sm font-semibold tracking-wide text-cyan-400">
              3D VOLATILITY SURFACE
            </span>
            <span className="text-slate-300 text-sm ml-2 hidden sm:inline">
              sigma_SABR(K, T)
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-md backdrop-blur-sm shadow-md">
            {isArbitrageFree ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span
              className={
                'text-sm font-semibold ' +
                (isArbitrageFree ? 'text-slate-200' : 'text-amber-300')
              }
            >
              {isArbitrageFree ? 'Arbitrage-Free Verified' : 'Arbitrage Warning'}
            </span>
          </div>
        </div>

        {/* Far Right: Axis Legend with Semi-Transparent Background Pill */}
        <div className="bg-slate-900/90 border border-slate-700/80 px-3 py-1 rounded-md backdrop-blur-sm shadow-md flex items-center gap-3 pointer-events-auto">
          <div className="text-sm font-mono font-medium text-cyan-400">
            Strike [K]
          </div>
          <span className="text-slate-600 text-sm" aria-hidden="true">·</span>
          <div className="text-sm font-mono font-medium text-violet-400">
            Maturity [T]
          </div>
          <span className="text-slate-600 text-sm" aria-hidden="true">·</span>
          <div className="text-sm font-mono font-medium text-amber-400">
            Vol [%]
          </div>
        </div>
      </div>

      {/* Primary 3D WebGL Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
      />

      {/* Collapsible Unified Bottom Control Dock */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-auto max-w-[94vw]">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/95 border border-slate-700 rounded-lg shadow-xl backdrop-blur-md">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md border transition-colors cursor-pointer bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white"
            title="Toggle Continuous Orbit Rotation"
          >
            <RotateCw className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{autoRotate ? 'Rotate: ON' : 'Rotate: OFF'}</span>
          </button>

          <button
            onClick={cycleRenderMode}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md border transition-colors cursor-pointer bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white"
            title="Cycle between Gradient Terrain, Wireframe Grid, and Point Cloud"
          >
            <Layers className="w-4 h-4 text-violet-400 shrink-0" />
            <span>{renderModeLabel}</span>
          </button>

          <button
            onClick={resetCamera}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md border transition-colors cursor-pointer bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white"
            title="Reset Camera View to Default"
          >
            <Eye className="w-4 h-4 text-slate-300 shrink-0" />
            <span>Reset View</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400 pl-2 border-l border-slate-700">
            <span>Drag to Orbit</span>
            <span aria-hidden="true">·</span>
            <span>Scroll to Zoom</span>
          </div>
        </div>
      </div>
    </div>
  );
};
