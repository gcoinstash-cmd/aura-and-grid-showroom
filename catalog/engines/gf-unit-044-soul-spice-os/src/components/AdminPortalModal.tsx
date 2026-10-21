import { useState, useEffect } from 'react';
import { X, ShieldCheck, Utensils, Calendar, Users, BarChart3, Clock, Star, DollarSign, TrendingUp } from 'lucide-react';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PASSKEY = 'soulspice2026';

const mockOrders = [
  { id: 'ORD-001', guest: 'Marcus & Elena Chen', event: 'Anniversary Dinner (8 guests)', status: 'confirmed', amount: 1240, time: '7:00 PM' },
  { id: 'ORD-002', guest: 'The Williams Family', event: 'Sunday Supper (12 guests)', status: 'in-service', amount: 1860, time: '5:30 PM' },
  { id: 'ORD-003', guest: 'Layla Hassan', event: 'Catering: Corporate Lunch (20)', status: 'pending', amount: 2400, time: 'Tomorrow 12PM' },
  { id: 'ORD-004', guest: 'Derrick Owens', event: 'Private Chef: Dinner Party (6)', status: 'completed', amount: 780, time: '2:00 PM' },
  { id: 'ORD-005', guest: 'Sofia Reyes', event: 'Weekly Meal Prep Box (4 weeks)', status: 'confirmed', amount: 560, time: 'Ongoing' },
];

const metrics = [
  { label: 'Revenue Today', value: '$6,840', icon: DollarSign, color: 'text-amber-400' },
  { label: 'Active Orders', value: '5', icon: Utensils, color: 'text-red-400' },
  { label: 'Avg Order', value: '$968', icon: TrendingUp, color: 'text-emerald-400' },
  { label: 'Satisfaction', value: '99.1%', icon: Star, color: 'text-yellow-400' },
];

export default function AdminPortalModal({ isOpen, onClose }: AdminPortalModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'menu' | 'settings'>('overview');
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
    if (passkey === PASSKEY) { setAuthenticated(true); setAuthError(''); }
    else setAuthError('Invalid passkey. Use the 1-click auto-fill below.');
  };

  if (!isOpen) return null;

  const statusColors: Record<string, string> = {
    'in-service': 'text-red-400 bg-red-400/10 border-red-400/30',
    'completed': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    'confirmed': 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    'pending': 'text-zinc-300 bg-zinc-500/10 border-zinc-700',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-[#0A0A0B] border border-zinc-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30">
              <ShieldCheck className="h-4.5 w-4.5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest">Soul & Spice OS</p>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Admin Portal</h2>
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
                    <Utensils className="h-8 w-8 text-amber-500" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white uppercase tracking-wider mt-4">Kitchen Admin Access</h3>
                <p className="text-xs text-zinc-600 font-mono max-w-xs mx-auto">Enter the admin passkey or use 1-click demo auto-fill.</p>
              </div>
              <div className="w-full max-w-sm space-y-3">
                <input type="password" value={passkey} onChange={(e) => setPasskey(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                  placeholder="Enter admin passkey..." className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-amber-500/50 placeholder:text-zinc-700" />
                {authError && <p className="text-xs text-red-400 font-mono">{authError}</p>}
                <button onClick={handleAuth} className="w-full rounded-lg bg-amber-500 py-3 text-base font-bold min-h-[44px] uppercase tracking-wider text-black hover:bg-amber-400 transition-all cursor-pointer">Unlock Portal</button>
                <button onClick={() => { setPasskey(PASSKEY); setAuthError(''); }} className="w-full rounded-lg border border-amber-500/30 bg-amber-500/5 py-2.5 text-xs font-mono text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer">
                  [ 1-CLICK DEMO AUTO-FILL: soulspice2026 ]
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="flex gap-1 bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                {([
                  { id: 'overview', label: 'Overview', icon: BarChart3 },
                  { id: 'orders', label: 'Orders', icon: Calendar },
                  { id: 'menu', label: 'Menu', icon: Utensils },
                  { id: 'settings', label: 'Settings', icon: ShieldCheck },
                ] as const).map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => setActiveTab(id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${activeTab === id ? 'bg-amber-500 text-black font-bold' : 'text-zinc-300 hover:text-zinc-300'}`}>
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
                        <p className="text-xs font-semibold tracking-wider text-zinc-600 uppercase tracking-wider">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
                    <h4 className="text-xs font-mono text-zinc-300 uppercase tracking-widest">Active Service Queue</h4>
                    {mockOrders.slice(0, 3).map((o) => (
                      <div key={o.id} className="flex items-center justify-between py-2 border-b border-zinc-800/60 last:border-0">
                        <div className="flex items-center gap-3">
                          <Clock className="h-3.5 w-3.5 text-zinc-700" />
                          <div>
                            <p className="text-xs font-medium text-zinc-200">{o.guest}</p>
                            <p className="text-xs font-semibold tracking-wider text-zinc-300 font-mono">{o.event}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-semibold tracking-wider font-mono px-2 py-0.5 rounded border uppercase ${statusColors[o.status]}`}>{o.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-2">
                  {mockOrders.map((o) => (
                    <div key={o.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold tracking-wider font-mono text-zinc-700">{o.id}</span>
                          <span className={`text-xs font-semibold tracking-wider font-mono px-1.5 py-0.5 rounded border uppercase ${statusColors[o.status]}`}>{o.status}</span>
                        </div>
                        <p className="text-sm font-medium text-zinc-200">{o.guest}</p>
                        <p className="text-xs text-zinc-300 font-mono">{o.event} · {o.time}</p>
                      </div>
                      <p className="text-lg font-bold text-amber-400 font-mono">${o.amount}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'menu' && (
                <div className="space-y-3">
                  {[
                    { cat: 'Signature Entrees', items: ['Jerk-Spiced Short Rib — $68/person', 'Oxtail Braised with Root Vegetables — $72/person', 'Blackened Snapper with Mango Salsa — $62/person'] },
                    { cat: 'Soul Sides', items: ['Collard Greens with Smoked Turkey — $18/pint', 'Cornbread Skillet — $14/loaf', 'Mac & Cheese Supreme — $22/pint'] },
                    { cat: 'Catering Packages', items: ['Weekday Feast Box (4 ppl) — $185', 'Weekend Celebration (12 ppl) — $1,200', 'Corporate Lunch (20+ ppl) — $120/head'] },
                  ].map(({ cat, items }) => (
                    <div key={cat} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
                      <h4 className="text-xs font-mono text-amber-400 uppercase tracking-widest">{cat}</h4>
                      {items.map(i => <p key={i} className="text-base text-zinc-200 leading-relaxed font-mono">· {i}</p>)}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
                    <h4 className="text-xs font-mono text-zinc-300 uppercase tracking-widest">System Config</h4>
                    {[
                      { label: 'Business Name', value: 'Soul & Spice Kitchen' },
                      { label: 'Passkey', value: 'soulspice2026' },
                      { label: 'Supabase Project', value: 'soul-and-spice-os' },
                      { label: 'Live URL', value: 'soul-and-spice-os.onrender.com' },
                      { label: 'Version', value: 'v1.0.0' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center py-2 border-b border-zinc-800/60 last:border-0">
                        <span className="text-xs text-zinc-600 font-mono uppercase">{label}</span>
                        <span className="text-xs text-zinc-300 font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-300 font-mono">
                    ✅ Ghost Factory™ Verified — Score: 9.8 / 10 | Hospitality Vault (15/60)
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
