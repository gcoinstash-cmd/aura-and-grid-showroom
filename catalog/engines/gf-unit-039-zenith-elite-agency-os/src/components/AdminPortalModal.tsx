import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  Layers, 
  Calendar, 
  Users, 
  DollarSign, 
  Clock, 
  X, 
  LogOut,
  Palette,
  Terminal,
  FileCode
} from 'lucide-react';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({ isOpen, onClose }) => {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<'retainers' | 'proposals' | 'deliverables'>('retainers');

  const [retainers, setRetainers] = useState([
    { id: 'RET-01', client: 'Aethel Labs', engagement: 'Cinematic 3D & Brand Identity', monthly: '$18,500/mo', status: 'Active Sprint', term: '6 Months' },
    { id: 'RET-02', client: 'Klausen Autonomous', engagement: 'Enterprise Web Experience & Design System', monthly: '$24,000/mo', status: 'Active Sprint', term: '12 Months' },
    { id: 'RET-03', client: 'Vance Spatial', engagement: 'Spatial Computing Narrative & Motion', monthly: '$15,000/mo', status: 'Review Phase', term: 'Quarterly' }
  ]);

  const [proposals, setProposals] = useState([
    { id: 'PRP-901', prospect: 'Sovereign Bio', scope: 'Brand Architecture & Global Web Relaunch', budget: '$145,000', probability: '85%', timeline: 'Q1 Kickoff' },
    { id: 'PRP-902', prospect: 'Orbit Fleet Logistics', scope: 'Design System & Interactive Terminal', budget: '$90,000', probability: '70%', timeline: 'Draft Sent' },
    { id: 'PRP-903', prospect: 'Helios Media', scope: 'Motion Identity & 3D Web Environment', budget: '$120,000', probability: '90%', timeline: 'Verbal Agreement' }
  ]);

  const [deliverables, setDeliverables] = useState([
    { name: 'Obsidian 3D Asset Vault', format: 'glTF / USDZ Master Pack', due: 'In 3 Days', owner: 'Creative Lead' },
    { name: 'WebGL Interaction Prototype', format: 'React Three Fiber Bundle', due: 'In 6 Days', owner: 'Technical Director' },
    { name: 'Brand Typography Guidelines', format: 'PDF Specimen & Web Fonts', due: 'Delivered', owner: 'Typography Atelier' }
  ]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'zenith2026') {
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  const handleOneClickFill = () => {
    setPasscode('zenith2026');
    setIsAuthenticated(true);
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn text-stone-100 font-sans">
      <div className="relative w-full max-w-4xl bg-stone-950 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center shadow-lg">
              <Terminal className="w-5 h-5 text-stone-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg tracking-wide font-bold text-stone-100">ZENITH ELITE AGENCY — ATELIER COMMAND</h3>
                <span className="text-xs font-semibold tracking-wider uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700 font-mono">
                  Principal Gate
                </span>
              </div>
              <p className="text-xs text-stone-400">Creative Direction • Client Retainers • WebGL & Motion Deliverables</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gate vs Dashboard */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-stone-300" />
            </div>
            <h4 className="text-xl font-bold font-serif text-stone-100 mb-2">Agency Director Terminal</h4>
            <p className="text-stone-400 text-sm max-w-md mb-8">
              Access reserved for Zenith partners and creative leads.
            </p>

            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
              <div>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passkey (zenith2026)"
                  className="w-full px-4 py-3 bg-stone-900/90 border border-stone-800 rounded-xl text-center text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-stone-400 transition-all font-mono tracking-widest text-lg"
                />
                {error && (
                  <p className="text-rose-400 text-xs mt-2 font-medium">Invalid passkey. Cheat code: zenith2026</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-950 font-bold rounded-xl shadow-lg transition-all text-base font-semibold min-h-[44px] tracking-widest uppercase"
                >
                  Verify Access
                </button>
                <button
                  type="button"
                  onClick={handleOneClickFill}
                  className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-bold rounded-xl transition-all text-base font-semibold min-h-[44px] tracking-wider flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Auto-Fill 1-Click Passkey (zenith2026)
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Top Subnav */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-stone-800 bg-stone-900/40">
              <div className="flex gap-2">
                {[
                  { id: 'retainers', label: 'Agency Retainers', icon: Layers },
                  { id: 'proposals', label: 'Pipeline Proposals', icon: Calendar },
                  { id: 'deliverables', label: 'Digital Assets', icon: Palette }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isActive 
                          ? 'bg-stone-200 text-stone-950 shadow-md' 
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-stone-400 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  ATELIER RUNNING
                </span>
                <button 
                  onClick={() => setIsAuthenticated(false)}
                  className="text-stone-400 hover:text-rose-400 text-xs flex items-center gap-1 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Lock
                </button>
              </div>
            </div>

            {/* Dashboard Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* Financial Metric Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-stone-900/50 border border-stone-800 rounded-xl">
                  <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase tracking-widest block mb-1">Contracted MRR</span>
                  <span className="text-xl font-bold font-mono text-stone-100">$57,500/mo</span>
                  <span className="text-xs font-semibold tracking-wider text-emerald-400 block mt-1">3 Active Enterprise Clients</span>
                </div>
                <div className="p-4 bg-stone-900/50 border border-stone-800 rounded-xl">
                  <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase tracking-widest block mb-1">Weighted Pipeline</span>
                  <span className="text-xl font-bold font-mono text-stone-100">$295,000</span>
                  <span className="text-xs font-semibold tracking-wider text-amber-400 block mt-1">82% Close Rate</span>
                </div>
                <div className="p-4 bg-stone-900/50 border border-stone-800 rounded-xl">
                  <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase tracking-widest block mb-1">Avg Engagement</span>
                  <span className="text-xl font-bold font-mono text-stone-100">$118,000</span>
                  <span className="text-xs font-semibold tracking-wider text-stone-400 block mt-1">Design & WebGL</span>
                </div>
                <div className="p-4 bg-stone-900/50 border border-stone-800 rounded-xl">
                  <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase tracking-widest block mb-1">Creative Output</span>
                  <span className="text-xl font-bold font-mono text-stone-100">99.4%</span>
                  <span className="text-xs font-semibold tracking-wider text-emerald-400 block mt-1">On-Time Milestones</span>
                </div>
              </div>

              {/* Tab 1: Retainers */}
              {activeTab === 'retainers' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-stone-200 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-stone-300" />
                    Active Enterprise Agency Retainers
                  </h4>
                  <div className="space-y-3">
                    {retainers.map((ret) => (
                      <div key={ret.id} className="p-4 bg-stone-900/60 border border-stone-800 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-stone-400">{ret.id}</span>
                            <span className="font-bold text-sm text-stone-100">{ret.client}</span>
                          </div>
                          <div className="text-xs text-stone-400 mt-1">{ret.engagement} • {ret.term}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-sm font-bold text-emerald-400">{ret.monthly}</span>
                          <span className="px-2.5 py-1 rounded bg-stone-800 text-stone-200 border border-stone-700 text-xs font-medium">
                            {ret.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Proposals */}
              {activeTab === 'proposals' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-stone-200 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-stone-300" />
                    Dealflow & Custom Architectural Proposals
                  </h4>
                  <div className="border border-stone-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs text-stone-300">
                      <thead className="bg-stone-900/80 text-xs font-semibold tracking-wider uppercase font-bold text-stone-400 tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Ref</th>
                          <th className="py-3 px-4">Prospect</th>
                          <th className="py-3 px-4">Scope</th>
                          <th className="py-3 px-4">Target Budget</th>
                          <th className="py-3 px-4">Probability</th>
                          <th className="py-3 px-4">Timeline</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800/60 font-mono">
                        {proposals.map((p) => (
                          <tr key={p.id} className="hover:bg-stone-900/40">
                            <td className="py-3 px-4 text-stone-400">{p.id}</td>
                            <td className="py-3 px-4 font-sans font-bold text-stone-200">{p.prospect}</td>
                            <td className="py-3 px-4 font-sans text-stone-400">{p.scope}</td>
                            <td className="py-3 px-4 text-emerald-400 font-bold">{p.budget}</td>
                            <td className="py-3 px-4 text-amber-300">{p.probability}</td>
                            <td className="py-3 px-4 text-stone-400">{p.timeline}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Deliverables */}
              {activeTab === 'deliverables' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-stone-200 uppercase tracking-wider flex items-center gap-2">
                    <Palette className="w-4 h-4 text-stone-300" />
                    Creative Assets & 3D Environments
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {deliverables.map((d, idx) => (
                      <div key={idx} className="p-4 bg-stone-900/60 border border-stone-800 rounded-xl space-y-2">
                        <div className="text-xs font-bold text-stone-100">{d.name}</div>
                        <div className="text-xs text-stone-400 font-mono">{d.format}</div>
                        <div className="text-xs text-stone-500">Lead: {d.owner}</div>
                        <div className="pt-2 border-t border-stone-800 text-xs font-semibold text-amber-400">{d.due}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Footer */}
            <div className="px-6 py-3 border-t border-stone-800 bg-stone-900/60 flex items-center justify-between text-xs text-stone-500">
              <span className="font-mono">Turnkey Supabase Schema Ready • RLS Active</span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-lg transition-colors text-base font-semibold min-h-[44px]"
              >
                Close Terminal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
