import { gatePulseScale, type Gate } from './gates'
import { pointInGateOpening } from './shapes'

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

  const prevGateX = gate.x + scrollDelta
  const crossed = prevGateX > player.x && gate.x <= player.x
  if (!crossed) return { kind: 'none' }

  const pulse = gatePulseScale(gate)
  const openHalf = gate.openHalf * pulse
  const openHalfW = gate.openHalfW * pulse

  if (gate.pattern === 'dual') {
    const topY = gate.y - gate.dualGap * 0.5
    const botY = gate.y + gate.dualGap * 0.5
    const inTop = inOpening(player, gate, topY, openHalf * 0.72, openHalfW * 0.9)
    const inBot = inOpening(player, gate, botY, openHalf * 0.72, openHalfW * 0.9)
    if (inTop || inBot) return { kind: 'clear', gate }
    if (Math.abs(player.y - gate.y) < openHalf + gate.dualGap) {
      return { kind: 'hit', gate }
    }
    return { kind: 'miss', gate }
  }

  if (inOpening(player, gate, gate.y, openHalf, openHalfW)) {
    return { kind: 'clear', gate }
  }

  const span = openHalf + gate.frameThick * 2.4
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
  return pointInGateOpening(gate.shape, lx, ly, openHalf, openHalfW, player.r)
}
