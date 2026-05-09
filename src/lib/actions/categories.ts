'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createCategory(data: {
  name: string
  subtitle?: string
  sort_order?: number
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('categories').insert({
    user_id: user.id,
    name: data.name.trim(),
    subtitle: data.subtitle?.trim() || null,
    sort_order: data.sort_order ?? 0,
  })

  if (error) return { error: error.message }
  revalidatePath('/board')
  return {}
}

export async function updateCategory(id: string, data: {
  name?: string
  subtitle?: string | null
  sort_order?: number
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('categories')
    .update(data)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/board')
  return {}
}

export async function deleteCategory(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/board')
  return {}
}
