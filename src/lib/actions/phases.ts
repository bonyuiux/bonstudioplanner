'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function auth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

const touch = () => revalidatePath('/overview')

/** Opens a phase. Fails if the area already has an open one (unique index). */
export async function startPhase(areaId: string, title: string, carried: string[] = []) {
  const { supabase, user } = await auth()
  if (!user) return { error: 'Unauthorized' }

  const { data: phase, error } = await supabase
    .from('phases')
    .insert({ user_id: user.id, area_id: areaId, title: title.trim() })
    .select('id').single()

  if (error) return { error: error.message }

  if (carried.length && phase) {
    const { error: mErr } = await supabase.from('phase_milestones').insert(
      carried.map((label, i) => ({ phase_id: phase.id, label, done: false, sort_order: i }))
    )
    if (mErr) return { error: mErr.message }
  }

  touch()
  return {}
}

/**
 * Closes the current phase and opens the next one in a single user action.
 *
 * `drop` holds the ids of unfinished milestones the user chose to abandon —
 * those are deleted so the closed phase reads honestly as what was actually
 * cleared. Everything else on the closed phase is frozen from here on.
 */
export async function closeAndStartNext(
  phaseId: string,
  areaId: string,
  nextTitle: string,
  carriedLabels: string[],
  dropIds: string[],
) {
  const { supabase, user } = await auth()
  if (!user) return { error: 'Unauthorized' }

  if (dropIds.length) {
    const { error } = await supabase.from('phase_milestones').delete().in('id', dropIds)
    if (error) return { error: error.message }
  }

  const { error: closeErr } = await supabase
    .from('phases')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', phaseId).eq('user_id', user.id)
  if (closeErr) return { error: closeErr.message }

  return startPhase(areaId, nextTitle, carriedLabels)
}

export async function renamePhase(phaseId: string, title: string) {
  const { supabase, user } = await auth()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('phases').update({ title: title.trim() })
    .eq('id', phaseId).eq('user_id', user.id)

  if (error) return { error: error.message }
  touch()
  return {}
}

export async function toggleMilestone(id: string, done: boolean) {
  const { supabase, user } = await auth()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('phase_milestones').update({ done }).eq('id', id)
  if (error) return { error: error.message }
  touch()
  return {}
}

/**
 * Replaces a phase's milestone list wholesale — the edit sheet hands back the
 * full desired state, so we diff against what exists rather than making the
 * client issue one call per row.
 */
export async function saveMilestones(
  phaseId: string,
  items: { id?: string; label: string; done: boolean }[],
) {
  const { supabase, user } = await auth()
  if (!user) return { error: 'Unauthorized' }

  const { data: existing, error: readErr } = await supabase
    .from('phase_milestones').select('id').eq('phase_id', phaseId)
  if (readErr) return { error: readErr.message }

  const keep = new Set(items.map(i => i.id).filter(Boolean) as string[])
  const remove = (existing ?? []).map(r => r.id).filter(id => !keep.has(id))

  if (remove.length) {
    const { error } = await supabase.from('phase_milestones').delete().in('id', remove)
    if (error) return { error: error.message }
  }

  const updates = items
    .filter(i => i.id)
    .map((i, idx) => supabase.from('phase_milestones')
      .update({ label: i.label.trim(), done: i.done, sort_order: idx })
      .eq('id', i.id!))

  const inserts = items
    .map((i, idx) => ({ i, idx }))
    .filter(({ i }) => !i.id)
    .map(({ i, idx }) => ({
      phase_id: phaseId, label: i.label.trim(), done: i.done, sort_order: idx,
    }))

  const results = await Promise.all(updates)
  const failed = results.find(r => r.error)
  if (failed?.error) return { error: failed.error.message }

  if (inserts.length) {
    const { error } = await supabase.from('phase_milestones').insert(inserts)
    if (error) return { error: error.message }
  }

  touch()
  return {}
}

/**
 * Removes a phase and its milestones. Used for the "wrong name, start over"
 * case — closing a phase is what you want for a phase you actually finished.
 */
export async function deletePhase(phaseId: string) {
  const { supabase, user } = await auth()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('phases').delete().eq('id', phaseId).eq('user_id', user.id)

  if (error) return { error: error.message }
  touch()
  return {}
}
