import { gatePulseScale, type Gate } from './gates'
import type { Player } from './player'
import { GATE_HOLE_SCALE, pathGateShape } from './shapes'
import { shade, SPECTRUM } from './spectrum'

/** Foreshorten X so geometric gates read as side-on portals you fly through. */
const SIDE_SCALE_X = 0.32
const PORTAL_DEPTH = 34
/** Inner hole as fraction of outer shape — clear space in the middle. */
const HOLE_SCALE = GATE_HOLE_SCALE

export function drawGates(ctx: CanvasRenderingContext2D, gates: Gate[]): void {
  // Draw far → near so depth reads correctly
  const sorted = [...gates].sort((a, b) => a.x - b.x)
  for (const gate of sorted) {
    drawGate(ctx, gate)
  }
}

function drawGate(ctx: CanvasRenderingContext2D, gate: Gate): void {
  const pulse = gatePulseScale(gate)
  const openHalf = gate.openHalf * pulse
  const openHalfW = gate.openHalfW * pulse
  const thick = gate.frameThick

  ctx.save()
  ctx.translate(gate.x, gate.y)
  ctx.rotate(gate.angle)

  if (gate.pattern === 'dual') {
    drawPortal(ctx, gate, -gate.dualGap * 0.5, openHalf * 0.72, openHalfW, thick)
    drawPortal(ctx, gate, gate.dualGap * 0.5, openHalf * 0.72, openHalfW, thick)
  } else {
    drawPortal(ctx, gate, 0, openHalf, openHalfW, thick)
  }

  if (gate.cleared) {
    ctx.globalAlpha = 0.4
    ctx.fillStyle = '#ffe08a'
    ctx.beginPath()
    ctx.ellipse(0, 0, 10, openHalf * HOLE_SCALE * 0.55, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

/**
 * Side-on portal: foreshortened geometric rim with depth extrusion and a
 * hollow middle so the player is clearly flying through the opening.
 */
function drawPortal(
  ctx: CanvasRenderingContext2D,
  gate: Gate,
  cy: number,
  openHalf: number,
  openHalfW: number,
  thick: number,
): void {
  ctx.save()
  ctx.translate(0, cy)

  const depth = PORTAL_DEPTH
  const backX = depth * 0.5
  const frontX = -depth * 0.5

  // Soft tunnel glow through the hollow (stars visible behind)
  ctx.save()
  ctx.scale(SIDE_SCALE_X, 1)
  const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, openHalf)
  glow.addColorStop(0, 'rgba(180, 220, 255, 0.14)')
  glow.addColorStop(0.55, 'rgba(120, 80, 200, 0.06)')
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = glow
  pathGateShape(ctx, gate.shape, openHalf * HOLE_SCALE, openHalfW * HOLE_SCALE)
  ctx.fill()
  ctx.restore()

  // Depth sides (connect back rim → front rim)
  drawDepthShell(ctx, gate, openHalf, openHalfW, frontX, backX)

  // Back rim (farther along the flight path)
  drawRainbowRim(ctx, gate, openHalf, openHalfW, thick, backX, 0.55)

  // Front rim (near the camera / player approach)
  drawRainbowRim(ctx, gate, openHalf, openHalfW, thick, frontX, 1)

  // Highlight the hollow aperture edge
  ctx.save()
  ctx.translate(frontX, 0)
  ctx.scale(SIDE_SCALE_X, 1)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.lineWidth = 2
  pathGateShape(ctx, gate.shape, openHalf * HOLE_SCALE, openHalfW * HOLE_SCALE)
  ctx.stroke()
  ctx.restore()

  ctx.restore()
}

function drawDepthShell(
  ctx: CanvasRenderingContext2D,
  gate: Gate,
  openHalf: number,
  openHalfW: number,
  frontX: number,
  backX: number,
): void {
  // Sample outline points and connect front→back for a tunnel wall feel
  const outer = sampleShape(gate.shape, openHalf, openHalfW, 28)
  const inner = sampleShape(gate.shape, openHalf * HOLE_SCALE, openHalfW * HOLE_SCALE, 28)

  ctx.fillStyle = 'rgba(20, 12, 40, 0.55)'
  for (let i = 0; i < outer.length; i++) {
    const a = outer[i]!
    const b = outer[(i + 1) % outer.length]!
    ctx.beginPath()
    ctx.moveTo(frontX + a.x * SIDE_SCALE_X, a.y)
    ctx.lineTo(backX + a.x * SIDE_SCALE_X, a.y)
    ctx.lineTo(backX + b.x * SIDE_SCALE_X, b.y)
    ctx.lineTo(frontX + b.x * SIDE_SCALE_X, b.y)
    ctx.closePath()
    ctx.fill()
  }

  // Darken interior tunnel walls
  ctx.fillStyle = 'rgba(8, 6, 20, 0.5)'
  for (let i = 0; i < inner.length; i++) {
    const a = inner[i]!
    const b = inner[(i + 1) % inner.length]!
    ctx.beginPath()
    ctx.moveTo(frontX + a.x * SIDE_SCALE_X, a.y)
    ctx.lineTo(backX + a.x * SIDE_SCALE_X, a.y)
    ctx.lineTo(backX + b.x * SIDE_SCALE_X, b.y)
    ctx.lineTo(frontX + b.x * SIDE_SCALE_X, b.y)
    ctx.closePath()
    ctx.fill()
  }
}

function drawRainbowRim(
  ctx: CanvasRenderingContext2D,
  gate: Gate,
  openHalf: number,
  openHalfW: number,
  thick: number,
  offsetX: number,
  alpha: number,
): void {
  ctx.save()
  ctx.translate(offsetX, 0)
  ctx.scale(SIDE_SCALE_X, 1)
  ctx.globalAlpha = alpha

  // Filled ring (outer minus hole) so the middle is clearly empty
  ctx.fillStyle = 'rgba(12, 8, 28, 0.75)'
  pathGateShape(ctx, gate.shape, openHalf, openHalfW, true)
  pathGateShape(ctx, gate.shape, openHalf * HOLE_SCALE, openHalfW * HOLE_SCALE, false)
  ctx.fill('evenodd')

  // Single spectrum colour per gate (shades of that colour for rim depth)
  const base = SPECTRUM[gate.color % SPECTRUM.length]!.hex
  const shades = [shade(base, 40), base, shade(base, -35), shade(base, -70)]
  const bands = shades.length
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1)
    const scale = 1 - t * (1 - HOLE_SCALE) * 0.92
    const col = shades[i]!
    ctx.strokeStyle = col
    ctx.lineWidth = Math.max(2.4, thick / bands + 1.8)
    ctx.shadowColor = base
    ctx.shadowBlur = gate.cleared ? 16 : 8
    ctx.globalAlpha = alpha * (gate.pattern === 'dashed' && i % 2 === 1 ? 0.35 : 1)

    if (gate.pattern === 'striped') {
      ctx.setLineDash([10, 8])
      ctx.lineDashOffset = -performance.now() * 0.04 + i * 3
    } else if (gate.pattern === 'dashed') {
      ctx.setLineDash([14, 10])
    } else {
      ctx.setLineDash([])
    }

    pathGateShape(ctx, gate.shape, openHalf * scale, openHalfW * scale)
    ctx.stroke()
  }

  ctx.setLineDash([])
  ctx.shadowBlur = 0
  ctx.restore()
}

