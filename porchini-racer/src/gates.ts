import { SPECTRUM_COUNT } from './spectrum'
import { DEFAULT_TUNABLES, type Tunables } from './tunables'

export type GateShape = 'triangle' | 'circle' | 'square' | 'star' | 'arch' | 'hexagon'
export type GatePattern = 'solid' | 'striped' | 'dashed' | 'dual'
export type GateMotion = 'static' | 'bob' | 'pulse' | 'rotate' | 'zigzag' | 'bounce' | 'resize' | 'resizeBounce'

export type Gate = {
  id: number
  x: number
  baseY: number
  y: number
  /** Base opening half-height (before pulse/resize). */
  openHalf: number
  openHalfW: number
  frameThick: number
  shape: GateShape
  pattern: GatePattern
  motion: GateMotion
  /** Index into SPECTRUM — gate is this single colour. */
  color: number
  angle: number
  phase: number
  speed: number
  dualGap: number
  /** Extra approach speed — rushes at the player. */
  rush: boolean
  /** World units/sec extra horizontal drift (bounce X). */
  driftX: number
  /** Bounce Y amplitude range (absolute px). */
  bounceMinY: number
  bounceMaxY: number
  resizeMin: number
  resizeMax: number
  cleared: boolean
  missed: boolean
  points: number
}

const SHAPES: GateShape[] = ['triangle', 'circle', 'square', 'star', 'arch', 'hexagon']
const PATTERNS: GatePattern[] = ['solid', 'striped', 'dashed', 'dual']

export class GateManager {
  gates: Gate[] = []
  private nextId = 1
  private colorCursor = 0
  private spawnIndex = 0

  reset(_viewW: number, _tunables: Tunables = DEFAULT_TUNABLES): void {
    this.gates = []
    this.nextId = 1
    this.colorCursor = Math.floor(Math.random() * SPECTRUM_COUNT)
    this.spawnIndex = 0
  }

  update(
    dt: number,
    scrollSpeed: number,
    viewH: number,
    viewW: number,
    distance: number,
    gapScale = 1,
    sizeScale = 1.5,
    tunables: Tunables = DEFAULT_TUNABLES,
  ): void {
    for (const g of this.gates) {
      const rushExtra =
        g.rush ? scrollSpeed * Math.max(0, tunables.rushSpeedMult) + 120 : 0
      g.x -= (scrollSpeed + rushExtra) * dt
      g.x += g.driftX * dt
      g.phase += dt * g.speed
      this.applyMotion(g, viewH)
    }

    this.gates = this.gates.filter((g) => g.x > -220 && g.x < viewW + 800)

    const difficulty = Math.min(1, distance / 2500)
    const spacing = Math.max(0.25, tunables.gateSpacing)
    const freq = Math.max(0.25, tunables.gateFrequency)
    const gap = ((280 - difficulty * 90) * gapScale * 3 * spacing) / freq
    const ahead = viewW + 220
    let guard = 0
    while (guard++ < 12) {
      const farthest = this.gates.reduce((m, g) => Math.max(m, g.x), 0)
      if (this.gates.length > 0 && farthest > ahead) break
      const x = (this.gates.length ? farthest : ahead * 0.7) + gap + Math.random() * 60
      this.gates.push(this.makeGate(x, viewH, difficulty, sizeScale, tunables))
    }
  }

