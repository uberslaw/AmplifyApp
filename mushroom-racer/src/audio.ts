/** Tiny WebAudio SFX — no external assets. */
export class AudioBus {
  private ctx: AudioContext | null = null
  private unlocked = false

  unlock(): void {
    if (this.unlocked) return
    const ctx = this.ensure()
    if (ctx.state === 'suspended') {
      void ctx.resume()
    }
    this.unlocked = true
  }

  thrust(): void {
    this.noiseBurst(0.05, 180, 90, 0.04)
  }

  gateClear(): void {
    this.tone(520, 0.08, 'triangle', 0.09)
    this.tone(780, 0.1, 'sine', 0.07, 0.06)
  }

  crash(): void {
    this.noiseBurst(0.28, 120, 40, 0.18)
    this.tone(140, 0.22, 'sawtooth', 0.12)
  }

  boost(): void {
    this.tone(240, 0.06, 'square', 0.05)
    this.tone(360, 0.08, 'triangle', 0.04, 0.04)
  }

  private ensure(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
    }
    return this.ctx
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType,
    gain: number,
    delay = 0,
  ): void {
    try {
      const ctx = this.ensure()
      const t0 = ctx.currentTime + delay
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, t0)
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.7), t0 + dur)
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
      osc.connect(g)
      g.connect(ctx.destination)
      osc.start(t0)
      osc.stop(t0 + dur + 0.02)
    } catch {
      /* ignore autoplay / audio errors */
    }
  }

  private noiseBurst(dur: number, startHz: number, endHz: number, gain: number): void {
    try {
      const ctx = this.ensure()
      const t0 = ctx.currentTime
      const len = Math.floor(ctx.sampleRate * dur)
      const buf = ctx.createBuffer(1, len, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / len)
      }
      const src = ctx.createBufferSource()
      src.buffer = buf
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(startHz, t0)
      filter.frequency.exponentialRampToValueAtTime(endHz, t0 + dur)
      const g = ctx.createGain()
      g.gain.setValueAtTime(gain, t0)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
      src.connect(filter)
      filter.connect(g)
      g.connect(ctx.destination)
      src.start(t0)
      src.stop(t0 + dur)
    } catch {
      /* ignore */
    }
  }
}
