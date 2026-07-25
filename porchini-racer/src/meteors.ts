export type Meteor = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  rot: number
  spin: number
  trail: { x: number; y: number }[]
}

export class MeteorManager {
  meteors: Meteor[] = []
  private spawnT = 1.2

  reset(): void {
    this.meteors = []
    this.spawnT = 1.5
  }

  update(dt: number, viewW: number, viewH: number, distance: number, rateMult = 1): void {
    const difficulty = Math.min(1, distance / 2200)
    this.spawnT -= dt * rateMult
    if (this.spawnT <= 0) {
      this.spawn(viewW, viewH, difficulty)
      this.spawnT = Math.max(0.28, (1.35 - difficulty * 0.7 + Math.random() * 0.55) / rateMult)
      if (difficulty > 0.35 && Math.random() < 0.28 * rateMult) {
        this.spawn(viewW, viewH, difficulty)
      }
    }

    for (const m of this.meteors) {
      m.x += m.vx * dt
      m.y += m.vy * dt
      m.rot += m.spin * dt
      m.trail.unshift({ x: m.x, y: m.y })
      if (m.trail.length > 10) m.trail.length = 10
    }

    this.meteors = this.meteors.filter(
      (m) => m.y < viewH + 80 && m.x > -80 && m.x < viewW + 120,
    )
  }

  hitsPlayer(player: { x: number; y: number; r: number }): boolean {
    for (const m of this.meteors) {
      const dx = m.x - player.x
      const dy = m.y - player.y
      const reach = m.r * 0.85 + player.r * 0.75
      if (dx * dx + dy * dy <= reach * reach) return true
    }
    return false
  }

  private spawn(viewW: number, viewH: number, difficulty: number): void {
    const fromTop = Math.random() < 0.75
    const r = 8 + Math.random() * (10 + difficulty * 8)
    const speed = 180 + difficulty * 160 + Math.random() * 120
    if (fromTop) {
      this.meteors.push({
        x: Math.random() * viewW * 1.1,
        y: -30 - Math.random() * 40,
        vx: -40 - Math.random() * 90 - difficulty * 40,
        vy: speed * (0.75 + Math.random() * 0.45),
        r,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 8,
        trail: [],
      })
    } else {
      // Rain in from upper-right
      this.meteors.push({
        x: viewW + 40,
        y: Math.random() * viewH * 0.45,
        vx: -speed * (0.7 + Math.random() * 0.5),
        vy: speed * (0.35 + Math.random() * 0.4),
        r,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 8,
        trail: [],
      })
    }
  }
}

export function drawMeteors(ctx: CanvasRenderingContext2D, meteors: Meteor[]): void {
  for (const m of meteors) {
    // Trail
    for (let i = m.trail.length - 1; i >= 1; i--) {
      const a = m.trail[i]!
      const b = m.trail[i - 1]!
      const t = i / m.trail.length
      ctx.strokeStyle = `rgba(255, ${140 + Math.floor(t * 80)}, 80, ${0.15 + (1 - t) * 0.45})`
      ctx.lineWidth = m.r * (0.4 + (1 - t) * 0.8)
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }

    ctx.save()
    ctx.translate(m.x, m.y)
    ctx.rotate(m.rot)

    // Glow
    const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, m.r * 2.2)
    glow.addColorStop(0, 'rgba(255, 200, 120, 0.55)')
    glow.addColorStop(1, 'rgba(255, 80, 40, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(0, 0, m.r * 2.2, 0, Math.PI * 2)
    ctx.fill()

    // Rock
    ctx.fillStyle = '#5a4638'
    ctx.beginPath()
    const spikes = 7
    for (let i = 0; i < spikes; i++) {
      const a = (Math.PI * 2 * i) / spikes
      const rad = m.r * (0.75 + ((i * 37) % 5) * 0.06)
      const x = Math.cos(a) * rad
      const y = Math.sin(a) * rad
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#8a7060'
    ctx.beginPath()
    ctx.arc(-m.r * 0.2, -m.r * 0.15, m.r * 0.35, 0, Math.PI * 2)
    ctx.fill()

    // Hot face
    ctx.fillStyle = 'rgba(255, 160, 60, 0.75)'
    ctx.beginPath()
    ctx.arc(m.r * 0.15, m.r * 0.1, m.r * 0.4, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }
}
