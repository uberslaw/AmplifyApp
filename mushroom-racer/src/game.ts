import { AudioBus } from './audio'
import { testGateCrossing } from './collision'
import { GateManager } from './gates'
import { Input } from './input'
import { drawMeteors, MeteorManager } from './meteors'
import { drawChaseNyan, NYAN_CATCH_SPECTRA, NyanChase } from './nyan'
import { Player } from './player'
import { drawFlash, drawGates, drawPlayer } from './render'
import { SPECTRUM, SpectrumTracker } from './spectrum'
import { drawStarfield, makeStarfield, type Starfield } from './starfield'

export type GameMode = 'title' | 'playing' | 'paused' | 'gameover' | 'won'

const BEST_KEY = 'mushroom-blaze-best'
const MAX_MISSES = 3

export class Game {
  mode: GameMode = 'title'
  score = 0
  distance = 0
  best = 0
  misses = 0

  private player = new Player()
  private gates = new GateManager()
  private chase = new NyanChase()
  private spectrum = new SpectrumTracker()
  private meteors = new MeteorManager()
  private audio = new AudioBus()
  private starfield: Starfield | null = null
  private scroll = 0
  private scrollSpeed = 220
  private flash = 0
  private flashColor = 'rgba(255, 220, 120, 1)'
  private crashShake = 0
  private thrustSoundT = 0
  private w = 800
  private h = 450
  private overReason = 'Crashed!'

  private els: {
    title: HTMLElement
    hud: HTMLElement
    pause: HTMLElement
    nyanBanner: HTMLElement
    over: HTMLElement
    overTitle: HTMLElement
    score: HTMLElement
    distance: HTMLElement
    best: HTMLElement
    finalScore: HTMLElement
    finalBest: HTMLElement
    spectrumRow: HTMLElement
    misses: HTMLElement
    spectra: HTMLElement
    gap: HTMLElement
  }

  private ctx: CanvasRenderingContext2D
  private input: Input

  constructor(ctx: CanvasRenderingContext2D, input: Input) {
    this.ctx = ctx
    this.input = input
    this.best = Number(localStorage.getItem(BEST_KEY) || '0') || 0
    this.els = {
      title: must('#title-screen'),
      hud: must('#hud'),
      pause: must('#pause-banner'),
      nyanBanner: must('#nyan-banner'),
      over: must('#game-over'),
      overTitle: must('#over-title'),
      score: must('#score'),
      distance: must('#distance'),
      best: must('#best'),
      finalScore: must('#final-score'),
      finalBest: must('#final-best'),
      spectrumRow: must('#spectrum-row'),
      misses: must('#misses'),
      spectra: must('#spectra'),
      gap: must('#nyan-gap'),
    }
    this.buildSpectrumHud()
    must('#play-btn').addEventListener('click', () => this.start())
    must('#restart-btn').addEventListener('click', () => this.start())
    this.syncUi()
  }

  resize(w: number, h: number): void {
    this.w = w
    this.h = h
    this.starfield = makeStarfield(w, h)
    if (this.mode === 'title') {
      this.player.reset(h)
      this.player.x = Math.min(200, w * 0.22)
    }
  }

  start(): void {
    this.audio.unlock()
    this.mode = 'playing'
    this.score = 0
    this.distance = 0
    this.misses = 0
    this.scroll = 0
    this.scrollSpeed = 220
    this.flash = 0
    this.crashShake = 0
    this.overReason = 'Crashed!'
    this.player.reset(this.h)
    this.player.x = Math.min(200, this.w * 0.22)
    this.gates.reset(this.w)
    this.spectrum.reset()
    this.chase.reset(this.h)
    this.meteors.reset()
    this.syncUi()
  }

  update(dt: number): void {
    if (this.mode === 'title') {
      if (this.input.state.playPressed) this.start()
      this.player.update(dt, Math.sin(performance.now() * 0.0015) * 0.25, true, this.h)
      this.scroll += 60 * dt
      this.meteors.update(dt * 0.35, this.w, this.h, 120)
      this.draw()
      this.input.endFrame()
      return
    }

    if (this.mode === 'gameover' || this.mode === 'won') {
      if (this.input.state.playPressed) this.start()
      this.crashShake = Math.max(0, this.crashShake - dt)
      this.flash = Math.max(0, this.flash - dt)
      this.draw()
      this.input.endFrame()
      return
    }

    if (this.input.state.pausePressed) {
      this.mode = this.mode === 'paused' ? 'playing' : 'paused'
      this.syncUi()
    }

    if (this.mode === 'paused') {
      this.draw()
      this.syncBanners()
      this.input.endFrame()
      return
    }

    this.spectrum.tick(dt)

    const boost = this.input.state.boost
    this.scrollSpeed =
      210 + this.spectrum.speedBonus + (boost ? 70 : 0) + Math.min(80, this.distance / 40)

    const steer = this.input.getSteer()
    this.player.update(dt, steer, boost, this.h, this.spectrum.cycles > 0)

    this.player.x = Math.min(200, this.w * 0.22)
    const scrollDelta = this.scrollSpeed * dt
    this.scroll += scrollDelta
    this.distance += scrollDelta / 10

    this.gates.update(dt, this.scrollSpeed, this.h, this.w, this.distance)
    this.meteors.update(dt, this.w, this.h, this.distance)

    const hb = this.player.hitbox()
    const caught = this.chase.update(
      dt,
      this.scrollSpeed,
      hb,
      this.w,
      this.h,
      this.spectrum.cycles,
    )
    if (caught) {
      this.score += 5000 + this.spectrum.cycles * 1000
      this.audio.nyanCatch(true)
      this.win()
      this.draw()
      this.input.endFrame()
      return
    }

    if (this.meteors.hitsPlayer(hb)) {
      this.overReason = 'Meteor strike!'
      this.die()
      this.draw()
      this.input.endFrame()
      return
    }

    for (const gate of this.gates.gates) {
      const result = testGateCrossing(hb, gate, scrollDelta)
      if (result.kind === 'clear') {
        gate.cleared = true
        const { isNew, fullSpectrum } = this.spectrum.collect(gate.color)
        this.score += gate.points + (isNew ? 50 : 0) + (fullSpectrum ? 500 : 0)
        this.flash = fullSpectrum ? 0.35 : 0.18
        this.flashColor = SPECTRUM[gate.color]!.hex
        if (fullSpectrum) {
          this.audio.nyanCatch(false)
        } else {
          this.audio.gateClear()
        }
      } else if (result.kind === 'hit' || result.kind === 'miss') {
        gate.missed = true
        this.misses += 1
        this.flash = 0.2
        this.flashColor = 'rgba(255, 80, 60, 0.9)'
        this.audio.crash()
        if (this.misses >= MAX_MISSES) {
          this.overReason = 'Too many missed gates!'
          this.die()
          break
        }
      }
    }

    this.thrustSoundT -= dt
    if (boost && this.thrustSoundT <= 0) {
      this.audio.boost()
      this.thrustSoundT = 0.18
    } else if (this.thrustSoundT <= 0) {
      this.audio.thrust()
      this.thrustSoundT = 0.28
    }

    this.flash = Math.max(0, this.flash - dt)
    this.draw()
    this.syncHud()
    this.syncBanners()
    this.input.endFrame()
  }

