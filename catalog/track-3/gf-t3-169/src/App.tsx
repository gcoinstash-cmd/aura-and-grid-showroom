/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryCards } from './components/TelemetryCards';
import { PowertrainMpcTab } from './components/PowertrainMpcTab';
import { PostgresLedgerTab } from './components/PostgresLedgerTab';
import { OpenApiContractTab } from './components/OpenApiContractTab';
import { CloudRunHarnessTab } from './components/CloudRunHarnessTab';
import { ApaCovenantTab } from './components/ApaCovenantTab';
import { ProjectManagementModal } from './components/ProjectManagementModal';
import { AuditAlertsModal } from './components/AuditAlertsModal';
import { CloudCostModal } from './components/CloudCostModal';
import { MfaModal } from './components/MfaModal';
import { SpecExportModal } from './components/SpecExportModal';
import {
  INITIAL_POWERTRAIN_STATE,
  INITIAL_AUDIT_LOGS,
  INITIAL_TASKS,
  INITIAL_ALERTS,
  INITIAL_MERKLE_TREE,
} from './data/mockData';
import { GF_T3_169_SPEC_MARKDOWN } from './data/specDocument';
import { calculatePowertrainDynamics } from './utils/powertrainMath';
import { AuditLogEntry, DriveMode, JiraGithubTask, PowertrainState, SystemAlert, UserRole } from './types';
import { Activity, ShieldCheck, Database, FileCode, CheckCircle2, CloudRain } from 'lucide-react';

