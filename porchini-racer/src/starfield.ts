export type Star = {
  x: number
  y: number
  z: number
  size: number
  twinkle: number
}

export type Nebula = {
  x: number
  y: number
  r: number
  color: string
  a: number
}

export type Starfield = {
  stars: Star[]
  nebulae: Nebula[]
}

export function makeStarfield(w: number, h: number): Starfield {
  const stars: Star[] = []
  for (let i = 0; i < 140; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      z: 0.2 + Math.random() * 1.4,
      size: 0.6 + Math.random() * 1.8,
      twinkle: Math.random() * Math.PI * 2,
    })
  }
  const nebulae: Nebula[] = [
    { x: w * 0.2, y: h * 0.3, r: h * 0.45, color: '80, 40, 140', a: 0.16 },
    { x: w * 0.75, y: h * 0.55, r: h * 0.4, color: '30, 70, 140', a: 0.14 },
    { x: w * 0.5, y: h * 0.15, r: h * 0.35, color: '120, 40, 80', a: 0.1 },
  ]
  return { stars, nebulae }
}

export function drawStarfield(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  field: Starfield,
  scroll: number,
  bob: number,
): void {
  // Deep space
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#050510')
  g.addColorStop(0.45, '#0a1028')
  g.addColorStop(1, '#12081c')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  for (const n of field.nebulae) {
    const nx = ((n.x - scroll * 0.02) % (w + n.r * 2) + w + n.r * 2) % (w + n.r * 2) - n.r
    const grad = ctx.createRadialGradient(nx, n.y + bob * 0.2, 0, nx, n.y + bob * 0.2, n.r)
    grad.addColorStop(0, `rgba(${n.color}, ${n.a})`)
    grad.addColorStop(1, `rgba(${n.color}, 0)`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }

  const t = performance.now() * 0.001
  for (const s of field.stars) {
    const sx = ((s.x - scroll * 0.04 * s.z) % (w + 4) + w + 4) % (w + 4)
    const sy = s.y + bob * 0.05 * s.z
    const flicker = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.2 + s.twinkle))
    ctx.fillStyle = `rgba(230, 235, 255, ${flicker * Math.min(1, 0.35 + s.z * 0.4)})`
    ctx.beginPath()
    ctx.arc(sx, sy, s.size * (0.5 + s.z * 0.35), 0, Math.PI * 2)
    ctx.fill()
    if (s.size > 1.6 && s.z > 0.9) {
      ctx.strokeStyle = `rgba(200, 220, 255, ${0.15 * flicker})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(sx - s.size * 2, sy)
      ctx.lineTo(sx + s.size * 2, sy)
      ctx.moveTo(sx, sy - s.size * 2)
      ctx.lineTo(sx, sy + s.size * 2)
      ctx.stroke()
    }
  }
}
