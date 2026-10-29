import { SoundscapePreset, SoundscapePresetId } from '../types';

export const SOUNDSCAPE_PRESETS: SoundscapePreset[] = [
  {
    id: 'rain_in_space',
    name: 'Rain in Space',
    tagline: 'Hydropressure particle drizzle against hull armor',
    description: 'Synthesized stochastic pink-noise droplets filtered through dual dynamic resonant bandpasses. Calms sensory hyper-reactivity and blocks ambient distraction.',
    frequencyRange: '180Hz – 2.4kHz',
    accentColor: 'cyan',
    badge: 'HULL ACOUSTICS',
    iconName: 'CloudRain',
    recommendedState: 'High-focus flow & anxiety relief',
    noiseType: 'Filtered Pink Noise + Droplet Impulses'
  },
  {
    id: 'cyber_cafe',
    name: 'Cyber Cafe',
    tagline: 'Warm 60Hz circuit hum, tape hiss, and lofi chord pads',
    description: 'Analog circuit warmth combined with gentle, filtered minor seventh synthesizer pads and subtle electrical hum. Cozy ambient companion for late-night engineering.',
    frequencyRange: '60Hz – 850Hz',
    accentColor: 'amber',
    badge: 'WARM ANALOG',
    iconName: 'Coffee',
    recommendedState: 'Casual coding & creative problem solving',
    noiseType: 'Analog Saturation + Lofi Tri-Pads'
  },
  {
    id: 'deep_void',
    name: 'Deep Void',
    tagline: '55Hz / 58.5Hz binaural sub-harmonic drone',
    description: 'Detuned sub-bass sine and triangle oscillators with warm 110Hz low-pass filtration. Creates a 3.5Hz delta brainwave envelope for total mental grounding.',
    frequencyRange: '36Hz – 110Hz',
    accentColor: 'purple',
    badge: 'BINAURAL SUB',
    iconName: 'Sparkles',
    recommendedState: 'Deep sprint work & sensory isolation',
    noiseType: 'Detuned Sub-Oscillators (A1)'
  },
  {
    id: 'solar_wind',
    name: 'Solar Wind',
    tagline: 'Resonant bandpass LFO sweeps through quantum dust',
    description: 'Slow 0.07Hz low-frequency oscillation sweeping a high-Q resonant bandpass filter across celestial noise. Evokes the serene motion of orbital drift.',
    frequencyRange: '200Hz – 1.2kHz',
    accentColor: 'emerald',
    badge: 'LFO RESONANCE',
    iconName: 'Wind',
    recommendedState: 'Endurance tasks & long reading sessions',
    noiseType: 'Modulated Bandpass Noise'
  },
  {
    id: 'alpha_flow',
    name: 'Alpha Flow 432Hz',
    tagline: 'Harmonic 432Hz sanctuary with 8Hz alpha wave pulse',
    description: 'Acoustically tuned 432Hz fundamental paired with a 440Hz companion node producing an active 8Hz alpha binaural oscillation for executive calm.',
    frequencyRange: '108Hz – 440Hz',
    accentColor: 'blue',
    badge: 'ALPHA 8Hz',
    iconName: 'Radio',
    recommendedState: 'Executive function reset & meditation',
    noiseType: 'Harmonic Sine Resonance'
  }
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private volume = 0.25;
  private isMutedState = false;
  private muteListeners: Set<(muted: boolean) => void> = new Set();

  // Soundscape Engine State
  private currentPreset: SoundscapePresetId = 'rain_in_space';
  private soundscapeActive = false;
  private soundscapeVolume = 0.35;
  private soundscapeGain: GainNode | null = null;
  private activeSoundscapeNodes: (AudioNode | AudioBufferSourceNode)[] = [];
  private activeIntervals: number[] = [];
  private pinkNoiseBuffer: AudioBuffer | null = null;
  private soundscapeListeners: Set<(state: { active: boolean; preset: SoundscapePresetId; volume: number }) => void> = new Set();

  constructor() {
    try {
      this.isMutedState = typeof window !== 'undefined' && localStorage.getItem('titan_sfx_muted') === 'true';
    } catch {
      this.isMutedState = false;
    }

    try {
      if (typeof window !== 'undefined') {
        const savedPreset = localStorage.getItem('titan_soundscape_preset') as SoundscapePresetId;
        if (savedPreset && SOUNDSCAPE_PRESETS.some((p) => p.id === savedPreset)) {
          this.currentPreset = savedPreset;
        }
        const savedVol = localStorage.getItem('titan_soundscape_volume');
        if (savedVol) {
          const parsed = parseFloat(savedVol);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
            this.soundscapeVolume = parsed;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      const initialGain = this.isMutedState ? 0 : this.volume;
      this.masterGain.gain.setValueAtTime(initialGain, this.ctx.currentTime);

      // Create AnalyserNode for realtime frequency equalizer telemetry
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64; // Yields 32 frequency bins
      this.analyser.smoothingTimeConstant = 0.85;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public isMuted(): boolean {
    return this.isMutedState;
  }

  public isSoundMuted(): boolean {
    return this.isMutedState;
  }

  public setMuted(muted: boolean): void {
    this.isMutedState = muted;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('titan_sfx_muted', String(muted));
      }
    } catch {
      // ignore
    }

    if (this.masterGain && this.ctx) {
      const targetGain = this.isMutedState ? 0 : this.volume;
      this.masterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }

    // Notify all UI listeners
    this.muteListeners.forEach((listener) => {
      try {
        listener(this.isMutedState);
      } catch {
        // ignore
      }
    });
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMutedState);
    return this.isMutedState;
  }

  public onMuteChange(listener: (muted: boolean) => void): () => void {
    this.muteListeners.add(listener);
    return () => {
      this.muteListeners.delete(listener);
    };
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      const currentTarget = this.isMutedState ? 0 : this.volume;
      this.masterGain.gain.setValueAtTime(currentTarget, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  // --- REAL-TIME FREQUENCY EQUALIZER TELEMETRY ---
  public getFrequencyData(outputArray?: Uint8Array): Uint8Array {
    if (!this.analyser) {
      return outputArray || new Uint8Array(16);
    }
    const target = outputArray || new Uint8Array(this.analyser.frequencyBinCount);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.analyser.getByteFrequencyData(target as any);
    return target;
  }

  // --- AMBIENT SOUNDSCAPE MULTI-PRESET SYNTHESIS ENGINE ---

  public onSoundscapeChange(listener: (state: { active: boolean; preset: SoundscapePresetId; volume: number }) => void): () => void {
    this.soundscapeListeners.add(listener);
    return () => {
      this.soundscapeListeners.delete(listener);
    };
  }

  private notifySoundscapeListeners() {
    this.soundscapeListeners.forEach((listener) => {
      try {
        listener({
          active: this.soundscapeActive,
          preset: this.currentPreset,
          volume: this.soundscapeVolume
        });
      } catch {
        // ignore
      }
    });
  }

  public getSoundscapePreset(): SoundscapePresetId {
    return this.currentPreset;
  }

  public isSoundscapeActive(): boolean {
    return this.soundscapeActive;
  }

  public isAmbientActive(): boolean {
    return this.soundscapeActive;
  }

  public getSoundscapeVolume(): number {
    return this.soundscapeVolume;
  }

  public setSoundscapeVolume(vol: number) {
    this.soundscapeVolume = Math.max(0, Math.min(1, vol));
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('titan_soundscape_volume', String(this.soundscapeVolume));
      }
    } catch {
      // ignore
    }

    if (this.soundscapeGain && this.ctx) {
      this.soundscapeGain.gain.setValueAtTime(this.soundscapeVolume, this.ctx.currentTime);
    }
    this.notifySoundscapeListeners();
  }

  public setSoundscapePreset(presetId: SoundscapePresetId) {
    if (this.currentPreset === presetId && this.soundscapeActive) return;
    this.currentPreset = presetId;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('titan_soundscape_preset', presetId);
      }
    } catch {
      // ignore
    }

    if (this.soundscapeActive) {
      // Smoothly switch preset in real-time
      this.startSoundscape(presetId);
    } else {
      this.notifySoundscapeListeners();
    }
  }

  public toggleSoundscape(presetId?: SoundscapePresetId): boolean {
    this.initContext();
    if (!this.ctx || !this.masterGain) return false;

    if (presetId && presetId !== this.currentPreset) {
      this.currentPreset = presetId;
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('titan_soundscape_preset', presetId);
        }
      } catch {
        // ignore
      }
      this.startSoundscape(presetId);
      return true;
    }

    if (this.soundscapeActive) {
      this.stopSoundscape();
      return false;
    } else {
      this.startSoundscape(this.currentPreset);
      return true;
    }
  }

  public toggleAmbient(): boolean {
    return this.toggleSoundscape();
  }

  public startAmbient() {
    this.startSoundscape();
  }

  public stopAmbient() {
    this.stopSoundscape();
  }

  /** Generates or returns cached 3-second procedural pink noise buffer */
  private getPinkNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    if (this.pinkNoiseBuffer) return this.pinkNoiseBuffer;

    try {
      const bufferSize = this.ctx.sampleRate * 3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);

      // Paul Kellet filtered pink noise algorithm
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.76160 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
        b6 = white * 0.115926;
      }

      this.pinkNoiseBuffer = buffer;
      return buffer;
    } catch {
      return null;
    }
  }

  /** Tear down currently running soundscape synthesis nodes */
  private teardownCurrentNodes() {
    this.activeIntervals.forEach((intervalId) => window.clearInterval(intervalId));
    this.activeIntervals = [];

    this.activeSoundscapeNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          (node as AudioScheduledSourceNode).stop();
        }
        node.disconnect();
      } catch {
        // ignore
      }
    });
    this.activeSoundscapeNodes = [];
  }

  /** Starts ambient soundscape synthesis */
  public startSoundscape(presetId?: SoundscapePresetId) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (presetId) {
      this.currentPreset = presetId;
    }

    try {
      const now = this.ctx.currentTime;
      const prevGain = this.soundscapeGain;

      // Smooth fade-out of previous soundscape gain if active
      if (prevGain) {
        prevGain.gain.setValueAtTime(prevGain.gain.value, now);
        prevGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        setTimeout(() => {
          try {
            prevGain.disconnect();
          } catch {
            // ignore
          }
        }, 400);
      }

      this.teardownCurrentNodes();

      // Create new soundscape gain node with smooth attack
      const newGain = this.ctx.createGain();
      newGain.gain.setValueAtTime(0.0001, now);
      newGain.gain.exponentialRampToValueAtTime(this.soundscapeVolume, now + 1.2);
      newGain.connect(this.masterGain);
      this.soundscapeGain = newGain;

      // Route through appropriate synthesizer
      switch (this.currentPreset) {
        case 'rain_in_space':
          this.buildRainInSpace(newGain);
          break;
        case 'cyber_cafe':
          this.buildCyberCafe(newGain);
          break;
        case 'deep_void':
          this.buildDeepVoid(newGain);
          break;
        case 'solar_wind':
          this.buildSolarWind(newGain);
          break;
        case 'alpha_flow':
          this.buildAlphaFlow(newGain);
          break;
        default:
          this.buildDeepVoid(newGain);
          break;
      }

      this.soundscapeActive = true;
      this.notifySoundscapeListeners();
    } catch (err) {
      console.warn('Could not launch soundscape preset', err);
      this.soundscapeActive = false;
      this.notifySoundscapeListeners();
    }
  }

  /** Stops current ambient soundscape */
  public stopSoundscape() {
    if (!this.ctx || !this.soundscapeGain) {
      this.soundscapeActive = false;
      this.notifySoundscapeListeners();
      return;
    }

    try {
      const now = this.ctx.currentTime;
      const gain = this.soundscapeGain;
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      setTimeout(() => {
        this.teardownCurrentNodes();
        try {
          gain.disconnect();
        } catch {
          // ignore
        }
        if (this.soundscapeGain === gain) {
          this.soundscapeGain = null;
        }
      }, 700);

      this.soundscapeActive = false;
      this.notifySoundscapeListeners();
    } catch {
      this.soundscapeActive = false;
      this.notifySoundscapeListeners();
    }
  }

  // --- PRESET SYNTHESIZERS ---

  /** 1. RAIN IN SPACE: Pink noise hull precipitation + stochastic particle droplets */
  private buildRainInSpace(outNode: GainNode) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const pinkBuffer = this.getPinkNoiseBuffer();
    if (pinkBuffer) {
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = pinkBuffer;
      noiseSource.loop = true;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(750, now);
      bandpass.Q.setValueAtTime(1.1, now);

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(1600, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.32, now);

      noiseSource.connect(bandpass);
      bandpass.connect(lowpass);
      lowpass.connect(noiseGain);
      noiseGain.connect(outNode);

      noiseSource.start();
      this.activeSoundscapeNodes.push(noiseSource, bandpass, lowpass, noiseGain);
    }

    // Gentle sub-bass cockpit hull resonance
    const hullSub = this.ctx.createOscillator();
    hullSub.type = 'sine';
    hullSub.frequency.setValueAtTime(48, now);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.08, now);

    hullSub.connect(subGain);
    subGain.connect(outNode);
    hullSub.start();
    this.activeSoundscapeNodes.push(hullSub, subGain);

    // Stochastic raindrop droplets against titanium hull (every 200-450ms)
    const dropInterval = window.setInterval(() => {
      if (!this.ctx || !this.soundscapeActive) return;
      try {
        const dropTime = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const dropGain = this.ctx.createGain();

        // Varied resonant high-frequency drops
        const baseFreq = 1200 + Math.random() * 1400;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, dropTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.45, dropTime + 0.04);

        const dropAmp = 0.015 + Math.random() * 0.025;
        dropGain.gain.setValueAtTime(dropAmp, dropTime);
        dropGain.gain.exponentialRampToValueAtTime(0.0001, dropTime + 0.05);

        osc.connect(dropGain);
        dropGain.connect(outNode);

        osc.start(dropTime);
        osc.stop(dropTime + 0.06);
      } catch {
        // ignore
      }
    }, 280);

    this.activeIntervals.push(dropInterval);
  }

  /** 2. CYBER CAFE: 60Hz circuit hum + tape warmth + slow lofi minor pads */
  private buildCyberCafe(outNode: GainNode) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 60Hz electrical hum + 120Hz warmth
    const humOsc1 = this.ctx.createOscillator();
    humOsc1.type = 'sine';
    humOsc1.frequency.setValueAtTime(60, now);

    const humOsc2 = this.ctx.createOscillator();
    humOsc2.type = 'sine';
    humOsc2.frequency.setValueAtTime(120, now);

    const humFilter = this.ctx.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.setValueAtTime(180, now);

    const humGain = this.ctx.createGain();
    humGain.gain.setValueAtTime(0.12, now);

    humOsc1.connect(humFilter);
    humOsc2.connect(humFilter);
    humFilter.connect(humGain);
    humGain.connect(outNode);

    humOsc1.start();
    humOsc2.start();
    this.activeSoundscapeNodes.push(humOsc1, humOsc2, humFilter, humGain);

    // Tape saturation / vinyl high-pass whisper
    const pinkBuffer = this.getPinkNoiseBuffer();
    if (pinkBuffer) {
      const tapeSource = this.ctx.createBufferSource();
      tapeSource.buffer = pinkBuffer;
      tapeSource.loop = true;

      const tapeHighPass = this.ctx.createBiquadFilter();
      tapeHighPass.type = 'highpass';
      tapeHighPass.frequency.setValueAtTime(1600, now);

      const tapeGain = this.ctx.createGain();
      tapeGain.gain.setValueAtTime(0.018, now);

      tapeSource.connect(tapeHighPass);
      tapeHighPass.connect(tapeGain);
      tapeGain.connect(outNode);

      tapeSource.start();
      this.activeSoundscapeNodes.push(tapeSource, tapeHighPass, tapeGain);
    }

    // Warm lofi pad chord: A2 (110Hz), E3 (164.8Hz), C#4 (277.18Hz)
    const chordFreqs = [110, 164.81, 277.18];
    chordFreqs.forEach((freq) => {
      if (!this.ctx) return;
      const padOsc = this.ctx.createOscillator();
      padOsc.type = 'triangle';
      padOsc.frequency.setValueAtTime(freq, now);

      const padFilter = this.ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.setValueAtTime(340, now);

      const padGain = this.ctx.createGain();
      padGain.gain.setValueAtTime(0.06, now);

      padOsc.connect(padFilter);
      padFilter.connect(padGain);
      padGain.connect(outNode);

      padOsc.start();
      this.activeSoundscapeNodes.push(padOsc, padFilter, padGain);
    });
  }

  /** 3. DEEP VOID: Binaural sub-harmonic drone (55Hz / 58.5Hz) */
  private buildDeepVoid(outNode: GainNode) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(110, now);
    filter.Q.setValueAtTime(2.5, now);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(55, now);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(58.5, now);

    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(36.7, now);

    const voidGain = this.ctx.createGain();
    voidGain.gain.setValueAtTime(0.25, now);

    osc1.connect(filter);
    osc2.connect(filter);
    subOsc.connect(filter);
    filter.connect(voidGain);
    voidGain.connect(outNode);

    osc1.start();
    osc2.start();
    subOsc.start();
    this.activeSoundscapeNodes.push(osc1, osc2, subOsc, filter, voidGain);
  }

  /** 4. SOLAR WIND: Ethereal bandpass noise with slow 0.07Hz resonant LFO sweep */
  private buildSolarWind(outNode: GainNode) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const pinkBuffer = this.getPinkNoiseBuffer();
    if (pinkBuffer) {
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = pinkBuffer;
      noiseSource.loop = true;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(450, now);
      bandpass.Q.setValueAtTime(3.6, now);

      // Low Frequency Oscillator to sweep celestial wind
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.07, now);

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(280, now); // Sweep +/- 280Hz

      lfo.connect(lfoGain);
      lfoGain.connect(bandpass.frequency);

      const windGain = this.ctx.createGain();
      windGain.gain.setValueAtTime(0.38, now);

      noiseSource.connect(bandpass);
      bandpass.connect(windGain);
      windGain.connect(outNode);

      noiseSource.start();
      lfo.start();
      this.activeSoundscapeNodes.push(noiseSource, bandpass, lfo, lfoGain, windGain);
    }
  }

  /** 5. ALPHA FLOW 432Hz: Sacred tuning with 8Hz binaural pulse for executive calm */
  private buildAlphaFlow(outNode: GainNode) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const baseOsc = this.ctx.createOscillator();
    baseOsc.type = 'sine';
    baseOsc.frequency.setValueAtTime(432, now);

    // Secondary oscillator at 440Hz creates precise 8Hz binaural alpha beat
    const alphaOsc = this.ctx.createOscillator();
    alphaOsc.type = 'sine';
    alphaOsc.frequency.setValueAtTime(440, now);

    // Warm sub-harmonic foundation (108Hz)
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(108, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, now);

    const alphaGain = this.ctx.createGain();
    alphaGain.gain.setValueAtTime(0.18, now);

    baseOsc.connect(filter);
    alphaOsc.connect(filter);
    subOsc.connect(filter);
    filter.connect(alphaGain);
    alphaGain.connect(outNode);

    baseOsc.start();
    alphaOsc.start();
    subOsc.start();
    this.activeSoundscapeNodes.push(baseOsc, alphaOsc, subOsc, filter, alphaGain);
  }


  // --- COCKPIT UI FEEDBACK SOUNDS ---

  /** Snappy cockpit click */
  public playClick() {
    if (this.isMutedState) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /** Mythic Perk Deck Card Flip / Sci-Fi Shuffle */
  public playCardFlip() {
    if (this.isMutedState) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      // Multi-tone holographic chime
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.035);

        gain.gain.setValueAtTime(0.001, now + idx * 0.035);
        gain.gain.linearRampToValueAtTime(0.1, now + idx * 0.035 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.035 + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + idx * 0.035);
        osc.stop(now + idx * 0.035 + 0.26);
      });
    } catch {
      // ignore
    }
  }

  /** Slot Locked / Gratitude Secured Chime */
  public playSlotLock() {
    if (this.isMutedState) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.15);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(660, now);
      osc2.frequency.exponentialRampToValueAtTime(990, now + 0.15);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.26);
      osc2.stop(now + 0.26);
    } catch {
      // ignore
    }
  }

  /** Core Shield Overcharged Fanfare (100% full) */
  public playOvercharge() {
    if (this.isMutedState) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.001, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.14, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.45);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.46);
      });
    } catch {
      // ignore
    }
  }

  /** Reactor Breathing Phase Tone */
  public playBreathingTone(type: 'inhale' | 'hold' | 'exhale' | 'rest') {
    if (this.isMutedState) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freqMap = {
        inhale: 432, // Healing frequency
        hold: 528,   // Transformation / balance
        exhale: 396, // Release frequency
        rest: 288    // Grounding
      };

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqMap[type], now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.85);
    } catch {
      // ignore
    }
  }

  /** Deep Work 25-min Burst Completion Victory Fanfare */
  public playDeepWorkComplete() {
    if (this.isMutedState) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      // Majestic ascending cyber chord: C5, E5, G5, B5, C6, G6
      const chord = [523.25, 659.25, 783.99, 987.77, 1046.50, 1567.98];
      chord.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.85);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.9);
      });

      // Warm low sub support at 130Hz
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(130.81, now);
      subGain.gain.setValueAtTime(0.15, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subOsc.start(now);
      subOsc.stop(now + 1.25);
    } catch {
      // ignore
    }
  }

  /** Sub-Zero Cryo Streak Freeze Activation Sound FX */
  public playStreakFreeze() {
    if (this.isMutedState) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      // High-register crystalline frost chimes: 880Hz, 1320Hz, 1760Hz with shimmering decay
      const tones = [880, 1174.66, 1318.51, 1760];
      tones.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.001, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.14, now + idx * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.65);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.7);
      });
    } catch {
      // ignore
    }
  }

  /** Synergy Tag Combination Link Activation Audio Signature */
  public playSynergyActivation() {
    if (this.isMutedState) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      // Resonant harmonic link: 523.25Hz (C5), 659.25Hz (E5), 783.99Hz (G5), 1046.5Hz (C6) with phase sweep
      const chord = [523.25, 659.25, 783.99, 1046.5];
      chord.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.02, now + idx * 0.04 + 0.3);

        gain.gain.setValueAtTime(0.001, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.04 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.55);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.6);
      });
    } catch {
      // ignore
    }
  }

  /** Celebratory Mythic Achievement & Streak Milestone Fanfare (7, 30, 100 Days) */
  public playStreakMilestoneFanfare(days = 7) {
    if (this.isMutedState) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const isOmega = days >= 100;
      const isGold = days >= 30;

      // 1. Heavy resonant sub-bass foundation (65Hz / 130Hz)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(65.41, now);
      subOsc.frequency.exponentialRampToValueAtTime(130.81, now + 0.3);
      subGain.gain.setValueAtTime(0.25, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + (isOmega ? 2.5 : 1.6));
      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subOsc.start(now);
      subOsc.stop(now + (isOmega ? 2.6 : 1.7));

      // 2. Ascending Heroic Mythic Fanfare Arpeggio
      // Tones: C4, E4, G4, C5, E5, G5, C6, E6
      const fanfareTones = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51];
      fanfareTones.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx >= 4 ? 'sine' : 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.001, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + (isOmega ? 1.6 : 1.1));

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + (isOmega ? 1.7 : 1.2));
      });

      // 3. Shimmering Crystalline Treble Bells (Omega / Citadel Glint)
      const bells = isOmega 
        ? [1567.98, 1760.00, 2093.00, 2637.02, 3135.96] 
        : isGold 
        ? [1318.51, 1567.98, 1760.00, 2093.00] 
        : [1046.50, 1318.51, 1567.98];

      const bellStart = now + 0.55;
      bells.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, bellStart + idx * 0.06);

        gain.gain.setValueAtTime(0.001, bellStart + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.12, bellStart + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, bellStart + idx * 0.06 + 0.9);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(bellStart + idx * 0.06);
        osc.stop(bellStart + idx * 0.06 + 1.0);
      });
    } catch {
      // ignore
    }
  }
}

export const audioEngine = new SoundEngine();
