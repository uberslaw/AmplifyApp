import { AudioBus } from './audio'
import { testGateCrossing } from './collision'
import {
  CHARACTERS,
  DIFFICULTIES,
  VEHICLES,
  characterById,
  difficultyById,
  vehicleById,
  type CharacterId,
  type DifficultyId,
  type VehicleId,
} from './config'
import { GateManager } from './gates'
import { Input } from './input'
import { drawMeteors, MeteorManager } from './meteors'
import { drawChaseNyan, NyanChase } from './nyan'
import {
  drawWingPickup,
  drawWingShieldAura,
  PowerupManager,
} from './powerups'
import {
  clearSave,
  hasSave,
  loadHighScores,
  loadSave,
  loadSettings,
  saveSettings,
  submitHighScore,
  writeSave,
  type Settings,
} from './persist'
import { drawRainbowStreamer, Player } from './player'
import { drawFlash, drawGates, drawPlayer } from './render'
import { drawShatter, ShatterSystem } from './shatter'
import { SPECTRUM, SpectrumTracker } from './spectrum'
import { drawStarfield, makeStarfield, type Starfield } from './starfield'
import { GAME_BUILD_UTC, GAME_VERSION } from './version'

export type UiScreen =
  | 'main'
  | 'settings'
  | 'difficulty'
  | 'character'
  | 'vehicle'
  | 'controls'
  | 'scores'
  | 'exit'
  | 'pause'
  | 'none'

export type GameMode = 'menu' | 'playing' | 'paused' | 'gameover' | 'won'

export class Game {
  mode: GameMode = 'menu'
  score = 0
  distance = 0
  best = 0
  misses = 0

  private player = new Player()
  private gates = new GateManager()
  private chase = new NyanChase()
  private spectrum = new SpectrumTracker()
  private meteors = new MeteorManager()
  private powerups = new PowerupManager()
  private shatter = new ShatterSystem()
  private audio = new AudioBus()
  private starfield: Starfield | null = null
  private settings: Settings = loadSettings()
  private scroll = 0
  private scrollSpeed = 220
  private flash = 0
  private flashColor = 'rgba(255, 220, 120, 1)'
  private crashShake = 0
  private thrustSoundT = 0
  private w = 800
  private h = 450
  private uiScreen: UiScreen = 'main'
  private returnToPauseSettings = false

  private els: {
    screens: Record<string, HTMLElement>
    hud: HTMLElement
    nyanBanner: HTMLElement
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
    wingsHud: HTMLElement
    continueBtn: HTMLButtonElement
    settingsSummary: HTMLElement
    difficultyList: HTMLElement
    characterList: HTMLElement
    vehicleList: HTMLElement
    scoresList: HTMLElement
    saveToast: HTMLElement
    versionLabel: HTMLElement
  }

  private ctx: CanvasRenderingContext2D
  private input: Input

  constructor(ctx: CanvasRenderingContext2D, input: Input) {
    this.ctx = ctx
    this.input = input
    this.best = loadHighScores()[0]?.score ?? 0
    this.player.applyLoadout(this.settings.character, this.settings.vehicle)

    this.els = {
      screens: {
        main: must('#menu-main'),
        settings: must('#menu-settings'),
        difficulty: must('#menu-difficulty'),
        character: must('#menu-character'),
        vehicle: must('#menu-vehicle'),
        controls: must('#menu-controls'),
        scores: must('#menu-scores'),
        exit: must('#menu-exit'),
        pause: must('#menu-pause'),
        over: must('#game-over'),
      },
      hud: must('#hud'),
      nyanBanner: must('#nyan-banner'),
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
      wingsHud: must('#wings-hud'),
      continueBtn: must('#btn-continue') as HTMLButtonElement,
      settingsSummary: must('#settings-summary'),
      difficultyList: must('#difficulty-list'),
      characterList: must('#character-list'),
      vehicleList: must('#vehicle-list'),
      scoresList: must('#scores-list'),
      saveToast: must('#save-toast'),
      versionLabel: must('#game-version'),
    }

    this.els.versionLabel.textContent = `v${GAME_VERSION} · ${GAME_BUILD_UTC}`
    this.buildSpectrumHud()
    this.buildOptionLists()
    this.bindMenus()
    this.showUi('main')
    this.syncContinue()
    this.syncSettingsSummary()
  }

  resize(w: number, h: number): void {
    this.w = w
    this.h = h
    this.starfield = makeStarfield(w, h)
    if (this.mode === 'menu') {
      this.player.reset(h, w)
      this.player.applyLoadout(this.settings.character, this.settings.vehicle)
    }
  }

