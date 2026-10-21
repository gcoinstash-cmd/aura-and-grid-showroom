import React, { useState } from 'react';
import { Shield, Key, CheckCircle, Sparkles, X } from 'lucide-react';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPortalModal({ isOpen, onClose }: AdminPortalModalProps) {
  const [passkey, setPasskey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkey.trim().toLowerCase() === 'architect2026') {
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  const handleQuickFill = () => {
    setPasskey('architect2026');
    setIsAuthenticated(true);
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#0F1015] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-100 font-mono">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!isAuthenticated ? (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-light tracking-tight text-white font-sans">Offer Architect Studio Portal</h3>
                <p className="text-base text-zinc-200 leading-relaxed">High-Ticket Contract & Asset Governance</p>
              </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Studio Architect Passkey
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-3 text-slate-300" />
                  <input
                    type="password"
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    placeholder="Enter passkey..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-400 mt-2">Invalid passkey. Try: architect2026</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-all"
                >
                  Verify Access
                </button>
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="px-5 py-3 min-h-[44px].5 bg-slate-900 hover:bg-slate-800 border border-indigo-500/30 text-indigo-400 text-base font-semibold min-h-[44px] rounded-xl transition-all"
                >
                  ⚡ Auto-Fill Demo Passkey
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-emerald-400 border-b border-slate-800 pb-4">
              <CheckCircle className="w-6 h-6" />
              <div>
                <h4 className="text-base font-medium text-white font-sans">Principal Architect Authenticated</h4>
                <p className="text-base text-zinc-200 leading-relaxed">Passkey: architect2026 • Clearance: Agency Founder</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left text-xs">
              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                <span className="text-slate-300 block uppercase">Productized Assets</span>
                <span className="text-slate-100 font-semibold text-sm">18 Blueprints</span>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                <span className="text-slate-300 block uppercase">VIP Funnel Retainers</span>
                <span className="text-indigo-400 font-semibold text-sm">$3,500/mo Active</span>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                <span className="text-slate-300 block uppercase">Pipeline Value</span>
                <span className="text-emerald-400 font-semibold text-sm">$42,000 ARR</span>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                <span className="text-slate-300 block uppercase">RLS Security</span>
                <span className="text-emerald-400 font-semibold text-sm">ACTIVE</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsAuthenticated(false);
                setPasskey('');
                onClose();
              }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs uppercase tracking-wider transition-colors"
            >
              Exit Architect Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
