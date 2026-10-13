import React, { useState } from 'react';
import { 
  X, 
  KeyRound, 
  CheckCircle2, 
  Fingerprint, 
  ShieldAlert, 
  Lock, 
  FileCheck2, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { MultiSigState, UserRole } from '../../types/engine';
import { computeSha256 } from '../../utils/crypto';

interface MultiSigModalProps {
  isOpen: boolean;
  onClose: () => void;
  multiSigState: MultiSigState;
  onSignKey: (role: 'SELLER' | 'BUYER', keyHash: string) => void;
  currentRole: UserRole;
}

export const MultiSigModal: React.FC<MultiSigModalProps> = ({
  isOpen,
  onClose,
  multiSigState,
  onSignKey,
  currentRole,
}) => {
  const [signingRole, setSigningRole] = useState<'SELLER' | 'BUYER'>(
    currentRole === 'BUYER_ESCROW' ? 'BUYER' : 'SELLER'
  );
  const [passkeyInput, setPasskeyInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [biometricScanning, setBiometricScanning] = useState(false);

  if (!isOpen) return null;

  const handleSign = async () => {
    setIsProcessing(true);
    const keySeed = passkeyInput || `KEY_${signingRole}_${Date.now()}`;
    const hash = await computeSha256(keySeed);
    setTimeout(() => {
      onSignKey(signingRole, '0x' + hash.substring(0, 32));
      setIsProcessing(false);
      setPasskeyInput('');
    }, 600);
  };

  const handleBiometricAuth = () => {
    setBiometricScanning(true);
    setTimeout(async () => {
      setBiometricScanning(false);
      const bioHash = await computeSha256(`FIDO2_PASSKEY_${signingRole}_BIOMETRIC_${Date.now()}`);
      onSignKey(signingRole, '0xBIO_' + bioHash.substring(0, 28));
    }, 1200);
  };

  const isFullyVaulted = multiSigState.escrowStatus === 'FULLY_EXECUTED_VAULTED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col font-mono">
        {/* Header */}
        <div className="bg-zinc-950 px-6 py-4.5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KeyRound className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                Dual-Factor Cryptographic Authorization
              </h3>
              <p className="text-sm text-zinc-400">
                Acquire.com Micro-APA Buyout Vault // Escrow Binding
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Multi-Sig Modal"
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-6 text-base">
          {/* Milestone Status */}
          <div className={`p-5 rounded-2xl border flex items-center justify-between ${
            isFullyVaulted
              ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200'
              : 'bg-zinc-950 border-zinc-800 text-zinc-200'
          }`}>
            <div className="flex items-center gap-4">
              <FileCheck2 className={`w-8 h-8 ${isFullyVaulted ? 'text-emerald-400' : 'text-amber-400'}`} />
              <div>
                <div className="font-black text-lg sm:text-xl text-white">
                  {isFullyVaulted ? 'ASSET PURCHASE AGREEMENT 100% SEALED' : 'AWAITING MUTUAL CRYPTOGRAPHIC SIGNING'}
                </div>
                <div className="text-base text-zinc-400 mt-1">
                  Micro-APA Escrow Buyout: $45,000 USD | Asset ID: GF-T3-167
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className={`px-3.5 py-1.5 rounded-xl text-sm font-black border ${
                isFullyVaulted
                  ? 'bg-emerald-900/70 border-emerald-500 text-emerald-300'
                  : 'bg-amber-950 border-amber-500/50 text-amber-300'
              }`}>
                {isFullyVaulted ? 'VAULT SEALED (2/2)' : 'PENDING (1/2)'}
              </span>
            </div>
          </div>

          {/* Keyholder Status Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Keyholder 1 */}
            <div className={`p-5 rounded-2xl border ${
              multiSigState.sellerSigned
                ? 'bg-emerald-950/30 border-emerald-500/50'
                : 'bg-zinc-950 border-zinc-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-zinc-300 uppercase">Key 1: Seller Architect</span>
                {multiSigState.sellerSigned ? (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-400 font-black">
                    <CheckCircle2 className="w-4.5 h-4.5" /> SIGNED
                  </span>
                ) : (
                  <span className="text-sm text-zinc-500 font-bold">PENDING</span>
                )}
              </div>
              <div className="text-base sm:text-lg text-zinc-100 font-bold truncate">
                Ghost FactoryOS Founding Engineer
              </div>
              <div className="text-sm text-zinc-400 mt-2 truncate font-mono">
                {multiSigState.sellerKeyHash ?? 'No signature registered'}
              </div>
            </div>

            {/* Keyholder 2 */}
            <div className={`p-5 rounded-2xl border ${
              multiSigState.buyerSigned
                ? 'bg-emerald-950/30 border-emerald-500/50'
                : 'bg-zinc-950 border-zinc-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-zinc-300 uppercase">Key 2: Acquire.com Escrow</span>
                {multiSigState.buyerSigned ? (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-400 font-black">
                    <CheckCircle2 className="w-4.5 h-4.5" /> SIGNED
                  </span>
                ) : (
                  <span className="text-sm text-amber-400 font-black animate-pulse">AWAITING</span>
                )}
              </div>
              <div className="text-base sm:text-lg text-zinc-100 font-bold truncate">
                Acquire.com Authorized Escrow Officer
              </div>
              <div className="text-sm text-zinc-400 mt-2 truncate font-mono">
                {multiSigState.buyerKeyHash ?? 'No signature registered'}
              </div>
            </div>
          </div>

          {/* Interactive Signing Box (if not both signed) */}
          {!isFullyVaulted ? (
            <div className="bg-zinc-950 p-6 sm:p-7 rounded-2xl border border-zinc-800 space-y-5">
              <div className="text-base font-black uppercase tracking-wider text-zinc-200 flex items-center justify-between">
                <span>Sign as Authorized Keyholder</span>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSigningRole('SELLER')}
                    className={`px-3.5 py-1.5 rounded-xl text-sm font-bold ${
                      signingRole === 'SELLER'
                        ? 'bg-amber-500 text-black'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Seller Architect
                  </button>
                  <button
                    type="button"
                    onClick={() => setSigningRole('BUYER')}
                    className={`px-3.5 py-1.5 rounded-xl text-sm font-bold ${
                      signingRole === 'BUYER'
                        ? 'bg-amber-500 text-black'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Buyer Escrow
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                  Private Signing Passphrase / Hardware Seed:
                </label>
                <input
                  type="password"
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  placeholder="Enter HSM Passphrase (or leave blank to auto-generate)"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4.5 py-3.5 text-base text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <button
                  type="button"
                  onClick={handleBiometricAuth}
                  disabled={biometricScanning || isProcessing}
                  className="py-3.5 px-4 rounded-xl border border-purple-500/50 bg-purple-950/40 hover:bg-purple-900/40 text-purple-200 font-bold text-base flex items-center justify-center gap-2.5 transition-all"
                >
                  <Fingerprint className={`w-5 h-5 ${biometricScanning ? 'animate-bounce text-purple-400' : ''}`} />
                  <span>{biometricScanning ? 'Scanning...' : 'Touch ID / Biometric'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSign}
                  disabled={isProcessing}
                  className="py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-95"
                >
                  <Lock className="w-5 h-5" />
                  <span>{isProcessing ? 'Generating...' : `Sign as ${signingRole}`}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-emerald-950/50 border border-emerald-500/70 rounded-2xl text-center space-y-3">
              <Sparkles className="w-10 h-10 text-emerald-400 mx-auto" />
              <div className="font-black text-xl text-emerald-300">
                Asset Buyout Ready for Wire Release
              </div>
              <p className="text-base text-emerald-200/90 max-w-lg mx-auto leading-relaxed">
                Both cryptographic signatures are permanently stamped. Turnkey GitHub repositories, Cloud Run service credentials, and master cryptographic seeds are released to the buyer.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-zinc-950 px-6 py-4.5 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold uppercase transition-colors"
          >
            Close Authorization Panel
          </button>
        </div>
      </div>
    </div>
  );
};
