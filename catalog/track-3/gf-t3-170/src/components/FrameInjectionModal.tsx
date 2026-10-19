import React, { useState } from 'react';
import { X, Zap, ShieldAlert, CheckCircle2, AlertTriangle, Play } from 'lucide-react';
import { Overland_QUIETUDE_ECUS, generateRandomFrame } from '../utils/cryptoSim';
import { CanFdFrame } from '../types/telemetry';

interface FrameInjectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectBurst: (frames: CanFdFrame[]) => void;
  currentSequence: number;
}

export const FrameInjectionModal: React.FC<FrameInjectionModalProps> = ({
  isOpen,
  onClose,
  onInjectBurst,
  currentSequence,
}) => {
  const [burstSize, setBurstSize] = useState<number>(10);
  const [attackVector, setAttackVector] = useState<'NONE' | 'BURST_REPLAY' | 'FORGED_SIGNATURE'>('NONE');

  if (!isOpen) return null;

  const handleExecuteBurst = () => {
    const burst: CanFdFrame[] = [];
    let seq = currentSequence;

    for (let i = 0; i < burstSize; i++) {
      seq += 1;
      let forceStatus: CanFdFrame['status'] | undefined = undefined;

      if (attackVector === 'BURST_REPLAY' && i % 3 === 0) {
        // inject duplicated previous sequence
        seq -= 2;
        forceStatus = 'REPLAY_REJECTED';
      } else if (attackVector === 'FORGED_SIGNATURE' && i % 4 === 0) {
        forceStatus = 'SIGNATURE_FORGED';
      }

      burst.push(generateRandomFrame(seq, forceStatus));
    }

    onInjectBurst(burst);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-xl border border-neutral-700 bg-neutral-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400 fill-current" />
            <h3 className="text-xl font-bold text-neutral-100">
              Inject CAN-FD High-Speed Frame Stream
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 my-6">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Batch Ingestion Size (Frames)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 25].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setBurstSize(count)}
                  className={`py-2 px-3 rounded-md text-sm font-semibold border cursor-pointer transition-colors ${
                    burstSize === count
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                      : 'border-neutral-700 bg-neutral-950 text-neutral-300 hover:border-neutral-600'
                  }`}
                >
                  {count} Frames
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Simulated Adversarial Injection Vector
            </label>
            <select
              value={attackVector}
              onChange={(e) => setAttackVector(e.target.value as any)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="NONE">Nominal Traffic (100% Ed25519 Verified)</option>
              <option value="BURST_REPLAY">Intermittent Replay Attacks (Duplicate Nonces)</option>
              <option value="FORGED_SIGNATURE">Signature Forgery Vectors (Malformed Signatures)</option>
            </select>
          </div>

          <div className="rounded-lg bg-neutral-950 p-3.5 border border-neutral-800 text-sm text-neutral-400 space-y-1">
            <div className="flex justify-between">
              <span>Bus Rate:</span>
              <span className="font-mono text-neutral-200">5000 kbps CAN-FD Data</span>
            </div>
            <div className="flex justify-between">
              <span>Security Element:</span>
              <span className="font-mono text-emerald-400">ATECC608B Hardware Nonce</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Ingestion Latency:</span>
              <span className="font-mono text-amber-400">1.1 ms / frame</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="rounded-lg bg-neutral-800 hover:bg-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteBurst}
            className="flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2 text-sm font-bold text-neutral-950 transition-colors cursor-pointer shadow-md"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Inject {burstSize} Frames Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
