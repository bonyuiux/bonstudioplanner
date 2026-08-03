'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_AREA_COLOR } from '@/lib/areaColors'

async function auth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

function touch() {
  revalidatePath('/overview')
  revalidatePath('/board')
}

export async function createArea(data: {
  name: string
  color?: string
  sort_order?: number
}): Promise<{ error?: string }> {
  const { supabase, user } = await auth()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('areas').insert({
    user_id: user.id,
    name: data.name.trim(),
    color: data.color ?? DEFAULT_AREA_COLOR,
    sort_order: data.sort_order ?? 0,
  })

  if (error) return { error: error.message }
  touch()
  return {}
}

export async function updateArea(id: string, data: {
  name?: string
  color?: string
  sort_order?: number
}): Promise<{ error?: string }> {
  const { supabase, user } = await auth()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('areas').update(data).eq('id', id).eq('user_id', user.id)

  if (error) return { error: error.message }
  touch()
  return {}
}

/**
 * Starring stamps the moment, because the Overview sorts starred areas by
 * most-recently-starred. Unstarring clears it, dropping the area back into
 * the manually ordered group.
 */
export async function toggleAreaStar(id: string, starred: boolean): Promise<{ error?: string }> {
  const { supabase, user } = await auth()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('areas')
    .update({ starred_at: starred ? new Date().toISOString() : null })
    .eq('id', id).eq('user_id', user.id)

  if (error) return { error: error.message }
  touch()
  return {}
}

/** Swap two starred areas by exchanging their star timestamps. */
export async function swapStarOrder(aId: string, bId: string): Promise<{ error?: string }> {
  const { supabase, user } = await auth()
  if (!user) return { error: 'Unauthorized' }

  const { data, error: readErr } = await supabase
    .from('areas').select('id, starred_at').in('id', [aId, bId]).eq('user_id', user.id)
  if (readErr) return { error: readErr.message }
  if (!data || data.length !== 2) return { error: 'Areas not found' }

  const a = data.find(x => x.id === aId)!
  const b = data.find(x => x.id === bId)!

  const results = await Promise.all([
    supabase.from('areas').update({ starred_at: b.starred_at }).eq('id', aId).eq('user_id', user.id),
    supabase.from('areas').update({ starred_at: a.starred_at }).eq('id', bId).eq('user_id', user.id),
  ])
  const failed = results.find(r => r.error)
  if (failed?.error) return { error: failed.error.message }

  touch()
  return {}
}

/** Full ordered array of unstarred area IDs → writes sort_order. */
export async function reorderAreas(orderedIds: string[]): Promise<{ error?: string }> {
  const { supabase, user } = await auth()
  if (!user) return { error: 'Unauthorized' }

  const results = await Promise.all(orderedIds.map((id, i) =>
    supabase.from('areas').update({ sort_order: i }).eq('id', id).eq('user_id', user.id)
  ))
  const failed = results.find(r => r.error)
  if (failed?.error) return { error: failed.error.message }

  touch()
  return {}
}

/**
 * Deleting an area sets area_id back to NULL on its categories (ON DELETE SET
 * NULL) and cascades its phases. Tasks are never touched.
 */
export async function deleteArea(id: string): Promise<{ error?: string }> {
  const { supabase, user } = await auth()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('areas').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  touch()
  return {}
}

/** Assign a category (project) to an area, or pass null to unassign it. */
export async function assignCategoryToArea(
  categoryId: string,
  areaId: string | null,
): Promise<{ error?: string }> {
  const { supabase, user } = await auth()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('categories').update({ area_id: areaId })
    .eq('id', categoryId).eq('user_id', user.id)

  if (error) return { error: error.message }
  touch()
  return {}
}
