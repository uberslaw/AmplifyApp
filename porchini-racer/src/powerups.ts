/** Buffalo-chicken-wing powerups — tumble through the course once a minute. */

export type WingPickup = {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  spin: number
  phase: number
  /** Base Y for bobbing path. */
  baseY: number
  r: number
}

export type WingBuff = {
  /** Meteor shield + visual aura remaining (seconds). */
  shieldTime: number
  /** Gate-rim hits absorbed before counting as real misses. */
  missCharges: number
}

const SPAWN_INTERVAL = 60
const FIRST_SPAWN_AT = 60
const SHIELD_DURATION = 14
const MISS_CHARGES_ON_PICKUP = 2
const MAX_MISS_CHARGES = 4

export class PowerupManager {
  wing: WingPickup | null = null
  buff: WingBuff = { shieldTime: 0, missCharges: 0 }
  /** Brief collect callout for the banner. */
  banner: string | null = null
  private bannerT = 0
  private playTime = 0
  private nextSpawnAt = FIRST_SPAWN_AT

  reset(): void {
    this.wing = null
    this.buff = { shieldTime: 0, missCharges: 0 }
    this.banner = null
    this.bannerT = 0
    this.playTime = 0
    this.nextSpawnAt = FIRST_SPAWN_AT
  }

  get hasShield(): boolean {
    return this.buff.shieldTime > 0
  }

  update(
    dt: number,
    scrollSpeed: number,
    viewW: number,
    viewH: number,
    player: { x: number; y: number; r: number },
  ): boolean {
    this.playTime += dt
    this.buff.shieldTime = Math.max(0, this.buff.shieldTime - dt)

    if (this.bannerT > 0) {
      this.bannerT -= dt
      if (this.bannerT <= 0) this.banner = null
    }

    if (!this.wing && this.playTime >= this.nextSpawnAt) {
      this.spawn(viewW, viewH, scrollSpeed)
      this.nextSpawnAt = this.playTime + SPAWN_INTERVAL
    }

    if (!this.wing) return false

    const w = this.wing
    w.phase += dt * 2.4
    w.rot += w.spin * dt
    // World scroll + own tumble drift — often ahead so you must push forward
    w.x -= scrollSpeed * dt
    w.x += w.vx * dt
    w.baseY += w.vy * dt
    w.y = w.baseY + Math.sin(w.phase) * 42

    // Soft bounce off top/bottom
    const pad = w.r + 20
    if (w.baseY < pad) {
      w.baseY = pad
      w.vy = Math.abs(w.vy)
    } else if (w.baseY > viewH - pad) {
      w.baseY = viewH - pad
      w.vy = -Math.abs(w.vy)
    }

    // Off-screen left — missed the snack
    if (w.x < -80) {
      this.wing = null
      return false
    }

    const dx = w.x - player.x
    const dy = w.y - player.y
    const reach = w.r + player.r * 0.85
    if (dx * dx + dy * dy <= reach * reach) {
      this.collect()
      return true
    }
    return false
  }

  /** Absorb a gate clip if charges remain. Returns true if absorbed. */
  tryAbsorbMiss(): boolean {
    if (this.buff.missCharges <= 0) return false
    this.buff.missCharges -= 1
    return true
  }

  private collect(): void {
    this.wing = null
    this.buff.shieldTime = Math.max(this.buff.shieldTime, SHIELD_DURATION)
    this.buff.missCharges = Math.min(
      MAX_MISS_CHARGES,
      this.buff.missCharges + MISS_CHARGES_ON_PICKUP,
    )
    this.banner = 'BUFFALO WINGS!'
    this.bannerT = 1.6
  }

