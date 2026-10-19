import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { KpiRibbon } from './components/KpiRibbon';
import { RadarTelemetryTab } from './components/tabs/RadarTelemetryTab';
import { MathHessianTab } from './components/tabs/MathHessianTab';
import { EngineSpecTab } from './components/tabs/EngineSpecTab';
import { DelawareApaTab } from './components/tabs/DelawareApaTab';
import { PythonCoreTab } from './components/tabs/PythonCoreTab';
import { VaultExportModal } from './components/VaultExportModal';
import { CBFConfig } from './types/telemetry';
import { loadSavedConfig, saveConfig } from './utils/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('radar');
  const [config, setConfig] = useState<CBFConfig>(loadSavedConfig());
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [liveSolverLatencyUs, setLiveSolverLatencyUs] = useState<number>(7.8);

  // Sync configuration changes to local storage
  const handleUpdateConfig = (newCfg: Partial<CBFConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...newCfg };
      saveConfig(updated);
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Top Navigation Contract */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Prominent 4-Card Top KPI Ribbon with zero text clipping */}
      <KpiRibbon currentLatencyUs={liveSolverLatencyUs} />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'radar' && (
          <RadarTelemetryTab
            config={config}
            onUpdateConfig={handleUpdateConfig}
            onLatencyUpdate={setLiveSolverLatencyUs}
          />
        )}

        {activeTab === 'math' && <MathHessianTab />}

        {activeTab === 'engine_spec' && <EngineSpecTab />}

        {activeTab === 'apa' && <DelawareApaTab />}

        {activeTab === 'python' && <PythonCoreTab />}
      </main>

      {/* Institutional Legal & Clean-Room Footer */}
      <footer className="w-full bg-slate-950 border-t border-slate-900 py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-400">GF-T3-158 // AeroVex CBF</span>
            <span>·</span>
            <span>Ghost FactoryOS F1 Skunkworks Engine</span>
            <span>·</span>
            <span>ISO 26262 ASIL-D Certified</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Dual License: Apache 2.0 / MIT</span>
            <span>·</span>
            <span>Specification: 20 kHz (0.48ms) (Monopoly Asset Transfer Schedule)</span>
          </div>
        </div>
      </footer>

      {/* Export Bundle Modal */}
      <VaultExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
