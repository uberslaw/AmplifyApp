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
  cleared: boolean
  missed: boolean
  points: number
}

const SHAPES: GateShape[] = ['triangle', 'circle', 'square', 'star', 'arch', 'hexagon']
const PATTERNS: GatePattern[] = ['solid', 'striped', 'dashed', 'dual']
const MOTIONS: GateMotion[] = ['static', 'bob', 'pulse', 'rotate', 'zigzag']

export class GateManager {
  gates: Gate[] = []
  private nextId = 1
  private colorCursor = 0

  reset(_viewW: number): void {
    this.gates = []
    this.nextId = 1
    this.colorCursor = Math.floor(Math.random() * SPECTRUM_COUNT)
  }

  update(
    dt: number,
    scrollSpeed: number,
    viewH: number,
    viewW: number,
    distance: number,
    gapScale = 1,
  ): void {
    for (const g of this.gates) {
      g.x -= scrollSpeed * dt
      g.phase += dt * g.speed
      this.applyMotion(g, viewH)
    }

    this.gates = this.gates.filter((g) => g.x > -200)

    const difficulty = Math.min(1, distance / 2500)
    const gap = (280 - difficulty * 90) * gapScale
    const ahead = viewW + 160
    let guard = 0
    while (guard++ < 12) {
      const farthest = this.gates.reduce((m, g) => Math.max(m, g.x), 0)
      if (this.gates.length > 0 && farthest > ahead) break
      const x = (this.gates.length ? farthest : ahead * 0.55) + gap + Math.random() * 50
      this.gates.push(this.makeGate(x, viewH, difficulty))
    }
  }

  private makeGate(x: number, viewH: number, difficulty: number): Gate {
    const shapePool =
      difficulty < 0.15
        ? (['circle', 'square', 'arch', 'triangle'] as GateShape[])
        : difficulty < 0.4
          ? (['circle', 'square', 'arch', 'triangle', 'hexagon'] as GateShape[])
          : SHAPES
    const shape = pick(shapePool, difficulty)
    let pattern = pick(PATTERNS, difficulty)
    const motion = pick(MOTIONS, difficulty * 0.9)

    if (difficulty < 0.2 && Math.random() < 0.55) pattern = 'solid'
    if (pattern === 'dual' && (shape === 'star' || shape === 'arch')) {
      pattern = Math.random() < 0.5 ? 'striped' : 'solid'
    }

    // Bias toward missing spectrum colours by walking a shuffled cycle with noise
    let color: number
    if (Math.random() < 0.55) {
      color = this.colorCursor % SPECTRUM_COUNT
      this.colorCursor += 1 + (Math.random() < 0.25 ? 1 : 0)
    } else {
      color = Math.floor(Math.random() * SPECTRUM_COUNT)
    }

    const openHalf = Math.max(36, lerp(78, 44, difficulty) + Math.random() * 16 - difficulty * 8)
    const openHalfW = sizeForShape(shape, openHalf)
    const baseY = viewH * (0.28 + Math.random() * 0.44)

    return {
      id: this.nextId++,
      x,
      baseY,
      y: baseY,
      openHalf,
      openHalfW,
      frameThick: 16 + Math.random() * 6,
      shape,
      pattern,
      motion: difficulty < 0.15 && Math.random() < 0.5 ? 'static' : motion,
      color,
      angle: 0,
      phase: Math.random() * Math.PI * 2,
      speed: 1.2 + difficulty * 2.2 + Math.random(),
      dualGap: 48 + Math.random() * 30,
      cleared: false,
      missed: false,
      points:
        80 +
        Math.floor(difficulty * 120) +
        (motion !== 'static' ? 40 : 0) +
        (shape === 'star' || shape === 'hexagon' ? 30 : 0),
    }
  }

  private applyMotion(g: Gate, viewH: number): void {
    const amp = Math.min(viewH * 0.18, 70)
    switch (g.motion) {
      case 'static':
        g.y = g.baseY
        g.angle = 0
        break
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
