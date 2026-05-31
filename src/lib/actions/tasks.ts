'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { TaskStatus } from '@/lib/types'

export interface CreateTaskInput {
  category_id: string
  title: string
  description?: string
  task_type: 'deadline' | 'flexible' | 'cadence'
  scheduled_at?: string   // ISO string or undefined
  due_at?: string
  duration_minutes?: number
  checklist_items?: string[]  // labels to create
}

export async function createTask(data: CreateTaskInput): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      user_id:          user.id,
      category_id:      data.category_id,
      title:            data.title.trim(),
      description:      data.description?.trim() || null,
      task_type:        data.task_type,
      scheduled_at:     data.scheduled_at || null,
      due_at:           data.due_at || null,
      duration_minutes: data.duration_minutes || null,
      status:           'todo',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // Create checklist items if provided
  if (data.checklist_items?.length) {
    const items = data.checklist_items
      .filter(l => l.trim())
      .map((label, i) => ({ task_id: task.id, label: label.trim(), sort_order: i }))
    await supabase.from('checklist_items').insert(items)
  }

  revalidatePath('/board')
  return { id: task.id }
}

export async function updateTask(id: string, data: Partial<{
  title: string
  description: string | null
  category_id: string | null
  scheduled_at: string | null
  due_at: string | null
  duration_minutes: number | null
  status: TaskStatus
  manual_priority_pin: boolean
  completed_at: string | null
}>): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('tasks')
    .update(data)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/board')
  return {}
}

export async function markTaskDone(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Fetch cadence_rule_id before updating
  const { data: task } = await supabase
    .from('tasks')
    .select('cadence_rule_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  const completedAt = new Date().toISOString()

  const { error } = await supabase
    .from('tasks')
    .update({ status: 'done', completed_at: completedAt })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  // Propagate completion back to the cadence rule so the next window starts
  if (task?.cadence_rule_id) {
    await supabase
      .from('cadence_rules')
      .update({ last_completed_at: completedAt })
      .eq('id', task.cadence_rule_id)
      .eq('user_id', user.id)
  }

  revalidatePath('/board')
  revalidatePath('/today')
  return {}
}

export async function reopenTask(id: string): Promise<{ error?: string }> {
  return updateTask(id, {
    status:       'todo',
    completed_at: null,
  })
}

export async function reorderTasks(orderedIds: string[]): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const updates = orderedIds.map((id, index) =>
    supabase.from('tasks').update({ sort_order: index }).eq('id', id).eq('user_id', user.id)
  )
  const results = await Promise.all(updates)
  const failed = results.find(r => r.error)
  if (failed?.error) return { error: failed.error.message }

  revalidatePath('/board')
  return {}
}

export async function deleteTask(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/board')
  return {}
}
