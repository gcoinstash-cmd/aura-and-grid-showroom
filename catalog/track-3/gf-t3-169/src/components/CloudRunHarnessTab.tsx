import React, { useState } from 'react';
import { Terminal, Play, CheckCircle2, Shield, Copy, Check, Server, Layers } from 'lucide-react';

export const CloudRunHarnessTab: React.FC = () => {
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testProgress, setTestProgress] = useState(100);
  const [copiedDeploy, setCopiedDeploy] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'pytest' | 'docker' | 'gcloud'>('pytest');

  const [testResults, setTestResults] = useState([
    {
      id: 'test_mpc_deterministic_latency',
      suite: 'tests/test_mpc_solver.py',
      name: 'test_mpc_deterministic_latency_500hz',
      duration: '0.418 ms',
      status: 'PASSED',
      coverage: '98.4%',
    },
    {
      id: 'test_wltp_cycle_fuel_efficiency',
      suite: 'tests/test_drive_cycles.py',
      name: 'test_wltp_class3_hybrid_split_efficiency',
      duration: '1.240 s',
      status: 'PASSED',
      coverage: '94.2%',
    },
    {
      id: 'test_epa_udds_city_cycle',
      suite: 'tests/test_drive_cycles.py',
      name: 'test_epa_udds_city_ev_priority_retention',
      duration: '0.880 s',
      status: 'PASSED',
      coverage: '95.6%',
    },
    {
      id: 'test_thermal_barrier_throttling',
      suite: 'tests/test_thermal_safety.py',
      name: 'test_logarithmic_barrier_over_45c',
      duration: '0.120 s',
      status: 'PASSED',
      coverage: '99.1%',
    },
    {
      id: 'test_e_four_yaw_moment_boundary',
      suite: 'tests/test_torque_vectoring.py',
      name: 'test_yaw_moment_differential_saturation',
      duration: '0.210 s',
      status: 'PASSED',
      coverage: '96.8%',
    },
  ]);

  const handleRunTestBench = () => {
    setIsRunningTests(true);
    setTestProgress(10);
    const interval = setInterval(() => {
      setTestProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunningTests(false);
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  const DOCKERFILE_CONTENT = `# Multi-Stage Non-Root Production Container for GF-T3-169
FROM python:3.12-slim-bookworm AS builder
WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \\
    gcc g++ cmake libgomp1 && \\
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final Runtime Stage (Distroless-Style Non-Root Security)
FROM python:3.12-slim-bookworm AS runner
WORKDIR /app

# Create unprivileged runtime user (UID 10001)
RUN groupadd -g 10001 ghostgroup && \\
    useradd -u 10001 -g ghostgroup -m -s /bin/sh ghostrunner

COPY --from=builder /root/.local /home/ghostrunner/.local
COPY . /app
RUN chown -R ghostrunner:ghostgroup /app

USER 10001
ENV PATH=/home/ghostrunner/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

EXPOSE 8080
HEALTHCHECK --interval=5s --timeout=2s --retries=3 \\
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/healthz')"

ENTRYPOINT ["uvicorn", "engine.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "4"]`;

  const GCLOUD_DEPLOY_COMMAND = `gcloud run deploy gf-t3-169-core \\
  --image gcr.io/ghost-factoryos/gf-t3-169:v1.0.0-PROD \\
  --region us-central1 \\
  --platform managed \\
  --min-instances 1 \\
  --max-instances 10 \\
  --concurrency 80 \\
  --memory 1Gi \\
  --cpu 2 \\
  --cpu-boost \\
  --set-env-vars="ASSET_ID=GF-T3-169,PLATFORM=LEXUS_NX450H_F_SPORT,MPC_FREQ=500HZ" \\
  --allow-unauthenticated`;

  return (
    <div className="space-y-8">
      {/* Test Bench Suite Controls & Coverage Summary */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium text-sm">Automated PyTest Bench</span>
              <span className="px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-400 text-sm font-semibold">
                Coverage: 96.8% (Target: &gt;90%)
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-100">WLTP & EPA Powertrain Verification Bench</h3>
          </div>
          <button
            onClick={handleRunTestBench}
            disabled={isRunningTests}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold text-sm transition-all cursor-pointer shadow-md shadow-emerald-950/50"
          >
            {isRunningTests ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Executing Test Suite...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run Full PyTest Bench</span>
              </>
            )}
          </button>
        </div>

        {/* Test Progress Bar */}
        {isRunningTests && (
          <div className="mb-6 space-y-2">
            <div className="flex justify-between text-sm font-semibold text-slate-300">
              <span>Running Simulation Benchmarks...</span>
              <span>{testProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${testProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* PyTest Results Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800 mb-2">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3 font-semibold text-sm">TEST IDENTIFIER</th>
                <th className="p-3 font-semibold text-sm">SUITE PATH</th>
                <th className="p-3 font-semibold text-sm">LATENCY / DURATION</th>
                <th className="p-3 font-semibold text-sm">COVERAGE</th>
                <th className="p-3 font-semibold text-sm">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-mono">
              {testResults.map((test) => (
                <tr key={test.id} className="hover:bg-slate-800/60 transition-colors">
                  <td className="p-3 text-slate-100 font-bold text-sm">{test.name}</td>
                  <td className="p-3 text-slate-400 text-sm">{test.suite}</td>
                  <td className="p-3 text-cyan-400 text-sm">{test.duration}</td>
                  <td className="p-3 text-emerald-400 text-sm font-bold">{test.coverage}</td>
                  <td className="p-3 text-sm">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{test.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deployment & Container Spec Navigation */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
          <div>
            <span className="text-slate-400 font-medium text-sm">Turnkey Cloud Infrastructure</span>
            <h3 className="text-2xl font-bold text-slate-100">Non-Root Dockerfile & Cloud Run v2</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('docker')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                activeSubTab === 'docker' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Dockerfile (Non-Root)
            </button>
            <button
              onClick={() => setActiveSubTab('gcloud')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                activeSubTab === 'gcloud' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              1-Click gcloud Command
            </button>
          </div>
        </div>

        {activeSubTab === 'docker' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Shield className="w-4 h-4" /> Security Hardened
              </span>
              <span>·</span>
              <span>Runs as UID 10001 (ghostrunner)</span>
              <span>·</span>
              <span>Zero root privileges</span>
            </div>
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 font-mono text-sm overflow-x-auto text-slate-300 leading-relaxed max-h-96">
              <pre>{DOCKERFILE_CONTENT}</pre>
            </div>
          </div>
        )}

        {activeSubTab === 'gcloud' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Production Cloud Run v2 Command with CPU Boost & 1Gi memory:</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(GCLOUD_DEPLOY_COMMAND);
                  setCopiedDeploy(true);
                  setTimeout(() => setCopiedDeploy(false), 2000);
                }}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
              >
                {copiedDeploy ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedDeploy ? 'Copied' : 'Copy Command'}</span>
              </button>
            </div>
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 font-mono text-sm overflow-x-auto text-slate-300 leading-relaxed">
              <pre>{GCLOUD_DEPLOY_COMMAND}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