  private spawn(viewW: number, viewH: number, _scrollSpeed: number): void {
    // Appear ahead on the right — world-scrolls left; slight relative drift means
    // you often need a forward burst (D / → / boost) and vertical match.
    const ahead = viewW * (0.78 + Math.random() * 0.28)
    const baseY = viewH * (0.22 + Math.random() * 0.56)
    this.wing = {
      x: ahead,
      y: baseY,
      baseY,
      // Relative to scroll: slightly slower approach so a dash can catch it
      vx: 35 + Math.random() * 55,
      vy: (Math.random() - 0.5) * 90,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() < 0.5 ? -1 : 1) * (3.2 + Math.random() * 4.5),
      phase: Math.random() * Math.PI * 2,
      r: 22,
    }
  }
}

export function drawWingPickup(ctx: CanvasRenderingContext2D, wing: WingPickup | null): void {
  if (!wing) return
  ctx.save()
  ctx.translate(wing.x, wing.y)
  ctx.rotate(wing.rot)

  // Soft sauce glow
  const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, wing.r * 2.4)
  glow.addColorStop(0, 'rgba(255, 120, 40, 0.45)')
  glow.addColorStop(1, 'rgba(255, 60, 20, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(0, 0, wing.r * 2.4, 0, Math.PI * 2)
  ctx.fill()

  drawChickenWing(ctx, wing.r)
  ctx.restore()
}

export function drawWingShieldAura(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  shieldTime: number,
): void {
  if (shieldTime <= 0) return
  const pulse = 0.55 + 0.45 * Math.sin(performance.now() * 0.008)
  const alpha = Math.min(0.55, 0.25 + shieldTime * 0.02) * pulse
  ctx.save()
  ctx.translate(x, y)
  const g = ctx.createRadialGradient(0, 0, radius * 0.6, 0, 0, radius * 2.1)
  g.addColorStop(0, `rgba(255, 160, 60, ${alpha * 0.35})`)
  g.addColorStop(0.55, `rgba(255, 90, 30, ${alpha * 0.45})`)
  g.addColorStop(1, 'rgba(255, 40, 10, 0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(0, 0, radius * 2.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = `rgba(255, 200, 120, ${0.35 + pulse * 0.35})`
  ctx.lineWidth = 2.5
  ctx.setLineDash([6, 5])
  ctx.beginPath()
  ctx.arc(0, 0, radius * 1.55, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()
}

function drawChickenWing(ctx: CanvasRenderingContext2D, r: number): void {
  const s = r / 22
  ctx.scale(s, s)

  // Drumstick / bone tip
  ctx.fillStyle = '#f0e0c8'
  ctx.beginPath()
  ctx.ellipse(-14, 10, 5, 3.5, -0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(-18, 13, 3.2, 2.4, -0.5, 0, Math.PI * 2)
  ctx.fill()

  // Meaty mid section (buffalo sauce)
  const meat = ctx.createLinearGradient(-10, -12, 16, 14)
  meat.addColorStop(0, '#ff6a28')
  meat.addColorStop(0.45, '#e03810')
  meat.addColorStop(1, '#a82008')
  ctx.fillStyle = meat
  ctx.beginPath()
  ctx.moveTo(-12, 6)
  ctx.quadraticCurveTo(-16, -8, -2, -14)
  ctx.quadraticCurveTo(14, -16, 18, -4)
  ctx.quadraticCurveTo(20, 8, 8, 14)
  ctx.quadraticCurveTo(-6, 16, -12, 6)
  ctx.closePath()
  ctx.fill()

  // Sauce sheen
  ctx.fillStyle = 'rgba(255, 220, 140, 0.35)'
  ctx.beginPath()
  ctx.ellipse(2, -6, 7, 3.5, -0.5, 0, Math.PI * 2)
  ctx.fill()

  // Flat tip (wingette)
  ctx.fillStyle = '#d03010'
  ctx.beginPath()
  ctx.moveTo(10, -2)
  ctx.quadraticCurveTo(22, -10, 24, 2)
  ctx.quadraticCurveTo(18, 12, 8, 10)
  ctx.closePath()
  ctx.fill()

  // Tiny sauce drip
  ctx.fillStyle = '#ff7020'
  ctx.beginPath()
  ctx.ellipse(4, 14, 2.2, 3.5, 0.1, 0, Math.PI * 2)
  ctx.fill()
}
