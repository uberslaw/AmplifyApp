export type FlameParticle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  hue: number
}

export class Player {
  /** World-space position of mushroom center. */
  x = 160
  y = 0
  vy = 0
  /** Visual pitch from vertical velocity. */
  tilt = 0
  radius = 36
  boosting = false
  nyanPower = false
  cameraBob = 0

  readonly flames: FlameParticle[] = []
  private thrustTimer = 0

  reset(viewH: number): void {
    this.x = Math.min(180, viewH * 0.22)
    this.y = viewH * 0.5
    this.vy = 0
    this.tilt = 0
    this.boosting = false
    this.nyanPower = false
    this.cameraBob = 0
    this.flames.length = 0
    this.thrustTimer = 0
  }

  update(dt: number, steer: number, boost: boolean, viewH: number, nyanPower = false): void {
    const powered = boost || nyanPower
    const maxSpeed = powered ? 420 : 320
    this.boosting = boost
    this.nyanPower = nyanPower

    const target = steer * maxSpeed
    const responsiveness = steer === 0 ? 6 : 10
    this.vy += (target - this.vy) * Math.min(1, dt * responsiveness)
    this.y += this.vy * dt

    const margin = this.radius + 8
    if (this.y < margin) {
      this.y = margin
      this.vy = Math.max(0, this.vy)
    }
    if (this.y > viewH - margin) {
      this.y = viewH - margin
      this.vy = Math.min(0, this.vy)
    }

    this.tilt += (this.vy * 0.0009 - this.tilt) * Math.min(1, dt * 10)
    this.cameraBob = Math.sin(performance.now() * 0.012) * (powered ? 3.5 : 1.8)

    this.spawnFlames(dt, powered, nyanPower)
    this.updateFlames(dt)
  }

  /** Hitbox used for gate collisions — slightly smaller than visual. */
  hitbox(): { x: number; y: number; r: number } {
    return { x: this.x + 6, y: this.y + 2, r: this.radius * 0.72 }
  }

  private spawnFlames(dt: number, powered: boolean, rainbow: boolean): void {
    this.thrustTimer += dt
    const rate = powered ? 0.012 : 0.022
    while (this.thrustTimer >= rate) {
      this.thrustTimer -= rate
      const count = powered ? 3 : 2
      for (let i = 0; i < count; i++) {
        this.flames.push({
          x: this.x - this.radius * 0.85,
          y: this.y + 10 + (Math.random() - 0.5) * 18,
          vx: -180 - Math.random() * (powered ? 220 : 120),
          vy: (Math.random() - 0.5) * 80,
          life: 0.28 + Math.random() * 0.22,
          maxLife: 0.5,
          size: 6 + Math.random() * (powered ? 10 : 6),
          hue: rainbow ? Math.random() * 360 : 25 + Math.random() * 35,
        })
      }
    }
    if (this.flames.length > 120) {
      this.flames.splice(0, this.flames.length - 120)
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
