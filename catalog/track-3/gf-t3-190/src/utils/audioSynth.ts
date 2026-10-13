// Web Audio API Synthesizer for Virtual Manual Transmission sound design
// Pure synthesized audio - zero external audio asset dependencies

class EngineAudioSynth {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isRunning: boolean = false;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  public start() {
    if (this.isRunning || this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.osc = this.ctx.createOscillator();
      this.subOsc = this.ctx.createOscillator();
      this.gainNode = this.ctx.createGain();

      this.osc.type = 'sawtooth';
      this.subOsc.type = 'triangle';

      this.osc.frequency.setValueAtTime(65, this.ctx.currentTime);
      this.subOsc.frequency.setValueAtTime(32.5, this.ctx.currentTime);

      this.gainNode.gain.setValueAtTime(0.04, this.ctx.currentTime);

      this.osc.connect(this.gainNode);
      this.subOsc.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      this.osc.start();
      this.subOsc.start();
      this.isRunning = true;
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public stop() {
    if (!this.isRunning) return;
    try {
      if (this.osc) {
        this.osc.stop();
        this.osc.disconnect();
      }
      if (this.subOsc) {
        this.subOsc.stop();
        this.subOsc.disconnect();
      }
      this.isRunning = false;
    } catch {
      // Clean up silently
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stop();
    } else {
      this.start();
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public updateRpm(rpm: number, isStalled: boolean) {
    if (!this.isRunning || !this.ctx || this.isMuted || isStalled) {
      if (isStalled && this.isRunning) {
        this.stop();
      }
      return;
    }

    // Map 800 - 11000 RPM to 55Hz - 420Hz fundamental
    const baseFreq = 50 + (rpm / 11000) * 360;
    const now = this.ctx.currentTime;
    if (this.osc && this.subOsc) {
      this.osc.frequency.setTargetAtTime(baseFreq, now, 0.05);
      this.subOsc.frequency.setTargetAtTime(baseFreq / 2, now, 0.05);
    }
  }

  public playShiftPop() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      // Quick synthetic exhaust crackle / torque cut thud
      const now = this.ctx.currentTime;
      const popOsc = this.ctx.createOscillator();
      const popGain = this.ctx.createGain();

      popOsc.type = 'square';
      popOsc.frequency.setValueAtTime(140, now);
      popOsc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

      popGain.gain.setValueAtTime(0.12, now);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      popOsc.connect(popGain);
      popGain.connect(this.ctx.destination);

      popOsc.start(now);
      popOsc.stop(now + 0.08);
    } catch {
      // Silence fallback
    }
  }

  public playStallAlarm() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(350, now + 0.1);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Silence fallback
    }
  }
}

export const audioSynth = new EngineAudioSynth();
