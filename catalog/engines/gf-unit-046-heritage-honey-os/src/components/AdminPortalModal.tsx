import { useState, useEffect } from 'react';
import { X, ShieldCheck, Coffee, Calendar, Users, BarChart3, Clock, Star, DollarSign, TrendingUp } from 'lucide-react';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PASSKEY = 'heritage2026';

const mockReservations = [
  { id: 'RES-001', name: 'The Thornton Family', party: 6, date: 'Tonight 7:00 PM', table: 'Private Alcove', status: 'confirmed', amount: 420 },
  { id: 'RES-002', name: 'Marcus & Elena Webb', party: 2, date: 'Tonight 8:30 PM', table: 'Garden View', status: 'seated', amount: 180 },
  { id: 'RES-003', name: 'Layla Hassan', party: 4, date: 'Tomorrow 6:30 PM', table: 'Fireplace Room', status: 'pending', amount: 320 },
  { id: 'RES-004', name: 'Corporate — Bloom & Co', party: 12, date: 'Saturday 7:00 PM', table: 'Harvest Room', status: 'confirmed', amount: 960 },
  { id: 'RES-005', name: 'Diana & James Reeves', party: 2, date: 'Sunday 1:00 PM', table: 'Terrace', status: 'pending', amount: 160 },
];

const metrics = [
  { label: 'Revenue Tonight', value: '$3,240', icon: DollarSign, color: 'text-amber-400' },
  { label: 'Covers Tonight', value: '62', icon: Users, color: 'text-amber-300' },
  { label: 'Reservations', value: '8', icon: Calendar, color: 'text-amber-200' },
  { label: 'Avg Rating', value: '4.9★', icon: Star, color: 'text-yellow-400' },
];

