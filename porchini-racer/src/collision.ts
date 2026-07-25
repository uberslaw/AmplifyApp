import { gatePulseScale, type Gate } from './gates'
import { GATE_HOLE_SCALE, pointInGateOpening } from './shapes'

export type CollisionResult =
  | { kind: 'none' }
  | { kind: 'clear'; gate: Gate }
  | { kind: 'hit'; gate: Gate }
  | { kind: 'miss'; gate: Gate }

/**
 * Side-scroller gate test: when the gate plane crosses the player,
 * clear if inside the visual hollow (art boundary), hit on the rim.
 */
export function testGateCrossing(
  player: { x: number; y: number; r: number },
  gate: Gate,
  scrollDelta: number,
  playerDx = 0,
): CollisionResult {
  if (gate.cleared || gate.missed) return { kind: 'none' }

  const prevPlayerX = player.x - playerDx
  const prevGateX = gate.x + scrollDelta
  const crossed = prevGateX > prevPlayerX && gate.x <= player.x
  if (!crossed) return { kind: 'none' }

  const pulse = gatePulseScale(gate)
  const openHalf = gate.openHalf * pulse
  const openHalfW = gate.openHalfW * pulse
  // Clear zone = rendered hollow (GATE_HOLE_SCALE), same as art opening
  const holeH = openHalf * GATE_HOLE_SCALE
  const holeW = openHalfW * GATE_HOLE_SCALE

  // Player → gate local space
  const dx = player.x - gate.x
  const dy = player.y - gate.y
  const c = Math.cos(-gate.angle)
  const s = Math.sin(-gate.angle)
  const lx = dx * c - dy * s
  const ly = dx * s + dy * c

  // Forgiveness: expand hollow a bit so the mushroom body fits the art gap
  const clearPad = -player.r * 0.55

  if (gate.pattern === 'dual') {
    const offsets = [-gate.dualGap * 0.5, gate.dualGap * 0.5]
    const h = holeH * 0.72
    const w = holeW
    let inHole = false
    let inOuter = false
    for (const oy of offsets) {
      const ply = ly - oy
      if (pointInGateOpening(gate.shape, lx, ply, h, w, clearPad)) inHole = true
      if (
        pointInGateOpening(
          gate.shape,
          lx,
          ply,
          openHalf * 0.72 + gate.frameThick * 0.5,
          openHalfW + gate.frameThick * 0.5,
          player.r * 0.05,
        )
      ) {
        inOuter = true
      }
    }
    if (inHole) return { kind: 'clear', gate }
    if (inOuter) return { kind: 'hit', gate }
    return { kind: 'miss', gate }
  }

  // Clear = inside the visible hollow (full art opening, not a tiny bullseye)
  if (pointInGateOpening(gate.shape, lx, ly, holeH, holeW, clearPad)) {
    return { kind: 'clear', gate }
  }

  // Rim = outer art frame
  if (
    pointInGateOpening(
      gate.shape,
      lx,
      ly,
      openHalf + gate.frameThick * 0.55,
      openHalfW + gate.frameThick * 0.55,
      player.r * 0.05,
    )
  ) {
    return { kind: 'hit', gate }
  }

  return { kind: 'miss', gate }
}
