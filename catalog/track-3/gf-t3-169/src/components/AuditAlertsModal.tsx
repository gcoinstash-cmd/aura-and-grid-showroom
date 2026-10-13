import React, { useState } from 'react';
import { X, ShieldAlert, Bell, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { AuditLogEntry, SystemAlert, PowertrainState } from '../types';

interface AuditAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLogEntry[];
  alerts: SystemAlert[];
  state: PowertrainState;
  onDispatchAlert: (channel: 'SLACK' | 'PAGERDUTY') => void;
}

export const AuditAlertsModal: React.FC<AuditAlertsModalProps> = ({
  isOpen,
  onClose,
  auditLogs,
  alerts,
  state,
  onDispatchAlert,
}) => {
  const [activeTab, setActiveTab] = useState<'AUDIT' | 'ALERTS' | 'HEALTH'>('AUDIT');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportCsv = () => {
    const headers = ['ID', 'Timestamp', 'Sequence', 'EventType', 'Actor', 'Details', 'SHA256', 'Status'];
    const rows = auditLogs.map((l) => [
      l.id,
      l.timestamp,
      l.sequenceNumber,
      l.eventType,
      l.actorName,
      `"${l.details.replace(/"/g, '""')}"`,
      l.sha256Hash,
      l.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GF_T3_169_AUDIT_LOGS_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportNotice('Exported CSV audit log successfully.');
    setTimeout(() => setExportNotice(null), 3000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `GF_T3_169_AUDIT_LOGS_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportNotice('Exported JSON audit log successfully.');
    setTimeout(() => setExportNotice(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="flex items-start justify-between pb-4 mb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-slate-400 font-semibold text-sm">Regulatory Compliance & Health</span>
              <span className="px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 text-sm font-semibold">
                SHA-256 Chained Ledger
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-100">
              Audit Logging, System Health & Notification Hub
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            {[
              { id: 'AUDIT', label: 'Immutable Audit Log' },
              { id: 'HEALTH', label: 'Real-Time Health & Thresholds' },
              { id: 'ALERTS', label: 'Slack & PagerDuty Alerts' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'AUDIT' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold border border-slate-700 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handleExportJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold border border-slate-700 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Export JSON</span>
              </button>
            </div>
          )}
        </div>

        {exportNotice && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{exportNotice}</span>
          </div>
        )}

        {/* Tab 1: Audit Log Table */}
        {activeTab === 'AUDIT' && (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="p-3">SEQUENCE #</th>
                  <th className="p-3">EVENT TYPE</th>
                  <th className="p-3">ACTOR & ROLE</th>
                  <th className="p-3">DETAILS</th>
                  <th className="p-3">SHA-256 PROOF</th>
                  <th className="p-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/60 transition-colors">
                    <td className="p-3 text-cyan-400 font-bold whitespace-nowrap">
                      #{log.sequenceNumber}
                    </td>
                    <td className="p-3 text-slate-200 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-semibold text-sm">
                        {log.eventType}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 whitespace-nowrap">
                      <div className="font-sans font-semibold text-sm">{log.actorName}</div>
                      <div className="text-slate-500 text-sm">{log.actorRole}</div>
                    </td>
                    <td className="p-3 text-slate-300 font-sans text-sm max-w-xs">{log.details}</td>
                    <td className="p-3 text-amber-400 text-sm whitespace-nowrap truncate max-w-[120px]">
                      0x{log.sha256Hash.slice(0, 16)}...
                    </td>
                    <td className="p-3 text-sm whitespace-nowrap">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Real-Time System Health & Thresholds */}
        {activeTab === 'HEALTH' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-sm">Tire Pressure (TPMS FL/FR)</span>
                <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                  {state.tirePressurePsi.fl} / {state.tirePressurePsi.fr} PSI
                </div>
                <div className="text-emerald-400 text-sm mt-1">Target: 34.0 PSI (Nominal)</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-sm">Tire Pressure (TPMS RL/RR)</span>
                <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                  {state.tirePressurePsi.rl} / {state.tirePressurePsi.rr} PSI
                </div>
                <div className="text-emerald-400 text-sm mt-1">Target: 34.0 PSI (Nominal)</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-sm">Hydraulic Brake Pressure</span>
                <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
                  120.4 Bar Line
                </div>
                <div className="text-slate-400 text-sm mt-1">Electro-Hydraulic Boost Active</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-sm">Inverter Bus Voltage</span>
                <div className="text-xl font-bold font-mono text-purple-400 mt-1">
                  650 V Boosted
                </div>
                <div className="text-slate-400 text-sm mt-1">Boost Converter Active</div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800">
              <h4 className="text-lg font-bold text-slate-100 mb-3">
                Thermal Envelope Thresholds & Barrier Certificates
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="font-semibold text-slate-300">Traction Battery Pack</span>
                  <span className="font-mono text-slate-200">Current: {state.batteryTempC.toFixed(1)}°C | Warning: &gt; 42.0°C | Critical Barrier: 45.0°C</span>
                  <span className={`px-2 py-0.5 rounded text-sm font-bold ${state.batteryTempC > 42 ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'}`}>
                    {state.batteryTempC > 42 ? 'WARNING' : 'NOMINAL'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="font-semibold text-slate-300">Front 5NM / Rear 4NM Inverters</span>
                  <span className="font-mono text-slate-200">Current: {state.inverterTempC}°C | Warning: &gt; 70.0°C | Critical: 85.0°C</span>
                  <span className="px-2 py-0.5 rounded text-sm font-bold bg-emerald-950 text-emerald-300">NOMINAL</span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="font-semibold text-slate-300">A25A-FXS Engine Coolant</span>
                  <span className="font-mono text-slate-200">Current: {state.iceCoolantTempC}°C | Target: 85–90°C</span>
                  <span className="px-2 py-0.5 rounded text-sm font-bold bg-emerald-950 text-emerald-300">OPTIMAL</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Alerts Dispatcher */}
        {activeTab === 'ALERTS' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="font-bold text-slate-100 text-sm">Simulate Incident Webhook Dispatch</div>
                <div className="text-slate-400 text-sm">Send live test payload to integrated team communication channels</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onDispatchAlert('SLACK')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Slack Alert (#telemetry)</span>
                </button>
                <button
                  onClick={() => onDispatchAlert('PAGERDUTY')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold text-sm transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Trigger PagerDuty Incident</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-lg font-bold text-slate-100">Live Incident & Anomaly Feed</h4>
              {alerts.map((alt) => (
                <div
                  key={alt.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-sm font-bold font-mono ${
                          alt.severity === 'CRITICAL'
                            ? 'bg-rose-950 border border-rose-700 text-rose-300'
                            : alt.severity === 'WARNING'
                            ? 'bg-amber-950 border border-amber-700 text-amber-300'
                            : 'bg-blue-950 border border-blue-700 text-blue-300'
                        }`}
                      >
                        {alt.channel} · {alt.severity}
                      </span>
                      <span className="text-slate-500 text-sm">{alt.timestamp}</span>
                    </div>
                    <div className="text-slate-100 font-semibold text-sm">{alt.message}</div>
                    <div className="text-slate-400 text-sm font-mono">
                      Metric: {alt.metric} ({alt.value}) | Threshold: {alt.threshold}
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-sm font-semibold">
                    {alt.acknowledged ? 'Acknowledged' : 'Active Broadcast'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
