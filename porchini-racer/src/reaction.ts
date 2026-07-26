import type { Gate } from './gates'
import { SPECTRUM } from './spectrum'

export type GateOutcome = 'clear' | 'hit' | 'miss'

export type ReactionSample = {
  at: number
  outcome: GateOutcome
  /** Player Y − gate Y at crossing (px). Negative = above gate centre. */
  errorY: number
  /** |errorY| */
  absError: number
  shape: Gate['shape']
  motion: Gate['motion']
  rush: boolean
  color: number
  colorName: string
  /** Seconds from when gate entered the warning band (~40% of screen) to crossing. */
  approachSec: number | null
}

export type ReactionSummary = {
  samples: number
  clears: number
  hits: number
  misses: number
  meanAbsError: number
  meanClearError: number
  meanHitError: number
  worstAbsError: number
  byShape: Record<string, { n: number; hits: number; meanAbs: number }>
  byMotion: Record<string, { n: number; hits: number; meanAbs: number }>
  rushHits: number
  rushTotal: number
  meanApproachSec: number | null
  notes: string[]
}

/** Track approach timers + crossing outcomes for Lab reaction mode. */
export class ReactionTracker {
  samples: ReactionSample[] = []
  private approach = new Map<number, number>()

  reset(): void {
    this.samples = []
    this.approach.clear()
  }

  /** Call each frame while playing. */
  tick(dt: number, gates: Gate[], viewW: number): void {
    const warnX = viewW * 0.55
    for (const g of gates) {
      if (g.cleared || g.missed) {
        this.approach.delete(g.id)
        continue
      }
      if (g.x <= warnX) {
        const t = this.approach.get(g.id)
        this.approach.set(g.id, (t ?? 0) + dt)
      }
    }
  }

  record(
    outcome: GateOutcome,
    gate: Gate,
    playerY: number,
  ): void {
    const errorY = playerY - gate.y
    const approachSec = this.approach.get(gate.id) ?? null
    this.approach.delete(gate.id)
    this.samples.push({
      at: performance.now(),
      outcome,
      errorY,
      absError: Math.abs(errorY),
      shape: gate.shape,
      motion: gate.motion,
      rush: gate.rush,
      color: gate.color,
      colorName: SPECTRUM[gate.color % SPECTRUM.length]?.name ?? '?',
      approachSec,
    })
  }

  summarize(): ReactionSummary {
    const s = this.samples
    const clears = s.filter((x) => x.outcome === 'clear')
    const hits = s.filter((x) => x.outcome === 'hit')
    const misses = s.filter((x) => x.outcome === 'miss')
    const mean = (arr: ReactionSample[]) =>
      arr.length ? arr.reduce((a, b) => a + b.absError, 0) / arr.length : 0

    const byShape: ReactionSummary['byShape'] = {}
    const byMotion: ReactionSummary['byMotion'] = {}
    for (const x of s) {
      const sh = (byShape[x.shape] ??= { n: 0, hits: 0, meanAbs: 0 })
      sh.n += 1
      if (x.outcome === 'hit') sh.hits += 1
      sh.meanAbs += x.absError
      const mo = (byMotion[x.motion] ??= { n: 0, hits: 0, meanAbs: 0 })
      mo.n += 1
      if (x.outcome === 'hit') mo.hits += 1
      mo.meanAbs += x.absError
    }
    for (const k of Object.keys(byShape)) {
      const b = byShape[k]!
      b.meanAbs = b.n ? b.meanAbs / b.n : 0
    }
    for (const k of Object.keys(byMotion)) {
      const b = byMotion[k]!
      b.meanAbs = b.n ? b.meanAbs / b.n : 0
    }

    const rush = s.filter((x) => x.rush)
    const approaches = s.map((x) => x.approachSec).filter((t): t is number => t != null)
    const meanApproach = approaches.length
      ? approaches.reduce((a, b) => a + b, 0) / approaches.length
      : null

    const notes: string[] = []
    if (!s.length) notes.push('No gates crossed yet — play a bit longer.')
    const worstShape = Object.entries(byShape).sort(
      (a, b) => b[1].hits / Math.max(1, b[1].n) - a[1].hits / Math.max(1, a[1].n),
    )[0]
    if (worstShape && worstShape[1].hits > 0) {
      notes.push(
        `Most rim clips on ${worstShape[0]} gates (${worstShape[1].hits}/${worstShape[1].n}).`,
      )
    }
    if (hits.length && mean(hits) > mean(clears) * 1.4) {
      notes.push(`Hit errors average ${mean(hits).toFixed(0)}px — try larger gates or slower bounce.`)
    }
    if (rush.length && rush.filter((x) => x.outcome === 'hit').length / rush.length > 0.35) {
      notes.push('Fast gates are hurting — lower fast-gate speed or make them rarer.')
    }
    if (meanApproach != null && meanApproach < 0.45) {
      notes.push('Short approach time — increase spacing or slow scroll for more reaction window.')
    }

    return {
      samples: s.length,
      clears: clears.length,
      hits: hits.length,
      misses: misses.length,
      meanAbsError: mean(s),
      meanClearError: mean(clears),
      meanHitError: mean(hits),
      worstAbsError: s.reduce((m, x) => Math.max(m, x.absError), 0),
      byShape,
      byMotion,
      rushHits: rush.filter((x) => x.outcome === 'hit').length,
      rushTotal: rush.length,
      meanApproachSec: meanApproach,
      notes,
    }
  }

  formatSummaryHtml(): string {
    const u = this.summarize()
    if (!u.samples) return '<p class="lab-note">No samples yet.</p>'
    const shapeRows = Object.entries(u.byShape)
      .map(
        ([k, v]) =>
          `<tr><td>${k}</td><td>${v.hits}/${v.n}</td><td>${v.meanAbs.toFixed(0)}px</td></tr>`,
      )
      .join('')
    const motionRows = Object.entries(u.byMotion)
      .map(
        ([k, v]) =>
          `<tr><td>${k}</td><td>${v.hits}/${v.n}</td><td>${v.meanAbs.toFixed(0)}px</td></tr>`,
      )
      .join('')
    const notes = u.notes.map((n) => `<li>${n}</li>`).join('')
    return `
      <p><strong>${u.samples}</strong> crossings · clear ${u.clears} · rim ${u.hits} · skip ${u.misses}</p>
      <p>Mean |error|: <strong>${u.meanAbsError.toFixed(0)}px</strong>
        (clears ${u.meanClearError.toFixed(0)} · hits ${u.meanHitError.toFixed(0)} · worst ${u.worstAbsError.toFixed(0)})</p>
      <p>Fast gates: ${u.rushHits}/${u.rushTotal} rim clips
        ${u.meanApproachSec != null ? `· mean approach ${u.meanApproachSec.toFixed(2)}s` : ''}</p>
      <table class="lab-table"><thead><tr><th>Shape</th><th>Rim/n</th><th>Mean |err|</th></tr></thead>
      <tbody>${shapeRows || '<tr><td colspan="3">—</td></tr>'}</tbody></table>
      <table class="lab-table"><thead><tr><th>Motion</th><th>Rim/n</th><th>Mean |err|</th></tr></thead>
      <tbody>${motionRows || '<tr><td colspan="3">—</td></tr>'}</tbody></table>
      <ul class="lab-notes">${notes}</ul>
    `
  }
}
