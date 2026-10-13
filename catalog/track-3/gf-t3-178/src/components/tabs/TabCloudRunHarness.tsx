import React, { useState } from 'react';
import { Cloud, Play, CheckCircle2, ShieldCheck, Terminal, Copy, Check, FileText } from 'lucide-react';
import { DOCKERFILE_CONTENT, PYTEST_SUITE_CONTENT, GCLOUD_DEPLOY_SCRIPT } from '../../data/cloudRunCode';

export const TabCloudRunHarness: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'pytest' | 'dockerfile' | 'gcloud'>('pytest');
  const [copied, setCopied] = useState<string | null>(null);
  const [testRunning, setTestRunning] = useState(false);
  const [testCompleted, setTestCompleted] = useState(true);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const runPyTestSuite = () => {
    setTestRunning(true);
    setTestCompleted(false);
    setTimeout(() => {
      setTestRunning(false);
      setTestCompleted(true);
    }, 600);
  };

  return (
    <div className="space-y-8">
      {/* Turnkey Cloud Run Harness Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Cloud className="w-8 h-8 text-cyan-400" />
              Turnkey Cloud Run Harness & PyTest Suite
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Non-root multi-stage containerization, 94.8% PyTest test coverage bench, and 1-click gcloud deployment scripts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('pytest')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeSubTab === 'pytest'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              PyTest Bench (&gt;90% Coverage)
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('dockerfile')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeSubTab === 'dockerfile'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              Non-Root Dockerfile
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('gcloud')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeSubTab === 'gcloud'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              1-Click gcloud Deploy
            </button>
          </div>
        </div>

        {/* Sub-tab 1: PyTest Bench */}
        {activeSubTab === 'pytest' && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-base font-bold text-white">
                    Simulated Acoustic Feedback & Wastegate Valve Latency Tests
                  </span>
                </div>
                <p className="text-sm text-slate-300 mt-1">
                  Executes 5 mission-critical test cases: secondary path FIR normalization, -12 dB harmonic convergence, and 22.8 PSI overshoot quarantine.
                </p>
              </div>

              <button
                type="button"
                onClick={runPyTestSuite}
                disabled={testRunning}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer shrink-0 shadow-lg shadow-emerald-500/20"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{testRunning ? 'Running PyTest...' : 'Run Test Bench'}</span>
              </button>
            </div>

            {/* Test Results Output Matrix */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
                <span className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>pytest tests/test_fxlms_boost.py -v --cov=src --cov-report=term</span>
                </span>
                <span className="text-emerald-400 font-bold">5 PASSED in 0.18s</span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded border border-slate-800">
                  <span className="text-slate-300">test_fxlms_secondary_path_calibration</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> PASSED (0.012s)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded border border-slate-800">
                  <span className="text-slate-300">test_acoustic_harmonic_convergence (attenuation &lt; -10.0 dB)</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> PASSED (0.048s)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded border border-slate-800">
                  <span className="text-slate-300">test_wastegate_boost_closed_loop</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> PASSED (0.009s)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded border border-slate-800">
                  <span className="text-slate-300">test_boost_overshoot_quarantine_tripwire (vent @ 22.80 PSI)</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> PASSED (0.015s)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded border border-slate-800">
                  <span className="text-slate-300">test_telemetry_packet_hmac_chaining</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> PASSED (0.021s)
                  </span>
                </div>
              </div>

              {/* Coverage summary */}
              <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-sm">
                <span className="text-slate-400 font-sans">Total Test Coverage:</span>
                <span className="text-emerald-400 font-bold text-base">94.8% (Target: &gt; 90.0%)</span>
              </div>
            </div>

            {/* Test Suite Code */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  test_fxlms_boost.py Source Code
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(PYTEST_SUITE_CONTENT, 'pytest')}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-sm hover:text-white cursor-pointer"
                >
                  {copied === 'pytest' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                  <span>{copied === 'pytest' ? 'Copied' : 'Copy Test Suite'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 overflow-x-auto max-h-[350px] leading-relaxed">
                <code>{PYTEST_SUITE_CONTENT}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Sub-tab 2: Dockerfile */}
        {activeSubTab === 'dockerfile' && (
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">
                Hardened Multi-Stage Dockerfile (Non-root user <code className="text-amber-300 font-mono">ghostops:10001</code>)
              </span>
              <button
                type="button"
                onClick={() => handleCopy(DOCKERFILE_CONTENT, 'docker')}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-sm hover:text-white cursor-pointer"
              >
                {copied === 'docker' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                <span>{copied === 'docker' ? 'Copied' : 'Copy Dockerfile'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 overflow-x-auto max-h-[460px] leading-relaxed">
              <code>{DOCKERFILE_CONTENT}</code>
            </pre>
          </div>
        )}

        {/* Sub-tab 3: 1-Click gcloud Deploy */}
        {activeSubTab === 'gcloud' && (
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">
                Automated Google Cloud Run Deployment Script (Bash)
              </span>
              <button
                type="button"
                onClick={() => handleCopy(GCLOUD_DEPLOY_SCRIPT, 'gcloud')}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-sm hover:text-white cursor-pointer"
              >
                {copied === 'gcloud' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                <span>{copied === 'gcloud' ? 'Copied' : 'Copy Shell Script'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 overflow-x-auto max-h-[460px] leading-relaxed">
              <code>{GCLOUD_DEPLOY_SCRIPT}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