  private makeGate(
    x: number,
    viewH: number,
    difficulty: number,
    sizeScale: number,
    t: Tunables,
  ): Gate {
    this.spawnIndex += 1
    const shapePool =
      difficulty < 0.2
        ? (['circle', 'square', 'arch', 'triangle'] as GateShape[])
        : difficulty < 0.45
          ? (['circle', 'square', 'arch', 'triangle', 'hexagon'] as GateShape[])
          : SHAPES
    const shape = pick(shapePool, difficulty)
    let pattern = pick(PATTERNS, difficulty)

    if (difficulty < 0.35 && Math.random() < 0.7) pattern = 'solid'
    if (pattern === 'dual' && (shape === 'star' || shape === 'arch' || difficulty < 0.35)) {
      pattern = 'solid'
    }

    let color: number
    if (Math.random() < 0.55) {
      color = this.colorCursor % SPECTRUM_COUNT
      this.colorCursor += 1 + (Math.random() < 0.25 ? 1 : 0)
    } else {
      color = Math.floor(Math.random() * SPECTRUM_COUNT)
    }

    const rush = t.rushEveryN > 0 && this.spawnIndex % Math.max(1, Math.floor(t.rushEveryN)) === 0
    const sizeMult = t.gateSize * (rush ? t.rushSizeMult : 1)
    const openHalf =
      Math.max(48, lerp(92, 56, difficulty) + Math.random() * 14 - difficulty * 6) *
      sizeScale *
      sizeMult
    const openHalfW = sizeForShape(shape, openHalf)

    const y0 = Math.min(t.bounceYMin, t.bounceYMax)
    const y1 = Math.max(t.bounceYMin, t.bounceYMax)
    const bounceMinY = viewH * y0
    const bounceMaxY = viewH * y1
    const baseY = bounceMinY + Math.random() * Math.max(8, bounceMaxY - bounceMinY)

    const roll = Math.random()
    let motion: GateMotion = 'static'
    if (roll < t.resizeBounceChance) motion = 'resizeBounce'
    else if (roll < t.resizeBounceChance + t.resizeChance) motion = 'resize'
    else if (roll < t.resizeBounceChance + t.resizeChance + t.bounceChance) motion = 'bounce'

    const driftX =
      motion === 'bounce' || motion === 'resizeBounce'
        ? (Math.random() < 0.5 ? -1 : 1) * t.bounceSpeedX
        : 0

    const speed =
      motion === 'resize' || motion === 'resizeBounce'
        ? t.resizeSpeed * (0.85 + Math.random() * 0.3)
        : motion === 'bounce'
          ? t.bounceSpeedY * (0.85 + Math.random() * 0.3)
          : 1.2 + difficulty * 2.2 + Math.random()

    return {
      id: this.nextId++,
      x,
      baseY,
      y: baseY,
      openHalf,
      openHalfW,
      frameThick: (16 + Math.random() * 6) * Math.min(1.25, sizeScale * t.gateSize),
      shape,
      pattern,
      motion,
      color,
      angle: 0,
      phase: Math.random() * Math.PI * 2,
      speed,
      dualGap: 48 + Math.random() * 30,
      rush,
      driftX,
      bounceMinY,
      bounceMaxY,
      resizeMin: t.resizeMin,
      resizeMax: t.resizeMax,
      cleared: false,
      missed: false,
      points:
        80 +
        Math.floor(difficulty * 120) +
        (rush ? 120 : 0) +
        (motion !== 'static' ? 40 : 0) +
        (shape === 'star' || shape === 'hexagon' ? 30 : 0),
    }
  }

  private applyMotion(g: Gate, viewH: number): void {
    switch (g.motion) {
      case 'bounce':
      case 'resizeBounce': {
        const mid = (g.bounceMinY + g.bounceMaxY) * 0.5
        const amp = Math.max(8, (g.bounceMaxY - g.bounceMinY) * 0.5)
        g.y = mid + Math.sin(g.phase) * amp
        g.angle = 0
        break
      }
      case 'resize':
        g.y = g.baseY
        g.angle = 0
        break
      case 'bob':
        g.y = g.baseY + Math.sin(g.phase) * Math.min(viewH * 0.18, 70)
        g.angle = 0
        break
      case 'pulse':
        g.y = g.baseY
        g.angle = 0
        break
      case 'rotate':
        g.y = g.baseY
        g.angle =
          g.shape === 'arch' ? Math.sin(g.phase * 0.5) * 0.15 : Math.sin(g.phase * 0.7) * 0.45
        break
      case 'zigzag':
        g.y = g.baseY + Math.sin(g.phase * 2.1) * Math.min(viewH * 0.18, 70) * 0.85
        g.angle = Math.sin(g.phase) * 0.2
        break
      default:
        g.y = g.baseY
        g.angle = 0
    }
    const pad = g.openHalf + 40
    g.y = Math.max(pad, Math.min(viewH - pad, g.y))
  }
}

export function gatePulseScale(g: Gate): number {
  if (g.motion === 'pulse') return 0.7 + 0.3 * Math.sin(g.phase * 1.4)
  if (g.motion === 'resize' || g.motion === 'resizeBounce') {
    const lo = Math.min(g.resizeMin, g.resizeMax)
    const hi = Math.max(g.resizeMin, g.resizeMax)
    const u = 0.5 + 0.5 * Math.sin(g.phase)
    return lo + (hi - lo) * u
  }
  return 1
}

function sizeForShape(shape: GateShape, openHalf: number): number {
  switch (shape) {
    case 'circle':
    case 'square':
    case 'hexagon':
    case 'star':
      return openHalf
    case 'triangle':
      return openHalf * 0.85
    case 'arch':
      return openHalf * 0.75
  }
}

function pick<T>(arr: T[], difficulty: number): T {
  const idx = Math.min(
    arr.length - 1,
    Math.floor(Math.random() * arr.length * (0.55 + difficulty * 0.55)),
  )
  return arr[idx]!
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
