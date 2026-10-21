import { useState, useEffect } from 'react';
import { X, ShieldCheck, Utensils, Calendar, Users, DollarSign, Award, Clock, Star, Flame } from 'lucide-react';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab?: (tab: string) => void;
}

const PASSKEY = 'culinary2026';

const mockBookings = [
  { id: 'EVT-7701', host: 'Ambassador De la Tour', type: 'Private Sovereign Banquet (24 covers)', date: 'Tonight 7:30 PM', status: 'mise-en-place', spend: 8400 },
  { id: 'EVT-7702', host: 'Lady Genevieve Sterling', type: '12-Course Truffle Degustation (8 covers)', date: 'Tomorrow 8:00 PM', status: 'prep-ready', spend: 4200 },
  { id: 'EVT-7703', host: 'Vanguard Global Partners', type: 'Executive Cellar Dinner (16 covers)', date: 'Saturday 7:00 PM', status: 'confirmed', spend: 6800 },
  { id: 'EVT-7704', host: 'Countess von Bernstorff', type: 'Harvest Vineyard Luncheon (40 covers)', date: 'Sunday 1:00 PM', status: 'review', spend: 12500 },
];

const metrics = [
  { label: 'Weekly BOH Banquet Run', value: '$31,900', icon: DollarSign, color: 'text-amber-400' },
  { label: 'Covers in Prep', value: '88 Pax', icon: Users, color: 'text-amber-300' },
  { label: 'Kitchen Velocity', value: '99.8%', icon: Flame, color: 'text-rose-400' },
  { label: 'Michelin Grade', value: '3-Star Standard', icon: Award, color: 'text-yellow-400' },
];

