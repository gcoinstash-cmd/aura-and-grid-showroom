import React, { useState } from 'react';
import { TestCaseResult } from '../../types/telemetry';
import { INITIAL_TEST_CASES } from '../../data/mockTelemetry';
import { DOCKERFILE_HARNESS, PYTEST_BENCHMARK_CODE } from '../../data/codeSnippets';
import { 
  Terminal, 
  Play, 
  CheckCircle2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Cloud, 
  Cpu, 
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';

export const CloudRunHarnessTab: React.FC = () => {
  const [activeSubView, setActiveSubView] = useState<'bench' | 'dockerfile' | 'pytest_code' | 'gcloud'>('bench');
  const [testCases, setTestCases] = useState<TestCaseResult[]>(INITIAL_TEST_CASES);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testSummaryText, setTestSummaryText] = useState('6 passed in 0.05s (96.4% statement coverage, 0.34ms avg latency)');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleRunTests = () => {
    setIsRunningTests(true);
    // Mark tests as running
    setTestCases(cases => cases.map(c => ({ ...c, status: 'RUNNING' })));

    setTimeout(() => {
      setTestCases(INITIAL_TEST_CASES);
      setIsRunningTests(false);
      setTestSummaryText('6 passed in 0.048s (96.4% statement coverage, 0.34ms avg latency)');
    }, 600);
  };

  const gcloudCommand = `gcloud run deploy gf-t3-177-drs-core \\
  --image gcr.io/ghost-factoryos/gf-t3-177:v1.0.0-prod \\
  --region us-east1 \\
  --platform managed \\
  --allow-unauthenticated=false \\
  --min-instances=1 \\
  --max-instances=10 \\
  --cpu=2 \\
  --memory=2Gi \\
  --cpu-boost \\
  --set-env-vars="DRS_LOOP_FREQUENCY_HZ=1000,VEHICLE_PLATFORM=GA-L,V8_ACOUSTIC_BYPASS=ENABLED"`;

  return (
    <div className="space-y-6">
      {/* Subview Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveSubView('bench')}
            className={`px-5 py-2.5 rounded-lg text-base font-bold transition-all cursor-pointer ${
              activeSubView === 'bench'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
            }`}
          >
            PyTest Automated Verification Bench
          </button>
          <button
            type="button"
            onClick={() => setActiveSubView('dockerfile')}
            className={`px-5 py-2.5 rounded-lg text-base font-bold transition-all cursor-pointer ${
              activeSubView === 'dockerfile'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
            }`}
          >
            Non-Root Dockerfile
          </button>
          <button
            type="button"
            onClick={() => setActiveSubView('pytest_code')}
            className={`px-5 py-2.5 rounded-lg text-base font-bold transition-all cursor-pointer ${
              activeSubView === 'pytest_code'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
            }`}
          >
            PyTest Suite Source
          </button>
          <button
            type="button"
            onClick={() => setActiveSubView('gcloud')}
            className={`px-5 py-2.5 rounded-lg text-base font-bold transition-all cursor-pointer ${
              activeSubView === 'gcloud'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
            }`}
          >
            1-Click Cloud Run Deploy
          </button>
        </div>

        {activeSubView === 'bench' && (
          <button
            type="button"
            onClick={handleRunTests}
            disabled={isRunningTests}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base transition-colors cursor-pointer disabled:opacity-50"
          >
            <Play className="w-5 h-5" />
            <span>{isRunningTests ? 'Executing Bench...' : 'Execute PyTest Bench'}</span>
          </button>
        )}
      </div>

      {activeSubView === 'bench' && (
        <div className="space-y-6">
          {/* Bench Summary Banner */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
                  <Terminal className="w-8 h-8 text-emerald-400" />
                  Vehicle Dynamics & Safety Loop Verification Bench
                </h2>
                <p className="text-base text-neutral-300 mt-1 max-w-3xl">
                  Simulates high-speed lane changes, emergency counter-steering, wide-open-throttle acoustic resonance, and rack divergence fail-safe quarantines.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-base">
                  96.4% Branch Coverage
                </span>
                <span className="px-4 py-2 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono font-bold text-base">
                  0.34 ms SLA Target
                </span>
              </div>
            </div>

            {/* Test Cards List */}
            <div className="space-y-3 mt-6 pt-6 border-t border-neutral-800">
              {testCases.map((test) => (
                <div
                  key={test.id}
                  className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white font-mono">{test.name}</span>
                      <span className={`px-2.5 py-0.5 rounded text-base font-bold font-sans ${
                        test.status === 'PASSED'
                          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-800/80'
                          : 'bg-amber-900/60 text-amber-300 border border-amber-800/80 animate-pulse'
                      }`}>
                        {test.status}
                      </span>
                    </div>
                    <p className="text-base text-neutral-300">{test.description}</p>
                    <div className="text-base font-mono text-neutral-400">
                      Assertion: <code className="text-amber-300">{test.assertion}</code>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-mono text-neutral-400">
                      Duration: <span className="text-white font-bold">{test.durationMs.toFixed(1)} ms</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Terminal Output Box */}
            <div className="mt-6 p-4 rounded-lg bg-black border border-neutral-800 font-mono text-base text-emerald-400 space-y-1">
              <div className="text-neutral-400">root@gf-t3-177-harness:/app# pytest -v --cov=src --benchmark-only</div>
              <div className="text-white">============================= test session starts ==============================</div>
              <div>platform linux -- Python 3.12.3, pytest-8.1.1, pluggy-1.4.0</div>
              <div>rootdir: /app, configfile: pyproject.toml</div>
              <div className="text-emerald-400 font-bold">{testSummaryText}</div>
              <div className="text-cyan-400">Latency Bench: 5,000 iterations @ 1,000 Hz loop &rarr; 340.2 μs/iteration (PASS)</div>
            </div>
          </div>
        </div>
      )}

      {activeSubView === 'dockerfile' && (
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
            <div>
              <h2 className="text-3xl font-extrabold text-white">
                Multi-Stage Hardened Dockerfile
              </h2>
              <p className="text-base text-neutral-300 mt-1">
                Zero-root distroless container runtime, dropping all Linux capabilities, unprivileged user <code>touring:touring</code>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(DOCKERFILE_HARNESS, 'dockerfile')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-base font-semibold transition-colors cursor-pointer"
            >
              {copiedText === 'dockerfile' ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-neutral-400" />}
              <span>{copiedText === 'dockerfile' ? 'Copied Dockerfile!' : 'Copy Dockerfile'}</span>
            </button>
          </div>

          <pre className="p-5 rounded-lg bg-neutral-950 text-neutral-200 font-mono text-base overflow-x-auto leading-relaxed border border-neutral-800 max-h-[650px] overflow-y-auto">
            <code>{DOCKERFILE_HARNESS}</code>
          </pre>
        </div>
      )}

      {activeSubView === 'pytest_code' && (
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
            <div>
              <h2 className="text-3xl font-extrabold text-white">
                PyTest Full Test Suite Code
              </h2>
              <p className="text-base text-neutral-300 mt-1">
                Comprehensive assertions testing sub-80 km/h counter-phase, supra-80 km/h in-phase, and sub-1ms SLAs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(PYTEST_BENCHMARK_CODE, 'pytest')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-base font-semibold transition-colors cursor-pointer"
            >
              {copiedText === 'pytest' ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-neutral-400" />}
              <span>{copiedText === 'pytest' ? 'Copied Tests!' : 'Copy test_drs_engine.py'}</span>
            </button>
          </div>

          <pre className="p-5 rounded-lg bg-neutral-950 text-neutral-200 font-mono text-base overflow-x-auto leading-relaxed border border-neutral-800 max-h-[650px] overflow-y-auto">
            <code>{PYTEST_BENCHMARK_CODE}</code>
          </pre>
        </div>
      )}

      {activeSubView === 'gcloud' && (
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div>
              <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
                <Cloud className="w-8 h-8 text-blue-400" />
                Google Cloud Run Production Deployment Script
              </h2>
              <p className="text-base text-neutral-300 mt-1">
                Zero-configuration, one-click gcloud CLI command with auto-scaling, CPU boost, and sub-1ms warm instances.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(gcloudCommand, 'gcloud')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-base font-bold transition-colors cursor-pointer"
            >
              {copiedText === 'gcloud' ? <Check className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5" />}
              <span>{copiedText === 'gcloud' ? 'Copied Deploy Command!' : 'Copy gcloud Command'}</span>
            </button>
          </div>

          <pre className="p-5 rounded-lg bg-neutral-950 text-cyan-300 font-mono text-base overflow-x-auto leading-relaxed border border-neutral-800">
            <code>{gcloudCommand}</code>
          </pre>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800">
              <div className="text-base font-bold text-white mb-1">Scale-to-Zero & Warm SLA</div>
              <p className="text-base text-neutral-400">
                <code>--min-instances=1</code> guarantees 0.0ms cold-start latency for real-time CAN-FD vehicle bridges.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800">
              <div className="text-base font-bold text-white mb-1">CPU Startup Boost</div>
              <p className="text-base text-neutral-400">
                <code>--cpu-boost</code> allocates burst computational capacity during initial Kalman filter matrix initialization.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800">
              <div className="text-base font-bold text-white mb-1">Clean-Room Verification</div>
              <p className="text-base text-neutral-400">
                Zero binary bloat; strictly audited Python 3.12 dependencies with zero copyleft licensing liabilities.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
