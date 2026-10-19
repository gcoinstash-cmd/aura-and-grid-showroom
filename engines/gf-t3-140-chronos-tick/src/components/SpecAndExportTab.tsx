import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  ShieldCheck, 
  Code2, 
  Database, 
  FileCheck2,
  FolderArchive,
  Search
} from 'lucide-react';
import JSZip from 'jszip';
import { 
  ENGINE_SPEC_MD, 
  LEGAL_IP_AUDIT_MD, 
  ALLOYDB_SCHEMA_SQL, 
  ENTERPRISE_APA_AGREEMENT_MD, 
  OPENAPI_SPEC_JSON 
} from '../data/monopolyDocs';

export const SpecAndExportTab: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<'spec' | 'legal' | 'sql' | 'apa' | 'openapi'>('spec');
  const [copied, setCopied] = useState<boolean>(false);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const docFiles = [
    {
      id: 'spec',
      name: 'ENGINE_SPEC_T3_CHRONOS.md',
      label: '1. Engine Specification',
      badge: 'Almgren-Chriss Math',
      content: ENGINE_SPEC_MD,
      type: 'markdown',
    },
    {
      id: 'legal',
      name: 'LEGAL_IP_AUDIT.md',
      label: '2. Legal IP Audit & Whitelist',
      badge: '100% Permissive Clean-Room',
      content: LEGAL_IP_AUDIT_MD,
      type: 'markdown',
    },
    {
      id: 'sql',
      name: 'ALLOYDB_SCHEMA.sql',
      label: '3. AlloyDB PostgreSQL DDL',
      badge: 'Partitioned Timeseries',
      content: ALLOYDB_SCHEMA_SQL,
      type: 'sql',
    },
    {
      id: 'apa',
      name: 'ENTERPRISE_APA_AGREEMENT.md',
      label: '4. Commercial APA Agreement',
      badge: 'Monopoly Vault Diligence',
      content: ENTERPRISE_APA_AGREEMENT_MD,
      type: 'markdown',
    },
    {
      id: 'openapi',
      name: 'OPENAPI_SPEC.json',
      label: '5. OpenAPI 3.1 Contract',
      badge: 'REST & FIX 4.4',
      content: OPENAPI_SPEC_JSON,
      type: 'json',
    },
  ];

  const currentDoc = docFiles.find((d) => d.id === activeDoc) || docFiles[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadSingle = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCompleteZip = async () => {
    try {
      setIsExportingZip(true);
      const zip = new JSZip();
      docFiles.forEach((f) => {
        zip.file(f.name, f.content);
      });
      zip.file(
        'MONOPOLY_VAULT_METADATA.json',
        JSON.stringify(
          {
            asset_code: 'GF-T3-141',
            title: 'Chronos-Tick Algorithmic Execution Core Workstation',
            tier: 'Track 3: F1 Skunkworks Service Engine',
            reference_core_spec: 125000,
            jurisdiction: 'Delaware, USA',
            clean_room_certified: true,
            copyleft_risk: 'ZERO_PERCENT',
            rpo: 0,
            target_latency_ms: 4.8,
            timestamp_utc: new Date().toISOString(),
          },
          null,
          2
        )
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'GF-T3-141_CHRONOS_TICK_10_10_MONOPOLY_VAULT.zip';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsExportingZip(false), 600);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner with One-Click Bundle Downloader */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <FileCheck2 className="w-6 h-6 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
              Institutional Vault Documents & 10/10 Asset Exporter
            </h2>
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
              5 ZERO-PLACEHOLDER ARTIFACTS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complete technical specification satisfying the 5 Monopoly Vault criteria: Topology, Almgren-Chriss Math, AlloyDB DDL, OpenAPI 3.1, and Turnkey Software Asset Purchase Agreement Agreement.
          </p>
        </div>

        {/* Big Export Button */}
        <button
          onClick={handleDownloadCompleteZip}
          disabled={isExportingZip}
          className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-950/60 glow-emerald-active transition-all active:scale-95 disabled:opacity-75 cursor-pointer self-start lg:self-auto shrink-0"
        >
          <FolderArchive className={`w-5 h-5 ${isExportingZip ? 'animate-spin' : ''}`} />
          <span>{isExportingZip ? 'BUNDLING ZIP...' : 'DOWNLOAD COMPLETE 10/10 BUNDLE (.ZIP)'}</span>
        </button>
      </div>

      {/* Document Viewer Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Document Tabs (4 cols) */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider px-1">
            Vault Artifacts ({docFiles.length})
          </div>

          {docFiles.map((doc) => {
            const isSelected = activeDoc === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => setActiveDoc(doc.id as any)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                    : 'bg-slate-950/70 border-slate-800 hover:bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono font-bold text-white truncate">
                    {doc.name}
                  </span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {doc.badge}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1.5 font-medium">
                  {doc.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Document Content & Controls (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-mono font-bold text-emerald-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>{currentDoc.name}</span>
              </h3>
              <span className="text-xs text-slate-400">{currentDoc.label}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(currentDoc.content)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 rounded-lg border border-slate-700 cursor-pointer transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'COPIED' : 'COPY FILE'}</span>
              </button>

              <button
                onClick={() => handleDownloadSingle(currentDoc.name, currentDoc.content)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>SAVE FILE</span>
              </button>
            </div>
          </div>

          {/* Markdown / Code Render Box */}
          <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 font-mono text-xs sm:text-sm text-slate-200 overflow-x-auto max-h-[560px] overflow-y-auto leading-relaxed">
            <pre className="whitespace-pre-wrap font-mono text-slate-300">
              {currentDoc.content}
            </pre>
          </div>
        </div>

      </div>

    </div>
  );
};