  update(dt: number): void {
    if (this.mode === 'menu') {
      this.player.update(
        dt,
        Math.sin(performance.now() * 0.0015) * 0.2,
        0,
        true,
        this.h,
        this.w,
      )
      this.scroll += 50 * dt
      this.meteors.update(dt * 0.3, this.w, this.h, 80, 0.5)
      this.draw()
      this.input.endFrame()
      return
    }

    if (this.mode === 'gameover' || this.mode === 'won') {
      this.crashShake = Math.max(0, this.crashShake - dt)
      this.flash = Math.max(0, this.flash - dt)
      this.draw()
      this.input.endFrame()
      return
    }

    if (this.input.state.pausePressed) {
      if (this.mode === 'playing') {
        this.mode = 'paused'
        this.showUi('pause')
      } else if (this.mode === 'paused' && this.uiScreen === 'pause') {
        this.resume()
      }
    }

    if (this.mode === 'paused') {
      this.draw()
      this.syncBanners()
      this.input.endFrame()
      return
    }

    // Playing
    this.spectrum.tick(dt)
    const diff = difficultyById(this.settings.difficulty)
    const veh = vehicleById(this.settings.vehicle)
    const boost = this.input.state.boost
    const spectrumBoost = this.player.spectrumBoost > 0

    this.scrollSpeed =
      210 +
      veh.speed +
      this.spectrum.speedBonus +
      (boost ? 70 : 0) +
      (spectrumBoost ? 90 : 0) +
      Math.min(80, this.distance / 40)

    const playerDx = this.player.update(
      dt,
      this.input.getSteerY(),
      this.input.getSteerX(),
      boost,
      this.h,
      this.w,
    )

    const scrollDelta = this.scrollSpeed * dt
    this.scroll += scrollDelta
    this.distance += scrollDelta / 10

    this.gates.update(
      dt,
      this.scrollSpeed,
      this.h,
      this.w,
      this.distance,
      diff.gateGapScale,
      diff.gateSizeScale,
    )
    this.meteors.update(dt, this.w, this.h, this.distance, diff.meteorRate)
    this.shatter.update(dt, this.scrollSpeed)

    const hb = this.player.hitbox()
    const caughtWing = this.powerups.update(dt, this.scrollSpeed, this.w, this.h, hb)
    if (caughtWing) {
      this.score += Math.floor(250 * diff.scoreMult)
      this.flash = 0.28
      this.flashColor = 'rgba(255, 140, 40, 0.95)'
      this.audio.powerup()
    }

    const caught = this.chase.update(
      dt,
      this.scrollSpeed,
      hb,
      this.w,
      this.h,
      this.spectrum.cycles,
    )
    if (caught) {
      this.score += Math.floor((5000 + this.spectrum.cycles * 1000) * diff.scoreMult)
      this.audio.nyanCatch(true)
      this.finish('won', 'Caught Nyan Cat!')
      this.draw()
      this.input.endFrame()
      return
    }

    if (this.meteors.hitsPlayer(hb)) {
      if (this.powerups.hasShield) {
        this.flash = 0.12
        this.flashColor = 'rgba(255, 180, 80, 0.75)'
        this.audio.shieldBlock()
        this.meteors.knockAwayFrom(hb.x, hb.y)
      } else {
        this.finish('gameover', 'Meteor strike!')
        this.draw()
        this.input.endFrame()
        return
      }
    }

    for (const gate of this.gates.gates) {
      const result = testGateCrossing(hb, gate, scrollDelta, playerDx)
      if (result.kind === 'clear') {
        gate.cleared = true
        this.shatter.burst(gate)
        const { isNew, fullSpectrum } = this.spectrum.collect(gate.color)
        this.score += Math.floor(
          (gate.points + (isNew ? 50 : 0) + (fullSpectrum ? 500 : 0)) * diff.scoreMult,
        )
        this.flash = fullSpectrum ? 0.35 : 0.18
        this.flashColor = SPECTRUM[gate.color]!.hex
        if (fullSpectrum) {
          this.player.triggerSpectrumTrail(4.8)
          this.audio.nyanCatch(false)
        } else {
          this.audio.gateClear()
        }
      } else if (result.kind === 'hit') {
        // Clipped the rim — wing charges can absorb the miss
        gate.missed = true
        if (this.powerups.tryAbsorbMiss()) {
          this.flash = 0.16
          this.flashColor = 'rgba(255, 160, 60, 0.85)'
          this.audio.shieldBlock()
        } else {
          this.misses += 1
          this.flash = 0.2
          this.flashColor = 'rgba(255, 80, 60, 0.9)'
          this.audio.crash()
          if (this.misses >= diff.maxMisses) {
            this.finish('gameover', 'Too many clipped gates!')
            break
          }
        }
      } else if (result.kind === 'miss') {
        // Flew above/below — no colour, no miss penalty
        gate.missed = true
      }
    }

    this.thrustSoundT -= dt
    if ((boost || spectrumBoost) && this.thrustSoundT <= 0) {
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

  private startNew(fromSave = false): void {
    this.audio.unlock()
    const diff = difficultyById(this.settings.difficulty)
    this.player.applyLoadout(this.settings.character, this.settings.vehicle)

    if (fromSave) {
      const save = loadSave()
      if (!save) {
        this.startNew(false)
        return
      }
      this.settings = { ...save.settings }
      saveSettings(this.settings)
      this.player.applyLoadout(this.settings.character, this.settings.vehicle)
      this.score = save.score
      this.distance = save.distance
      this.misses = save.misses
      this.spectrum.reset()
      this.spectrum.cycles = save.spectrumCycles
      this.spectrum.speedBonus = save.spectrumSpeedBonus
      this.spectrum.collected = new Set(save.spectrumCollected)
      this.gates.reset(this.w)
      this.meteors.reset()
      this.powerups.reset()
      this.shatter.reset()
      this.chase.reset(this.h, diff.nyanCruise, diff.spectraToCatch)
      this.chase.nyan.gap = save.nyanGap
    } else {
      clearSave()
      this.score = 0
      this.distance = 0
      this.misses = 0
      this.spectrum.reset()
      this.gates.reset(this.w)
      this.meteors.reset()
      this.powerups.reset()
      this.shatter.reset()
      this.chase.reset(this.h, diff.nyanCruise, diff.spectraToCatch)
    }

    this.scroll = 0
    this.scrollSpeed = 220
    this.flash = 0
    this.crashShake = 0
    this.player.reset(this.h, this.w)
    this.player.applyLoadout(this.settings.character, this.settings.vehicle)
    this.mode = 'playing'
    this.showUi('none')
    this.syncHud()
  }

  private resume(): void {
    this.mode = 'playing'
    this.showUi('none')
  }

  private saveProgress(): void {
    writeSave({
      version: 1,
      savedAt: Date.now(),
      score: this.score,
      distance: this.distance,
      misses: this.misses,
      spectrumCollected: [...this.spectrum.collected],
      spectrumCycles: this.spectrum.cycles,
      spectrumSpeedBonus: this.spectrum.speedBonus,
      nyanGap: this.chase.nyan.gap,
      settings: { ...this.settings },
    })
    this.els.saveToast.classList.remove('hidden')
    window.setTimeout(() => this.els.saveToast.classList.add('hidden'), 1400)
    this.syncContinue()
  }

  private finish(mode: 'gameover' | 'won', reason: string): void {
    this.mode = mode
    if (mode === 'gameover') {
      this.audio.crash()
      this.crashShake = 0.45
      this.flash = 0.4
      this.flashColor = 'rgba(255, 60, 40, 1)'
    } else {
      this.flash = 0.5
      this.flashColor = 'rgba(255, 200, 255, 1)'
    }
    clearSave()
    const scores = submitHighScore({
      score: this.score,
      distance: Math.floor(this.distance),
      spectra: this.spectrum.cycles,
      difficulty: this.settings.difficulty,
      character: this.settings.character,
      vehicle: this.settings.vehicle,
      at: Date.now(),
    })
    this.best = scores[0]?.score ?? this.score
    this.els.overTitle.textContent = reason
    this.els.finalScore.textContent = String(this.score)
    this.els.finalBest.textContent = String(this.best)
    this.showUi('over')
    this.syncContinue()
  }

  private quitToMenu(): void {
    this.mode = 'menu'
    this.showUi('main')
    this.syncContinue()
  }

  private draw(): void {
    const ctx = this.ctx
    const shakeX = this.crashShake > 0 ? (Math.random() - 0.5) * 14 * this.crashShake : 0
    const shakeY = this.crashShake > 0 ? (Math.random() - 0.5) * 14 * this.crashShake : 0
    ctx.save()
    ctx.translate(shakeX, shakeY)
    if (!this.starfield) this.starfield = makeStarfield(this.w, this.h)
    drawStarfield(ctx, this.w, this.h, this.starfield, this.scroll, this.player.cameraBob)
    if (this.mode === 'playing' || this.mode === 'paused' || this.mode === 'gameover' || this.mode === 'won') {
      drawGates(ctx, this.gates.gates)
      drawShatter(ctx, this.shatter.shards)
      drawMeteors(ctx, this.meteors.meteors)
      drawWingPickup(ctx, this.powerups.wing)
      drawChaseNyan(ctx, this.chase, this.player.x, this.w)
      drawRainbowStreamer(ctx, this.player)
      if (this.powerups.hasShield) {
        drawWingShieldAura(
          ctx,
          this.player.x,
          this.player.y + this.player.cameraBob,
          this.player.radius,
          this.powerups.buff.shieldTime,
        )
      }
      drawPlayer(ctx, this.player)
    } else {
      drawMeteors(ctx, this.meteors.meteors)
      drawRainbowStreamer(ctx, this.player)
      drawPlayer(ctx, this.player)
    }
    drawFlash(ctx, this.w, this.h, this.flash, this.flashColor)
    ctx.restore()
  }

  private showUi(screen: UiScreen | 'over'): void {
    this.uiScreen = screen === 'over' ? 'none' : screen
    for (const [key, el] of Object.entries(this.els.screens)) {
      if (key === 'over') el.classList.toggle('hidden', screen !== 'over')
      else el.classList.toggle('hidden', key !== screen)
    }
    const playingHud = this.mode === 'playing' || this.mode === 'paused'
    this.els.hud.classList.toggle('hidden', !playingHud || screen === 'pause')
  }

  private bindMenus(): void {
    document.querySelectorAll<HTMLElement>('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action
        if (!action) return
        this.onAction(action)
      })
    })
  }

  private onAction(action: string): void {
    this.audio.unlock()
    switch (action) {
      case 'new-game':
        this.startNew(false)
        break
      case 'continue':
        if (hasSave()) this.startNew(true)
        break
      case 'settings':
        this.returnToPauseSettings = false
        this.showUi('settings')
        this.syncSettingsSummary()
        break
      case 'pause-settings':
        this.returnToPauseSettings = true
        this.showUi('settings')
        this.syncSettingsSummary()
        break
      case 'high-scores':
        this.renderScores()
        this.showUi('scores')
        break
      case 'exit':
        this.showUi('exit')
        break
      case 'exit-confirm':
        this.attemptExit()
        break
      case 'back-main':
        if (this.mode === 'paused') {
          this.showUi('pause')
        } else {
          this.mode = 'menu'
          this.showUi('main')
        }
        break
      case 'back-settings':
        this.showUi('settings')
        break
      case 'settings-difficulty':
        this.showUi('difficulty')
        break
      case 'settings-character':
        this.showUi('character')
        break
      case 'settings-vehicle':
        this.showUi('vehicle')
        break
      case 'settings-controls':
        this.showUi('controls')
        break
      case 'resume':
        this.resume()
        break
      case 'save-game':
        this.saveProgress()
        break
      case 'quit-to-menu':
        this.quitToMenu()
        break
      default:
        break
    }
  }

  private attemptExit(): void {
    // Browsers block window.close() unless opened by script; fall back to a quiet end screen.
    window.close()
    this.els.screens.exit!.innerHTML = `
      <h2 class="menu-title">Thanks for playing</h2>
      <p class="tagline">You can close this tab anytime. Progress stays in this browser if you saved.</p>
      <button type="button" class="menu-btn secondary" data-action="back-main">Back to Menu</button>
    `
    this.els.screens.exit!.querySelector('[data-action="back-main"]')?.addEventListener('click', () => {
      // restore exit screen content by reload is heavy — just go main
      location.reload()
    })
  }

  private buildOptionLists(): void {
    this.els.difficultyList.innerHTML = ''
    for (const d of DIFFICULTIES) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'option-card'
      btn.dataset.id = d.id
      btn.innerHTML = `<strong>${d.name}</strong><span>${d.description}</span>`
      btn.addEventListener('click', () => {
        this.settings.difficulty = d.id as DifficultyId
        saveSettings(this.settings)
        this.syncOptionSelection()
        this.syncSettingsSummary()
        if (this.returnToPauseSettings) this.showUi('settings')
        else this.showUi('settings')
      })
      this.els.difficultyList.appendChild(btn)
    }

    this.els.characterList.innerHTML = ''
    for (const c of CHARACTERS) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'option-card'
      btn.dataset.id = c.id
      btn.innerHTML = `<strong>${c.name}</strong><span>${c.description}</span>`
      btn.addEventListener('click', () => {
        this.settings.character = c.id as CharacterId
        saveSettings(this.settings)
        this.player.applyLoadout(this.settings.character, this.settings.vehicle)
        this.syncOptionSelection()
        this.syncSettingsSummary()
        this.showUi('settings')
      })
      this.els.characterList.appendChild(btn)
    }

    this.els.vehicleList.innerHTML = ''
    for (const v of VEHICLES) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'option-card'
      btn.dataset.id = v.id
      btn.innerHTML = `<strong>${v.name}</strong><span>${v.description}<br/>Speed ${v.speed >= 0 ? '+' : ''}${v.speed} · Handling ×${v.handling} · Hitbox ×${v.hitbox}</span>`
      btn.addEventListener('click', () => {
        this.settings.vehicle = v.id as VehicleId
        saveSettings(this.settings)
        this.player.applyLoadout(this.settings.character, this.settings.vehicle)
        this.syncOptionSelection()
        this.syncSettingsSummary()
        this.showUi('settings')
      })
      this.els.vehicleList.appendChild(btn)
    }
    this.syncOptionSelection()
  }

  private syncOptionSelection(): void {
    this.els.difficultyList.querySelectorAll<HTMLElement>('.option-card').forEach((el) => {
      el.classList.toggle('selected', el.dataset.id === this.settings.difficulty)
    })
    this.els.characterList.querySelectorAll<HTMLElement>('.option-card').forEach((el) => {
      el.classList.toggle('selected', el.dataset.id === this.settings.character)
    })
    this.els.vehicleList.querySelectorAll<HTMLElement>('.option-card').forEach((el) => {
      el.classList.toggle('selected', el.dataset.id === this.settings.vehicle)
    })
  }

  private syncSettingsSummary(): void {
    const d = difficultyById(this.settings.difficulty)
    const c = characterById(this.settings.character)
    const v = vehicleById(this.settings.vehicle)
    this.els.settingsSummary.textContent = `${d.name} · ${c.name} · ${v.name}`
  }

  private syncContinue(): void {
    this.els.continueBtn.disabled = !hasSave()
  }

  private renderScores(): void {
    const scores = loadHighScores()
    if (!scores.length) {
      this.els.scoresList.innerHTML = '<li class="empty">No scores yet — catch Nyan!</li>'
      return
    }
    this.els.scoresList.innerHTML = scores
      .map((s, i) => {
        const d = difficultyById(s.difficulty).name
        const v = vehicleById(s.vehicle).name
        return `<li><span>${i + 1}</span><span>${s.score} · ${d} · ${v}</span><span>${s.distance}m</span></li>`
      })
      .join('')
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

  private syncHud(): void {
    const diff = difficultyById(this.settings.difficulty)
    this.els.score.textContent = String(this.score)
    this.els.distance.textContent = String(Math.floor(this.distance))
    this.els.best.textContent = String(this.best)
    const bonus = this.powerups.buff.missCharges
    this.els.misses.textContent =
      bonus > 0
        ? `${this.misses}/${diff.maxMisses} (+${bonus})`
        : `${this.misses}/${diff.maxMisses}`
    this.els.spectra.textContent = `${this.spectrum.cycles}/${diff.spectraToCatch}`
    this.els.gap.textContent = `${Math.floor(this.chase.nyan.gap)}m`
    const shield = this.powerups.buff.shieldTime
    const showWings = shield > 0 || bonus > 0 || !!this.powerups.wing
    this.els.wingsHud.classList.toggle('hidden', !showWings)
    if (showWings) {
      if (shield > 0 || bonus > 0) {
        this.els.wingsHud.textContent = `Wings ${Math.ceil(shield)}s · ${bonus} free miss${bonus === 1 ? '' : 'es'}`
      } else {
        this.els.wingsHud.textContent = 'Wings inbound — catch them!'
      }
    }
    this.els.spectrumRow.querySelectorAll<HTMLElement>('.spec-dot').forEach((d, i) => {
      d.classList.toggle('on', this.spectrum.has(i))
    })
  }

  private syncBanners(): void {
    const text = this.powerups.banner ?? this.spectrum.banner ?? this.chase.banner
    this.els.nyanBanner.classList.toggle('hidden', !text)
    if (text) this.els.nyanBanner.textContent = text
  }
}

function must(sel: string): HTMLElement {
  const el = document.querySelector(sel)
  if (!(el instanceof HTMLElement)) throw new Error(`Missing ${sel}`)
  return el
}
