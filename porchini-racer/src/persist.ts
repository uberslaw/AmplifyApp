import type { CharacterId, DifficultyId, VehicleId } from './config'

const SETTINGS_KEY = 'porchini-settings-v1'
const SAVE_KEY = 'porchini-save-v1'
const SCORES_KEY = 'porchini-scores-v1'

export type Settings = {
  difficulty: DifficultyId
  character: CharacterId
  vehicle: VehicleId
}

export type SaveGame = {
  version: 1
  savedAt: number
  score: number
  distance: number
  misses: number
  spectrumCollected: number[]
  spectrumCycles: number
  spectrumSpeedBonus: number
  nyanGap: number
  settings: Settings
}

export type HighScore = {
  score: number
  distance: number
  spectra: number
  difficulty: DifficultyId
  character: CharacterId
  vehicle: VehicleId
  at: number
}

export const DEFAULT_SETTINGS: Settings = {
  difficulty: 'normal',
  character: 'pilot',
  vehicle: 'blaze',
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      difficulty: parsed.difficulty ?? 'normal',
      character: parsed.character ?? 'pilot',
      vehicle: parsed.vehicle ?? 'blaze',
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function loadSave(): SaveGame | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as SaveGame
    if (s.version !== 1) return null
    return s
  } catch {
    return null
  }
}

export function writeSave(save: SaveGame): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save))
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY)
}

export function hasSave(): boolean {
  return loadSave() !== null
}

export function loadHighScores(): HighScore[] {
  try {
    const raw = localStorage.getItem(SCORES_KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as HighScore[]
    return Array.isArray(list) ? list.sort((a, b) => b.score - a.score).slice(0, 10) : []
  } catch {
    return []
  }
}

export function submitHighScore(entry: HighScore): HighScore[] {
  const list = loadHighScores()
  list.push(entry)
  list.sort((a, b) => b.score - a.score)
  const top = list.slice(0, 10)
  localStorage.setItem(SCORES_KEY, JSON.stringify(top))
  return top
}
