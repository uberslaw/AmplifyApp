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
  // Match the rendered hollow (same scale as drawPortal inner path)
  const holeH = openHalf * GATE_HOLE_SCALE
  const holeW = openHalfW * GATE_HOLE_SCALE

  // Player → gate local (rotation only; crossing is on the gate plane so lx ≈ 0)
  const dy = player.y - gate.y
  const c = Math.cos(-gate.angle)
  const s = Math.sin(-gate.angle)
  const ly = dy * c // lx unused at plane crossing
  const lx = dy * s * 0.15 // slight sideways from rotation

  if (gate.pattern === 'dual') {
    const offsets = [-gate.dualGap * 0.5, gate.dualGap * 0.5]
    const h = holeH * 0.72
    const w = holeW
    let inHole = false
    let inOuter = false
    for (const oy of offsets) {
      const ply = ly - oy
      if (pointInGateOpening(gate.shape, lx, ply, h, w, -player.r * 0.4)) inHole = true
      if (
        pointInGateOpening(
          gate.shape,
          lx,
          ply,
          openHalf * 0.72 + gate.frameThick * 0.35,
          openHalfW + gate.frameThick * 0.35,
          player.r * 0.15,
        )
      ) {
        inOuter = true
      }
    }
    if (inHole) return { kind: 'clear', gate }
    if (inOuter) return { kind: 'hit', gate }
    return { kind: 'miss', gate }
  }

  // Clear = anywhere inside the art hollow (slightly expanded for fairness)
  if (pointInGateOpening(gate.shape, lx, ly, holeH, holeW, -player.r * 0.45)) {
    return { kind: 'clear', gate }
  }

  // Rim = outer art frame minus hollow
  if (
    pointInGateOpening(
      gate.shape,
      lx,
      ly,
      openHalf + gate.frameThick * 0.4,
      openHalfW + gate.frameThick * 0.4,
      player.r * 0.1,
    )
  ) {
    return { kind: 'hit', gate }
  }

  return { kind: 'miss', gate }
}
