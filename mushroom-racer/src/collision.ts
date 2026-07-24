import { gatePulseScale, type Gate } from './gates'

export type CollisionResult =
  | { kind: 'none' }
  | { kind: 'clear'; gate: Gate }
  | { kind: 'hit'; gate: Gate }
  | { kind: 'miss'; gate: Gate }

/**
 * Gates scroll left past a fixed on-screen player. When a gate's X crosses
 * the player this frame, test whether the hit circle fits the opening.
 */
export function testGateCrossing(
  player: { x: number; y: number; r: number },
  gate: Gate,
  scrollDelta: number,
): CollisionResult {
  if (gate.cleared || gate.missed) return { kind: 'none' }

  // Gate moved from (gate.x + scrollDelta) to gate.x; did it pass player.x?
  const prevGateX = gate.x + scrollDelta
  const crossed = prevGateX > player.x && gate.x <= player.x
  if (!crossed) return { kind: 'none' }

  const pulse = gatePulseScale(gate)
  const openHalf = gate.openHalf * pulse
  const openHalfW = gate.openHalfW * pulse

  if (gate.pattern === 'dual') {
    const topY = gate.y - gate.dualGap * 0.5
    const botY = gate.y + gate.dualGap * 0.5
    const inTop = inOpening(player, gate, topY, openHalf * 0.72, openHalfW)
    const inBot = inOpening(player, gate, botY, openHalf * 0.72, openHalfW)
    if (inTop || inBot) return { kind: 'clear', gate }
    if (Math.abs(player.y - gate.y) < openHalf + gate.dualGap) {
      return { kind: 'hit', gate }
    }
    return { kind: 'miss', gate }
  }

  if (inOpening(player, gate, gate.y, openHalf, openHalfW)) {
    return { kind: 'clear', gate }
  }

  const span = openHalf + gate.frameThick * 2.2
  if (Math.abs(player.y - gate.y) < span) {
    return { kind: 'hit', gate }
  }
  return { kind: 'miss', gate }
}

function inOpening(
  player: { x: number; y: number; r: number },
  gate: Gate,
  cy: number,
  openHalf: number,
  openHalfW: number,
): boolean {
  const cos = Math.cos(-gate.angle)
  const sin = Math.sin(-gate.angle)
  const dx = player.x - gate.x
  const dy = player.y - cy
  const lx = dx * cos - dy * sin
  const ly = dx * sin + dy * cos

  switch (gate.shape) {
    case 'oval': {
      const rx = openHalfW + 8
      const ry = openHalf
      const nx = lx / Math.max(1, rx)
      const ny = ly / Math.max(1, ry - player.r * 0.2)
      return nx * nx + ny * ny <= 1
    }
    case 'diamond': {
      const rx = openHalfW + 14
      const ry = openHalf
      return Math.abs(lx) / rx + Math.abs(ly) / ry <= 1 - player.r / (ry + 40)
    }
    case 'parallelogram': {
      const skew = 0.35
      const localY = ly + lx * skew
      return Math.abs(localY) < openHalf - player.r * 0.85
    }
    case 'rect':
    default:
      return Math.abs(ly) < openHalf - player.r * 0.85
  }
}
