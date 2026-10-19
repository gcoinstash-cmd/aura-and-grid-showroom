/**
 * Ghost FactoryOS Track 3 (F1 Skunkworks Engine)
 * Asset GF-T3-147: Sol-Rotor Autonomous Heavy-Lift eVTOL & Swarm Flight Telemetry Engine
 * 
 * Enterprise Documentation & Specification Explorer
 */

import React, { useState } from 'react';
import { ENGINE_SPEC_MD } from '../../data/engineSpec';
import { ALLOYDB_SCHEMA_SQL } from '../../data/alloyDbSchema';
import { OPENAPI_SPEC_JSON } from '../../data/openApiSpec';
import { LEGAL_IP_AUDIT_MD } from '../../data/legalAudit';
import { ENTERPRISE_APA_MD } from '../../data/enterpriseApa';
import { FileText, Database, ShieldCheck, FileCheck, Code, Copy, Check, Download } from 'lucide-react';

export const DocumentViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ENGINE_SPEC' | 'ALLOYDB' | 'OPENAPI' | 'LEGAL_AUDIT' | 'APA_CONTRACT'>('ENGINE_SPEC');
  const [copied, setCopied] = useState(false);

  const docs = {
    ENGINE_SPEC: {
      title: 'ENGINE_SPEC_T3_SOLROTOR.md',
      label: 'F1 Skunkworks Engine Spec',
      icon: FileText,
      badge: 'MONOPOLY VAULT',
      content: ENGINE_SPEC_MD,
      mime: 'text/markdown',
      filename: 'ENGINE_SPEC_T3_SOLROTOR.md',
    },
    ALLOYDB: {
      title: 'ALLOYDB_SCHEMA.sql',
      label: 'AlloyDB DDL & Telemetry Partitions',
      icon: Database,
      badge: 'POSTGRESQL 16+',
      content: ALLOYDB_SCHEMA_SQL,
      mime: 'text/plain',
      filename: 'ALLOYDB_SCHEMA.sql',
    },
    OPENAPI: {
      title: 'OPENAPI_SPEC.json',
      label: 'OpenAPI 3.1 Specification',
      icon: Code,
      badge: 'REST / gRPC HTTP-2',
      content: JSON.stringify(OPENAPI_SPEC_JSON, null, 2),
      mime: 'application/json',
      filename: 'OPENAPI_SPEC.json',
    },
    LEGAL_AUDIT: {
      title: 'LEGAL_IP_AUDIT.md',
      label: 'Clean-Room IP & License Audit',
      icon: ShieldCheck,
      badge: 'ZERO COPYLEFT',
      content: LEGAL_IP_AUDIT_MD,
      mime: 'text/markdown',
      filename: 'LEGAL_IP_AUDIT.md',
    },
    APA_CONTRACT: {
      title: 'ENTERPRISE_APA_AGREEMENT.md',
      label: 'Turnkey Software Asset Purchase Agreement',
      icon: FileCheck,
      badge: 'LEGAL DILIGENCE',
      content: ENTERPRISE_APA_MD,
      mime: 'text/markdown',
      filename: 'ENTERPRISE_APA_AGREEMENT.md',
    },
  };

  const currentDoc = docs[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentDoc.content], { type: currentDoc.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentDoc.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Tab Navigation Header */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        {Object.entries(docs).map(([key, doc]) => {
          const Icon = doc.icon;
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-lg font-avionics font-bold text-base transition-all ${
                isActive
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-400 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{doc.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded font-mono font-normal ${
                isActive ? 'bg-cyan-400/20 text-cyan-200' : 'bg-slate-800 text-slate-400'
              }`}>
                {doc.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Document Viewport Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Document Action Toolbar */}
        <div className="flex justify-between items-center bg-slate-950 px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-bold text-cyan-300">{currentDoc.title}</span>
            <span className="text-xs bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded">
              {currentDoc.content.length.toLocaleString()} BYTES
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-mono px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY CONTENT'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-sm font-mono px-3 py-1.5 rounded-lg transition-colors shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD FILE</span>
            </button>
          </div>
        </div>

        {/* Code / Markdown Renderer Box */}
        <div className="p-6 bg-slate-950 font-mono text-sm leading-relaxed overflow-x-auto max-h-[750px] overflow-y-auto">
          <pre className="text-slate-200 whitespace-pre-wrap selection:bg-cyan-500/30">
            {currentDoc.content}
          </pre>
        </div>
      </div>
    </div>
  );
};
