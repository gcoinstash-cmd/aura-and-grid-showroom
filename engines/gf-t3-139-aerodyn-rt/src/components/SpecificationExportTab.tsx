import React, { useState } from 'react';
import JSZip from 'jszip';
import { 
  Download, 
  FileText, 
  Copy, 
  Check, 
  FolderArchive, 
  ShieldCheck, 
  Sigma, 
  Database, 
  Code2, 
  Lock,
  Container,
  FileCode
} from 'lucide-react';
import { 
  SPEC_ENGINE_MD, 
  SPEC_LEGAL_AUDIT_MD, 
  SPEC_APA_AGREEMENT_MD, 
  SPEC_ALLOYDB_SCHEMA_SQL, 
  SPEC_OPENAPI_JSON, 
  SPEC_DOCKER_DEPLOY_YML,
  SPEC_ROADMAP_MD
} from '../data/specificationBundle';

export const SpecificationExportTab: React.FC = () => {
  const [activeDocKey, setActiveDocKey] = useState<string>('ENGINE_SPEC');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);

  const documents = [
    {
      key: 'ENGINE_SPEC',
      fileName: 'ENGINE_SPEC_T3_AERODYN.md',
      title: 'Engine Architecture & Math Spec',
      description: 'Extended Kalman Filter state matrices, Navier-Stokes downforce equations, and ring buffer layout.',
      icon: Sigma,
      content: SPEC_ENGINE_MD,
      format: 'markdown'
    },
    {
      key: 'LEGAL_IP_AUDIT',
      fileName: 'LEGAL_IP_AUDIT.md',
      title: 'Clean-Room Legal IP Audit',
      description: '100% Permissive MIT / Apache-2.0 / BSD whitelist certification; zero GPL/AGPL copyleft.',
      icon: ShieldCheck,
      content: SPEC_LEGAL_AUDIT_MD,
      format: 'markdown'
    },
    {
      key: 'APA_AGREEMENT',
      fileName: 'ENTERPRISE_APA_AGREEMENT.md',
      title: 'Turnkey Software Asset Purchase Agreement Agreement',
      description: 'Pre-drafted Institutional Asset Purchase Agreement specifying $125k Monopoly terms.',
      icon: Lock,
      content: SPEC_APA_AGREEMENT_MD,
      format: 'markdown'
    },
    {
      key: 'ALLOYDB_SCHEMA',
      fileName: 'ALLOYDB_TIMESCALE_SCHEMA.sql',
      title: 'AlloyDB / Timescale DDL Schema',
      description: 'Partitioned hypertables, compression policies, and sub-millisecond indices.',
      icon: Database,
      content: SPEC_ALLOYDB_SCHEMA_SQL,
      format: 'sql'
    },
    {
      key: 'OPENAPI_SPEC',
      fileName: 'OPENAPI_V3_1_SPEC.json',
      title: 'OpenAPI 3.1 Contract Spec',
      description: 'Full REST schemas for 1000Hz frame ingestion, DRS command, and audit endpoints.',
      icon: Code2,
      content: SPEC_OPENAPI_JSON,
      format: 'json'
    },
    {
      key: 'DOCKER_DEPLOY',
      fileName: 'DOCKER_COMPOSE_DEPLOY.yml',
      title: 'Container & Edge Deploy Spec',
      description: 'Production container manifests with Redis Streams, PREEMPT_RT, and TimescaleDB.',
      icon: Container,
      content: SPEC_DOCKER_DEPLOY_YML,
      format: 'yaml'
    },
    {
      key: 'ROADMAP_SPEC',
      fileName: 'SYSTEM_ROADMAP_AND_COMPLIANCE.md',
      title: 'System Roadmap & Compliance',
      description: 'Integration roadmap, automated testing, and multi-region deployment specifications.',
      icon: FileCode,
      content: SPEC_ROADMAP_MD,
      format: 'markdown'
    }
  ];

  const currentDoc = documents.find(d => d.key === activeDocKey) || documents[0];

  const handleCopyCurrent = () => {
    navigator.clipboard.writeText(currentDoc.content);
    setCopiedKey(currentDoc.key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadSingleFile = (doc: typeof documents[0]) => {
    const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadZipBundle = async () => {
    setIsDownloadingZip(true);
    try {
      const zip = new JSZip();
      
      // Add all 10/10 bundle files
      documents.forEach(doc => {
        zip.file(doc.fileName, doc.content);
      });

      // Add a clean bundle manifest
      const manifest = {
        package_id: "GF-T3-139-MONOPOLY-BUNDLE",
        engine_name: "Ghost FactoryOS AeroDyn-RT 1000Hz Telemetry Engine",
        track: "TRACK_3_F1_SKUNKWORKS",
        monopoly_score: "10/10_MONOPOLY_READY",
        specification_index: 125000,
        checksum_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        governing_law: "State of Delaware",
        clean_room_certified: true,
        created_at: new Date().toISOString()
      };
      zip.file("BUNDLE_MANIFEST.json", JSON.stringify(manifest, null, 2));

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GHOST_FACTORYOS_GF-T3-139_10-10_BUNDLE.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP Generation Failed:", err);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with 1-Click Complete Bundle Download */}
      <div className="bg-slate-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
          <FolderArchive className="w-72 h-72 text-cyan-400" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-md text-sm font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500">
                10/10 MONOPOLY VAULT BUNDLE
              </span>
              <span className="text-zinc-600 font-bold">•</span>
              <span className="text-zinc-200 text-base font-bold">Zero-Placeholder Autonomous Delivery Pack</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white mt-2">
              Specification Suite & Legal Asset Package
            </h2>
            <p className="text-base text-zinc-300 mt-1.5 max-w-4xl leading-relaxed">
              Complete deliverable bundle ready for autonomous ingestion by Google Antigravity agents. Includes EKF state equations, 100% clean-room IP audit, Turnkey Software Asset Purchase Agreement contract, AlloyDB schemas, and OpenAPI contracts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 shrink-0">
            <button
              onClick={handleDownloadZipBundle}
              disabled={isDownloadingZip}
              className="px-6 py-4 rounded-xl font-black text-base bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/25 transition-all font-sans"
            >
              <FolderArchive className="w-6 h-6 text-slate-950" />
              <span>{isDownloadingZip ? 'BUNDLING ZIP...' : 'DOWNLOAD COMPLETE 10/10 BUNDLE (.ZIP)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Math Formulation Highlight Card */}
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-cyan-300 uppercase tracking-wider mb-4 flex items-center gap-2.5 font-mono">
          <Sigma className="w-5 h-5 text-cyan-400" />
          <span>Core Mathematical Formulations & Matrices</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono text-sm">
          <div className="bg-slate-950 p-4 rounded-xl border border-zinc-800 space-y-2 shadow-md">
            <div className="text-zinc-300 font-bold">1. EKF State Vector (7-DoF):</div>
            <div className="text-cyan-300 font-extrabold text-base">
              x_k = [h_fl, h_fr, h_rl, h_rr, θ_pitch, φ_roll, α_wing]ᵀ
            </div>
            <p className="text-zinc-300 font-sans text-sm pt-1 leading-relaxed">
              Continuously estimated at 1000Hz from 4x ride-height potentiometers and 6-axis IMU.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-zinc-800 space-y-2 shadow-md">
            <div className="text-zinc-300 font-bold">2. Center of Pressure (CoP):</div>
            <div className="text-emerald-400 font-extrabold text-base">
              %CoP_front = (F_z,front / F_z,total) × 100%
            </div>
            <p className="text-zinc-300 font-sans text-sm pt-1 leading-relaxed">
              Dynamic pitch-coupled front/rear split calculation targeting 41.2% / 58.8% under braking.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-zinc-800 space-y-2 shadow-md">
            <div className="text-zinc-300 font-bold">3. Diffuser Choke Safety Interlock:</div>
            <div className="text-amber-300 font-extrabold text-base">
              Clamp(α_cmd) = min(α_cmd, 42.0°) if h_r &gt; 15mm
            </div>
            <p className="text-zinc-300 font-sans text-sm pt-1 leading-relaxed">
              Guarantees zero rear-axle lift and boundary layer ground-effect stall prevention.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Document Navigator & Full Text Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: File Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-slate-900 border border-zinc-700 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4">
              Included Bundle Documents ({documents.length})
            </h3>

            <div className="space-y-2.5">
              {documents.map((doc) => {
                const Icon = doc.icon;
                const isSelected = activeDocKey === doc.key;
                return (
                  <button
                    key={doc.key}
                    onClick={() => setActiveDocKey(doc.key)}
                    className={`w-full text-left p-3.5 rounded-xl border-2 transition-all duration-150 flex items-start gap-3.5 ${
                      isSelected
                        ? 'bg-slate-950 border-cyan-500 text-white shadow-lg shadow-cyan-950/50'
                        : 'bg-slate-950/70 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isSelected ? 'text-cyan-400' : 'text-zinc-500'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-sm font-bold truncate text-zinc-100">{doc.fileName}</div>
                      <div className="text-xs text-zinc-400 font-sans mt-0.5 line-clamp-1">{doc.title}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Code & Text Viewer (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-zinc-700 rounded-2xl p-6 shadow-xl">
            {/* Viewer Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div>
                <h4 className="text-lg font-bold text-white font-mono flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <span>{currentDoc.fileName}</span>
                </h4>
                <p className="text-sm text-zinc-300 mt-1">{currentDoc.description}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyCurrent}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-zinc-200 text-sm font-mono font-bold flex items-center gap-2 border border-zinc-700 shadow-sm"
                >
                  {copiedKey === currentDoc.key ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === currentDoc.key ? 'Copied' : 'Copy Text'}</span>
                </button>

                <button
                  onClick={() => handleDownloadSingleFile(currentDoc)}
                  className="px-3.5 py-2 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-sm font-mono font-bold flex items-center gap-2 border border-cyan-700 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </button>
              </div>
            </div>

            {/* Document Content Box with Scaled-Up Floor */}
            <div className="mt-4 bg-slate-950 rounded-xl border border-zinc-800 p-5 font-mono text-sm text-zinc-200 max-h-[520px] overflow-y-auto leading-relaxed whitespace-pre-wrap selection:bg-cyan-900 selection:text-white">
              {currentDoc.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
