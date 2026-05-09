'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function addChecklistItem(taskId: string, label: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Get current max sort_order
  const { data: existing } = await supabase
    .from('checklist_items')
    .select('sort_order')
    .eq('task_id', taskId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing?.[0]?.sort_order != null ? existing[0].sort_order + 1 : 0

  const { error } = await supabase.from('checklist_items').insert({
    task_id:    taskId,
    label:      label.trim(),
    sort_order: nextOrder,
  })

  if (error) return { error: error.message }
  revalidatePath('/board')
  return {}
}

export async function toggleChecklistItem(id: string, done: boolean): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('checklist_items')
    .update({ done })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/board')
  return {}
}

export async function deleteChecklistItem(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('checklist_items')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/board')
  return {}
}
