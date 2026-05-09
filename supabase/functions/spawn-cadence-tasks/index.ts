/**
 * BonPlanner — spawn-cadence-tasks Edge Function
 *
 * Schedule: run hourly via Supabase Dashboard →
 *   Edge Functions → spawn-cadence-tasks → Schedule → "0 * * * *"
 *
 * Or invoke manually:
 *   supabase functions invoke spawn-cadence-tasks --no-verify-jwt
 *
 * Deploy:
 *   supabase functions deploy spawn-cadence-tasks
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MS_DAY  = 86_400_000
const MS_WEEK = 7 * MS_DAY

type FrequencyType = 'per_week' | 'every_n_days' | 'weekly_on_day'

interface CadenceRule {
  id:                string
  user_id:           string
  category_id:       string
  template_title:    string
  frequency_type:    FrequencyType
  frequency_value:   number
  last_completed_at: string | null
  active:            boolean
}

function windowMs(rule: CadenceRule): number {
  switch (rule.frequency_type) {
    case 'per_week':      return MS_WEEK / rule.frequency_value
    case 'every_n_days':  return rule.frequency_value * MS_DAY
    case 'weekly_on_day': return MS_WEEK
  }
}

function nextDueDate(rule: CadenceRule, now: Date): Date {
  if (rule.frequency_type === 'weekly_on_day') {
    const target = rule.frequency_value   // 0=Sun … 6=Sat
    const d = new Date(now)
    d.setHours(23, 59, 59, 999)
    const diff = (target - d.getDay() + 7) % 7
    d.setDate(d.getDate() + (diff === 0 ? 7 : diff))
    return d
  }

  const win  = windowMs(rule)
  const base = rule.last_completed_at
    ? new Date(rule.last_completed_at)
    : new Date(now.getTime() - win)   // treat as if completed exactly one window ago

  return new Date(base.getTime() + win)
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const now = new Date()
  const spawned: string[] = []
  const errors: string[]  = []

  // Fetch all active cadence rules
  const { data: rules, error: rulesError } = await supabase
    .from('cadence_rules')
    .select('*')
    .eq('active', true)

  if (rulesError) {
    return new Response(JSON.stringify({ error: rulesError.message }), { status: 500 })
  }

  for (const rule of (rules as CadenceRule[]) ?? []) {
    try {
      // Skip if an active task already exists for this rule
      const { count } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('cadence_rule_id', rule.id)
        .in('status', ['todo', 'in_progress'])

      if ((count ?? 0) > 0) continue

      // Compute next due date
      const dueAt = nextDueDate(rule, now)

      // Spawn if due within the next 24 hours (or already overdue)
      const msUntilDue = dueAt.getTime() - now.getTime()
      if (msUntilDue > MS_DAY) continue

      const { error: insertError } = await supabase.from('tasks').insert({
        user_id:         rule.user_id,
        category_id:     rule.category_id,
        title:           rule.template_title,
        task_type:       'cadence',
        cadence_rule_id: rule.id,
        due_at:          dueAt.toISOString(),
        status:          'todo',
      })

      if (insertError) {
        errors.push(`rule ${rule.id}: ${insertError.message}`)
      } else {
        spawned.push(rule.template_title)
      }
    } catch (err) {
      errors.push(`rule ${rule.id}: ${String(err)}`)
    }
  }

  return new Response(
    JSON.stringify({ ok: true, spawned, errors, at: now.toISOString() }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
