/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Ghost FactoryOS Fleet Track 3 - Asset GF-T3-142 (Aegis-Orbit)
 */

import React, { useState } from 'react';
import {
  ENGINE_SPEC_T3_AEGIS_MD,
  ALLOYDB_SCHEMA_SQL,
  OPENAPI_SPEC_JSON,
  LEGAL_IP_AUDIT_MD,
  ENTERPRISE_APA_AGREEMENT_MD
} from '../data/monopolyVaultDocs';
import { FileText, Database, Code2, ShieldCheck, Scale, Copy, Check, Download, Search } from 'lucide-react';

export const VaultArtifactsViewer: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<'ENGINE_SPEC' | 'ALLOYDB_SCHEMA' | 'OPENAPI_SPEC' | 'LEGAL_IP' | 'ENTERPRISE_APA'>('ENGINE_SPEC');
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const docs = {
    ENGINE_SPEC: {
      title: 'ENGINE_SPEC_T3_AEGIS.md',
      type: 'Markdown Specification',
      icon: FileText,
      badge: 'Criterion 1 & 2: Architecture & Math',
      content: ENGINE_SPEC_T3_AEGIS_MD,
      filename: 'ENGINE_SPEC_T3_AEGIS.md'
    },
    ALLOYDB_SCHEMA: {
      title: 'ALLOYDB_SCHEMA.sql',
      type: 'PostgreSQL / AlloyDB DDL',
      icon: Database,
      badge: 'Criterion 3: Production Data Schema',
      content: ALLOYDB_SCHEMA_SQL,
      filename: 'ALLOYDB_SCHEMA.sql'
    },
    OPENAPI_SPEC: {
      title: 'OPENAPI_SPEC.json',
      type: 'OpenAPI 3.1.0 Protocol',
      icon: Code2,
      badge: 'Criterion 4: API 3.1 Contract',
      content: OPENAPI_SPEC_JSON,
      filename: 'OPENAPI_SPEC.json'
    },
    LEGAL_IP: {
      title: 'LEGAL_IP_AUDIT.md',
      type: 'Clean-Room IP Certification',
      icon: ShieldCheck,
      badge: 'Criterion 5: Zero Copyleft Audit',
      content: LEGAL_IP_AUDIT_MD,
      filename: 'LEGAL_IP_AUDIT.md'
    },
    ENTERPRISE_APA: {
      title: 'ENTERPRISE_APA_AGREEMENT.md',
      type: 'Turnkey Software Asset Purchase Agreement',
      icon: Scale,
      badge: 'Monopoly Vault Diligence',
      content: ENTERPRISE_APA_AGREEMENT_MD,
      filename: 'ENTERPRISE_APA_AGREEMENT.md'
    }
  };

  const currentDoc = docs[activeDoc];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    const blob = new Blob([currentDoc.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentDoc.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter content if search query active
  const displayContent = searchQuery.trim()
    ? currentDoc.content
        .split('\n')
        .filter((line) => line.toLowerCase().includes(searchQuery.toLowerCase()))
        .join('\n')
    : currentDoc.content;

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-2xl font-bold font-hud text-white tracking-wide">
              INSTITUTIONAL MONOPOLY VAULT ARTIFACTS (5 CRITERIA)
            </h2>
            <p className="text-sm text-slate-300 font-mono mt-0.5">
              Zero-Placeholder Deliverables &bull; Ingest-Ready for Google Antigravity Autonomous Scaffolding
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-sm font-mono font-extrabold">
            SPECIFICATION: $135,000 USD
          </span>
        </div>
      </div>

      {/* Document Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {(Object.keys(docs) as Array<keyof typeof docs>).map((key) => {
          const doc = docs[key];
          const Icon = doc.icon;
          const isSelected = activeDoc === key;

          return (
            <button
              key={key}
              onClick={() => {
                setActiveDoc(key);
                setSearchQuery('');
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-950 ring-2 ring-cyan-500/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Icon className={`w-5 h-5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className={`font-mono text-sm font-extrabold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                  {doc.title}
                </span>
              </div>
              <span className="text-xs font-mono text-cyan-300 font-semibold truncate block">
                {doc.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Document Viewer Container */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/90 shadow-2xl overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3 text-sm font-mono">
            <span className="text-white font-extrabold text-base">{currentDoc.title}</span>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-300 font-medium">{currentDoc.type}</span>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Filter lines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3.5 py-1.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-400 w-44 sm:w-56"
              />
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-mono font-semibold flex items-center gap-2 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Direct File Download */}
            <button
              onClick={handleDownloadSingle}
              className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-sm font-hud flex items-center gap-2 cursor-pointer shadow-md shadow-cyan-950"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Document Content Box */}
        <div className="p-5 overflow-x-auto max-h-[620px] overflow-y-auto">
          <pre className="text-sm font-mono text-slate-200 leading-relaxed whitespace-pre-wrap selection:bg-cyan-500/30 selection:text-cyan-200">
            {displayContent}
          </pre>
        </div>
      </div>
    </div>
  );
};

