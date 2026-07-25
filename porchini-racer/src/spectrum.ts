/** Main rainbow colours — each gate is exactly one of these. */
export const SPECTRUM = [
  { id: 'R', name: 'Red', hex: '#ff3b3b' },
  { id: 'O', name: 'Orange', hex: '#ff8a1f' },
  { id: 'Y', name: 'Yellow', hex: '#ffd84a' },
  { id: 'G', name: 'Green', hex: '#3dce6a' },
  { id: 'B', name: 'Blue', hex: '#3aa0ff' },
  { id: 'I', name: 'Indigo', hex: '#7b5cff' },
  { id: 'V', name: 'Violet', hex: '#e048c7' },
] as const

export type SpectrumIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

export const SPECTRUM_COUNT = SPECTRUM.length

export class SpectrumTracker {
  /** Colours collected in the current incomplete cycle. */
  collected = new Set<number>()
  /** Completed full ROYGBIV cycles this run. */
  cycles = 0
  /** Cumulative speed from full spectra. */
  speedBonus = 0
  announce = 0
  announceText = ''

  reset(): void {
    this.collected.clear()
    this.cycles = 0
    this.speedBonus = 0
    this.announce = 0
    this.announceText = ''
  }

  has(color: number): boolean {
    return this.collected.has(color)
  }

  /** Register a cleared gate colour. Returns true if a full spectrum just completed. */
  collect(color: number): { isNew: boolean; fullSpectrum: boolean } {
    const isNew = !this.collected.has(color)
    if (isNew) this.collected.add(color)

    if (this.collected.size >= SPECTRUM_COUNT) {
      this.collected.clear()
      this.cycles += 1
      this.speedBonus += 55
      this.announce = 1.8
      this.announceText = `FULL SPECTRUM ×${this.cycles}!`
      return { isNew, fullSpectrum: true }
    }
    return { isNew, fullSpectrum: false }
  }

  tick(dt: number): void {
    this.announce = Math.max(0, this.announce - dt)
  }

  get banner(): string | null {
    return this.announce > 0 ? this.announceText : null
  }
}

export function shade(hex: string, amount: number): string {
  const n = hex.replace('#', '')
  const r = Math.min(255, Math.max(0, parseInt(n.slice(0, 2), 16) + amount))
  const g = Math.min(255, Math.max(0, parseInt(n.slice(2, 4), 16) + amount))
  const b = Math.min(255, Math.max(0, parseInt(n.slice(4, 6), 16) + amount))
  return `rgb(${r},${g},${b})`
}
