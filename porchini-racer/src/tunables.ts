/** Fine-grained gameplay knobs for Lab / testing mode. */

export type Tunables = {
  /** Invincible — meteors & miss limit never end the run. */
  godMode: boolean
  /** Record miss/clear offsets for reaction analysis. */
  reactionMode: boolean

  /** Vertical arrow/WASD max speed multiplier (1 = default). */
  moveSpeedY: number
  /** Horizontal arrow/WASD max speed multiplier. */
  moveSpeedX: number
  /** Steer responsiveness / “nimble” multiplier. */
  handling: number

  /** Normal gate opening size multiplier. */
  gateSize: number
  /** Gap between gates (higher = more space). */
  gateSpacing: number
  /** Gate density / frequency (higher = more gates; divides spacing). */
  gateFrequency: number

  /** Rush approach speed relative to scroll (1 = mild, 3 = fierce). */
  rushSpeedMult: number
  /** Every Nth gate rushes (0 = never, 1 = every gate). */
  rushEveryN: number
  /** Rush gate size vs normal. */
  rushSizeMult: number

  /** Chance a gate resizes (pulses) [0–1]. */
  resizeChance: number
  /** Resize oscillation speed. */
  resizeSpeed: number
  /** Min / max scale during resize. */
  resizeMin: number
  resizeMax: number

  /** Chance a gate bobs / bounces on Y [0–1]. */
  bounceChance: number
  /** Vertical bounce speed. */
  bounceSpeedY: number
  /** Extra horizontal drift speed for bounce gates (world units/sec). */
  bounceSpeedX: number
  /** Bounce Y range as fractions of view height (0–1). */
  bounceYMin: number
  bounceYMax: number

  /** Chance a gate is both resizing and bouncing [0–1]. */
  resizeBounceChance: number
}

export const DEFAULT_TUNABLES: Tunables = {
  godMode: false,
  reactionMode: false,
  moveSpeedY: 1,
  moveSpeedX: 1,
  handling: 1,
  gateSize: 1,
  gateSpacing: 1,
  gateFrequency: 1,
  rushSpeedMult: 2.4,
  rushEveryN: 0,
  rushSizeMult: 1,
  resizeChance: 0,
  resizeSpeed: 1.4,
  resizeMin: 0.7,
  resizeMax: 1.15,
  bounceChance: 0,
  bounceSpeedY: 2.2,
  bounceSpeedX: 0,
  bounceYMin: 0.22,
  bounceYMax: 0.78,
  resizeBounceChance: 0,
}

export type TunableField =
  | {
      key: keyof Tunables
      kind: 'toggle'
      label: string
      group: string
      hint?: string
    }
  | {
      key: keyof Tunables
      kind: 'range'
      label: string
      group: string
      min: number
      max: number
      step: number
      hint?: string
    }

export const TUNABLE_FIELDS: TunableField[] = [
  {
    key: 'godMode',
    kind: 'toggle',
    group: 'Lab',
    label: 'God mode (can’t die)',
    hint: 'Meteors and miss limit ignored',
  },
  {
    key: 'reactionMode',
    kind: 'toggle',
    group: 'Lab',
    label: 'Reaction time mode',
    hint: 'Logs how far you miss each gate',
  },

  { key: 'moveSpeedY', kind: 'range', group: 'Rocket', label: 'Up / down speed', min: 0.4, max: 2.5, step: 0.05 },
  { key: 'moveSpeedX', kind: 'range', group: 'Rocket', label: 'Forward / back speed', min: 0.4, max: 2.5, step: 0.05 },
  { key: 'handling', kind: 'range', group: 'Rocket', label: 'Nimbleness (response)', min: 0.4, max: 2.5, step: 0.05 },

  { key: 'gateSize', kind: 'range', group: 'Gates', label: 'Gate size', min: 0.5, max: 2.5, step: 0.05 },
  { key: 'gateSpacing', kind: 'range', group: 'Gates', label: 'Gate spacing', min: 0.4, max: 3, step: 0.05 },
  { key: 'gateFrequency', kind: 'range', group: 'Gates', label: 'Gate frequency', min: 0.4, max: 2.5, step: 0.05, hint: 'Higher = denser' },

  { key: 'rushEveryN', kind: 'range', group: 'Fast gates', label: 'Fast gate every Nth (0=off)', min: 0, max: 12, step: 1 },
  { key: 'rushSpeedMult', kind: 'range', group: 'Fast gates', label: 'Fast gate speed (vs scroll)', min: 0.5, max: 5, step: 0.1 },
  { key: 'rushSizeMult', kind: 'range', group: 'Fast gates', label: 'Fast gate size', min: 0.5, max: 2, step: 0.05 },

  { key: 'resizeChance', kind: 'range', group: 'Resizing', label: 'Resize chance', min: 0, max: 1, step: 0.05 },
  { key: 'resizeSpeed', kind: 'range', group: 'Resizing', label: 'Resize speed', min: 0.3, max: 4, step: 0.1 },
  { key: 'resizeMin', kind: 'range', group: 'Resizing', label: 'Resize min scale', min: 0.4, max: 1, step: 0.05 },
  { key: 'resizeMax', kind: 'range', group: 'Resizing', label: 'Resize max scale', min: 1, max: 1.8, step: 0.05 },

  { key: 'bounceChance', kind: 'range', group: 'Bouncy', label: 'Bounce chance', min: 0, max: 1, step: 0.05 },
  { key: 'bounceSpeedY', kind: 'range', group: 'Bouncy', label: 'Bounce Y speed', min: 0.3, max: 5, step: 0.1 },
  { key: 'bounceSpeedX', kind: 'range', group: 'Bouncy', label: 'Bounce X drift', min: 0, max: 220, step: 5 },
  { key: 'bounceYMin', kind: 'range', group: 'Bouncy', label: 'Bounce Y start (screen %)', min: 0.05, max: 0.7, step: 0.01 },
  { key: 'bounceYMax', kind: 'range', group: 'Bouncy', label: 'Bounce Y end (screen %)', min: 0.3, max: 0.95, step: 0.01 },

  {
    key: 'resizeBounceChance',
    kind: 'range',
    group: 'Resize + bounce',
    label: 'Resizing+bouncy chance',
    min: 0,
    max: 1,
    step: 0.05,
  },
]

export function mergeTunables(partial?: Partial<Tunables> | null): Tunables {
  return { ...DEFAULT_TUNABLES, ...(partial ?? {}) }
}

export function clampTunable(key: keyof Tunables, value: number | boolean): number | boolean {
  const field = TUNABLE_FIELDS.find((f) => f.key === key)
  if (!field) return value
  if (field.kind === 'toggle') return Boolean(value)
  const n = Number(value)
  if (!Number.isFinite(n)) return DEFAULT_TUNABLES[key] as number
  const stepped = Math.round(n / field.step) * field.step
  return Math.min(field.max, Math.max(field.min, stepped))
}
