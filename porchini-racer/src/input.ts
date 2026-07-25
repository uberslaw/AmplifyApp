export type InputState = {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  boost: boolean
  pausePressed: boolean
  playPressed: boolean
}

export class Input {
  readonly state: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    boost: false,
    pausePressed: false,
    playPressed: false,
  }

  private keys = new Set<string>()
  private touchY: number | null = null
  private lastTouchY: number | null = null
  private lastTouchX: number | null = null
  private touchSteerY = 0
  private touchSteerX = 0
  private rightBoost = false
  private pauseLatch = false
  private playLatch = false
  private canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointermove', this.onPointerMove)
    canvas.addEventListener('pointerup', this.onPointerUp)
    canvas.addEventListener('pointercancel', this.onPointerUp)
    window.addEventListener('blur', this.reset)
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    this.canvas.removeEventListener('pointerup', this.onPointerUp)
    this.canvas.removeEventListener('pointercancel', this.onPointerUp)
    window.removeEventListener('blur', this.reset)
  }

  endFrame(): void {
    this.state.pausePressed = false
    this.state.playPressed = false
    this.pauseLatch = false
    this.playLatch = false
  }

  /** Vertical steer in [-1, 1]; negative = up. */
  getSteerY(): number {
    let steer = 0
    if (this.state.up) steer -= 1
    if (this.state.down) steer += 1
    if (this.touchSteerY !== 0) {
      steer = Math.max(-1, Math.min(1, this.touchSteerY))
    }
    return steer
  }

  /** Horizontal steer in [-1, 1]; negative = left / back. */
  getSteerX(): number {
    let steer = 0
    if (this.state.left) steer -= 1
    if (this.state.right) steer += 1
    if (this.touchSteerX !== 0) {
      steer = Math.max(-1, Math.min(1, this.touchSteerX))
    }
    return steer
  }

  private reset = (): void => {
    this.keys.clear()
    this.touchY = null
    this.lastTouchY = null
    this.lastTouchX = null
    this.touchSteerY = 0
    this.touchSteerX = 0
    this.rightBoost = false
    this.sync()
  }

  private sync(): void {
    this.state.up = this.keys.has('ArrowUp') || this.keys.has('KeyW') || this.touchSteerY < -0.15
    this.state.down = this.keys.has('ArrowDown') || this.keys.has('KeyS') || this.touchSteerY > 0.15
    this.state.left = this.keys.has('ArrowLeft') || this.keys.has('KeyA') || this.touchSteerX < -0.15
    this.state.right = this.keys.has('ArrowRight') || this.keys.has('KeyD') || this.touchSteerX > 0.15
    // Boost is Space only (arrows/WASD are movement)
    this.state.boost = this.keys.has('Space') || this.rightBoost
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault()
    }
    this.keys.add(e.code)
    if ((e.code === 'KeyP' || e.code === 'Escape') && !this.pauseLatch) {
      this.state.pausePressed = true
      this.pauseLatch = true
    }
    if ((e.code === 'Enter' || e.code === 'Space') && !this.playLatch) {
      this.state.playPressed = true
      this.playLatch = true
    }
    this.sync()
  }

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code)
    if (e.code === 'KeyP' || e.code === 'Escape') this.pauseLatch = false
    if (e.code === 'Enter' || e.code === 'Space') this.playLatch = false
    this.sync()
  }

  private onPointerDown = (e: PointerEvent): void => {
    this.canvas.setPointerCapture(e.pointerId)
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    this.touchY = e.clientY
    this.lastTouchY = e.clientY
    this.lastTouchX = e.clientX
    this.rightBoost = x > rect.width * 0.72
    if (!this.playLatch) {
      this.state.playPressed = true
      this.playLatch = true
    }
    this.sync()
  }

  private onPointerMove = (e: PointerEvent): void => {
    if (this.lastTouchY === null || this.lastTouchX === null) return
    const dy = e.clientY - this.lastTouchY
    const dx = e.clientX - this.lastTouchX
    this.lastTouchY = e.clientY
    this.lastTouchX = e.clientX
    this.touchSteerY = Math.max(-1, Math.min(1, this.touchSteerY + dy * 0.035))
    this.touchSteerX = Math.max(-1, Math.min(1, this.touchSteerX + dx * 0.03))
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    this.rightBoost = x > rect.width * 0.72
    this.sync()
  }

  private onPointerUp = (): void => {
    this.touchY = null
    this.lastTouchY = null
    this.lastTouchX = null
    this.touchSteerY *= 0.3
    this.touchSteerX *= 0.3
    this.rightBoost = false
    this.playLatch = false
    this.sync()
    window.setTimeout(() => {
      if (this.touchY === null) {
        this.touchSteerY = 0
        this.touchSteerX = 0
        this.sync()
      }
    }, 120)
  }
}
