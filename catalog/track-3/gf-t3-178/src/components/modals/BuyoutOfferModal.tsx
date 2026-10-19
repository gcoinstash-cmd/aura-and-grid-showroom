import React, { useState, useEffect } from 'react';
import { X, DollarSign, CheckCircle2, ShieldCheck, Mail, Building2, User, Send } from 'lucide-react';

interface TransferOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportSpec: () => void;
}

export const TransferOfferModal: React.FC<TransferOfferModalProps> = ({
  isOpen,
  onClose,
  onExportSpec,
}) => {
  const [tier, setTier] = useState<'micro' | 'enterprise'>('micro');
  const [submitted, setSubmitted] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerCompany, setBuyerCompany] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 text-slate-100 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-right close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close Modal"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800 pr-10">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              Acquire.com Institutional Asset Transfer Portal
            </h3>
            <p className="text-sm text-slate-300">
              GF-T3-178 (Heavy Overland Dynamics Platform LS 500 Executive AWD Flagship Core) Escrow LOI
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h4 className="text-2xl font-bold text-white">
              Asset Transfer Term Sheet Dispatched to Escrow
            </h4>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              Your Letter of Intent for{' '}
              <strong className="text-amber-400">
                {tier === 'micro' ? '20 kHz (0.48ms) (Turnkey Micro-APA)' : 'PostgreSQL 16 + RLS (Enterprise Vault)'}
              </strong>{' '}
              has been generated with full clean-room IP assignments.
            </p>
            <div className="pt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={onExportSpec}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Download Master SPEC.md
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Return to Cockpit
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Tier Selector */}
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => setTier('micro')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  tier === 'micro'
                    ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-sm font-semibold text-slate-400">MICRO-APA ASSET TRANSFER</div>
                <div className="text-2xl font-extrabold text-white font-mono mt-1">20 kHz (0.48ms)</div>
                <div className="text-sm text-slate-300 mt-1">Turnkey Code &amp; Docker Container</div>
              </div>

              <div
                onClick={() => setTier('enterprise')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  tier === 'enterprise'
                    ? 'bg-cyan-500/10 border-cyan-500/60 ring-1 ring-cyan-500'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-sm font-semibold text-slate-400">MONOPOLY ENTERPRISE</div>
                <div className="text-2xl font-extrabold text-white font-mono mt-1">PostgreSQL 16 + RLS</div>
                <div className="text-sm text-slate-300 mt-1">Multi-Chassis Firmware &amp; OEM Rights</div>
              </div>
            </div>

            {/* Buyer Contact Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Acquiring Representative Name</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jonathan Vance"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>Corporate Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jvance@acquisitions-syndicate.com"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>Acquiring Entity / PE Syndicate</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Mobility Capital Partners LLC"
                  value={buyerCompany}
                  onChange={(e) => setBuyerCompany(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Escrow terms reassurance */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3 text-sm text-slate-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                Standard Acquire.com Escrow: Funds held in Escrow.com with a 5-day inspection period. Zero seller liens.
              </span>
            </div>

            {/* Submit button */}
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <Send className="w-4 h-4" />
                <span>Submit Acquisition Term Sheet</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
