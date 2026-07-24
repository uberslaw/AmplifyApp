const RAINBOW = ['#ff3b3b', '#ff8a1f', '#ffd84a', '#3dce6a', '#3aa0ff', '#7b5cff', '#e048c7']

export type NyanKind = 'power' | 'boss'

export type NyanCat = {
  kind: NyanKind
  x: number
  y: number
  baseY: number
  vx: number
  phase: number
  amp: number
  scale: number
  radius: number
  caught: boolean
  points: number
  powerSeconds: number
  /** Trail samples for rainbow streamer behind the cat. */
  trail: { x: number; y: number }[]
}

export class NyanManager {
  cats: NyanCat[] = []
  private spawnCooldown = 8
  private bossCooldown = 45
  private powerActive = 0
  private multiplier = 1
  private invulnerable = false
  private announce = 0
  private announceText = ''

  reset(): void {
    this.cats = []
    this.spawnCooldown = 6 + Math.random() * 4
    this.bossCooldown = 35 + Math.random() * 15
    this.powerActive = 0
    this.multiplier = 1
    this.invulnerable = false
    this.announce = 0
    this.announceText = ''
  }

  get powerSecondsLeft(): number {
    return this.powerActive
  }

  get scoreMultiplier(): number {
    return this.multiplier
  }

  get isInvulnerable(): boolean {
    return this.invulnerable
  }

  get banner(): string | null {
    return this.announce > 0 ? this.announceText : null
  }

  update(
    dt: number,
    scrollSpeed: number,
    viewW: number,
    viewH: number,
    distance: number,
    player: { x: number; y: number; r: number },
  ): { caught: NyanCat | null } {
    this.powerActive = Math.max(0, this.powerActive - dt)
    if (this.powerActive <= 0) {
      this.multiplier = 1
      this.invulnerable = false
    }
    this.announce = Math.max(0, this.announce - dt)

    this.spawnCooldown -= dt
    this.bossCooldown -= dt

    if (this.spawnCooldown <= 0 && this.cats.length < 2) {
      this.cats.push(this.makeCat('power', viewW, viewH, scrollSpeed))
      this.spawnCooldown = 12 + Math.random() * 10 - Math.min(4, distance / 1200)
    }

    if (distance > 400 && this.bossCooldown <= 0 && !this.cats.some((c) => c.kind === 'boss')) {
      this.cats.push(this.makeCat('boss', viewW, viewH, scrollSpeed))
      this.announce = 2.2
      this.announceText = 'NYAN BOSS!'
      this.bossCooldown = 50 + Math.random() * 25
    }

    let caught: NyanCat | null = null

    for (const cat of this.cats) {
      cat.phase += dt * (cat.kind === 'boss' ? 3.2 : 2.2)
      cat.x -= (scrollSpeed * 0.35 + cat.vx) * dt
      const wave =
        cat.kind === 'boss'
          ? Math.sin(cat.phase) * cat.amp + Math.sin(cat.phase * 2.4) * cat.amp * 0.35
          : Math.sin(cat.phase) * cat.amp
      cat.y = cat.baseY + wave
      cat.y = Math.max(40, Math.min(viewH - 40, cat.y))

      cat.trail.unshift({ x: cat.x, y: cat.y })
      if (cat.trail.length > (cat.kind === 'boss' ? 28 : 18)) {
        cat.trail.length = cat.kind === 'boss' ? 28 : 18
      }

      if (!cat.caught) {
        const dx = cat.x - player.x
        const dy = cat.y - player.y
        const reach = cat.radius + player.r
        if (dx * dx + dy * dy <= reach * reach) {
          cat.caught = true
          caught = cat
          this.applyCatch(cat)
        }
      }
    }

    this.cats = this.cats.filter((c) => c.x > -160 && !c.caught)
    return { caught }
  }

  private applyCatch(cat: NyanCat): void {
    this.powerActive = Math.max(this.powerActive, cat.powerSeconds)
    this.multiplier = cat.kind === 'boss' ? 3 : 2
    this.invulnerable = true
    this.announce = 1.6
    this.announceText = cat.kind === 'boss' ? 'BOSS CATCH! ×3' : 'NYAN POWER! ×2'
  }

