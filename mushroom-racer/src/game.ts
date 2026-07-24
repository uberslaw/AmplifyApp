import { AudioBus } from './audio'
import { testGateCrossing } from './collision'
import { GateManager } from './gates'
import { Input } from './input'
import { drawMeteors, MeteorManager } from './meteors'
import { drawNyanCats, drawNyanPowerAura, NyanManager } from './nyan'
import { Player } from './player'
import { drawFlash, drawGates, drawPlayer } from './render'
import { drawStarfield, makeStarfield, type Starfield } from './starfield'

export type GameMode = 'title' | 'playing' | 'paused' | 'gameover'

const BEST_KEY = 'mushroom-blaze-best'

export class Game {
  mode: GameMode = 'title'
  score = 0
  distance = 0
  best = 0

  private player = new Player()
  private gates = new GateManager()
  private nyan = new NyanManager()
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

  private els: {
    title: HTMLElement
    hud: HTMLElement
    pause: HTMLElement
    nyanBanner: HTMLElement
    over: HTMLElement
    score: HTMLElement
    distance: HTMLElement
    powerLabel: HTMLElement
    power: HTMLElement
    best: HTMLElement
    finalScore: HTMLElement
    finalBest: HTMLElement
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
      score: must('#score'),
      distance: must('#distance'),
      powerLabel: must('#power-label'),
      power: must('#power'),
      best: must('#best'),
      finalScore: must('#final-score'),
      finalBest: must('#final-best'),
    }
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
    this.scroll = 0
    this.scrollSpeed = 220
    this.flash = 0
    this.crashShake = 0
    this.player.reset(this.h)
    this.player.x = Math.min(200, this.w * 0.22)
    this.gates.reset(this.w)
    this.nyan.reset()
    this.meteors.reset()
    this.syncUi()
  }

  update(dt: number): void {
    if (this.mode === 'title') {
      if (this.input.state.playPressed) this.start()
      this.player.update(dt, Math.sin(performance.now() * 0.0015) * 0.25, true, this.h)
      this.scroll += 60 * dt
      this.meteors.update(dt * 0.45, this.w, this.h, 200)
      this.draw()
      this.input.endFrame()
      return
    }

    if (this.mode === 'gameover') {
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
      this.syncNyanBanner()
      this.input.endFrame()
      return
    }

    const difficulty = Math.min(1, this.distance / 2800)
    const nyanPower = this.nyan.powerSecondsLeft > 0
    this.scrollSpeed =
      220 + difficulty * 180 + (this.player.boosting || nyanPower ? 90 : 0) + (nyanPower ? 40 : 0)

    const steer = this.input.getSteer()
    const boost = this.input.state.boost
    this.player.update(dt, steer, boost, this.h, nyanPower)

    this.player.x = Math.min(200, this.w * 0.22)
    const scrollDelta = this.scrollSpeed * dt
    this.scroll += scrollDelta
    this.distance += scrollDelta / 10

    this.gates.update(dt, this.scrollSpeed, this.h, this.w, this.distance)
    this.meteors.update(dt, this.w, this.h, this.distance)

    const hb = this.player.hitbox()
    const { caught } = this.nyan.update(dt, this.scrollSpeed, this.w, this.h, this.distance, hb)
    if (caught) {
      this.score += caught.points
      this.flash = 0.28
      this.flashColor = 'rgba(180, 220, 255, 1)'
      this.audio.nyanCatch(caught.kind === 'boss')
    }

    if (this.meteors.hitsPlayer(hb)) {
      if (this.nyan.isInvulnerable) {
        this.flash = 0.1
        this.flashColor = 'rgba(120, 220, 255, 0.7)'
      } else {
        this.die()
        this.draw()
        this.input.endFrame()
        return
      }
    }

    const mult = this.nyan.scoreMultiplier
    for (const gate of this.gates.gates) {
      const result = testGateCrossing(hb, gate, scrollDelta)
      if (result.kind === 'clear') {
        gate.cleared = true
        this.score += Math.floor(gate.points * mult)
        this.flash = 0.22
        this.flashColor = 'rgba(255, 220, 120, 1)'
        this.audio.gateClear()
      } else if (result.kind === 'hit' || result.kind === 'miss') {
        gate.missed = true
        if (this.nyan.isInvulnerable) {
          this.flash = 0.12
          this.flashColor = 'rgba(120, 220, 255, 0.8)'
        } else {
          this.die()
          break
        }
      }
    }

    this.thrustSoundT -= dt
    if ((boost || nyanPower) && this.thrustSoundT <= 0) {
      this.audio.boost()
      this.thrustSoundT = 0.18
    } else if (this.thrustSoundT <= 0) {
      this.audio.thrust()
      this.thrustSoundT = 0.28
    }

    this.flash = Math.max(0, this.flash - dt)
    this.draw()
    this.syncHud()
    this.syncNyanBanner()
    this.input.endFrame()
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
    drawNyanCats(ctx, this.nyan.cats)
    drawNyanPowerAura(ctx, this.player.x, this.player.y, this.nyan.powerSecondsLeft > 0)
    drawPlayer(ctx, this.player)
    drawFlash(ctx, this.w, this.h, this.flash, this.flashColor)

    ctx.restore()
  }

  private syncUi(): void {
    this.els.title.classList.toggle('hidden', this.mode !== 'title')
    this.els.over.classList.toggle('hidden', this.mode !== 'gameover')
    this.els.hud.classList.toggle('hidden', this.mode !== 'playing' && this.mode !== 'paused')
    this.els.pause.classList.toggle('hidden', this.mode !== 'paused')
    this.syncHud()
    this.syncNyanBanner()
    if (this.mode === 'gameover') {
      this.els.finalScore.textContent = String(this.score)
      this.els.finalBest.textContent = String(this.best)
    }
  }

  private syncHud(): void {
    this.els.score.textContent = String(this.score)
    this.els.distance.textContent = String(Math.floor(this.distance))
    this.els.best.textContent = String(this.best)
    const left = this.nyan.powerSecondsLeft
    this.els.powerLabel.classList.toggle('hidden', left <= 0)
    if (left > 0) {
      this.els.power.textContent = left.toFixed(1)
    }
  }

  private syncNyanBanner(): void {
    const text = this.nyan.banner
    this.els.nyanBanner.classList.toggle('hidden', !text)
    if (text) this.els.nyanBanner.textContent = text
  }
}

function must(sel: string): HTMLElement {
  const el = document.querySelector(sel)
  if (!(el instanceof HTMLElement)) throw new Error(`Missing ${sel}`)
  return el
}
