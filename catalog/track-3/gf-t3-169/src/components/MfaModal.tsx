import React, { useState } from 'react';
import { X, ShieldCheck, Key, Lock, Check } from 'lucide-react';
import { UserRole } from '../types';

interface MfaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  isMfaVerified: boolean;
  onVerifyMfa: () => void;
}

export const MfaModal: React.FC<MfaModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  isMfaVerified,
  onVerifyMfa,
}) => {
  const [code, setCode] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVerifyMfa();
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
        <div className="flex items-start justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-slate-400 font-semibold text-sm">Hardware Security Enforcement</span>
            </div>
            <h3 className="text-xl font-bold text-slate-100">Multi-Factor Authentication (MFA)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm">
            <span className="text-slate-400 block mb-1">Active RBAC Session:</span>
            <span className="text-emerald-400 font-bold">{currentRole.replace(/_/g, ' ')}</span>
          </div>

          {isMfaVerified ? (
            <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-700 text-center space-y-2">
              <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
              <div className="text-emerald-300 font-bold text-base">MFA Hardware Token Verified</div>
              <p className="text-slate-300 text-sm">
                Cryptographic session valid for 8 hours with full administrative vault access.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-slate-300 text-sm">
                Enter your 6-digit Time-Based One-Time Password (TOTP) hardware security code:
              </p>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="847 291"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full text-center text-2xl font-mono tracking-widest px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  autoFocus
                />
                <span className="text-slate-500 text-sm block mt-1 text-center">
                  Simulation code: enter any 6 digits (e.g. 123456)
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition-all cursor-pointer shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2"
              >
                {success ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>MFA Token Verified!</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Verify Security Token</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
