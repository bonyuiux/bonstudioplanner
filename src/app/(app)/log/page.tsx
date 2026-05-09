import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogClient from './LogClient'
import type { Category, TaskWithRelations } from '@/lib/types'

export default async function LogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: tasks }, { data: categories }] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, category:categories(*), checklist_items(*)')
      .eq('status', 'done')
      .order('completed_at', { ascending: false }),
    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true }),
  ])

  return (
    <LogClient
      tasks={(tasks as TaskWithRelations[]) ?? []}
      categories={(categories as Category[]) ?? []}
    />
  )
}
