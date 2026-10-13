/**
 * 1LR-GUE V10 Yamaha Acoustic Resonance Audio Synthesizer
 * Uses Web Audio API to model the even-firing 72-degree V10 acoustic signature.
 * Fundamental firing frequency f0 = (RPM * 10) / 120 = RPM / 12 Hz.
 * Incorporates 2nd, 3rd, and 5th harmonics with Yamaha surge tank Helmholtz resonance filter.
 */

class V10AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private masterGain: GainNode | null = null;
  private oscFundamental: OscillatorNode | null = null;
  private oscHarmonic2: OscillatorNode | null = null;
  private oscHarmonic3: OscillatorNode | null = null;
  private oscHarmonic5: OscillatorNode | null = null;
  private resonanceFilter: BiquadFilterNode | null = null;

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();
  }

  public start() {
    this.init();
    if (!this.ctx || this.isRunning) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.12, now + 0.1);

    // Yamaha surge tank Helmholtz acoustic chamber bandpass filter
    this.resonanceFilter = this.ctx.createBiquadFilter();
    this.resonanceFilter.type = 'bandpass';
    this.resonanceFilter.frequency.setValueAtTime(820, now);
    this.resonanceFilter.Q.setValueAtTime(3.8, now);

    // Fundamental F1 tone: sawtooth wave
    this.oscFundamental = this.ctx.createOscillator();
    this.oscFundamental.type = 'sawtooth';
    this.oscFundamental.frequency.setValueAtTime(80, now);

    // 2nd Harmonic: triangle wave for rich mid-body
    this.oscHarmonic2 = this.ctx.createOscillator();
    this.oscHarmonic2.type = 'triangle';
    this.oscHarmonic2.frequency.setValueAtTime(160, now);

    // 3rd Harmonic: pulse/saw for the high titanium exhaust wail
    this.oscHarmonic3 = this.ctx.createOscillator();
    this.oscHarmonic3.type = 'sawtooth';
    this.oscHarmonic3.frequency.setValueAtTime(240, now);

    // 5th Harmonic: Yamaha overtone
    this.oscHarmonic5 = this.ctx.createOscillator();
    this.oscHarmonic5.type = 'sine';
    this.oscHarmonic5.frequency.setValueAtTime(400, now);

    const gainH2 = this.ctx.createGain();
    gainH2.gain.value = 0.55;

    const gainH3 = this.ctx.createGain();
    gainH3.gain.value = 0.75;

    const gainH5 = this.ctx.createGain();
    gainH5.gain.value = 0.35;

    this.oscFundamental.connect(this.resonanceFilter);
    this.oscHarmonic2.connect(gainH2);
    gainH2.connect(this.resonanceFilter);

    this.oscHarmonic3.connect(gainH3);
    gainH3.connect(this.resonanceFilter);

    this.oscHarmonic5.connect(gainH5);
    gainH5.connect(this.resonanceFilter);

    this.resonanceFilter.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.oscFundamental.start();
    this.oscHarmonic2.start();
    this.oscHarmonic3.start();
    this.oscHarmonic5.start();

    this.isRunning = true;
  }

  public updateRPM(rpm: number) {
    if (!this.ctx || !this.isRunning) return;
    const now = this.ctx.currentTime;
    // Fundamental firing frequency: RPM / 12
    const f0 = Math.max(40, rpm / 12);
    const timeConstant = 0.04;

    this.oscFundamental?.frequency.setTargetAtTime(f0, now, timeConstant);
    this.oscHarmonic2?.frequency.setTargetAtTime(f0 * 2, now, timeConstant);
    this.oscHarmonic3?.frequency.setTargetAtTime(f0 * 3, now, timeConstant);
    this.oscHarmonic5?.frequency.setTargetAtTime(f0 * 5, now, timeConstant);

    // Yamaha surge tank secondary acoustics track engine load
    const filterFreq = Math.min(3600, 350 + (rpm / 9000) * 1850);
    this.resonanceFilter?.frequency.setTargetAtTime(filterFreq, now, timeConstant);
  }

  public triggerShiftBlip(newRpm: number) {
    if (!this.ctx || !this.isRunning || !this.masterGain) return;
    const now = this.ctx.currentTime;
    // 150ms ASG shift: brief throttle cut, blip down or up
    this.masterGain.gain.setValueAtTime(0.02, now);
    this.masterGain.gain.setValueAtTime(0.18, now + 0.05);
    this.masterGain.gain.setValueAtTime(0.12, now + 0.15);
    this.updateRPM(newRpm);
  }

  public stop() {
    if (!this.ctx || !this.isRunning) return;
    const now = this.ctx.currentTime;
    if (this.masterGain) {
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    }
    setTimeout(() => {
      try {
        this.oscFundamental?.stop();
        this.oscHarmonic2?.stop();
        this.oscHarmonic3?.stop();
        this.oscHarmonic5?.stop();
        this.oscFundamental?.disconnect();
        this.oscHarmonic2?.disconnect();
        this.oscHarmonic3?.disconnect();
        this.oscHarmonic5?.disconnect();
        this.resonanceFilter?.disconnect();
        this.masterGain?.disconnect();
      } catch {
        // Safe disconnect
      }
      this.isRunning = false;
    }, 100);
  }

  public getActive(): boolean {
    return this.isRunning;
  }
}

export const v10Synth = new V10AudioSynthesizer();