export default function AdminPortalModal({ isOpen, onClose, onSelectTab }: AdminPortalModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'stations' | 'settings'>('overview');
  const [passkey, setPasskey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setAuthenticated(false);
      setPasskey('');
      setAuthError('');
      setActiveTab('overview');
    }
  }, [isOpen]);

  const handleAuth = () => {
    if (passkey === PASSKEY) {
      setAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Invalid passkey. Use the 1-click auto-fill below.');
    }
  };

  if (!isOpen) return null;

  const statusColors: Record<string, string> = {
    'mise-en-place': 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    'prep-ready': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    'confirmed': 'text-sky-400 bg-sky-400/10 border-sky-400/30',
    'review': 'text-zinc-300 bg-zinc-500/10 border-zinc-700',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-[#0A0A0B] border border-amber-500/30 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30">
              <Utensils className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wider font-mono text-zinc-300 uppercase tracking-widest">Culinary Operational Workspace OS</p>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Executive Chef Command Gate</h2>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {!authenticated ? (
            <div className="flex flex-col items-center justify-center p-10 space-y-6 min-h-[380px]">
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <ShieldCheck className="h-8 w-8 text-amber-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white uppercase tracking-wider mt-4">BOH Executive Access</h3>
                <p className="text-base text-zinc-200 leading-relaxed font-mono max-w-xs mx-auto">Master kitchen operational matrix & banquet management. Enter chef passkey or use 1-click bypass demo.</p>
              </div>

              <div className="w-full max-w-sm space-y-3">
                <input
                  type="password"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                  placeholder="Enter chef passkey..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-amber-500/50 placeholder:text-zinc-700"
                />
                {authError && <p className="text-xs text-red-400 font-mono">{authError}</p>}
                <button onClick={handleAuth} className="w-full rounded-lg bg-amber-500 py-3 text-base font-bold min-h-[44px] uppercase tracking-wider text-black hover:bg-amber-400 transition-all cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                  Unlock Kitchen Matrix
                </button>
                <button
                  onClick={() => { setPasskey(PASSKEY); setAuthError(''); }}
                  className="w-full rounded-lg border border-amber-500/30 bg-amber-500/5 py-2.5 text-xs font-mono text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer"
                >
                  [ 1-CLICK DEMO AUTO-FILL: culinary2026 ]
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="flex gap-1 bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                {([
                  { id: 'overview', label: 'BOH Velocity', icon: Flame },
                  { id: 'events', label: 'Banquets & VIP', icon: Calendar },
                  { id: 'stations', label: 'Line Stations', icon: Utensils },
                  { id: 'settings', label: 'System Capstone', icon: Award },
                ] as const).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === id ? 'bg-amber-500 text-black font-bold' : 'text-zinc-300 hover:text-zinc-300'
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {metrics.map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
                        <Icon className={`h-4 w-4 ${color}`} />
                        <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
                        <p className="text-xs font-semibold tracking-wider text-zinc-300 uppercase tracking-wider">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
                    <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Active High-Profile Banquets</h4>
                    {mockBookings.slice(0, 3).map((b) => (
                      <div key={b.id} className="flex items-center justify-between py-2 border-b border-zinc-800/60 last:border-0">
                        <div>
                          <p className="text-xs font-bold text-white">{b.host}</p>
                          <p className="text-xs font-semibold tracking-wider text-zinc-400 font-mono mt-0.5">{b.type} · {b.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold font-mono text-amber-400">${b.spend.toLocaleString()}</p>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${statusColors[b.status]}`}>{b.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'events' && (
                <div className="space-y-2">
                  {mockBookings.map((b) => (
                    <div key={b.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold tracking-wider font-mono text-zinc-300">{b.id}</span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${statusColors[b.status]}`}>{b.status}</span>
                        </div>
                        <p className="text-sm font-bold text-white">{b.host}</p>
                        <p className="text-base text-zinc-200 leading-relaxed font-mono">{b.type} · {b.date}</p>
                      </div>
                      <p className="text-lg font-bold text-amber-400 font-mono">${b.spend.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'stations' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { name: 'Saucier & Reduction Station', lead: 'Chef Antoine', prepStatus: '100% Prepped', temp: 'Simmering 85°C' },
                    { name: 'Rotisserie & Hearth Fire', lead: 'Chef Marcus', prepStatus: 'Fire Active', temp: 'Charcoal 320°C' },
                    { name: 'Garde Manger & Raw Bar', lead: 'Chef Mei-Ling', prepStatus: 'Chilled Prep Ready', temp: 'Walk-in 2°C' },
                    { name: 'Bespoke Pastry Laboratory', lead: 'Chef Valerie', prepStatus: 'Confections Proofing', temp: 'Ambient 19°C' },
                  ].map((s) => (
                    <div key={s.name} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white">{s.name}</span>
                        <span className="text-[9px] font-mono text-emerald-400 uppercase bg-emerald-500/10 px-1 py-0.5 rounded">{s.prepStatus}</span>
                      </div>
                      <p className="text-xs text-zinc-300 font-mono">Lead: {s.lead} · {s.temp}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
                    <h4 className="text-xs font-mono text-zinc-300 uppercase tracking-widest">Master Capstone Specifications</h4>
                    {[
                      { label: 'Product Role', value: 'Phase 1 Milestone Capstone (Product #50 of 50)' },
                      { label: 'Chef Passkey', value: 'culinary2026' },
                      { label: 'Live Showcase', value: 'culinary-workspace-os.onrender.com' },
                      { label: 'Phase 1 Completion', value: '50 / 50 Flagships (100% MASTERED)' },
                      { label: 'Agency Vault Value', value: '$2,999 Whitelabel License (50 Apps Included)' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center py-2 border-b border-zinc-800/60 last:border-0">
                        <span className="text-xs text-zinc-300 font-mono uppercase">{label}</span>
                        <span className="text-xs text-amber-300 font-mono font-bold">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300 font-mono text-center font-bold">
                    👑 50-ASSET CENTURY MILESTONE UNLOCKED — 100% PHASE 1 MASTERY COMPLETE
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
