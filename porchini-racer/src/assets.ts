/** Rocket sprite loaded from the local Art folder (served by Vite). */
export const ROCKET_IMAGE_URL = '/Art/Porcini%20base%20image.png'

let rocketImage: HTMLImageElement | null = null
let rocketReady = false
let rocketFailed = false

export function loadRocketImage(): void {
  if (rocketImage || rocketFailed) return
  const img = new Image()
  img.decoding = 'async'
  img.onload = () => {
    rocketImage = img
    rocketReady = true
  }
  img.onerror = () => {
    rocketFailed = true
    rocketReady = false
    console.warn(
      `[Porchini] Could not load rocket art at ${ROCKET_IMAGE_URL}. ` +
        'Keep the file at Art/Porcini base image.png and restart the dev server.',
    )
  }
  img.src = ROCKET_IMAGE_URL
}

export function getRocketImage(): HTMLImageElement | null {
  return rocketReady ? rocketImage : null
}
