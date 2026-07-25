import { SPECTRUM_COUNT } from './spectrum'

export type GateShape = 'triangle' | 'circle' | 'square' | 'star' | 'arch' | 'hexagon'
export type GatePattern = 'solid' | 'striped' | 'dashed' | 'dual'
export type GateMotion = 'static' | 'bob' | 'pulse' | 'rotate' | 'zigzag'

export type Gate = {
  id: number
  x: number
  baseY: number
  y: number
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
  cleared: boolean
  missed: boolean
  points: number
}

const SHAPES: GateShape[] = ['triangle', 'circle', 'square', 'star', 'arch', 'hexagon']
const PATTERNS: GatePattern[] = ['solid', 'striped', 'dashed', 'dual']
/** How often a rush gate appears — rolled once per run (1st / 3rd / 5th / 7th). */
const RUSH_INTERVALS = [1, 3, 5, 7] as const

export class GateManager {
  gates: Gate[] = []
  private nextId = 1
  private colorCursor = 0
  private spawnIndex = 0
  private rushEvery = 3

  reset(_viewW: number): void {
    this.gates = []
    this.nextId = 1
    this.colorCursor = Math.floor(Math.random() * SPECTRUM_COUNT)
    this.spawnIndex = 0
    this.rushEvery = RUSH_INTERVALS[Math.floor(Math.random() * RUSH_INTERVALS.length)]!
  }

  update(
    dt: number,
    scrollSpeed: number,
    viewH: number,
    viewW: number,
    distance: number,
    gapScale = 1,
    sizeScale = 1.5,
  ): void {
    for (const g of this.gates) {
      const rush = g.rush ? scrollSpeed * 2.4 + 420 : 0
      g.x -= (scrollSpeed + rush) * dt
      g.phase += dt * g.speed
      this.applyMotion(g, viewH, distance)
    }

    this.gates = this.gates.filter((g) => g.x > -220)

    const difficulty = Math.min(1, distance / 2500)
    // Triple base spacing; gapScale from difficulty still applies
    const gap = (280 - difficulty * 90) * gapScale * 3
    const ahead = viewW + 220
    let guard = 0
    while (guard++ < 10) {
      const farthest = this.gates.reduce((m, g) => Math.max(m, g.x), 0)
      if (this.gates.length > 0 && farthest > ahead) break
      const x = (this.gates.length ? farthest : ahead * 0.7) + gap + Math.random() * 80
      this.gates.push(this.makeGate(x, viewH, difficulty, sizeScale))
    }
  }

  private makeGate(x: number, viewH: number, difficulty: number, sizeScale: number): Gate {
    this.spawnIndex += 1
    const shapePool =
      difficulty < 0.2
        ? (['circle', 'square', 'arch', 'triangle'] as GateShape[])
        : difficulty < 0.45
          ? (['circle', 'square', 'arch', 'triangle', 'hexagon'] as GateShape[])
          : SHAPES
    const shape = pick(shapePool, difficulty)
    let pattern = pick(PATTERNS, difficulty)

    // No wobble yet — motion patterns saved for later levels
    const motion: GateMotion = 'static'

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

    // Level 1: ~50% larger openings
    const openHalf =
      Math.max(48, lerp(92, 56, difficulty) + Math.random() * 14 - difficulty * 6) * sizeScale
    const openHalfW = sizeForShape(shape, openHalf)
    const baseY = viewH * (0.28 + Math.random() * 0.44)
    const rush = this.spawnIndex % this.rushEvery === 0

    return {
      id: this.nextId++,
      x,
      baseY,
      y: baseY,
      openHalf,
      openHalfW,
      frameThick: (16 + Math.random() * 6) * Math.min(1.25, sizeScale),
      shape,
      pattern,
      motion,
      color,
      angle: 0,
      phase: Math.random() * Math.PI * 2,
      speed: 1.2 + difficulty * 2.2 + Math.random(),
      dualGap: 48 + Math.random() * 30,
      rush,
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

  private applyMotion(g: Gate, viewH: number, _distance: number): void {
    // Wobble disabled for now (later levels)
    if (g.motion === 'static') {
      g.y = g.baseY
      g.angle = 0
      return
    }

    const amp = Math.min(viewH * 0.18, 70)
    switch (g.motion) {
      case 'bob':
        g.y = g.baseY + Math.sin(g.phase) * amp
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
        g.y = g.baseY + Math.sin(g.phase * 2.1) * amp * 0.85
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
  if (g.motion !== 'pulse') return 1
  return 0.7 + 0.3 * Math.sin(g.phase * 1.4)
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
