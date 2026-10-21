import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  Music, 
  Calendar, 
  GlassWater, 
  Users, 
  CheckCircle2, 
  Clock, 
  X, 
  LogOut,
  Flame,
  Volume2
} from 'lucide-react';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({ isOpen, onClose }) => {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<'tables' | 'lineup' | 'bottle'>('tables');

  const [tables, setTables] = useState([
    { id: 'TBL-VIP1', guest: 'Julian Mercer', time: '9:30 PM Tonight', party: 6, section: 'Balcony Mezzanine', spendCommitment: '$1,200.00', status: 'Confirmed' },
    { id: 'TBL-VIP2', guest: 'Dr. Alexis Vance', time: '10:15 PM Tonight', party: 4, section: 'Stage Front Booth', spendCommitment: '$800.00', status: 'VIP Seated' },
    { id: 'TBL-VIP3', guest: 'Derrick Holloway', time: '11:00 PM Tonight', party: 8, section: 'Green Room Alcove', spendCommitment: '$1,800.00', status: 'Confirmed' }
  ]);

  const [lineup, setLineup] = useState([
    { set: 'Set 1 (8:00 PM)', performer: 'The Marcus King Quartet', genre: 'Post-Bop & Modal Jazz', soundcheck: 'Passed (7:15 PM)', state: 'On Stage' },
    { set: 'Set 2 (10:30 PM)', performer: 'Seraphina & The High Council', genre: 'Afro-Cuban Brass & Soul', soundcheck: 'Passed (7:45 PM)', state: 'Backstage Ready' },
    { set: 'Late Night Jam (12:30 AM)', performer: 'House Trio + Special Guests', genre: 'Improv Midnight Session', soundcheck: 'Pre-Set', state: 'Queued' }
  ]);

  const [bottles, setBottles] = useState([
    { name: 'Krug Clos d\'Ambonnay Champagne', inventory: '4 bottles', tier: 'Ultra Reserve', allocation: 'Held for Table VIP1' },
    { name: 'Pappy Van Winkle 15yr Bourbon', inventory: '2 bottles', tier: 'Private Stash', allocation: 'Held for Table VIP3' },
    { name: 'Clase Azul Reposado Tequila', inventory: '9 bottles', tier: 'High Volume VIP', allocation: 'Main Bottle Bar' }
  ]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'nightlife2026') {
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  const handleOneClickFill = () => {
    setPasscode('nightlife2026');
    setIsAuthenticated(true);
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn text-stone-100 font-sans">
      <div className="relative w-full max-w-4xl bg-stone-950 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-700 to-amber-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
              <Music className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg tracking-wide font-bold text-amber-100">NOCTURNE NIGHTLIFE — VENUE COMMAND OS</h3>
                <span className="text-xs font-semibold tracking-wider uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
                  Live Dispatch
                </span>
              </div>
              <p className="text-xs text-stone-400">VIP Bottle Tables • Stage Lineup Scheduling • Acoustic Telemetry</p>
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
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
            <h4 className="text-xl font-bold font-serif text-stone-100 mb-2">Venue Director Authorization</h4>
            <p className="text-stone-400 text-sm max-w-md mb-8">
              Access restricted to nightclub operators, talent directors, and lead concierge staff.
            </p>

            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
              <div>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passkey (nightlife2026)"
                  className="w-full px-4 py-3 bg-stone-900/90 border border-stone-800 rounded-xl text-center text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono tracking-widest text-lg"
                />
                {error && (
                  <p className="text-rose-400 text-xs mt-2 font-medium">Invalid passkey. Cheat code: nightlife2026</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg transition-all text-base font-semibold min-h-[44px] tracking-widest uppercase"
                >
                  Verify Access
                </button>
                <button
                  type="button"
                  onClick={handleOneClickFill}
                  className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold rounded-xl transition-all text-base font-semibold min-h-[44px] tracking-wider flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Auto-Fill 1-Click Passkey (nightlife2026)
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
                  { id: 'tables', label: 'VIP Bottle Service', icon: GlassWater },
                  { id: 'lineup', label: 'Stage Sets & Lineup', icon: Music },
                  { id: 'bottle', label: 'Cellar Vault', icon: Flame }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isActive 
                          ? 'bg-amber-600 text-stone-950 shadow-md' 
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
                  VENUE AT PEAK
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
                  <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase tracking-widest block mb-1">Tonight's Bar & Bottle Gross</span>
                  <span className="text-xl font-bold font-mono text-stone-100">$14,250.00</span>
                  <span className="text-xs font-semibold tracking-wider text-emerald-400 block mt-1">+22% vs Last Weekend</span>
                </div>
                <div className="p-4 bg-stone-900/50 border border-stone-800 rounded-xl">
                  <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase tracking-widest block mb-1">VIP Tables Booked</span>
                  <span className="text-xl font-bold font-mono text-stone-100">8 / 8 Tables</span>
                  <span className="text-xs font-semibold tracking-wider text-purple-400 block mt-1">100% Sold Out</span>
                </div>
                <div className="p-4 bg-stone-900/50 border border-stone-800 rounded-xl">
                  <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase tracking-widest block mb-1">Live Door Headcount</span>
                  <span className="text-xl font-bold font-mono text-stone-100">188 Guests</span>
                  <span className="text-xs font-semibold tracking-wider text-amber-400 block mt-1">Capacity: 200 Max</span>
                </div>
                <div className="p-4 bg-stone-900/50 border border-stone-800 rounded-xl">
                  <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase tracking-widest block mb-1">Decibel Level</span>
                  <span className="text-xl font-bold font-mono text-stone-100">92 dB</span>
                  <span className="text-xs font-semibold tracking-wider text-emerald-400 block mt-1">Optimal Acoustic Room</span>
                </div>
              </div>

              {/* Tab 1: Tables */}
              {activeTab === 'tables' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-stone-200 uppercase tracking-wider flex items-center gap-2">
                    <GlassWater className="w-4 h-4 text-amber-500" />
                    VIP Table Bookings & Bottle Minimums
                  </h4>
                  <div className="border border-stone-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs text-stone-300">
                      <thead className="bg-stone-900/80 text-xs font-semibold tracking-wider uppercase font-bold text-stone-400 tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Table</th>
                          <th className="py-3 px-4">Primary Host</th>
                          <th className="py-3 px-4">Arrival</th>
                          <th className="py-3 px-4">Section</th>
                          <th className="py-3 px-4">Bottle Minimum</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800/60 font-mono">
                        {tables.map((t) => (
                          <tr key={t.id} className="hover:bg-stone-900/40">
                            <td className="py-3 px-4 text-amber-400 font-bold">{t.id}</td>
                            <td className="py-3 px-4 font-sans font-bold text-stone-200">{t.guest} ({t.party})</td>
                            <td className="py-3 px-4">{t.time}</td>
                            <td className="py-3 px-4 text-stone-400 font-sans">{t.section}</td>
                            <td className="py-3 px-4 text-emerald-400">{t.spendCommitment}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold tracking-wider">
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 2: Lineup */}
              {activeTab === 'lineup' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-stone-200 uppercase tracking-wider flex items-center gap-2">
                    <Music className="w-4 h-4 text-purple-400" />
                    Live Musical Ensembles & Sets
                  </h4>
                  <div className="space-y-3">
                    {lineup.map((l, idx) => (
                      <div key={idx} className="p-4 bg-stone-900/60 border border-stone-800 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-amber-400">{l.set}</span>
                            <span className="font-bold text-sm text-stone-100">{l.performer}</span>
                          </div>
                          <div className="text-xs text-stone-400 mt-1">{l.genre} • Soundcheck: {l.soundcheck}</div>
                        </div>
                        <span className="px-2.5 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-medium">
                          {l.state}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Bottles */}
              {activeTab === 'bottle' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-stone-200 uppercase tracking-wider flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500" />
                    Cellar Bottle Vault Allocations
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {bottles.map((b, idx) => (
                      <div key={idx} className="p-4 bg-stone-900/60 border border-stone-800 rounded-xl space-y-2">
                        <div className="text-xs font-bold text-stone-100">{b.name}</div>
                        <div className="text-xs text-amber-400 font-mono">Stock: {b.inventory}</div>
                        <div className="text-xs text-stone-400">{b.tier}</div>
                        <div className="pt-2 border-t border-stone-800 text-xs font-semibold text-stone-400">{b.allocation}</div>
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
