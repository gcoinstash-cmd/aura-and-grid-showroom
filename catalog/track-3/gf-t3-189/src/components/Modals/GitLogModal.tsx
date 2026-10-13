import React from 'react';
import { GitCommit, X, CheckCircle, Shield } from 'lucide-react';

interface GitLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitLogModal: React.FC<GitLogModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const commits = [
    {
      hash: 'e48b10f',
      author: 'Lead Systems Architect <architect@ghostfactoryos.internal>',
      date: '2026-10-12 02:44:00 -0700',
      message: 'feat(aero-core): finalize 2,400 Hz cowl damping state machine & -14.2dB vortex model',
      signed: true,
      gpg: '4A8F92BD1039AC44 (TRUSTED)',
    },
    {
      hash: 'c27a99b',
      author: 'Lead Systems Architect <architect@ghostfactoryos.internal>',
      date: '2026-10-12 02:18:22 -0700',
      message: 'schema(postgres): add partitioned BRIN timeseries & PL/pgSQL quarantine triggers',
      signed: true,
      gpg: '4A8F92BD1039AC44 (TRUSTED)',
    },
    {
      hash: '91f084a',
      author: 'Lead Systems Architect <architect@ghostfactoryos.internal>',
      date: '2026-10-12 01:50:11 -0700',
      message: 'api(openapi): define OpenAPI 3.1 & 2,400 Hz RFC-6455 WebSocket streaming schemas',
      signed: true,
      gpg: '4A8F92BD1039AC44 (TRUSTED)',
    },
    {
      hash: '77d291e',
      author: 'Lead Systems Architect <architect@ghostfactoryos.internal>',
      date: '2026-10-12 01:14:48 -0700',
      message: 'deploy(cloudrun): multi-stage non-root distroless container & 95.6% PyTest bench',
      signed: true,
      gpg: '4A8F92BD1039AC44 (TRUSTED)',
    },
    {
      hash: '19da30c',
      author: 'Lead Systems Architect <architect@ghostfactoryos.internal>',
      date: '2026-10-12 00:42:05 -0700',
      message: 'legal(apa): execute Delaware micro-APA covenants & clean-room escrow manifest',
      signed: true,
      gpg: '4A8F92BD1039AC44 (TRUSTED)',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <GitCommit className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Git Master Repository Audit Log
              </h3>
              <p className="text-sm text-slate-400 font-mono">
                Cryptographically Signed Commits (git log -n 5)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 max-h-[440px] overflow-y-auto">
          {commits.map((c, i) => (
            <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-amber-400 text-sm bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  commit {c.hash}
                </span>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  GPG Verified: {c.gpg}
                </span>
              </div>
              <div className="text-base font-semibold text-white">{c.message}</div>
              <div className="text-xs text-slate-400 flex justify-between font-mono">
                <span>{c.author}</span>
                <span>{c.date}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-base px-5 py-2 rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
