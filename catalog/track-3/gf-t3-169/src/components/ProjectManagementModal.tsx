import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle2, GitPullRequest, Bookmark, ExternalLink, Activity } from 'lucide-react';
import { JiraGithubTask } from '../types';

interface ProjectManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: JiraGithubTask[];
  onSyncWebhook: (system: 'JIRA' | 'GITHUB') => void;
  isSyncing: boolean;
}

export const ProjectManagementModal: React.FC<ProjectManagementModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onSyncWebhook,
  isSyncing,
}) => {
  const [filterSystem, setFilterSystem] = useState<'ALL' | 'JIRA' | 'GITHUB'>('ALL');

  if (!isOpen) return null;

  const filteredTasks = tasks.filter((t) => {
    if (filterSystem === 'ALL') return true;
    return t.system === filterSystem;
  });

  const totalCompletion = Math.round(
    tasks.reduce((acc, t) => acc + t.completionPercent, 0) / tasks.length
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="flex items-start justify-between pb-4 mb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-slate-400 font-semibold text-sm">Automated Milestone Sync</span>
              <span className="px-2.5 py-0.5 rounded bg-blue-950 border border-blue-700 text-blue-300 text-sm font-semibold">
                Jira & GitHub Enterprise
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-100">
              Sprint 42: Acquire.com Escrow & Powertrain Readiness
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Analytics Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-sm block">Overall Milestone Completion</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">{totalCompletion}%</span>
            <div className="w-full bg-slate-800 rounded-full h-2 mt-2">
              <div
                className="bg-emerald-500 h-2 rounded-full"
                style={{ width: `${totalCompletion}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-sm block">Sprint Velocity</span>
            <span className="text-2xl font-bold font-mono text-cyan-400">48 Story Points</span>
            <span className="text-slate-500 text-sm block mt-1">100% On Schedule</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-sm block">Cross-Functional Stakeholders</span>
            <span className="text-2xl font-bold font-mono text-purple-400">4 Active Roles</span>
            <span className="text-slate-500 text-sm block mt-1">RBAC Sync Active</span>
          </div>
        </div>

        {/* Actions & Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            {(['ALL', 'JIRA', 'GITHUB'] as const).map((sys) => (
              <button
                key={sys}
                onClick={() => setFilterSystem(sys)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  filterSystem === sys
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {sys === 'ALL' ? 'All Tasks' : sys}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSyncWebhook('JIRA')}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync Jira Webhook</span>
            </button>
            <button
              onClick={() => onSyncWebhook('GITHUB')}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync GitHub Issues</span>
            </button>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-sm font-bold font-mono ${
                      task.system === 'JIRA'
                        ? 'bg-blue-950 border border-blue-700 text-blue-300'
                        : 'bg-purple-950 border border-purple-700 text-purple-300'
                    }`}
                  >
                    {task.key}
                  </span>
                  <span className="text-slate-400 text-sm">·</span>
                  <span className="text-slate-300 text-sm font-semibold">{task.assignee}</span>
                </div>
                <div className="text-slate-100 font-semibold text-sm">{task.title}</div>
                <div className="text-slate-400 text-sm">{task.milestone}</div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right">
                  <div className="text-emerald-400 font-bold font-mono text-sm">
                    {task.completionPercent}% Done
                  </div>
                  <div className="text-slate-500 text-sm">{task.lastSync}</div>
                </div>
                <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-sm font-bold">
                  {task.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
