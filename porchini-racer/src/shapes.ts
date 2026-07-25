import type { GateShape } from './gates'

/** Inner hollow as a fraction of the outer rim — must match portal rendering. */
export const GATE_HOLE_SCALE = 0.86
/** Clear zone matches the drawn hollow (art opening). */
export const GATE_CLEAR_SCALE = GATE_HOLE_SCALE

/** Build the geometric outline for a gate opening (local space, centered). */
export function pathGateShape(
  ctx: CanvasRenderingContext2D,
  shape: GateShape,
  openHalf: number,
  openHalfW: number,
  startNewPath = true,
): void {
  if (startNewPath) ctx.beginPath()
  switch (shape) {
    case 'circle': {
      const r = Math.max(openHalf, openHalfW)
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      break
    }
    case 'square': {
      const s = Math.max(openHalf, openHalfW)
      ctx.rect(-s, -s, s * 2, s * 2)
      break
    }
    case 'triangle': {
      const h = openHalf
      const w = openHalfW + 14
      ctx.moveTo(0, -h)
      ctx.lineTo(w, h)
      ctx.lineTo(-w, h)
      ctx.closePath()
      break
    }
    case 'hexagon': {
      const r = Math.max(openHalf, openHalfW)
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 6 + (Math.PI / 3) * i
        const x = Math.cos(a) * r
        const y = Math.sin(a) * r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      break
    }
    case 'star': {
      const outer = Math.max(openHalf, openHalfW)
      const inner = outer * 0.42
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? outer : inner
        const a = -Math.PI / 2 + (Math.PI / 5) * i
        const x = Math.cos(a) * rad
        const y = Math.sin(a) * rad
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      break
    }
    case 'arch': {
      // Closed rainbow archway (roman arch): pillars + semicircle top
      const w = openHalfW + 20
      const h = openHalf
      ctx.moveTo(-w, h)
      ctx.lineTo(-w, 0)
      ctx.arc(0, 0, w, Math.PI, 0, false)
      ctx.lineTo(w, h)
      ctx.closePath()
      break
    }
  }
}

/**
 * Whether a local-space point (lx, ly) lies inside the gate opening,
 * shrunk by player radius for a fair hitbox.
 */
export function pointInGateOpening(
  shape: GateShape,
  lx: number,
  ly: number,
  openHalf: number,
  openHalfW: number,
  playerR: number,
): boolean {
  // pad > 0 shrinks the opening; pad < 0 expands it (collision forgiveness)
  const pad = playerR * 0.8
  switch (shape) {
    case 'circle': {
      const r = Math.max(12, Math.max(openHalf, openHalfW) - pad)
      return lx * lx + ly * ly <= r * r
    }
    case 'square': {
      const s = Math.max(12, Math.max(openHalf, openHalfW) - pad)
      return Math.abs(lx) <= s && Math.abs(ly) <= s
    }
    case 'triangle': {
      const h = openHalf
      const w = openHalfW + 14
      const scale = Math.max(0.45, 1 - pad / Math.max(h, w))
      return pointInTriangle(lx, ly, 0, -h * scale, w * scale, h * scale, -w * scale, h * scale)
    }
    case 'hexagon': {
      const r = Math.max(12, Math.max(openHalf, openHalfW) - pad)
      return pointInHex(lx, ly, r)
    }
    case 'star': {
      // Generous inner disk — stars read as a portal, not a tiny bullseye
      const inner = Math.max(14, Math.max(openHalf, openHalfW) * 0.62 - pad * 0.35)
      return lx * lx + ly * ly <= inner * inner
    }
    case 'arch': {
      // Full arch interior: pillars + semicircle (same outline as pathGateShape)
      const w = Math.max(16, openHalfW + 20 - pad * 0.35)
      const h = Math.max(16, openHalf - pad * 0.25)
      if (Math.abs(lx) > w) return false
      if (ly > h) return false
      // Semicircle roof (top half) + rectangular passage below
      if (ly <= 0) return lx * lx + ly * ly <= w * w
      return true
    }
  }
}

function pointInTriangle(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
): boolean {
  const d1 = cross(px, py, x1, y1, x2, y2)
  const d2 = cross(px, py, x2, y2, x3, y3)
  const d3 = cross(px, py, x3, y3, x1, y1)
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0
  return !(hasNeg && hasPos)
}

function cross(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  return (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2)
}

/** Flat-top regular hexagon, circumradius r. */
function pointInHex(lx: number, ly: number, r: number): boolean {
  const x = Math.abs(lx)
  const y = Math.abs(ly)
  const h = r * Math.sin(Math.PI / 3) // √3/2 * r
  if (x > r || y > h) return false
  return y <= h - x * Math.tan(Math.PI / 6)
}
