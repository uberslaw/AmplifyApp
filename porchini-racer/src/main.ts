import { loadArtImages } from './assets'
import { Game } from './game'
import { Input } from './input'
import './style.css'

loadArtImages()

const canvasEl = document.querySelector('#game')
if (!(canvasEl instanceof HTMLCanvasElement)) {
  throw new Error('Canvas #game not found')
}
const canvas: HTMLCanvasElement = canvasEl

const context = canvas.getContext('2d')
if (!context) throw new Error('2D context unavailable')
const ctx: CanvasRenderingContext2D = context

const input = new Input(canvas)
const game = new Game(ctx, input)

function resize(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = window.innerWidth
  const h = window.innerHeight
  canvas.width = Math.floor(w * dpr)
  canvas.height = Math.floor(h * dpr)
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  game.resize(w, h)
}

window.addEventListener('resize', resize)
resize()

let last = performance.now()
function frame(now: number): void {
  const dt = Math.min(0.033, (now - last) / 1000)
  last = now
  game.update(dt)
  requestAnimationFrame(frame)
}

requestAnimationFrame(frame)
