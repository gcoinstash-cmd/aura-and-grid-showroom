/**
 * 1LR-GUE 4.8L V10 Yamaha Acoustic Synthesizer
 * Synthesizes the authentic 10-cylinder firing frequency and surge tank acoustic resonance
 * Firing frequency: (RPM / 60) * (10 / 2) = RPM / 12 Hz.
 * Yamaha resonance chamber: 750 Hz fundamental at 9,000 RPM with 1.5 kHz & 2.25 kHz acoustic harmonics.
 */

class LFASoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private osc3: OscillatorNode | null = null;
  private valveNoise: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private isPlaying = false;
  private muted = false;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.28, this.ctx.currentTime, 0.05);
    }
    return this.muted;
  }

  public getIsMuted(): boolean {
    return this.muted;
  }

  public start() {
    this.init();
    if (this.isPlaying || !this.ctx) return;

    try {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.01, this.ctx.currentTime);
      this.masterGain.gain.exponentialRampToValueAtTime(this.muted ? 0 : 0.28, this.ctx.currentTime + 0.1);

      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'bandpass';
      this.filter.frequency.setValueAtTime(750, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(4.5, this.ctx.currentTime);

      // Fundamental cylinder firing pulse (sawtooth for aggressive V10 growl)
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'sawtooth';
      this.osc1.frequency.setValueAtTime(950 / 12, this.ctx.currentTime);

      // Yamaha dual surge tank resonance (triangle with 2x harmonic)
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'triangle';
      this.osc2.frequency.setValueAtTime((950 / 12) * 2, this.ctx.currentTime);

      // Titanium valve train harmonic (sine 3x)
      this.osc3 = this.ctx.createOscillator();
      this.osc3.type = 'sine';
      this.osc3.frequency.setValueAtTime((950 / 12) * 3, this.ctx.currentTime);

      const gain1 = this.ctx.createGain();
      gain1.gain.value = 0.6;
      const gain2 = this.ctx.createGain();
      gain2.gain.value = 0.35;
      const gain3 = this.ctx.createGain();
      gain3.gain.value = 0.25;

      this.osc1.connect(gain1);
      this.osc2.connect(gain2);
      this.osc3.connect(gain3);

      gain1.connect(this.filter);
      gain2.connect(this.filter);
      gain3.connect(this.masterGain); // pass high harmonics through directly

      this.filter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.osc1.start();
      this.osc2.start();
      this.osc3.start();
      this.isPlaying = true;
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public updateRpm(rpm: number) {
    if (!this.isPlaying || !this.ctx) return;

    const baseFreq = Math.max(35, rpm / 12);
    const now = this.ctx.currentTime;

    try {
      this.osc1?.frequency.setTargetAtTime(baseFreq, now, 0.02);
      this.osc2?.frequency.setTargetAtTime(baseFreq * 2, now, 0.02);
      this.osc3?.frequency.setTargetAtTime(baseFreq * 3, now, 0.02);

      // Filter sweeps upwards from 400Hz to 2400Hz as RPM rises towards 9,000
      const filterFreq = 400 + (rpm / 9000) * 2200;
      this.filter?.frequency.setTargetAtTime(filterFreq, now, 0.02);
    } catch {
      // Ignore audio parameter errors
    }
  }

  public stop() {
    if (!this.isPlaying || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.masterGain?.gain.setTargetAtTime(0, now, 0.08);
      setTimeout(() => {
        try {
          this.osc1?.stop();
          this.osc2?.stop();
          this.osc3?.stop();
          this.osc1?.disconnect();
          this.osc2?.disconnect();
          this.osc3?.disconnect();
        } catch {}
        this.isPlaying = false;
      }, 100);
    } catch {
      this.isPlaying = false;
    }
  }

  public isRunning(): boolean {
    return this.isPlaying;
  }
}

export const lfaSound = new LFASoundEngine();
