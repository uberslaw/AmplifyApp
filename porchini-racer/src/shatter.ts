import type { Gate } from './gates'
import { GATE_HOLE_SCALE } from './shapes'
import { SPECTRUM } from './spectrum'

export type Shard = {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  spin: number
  life: number
  maxLife: number
  size: number
  color: string
  /** 3–5 pointed shard outline in local space. */
  verts: { x: number; y: number }[]
}

const SHATTER_LIFE = 1.0
/** Enough shards to read as a dense break-up (~1s fade). */
const SHARD_COUNT = 720

export class ShatterSystem {
  shards: Shard[] = []

  reset(): void {
    this.shards = []
  }

  /** Burst a cleared gate into many shards of its spectrum colour. */
  burst(gate: Gate): void {
    const base = SPECTRUM[gate.color % SPECTRUM.length]!.hex
    const shades = [shade(base, 40), base, shade(base, -30), shade(base, -55)]
    const pulse = 1
    const oh = gate.openHalf * pulse
    const ow = gate.openHalfW * pulse
    const n = SHARD_COUNT + Math.floor(Math.random() * 80)

    for (let i = 0; i < n; i++) {
      // Spawn around the rim / hollow so it reads as the gate breaking
      const t = i / n
      const onRim = Math.random() < 0.72
      const rad = onRim
        ? (GATE_HOLE_SCALE + Math.random() * (1 - GATE_HOLE_SCALE)) * Math.max(oh, ow)
        : Math.random() * GATE_HOLE_SCALE * Math.max(oh, ow) * 0.85
      const a = Math.random() * Math.PI * 2
      const lx = Math.cos(a) * rad * (ow / Math.max(oh, 1))
      const ly = Math.sin(a) * rad
      const cos = Math.cos(gate.angle)
      const sin = Math.sin(gate.angle)
      const wx = gate.x + lx * cos - ly * sin
      const wy = gate.y + lx * sin + ly * cos

      const speed = 80 + Math.random() * 420
      const outA = a + (Math.random() - 0.5) * 0.8
      const size = 2.2 + Math.random() * 7.5
      this.shards.push({
        x: wx,
        y: wy,
        vx: Math.cos(outA) * speed * (0.55 + Math.random()),
        vy: Math.sin(outA) * speed * (0.55 + Math.random()) - 40 - Math.random() * 120,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 14,
        life: SHATTER_LIFE * (0.75 + Math.random() * 0.35),
        maxLife: SHATTER_LIFE,
        size,
        color: shades[Math.floor(Math.random() * shades.length)]!,
        verts: makeShardVerts(size, t),
      })
    }
  }

  update(dt: number, scrollSpeed: number): void {
    for (const s of this.shards) {
      s.life -= dt
      s.x -= scrollSpeed * dt * 0.35
      s.x += s.vx * dt
      s.y += s.vy * dt
      s.vy += 520 * dt
      s.vx *= 1 - Math.min(1, dt * 0.8)
      s.rot += s.spin * dt
    }
    this.shards = this.shards.filter((s) => s.life > 0)
  }
}

function makeShardVerts(size: number, seed: number): { x: number; y: number }[] {
  const n = 3 + Math.floor((seed * 17) % 3)
  const verts: { x: number; y: number }[] = []
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + seed
    const r = size * (0.45 + ((seed * 13 + i * 7) % 10) * 0.06)
    verts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r })
  }
  return verts
}

function shade(hex: string, amount: number): string {
  const n = hex.replace('#', '')
  const r = Math.min(255, Math.max(0, parseInt(n.slice(0, 2), 16) + amount))
  const g = Math.min(255, Math.max(0, parseInt(n.slice(2, 4), 16) + amount))
  const b = Math.min(255, Math.max(0, parseInt(n.slice(4, 6), 16) + amount))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function drawShatter(ctx: CanvasRenderingContext2D, shards: Shard[]): void {
  for (const s of shards) {
    const t = Math.max(0, s.life / s.maxLife)
    // Fade over the last ~second of life
    const alpha = t * t * (0.55 + 0.45 * t)
    if (alpha < 0.02) continue
    ctx.save()
    ctx.translate(s.x, s.y)
    ctx.rotate(s.rot)
    ctx.globalAlpha = alpha
    ctx.fillStyle = s.color
    ctx.beginPath()
    const v0 = s.verts[0]!
    ctx.moveTo(v0.x, v0.y)
    for (let i = 1; i < s.verts.length; i++) {
      const v = s.verts[i]!
      ctx.lineTo(v.x, v.y)
    }
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
  ctx.globalAlpha = 1
}
