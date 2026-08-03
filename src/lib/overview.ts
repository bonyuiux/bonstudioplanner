import type { Area, Category, Phase, PhaseWithMilestones } from './types'

export interface Completion {
  category_id: string | null
  completed_at: string
}

export interface AreaSignals {
  /** Whole days since the most recent completion in this area. Null = never. */
  lastActivityDays: number | null
  /** This area's share of the last 30 days of completions, 0-100. */
  sharePct: number
}

const DAY = 24 * 60 * 60 * 1000

/** ISO timestamp N days ago. Lives here so the impure clock read stays out of
 *  component bodies (react-hooks/purity flags Date.now() inside them). */
export function sinceISO(days: number): string {
  return new Date(Date.now() - days * DAY).toISOString()
}

/**
 * Everything on the Overview page except the phase text itself is derived here,
 * at read time, from tables that already exist. Nothing is stored.
 */
export function computeSignals(
  areas: Area[],
  categories: Category[],
  completions: Completion[],
  now: Date = new Date(),
): Record<string, AreaSignals> {
  const areaOf = new Map<string, string>()
  for (const c of categories) if (c.area_id) areaOf.set(c.id, c.area_id)

  const windowStart = now.getTime() - 30 * DAY
  const latest = new Map<string, number>()
  const recent = new Map<string, number>()
  let recentTotal = 0

  for (const c of completions) {
    if (!c.category_id) continue
    const areaId = areaOf.get(c.category_id)
    if (!areaId) continue

    const t = new Date(c.completed_at).getTime()
    if (Number.isNaN(t)) continue

    if (t > (latest.get(areaId) ?? 0)) latest.set(areaId, t)
    if (t >= windowStart) {
      recent.set(areaId, (recent.get(areaId) ?? 0) + 1)
      recentTotal++
    }
  }

  const out: Record<string, AreaSignals> = {}
  for (const a of areas) {
    const last = latest.get(a.id)
    out[a.id] = {
      lastActivityDays: last == null
        ? null
        : Math.floor((now.getTime() - last) / DAY),
      sharePct: recentTotal === 0
        ? 0
        : Math.round(((recent.get(a.id) ?? 0) / recentTotal) * 100),
    }
  }
  return out
}

export function formatSignals(s: AreaSignals | undefined): string {
  if (!s) return 'No activity yet'
  const d = s.lastActivityDays
  const when =
    d == null ? 'No activity yet'
    : d === 0  ? 'Last activity today'
    : d === 1  ? 'Last activity yesterday'
    :            `Last activity ${d} days ago`
  return `${when} · ${s.sharePct}% of your month`
}

/** Starred areas first, newest star on top; the rest keep manual sort_order. */
export function orderAreas<T extends Area>(areas: T[]): T[] {
  const starred = areas
    .filter(a => a.starred_at)
    .sort((x, y) => new Date(y.starred_at!).getTime() - new Date(x.starred_at!).getTime())
  const rest = areas
    .filter(a => !a.starred_at)
    .sort((x, y) => x.sort_order - y.sort_order)
  return [...starred, ...rest]
}

export const currentPhase = (phases: PhaseWithMilestones[]) =>
  phases.find(p => p.ended_at === null) ?? null

export const pastPhases = (phases: PhaseWithMilestones[]) =>
  phases
    .filter(p => p.ended_at !== null)
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())

export function phaseRange(p: Phase): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  return `${fmt(p.started_at)} — ${p.ended_at ? fmt(p.ended_at) : 'now'}`
}
