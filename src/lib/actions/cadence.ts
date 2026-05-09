'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { FrequencyType } from '@/lib/types'

export interface CreateCadenceRuleInput {
  category_id:     string
  template_title:  string
  frequency_type:  FrequencyType
  frequency_value: number
  start_from?:     string   // ISO date string; defaults to today
}

// Compute the due_at for the first spawned task
function firstDueDate(
  frequencyType: FrequencyType,
  frequencyValue: number,
  startFrom: Date,
): Date {
  if (frequencyType === 'weekly_on_day') {
    const target = frequencyValue            // 0=Sun … 6=Sat
    const d = new Date(startFrom)
    d.setHours(23, 59, 59, 999)
    const diff = (target - d.getDay() + 7) % 7
    d.setDate(d.getDate() + (diff === 0 ? 7 : diff))
    return d
  }

  const windowMs = frequencyType === 'per_week'
    ? (7 / frequencyValue) * 24 * 60 * 60 * 1000
    : frequencyValue * 24 * 60 * 60 * 1000

  return new Date(startFrom.getTime() + windowMs)
}

export async function createCadenceRule(
  data: CreateCadenceRuleInput,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: rule, error: ruleError } = await supabase
    .from('cadence_rules')
    .insert({
      user_id:         user.id,
      category_id:     data.category_id,
      template_title:  data.template_title.trim(),
      frequency_type:  data.frequency_type,
      frequency_value: data.frequency_value,
      active:          true,
    })
    .select('id')
    .single()

  if (ruleError) return { error: ruleError.message }

  // Spawn the first task immediately
  const startFrom = data.start_from ? new Date(data.start_from) : new Date()
  const dueAt = firstDueDate(data.frequency_type, data.frequency_value, startFrom)

  await supabase.from('tasks').insert({
    user_id:         user.id,
    category_id:     data.category_id,
    title:           data.template_title.trim(),
    task_type:       'cadence',
    cadence_rule_id: rule.id,
    due_at:          dueAt.toISOString(),
    status:          'todo',
  })

  revalidatePath('/board')
  revalidatePath('/today')
  return {}
}

export async function toggleCadenceRuleActive(
  id: string,
  active: boolean,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('cadence_rules')
    .update({ active })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/board')
  return {}
}

export async function deleteCadenceRule(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('cadence_rules')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/board')
  return {}
}
