import { gatePulseScale, type Gate } from './gates'
import type { Player } from './player'
import { pathGateShape } from './shapes'

/** ROYGBIV order — outer band red → inner violet. */
const RAINBOW = ['#ff3b3b', '#ff8a1f', '#ffd84a', '#3dce6a', '#3aa0ff', '#7b5cff', '#e048c7']

export type Cloud = { x: number; y: number; s: number; a: number }

export function makeClouds(w: number, h: number, count = 10): Cloud[] {
  const clouds: Cloud[] = []
  for (let i = 0; i < count; i++) {
    clouds.push({
      x: Math.random() * w,
      y: h * (0.08 + Math.random() * 0.45),
      s: 0.5 + Math.random() * 1.2,
      a: 0.12 + Math.random() * 0.18,
    })
  }
  return clouds
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  clouds: Cloud[],
  scroll: number,
  bob: number,
): void {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#1e1238')
  g.addColorStop(0.45, '#c45c2a')
  g.addColorStop(0.75, '#e8893a')
  g.addColorStop(1, '#f2b56b')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  // Soft sun
  const sunX = w * 0.78
  const sunY = h * 0.28 + bob
  const sun = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, h * 0.28)
  sun.addColorStop(0, 'rgba(255, 230, 140, 0.85)')
  sun.addColorStop(0.35, 'rgba(255, 160, 80, 0.35)')
  sun.addColorStop(1, 'rgba(255, 120, 60, 0)')
  ctx.fillStyle = sun
  ctx.fillRect(0, 0, w, h)

  for (const c of clouds) {
    const cx = ((c.x - scroll * 0.15 * c.s) % (w + 200) + w + 200) % (w + 200) - 100
    drawCloud(ctx, cx, c.y + bob * 0.3, c.s, c.a)
  }

  // Ground haze
  const ground = ctx.createLinearGradient(0, h * 0.72, 0, h)
  ground.addColorStop(0, 'rgba(80, 30, 40, 0)')
  ground.addColorStop(1, 'rgba(40, 16, 28, 0.45)')
  ctx.fillStyle = ground
  ctx.fillRect(0, h * 0.72, w, h * 0.28)
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, a: number): void {
  ctx.fillStyle = `rgba(255, 230, 210, ${a})`
  ctx.beginPath()
  ctx.ellipse(x, y, 40 * s, 18 * s, 0, 0, Math.PI * 2)
  ctx.ellipse(x + 28 * s, y + 4 * s, 32 * s, 14 * s, 0, 0, Math.PI * 2)
  ctx.ellipse(x - 24 * s, y + 6 * s, 28 * s, 12 * s, 0, 0, Math.PI * 2)
  ctx.fill()
}

export function drawGates(ctx: CanvasRenderingContext2D, gates: Gate[]): void {
  for (const gate of gates) {
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
    drawFrame(ctx, gate, -gate.dualGap * 0.5, openHalf * 0.72, openHalfW, thick)
    drawFrame(ctx, gate, gate.dualGap * 0.5, openHalf * 0.72, openHalfW, thick)
  } else {
    drawFrame(ctx, gate, 0, openHalf, openHalfW, thick)
  }

  if (gate.cleared) {
    ctx.globalAlpha = 0.35
    ctx.fillStyle = '#ffe08a'
    ctx.beginPath()
    ctx.arc(0, 0, openHalf * 0.4, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  gate: Gate,
  cy: number,
  openHalf: number,
  openHalfW: number,
  thick: number,
): void {
  ctx.save()
  ctx.translate(0, cy)

  const bands = RAINBOW.length
  for (let i = 0; i < bands; i++) {
    const t = thick * ((bands - i) / bands)
    ctx.strokeStyle = RAINBOW[i]!
    ctx.lineWidth = Math.max(2, t / bands + 2)
    ctx.shadowColor = RAINBOW[i]!
    ctx.shadowBlur = gate.cleared ? 18 : 8
    ctx.globalAlpha = gate.pattern === 'dashed' && i % 2 === 1 ? 0.35 : 1

    if (gate.pattern === 'striped') {
      ctx.setLineDash([10, 8])
      ctx.lineDashOffset = -performance.now() * 0.04 + i * 3
    } else if (gate.pattern === 'dashed') {
      ctx.setLineDash([16, 12])
    } else {
      ctx.setLineDash([])
    }

    pathOpening(ctx, gate.shape, openHalf + t * 0.55, openHalfW + t * 0.35)
    ctx.stroke()
  }

  ctx.setLineDash([])
  ctx.shadowBlur = 0
  ctx.globalAlpha = 1
  ctx.restore()
}

function pathOpening(
  ctx: CanvasRenderingContext2D,
  shape: Gate['shape'],
  openHalf: number,
  openHalfW: number,
): void {
  pathGateShape(ctx, shape, openHalf, openHalfW)
}

export function drawPlayer(ctx: CanvasRenderingContext2D, player: Player): void {
  // Flames behind
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

  // Stem
  ctx.fillStyle = '#f3e2c0'
  ctx.beginPath()
  ctx.ellipse(2, 22, 16, 22, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(180, 120, 80, 0.25)'
  ctx.beginPath()
  ctx.ellipse(6, 26, 8, 14, 0, 0, Math.PI * 2)
  ctx.fill()

  // Cap
  const capGrad = ctx.createRadialGradient(-8, -8, 6, 0, 0, 40)
  capGrad.addColorStop(0, '#ff6a4a')
  capGrad.addColorStop(0.55, '#e03420')
  capGrad.addColorStop(1, '#9a1810')
  ctx.fillStyle = capGrad
  ctx.beginPath()
  ctx.ellipse(0, -2, 38, 28, 0, Math.PI, 0, true)
  ctx.ellipse(0, -2, 38, 12, 0, 0, Math.PI, false)
  ctx.fill()

  // Spots
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

  // Rider
  ctx.fillStyle = '#2a1830'
  ctx.beginPath()
  ctx.ellipse(6, -6, 7, 9, -0.2, 0, Math.PI * 2)
  ctx.fill()
  // Head
  ctx.fillStyle = '#e8b090'
  ctx.beginPath()
  ctx.arc(10, -18, 6, 0, Math.PI * 2)
  ctx.fill()
  // Cap hat
  ctx.fillStyle = '#3dce6a'
  ctx.beginPath()
  ctx.ellipse(10, -22, 7, 3, 0, 0, Math.PI * 2)
  ctx.fill()
  // Arm forward
  ctx.strokeStyle = '#2a1830'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(8, -8)
  ctx.quadraticCurveTo(22, -14, 28, -6)
  ctx.stroke()

  // Jet nozzle glow under stem
  if (player.boosting) {
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
