import type { Task, CadenceRule, UrgencyTier } from './types'

const MS = {
  min: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
}

function isToday(date: Date, now: Date): boolean {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function cadenceWindowMs(rule: CadenceRule): number {
  switch (rule.frequency_type) {
    case 'per_week':      return (7 / rule.frequency_value) * MS.day
    case 'every_n_days':  return rule.frequency_value * MS.day
    case 'weekly_on_day': return 7 * MS.day
  }
}

function cadenceDeadline(rule: CadenceRule, now: Date): Date {
  if (rule.frequency_type === 'weekly_on_day') {
    // Next occurrence of this weekday (0=Sun)
    const target = rule.frequency_value
    const d = new Date(now)
    d.setHours(23, 59, 59, 999)
    const diff = (target - d.getDay() + 7) % 7
    d.setDate(d.getDate() + (diff === 0 ? 7 : diff))
    return d
  }
  const base = rule.last_completed_at ? new Date(rule.last_completed_at) : new Date(now.getTime() - cadenceWindowMs(rule))
  return new Date(base.getTime() + cadenceWindowMs(rule))
}

export function computeUrgency(task: Task, now: Date, cadenceRule?: CadenceRule): UrgencyTier {
  // Manual pin always urgent
  if (task.manual_priority_pin) return 'urgent'

  // Cadence tasks
  if (task.task_type === 'cadence' && cadenceRule) {
    const deadline = cadenceDeadline(cadenceRule, now)
    const msUntil = deadline.getTime() - now.getTime()
    if (msUntil <= 0) return 'urgent'                     // past limit
    if (msUntil <= MS.day) return 'soon'                  // within 24h of limit
    return 'cadence'                                       // on schedule
  }
  if (task.task_type === 'cadence') return 'cadence'

  // Scheduled_at tasks
  if (task.scheduled_at) {
    const d = new Date(task.scheduled_at)
    if (isToday(d, now)) return 'urgent'
    const msUntil = d.getTime() - now.getTime()
    if (msUntil <= 3 * MS.day) return 'soon'
    return 'scheduled'
  }

  // Due_at tasks
  if (task.due_at) {
    const d = new Date(task.due_at)
    const msUntil = d.getTime() - now.getTime()
    if (msUntil <= MS.day) return 'urgent'
    if (msUntil <= 3 * MS.day) return 'soon'
    return 'scheduled'
  }

  return 'flexible'
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export const URGENCY_COLOR: Record<UrgencyTier, string> = {
  urgent:    '#BC3B3B',
  soon:      '#DB7442',
  cadence:   '#F1C76D',
  scheduled: '#614E3A',
  flexible:  'rgba(154,148,144,0.4)',
}

export const URGENCY_LABEL: Record<UrgencyTier, string> = {
  urgent:    'URGENT',
  soon:      'SOON',
  cadence:   'CADENCE',
  scheduled: 'SCHEDULED',
  flexible:  'FLEXIBLE',
}

export const URGENCY_CARD_BORDER: Record<UrgencyTier, string> = {
  urgent:    'rgba(188,59,59,0.5)',
  soon:      'rgba(219,116,66,0.4)',
  cadence:   'rgba(241,199,109,0.35)',
  scheduled: 'rgba(97,78,58,0.5)',
  flexible:  'rgba(245,243,240,0.12)',
}

export function formatCountdown(task: Task, now: Date): string {
  const ref = task.scheduled_at
    ? new Date(task.scheduled_at)
    : task.due_at
    ? new Date(task.due_at)
    : null

  if (!ref) return ''

  const diff = ref.getTime() - now.getTime()

  if (diff < 0) {
    const abs = Math.abs(diff)
    if (abs < MS.hour) return `${Math.floor(abs / MS.min)}m ago`
    if (abs < MS.day)  return `${Math.floor(abs / MS.hour)}h ago`
    return `${Math.floor(abs / MS.day)}d ago`
  }

  if (diff < MS.hour) {
    return `in ${Math.floor(diff / MS.min)}m`
  }
  if (diff < MS.day) {
    const h = Math.floor(diff / MS.hour)
    const m = Math.floor((diff % MS.hour) / MS.min)
    return m > 0 ? `in ${h}h ${m}m` : `in ${h}h`
  }
  const days = Math.floor(diff / MS.day)
  return `in ${days}d`
}

export function formatDate(dateStr: string | null, includeTime = false): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month:   'short',
    day:     'numeric',
    ...(includeTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  }
  return d.toLocaleDateString('en-US', opts)
}

export const DURATION_LABELS: Record<number, string> = {
  30:  '30 min',
  60:  '1 hr',
  120: '2 hr',
  240: 'Half day',
  480: 'Full day',
}