function sampleShape(
  shape: Gate['shape'],
  openHalf: number,
  openHalfW: number,
  n: number,
): { x: number; y: number }[] {
  // Use a temporary path via manual sampling matching shapes.ts
  const pts: { x: number; y: number }[] = []
  switch (shape) {
    case 'circle': {
      const r = Math.max(openHalf, openHalfW)
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n
        pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r })
      }
      break
    }
    case 'square': {
      const s = Math.max(openHalf, openHalfW)
      const corners = [
        [-s, -s],
        [s, -s],
        [s, s],
        [-s, s],
      ] as const
      for (let i = 0; i < n; i++) {
        const t = i / n
        const e = Math.floor(t * 4) % 4
        const lt = t * 4 - e
        const a = corners[e]!
        const b = corners[(e + 1) % 4]!
        pts.push({ x: a[0] + (b[0] - a[0]) * lt, y: a[1] + (b[1] - a[1]) * lt })
      }
      break
    }
    case 'triangle': {
      const h = openHalf
      const w = openHalfW + 14
      const corners = [
        [0, -h],
        [w, h],
        [-w, h],
      ] as const
      for (let i = 0; i < n; i++) {
        const t = i / n
        const e = Math.floor(t * 3) % 3
        const lt = t * 3 - e
        const a = corners[e]!
        const b = corners[(e + 1) % 3]!
        pts.push({ x: a[0] + (b[0] - a[0]) * lt, y: a[1] + (b[1] - a[1]) * lt })
      }
      break
    }
    case 'hexagon': {
      const r = Math.max(openHalf, openHalfW)
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 6 + (Math.PI / 3) * i
        pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r })
      }
      break
    }
    case 'star': {
      const outer = Math.max(openHalf, openHalfW)
      const inner = outer * 0.42
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? outer : inner
        const a = -Math.PI / 2 + (Math.PI / 5) * i
        pts.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad })
      }
      break
    }
    case 'arch': {
      const w = openHalfW + 20
      const h = openHalf
      // Sample arch outline
      pts.push({ x: -w, y: h })
      pts.push({ x: -w, y: 0 })
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI - (Math.PI * i) / 12
        pts.push({ x: Math.cos(a) * w, y: Math.sin(a) * w })
      }
      pts.push({ x: w, y: h })
      break
    }
  }
  return pts
}