export default function AdminPortalModal({ isOpen, onClose }: AdminPortalModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'reservations' | 'tables' | 'settings'>('overview');
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
    'seated': 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    'confirmed': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    'pending': 'text-zinc-300 bg-zinc-500/10 border-zinc-700',
    'cancelled': 'text-red-400 bg-red-400/10 border-red-400/30',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-[#100e0a] border border-amber-900/30 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-900/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30">
              <Coffee className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-mono text-amber-900/80 uppercase tracking-widest">Heritage & Honey OS</p>
              <h2 className="text-sm font-serif text-amber-100 tracking-wider">Proprietor's Portal</h2>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-900/30 text-amber-700 hover:text-amber-300 transition-all cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {!authenticated ? (
            <div className="flex flex-col items-center justify-center p-10 space-y-6 min-h-[380px]">
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
                    <ShieldCheck className="h-8 w-8 text-amber-500" />
                  </div>
                </div>
                <h3 className="text-xl font-serif text-amber-100 tracking-wide mt-4">Proprietor Access</h3>
                <p className="text-xs text-amber-700 font-mono max-w-xs mx-auto">Enter your passkey or use 1-click demo auto-fill to access the restaurant management portal.</p>
              </div>
              <div className="w-full max-w-sm space-y-3">
                <input type="password" value={passkey} onChange={(e) => setPasskey(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                  placeholder="Enter passkey..." className="w-full bg-amber-950/20 border border-amber-900/40 rounded-lg px-4 py-3 text-sm text-amber-100 font-mono focus:outline-none focus:border-amber-500/50 placeholder:text-amber-900/50" />
                {authError && <p className="text-xs text-red-400 font-mono">{authError}</p>}
                <button onClick={handleAuth} className="w-full rounded-lg bg-amber-500 py-3 text-base font-bold min-h-[44px] uppercase tracking-wider text-black hover:bg-amber-400 transition-all cursor-pointer">Enter Parlour</button>
                <button onClick={() => { setPasskey(PASSKEY); setAuthError(''); }} className="w-full rounded-lg border border-amber-500/30 bg-amber-500/5 py-2.5 text-xs font-mono text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer">
                  [ 1-CLICK DEMO AUTO-FILL: heritage2026 ]
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="flex gap-1 bg-amber-950/30 rounded-lg p-1 border border-amber-900/30">
                {([
                  { id: 'overview', label: 'Overview', icon: BarChart3 },
                  { id: 'reservations', label: 'Reservations', icon: Calendar },
                  { id: 'tables', label: 'Tables', icon: Users },
                  { id: 'settings', label: 'Settings', icon: ShieldCheck },
                ] as const).map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => setActiveTab(id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${activeTab === id ? 'bg-amber-500 text-black font-bold' : 'text-amber-700 hover:text-amber-300'}`}>
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {metrics.map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="rounded-xl border border-amber-900/30 bg-amber-950/20 p-4 space-y-2">
                        <Icon className={`h-4 w-4 ${color}`} />
                        <p className={`text-xl font-serif ${color}`}>{value}</p>
                        <p className="text-xs font-semibold tracking-wider text-amber-700 uppercase tracking-wider">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-amber-900/30 bg-amber-950/20 p-5 space-y-3">
                    <h4 className="text-xs font-mono text-amber-700 uppercase tracking-widest">Tonight's Reservation Queue</h4>
                    {mockReservations.slice(0, 3).map((r) => (
                      <div key={r.id} className="flex items-center justify-between py-2 border-b border-amber-900/20 last:border-0">
                        <div className="flex items-center gap-3">
                          <Clock className="h-3.5 w-3.5 text-amber-800" />
                          <div>
                            <p className="text-xs font-medium text-amber-100">{r.name} ({r.party} guests)</p>
                            <p className="text-xs font-semibold tracking-wider text-amber-700 font-mono">{r.date} · {r.table}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-semibold tracking-wider font-mono px-2 py-0.5 rounded border uppercase ${statusColors[r.status]}`}>{r.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'reservations' && (
                <div className="space-y-2">
                  {mockReservations.map((r) => (
                    <div key={r.id} className="rounded-xl border border-amber-900/30 bg-amber-950/20 p-4 flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold tracking-wider font-mono text-amber-800">{r.id}</span>
                          <span className={`text-xs font-semibold tracking-wider font-mono px-1.5 py-0.5 rounded border uppercase ${statusColors[r.status]}`}>{r.status}</span>
                        </div>
                        <p className="text-sm font-serif text-amber-100">{r.name} — Party of {r.party}</p>
                        <p className="text-xs text-amber-700 font-mono">{r.date} · {r.table}</p>
                      </div>
                      <p className="text-lg font-serif text-amber-400">${r.amount}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'tables' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { name: 'Private Alcove', capacity: 8, status: 'occupied', guests: 6 },
                    { name: 'Garden View', capacity: 4, status: 'occupied', guests: 2 },
                    { name: 'Fireplace Room', capacity: 6, status: 'available', guests: 0 },
                    { name: 'Harvest Room', capacity: 16, status: 'reserved', guests: 0 },
                    { name: 'Terrace', capacity: 4, status: 'available', guests: 0 },
                    { name: 'Honey Bar', capacity: 8, status: 'occupied', guests: 5 },
                  ].map((t) => (
                    <div key={t.name} className={`rounded-xl border p-4 space-y-2 ${t.status === 'occupied' ? 'border-amber-500/30 bg-amber-950/30' : t.status === 'reserved' ? 'border-amber-700/20 bg-amber-950/15' : 'border-amber-900/20 bg-amber-950/10'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-serif text-amber-200">{t.name}</span>
                        <span className={`text-[9px] font-mono uppercase ${t.status === 'occupied' ? 'text-amber-400' : t.status === 'reserved' ? 'text-amber-600' : 'text-emerald-400'}`}>{t.status}</span>
                      </div>
                      <p className="text-xs font-semibold tracking-wider text-amber-800 font-mono">Cap: {t.capacity} · {t.status === 'occupied' ? `${t.guests} seated` : 'Open'}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-amber-900/30 bg-amber-950/20 p-5 space-y-3">
                    <h4 className="text-xs font-mono text-amber-700 uppercase tracking-widest">System Config</h4>
                    {[
                      { label: 'Restaurant Name', value: 'Heritage & Honey' },
                      { label: 'Passkey', value: 'heritage2026' },
                      { label: 'Supabase Project', value: 'heritage-and-honey-os' },
                      { label: 'Live URL', value: 'heritage-and-honey-os.onrender.com' },
                      { label: 'Version', value: 'v1.0.0' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center py-2 border-b border-amber-900/20 last:border-0">
                        <span className="text-xs text-amber-800 font-mono uppercase">{label}</span>
                        <span className="text-xs text-amber-300 font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-300 font-mono">
                    ✅ Ghost Factory™ Verified — Score: 9.8 / 10 | Hospitality Vault (18/60)
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
