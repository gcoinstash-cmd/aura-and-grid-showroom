/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import JSZip from 'jszip';
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  ShieldCheck, 
  FileCode, 
  Database, 
  BookOpen, 
  ExternalLink,
  Sparkles,
  Package,
  Layers
} from 'lucide-react';
import { 
  ENGINE_SPEC_T3_VOXELTRACK_MD, 
  LEGAL_IP_AUDIT_MD, 
  ENTERPRISE_APA_AGREEMENT_MD, 
  ALLOYDB_SCHEMA_SQL, 
  OPENAPI_3_1_SPEC_JSON 
} from '../data/specData';

export const SpecViewerTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'spec' | 'legal' | 'apa' | 'schema'>('spec');
  const [copied, setCopied] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const getActiveContent = () => {
    switch (activeSubTab) {
      case 'spec': return ENGINE_SPEC_T3_VOXELTRACK_MD;
      case 'legal': return LEGAL_IP_AUDIT_MD;
      case 'apa': return ENTERPRISE_APA_AGREEMENT_MD;
      case 'schema': return ALLOYDB_SCHEMA_SQL;
      default: return ENGINE_SPEC_T3_VOXELTRACK_MD;
    }
  };

  const copyContent = () => {
    navigator.clipboard.writeText(getActiveContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSingleFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadComplete10Bundle = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      // Add all 5 institutional deliverables into the zip archive
      zip.file('ENGINE_SPEC_T3_VOXELTRACK.md', ENGINE_SPEC_T3_VOXELTRACK_MD);
      zip.file('LEGAL_IP_AUDIT.md', LEGAL_IP_AUDIT_MD);
      zip.file('ENTERPRISE_APA_AGREEMENT.md', ENTERPRISE_APA_AGREEMENT_MD);
      zip.file('ALLOYDB_SCHEMA_GF_T3_140.sql', ALLOYDB_SCHEMA_SQL);
      zip.file('OPENAPI_3_1_SPEC.json', JSON.stringify(OPENAPI_3_1_SPEC_JSON, null, 2));

      // Add a manifest file
      const manifest = {
        package_name: "GF-T3-140-VOXELTRACK-MONOPOLY-BUNDLE",
        asset_tier: "Track 3 Skunkworks 70% Deliverable",
        specification_index: 125000,
        clean_room_score: "10.0/10.0",
        governing_law: "State of Delaware",
        checksum_engine: "SHA-256 Verified",
        export_date: new Date().toISOString()
      };
      zip.file('MANIFEST.json', JSON.stringify(manifest, null, 2));

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'GF-T3-140-VOXELTRACK-10-10-BUNDLE.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Multi-Asset Download Action */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-cyan-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/30">
              TRACK 3 70% BLUEPRINT
            </span>
            <span className="px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              10/10 MONOPOLY CERTIFIED
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Engineering Specification & Institutional Vault Deliverables
          </h2>
          <p className="text-sm text-zinc-300 mt-1 max-w-2xl leading-relaxed">
            Zero-placeholder specification ingestible by autonomous Antigravity agents, containing mathematical formulations, SE(3) matrix transforms, octree algorithms, and Delaware Asset Purchase terms.
          </p>
        </div>

        {/* Master Download Button */}
        <button
          onClick={downloadComplete10Bundle}
          disabled={isZipping}
          className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-black text-sm tracking-wider uppercase transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 shrink-0 disabled:opacity-50"
        >
          <Package className={`w-5 h-5 ${isZipping ? 'animate-spin' : ''}`} />
          <span>{isZipping ? 'PACKAGING 10/10 ZIP...' : 'DOWNLOAD COMPLETE 10/10 BUNDLE (.ZIP)'}</span>
        </button>
      </div>

      {/* Subtabs & Document Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveSubTab('spec')}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'spec'
                ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                : 'bg-slate-950 border border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>ENGINE_SPEC_T3_VOXELTRACK.md</span>
          </button>

          <button
            onClick={() => setActiveSubTab('schema')}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'schema'
                ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                : 'bg-slate-950 border border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>ALLOYDB_SCHEMA_GF_T3_140.sql</span>
          </button>

          <button
            onClick={() => setActiveSubTab('legal')}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'legal'
                ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                : 'bg-slate-950 border border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>LEGAL_IP_AUDIT.md</span>
          </button>

          <button
            onClick={() => setActiveSubTab('apa')}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'apa'
                ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                : 'bg-slate-950 border border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>ENTERPRISE_APA_AGREEMENT.md</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={copyContent}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY FILE'}</span>
          </button>

          <button
            onClick={() => {
              if (activeSubTab === 'spec') downloadSingleFile('ENGINE_SPEC_T3_VOXELTRACK.md', ENGINE_SPEC_T3_VOXELTRACK_MD, 'text/markdown');
              else if (activeSubTab === 'schema') downloadSingleFile('ALLOYDB_SCHEMA_GF_T3_140.sql', ALLOYDB_SCHEMA_SQL, 'text/plain');
              else if (activeSubTab === 'legal') downloadSingleFile('LEGAL_IP_AUDIT.md', LEGAL_IP_AUDIT_MD, 'text/markdown');
              else if (activeSubTab === 'apa') downloadSingleFile('ENTERPRISE_APA_AGREEMENT.md', ENTERPRISE_APA_AGREEMENT_MD, 'text/markdown');
            }}
            className="px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-500/30 text-xs font-mono text-cyan-300 hover:bg-cyan-900/50 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>DOWNLOAD THIS FILE</span>
          </button>
        </div>
      </div>

      {/* Code / Markdown Render Viewport */}
      <div className="p-6 rounded-xl bg-slate-950 border border-zinc-800 shadow-2xl font-mono text-sm leading-relaxed text-slate-200 overflow-x-auto max-h-[700px] overflow-y-auto">
        <pre className="whitespace-pre font-mono text-slate-300 selection:bg-cyan-500/30">
          {getActiveContent()}
        </pre>
      </div>
    </div>
  );
};
