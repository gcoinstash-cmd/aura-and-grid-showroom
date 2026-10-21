import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Compass, 
  Sparkles, 
  Layers, 
  Calendar, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  Clock, 
  X, 
  LogOut,
  Palette,
  FileText
} from 'lucide-react';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({ isOpen, onClose }) => {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<'projects' | 'consultations' | 'materials'>('projects');

  const [projects, setProjects] = useState([
    { id: 'PRJ-108', client: 'Harrison & Claire Sterling', name: 'Brentwood Modern Zen Residence', budget: '$420,000', phase: 'Schematic Design & Material Board', squareFootage: '6,400 sq ft', status: 'Active Sprint' },
    { id: 'PRJ-109', client: 'Klaus Lindner', name: 'Bel-Air Pavilion & Tea House', budget: '$280,000', phase: 'Custom Millwork Sourcing', squareFootage: '3,800 sq ft', status: 'Fabrication' },
    { id: 'PRJ-110', client: 'Seraphina Vance', name: 'Malibu Cliffside Sanctuary', budget: '$650,000', phase: 'Final Architectural Review', squareFootage: '8,200 sq ft', status: 'Contract Signed' }
  ]);

  const [consultations, setConsultations] = useState([
    { id: 'CNS-501', client: 'Julian Drake', location: 'Pacific Palisades', time: 'Monday 2:00 PM', scope: 'Full Home Architecture & Interior Redesign', budgetTier: '$300k - $500k', status: 'VIP Confirmed' },
    { id: 'CNS-502', client: 'Maya Chen', location: 'Hollywood Hills', time: 'Wednesday 10:30 AM', scope: 'Master Suite & Zen Courtyard Conversion', budgetTier: '$150k - $250k', status: 'Discovery Intake' },
    { id: 'CNS-503', client: 'Amos & Leigh Thorne', location: 'Montecito Estate', time: 'Friday 1:00 PM', scope: 'Bespoke California Warm Modern Build', budgetTier: '$750k+', status: 'VIP Confirmed' }
  ]);

  const [materials, setMaterials] = useState([
    { name: 'Kyoto Hinoki Cypress Millwork', supplier: 'Mori Atelier Japan', leadTime: '8 weeks', stock: 'Reserved (400 board ft)' },
    { name: 'Roman Travertine Unfilled Slabs', supplier: 'Tivoli Stone Quarry', leadTime: '6 weeks', stock: 'En Route (8 slabs)' },
    { name: 'Raw Belgian Linen Upholstery', supplier: 'Libeco Lagae', leadTime: '3 weeks', stock: 'In Studio (120 yds)' }
  ]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'veronique2026') {
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  const handleOneClickFill = () => {
    setPasscode('veronique2026');
    setIsAuthenticated(true);
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn text-stone-100 font-sans">
      <div className="relative w-full max-w-4xl bg-stone-950 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800/80 bg-stone-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center shadow-lg">
              <Compass className="w-5 h-5 text-stone-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg tracking-wider font-medium text-stone-100">STUDIO VÉRONIQUE / LA</h3>
                <span className="text-xs font-semibold tracking-wider uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                  Atelier Terminal
                </span>
              </div>
              <p className="text-xs text-stone-400">California Warm Modernism • Architectural Intakes • Custom Millwork</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Gate vs Dashboard */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center mb-6 shadow-inner">
              <Lock className="w-8 h-8 text-stone-300" />
            </div>
            <h4 className="text-xl font-medium font-serif text-stone-100 mb-2 tracking-wide">Principal Atelier Gate</h4>
            <p className="text-stone-400 text-sm max-w-md mb-8">
              Access reserved for Studio Véronique partners and lead project architects.
            </p>

            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
              <div>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passkey (veronique2026)"
                  className="w-full px-4 py-3 bg-stone-900/90 border border-stone-800 rounded-xl text-center text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-stone-400 transition-all font-mono tracking-widest text-lg"
                />
                {error && (
                  <p className="text-rose-400 text-xs mt-2 font-medium">Invalid passkey. Cheat code: veronique2026</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-950 font-bold rounded-xl shadow-lg transition-all text-base font-semibold min-h-[44px] tracking-widest uppercase"
                >
                  Enter Atelier
                </button>
                <button
                  type="button"
                  onClick={handleOneClickFill}
                  className="w-full py-2.5 bg-stone-900 hover:bg-stone-800/80 border border-stone-700 text-stone-300 font-bold rounded-xl transition-all text-base font-semibold min-h-[44px] tracking-wider flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Auto-Fill 1-Click Passkey (veronique2026)
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Top Subnav */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-stone-800/80 bg-stone-900/40">
              <div className="flex gap-2">
                {[
                  { id: 'projects', label: 'Active Projects', icon: Layers },
                  { id: 'consultations', label: 'Private Intakes', icon: Calendar },
                  { id: 'materials', label: 'Material Sourcing', icon: Palette }
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
                  ATELIER ACTIVE
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

            {/* Main Tab Content */}
            <div className="p-6 space-y-6 flex-1">
              {/* Financial & Project Metric Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-stone-900/60 border border-stone-800/80 rounded-xl">
                  <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase tracking-widest block mb-1">Contracted Pipeline</span>
                  <span className="text-xl font-bold font-mono text-stone-100">$1,350,000</span>
                  <span className="text-xs font-semibold tracking-wider text-emerald-400 block mt-1">3 Residences in Flight</span>
                </div>
                <div className="p-4 bg-stone-900/60 border border-stone-800/80 rounded-xl">
                  <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase tracking-widest block mb-1">Avg Project Scope</span>
                  <span className="text-xl font-bold font-mono text-stone-100">$450,000</span>
                  <span className="text-xs font-semibold tracking-wider text-stone-400 block mt-1">Architecture + Interiors</span>
                </div>
                <div className="p-4 bg-stone-900/60 border border-stone-800/80 rounded-xl">
                  <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase tracking-widest block mb-1">Waitlist Period</span>
                  <span className="text-xl font-bold font-mono text-stone-100">4 Months</span>
                  <span className="text-xs font-semibold tracking-wider text-amber-400 block mt-1">Q1/Q2 Capacity Capped</span>
                </div>
                <div className="p-4 bg-stone-900/60 border border-stone-800/80 rounded-xl">
                  <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase tracking-widest block mb-1">Client Satisfaction</span>
                  <span className="text-xl font-bold font-mono text-stone-100">100%</span>
                  <span className="text-xs font-semibold tracking-wider text-emerald-400 block mt-1">Zero Warranty Disputes</span>
                </div>
              </div>

              {/* Tab 1: Active Projects */}
              {activeTab === 'projects' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-stone-200 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-stone-300" />
                    Residential Architecture & Design Pipeline
                  </h4>
                  <div className="space-y-3">
                    {projects.map((proj) => (
                      <div key={proj.id} className="p-4 bg-stone-900/50 border border-stone-800/90 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-stone-400">{proj.id}</span>
                            <span className="font-serif font-medium text-base text-stone-100">{proj.name}</span>
                          </div>
                          <div className="text-xs text-stone-400 mt-1">
                            Client: <span className="text-stone-300 font-medium">{proj.client}</span> • {proj.squareFootage}
                          </div>
                          <div className="text-xs text-amber-300/80 mt-1 font-mono">Current Phase: {proj.phase}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-sm font-bold text-emerald-400">{proj.budget}</span>
                          <span className="px-2.5 py-1 rounded bg-stone-800 text-stone-200 border border-stone-700 text-xs font-medium">
                            {proj.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Consultations */}
              {activeTab === 'consultations' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-stone-200 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-stone-300" />
                    Bespoke Client Consultations
                  </h4>
                  <div className="border border-stone-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs text-stone-300">
                      <thead className="bg-stone-900/80 text-xs font-semibold tracking-wider uppercase font-bold text-stone-400 tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Ref</th>
                          <th className="py-3 px-4">Prospective Client</th>
                          <th className="py-3 px-4">Estate Location</th>
                          <th className="py-3 px-4">Target Scope</th>
                          <th className="py-3 px-4">Budget Bracket</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800/60 font-mono">
                        {consultations.map((c) => (
                          <tr key={c.id} className="hover:bg-stone-900/40">
                            <td className="py-3 px-4 text-stone-400">{c.id}</td>
                            <td className="py-3 px-4 font-sans font-bold text-stone-200">{c.client}</td>
                            <td className="py-3 px-4">{c.location}</td>
                            <td className="py-3 px-4 text-stone-400 font-sans">{c.scope}</td>
                            <td className="py-3 px-4 text-emerald-400">{c.budgetTier}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold tracking-wider">
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Materials */}
              {activeTab === 'materials' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-stone-200 uppercase tracking-wider flex items-center gap-2">
                    <Palette className="w-4 h-4 text-stone-300" />
                    Curated Material & Millwork Procurement
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {materials.map((m, idx) => (
                      <div key={idx} className="p-4 bg-stone-900/60 border border-stone-800 rounded-xl space-y-2">
                        <div className="text-xs font-bold text-stone-100 font-serif tracking-wide">{m.name}</div>
                        <div className="text-xs text-stone-400">Supplier: <span className="text-stone-300">{m.supplier}</span></div>
                        <div className="text-xs text-stone-500">Lead Time: {m.leadTime}</div>
                        <div className="pt-2 border-t border-stone-800/80 font-mono text-xs font-semibold text-amber-400">{m.stock}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Footer */}
            <div className="px-6 py-3 border-t border-stone-800/80 bg-stone-900/60 flex items-center justify-between text-xs text-stone-500">
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
