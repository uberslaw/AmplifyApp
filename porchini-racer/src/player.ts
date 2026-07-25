import type { Character, Vehicle } from './config'
import { characterById, vehicleById, type CharacterId, type VehicleId } from './config'
import { SPECTRUM } from './spectrum'

export type FlameParticle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  hue: number
  rainbow?: boolean
}

export type TrailPoint = { x: number; y: number; life: number }

export class Player {
  x = 160
  y = 0
  vx = 0
  vy = 0
  tilt = 0
  radius = 36
  boosting = false
  /** Active after a full spectrum — rainbow jet trail + speed feel. */
  spectrumBoost = 0
  cameraBob = 0
  character: Character = characterById('pilot')
  vehicle: Vehicle = vehicleById('blaze')

  readonly flames: FlameParticle[] = []
  /** Thick rainbow streamer behind the mushroom during spectrum boost. */
  readonly rainbowTrail: TrailPoint[] = []
  private thrustTimer = 0

  applyLoadout(characterId: CharacterId, vehicleId: VehicleId): void {
    this.character = characterById(characterId)
    this.vehicle = vehicleById(vehicleId)
    this.radius = 36 * (0.92 + (1 - this.vehicle.hitbox) * 0.08)
  }

  reset(viewH: number, viewW = 800): void {
    this.x = Math.min(180, viewW * 0.2)
    this.y = viewH * 0.5
    this.vx = 0
    this.vy = 0
    this.tilt = 0
    this.boosting = false
    this.spectrumBoost = 0
    this.cameraBob = 0
    this.flames.length = 0
    this.rainbowTrail.length = 0
    this.thrustTimer = 0
  }

  /** Call when a full spectrum is completed. */
  triggerSpectrumTrail(seconds = 4.5): void {
    this.spectrumBoost = Math.max(this.spectrumBoost, seconds)
  }

  /**
   * @param steerY vertical [-1,1] (neg = up)
   * @param steerX horizontal [-1,1] (neg = back / left)
   * @returns horizontal displacement this frame (for gate crossing)
   */
  update(
    dt: number,
    steerY: number,
    steerX: number,
    boost: boolean,
    viewH: number,
    viewW: number,
  ): number {
    this.spectrumBoost = Math.max(0, this.spectrumBoost - dt)
    const rainbow = this.spectrumBoost > 0
    const powered = boost || rainbow
    const handle = this.vehicle.handling
    // +50% arrow-key / WASD movement speed
    const maxSpeedY = (powered ? 420 : 320) * (0.9 + handle * 0.1) * 1.5
    const maxSpeedX = (powered ? 280 : 220) * (0.9 + handle * 0.1) * 1.5
    this.boosting = boost

    const targetY = steerY * maxSpeedY
    const targetX = steerX * maxSpeedX
    const respY = (steerY === 0 ? 6 : 10) * handle
    const respX = (steerX === 0 ? 7 : 11) * handle
    this.vy += (targetY - this.vy) * Math.min(1, dt * respY)
    this.vx += (targetX - this.vx) * Math.min(1, dt * respX)

    const prevX = this.x
    this.y += this.vy * dt
    this.x += this.vx * dt

    const margin = this.radius + 8
    if (this.y < margin) {
      this.y = margin
      this.vy = Math.max(0, this.vy)
    }
    if (this.y > viewH - margin) {
      this.y = viewH - margin
      this.vy = Math.min(0, this.vy)
    }
    // Stay on-screen horizontally — can move forward/back in the window
    const minX = margin + 10
    const maxX = viewW - margin - 24
    if (this.x < minX) {
      this.x = minX
      this.vx = Math.max(0, this.vx)
    }
    if (this.x > maxX) {
      this.x = maxX
      this.vx = Math.min(0, this.vx)
    }

    this.tilt += (this.vy * 0.0009 + this.vx * 0.00025 - this.tilt) * Math.min(1, dt * 10)
    this.cameraBob = Math.sin(performance.now() * 0.012) * (powered ? 3.5 : 1.8)

    this.spawnFlames(dt, powered, rainbow)
    this.updateFlames(dt)

    if (rainbow) {
      this.rainbowTrail.unshift({ x: this.x - this.radius * 0.9, y: this.y + 8, life: 0.55 })
      if (this.rainbowTrail.length > 48) this.rainbowTrail.length = 48
    }
    for (let i = this.rainbowTrail.length - 1; i >= 0; i--) {
      const p = this.rainbowTrail[i]!
      p.life -= dt
      p.x -= 220 * dt
      if (p.life <= 0) this.rainbowTrail.splice(i, 1)
    }

    return this.x - prevX
  }

  hitbox(): { x: number; y: number; r: number } {
    const r = this.radius * 0.72 * this.vehicle.hitbox
    return { x: this.x + 6, y: this.y + 2, r }
  }

  private spawnFlames(dt: number, powered: boolean, rainbow: boolean): void {
    this.thrustTimer += dt
    const thrust = this.vehicle.thrust
    const rate = (powered ? 0.012 : 0.022) / thrust
    while (this.thrustTimer >= rate) {
      this.thrustTimer -= rate
      const count = Math.ceil((powered ? 3 : 2) * thrust)
      for (let i = 0; i < count; i++) {
        this.flames.push({
          x: this.x - this.radius * 0.85,
          y: this.y + 10 + (Math.random() - 0.5) * 18,
          vx: -180 - Math.random() * (powered ? 220 : 120) * thrust,
          vy: (Math.random() - 0.5) * 80,
          life: 0.28 + Math.random() * 0.22,
          maxLife: 0.5,
          size: (6 + Math.random() * (powered ? 10 : 6)) * (0.85 + thrust * 0.2),
          hue: rainbow ? (i * 51 + performance.now() * 0.2) % 360 : 25 + Math.random() * 35,
          rainbow,
        })
      }
    }
    if (this.flames.length > 140) {
      this.flames.splice(0, this.flames.length - 140)
    }
  }

  private updateFlames(dt: number): void {
    for (let i = this.flames.length - 1; i >= 0; i--) {
      const p = this.flames[i]!
      p.life -= dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 40 * dt
      p.size *= 0.98
      if (p.life <= 0) this.flames.splice(i, 1)
    }
  }
}

export function drawRainbowStreamer(ctx: CanvasRenderingContext2D, player: Player): void {
  const trail = player.rainbowTrail
  if (trail.length < 2) return
  for (let i = trail.length - 1; i >= 1; i--) {
    const a = trail[i]!
    const b = trail[i - 1]!
    const t = i / trail.length
    const col = SPECTRUM[i % SPECTRUM.length]!.hex
    ctx.strokeStyle = col
    ctx.globalAlpha = Math.min(0.95, a.life * 1.6) * (0.45 + (1 - t) * 0.55)
    ctx.lineWidth = 14 + (1 - t) * 16
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}