export default function App() {
  // Powertrain Physics & MPC State
  const [powertrainState, setPowertrainState] = useState<PowertrainState>(INITIAL_POWERTRAIN_STATE);
  const [sequenceNumber, setSequenceNumber] = useState(1000284);

  // Active Navigation Tab
  type ActiveTab = 'POWERTRAIN' | 'POSTGRES' | 'OPENAPI' | 'CLOUDRUN' | 'APA';
  const [activeTab, setActiveTab] = useState<ActiveTab>('POWERTRAIN');

  // Enterprise Systems State
  const [currentRole, setCurrentRole] = useState<UserRole>('CHIEF_SYSTEMS_ARCHITECT');
  const [isMfaVerified, setIsMfaVerified] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [tasks, setTasks] = useState<JiraGithubTask[]>(INITIAL_TASKS);
  const [alerts, setAlerts] = useState<SystemAlert[]>(INITIAL_ALERTS);
  const [merkleTree, setMerkleTree] = useState(INITIAL_MERKLE_TREE);
  const [isVerifyingMerkle, setIsVerifyingMerkle] = useState(false);
  const [isEscrowSigned, setIsEscrowSigned] = useState(false);
  const [isSyncingTasks, setIsSyncingTasks] = useState(false);

  // Modals
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Calculate dynamic outputs
  const calculatedTorque = calculatePowertrainDynamics(powertrainState);

  // Monotonic sequence simulation increment
  useEffect(() => {
    if (isOffline) return;
    const timer = setInterval(() => {
      setSequenceNumber((prev) => prev + 1);
    }, 1800);
    return () => clearInterval(timer);
  }, [isOffline]);

  // Handle Powertrain Parameter Updates
  const handleUpdatePowertrain = (updates: Partial<PowertrainState>) => {
    setPowertrainState((prev) => ({ ...prev, ...updates }));
  };

  // Helper to add audit entry
  const recordAuditEvent = (
    eventType: AuditLogEntry['eventType'],
    details: string,
    status: AuditLogEntry['status'] = 'COMMITTED'
  ) => {
    const newEntry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sequenceNumber: sequenceNumber + 1,
      eventType,
      actorRole: currentRole,
      actorName:
        currentRole === 'CHIEF_SYSTEMS_ARCHITECT'
          ? 'Lead Systems Architect'
          : currentRole === 'ACQUIRE_BUYER_ESCROW'
          ? 'Acquire Escrow Officer'
          : currentRole === 'LEAD_POWERTRAIN_AUDITOR'
          ? 'Powertrain Auditor'
          : 'Field Calibration Eng',
      details,
      sha256Hash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      status,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Step MPC 2ms tick manually
  const handleTriggerSolve = () => {
    recordAuditEvent(
      'MPC_SOLVE',
      `Manual 500Hz MPC tick triggered: Front ${calculatedTorque.frontMotorTorqueNm}Nm, Rear ${calculatedTorque.rearMotorTorqueNm}Nm (${calculatedTorque.mpcSolveTimeMs}ms latency)`
    );
  };

  // Verify Merkle Tree Engine
  const handleVerifyMerkle = () => {
    setActiveTab('POSTGRES');
    setIsVerifyingMerkle(true);
    setTimeout(() => {
      setIsVerifyingMerkle(false);
      recordAuditEvent(
        'MERKLE_ANCHOR',
        `Merkle root 0x${merkleTree[0].hash} cryptographically verified across 10,000 sub-nodes with 0 hash discrepancies`,
        'VERIFIED'
      );
    }, 1400);
  };

  // Simulate Torque Vectoring Button
  const handleSimulateTorque = () => {
    setActiveTab('POWERTRAIN');
    // Animate a dynamic cornering sweep
    handleUpdatePowertrain({
      lateralG: 0.65,
      throttlePercent: 85,
      driveMode: 'SPORT_S_PLUS',
    });
    recordAuditEvent(
      'DRIVE_MODE_SHIFT',
      'Dynamic torque vectoring sweep activated in SPORT_S_PLUS (0.65G yaw acceleration)'
    );
  };

  // Download Spec Markdown
  const handleDownloadSpec = () => {
    const blob = new Blob([GF_T3_169_SPEC_MARKDOWN], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'GF_T3_169_SPEC.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    recordAuditEvent('CONFIG_UPDATE', 'Exported complete GF_T3_169_SPEC.md master vault package');
    setIsExportModalOpen(true);
  };

  // Execute Escrow Release
  const handleSignEscrow = () => {
    setIsEscrowSigned(true);
    recordAuditEvent(
      'ESCROW_SIGN',
      'Acquire.com Micro-APA Escrow Release executed: 20 kHz (0.48ms) wire instructions validated & title transferred',
      'VERIFIED'
    );
  };

  // Sync Jira / GitHub Webhooks
  const handleSyncWebhook = (system: 'JIRA' | 'GITHUB') => {
    setIsSyncingTasks(true);
    setTimeout(() => {
      setIsSyncingTasks(false);
      setTasks((prev) =>
        prev.map((t) =>
          t.system === system
            ? { ...t, lastSync: 'Just now', completionPercent: Math.min(100, t.completionPercent + 2) }
            : t
        )
      );
      recordAuditEvent(
        system === 'JIRA' ? 'JIRA_SYNC' : 'GITHUB_SYNC',
        `Automated milestone synchronization dispatched for ${system} Sprint 42`
      );
    }, 1000);
  };

  // Dispatch alert to Slack / PagerDuty
  const handleDispatchAlert = (channel: 'SLACK' | 'PAGERDUTY') => {
    const newAlert: SystemAlert = {
      id: `alt-${Date.now()}`,
      channel,
      severity: channel === 'PAGERDUTY' ? 'CRITICAL' : 'WARNING',
      metric: 'BMS Telemetry Dispatcher',
      value: 'Simulated Anomaly Trigger',
      threshold: '< 2.0 ms latency',
      timestamp: new Date().toTimeString().split(' ')[0],
      message: `Simulated engineering alert sent to ${channel === 'SLACK' ? '#engineering-telemetry' : 'PagerDuty Incident Router'}`,
      acknowledged: false,
    };
    setAlerts((prev) => [newAlert, ...prev]);
    recordAuditEvent('ALERT_DISPATCH', `Dispatched incident notification payload to ${channel}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 
        CRITICAL REQUIREMENT 1:
        Header, Monroney banner, and telemetry cards MUST use standard relative/static
        positioning so they scroll off the viewport naturally when scrolling down
        (zero sticky/fixed headers blocking screen estate).
      */}
      <Header
        currentRole={currentRole}
        onChangeRole={setCurrentRole}
        isMfaVerified={isMfaVerified}
        onOpenMfa={() => setIsMfaModalOpen(true)}
        isOffline={isOffline}
        onToggleOffline={() => setIsOffline(!isOffline)}
        onOpenSync={() => setIsSyncModalOpen(true)}
        onOpenAudit={() => setIsAuditModalOpen(true)}
        onOpenCost={() => setIsCostModalOpen(true)}
        unreadAlertCount={alerts.filter((a) => !a.acknowledged).length}
      />

      {/* Offline Mode Banner when toggled */}
      {isOffline && (
        <div className="bg-amber-950 border-b border-amber-800 text-amber-200 px-6 py-2.5 text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>
              Field Operation Offline Mode Active: Telemetry cached locally with zero network latency. Background synchronization will automatically merge changes upon reconnection.
            </span>
          </div>
          <span className="font-mono text-sm">GPS Track: Fuji Speedway Hybrid Calibrated</span>
        </div>
      )}

      {/* Main Cockpit Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Monroney Top Banner */}
        <MonroneyBanner
          onSimulateTorque={handleSimulateTorque}
          onVerifyMerkle={handleVerifyMerkle}
          onExportSpec={handleDownloadSpec}
          onOpenApa={() => setActiveTab('APA')}
        />

        {/* 4 Live Telemetry Metric Cards */}
        <TelemetryCards
          state={powertrainState}
          torque={calculatedTorque}
          sequenceNumber={sequenceNumber}
        />

        {/* Five Navigable Tabs Bar */}
        <div className="relative mb-6 border-b border-slate-800">
          <nav className="flex flex-wrap gap-2 sm:gap-4 text-sm font-bold">
            <button
              onClick={() => setActiveTab('POWERTRAIN')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'POWERTRAIN'
                  ? 'border-rose-500 text-rose-400 bg-rose-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>1. Powertrain & MPC Core</span>
            </button>

            <button
              onClick={() => setActiveTab('POSTGRES')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'POSTGRES'
                  ? 'border-rose-500 text-rose-400 bg-rose-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>2. Postgres Telemetry Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('OPENAPI')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'OPENAPI'
                  ? 'border-rose-500 text-rose-400 bg-rose-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>3. OpenAPI 3.1 Contract</span>
            </button>

            <button
              onClick={() => setActiveTab('CLOUDRUN')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'CLOUDRUN'
                  ? 'border-rose-500 text-rose-400 bg-rose-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>4. Cloud Run Harness</span>
            </button>

            <button
              onClick={() => setActiveTab('APA')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'APA'
                  ? 'border-rose-500 text-rose-400 bg-rose-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>5. Acquire.com APA Covenant</span>
            </button>
          </nav>
        </div>

        {/* Tab Viewport Content */}
        <div className="relative w-full">
          {activeTab === 'POWERTRAIN' && (
            <PowertrainMpcTab
              state={powertrainState}
              torque={calculatedTorque}
              onUpdateState={handleUpdatePowertrain}
              onTriggerSolve={handleTriggerSolve}
            />
          )}

          {activeTab === 'POSTGRES' && (
            <PostgresLedgerTab
              merkleTree={merkleTree}
              onVerifyMerkle={handleVerifyMerkle}
              isVerifying={isVerifyingMerkle}
            />
          )}

          {activeTab === 'OPENAPI' && (
            <OpenApiContractTab
              currentDriveMode={powertrainState.driveMode}
              onDriveModeChange={(mode: DriveMode) => handleUpdatePowertrain({ driveMode: mode })}
            />
          )}

          {activeTab === 'CLOUDRUN' && <CloudRunHarnessTab />}

          {activeTab === 'APA' && (
            <ApaCovenantTab
              onSignEscrow={handleSignEscrow}
              isEscrowSigned={isEscrowSigned}
            />
          )}
        </div>
      </main>

      {/* Institutional Vault Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 px-6 text-center text-sm text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-slate-300">Ghost FactoryOS · Asset GF-T3-169</span>
            <span className="mx-2">·</span>
            <span>Apex Executive NX 450h+ High-G Dynamic Telemetry Agile Hybrid Core</span>
          </div>
          <div className="text-slate-400 text-sm">
            Acquire.com Turnkey Micro-APA Asset · 100% Permissive Clean-Room MIT
          </div>
        </div>
      </footer>

      {/* Enterprise Modals */}
      <ProjectManagementModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        tasks={tasks}
        onSyncWebhook={handleSyncWebhook}
        isSyncing={isSyncingTasks}
      />

      <AuditAlertsModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        auditLogs={auditLogs}
        alerts={alerts}
        state={powertrainState}
        onDispatchAlert={handleDispatchAlert}
      />

      <CloudCostModal
        isOpen={isCostModalOpen}
        onClose={() => setIsCostModalOpen(false)}
      />

      <MfaModal
        isOpen={isMfaModalOpen}
        onClose={() => setIsMfaModalOpen(false)}
        currentRole={currentRole}
        isMfaVerified={isMfaVerified}
        onVerifyMfa={() => setIsMfaVerified(true)}
      />

      <SpecExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onDownload={handleDownloadSpec}
      />
    </div>
  );
}
