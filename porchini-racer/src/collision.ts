import { gatePulseScale, type Gate } from './gates'

export type CollisionResult =
  | { kind: 'none' }
  | { kind: 'clear'; gate: Gate }
  | { kind: 'hit'; gate: Gate }
  | { kind: 'miss'; gate: Gate }

/**
 * Side-scroller gate test: when the gate plane crosses the player,
 * clear if vertically inside the opening band (very forgiving).
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
  // Relative crossing: gate moved left and/or player moved right through the plane
  const crossed = prevGateX > prevPlayerX && gate.x <= player.x
  if (!crossed) return { kind: 'none' }

  const pulse = gatePulseScale(gate)
  const openHalf = gate.openHalf * pulse

  if (gate.pattern === 'dual') {
    const topY = gate.y - gate.dualGap * 0.5
    const botY = gate.y + gate.dualGap * 0.5
    const band = openHalf * 0.85
    if (Math.abs(player.y - topY) < band || Math.abs(player.y - botY) < band) {
      return { kind: 'clear', gate }
    }
    const outer = openHalf + gate.dualGap * 0.5 + gate.frameThick
    if (Math.abs(player.y - gate.y) < outer) return { kind: 'hit', gate }
    return { kind: 'miss', gate }
  }

  // Forgiving clear band — most of the visible hole
  const clearBand = openHalf * 0.95 + player.r * 0.15
  if (Math.abs(player.y - gate.y) <= clearBand) {
    return { kind: 'clear', gate }
  }

  // Thin rim band outside the hole
  const rimOuter = openHalf * 1.35 + gate.frameThick
  if (Math.abs(player.y - gate.y) <= rimOuter) {
    return { kind: 'hit', gate }
  }

  return { kind: 'miss', gate }
}
