import { gatePulseScale, type Gate } from './gates'
import { GATE_CLEAR_SCALE, GATE_HOLE_SCALE, pointInGateOpening } from './shapes'

export type CollisionResult =
  | { kind: 'none' }
  | { kind: 'clear'; gate: Gate }
  | { kind: 'hit'; gate: Gate }
  | { kind: 'miss'; gate: Gate }

/**
 * Gates scroll left past a fixed on-screen player. When a gate's X crosses
 * the player this frame, test whether they pass through the hollow middle
 * (clear), clip the rainbow rim (hit), or miss the gate entirely.
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
    const top = classifyOpening(player, gate, topY, openHalf * 0.78, openHalfW)
    const bot = classifyOpening(player, gate, botY, openHalf * 0.78, openHalfW)
    if (top === 'clear' || bot === 'clear') return { kind: 'clear', gate }
    if (top === 'rim' || bot === 'rim') return { kind: 'hit', gate }
    return { kind: 'miss', gate }
  }

  const result = classifyOpening(player, gate, gate.y, openHalf, openHalfW)
  if (result === 'clear') return { kind: 'clear', gate }
  if (result === 'rim') return { kind: 'hit', gate }
  return { kind: 'miss', gate }
}

function classifyOpening(
  player: { x: number; y: number; r: number },
  gate: Gate,
  cy: number,
  openHalf: number,
  openHalfW: number,
): 'clear' | 'rim' | 'out' {
  const cos = Math.cos(-gate.angle)
  const sin = Math.sin(-gate.angle)
  const dx = player.x - gate.x
  const dy = player.y - cy
  const lx = dx * cos - dy * sin
  const ly = dx * sin + dy * cos

  // Side-scroller forgiveness: mostly care about vertical alignment through the hole
  const clearHalf = openHalf * GATE_CLEAR_SCALE
  const clearHalfW = openHalfW * GATE_CLEAR_SCALE
  // Expand clear zone (negative pad) so the mushroom can fit the visible hole
  const inHole = pointInGateOpening(gate.shape, lx, ly, clearHalf, clearHalfW, -player.r * 0.15)
  if (inHole) return 'clear'

  // Also accept if roughly centered in Y within the visual hole band
  if (Math.abs(ly) < openHalf * GATE_HOLE_SCALE * 0.95 && Math.abs(lx) < openHalfW + 40) {
    return 'clear'
  }

  const inOuter = pointInGateOpening(gate.shape, lx, ly, openHalf * 1.05, openHalfW * 1.05, player.r * 0.15)
  if (inOuter) return 'rim'
  return 'out'
}
