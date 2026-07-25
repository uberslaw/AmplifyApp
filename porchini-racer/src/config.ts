export type DifficultyId = 'easy' | 'normal' | 'hard'

export type Difficulty = {
  id: DifficultyId
  name: string
  description: string
  maxMisses: number
  meteorRate: number
  gateGapScale: number
  /** Multiplier on gate opening size (1.5 = 50% larger — level 1 default). */
  gateSizeScale: number
  nyanCruise: number
  spectraToCatch: number
  scoreMult: number
}

export const DIFFICULTIES: Difficulty[] = [
  {
    id: 'easy',
    name: 'Easy',
    description: 'Huge gates, wide spacing, fewer meteors, 4 misses.',
    maxMisses: 4,
    meteorRate: 0.55,
    gateGapScale: 1.2,
    gateSizeScale: 1.55,
    nyanCruise: 280,
    spectraToCatch: 2,
    scoreMult: 0.85,
  },
  {
    id: 'normal',
    name: 'Normal',
    description: 'Level-1 sizing: large gates, triple spacing. 3 misses.',
    maxMisses: 3,
    meteorRate: 0.85,
    gateGapScale: 1,
    gateSizeScale: 1.5,
    nyanCruise: 305,
    spectraToCatch: 3,
    scoreMult: 1,
  },
  {
    id: 'hard',
    name: 'Hard',
    description: 'Tighter later — still roomy openings. 2 misses.',
    maxMisses: 2,
    meteorRate: 1.25,
    gateGapScale: 0.92,
    gateSizeScale: 1.25,
    nyanCruise: 330,
    spectraToCatch: 4,
    scoreMult: 1.35,
  },
]

export type CharacterId = 'pilot' | 'cosmic' | 'spore'

export type Character = {
  id: CharacterId
  name: string
  description: string
  suit: string
  skin: string
  hat: string
}

export const CHARACTERS: Character[] = [
  {
    id: 'pilot',
    name: 'Pilot Pip',
    description: 'Classic rider. Balanced look.',
    suit: '#2a1830',
    skin: '#e8b090',
    hat: '#3dce6a',
  },
  {
    id: 'cosmic',
    name: 'Cosmic Nova',
    description: 'Starlight suit. Looks great with rainbow trails.',
    suit: '#1a2a6c',
    skin: '#f0d0c0',
    hat: '#ffd84a',
  },
  {
    id: 'spore',
    name: 'Spore Scout',
    description: 'Forest mycelium explorer.',
    suit: '#1e3a24',
    skin: '#c8a078',
    hat: '#e048c7',
  },
]

export type VehicleId = 'blaze' | 'comet' | 'tank' | 'dart'

export type Vehicle = {
  id: VehicleId
  name: string
  description: string
  /** Base scroll speed bonus. */
  speed: number
  /** Vertical steer responsiveness multiplier. */
  handling: number
  /** Hitbox radius scale (lower = easier clears). */
  hitbox: number
  /** Flame / trail intensity. */
  thrust: number
  /** Cap colour. */
  cap: string
  stem: string
  spots: string
}

/** Rocket / mushroom vehicles with different flight characteristics. */
export const VEHICLES: Vehicle[] = [
  {
    id: 'blaze',
    name: 'Blaze Cap',
    description: 'Starter rocket-mushroom. Balanced speed and handling.',
    speed: 0,
    handling: 1,
    hitbox: 1,
    thrust: 1,
    cap: '#e03420',
    stem: '#f3e2c0',
    spots: '#fff4e0',
  },
  {
    id: 'comet',
    name: 'Comet Cap',
    description: 'Fast cruise, snappy steering. Slightly bigger hitbox.',
    speed: 40,
    handling: 1.25,
    hitbox: 1.08,
    thrust: 1.35,
    cap: '#3aa0ff',
    stem: '#e8f0ff',
    spots: '#ffe08a',
  },
  {
    id: 'tank',
    name: 'Bunker Cap',
    description: 'Heavy hull — smaller effective hitbox, slower.',
    speed: -25,
    handling: 0.75,
    hitbox: 0.82,
    thrust: 0.85,
    cap: '#6a5a48',
    stem: '#d4c4a8',
    spots: '#c0a878',
  },
  {
    id: 'dart',
    name: 'Spore Dart',
    description: 'Glass cannon: max speed, twitchy, unforgiving hitbox.',
    speed: 70,
    handling: 1.45,
    hitbox: 1.18,
    thrust: 1.6,
    cap: '#7b5cff',
    stem: '#f0e8ff',
    spots: '#ff8a1f',
  },
]

export function difficultyById(id: DifficultyId): Difficulty {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[1]!
}

export function characterById(id: CharacterId): Character {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0]!
}

export function vehicleById(id: VehicleId): Vehicle {
  return VEHICLES.find((v) => v.id === id) ?? VEHICLES[0]!
}
