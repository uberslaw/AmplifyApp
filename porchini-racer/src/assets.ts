/** Sprites loaded from the local Art folder (served by Vite). */
export const ROCKET_IMAGE_URL = '/Art/Porcini%20base%20image.png'
export const WING_IMAGE_URL = '/Art/Buffalo%20wing.png'

let rocketImage: HTMLImageElement | null = null
let rocketReady = false
let rocketFailed = false

let wingImage: HTMLImageElement | null = null
let wingReady = false
let wingFailed = false

function loadImage(
  url: string,
  onOk: (img: HTMLImageElement) => void,
  onFail: () => void,
  label: string,
): void {
  const img = new Image()
  img.decoding = 'async'
  img.onload = () => onOk(img)
  img.onerror = () => {
    onFail()
    console.warn(`[Porchini] Could not load ${label} at ${url}.`)
  }
  img.src = url
}

export function loadRocketImage(): void {
  if (rocketImage || rocketFailed) return
  loadImage(
    ROCKET_IMAGE_URL,
    (img) => {
      rocketImage = img
      rocketReady = true
    },
    () => {
      rocketFailed = true
      rocketReady = false
    },
    'rocket art',
  )
}

export function loadWingImage(): void {
  if (wingImage || wingFailed) return
  loadImage(
    WING_IMAGE_URL,
    (img) => {
      wingImage = img
      wingReady = true
    },
    () => {
      wingFailed = true
      wingReady = false
    },
    'buffalo wing art',
  )
}

/** Load all Art sprites used by gameplay. */
export function loadArtImages(): void {
  loadRocketImage()
  loadWingImage()
}

export function getRocketImage(): HTMLImageElement | null {
  return rocketReady ? rocketImage : null
}

export function getWingImage(): HTMLImageElement | null {
  return wingReady ? wingImage : null
}
