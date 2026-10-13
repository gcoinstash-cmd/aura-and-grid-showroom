import React from 'react';
import { X, DollarSign, Server, Cloud, Cpu, HardDrive } from 'lucide-react';

interface CloudCostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudCostModal: React.FC<CloudCostModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const costBreakdown = [
    { service: 'Google Cloud Run v2 (2 vCPU, 1Gi RAM, 4 instances peak)', monthly: '$38.40', type: 'Serverless Compute' },
    { service: 'TimescaleDB / Cloud SQL PostgreSQL 16 (db-custom-2-7680, 50GB NVMe)', monthly: '$84.20', type: 'Telemetry Ledger' },
    { service: 'Cloud Storage & Merkle Hash Archive (US Multi-Region)', monthly: '$6.50', type: 'Immutable Storage' },
    { service: 'Cloud Armor DDoS & API Gateway Security', monthly: '$14.00', type: 'Network & Ingress' },
    { service: 'Cloud Monitoring & Logging (500Hz Telemetry sampling)', monthly: '$5.40', type: 'Observability' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="flex items-start justify-between pb-4 mb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-slate-400 font-semibold text-sm">Acquire.com Due Diligence Asset</span>
              <span className="px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 text-sm font-semibold">
                Turnkey Operating Cost
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-100">
              Cloud Infrastructure Utilization & Cost Ledger
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-sm block">Estimated Monthly Burn</span>
            <span className="text-3xl font-extrabold font-mono text-emerald-400">$148.50</span>
            <span className="text-slate-500 text-sm block mt-1">~0.12% of asset value</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-sm block">Uptime SLA</span>
            <span className="text-3xl font-extrabold font-mono text-cyan-400">99.99%</span>
            <span className="text-slate-500 text-sm block mt-1">Multi-AZ Automatic Failover</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-sm block">Terraform Provisioning</span>
            <span className="text-3xl font-extrabold font-mono text-purple-400">100% IaC</span>
            <span className="text-slate-500 text-sm block mt-1">1-Click deploy ready</span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 mb-6">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="p-3">CLOUD RESOURCE</th>
                <th className="p-3">CATEGORY</th>
                <th className="p-3 text-right">MONTHLY RUN RATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-mono">
              {costBreakdown.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/60 transition-colors">
                  <td className="p-3 text-slate-200 font-sans text-sm font-semibold">{item.service}</td>
                  <td className="p-3 text-slate-400 text-sm">{item.type}</td>
                  <td className="p-3 text-emerald-400 text-sm font-bold text-right">{item.monthly}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300">
          <span className="font-bold text-white block mb-1">Architectural Cost Guarantee for Buyer:</span>
          Under full 500 Hz telemetry load across a fleet of test mules, compute resources automatically scale to zero during off-peak periods, maintaining minimal idling cost under $25/mo without loss of state.
        </div>
      </div>
    </div>
  );
};