  private win(): void {
    this.mode = 'won'
    this.overReason = 'Caught Nyan Cat!'
    this.flash = 0.5
    this.flashColor = 'rgba(255, 200, 255, 1)'
    if (this.score > this.best) {
      this.best = this.score
      localStorage.setItem(BEST_KEY, String(this.best))
    }
    this.syncUi()
  }

  private die(): void {
    this.mode = 'gameover'
    this.audio.crash()
    this.crashShake = 0.45
    this.flash = 0.4
    this.flashColor = 'rgba(255, 60, 40, 1)'
    if (this.score > this.best) {
      this.best = this.score
      localStorage.setItem(BEST_KEY, String(this.best))
    }
    this.syncUi()
  }

  private draw(): void {
    const ctx = this.ctx
    const shakeX = this.crashShake > 0 ? (Math.random() - 0.5) * 14 * this.crashShake : 0
    const shakeY = this.crashShake > 0 ? (Math.random() - 0.5) * 14 * this.crashShake : 0

    ctx.save()
    ctx.translate(shakeX, shakeY)

    if (!this.starfield) this.starfield = makeStarfield(this.w, this.h)
    drawStarfield(ctx, this.w, this.h, this.starfield, this.scroll, this.player.cameraBob)
    drawGates(ctx, this.gates.gates)
    drawMeteors(ctx, this.meteors.meteors)
    drawChaseNyan(ctx, this.chase, this.player.x, this.w)
    drawPlayer(ctx, this.player)
    drawFlash(ctx, this.w, this.h, this.flash, this.flashColor)

    ctx.restore()
  }

  private buildSpectrumHud(): void {
    this.els.spectrumRow.innerHTML = ''
    for (let i = 0; i < SPECTRUM.length; i++) {
      const d = document.createElement('span')
      d.className = 'spec-dot'
      d.dataset.color = String(i)
      d.style.setProperty('--c', SPECTRUM[i]!.hex)
      d.title = SPECTRUM[i]!.name
      this.els.spectrumRow.appendChild(d)
    }
  }

  private syncUi(): void {
    this.els.title.classList.toggle('hidden', this.mode !== 'title')
    this.els.over.classList.toggle('hidden', this.mode !== 'gameover' && this.mode !== 'won')
    this.els.hud.classList.toggle('hidden', this.mode !== 'playing' && this.mode !== 'paused')
    this.els.pause.classList.toggle('hidden', this.mode !== 'paused')
    this.els.overTitle.textContent = this.overReason
    this.syncHud()
    this.syncBanners()
    if (this.mode === 'gameover' || this.mode === 'won') {
      this.els.finalScore.textContent = String(this.score)
      this.els.finalBest.textContent = String(this.best)
    }
  }

  private syncHud(): void {
    this.els.score.textContent = String(this.score)
    this.els.distance.textContent = String(Math.floor(this.distance))
    this.els.best.textContent = String(this.best)
    this.els.misses.textContent = `${this.misses}/${MAX_MISSES}`
    this.els.spectra.textContent = `${this.spectrum.cycles}/${NYAN_CATCH_SPECTRA}`
    this.els.gap.textContent = `${Math.floor(this.chase.nyan.gap)}m`
    const dots = this.els.spectrumRow.querySelectorAll<HTMLElement>('.spec-dot')
    dots.forEach((d, i) => {
      d.classList.toggle('on', this.spectrum.has(i))
    })
  }

  private syncBanners(): void {
    const text = this.spectrum.banner ?? this.chase.banner
    this.els.nyanBanner.classList.toggle('hidden', !text)
    if (text) this.els.nyanBanner.textContent = text
  }
}

function must(sel: string): HTMLElement {
  const el = document.querySelector(sel)
  if (!(el instanceof HTMLElement)) throw new Error(`Missing ${sel}`)
  return el
}