export function drawPlayer(ctx: CanvasRenderingContext2D, player: Player): void {
  for (const p of player.flames) {
    const t = p.life / p.maxLife
    ctx.fillStyle = `hsla(${p.hue}, 100%, ${55 + t * 25}%, ${Math.max(0, t)})`
    ctx.beginPath()
    ctx.ellipse(p.x, p.y, p.size * (1.4 - t * 0.4), p.size * 0.7, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.save()
  ctx.translate(player.x, player.y + player.cameraBob)
  ctx.rotate(player.tilt)

  ctx.fillStyle = '#f3e2c0'
  ctx.beginPath()
  ctx.ellipse(2, 22, 16, 22, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(180, 120, 80, 0.25)'
  ctx.beginPath()
  ctx.ellipse(6, 26, 8, 14, 0, 0, Math.PI * 2)
  ctx.fill()

  const capGrad = ctx.createRadialGradient(-8, -8, 6, 0, 0, 40)
  capGrad.addColorStop(0, '#ff6a4a')
  capGrad.addColorStop(0.55, '#e03420')
  capGrad.addColorStop(1, '#9a1810')
  ctx.fillStyle = capGrad
  ctx.beginPath()
  ctx.ellipse(0, -2, 38, 28, 0, Math.PI, 0, true)
  ctx.ellipse(0, -2, 38, 12, 0, 0, Math.PI, false)
  ctx.fill()

  ctx.fillStyle = '#fff4e0'
  const spots = [
    [-14, -12, 7],
    [8, -18, 9],
    [18, -6, 5],
    [-4, -22, 4],
    [0, -8, 6],
  ] as const
  for (const [sx, sy, sr] of spots) {
    ctx.beginPath()
    ctx.ellipse(sx, sy, sr, sr * 0.85, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = '#2a1830'
  ctx.beginPath()
  ctx.ellipse(6, -6, 7, 9, -0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#e8b090'
  ctx.beginPath()
  ctx.arc(10, -18, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#3dce6a'
  ctx.beginPath()
  ctx.ellipse(10, -22, 7, 3, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#2a1830'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(8, -8)
  ctx.quadraticCurveTo(22, -14, 28, -6)
  ctx.stroke()

  if (player.boosting || player.nyanPower) {
    ctx.fillStyle = 'rgba(255, 220, 100, 0.55)'
    ctx.beginPath()
    ctx.ellipse(-22, 14, 14, 8, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

export function drawFlash(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number, color: string): void {
  if (alpha <= 0) return
  ctx.fillStyle = color
  ctx.globalAlpha = Math.min(0.55, alpha)
  ctx.fillRect(0, 0, w, h)
  ctx.globalAlpha = 1
}
