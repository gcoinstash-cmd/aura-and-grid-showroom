/**
 * Web Audio API synthesizer for the Lexus 2UR-GSE 5.0L Naturally Aspirated V8
 * Simulates cross-plane crankshaft firing order (1-8-7-3-6-5-4-2) and
 * high-frequency Helmholtz acoustic intake runner resonance above 3,600 RPM.
 */

class V8AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private masterGain: GainNode | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private osc3: OscillatorNode | null = null;
  private helmholtzFilter: BiquadFilterNode | null = null;
  private helmholtzGain: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();
  }

  public start() {
    if (!this.ctx) this.init();
    if (!this.ctx || this.isPlaying) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.12, t);
    this.masterGain.connect(this.ctx.destination);

    // Primary fundamental V8 firing frequency
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = 'sawtooth';

    // Sub-harmonic cylinder rumble
    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = 'triangle';

    // Cross-plane pulse harmonic
    this.osc3 = this.ctx.createOscillator();
    this.osc3.type = 'sine';

    // Helmholtz intake resonance bandpass filter (~2,500 Hz high frequency surge)
    this.helmholtzFilter = this.ctx.createBiquadFilter();
    this.helmholtzFilter.type = 'bandpass';
    this.helmholtzFilter.frequency.setValueAtTime(2500, t);
    this.helmholtzFilter.Q.setValueAtTime(4.5, t);

    this.helmholtzGain = this.ctx.createGain();
    this.helmholtzGain.gain.setValueAtTime(0.0, t);

    // Intake airflow hiss
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1800, t);
    noiseFilter.Q.setValueAtTime(2.0, t);

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.setValueAtTime(0.015, t);

    this.noiseNode.connect(noiseFilter);
    noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);

    // Interconnect oscillators
    const oscMix = this.ctx.createGain();
    oscMix.gain.setValueAtTime(0.7, t);

    this.osc1.connect(oscMix);
    this.osc2.connect(oscMix);
    this.osc3.connect(oscMix);

    oscMix.connect(this.masterGain);

    // Branch into Helmholtz resonator
    oscMix.connect(this.helmholtzFilter);
    this.helmholtzFilter.connect(this.helmholtzGain);
    this.helmholtzGain.connect(this.masterGain);

    this.osc1.start();
    this.osc2.start();
    this.osc3.start();
    this.noiseNode.start();

    this.isPlaying = true;
    this.setRpm(1200);
  }

  public stop() {
    if (!this.isPlaying || !this.ctx) return;
    try {
      this.osc1?.stop();
      this.osc2?.stop();
      this.osc3?.stop();
      this.noiseNode?.stop();
    } catch {
      // Ignored if already stopped
    }
    this.isPlaying = false;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public setRpm(rpm: number) {
    if (!this.isPlaying || !this.ctx) return;
    const clampedRpm = Math.max(750, Math.min(7300, rpm));
    const t = this.ctx.currentTime;

    // 4-stroke V8: 4 firing events per engine revolution -> f = rpm / 15
    const fundamental = clampedRpm / 15;

    if (this.osc1) {
      this.osc1.frequency.setTargetAtTime(fundamental, t, 0.05);
    }
    if (this.osc2) {
      this.osc2.frequency.setTargetAtTime(fundamental * 0.5, t, 0.05);
    }
    if (this.osc3) {
      this.osc3.frequency.setTargetAtTime(fundamental * 2.0, t, 0.05);
    }

    // Secondary intake butterfly bypass state (> 3,600 RPM)
    const valveOpen = clampedRpm >= 3600;
    if (this.helmholtzGain) {
      const targetGain = valveOpen ? 0.35 * Math.min(1.0, (clampedRpm - 3600) / 1500) : 0.0;
      this.helmholtzGain.gain.setTargetAtTime(targetGain, t, 0.05);
    }

    if (this.noiseGain) {
      const airflowLevel = 0.01 + (clampedRpm / 7300) * 0.04;
      this.noiseGain.gain.setTargetAtTime(airflowLevel, t, 0.05);
    }
  }
}

export const v8Synth = new V8AudioSynthesizer();
