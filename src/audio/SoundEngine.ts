/*
 * All sounds are synthesized at runtime with the Web Audio API, so the game ships without audio
 * assets. The AudioContext is created lazily on the first user gesture (browser autoplay policy).
 */

export type SoundName =
  | 'deal'
  | 'flip'
  | 'chip'
  | 'chipStack'
  | 'click'
  | 'win'
  | 'blackjack'
  | 'lose'
  | 'bust'
  | 'push'
  | 'shuffle'
  | 'error';

interface ToneOpts {
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  freqEnd?: number;
}

interface NoiseOpts {
  filter?: BiquadFilterType;
  freq?: number;
  freqEnd?: number;
  q?: number;
  gain?: number;
}

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private enabled = true;
  private volume = 0.6;
  /** Set on the first user gesture; before that, sounds are skipped (autoplay policy). */
  private unlocked = false;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
  }

  /** Call from a user gesture so later (non-gesture) sounds are allowed to play. */
  unlock(): void {
    this.unlocked = true;
    const ctx = this.ensure();
    if (ctx && ctx.state === 'suspended') void ctx.resume();
  }

  play(name: SoundName): void {
    if (!this.enabled || !this.unlocked || this.volume <= 0) return;
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const t = ctx.currentTime + 0.005;
    switch (name) {
      case 'deal':
        this.noise(t, 0.13, { filter: 'bandpass', freq: 3200, freqEnd: 900, q: 0.9, gain: 0.5 });
        this.tone(140, t + 0.09, 0.05, { type: 'sine', gain: 0.25, freqEnd: 70 });
        break;
      case 'flip':
        this.noise(t, 0.05, { filter: 'highpass', freq: 2500, gain: 0.35 });
        this.noise(t + 0.06, 0.06, { filter: 'bandpass', freq: 1800, q: 1.2, gain: 0.3 });
        break;
      case 'chip': {
        const p = 1 + (Math.random() - 0.5) * 0.12;
        this.tone(2900 * p, t, 0.05, { type: 'triangle', gain: 0.22 });
        this.tone(4100 * p, t + 0.004, 0.035, { type: 'sine', gain: 0.12 });
        this.noise(t, 0.025, { filter: 'highpass', freq: 4000, gain: 0.25 });
        break;
      }
      case 'chipStack':
        for (let i = 0; i < 4; i++) {
          const p = 1 + (Math.random() - 0.5) * 0.2;
          this.tone(2700 * p, t + i * 0.045, 0.04, { type: 'triangle', gain: 0.16 });
          this.noise(t + i * 0.045, 0.02, { filter: 'highpass', freq: 3800, gain: 0.18 });
        }
        break;
      case 'click':
        this.tone(1300, t, 0.035, { type: 'sine', gain: 0.12, freqEnd: 900 });
        break;
      case 'win':
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.bell(f, t + i * 0.085, 0.45, 0.16));
        break;
      case 'blackjack':
        [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568].forEach((f, i) => this.bell(f, t + i * 0.07, 0.7, 0.15));
        [1046.5, 1318.5, 1568].forEach((f) => this.bell(f, t + 0.48, 1.2, 0.09));
        for (let i = 0; i < 6; i++) this.tone(2400 + Math.random() * 2400, t + 0.5 + i * 0.07, 0.12, { gain: 0.04 });
        break;
      case 'lose':
        this.tone(392, t, 0.22, { type: 'triangle', gain: 0.13 });
        this.tone(311.13, t + 0.18, 0.4, { type: 'triangle', gain: 0.12, freqEnd: 290 });
        break;
      case 'bust':
        this.tone(180, t, 0.18, { type: 'sine', gain: 0.35, freqEnd: 60 });
        this.tone(330, t + 0.05, 0.35, { type: 'triangle', gain: 0.1, freqEnd: 196 });
        break;
      case 'push':
        this.bell(587.33, t, 0.3, 0.12);
        this.bell(587.33, t + 0.16, 0.35, 0.1);
        break;
      case 'shuffle':
        for (let i = 0; i < 18; i++) {
          this.noise(t + i * 0.038 + Math.random() * 0.01, 0.03, { filter: 'bandpass', freq: 2200 + Math.random() * 1600, q: 1, gain: 0.25 });
        }
        this.noise(t + 0.75, 0.12, { filter: 'lowpass', freq: 900, gain: 0.35 });
        break;
      case 'error':
        this.tone(150, t, 0.12, { type: 'square', gain: 0.05 });
        break;
    }
  }

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = globalThis.AudioContext ?? (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      this.ctx = new Ctor();
    } catch {
      return null;
    }
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    // Gentle compression keeps overlapping sounds from clipping.
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    this.master.connect(comp).connect(this.ctx.destination);
    const len = Math.floor(this.ctx.sampleRate * 0.5);
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return this.ctx;
  }

  private envelope(start: number, dur: number, peak: number, attack = 0.004): GainNode {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak, start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    g.connect(this.master!);
    return g;
  }

  private tone(freq: number, start: number, dur: number, o: ToneOpts = {}): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, start);
    if (o.freqEnd) osc.frequency.exponentialRampToValueAtTime(o.freqEnd, start + dur);
    osc.connect(this.envelope(start, dur, o.gain ?? 0.2, o.attack));
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  /** Soft bell: fundamental plus a quiet octave partial. */
  private bell(freq: number, start: number, dur: number, gain: number): void {
    this.tone(freq, start, dur, { type: 'triangle', gain, attack: 0.008 });
    this.tone(freq * 2, start, dur * 0.6, { type: 'sine', gain: gain * 0.35, attack: 0.008 });
  }

  private noise(start: number, dur: number, o: NoiseOpts = {}): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = o.filter ?? 'bandpass';
    filter.frequency.setValueAtTime(o.freq ?? 2000, start);
    if (o.freqEnd) filter.frequency.exponentialRampToValueAtTime(o.freqEnd, start + dur);
    filter.Q.value = o.q ?? 0.7;
    src.connect(filter).connect(this.envelope(start, dur, o.gain ?? 0.3, 0.003));
    src.start(start, Math.random() * 0.3);
    src.stop(start + dur + 0.02);
  }
}

export const sound = new SoundEngine();
