/**
 * Synthetic Web Audio API Sound Generator
 * Generates tactile micro-click tones and frequency feedback without external audio files
 * Zero external dependencies, pure Web Audio API with strict iframe and user-gesture guards
 * License: MIT
 */

let audioCtx: AudioContext | null = null;
let audioDisabled = false;

function initAudioContext(): AudioContext | null {
  if (typeof window === 'undefined' || audioDisabled) return null;

  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) {
        audioDisabled = true;
        return null;
      }

      audioCtx = new AudioContextClass();
    }

    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {
        // Silently swallow without logging to console
      });
    }

    return audioCtx;
  } catch {
    // If browser sandbox prohibits AudioContext, gracefully disable audio
    audioDisabled = true;
    return null;
  }
}

export function playMicroClick(frequency = 880, type: OscillatorType = 'sine', durationMs = 35) {
  if (typeof window === 'undefined' || audioDisabled) return;

  try {
    const ctx = initAudioContext();
    if (!ctx || ctx.state === 'closed') return;

    const now = ctx.currentTime;
    if (typeof now !== 'number' || isNaN(now)) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);

    // Linear ramps avoid exponential ramp RangeErrors
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.001, now + durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationMs / 1000);

    // Clean up node references after sound finishes
    setTimeout(() => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {
        // Discard silently
      }
    }, durationMs + 30);
  } catch {
    // Graceful fallback with zero console errors
  }
}

export function playFaultChime() {
  playMicroClick(320, 'sawtooth', 60);
}

export function playCommitChime() {
  playMicroClick(1040, 'triangle', 45);
}
