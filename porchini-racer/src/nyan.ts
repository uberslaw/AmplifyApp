import { SPECTRUM } from './spectrum'

export type ChaseNyan = {
  /** Distance ahead of the player along the course (world gap). */
  gap: number
  y: number
  baseY: number
  phase: number
  amp: number
  radius: number
  /** Nyan's own cruise speed on rainbow power — usually faster than base player. */
  cruiseSpeed: number
  trail: { x: number; y: number }[]
  caught: boolean
}

/** Default spectra completions before Nyan can be caught when in range. */
export const NYAN_CATCH_SPECTRA = 3

export class NyanChase {
  nyan: ChaseNyan
  spectraNeeded = NYAN_CATCH_SPECTRA
  private announce = 0
  private announceText = ''
  private catchFlash = 0

  constructor() {
    this.nyan = this.fresh()
  }

  reset(viewH: number, cruiseSpeed = 305, spectraNeeded = NYAN_CATCH_SPECTRA): void {
    this.spectraNeeded = spectraNeeded
    this.nyan = this.fresh(viewH, cruiseSpeed)
    this.announce = 2.4
    this.announceText = 'CHASE NYAN CAT!'
    this.catchFlash = 0
  }

  get banner(): string | null {
    return this.announce > 0 ? this.announceText : null
  }

  get isCaught(): boolean {
    return this.nyan.caught
  }

  /**
   * @param playerSpeed current scroll / chase speed
   * @param spectraCompleted full spectrum cycles so far
   * @returns whether Nyan was just caught
   */
  update(
    dt: number,
    playerSpeed: number,
    player: { x: number; y: number; r: number },
    viewW: number,
    viewH: number,
    spectraCompleted: number,
  ): boolean {
    this.announce = Math.max(0, this.announce - dt)
    this.catchFlash = Math.max(0, this.catchFlash - dt)
    if (this.nyan.caught) return false

    const n = this.nyan
    n.phase += dt * 2.4
    n.baseY = viewH * 0.42
    n.amp = viewH * 0.16
    n.y = n.baseY + Math.sin(n.phase) * n.amp
    n.y = Math.max(50, Math.min(viewH - 50, n.y))

    // Relative motion: Nyan pulls ahead at cruiseSpeed; player closes with speed
    const closing = playerSpeed - n.cruiseSpeed
    n.gap -= closing * dt
    // Soft floor so they don't warp behind instantly; can close to catch range
    n.gap = Math.max(40, n.gap)

    const screenX = player.x + n.gap
    n.trail.unshift({ x: screenX, y: n.y })
    if (n.trail.length > 36) n.trail.length = 36

    const onScreen = n.gap < viewW - 40
    const closeEnough = n.gap < player.r + n.radius + 28
    const dy = Math.abs(n.y - player.y)
    const canCatch =
      spectraCompleted >= this.spectraNeeded && onScreen && closeEnough && dy < 55

    if (canCatch) {
      n.caught = true
      this.announce = 2.5
      this.announceText = 'CAUGHT NYAN!'
      this.catchFlash = 0.5
      return true
    }

    if (onScreen && spectraCompleted < this.spectraNeeded && n.gap < viewW * 0.55) {
      if (this.announce <= 0 && Math.random() < 0.002) {
        this.announce = 1.2
        this.announceText = `NEED ${this.spectraNeeded - spectraCompleted} MORE SPECTRUM`
      }
    }

    return false
  }

  /** Screen-space X for drawing (relative to fixed player). */
  screenX(playerX: number): number {
    return playerX + this.nyan.gap
  }

  private fresh(viewH = 450, cruiseSpeed = 305): ChaseNyan {
    return {
      gap: 4200,
      y: viewH * 0.45,
      baseY: viewH * 0.45,
      phase: 0,
      amp: 60,
      radius: 28,
      cruiseSpeed,
      trail: [],
      caught: false,
    }
  }
}

export function drawChaseNyan(
  ctx: CanvasRenderingContext2D,
  chase: NyanChase,
  playerX: number,
  viewW: number,
): void {
  const n = chase.nyan
  const x = chase.screenX(playerX)
  if (x < -120 || x > viewW + 80) {
    // Off-screen marker on the right edge
    if (n.gap > viewW) {
      drawOffscreenMarker(ctx, viewW, n.y, n.gap)
    }
    return
  }

  // Full rainbow streamer behind Nyan (its own rainbow power)
  for (let i = n.trail.length - 1; i >= 1; i--) {
    const a = n.trail[i]!
    const b = n.trail[i - 1]!
    if (a.x > viewW + 40 && b.x > viewW + 40) continue
    const t = i / n.trail.length
    ctx.strokeStyle = SPECTRUM[i % SPECTRUM.length]!.hex
    ctx.globalAlpha = 0.4 + (1 - t) * 0.5
    ctx.lineWidth = 12 + (1 - t) * 10
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  ctx.save()
  ctx.translate(x, n.y)
  const hop = Math.sin(performance.now() * 0.02) > 0 ? 1 : -1

  // Pop-tart
  ctx.fillStyle = '#ffb6c9'
  roundRectFill(ctx, -18, -12, 32, 22, 3)
  ctx.fillStyle = '#f4a0b8'
  for (let i = 0; i < 6; i++) {
    ctx.beginPath()
    ctx.arc(-12 + (i % 3) * 9, -5 + Math.floor(i / 3) * 9, 1.8, 0, Math.PI * 2)
    ctx.fill()
  }

  // Cat
  ctx.fillStyle = '#9aa0a6'
  ctx.beginPath()
  ctx.ellipse(12, -2, 12, 10, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(4, -8)
  ctx.lineTo(7, -20)
  ctx.lineTo(12, -8)
  ctx.moveTo(14, -8)
  ctx.lineTo(20, -20)
  ctx.lineTo(22, -6)
  ctx.fill()
  ctx.fillStyle = '#222'
  ctx.beginPath()
  ctx.arc(10, -3, 1.5, 0, Math.PI * 2)
  ctx.arc(16, -3, 1.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#ff7aa2'
  ctx.beginPath()
  ctx.arc(7, 1, 2.2, 0, Math.PI * 2)
  ctx.arc(19, 1, 2.2, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#9aa0a6'
  ctx.fillRect(-14, 9, 5, 7 + hop)
  ctx.fillRect(-5, 9, 5, 7 - hop)
  ctx.fillRect(4, 9, 5, 7 + hop)
  ctx.fillRect(12, 9, 5, 7 - hop)

  ctx.restore()
}

function drawOffscreenMarker(ctx: CanvasRenderingContext2D, viewW: number, y: number, gap: number): void {
  const mx = viewW - 28
  ctx.save()
  ctx.globalAlpha = 0.85
  ctx.fillStyle = '#ffb6c9'
  ctx.beginPath()
  ctx.moveTo(mx, y)
  ctx.lineTo(mx - 14, y - 10)
  ctx.lineTo(mx - 14, y + 10)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.font = 'bold 11px Fredoka, Nunito, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(`NYAN ${Math.floor(gap)}m`, mx - 18, y + 4)
  ctx.restore()
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