  private makeCat(kind: NyanKind, viewW: number, viewH: number, scrollSpeed: number): NyanCat {
    const boss = kind === 'boss'
    return {
      kind,
      x: viewW + 80,
      y: viewH * 0.5,
      baseY: viewH * (0.25 + Math.random() * 0.5),
      vx: (boss ? 90 : 140) + scrollSpeed * 0.15,
      phase: Math.random() * Math.PI * 2,
      amp: boss ? viewH * 0.22 : viewH * 0.14,
      scale: boss ? 1.55 : 1,
      radius: boss ? 34 : 22,
      caught: false,
      points: boss ? 1500 : 400,
      powerSeconds: boss ? 10 : 6,
      trail: [],
    }
  }
}

export function drawNyanCats(ctx: CanvasRenderingContext2D, cats: NyanCat[]): void {
  for (const cat of cats) {
    drawNyan(ctx, cat)
  }
}

function drawNyan(ctx: CanvasRenderingContext2D, cat: NyanCat): void {
  // Rainbow trail
  for (let i = cat.trail.length - 1; i >= 1; i--) {
    const a = cat.trail[i]!
    const b = cat.trail[i - 1]!
    const t = i / cat.trail.length
    ctx.strokeStyle = RAINBOW[i % RAINBOW.length]!
    ctx.globalAlpha = 0.35 + (1 - t) * 0.45
    ctx.lineWidth = (10 + (1 - t) * 10) * cat.scale
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  ctx.save()
  ctx.translate(cat.x, cat.y)
  ctx.scale(cat.scale, cat.scale)

  // Pop-tart body
  ctx.fillStyle = '#ffb6c9'
  roundRectFill(ctx, -16, -10, 28, 20, 3)
  ctx.fillStyle = '#f4a0b8'
  for (let i = 0; i < 6; i++) {
    ctx.beginPath()
    ctx.arc(-10 + (i % 3) * 8, -4 + Math.floor(i / 3) * 8, 1.6, 0, Math.PI * 2)
    ctx.fill()
  }

  // Cat head
  ctx.fillStyle = '#9aa0a6'
  ctx.beginPath()
  ctx.ellipse(10, -2, 11, 9, 0, 0, Math.PI * 2)
  ctx.fill()
  // Ears
  ctx.beginPath()
  ctx.moveTo(2, -8)
  ctx.lineTo(5, -18)
  ctx.lineTo(10, -8)
  ctx.moveTo(12, -8)
  ctx.lineTo(17, -18)
  ctx.lineTo(20, -6)
  ctx.fill()
  // Face
  ctx.fillStyle = '#222'
  ctx.beginPath()
  ctx.arc(8, -3, 1.4, 0, Math.PI * 2)
  ctx.arc(14, -3, 1.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#222'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(9, 1)
  ctx.lineTo(13, 1)
  ctx.stroke()
  // Cheeks
  ctx.fillStyle = '#ff7aa2'
  ctx.beginPath()
  ctx.arc(5, 0, 2, 0, Math.PI * 2)
  ctx.arc(17, 0, 2, 0, Math.PI * 2)
  ctx.fill()

  // Legs
  ctx.fillStyle = '#9aa0a6'
  const hop = Math.sin(performance.now() * 0.02) > 0 ? 1 : -1
  ctx.fillRect(-12, 8, 4, 6 + hop)
  ctx.fillRect(-4, 8, 4, 6 - hop)
  ctx.fillRect(4, 8, 4, 6 + hop)
  ctx.fillRect(10, 8, 4, 6 - hop)

  if (cat.kind === 'boss') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.font = 'bold 10px Fredoka, Nunito, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('BOSS', 0, -26)
  }

  ctx.restore()
}

export function drawNyanPowerAura(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  active: boolean,
): void {
  if (!active) return
  const t = performance.now() * 0.01
  for (let i = 0; i < RAINBOW.length; i++) {
    ctx.strokeStyle = RAINBOW[i]!
    ctx.globalAlpha = 0.35
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(x, y, 48 + i * 3 + Math.sin(t + i) * 2, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function roundRectFill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
  ctx.fill()
}
