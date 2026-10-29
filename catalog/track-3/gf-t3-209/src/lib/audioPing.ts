/**
 * GF-T3-209: Web Audio Synthetic Feedback
 * Generates low-frequency institutional acoustic feedback for simulation & stress shocks.
 * Completely self-contained, zero external network requests, zero dollar gate compliance.
 */

export function playSyntheticPing(frequency: number = 240, duration: number = 0.15): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(70, frequency * 0.45), ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio context exceptions in restricted environments
  }
}
