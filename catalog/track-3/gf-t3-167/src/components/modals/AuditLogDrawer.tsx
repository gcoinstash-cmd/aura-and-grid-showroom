import React, { useState } from 'react';
import { 
  X, 
  History, 
  Download, 
  ShieldCheck, 
  Filter, 
  Copy, 
  Check, 
  Lock 
} from 'lucide-react';
import { AuditLogEntry } from '../../types/engine';

interface AuditLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLogEntry[];
}

export const AuditLogDrawer: React.FC<AuditLogDrawerProps> = ({
  isOpen,
  onClose,
  logs,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredLogs = filterCategory === 'ALL'
    ? logs
    : logs.filter(l => l.category === filterCategory);

  const handleExportCsv = () => {
    const headers = ['ID,Timestamp,Category,Actor,Action,Details,Hash,Status'];
    const rows = logs.map(l => 
      `"${l.id}","${l.timestamp}","${l.category}","${l.actor}","${l.action}","${l.details.replace(/"/g, '""')}","${l.hash}","${l.status}"`
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_logs_GF_T3_167_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col font-mono">
          {/* Header */}
          <div className="bg-zinc-950 p-6 sm:p-7 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <History className="w-7 h-7 text-amber-400" />
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                  Immutable Audit Log Vault
                </h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Non-Repudiation Activity & Cryptographic Signatures
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCsv}
                title="Export Audit Trail to CSV"
                className="p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                aria-label="Close Audit Log Drawer"
                className="text-zinc-400 hover:text-white p-2.5 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 bg-zinc-950/70 border-b border-zinc-800 flex items-center gap-3 overflow-x-auto text-base">
            <Filter className="w-5 h-5 text-zinc-400 shrink-0" />
            {['ALL', 'SECURITY', 'ORDER_FLOW', 'HMAC_AUDIT', 'APA_ESCROW'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl transition-colors whitespace-nowrap text-sm sm:text-base ${
                  filterCategory === cat
                    ? 'bg-amber-500 text-black font-black'
                    : 'bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Log Stream */}
          <div className="p-6 overflow-y-auto space-y-4.5 flex-1">
            {filteredLogs.map((entry) => (
              <div
                key={entry.id}
                className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-2.5"
              >
                <div className="flex items-center justify-between text-sm sm:text-base">
                  <span className="font-bold text-amber-300 bg-amber-500/15 px-3 py-1 rounded-lg border border-amber-500/30">
                    {entry.category}
                  </span>
                  <span className="text-zinc-400 text-xs sm:text-sm font-mono">
                    {entry.timestamp.replace('T', ' ').substring(0, 19)}
                  </span>
                </div>

                <div className="text-base sm:text-lg font-bold text-white">
                  {entry.action}
                </div>

                <div className="text-base text-zinc-300 leading-relaxed font-sans">
                  {entry.details}
                </div>

                <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-sm sm:text-base text-zinc-400">
                  <span className="truncate max-w-[240px]">Actor: {entry.actor}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(entry.hash);
                      setCopiedHash(entry.id);
                      setTimeout(() => setCopiedHash(null), 2000);
                    }}
                    className="flex items-center gap-1.5 text-zinc-300 hover:text-white font-mono"
                  >
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>{copiedHash === entry.id ? 'Copied' : entry.hash.substring(0, 10)}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 bg-zinc-950 border-t border-zinc-800 text-sm text-zinc-400 flex justify-between items-center">
            <span>{logs.length} Immutable Ledger Entries</span>
            <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4" /> FIPS 140-3 Compliant
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
